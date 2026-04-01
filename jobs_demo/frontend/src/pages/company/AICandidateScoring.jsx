// frontend/src/pages/company/AICandidateScoring.jsx
import { Fragment, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiDownload,
  FiInfo,
  FiMessageSquare,
  FiRefreshCw,
  FiSliders,
  FiUserCheck,
  FiUserX,
} from "react-icons/fi";
import Modal from "../../components/common/Modal.jsx";
import Loader from "../../components/common/Loader.jsx";
import {
  listCompanyJobs,
  updateJobAIWeights,
  getAIScoringForJob,
  rerunAIForJob,
  updateApplicationStatus,
} from "../../services/companyService.js";
import { createCompanyThread } from "../../services/messagesService.js";

/* ---------------- UI helpers ---------------- */
function scoreMeta(score) {
  const s = Number(score || 0);
  if (s >= 85)
    return {
      label: "Strong",
      bar: "bg-green-500",
      badge: "border-green-200 bg-green-50 text-green-700",
    };
  if (s >= 60)
    return {
      label: "Moderate",
      bar: "bg-orange-500",
      badge: "border-orange-200 bg-orange-50 text-[#F97316]",
    };
  return {
    label: "Low",
    bar: "bg-red-500",
    badge: "border-red-200 bg-red-50 text-red-600",
  };
}

function StatusPill({ status }) {
  const cls = {
    Applied: "border-blue-200 bg-blue-50 text-[#2563EB]",
    Shortlisted: "border-green-200 bg-green-50 text-green-700",
    Hold: "border-orange-200 bg-orange-50 text-[#F97316]",
    Rejected: "border-red-200 bg-red-50 text-red-600",
    "Interview Scheduled": "border-indigo-200 bg-indigo-50 text-indigo-700",
    "Needs Review": "border-orange-200 bg-orange-50 text-[#F97316]",
  };
  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${
        cls[status] || "border-slate-200 bg-slate-100 text-slate-600"
      }`}
    >
      {status || "-"}
    </span>
  );
}

function ScoreBar({ score }) {
  const meta = scoreMeta(score);
  const s = Math.max(0, Math.min(100, Number(score || 0)));
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2">
        <span
          className="text-sm font-bold text-[#0F172A]"
          title="Based on skills, resume keywords, experience, and screening answers."
        >
          {s}%
        </span>
        <span
          className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold ${meta.badge}`}
        >
          {meta.label}
        </span>
      </div>
      <div className="h-2 w-32 overflow-hidden rounded-full bg-slate-200">
        <div
          className={`h-full rounded-full transition-all duration-300 ${meta.bar}`}
          style={{ width: `${s}%` }}
        />
      </div>
    </div>
  );
}

function ScoreCard({ label, value, tone }) {
  const map = {
    blue: "bg-blue-50 text-[#2563EB]",
    green: "bg-green-50 text-green-700",
    orange: "bg-orange-50 text-[#F97316]",
    red: "bg-red-50 text-red-600",
  };
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p
        className={`mt-2 inline-flex rounded-lg px-2.5 py-1 text-lg font-bold ${
          map[tone] || map.blue
        }`}
      >
        {value}
      </p>
    </div>
  );
}

/* ---------------- normalize backend shape ---------------- */
function normalizeJob(j) {
  return {
    id: j.id || j._id,
    title: j.title || "-",
    applicants:
      j.applicants ??
      j.applicationsCount ??
      j.meta?.applicationsCount ??
      j.applications ??
      0,
    aiEnabled: Boolean(j.enableAiRanking),
    experienceText: String(j.experience || "").trim(),
    weights: {
      skills: Number(j.skillsWeight ?? 35),
      experience: Number(j.experienceWeight ?? 25),
      education: Number(j.educationWeight ?? 15),
      screening: Number(j.screeningWeight ?? 25),
      top10: Boolean(j.autoHighlightTop10 ?? true),
      autoTag: Boolean(j.autoTagMatch ?? true),
      aiExperienceBand: String(j.aiExperienceBand || "Auto"),
    },
  };
}

