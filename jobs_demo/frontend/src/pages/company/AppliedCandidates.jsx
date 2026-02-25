
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiCalendar,
  FiCheckCircle,
  FiDownload,
  FiEye,
  FiFileText,
  FiMail,
  FiMessageCircle,
  FiMoreHorizontal,
  FiPhone,
  FiSearch,
  FiUsers,
  FiX,
} from "react-icons/fi";
import Modal from "../../components/common/Modal.jsx";
import {
  bulkUpdateApplicationStatus,
  getCompanyApplications,
  listCompanyJobs,
  scheduleInterview as apiScheduleInterview,
  updateApplicationStatus,
} from "../../services/companyService";
import { createCompanyThread } from "../../services/messagesService.js";

const STATUS_STYLES = {
  Applied: "border-blue-200 bg-blue-50 text-[#2563EB]",
  Shortlisted: "border-green-200 bg-green-50 text-green-700",
  Hold: "border-orange-200 bg-orange-50 text-[#F97316]",
  Rejected: "border-red-200 bg-red-50 text-red-600",
  "Interview Scheduled": "border-indigo-200 bg-indigo-50 text-indigo-700",
};

const MATCH_STYLES = {
  Strong: "border-green-200 bg-green-50 text-green-700",
  Moderate: "border-orange-200 bg-orange-50 text-[#F97316]",
  Low: "border-slate-200 bg-slate-100 text-slate-600",
};

const quickChips = ["New", "Strong Match", "Fresher Friendly", "Interview Pending", "Needs Review", "High Experience"];

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

function normalizeApp(a) {
  return {
    id: a.id || a._id,
    jobId: a.jobId || a.job?._id || "",
    name: a.name || a.candidateName || "Candidate",
    job: a.job || a.jobTitle || "-",
    exp: String(a.exp || a.experience || ""),
    location: a.location || "-",
    skills: a.skills || a.topSkills || [],
    date: a.date || a.appliedDate || a.createdAt || "",
    status: a.status || "Applied",
    match: a.match || a.aiMatch || "Moderate",
    resumeUrl: a.resumeUrl || a.resume || "",
    phone: a.phone || "",
    email: a.email || "",
  };
}

function onlyDigits(value = "") {
  return String(value).replace(/\D/g, "");
}

