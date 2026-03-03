import { useMemo, useState } from "react";
import { FiLoader, FiMessageCircle, FiSend, FiX } from "react-icons/fi";
import { useAuth } from "../../context/AuthContext.jsx";
import { sendChatbotMessage } from "../../services/chatbotService.js";

const STORAGE_KEY = "jobgateway_chatbot_conversation_id";

function initialConversationId() {
  try {
    return localStorage.getItem(STORAGE_KEY) || "";
  } catch {
    return "";
  }
}

function quickPromptsByRole(role = "") {
  const r = String(role || "").toLowerCase();
  if (r === "admin") return ["Platform Help", "Reports", "Users", "Plans"];
  if (r === "company") return ["Hiring Help", "Pricing", "My Plan", "Applications"];
  return ["Find Jobs", "Resume Tips", "Interviews", "Applications"];
}

function mapPromptText(chip, role = "") {
  const r = String(role || "").toLowerCase();
  if (chip === "Platform Help") return "Help me with admin platform operations.";
  if (chip === "Reports") return "How can I review platform reports effectively?";
  if (chip === "Users") return "How should I manage user and role issues?";
  if (chip === "Plans") return "Explain plan management on JobGateway.";

  if (chip === "Hiring Help") return "How can I improve hiring workflow on JobGateway?";
  if (chip === "Pricing") return "Explain company pricing and subscriptions.";
  if (chip === "My Plan") return "How can I check and use my current plan better?";
  if (chip === "Applications") return r === "student"
    ? "How do I manage my job applications?"
    : "How do I manage incoming applications?";

  if (chip === "Find Jobs") return "How can I find relevant jobs quickly?";
  if (chip === "Resume Tips") return "Give me resume improvement tips for JobGateway.";
  if (chip === "Interviews") return "Give me interview preparation guidance.";
  return chip;
}

export default function AppChatbot() {
  const { role } = useAuth();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState(initialConversationId);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([
    { role: "assistant", content: "Hi, I'm JobGateway Assistant. How can I help you today?" },
  ]);

  const chips = useMemo(() => quickPromptsByRole(role), [role]);

  const send = async (text) => {
    const content = String(text || "").trim();
    if (!content || loading) return;

    setLoading(true);
    setMessages((prev) => [...prev, { role: "user", content }]);
    setInput("");

    try {
      const data = await sendChatbotMessage(content, conversationId || undefined);
      if (data?.conversationId) {
        setConversationId(data.conversationId);
        try {
          localStorage.setItem(STORAGE_KEY, data.conversationId);
        } catch {
          // ignore storage failures
        }
      }
      setMessages((prev) => [...prev, { role: "assistant", content: data?.reply || "Okay." }]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: err?.response?.data?.message || "Unable to process request right now." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-5 right-5 z-[70]">
      {open ? (
        <div className="w-[340px] max-w-[calc(100vw-1.5rem)] rounded-2xl border border-orange-100 bg-white shadow-[0_20px_45px_rgba(15,23,42,0.16)] sm:w-[380px]">
          <div className="flex items-center justify-between rounded-t-2xl bg-gradient-to-r from-[#FDBA74] to-[#F97316] px-4 py-3 text-white">
            <div>
              <p className="text-sm font-semibold">JobGateway Assistant</p>
              <p className="text-xs text-orange-50">Support Chat</p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-full bg-white/20 p-1 text-white hover:bg-white/30"
              aria-label="Close assistant"
            >
              <FiX />
            </button>
          </div>

          <div className="max-h-[65vh] space-y-3 overflow-y-auto p-3">
            {messages.map((m, idx) => (
              <div
                key={`${m.role}_${idx}`}
                className={`max-w-[90%] rounded-2xl px-3 py-2 text-sm ${
                  m.role === "user"
                    ? "ml-auto bg-[#2563EB] text-white"
                    : "mr-auto border border-slate-200 bg-slate-50 text-slate-700"
                }`}
              >
                {m.content}
              </div>
            ))}
            {loading ? (
              <div className="mr-auto inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-500">
                <FiLoader className="animate-spin" /> Assistant is typing...
              </div>
            ) : null}
          </div>

          <div className="space-y-2 border-t border-slate-100 px-3 py-3">
            <div className="flex flex-wrap gap-1.5">
              {chips.map((chip) => (
                <button
                  key={chip}
                  type="button"
                  onClick={() => send(mapPromptText(chip, role))}
                  disabled={loading}
                  className="rounded-full border border-orange-200 bg-orange-50 px-2.5 py-1 text-[11px] font-semibold text-[#9A3412] hover:bg-orange-100 disabled:opacity-60"
                >
                  {chip}
                </button>
              ))}
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                send(input);
              }}
              className="flex items-center gap-2"
            >
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type your message..."
                className="h-10 flex-1 rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-blue-300"
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[#2563EB] text-white hover:bg-blue-700 disabled:opacity-60"
                aria-label="Send message"
              >
                <FiSend />
              </button>
            </form>
          </div>
        </div>
      ) : null}

      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="ml-auto inline-flex h-14 w-14 items-center justify-center rounded-full bg-[#F97316] text-white shadow-[0_10px_24px_rgba(249,115,22,0.35)] hover:bg-orange-600"
        aria-label="Open assistant"
      >
        <FiMessageCircle className="text-2xl" />
      </button>
    </div>
  );
}
