import { motion } from "framer-motion";

function JobStatus({ status }) {
  const s = String(status || "").toLowerCase();
  const cls =
    s === "active"
      ? "bg-green-50 border-green-200 text-green-700"
      : "bg-slate-50 border-slate-200 text-slate-700";
  return <span className={`badge ${cls}`}>{status}</span>;
}

export default function CompanyJobsTable({ jobs = [] }) {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="card p-0 overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
        <div>
          <div className="font-extrabold">Jobs</div>
          <div className="text-sm text-muted mt-1">Jobs posted by this company</div>
        </div>
        <span className="badge bg-brand-50 border-brand-200 text-brand-700">{jobs.length} jobs</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-[11px] uppercase text-muted">
            <tr className="text-left">
              <th className="px-6 py-3">Title</th>
              <th className="px-6 py-3">Stream</th>
              <th className="px-6 py-3">Location</th>
              <th className="px-6 py-3">Salary</th>
              <th className="px-6 py-3">Apps</th>
              <th className="px-6 py-3">Status</th>
              <th className="px-6 py-3">Created</th>
            </tr>
          </thead>
          <tbody>
            {jobs.map((j) => (
              <tr key={j.id} className="border-t border-slate-100 hover:bg-slate-50/70 transition">
                <td className="px-6 py-4">
                  <div className="font-semibold">{j.title}</div>
                  <div className="text-xs text-muted mt-1">
                    {j.category} • {j.subCategory} • {j.experience}
                  </div>
                </td>
                <td className="px-6 py-4">{j.stream}</td>
                <td className="px-6 py-4">{j.location}</td>
                <td className="px-6 py-4">{j.salary}</td>
                <td className="px-6 py-4 font-semibold">{j.applications}</td>
                <td className="px-6 py-4"><JobStatus status={j.status} /></td>
                <td className="px-6 py-4 text-muted">{j.createdAt}</td>
              </tr>
            ))}

            {jobs.length === 0 && (
              <tr className="border-t border-slate-100">
                <td colSpan={7} className="px-6 py-10 text-center text-muted">
                  No jobs posted yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}
