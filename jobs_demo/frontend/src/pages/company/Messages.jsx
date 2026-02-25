import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  FiDownload,
  FiFileText,
  FiFlag,
  FiMoreHorizontal,
  FiPaperclip,
  FiSearch,
  FiSend,
  FiSmile,
  FiVideo,
} from "react-icons/fi";
import Modal from "../../components/common/Modal.jsx";
import Loader from "../../components/common/Loader.jsx";
import Toast from "../../components/common/Toast.jsx";
import {
  getCompanyThread,
  listCompanyThreads,
  markCompanyThreadRead,
  reportCompanyThreadSpam,
  sendCompanyMessage,
  updateCompanyThreadMeta,
} from "../../services/messagesService.js";
import { updateApplicationStatus, sendOffer as apiSendOffer } from "../../services/companyService.js";
import { createCompanyInterview } from "../../services/interviewsService.js";

const statusCls = {
  Shortlisted: "border-green-200 bg-green-50 text-green-700",
  "Interview Scheduled": "border-blue-200 bg-blue-50 text-[#2563EB]",
  "Offer Sent": "border-orange-200 bg-orange-50 text-[#F97316]",
  Rejected: "border-red-200 bg-red-50 text-red-600",
  Applied: "border-slate-200 bg-slate-50 text-slate-700",
  Hold: "border-amber-200 bg-amber-50 text-amber-700",
  Unknown: "border-slate-200 bg-slate-100 text-slate-600",
};

function initials(name = "") {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((x) => x[0])
    .join("")
    .toUpperCase();
}

function timeLabel(dateValue) {
  if (!dateValue) return "";
  const d = new Date(dateValue);
  const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Now";
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  if (days === 1) return "Yesterday";
  return `${days}d`;
}

