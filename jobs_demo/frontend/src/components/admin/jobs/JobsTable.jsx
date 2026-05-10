// frontend/src/components/admin/jobs/JobsTable.jsx
import { FiEdit2, FiEye, FiSlash, FiTrash2 } from "react-icons/fi";

function StatusBadge({ status }) {
  const s = String(status || "").toLowerCase();
  const cls =
    s === "active"
      ? "bg-green-50 border-green-200 text-green-700"
      : s === "closed"
      ? "bg-slate-100 border-slate-200 text-slate-700"
      : s === "pending"
      ? "bg-orange-50 border-orange-200 text-[#F97316]"
      : "bg-red-50 border-red-200 text-red-700";

  return (
    <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold capitalize ${cls}`}>
      {status}
    </span>
  );
}

function ActionBtn({ title, tone = "blue", onClick, icon }) {
  const cls =
    tone === "orange"
      ? "border-orange-200 text-[#F97316] hover:bg-orange-50"
      : tone === "red"
      ? "border-red-200 text-red-600 hover:bg-red-50"
      : "border-blue-200 text-[#2563EB] hover:bg-blue-50";

  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={`inline-flex h-8 w-8 items-center justify-center rounded-lg border transition ${cls}`}
    >
      {icon}
    </button>
  );
}

export default function JobsTable({
  rows = [],
  selectedIds = [],
  onToggleSelect,
  onToggleSelectAll,
  onOpen,
  onEdit,
  onToggle, // (job, nextStatus)
  onDelete,
}) {
  const allSelected = rows.length > 0 && rows.every((row) => selectedIds.includes(row.id));

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
              <th className="px-4 py-3">Job Title</th>
              <th className="px-4 py-3">Company Name</th>
              <th className="px-4 py-3">Main Stream</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Location</th>
              <th className="px-4 py-3">Salary</th>
              <th className="px-4 py-3">Experience Required</th>
              <th className="px-4 py-3">Applications</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Posted Date</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>

          <tbody>
            {rows.map((job) => {
              const isChecked = selectedIds.includes(job.id);
              const isActive = String(job.status || "").toLowerCase() === "active";
              const nextStatus = isActive ? "disabled" : "active";

              return (
                <tr
                  key={job.id}
                  className={`border-t border-slate-100 transition hover:bg-blue-50/40 ${
                    isChecked ? "bg-orange-50/60" : ""
                  }`}
                >
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={(e) => onToggleSelect(job.id, e.target.checked)}
                      className="h-4 w-4 rounded border-slate-300 text-[#2563EB] focus:ring-[#2563EB]"
                    />
                  </td>

                  <td className="px-4 py-3 font-semibold text-slate-800">{job.title}</td>
                  <td className="px-4 py-3 text-slate-700">{job.companyName}</td>
                  <td className="px-4 py-3 text-slate-700">{job.stream}</td>
                  <td className="px-4 py-3 text-slate-700">{job.category}</td>
                  <td className="px-4 py-3 text-slate-700">{job.location}</td>
                  <td className="px-4 py-3 text-slate-700">{job.salary}</td>
                  <td className="px-4 py-3 text-slate-700">{job.experience}</td>
                  <td className="px-4 py-3 font-semibold text-slate-700">{job.applications || 0}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={job.status || "active"} />
                  </td>
                  <td className="px-4 py-3 text-slate-600">{job.createdAt || "-"}</td>

                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <ActionBtn title="View Job" onClick={() => onOpen(job)} icon={<FiEye />} />
                      {onEdit ? (
                        <ActionBtn title="Edit Job" tone="orange" onClick={() => onEdit(job)} icon={<FiEdit2 />} />
                      ) : null}
                      <ActionBtn
                        title={isActive ? "Disable Job" : "Enable Job"}
                        tone="red"
                        onClick={() => onToggle(job, nextStatus)}
                        icon={<FiSlash />}
                      />
                      <ActionBtn title="Delete Job" tone="red" onClick={() => onDelete(job)} icon={<FiTrash2 />} />
                    </div>
                  </td>
                </tr>
              );
            })}

            {rows.length === 0 ? (
              <tr className="border-t border-slate-100">
                <td colSpan={12} className="px-4 py-12 text-center text-sm text-slate-500">
                  No jobs found.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      {/* Mobile */}
      <div className="space-y-3 p-4 md:hidden">
        {rows.map((job) => {
          const isActive = String(job.status || "").toLowerCase() === "active";
          const nextStatus = isActive ? "disabled" : "active";

          return (
            <div key={job.id} className="rounded-xl border border-slate-200 p-3">
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={selectedIds.includes(job.id)}
                  onChange={(e) => onToggleSelect(job.id, e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-slate-300 text-[#2563EB] focus:ring-[#2563EB]"
                />

                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-slate-800">{job.title}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {job.companyName} • {job.location}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {job.category} • {job.experience}
                  </p>

                  <div className="mt-2 flex items-center justify-between">
                    <StatusBadge status={job.status || "active"} />
                    <span className="text-xs font-semibold text-slate-600">Apps: {job.applications || 0}</span>
                  </div>

                  <div className="mt-3 flex justify-end gap-2">
                    <ActionBtn title="View Job" onClick={() => onOpen(job)} icon={<FiEye />} />
                    {onEdit ? (
                      <ActionBtn title="Edit Job" tone="orange" onClick={() => onEdit(job)} icon={<FiEdit2 />} />
                    ) : null}
                    <ActionBtn
                      title={isActive ? "Disable Job" : "Enable Job"}
                      tone="red"
                      onClick={() => onToggle(job, nextStatus)}
                      icon={<FiSlash />}
                    />
                    <ActionBtn title="Delete Job" tone="red" onClick={() => onDelete(job)} icon={<FiTrash2 />} />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
