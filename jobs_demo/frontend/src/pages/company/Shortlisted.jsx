import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  FiBriefcase,
  FiCalendar,
  FiCheckCircle,
  FiDownload,
  FiEye,
  FiFileText,
  FiGrid,
  FiList,
  FiMail,
  FiMapPin,
  FiMessageCircle,
  FiMoreHorizontal,
  FiPhone,
  FiX,
} from "react-icons/fi";

import Modal from "../../components/common/Modal.jsx";
import ResumePreviewModal from "../../components/common/ResumePreviewModal.jsx";
import { showSweetToast } from "../../utils/sweetAlert.js";
import {
  getCompanyShortlisted,
  listCompanyJobs,
  updateShortlistedStatus as apiUpdateStatus,
  updateShortlistedStage as apiUpdateStage,
  sendOffer as apiSendOffer,
} from "../../services/companyService.js";
import { createCompanyThread } from "../../services/messagesService.js";

const STATUS = {
  Shortlisted: "border-green-200 bg-green-50 text-green-700",
  "Interview Scheduled": "border-blue-200 bg-blue-50 text-[#2563EB]",
  "Interview Completed": "border-indigo-200 bg-indigo-50 text-indigo-700",
  "Offer Sent": "border-orange-200 bg-orange-50 text-[#F97316]",
  Hired: "border-green-300 bg-green-600 text-white",
  Rejected: "border-red-200 bg-red-50 text-red-600",
};

const STAGES = ["HR Round", "Technical Round", "Manager Round", "Final Round"];
const QUICK_CHIPS = ["Interview Pending", "Technical Round", "Final Round", "Offer Pending"];

function initials(name = "") {
  return String(name || "Candidate")
    .trim()
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("");
}

