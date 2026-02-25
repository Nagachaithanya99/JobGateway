// frontend/src/pages/admin/JobDetails.jsx
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  FiArrowLeft,
  FiBriefcase,
  FiCheckCircle,
  FiClock,
  FiMapPin,
  FiTrash2,
  FiXCircle,
  FiLock,
} from "react-icons/fi";

import { adminDeleteJob, adminGetJobDetails, adminToggleJobStatus } from "../../services/adminService";

function badgeClass(v = "") {
  const s = String(v).toLowerCase();
  if (s === "active") return "bg-green-50 text-green-700 border-green-200";
  if (s === "disabled") return "bg-red-50 text-red-700 border-red-200";
  if (s === "closed") return "bg-amber-50 text-amber-700 border-amber-200";
  return "bg-slate-50 text-slate-700 border-slate-200";
}

function Badge({ value }) {
  return (
    <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold capitalize ${badgeClass(value)}`}>
      {String(value || "-")}
    </span>
  );
}

function Stat({ label, value, icon }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
          <p className="mt-2 text-2xl font-bold text-[#0F172A]">{value}</p>
        </div>
        <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-blue-50 text-[#2563EB]">
          {icon}
        </span>
      </div>
    </div>
  );
}

export default function JobDetails() {
  const { id } = useParams();
  const nav = useNavigate();

  const [loading, setLoading] = useState(true);
  const [job, setJob] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function load() {
      setLoading(true);
      setError("");
      try {
        const res = await adminGetJobDetails(id);
        if (!mounted) return;
        setJob(res?.job || res || null);
      } catch (e) {
        if (!mounted) return;
        setError(e?.response?.data?.message || e?.message || "Failed to load job details.");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, [id]);

  const companyName = job?.companyName || job?.company?.companyName || job?.company?.name || "-";
  const location = job?.location || [job?.city, job?.state].filter(Boolean).join(", ") || "-";
  const apps = Number(job?.applications || job?.applicationsCount || 0);

  const actions = useMemo(() => {
    const s = String(job?.status || "").toLowerCase();
    return {
      canDisable: s === "active",
      canEnable: s === "disabled",
      canClose: s !== "closed",
    };
  }, [job?.status]);

  const setStatus = async (next) => {
    if (!job) return;
    setBusy(true);
    setError("");
    try {
      await adminToggleJobStatus(job.id || job._id, next);
      setJob((p) => ({ ...p, status: next }));
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || "Failed to update job status.");
    } finally {
      setBusy(false);
    }
  };

  const onDelete = async () => {
    if (!job) return;
    // simple confirm (no extra component needed)
    // eslint-disable-next-line no-alert
    const ok = window.confirm("Delete this job? This cannot be undone.");
    if (!ok) return;

    setBusy(true);
    setError("");
    try {
      await adminDeleteJob(job.id || job._id);
      nav("/admin/jobs");
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || "Failed to delete job.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <section className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <nav className="text-sm text-slate-500">
            <Link className="hover:text-[#2563EB]" to="/admin">
              Dashboard
            </Link>
            <span className="px-2">&gt;</span>
            <Link className="hover:text-[#2563EB]" to="/admin/jobs">
              Jobs
            </Link>
            <span className="px-2">&gt;</span>
            <span className="font-medium text-slate-700">{job?.title || "Job Details"}</span>
          </nav>

          <button
            type="button"
            onClick={() => nav("/admin/jobs")}
            className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-[#2563EB] hover:underline"
          >
            <FiArrowLeft /> Back to Jobs
          </button>
        </div>
      </section>

      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {error}
        </div>
      ) : null}

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        {loading ? (
          <div className="h-24 animate-pulse rounded-xl bg-slate-100" />
        ) : (
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-[#0F172A]">{job?.title || "-"}</h1>
              <p className="mt-1 text-sm text-slate-600">{companyName}</p>
              <p className="mt-1 inline-flex items-center gap-2 text-sm text-slate-500">
                <FiMapPin className="text-slate-400" /> {location}
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Badge value={job?.status || "active"} />
                {job?.stream ? <span className="rounded-full bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">{job.stream}</span> : null}
                {job?.category ? <span className="rounded-full bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">{job.category}</span> : null}
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={busy || !actions.canDisable}
                onClick={() => setStatus("disabled")}
                className="inline-flex items-center gap-2 rounded-xl border border-red-200 px-3 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-50"
              >
                <FiLock /> Disable
              </button>

              <button
                type="button"
                disabled={busy || !actions.canEnable}
                onClick={() => setStatus("active")}
                className="inline-flex items-center gap-2 rounded-xl bg-[#2563EB] px-3 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
              >
                <FiCheckCircle /> Enable
              </button>

              <button
                type="button"
                disabled={busy || !actions.canClose}
                onClick={() => setStatus("closed")}
                className="inline-flex items-center gap-2 rounded-xl border border-amber-200 px-3 py-2 text-sm font-semibold text-amber-700 transition hover:bg-amber-50 disabled:opacity-50"
              >
                <FiXCircle /> Close
              </button>

              <button
                type="button"
                disabled={busy}
                onClick={onDelete}
                className="inline-flex items-center gap-2 rounded-xl border border-red-200 px-3 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-50"
              >
                <FiTrash2 /> Delete
              </button>
            </div>
          </div>
        )}
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Stat label="Applications" value={apps} icon={<FiBriefcase />} />
        <Stat label="Posted Date" value={job?.createdAt ? String(job.createdAt).slice(0, 10) : "-"} icon={<FiClock />} />
        <Stat label="Salary" value={job?.salaryText || job?.salary || "-"} icon={<FiBriefcase />} />
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-base font-semibold text-[#0F172A]">Overview</h2>
          <p className="mt-2 text-sm text-slate-600 whitespace-pre-wrap">
            {job?.overview || "No overview provided."}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-base font-semibold text-[#0F172A]">Requirements</h2>
          <p className="mt-2 text-sm text-slate-600 whitespace-pre-wrap">
            {job?.requirements || "No requirements provided."}
          </p>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-base font-semibold text-[#0F172A]">Other Details</h2>

        <div className="mt-4 grid grid-cols-1 gap-3 text-sm text-slate-700 md:grid-cols-2 xl:grid-cols-4">
          <p><span className="text-slate-500">Experience:</span> <span className="font-semibold">{job?.experience || "-"}</span></p>
          <p><span className="text-slate-500">Work Mode:</span> <span className="font-semibold">{job?.workMode || job?.mode || "-"}</span></p>
          <p><span className="text-slate-500">Job Type:</span> <span className="font-semibold">{job?.jobType || "-"}</span></p>
          <p><span className="text-slate-500">Deadline:</span> <span className="font-semibold">{job?.deadline || "-"}</span></p>
        </div>

        {Array.isArray(job?.skills) && job.skills.length ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {job.skills.map((s) => (
              <span key={s} className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-[#2563EB]">
                {s}
              </span>
            ))}
          </div>
        ) : null}
      </section>
    </div>
  );
}