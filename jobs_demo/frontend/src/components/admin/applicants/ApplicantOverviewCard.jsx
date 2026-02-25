import { motion } from "framer-motion";
import { FiMail, FiPhoneCall, FiMapPin, FiFileText } from "react-icons/fi";

function StatusPill({ status }) {
  const v = String(status || "").toLowerCase();
  const cls =
    v === "shortlisted"
      ? "bg-green-50 border-green-200 text-green-700"
      : v === "hold"
      ? "bg-amber-50 border-amber-200 text-amber-700"
      : v === "rejected"
      ? "bg-red-50 border-red-200 text-red-700"
      : "bg-slate-50 border-slate-200 text-slate-700";
  return <span className={`badge ${cls}`}>{status}</span>;
}

export default function ApplicantOverviewCard({ applicant }) {
  const s = applicant?.student;
  const j = applicant?.job;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="card p-6"
    >
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
        <div>
          <div className="text-xs text-muted font-semibold">Applicant</div>
          <div className="text-2xl font-extrabold mt-1">{s?.name || "—"}</div>

          <div className="mt-2 flex flex-wrap gap-2 items-center">
            <StatusPill status={applicant?.status} />
            <span className="badge bg-brand-50 border-brand-200 text-brand-700">
              Profile {s?.profileCompletion ?? 0}%
            </span>
            <span className="badge bg-slate-50 border-slate-200 text-slate-700">
              Applied: {applicant?.appliedAt}
            </span>
          </div>

          <div className="mt-4 grid md:grid-cols-3 gap-3">
            <a className="rounded-2xl border border-slate-200 p-4 hover:bg-slate-50 transition" href={`mailto:${s?.email}`}>
              <FiMail className="text-brand-700" />
              <div className="text-xs text-muted mt-2">Email</div>
              <div className="text-sm font-semibold mt-1 truncate">{s?.email}</div>
            </a>

            <a className="rounded-2xl border border-slate-200 p-4 hover:bg-slate-50 transition" href={`tel:${s?.phone}`}>
              <FiPhoneCall className="text-brand-700" />
              <div className="text-xs text-muted mt-2">Call</div>
              <div className="text-sm font-semibold mt-1 truncate">{s?.phone}</div>
            </a>

            <div className="rounded-2xl border border-slate-200 p-4 bg-white">
              <FiMapPin className="text-brand-700" />
              <div className="text-xs text-muted mt-2">Location</div>
              <div className="text-sm font-semibold mt-1 truncate">{s?.location}</div>
            </div>
          </div>
        </div>

        <div className="w-full lg:w-[340px]">
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="text-xs text-muted font-semibold">Applied For</div>
            <div className="text-lg font-extrabold mt-1">{j?.title || "—"}</div>
            <div className="text-sm text-muted mt-1">
              {j?.companyName} • {j?.location}
            </div>

            <div className="mt-3 text-xs text-muted">
              {j?.stream} • {j?.category} • {j?.subCategory}
            </div>

            <div className="mt-4">
              <a
                href={s?.resumeUrl || "#"}
                className="btn-primary w-full px-4 py-2 flex items-center justify-center gap-2"
              >
                <FiFileText /> View Resume
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Skills */}
      <div className="mt-5">
        <div className="text-sm font-extrabold">Skills</div>
        <div className="mt-3 flex flex-wrap gap-2">
          {(s?.skills || []).map((sk) => (
            <span key={sk} className="badge bg-slate-50 border-slate-200 text-slate-700">
              {sk}
            </span>
          ))}
          {(s?.skills || []).length === 0 ? (
            <div className="text-sm text-muted">No skills listed.</div>
          ) : null}
        </div>
      </div>
    </motion.div>
  );
}
