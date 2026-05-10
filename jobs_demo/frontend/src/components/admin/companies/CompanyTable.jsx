import { motion as Motion } from "framer-motion";
import ActionMenu from "./ActionMenu";
import StatusBadge from "./StatusBadge";

function companyAvatar(company) {
  if (company?.logoUrl) return company.logoUrl;
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(company?.name || "Company")}&background=DBEAFE&color=2563EB&bold=true`;
}

function metricTone(value) {
  if (value >= 10) return "active";
  if (value >= 5) return "medium";
  return "low";
}

function accountStatus(row) {
  if (row?.isActive === true) return "active";
  if (row?.isActive === false) return "suspended";

  const explicitStatus = String(row?.accountStatus || row?.status || "").trim().toLowerCase();
  if (explicitStatus === "active" || explicitStatus === "true" || explicitStatus === "1") return "active";
  if (explicitStatus === "pending") return "pending";
  return "suspended";
}

export default function CompanyTable({
  rows,
  loading,
  onView,
  onToggleStatus,
  onDelete,
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="hidden overflow-x-auto md:block">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-5 py-3">Company Name</th>
              <th className="px-5 py-3">Category</th>
              <th className="px-5 py-3">Location</th>
              <th className="px-5 py-3">Contact Email</th>
              <th className="px-5 py-3">Active Jobs</th>
              <th className="px-5 py-3">Total Applications</th>
              <th className="px-5 py-3">Plan Type</th>
              <th className="px-5 py-3">Plan Status</th>
              <th className="px-5 py-3">Account Status</th>
              <th className="px-5 py-3 text-right">Actions</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <tr key={i} className="border-t border-slate-100">
                  <td colSpan={10} className="px-5 py-4">
                    <div className="h-4 animate-pulse rounded bg-slate-100" />
                  </td>
                </tr>
              ))
            ) : rows.length ? (
              rows.map((row, idx) => (
                <Motion.tr
                  key={row.id}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: idx * 0.02 }}
                  className="border-t border-slate-100 transition hover:bg-blue-50/50"
                >
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => onView(row)}
                        title={`Open ${row.name || "company"} profile`}
                        aria-label={`Open ${row.name || "company"} profile`}
                        className="rounded-full transition hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:ring-offset-2"
                      >
                        <img
                          src={companyAvatar(row)}
                          alt=""
                          className="h-10 w-10 rounded-full border border-slate-200 object-cover"
                        />
                      </button>
                      <div>
                        <p className="font-semibold text-[#1F2937]">{row.name}</p>
                        <p className="text-xs text-slate-500">{row.websiteLabel || row.tagline || row.website || "-"}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-slate-700">{row.category || "-"}</td>
                  <td className="px-5 py-4 text-slate-700">{row.location || "-"}</td>
                  <td className="px-5 py-4 text-slate-700">{row.email || "-"}</td>
                  <td className="px-5 py-4">
                    <StatusBadge value={metricTone(Number(row.jobs || 0))} type="metric" />
                  </td>
                  <td className="px-5 py-4 font-medium text-slate-700">{row.apps || 0}</td>
                  <td className="px-5 py-4">
                    <StatusBadge value={row.plan?.name || "starter"} type="planType" />
                  </td>
                  <td className="px-5 py-4">
                    <StatusBadge value={row.plan?.status || "active"} type="planStatus" />
                  </td>
                  <td className="px-5 py-4">
                    <StatusBadge value={accountStatus(row)} type="account" />
                  </td>
                  <td className="px-5 py-4">
                    <ActionMenu
                      row={row}
                      onView={() => onView(row)}
                      onToggleStatus={() => onToggleStatus(row)}
                      onDelete={() => onDelete(row)}
                    />
                  </td>
                </Motion.tr>
              ))
            ) : (
              <tr className="border-t border-slate-100">
                <td colSpan={10} className="px-5 py-10 text-center text-sm text-slate-500">
                  No companies found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="space-y-3 p-4 md:hidden">
        {rows.map((row) => (
          <div key={row.id} className="rounded-xl border border-slate-200 p-3">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => onView(row)}
                title={`Open ${row.name || "company"} profile`}
                aria-label={`Open ${row.name || "company"} profile`}
                className="shrink-0 rounded-full transition hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:ring-offset-2"
              >
                <img
                  src={companyAvatar(row)}
                  alt=""
                  className="h-10 w-10 rounded-full border border-slate-200 object-cover"
                />
              </button>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-[#1F2937]">{row.name}</p>
                <p className="truncate text-xs text-slate-500">{row.email}</p>
              </div>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-600">
              <p>Category: {row.category || "-"}</p>
              <p>Location: {row.location || "-"}</p>
              <p>Jobs: {row.jobs || 0}</p>
              <p>Applications: {row.apps || 0}</p>
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              <StatusBadge value={row.plan?.name || "starter"} type="planType" />
              <StatusBadge value={row.plan?.status || "active"} type="planStatus" />
              <StatusBadge value={accountStatus(row)} type="account" />
            </div>

            <div className="mt-3">
              <ActionMenu
                row={row}
                onView={() => onView(row)}
                onToggleStatus={() => onToggleStatus(row)}
                onDelete={() => onDelete(row)}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
