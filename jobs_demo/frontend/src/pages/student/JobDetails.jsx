import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { FiBookmark, FiBriefcase, FiCheckCircle, FiClock, FiExternalLink, FiMapPin, FiMessageCircle, FiPhone } from "react-icons/fi";
import Modal from "../../components/common/Modal";
import useAuth from "../../hooks/useAuth.js";
import { jobsGetById } from "../../services/jobsService.js";
import { studentApplyJob, studentGetSavedJobs, studentMe, studentMyApplications, studentSearchJobs, studentToggleSaveJob } from "../../services/studentService.js";
import { toAbsoluteMediaUrl } from "../../utils/media.js";

function initials(name = "") {
  return name.split(" ").filter(Boolean).slice(0, 2).map((x) => x[0]).join("").toUpperCase();
}

function postedAgo(createdAt) {
  if (!createdAt) return "";
  const d = new Date(createdAt);
  const ms = Date.now() - d.getTime();
  const mins = Math.floor(ms / 60000);
  if (mins < 60) return `${mins} mins ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hours ago`;
  return `${Math.floor(hrs / 24)} days ago`;
}

function salaryText(job) {
  if (!job) return "-";
  if (job.showSalary === false) return "Compensation not disclosed";
  if (job.salaryText) return job.salaryText;
  const min = Number(job.salaryMin || 0);
  const max = Number(job.salaryMax || 0);
  if (min || max) return `₹${min || ""} - ₹${max || ""}/mo`;
  return "-";
}

function normalizeArray(x) {
  if (Array.isArray(x)) return x.filter(Boolean);
  if (typeof x === "string") return x.split("\n").map((s) => s.trim()).filter(Boolean);
  return [];
}

function readProfileCompletion(payload) {
  const data = payload?.data ?? payload ?? {};
  const n = Number(data?.profileCompletion ?? data?.studentProfile?.profileCompletion ?? 0);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(100, Math.round(n)));
}

