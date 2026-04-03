import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiBriefcase,
  FiCheckCircle,
  FiCopy,
  FiEdit2,
  FiEye,
  FiFileText,
  FiMapPin,
  FiMoreHorizontal,
  FiTrendingUp,
  FiUsers,
  FiX,
} from "react-icons/fi";

import Pagination from "../../components/common/Pagination.jsx";
import Modal from "../../components/common/Modal.jsx";
import { getJobTaxonomy, OTHER_OPTION } from "../../data/jobTaxonomy.js";
import { showSweetConfirm, showSweetToast } from "../../utils/sweetAlert.js";
import {
  closeJob,
  deleteCompanyJob,
  duplicateCompanyJob,
  getCompanyBillingMe,
  getCompanyJob,
  listCompanyJobs,
  updateCompanyJob,
} from "../../services/companyService.js";

const STATUS_STYLES = {
  Active: "border-green-200 bg-green-50 text-green-700",
  Closed: "border-slate-200 bg-slate-100 text-slate-600",
  Draft: "border-blue-200 bg-blue-50 text-[#2563EB]",
  Disabled: "border-red-200 bg-red-50 text-red-600",
};

function Card({ title, right, children }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      {title ? (
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
          <h3 className="text-sm font-semibold text-[#0F172A]">{title}</h3>
          {right}
        </div>
      ) : null}
      <div className="p-4">{children}</div>
    </section>
  );
}

function normalizeJob(raw) {
  const id = raw?._id || raw?.id;
  const skills = Array.isArray(raw?.skills) ? raw.skills : [];
  const salaryText = raw?.salaryMin || raw?.salaryMax ? `${raw?.salaryMin || 0} - ${raw?.salaryMax || 0}` : "-";
  return {
    id,
    title: raw?.title || "Untitled",
    stream: raw?.stream || "",
    category: raw?.category || "",
    location: raw?.location || "-",
    mode: raw?.mode || raw?.workMode || "-",
    postedDate: raw?.createdAt ? new Date(raw.createdAt).toISOString().slice(0, 10) : "-",
    applications: Number(raw?.applicationsCount || 0),
    shortlisted: Number(raw?.shortlistedCount || 0),
    status: raw?.status || "Active",
    deadline: raw?.deadline || "",
    overview: raw?.overview || "",
    responsibilities: raw?.responsibilities || "",
    requirements: raw?.requirements || "",
    skills,
    experience: raw?.experience || "",
    salaryText,
    city: raw?.city || "",
    state: raw?.state || "",
  };
}

