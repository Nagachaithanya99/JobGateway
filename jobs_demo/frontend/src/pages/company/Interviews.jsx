import { useEffect, useMemo, useState } from "react";
import {
  FiCalendar,
  FiCheckCircle,
  FiEdit2,
  FiEye,
  FiMail,
  FiMessageCircle,
  FiMoreHorizontal,
  FiX,
} from "react-icons/fi";
import Modal from "../../components/common/Modal.jsx";
import {
  addCompanyInterviewNote,
  createCompanyInterview,
  deleteCompanyInterview,
  getCompanyInterviews,
  updateCompanyInterview,
  updateCompanyInterviewStatus,
} from "../../services/interviewsService.js";
import { listCompanyJobs } from "../../services/companyService.js";
import { createCompanyThread } from "../../services/messagesService.js";

const STATUS = {
  Scheduled: "border-blue-200 bg-blue-50 text-[#2563EB]",
  Completed: "border-green-200 bg-green-50 text-green-700",
  Rescheduled: "border-orange-200 bg-orange-50 text-[#F97316]",
  Cancelled: "border-red-200 bg-red-50 text-red-600",
  "Pending Confirmation": "border-indigo-200 bg-indigo-50 text-indigo-700",
};

const chips = ["Today", "Tomorrow", "This Week", "Technical Round", "Final Round"];

function Card({ title, right, children }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      {title ? (
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
          <h3 className="text-sm font-semibold text-[#0F172A]">{title}</h3>
          {right}
        </div>
      ) : null}
      <div className="p-4">{children}</div>
    </section>
  );
}

