import { FiDownload, FiFileText, FiVideo } from "react-icons/fi";

const urlRegex = /(https?:\/\/[^\s]+)/g;
const meetRegex = /https?:\/\/meet\.google\.com\/[^\s]+/i;

function renderWithLinks(text = "") {
  const parts = String(text).split(urlRegex);
  return parts.map((part, idx) => {
    if (/^https?:\/\//.test(part)) {
      return (
        <a
          key={`${part}_${idx}`}
          href={part}
          target="_blank"
          rel="noreferrer"
          className="underline underline-offset-2"
        >
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

export default function MessageItem({ m }) {
  const meetUrl = extractMeetLink(m?.text || "");

  if (m.type === "system") {
    return (
      <div className="mx-auto w-fit rounded-xl border border-slate-200 bg-slate-100 px-3 py-2 text-xs text-slate-600">
        {renderWithLinks(m.text)}
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

  const isStudent = m.sender === "student";
  const bubbleCls = isStudent
    ? "bg-[#2563EB] text-white"
    : "bg-white text-slate-700 border border-slate-200";

  return (
    <div className={`flex ${isStudent ? "justify-end" : "justify-start"}`}>
      <div className="max-w-[78%]">
        {m.type === "file" ? (
          <div className={`rounded-2xl border px-3 py-2 ${isStudent ? "border-blue-600 bg-[#2563EB] text-white" : "border-slate-200 bg-white text-slate-700"}`}>
            <div className="flex items-center gap-2 text-sm font-semibold">
              <FiFileText />
              {m.fileName || "File"}
            </div>
            <div className="mt-1 flex items-center justify-between text-xs">
              <span>{m.fileSize || ""}</span>
              <button type="button" className={`inline-flex items-center gap-1 ${isStudent ? "text-blue-100" : "text-[#2563EB]"}`}>
                <FiDownload />
                Download
              </button>
            </div>
          </div>
        ) : (
          <div className={`rounded-2xl px-3 py-2 text-sm ${bubbleCls}`}>
            {renderWithLinks(m.text)}
            {meetUrl ? (
              <div className="mt-2">
                <a
                  href={meetUrl}
                  target="_blank"
                  rel="noreferrer"
                  className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-semibold ${
                    isStudent
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

        <p className={`mt-1 text-[11px] text-slate-500 ${isStudent ? "text-right" : "text-left"}`}>
          {m.time || ""}
        </p>
      </div>
    </div>
  );
}