function UsageBar({ label, used, limit, color = "blue" }) {
  const safeLimit = Math.max(1, Number(limit) || 1);
  const percent = Math.min(100, Math.round((Number(used || 0) / safeLimit) * 100));
  const bar = color === "orange" ? "bg-[#F97316]" : "bg-[#2563EB]";
  return (
    <div>
      <div className="mb-1 flex justify-between text-xs text-slate-600">
        <span>{label}</span>
        <span>{used}/{limit}</span>
      </div>
      <div className="h-2 rounded-full bg-slate-200">
        <div className={`h-2 rounded-full ${bar}`} style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}

export default function MyJobs() {
  const navigate = useNavigate();

  const [view, setView] = useState("table");
  const [openMenuId, setOpenMenuId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [jobs, setJobs] = useState([]);
  const [subscription, setSubscription] = useState(null);

  const [viewOpen, setViewOpen] = useState(false);
  const [viewJob, setViewJob] = useState(null);
  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({ id: "", title: "", city: "", state: "", workMode: "Hybrid", deadline: "", status: "Active" });
  const [saving, setSaving] = useState(false);

  const [page, setPage] = useState(1);
  const pageSize = 10;

  const [draftFilters, setDraftFilters] = useState({
    q: "",
    status: "All",
    stream: "",
    streamOther: "",
    jobTitle: "",
    location: "",
    mode: "",
    datePosted: "",
  });

  const [filters, setFilters] = useState({
    q: "",
    status: "All",
    stream: "",
    streamOther: "",
    jobTitle: "",
    location: "",
    mode: "",
    datePosted: "",
  });

  const actionToast = (msg) => {
    void showSweetToast(msg, "info", { timer: 1200 });
  };

  async function fetchJobs(nextFilters = filters) {
    setLoading(true);
    setError("");
    try {
      const statusParam = nextFilters.status && nextFilters.status !== "All" ? nextFilters.status : "all";
      const streamParam =
        nextFilters.stream === OTHER_OPTION
          ? nextFilters.streamOther || undefined
          : nextFilters.stream || undefined;
      const [jobsRes, billingRes] = await Promise.all([
        listCompanyJobs({
          status: statusParam,
          title: nextFilters.jobTitle || undefined,
          stream: streamParam,
        }),
        getCompanyBillingMe(),
      ]);

      const items = Array.isArray(jobsRes?.items) ? jobsRes.items : [];
      setJobs(items.map(normalizeJob));
      setSubscription(billingRes?.subscription || null);
    } catch (e) {
      console.error(e);
      setError(e?.response?.data?.message || "Failed to load jobs. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchJobs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.status, filters.jobTitle, filters.stream]);

  const taxonomyMainStreams = useMemo(() => Object.keys(getJobTaxonomy()), []);
  const jobDomainOptions = useMemo(
    () =>
      Array.from(
        new Set([
          ...taxonomyMainStreams,
          ...jobs.map((j) => String(j.stream || j.category || "").trim()).filter(Boolean),
        ])
      ).sort((a, b) => a.localeCompare(b)),
    [jobs, taxonomyMainStreams]
  );
  const knownMainStreams = useMemo(() => new Set(taxonomyMainStreams), [taxonomyMainStreams]);

  const jobTitleOptions = useMemo(
    () => Array.from(new Set(jobs.map((j) => String(j.title || "").trim()).filter(Boolean))).sort((a, b) => a.localeCompare(b)),
    [jobs]
  );
  const filtered = useMemo(() => {
    return jobs.filter((j) => {
      const streamValue = String(j.stream || j.category || "").trim();
      if (filters.q && !`${j.title} ${j.stream} ${j.category} ${j.location}`.toLowerCase().includes(filters.q.toLowerCase())) return false;
      if (filters.status !== "All" && j.status !== filters.status) return false;
      if (filters.stream === OTHER_OPTION) {
        if (filters.streamOther && !streamValue.toLowerCase().includes(String(filters.streamOther || "").toLowerCase())) return false;
        if (!filters.streamOther && knownMainStreams.has(streamValue)) return false;
      } else if (filters.stream && streamValue !== filters.stream) {
        return false;
      }
      if (filters.jobTitle && String(j.title || "") !== filters.jobTitle) return false;
      if (filters.location && !String(j.location || "").toLowerCase().includes(filters.location.toLowerCase())) return false;
      if (filters.mode && j.mode !== filters.mode) return false;
      if (filters.datePosted === "Last 7 days") return j.postedDate >= new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);
      if (filters.datePosted === "Last 30 days") return j.postedDate >= new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
      if (filters.datePosted === "Last 90 days") return j.postedDate >= new Date(Date.now() - 90 * 86400000).toISOString().slice(0, 10);
      return true;
    });
  }, [jobs, filters, knownMainStreams]);

  const summary = useMemo(() => {
    const totalJobs = jobs.length;
    const active = jobs.filter((j) => j.status === "Active").length;
    const drafts = jobs.filter((j) => j.status === "Draft").length;
    const closed = jobs.filter((j) => j.status === "Closed").length;
    const totalApplications = jobs.reduce((sum, j) => sum + (j.applications || 0), 0);
    return { totalJobs, active, drafts, closed, totalApplications };
  }, [jobs]);

  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paged = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page]);

  useEffect(() => {
    if (page > pages) setPage(1);
  }, [pages, page]);

  const applyFilters = () => {
    setFilters(draftFilters);
    setPage(1);
  };

  const updateFilterNow = (key, value) => {
    setDraftFilters((prev) => {
      const next = { ...prev, [key]: value };
      setFilters(next);
      return next;
    });
    setPage(1);
  };

  const clearFilters = () => {
    const reset = { q: "", status: "All", stream: "", streamOther: "", jobTitle: "", location: "", mode: "", datePosted: "" };
    setDraftFilters(reset);
    setFilters(reset);
    setPage(1);
  };

  const applyStreamFilterNow = (value) => {
    setDraftFilters((prev) => {
      const next = {
        ...prev,
        stream: value,
        streamOther: value === OTHER_OPTION ? prev.streamOther : "",
        // Stream is a parent filter; reset dependent job title to avoid stale combinations.
        jobTitle: "",
      };
      setFilters(next);
      return next;
    });
    setPage(1);
  };

  const onCloseJob = async (job) => {
    if (!job?.id) return;
    try {
      await closeJob(job.id);
      setJobs((prev) => prev.map((j) => (j.id === job.id ? { ...j, status: "Closed" } : j)));
      actionToast("Job closed");
    } catch (e) {
      console.error(e);
      actionToast(e?.response?.data?.message || "Failed to close job");
    } finally {
      setOpenMenuId(null);
    }
  };

  const onDisable = async (job) => {
    if (!job?.id) return;
    try {
      await updateCompanyJob(job.id, { status: "Disabled" });
      setJobs((prev) => prev.map((j) => (j.id === job.id ? { ...j, status: "Disabled" } : j)));
      actionToast("Job disabled");
    } catch (e) {
      console.error(e);
      actionToast(e?.response?.data?.message || "Failed to disable job");
    } finally {
      setOpenMenuId(null);
    }
  };

  const onDelete = async (job) => {
    if (!job?.id) return;
    const ok = await showSweetConfirm({
      title: "Delete Job?",
      text: `Delete "${job.title}"?`,
      confirmButtonText: "Delete",
      tone: "warning",
    });
    if (!ok) return;
    try {
      await deleteCompanyJob(job.id);
      setJobs((prev) => prev.filter((j) => j.id !== job.id));
      actionToast("Job deleted");
    } catch (e) {
      console.error(e);
      actionToast(e?.response?.data?.message || "Failed to delete job");
    } finally {
      setOpenMenuId(null);
    }
  };

  const onDuplicate = async (job) => {
    if (!job?.id) return;
    try {
      const res = await duplicateCompanyJob(job.id);
      const copy = normalizeJob(res?.job || {});
      setJobs((prev) => [copy, ...prev]);
      actionToast("Job duplicated as draft");
    } catch (e) {
      console.error(e);
      actionToast(e?.response?.data?.message || "Failed to duplicate job");
    }
  };

  const openView = async (job) => {
    try {
      const res = await getCompanyJob(job.id);
      setViewJob(normalizeJob(res?.job || job));
      setViewOpen(true);
    } catch {
      setViewJob(job);
      setViewOpen(true);
    }
  };

  const openEdit = (job) => {
    setEditForm({
      id: job.id,
      title: job.title || "",
      city: job.city || "",
      state: job.state || "",
      workMode: job.mode === "Onsite" ? "On-site" : job.mode || "Hybrid",
      deadline: job.deadline || "",
      status: job.status || "Active",
    });
    setEditOpen(true);
  };

  const saveEdit = async () => {
    if (!editForm.id) return;
    setSaving(true);
    try {
      await updateCompanyJob(editForm.id, {
        title: editForm.title,
        city: editForm.city,
        state: editForm.state,
        workMode: editForm.workMode,
        deadline: editForm.deadline,
        status: editForm.status,
      });
      await fetchJobs();
      setEditOpen(false);
      actionToast("Job updated");
    } catch (e) {
      console.error(e);
      actionToast(e?.response?.data?.message || "Failed to update job");
    } finally {
      setSaving(false);
    }
  };

  const onExport = () => {
    const header = ["Title", "Stream", "Category", "Location", "Mode", "Posted", "Applications", "Shortlisted", "Status"];
    const rows = filtered.map((j) => [j.title, j.stream, j.category, j.location, j.mode, j.postedDate, j.applications, j.shortlisted, j.status]);
    const csv = [header, ...rows]
      .map((row) => row.map((v) => `"${String(v ?? "").replaceAll('"', '""')}"`).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "company_my_jobs.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  const jobsUsed = Number(subscription?.jobsUsed || summary.active || 0);
  const jobsLimit = Number(subscription?.jobsLimit || 1);
  const appsUsed = Number(subscription?.applicationsUsed || summary.totalApplications || 0);
  const appsLimit = Number(subscription?.applicationsLimit || 100);

  return (
    <div className="space-y-5 pb-24 md:pb-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold text-slate-500">Dashboard {">"} Posted Jobs</p>
          <h1 className="mt-1 text-2xl font-bold text-[#0F172A]">Posted Jobs</h1>
          <p className="mt-1 text-sm text-slate-500">Manage your posted jobs and track applications</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => navigate("/company/post-job")} className="rounded-xl bg-[#2563EB] px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">Post New Job</button>
          <button type="button" onClick={() => navigate("/company/pricing")} className="rounded-xl border border-orange-200 px-4 py-2 text-sm font-semibold text-[#F97316] hover:bg-orange-50">Upgrade Plan</button>
          <button type="button" onClick={onExport} className="rounded-xl border border-blue-200 px-4 py-2 text-sm font-semibold text-[#2563EB] hover:bg-blue-50">Export</button>
        </div>
      </header>

      <section className="grid grid-cols-2 gap-2 md:grid-cols-5">
        {[
          ["Total Jobs", summary.totalJobs, <FiBriefcase key="tj" />],
          ["Active Jobs", summary.active, <FiCheckCircle key="aj" />],
          ["Drafts", summary.drafts, <FiFileText key="dr" />],
          ["Closed Jobs", summary.closed, <FiX key="cl" />],
          ["Total Applications", summary.totalApplications, <FiUsers key="ap" />],
        ].map(([label, value, icon]) => (
          <div key={label} className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
            <div className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-[#2563EB]">{icon}</div>
            <p className="mt-2 text-lg font-bold text-[#0F172A]">{value}</p>
            <p className="text-xs text-slate-500">{label}</p>
          </div>
        ))}
      </section>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_300px]">
        <Card title="Search & Filters">
          <div className="grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-4">
            <input value={draftFilters.q} onChange={(e) => updateFilterNow("q", e.target.value)} placeholder="Search by job title, location..." className="h-10 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-blue-300 xl:col-span-2" />
            <select value={draftFilters.status} onChange={(e) => updateFilterNow("status", e.target.value)} className="h-10 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-blue-300">
              <option>All</option>
              <option>Active</option>
              <option>Draft</option>
              <option>Closed</option>
              <option>Disabled</option>
            </select>
            <input value={draftFilters.location} onChange={(e) => updateFilterNow("location", e.target.value)} placeholder="Location" className="h-10 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-blue-300" />
            <select value={draftFilters.stream} onChange={(e) => applyStreamFilterNow(e.target.value)} className="h-10 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-blue-300">
              <option value="">Main Stream</option>
              {jobDomainOptions.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
              <option value={OTHER_OPTION}>Other</option>
            </select>
            {draftFilters.stream === OTHER_OPTION ? (
              <input
                value={draftFilters.streamOther || ""}
                onChange={(e) => {
                  const value = e.target.value;
                  setDraftFilters((prev) => {
                    const next = { ...prev, streamOther: value };
                    setFilters(next);
                    return next;
                  });
                  setPage(1);
                }}
                placeholder="Other stream (custom)"
                className="h-10 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-blue-300"
              />
            ) : null}
            <select value={draftFilters.jobTitle} onChange={(e) => updateFilterNow("jobTitle", e.target.value)} className="h-10 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-blue-300">
              <option value="">Job Title (Uploaded Jobs)</option>
              {jobTitleOptions.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
            <select value={draftFilters.mode} onChange={(e) => updateFilterNow("mode", e.target.value)} className="h-10 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-blue-300">
              <option value="">Work Mode</option>
              <option>Remote</option>
              <option>Onsite</option>
              <option>Hybrid</option>
            </select>
            <select value={draftFilters.datePosted} onChange={(e) => updateFilterNow("datePosted", e.target.value)} className="h-10 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-blue-300">
              <option value="">Date Posted</option>
              <option>Last 7 days</option>
              <option>Last 30 days</option>
              <option>Last 90 days</option>
            </select>
          </div>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
            <div className="flex gap-2">
              <button type="button" onClick={applyFilters} className="rounded-lg bg-[#2563EB] px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">Apply</button>
              <button type="button" onClick={clearFilters} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">Clear</button>
              <button type="button" onClick={() => fetchJobs(filters)} className="rounded-lg border border-blue-200 px-4 py-2 text-sm font-semibold text-[#2563EB] hover:bg-blue-50">Refresh</button>
            </div>

            <div className="hidden gap-2 md:flex">
              <button type="button" onClick={() => setView("table")} className={`rounded-lg border px-3 py-1.5 text-xs font-semibold ${view === "table" ? "border-blue-200 bg-blue-50 text-[#2563EB]" : "border-slate-200 text-slate-600 hover:bg-slate-50"}`}>Table</button>
              <button type="button" onClick={() => setView("cards")} className={`rounded-lg border px-3 py-1.5 text-xs font-semibold ${view === "cards" ? "border-blue-200 bg-blue-50 text-[#2563EB]" : "border-slate-200 text-slate-600 hover:bg-slate-50"}`}>Cards</button>
            </div>
          </div>

          {error ? <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div> : null}
        </Card>

        <Card title="Plan Usage">
          <div className="space-y-3 text-sm text-slate-700">
            <p className="text-xs text-slate-500">{subscription?.planName || "Starter"} ({subscription?.status || "inactive"})</p>
            <UsageBar label="Jobs used" used={jobsUsed} limit={jobsLimit} color="blue" />
            <UsageBar label="Applications used" used={appsUsed} limit={appsLimit} color="orange" />
            <button type="button" onClick={() => navigate("/company/pricing")} className="w-full rounded-lg bg-[#F97316] px-3 py-2 text-sm font-semibold text-white hover:bg-orange-600">Upgrade Plan</button>
          </div>
        </Card>
      </div>

      {loading ? (
        <Card>
          <div className="text-sm text-slate-600">Loading jobs...</div>
        </Card>
      ) : filtered.length === 0 ? (
        <Card>
          <div className="py-10 text-center">
            <p className="text-lg font-semibold text-[#0F172A]">No jobs found</p>
            <p className="mt-1 text-sm text-slate-500">Try changing filters or post your first job.</p>
            <button type="button" onClick={() => navigate("/company/post-job")} className="mt-3 rounded-xl bg-[#2563EB] px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">Post New Job</button>
          </div>
        </Card>
      ) : (
        <>
          {view === "table" ? (
            <Card title="Your Posted Jobs">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1000px] text-left text-sm">
                  <thead>
                    <tr className="text-slate-500">
                      <th className="pb-2">Job Title</th>
                      <th className="pb-2">Location</th>
                      <th className="pb-2">Work Mode</th>
                      <th className="pb-2">Posted Date</th>
                      <th className="pb-2">Applications</th>
                      <th className="pb-2">Status</th>
                      <th className="pb-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paged.map((job) => (
                      <tr key={job.id} className="border-t border-slate-100 hover:bg-blue-50/40">
                        <td className="py-3 font-semibold text-[#0F172A]">{job.title}</td>
                        <td className="py-3 text-slate-700">{job.location}</td>
                        <td className="py-3 text-slate-700">{job.mode}</td>
                        <td className="py-3 text-slate-600">{job.postedDate}</td>
                        <td className="py-3 font-semibold text-slate-700">{job.applications}</td>
                        <td className="py-3">
                          <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${STATUS_STYLES[job.status] || "border-slate-200 bg-slate-100 text-slate-600"}`}>{job.status}</span>
                        </td>
                        <td className="py-3">
                          <div className="flex items-center gap-1">
                            <button type="button" title="View Job" onClick={() => openView(job)} className="rounded-md border border-blue-200 px-2 py-1 text-xs font-semibold text-[#2563EB] hover:bg-blue-50"><FiEye /></button>
                            <button
                              type="button"
                              title="View Applicants"
                              onClick={() => navigate(`/company/candidates?jobId=${encodeURIComponent(String(job.id || ""))}`)}
                              className="rounded-md border border-blue-200 px-2 py-1 text-xs font-semibold text-[#2563EB] hover:bg-blue-50"
                            >
                              <FiUsers />
                            </button>
                            <button type="button" title="Edit Job" onClick={() => openEdit(job)} className="rounded-md border border-orange-200 px-2 py-1 text-xs font-semibold text-[#F97316] hover:bg-orange-50"><FiEdit2 /></button>
                            <button type="button" title="Duplicate Job" onClick={() => onDuplicate(job)} className="rounded-md border border-slate-200 px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50"><FiCopy /></button>
                            <button type="button" title="Close Job" onClick={() => onCloseJob(job)} disabled={job.status === "Closed"} className={`rounded-md border px-2 py-1 text-xs font-semibold ${job.status === "Closed" ? "border-slate-200 text-slate-300 cursor-not-allowed" : "border-red-200 text-red-600 hover:bg-red-50"}`}><FiX /></button>
                            <button type="button" title="Boost Job" onClick={() => navigate("/company/boost-job")} className="rounded-md bg-[#F97316] px-2 py-1 text-xs font-semibold text-white hover:bg-orange-600"><FiTrendingUp /></button>

                            <div className="relative">
                              <button type="button" title="More" onClick={() => setOpenMenuId((v) => (v === job.id ? null : job.id))} className="rounded-md border border-slate-200 px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50"><FiMoreHorizontal /></button>
                              {openMenuId === job.id ? (
                                <div className="absolute right-0 top-8 z-20 w-44 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg">
                                  <button type="button" onClick={() => onDisable(job)} className="block w-full px-3 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-slate-50">Disable Job</button>
                                  <button type="button" onClick={() => onDelete(job)} className="block w-full px-3 py-2 text-left text-xs font-semibold text-red-600 hover:bg-red-50">Delete Job</button>
                                </div>
                              ) : null}
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {pages > 1 ? <Pagination page={page} pages={pages} onChange={setPage} /> : null}
            </Card>
          ) : null}

          <div className={`grid grid-cols-1 gap-3 md:grid-cols-2 ${view === "cards" ? "" : "md:hidden"}`}>
            {paged.map((job) => (
              <Card key={`card_${job.id}`}>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-[#0F172A]">{job.title}</p>
                    <p className="mt-1 inline-flex items-center gap-1 text-xs text-slate-600"><FiMapPin /> {job.location} • {job.mode}</p>
                  </div>
                  <span className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${STATUS_STYLES[job.status] || "border-slate-200 bg-slate-100 text-slate-600"}`}>{job.status}</span>
                </div>

                <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-slate-600">
                  <p>Applications: <span className="font-semibold text-slate-800">{job.applications}</span></p>
                  <p>Posted: {job.postedDate}</p>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  <button type="button" onClick={() => openView(job)} className="rounded-lg border border-blue-200 px-3 py-1.5 text-xs font-semibold text-[#2563EB] hover:bg-blue-50">View</button>
                  <button type="button" onClick={() => openEdit(job)} className="rounded-lg border border-orange-200 px-3 py-1.5 text-xs font-semibold text-[#F97316] hover:bg-orange-50">Edit</button>
                  <button type="button" onClick={() => onCloseJob(job)} disabled={job.status === "Closed"} className={`rounded-lg border px-3 py-1.5 text-xs font-semibold ${job.status === "Closed" ? "border-slate-200 text-slate-300 cursor-not-allowed" : "border-red-200 text-red-600 hover:bg-red-50"}`}>Close</button>
                  <button type="button" onClick={() => onDuplicate(job)} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50">Duplicate</button>
                </div>
              </Card>
            ))}
          </div>
        </>
      )}

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white p-3 shadow-[0_-8px_24px_rgba(15,23,42,0.08)] md:hidden">
        <button type="button" onClick={() => navigate("/company/post-job")} className="w-full rounded-lg bg-[#2563EB] px-4 py-2 text-sm font-semibold text-white">Post New Job</button>
      </div>

      <Modal
        open={viewOpen}
        onClose={() => setViewOpen(false)}
        title={viewJob?.title || "Job Details"}
        widthClass="max-w-2xl"
        footer={<button type="button" onClick={() => setViewOpen(false)} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">Close</button>}
      >
        {viewJob ? (
          <div className="space-y-3 text-sm text-slate-700">
            <p><span className="font-semibold text-slate-900">Location:</span> {viewJob.location}</p>
            <p><span className="font-semibold text-slate-900">Mode:</span> {viewJob.mode}</p>
            <p><span className="font-semibold text-slate-900">Status:</span> {viewJob.status}</p>
            <p><span className="font-semibold text-slate-900">Applications:</span> {viewJob.applications}</p>
            <p><span className="font-semibold text-slate-900">Shortlisted:</span> {viewJob.shortlisted}</p>
            <p><span className="font-semibold text-slate-900">Experience:</span> {viewJob.experience || "-"}</p>
            <p><span className="font-semibold text-slate-900">Salary:</span> {viewJob.salaryText}</p>
            <p><span className="font-semibold text-slate-900">Overview:</span> {viewJob.overview || "-"}</p>
            <p><span className="font-semibold text-slate-900">Requirements:</span> {viewJob.requirements || "-"}</p>
          </div>
        ) : null}
      </Modal>

      <Modal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        title="Edit Job"
        widthClass="max-w-xl"
        footer={
          <>
            <button type="button" onClick={() => setEditOpen(false)} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">Cancel</button>
            <button type="button" onClick={saveEdit} disabled={saving} className="rounded-lg bg-[#2563EB] px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60">{saving ? "Saving..." : "Save"}</button>
          </>
        }
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <input value={editForm.title} onChange={(e) => setEditForm((p) => ({ ...p, title: e.target.value }))} placeholder="Title" className="h-10 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-blue-300 sm:col-span-2" />
          <input value={editForm.city} onChange={(e) => setEditForm((p) => ({ ...p, city: e.target.value }))} placeholder="City" className="h-10 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-blue-300" />
          <input value={editForm.state} onChange={(e) => setEditForm((p) => ({ ...p, state: e.target.value }))} placeholder="State" className="h-10 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-blue-300" />
          <select value={editForm.workMode} onChange={(e) => setEditForm((p) => ({ ...p, workMode: e.target.value }))} className="h-10 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-blue-300">
            <option>On-site</option>
            <option>Remote</option>
            <option>Hybrid</option>
          </select>
          <input type="date" value={editForm.deadline} onChange={(e) => setEditForm((p) => ({ ...p, deadline: e.target.value }))} className="h-10 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-blue-300" />
          <select value={editForm.status} onChange={(e) => setEditForm((p) => ({ ...p, status: e.target.value }))} className="h-10 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-blue-300 sm:col-span-2">
            <option>Active</option>
            <option>Draft</option>
            <option>Closed</option>
            <option>Disabled</option>
          </select>
        </div>
      </Modal>

    </div>
  );
}

