import {
  FiBriefcase,
  FiEdit2,
  FiEye,
  FiMapPin,
  FiSlash,
  FiTrash2,
  FiUsers,
} from "react-icons/fi";

function statusClass(status = "") {
  const s = String(status).toLowerCase();
  if (s === "active") return "border-green-200 bg-green-50 text-green-700";
  if (s === "closed") return "border-slate-200 bg-slate-100 text-slate-700";
  if (s === "pending" || s === "draft") return "border-orange-200 bg-orange-50 text-[#F97316]";
  return "border-red-200 bg-red-50 text-red-700";
}

function ActionButton({ children, tone = "blue", onClick, icon }) {
  const toneClass =
    tone === "orange"
      ? "border-orange-200 bg-orange-50 text-[#F97316] hover:bg-orange-100"
      : tone === "red"
      ? "border-red-200 bg-red-50 text-red-600 hover:bg-red-100"
      : "border-blue-200 bg-blue-50 text-[#2563EB] hover:bg-blue-100";

  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-xl border px-3 text-sm font-semibold transition ${toneClass}`}
    >
      {icon}
      {children}
    </button>
  );
}

export default function JobCardGrid({ rows = [], onOpen, onEdit, onToggle, onDelete }) {
  if (!rows.length) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-sm font-medium text-slate-500 shadow-sm">
        No jobs found.
      </div>
    );
  }

  return (
    <section className="grid grid-cols-1 gap-5 xl:grid-cols-2 2xl:grid-cols-3">
      {rows.map((job) => {
        const status = job.status || "Active";
        const isActive = String(status).toLowerCase() === "active";
        const nextStatus = isActive ? "disabled" : "active";

        return (
          <article
            key={job.id}
            className="group overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:border-blue-200 hover:shadow-xl"
          >
            <div className="relative border-b border-slate-100 bg-[linear-gradient(135deg,#F8FAFC_0%,#EEF6FF_54%,#FFF7ED_100%)] p-5">
              <div className="absolute right-5 top-5">
                <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold capitalize ${statusClass(status)}`}>
                  {status}
                </span>
              </div>

              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-blue-100 bg-white text-xl font-bold text-[#2563EB] shadow-sm">
                <FiBriefcase />
              </div>

              <h3 className="mt-4 pr-24 text-lg font-bold text-[#0F172A]">{job.title || "-"}</h3>
              <p className="mt-1 text-sm font-semibold text-slate-600">{job.companyName || "-"}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="rounded-full border border-slate-200 bg-white/80 px-3 py-1 text-xs font-semibold text-slate-600">
                  {job.stream || "No stream"}
                </span>
                <span className="rounded-full border border-slate-200 bg-white/80 px-3 py-1 text-xs font-semibold text-slate-600">
                  {job.category || "No category"}
                </span>
              </div>
            </div>

            <div className="space-y-4 p-5">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl border border-blue-100 bg-blue-50/60 p-3">
                  <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-[#2563EB]">
                    <FiUsers /> Applications
                  </p>
                  <p className="mt-2 text-2xl font-bold text-[#0F172A]">{job.applications || 0}</p>
                </div>
                <div className="rounded-2xl border border-orange-100 bg-orange-50/70 p-3">
                  <p className="text-xs font-bold uppercase tracking-wide text-[#F97316]">Salary</p>
                  <p className="mt-2 truncate text-lg font-bold text-[#0F172A]">{job.salary || "-"}</p>
                </div>
              </div>

              <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
                <p className="flex items-center gap-2">
                  <FiMapPin className="text-slate-400" />
                  <span className="font-semibold text-slate-700">{job.location || "-"}</span>
                </p>
                <p className="mt-2">
                  Experience: <span className="font-semibold text-slate-800">{job.experience || "-"}</span>
                </p>
                <p className="mt-2">
                  Posted: <span className="font-semibold text-slate-800">{job.createdAt || "-"}</span>
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <ActionButton onClick={() => onOpen?.(job)} icon={<FiEye />}>
                  View
                </ActionButton>
                {onEdit ? (
                  <ActionButton tone="orange" onClick={() => onEdit(job)} icon={<FiEdit2 />}>
                    Edit
                  </ActionButton>
                ) : null}
                <ActionButton tone="red" onClick={() => onToggle?.(job, nextStatus)} icon={<FiSlash />}>
                  {isActive ? "Disable" : "Enable"}
                </ActionButton>
                <ActionButton tone="red" onClick={() => onDelete?.(job)} icon={<FiTrash2 />}>
                  Delete
                </ActionButton>
              </div>
            </div>
          </article>
        );
      })}
    </section>
  );
}
