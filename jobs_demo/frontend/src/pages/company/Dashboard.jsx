import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiBriefcase,
  FiCalendar,
  FiCheckCircle,
  FiClock,
  FiDownload,
  FiFileText,
  FiMessageSquare,
} from "react-icons/fi";
import Modal from "../../components/common/Modal.jsx";
import {
  closeJob,
  getCompanyDashboard,
  scheduleInterview,
  updateApplicationStatus,
} from "../../services/companyService";

function Card({ title, right, children, className = "" }) {
  return (
    <section className={`rounded-2xl border border-slate-200 bg-white shadow-sm ${className}`}>
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

function KpiCard({ icon, value, label, hint }) {
  return (
    <Card className="transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between">
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-[#2563EB]">{icon}</span>
        <span className="text-xs text-slate-500">{hint}</span>
      </div>
      <p className="mt-3 text-2xl font-bold text-[#0F172A]">{value}</p>
      <p className="mt-1 text-sm text-slate-600">{label}</p>
    </Card>
  );
}

function StatusBadge({ status }) {
  const cls = {
    Applied: "border-blue-200 bg-blue-50 text-[#2563EB]",
    Shortlisted: "border-green-200 bg-green-50 text-green-700",
    Hold: "border-orange-200 bg-orange-50 text-[#F97316]",
    Rejected: "border-red-200 bg-red-50 text-red-600",
    "Interview Scheduled": "border-indigo-200 bg-indigo-50 text-indigo-700",
    Active: "border-green-200 bg-green-50 text-green-700",
    Closed: "border-slate-200 bg-slate-100 text-slate-600",
    Online: "border-blue-200 bg-blue-50 text-[#2563EB]",
    Onsite: "border-slate-200 bg-slate-100 text-slate-600",
    Inactive: "border-slate-200 bg-slate-100 text-slate-600",
  };

  return <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${cls[status] || "border-slate-200 bg-slate-100 text-slate-600"}`}>{status}</span>;
}

function UsageBar({ label, used, limit, color = "blue" }) {
  const safeLimit = Math.max(1, Number(limit) || 1);
  const percent = Math.min(100, Math.round((Number(used || 0) / safeLimit) * 100));
  const bar = color === "orange" ? "bg-[#F97316]" : "bg-[#2563EB]";

  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs text-slate-600">
        <span>{label}</span>
        <span>{used}/{limit}</span>
      </div>
      <div className="h-2 rounded-full bg-slate-200">
        <div className={`h-2 rounded-full ${bar}`} style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [aiEnabled, setAiEnabled] = useState(true);
  const [toast, setToast] = useState("");
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [scheduleTargetId, setScheduleTargetId] = useState("");
  const [scheduleForm, setScheduleForm] = useState({ date: "", time: "", mode: "Online", message: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dashboard, setDashboard] = useState(null);

  const notify = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 1300);
  };

  const fetchDashboard = useCallback(async () => {
    try {
      const data = await getCompanyDashboard();
      setDashboard(data || null);
    } catch (err) {
      console.error(err);
      notify("Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const onAppStatus = async (id, status, okMsg) => {
    if (!id) return;
    try {
      setSaving(true);
      await updateApplicationStatus(id, status);
      notify(okMsg);
      await fetchDashboard();
    } catch (err) {
      console.error(err);
      notify("Action failed");
    } finally {
      setSaving(false);
    }
  };

  const onCloseJob = async (id) => {
    if (!id) return;
    try {
      setSaving(true);
      await closeJob(id);
      notify("Job closed");
      await fetchDashboard();
    } catch (err) {
      console.error(err);
      notify("Unable to close job");
    } finally {
      setSaving(false);
    }
  };

  const openSchedule = (applicationId) => {
    if (!applicationId) {
      notify("Open Applications to schedule this interview");
      return;
    }
    setScheduleTargetId(applicationId);
    setScheduleOpen(true);
  };

  const onSchedule = async () => {
    if (!scheduleTargetId) {
      notify("Select a candidate first");
      return;
    }
    if (!scheduleForm.date || !scheduleForm.time) {
      notify("Date and time required");
      return;
    }

    try {
      setSaving(true);
      await scheduleInterview(scheduleTargetId, {
        date: scheduleForm.date,
        time: scheduleForm.time,
        type: scheduleForm.mode,
        message: scheduleForm.message,
      });
      setScheduleOpen(false);
      setScheduleTargetId("");
      setScheduleForm({ date: "", time: "", mode: "Online", message: "" });
      notify("Interview scheduled successfully");
      await fetchDashboard();
    } catch (err) {
      console.error(err);
      notify("Failed to schedule interview");
    } finally {
      setSaving(false);
    }
  };

  const stats = dashboard?.stats || {};
  const subscription = dashboard?.subscription || {};
  const companyName = dashboard?.company?.name || "Company";
  const applications = dashboard?.recentApplications || [];
  const shortlisted = dashboard?.shortlistedCandidates || [];
  const jobs = dashboard?.activeJobs || [];
  const interviews = dashboard?.upcomingInterviews || [];
  const conversations = dashboard?.recentMessages || [];

  const jobsUsed = Number(subscription?.jobsUsed || 0);
  const jobsLimit = Number(subscription?.jobsLimit || 0);
  const appsUsed = Number(subscription?.applicationsUsed || 0);
  const appsLimit = Number(subscription?.applicationsLimit || 0);
  const nearLimit = (jobsLimit > 0 && jobsUsed / jobsLimit >= 0.8) || (appsLimit > 0 && appsUsed / appsLimit >= 0.8);

  if (loading) {
    return <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-600">Loading dashboard...</div>;
  }

  return (
    <div className="space-y-5 pb-24 md:pb-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Dashboard</p>
          <h1 className="mt-1 text-2xl font-bold text-[#0F172A]">Welcome back, {companyName}</h1>
          <p className="mt-1 text-sm text-slate-500">Manage hiring, applications, and interviews in one place</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => navigate("/company/post-job")} className="rounded-xl bg-[#2563EB] px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">Post New Job</button>
          <button onClick={() => navigate("/company/pricing")} className="rounded-xl border border-orange-200 px-4 py-2 text-sm font-semibold text-[#F97316] hover:bg-orange-50">Upgrade Plan</button>
          <button onClick={() => navigate("/company/candidates")} className="rounded-xl border border-blue-200 px-4 py-2 text-sm font-semibold text-[#2563EB] hover:bg-blue-50">View Applications</button>
        </div>
      </header>

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-6">
        <KpiCard icon={<FiBriefcase />} value={stats?.activeJobs ?? 0} label="Active Jobs" hint="Updated today" />
        <KpiCard icon={<FiFileText />} value={stats?.totalApplications ?? 0} label="Total Applications" hint="Updated today" />
        <KpiCard icon={<FiClock />} value={stats?.newToday ?? 0} label="New Applications Today" hint="Updated today" />
        <KpiCard icon={<FiCheckCircle />} value={stats?.shortlisted ?? 0} label="Shortlisted" hint="Updated today" />
        <KpiCard icon={<FiCalendar />} value={stats?.interviews ?? 0} label="Interviews Scheduled" hint="Updated today" />
        <KpiCard icon={<FiMessageSquare />} value={stats?.unreadMessages ?? 0} label="Messages Unread" hint="Updated today" />
      </section>

      <Card title="Plan and Usage" right={<StatusBadge status={subscription?.status || "Inactive"} />}>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_auto]">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2 text-sm text-slate-700">
              <span className="rounded-full border border-orange-200 bg-orange-50 px-2 py-0.5 text-xs font-semibold text-[#F97316]">{subscription?.planName || "Plan"}</span>
              <span>Start: {subscription?.startDate || "-"}</span>
              <span>End: {subscription?.endDate || "-"}</span>
            </div>
            <UsageBar label="Jobs Used" used={jobsUsed} limit={jobsLimit} color="blue" />
            <UsageBar label="Applications Used" used={appsUsed} limit={appsLimit} color="orange" />
            {nearLimit ? <p className="rounded-lg border border-orange-200 bg-orange-50 px-3 py-2 text-xs text-[#9A3412]">You are close to your monthly limit.</p> : null}
          </div>
          <div className="flex items-start gap-2">
            <button onClick={() => navigate("/company/pricing")} className="rounded-lg border border-blue-200 px-3 py-2 text-xs font-semibold text-[#2563EB] hover:bg-blue-50">View Plans</button>
            <button onClick={() => navigate("/company/pricing")} className="rounded-lg bg-[#F97316] px-3 py-2 text-xs font-semibold text-white hover:bg-orange-600">Upgrade</button>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_330px]">
        <Card title="Recent Applications" right={<button onClick={() => navigate("/company/candidates")} className="text-sm font-semibold text-[#2563EB] hover:underline">View All Applications</button>}>
          <div className="overflow-x-auto">
            <table className="min-w-[980px] w-full text-left text-sm">
              <thead>
                <tr className="text-slate-500">
                  <th className="pb-2">Candidate</th>
                  <th className="pb-2">Applied Job</th>
                  <th className="pb-2">Experience</th>
                  <th className="pb-2">Top Skills</th>
                  <th className="pb-2">Applied Date</th>
                  <th className="pb-2">Status</th>
                  <th className="pb-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {applications.map((a, index) => {
                  const candidateName = a?.name || a?.candidateName || "Candidate";
                  const topSkills = a?.skills || a?.topSkills || [];
                  return (
                    <tr key={a?.id || `application_${index}`} className="border-t border-slate-100 hover:bg-blue-50/40">
                      <td className="py-3">
                        <div className="flex items-center gap-2">
                          <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-blue-50 text-xs font-bold text-[#2563EB]">{candidateName.split(" ").map((x) => x[0]).slice(0, 2).join("")}</span>
                          <span className="font-semibold text-[#0F172A]">{candidateName}</span>
                        </div>
                      </td>
                      <td className="py-3 text-slate-700">{a?.job || a?.jobTitle || "-"}</td>
                      <td className="py-3 text-slate-700">{a?.exp || a?.experience || "-"}</td>
                      <td className="py-3">
                        <div className="flex flex-wrap gap-1">
                          {topSkills.map((s, skillIndex) => (
                            <span key={`${a?.id || index}_${s}_${skillIndex}`} className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs text-slate-600">{s}</span>
                          ))}
                        </div>
                      </td>
                      <td className="py-3 text-slate-600">{a?.date || a?.appliedDate || "-"}</td>
                      <td className="py-3"><StatusBadge status={a?.status || "Applied"} /></td>
                      <td className="py-3">
                        <div className="flex flex-wrap gap-1">
                          <button onClick={() => navigate("/company/candidates")} className="rounded-md border border-blue-200 px-2 py-1 text-xs font-semibold text-[#2563EB] hover:bg-blue-50">View</button>
                          <button onClick={() => onAppStatus(a?.id, "Shortlisted", "Candidate shortlisted")} disabled={saving} className="rounded-md border border-green-200 px-2 py-1 text-xs font-semibold text-green-700 hover:bg-green-50 disabled:opacity-60">Shortlist</button>
                          <button onClick={() => onAppStatus(a?.id, "Hold", "Candidate on hold")} disabled={saving} className="rounded-md border border-orange-200 px-2 py-1 text-xs font-semibold text-[#F97316] hover:bg-orange-50 disabled:opacity-60">Hold</button>
                          <button onClick={() => onAppStatus(a?.id, "Rejected", "Candidate rejected")} disabled={saving} className="rounded-md border border-red-200 px-2 py-1 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-60">Reject</button>
                          <button onClick={() => navigate("/company/messages")} className="rounded-md border border-blue-200 px-2 py-1 text-xs font-semibold text-[#2563EB] hover:bg-blue-50">Message</button>
                          <button onClick={() => openSchedule(a?.id)} className="rounded-md border border-blue-200 px-2 py-1 text-xs font-semibold text-[#2563EB] hover:bg-blue-50">Schedule</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>

        <Card title="Shortlisted Candidates" right={<button onClick={() => navigate("/company/shortlisted")} className="text-sm font-semibold text-[#2563EB] hover:underline">Open Shortlisted</button>}>
          <div className="space-y-2">
            {shortlisted.map((s, index) => (
              <div key={s?.id || `shortlisted_${index}`} className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-2">
                <div>
                  <p className="text-sm font-semibold text-[#0F172A]">{s?.name || s?.candidateName || "Candidate"}</p>
                  <p className="text-xs text-slate-500">{s?.role || s?.jobTitle || "-"} • {s?.exp || s?.experience || "-"}</p>
                </div>
                <div className="flex items-center gap-1">
                  <span className="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[11px] text-slate-600">{s?.skill || s?.topSkill || "-"}</span>
                  <button onClick={() => navigate("/company/messages")} className="rounded-md border border-blue-200 px-2 py-1 text-xs font-semibold text-[#2563EB] hover:bg-blue-50">Message</button>
                  <button onClick={() => openSchedule(s?.id)} className="rounded-md border border-slate-200 px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-white">Schedule</button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
        <Card title="Your Active Jobs" right={<button onClick={() => navigate("/company/post-job")} className="rounded-lg border border-blue-200 px-2.5 py-1.5 text-xs font-semibold text-[#2563EB] hover:bg-blue-50">Post Job</button>}>
          <div className="space-y-2">
            {jobs.length ? jobs.map((j, index) => (
              <div key={j?.id || `job_${index}`} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3">
                <div>
                  <p className="text-sm font-semibold text-[#0F172A]">{j?.title || j?.jobTitle || "Untitled"}</p>
                  <p className="text-xs text-slate-500">{j?.location || "-"} • {j?.mode || "-"} • {j?.applications || j?.applicationCount || 0} applications</p>
                </div>
                <div className="flex items-center gap-1">
                  <StatusBadge status={j?.status || "Active"} />
                  <button onClick={() => navigate("/company/my-jobs")} className="rounded-md border border-blue-200 px-2 py-1 text-xs font-semibold text-[#2563EB] hover:bg-blue-50">View</button>
                  <button onClick={() => navigate("/company/my-jobs")} className="rounded-md border border-slate-200 px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-white">Edit</button>
                  <button onClick={() => onCloseJob(j?.id)} disabled={saving} className="rounded-md border border-red-200 px-2 py-1 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-60">Close</button>
                </div>
              </div>
            )) : (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                No active jobs yet.
                <button onClick={() => navigate("/company/post-job")} className="ml-2 font-semibold text-[#2563EB]">Post New Job</button>
              </div>
            )}
          </div>
        </Card>

        <Card title="Upcoming Interviews">
          <div className="space-y-2">
            {interviews.map((i, index) => (
              <div key={i?.id || `interview_${index}`} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-[#0F172A]">{i?.name || i?.candidateName || "Candidate"}</p>
                    <p className="text-xs text-slate-500">{i?.job || i?.jobTitle || "-"}</p>
                    <p className="mt-1 text-xs text-slate-600">{i?.when || i?.scheduledAt || "-"}</p>
                  </div>
                  <StatusBadge status={i?.mode || "Online"} />
                </div>
                <div className="mt-2 flex gap-1">
                  <button onClick={() => navigate("/company/interviews")} className="rounded-md border border-slate-200 px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-white">View details</button>
                  <button onClick={() => navigate("/company/interviews")} className="rounded-md border border-orange-200 px-2 py-1 text-xs font-semibold text-[#F97316] hover:bg-orange-50">Reschedule</button>
                  {i?.mode === "Online" ? <button onClick={() => notify("Opening meeting link from Interviews page")} className="rounded-md border border-blue-200 px-2 py-1 text-xs font-semibold text-[#2563EB] hover:bg-blue-50">Join meeting</button> : null}
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
        <Card title="Messages" right={<button onClick={() => navigate("/company/messages")} className="text-sm font-semibold text-[#2563EB] hover:underline">Open Messages</button>}>
          <div className="space-y-2">
            {conversations.map((c, index) => (
              <div key={c?.id || `message_${index}`} className="flex items-start justify-between gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3">
                <div>
                  <p className="text-sm font-semibold text-[#0F172A]">{c?.name || c?.candidateName || "Candidate"}</p>
                  <p className="text-xs text-slate-600">{c?.text || c?.message || ""}</p>
                </div>
                <div className="flex items-center gap-1">
                  {c?.unread ? <span className="inline-flex h-2.5 w-2.5 rounded-full bg-[#2563EB]" /> : null}
                  <span className="text-xs text-slate-500">{c?.time || c?.timeAgo || ""}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card title="Quick Actions">
          <div className="space-y-2">
            <button onClick={() => navigate("/company/post-job")} className="w-full rounded-xl bg-[#2563EB] px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">Post New Job</button>
            <button onClick={() => navigate("/company/candidates")} className="w-full rounded-xl border border-blue-200 px-4 py-2 text-sm font-semibold text-[#2563EB] hover:bg-blue-50">Review New Applications</button>
            <button onClick={() => notify("Use Applied Candidates page for resume export")} className="inline-flex w-full items-center justify-center gap-1 rounded-xl border border-blue-200 px-4 py-2 text-sm font-semibold text-[#2563EB] hover:bg-blue-50">
              <FiDownload />Bulk Download Resumes
            </button>
            <div className="rounded-xl border border-slate-200 p-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-700">Enable AI Ranking</span>
                <button onClick={() => setAiEnabled((v) => !v)} className={`relative h-5 w-10 rounded-full transition ${aiEnabled ? "bg-[#2563EB]" : "bg-slate-300"}`}>
                  <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition ${aiEnabled ? "left-[22px]" : "left-0.5"}`} />
                </button>
              </div>
              {aiEnabled ? <p className="mt-2 text-xs text-[#1E40AF]">AI ranks applicants using resume match and screening answers.</p> : null}
            </div>
            <button onClick={() => navigate("/company/boost-job")} className="w-full rounded-xl bg-[#F97316] px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600">Boost a Job</button>
          </div>
        </Card>
      </div>

      <Modal
        open={scheduleOpen}
        onClose={() => setScheduleOpen(false)}
        title="Schedule Interview"
        footer={
          <>
            <button onClick={() => setScheduleOpen(false)} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700">Cancel</button>
            <button onClick={onSchedule} disabled={saving} className="rounded-lg bg-[#2563EB] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">Send Invite</button>
          </>
        }
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Date</span>
            <input type="date" value={scheduleForm.date} onChange={(e) => setScheduleForm((p) => ({ ...p, date: e.target.value }))} className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm" />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Time</span>
            <input type="time" value={scheduleForm.time} onChange={(e) => setScheduleForm((p) => ({ ...p, time: e.target.value }))} className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm" />
          </label>
          <label className="block sm:col-span-2">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Mode</span>
            <select value={scheduleForm.mode} onChange={(e) => setScheduleForm((p) => ({ ...p, mode: e.target.value }))} className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm">
              <option>Online</option>
              <option>Onsite</option>
            </select>
          </label>
          <label className="block sm:col-span-2">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Message</span>
            <textarea value={scheduleForm.message} onChange={(e) => setScheduleForm((p) => ({ ...p, message: e.target.value }))} rows={3} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" placeholder="Add interview details" />
          </label>
        </div>
      </Modal>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white p-3 md:hidden">
        <button onClick={() => navigate("/company/post-job")} className="w-full rounded-xl bg-[#2563EB] px-4 py-2.5 text-sm font-semibold text-white">Post New Job</button>
      </div>

      {toast ? <div className="fixed bottom-5 right-5 z-[70] rounded-lg bg-[#0F172A] px-3 py-2 text-xs font-semibold text-white shadow-lg">{toast}</div> : null}
    </div>
  );
}