function CandidateAvatar({ candidate, size = "h-10 w-10" }) {
  const src = candidate?.avatarUrl || candidate?.avatar || candidate?.profileImageUrl || "";
  if (src) {
    return <img src={src} alt={candidate?.name || "Candidate"} className={`${size} rounded-full border border-slate-200 object-cover`} />;
  }
  return (
    <span className={`${size} inline-flex items-center justify-center rounded-full bg-blue-50 text-xs font-bold text-[#2563EB]`}>
      {initials(candidate?.name) || "C"}
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

function normalizeShortlisted(item) {
  return {
    id: item?.id || item?._id || "",
    jobId: item?.jobId || item?.job?._id || "",
    name: item?.name || item?.candidateName || item?.candidate?.name || "Candidate",
    email: item?.email || item?.candidate?.email || "",
    phone: item?.phone || item?.candidate?.phone || "",
    job: item?.job || item?.jobTitle || item?.job?.title || "-",
    exp: item?.exp || item?.experienceText || "",
    skills: Array.isArray(item?.skills || item?.topSkills || item?.candidate?.skills) ? item.skills || item.topSkills || item.candidate.skills : [],
    shortlistedDate: String(item?.shortlistedDate || item?.createdAt || "").slice(0, 10),
    stage: item?.stage || "HR Round",
    status: item?.status || "Shortlisted",
    resumeUrl: item?.resumeUrl || item?.resume || item?.candidate?.resumeUrl || "",
    avatar: item?.avatar || item?.avatarUrl || item?.candidate?.avatar || item?.candidate?.avatarUrl || "",
    avatarUrl: item?.avatarUrl || item?.avatar || item?.candidate?.avatarUrl || item?.candidate?.avatar || "",
    aiMatch: item?.aiMatch || item?.match || "Moderate",
    location: item?.location || item?.candidate?.location || "-",
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

function formatExperience(value = "") {
  if (!String(value || "").trim()) return "-";
  if (/\byear/i.test(String(value))) return String(value);
  return `${String(value).trim()} yrs`;
}

export default function Shortlisted() {
  const nav = useNavigate();
  const [searchParams] = useSearchParams();
  const initialJobId = String(searchParams.get("jobId") || "").trim();

  const [list, setList] = useState([]);
  const [jobOptions, setJobOptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadErr, setLoadErr] = useState("");
  const [view, setView] = useState("table");
  const [selected, setSelected] = useState([]);
  const [chip, setChip] = useState("");
  const [msgBusyId, setMsgBusyId] = useState("");
  const [filters, setFilters] = useState({
    jobId: initialJobId,
    interview: "",
    exp: "",
    location: "",
    date: "",
  });
  const [drawer, setDrawer] = useState({ open: false, candidate: null });
  const [resumePreview, setResumePreview] = useState({ open: false, name: "", url: "" });
  const [offer, setOffer] = useState({
    open: false,
    candidate: null,
    salary: "",
    joining: "",
    expiry: "",
    message: "",
    file: "",
  });

  const notify = (message, type = "info") => {
    void showSweetToast(message, type, { timer: 1300 });
  };

  const openInterviewScheduler = (candidate) => {
    if (!candidate?.id) return notify("Candidate not found", "error");
    const params = new URLSearchParams({
      openSchedule: "1",
      applicationId: String(candidate.id),
      candidate: String(candidate.name || ""),
      job: String(candidate.job || ""),
      stage: String(candidate.stage || "HR Round"),
    });
    nav(`/company/interviews?${params.toString()}`);
  };

  const fetchShortlisted = async (params = {}) => {
    try {
      setLoading(true);
      setLoadErr("");
      const res = await getCompanyShortlisted(params);
      const items = Array.isArray(res) ? res : res?.items || [];
      setList(items.map(normalizeShortlisted));
    } catch (error) {
      setLoadErr(error?.response?.data?.message || "Failed to load shortlisted candidates");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShortlisted(initialJobId ? { jobId: initialJobId } : {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialJobId]);

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

  const filtered = useMemo(() => {
    return list.filter((candidate) => {
      const years = parseExpYears(candidate.exp);
      if (filters.jobId && String(candidate.jobId || "") !== String(filters.jobId)) return false;
      if (filters.interview && candidate.status !== filters.interview) return false;
      if (filters.location && !String(candidate.location || "").toLowerCase().includes(filters.location.toLowerCase())) return false;
      if (filters.date && candidate.shortlistedDate !== filters.date) return false;
      if (filters.exp === "1-2" && (years < 1 || years > 2)) return false;
      if (filters.exp === "3-5" && (years < 3 || years > 5)) return false;
      if (filters.exp === "5+" && years < 5) return false;
      if (chip === "Interview Pending" && candidate.status !== "Shortlisted") return false;
      if (chip === "Technical Round" && candidate.stage !== "Technical Round") return false;
      if (chip === "Final Round" && candidate.stage !== "Final Round") return false;
      if (chip === "Offer Pending" && candidate.status !== "Interview Completed") return false;
      return true;
    });
  }, [chip, filters, list]);

  const summary = useMemo(
    () => ({
      total: list.length,
      interview: list.filter((row) => row.status === "Interview Scheduled").length,
      offer: list.filter((row) => row.status === "Offer Sent").length,
      hired: list.filter((row) => row.status === "Hired").length,
    }),
    [list]
  );

  const toggle = (id) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((value) => value !== id) : [...prev, id]));
  };

  const toShortlistedParams = (nextFilters) => ({
    jobId: nextFilters.jobId || "",
    status: nextFilters.interview || "",
    location: nextFilters.location || "",
    date: nextFilters.date || "",
  });

  const updateFiltersNow = (key, value) => {
    setFilters((prev) => {
      const next = { ...prev, [key]: value };
      void fetchShortlisted(toShortlistedParams(next));
      return next;
    });
    setSelected([]);
  };

  const applyFilters = async () => {
    await fetchShortlisted(toShortlistedParams(filters));
    setSelected([]);
  };

  const clearFilters = async () => {
    setFilters({ jobId: "", interview: "", exp: "", location: "", date: "" });
    setChip("");
    setSelected([]);
    await fetchShortlisted();
  };

  const updateStatus = async (id, status) => {
    setList((prev) => prev.map((row) => (row.id === id ? { ...row, status } : row)));
    try {
      await apiUpdateStatus(id, status);
      notify(`Status set to ${status}`);
    } catch {
      notify("Failed to update status", "error");
      await fetchShortlisted(toShortlistedParams(filters));
    }
  };

  const updateStage = async (id, stage) => {
    setList((prev) => prev.map((row) => (row.id === id ? { ...row, stage } : row)));
    try {
      await apiUpdateStage(id, stage);
    } catch {
      notify("Failed to update stage", "error");
      await fetchShortlisted(toShortlistedParams(filters));
    }
  };

  const bulkUpdate = async (status) => {
    if (!selected.length) return;
    setList((prev) => prev.map((row) => (selected.includes(row.id) ? { ...row, status } : row)));
    try {
      await Promise.all(selected.map((id) => apiUpdateStatus(id, status)));
      setSelected([]);
      notify(`Moved selected to ${status}`);
    } catch {
      notify("Bulk update failed", "error");
      await fetchShortlisted(toShortlistedParams(filters));
    }
  };

  const openResume = (candidate) => {
    if (!candidate?.resumeUrl) return notify("Resume not available", "error");
    setResumePreview({
      open: true,
      name: candidate.name || "Candidate",
      url: candidate.resumeUrl,
    });
  };

  const downloadResume = (candidate) => {
    if (!candidate?.resumeUrl) return notify("Resume not available", "error");
    const link = document.createElement("a");
    link.href = candidate.resumeUrl;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.download = `${candidate.name || "candidate"}_resume`;
    link.click();
  };

  const bulkDownloadResumes = (rows) => {
    const resumeRows = (rows || []).filter((row) => row.resumeUrl);
    if (!resumeRows.length) return notify("No resumes available", "error");
    resumeRows.slice(0, 10).forEach((row) => downloadResume(row));
    notify(`Started download for ${Math.min(resumeRows.length, 10)} resumes`);
  };

  const exportCsv = () => {
    const headers = ["Candidate", "Email", "Job", "Experience", "Stage", "Status", "Shortlisted Date", "Location"];
    const lines = filtered.map((row) => [row.name, row.email, row.job, row.exp, row.stage, row.status, row.shortlistedDate, row.location]);
    const csv = [headers, ...lines]
      .map((row) => row.map((value) => `"${String(value ?? "").replaceAll('"', '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "company_shortlisted.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  const openMessages = async (candidate) => {
    if (!candidate?.id) return notify("Missing candidate id", "error");
    try {
      setMsgBusyId(candidate.id);
      const res = await createCompanyThread({ applicationId: candidate.id });
      const threadId = res?.thread?.id;
      if (!threadId) throw new Error("Thread not created");
      nav(`/company/messages?thread=${threadId}`);
    } catch (error) {
      notify(error?.response?.data?.message || "Failed to open messages", "error");
    } finally {
      setMsgBusyId("");
    }
  };

  const sendOffer = async () => {
    if (!offer.candidate) return;
    try {
      await apiSendOffer(offer.candidate.id, {
        salary: offer.salary,
        joining: offer.joining,
        expiry: offer.expiry,
        message: offer.message,
        file: offer.file,
      });
      setList((prev) => prev.map((row) => (row.id === offer.candidate.id ? { ...row, status: "Offer Sent" } : row)));
      setOffer({ open: false, candidate: null, salary: "", joining: "", expiry: "", message: "", file: "" });
      notify("Offer sent");
    } catch (error) {
      notify(error?.response?.data?.message || "Offer failed", "error");
      await fetchShortlisted(toShortlistedParams(filters));
    }
  };

  return (
    <div className="space-y-5 pb-24 md:pb-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold text-slate-500">Dashboard {">"} Shortlisted</p>
          <h1 className="mt-1 text-2xl font-bold text-[#0F172A]">Shortlisted Candidates</h1>
          <p className="mt-1 text-sm text-slate-500">Manage selected applicants and assign interviews from this page.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => nav("/company/interviews")} className="rounded-xl border border-blue-200 px-4 py-2 text-sm font-semibold text-[#2563EB] hover:bg-blue-50">Open Interviews</button>
          <button onClick={() => bulkDownloadResumes(filtered)} className="rounded-xl border border-blue-200 px-4 py-2 text-sm font-semibold text-[#2563EB] hover:bg-blue-50">Download Resumes</button>
          <button
            onClick={() => {
              if (selected.length !== 1) return notify("Select exactly one candidate", "error");
              const row = list.find((candidate) => candidate.id === selected[0]);
              if (row) openInterviewScheduler(row);
            }}
            className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Schedule Interview
          </button>
          <button onClick={exportCsv} className="rounded-xl border border-blue-200 px-4 py-2 text-sm font-semibold text-[#2563EB] hover:bg-blue-50">Export List</button>
        </div>
      </header>

      {loadErr ? <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{loadErr}</div> : null}

      <section className="grid grid-cols-2 gap-2 md:grid-cols-4">
        {[
          ["Total Shortlisted", summary.total],
          ["Interview Scheduled", summary.interview],
          ["Offer Sent", summary.offer],
          ["Hired", summary.hired],
        ].map(([label, value]) => (
          <div key={label} className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
            <div className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-[#2563EB]"><FiCheckCircle /></div>
            <p className="mt-2 text-lg font-bold text-[#0F172A]">{value}</p>
            <p className="text-xs text-slate-500">{label}</p>
          </div>
        ))}
      </section>

      <Card
        title="Filters"
        right={
          <div className="hidden gap-2 md:flex">
            <button onClick={() => setView("table")} className={`rounded-lg border px-3 py-1.5 text-xs font-semibold ${view === "table" ? "border-blue-200 bg-blue-50 text-[#2563EB]" : "border-slate-200 text-slate-600 hover:bg-slate-50"}`}><span className="inline-flex items-center gap-1"><FiList /> Table</span></button>
            <button onClick={() => setView("cards")} className={`rounded-lg border px-3 py-1.5 text-xs font-semibold ${view === "cards" ? "border-blue-200 bg-blue-50 text-[#2563EB]" : "border-slate-200 text-slate-600 hover:bg-slate-50"}`}><span className="inline-flex items-center gap-1"><FiGrid /> Cards</span></button>
          </div>
        }
      >
        <div className="grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-5">
          <select value={filters.jobId} onChange={(event) => updateFiltersNow("jobId", event.target.value)} className="h-10 rounded-lg border border-slate-200 px-3 text-sm">
            <option value="">Job Title (optional)</option>
            {jobOptions.map((job) => (
              <option key={job.id} value={job.id}>
                {job.title}
              </option>
            ))}
          </select>
          <select value={filters.interview} onChange={(event) => updateFiltersNow("interview", event.target.value)} className="h-10 rounded-lg border border-slate-200 px-3 text-sm">
            <option value="">Status</option>
            <option>Shortlisted</option>
            <option>Interview Scheduled</option>
            <option>Interview Completed</option>
            <option>Offer Sent</option>
            <option>Hired</option>
            <option>Rejected</option>
          </select>
          <select value={filters.exp} onChange={(event) => updateFiltersNow("exp", event.target.value)} className="h-10 rounded-lg border border-slate-200 px-3 text-sm">
            <option value="">Experience</option>
            <option>1-2</option>
            <option>3-5</option>
            <option>5+</option>
          </select>
          <input value={filters.location} onChange={(event) => updateFiltersNow("location", event.target.value)} placeholder="Location" className="h-10 rounded-lg border border-slate-200 px-3 text-sm" />
          <input type="date" value={filters.date} onChange={(event) => updateFiltersNow("date", event.target.value)} className="h-10 rounded-lg border border-slate-200 px-3 text-sm" />
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <button onClick={applyFilters} className="rounded-lg bg-[#2563EB] px-4 py-2 text-sm font-semibold text-white">Apply Filter</button>
          <button onClick={clearFilters} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700">Clear</button>
          <div className="flex gap-2 md:hidden">
            <button onClick={() => setView("table")} className={`rounded-lg border px-3 py-2 text-xs font-semibold ${view === "table" ? "border-blue-200 bg-blue-50 text-[#2563EB]" : "border-slate-200 text-slate-600 hover:bg-slate-50"}`}>Table</button>
            <button onClick={() => setView("cards")} className={`rounded-lg border px-3 py-2 text-xs font-semibold ${view === "cards" ? "border-blue-200 bg-blue-50 text-[#2563EB]" : "border-slate-200 text-slate-600 hover:bg-slate-50"}`}>Cards</button>
          </div>
        </div>
      </Card>

      <section className="flex flex-wrap gap-2">
        {QUICK_CHIPS.map((entry) => (
          <button key={entry} onClick={() => setChip((prev) => (prev === entry ? "" : entry))} className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${chip === entry ? "border-blue-200 bg-blue-50 text-[#2563EB]" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"}`}>
            {entry}
          </button>
        ))}
      </section>

      {view === "table" ? (
        <Card title="Shortlist Table">
          {loading ? (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">Loading shortlisted...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1100px] text-left text-sm">
                <thead>
                  <tr className="text-slate-500">
                    <th className="pb-2"><input type="checkbox" checked={selected.length > 0 && selected.length === filtered.length} onChange={() => setSelected(selected.length === filtered.length ? [] : filtered.map((row) => row.id))} /></th>
                    <th className="pb-2">Candidate</th>
                    <th className="pb-2">Applied Job</th>
                    <th className="pb-2">Experience</th>
                    <th className="pb-2">Key Skills</th>
                    <th className="pb-2">Shortlisted Date</th>
                    <th className="pb-2">Interview Stage</th>
                    <th className="pb-2">Status</th>
                    <th className="pb-2">Resume</th>
                    <th className="pb-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((candidate) => (
                    <tr key={candidate.id} className="border-t border-slate-100 hover:bg-blue-50/40">
                      <td className="py-3"><input type="checkbox" checked={selected.includes(candidate.id)} onChange={() => toggle(candidate.id)} /></td>
                      <td className="py-3">
                        <div className="flex items-center gap-2.5">
                          <CandidateAvatar candidate={candidate} />
                          <button onClick={() => setDrawer({ open: true, candidate })} className="font-semibold text-[#0F172A] hover:text-[#2563EB]">{candidate.name}</button>
                        </div>
                      </td>
                      <td className="py-3">{candidate.job}</td>
                      <td className="py-3">{formatExperience(candidate.exp)}</td>
                      <td className="py-3"><div className="flex flex-wrap gap-1">{(candidate.skills || []).map((skill, index) => <span key={`${candidate.id}_${skill}_${index}`} className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs">{skill}</span>)}</div></td>
                      <td className="py-3">{candidate.shortlistedDate || "-"}</td>
                      <td className="py-3"><select value={candidate.stage} onChange={(event) => updateStage(candidate.id, event.target.value)} className="h-8 rounded-lg border border-slate-200 px-2 text-xs">{STAGES.map((stage) => <option key={stage}>{stage}</option>)}</select></td>
                      <td className="py-3"><span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${STATUS[candidate.status] || "border-slate-200 bg-slate-100 text-slate-600"}`}>{candidate.status}</span></td>
                      <td className="py-3">
                        <div className="flex items-center gap-1">
                          <button onClick={() => openResume(candidate)} className="text-xs font-semibold text-[#2563EB]">View</button>
                          <button onClick={() => downloadResume(candidate)} className="rounded-md border border-slate-200 p-1"><FiDownload /></button>
                        </div>
                      </td>
                      <td className="py-3">
                        <div className="flex items-center gap-1">
                          <button onClick={() => setDrawer({ open: true, candidate })} className="rounded-md border border-blue-200 p-1.5 text-[#2563EB] hover:bg-blue-50"><FiEye /></button>
                          <button onClick={() => openInterviewScheduler(candidate)} className="rounded-md border border-blue-200 p-1.5 text-[#2563EB] hover:bg-blue-50"><FiCalendar /></button>
                          <button onClick={() => openMessages(candidate)} disabled={msgBusyId === candidate.id} className={`rounded-md border border-blue-200 p-1.5 text-[#2563EB] hover:bg-blue-50 ${msgBusyId === candidate.id ? "opacity-60 cursor-not-allowed" : ""}`}><FiMessageCircle /></button>
                          <button onClick={() => setOffer((prev) => ({ ...prev, open: true, candidate }))} className="rounded-md border border-orange-200 p-1.5 text-[#F97316] hover:bg-orange-50"><FiFileText /></button>
                          <button onClick={() => updateStatus(candidate.id, "Hired")} className="rounded-md border border-green-200 p-1.5 text-green-700 hover:bg-green-50"><FiCheckCircle /></button>
                          <button onClick={() => updateStatus(candidate.id, "Rejected")} className="rounded-md border border-red-200 p-1.5 text-red-600 hover:bg-red-50"><FiX /></button>
                          <button onClick={() => setDrawer({ open: true, candidate })} className="rounded-md border border-slate-200 p-1.5 text-slate-600 hover:bg-slate-50"><FiMoreHorizontal /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filtered.length === 0 ? <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">No shortlisted candidates found.</div> : null}
            </div>
          )}
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {loading ? (
            <Card>
              <div className="text-sm text-slate-600">Loading shortlisted...</div>
            </Card>
          ) : null}

          {!loading && !filtered.length ? (
            <Card>
              <div className="py-10 text-center text-sm text-slate-600">No shortlisted candidates found.</div>
            </Card>
          ) : null}

          {!loading && filtered.map((candidate) => (
            <Card key={`shortlisted_card_${candidate.id}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 gap-3">
                  <CandidateAvatar candidate={candidate} />
                  <div className="min-w-0">
                  <p className="truncate text-base font-semibold text-[#0F172A]">{candidate.name}</p>
                  <p className="mt-1 inline-flex items-center gap-1 text-sm text-slate-600"><FiBriefcase /> {candidate.job}</p>
                  <p className="mt-1 inline-flex items-center gap-1 text-xs text-slate-500"><FiMapPin /> {candidate.location}</p>
                  </div>
                </div>
                <span className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${STATUS[candidate.status] || "border-slate-200 bg-slate-100 text-slate-600"}`}>{candidate.status}</span>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-600">
                <p>Experience: <span className="font-semibold text-slate-800">{formatExperience(candidate.exp)}</span></p>
                <p>Stage: <span className="font-semibold text-slate-800">{candidate.stage || "HR Round"}</span></p>
                <p>Email: <span className="font-semibold text-slate-800">{candidate.email || "-"}</span></p>
                <p>Phone: <span className="font-semibold text-slate-800">{candidate.phone || "-"}</span></p>
                <p>Shortlisted: <span className="font-semibold text-slate-800">{candidate.shortlistedDate || "-"}</span></p>
                <p>AI Match: <span className="font-semibold text-slate-800">{candidate.aiMatch || "-"}</span></p>
              </div>

              <div className="mt-3 flex flex-wrap gap-1">
                {(candidate.skills || []).slice(0, 4).map((skill, index) => (
                  <span key={`${candidate.id}_${skill}_${index}`} className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs">
                    {skill}
                  </span>
                ))}
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <button onClick={() => setDrawer({ open: true, candidate })} className="rounded-lg border border-blue-200 px-3 py-1.5 text-xs font-semibold text-[#2563EB] hover:bg-blue-50">View</button>
                <button onClick={() => openInterviewScheduler(candidate)} className="rounded-lg border border-blue-200 px-3 py-1.5 text-xs font-semibold text-[#2563EB] hover:bg-blue-50">Schedule</button>
                <button onClick={() => openMessages(candidate)} disabled={msgBusyId === candidate.id} className={`rounded-lg border border-blue-200 px-3 py-1.5 text-xs font-semibold text-[#2563EB] hover:bg-blue-50 ${msgBusyId === candidate.id ? "opacity-60 cursor-not-allowed" : ""}`}>Message</button>
                <button onClick={() => openResume(candidate)} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50">Resume</button>
                <button onClick={() => setOffer((prev) => ({ ...prev, open: true, candidate }))} className="rounded-lg border border-orange-200 px-3 py-1.5 text-xs font-semibold text-[#F97316] hover:bg-orange-50">Offer</button>
                <button onClick={() => updateStatus(candidate.id, "Hired")} className="rounded-lg border border-green-200 px-3 py-1.5 text-xs font-semibold text-green-700 hover:bg-green-50">Hire</button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {selected.length > 0 ? (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-blue-200 bg-blue-50/95 p-3 shadow-[0_-8px_24px_rgba(37,99,235,0.2)]">
          <div className="mx-auto flex w-full max-w-[1200px] flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-semibold text-[#1E40AF]">{selected.length} selected</p>
            <div className="flex flex-wrap gap-2">
              <button onClick={() => { if (selected.length !== 1) return notify("Select exactly one candidate", "error"); const row = list.find((candidate) => candidate.id === selected[0]); if (row) openInterviewScheduler(row); }} className="rounded-lg border border-blue-200 bg-white px-3 py-1.5 text-xs font-semibold text-[#2563EB]">Schedule Interview</button>
              <button onClick={() => { if (selected.length !== 1) return notify("Select exactly one candidate", "error"); const row = list.find((candidate) => candidate.id === selected[0]); if (row) openMessages(row); }} className="rounded-lg border border-blue-200 bg-white px-3 py-1.5 text-xs font-semibold text-[#2563EB]">Send Message</button>
              <button onClick={() => { if (selected.length !== 1) return notify("Select exactly one candidate", "error"); const row = list.find((candidate) => candidate.id === selected[0]); if (row) setOffer((prev) => ({ ...prev, open: true, candidate: row })); }} className="rounded-lg border border-orange-200 bg-white px-3 py-1.5 text-xs font-semibold text-[#F97316]">Send Offer</button>
              <button onClick={() => bulkUpdate("Hired")} className="rounded-lg border border-green-200 bg-white px-3 py-1.5 text-xs font-semibold text-green-700">Move to Hired</button>
              <button onClick={() => bulkDownloadResumes(list.filter((row) => selected.includes(row.id)))} className="rounded-lg border border-blue-200 bg-white px-3 py-1.5 text-xs font-semibold text-[#2563EB]">Download Resumes</button>
            </div>
          </div>
        </div>
      ) : null}

      {drawer.open ? (
        <div className="fixed inset-0 z-40">
          <div className="absolute inset-0 bg-slate-900/30" onClick={() => setDrawer({ open: false, candidate: null })} />
          <aside className="absolute right-0 top-0 h-full w-full max-w-md overflow-y-auto border-l border-slate-200 bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
              <p className="text-sm font-semibold text-[#0F172A]">Candidate Profile</p>
              <button onClick={() => setDrawer({ open: false, candidate: null })} className="rounded-lg border border-slate-200 p-1.5 text-slate-600 hover:bg-slate-50"><FiX /></button>
            </div>
            <div className="space-y-3 p-4 text-sm">
              <div className="flex items-start gap-3">
                <CandidateAvatar candidate={drawer.candidate} size="h-12 w-12" />
                <div>
                  <p className="text-base font-semibold text-[#0F172A]">{drawer.candidate?.name}</p>
                  <p className="text-slate-500">{drawer.candidate?.job} - {drawer.candidate?.location}</p>
                </div>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <p><span className="font-semibold">Experience:</span> {formatExperience(drawer.candidate?.exp)}</p>
                <p className="mt-1"><span className="font-semibold">Skills:</span> {(drawer.candidate?.skills || []).join(", ") || "-"}</p>
                <p className="mt-1"><span className="font-semibold">Email:</span> {drawer.candidate?.email || "-"}</p>
                <p className="mt-1"><span className="font-semibold">Phone:</span> {drawer.candidate?.phone || "-"}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <p className="font-semibold text-[#0F172A]">Notes</p>
                <div className="mt-2 flex flex-wrap gap-1">
                  {(drawer.candidate?.notes || []).length ? (
                    drawer.candidate.notes.map((note, index) => (
                      <span key={`${drawer.candidate?.id}_note_${index}`} className="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-xs">{note}</span>
                    ))
                  ) : (
                    <span className="text-xs text-slate-500">No notes added</span>
                  )}
                </div>
              </div>
              <div className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs text-[#1E40AF]">AI Match: {drawer.candidate?.aiMatch}</div>
              <div className="flex flex-wrap gap-2">
                <button onClick={() => openInterviewScheduler(drawer.candidate)} className="rounded-lg border border-blue-200 px-3 py-2 text-xs font-semibold text-[#2563EB] hover:bg-blue-50">Schedule Interview</button>
                <button onClick={() => openMessages(drawer.candidate)} className="rounded-lg border border-blue-200 px-3 py-2 text-xs font-semibold text-[#2563EB] hover:bg-blue-50">Message</button>
                <button onClick={() => setOffer((prev) => ({ ...prev, open: true, candidate: drawer.candidate }))} className="rounded-lg border border-orange-200 px-3 py-2 text-xs font-semibold text-[#F97316] hover:bg-orange-50">Send Offer</button>
                <button onClick={() => openResume(drawer.candidate)} className="rounded-lg border border-blue-200 px-3 py-2 text-xs font-semibold text-[#2563EB] hover:bg-blue-50">Resume</button>
                <button onClick={() => drawer.candidate?.phone ? (window.location.href = `tel:${drawer.candidate.phone}`) : notify("Phone not available", "error")} className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"><span className="inline-flex items-center gap-1"><FiPhone /> Call</span></button>
                <button onClick={() => drawer.candidate?.email ? (window.location.href = `mailto:${drawer.candidate.email}`) : notify("Email not available", "error")} className="rounded-lg border border-blue-200 px-3 py-2 text-xs font-semibold text-[#2563EB] hover:bg-blue-50"><span className="inline-flex items-center gap-1"><FiMail /> Email</span></button>
                <button onClick={() => updateStatus(drawer.candidate.id, "Rejected")} className="rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50">Reject</button>
              </div>
            </div>
          </aside>
        </div>
      ) : null}

      <Modal
        open={offer.open}
        onClose={() => setOffer({ open: false, candidate: null, salary: "", joining: "", expiry: "", message: "", file: "" })}
        title="Send Offer Letter"
        footer={
          <>
            <button onClick={() => setOffer({ open: false, candidate: null, salary: "", joining: "", expiry: "", message: "", file: "" })} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700">Cancel</button>
            <button onClick={sendOffer} className="rounded-lg bg-[#F97316] px-4 py-2 text-sm font-semibold text-white">Send Offer</button>
          </>
        }
      >
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <input value={offer.salary} onChange={(event) => setOffer((prev) => ({ ...prev, salary: event.target.value }))} placeholder="Salary Offered" className="h-10 rounded-lg border border-slate-200 px-3 text-sm" />
          <input type="date" value={offer.joining} onChange={(event) => setOffer((prev) => ({ ...prev, joining: event.target.value }))} className="h-10 rounded-lg border border-slate-200 px-3 text-sm" />
          <input type="date" value={offer.expiry} onChange={(event) => setOffer((prev) => ({ ...prev, expiry: event.target.value }))} className="h-10 rounded-lg border border-slate-200 px-3 text-sm" />
          <input value={offer.file} onChange={(event) => setOffer((prev) => ({ ...prev, file: event.target.value }))} placeholder="Offer PDF filename" className="h-10 rounded-lg border border-slate-200 px-3 text-sm" />
          <textarea value={offer.message} onChange={(event) => setOffer((prev) => ({ ...prev, message: event.target.value }))} rows={3} placeholder="Message" className="rounded-lg border border-slate-200 px-3 py-2 text-sm sm:col-span-2" />
        </div>
      </Modal>

      <ResumePreviewModal
        open={resumePreview.open}
        resumeUrl={resumePreview.url}
        applicantName={resumePreview.name}
        onClose={() => setResumePreview({ open: false, name: "", url: "" })}
      />
    </div>
  );
}
