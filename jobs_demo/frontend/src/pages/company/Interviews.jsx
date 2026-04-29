import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  FiCalendar,
  FiCheckCircle,
  FiClock,
  FiCopy,
  FiFilter,
  FiGrid,
  FiList,
  FiPlayCircle,
  FiSearch,
  FiUserCheck,
} from "react-icons/fi";
import { showSweetToast } from "../../utils/sweetAlert.js";
import { getCompanyApplications } from "../../services/companyService.js";
import {
  admitCompanyCandidate,
  createCompanyInterview,
  getCompanyInterviews,
  startCompanyInterview,
} from "../../services/interviewsService.js";

const TABS = [
  { id: "pending", label: "Interview Pending" },
  { id: "scheduled", label: "Scheduled / Waiting" },
  { id: "ongoing", label: "Ongoing" },
  { id: "completed", label: "Completed" },
  { id: "cancelled", label: "No-show / Cancelled" },
  { id: "all", label: "All" },
];
const STATUS_BADGE_STYLES = {
  Pending: "border-blue-200 bg-blue-50 text-[#2563EB]",
  Scheduled: "border-amber-200 bg-amber-50 text-amber-700",
  Rescheduled: "border-amber-200 bg-amber-50 text-amber-700",
  "Waiting Room": "border-violet-200 bg-violet-50 text-violet-700",
  Live: "border-green-200 bg-green-50 text-green-700",
  Completed: "border-slate-200 bg-slate-100 text-slate-700",
  "Review Ready": "border-cyan-200 bg-cyan-50 text-cyan-700",
  Cancelled: "border-red-200 bg-red-50 text-red-700",
  "No Show": "border-red-200 bg-red-50 text-red-700",
};

function parseInterviewDateTime(dateISO, timeText) {
  const dateMatch = String(dateISO || "").match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!dateMatch) return null;

  const rawTime = String(timeText || "").trim().toUpperCase();
  const twelveHourMatch = rawTime.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/);
  const twentyFourHourMatch = rawTime.match(/^(\d{1,2}):(\d{2})$/);

  let hours = 0;
  let minutes = 0;

  if (twelveHourMatch) {
    hours = Number(twelveHourMatch[1]) % 12;
    minutes = Number(twelveHourMatch[2]);
    if (twelveHourMatch[3] === "PM") hours += 12;
  } else if (twentyFourHourMatch) {
    hours = Number(twentyFourHourMatch[1]);
    minutes = Number(twentyFourHourMatch[2]);
  } else {
    return null;
  }

  const candidate = new Date(
    Number(dateMatch[1]),
    Number(dateMatch[2]) - 1,
    Number(dateMatch[3]),
    hours,
    minutes,
    0,
    0
  );
  return Number.isNaN(candidate.getTime()) ? null : candidate;
}

function isoDate(d) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function toCountDown(dateISO, timeText) {
  const target = parseInterviewDateTime(dateISO, timeText);
  if (!target) return "-";
  const diff = target.getTime() - Date.now();
  if (diff <= 0) return "Started";
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `Starts in ${mins} min`;
  const hrs = Math.floor(mins / 60);
  return `Starts in ${hrs}h ${mins % 60}m`;
}

function getRowReadiness(row) {
  if (row?.readiness) return row.readiness;
  return row?.candidateReadiness?.online ? "Online" : "Offline";
}

function getRowRisk(row) {
  return row?.risk || row?.proctoring?.riskLevel || "-";
}

function getStatusBadgeClass(status) {
  return STATUS_BADGE_STYLES[status] || "border-slate-200 bg-slate-50 text-slate-700";
}

