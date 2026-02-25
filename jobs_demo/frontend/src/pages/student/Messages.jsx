import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { FiFlag } from "react-icons/fi";
import ConversationsList from "../../components/student/messages/ConversationsList.jsx";
import ChatWindow from "../../components/student/messages/ChatWindow.jsx";
import Modal from "../../components/common/Modal.jsx";
import {
  studentGetConversationMessages,
  studentListConversations,
  studentReportConversationSpam,
  studentSendConversationMessage,
  studentToggleSaveJob,
} from "../../services/studentService.js";

export default function Messages() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const fileInputRef = useRef(null);

  const [conversations, setConversations] = useState([]);
  const [query, setQuery] = useState("");
  const [activeId, setActiveId] = useState("");
  const [text, setText] = useState("");
  const [mobileListOpen, setMobileListOpen] = useState(true);

  const [loadingConvos, setLoadingConvos] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sendBusy, setSendBusy] = useState(false);
  const [attachBusy, setAttachBusy] = useState(false);
  const [error, setError] = useState("");
  const [spamModal, setSpamModal] = useState({ open: false, reason: "Abusive Language", details: "", busy: false });

  const [activeMessages, setActiveMessages] = useState([]);

  const loadConversations = async ({ keepActive = true } = {}) => {
    try {
      if (!keepActive) setLoadingConvos(true);
      const res = await studentListConversations();
      const items = Array.isArray(res?.data) ? res.data : [];
      setConversations(items);

      const threadId = searchParams.get("thread");
      if (threadId && items.some((x) => x.id === threadId)) {
        setActiveId(threadId);
        setMobileListOpen(false);
        return;
      }

      if (!activeId && items[0]?.id) {
        setActiveId(items[0].id);
      } else if (activeId && !items.some((x) => x.id === activeId)) {
        setActiveId(items[0]?.id || "");
      }
    } catch (e) {
      console.error(e);
      setError(e?.response?.data?.message || "Failed to load conversations.");
    } finally {
      setLoadingConvos(false);
    }
  };

  const loadMessages = async (threadId) => {
    if (!threadId) return;
    try {
      setLoadingMessages(true);
      const res = await studentGetConversationMessages(threadId);
      const msgs = Array.isArray(res?.data?.messages) ? res.data.messages : [];
      const convo = res?.data?.conversation || {};
      setActiveMessages(msgs);

      setConversations((prev) =>
        prev.map((c) =>
          c.id === threadId
            ? {
                ...c,
                unread: 0,
                status: convo.status || c.status,
                jobId: convo.jobId || c.jobId,
                companyEmail: convo.companyEmail || c.companyEmail,
                companyPhone: convo.companyPhone || c.companyPhone,
                companyWebsite: convo.companyWebsite || c.companyWebsite,
                companyAddress: convo.companyAddress || c.companyAddress,
              }
            : c
        )
      );
    } catch (e) {
      console.error(e);
      setError(e?.response?.data?.message || "Failed to load messages.");
    } finally {
      setLoadingMessages(false);
    }
  };

  useEffect(() => {
    loadConversations({ keepActive: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  useEffect(() => {
    loadMessages(activeId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeId]);

  useEffect(() => {
    const convoTimer = setInterval(() => {
      loadConversations({ keepActive: true });
    }, 20000);
    return () => clearInterval(convoTimer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeId, searchParams]);

  useEffect(() => {
    if (!activeId) return undefined;
    const msgTimer = setInterval(() => {
      loadMessages(activeId);
    }, 10000);
    return () => clearInterval(msgTimer);
  }, [activeId]);

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (conversations || []).filter((item) =>
      `${item.company || ""} ${item.jobTitle || ""} ${item.lastMessage || ""}`
        .toLowerCase()
        .includes(q)
    );
  }, [conversations, query]);

  const active = useMemo(
    () => conversations.find((x) => x.id === activeId) || conversations[0] || null,
    [conversations, activeId]
  );

  const unreadCount = useMemo(
    () => (conversations || []).reduce((sum, x) => sum + (Number(x.unread) || 0), 0),
    [conversations]
  );

  const openConversation = (id) => {
    setError("");
    setActiveId(id);
    setMobileListOpen(false);
  };

  const sendTextMessage = async () => {
    const value = text.trim();
    if (!value || !activeId || sendBusy) return;

    setError("");
    setSendBusy(true);

    const now = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const optimistic = {
      id: crypto.randomUUID(),
      sender: "student",
      type: "text",
      text: value,
      time: now,
      createdAt: new Date().toISOString(),
    };

    setActiveMessages((prev) => [...prev, optimistic]);
    setText("");
    setConversations((prev) =>
      prev.map((c) => (c.id === activeId ? { ...c, lastMessage: value, lastTime: "Now" } : c))
    );

    try {
      const sent = await studentSendConversationMessage(activeId, { type: "text", text: value });
      const msg = sent?.data;
      if (msg?.id) {
        setActiveMessages((prev) =>
          prev.map((m) => (m.id === optimistic.id ? { ...m, id: msg.id, time: msg.time || m.time } : m))
        );
      }
    } catch (e) {
      console.error(e);
      setActiveMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
      setText(value);
      setError(e?.response?.data?.message || "Failed to send message. Please try again.");
    } finally {
      setSendBusy(false);
    }
  };

  const attachFileMessage = async () => {
    if (attachBusy || !activeId) return;
    fileInputRef.current?.click();
  };

  const onFileSelected = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || !activeId) return;

    setError("");
    setAttachBusy(true);

    const sizeKb = Math.max(1, Math.round(file.size / 1024));
    const fileSize = `${sizeKb} KB`;
    const now = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    const optimistic = {
      id: crypto.randomUUID(),
      sender: "student",
      type: "file",
      fileName: file.name,
      fileSize,
      time: now,
      createdAt: new Date().toISOString(),
    };

    setActiveMessages((prev) => [...prev, optimistic]);
    setConversations((prev) =>
      prev.map((c) =>
        c.id === activeId ? { ...c, lastMessage: `${file.name} shared`, lastTime: "Now" } : c
      )
    );

    try {
      const sent = await studentSendConversationMessage(activeId, {
        type: "file",
        fileName: file.name,
        fileSize,
      });
      const msg = sent?.data;
      if (msg?.id) {
        setActiveMessages((prev) =>
          prev.map((m) => (m.id === optimistic.id ? { ...m, id: msg.id, time: msg.time || m.time } : m))
        );
      }
    } catch (e) {
      console.error(e);
      setActiveMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
      setError(e?.response?.data?.message || "Failed to attach file. Please try again.");
    } finally {
      setAttachBusy(false);
    }
  };

  const onSaveJob = async () => {
    try {
      setError("");
      if (!active?.jobId) return;
      await studentToggleSaveJob(active.jobId);
    } catch (e) {
      setError(e?.response?.data?.message || "Failed to save job.");
    }
  };

  const submitSpamReport = async () => {
    if (!activeId) return;
    try {
      setSpamModal((p) => ({ ...p, busy: true }));
      await studentReportConversationSpam(activeId, {
        reason: spamModal.reason,
        details: spamModal.reason === "Other" ? spamModal.details : spamModal.details,
      });
      setSpamModal({ open: false, reason: "Abusive Language", details: "", busy: false });
    } catch (e) {
      setError(e?.response?.data?.message || "Failed to submit spam report.");
      setSpamModal((p) => ({ ...p, busy: false }));
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] bg-[#F6F7FB]">
      <div className="mx-auto max-w-[1240px] px-4 py-6 sm:px-6 lg:px-8">
        <input ref={fileInputRef} type="file" className="hidden" onChange={onFileSelected} />

        <div className="mb-2 text-xs text-slate-500">
          <span className="hover:text-slate-700">Home</span>
          <span className="px-2">/</span>
          <span className="hover:text-slate-700">Jobs</span>
          <span className="px-2">/</span>
          <span className="text-slate-700">Messages</span>
        </div>

        <div className="mb-4 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-[#0F172A]">Messages</h1>
            <p className="mt-1 text-sm text-slate-500">Manage your chats with employers</p>
            {loadingConvos ? <p className="mt-1 text-xs text-slate-500">Loading conversations...</p> : null}
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
              {unreadCount} unread
            </span>
            <button
              type="button"
              onClick={() => setSpamModal((p) => ({ ...p, open: true }))}
              disabled={!activeId}
              className="inline-flex items-center gap-1 rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-semibold text-red-700 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <FiFlag /> Report Spam
            </button>
          </div>
        </div>

        {error ? (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[340px_minmax(0,1fr)_300px]">
          <div className={`${mobileListOpen ? "" : "max-lg:hidden"}`}>
            <ConversationsList
              query={query}
              setQuery={setQuery}
              list={list}
              activeId={activeId}
              openConversation={openConversation}
            />
          </div>

          <ChatWindow
            active={active}
            messages={activeMessages}
            mobileListOpen={mobileListOpen}
            setMobileListOpen={setMobileListOpen}
            text={text}
            setText={setText}
            onSend={sendTextMessage}
            onAttach={attachFileMessage}
            attachBusy={attachBusy}
            sendBusy={sendBusy}
            onViewJob={() => {
              if (active?.jobId) navigate(`/student/jobs/${active.jobId}`);
            }}
            loadingMessages={loadingMessages}
          />

          <div className="max-lg:hidden">
            <ChatWindow.AboutPanel
              active={active}
              onCall={() => {
                const phone = active?.companyPhone || "";
                if (phone) window.open(`tel:${phone}`, "_self");
              }}
              onMail={() => {
                const email = active?.companyEmail || "";
                if (email) window.open(`mailto:${email}`, "_self");
              }}
              onWhatsApp={() => {
                const phone = (active?.companyPhone || "").replace(/\s+/g, "");
                if (phone) window.open(`https://wa.me/${phone}`, "_blank");
              }}
              onSaveJob={onSaveJob}
            />
          </div>
        </div>
      </div>

      <Modal
        open={spamModal.open}
        onClose={() => setSpamModal({ open: false, reason: "Abusive Language", details: "", busy: false })}
        title="Report Spam Conversation"
        footer={
          <>
            <button
              type="button"
              onClick={() => setSpamModal({ open: false, reason: "Abusive Language", details: "", busy: false })}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={submitSpamReport}
              disabled={spamModal.busy || (spamModal.reason === "Other" && !spamModal.details.trim())}
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {spamModal.busy ? "Submitting..." : "Submit Report"}
            </button>
          </>
        }
      >
        <div className="space-y-3">
          <select
            value={spamModal.reason}
            onChange={(e) => setSpamModal((p) => ({ ...p, reason: e.target.value }))}
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
            value={spamModal.details}
            onChange={(e) => setSpamModal((p) => ({ ...p, details: e.target.value }))}
            rows={3}
            placeholder={spamModal.reason === "Other" ? "Please describe the issue" : "Additional details (optional)"}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
          />
        </div>
      </Modal>
    </div>
  );
}
