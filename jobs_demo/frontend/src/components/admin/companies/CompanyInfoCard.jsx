import { motion } from "framer-motion";
import { FiGlobe, FiMail, FiPhoneCall, FiMapPin } from "react-icons/fi";

function StatusPill({ status }) {
  const s = String(status || "").toLowerCase();
  const cls =
    s === "active"
      ? "bg-green-50 border-green-200 text-green-700"
      : "bg-red-50 border-red-200 text-red-700";
  const label = s === "active" ? "Active" : "Suspended";
  return <span className={`badge ${cls}`}>{label}</span>;
}

export default function CompanyInfoCard({ company }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="card p-6"
    >
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
        <div>
          <div className="text-xs text-muted font-semibold">Company</div>
          <div className="text-2xl font-extrabold mt-1">{company?.name}</div>
          <div className="text-sm text-muted mt-2">
            {company?.category} • {company?.location}
          </div>
          <div className="text-sm text-muted mt-2 flex items-center gap-2">
            <FiMapPin /> {company?.address || "—"}
          </div>
        </div>

        <div className="flex flex-wrap gap-2 items-center">
          <StatusPill status={company?.status} />
          <span className="badge bg-brand-50 border-brand-200 text-brand-700">
            Plan: {company?.plan?.name || "No Plan"}
          </span>

          <a className="btn-ghost px-4 py-2" href={company?.website} target="_blank" rel="noreferrer">
            <FiGlobe className="mr-2" /> Website
          </a>
          <a className="btn-ghost px-4 py-2" href={`mailto:${company?.email}`}>
            <FiMail className="mr-2" /> Email
          </a>
          <a className="btn-ghost px-4 py-2" href={`tel:${company?.phone}`}>
            <FiPhoneCall className="mr-2" /> Call
          </a>
        </div>
      </div>

      {/* HR card */}
      <div className="mt-5 grid md:grid-cols-3 gap-3">
        <div className="rounded-2xl border border-slate-200 p-4 bg-white">
          <div className="text-xs text-muted font-semibold">HR Name</div>
          <div className="font-semibold mt-1">{company?.hrName || "—"}</div>
        </div>
        <div className="rounded-2xl border border-slate-200 p-4 bg-white">
          <div className="text-xs text-muted font-semibold">HR Phone</div>
          <div className="font-semibold mt-1">{company?.hrPhone || "—"}</div>
        </div>
        <div className="rounded-2xl border border-slate-200 p-4 bg-white">
          <div className="text-xs text-muted font-semibold">HR Email</div>
          <div className="font-semibold mt-1">{company?.hrEmail || "—"}</div>
        </div>
      </div>
    </motion.div>
  );
}