export default function Interviews() {
  const nav = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [tab, setTab] = useState("pending");
  const [view, setView] = useState("table");
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState({
    round: "",
    status: "",
    from: "",
    to: "",
    flaggedOnly: false,
  });
  const [summary, setSummary] = useState({
    shortlistedCandidates: 0,
    interviewPending: 0,
    scheduledToday: 0,
    upcomingInterviews: 0,
    ongoingNow: 0,
    completedInterviews: 0,
    flaggedInterviews: 0,
  });
  const [interviews, setInterviews] = useState([]);
  const [pendingApps, setPendingApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");
  const [schedule, setSchedule] = useState({
    open: false,
    applicationId: "",
    candidateName: "",
    jobTitle: "",
    stage: "HR",
    date: "",
    time: "",
    durationMins: 0,
    mode: "Online",
    roomId: "",
    location: "",
  });

  useEffect(() => {
    if (!msg) return;
    void showSweetToast(msg, "info", { timer: 1800 });
  }, [msg]);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [interviewRes, pendingRes] = await Promise.all([
        getCompanyInterviews({
          q: search || undefined,
          tab: tab === "pending" ? "all" : tab,
          stage: filters.round || undefined,
          status: filters.status || undefined,
          from: filters.from || undefined,
          to: filters.to || undefined,
          flaggedOnly: filters.flaggedOnly ? 1 : undefined,
        }),
        getCompanyApplications({ status: "Shortlisted" }),
      ]);

      setInterviews(Array.isArray(interviewRes?.items) ? interviewRes.items.filter(Boolean) : []);
      if (interviewRes?.summary) setSummary(interviewRes.summary);
      const apps = Array.isArray(pendingRes?.items) ? pendingRes.items.filter(Boolean) : [];
      setPendingApps(apps);
    } catch (e) {
      setMsg(e?.response?.data?.message || "Failed to load interviews");
    } finally {
      setLoading(false);
    }
  }, [tab, search, filters.round, filters.status, filters.from, filters.to, filters.flaggedOnly]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const shouldOpen = searchParams.get("openSchedule") === "1";
    if (!shouldOpen) return;

    const applicationId = searchParams.get("applicationId") || "";
    const candidateName = searchParams.get("candidate") || "";
    const jobTitle = searchParams.get("job") || "";
    const stageRaw = searchParams.get("stage") || "HR";
    const stageMap = {
      "HR Round": "HR",
      "Technical Round": "Technical",
      "Manager Round": "Managerial",
      "Final Round": "Final",
    };

    setTab("pending");
    setSchedule((prev) => ({
      ...prev,
      open: true,
      applicationId,
      candidateName,
      jobTitle,
      stage: stageMap[stageRaw] || stageRaw || "HR",
      date: prev.date || isoDate(new Date()),
      time: prev.time || "",
      durationMins: prev.durationMins ?? 0,
      mode: prev.mode || "Online",
      roomId: prev.roomId || "",
      location: prev.location || "",
    }));

    const next = new URLSearchParams(searchParams);
    next.delete("openSchedule");
    next.delete("applicationId");
    next.delete("candidate");
    next.delete("job");
    next.delete("stage");
    setSearchParams(next, { replace: true });
  }, [searchParams, setSearchParams]);

  const rows = useMemo(() => {
    if (tab !== "pending") return interviews;
    return pendingApps.map((app) => ({
      id: `pending_${app.id}`,
      candidate: app.name || app.candidateName,
      email: app.email || "",
      job: app.jobTitle || app.job,
      stage: "HR",
      status: "Pending",
      date: "-",
      time: "-",
      applicationId: app.id,
      readiness: "Not Joined",
      risk: "-",
    }));
  }, [interviews, pendingApps, tab]);

  const cardItems = [
    ["Shortlisted Candidates", summary.shortlistedCandidates, "pending", <FiUserCheck />],
    ["Interview Pending", summary.interviewPending, "pending", <FiClock />],
    ["Scheduled Today", summary.scheduledToday, "scheduled", <FiCalendar />],
    ["Upcoming Interviews", summary.upcomingInterviews, "scheduled", <FiCalendar />],
    ["Ongoing Now", summary.ongoingNow, "ongoing", <FiPlayCircle />],
    ["Completed Interviews", summary.completedInterviews, "completed", <FiCheckCircle />],
    ["Flagged Interviews", summary.flaggedInterviews, "all", <FiFilter />],
  ];

  const openSchedule = (row) => {
    setSchedule({
      open: true,
      applicationId: row.applicationId || "",
      candidateName: row.candidate || "",
      jobTitle: row.job || "",
      stage: row.stage || "HR",
      date: isoDate(new Date()),
      time: "",
      durationMins: 0,
      mode: "Online",
      roomId: "",
      location: "",
    });
  };

  const submitSchedule = async () => {
    try {
      if (!schedule.candidateName || !schedule.jobTitle || !schedule.date || !schedule.time) return;
      await createCompanyInterview({
        applicationId: schedule.applicationId || undefined,
        candidateName: schedule.candidateName,
        jobTitle: schedule.jobTitle,
        stage: schedule.stage,
        date: schedule.date,
        time: schedule.time,
        durationMins: Number(schedule.durationMins ?? 0),
        mode: schedule.mode,
        roomId: schedule.roomId,
        location: schedule.mode === "Onsite" ? schedule.location : "",
        status: "Scheduled",
      });
      setSchedule((s) => ({ ...s, open: false }));
      setTab("scheduled");
      setMsg("Interview scheduled");
      await load();
    } catch (e) {
      setMsg(e?.response?.data?.message || "Failed to schedule interview");
    }
  };

  const onOpenInterview = async (row) => {
    try {
      if (row.status === "Live") {
        nav(`/company/interviews/${row.id}/workspace`);
        return;
      }

      if (row.status === "Waiting Room") {
        if (row.candidateReadiness?.online) {
          const res = await admitCompanyCandidate(row.id);
          const interviewId = res?.interview?.id || row.id;
          setMsg("Candidate admitted to the live interview");
          nav(`/company/interviews/${interviewId}/workspace`);
          return;
        }

        nav(`/company/interviews/${row.id}/workspace`);
        return;
      }

      if (!row.openJoinWindow) {
        setMsg(`Start available at ${new Date(row.startAvailableAt).toLocaleString()}`);
        return;
      }
      const res = await startCompanyInterview(row.id);
      const interviewId = res?.interview?.id || row.id;
      nav(`/company/interviews/${interviewId}/workspace?autocam=1`);
    } catch (e) {
      setMsg(e?.response?.data?.message || "Unable to open interview");
    }
  };

  const copyLink = async (row) => {
    const link = row.meetingLink || row.interviewLinks?.[0] || "";
    if (!link) return;
    await navigator.clipboard.writeText(link);
    setMsg("Interview link copied");
  };

  const getPrimaryActionLabel = (row) => {
    if (row.status === "Waiting Room") {
      return row.candidateReadiness?.online ? "Admit Candidate" : "Open Waiting Room";
    }
    if (row.status === "Live") return "Join Live";
    if (["Scheduled", "Rescheduled"].includes(row.status)) return "Start Interview";
    if (["Review Ready", "Completed"].includes(row.status)) return "View Replay";
    return "";
  };

  return (
    <div className="space-y-5 pb-16">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#0F172A]">Interview Management Hub</h1>
          <p className="text-sm text-slate-500">Manage pending, scheduled, ongoing and completed interviews in one place.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => nav("/company/shortlisted")} className="rounded-xl border border-blue-200 px-4 py-2 text-sm font-semibold text-[#2563EB] hover:bg-blue-50">Open Shortlisted</button>
          <div className="hidden gap-2 md:flex">
            <button onClick={() => setView("table")} className={`rounded-lg border px-3 py-1.5 text-xs font-semibold ${view === "table" ? "border-blue-200 bg-blue-50 text-[#2563EB]" : "border-slate-200 text-slate-700 hover:bg-slate-50"}`}><span className="inline-flex items-center gap-1"><FiList /> Table</span></button>
            <button onClick={() => setView("cards")} className={`rounded-lg border px-3 py-1.5 text-xs font-semibold ${view === "cards" ? "border-blue-200 bg-blue-50 text-[#2563EB]" : "border-slate-200 text-slate-700 hover:bg-slate-50"}`}><span className="inline-flex items-center gap-1"><FiGrid /> Cards</span></button>
          </div>
        </div>
      </header>

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {cardItems.map(([label, value, targetTab, icon]) => (
          <button
            key={label}
            onClick={() => setTab(targetTab)}
            className="rounded-xl border border-slate-200 bg-white p-3 text-left shadow-sm hover:border-blue-200"
          >
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-[#2563EB]">{icon}</span>
            <p className="mt-2 text-xl font-bold text-[#0F172A]">{value}</p>
            <p className="text-xs text-slate-500">{label}</p>
          </button>
        ))}
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-3">
        <div className="grid grid-cols-1 gap-2 md:grid-cols-6">
          <label className="md:col-span-2">
            <span className="sr-only">Search</span>
            <div className="flex h-10 items-center gap-2 rounded-lg border border-slate-200 px-3">
              <FiSearch className="text-slate-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search candidate, email, job"
                className="w-full bg-transparent text-sm outline-none"
              />
            </div>
          </label>
          <select value={filters.round} onChange={(e) => setFilters((f) => ({ ...f, round: e.target.value }))} className="h-10 rounded-lg border border-slate-200 px-3 text-sm">
            <option value="">Round</option>
            <option value="HR">HR</option>
            <option value="Technical">Technical</option>
            <option value="Managerial">Managerial</option>
            <option value="Final">Final</option>
          </select>
          <select value={filters.status} onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))} className="h-10 rounded-lg border border-slate-200 px-3 text-sm">
            <option value="">Status</option>
            <option value="Scheduled">Scheduled</option>
            <option value="Waiting Room">Waiting Room</option>
            <option value="Live">Live</option>
            <option value="Review Ready">Review Ready</option>
            <option value="Cancelled">Cancelled</option>
          </select>
          <input type="date" value={filters.from} onChange={(e) => setFilters((f) => ({ ...f, from: e.target.value }))} className="h-10 rounded-lg border border-slate-200 px-3 text-sm" />
          <input type="date" value={filters.to} onChange={(e) => setFilters((f) => ({ ...f, to: e.target.value }))} className="h-10 rounded-lg border border-slate-200 px-3 text-sm" />
        </div>
        <div className="mt-3 flex gap-2 md:hidden">
          <button onClick={() => setView("table")} className={`rounded-lg border px-3 py-2 text-xs font-semibold ${view === "table" ? "border-blue-200 bg-blue-50 text-[#2563EB]" : "border-slate-200 text-slate-700 hover:bg-slate-50"}`}>Table</button>
          <button onClick={() => setView("cards")} className={`rounded-lg border px-3 py-2 text-xs font-semibold ${view === "cards" ? "border-blue-200 bg-blue-50 text-[#2563EB]" : "border-slate-200 text-slate-700 hover:bg-slate-50"}`}>Cards</button>
        </div>
      </section>

      <section className="flex flex-wrap gap-2">
        {TABS.map((x) => (
          <button
            key={x.id}
            onClick={() => setTab(x.id)}
            className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${tab === x.id ? "border-blue-200 bg-blue-50 text-[#2563EB]" : "border-slate-200 bg-white text-slate-700"}`}
          >
            {x.label}
          </button>
        ))}
      </section>

      {view === "table" ? (
        <section className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="w-full min-w-[1150px] text-sm">
            <thead className="bg-slate-50 text-left text-xs text-slate-600">
              <tr>
                <th className="px-3 py-3">Candidate</th>
                <th className="px-3 py-3">Job Role</th>
                <th className="px-3 py-3">Round</th>
                <th className="px-3 py-3">Status</th>
                <th className="px-3 py-3">Interview Date</th>
                <th className="px-3 py-3">Countdown</th>
                <th className="px-3 py-3">Readiness</th>
                <th className="px-3 py-3">Risk</th>
                <th className="px-3 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={9} className="px-3 py-10 text-center text-slate-500">Loading...</td></tr>
              ) : null}
              {!loading && !rows.length ? (
                <tr><td colSpan={9} className="px-3 py-10 text-center text-slate-500">No records found.</td></tr>
              ) : null}
              {!loading && rows.filter(Boolean).map((row) => {
                const readiness = getRowReadiness(row);
                const risk = getRowRisk(row);
                return (
                  <tr key={row.id} className="border-t border-slate-100">
                    <td className="px-3 py-3 font-semibold text-[#0F172A]">{row.candidate}</td>
                    <td className="px-3 py-3">{row.job}</td>
                    <td className="px-3 py-3">{row.currentRound || row.stage || "-"}</td>
                    <td className="px-3 py-3">
                      <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${getStatusBadgeClass(row.status)}`}>{row.status}</span>
                    </td>
                    <td className="px-3 py-3">{row.date} {row.time}</td>
                    <td className="px-3 py-3 text-xs text-slate-600">{row.date !== "-" ? toCountDown(row.date, row.time) : "-"}</td>
                    <td className="px-3 py-3">{readiness}</td>
                    <td className="px-3 py-3">{risk}</td>
                    <td className="px-3 py-3">
                      <div className="flex flex-wrap gap-1">
                        {row.status === "Pending" ? (
                          <button onClick={() => openSchedule(row)} className="rounded-lg border border-blue-200 px-2 py-1 text-xs font-semibold text-[#2563EB]">Schedule</button>
                        ) : null}
                        {["Scheduled", "Rescheduled", "Waiting Room"].includes(row.status) ? (
                          <button onClick={() => onOpenInterview(row)} className="rounded-lg border border-green-200 px-2 py-1 text-xs font-semibold text-green-700">
                            {getPrimaryActionLabel(row)}
                          </button>
                        ) : null}
                        {row.status === "Live" ? (
                          <button onClick={() => onOpenInterview(row)} className="rounded-lg border border-green-200 px-2 py-1 text-xs font-semibold text-green-700">{getPrimaryActionLabel(row)}</button>
                        ) : null}
                        {["Review Ready", "Completed"].includes(row.status) ? (
                          <button onClick={() => nav(`/company/interviews/${row.id}/workspace`)} className="rounded-lg border border-slate-200 px-2 py-1 text-xs font-semibold text-slate-700">{getPrimaryActionLabel(row)}</button>
                        ) : null}
                        {row.meetingLink ? (
                          <button onClick={() => copyLink(row)} className="rounded-lg border border-slate-200 px-2 py-1 text-xs font-semibold text-slate-700"><FiCopy /></button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </section>
      ) : (
        <section className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {loading ? (
            <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-600">Loading interviews...</div>
          ) : null}
          {!loading && !rows.length ? (
            <div className="rounded-xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500">No records found.</div>
          ) : null}
          {!loading && rows.filter(Boolean).map((row) => {
            const readiness = getRowReadiness(row);
            const risk = getRowRisk(row);
            return (
              <article key={`card_${row.id}`} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-base font-semibold text-[#0F172A]">{row.candidate}</p>
                    <p className="mt-1 text-sm text-slate-600">{row.job}</p>
                  </div>
                  <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${getStatusBadgeClass(row.status)}`}>{row.status}</span>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-600">
                  <p>Round: <span className="font-semibold text-slate-800">{row.currentRound || row.stage || "-"}</span></p>
                  <p>Date: <span className="font-semibold text-slate-800">{row.date !== "-" ? `${row.date} ${row.time}` : "-"}</span></p>
                  <p>Countdown: <span className="font-semibold text-slate-800">{row.date !== "-" ? toCountDown(row.date, row.time) : "-"}</span></p>
                  <p>Readiness: <span className="font-semibold text-slate-800">{readiness}</span></p>
                  <p>Risk: <span className="font-semibold text-slate-800">{risk}</span></p>
                  <p>Mode: <span className="font-semibold text-slate-800">{row.mode || "-"}</span></p>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {row.status === "Pending" ? (
                    <button onClick={() => openSchedule(row)} className="rounded-lg border border-blue-200 px-3 py-1.5 text-xs font-semibold text-[#2563EB]">Schedule</button>
                  ) : null}
                  {["Scheduled", "Rescheduled", "Waiting Room"].includes(row.status) ? (
                    <button onClick={() => onOpenInterview(row)} className="rounded-lg border border-green-200 px-3 py-1.5 text-xs font-semibold text-green-700">
                      {getPrimaryActionLabel(row)}
                    </button>
                  ) : null}
                  {row.status === "Live" ? (
                    <button onClick={() => onOpenInterview(row)} className="rounded-lg border border-green-200 px-3 py-1.5 text-xs font-semibold text-green-700">{getPrimaryActionLabel(row)}</button>
                  ) : null}
                  {["Review Ready", "Completed"].includes(row.status) ? (
                    <button onClick={() => nav(`/company/interviews/${row.id}/workspace`)} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700">{getPrimaryActionLabel(row)}</button>
                  ) : null}
                  {row.meetingLink ? (
                    <button onClick={() => copyLink(row)} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700"><span className="inline-flex items-center gap-1"><FiCopy /> Copy Link</span></button>
                  ) : null}
                </div>
              </article>
            );
          })}
        </section>
      )}

      {schedule.open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/35 p-4">
          <div className="w-full max-w-2xl rounded-xl border border-slate-200 bg-white p-4 shadow-xl">
            <h2 className="text-lg font-bold text-[#0F172A]">Schedule Interview</h2>
            <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
              <input value={schedule.candidateName} onChange={(e) => setSchedule((s) => ({ ...s, candidateName: e.target.value }))} placeholder="Candidate name" className="h-10 rounded-lg border border-slate-200 px-3 text-sm" />
              <input value={schedule.jobTitle} onChange={(e) => setSchedule((s) => ({ ...s, jobTitle: e.target.value }))} placeholder="Job title" className="h-10 rounded-lg border border-slate-200 px-3 text-sm" />
              <select value={schedule.stage} onChange={(e) => setSchedule((s) => ({ ...s, stage: e.target.value }))} className="h-10 rounded-lg border border-slate-200 px-3 text-sm">
                <option value="HR">HR</option>
                <option value="Technical">Technical</option>
                <option value="Managerial">Managerial</option>
                <option value="Final">Final</option>
              </select>
              <select value={schedule.mode} onChange={(e) => setSchedule((s) => ({ ...s, mode: e.target.value }))} className="h-10 rounded-lg border border-slate-200 px-3 text-sm">
                <option value="Online">Video</option>
                <option value="Onsite">Onsite</option>
              </select>
              <input type="date" value={schedule.date} onChange={(e) => setSchedule((s) => ({ ...s, date: e.target.value }))} className="h-10 rounded-lg border border-slate-200 px-3 text-sm" />
              <input type="time" value={schedule.time} onChange={(e) => setSchedule((s) => ({ ...s, time: e.target.value }))} className="h-10 rounded-lg border border-slate-200 px-3 text-sm" />
              <input type="number" min="0" value={schedule.durationMins} onChange={(e) => setSchedule((s) => ({ ...s, durationMins: e.target.value }))} placeholder="Duration minutes (0 = Unlimited)" className="h-10 rounded-lg border border-slate-200 px-3 text-sm" />
              {schedule.mode === "Online" ? (
                <input value={schedule.roomId} onChange={(e) => setSchedule((s) => ({ ...s, roomId: e.target.value }))} placeholder="Interview room id (optional)" className="h-10 rounded-lg border border-slate-200 px-3 text-sm" />
              ) : (
                <input value={schedule.location} onChange={(e) => setSchedule((s) => ({ ...s, location: e.target.value }))} placeholder="Interview location" className="h-10 rounded-lg border border-slate-200 px-3 text-sm" />
              )}
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button onClick={() => setSchedule((s) => ({ ...s, open: false }))} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700">Cancel</button>
              <button onClick={submitSchedule} className="rounded-lg bg-[#2563EB] px-4 py-2 text-sm font-semibold text-white">Confirm Schedule</button>
            </div>
          </div>
        </div>
      ) : null}

    </div>
  );
}
