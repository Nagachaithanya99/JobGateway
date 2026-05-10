import { FiDownload, FiEye, FiFileText, FiTrash2 } from "react-icons/fi";

function statusClass(status = "") {
  const s = String(status || "").toLowerCase();
  if (s === "shortlisted") return "bg-green-50 border-green-200 text-green-700";
  if (s === "hold") return "bg-amber-50 border-amber-200 text-amber-700";
  if (s === "rejected") return "bg-red-50 border-red-200 text-red-700";
  if (s === "interview scheduled") return "bg-indigo-50 border-indigo-200 text-indigo-700";
  return "bg-blue-50 border-blue-200 text-[#2563EB]";
}

function Avatar({ applicant, onClick }) {
  const name = applicant?.student?.name || "Student";
  const src = applicant?.student?.avatar;

  return (
    <button
      type="button"
      onClick={onClick}
      className="shrink-0 rounded-full transition hover:scale-[1.03]"
      title={`Open ${name} profile`}
    >
      {src ? (
        <img src={src} alt={name} className="h-12 w-12 rounded-full border border-slate-200 object-cover" />
      ) : (
        <img
          src={`https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=DBEAFE&color=2563EB&bold=true`}
          alt={name}
          className="h-12 w-12 rounded-full border border-slate-200 object-cover"
        />
      )}
    </button>
  );
}

function ActionButton({ title, onClick, children, tone = "blue" }) {
  const toneClass =
    tone === "red"
      ? "border-red-200 bg-red-50 text-red-600 hover:bg-red-100"
      : tone === "slate"
      ? "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
      : "border-blue-200 bg-blue-50 text-[#2563EB] hover:bg-blue-100";

  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={`inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-lg border px-3 text-sm font-semibold transition ${toneClass}`}
    >
      {children}
    </button>
  );
}

export default function ApplicantCardGrid({
  rows = [],
  selectedIds = [],
  onToggleSelect,
  onView,
  onDelete,
  onOpenResume,
  onDownloadResume,
  onAvatarClick,
}) {
  if (!rows.length) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-sm font-medium text-slate-500 shadow-sm">
        No applications found.
      </div>
    );
  }

  return (
    <section className="grid grid-cols-1 gap-4 xl:grid-cols-2 2xl:grid-cols-3">
      {rows.map((row) => {
        const checked = selectedIds.includes(row.id);

        return (
          <article
            key={row.id}
            className={`rounded-2xl border bg-white p-4 shadow-sm transition ${
              checked ? "border-blue-200 bg-blue-50/30" : "border-slate-200"
            }`}
          >
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                checked={checked}
                onChange={(e) => onToggleSelect(row.id, e.target.checked)}
                className="mt-3 h-4 w-4 rounded border-slate-300 text-[#2563EB] focus:ring-[#2563EB]"
              />

              <Avatar applicant={row} onClick={() => onAvatarClick?.(row)} />

              <div className="min-w-0 flex-1">
                <button
                  type="button"
                  onClick={() => onAvatarClick?.(row)}
                  className="truncate text-left text-base font-semibold text-[#0F172A] hover:text-[#2563EB]"
                >
                  {row.student?.name || "Student"}
                </button>
                <p className="truncate text-sm text-slate-500">{row.student?.email || "-"}</p>
                <p className="mt-1 truncate text-sm font-medium text-slate-700">{row.job?.title || "-"}</p>
                <p className="truncate text-xs text-slate-500">{row.job?.companyName || "-"}</p>
              </div>

              <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold capitalize ${statusClass(row.status)}`}>
                {row.status}
              </span>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 text-sm text-slate-600">
              <div className="rounded-xl bg-slate-50 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Experience</p>
                <p className="mt-1 font-medium text-slate-800">{row.student?.experience || "-"}</p>
              </div>
              <div className="rounded-xl bg-slate-50 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Education</p>
                <p className="mt-1 font-medium text-slate-800">{row.student?.education || "-"}</p>
              </div>
              <div className="rounded-xl bg-slate-50 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Applied Date</p>
                <p className="mt-1 font-medium text-slate-800">{row.appliedAt || "-"}</p>
              </div>
              <div className="rounded-xl bg-slate-50 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Type</p>
                <p className="mt-1 font-medium text-slate-800">{row.job?.sourceLabel || "Application"}</p>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <ActionButton title="Open Resume" onClick={() => onOpenResume?.(row)}>
                <FiFileText />
                Resume
              </ActionButton>
              <ActionButton title="Download Resume" onClick={() => onDownloadResume?.(row)} tone="slate">
                <FiDownload />
                Download
              </ActionButton>
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              <ActionButton title="Quick View" onClick={() => onView?.(row)}>
                <FiEye />
                View
              </ActionButton>
              <ActionButton title="Delete Application" onClick={() => onDelete?.(row)} tone="red">
                <FiTrash2 />
                Delete
              </ActionButton>
            </div>
          </article>
        );
      })}
    </section>
  );
}
