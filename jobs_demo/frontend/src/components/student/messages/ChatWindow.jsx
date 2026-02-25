import { useEffect, useMemo, useRef } from "react";
import {
  FiChevronLeft,
  FiExternalLink,
  FiFileText,
  FiMail,
  FiMoreHorizontal,
  FiPaperclip,
  FiPhone,
  FiSend,
  FiStar,
  FiMapPin,
} from "react-icons/fi";

function initials(name = "") {
  return name
    .split(" ")
    .filter(Boolean)
    .map((x) => x[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function Avatar({ name, logoUrl, size = 36 }) {
  const cls = "rounded-xl object-cover ring-1 ring-black/5";
  if (logoUrl) {
    return <img src={logoUrl} alt={name || "Company"} style={{ width: size, height: size }} className={cls} />;
  }
  return (
    <div
      style={{ width: size, height: size }}
      className="grid place-items-center rounded-xl bg-gradient-to-br from-slate-200 to-slate-100 text-xs font-extrabold text-slate-600 ring-1 ring-black/5"
    >
      {initials(name)}
    </div>
  );
}

function formatDateChip(ts) {
  if (!ts) return "";
  const d = new Date(ts);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-IN", { weekday: "short", day: "2-digit", month: "short" });
}

function Bubble({ mine, children }) {
  return (
    <div className={`flex ${mine ? "justify-end" : "justify-start"}`}>
      <div
        className={[
          "max-w-[78%] rounded-2xl px-4 py-3 text-sm leading-6 shadow-[0_10px_30px_rgba(15,23,42,0.06)] ring-1 ring-black/5",
          mine ? "bg-orange-500 text-white" : "bg-white text-slate-700",
        ].join(" ")}
      >
        {children}
      </div>
    </div>
  );
}

function MessageRow({ msg }) {
  const mine = String(msg?.sender || "").toLowerCase() === "student";
  const time = msg?.time || "";

  if (msg?.type === "file") {
    return (
      <Bubble mine={mine}>
        <div className="flex items-start gap-2">
          <span className={`mt-0.5 inline-flex h-9 w-9 items-center justify-center rounded-xl ${mine ? "bg-white/20" : "bg-orange-50 text-orange-600"}`}>
            <FiFileText />
          </span>
          <div className="min-w-0">
            <p className="truncate font-semibold">{msg?.fileName || "File"}</p>
            <p className={`text-xs ${mine ? "text-white/80" : "text-slate-500"}`}>{msg?.fileSize || ""}</p>
          </div>
          <span className={`ml-auto text-[11px] ${mine ? "text-white/80" : "text-slate-400"}`}>{time}</span>
        </div>
      </Bubble>
    );
  }

  return (
    <Bubble mine={mine}>
      <p>{msg?.text || ""}</p>
      <div className={`mt-2 text-right text-[11px] ${mine ? "text-white/80" : "text-slate-400"}`}>{time}</div>
    </Bubble>
  );
}

function AboutPanel({ active, onCall, onMail, onWhatsApp, onSaveJob }) {
  const name = active?.company || "";
  const website = active?.companyWebsite || "";
  const phone = active?.companyPhone || "";
  const email = active?.companyEmail || "";
  const location = active?.companyAddress || active?.location || "";
  const hr = active?.hrName || "";

  return (
    <aside className="rounded-2xl bg-white p-4 shadow-[0_10px_30px_rgba(15,23,42,0.06)] ring-1 ring-black/5">
      <h3 className="text-sm font-extrabold text-slate-900">About</h3>

      <div className="mt-3 flex items-start gap-3">
        <Avatar name={name} logoUrl={active?.companyLogo || active?.logoUrl} size={44} />
        <div className="min-w-0">
          <p className="truncate text-sm font-extrabold text-slate-900">{name}</p>
          {hr ? (
            <div className="mt-1 flex items-center gap-1 text-xs font-semibold text-slate-500">
              <FiStar className="text-orange-500" />
              <span>{hr}</span>
            </div>
          ) : null}
        </div>
      </div>

      <div className="mt-4 space-y-2 text-xs text-slate-600">
        {website ? (
          <p className="flex items-center gap-2">
            <FiExternalLink className="text-slate-400" /> <span className="truncate">{website}</span>
          </p>
        ) : null}
        {phone ? (
          <p className="flex items-center gap-2">
            <FiPhone className="text-slate-400" /> <span className="truncate">{phone}</span>
          </p>
        ) : null}
        {email ? (
          <p className="flex items-center gap-2">
            <FiMail className="text-slate-400" /> <span className="truncate">{email}</span>
          </p>
        ) : null}
        {location ? (
          <p className="flex items-center gap-2">
            <FiMapPin className="text-slate-400" /> <span className="truncate">{location}</span>
          </p>
        ) : null}
      </div>

      <div className="mt-4 space-y-2">
        <button
          type="button"
          onClick={onCall}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-extrabold text-white hover:bg-orange-600 disabled:opacity-50"
          disabled={!phone}
        >
          <FiPhone /> Call Now
        </button>

        <button
          type="button"
          onClick={onMail}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-extrabold text-slate-800 hover:bg-slate-50 disabled:opacity-50"
          disabled={!email}
        >
          <FiMail /> Write Mail
        </button>
      </div>

      <div className="mt-4">
        <p className="text-xs font-extrabold text-slate-900">Quick Actions</p>

        <div className="mt-2 space-y-2">
          <button
            type="button"
            onClick={onCall}
            disabled={!phone}
            className="inline-flex w-full items-center justify-between rounded-xl bg-orange-50 px-4 py-2.5 text-sm font-bold text-orange-700 ring-1 ring-orange-100 hover:bg-orange-100 disabled:opacity-50"
          >
            <span className="inline-flex items-center gap-2">
              <FiPhone /> Call Now
            </span>
            <span className="text-orange-500">›</span>
          </button>

          <button
            type="button"
            onClick={onWhatsApp}
            disabled={!phone}
            className="inline-flex w-full items-center justify-between rounded-xl bg-emerald-50 px-4 py-2.5 text-sm font-bold text-emerald-700 ring-1 ring-emerald-100 hover:bg-emerald-100 disabled:opacity-50"
          >
            <span className="inline-flex items-center gap-2">
              <FiPhone /> WhatsApp
            </span>
            <span className="text-emerald-500">›</span>
          </button>

          <button
            type="button"
            onClick={onSaveJob}
            disabled={!active?.jobId}
            className="inline-flex w-full items-center justify-between rounded-xl bg-slate-50 px-4 py-2.5 text-sm font-bold text-slate-700 ring-1 ring-slate-200 hover:bg-slate-100 disabled:opacity-50"
          >
            <span className="inline-flex items-center gap-2">
              <FiFileText /> Save Job
            </span>
            <span className="text-slate-500">›</span>
          </button>
        </div>
      </div>
    </aside>
  );
}

export default function ChatWindow({
  active,
  messages,
  mobileListOpen,
  setMobileListOpen,
  text,
  setText,
  onSend,
  onAttach,
  attachBusy,
  sendBusy,
  onViewJob,
  loadingMessages,
}) {
  const scrollRef = useRef(null);

  const title = active?.jobTitle || "";
  const company = active?.company || "";
  const subtitle = active?.companySubtitle || "";

  const dateChip = useMemo(() => {
    const ts = messages?.[0]?.createdAt || messages?.[0]?.timestamp || "";
    return formatDateChip(ts);
  }, [messages]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages, loadingMessages]);

  if (!active) {
    return (
      <section className="rounded-2xl bg-white shadow-[0_10px_30px_rgba(15,23,42,0.06)] ring-1 ring-black/5">
        <div className="p-6 text-sm text-slate-600">Select a conversation</div>
      </section>
    );
  }

  return (
    <section className="rounded-2xl bg-white shadow-[0_10px_30px_rgba(15,23,42,0.06)] ring-1 ring-black/5">
      <div className="flex items-center gap-3 border-b border-slate-100 px-4 py-3">
        <button
          type="button"
          onClick={() => setMobileListOpen(true)}
          className="lg:hidden inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 hover:bg-slate-50"
        >
          <FiChevronLeft />
        </button>

        <Avatar name={company} logoUrl={active?.companyLogo || active?.logoUrl} />

        <div className="min-w-0">
          <p className="truncate text-sm font-extrabold text-slate-900">{title}</p>
          <p className="truncate text-xs font-semibold text-slate-500">
            {[company, subtitle].filter(Boolean).join(" • ")}
          </p>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            onClick={onViewJob}
            className="hidden sm:inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-extrabold text-slate-700 hover:bg-slate-50"
          >
            View Job <FiExternalLink />
          </button>
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 hover:bg-slate-50"
            title="More"
          >
            <FiMoreHorizontal />
          </button>
        </div>
      </div>

      <div ref={scrollRef} className="h-[520px] overflow-auto bg-[#F6F7FB] px-4 py-4">
        {loadingMessages ? (
          <div className="rounded-xl border border-slate-200 bg-white p-4 text-center text-sm text-slate-500">
            Loading messages...
          </div>
        ) : null}

        {!loadingMessages && dateChip ? (
          <div className="mb-4 flex justify-center">
            <span className="rounded-full bg-white px-3 py-1 text-[11px] font-extrabold text-slate-500 ring-1 ring-black/5">
              {dateChip}
            </span>
          </div>
        ) : null}

        <div className="space-y-3">
          {(messages || []).map((m, index) => (
            <MessageRow key={m.id || `${m.sender || "x"}-${m.time || "t"}-${index}`} msg={m} />
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2 border-t border-slate-100 px-3 py-3">
        <button
          type="button"
          onClick={onAttach}
          disabled={attachBusy}
          className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          title="Attach"
        >
          <FiPaperclip />
        </button>

        <div className="flex-1">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                onSend();
              }
            }}
            placeholder="Type a message..."
            className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm outline-none focus:border-orange-200 focus:ring-2 focus:ring-orange-100"
          />
        </div>

        <button
          type="button"
          onClick={onSend}
          disabled={sendBusy || !text.trim()}
          className="inline-flex h-11 items-center gap-2 rounded-xl bg-orange-500 px-4 text-sm font-extrabold text-white hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <FiSend /> Send
        </button>
      </div>
    </section>
  );
}

ChatWindow.AboutPanel = AboutPanel;