export default function AppliedCandidates() {
  const nav = useNavigate();
  const [apps, setApps] = useState([]);
  const [jobOptions, setJobOptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadErr, setLoadErr] = useState("");

  const [view, setView] = useState("table");
  const [selectedIds, setSelectedIds] = useState([]);
  const [chip, setChip] = useState("");
  const [toast, setToast] = useState("");
  const [openMenuId, setOpenMenuId] = useState(null);
  const [profileDrawer, setProfileDrawer] = useState({ open: false, app: null });
  const [scheduleModal, setScheduleModal] = useState({ open: false, app: null });
  const [msgBusyId, setMsgBusyId] = useState(null);

  const [scheduleForm, setScheduleForm] = useState({
    date: "",
    time: "",
    type: "Online",
    link: "",
    round: "HR",
    message: "",
  });

  const [draftFilters, setDraftFilters] = useState({
    q: "",
    jobId: "",
    status: "All",
    experience: "",
    location: "",
    skills: "",
    dateRange: "",
    aiMatch: "All",
  });
  const [filters, setFilters] = useState({
    q: "",
    jobId: "",
    status: "All",
    experience: "",
    location: "",
    skills: "",
    dateRange: "",
    aiMatch: "All",
  });

  const actionToast = (message) => {
    setToast(message);
    setTimeout(() => setToast(""), 1400);
  };

  const fetchApps = async (f = filters) => {
    try {
      setLoadErr("");
      setLoading(true);
      const res = await getCompanyApplications(f);
      const items = Array.isArray(res) ? res : res?.items || [];
      setApps(items.map(normalizeApp));
    } catch (e) {
      setLoadErr(e?.response?.data?.message || "Failed to load applications");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApps(filters);
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
  const kpi = useMemo(() => {
    const total = apps.length;
    const today = new Date().toISOString().slice(0, 10);
    const newToday = apps.filter((a) => String(a.date).slice(0, 10) === today).length;
    const shortlisted = apps.filter((a) => a.status === "Shortlisted").length;
    const hold = apps.filter((a) => a.status === "Hold").length;
    const rejected = apps.filter((a) => a.status === "Rejected").length;
    return { total, newToday, shortlisted, hold, rejected };
  }, [apps]);

  const filtered = useMemo(() => {
    return apps.filter((a) => {
      if (filters.q && !`${a.name} ${a.job} ${a.location} ${a.skills.join(" ")}`.toLowerCase().includes(filters.q.toLowerCase())) return false;
      if (filters.jobId && String(a.jobId || "") !== String(filters.jobId)) return false;
      if (filters.status !== "All" && a.status !== filters.status) return false;
      if (filters.location && !a.location.toLowerCase().includes(filters.location.toLowerCase())) return false;
      if (filters.skills && !a.skills.join(" ").toLowerCase().includes(filters.skills.toLowerCase())) return false;
      if (filters.aiMatch !== "All" && a.match !== filters.aiMatch) return false;

      const expNum = Number(a.exp || 0);
      if (filters.experience === "0-1" && expNum > 1) return false;
      if (filters.experience === "2-4" && (expNum < 2 || expNum > 4)) return false;
      if (filters.experience === "5+" && expNum < 5) return false;

      if (filters.dateRange) {
        const appDate = Date.parse(a.date || "");
        if (Number.isFinite(appDate)) {
          const days = Math.floor((Date.now() - appDate) / (1000 * 60 * 60 * 24));
          if (filters.dateRange === "last7" && days > 7) return false;
          if (filters.dateRange === "last30" && days > 30) return false;
          if (filters.dateRange === "last90" && days > 90) return false;
        }
      }

      if (chip === "Strong Match" && a.match !== "Strong") return false;
      if (chip === "Needs Review" && a.status !== "Applied") return false;
      if (chip === "Interview Pending" && a.status !== "Shortlisted") return false;
      if (chip === "Fresher Friendly" && expNum > 1) return false;
      if (chip === "High Experience" && expNum < 3) return false;
      if (chip === "New") {
        const today = new Date().toISOString().slice(0, 10);
        if (String(a.date).slice(0, 10) !== today) return false;
      }
      return true;
    });
  }, [apps, filters, chip]);

  const kanbanCols = useMemo(
    () => ({
      Applied: filtered.filter((a) => a.status === "Applied"),
      Shortlisted: filtered.filter((a) => a.status === "Shortlisted"),
      Hold: filtered.filter((a) => a.status === "Hold"),
      Interview: filtered.filter((a) => a.status === "Interview Scheduled"),
      Rejected: filtered.filter((a) => a.status === "Rejected"),
    }),
    [filtered]
  );

  const toggleSelect = (id) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const toggleAll = () => {
    if (selectedIds.length === filtered.length) setSelectedIds([]);
    else setSelectedIds(filtered.map((a) => a.id));
  };

  const applyFilters = async () => {
    setFilters(draftFilters);
    await fetchApps(draftFilters);
  };

  const clearFilters = async () => {
    const reset = { q: "", jobId: "", status: "All", experience: "", location: "", skills: "", dateRange: "", aiMatch: "All" };
    setDraftFilters(reset);
    setFilters(reset);
    setChip("");
    await fetchApps(reset);
  };

  const setStatus = async (id, status) => {
    setApps((prev) => prev.map((a) => (a.id === id ? { ...a, status } : a)));
    setOpenMenuId(null);
    try {
      await updateApplicationStatus(id, status);
      actionToast(`Status updated to ${status}`);
    } catch {
      actionToast("Failed to update status");
      await fetchApps(filters);
    }
  };

  const bulkUpdate = async (status) => {
    if (!selectedIds.length) return;
    setApps((prev) => prev.map((a) => (selectedIds.includes(a.id) ? { ...a, status } : a)));
    try {
      await bulkUpdateApplicationStatus(selectedIds, status);
      setSelectedIds([]);
      actionToast(`Updated ${status} for selected`);
    } catch {
      actionToast("Bulk update failed");
      await fetchApps(filters);
    }
  };

  const scheduleInterview = async () => {
    if (!scheduleModal.app || !scheduleForm.date || !scheduleForm.time) return;
    const appId = scheduleModal.app.id;
    setApps((prev) => prev.map((a) => (a.id === appId ? { ...a, status: "Interview Scheduled" } : a)));
    try {
      await apiScheduleInterview(appId, scheduleForm);
      setScheduleModal({ open: false, app: null });
      setScheduleForm({ date: "", time: "", type: "Online", link: "", round: "HR", message: "" });
      actionToast("Interview scheduled and candidate notified.");
    } catch {
      actionToast("Failed to schedule interview");
      await fetchApps(filters);
    }
  };

  const openMessages = async (app) => {
    if (!app?.id) return actionToast("Missing application id");
    try {
      setMsgBusyId(app.id);
      const res = await createCompanyThread({ applicationId: app.id });
      const threadId = res?.thread?.id;
      if (!threadId) throw new Error("Thread not created");
      nav(`/company/messages?thread=${threadId}`);
    } catch (e) {
      actionToast(e?.response?.data?.message || "Failed to open messages");
    } finally {
      setMsgBusyId(null);
    }
  };

  const openResume = (app) => {
    if (!app?.resumeUrl) return actionToast("Resume not available");
    window.open(app.resumeUrl, "_blank", "noopener,noreferrer");
  };

  const downloadResume = (app) => {
    if (!app?.resumeUrl) return actionToast("Resume not available");
    const link = document.createElement("a");
    link.href = app.resumeUrl;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.download = `${app.name || "candidate"}_resume`;
    link.click();
  };

  const exportCsv = () => {
    const header = ["Candidate", "Email", "Phone", "Job", "Experience", "Location", "Skills", "Status", "Match", "Applied Date"];
    const rows = filtered.map((a) => [a.name, a.email, a.phone, a.job, a.exp, a.location, (a.skills || []).join(" | "), a.status, a.match, String(a.date).slice(0, 10)]);
    const csv = [header, ...rows].map((r) => r.map((v) => `"${String(v ?? "").replaceAll('"', '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "company_applications.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const bulkDownloadResumes = () => {
    const candidates = filtered.filter((a) => Boolean(a.resumeUrl));
    if (!candidates.length) return actionToast("No resumes available in current list");
    candidates.slice(0, 10).forEach((a) => {
      const link = document.createElement("a");
      link.href = a.resumeUrl;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.download = `${a.name || "candidate"}_resume`;
      link.click();
    });
    actionToast(`Started download for ${Math.min(candidates.length, 10)} resumes`);
  };

  const openCall = (app) => {
    const phone = onlyDigits(app?.phone);
    if (!phone) return actionToast("Phone not available");
    window.location.href = `tel:${phone}`;
  };

  const openMail = (app) => {
    if (!app?.email) return actionToast("Email not available");
    window.location.href = `mailto:${app.email}`;
  };

  const openWhatsApp = (app) => {
    const phone = onlyDigits(app?.phone);
    if (!phone) return actionToast("Phone not available");
    window.open(`https://wa.me/${phone}`, "_blank", "noopener,noreferrer");
  };
  return (
    <div className="space-y-5 pb-24 md:pb-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold text-slate-500">Dashboard {">"} Applications</p>
          <h1 className="mt-1 text-2xl font-bold text-[#0F172A]">Applications</h1>
          <p className="mt-1 text-sm text-slate-500">Review candidates, shortlist faster, and schedule interviews</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={exportCsv} className="rounded-xl border border-blue-200 px-4 py-2 text-sm font-semibold text-[#2563EB] hover:bg-blue-50">Export CSV</button>
          <button type="button" onClick={bulkDownloadResumes} className="rounded-xl border border-blue-200 px-4 py-2 text-sm font-semibold text-[#2563EB] hover:bg-blue-50">Bulk Download Resumes</button>
          <button type="button" onClick={clearFilters} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">Reset Filters</button>
          <div className="flex rounded-xl border border-slate-200 p-0.5">
            <button type="button" onClick={() => setView("table")} className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${view === "table" ? "bg-blue-50 text-[#2563EB]" : "text-slate-600"}`}>Table</button>
            <button type="button" onClick={() => setView("kanban")} className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${view === "kanban" ? "bg-blue-50 text-[#2563EB]" : "text-slate-600"}`}>Kanban</button>
          </div>
        </div>
      </header>

      {loadErr ? <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{loadErr}</div> : null}

      <section className="grid grid-cols-2 gap-2 md:grid-cols-5">
        {["Total Applications", "New Today", "Shortlisted", "On Hold", "Rejected"].map((label, idx) => {
          const values = [kpi.total, kpi.newToday, kpi.shortlisted, kpi.hold, kpi.rejected];
          return (
            <div key={label} className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
              <div className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-[#2563EB]"><FiUsers /></div>
              <p className="mt-2 text-lg font-bold text-[#0F172A]">{values[idx]}</p>
              <p className="text-xs text-slate-500">{label}</p>
            </div>
          );
        })}
      </section>

      <Card title="Advanced Filters">
        <div className="grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-4">
          <div className="relative xl:col-span-2">
            <FiSearch className="pointer-events-none absolute left-3 top-3 text-slate-400" />
            <input value={draftFilters.q} onChange={(e) => setDraftFilters((p) => ({ ...p, q: e.target.value }))} placeholder="Search candidates, skills, jobs..." className="h-10 w-full rounded-lg border border-slate-200 pl-9 pr-3 text-sm outline-none focus:border-blue-300" />
          </div>
          <select value={draftFilters.jobId} onChange={(e) => setDraftFilters((p) => ({ ...p, jobId: e.target.value }))} className="h-10 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-blue-300">
            <option value="">Job title</option>
            {jobOptions.map((j) => (
              <option key={j.id} value={j.id}>
                {j.title}
              </option>
            ))}
          </select>
          <select value={draftFilters.status} onChange={(e) => setDraftFilters((p) => ({ ...p, status: e.target.value }))} className="h-10 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-blue-300"><option>All</option><option>Applied</option><option>Shortlisted</option><option>Hold</option><option>Rejected</option><option>Interview Scheduled</option></select>
          <input value={draftFilters.location} onChange={(e) => setDraftFilters((p) => ({ ...p, location: e.target.value }))} placeholder="Location" className="h-10 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-blue-300" />
          <input value={draftFilters.skills} onChange={(e) => setDraftFilters((p) => ({ ...p, skills: e.target.value }))} placeholder="Skills (tag search)" className="h-10 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-blue-300" />
          <select value={draftFilters.experience} onChange={(e) => setDraftFilters((p) => ({ ...p, experience: e.target.value }))} className="h-10 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-blue-300"><option value="">Experience</option><option value="0-1">0-1 years</option><option value="2-4">2-4 years</option><option value="5+">5+ years</option></select>
          <select value={draftFilters.dateRange} onChange={(e) => setDraftFilters((p) => ({ ...p, dateRange: e.target.value }))} className="h-10 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-blue-300"><option value="">Applied Date</option><option value="last7">Last 7 days</option><option value="last30">Last 30 days</option><option value="last90">Last 90 days</option></select>
          <select value={draftFilters.aiMatch} onChange={(e) => setDraftFilters((p) => ({ ...p, aiMatch: e.target.value }))} className="h-10 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-blue-300"><option>All</option><option>Strong</option><option>Moderate</option><option>Low</option></select>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <button type="button" onClick={applyFilters} className="rounded-lg bg-[#2563EB] px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">Apply Filters</button>
          <button type="button" onClick={clearFilters} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">Clear</button>
        </div>
      </Card>

      <section className="flex flex-wrap gap-2">
        {quickChips.map((x) => (
          <button key={x} type="button" onClick={() => setChip((p) => (p === x ? "" : x))} className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${chip === x ? "border-blue-200 bg-blue-50 text-[#2563EB]" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"}`}>{x}</button>
        ))}
      </section>

      {loading ? (
        <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-600">Loading applications...</div>
      ) : view === "table" ? (
        <Card title="Applications Table">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1250px] text-left text-sm">
              <thead>
                <tr className="text-slate-500">
                  <th className="pb-2"><input type="checkbox" checked={selectedIds.length > 0 && selectedIds.length === filtered.length} onChange={toggleAll} /></th>
                  <th className="pb-2">Candidate</th><th className="pb-2">Applied Job</th><th className="pb-2">Experience</th><th className="pb-2">Key Skills</th><th className="pb-2">Resume</th><th className="pb-2">AI Match</th><th className="pb-2">Applied Date</th><th className="pb-2">Status</th><th className="pb-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((a) => (
                  <tr key={a.id} className="border-t border-slate-100 hover:bg-blue-50/40">
                    <td className="py-3"><input type="checkbox" checked={selectedIds.includes(a.id)} onChange={() => toggleSelect(a.id)} /></td>
                    <td className="py-3"><button type="button" onClick={() => setProfileDrawer({ open: true, app: a })} className="font-semibold text-[#0F172A] hover:text-[#2563EB]">{a.name}</button></td>
                    <td className="py-3 text-slate-700">{a.job}</td>
                    <td className="py-3 text-slate-700">{a.exp ? `${a.exp} yrs` : "-"}</td>
                    <td className="py-3"><div className="flex flex-wrap gap-1">{(a.skills || []).slice(0, 2).map((s) => <span key={`${a.id}_${s}`} className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs text-slate-600">{s}</span>)}</div></td>
                    <td className="py-3"><div className="flex items-center gap-1"><button type="button" onClick={() => openResume(a)} className="text-xs font-semibold text-[#2563EB] hover:underline">View</button><button type="button" onClick={() => downloadResume(a)} className="rounded-md border border-slate-200 p-1 text-slate-600 hover:bg-slate-50"><FiDownload /></button><span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-semibold text-slate-500">{a.resumeUrl ? "PDF" : "NA"}</span></div></td>
                    <td className="py-3"><span className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${MATCH_STYLES[a.match] || MATCH_STYLES.Moderate}`}>{a.match}</span></td>
                    <td className="py-3 text-slate-600">{String(a.date).slice(0, 10) || "-"}</td>
                    <td className="py-3"><span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${STATUS_STYLES[a.status] || STATUS_STYLES.Applied}`}>{a.status}</span></td>
                    <td className="py-3">
                      <div className="flex items-center gap-1">
                        <button type="button" onClick={() => setProfileDrawer({ open: true, app: a })} className="rounded-md border border-blue-200 p-1.5 text-[#2563EB] hover:bg-blue-50"><FiEye /></button>
                        <button type="button" onClick={() => setStatus(a.id, "Shortlisted")} className="rounded-md border border-green-200 p-1.5 text-green-700 hover:bg-green-50"><FiCheckCircle /></button>
                        <button type="button" onClick={() => setStatus(a.id, "Hold")} className="rounded-md border border-orange-200 p-1.5 text-[#F97316] hover:bg-orange-50"><FiFileText /></button>
                        <button type="button" onClick={() => setStatus(a.id, "Rejected")} className="rounded-md border border-red-200 p-1.5 text-red-600 hover:bg-red-50"><FiX /></button>
                        <button type="button" onClick={() => setScheduleModal({ open: true, app: a })} className="rounded-md border border-blue-200 p-1.5 text-[#2563EB] hover:bg-blue-50"><FiCalendar /></button>
                        <button type="button" disabled={msgBusyId === a.id} onClick={() => openMessages(a)} className={`rounded-md border border-blue-200 p-1.5 text-[#2563EB] hover:bg-blue-50 ${msgBusyId === a.id ? "opacity-60 cursor-not-allowed" : ""}`}><FiMessageCircle /></button>
                        <button type="button" onClick={() => openWhatsApp(a)} className="rounded-md border border-green-200 p-1.5 text-green-700 hover:bg-green-50"><FiMessageCircle /></button>
                        <button type="button" onClick={() => openCall(a)} className="rounded-md border border-slate-200 p-1.5 text-slate-700 hover:bg-slate-50"><FiPhone /></button>
                        <button type="button" onClick={() => openMail(a)} className="rounded-md border border-blue-200 p-1.5 text-[#2563EB] hover:bg-blue-50"><FiMail /></button>
                        <div className="relative">
                          <button type="button" onClick={() => setOpenMenuId((v) => (v === a.id ? null : a.id))} className="rounded-md border border-slate-200 p-1.5 text-slate-600 hover:bg-slate-50"><FiMoreHorizontal /></button>
                          {openMenuId === a.id ? <div className="absolute right-0 top-8 z-20 w-40 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg"><button type="button" onClick={() => { setStatus(a.id, "Applied"); setOpenMenuId(null); }} className="block w-full px-3 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-slate-50">Move to Applied</button></div> : null}
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 ? <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">No applications found.</div> : null}
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
          {Object.entries(kanbanCols).map(([col, list]) => (
            <Card key={col} title={`${col} (${list.length})`}>
              <div className="space-y-2">
                {list.map((a) => (
                  <div key={a.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                    <p className="text-sm font-semibold text-[#0F172A]">{a.name}</p>
                    <p className="text-xs text-slate-500">{a.job} - {a.exp || "-"} yrs</p>
                    <span className={`mt-2 inline-flex rounded-full border px-2 py-0.5 text-[11px] font-semibold ${MATCH_STYLES[a.match] || MATCH_STYLES.Moderate}`}>{a.match}</span>
                    <div className="mt-2 flex gap-1">
                      <button type="button" onClick={() => setStatus(a.id, "Shortlisted")} className="rounded-md border border-green-200 px-2 py-1 text-[11px] font-semibold text-green-700 hover:bg-green-50">Shortlist</button>
                      <button type="button" onClick={() => setStatus(a.id, "Hold")} className="rounded-md border border-orange-200 px-2 py-1 text-[11px] font-semibold text-[#F97316] hover:bg-orange-50">Hold</button>
                      <button type="button" onClick={() => setStatus(a.id, "Rejected")} className="rounded-md border border-red-200 px-2 py-1 text-[11px] font-semibold text-red-600 hover:bg-red-50">Reject</button>
                      <button type="button" onClick={() => openMessages(a)} className="rounded-md border border-blue-200 px-2 py-1 text-[11px] font-semibold text-[#2563EB] hover:bg-blue-50">Message</button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>
      )}

      {selectedIds.length > 0 ? (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-blue-200 bg-blue-50/95 p-3 shadow-[0_-8px_24px_rgba(37,99,235,0.2)] backdrop-blur">
          <div className="mx-auto flex w-full max-w-[1200px] flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-semibold text-[#1E40AF]">{selectedIds.length} selected</p>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => bulkUpdate("Shortlisted")} className="rounded-lg border border-green-200 bg-white px-3 py-1.5 text-xs font-semibold text-green-700 hover:bg-green-50">Shortlist Selected</button>
              <button type="button" onClick={() => bulkUpdate("Hold")} className="rounded-lg border border-orange-200 bg-white px-3 py-1.5 text-xs font-semibold text-[#F97316] hover:bg-orange-50">Hold Selected</button>
              <button type="button" onClick={() => bulkUpdate("Rejected")} className="rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50">Reject Selected</button>
            </div>
          </div>
        </div>
      ) : null}

      {profileDrawer.open ? (
        <div className="fixed inset-0 z-40">
          <div className="absolute inset-0 bg-slate-900/30" onClick={() => setProfileDrawer({ open: false, app: null })} />
          <aside className="absolute right-0 top-0 h-full w-full max-w-md overflow-y-auto border-l border-slate-200 bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
              <h3 className="text-sm font-semibold text-[#0F172A]">Candidate Profile</h3>
              <button type="button" onClick={() => setProfileDrawer({ open: false, app: null })} className="rounded-lg border border-slate-200 p-1.5 text-slate-600 hover:bg-slate-50"><FiX /></button>
            </div>
            <div className="space-y-3 p-4">
              <div>
                <p className="text-base font-semibold text-[#0F172A]">{profileDrawer.app?.name}</p>
                <p className="text-sm text-slate-500">{profileDrawer.app?.job} - {profileDrawer.app?.location}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
                <p><span className="font-semibold text-[#0F172A]">Experience:</span> {profileDrawer.app?.exp || "-"} years</p>
                <p className="mt-1"><span className="font-semibold text-[#0F172A]">Skills:</span> {(profileDrawer.app?.skills || []).join(", ") || "-"}</p>
                <p className="mt-1"><span className="font-semibold text-[#0F172A]">Resume:</span> {profileDrawer.app?.resumeUrl ? "Available" : "-"}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => setStatus(profileDrawer.app.id, "Shortlisted")} className="rounded-lg border border-green-200 px-3 py-2 text-xs font-semibold text-green-700 hover:bg-green-50">Shortlist</button>
                <button type="button" onClick={() => setStatus(profileDrawer.app.id, "Hold")} className="rounded-lg border border-orange-200 px-3 py-2 text-xs font-semibold text-[#F97316] hover:bg-orange-50">Hold</button>
                <button type="button" onClick={() => setStatus(profileDrawer.app.id, "Rejected")} className="rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50">Reject</button>
                <button type="button" onClick={() => setScheduleModal({ open: true, app: profileDrawer.app })} className="rounded-lg border border-blue-200 px-3 py-2 text-xs font-semibold text-[#2563EB] hover:bg-blue-50">Schedule Interview</button>
                <button type="button" onClick={() => openMessages(profileDrawer.app)} className="rounded-lg border border-blue-200 px-3 py-2 text-xs font-semibold text-[#2563EB] hover:bg-blue-50">Message</button>
              </div>
            </div>
          </aside>
        </div>
      ) : null}

      <Modal
        open={scheduleModal.open}
        onClose={() => setScheduleModal({ open: false, app: null })}
        title="Schedule Interview"
        footer={
          <>
            <button type="button" onClick={() => setScheduleModal({ open: false, app: null })} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">Cancel</button>
            <button type="button" onClick={scheduleInterview} className="rounded-lg bg-[#2563EB] px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">Send Invite</button>
          </>
        }
      >
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <input type="date" value={scheduleForm.date} onChange={(e) => setScheduleForm((p) => ({ ...p, date: e.target.value }))} className="h-10 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-blue-300" />
          <input type="time" value={scheduleForm.time} onChange={(e) => setScheduleForm((p) => ({ ...p, time: e.target.value }))} className="h-10 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-blue-300" />
          <select value={scheduleForm.type} onChange={(e) => setScheduleForm((p) => ({ ...p, type: e.target.value }))} className="h-10 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-blue-300"><option>Online</option><option>Onsite</option></select>
          <select value={scheduleForm.round} onChange={(e) => setScheduleForm((p) => ({ ...p, round: e.target.value }))} className="h-10 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-blue-300"><option>HR</option><option>Technical</option><option>Final</option></select>
          <input value={scheduleForm.link} onChange={(e) => setScheduleForm((p) => ({ ...p, link: e.target.value }))} placeholder="Meeting link (if online)" className="h-10 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-blue-300 sm:col-span-2" />
          <textarea value={scheduleForm.message} onChange={(e) => setScheduleForm((p) => ({ ...p, message: e.target.value }))} rows={3} placeholder="Message to candidate" className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-300 sm:col-span-2" />
        </div>
      </Modal>

      {toast ? <div className="fixed bottom-5 right-5 rounded-lg bg-[#0F172A] px-3 py-2 text-xs font-semibold text-white shadow-lg">{toast}</div> : null}
    </div>
  );
}