function normalizeCandidate(c) {
  return {
    id: c.id || c._id,
    name: c.name || c.candidateName || "Candidate",
    email: c.email || "",
    experience: c.experience || c.exp || "-",
    skills: Array.isArray(c.skills) ? c.skills : [],
    score: Number(c.score || 0),
    status: c.status || "Applied",
    matched: Array.isArray(c.matched) ? c.matched : [],
    missing: Array.isArray(c.missing) ? c.missing : [],
    extra: Array.isArray(c.extra) ? c.extra : [],
    expMatch: c.expMatch || "",
    eduMatch: c.eduMatch || "",
    screening: c.screening || { pass: 0, fail: 0 },
    keyword: c.keyword || "",
    suggestions: Array.isArray(c.suggestions)
      ? c.suggestions
      : [
          "Verify role-relevant projects and depth in required stack",
          "Ask scenario-based questions for problem solving",
        ],
    nextStep: c.nextStep || "Needs Review",
  };
}

/* =========================
   PAGE
========================= */
export default function AICandidateScoring() {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [jobId, setJobId] = useState("");
  const [candidates, setCandidates] = useState([]);

  const [loadingJobs, setLoadingJobs] = useState(true);
  const [loadingAI, setLoadingAI] = useState(false);
  const [err, setErr] = useState("");

  const [expanded, setExpanded] = useState(null);
  const [selected, setSelected] = useState([]);
  const [compareOpen, setCompareOpen] = useState(false);
  const [toast, setToast] = useState("");
  const [actionBusyId, setActionBusyId] = useState("");

  const [weights, setWeights] = useState({
    skills: 40,
    experience: 30,
    education: 15,
    screening: 15,
    top10: true,
    autoTag: true,
    aiExperienceBand: "Auto",
  });

  const showToast = (message) => {
    setToast(message);
    setTimeout(() => setToast(""), 1400);
  };

  /* ---------------- fetch jobs ---------------- */
  useEffect(() => {
    (async () => {
      try {
        setErr("");
        setLoadingJobs(true);
        const res = await listCompanyJobs({ status: "all" });
        const items = Array.isArray(res) ? res : res?.items || [];
        const norm = items.map(normalizeJob);
        setJobs(norm);
        setJobId(norm[0]?.id || "");
        // set initial weights from job
        if (norm[0]?.weights) setWeights(norm[0].weights);
      } catch (e) {
        setErr(e?.response?.data?.message || "Failed to load jobs");
      } finally {
        setLoadingJobs(false);
      }
    })();
  }, []);

  /* ---------------- fetch AI scoring for job ---------------- */
  const fetchAI = async (jid) => {
    if (!jid) return;
    try {
      setErr("");
      setLoadingAI(true);

      const res = await getAIScoringForJob(jid);
      const list = res?.candidates || res?.items || [];
      setCandidates(list.map(normalizeCandidate));

      // sync weights from backend job payload when available
      const w = res?.job?.weights;
      if (w) {
        setWeights((prev) => ({
          ...prev,
          skills: Number(w.skills ?? prev.skills),
          experience: Number(w.experience ?? prev.experience),
          education: Number(w.education ?? prev.education),
          screening: Number(w.screening ?? prev.screening),
          aiExperienceBand: String(
            w.aiExperienceBand ?? res?.job?.aiExperienceBand ?? prev.aiExperienceBand
          ),
        }));
      }
    } catch (e) {
      setErr(e?.response?.data?.message || "Failed to load AI scoring");
      setCandidates([]);
    } finally {
      setLoadingAI(false);
    }
  };

  useEffect(() => {
    if (!jobId) return;
    fetchAI(jobId);
    setExpanded(null);
    setSelected([]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobId]);

  const selectedJob = useMemo(
    () => jobs.find((j) => j.id === jobId),
    [jobs, jobId]
  );

  const strong = useMemo(
    () => candidates.filter((c) => c.score >= 85).length,
    [candidates]
  );
  const moderate = useMemo(
    () => candidates.filter((c) => c.score >= 60 && c.score < 85).length,
    [candidates]
  );
  const low = useMemo(
    () => candidates.filter((c) => c.score < 60).length,
    [candidates]
  );

  const activeCandidate = useMemo(() => {
    if (!candidates.length) return null;
    return (
      candidates.find((c) => c.id === (expanded || candidates[0]?.id)) ||
      candidates[0]
    );
  }, [candidates, expanded]);

  const compareCandidates = useMemo(
    () => candidates.filter((c) => selected.includes(c.id)),
    [candidates, selected]
  );

  const toggleSelect = (id) => {
    setSelected((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 3) return prev;
      return [...prev, id];
    });
  };

  const saveWeights = async () => {
    if (!jobId) return;
    try {
      await updateJobAIWeights(jobId, {
        aiEnabled: true,
        skills: weights.skills,
        experience: weights.experience,
        education: weights.education,
        screening: weights.screening,
        top10: weights.top10,
        autoTag: weights.autoTag,
        aiExperienceBand: weights.aiExperienceBand || "Auto",
      });
      showToast("AI settings saved");
      // refresh jobs list local state
      setJobs((prev) =>
        prev.map((j) =>
          j.id === jobId
            ? {
                ...j,
                aiEnabled: true,
                weights: { ...weights },
              }
            : j
        )
      );
      // re-fetch ranking
      await fetchAI(jobId);
    } catch (e) {
      showToast("Failed to save AI settings");
    }
  };

  const setCandidateStatus = async (candidateId, status) => {
    try {
      setActionBusyId(candidateId);
      await updateApplicationStatus(candidateId, status);
      setCandidates((prev) =>
        prev.map((c) => (c.id === candidateId ? { ...c, status } : c))
      );
      showToast(`Candidate moved to ${status}`);
    } catch (e) {
      showToast(e?.response?.data?.message || "Failed to update status");
    } finally {
      setActionBusyId("");
    }
  };

  const openThread = async (candidateId) => {
    try {
      setActionBusyId(candidateId);
      const res = await createCompanyThread({ applicationId: candidateId });
      const threadId = res?.thread?.id;
      if (!threadId) throw new Error("Thread not created");
      navigate(`/company/messages?thread=${threadId}`);
    } catch (e) {
      showToast(e?.response?.data?.message || "Failed to open messages");
    } finally {
      setActionBusyId("");
    }
  };

  const rerunAI = async () => {
    if (!jobId) return;
    try {
      await rerunAIForJob(jobId);
      showToast("AI analysis refreshed");
      await fetchAI(jobId);
    } catch (e) {
      showToast("Failed to rerun AI");
    }
  };

  const selectedExperiencePoint = useMemo(() => {
    if (weights.aiExperienceBand && weights.aiExperienceBand !== "Auto") {
      return weights.aiExperienceBand;
    }
    return selectedJob?.experienceText || "Not set";
  }, [weights.aiExperienceBand, selectedJob]);

  const exportCSV = () => {
    const rows = [
      ["Rank", "Name", "Email", "Score", "Status", "Skills", "Experience"].join(
        ","
      ),
      ...candidates.map((c, i) =>
        [
          `#${i + 1}`,
          `"${c.name}"`,
          `"${c.email || ""}"`,
          c.score,
          `"${c.status}"`,
          `"${(c.skills || []).join(" | ")}"`,
          `"${c.experience}"`,
        ].join(",")
      ),
    ].join("\n");

    const blob = new Blob([rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ai_scoring_${selectedJob?.title || "job"}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast("Ranked list exported");
  };

  if (loadingJobs) return <Loader label="Loading jobs..." />;

  return (
    <div className="space-y-6 pb-24 md:pb-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#0F172A]">
            AI Candidate Scoring
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Rank applicants intelligently using AI match analysis
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={rerunAI}
            className="rounded-xl border border-blue-200 px-4 py-2 text-sm font-semibold text-[#2563EB] hover:bg-blue-50"
          >
            <span className="inline-flex items-center gap-1">
              <FiRefreshCw />
              Re-run AI Analysis
            </span>
          </button>
          <button
            onClick={exportCSV}
            className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            <span className="inline-flex items-center gap-1">
              <FiDownload />
              Export Ranked List
            </span>
          </button>
        </div>
      </header>

      {err ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {err}
        </div>
      ) : null}

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
              Select Job Position
            </label>
            <select
              value={jobId}
              onChange={(e) => setJobId(e.target.value)}
              className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-blue-300"
            >
              {jobs.map((job) => (
                <option key={job.id} value={job.id}>
                  {job.title}
                </option>
              ))}
            </select>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
            <p className="font-semibold text-[#0F172A]">
              {selectedJob?.title || "-"}
            </p>
            <p className="mt-1 text-slate-600">
              Total Applicants: {candidates.length}
            </p>
            <p className="mt-1">
              AI Ranking:
              <span
                className={`ml-1 rounded-full px-2 py-0.5 text-xs font-semibold ${
                  selectedJob?.aiEnabled
                    ? "border border-green-200 bg-green-50 text-green-700"
                    : "border border-slate-200 bg-slate-100 text-slate-600"
                }`}
              >
                {selectedJob?.aiEnabled ? "Enabled" : "Disabled"}
              </span>
            </p>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <ScoreCard
          label="Total Applicants"
          value={candidates.length}
          tone="blue"
        />
        <ScoreCard label="Strong Matches" value={strong} tone="green" />
        <ScoreCard label="Moderate Matches" value={moderate} tone="orange" />
        <ScoreCard label="Low Matches" value={low} tone="red" />
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-4">
          <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-5 py-4">
              <h2 className="text-base font-semibold text-[#0F172A]">
                Candidate Ranking
              </h2>
              <button
                disabled={selected.length < 2 || selected.length > 3}
                onClick={() => setCompareOpen(true)}
                className="rounded-lg border border-blue-200 px-3 py-1.5 text-xs font-semibold text-[#2563EB] hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Compare Selected ({selected.length})
              </button>
            </div>

            {loadingAI ? (
              <div className="p-6">
                <Loader label="Loading AI ranking..." />
              </div>
            ) : (
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50 text-slate-600">
                  <tr>
                    <th className="px-4 py-3 text-left">
                      <input
                        type="checkbox"
                        checked={
                          candidates.length > 0 &&
                          selected.length === candidates.length
                        }
                        onChange={(e) =>
                          setSelected(
                            e.target.checked ? candidates.map((c) => c.id) : []
                          )
                        }
                      />
                    </th>
                    <th className="px-4 py-3 text-left font-semibold">Rank</th>
                    <th className="px-4 py-3 text-left font-semibold">
                      Candidate Name
                    </th>
                    <th className="px-4 py-3 text-left font-semibold">
                      Experience
                    </th>
                    <th className="px-4 py-3 text-left font-semibold">
                      Key Skills
                    </th>
                    <th className="px-4 py-3 text-left font-semibold">
                      AI Match Score
                    </th>
                    <th className="px-4 py-3 text-left font-semibold">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left font-semibold">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {candidates.map((row, i) => (
                    <Fragment key={row.id}>
                      <tr className="hover:bg-[#EFF6FF]">
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={selected.includes(row.id)}
                            onChange={() => toggleSelect(row.id)}
                          />
                        </td>
                        <td className="px-4 py-3 font-semibold text-[#0F172A]">
                          #{i + 1}
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() =>
                              setExpanded((p) => (p === row.id ? null : row.id))
                            }
                            className="font-semibold text-[#0F172A] hover:text-[#2563EB]"
                          >
                            {row.name}
                          </button>
                          {row.email ? (
                            <p className="text-xs text-slate-500">{row.email}</p>
                          ) : null}
                        </td>
                        <td className="px-4 py-3 text-slate-700">
                          {row.experience || "-"}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1">
                            {(row.skills || []).slice(0, 4).map((skill, index) => (
                              <span
                                key={`${row.id}_${skill}_${index}`}
                                className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs text-slate-700"
                              >
                                {skill}
                              </span>
                            ))}
                            {(row.skills || []).length > 4 ? (
                              <span className="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-xs text-slate-600">
                                +{row.skills.length - 4}
                              </span>
                            ) : null}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <ScoreBar score={row.score} />
                        </td>
                        <td className="px-4 py-3">
                          <StatusPill status={row.status} />
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1.5">
                            <button
                              onClick={() => navigate("/company/candidates")}
                              className="rounded-lg border border-slate-200 px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                            >
                              View
                            </button>
                            <button
                              disabled={actionBusyId === row.id}
                              onClick={() => setCandidateStatus(row.id, "Shortlisted")}
                              className="rounded-lg border border-green-200 px-2 py-1 text-xs font-semibold text-green-700 hover:bg-green-50"
                            >
                              Shortlist
                            </button>
                            <button
                              disabled={actionBusyId === row.id}
                              onClick={() => setCandidateStatus(row.id, "Rejected")}
                              className="rounded-lg border border-red-200 px-2 py-1 text-xs font-semibold text-red-600 hover:bg-red-50"
                            >
                              Reject
                            </button>
                            <button
                              onClick={() => navigate("/company/candidates")}
                              className="rounded-lg border border-blue-200 px-2 py-1 text-xs font-semibold text-[#2563EB] hover:bg-blue-50"
                            >
                              Interview
                            </button>
                            <button
                              disabled={actionBusyId === row.id}
                              onClick={() => openThread(row.id)}
                              className="rounded-lg border border-slate-200 px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                            >
                              <span className="inline-flex items-center gap-1">
                                <FiMessageSquare />
                                Message
                              </span>
                            </button>
                          </div>
                        </td>
                      </tr>

                      {expanded === row.id ? (
                        <tr className="bg-slate-50/70">
                          <td colSpan={8} className="px-4 py-4">
                            <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                              <div className="rounded-xl border border-slate-200 bg-white p-3">
                                <p className="text-sm font-semibold text-[#0F172A]">
                                  Skill Match
                                </p>
                                <div className="mt-2 space-y-2 text-xs">
                                  <div>
                                    <p className="mb-1 font-semibold text-slate-600">
                                      Matched Skills
                                    </p>
                                    <div className="flex flex-wrap gap-1">
                                      {(row.matched || []).length ? (
                                        row.matched.map((x) => (
                                          <span
                                            key={`${row.id}_m_${x}`}
                                            className="rounded-full border border-green-200 bg-green-50 px-2 py-0.5 text-green-700"
                                          >
                                            {x}
                                          </span>
                                        ))
                                      ) : (
                                        <span className="text-slate-500">
                                          -
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  <div>
                                    <p className="mb-1 font-semibold text-slate-600">
                                      Missing Skills
                                    </p>
                                    <div className="flex flex-wrap gap-1">
                                      {(row.missing || []).length ? (
                                        row.missing.map((x) => (
                                          <span
                                            key={`${row.id}_ms_${x}`}
                                            className="rounded-full border border-orange-200 bg-orange-50 px-2 py-0.5 text-[#F97316]"
                                          >
                                            {x}
                                          </span>
                                        ))
                                      ) : (
                                        <span className="text-slate-500">
                                          -
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  {(row.extra || []).length ? (
                                    <div>
                                      <p className="mb-1 font-semibold text-slate-600">
                                        Extra Skills
                                      </p>
                                      <div className="flex flex-wrap gap-1">
                                        {row.extra.map((x) => (
                                          <span
                                            key={`${row.id}_e_${x}`}
                                            className="rounded-full border border-slate-200 bg-slate-100 px-2 py-0.5 text-slate-600"
                                          >
                                            {x}
                                          </span>
                                        ))}
                                      </div>
                                    </div>
                                  ) : null}
                                </div>
                              </div>

                              <div className="rounded-xl border border-slate-200 bg-white p-3 text-xs">
                                <p className="text-sm font-semibold text-[#0F172A]">
                                  AI Breakdown
                                </p>
                                <p className="mt-2">
                                  <span className="font-semibold text-slate-700">
                                    Experience:
                                  </span>{" "}
                                  {row.experience || "-"}
                                </p>
                                <p className="mt-1">
                                  <span className="font-semibold text-slate-700">
                                    Notes:
                                  </span>{" "}
                                  Skill match computed from job.skills vs
                                  application topSkills.
                                </p>
                              </div>
                            </div>
                          </td>
                        </tr>
                      ) : null}
                    </Fragment>
                  ))}
                  {candidates.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-5 py-10 text-center">
                        <p className="font-semibold text-[#0F172A]">
                          No applications found for this job
                        </p>
                        <p className="mt-1 text-sm text-slate-500">
                          Once students apply, AI ranking will appear here.
                        </p>
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            )}
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="text-base font-semibold text-[#0F172A]">
              How AI Scoring Works
            </h3>
            <p className="mt-2 text-sm text-slate-600">
              AI scoring combines skill overlap, experience fit, profile education
              signals, and application stage. Tune weights on the right to match
              your hiring strategy.
            </p>
            <div className="mt-3 flex items-start gap-2 rounded-lg border border-orange-200 bg-orange-50 px-3 py-2 text-xs text-[#F97316]">
              <FiInfo className="mt-0.5" />
              AI provides recommendations. Final hiring decision is yours.
            </div>
          </div>
        </div>

        <aside className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="inline-flex items-center gap-2 text-base font-semibold text-[#0F172A]">
              <FiSliders /> AI Scoring Configuration
            </h3>

            <div className="mt-3 space-y-3 text-sm">
              {[
                { key: "skills", label: "Skills Weight" },
                { key: "experience", label: "Experience Weight" },
                { key: "education", label: "Education Weight" },
                { key: "screening", label: "Screening Weight" },
              ].map((item) => (
                <div key={item.key}>
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-600">
                      {item.label}
                    </span>
                    <span className="font-semibold text-[#0F172A]">
                      {item.key === "experience"
                        ? `${weights[item.key]}% • ${selectedExperiencePoint}`
                        : `${weights[item.key]}%`}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={weights[item.key]}
                    onChange={(e) =>
                      setWeights((prev) => ({
                        ...prev,
                        [item.key]: Number(e.target.value),
                      }))
                    }
                    className="h-2 w-full cursor-pointer accent-[#2563EB]"
                  />
                </div>
              ))}

              <div>
                <p className="mb-1 text-xs font-semibold text-slate-600">
                  Experience Selection Point (Yearly)
                </p>
                <select
                  value={weights.aiExperienceBand}
                  onChange={(e) =>
                    setWeights((prev) => ({
                      ...prev,
                      aiExperienceBand: e.target.value,
                    }))
                  }
                  className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-blue-300"
                >
                  <option value="Auto">Auto (Use Job Experience)</option>
                  <option value="Fresher">Fresher</option>
                  <option value="1 Year">1 Year</option>
                  <option value="2 Years">2 Years</option>
                  <option value="3 Years">3 Years</option>
                  <option value="4 Years">4 Years</option>
                  <option value="5 Years">5 Years</option>
                  <option value="6 Years">6 Years</option>
                  <option value="7 Years">7 Years</option>
                  <option value="8 Years">8 Years</option>
                  <option value="9 Years">9 Years</option>
                  <option value="10+ Years">10+ Years</option>
                </select>
              </div>

              <label className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2">
                <span className="text-xs font-semibold text-slate-700">
                  Auto-highlight Top 10
                </span>
                <input
                  type="checkbox"
                  checked={weights.top10}
                  onChange={(e) =>
                    setWeights((p) => ({ ...p, top10: e.target.checked }))
                  }
                />
              </label>

              <label className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2">
                <span className="text-xs font-semibold text-slate-700">
                  Auto-tag Strong Matches
                </span>
                <input
                  type="checkbox"
                  checked={weights.autoTag}
                  onChange={(e) =>
                    setWeights((p) => ({ ...p, autoTag: e.target.checked }))
                  }
                />
              </label>
            </div>

            <button
              onClick={saveWeights}
              className="mt-4 w-full rounded-lg bg-[#2563EB] px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Save Settings
            </button>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="text-base font-semibold text-[#0F172A]">
              AI Recommendations
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              Selected candidate: {activeCandidate?.name || "-"}
            </p>

            <div className="mt-3 space-y-2 text-sm text-slate-700">
              {(activeCandidate?.suggestions || []).map((s, index) => (
                <p
                  key={`${activeCandidate?.id}_${s}_${index}`}
                  className="rounded-lg bg-slate-50 px-3 py-2"
                >
                  {s}
                </p>
              ))}
            </div>

            <p className="mt-3 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-[#2563EB]">
              Recommended Next Step:{" "}
              <span className="font-semibold">
                {activeCandidate?.nextStep || "Needs Review"}
              </span>
            </p>

            <div className="mt-3 flex gap-2">
              <button
                onClick={() => {
                  if (!activeCandidate) return;
                  if (activeCandidate.nextStep === "Shortlist") {
                    setCandidateStatus(activeCandidate.id, "Shortlisted");
                    return;
                  }
                  if (activeCandidate.nextStep === "Reject") {
                    setCandidateStatus(activeCandidate.id, "Rejected");
                    return;
                  }
                  navigate("/company/candidates");
                }}
                className="rounded-lg bg-[#2563EB] px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700"
              >
                Apply Recommendation
              </button>
              <button
                onClick={() =>
                  activeCandidate
                    ? setCandidateStatus(activeCandidate.id, "Shortlisted")
                    : null
                }
                className="rounded-lg border border-green-200 px-3 py-2 text-xs font-semibold text-green-700 hover:bg-green-50"
              >
                Shortlist
              </button>
            </div>
          </div>
        </aside>
      </section>

      <Modal
        open={compareOpen}
        onClose={() => setCompareOpen(false)}
        title="Candidate Comparison"
        widthClass="max-w-5xl"
        footer={
          <button
            onClick={() => setCompareOpen(false)}
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700"
          >
            Close
          </button>
        }
      >
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">Metric</th>
                {compareCandidates.map((c) => (
                  <th
                    key={`cmp_h_${c.id}`}
                    className="px-4 py-3 text-left font-semibold"
                  >
                    {c.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <tr>
                <td className="px-4 py-3 font-semibold text-[#0F172A]">
                  Match Score
                </td>
                {compareCandidates.map((c) => (
                  <td key={`cmp_score_${c.id}`} className="px-4 py-3">
                    <ScoreBar score={c.score} />
                  </td>
                ))}
              </tr>
              <tr>
                <td className="px-4 py-3 font-semibold text-[#0F172A]">
                  Experience
                </td>
                {compareCandidates.map((c) => (
                  <td
                    key={`cmp_exp_${c.id}`}
                    className="px-4 py-3 text-slate-700"
                  >
                    {c.experience}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="px-4 py-3 font-semibold text-[#0F172A]">
                  Skills
                </td>
                {compareCandidates.map((c) => (
                  <td
                    key={`cmp_sk_${c.id}`}
                    className="px-4 py-3 text-slate-700"
                  >
                    {(c.skills || []).join(", ")}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="px-4 py-3 font-semibold text-[#0F172A]">
                  Matched Skills
                </td>
                {compareCandidates.map((c) => (
                  <td key={`cmp_m_${c.id}`} className="px-4 py-3 text-slate-700">
                    {(c.matched || []).join(", ") || "-"}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="px-4 py-3 font-semibold text-[#0F172A]">
                  Missing Skills
                </td>
                {compareCandidates.map((c) => (
                  <td
                    key={`cmp_ms_${c.id}`}
                    className="px-4 py-3 text-slate-700"
                  >
                    {(c.missing || []).join(", ") || "-"}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>

          {compareCandidates.length === 0 ? (
            <div className="p-4 text-sm text-slate-600">
              Select 2-3 candidates to compare.
            </div>
          ) : null}
        </div>
      </Modal>

      <div className="fixed bottom-4 right-4 z-30 flex flex-wrap gap-2 md:hidden">
        <button
          onClick={() => activeCandidate ? setCandidateStatus(activeCandidate.id, "Shortlisted") : null}
          className="rounded-full bg-green-600 px-3 py-2 text-xs font-semibold text-white shadow-lg"
        >
          <span className="inline-flex items-center gap-1">
            <FiUserCheck />
            Shortlist
          </span>
        </button>
        <button
          onClick={() => activeCandidate ? setCandidateStatus(activeCandidate.id, "Rejected") : null}
          className="rounded-full bg-red-600 px-3 py-2 text-xs font-semibold text-white shadow-lg"
        >
          <span className="inline-flex items-center gap-1">
            <FiUserX />
            Reject
          </span>
        </button>
        <button
          onClick={() => (activeCandidate ? openThread(activeCandidate.id) : null)}
          className="rounded-full bg-[#2563EB] px-3 py-2 text-xs font-semibold text-white shadow-lg"
        >
          <span className="inline-flex items-center gap-1">
            <FiMessageSquare />
            Message
          </span>
        </button>
      </div>

      {toast ? (
        <div className="fixed bottom-5 right-5 z-[70] rounded-lg bg-[#0F172A] px-3 py-2 text-xs font-semibold text-white shadow-lg">
          {toast}
        </div>
      ) : null}
    </div>
  );
}