function msgAtLabel(dateValue) {
  if (!dateValue) return "";
  const d = new Date(dateValue);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

const urlRegex = /(https?:\/\/[^\s]+)/g;
const meetRegex = /https?:\/\/meet\.google\.com\/[^\s]+/i;

function renderTextWithLinks(text = "") {
  const parts = String(text).split(urlRegex);
  return parts.map((part, idx) => {
    if (/^https?:\/\//.test(part)) {
      return (
        <a key={`${part}_${idx}`} href={part} target="_blank" rel="noreferrer" className="underline underline-offset-2">
          {part}
        </a>
      );
    }
    return <span key={`${idx}_${part}`}>{part}</span>;
  });
}

function extractMeetLink(text = "") {
  const match = String(text).match(meetRegex);
  return match ? match[0] : "";
}

export default function Messages() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const threadFromUrl = searchParams.get("thread");

  const [rows, setRows] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [active, setActive] = useState(null);
  const [loadingList, setLoadingList] = useState(false);
  const [loadingThread, setLoadingThread] = useState(false);
  const [err, setErr] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [text, setText] = useState("");
  const [mobileListOpen, setMobileListOpen] = useState(true);
  const [toast, setToast] = useState({ show: false, message: "", tone: "dark" });
  const [actionBusy, setActionBusy] = useState(false);
  const [spam, setSpam] = useState({ open: false, reason: "Abusive Language", details: "", busy: false });

  const [offer, setOffer] = useState({
    open: false,
    salary: "",
    joining: "",
    expiry: "",
    message: "",
    file: "",
  });
  const [schedule, setSchedule] = useState({
    open: false,
    date: "",
    time: "",
    mode: "Online",
    link: "",
    message: "",
  });

  const ping = (message, tone = "dark") => setToast({ show: true, message, tone });

  useEffect(() => {
    if (threadFromUrl) {
      setActiveId(threadFromUrl);
      setMobileListOpen(false);
    }
  }, [threadFromUrl]);

  const loadThreads = async () => {
    try {
      setErr("");
      setLoadingList(true);
      const data = await listCompanyThreads({ q: search.trim() || undefined, filter });
      const items = (data.items || []).map((t) => ({ ...t, time: timeLabel(t.lastMessageAt) }));
      setRows(items);

      if (threadFromUrl) {
        setActiveId(threadFromUrl);
      } else {
        setActiveId((prev) => prev || items[0]?.id || null);
      }
    } catch (e) {
      setErr(e?.response?.data?.message || "Failed to load conversations");
    } finally {
      setLoadingList(false);
    }
  };

  const loadThread = async (threadId) => {
    if (!threadId) return;
    try {
      setErr("");
      setLoadingThread(true);
      const data = await getCompanyThread(threadId);
      setActive({
        ...data.thread,
        messages: (data.messages || []).map((m) => ({ ...m, atLabel: msgAtLabel(m.at) })),
      });
      await markCompanyThreadRead(threadId);
      setRows((prev) => prev.map((x) => (x.id === threadId ? { ...x, unread: 0 } : x)));
    } catch (e) {
      setErr(e?.response?.data?.message || "Failed to load chat");
    } finally {
      setLoadingThread(false);
    }
  };

  useEffect(() => {
    loadThreads();
  }, [filter]);

  useEffect(() => {
    if (activeId) loadThread(activeId);
  }, [activeId]);

  const list = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((x) => {
      if (q && !`${x.candidate} ${x.job} ${x.last}`.toLowerCase().includes(q)) return false;
      if (filter === "Unread" && x.unread === 0) return false;
      if (filter === "Shortlisted" && x.status !== "Shortlisted") return false;
      if (filter === "Interview Scheduled" && x.status !== "Interview Scheduled") return false;
      return true;
    });
  }, [rows, search, filter]);

  const setActiveConversation = (id) => {
    setActiveId(id);
    setMobileListOpen(false);
  };

  const appendMessage = (msg) => {
    setActive((prev) => {
      if (!prev) return prev;
      return { ...prev, messages: [...(prev.messages || []), { ...msg, atLabel: msgAtLabel(msg.at) }] };
    });
  };

  const sendText = async () => {
    const v = text.trim();
    if (!v || !activeId) return;
    try {
      const res = await sendCompanyMessage(activeId, { type: "text", text: v });
      appendMessage(res.message);
      setRows((prev) => prev.map((x) => (x.id === activeId ? { ...x, last: v, time: "Now" } : x)));
      setText("");
    } catch (e) {
      ping(e?.response?.data?.message || "Failed to send message", "error");
    }
  };

  const sendSystem = async (systemText) => {
    if (!activeId) return;
    const res = await sendCompanyMessage(activeId, { type: "system", text: systemText });
    appendMessage(res.message);
    setRows((prev) => prev.map((x) => (x.id === activeId ? { ...x, last: systemText, time: "Now" } : x)));
  };

  const sendFile = async (fileName, fileSize = "") => {
    if (!activeId) return;
    try {
      const res = await sendCompanyMessage(activeId, {
        type: "file",
        fileName,
        fileSize,
        text: `${fileName} shared`,
      });
      appendMessage(res.message);
      setRows((prev) => prev.map((x) => (x.id === activeId ? { ...x, last: `${fileName} shared`, time: "Now" } : x)));
    } catch (e) {
      ping(e?.response?.data?.message || "Failed to send file", "error");
    }
  };

  const onPickFile = async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    await sendFile(f.name, `${Math.ceil(f.size / 1024)} KB`);
    e.target.value = "";
  };

  const requireApplication = () => {
    if (!active?.applicationId) {
      ping("No linked application found for this conversation", "error");
      return false;
    }
    return true;
  };

  const setThreadAndAppStatus = async (status) => {
    if (!activeId || !requireApplication()) return;
    await updateCompanyThreadMeta(activeId, { status });
    if (["Applied", "Shortlisted", "Interview Scheduled", "Rejected", "Hold"].includes(status)) {
      await updateApplicationStatus(active.applicationId, status);
    }
    setActive((prev) => (prev ? { ...prev, status } : prev));
    setRows((prev) => prev.map((x) => (x.id === activeId ? { ...x, status } : x)));
  };

  const scheduleInterview = async () => {
    if (!requireApplication()) return;
    if (!schedule.date || !schedule.time) return ping("Pick date & time", "error");
    try {
      setActionBusy(true);
      await createCompanyInterview({
        applicationId: active.applicationId,
        candidateName: active.candidate,
        jobTitle: active.job,
        stage: "HR",
        date: schedule.date,
        time: schedule.time,
        mode: schedule.mode,
        meetingLink: schedule.mode === "Online" ? schedule.link : "",
        location: schedule.mode === "Onsite" ? schedule.link : "",
        messageToCandidate: schedule.message || "",
        status: "Scheduled",
      });
      await setThreadAndAppStatus("Interview Scheduled");
      const meetText = schedule.mode === "Online" && schedule.link ? ` Join link: ${schedule.link}` : "";
      await sendSystem(`Interview scheduled for ${schedule.date} at ${schedule.time}.${meetText}`);
      setSchedule({ open: false, date: "", time: "", mode: "Online", link: "", message: "" });
      ping("Interview scheduled and candidate notified.", "success");
    } catch (e) {
      ping(e?.response?.data?.message || "Failed to schedule interview", "error");
    } finally {
      setActionBusy(false);
    }
  };

  const sendOffer = async () => {
    if (!requireApplication()) return;
    try {
      setActionBusy(true);
      await apiSendOffer(active.applicationId, {
        salary: offer.salary,
        joining: offer.joining,
        expiry: offer.expiry,
        message: offer.message,
        file: offer.file,
      });
      await updateCompanyThreadMeta(activeId, { status: "Offer Sent" });
      await sendFile("Offer_Letter.pdf", offer.file || "200 KB");
      setActive((p) => (p ? { ...p, status: "Offer Sent" } : p));
      setRows((prev) => prev.map((x) => (x.id === activeId ? { ...x, status: "Offer Sent" } : x)));
      setOffer({ open: false, salary: "", joining: "", expiry: "", message: "", file: "" });
      ping("Offer sent", "success");
    } catch (e) {
      ping(e?.response?.data?.message || "Failed to send offer", "error");
    } finally {
      setActionBusy(false);
    }
  };

  const reportSpam = async () => {
    if (!activeId) return;
    try {
      setSpam((p) => ({ ...p, busy: true }));
      await reportCompanyThreadSpam(activeId, {
        reason: spam.reason,
        details: spam.details,
      });
      setSpam({ open: false, reason: "Abusive Language", details: "", busy: false });
      ping("Spam report submitted to admin", "success");
    } catch (e) {
      setSpam((p) => ({ ...p, busy: false }));
      ping(e?.response?.data?.message || "Failed to submit spam report", "error");
    }
  };

  return (
    <div className="space-y-5 pb-20 md:pb-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#0F172A]">Messages</h1>
          <p className="mt-1 text-sm text-slate-500">Communicate with candidates and manage hiring conversations</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => navigate("/company/candidates")} className="rounded-xl border border-blue-200 px-4 py-2 text-sm font-semibold text-[#2563EB] hover:bg-blue-50">New Message</button>
          <button onClick={() => setMobileListOpen(true)} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">Filter Conversations</button>
        </div>
      </header>

      {err ? <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{err}</div> : null}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[340px_minmax(0,1fr)]">
        <aside className={`${mobileListOpen ? "" : "max-lg:hidden"} rounded-2xl border border-slate-200 bg-white shadow-sm`}>
          <div className="border-b border-slate-100 p-4">
            <div className="relative">
              <FiSearch className="pointer-events-none absolute left-3 top-3 text-slate-400" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => e.key === "Enter" && loadThreads()} placeholder="Search candidate or job..." className="h-10 w-full rounded-lg border border-slate-200 pl-9 pr-3 text-sm outline-none focus:border-blue-300" />
            </div>
            <div className="mt-2 flex flex-wrap gap-1">
              {["All", "Unread", "Shortlisted", "Interview Scheduled"].map((f) => (
                <button key={f} onClick={() => setFilter(f)} className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${filter === f ? "border-blue-200 bg-blue-50 text-[#2563EB]" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"}`}>{f}</button>
              ))}
              <button onClick={loadThreads} className="ml-auto rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50">Refresh</button>
            </div>
          </div>

          <div className="max-h-[640px] overflow-y-auto p-2">
            {loadingList ? <Loader label="Loading conversations..." /> : null}
            {!loadingList && list.map((c) => (
              <button key={c.id} onClick={() => setActiveConversation(c.id)} className={`mb-2 w-full rounded-xl border p-3 text-left transition hover:bg-slate-50 ${c.id === activeId ? "border-blue-200 border-l-4 border-l-[#2563EB] bg-blue-50" : "border-slate-200 bg-white"}`}>
                <div className="flex gap-3">
                  <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 text-xs font-bold text-[#2563EB]">{initials(c.candidate)}</div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-sm font-semibold text-[#0F172A]">{c.candidate}</p>
                      <span className="text-xs text-slate-500">{c.time}</span>
                    </div>
                    <p className="truncate text-xs text-slate-500">{c.job}</p>
                    <p className="mt-1 truncate text-xs text-slate-600">{c.last}</p>
                  </div>
                  {c.unread > 0 ? <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[#2563EB] px-1 text-[10px] font-bold text-white">{c.unread}</span> : null}
                </div>
              </button>
            ))}
            {!loadingList && !list.length ? <div className="p-6 text-sm text-slate-500">No conversations found.</div> : null}
          </div>
        </aside>

        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          {!activeId ? (
            <div className="p-8 text-sm text-slate-500">Select a conversation</div>
          ) : loadingThread ? (
            <Loader label="Loading chat..." />
          ) : active ? (
            <>
              <header className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 p-4">
                <div className="flex items-center gap-3">
                  <button onClick={() => setMobileListOpen(true)} className="rounded-lg border border-slate-200 px-2 py-1 text-xs text-slate-600 lg:hidden">Back</button>
                  <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 text-xs font-bold text-[#2563EB]">{initials(active.candidate)}</div>
                  <div>
                    <p className="font-semibold text-[#0F172A]">{active.candidate}</p>
                    <p className="text-xs text-slate-500">{active.job}</p>
                  </div>
                  <span className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${statusCls[active.status] || statusCls.Unknown}`}>{active.status}</span>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button onClick={() => setSchedule((p) => ({ ...p, open: true }))} className="rounded-lg bg-[#2563EB] px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700">Schedule Interview</button>
                  <button onClick={() => navigate("/company/candidates")} className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">View Profile</button>
                  <button onClick={() => setSpam((p) => ({ ...p, open: true }))} className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-100"><FiFlag /></button>
                  <button onClick={loadThreads} className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50"><FiMoreHorizontal /></button>
                </div>
              </header>

              <div className="h-[500px] overflow-y-auto bg-slate-50/60 p-4">
                <div className="space-y-3">
                  {active.messages.map((m) => {
                    const meetUrl = extractMeetLink(m?.text || "");
                    if (m.type === "system") {
                      return (
                        <div key={m.id} className="mx-auto w-fit rounded-lg border border-slate-200 bg-slate-100 px-3 py-2 text-xs text-slate-600">
                          {renderTextWithLinks(m.text)}
                          {meetUrl ? (
                            <div className="mt-2 text-center">
                              <a
                                href={meetUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 rounded-md border border-blue-200 bg-blue-50 px-2.5 py-1 text-[11px] font-semibold text-[#2563EB] hover:bg-blue-100"
                              >
                                <FiVideo />
                                Join Meeting
                              </a>
                            </div>
                          ) : null}
                        </div>
                      );
                    }
                    const company = m.sender === "company";
                    return (
                      <div key={m.id} className={`flex ${company ? "justify-end" : "justify-start"}`}>
                        <div className="max-w-[78%]">
                          {m.type === "file" ? (
                            <div className={`rounded-2xl border px-3 py-2 ${company ? "border-blue-600 bg-[#2563EB] text-white" : "border-slate-200 bg-white text-slate-700"}`}>
                              <div className="flex items-center gap-2 text-sm font-semibold"><FiFileText />{m.fileName || "File"}</div>
                              <div className="mt-1 flex items-center justify-between text-xs">
                                <span>{m.fileSize || ""}</span>
                                <button onClick={() => ping("Attachment URL not available")} className={`inline-flex items-center gap-1 ${company ? "text-blue-100" : "text-[#2563EB]"}`}><FiDownload />Download</button>
                              </div>
                            </div>
                          ) : (
                            <div className={`rounded-2xl px-3 py-2 text-sm ${company ? "bg-[#2563EB] text-white" : "border border-slate-200 bg-white text-slate-700"}`}>
                              {renderTextWithLinks(m.text)}
                              {meetUrl ? (
                                <div className="mt-2">
                                  <a
                                    href={meetUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-semibold ${
                                      company
                                        ? "border border-blue-200 bg-blue-100/20 text-white"
                                        : "border border-blue-200 bg-blue-50 text-[#2563EB] hover:bg-blue-100"
                                    }`}
                                  >
                                    <FiVideo />
                                    Join Meeting
                                  </a>
                                </div>
                              ) : null}
                            </div>
                          )}
                          <p className={`mt-1 text-[11px] text-slate-500 ${company ? "text-right" : "text-left"}`}>{m.atLabel}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="border-t border-slate-100 p-3">
                <div className="mb-2 flex flex-wrap gap-2">
                  <button onClick={() => setSchedule((p) => ({ ...p, open: true }))} className="rounded-lg border border-blue-200 px-3 py-1.5 text-xs font-semibold text-[#2563EB] hover:bg-blue-50">Send Interview Invite</button>
                  <button onClick={() => sendSystem("Please share required documents for verification.")} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50">Request Documents</button>
                  <button onClick={() => setOffer((p) => ({ ...p, open: true }))} className="rounded-lg border border-orange-200 px-3 py-1.5 text-xs font-semibold text-[#F97316] hover:bg-orange-50">Send Offer Letter</button>
                  <button onClick={async () => { try { setActionBusy(true); await setThreadAndAppStatus("Shortlisted"); await sendSystem("You have been moved to shortlisted."); ping("Candidate shortlisted", "success"); } catch (e) { ping(e?.response?.data?.message || "Failed to shortlist", "error"); } finally { setActionBusy(false); } }} className="rounded-lg border border-green-200 px-3 py-1.5 text-xs font-semibold text-green-700 hover:bg-green-50 disabled:opacity-60" disabled={actionBusy}>Move to Shortlisted</button>
                  <button onClick={async () => { try { setActionBusy(true); await setThreadAndAppStatus("Rejected"); await sendSystem("Your application has been marked as rejected."); ping("Candidate rejected", "success"); } catch (e) { ping(e?.response?.data?.message || "Failed to reject", "error"); } finally { setActionBusy(false); } }} className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-60" disabled={actionBusy}>Reject Candidate</button>
                </div>

                <div className="flex items-center gap-2">
                  <input ref={fileInputRef} type="file" className="hidden" onChange={onPickFile} />
                  <button onClick={() => fileInputRef.current?.click()} className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"><FiPaperclip /></button>
                  <button className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"><FiSmile /></button>
                  <input value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === "Enter" && sendText()} placeholder="Type your message..." className="h-10 flex-1 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-blue-300" />
                  <button onClick={sendText} className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#2563EB] text-white hover:bg-blue-700"><FiSend /></button>
                </div>
              </div>
            </>
          ) : null}
        </section>
      </div>

      <Modal
        open={offer.open}
        onClose={() => setOffer({ open: false, salary: "", joining: "", expiry: "", message: "", file: "" })}
        title="Send Offer Letter"
        footer={
          <>
            <button onClick={() => setOffer({ open: false, salary: "", joining: "", expiry: "", message: "", file: "" })} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700">Cancel</button>
            <button onClick={sendOffer} className="rounded-lg bg-[#F97316] px-4 py-2 text-sm font-semibold text-white">Send Offer</button>
          </>
        }
      >
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <input value={offer.salary} onChange={(e) => setOffer((p) => ({ ...p, salary: e.target.value }))} placeholder="Salary" className="h-10 rounded-lg border border-slate-200 px-3 text-sm" />
          <input type="date" value={offer.joining} onChange={(e) => setOffer((p) => ({ ...p, joining: e.target.value }))} className="h-10 rounded-lg border border-slate-200 px-3 text-sm" />
          <input type="date" value={offer.expiry} onChange={(e) => setOffer((p) => ({ ...p, expiry: e.target.value }))} className="h-10 rounded-lg border border-slate-200 px-3 text-sm" />
          <input value={offer.file} onChange={(e) => setOffer((p) => ({ ...p, file: e.target.value }))} placeholder="Offer PDF size (ex: 200 KB)" className="h-10 rounded-lg border border-slate-200 px-3 text-sm" />
          <textarea value={offer.message} onChange={(e) => setOffer((p) => ({ ...p, message: e.target.value }))} rows={3} placeholder="Message" className="rounded-lg border border-slate-200 px-3 py-2 text-sm sm:col-span-2" />
        </div>
      </Modal>

      <Modal
        open={schedule.open}
        onClose={() => setSchedule({ open: false, date: "", time: "", mode: "Online", link: "", message: "" })}
        title="Schedule Interview"
        footer={
          <>
            <button onClick={() => setSchedule({ open: false, date: "", time: "", mode: "Online", link: "", message: "" })} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700">Cancel</button>
            <button onClick={scheduleInterview} className="rounded-lg bg-[#2563EB] px-4 py-2 text-sm font-semibold text-white">Send Invite</button>
          </>
        }
      >
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <input type="date" value={schedule.date} onChange={(e) => setSchedule((p) => ({ ...p, date: e.target.value }))} className="h-10 rounded-lg border border-slate-200 px-3 text-sm" />
          <input type="time" value={schedule.time} onChange={(e) => setSchedule((p) => ({ ...p, time: e.target.value }))} className="h-10 rounded-lg border border-slate-200 px-3 text-sm" />
          <select value={schedule.mode} onChange={(e) => setSchedule((p) => ({ ...p, mode: e.target.value }))} className="h-10 rounded-lg border border-slate-200 px-3 text-sm"><option>Online</option><option>Onsite</option></select>
          <input value={schedule.link} onChange={(e) => setSchedule((p) => ({ ...p, link: e.target.value }))} placeholder="Meeting link / location" className="h-10 rounded-lg border border-slate-200 px-3 text-sm" />
          <textarea value={schedule.message} onChange={(e) => setSchedule((p) => ({ ...p, message: e.target.value }))} rows={3} placeholder="Message" className="rounded-lg border border-slate-200 px-3 py-2 text-sm sm:col-span-2" />
        </div>
      </Modal>

      <Modal
        open={spam.open}
        onClose={() => setSpam({ open: false, reason: "Abusive Language", details: "", busy: false })}
        title="Report Spam Candidate"
        footer={
          <>
            <button
              onClick={() => setSpam({ open: false, reason: "Abusive Language", details: "", busy: false })}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700"
            >
              Cancel
            </button>
            <button
              onClick={reportSpam}
              disabled={spam.busy || (spam.reason === "Other" && !spam.details.trim())}
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              {spam.busy ? "Submitting..." : "Submit Report"}
            </button>
          </>
        }
      >
        <div className="space-y-3">
          <select
            value={spam.reason}
            onChange={(e) => setSpam((p) => ({ ...p, reason: e.target.value }))}
            className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm"
          >
            <option>Abusive Language</option>
            <option>Scam/Fraud</option>
            <option>Harassment</option>
            <option>Irrelevant Messages</option>
            <option>Fake Profile</option>
            <option>Other</option>
          </select>
          <textarea
            value={spam.details}
            onChange={(e) => setSpam((p) => ({ ...p, details: e.target.value }))}
            rows={3}
            placeholder={spam.reason === "Other" ? "Please describe the issue" : "Additional details (optional)"}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
          />
        </div>
      </Modal>

      <Toast show={toast.show} message={toast.message} tone={toast.tone} onClose={() => setToast((p) => ({ ...p, show: false }))} />
    </div>
  );
}