function isoDate(d) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export default function Interviews() {
  const [rows, setRows] = useState([]);
  const [jobOptions, setJobOptions] = useState([]);
  const [toast, setToast] = useState("");
  const [view, setView] = useState("table");
  const [chip, setChip] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [msgBusyId, setMsgBusyId] = useState("");

  const [details, setDetails] = useState({ open: false, item: null, newNote: "" });

  const [schedule, setSchedule] = useState({
    open: false,
    editId: null,
    applicationId: "",
    candidate: "",
    job: "",
    stage: "HR",
    date: "",
    time: "",
    duration: "30 mins",
    mode: "Online",
    link: "",
    linksText: "",
    location: "",
    message: "",
    questionsText: "",
    documentsText: "",
    verificationDetails: "",
    additionalDetails: "",
    verificationStatus: "Pending",
    emailReminder: true,
    smsReminder: false,
    auto24h: true,
  });

  const [filters, setFilters] = useState({
    jobId: "",
    stage: "",
    mode: "",
    from: "",
    to: "",
    status: "",
  });

  const todayISO = useMemo(() => isoDate(new Date()), []);
  const tomorrowISO = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return isoDate(d);
  }, []);
  const weekEndISO = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 6);
    return isoDate(d);
  }, []);

  const ping = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 1200);
  };

  const load = async (override = {}) => {
    try {
      setErr("");
      setLoading(true);

      const params = {
        jobId: (override.jobId ?? filters.jobId) || undefined,
        stage: (override.stage ?? filters.stage) || undefined,
        mode: (override.mode ?? filters.mode) || undefined,
        status: (override.status ?? filters.status) || undefined,
        from: (override.from ?? filters.from) || undefined,
        to: (override.to ?? filters.to) || undefined,
      };

      if (chip === "Technical Round") params.stage = "Technical";
      if (chip === "Final Round") params.stage = "Final";
      if (chip === "Today") {
        params.from = todayISO;
        params.to = todayISO;
      }
      if (chip === "Tomorrow") {
        params.from = tomorrowISO;
        params.to = tomorrowISO;
      }
      if (chip === "This Week") {
        params.from = todayISO;
        params.to = weekEndISO;
      }

      const data = await getCompanyInterviews(params);
      setRows(data.items || []);
    } catch (e) {
      setErr(e?.response?.data?.message || "Failed to load interviews");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [chip]);
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await listCompanyJobs({ status: "all" });
        const rows = Array.isArray(res?.items) ? res.items : [];
        if (!mounted) return;
        setJobOptions(
          rows
            .map((j) => ({
              id: String(j?._id || j?.id || ""),
              title: String(j?.title || "").trim(),
            }))
            .filter((x) => x.id && x.title)
        );
      } catch {
        if (mounted) setJobOptions([]);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const summary = useMemo(() => {
    const today = rows.filter((x) => x.date === todayISO).length;
    const upcoming = rows.filter((x) => x.date >= todayISO && x.date <= weekEndISO).length;
    const completed = rows.filter((x) => x.status === "Completed").length;
    const cancelled = rows.filter((x) => x.status === "Cancelled").length;
    return { today, upcoming, completed, cancelled };
  }, [rows, todayISO, weekEndISO]);

  const filtered = useMemo(() => {
    return rows.filter((x) => {
      if (filters.jobId && String(x.jobId || "") !== String(filters.jobId)) return false;
      if (filters.stage && x.stage !== filters.stage) return false;
      if (filters.mode && x.mode !== filters.mode) return false;
      if (filters.status && x.status !== filters.status) return false;
      if (filters.from && x.date < filters.from) return false;
      if (filters.to && x.date > filters.to) return false;
      return true;
    });
  }, [rows, filters]);

  const updateFiltersNow = (key, value) => {
    setFilters((prev) => {
      const next = { ...prev, [key]: value };
      load(next);
      return next;
    });
  };

  const setStatus = async (id, status) => {
    try {
      const { interview } = await updateCompanyInterviewStatus(id, status);
      setRows((prev) => prev.map((x) => (x.id === id ? interview : x)));
      setDetails((prev) => (prev.item?.id === id ? { ...prev, item: interview } : prev));
      ping(`Interview marked as ${status}`);
    } catch (e) {
      ping(e?.response?.data?.message || "Status update failed");
    }
  };

  const addNote = async () => {
    if (!details.item || !details.newNote.trim()) return;
    try {
      const { interview } = await addCompanyInterviewNote(details.item.id, details.newNote.trim());
      setRows((prev) => prev.map((x) => (x.id === details.item.id ? interview : x)));
      setDetails((prev) => ({ ...prev, item: interview, newNote: "" }));
      ping("Note saved");
    } catch (e) {
      ping(e?.response?.data?.message || "Failed to save note");
    }
  };

  const resetSchedule = () =>
    setSchedule({
      open: false,
      editId: null,
      applicationId: "",
      candidate: "",
      job: "",
      stage: "HR",
      date: "",
      time: "",
      duration: "30 mins",
      mode: "Online",
      link: "",
      linksText: "",
      location: "",
      message: "",
      questionsText: "",
      documentsText: "",
      verificationDetails: "",
      additionalDetails: "",
      verificationStatus: "Pending",
      emailReminder: true,
      smsReminder: false,
      auto24h: true,
    });

  const sendInvite = async () => {
    if (!schedule.candidate || !schedule.job || !schedule.date || !schedule.time) {
      return ping("Fill candidate, job, date, time");
    }

    try {
      const durationMins = parseInt(String(schedule.duration).replace(/\D/g, ""), 10) || 30;

      const payload = {
        applicationId: schedule.applicationId || undefined,
        candidateName: schedule.candidate,
        jobTitle: schedule.job,
        stage: schedule.stage,
        date: schedule.date,
        time: schedule.time,
        durationMins,
        mode: schedule.mode,
        meetingLink: schedule.mode === "Online" ? schedule.link : "",
        interviewLinks: schedule.mode === "Online" ? schedule.linksText : "",
        location: schedule.mode === "Onsite" ? schedule.location : "",
        messageToCandidate: schedule.message || "",
        interviewQuestions: schedule.questionsText || "",
        documentsRequired: schedule.documentsText || "",
        verificationDetails: schedule.verificationDetails || "",
        additionalDetails: schedule.additionalDetails || "",
        verificationStatus: schedule.verificationStatus || "Pending",
        status: schedule.editId ? "Rescheduled" : "Scheduled",
      };

      if (schedule.editId) {
        const { interview } = await updateCompanyInterview(schedule.editId, payload);
        setRows((prev) => prev.map((x) => (x.id === schedule.editId ? interview : x)));
        setDetails((prev) => (prev.item?.id === schedule.editId ? { ...prev, item: interview } : prev));
        ping("Interview updated");
      } else {
        const { interview } = await createCompanyInterview(payload);
        setRows((prev) => [interview, ...prev]);
        ping("Interview scheduled and candidate notified.");
      }

      resetSchedule();
    } catch (e) {
      ping(e?.response?.data?.message || "Failed to schedule interview");
    }
  };

  const openMessages = async (row) => {
    if (!row?.applicationId) return ping("No linked application for this interview");
    try {
      setMsgBusyId(row.id);
      const res = await createCompanyThread({ applicationId: row.applicationId });
      const threadId = res?.thread?.id;
      if (!threadId) throw new Error("Thread not created");
      window.location.href = `/company/messages?thread=${threadId}`;
    } catch (e) {
      ping(e?.response?.data?.message || "Failed to open messages");
    } finally {
      setMsgBusyId("");
    }
  };

  const removeInterview = async (id) => {
    try {
      await deleteCompanyInterview(id);
      setRows((prev) => prev.filter((x) => x.id !== id));
      setDetails((prev) => (prev.item?.id === id ? { open: false, item: null, newNote: "" } : prev));
      ping("Interview deleted");
    } catch (e) {
      ping(e?.response?.data?.message || "Delete failed");
    }
  };

  const exportCsv = () => {
    const header = ["Candidate", "Email", "Job", "Stage", "Date", "Time", "Mode", "Status", "Interviewer"];
    const body = filtered.map((x) => [
      x.candidate,
      x.email || "",
      x.job,
      x.stage,
      x.date,
      x.time,
      x.mode,
      x.status,
      x.interviewer,
    ]);
    const csv = [header, ...body]
      .map((row) => row.map((v) => `"${String(v ?? "").replaceAll('"', '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "company_interviews.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-5 pb-24 md:pb-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#0F172A]">Interviews</h1>
          <p className="mt-1 text-sm text-slate-500">Manage scheduled interviews and candidate progress</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setSchedule((p) => ({ ...p, open: true }))} className="rounded-xl bg-[#2563EB] px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">Schedule Interview</button>
          <button onClick={() => setView((v) => (v === "table" ? "calendar" : "table"))} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">{view === "table" ? "Calendar View" : "Table View"}</button>
          <button onClick={exportCsv} className="rounded-xl border border-blue-200 px-4 py-2 text-sm font-semibold text-[#2563EB] hover:bg-blue-50">Export</button>
        </div>
      </header>

      {err ? <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{err}</div> : null}

      <section className="grid grid-cols-2 gap-2 md:grid-cols-4">
        {[
          ["Interviews Today", summary.today],
          ["Upcoming This Week", summary.upcoming],
          ["Completed", summary.completed],
          ["Cancelled", summary.cancelled],
        ].map(([k, v]) => (
          <div key={k} className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
            <div className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-[#2563EB]"><FiCalendar /></div>
            <p className="mt-2 text-lg font-bold text-[#0F172A]">{v}</p>
            <p className="text-xs text-slate-500">{k}</p>
          </div>
        ))}
      </section>

      <Card title="Filters">
        <div className="grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-6">
          <select value={filters.jobId} onChange={(e) => updateFiltersNow("jobId", e.target.value)} className="h-10 rounded-lg border border-slate-200 px-3 text-sm">
            <option value="">Job Position</option>
            {jobOptions.map((j) => (
              <option key={j.id} value={j.id}>
                {j.title}
              </option>
            ))}
          </select>
          <select value={filters.stage} onChange={(e) => updateFiltersNow("stage", e.target.value)} className="h-10 rounded-lg border border-slate-200 px-3 text-sm"><option value="">Interview Stage</option><option>HR</option><option>Technical</option><option>Final</option></select>
          <select value={filters.mode} onChange={(e) => updateFiltersNow("mode", e.target.value)} className="h-10 rounded-lg border border-slate-200 px-3 text-sm"><option value="">Mode</option><option>Online</option><option>Onsite</option></select>
          <div>
            <p className="mb-1 text-xs font-semibold text-slate-600">Applied Date</p>
            <input type="date" value={filters.from} onChange={(e) => updateFiltersNow("from", e.target.value)} className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm" />
          </div>
          <div>
            <p className="mb-1 text-xs font-semibold text-slate-600">Interview Date</p>
            <input type="date" value={filters.to} onChange={(e) => updateFiltersNow("to", e.target.value)} className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm" />
          </div>
          <select value={filters.status} onChange={(e) => updateFiltersNow("status", e.target.value)} className="h-10 rounded-lg border border-slate-200 px-3 text-sm"><option value="">Status</option><option>Scheduled</option><option>Completed</option><option>Cancelled</option><option>Rescheduled</option><option>Pending Confirmation</option></select>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <button onClick={() => load()} className="rounded-lg bg-[#2563EB] px-4 py-2 text-sm font-semibold text-white">Apply Filter</button>
          <button onClick={() => { setFilters({ jobId: "", stage: "", mode: "", from: "", to: "", status: "" }); setChip(""); load({ jobId: "", stage: "", mode: "", from: "", to: "", status: "" }); }} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700">Clear</button>
        </div>
      </Card>

      <section className="flex flex-wrap gap-2">
        {chips.map((x) => (
          <button key={x} onClick={() => setChip((p) => (p === x ? "" : x))} className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${chip === x ? "border-blue-200 bg-blue-50 text-[#2563EB]" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"}`}>{x}</button>
        ))}
      </section>

      {loading ? <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-600">Loading interviews...</div> : null}

      {view === "table" ? (
        <Card title="Interviews Table">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1100px] text-left text-sm">
              <thead>
                <tr className="text-slate-500">
                  <th className="pb-2">Candidate</th><th className="pb-2">Applied Job</th><th className="pb-2">Interview Stage</th><th className="pb-2">Date</th><th className="pb-2">Time</th><th className="pb-2">Mode</th><th className="pb-2">Interviewer</th><th className="pb-2">Status</th><th className="pb-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((x) => (
                  <tr key={x.id} className="border-t border-slate-100 hover:bg-blue-50/40">
                    <td className="py-3 font-semibold text-[#0F172A]">{x.candidate}</td>
                    <td className="py-3">{x.job}</td>
                    <td className="py-3">{x.stage}</td>
                    <td className="py-3">{x.date}</td>
                    <td className="py-3">{x.time}</td>
                    <td className="py-3">{x.mode}</td>
                    <td className="py-3">{x.interviewer}</td>
                    <td className="py-3"><span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${STATUS[x.status] || "border-slate-200 bg-slate-100 text-slate-600"}`}>{x.status}</span></td>
                    <td className="py-3">
                      <div className="flex items-center gap-1">
                        <button onClick={() => setDetails({ open: true, item: x, newNote: "" })} className="rounded-md border border-blue-200 p-1.5 text-[#2563EB]"><FiEye /></button>
                        {x.mode === "Online" ? <button onClick={() => (x.meetingLink ? window.open(x.meetingLink, "_blank", "noopener,noreferrer") : ping("No meeting link"))} className="rounded-md border border-blue-200 p-1.5 text-[#2563EB]"><FiMessageCircle /></button> : null}
                        <button onClick={() => setSchedule({ ...schedule, open: true, editId: x.id, applicationId: x.applicationId || "", candidate: x.candidate, job: x.job, stage: x.stage, date: x.date, time: "", duration: x.duration || "30 mins", mode: x.mode, link: x.meetingLink || "", linksText: Array.isArray(x.interviewLinks) ? x.interviewLinks.join("\n") : "", location: x.location || "", message: x.messageToCandidate || "", questionsText: Array.isArray(x.interviewQuestions) ? x.interviewQuestions.join("\n") : "", documentsText: Array.isArray(x.documentsRequired) ? x.documentsRequired.join("\n") : "", verificationDetails: x.verificationDetails || "", additionalDetails: x.additionalDetails || "", verificationStatus: x.verificationStatus || "Pending" })} className="rounded-md border border-orange-200 p-1.5 text-[#F97316]"><FiEdit2 /></button>
                        <button onClick={() => setStatus(x.id, "Completed")} className="rounded-md border border-green-200 p-1.5 text-green-700"><FiCheckCircle /></button>
                        <button onClick={() => setStatus(x.id, "Cancelled")} className="rounded-md border border-red-200 p-1.5 text-red-600"><FiX /></button>
                        <button onClick={() => (x.email ? (window.location.href = `mailto:${x.email}`) : ping("Candidate email not available"))} className="rounded-md border border-blue-200 p-1.5 text-[#2563EB]"><FiMail /></button>
                        <button onClick={() => removeInterview(x.id)} className="rounded-md border border-slate-200 p-1.5 text-slate-600"><FiMoreHorizontal /></button>
                      </div>
                    </td>
                  </tr>
                ))}
                {!filtered.length && !loading ? <tr><td colSpan={9} className="py-10 text-center text-sm text-slate-500">No interviews found.</td></tr> : null}
              </tbody>
            </table>
          </div>
        </Card>
      ) : (
        <Card title="Calendar View">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
            {filtered.map((x) => (
              <div key={`c_${x.id}`} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <p className="font-semibold text-[#0F172A]">{x.date} • {x.time}</p>
                <p className="text-sm text-slate-700">{x.candidate}</p>
                <p className="text-xs text-slate-500">{x.job} • {x.stage}</p>
                <button onClick={() => setDetails({ open: true, item: x, newNote: "" })} className="mt-2 rounded-lg border border-blue-200 px-3 py-1.5 text-xs font-semibold text-[#2563EB]">View</button>
              </div>
            ))}
          </div>
        </Card>
      )}

      {details.open ? (
        <div className="fixed inset-0 z-40">
          <div className="absolute inset-0 bg-slate-900/30" onClick={() => setDetails({ open: false, item: null, newNote: "" })} />
          <aside className="absolute right-0 top-0 h-full w-full max-w-md overflow-y-auto border-l border-slate-200 bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
              <h3 className="text-sm font-semibold text-[#0F172A]">Interview Details</h3>
              <button onClick={() => setDetails({ open: false, item: null, newNote: "" })} className="rounded-lg border border-slate-200 p-1.5 text-slate-600"><FiX /></button>
            </div>
            <div className="space-y-3 p-4 text-sm text-slate-700">
              <p><span className="font-semibold text-[#0F172A]">Candidate:</span> {details.item?.candidate}</p>
              <p><span className="font-semibold text-[#0F172A]">Job:</span> {details.item?.job}</p>
              <p><span className="font-semibold text-[#0F172A]">Stage:</span> {details.item?.stage}</p>
              <p><span className="font-semibold text-[#0F172A]">Date & Time:</span> {details.item?.date} {details.item?.time}</p>
              <p><span className="font-semibold text-[#0F172A]">Mode:</span> {details.item?.mode}</p>
              {details.item?.mode === "Online" ? <p><span className="font-semibold text-[#0F172A]">Meeting Link:</span> {details.item?.meetingLink || "-"}</p> : null}
              {details.item?.mode === "Onsite" ? <p><span className="font-semibold text-[#0F172A]">Location:</span> {details.item?.location || "-"}</p> : null}
              <p><span className="font-semibold text-[#0F172A]">Interviewer:</span> {details.item?.interviewer}</p>
              <p><span className="font-semibold text-[#0F172A]">Verification Status:</span> {details.item?.verificationStatus || "Pending"}</p>
              {details.item?.interviewQuestions?.length ? <p><span className="font-semibold text-[#0F172A]">Questions:</span> {details.item.interviewQuestions.join(" | ")}</p> : null}
              {details.item?.documentsRequired?.length ? <p><span className="font-semibold text-[#0F172A]">Required Docs:</span> {details.item.documentsRequired.join(" | ")}</p> : null}
              {details.item?.verificationDetails ? <p><span className="font-semibold text-[#0F172A]">Verification Details:</span> {details.item.verificationDetails}</p> : null}
              {details.item?.additionalDetails ? <p><span className="font-semibold text-[#0F172A]">Other Details:</span> {details.item.additionalDetails}</p> : null}

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <p className="font-semibold text-[#0F172A]">Interview Notes</p>
                <div className="mt-2 flex flex-wrap gap-1">
                  {details.item?.notes?.length ? details.item.notes.map((n) => <span key={n} className="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-xs">{n}</span>) : <span className="text-xs text-slate-500">No notes yet</span>}
                </div>
                <textarea value={details.newNote} onChange={(e) => setDetails((p) => ({ ...p, newNote: e.target.value }))} rows={3} placeholder="Add note..." className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
                <button onClick={addNote} className="mt-2 rounded-lg border border-blue-200 px-3 py-1.5 text-xs font-semibold text-[#2563EB]">Save Note</button>
              </div>

              <div className="flex flex-wrap gap-2">
                <button onClick={() => setSchedule({ ...schedule, open: true, editId: details.item?.id, applicationId: details.item?.applicationId || "", candidate: details.item?.candidate, job: details.item?.job, stage: details.item?.stage, date: details.item?.date, time: "", duration: details.item?.duration || "30 mins", mode: details.item?.mode, link: details.item?.meetingLink || "", linksText: Array.isArray(details.item?.interviewLinks) ? details.item.interviewLinks.join("\n") : "", location: details.item?.location || "", message: details.item?.messageToCandidate || "", questionsText: Array.isArray(details.item?.interviewQuestions) ? details.item.interviewQuestions.join("\n") : "", documentsText: Array.isArray(details.item?.documentsRequired) ? details.item.documentsRequired.join("\n") : "", verificationDetails: details.item?.verificationDetails || "", additionalDetails: details.item?.additionalDetails || "", verificationStatus: details.item?.verificationStatus || "Pending" })} className="rounded-lg border border-orange-200 px-3 py-2 text-xs font-semibold text-[#F97316]">Reschedule</button>
                <button onClick={() => setStatus(details.item.id, "Cancelled")} className="rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-600">Cancel</button>
                <button onClick={() => setStatus(details.item.id, "Completed")} className="rounded-lg border border-green-200 px-3 py-2 text-xs font-semibold text-green-700">Mark Completed</button>
                <button onClick={() => openMessages(details.item)} disabled={msgBusyId === details.item?.id} className={`rounded-lg border border-blue-200 px-3 py-2 text-xs font-semibold text-[#2563EB] ${msgBusyId === details.item?.id ? "opacity-60 cursor-not-allowed" : ""}`}>Message</button>
              </div>
            </div>
          </aside>
        </div>
      ) : null}

      <Modal
        open={schedule.open}
        onClose={resetSchedule}
        title={schedule.editId ? "Edit / Reschedule Interview" : "Schedule Interview"}
        footer={
          <>
            <button onClick={resetSchedule} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700">Cancel</button>
            <button onClick={sendInvite} className="rounded-lg bg-[#2563EB] px-4 py-2 text-sm font-semibold text-white">{schedule.editId ? "Save Changes" : "Send Invite"}</button>
          </>
        }
      >
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <input value={schedule.candidate} onChange={(e) => setSchedule((p) => ({ ...p, candidate: e.target.value }))} placeholder="Candidate Name" className="h-10 rounded-lg border border-slate-200 px-3 text-sm" />
          <input value={schedule.job} onChange={(e) => setSchedule((p) => ({ ...p, job: e.target.value }))} placeholder="Job Title" className="h-10 rounded-lg border border-slate-200 px-3 text-sm" />
          <select value={schedule.stage} onChange={(e) => setSchedule((p) => ({ ...p, stage: e.target.value }))} className="h-10 rounded-lg border border-slate-200 px-3 text-sm"><option>HR</option><option>Technical</option><option>Final</option></select>
          <input type="date" value={schedule.date} onChange={(e) => setSchedule((p) => ({ ...p, date: e.target.value }))} className="h-10 rounded-lg border border-slate-200 px-3 text-sm" />
          <input type="time" value={schedule.time} onChange={(e) => setSchedule((p) => ({ ...p, time: e.target.value }))} className="h-10 rounded-lg border border-slate-200 px-3 text-sm" />
          <input value={schedule.duration} onChange={(e) => setSchedule((p) => ({ ...p, duration: e.target.value }))} placeholder="Duration (ex: 30 mins)" className="h-10 rounded-lg border border-slate-200 px-3 text-sm" />
          <select value={schedule.mode} onChange={(e) => setSchedule((p) => ({ ...p, mode: e.target.value }))} className="h-10 rounded-lg border border-slate-200 px-3 text-sm"><option>Online</option><option>Onsite</option></select>
          {schedule.mode === "Online" ? (
            <input value={schedule.link} onChange={(e) => setSchedule((p) => ({ ...p, link: e.target.value }))} placeholder="Meeting link" className="h-10 rounded-lg border border-slate-200 px-3 text-sm" />
          ) : (
            <input value={schedule.location} onChange={(e) => setSchedule((p) => ({ ...p, location: e.target.value }))} placeholder="Location" className="h-10 rounded-lg border border-slate-200 px-3 text-sm" />
          )}
          <textarea value={schedule.message} onChange={(e) => setSchedule((p) => ({ ...p, message: e.target.value }))} rows={3} placeholder="Message to candidate" className="rounded-lg border border-slate-200 px-3 py-2 text-sm sm:col-span-2" />
          <textarea value={schedule.linksText} onChange={(e) => setSchedule((p) => ({ ...p, linksText: e.target.value }))} rows={2} placeholder="Other interview links (comma or new line separated)" className="rounded-lg border border-slate-200 px-3 py-2 text-sm sm:col-span-2" />
          <textarea value={schedule.questionsText} onChange={(e) => setSchedule((p) => ({ ...p, questionsText: e.target.value }))} rows={3} placeholder="Interview questions (one per line)" className="rounded-lg border border-slate-200 px-3 py-2 text-sm sm:col-span-2" />
          <textarea value={schedule.documentsText} onChange={(e) => setSchedule((p) => ({ ...p, documentsText: e.target.value }))} rows={3} placeholder="Documents required for verification (one per line)" className="rounded-lg border border-slate-200 px-3 py-2 text-sm sm:col-span-2" />
          <textarea value={schedule.verificationDetails} onChange={(e) => setSchedule((p) => ({ ...p, verificationDetails: e.target.value }))} rows={2} placeholder="Verification instructions/details" className="rounded-lg border border-slate-200 px-3 py-2 text-sm sm:col-span-2" />
          <textarea value={schedule.additionalDetails} onChange={(e) => setSchedule((p) => ({ ...p, additionalDetails: e.target.value }))} rows={2} placeholder="Other interview details" className="rounded-lg border border-slate-200 px-3 py-2 text-sm sm:col-span-2" />
          <select value={schedule.verificationStatus} onChange={(e) => setSchedule((p) => ({ ...p, verificationStatus: e.target.value }))} className="h-10 rounded-lg border border-slate-200 px-3 text-sm sm:col-span-2">
            <option>Pending</option>
            <option>Submitted</option>
            <option>Verified</option>
            <option>Rejected</option>
          </select>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700 sm:col-span-2">
            <p className="mb-2 font-semibold text-[#0F172A]">Reminder Options</p>
            <label className="mb-1 flex items-center gap-2"><input type="checkbox" checked={schedule.emailReminder} onChange={(e) => setSchedule((p) => ({ ...p, emailReminder: e.target.checked }))} />Send Email Reminder</label>
            <label className="mb-1 flex items-center gap-2"><input type="checkbox" checked={schedule.smsReminder} onChange={(e) => setSchedule((p) => ({ ...p, smsReminder: e.target.checked }))} />Send SMS Reminder</label>
            <label className="flex items-center gap-2"><input type="checkbox" checked={schedule.auto24h} onChange={(e) => setSchedule((p) => ({ ...p, auto24h: e.target.checked }))} />Auto Reminder 24 hours before</label>
          </div>
        </div>
      </Modal>

      {toast ? <div className="fixed bottom-5 right-5 rounded-lg bg-[#0F172A] px-3 py-2 text-xs font-semibold text-white shadow-lg">{toast}</div> : null}
    </div>
  );
}