export default function JobDetails() {
  const { id } = useParams();
  const { isAuthed, role } = useAuth();
  const location = useLocation();
  const nav = useNavigate();
  const isStudentView = location.pathname.startsWith("/student");
  const withBase = (path) => `${isStudentView ? "/student" : ""}${path}`;
  const redirectToLogin = () => {
    const redirect = isStudentView
      ? `${location.pathname}${location.search || ""}`
      : `/student${location.pathname === "/" ? "" : location.pathname}${location.search || ""}`;
    if (isStudentView) {
      nav("/student/login");
      return;
    }
    nav(`/login?role=student&redirect=${encodeURIComponent(redirect)}`);
  };

  const [job, setJob] = useState(null);
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [saved, setSaved] = useState(false);
  const [saveBusy, setSaveBusy] = useState(false);
  const [alreadyApplied, setAlreadyApplied] = useState(false);
  const [profileCompletion, setProfileCompletion] = useState(0);
  const [checkingProfile, setCheckingProfile] = useState(false);
  const [applyModalOpen, setApplyModalOpen] = useState(false);
  const [incompleteModalOpen, setIncompleteModalOpen] = useState(false);
  const [successModalOpen, setSuccessModalOpen] = useState(false);
  const [successModalTitle, setSuccessModalTitle] = useState("Application Submitted");
  const [successMessage, setSuccessMessage] = useState("Application submitted successfully.");

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        setErr("");
        const data = await jobsGetById(id);
        if (!mounted) return;
        setJob(data);
      } catch (e) {
        if (mounted) setErr(e?.response?.data?.message || "Failed to load job details.");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [id]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const [savedRes, appRes, meRes] = await Promise.all([
          studentGetSavedJobs(),
          studentMyApplications({ page: 1, limit: 200 }),
          studentMe(),
        ]);
        if (!mounted) return;
        const savedRows = Array.isArray(savedRes?.data) ? savedRes.data : [];
        setSaved(savedRows.some((x) => String(x?._id || x?.id) === String(id)));
        const appRows = Array.isArray(appRes?.data?.items) ? appRes.data.items : [];
        setAlreadyApplied(appRows.some((x) => String(x?.jobId || x?.job?._id || x?.job) === String(id)));
        setProfileCompletion(readProfileCompletion(meRes));
      } catch {
        if (!mounted) return;
        setSaved(false);
        setAlreadyApplied(false);
      }
    })();
    return () => { mounted = false; };
  }, [id]);

  useEffect(() => {
    if (!job) return;
    let mounted = true;
    (async () => {
      try {
        const res = await studentSearchJobs({ stream: job?.stream || undefined, category: job?.category || undefined, page: 1, limit: 8 });
        const rows = Array.isArray(res?.data?.items) ? res.data.items : [];
        if (mounted) setRelated(rows.filter((x) => String(x?._id || x?.id) !== String(id)));
      } catch {
        if (mounted) setRelated([]);
      }
    })();
    return () => { mounted = false; };
  }, [job, id]);

  const companyName = job?.companyName || job?.company?.name || "";
  const companyLogo = toAbsoluteMediaUrl(job?.companyLogo || job?.logoUrl || job?.company?.logoUrl || "");
  const jobLocation = job?.location || [job?.city, job?.state].filter(Boolean).join(", ") || "Not provided";
  const responsibilities = normalizeArray(job?.responsibilities);
  const requirements = normalizeArray(job?.requirements);
  const skills = normalizeArray(job?.skills);
  const jobTitle = job?.title || "Job";
  const companyPhone = job?.companyPhone || job?.company?.phone || "";
  const companyWebsite = job?.companyWebsite || job?.company?.website || "";
  const companyEmail = job?.companyEmail || job?.company?.email || "";

  const ensureLatestCompletion = async () => {
    try {
      setCheckingProfile(true);
      const meRes = await studentMe();
      const value = readProfileCompletion(meRes);
      setProfileCompletion(value);
      return value;
    } catch {
      return profileCompletion;
    } finally {
      setCheckingProfile(false);
    }
  };

  const onApplyNow = async () => {
    if (!isAuthed || role !== "student") {
      redirectToLogin();
      return;
    }
    if (alreadyApplied) {
      setSuccessModalTitle("Already Applied");
      setSuccessMessage("You have already applied for this job.");
      setSuccessModalOpen(true);
      return;
    }
    const completion = await ensureLatestCompletion();
    if (completion < 100) {
      setIncompleteModalOpen(true);
      return;
    }
    setApplyModalOpen(true);
  };

  const confirmApply = async () => {
    try {
      setApplyModalOpen(false);
      const res = await studentApplyJob(job);
      const alreadyExists = !!res?.data?.alreadyApplied;
      setAlreadyApplied(true);
      setSuccessModalTitle(alreadyExists ? "Already Applied" : "Application Submitted");
      setSuccessMessage(alreadyExists ? "You have already applied for this job." : "Application submitted successfully.");
      setSuccessModalOpen(true);
    } catch (e) {
      const status = Number(e?.response?.status || 0);
      if (status === 401 || status === 403) {
        redirectToLogin();
        return;
      }
      if (e?.response?.data?.profileIncomplete) {
        setProfileCompletion(readProfileCompletion(e?.response));
        setIncompleteModalOpen(true);
        return;
      }
      if (e?.response?.data?.alreadyApplied) {
        setAlreadyApplied(true);
        setSuccessModalTitle("Already Applied");
        setSuccessMessage("You have already applied for this job.");
        setSuccessModalOpen(true);
        return;
      }
      const msg = e?.response?.data?.message || "Apply failed.";
      setErr(msg);
    }
  };

  const toggleSave = async () => {
    if (!isAuthed || role !== "student") {
      redirectToLogin();
      return;
    }
    try {
      setSaveBusy(true);
      const res = await studentToggleSaveJob(id);
      setSaved(!!res?.data?.saved);
    } catch (e) {
      setErr(e?.response?.data?.message || "Failed to save.");
    } finally {
      setSaveBusy(false);
    }
  };

  if (loading) return <div className="w-full p-6">Loading job details...</div>;
  if (!job) return <div className="w-full p-6">{err || "Job not found"}</div>;

  return (
    <div className="w-full px-4 py-6">
      <div className="text-xs text-slate-500"><Link to={withBase("/")}>Home</Link> / <Link to={withBase("/jobs")}>Jobs</Link> / {job.title}</div>
      <div className="mt-3 rounded-3xl border border-slate-200 bg-white p-5">
        <div className="flex items-start gap-3">
          {companyLogo ? (
            <img src={companyLogo} alt={companyName || "Company"} className="h-12 w-12 rounded-2xl object-cover" />
          ) : (
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-100 font-extrabold text-orange-600">{initials(companyName || "Job")}</div>
          )}
          <div className="flex-1">
            <h1 className="text-2xl font-extrabold">{job.title}</h1>
            <p className="text-sm text-slate-600">{companyName || "Company not provided"}</p>
            <p className="mt-1 text-sm text-slate-600 inline-flex items-center gap-2"><FiMapPin />{jobLocation}</p>
            <p className="mt-1 text-sm font-bold text-emerald-700">{salaryText(job)}</p>
            <p className="mt-1 text-xs text-slate-500 inline-flex items-center gap-1"><FiClock />{postedAgo(job.createdAt)}</p>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <button type="button" onClick={onApplyNow} disabled={checkingProfile} className="rounded-full bg-orange-500 px-5 py-2 text-sm font-extrabold text-white disabled:opacity-60">{alreadyApplied ? "Already Applied" : "Apply Now"}</button>
          <button type="button" onClick={toggleSave} disabled={saveBusy} className="rounded-full border border-slate-200 px-5 py-2 text-sm font-extrabold text-slate-700 disabled:opacity-60 inline-flex items-center gap-2"><FiBookmark />{saved ? "Saved" : "Save"}</button>
          {companyPhone ? <a href={`tel:${companyPhone}`} className="rounded-full border border-blue-200 bg-blue-50 px-5 py-2 text-sm font-extrabold text-blue-700 inline-flex items-center gap-2"><FiPhone />Call HR</a> : null}
          {companyPhone ? <a href={`https://wa.me/${companyPhone.replace(/\D/g, "")}`} className="rounded-full border border-emerald-200 bg-emerald-50 px-5 py-2 text-sm font-extrabold text-emerald-700 inline-flex items-center gap-2"><FiMessageCircle />WhatsApp HR</a> : null}
        </div>
        {err ? <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{err}</div> : null}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-4">
          <section className="rounded-3xl border border-slate-200 bg-white p-5">
            <h2 className="text-lg font-extrabold">Job Description</h2>
            <p className="mt-2 text-sm text-slate-700">{job?.description || job?.overview || "No description provided."}</p>
            {responsibilities.length ? <ul className="mt-4 space-y-2 text-sm text-slate-700">{responsibilities.map((t, i) => <li key={i} className="flex gap-2"><FiCheckCircle className="mt-0.5 text-orange-500" />{t}</li>)}</ul> : null}
          </section>
          <section className="rounded-3xl border border-slate-200 bg-white p-5">
            <h2 className="text-lg font-extrabold">Skills & Requirements</h2>
            {skills.length ? <div className="mt-3 flex flex-wrap gap-2">{skills.map((s) => <span key={s} className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">{s}</span>)}</div> : <p className="mt-2 text-sm text-slate-600">No skills listed.</p>}
            {requirements.length ? <ul className="mt-4 space-y-2 text-sm text-slate-700">{requirements.map((t, i) => <li key={i}>• {t}</li>)}</ul> : null}
          </section>
        </div>
        <aside className="space-y-4">
          <section className="rounded-3xl border border-slate-200 bg-white p-4">
            <h3 className="text-sm font-extrabold">About Company</h3>
            <p className="mt-2 text-sm font-semibold">{companyName || "Not provided"}</p>
            <p className="mt-1 text-xs text-slate-600">{jobLocation}</p>
            {companyEmail ? <p className="mt-2 text-xs text-slate-600">{companyEmail}</p> : null}
            {companyWebsite ? <a href={companyWebsite.startsWith("http") ? companyWebsite : `https://${companyWebsite}`} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-blue-700">Visit Website <FiExternalLink /></a> : null}
          </section>
          {related.length ? (
            <section className="rounded-3xl border border-slate-200 bg-white p-4">
              <h3 className="text-sm font-extrabold">Similar Jobs</h3>
              <div className="mt-3 space-y-2">
                {related.slice(0, 4).map((r) => (
                  <Link key={String(r?._id || r?.id)} to={withBase(`/jobs/${String(r?._id || r?.id)}`)} className="block rounded-xl border border-slate-200 p-3 hover:bg-slate-50">
                    <p className="text-sm font-bold">{r?.title || "Job"}</p>
                    <p className="text-xs text-slate-600">{r?.location || r?.city || "Not provided"}</p>
                    <p className="text-xs font-bold text-slate-700">{salaryText(r)}</p>
                  </Link>
                ))}
              </div>
            </section>
          ) : null}
        </aside>
      </div>

      <Modal open={applyModalOpen} onClose={() => setApplyModalOpen(false)} title="Confirm Application" footer={<><button type="button" onClick={() => setApplyModalOpen(false)} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600">Cancel</button><button type="button" onClick={confirmApply} className="rounded-lg bg-[#2563EB] px-4 py-2 text-sm font-semibold text-white">Confirm Apply</button></>}>
        <p className="text-sm text-slate-600">We will use your profile for <span className="font-semibold">{jobTitle}</span>.</p>
      </Modal>

      <Modal open={incompleteModalOpen} onClose={() => setIncompleteModalOpen(false)} title="Complete your profile before applying" footer={<><button type="button" onClick={() => setIncompleteModalOpen(false)} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600">Close</button><Link to="/student/profile" className="rounded-lg bg-[#2563EB] px-4 py-2 text-sm font-semibold text-white">Complete Profile</Link></>}>
        <div className="rounded-xl border border-orange-200 bg-orange-50 p-3 text-sm text-[#9A3412]">Your profile completion is {profileCompletion}%.</div>
      </Modal>

      <Modal open={successModalOpen} onClose={() => setSuccessModalOpen(false)} title={successModalTitle} footer={<button type="button" onClick={() => setSuccessModalOpen(false)} className="rounded-lg bg-[#2563EB] px-4 py-2 text-sm font-semibold text-white">Done</button>}>
        <div className="inline-flex items-center gap-2 text-sm text-slate-700"><FiCheckCircle className="text-green-600" />{successMessage}</div>
      </Modal>
    </div>
  );
}

