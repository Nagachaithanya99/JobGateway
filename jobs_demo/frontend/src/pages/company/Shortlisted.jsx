import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiCalendar,
  FiCheckCircle,
  FiDownload,
  FiEye,
  FiFileText,
  FiMessageCircle,
  FiMoreHorizontal,
  FiX,
} from "react-icons/fi";
import Modal from "../../components/common/Modal.jsx";
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
const quickChips = ["Interview Pending", "Technical Round", "Final Round", "Offer Pending"];

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

function normalizeShortlisted(x) {
  return {
    id: x.id || x._id,
    jobId: x.jobId || x.job?._id || "",
    name: x.name || x.candidateName || x.candidate?.name || "Candidate",
    email: x.email || x.candidate?.email || "",
    phone: x.phone || x.candidate?.phone || "",
    job: x.job || x.jobTitle || x.job?.title || "-",
    exp: x.exp || x.experienceText || "",
    skills: x.skills || x.topSkills || x.candidate?.skills || [],
    shortlistedDate: String(x.shortlistedDate || x.createdAt || "").slice(0, 10),
    stage: x.stage || "HR Round",
    status: x.status || "Shortlisted",
    resumeUrl: x.resumeUrl || x.resume || x.candidate?.resumeUrl || "",
    aiMatch: x.aiMatch || x.match || "Moderate",
    location: x.location || x.candidate?.location || "-",
    notes: Array.isArray(x.notes) ? x.notes : [],
  };
}

function parseExpYears(value = "") {
  const nums = String(value).match(/\d+(\.\d+)?/g)?.map(Number) || [];
  return nums.length ? Math.max(...nums) : 0;
}

