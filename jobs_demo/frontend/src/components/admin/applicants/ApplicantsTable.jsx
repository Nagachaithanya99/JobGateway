import { useMemo } from "react";
import { FiDownload, FiEye, FiFileText, FiTrash2 } from "react-icons/fi";

function statusClass(status) {
  const s = String(status || "").toLowerCase();
  if (s === "shortlisted") return "bg-green-50 border-green-200 text-green-700";
  if (s === "hold") return "bg-amber-50 border-amber-200 text-amber-700";
  if (s === "rejected") return "bg-red-50 border-red-200 text-red-700";
  if (s === "interview scheduled") return "bg-indigo-50 border-indigo-200 text-indigo-700";
  return "bg-blue-50 border-blue-200 text-[#2563EB]";
}

function ActionButton({ title, tone = "blue", onClick, icon }) {
  const tones = {
    blue: "border-blue-200 text-[#2563EB] hover:bg-blue-50",
    green: "border-green-200 text-green-700 hover:bg-green-50",
    orange: "border-orange-200 text-[#F97316] hover:bg-orange-50",
    red: "border-red-200 text-red-600 hover:bg-red-50",
    redOutline: "border-red-200 text-red-600 hover:bg-red-50",
  };

  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={`inline-flex h-8 w-8 items-center justify-center rounded-lg border transition ${tones[tone]}`}
    >
      {icon}
    </button>
  );
}

function Avatar({ applicant }) {
  const name = applicant?.student?.name || "Student";
  const src = applicant?.student?.avatar;

  if (src) {
    return <img src={src} alt={name} className="h-9 w-9 rounded-full border border-slate-200 object-cover" />;
  }

  return (
    <img
      src={`https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=DBEAFE&color=2563EB&bold=true`}
      alt={name}
      className="h-9 w-9 rounded-full border border-slate-200 object-cover"
    />
  );
}

export default function ApplicantsTable({
  rows = [],
  selectedIds = [],
  onToggleSelect,
  onToggleSelectAll,
  onView,
  onDelete,
  onOpenResume,
  onDownloadResume,
  onAvatarClick,
}) {
  const allSelected = useMemo(
    () => rows.length > 0 && rows.every((row) => selectedIds.includes(row.id)),
    [rows, selectedIds],
  );

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="hidden overflow-x-auto md:block">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={(e) => onToggleSelectAll(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-[#2563EB] focus:ring-[#2563EB]"
                />
              </th>
              <th className="px-4 py-3">Student Name</th>
              <th className="px-4 py-3">Applied Job</th>
              <th className="px-4 py-3">Company</th>
              <th className="px-4 py-3">Experience</th>
              <th className="px-4 py-3">Education</th>
              <th className="px-4 py-3">Applied Date</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Resume</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>

          <tbody>
            {rows.map((row) => {
              const checked = selectedIds.includes(row.id);

              return (
                <tr key={row.id} className={`border-t border-slate-100 transition hover:bg-blue-50/40 ${checked ? "bg-blue-50/40" : ""}`}>
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(e) => onToggleSelect(row.id, e.target.checked)}
                      className="h-4 w-4 rounded border-slate-300 text-[#2563EB] focus:ring-[#2563EB]"
                    />
                  </td>

                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <button
                        type="button"
                        onClick={() => onAvatarClick?.(row)}
                        className="rounded-full transition hover:scale-[1.03]"
                        title={`Open ${row.student?.name || "student"} profile`}
                      >
                        <Avatar applicant={row} />
                      </button>
                      <div>
                        <button
                          type="button"
                          onClick={() => onAvatarClick?.(row)}
                          className="font-semibold text-slate-800 hover:text-[#2563EB]"
                        >
                          {row.student?.name}
                        </button>
                        <p className="text-xs text-slate-500">{row.student?.email}</p>
                      </div>
                    </div>
                  </td>

                  <td className="px-4 py-3 text-slate-700">{row.job?.title}</td>
                  <td className="px-4 py-3 text-slate-700">{row.job?.companyName}</td>
                  <td className="px-4 py-3 text-slate-700">{row.student?.experience || "-"}</td>
                  <td className="px-4 py-3 text-slate-700">{row.student?.education || "-"}</td>
                  <td className="px-4 py-3 text-slate-600">{row.appliedAt}</td>

                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold capitalize ${statusClass(row.status)}`}>
                      {row.status}
                    </span>
                  </td>

                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => onOpenResume?.(row)}
                        className="text-xs font-semibold text-[#2563EB] hover:underline"
                      >
                        View Resume
                      </button>
                      <button
                        type="button"
                        title="Download Resume"
                        onClick={() => onDownloadResume(row)}
                        className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-blue-200 text-[#2563EB] hover:bg-blue-50"
                      >
                        <FiDownload className="text-xs" />
                      </button>
                    </div>
                  </td>

                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1.5">
                      <ActionButton title="View Profile" tone="blue" onClick={() => onView(row)} icon={<FiEye />} />
                      <ActionButton title="Delete" tone="redOutline" onClick={() => onDelete(row)} icon={<FiTrash2 />} />
                    </div>
                  </td>
                </tr>
              );
            })}

            {rows.length === 0 ? (
              <tr className="border-t border-slate-100">
                <td colSpan={10} className="px-4 py-12 text-center text-sm text-slate-500">
                  No applicants found.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <div className="space-y-3 p-4 md:hidden">
        {rows.map((row) => (
          <div key={row.id} className="rounded-xl border border-slate-200 p-3">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={selectedIds.includes(row.id)}
                onChange={(e) => onToggleSelect(row.id, e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-[#2563EB] focus:ring-[#2563EB]"
              />
              <button
                type="button"
                onClick={() => onAvatarClick?.(row)}
                className="rounded-full transition hover:scale-[1.03]"
                title={`Open ${row.student?.name || "student"} profile`}
              >
                <Avatar applicant={row} />
              </button>
              <div className="min-w-0 flex-1">
                <button
                  type="button"
                  onClick={() => onAvatarClick?.(row)}
                  className="truncate text-left text-sm font-semibold text-slate-800 hover:text-[#2563EB]"
                >
                  {row.student?.name}
                </button>
                <p className="truncate text-xs text-slate-500">{row.job?.title}</p>
                <p className="truncate text-xs text-slate-500">{row.job?.companyName}</p>
              </div>
              <ActionButton title="View" tone="blue" onClick={() => onView(row)} icon={<FiEye />} />
            </div>

            <div className="mt-3 flex items-center justify-between">
              <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold capitalize ${statusClass(row.status)}`}>
                {row.status}
              </span>
              <button
                type="button"
                onClick={() => onOpenResume?.(row)}
                className="inline-flex items-center gap-1 rounded-lg border border-blue-200 px-2 py-1 text-xs font-semibold text-[#2563EB] hover:bg-blue-50"
              >
                <FiFileText className="text-xs" /> View Resume
              </button>
            </div>

            <div className="mt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => onDownloadResume(row)}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                <FiDownload className="text-xs" /> Download
              </button>
              <ActionButton title="Delete" tone="redOutline" onClick={() => onDelete(row)} icon={<FiTrash2 />} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
