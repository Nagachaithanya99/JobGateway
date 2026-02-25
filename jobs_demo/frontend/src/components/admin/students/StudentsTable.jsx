import { useMemo } from "react";
import {
  FiCheckCircle,
  FiEye,
  FiMail,
  FiTrash2,
  FiUserX,
  FiXCircle,
} from "react-icons/fi";

function completionStyle(value) {
  const v = Number(value || 0);
  if (v >= 80) return { bar: "bg-green-500", text: "text-green-700" };
  if (v >= 50) return { bar: "bg-[#F97316]", text: "text-[#F97316]" };
  return { bar: "bg-red-500", text: "text-red-600" };
}

function statusMeta(row) {
  const status = String(row?.status || "").toLowerCase();
  const completion = Number(row?.completion || 0);
  if (status === "suspended") {
    return {
      label: "Suspended",
      cls: "bg-red-50 border-red-200 text-red-600",
    };
  }

  if (completion < 80) {
    return {
      label: "Incomplete Profile",
      cls: "bg-amber-50 border-amber-200 text-amber-700",
    };
  }

  return {
    label: "Active",
    cls: "bg-green-50 border-green-200 text-green-700",
  };
}

function ActionButton({ title, tone, icon, onClick }) {
  const toneMap = {
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
      className={`inline-flex h-8 w-8 items-center justify-center rounded-lg border transition ${toneMap[tone]}`}
    >
      {icon}
    </button>
  );
}

function Avatar({ row }) {
  if (row.avatar) {
    return (
      <img
        src={row.avatar}
        alt={row.name}
        className="h-9 w-9 rounded-full border border-slate-200 object-cover"
      />
    );
  }

  return (
    <img
      src={`https://ui-avatars.com/api/?name=${encodeURIComponent(
        row.name || "Student",
      )}&background=DBEAFE&color=2563EB&bold=true`}
      alt={row.name}
      className="h-9 w-9 rounded-full border border-slate-200 object-cover"
    />
  );
}

function CompletionCell({ value }) {
  const v = Math.max(0, Math.min(100, Number(value || 0)));
  const styles = completionStyle(v);

  return (
    <div
      title="Student must complete profile to get shortlisted"
      className="min-w-[180px]"
    >
      <div className="mb-1 flex items-center justify-between text-xs font-semibold">
        <span className={styles.text}>{v}%</span>
        <span className="text-slate-400">Profile</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
        <div
          className={`h-full transition-all duration-500 ${styles.bar}`}
          style={{ width: `${v}%` }}
        />
      </div>
    </div>
  );
}

export default function StudentsTable({
  rows = [],
  selectedIds = [],
  onToggleSelect,
  onToggleSelectAll,
  onView,
  onSuspend,
  onActivate,
  onDelete,
  onSendMail,
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
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Phone</th>
              <th className="px-4 py-3">Main Stream</th>
              <th className="px-4 py-3">Experience Level</th>
              <th className="px-4 py-3">Profile Completion</th>
              <th className="px-4 py-3">Applications</th>
              <th className="px-4 py-3">Account Status</th>
              <th className="px-4 py-3">Registration Date</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>

          <tbody>
            {rows.map((row) => {
              const checked = selectedIds.includes(row.id);
              const status = statusMeta(row);

              return (
                <tr
                  key={row.id}
                  className={`border-t border-slate-100 transition hover:bg-blue-50/40 ${checked ? "bg-blue-50/40" : ""}`}
                >
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
                      <Avatar row={row} />
                      <div>
                        <p className="font-semibold text-slate-800">{row.name}</p>
                        <p className="text-xs text-slate-500">{row.location}</p>
                      </div>
                    </div>
                  </td>

                  <td className="px-4 py-3 text-slate-700">{row.email}</td>
                  <td className="px-4 py-3 text-slate-700">{row.phone || "-"}</td>
                  <td className="px-4 py-3 text-slate-700">{row.preferred?.stream || "-"}</td>
                  <td className="px-4 py-3 text-slate-700">{row.experience || "-"}</td>
                  <td className="px-4 py-3">
                    <CompletionCell value={row.completion} />
                  </td>
                  <td className="px-4 py-3 text-slate-700">
                    {row.applicationsCount ?? row.applications?.length ?? 0}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${status.cls}`}>
                      {status.label}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{row.registrationDate || "-"}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1.5">
                      <ActionButton title="View Profile" tone="blue" icon={<FiEye />} onClick={() => onView(row)} />
                      {String(row.status).toLowerCase() === "active" ? (
                        <ActionButton title="Suspend" tone="red" icon={<FiUserX />} onClick={() => onSuspend(row)} />
                      ) : (
                        <ActionButton title="Activate" tone="green" icon={<FiCheckCircle />} onClick={() => onActivate(row)} />
                      )}
                      <ActionButton title="Send Email" tone="orange" icon={<FiMail />} onClick={() => onSendMail(row)} />
                      <ActionButton title="Delete" tone="redOutline" icon={<FiTrash2 />} onClick={() => onDelete(row)} />
                    </div>
                  </td>
                </tr>
              );
            })}

            {rows.length === 0 ? (
              <tr className="border-t border-slate-100">
                <td colSpan={11} className="px-4 py-12 text-center text-sm text-slate-500">
                  No students found.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <div className="space-y-3 p-4 md:hidden">
        {rows.map((row) => {
          const status = statusMeta(row);

          return (
            <div key={row.id} className="rounded-xl border border-slate-200 p-3">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={selectedIds.includes(row.id)}
                  onChange={(e) => onToggleSelect(row.id, e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-[#2563EB] focus:ring-[#2563EB]"
                />
                <Avatar row={row} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-slate-800">{row.name}</p>
                  <p className="truncate text-xs text-slate-500">{row.email}</p>
                  <p className="truncate text-xs text-slate-500">{row.preferred?.stream || "-"}</p>
                </div>
                <ActionButton title="View Profile" tone="blue" icon={<FiEye />} onClick={() => onView(row)} />
              </div>

              <div className="mt-3">
                <CompletionCell value={row.completion} />
              </div>

              <div className="mt-3 flex items-center justify-between">
                <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${status.cls}`}>
                  {status.label}
                </span>
                <div className="flex items-center gap-1.5">
                  {String(row.status).toLowerCase() === "active" ? (
                    <ActionButton title="Suspend" tone="red" icon={<FiUserX />} onClick={() => onSuspend(row)} />
                  ) : (
                    <ActionButton title="Activate" tone="green" icon={<FiCheckCircle />} onClick={() => onActivate(row)} />
                  )}
                  <ActionButton title="Delete" tone="redOutline" icon={<FiXCircle />} onClick={() => onDelete(row)} />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
