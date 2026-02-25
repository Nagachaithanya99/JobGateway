import { motion } from "framer-motion";
import { FiMail, FiPhoneCall, FiMapPin, FiFileText } from "react-icons/fi";

function StatusPill({ status }) {
  const s = String(status || "").toLowerCase();
  const cls =
    s === "active"
      ? "bg-green-50 border-green-200 text-green-700"
      : "bg-red-50 border-red-200 text-red-700";
  return <span className={`badge ${cls}`}>{status}</span>;
}

function CompletionRing({ value = 0 }) {
  const v = Math.max(0, Math.min(100, Number(value || 0)));
  // simple ring using conic gradient
  return (
    <div className="w-24 h-24 rounded-full p-1"
      style={{
        background: `conic-gradient(var(--brand-500) ${v * 3.6}deg, #e2e8f0 0deg)`,
      }}
    >
      <div className="w-full h-full rounded-full bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-xl font-extrabold">{v}%</div>
          <div className="text-[10px] text-muted font-semibold">Complete</div>
        </div>
      </div>
    </div>
  );
}

export default function StudentOverviewCard({ student }) {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="card p-6">
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
        <div>
          <div className="text-xs text-muted font-semibold">Student</div>
          <div className="text-2xl font-extrabold mt-1">{student?.name}</div>

          <div className="mt-2 flex flex-wrap items-center gap-2">
            <StatusPill status={student?.status} />
            <span className="badge bg-brand-50 border-brand-200 text-brand-700">
              Preferred: {student?.preferred?.stream}
            </span>
          </div>

          <div className="mt-4 grid md:grid-cols-3 gap-3">
            <a className="rounded-2xl border border-slate-200 p-4 hover:bg-slate-50 transition" href={`mailto:${student?.email}`}>
              <FiMail className="text-brand-700" />
              <div className="text-xs text-muted mt-2">Email</div>
              <div className="text-sm font-semibold mt-1 truncate">{student?.email}</div>
            </a>

            <a className="rounded-2xl border border-slate-200 p-4 hover:bg-slate-50 transition" href={`tel:${student?.phone}`}>
              <FiPhoneCall className="text-brand-700" />
              <div className="text-xs text-muted mt-2">Call</div>
              <div className="text-sm font-semibold mt-1 truncate">{student?.phone}</div>
            </a>

            <div className="rounded-2xl border border-slate-200 p-4 bg-white">
              <FiMapPin className="text-brand-700" />
              <div className="text-xs text-muted mt-2">Location</div>
              <div className="text-sm font-semibold mt-1 truncate">{student?.location}</div>
            </div>
          </div>
        </div>

        <div className="w-full lg:w-[360px]">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 flex items-center gap-5">
            <CompletionRing value={student?.completion} />
            <div className="flex-1">
              <div className="text-xs text-muted font-semibold">Profile Completion</div>
              <div className="text-lg font-extrabold mt-1">
                {student?.completion}% Complete
              </div>
              <div className="text-sm text-muted mt-1">
                Required for shortlisting
              </div>

              <a
                href={student?.resumeUrl || "#"}
                className="btn-primary mt-4 px-4 py-2 inline-flex items-center gap-2"
              >
                <FiFileText /> View Resume
              </a>
            </div>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-slate-200 p-4 bg-white">
              <div className="text-xs text-muted font-semibold">Education</div>
              <div className="font-semibold mt-1">{student?.education}</div>
            </div>
            <div className="rounded-2xl border border-slate-200 p-4 bg-white">
              <div className="text-xs text-muted font-semibold">Experience</div>
              <div className="font-semibold mt-1">{student?.experience}</div>
            </div>
          </div>
        </div>
      </div>

      {/* skills */}
      <div className="mt-5">
        <div className="text-sm font-extrabold">Skills</div>
        <div className="mt-3 flex flex-wrap gap-2">
          {(student?.skills || []).map((sk) => (
            <span key={sk} className="badge bg-slate-50 border-slate-200 text-slate-700">
              {sk}
            </span>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
