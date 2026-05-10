import { motion as Motion } from "framer-motion";
import { FiBriefcase, FiEye, FiGlobe, FiMail, FiMapPin, FiPower, FiTrash2, FiUsers } from "react-icons/fi";
import StatusBadge from "./StatusBadge";

function companyAvatar(company) {
  if (company?.logoUrl) return company.logoUrl;
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(company?.name || "Company")}&background=DBEAFE&color=2563EB&bold=true`;
}

function accountStatus(row) {
  if (row?.isActive === true) return "active";
  if (row?.isActive === false) return "suspended";

  const explicitStatus = String(row?.accountStatus || row?.status || "").trim().toLowerCase();
  if (explicitStatus === "active" || explicitStatus === "true" || explicitStatus === "1") return "active";
  if (explicitStatus === "pending") return "pending";
  return "suspended";
}

function toCount(value) {
  const n = Number(value || 0);
  return Number.isFinite(n) ? n : 0;
}

function CompanyMetric({ icon, label, value, tone = "blue" }) {
  const tones = {
    blue: "bg-sky-50 text-sky-700 border-sky-100",
    amber: "bg-orange-50 text-orange-700 border-orange-100",
    slate: "bg-slate-50 text-slate-700 border-slate-100",
  };

  return (
    <div className={`rounded-2xl border px-4 py-3 ${tones[tone] || tones.slate}`}>
      <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wide opacity-80">
        {icon}
        {label}
      </div>
      <p className="mt-2 text-2xl font-black leading-none">{value}</p>
    </div>
  );
}

export default function CompanyCardGrid({ rows, loading, onView, onToggleStatus, onDelete }) {
  if (loading) {
    return (
      <section className="grid grid-cols-1 gap-5 lg:grid-cols-2 2xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="h-72 animate-pulse rounded-3xl border border-slate-200 bg-white shadow-sm" />
        ))}
      </section>
    );
  }

  if (!rows.length) {
    return (
      <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center shadow-sm">
        <p className="text-base font-bold text-slate-800">No companies found</p>
        <p className="mt-2 text-sm text-slate-500">Try changing the search, status, plan, or category filters.</p>
      </div>
    );
  }

  return (
    <section className="grid grid-cols-1 gap-5 lg:grid-cols-2 2xl:grid-cols-3">
      {rows.map((row, index) => {
        const currentStatus = accountStatus(row);
        const isActive = currentStatus === "active";
        const activeJobs = toCount(row.jobs ?? row.jobsCount);
        const applications = toCount(row.apps ?? row.applicationsCount);

        return (
          <Motion.article
            key={row.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.22, delay: index * 0.03 }}
            className="group flex min-h-[390px] flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:border-sky-200 hover:shadow-xl"
          >
            <div className="relative overflow-hidden border-b border-slate-100 bg-gradient-to-br from-white via-sky-50 to-orange-50 p-5">
              <div className="absolute right-5 top-5 h-20 w-20 rounded-full bg-white/70 blur-2xl" />
              <div className="absolute -left-8 -top-8 h-24 w-24 rounded-full bg-sky-100/80 blur-2xl" />

              <div className="relative flex items-start justify-between gap-4">
                <button
                  type="button"
                  onClick={() => onView(row)}
                  title={`Open ${row.name || "company"} profile`}
                  aria-label={`Open ${row.name || "company"} profile`}
                  className="rounded-2xl transition hover:scale-105 focus:outline-none focus:ring-2 focus:ring-sky-300 focus:ring-offset-2"
                >
                  <img
                    src={companyAvatar(row)}
                    alt=""
                    className="h-16 w-16 rounded-2xl border border-white object-cover shadow-md ring-1 ring-slate-200"
                  />
                </button>

                <div className="flex flex-wrap justify-end gap-2">
                  <StatusBadge value={currentStatus} type="account" />
                  <StatusBadge value={row.plan?.status || "inactive"} type="planStatus" />
                </div>
              </div>

              <button
                type="button"
                onClick={() => onView(row)}
                className="relative mt-4 block max-w-full text-left"
              >
                <h3 className="line-clamp-2 text-xl font-black leading-tight tracking-tight text-slate-950">
                  {row.name || "Company"}
                </h3>
                <p className="mt-1 text-sm font-bold text-slate-500">{row.category || "General"}</p>
                <span className="mt-3 inline-flex rounded-full bg-white/80 px-3 py-1 text-xs font-bold text-sky-700 ring-1 ring-sky-100">
                  View profile
                </span>
              </button>
            </div>

            <div className="flex flex-1 flex-col space-y-4 p-5">
              <div className="grid grid-cols-2 gap-3">
                <CompanyMetric icon={<FiBriefcase />} label="Jobs" value={activeJobs} tone="blue" />
                <CompanyMetric icon={<FiUsers />} label="Applications" value={applications} tone="amber" />
              </div>

              <div className="space-y-2.5 rounded-2xl border border-slate-100 bg-white p-4 text-sm text-slate-600 shadow-sm">
                <p className="flex items-center gap-2 truncate">
                  <FiMail className="shrink-0 text-slate-400" />
                  <span className="truncate">{row.email || "-"}</span>
                </p>
                <p className="flex items-center gap-2 truncate">
                  <FiMapPin className="shrink-0 text-slate-400" />
                  <span className="truncate">{row.location || row.address || "-"}</span>
                </p>
                <p className="flex items-center gap-2 truncate">
                  <FiGlobe className="shrink-0 text-slate-400" />
                  <span className="truncate">{row.website || row.websiteLabel || "-"}</span>
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge value={row.plan?.name || "starter"} type="planType" />
                <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-bold text-slate-600">
                  {row.phone || "No phone"}
                </span>
              </div>

              <div className="mt-auto grid grid-cols-3 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => onView(row)}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-sky-200 bg-sky-50 text-sm font-bold text-sky-700 transition hover:-translate-y-0.5 hover:bg-sky-100"
                >
                  <FiEye />
                  View
                </button>
                <button
                  type="button"
                  onClick={() => onToggleStatus(row)}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-orange-200 bg-orange-50 text-sm font-bold text-orange-600 transition hover:-translate-y-0.5 hover:bg-orange-100"
                >
                  <FiPower />
                  {isActive ? "Suspend" : "Activate"}
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(row)}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 text-sm font-bold text-red-600 transition hover:-translate-y-0.5 hover:bg-red-100"
                >
                  <FiTrash2 />
                  Delete
                </button>
              </div>
            </div>
          </Motion.article>
        );
      })}
    </section>
  );
}