export default function Shortlisted() {
  const nav = useNavigate();
  const [list, setList] = useState([]);
  const [jobOptions, setJobOptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadErr, setLoadErr] = useState("");
  const [selected, setSelected] = useState([]);
  const [chip, setChip] = useState("");
  const [msgBusyId, setMsgBusyId] = useState("");

  const [filters, setFilters] = useState({
    jobId: "",
    interview: "",
    exp: "",
    location: "",
    date: "",
  });

  const [drawer, setDrawer] = useState({ open: false, candidate: null });
  const [offer, setOffer] = useState({
    open: false,
    candidate: null,
    salary: "",
    joining: "",
    expiry: "",
    message: "",
    file: "",
  });
  const openInterviewScheduler = (candidate) => {
    if (!candidate?.id) return notify("Candidate not found");
    const params = new URLSearchParams({
      openSchedule: "1",
      applicationId: String(candidate.id),
      candidate: String(candidate.name || ""),
      job: String(candidate.job || ""),
      stage: String(candidate.stage || "HR Round"),
    });
    nav(`/company/interviews?${params.toString()}`);
  };

  const notify = (m) => {
    void showSweetToast(m, "info", { timer: 1300 });
  };

  const fetchShortlisted = async (params = {}) => {
    try {
      setLoading(true);
      setLoadErr("");
      const res = await getCompanyShortlisted(params);
      const items = Array.isArray(res) ? res : res?.items || [];
      setList(items.map(normalizeShortlisted));
    } catch (e) {
      setLoadErr(e?.response?.data?.message || "Failed to load shortlisted candidates");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShortlisted();
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
            .map((j) => ({
              id: String(j?._id || j?.id || ""),
              title: String(j?.title || "").trim(),
            }))
            .filter((x) => x.id && x.title)
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
    return list.filter((c) => {
      if (filters.jobId && String(c.jobId || "") !== String(filters.jobId)) return false;
      if (filters.interview && c.status !== filters.interview) return false;
      if (filters.location && !String(c.location).toLowerCase().includes(filters.location.toLowerCase())) return false;
      if (filters.date && c.shortlistedDate !== filters.date) return false;
      if (filters.exp) {
        const y = parseExpYears(c.exp);
        if (filters.exp === "1-2" && (y < 1 || y > 2)) return false;
        if (filters.exp === "3-5" && (y < 3 || y > 5)) return false;
        if (filters.exp === "5+" && y < 5) return false;
      }
      if (chip === "Interview Pending" && c.status !== "Shortlisted") return false;
      if (chip === "Technical Round" && c.stage !== "Technical Round") return false;
      if (chip === "Final Round" && c.stage !== "Final Round") return false;
      if (chip === "Offer Pending" && c.status !== "Interview Completed") return false;
      return true;
    });
  }, [list, filters, chip]);

  const summary = useMemo(
    () => ({
      total: list.length,
      interview: list.filter((x) => x.status === "Interview Scheduled").length,
      offer: list.filter((x) => x.status === "Offer Sent").length,
      hired: list.filter((x) => x.status === "Hired").length,
    }),
    [list]
  );

  const toggle = (id) => setSelected((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));

  const toShortlistedParams = (f) => ({
    jobId: f.jobId || "",
    status: f.interview || "",
    location: f.location || "",
    date: f.date || "",
  });

  const updateFiltersNow = (key, value) => {
    setFilters((prev) => {
      const next = { ...prev, [key]: value };
      fetchShortlisted(toShortlistedParams(next));
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
    setList((p) => p.map((x) => (x.id === id ? { ...x, status } : x)));
    try {
      await apiUpdateStatus(id, status);
      notify(`Status set to ${status}`);
    } catch {
      notify("Failed to update status");
      await fetchShortlisted();
    }
  };

  const updateStage = async (id, stage) => {
    setList((p) => p.map((x) => (x.id === id ? { ...x, stage } : x)));
    try {
      await apiUpdateStage(id, stage);
    } catch {
      notify("Failed to update stage");
      await fetchShortlisted();
    }
  };

  const bulkUpdate = async (status) => {
    if (!selected.length) return;
    setList((p) => p.map((x) => (selected.includes(x.id) ? { ...x, status } : x)));
    try {
      await Promise.all(selected.map((id) => apiUpdateStatus(id, status)));
      setSelected([]);
      notify(`Moved selected to ${status}`);
    } catch {
      notify("Bulk update failed");
      await fetchShortlisted();
    }
  };

  const openResume = (candidate) => {
    if (!candidate?.resumeUrl) return notify("Resume not available");
    window.open(candidate.resumeUrl, "_blank", "noopener,noreferrer");
  };

  const downloadResume = (candidate) => {
    if (!candidate?.resumeUrl) return notify("Resume not available");
    const link = document.createElement("a");
    link.href = candidate.resumeUrl;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.download = `${candidate.name || "candidate"}_resume`;
    link.click();
  };

  const bulkDownloadResumes = (rows) => {
    const resumeRows = (rows || []).filter((x) => x.resumeUrl);
    if (!resumeRows.length) return notify("No resumes available");
    resumeRows.slice(0, 10).forEach((x) => downloadResume(x));
    notify(`Started download for ${Math.min(resumeRows.length, 10)} resumes`);
  };

  const exportCsv = () => {
    const headers = ["Candidate", "Email", "Job", "Experience", "Stage", "Status", "Shortlisted Date", "Location"];
    const lines = filtered.map((x) => [x.name, x.email, x.job, x.exp, x.stage, x.status, x.shortlistedDate, x.location]);
    const csv = [headers, ...lines]
      .map((row) => row.map((v) => `"${String(v ?? "").replaceAll('"', '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "company_shortlisted.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const openMessages = async (candidate) => {
    if (!candidate?.id) return notify("Missing candidate id");
    try {
      setMsgBusyId(candidate.id);
      const res = await createCompanyThread({ applicationId: candidate.id });
      const threadId = res?.thread?.id;
      if (!threadId) throw new Error("Thread not created");
      nav(`/company/messages?thread=${threadId}`);
    } catch (e) {
      notify(e?.response?.data?.message || "Failed to open messages");
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
      setList((p) => p.map((x) => (x.id === offer.candidate.id ? { ...x, status: "Offer Sent" } : x)));
      setOffer({ open: false, candidate: null, salary: "", joining: "", expiry: "", message: "", file: "" });
      notify("Offer sent");
    } catch (e) {
      notify(e?.response?.data?.message || "Offer failed");
      await fetchShortlisted();
    }
  };

  return (
    <div className="space-y-5 pb-24 md:pb-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold text-slate-500">Dashboard {">"} Shortlisted</p>
          <h1 className="mt-1 text-2xl font-bold text-[#0F172A]">Shortlisted Candidates</h1>
          <p className="mt-1 text-sm text-slate-500">Manage selected applicants and schedule interviews</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => bulkDownloadResumes(filtered)} className="rounded-xl border border-blue-200 px-4 py-2 text-sm font-semibold text-[#2563EB] hover:bg-blue-50">Bulk Download Resumes</button>
          <button
            onClick={() => {
              if (selected.length !== 1) return notify("Select exactly one candidate");
              const row = list.find((x) => x.id === selected[0]);
              if (row) openInterviewScheduler(row);
            }}
            className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Schedule Group Interview
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
        ].map(([k, v]) => (
          <div key={k} className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
            <div className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-[#2563EB]"><FiCheckCircle /></div>
            <p className="mt-2 text-lg font-bold text-[#0F172A]">{v}</p>
            <p className="text-xs text-slate-500">{k}</p>
          </div>
        ))}
      </section>

      <Card title="Filters">
        <div className="grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-5">
          <select value={filters.jobId} onChange={(e) => updateFiltersNow("jobId", e.target.value)} className="h-10 rounded-lg border border-slate-200 px-3 text-sm">
            <option value="">Job Title (optional)</option>
            {jobOptions.map((j) => (
              <option key={j.id} value={j.id}>
                {j.title}
              </option>
            ))}
          </select>
          <select value={filters.interview} onChange={(e) => updateFiltersNow("interview", e.target.value)} className="h-10 rounded-lg border border-slate-200 px-3 text-sm">
            <option value="">Status</option>
            <option>Shortlisted</option>
            <option>Interview Scheduled</option>
            <option>Interview Completed</option>
            <option>Offer Sent</option>
            <option>Hired</option>
            <option>Rejected</option>
          </select>
          <select value={filters.exp} onChange={(e) => updateFiltersNow("exp", e.target.value)} className="h-10 rounded-lg border border-slate-200 px-3 text-sm">
            <option value="">Experience</option>
            <option>1-2</option>
            <option>3-5</option>
            <option>5+</option>
          </select>
          <input value={filters.location} onChange={(e) => updateFiltersNow("location", e.target.value)} placeholder="Location" className="h-10 rounded-lg border border-slate-200 px-3 text-sm" />
          <input type="date" value={filters.date} onChange={(e) => updateFiltersNow("date", e.target.value)} className="h-10 rounded-lg border border-slate-200 px-3 text-sm" />
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <button onClick={applyFilters} className="rounded-lg bg-[#2563EB] px-4 py-2 text-sm font-semibold text-white">Apply Filter</button>
          <button onClick={clearFilters} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700">Clear</button>
        </div>
      </Card>

      <section className="flex flex-wrap gap-2">
        {quickChips.map((x) => (
          <button key={x} onClick={() => setChip((p) => (p === x ? "" : x))} className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${chip === x ? "border-blue-200 bg-blue-50 text-[#2563EB]" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"}`}>
            {x}
          </button>
        ))}
      </section>

      <Card title="Shortlist Table">
        {loading ? (
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">Loading shortlisted...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1100px] text-left text-sm">
              <thead>
                <tr className="text-slate-500">
                  <th className="pb-2"><input type="checkbox" checked={selected.length > 0 && selected.length === filtered.length} onChange={() => setSelected(selected.length === filtered.length ? [] : filtered.map((x) => x.id))} /></th>
                  <th className="pb-2">Candidate</th><th className="pb-2">Applied Job</th><th className="pb-2">Experience</th><th className="pb-2">Key Skills</th><th className="pb-2">Shortlisted Date</th><th className="pb-2">Interview Stage</th><th className="pb-2">Status</th><th className="pb-2">Resume</th><th className="pb-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => (
                  <tr key={c.id} className="border-t border-slate-100 hover:bg-blue-50/40">
                    <td className="py-3"><input type="checkbox" checked={selected.includes(c.id)} onChange={() => toggle(c.id)} /></td>
                    <td className="py-3"><button onClick={() => setDrawer({ open: true, candidate: c })} className="font-semibold text-[#0F172A] hover:text-[#2563EB]">{c.name}</button></td>
                    <td className="py-3">{c.job}</td>
                    <td className="py-3">{c.exp || "-"}</td>
                    <td className="py-3"><div className="flex flex-wrap gap-1">{(c.skills || []).map((s, index) => <span key={`${c.id}_${s}_${index}`} className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs">{s}</span>)}</div></td>
                    <td className="py-3">{c.shortlistedDate || "-"}</td>
                    <td className="py-3"><select value={c.stage} onChange={(e) => updateStage(c.id, e.target.value)} className="h-8 rounded-lg border border-slate-200 px-2 text-xs">{STAGES.map((s) => <option key={s}>{s}</option>)}</select></td>
                    <td className="py-3"><span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${STATUS[c.status] || "border-slate-200 bg-slate-100 text-slate-600"}`}>{c.status}</span></td>
                    <td className="py-3">
                      <div className="flex items-center gap-1">
                        <button onClick={() => openResume(c)} className="text-xs font-semibold text-[#2563EB]">View</button>
                        <button onClick={() => downloadResume(c)} className="rounded-md border border-slate-200 p-1"><FiDownload /></button>
                      </div>
                    </td>
                    <td className="py-3">
                      <div className="flex items-center gap-1">
                        <button onClick={() => setDrawer({ open: true, candidate: c })} className="rounded-md border border-blue-200 p-1.5 text-[#2563EB] hover:bg-blue-50"><FiEye /></button>
                        <button onClick={() => openInterviewScheduler(c)} className="rounded-md border border-blue-200 p-1.5 text-[#2563EB] hover:bg-blue-50"><FiCalendar /></button>
                        <button onClick={() => openMessages(c)} disabled={msgBusyId === c.id} className={`rounded-md border border-blue-200 p-1.5 text-[#2563EB] hover:bg-blue-50 ${msgBusyId === c.id ? "opacity-60 cursor-not-allowed" : ""}`}><FiMessageCircle /></button>
                        <button onClick={() => setOffer((p) => ({ ...p, open: true, candidate: c }))} className="rounded-md border border-orange-200 p-1.5 text-[#F97316] hover:bg-orange-50"><FiFileText /></button>
                        <button onClick={() => updateStatus(c.id, "Hired")} className="rounded-md border border-green-200 p-1.5 text-green-700 hover:bg-green-50"><FiCheckCircle /></button>
                        <button onClick={() => updateStatus(c.id, "Rejected")} className="rounded-md border border-red-200 p-1.5 text-red-600 hover:bg-red-50"><FiX /></button>
                        <button onClick={() => setDrawer({ open: true, candidate: c })} className="rounded-md border border-slate-200 p-1.5 text-slate-600 hover:bg-slate-50"><FiMoreHorizontal /></button>
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

      {selected.length > 0 ? (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-blue-200 bg-blue-50/95 p-3 shadow-[0_-8px_24px_rgba(37,99,235,0.2)]">
          <div className="mx-auto flex w-full max-w-[1200px] flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-semibold text-[#1E40AF]">{selected.length} selected</p>
            <div className="flex flex-wrap gap-2">
              <button onClick={() => { if (selected.length !== 1) return notify("Select exactly one candidate"); const row = list.find((x) => x.id === selected[0]); if (row) openInterviewScheduler(row); }} className="rounded-lg border border-blue-200 bg-white px-3 py-1.5 text-xs font-semibold text-[#2563EB]">Schedule Interview</button>
              <button onClick={() => { if (selected.length !== 1) return notify("Select exactly one candidate"); const row = list.find((x) => x.id === selected[0]); if (row) openMessages(row); }} className="rounded-lg border border-blue-200 bg-white px-3 py-1.5 text-xs font-semibold text-[#2563EB]">Send Message</button>
              <button onClick={() => { if (selected.length !== 1) return notify("Select exactly one candidate"); const row = list.find((x) => x.id === selected[0]); if (row) setOffer((p) => ({ ...p, open: true, candidate: row })); }} className="rounded-lg border border-orange-200 bg-white px-3 py-1.5 text-xs font-semibold text-[#F97316]">Send Offer</button>
              <button onClick={() => bulkUpdate("Hired")} className="rounded-lg border border-green-200 bg-white px-3 py-1.5 text-xs font-semibold text-green-700">Move to Hired</button>
              <button onClick={() => bulkDownloadResumes(list.filter((x) => selected.includes(x.id)))} className="rounded-lg border border-blue-200 bg-white px-3 py-1.5 text-xs font-semibold text-[#2563EB]">Download Resumes</button>
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
              <p className="text-base font-semibold text-[#0F172A]">{drawer.candidate?.name}</p>
              <p className="text-slate-500">{drawer.candidate?.job} • {drawer.candidate?.location}</p>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <p><span className="font-semibold">Experience:</span> {drawer.candidate?.exp || "-"}</p>
                <p className="mt-1"><span className="font-semibold">Skills:</span> {(drawer.candidate?.skills || []).join(", ") || "-"}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <p className="font-semibold text-[#0F172A]">Notes</p>
                <div className="mt-2 flex flex-wrap gap-1">
                  {(drawer.candidate?.notes || []).map((n) => <span key={n} className="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-xs">{n}</span>)}
                </div>
              </div>
              <div className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs text-[#1E40AF]">AI Match: {drawer.candidate?.aiMatch}</div>
              <div className="flex flex-wrap gap-2">
                <button onClick={() => openInterviewScheduler(drawer.candidate)} className="rounded-lg border border-blue-200 px-3 py-2 text-xs font-semibold text-[#2563EB] hover:bg-blue-50">Schedule Interview</button>
                <button onClick={() => openMessages(drawer.candidate)} className="rounded-lg border border-blue-200 px-3 py-2 text-xs font-semibold text-[#2563EB] hover:bg-blue-50">Message</button>
                <button onClick={() => setOffer((p) => ({ ...p, open: true, candidate: drawer.candidate }))} className="rounded-lg border border-orange-200 px-3 py-2 text-xs font-semibold text-[#F97316] hover:bg-orange-50">Send Offer</button>
                <button onClick={() => openResume(drawer.candidate)} className="rounded-lg border border-blue-200 px-3 py-2 text-xs font-semibold text-[#2563EB] hover:bg-blue-50">Resume</button>
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
          <input value={offer.salary} onChange={(e) => setOffer((p) => ({ ...p, salary: e.target.value }))} placeholder="Salary Offered" className="h-10 rounded-lg border border-slate-200 px-3 text-sm" />
          <input type="date" value={offer.joining} onChange={(e) => setOffer((p) => ({ ...p, joining: e.target.value }))} className="h-10 rounded-lg border border-slate-200 px-3 text-sm" />
          <input type="date" value={offer.expiry} onChange={(e) => setOffer((p) => ({ ...p, expiry: e.target.value }))} className="h-10 rounded-lg border border-slate-200 px-3 text-sm" />
          <input value={offer.file} onChange={(e) => setOffer((p) => ({ ...p, file: e.target.value }))} placeholder="Offer PDF filename" className="h-10 rounded-lg border border-slate-200 px-3 text-sm" />
          <textarea value={offer.message} onChange={(e) => setOffer((p) => ({ ...p, message: e.target.value }))} rows={3} placeholder="Message" className="rounded-lg border border-slate-200 px-3 py-2 text-sm sm:col-span-2" />
        </div>
      </Modal>

    </div>
  );
}
