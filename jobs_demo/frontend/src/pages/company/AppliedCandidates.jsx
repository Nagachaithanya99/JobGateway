import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  FiArrowRight,
  FiCheckCircle,
  FiDownload,
  FiEye,
  FiFileText,
  FiMail,
  FiMapPin,
  FiMessageCircle,
  FiMoreHorizontal,
  FiPhone,
  FiRefreshCw,
  FiSearch,
  FiStar,
  FiUsers,
  FiX,
} from "react-icons/fi";

import Pagination from "../../components/common/Pagination.jsx";
import ResumePreviewModal from "../../components/common/ResumePreviewModal.jsx";
import ActionMenuPortal from "../../components/common/ActionMenuPortal.jsx";
import {
  bulkUpdateApplicationStatus,
  deleteCompanyApplication,
  getCompanyApplications,
  listCompanyJobs,
  updateApplicationStatus,
} from "../../services/companyService.js";
import { createCompanyThread } from "../../services/messagesService.js";
import { showSweetConfirm, showSweetToast } from "../../utils/sweetAlert.js";

const STATUS_STYLES = {
  Applied: "border-blue-200 bg-blue-50 text-[#2563EB]",
  Shortlisted: "border-green-200 bg-green-50 text-green-700",
  Hold: "border-orange-200 bg-orange-50 text-[#F97316]",
  Rejected: "border-red-200 bg-red-50 text-red-600",
  "Interview Scheduled": "border-indigo-200 bg-indigo-50 text-indigo-700",
  "Interview Completed": "border-violet-200 bg-violet-50 text-violet-700",
  "Offer Sent": "border-orange-200 bg-orange-50 text-[#F97316]",
  Hired: "border-emerald-200 bg-emerald-50 text-emerald-700",
};

const MATCH_STYLES = {
  Strong: "border-green-200 bg-green-50 text-green-700",
  Moderate: "border-orange-200 bg-orange-50 text-[#F97316]",
  Low: "border-slate-200 bg-slate-100 text-slate-600",
};

const QUICK_CHIPS = ["New", "Strong Match", "Interview Pending", "Needs Review", "High Experience"];
const SHORTLIST_READY_STATUSES = new Set([
  "Shortlisted",
  "Interview Scheduled",
  "Interview Completed",
  "Offer Sent",
  "Hired",
]);

function initials(name = "") {
  return String(name || "Candidate")
    .trim()
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("");
}

function CandidateAvatar({ app, size = "h-10 w-10" }) {
  const src = app?.avatarUrl || app?.avatar || app?.profileImageUrl || "";
  if (src) {
    return <img src={src} alt={app?.name || "Candidate"} className={`${size} rounded-full border border-slate-200 object-cover`} />;
  }
  return (
    <span className={`${size} inline-flex items-center justify-center rounded-full bg-blue-50 text-xs font-bold text-[#2563EB]`}>
      {initials(app?.name) || "C"}
    </span>
  );
}

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

function normalizeApp(item) {
  const skills = Array.isArray(item?.skills || item?.topSkills) ? item.skills || item.topSkills : [];
  const exp = String(item?.exp || item?.experience || "").trim();
  return {
    id: item?.id || item?._id || "",
    jobId: item?.jobId || item?.job?._id || "",
    name: item?.name || item?.candidateName || "Candidate",
    job: item?.job || item?.jobTitle || "-",
    exp,
    location: item?.location || "-",
    skills,
    appliedDate: String(item?.date || item?.appliedDate || item?.createdAt || "").slice(0, 10),
    status: item?.status || "Applied",
    stage: item?.stage || "HR Round",
    match: item?.match || item?.aiMatch || "Moderate",
    resumeUrl: item?.resumeUrl || item?.resume || "",
    avatar: item?.avatar || item?.avatarUrl || item?.profileImageUrl || "",
    avatarUrl: item?.avatarUrl || item?.avatar || item?.profileImageUrl || "",
    phone: item?.phone || "",
    email: item?.email || "",
    notes: Array.isArray(item?.notes) ? item.notes : [],
  };
}

function parseExpYears(value = "") {
  const numbers = String(value)
    .match(/\d+(\.\d+)?/g)
    ?.map(Number)
    .filter(Number.isFinite);
  return numbers?.length ? Math.max(...numbers) : 0;
}

function formatExp(exp = "") {
  if (!String(exp || "").trim()) return "-";
  if (/\byear/i.test(String(exp))) return String(exp);
  return `${String(exp).trim()} yrs`;
}

function onlyDigits(value = "") {
  return String(value).replace(/\D/g, "");
}

function isShortlistReady(status = "") {
  return SHORTLIST_READY_STATUSES.has(String(status || ""));
}

export default function AppliedCandidates() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialJobId = String(searchParams.get("jobId") || "").trim();

  const [apps, setApps] = useState([]);
  const [jobOptions, setJobOptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadErr, setLoadErr] = useState("");
  const [view, setView] = useState("table");
  const [selectedIds, setSelectedIds] = useState([]);
  const [chip, setChip] = useState("");
  const [msgBusyId, setMsgBusyId] = useState("");
  const [page, setPage] = useState(1);
  const [menuState, setMenuState] = useState({ id: "", anchor: null });
  const [profileDrawer, setProfileDrawer] = useState({ open: false, app: null });
  const [resumePreview, setResumePreview] = useState({ open: false, name: "", url: "" });

  const [draftFilters, setDraftFilters] = useState({
    q: "",
    jobId: initialJobId,
    status: "All",
    experience: "",
    location: "",
    skills: "",
    dateRange: "",
    aiMatch: "All",
  });
  const [filters, setFilters] = useState({
    q: "",
    jobId: initialJobId,
    status: "All",
    experience: "",
    location: "",
    skills: "",
    dateRange: "",
    aiMatch: "All",
  });

  const pageSize = view === "cards" ? 9 : 10;

  const notify = (message, type = "info") => {
    void showSweetToast(message, type, { timer: 1400 });
  };

  const closeMenu = () => {
    setMenuState({ id: "", anchor: null });
  };

  const fetchApps = async (activeFilters = filters) => {
    try {
      setLoading(true);
      setLoadErr("");
      const res = await getCompanyApplications({
        q: activeFilters.q || undefined,
        jobId: activeFilters.jobId || undefined,
        status: activeFilters.status || undefined,
        location: activeFilters.location || undefined,
        skills: activeFilters.skills || undefined,
      });
      const items = Array.isArray(res?.items) ? res.items : Array.isArray(res) ? res : [];
      setApps(items.map(normalizeApp));
    } catch (error) {
      setLoadErr(error?.response?.data?.message || "Failed to load applications");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApps(filters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const res = await listCompanyJobs({ status: "all" });
        const rows = Array.isArray(res?.items) ? res.items : [];
        if (!mounted) return;
        setJobOptions(
          rows
            .map((job) => ({
              id: String(job?._id || job?.id || "").trim(),
              title: String(job?.title || "").trim(),
            }))
            .filter((job) => job.id && job.title)
        );
      } catch {
        if (mounted) setJobOptions([]);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const kpi = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return {
      total: apps.length,
      newToday: apps.filter((app) => app.appliedDate === today).length,
      shortlisted: apps.filter((app) => isShortlistReady(app.status)).length,
      hold: apps.filter((app) => app.status === "Hold").length,
      rejected: apps.filter((app) => app.status === "Rejected").length,
    };
  }, [apps]);

  const filtered = useMemo(() => {
    return apps.filter((app) => {
      const haystack = `${app.name} ${app.job} ${app.location} ${app.email} ${app.phone} ${app.skills.join(" ")}`.toLowerCase();
      const expYears = parseExpYears(app.exp);

      if (filters.q && !haystack.includes(filters.q.toLowerCase())) return false;
      if (filters.jobId && String(app.jobId || "") !== String(filters.jobId)) return false;
      if (filters.status !== "All" && app.status !== filters.status) return false;
      if (filters.location && !String(app.location || "").toLowerCase().includes(filters.location.toLowerCase())) return false;
      if (filters.skills && !app.skills.join(" ").toLowerCase().includes(filters.skills.toLowerCase())) return false;
      if (filters.aiMatch !== "All" && app.match !== filters.aiMatch) return false;

      if (filters.experience === "0-1" && expYears > 1) return false;
      if (filters.experience === "2-4" && (expYears < 2 || expYears > 4)) return false;
      if (filters.experience === "5+" && expYears < 5) return false;

      if (filters.dateRange) {
        const appDate = Date.parse(app.appliedDate || "");
        if (Number.isFinite(appDate)) {
          const days = Math.floor((Date.now() - appDate) / 86400000);
          if (filters.dateRange === "last7" && days > 7) return false;
          if (filters.dateRange === "last30" && days > 30) return false;
          if (filters.dateRange === "last90" && days > 90) return false;
        }
      }

      if (chip === "Strong Match" && app.match !== "Strong") return false;
      if (chip === "Needs Review" && app.status !== "Applied") return false;
      if (chip === "Interview Pending" && !isShortlistReady(app.status)) return false;
      if (chip === "High Experience" && expYears < 3) return false;
      if (chip === "New") {
        const today = new Date().toISOString().slice(0, 10);
        if (app.appliedDate !== today) return false;
      }

      return true;
    });
  }, [apps, chip, filters]);

  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paged = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page, pageSize]);

  useEffect(() => {
    if (page > pages) setPage(1);
  }, [page, pages]);

  const applyFilters = async () => {
    setFilters(draftFilters);
    setPage(1);
    setSelectedIds([]);
    await fetchApps(draftFilters);
  };

  const updateFilterNow = async (key, value) => {
    const next = { ...draftFilters, [key]: value };
    setDraftFilters(next);
    setFilters(next);
    setPage(1);
    setSelectedIds([]);
    await fetchApps(next);
  };

  const clearFilters = async () => {
    const reset = {
      q: "",
      jobId: "",
      status: "All",
      experience: "",
      location: "",
      skills: "",
      dateRange: "",
      aiMatch: "All",
    };
    setDraftFilters(reset);
    setFilters(reset);
    setChip("");
    setPage(1);
    setSelectedIds([]);
    await fetchApps(reset);
  };

  const refresh = async () => {
    await fetchApps(filters);
  };

  const toggleSelect = (id) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((value) => value !== id) : [...prev, id]));
  };

  const toggleAll = () => {
    if (!filtered.length) return;
    setSelectedIds((prev) => (prev.length === filtered.length ? [] : filtered.map((app) => app.id)));
  };

  const openRowMenu = (event, app) => {
    const anchor = event.currentTarget.getBoundingClientRect();
    setMenuState((prev) =>
      prev.id === app.id
        ? { id: "", anchor: null }
        : {
            id: app.id,
            anchor,
          }
    );
  };

  const openShortlistedPage = () => {
    navigate("/company/shortlisted");
  };

  const setStatus = async (id, status) => {
    setApps((prev) => prev.map((app) => (app.id === id ? { ...app, status } : app)));
    closeMenu();
    try {
      await updateApplicationStatus(id, status);
      notify(`Candidate moved to ${status}`);
    } catch (error) {
      notify(error?.response?.data?.message || "Failed to update status", "error");
      await fetchApps(filters);
    }
  };

  const bulkUpdate = async (status) => {
    if (!selectedIds.length) return;
    setApps((prev) => prev.map((app) => (selectedIds.includes(app.id) ? { ...app, status } : app)));
    try {
      await bulkUpdateApplicationStatus(selectedIds, status);
      setSelectedIds([]);
      notify(`Updated ${status} for selected candidates`);
    } catch (error) {
      notify(error?.response?.data?.message || "Bulk update failed", "error");
      await fetchApps(filters);
    }
  };

  const removeApplication = async (app) => {
    if (!app?.id) return;
    const confirmed = await showSweetConfirm({
      title: "Delete application?",
      text: `Delete ${app.name}'s application for ${app.job}?`,
      confirmButtonText: "Delete",
      tone: "warning",
    });
    if (!confirmed) return;

    try {
      await deleteCompanyApplication(app.id);
      setApps((prev) => prev.filter((row) => row.id !== app.id));
      setSelectedIds((prev) => prev.filter((id) => id !== app.id));
      closeMenu();
      notify("Application deleted");
    } catch (error) {
      notify(error?.response?.data?.message || "Failed to delete application", "error");
      await fetchApps(filters);
    }
  };

  const openMessages = async (app) => {
    if (!app?.id) return notify("Missing application id", "error");
    try {
      setMsgBusyId(app.id);
      const res = await createCompanyThread({ applicationId: app.id });
      const threadId = res?.thread?.id;
      if (!threadId) throw new Error("Thread not created");
      navigate(`/company/messages?thread=${threadId}`);
    } catch (error) {
      notify(error?.response?.data?.message || "Failed to open messages", "error");
    } finally {
      setMsgBusyId("");
    }
  };

  const previewResume = (app) => {
    if (!app?.resumeUrl) return notify("Resume not available", "error");
    setResumePreview({
      open: true,
      name: app.name || "Candidate",
      url: app.resumeUrl,
    });
  };

  const downloadResume = (app) => {
    if (!app?.resumeUrl) return notify("Resume not available", "error");
    const link = document.createElement("a");
    link.href = app.resumeUrl;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.download = `${app.name || "candidate"}_resume`;
    link.click();
  };

  const exportCsv = () => {
    const header = ["Candidate", "Email", "Phone", "Job", "Experience", "Location", "Skills", "Status", "AI Match", "Applied Date"];
    const rows = filtered.map((app) => [
      app.name,
      app.email,
      app.phone,
      app.job,
      app.exp,
      app.location,
      app.skills.join(" | "),
      app.status,
      app.match,
      app.appliedDate,
    ]);
    const csv = [header, ...rows]
      .map((row) => row.map((value) => `"${String(value ?? "").replaceAll('"', '""')}"`).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "company_applications.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  const bulkDownloadResumes = () => {
    const rows = filtered.filter((app) => Boolean(app.resumeUrl));
    if (!rows.length) return notify("No resumes available in the current list", "error");
    rows.slice(0, 10).forEach((app) => downloadResume(app));
    notify(`Started download for ${Math.min(rows.length, 10)} resumes`);
  };

  const openCall = (app) => {
    const phone = onlyDigits(app?.phone);
    if (!phone) return notify("Phone not available", "error");
    window.location.href = `tel:${phone}`;
  };

  const openMail = (app) => {
    if (!app?.email) return notify("Email not available", "error");
    window.location.href = `mailto:${app.email}`;
  };

  const menuApp = apps.find((app) => app.id === menuState.id) || null;

  return (
    <div className="space-y-5 pb-24 md:pb-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold text-slate-500">Dashboard {">"} Applications</p>
          <h1 className="mt-1 text-2xl font-bold text-[#0F172A]">Applications</h1>
          <p className="mt-1 text-sm text-slate-500">
            Review candidates here, then move shortlisted students to the Shortlisted page for interview assignment.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={openShortlistedPage}
            className="rounded-xl border border-green-200 px-4 py-2 text-sm font-semibold text-green-700 hover:bg-green-50"
          >
            Open Shortlisted
          </button>
          <button
            type="button"
            onClick={exportCsv}
            className="rounded-xl border border-blue-200 px-4 py-2 text-sm font-semibold text-[#2563EB] hover:bg-blue-50"
          >
            Export CSV
          </button>
          <button
            type="button"
            onClick={bulkDownloadResumes}
            className="rounded-xl border border-blue-200 px-4 py-2 text-sm font-semibold text-[#2563EB] hover:bg-blue-50"
          >
            Download Resumes
          </button>
          <button
            type="button"
            onClick={refresh}
            className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            <span className="inline-flex items-center gap-2">
              <FiRefreshCw />
              Refresh
            </span>
          </button>
        </div>
      </header>

      {loadErr ? <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{loadErr}</div> : null}

      <section className="grid grid-cols-2 gap-2 md:grid-cols-5">
        {[
          ["Total Applications", kpi.total, <FiUsers key="total" />],
          ["New Today", kpi.newToday, <FiCheckCircle key="today" />],
          ["Shortlisted Ready", kpi.shortlisted, <FiStar key="shortlisted" />],
          ["On Hold", kpi.hold, <FiFileText key="hold" />],
          ["Rejected", kpi.rejected, <FiX key="rejected" />],
        ].map(([label, value, icon]) => (
          <div key={label} className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
            <div className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-[#2563EB]">{icon}</div>
            <p className="mt-2 text-lg font-bold text-[#0F172A]">{value}</p>
            <p className="text-xs text-slate-500">{label}</p>
          </div>
        ))}
      </section>

      <Card
        title="Filters"
        right={
          <div className="hidden gap-2 md:flex">
            <button
              type="button"
              onClick={() => setView("table")}
              className={`rounded-lg border px-3 py-1.5 text-xs font-semibold ${view === "table" ? "border-blue-200 bg-blue-50 text-[#2563EB]" : "border-slate-200 text-slate-600 hover:bg-slate-50"}`}
            >
              Table
            </button>
            <button
              type="button"
              onClick={() => setView("cards")}
              className={`rounded-lg border px-3 py-1.5 text-xs font-semibold ${view === "cards" ? "border-blue-200 bg-blue-50 text-[#2563EB]" : "border-slate-200 text-slate-600 hover:bg-slate-50"}`}
            >
              Cards
            </button>
          </div>
        }
      >
        <div className="grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-4">
          <label className="relative xl:col-span-2">
            <FiSearch className="pointer-events-none absolute left-3 top-3 text-slate-400" />
            <input
              value={draftFilters.q}
              onChange={(event) => void updateFilterNow("q", event.target.value)}
              placeholder="Search candidates, jobs, skills, contact..."
              className="h-10 w-full rounded-lg border border-slate-200 pl-9 pr-3 text-sm outline-none focus:border-blue-300"
            />
          </label>
          <select
            value={draftFilters.jobId}
            onChange={(event) => void updateFilterNow("jobId", event.target.value)}
            className="h-10 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-blue-300"
          >
            <option value="">Job title</option>
            {jobOptions.map((job) => (
              <option key={job.id} value={job.id}>
                {job.title}
              </option>
            ))}
          </select>
          <select
            value={draftFilters.status}
            onChange={(event) => void updateFilterNow("status", event.target.value)}
            className="h-10 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-blue-300"
          >
            <option>All</option>
            <option>Applied</option>
            <option>Shortlisted</option>
            <option>Hold</option>
            <option>Rejected</option>
            <option>Interview Scheduled</option>
          </select>
          <input
            value={draftFilters.location}
            onChange={(event) => void updateFilterNow("location", event.target.value)}
            placeholder="Location"
            className="h-10 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-blue-300"
          />
          <input
            value={draftFilters.skills}
            onChange={(event) => void updateFilterNow("skills", event.target.value)}
            placeholder="Skill search"
            className="h-10 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-blue-300"
          />
          <select
            value={draftFilters.experience}
            onChange={(event) => setDraftFilters((prev) => ({ ...prev, experience: event.target.value }))}
            className="h-10 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-blue-300"
          >
            <option value="">Experience</option>
            <option value="0-1">0-1 years</option>
            <option value="2-4">2-4 years</option>
            <option value="5+">5+ years</option>
          </select>
          <select
            value={draftFilters.dateRange}
            onChange={(event) => setDraftFilters((prev) => ({ ...prev, dateRange: event.target.value }))}
            className="h-10 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-blue-300"
          >
            <option value="">Applied Date</option>
            <option value="last7">Last 7 days</option>
            <option value="last30">Last 30 days</option>
            <option value="last90">Last 90 days</option>
          </select>
          <select
            value={draftFilters.aiMatch}
            onChange={(event) => setDraftFilters((prev) => ({ ...prev, aiMatch: event.target.value }))}
            className="h-10 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-blue-300"
          >
            <option>All</option>
            <option>Strong</option>
            <option>Moderate</option>
            <option>Low</option>
          </select>
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void applyFilters()}
              className="rounded-lg bg-[#2563EB] px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Apply Filters
            </button>
            <button
              type="button"
              onClick={() => void clearFilters()}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Clear
            </button>
          </div>

          <div className="flex gap-2 md:hidden">
            <button
              type="button"
              onClick={() => setView("table")}
              className={`rounded-lg border px-3 py-1.5 text-xs font-semibold ${view === "table" ? "border-blue-200 bg-blue-50 text-[#2563EB]" : "border-slate-200 text-slate-600 hover:bg-slate-50"}`}
            >
              Table
            </button>
            <button
              type="button"
              onClick={() => setView("cards")}
              className={`rounded-lg border px-3 py-1.5 text-xs font-semibold ${view === "cards" ? "border-blue-200 bg-blue-50 text-[#2563EB]" : "border-slate-200 text-slate-600 hover:bg-slate-50"}`}
            >
              Cards
            </button>
          </div>
        </div>
      </Card>

      <section className="flex flex-wrap gap-2">
        {QUICK_CHIPS.map((entry) => (
          <button
            key={entry}
            type="button"
            onClick={() => setChip((prev) => (prev === entry ? "" : entry))}
            className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${chip === entry ? "border-blue-200 bg-blue-50 text-[#2563EB]" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"}`}
          >
            {entry}
          </button>
        ))}
      </section>

      {loading ? (
        <Card>
          <div className="text-sm text-slate-600">Loading applications...</div>
        </Card>
      ) : filtered.length === 0 ? (
        <Card>
          <div className="py-10 text-center">
            <p className="text-lg font-semibold text-[#0F172A]">No applications found</p>
            <p className="mt-1 text-sm text-slate-500">Try updating the filters or refresh the backend data.</p>
          </div>
        </Card>
      ) : (
        <>
          {view === "table" ? (
            <Card title="Applications Table">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1280px] text-left text-sm">
                  <thead>
                    <tr className="text-slate-500">
                      <th className="pb-2">
                        <input
                          type="checkbox"
                          checked={filtered.length > 0 && selectedIds.length === filtered.length}
                          onChange={toggleAll}
                        />
                      </th>
                      <th className="pb-2">Candidate</th>
                      <th className="pb-2">Contact</th>
                      <th className="pb-2">Applied Job</th>
                      <th className="pb-2">Experience</th>
                      <th className="pb-2">Skills</th>
                      <th className="pb-2">AI Match</th>
                      <th className="pb-2">Applied Date</th>
                      <th className="pb-2">Status</th>
                      <th className="pb-2">Resume</th>
                      <th className="pb-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paged.map((app) => (
                      <tr key={app.id} className="border-t border-slate-100 hover:bg-blue-50/40">
                        <td className="py-3">
                          <input type="checkbox" checked={selectedIds.includes(app.id)} onChange={() => toggleSelect(app.id)} />
                        </td>
                        <td className="py-3">
                          <div className="flex items-center gap-2.5">
                            <CandidateAvatar app={app} />
                            <div>
                              <button
                                type="button"
                                onClick={() => setProfileDrawer({ open: true, app })}
                                className="font-semibold text-[#0F172A] hover:text-[#2563EB]"
                              >
                                {app.name}
                              </button>
                              <p className="mt-1 text-xs text-slate-500">{app.location}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 text-slate-700">
                          <p>{app.email || "-"}</p>
                          <p className="mt-1 text-xs text-slate-500">{app.phone || "Phone not added"}</p>
                        </td>
                        <td className="py-3 text-slate-700">{app.job}</td>
                        <td className="py-3 text-slate-700">{formatExp(app.exp)}</td>
                        <td className="py-3">
                          <div className="flex max-w-[240px] flex-wrap gap-1">
                            {(app.skills || []).slice(0, 3).map((skill, index) => (
                              <span
                                key={`${app.id}_${skill}_${index}`}
                                className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs text-slate-600"
                              >
                                {skill}
                              </span>
                            ))}
                            {app.skills.length > 3 ? (
                              <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs text-slate-500">
                                +{app.skills.length - 3}
                              </span>
                            ) : null}
                          </div>
                        </td>
                        <td className="py-3">
                          <span className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${MATCH_STYLES[app.match] || MATCH_STYLES.Moderate}`}>
                            {app.match}
                          </span>
                        </td>
                        <td className="py-3 text-slate-600">{app.appliedDate || "-"}</td>
                        <td className="py-3">
                          <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${STATUS_STYLES[app.status] || STATUS_STYLES.Applied}`}>
                            {app.status}
                          </span>
                        </td>
                        <td className="py-3">
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => previewResume(app)}
                              className="text-xs font-semibold text-[#2563EB] hover:underline"
                            >
                              Preview
                            </button>
                            <button
                              type="button"
                              onClick={() => downloadResume(app)}
                              className="rounded-md border border-slate-200 p-1 text-slate-600 hover:bg-slate-50"
                            >
                              <FiDownload />
                            </button>
                          </div>
                        </td>
                        <td className="py-3">
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              title="View candidate"
                              onClick={() => setProfileDrawer({ open: true, app })}
                              className="rounded-md border border-blue-200 p-1.5 text-[#2563EB] hover:bg-blue-50"
                            >
                              <FiEye />
                            </button>
                            {isShortlistReady(app.status) ? (
                              <button
                                type="button"
                                title="Open shortlisted page"
                                onClick={openShortlistedPage}
                                className="rounded-md border border-green-200 p-1.5 text-green-700 hover:bg-green-50"
                              >
                                <FiArrowRight />
                              </button>
                            ) : (
                              <button
                                type="button"
                                title="Shortlist candidate"
                                onClick={() => void setStatus(app.id, "Shortlisted")}
                                className="rounded-md border border-green-200 p-1.5 text-green-700 hover:bg-green-50"
                              >
                                <FiCheckCircle />
                              </button>
                            )}
                            <button
                              type="button"
                              title="Open messages"
                              disabled={msgBusyId === app.id}
                              onClick={() => void openMessages(app)}
                              className={`rounded-md border border-blue-200 p-1.5 text-[#2563EB] hover:bg-blue-50 ${msgBusyId === app.id ? "cursor-not-allowed opacity-60" : ""}`}
                            >
                              <FiMessageCircle />
                            </button>
                            <button
                              type="button"
                              title="Call candidate"
                              onClick={() => openCall(app)}
                              className="rounded-md border border-slate-200 p-1.5 text-slate-700 hover:bg-slate-50"
                            >
                              <FiPhone />
                            </button>
                            <button
                              type="button"
                              title="More actions"
                              onClick={(event) => openRowMenu(event, app)}
                              className="rounded-md border border-slate-200 p-1.5 text-slate-600 hover:bg-slate-50"
                            >
                              <FiMoreHorizontal />
                            </button>
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

          <div className={`grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3 ${view === "cards" ? "" : "md:hidden"}`}>
            {paged.map((app) => (
              <Card key={`card_${app.id}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 gap-3">
                    <CandidateAvatar app={app} />
                    <div className="min-w-0">
                    <p className="truncate text-base font-semibold text-[#0F172A]">{app.name}</p>
                    <p className="mt-1 text-sm text-slate-600">{app.job}</p>
                    <p className="mt-1 inline-flex items-center gap-1 text-xs text-slate-500">
                      <FiMapPin />
                      {app.location}
                    </p>
                    </div>
                  </div>
                  <span className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${STATUS_STYLES[app.status] || STATUS_STYLES.Applied}`}>
                    {app.status}
                  </span>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-600">
                  <p>Experience: <span className="font-semibold text-slate-800">{formatExp(app.exp)}</span></p>
                  <p>Applied: <span className="font-semibold text-slate-800">{app.appliedDate || "-"}</span></p>
                  <p>Email: <span className="font-semibold text-slate-800">{app.email || "-"}</span></p>
                  <p>Phone: <span className="font-semibold text-slate-800">{app.phone || "-"}</span></p>
                </div>

                <div className="mt-3 flex flex-wrap gap-1">
                  <span className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${MATCH_STYLES[app.match] || MATCH_STYLES.Moderate}`}>
                    {app.match}
                  </span>
                  {(app.skills || []).slice(0, 4).map((skill, index) => (
                    <span
                      key={`${app.id}_card_${skill}_${index}`}
                      className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs text-slate-600"
                    >
                      {skill}
                    </span>
                  ))}
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setProfileDrawer({ open: true, app })}
                    className="rounded-lg border border-blue-200 px-3 py-1.5 text-xs font-semibold text-[#2563EB] hover:bg-blue-50"
                  >
                    View
                  </button>
                  {isShortlistReady(app.status) ? (
                    <button
                      type="button"
                      onClick={openShortlistedPage}
                      className="rounded-lg border border-green-200 px-3 py-1.5 text-xs font-semibold text-green-700 hover:bg-green-50"
                    >
                      Open Shortlisted
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => void setStatus(app.id, "Shortlisted")}
                      className="rounded-lg border border-green-200 px-3 py-1.5 text-xs font-semibold text-green-700 hover:bg-green-50"
                    >
                      Shortlist
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => void openMessages(app)}
                    disabled={msgBusyId === app.id}
                    className={`rounded-lg border border-blue-200 px-3 py-1.5 text-xs font-semibold text-[#2563EB] hover:bg-blue-50 ${msgBusyId === app.id ? "cursor-not-allowed opacity-60" : ""}`}
                  >
                    Message
                  </button>
                  <button
                    type="button"
                    onClick={() => previewResume(app)}
                    className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Resume
                  </button>
                </div>
              </Card>
            ))}
          </div>

          {view === "cards" && pages > 1 ? <Pagination page={page} pages={pages} onChange={setPage} /> : null}
        </>
      )}

      {selectedIds.length > 0 ? (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-blue-200 bg-blue-50/95 p-3 shadow-[0_-8px_24px_rgba(37,99,235,0.2)] backdrop-blur">
          <div className="mx-auto flex w-full max-w-[1200px] flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-semibold text-[#1E40AF]">{selectedIds.length} selected</p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => void bulkUpdate("Shortlisted")}
                className="rounded-lg border border-green-200 bg-white px-3 py-1.5 text-xs font-semibold text-green-700 hover:bg-green-50"
              >
                Shortlist Selected
              </button>
              <button
                type="button"
                onClick={() => void bulkUpdate("Hold")}
                className="rounded-lg border border-orange-200 bg-white px-3 py-1.5 text-xs font-semibold text-[#F97316] hover:bg-orange-50"
              >
                Hold Selected
              </button>
              <button
                type="button"
                onClick={() => void bulkUpdate("Rejected")}
                className="rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50"
              >
                Reject Selected
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <ActionMenuPortal open={Boolean(menuState.id)} anchor={menuState.anchor} onClose={closeMenu}>
        {menuApp ? (
          <div className="py-1">
            {menuApp.status !== "Applied" ? (
              <button
                type="button"
                onClick={() => void setStatus(menuApp.id, "Applied")}
                className="block w-full px-3 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Move to Applied
              </button>
            ) : null}
            {menuApp.status !== "Hold" ? (
              <button
                type="button"
                onClick={() => void setStatus(menuApp.id, "Hold")}
                className="block w-full px-3 py-2 text-left text-xs font-semibold text-[#F97316] hover:bg-orange-50"
              >
                Move to Hold
              </button>
            ) : null}
            {menuApp.status !== "Rejected" ? (
              <button
                type="button"
                onClick={() => void setStatus(menuApp.id, "Rejected")}
                className="block w-full px-3 py-2 text-left text-xs font-semibold text-red-600 hover:bg-red-50"
              >
                Reject Candidate
              </button>
            ) : null}
            {isShortlistReady(menuApp.status) ? (
              <button
                type="button"
                onClick={openShortlistedPage}
                className="block w-full px-3 py-2 text-left text-xs font-semibold text-green-700 hover:bg-green-50"
              >
                Open Shortlisted Page
              </button>
            ) : (
              <button
                type="button"
                onClick={() => void setStatus(menuApp.id, "Shortlisted")}
                className="block w-full px-3 py-2 text-left text-xs font-semibold text-green-700 hover:bg-green-50"
              >
                Move to Shortlisted
              </button>
            )}
            <button
              type="button"
              onClick={() => void removeApplication(menuApp)}
              className="block w-full px-3 py-2 text-left text-xs font-semibold text-red-600 hover:bg-red-50"
            >
              Delete Application
            </button>
          </div>
        ) : null}
      </ActionMenuPortal>

      {profileDrawer.open ? (
        <div className="fixed inset-0 z-40">
          <div className="absolute inset-0 bg-slate-900/30" onClick={() => setProfileDrawer({ open: false, app: null })} />
          <aside className="absolute right-0 top-0 h-full w-full max-w-md overflow-y-auto border-l border-slate-200 bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
              <h3 className="text-sm font-semibold text-[#0F172A]">Candidate Profile</h3>
              <button
                type="button"
                onClick={() => setProfileDrawer({ open: false, app: null })}
                className="rounded-lg border border-slate-200 p-1.5 text-slate-600 hover:bg-slate-50"
              >
                <FiX />
              </button>
            </div>

            <div className="space-y-4 p-4">
              <div className="flex items-start gap-3">
                <CandidateAvatar app={profileDrawer.app} size="h-12 w-12" />
                <div className="min-w-0">
                  <p className="text-base font-semibold text-[#0F172A]">{profileDrawer.app?.name}</p>
                  <p className="mt-1 text-sm text-slate-500">{profileDrawer.app?.job}</p>
                  <p className="mt-2 inline-flex items-center gap-1 text-xs text-slate-500">
                    <FiMapPin />
                    {profileDrawer.app?.location}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${STATUS_STYLES[profileDrawer.app?.status] || STATUS_STYLES.Applied}`}>
                  {profileDrawer.app?.status}
                </span>
                <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${MATCH_STYLES[profileDrawer.app?.match] || MATCH_STYLES.Moderate}`}>
                  {profileDrawer.app?.match}
                </span>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
                <p><span className="font-semibold text-slate-900">Experience:</span> {formatExp(profileDrawer.app?.exp)}</p>
                <p className="mt-1"><span className="font-semibold text-slate-900">Applied Date:</span> {profileDrawer.app?.appliedDate || "-"}</p>
                <p className="mt-1"><span className="font-semibold text-slate-900">Email:</span> {profileDrawer.app?.email || "-"}</p>
                <p className="mt-1"><span className="font-semibold text-slate-900">Phone:</span> {profileDrawer.app?.phone || "-"}</p>
                <p className="mt-1"><span className="font-semibold text-slate-900">Interview Stage:</span> {profileDrawer.app?.stage || "HR Round"}</p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <p className="text-sm font-semibold text-slate-900">Skills</p>
                <div className="mt-2 flex flex-wrap gap-1">
                  {(profileDrawer.app?.skills || []).length ? (
                    profileDrawer.app.skills.map((skill, index) => (
                      <span
                        key={`${profileDrawer.app?.id}_${skill}_${index}`}
                        className="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-xs text-slate-600"
                      >
                        {skill}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-slate-500">No skills captured</span>
                  )}
                </div>
              </div>

              {(profileDrawer.app?.notes || []).length ? (
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <p className="text-sm font-semibold text-slate-900">Notes</p>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {profileDrawer.app.notes.map((note, index) => (
                      <span
                        key={`${profileDrawer.app?.id}_note_${index}`}
                        className="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-xs text-slate-600"
                      >
                        {note}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}

              <div className="flex flex-wrap gap-2">
                {isShortlistReady(profileDrawer.app?.status) ? (
                  <button
                    type="button"
                    onClick={openShortlistedPage}
                    className="rounded-lg border border-green-200 px-3 py-2 text-xs font-semibold text-green-700 hover:bg-green-50"
                  >
                    Open Shortlisted
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => void setStatus(profileDrawer.app?.id, "Shortlisted")}
                    className="rounded-lg border border-green-200 px-3 py-2 text-xs font-semibold text-green-700 hover:bg-green-50"
                  >
                    Shortlist
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => void setStatus(profileDrawer.app?.id, "Hold")}
                  className="rounded-lg border border-orange-200 px-3 py-2 text-xs font-semibold text-[#F97316] hover:bg-orange-50"
                >
                  Hold
                </button>
                <button
                  type="button"
                  onClick={() => void setStatus(profileDrawer.app?.id, "Rejected")}
                  className="rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50"
                >
                  Reject
                </button>
                <button
                  type="button"
                  onClick={() => previewResume(profileDrawer.app)}
                  className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Resume
                </button>
                <button
                  type="button"
                  onClick={() => void openMessages(profileDrawer.app)}
                  className="rounded-lg border border-blue-200 px-3 py-2 text-xs font-semibold text-[#2563EB] hover:bg-blue-50"
                >
                  Message
                </button>
                <button
                  type="button"
                  onClick={() => openCall(profileDrawer.app)}
                  className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  <span className="inline-flex items-center gap-1">
                    <FiPhone />
                    Call
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => openMail(profileDrawer.app)}
                  className="rounded-lg border border-blue-200 px-3 py-2 text-xs font-semibold text-[#2563EB] hover:bg-blue-50"
                >
                  <span className="inline-flex items-center gap-1">
                    <FiMail />
                    Email
                  </span>
                </button>
              </div>
            </div>
          </aside>
        </div>
      ) : null}

      <ResumePreviewModal
        open={resumePreview.open}
        resumeUrl={resumePreview.url}
        applicantName={resumePreview.name}
        onClose={() => setResumePreview({ open: false, name: "", url: "" })}
      />

      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-slate-200 bg-white p-3 shadow-[0_-8px_24px_rgba(15,23,42,0.08)] md:hidden">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setView("table")}
            className={`flex-1 rounded-lg border px-3 py-2 text-sm font-semibold ${view === "table" ? "border-blue-200 bg-blue-50 text-[#2563EB]" : "border-slate-200 text-slate-600"}`}
          >
            Table
          </button>
          <button
            type="button"
            onClick={() => setView("cards")}
            className={`flex-1 rounded-lg border px-3 py-2 text-sm font-semibold ${view === "cards" ? "border-blue-200 bg-blue-50 text-[#2563EB]" : "border-slate-200 text-slate-600"}`}
          >
            Cards
          </button>
        </div>
      </div>
    </div>
  );
}
