// src/pages/company/BoostJob.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { FiAward, FiCalendar, FiCheck, FiClock, FiMapPin, FiStar, FiTarget, FiUsers } from "react-icons/fi";
import Modal from "../../components/common/Modal.jsx";
import { showSweetToast } from "../../utils/sweetAlert.js";
import {
  getBoostPlans,
  listCompanyBoosts,
  listCompanyJobs,
  boostCompanyJob,
  cancelCompanyBoost,
  extendCompanyBoost,
} from "../../services/companyService.js";

function StatusBadge({ status }) {
  const cls = {
    Active: "border-green-200 bg-green-50 text-green-700",
    Expired: "border-slate-200 bg-slate-100 text-slate-600",
    Scheduled: "border-blue-200 bg-blue-50 text-[#2563EB]",
    Cancelled: "border-red-200 bg-red-50 text-red-600",
    Draft: "border-slate-200 bg-slate-100 text-slate-600",
    Closed: "border-slate-200 bg-slate-100 text-slate-600",
    Disabled: "border-slate-200 bg-slate-100 text-slate-600",
  };
  return (
    <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${cls[status] || "border-slate-200 bg-slate-100 text-slate-600"}`}>
      {status}
    </span>
  );
}

function normalizeStatus(value) {
  const raw = String(value || "").toLowerCase();
  if (!raw) return "Active";
  return raw.charAt(0).toUpperCase() + raw.slice(1);
}

function PackageCard({ pkg, selected, onChoose, cycle }) {
  const active = selected === pkg.id;
  const price = cycle === "yearly" ? pkg.yearlyPrice : pkg.monthlyPrice;

  return (
    <div
      className={`rounded-2xl border bg-white p-5 shadow-sm transition ${
        active ? "border-[#F59E0B] ring-2 ring-orange-100" : "border-slate-200 hover:-translate-y-0.5 hover:border-orange-200 hover:shadow-md"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-slate-500">{pkg.name}</p>
          <p className="mt-1 text-3xl font-bold text-[#0F172A]">Rs. {price}</p>
          <p className="text-xs text-slate-500">{pkg.duration} days boost</p>
        </div>
        {pkg.recommended ? (
          <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-1 text-[11px] font-semibold text-amber-700">
            Recommended
          </span>
        ) : null}
      </div>

      <div className="mt-4 space-y-2 text-sm text-slate-700">
        <p className="flex items-center gap-2"><FiCheck className="text-green-600" />Featured listing placement</p>
        <p className="flex items-center gap-2"><FiCheck className="text-green-600" />Highlighted job in search</p>
        <p className="flex items-center gap-2"><FiCheck className="text-green-600" />Priority search ranking</p>
        <p className="flex items-center gap-2"><FiCheck className="text-green-600" />Email promotion</p>
        <p className="flex items-center gap-2"><FiCheck className="text-green-600" />Push to matching candidates</p>
      </div>

      <p className="mt-3 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600">Estimated reach: {pkg.reach || "-"}</p>

      <button
        onClick={() => onChoose(pkg.id)}
        className={`mt-4 w-full rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
          active ? "bg-[#F97316] text-white hover:bg-orange-600" : "border border-orange-200 text-[#F97316] hover:bg-orange-50"
        }`}
      >
        Choose Plan
      </button>
    </div>
  );
}

export default function BoostJob() {
  const [loading, setLoading] = useState(true);
  const [jobs, setJobs] = useState([]);
  const [boosts, setBoosts] = useState([]);
  const [plans, setPlans] = useState([]);

  const [jobId, setJobId] = useState("");
  const [cycle, setCycle] = useState("monthly");
  const [selectedPkg, setSelectedPkg] = useState("");
  const [startMode, setStartMode] = useState("now");
  const [startDate, setStartDate] = useState("");
  const [duration, setDuration] = useState("7");

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [success, setSuccess] = useState(null);
  const activeBoostsRef = useRef(null);

  const ping = (msg) => {
    void showSweetToast(msg, "info", { timer: 1400 });
  };

  const packages = useMemo(() => plans || [], [plans]);

  const selectedJob = jobs.find((j) => String(j._id) === String(jobId));
  const pkg = packages.find((p) => String(p.id) === String(selectedPkg));

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const [jobsRes, boostsRes, plansRes] = await Promise.all([
          listCompanyJobs({ status: "all" }),
          listCompanyBoosts(),
          getBoostPlans(),
        ]);

        const jobItems = jobsRes?.items || [];
        const planItems = plansRes?.items || [];

        setJobs(jobItems);
        setBoosts(boostsRes?.items || []);
        setPlans(planItems);

        if (jobItems.length) setJobId((prev) => prev || String(jobItems[0]._id));
        if (planItems.length) {
          setSelectedPkg((prev) => prev || String(planItems[0].id));
          setDuration(String(planItems[0].duration || 7));
        }

        const today = new Date().toISOString().slice(0, 10);
        setStartDate(today);
      } catch (e) {
        console.error(e);
        ping(e?.response?.data?.message || "Failed to load boost data");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (!pkg) return;
    setDuration(String(pkg.duration || 7));
  }, [selectedPkg]);

  const resolveDates = () => {
    const start =
      startMode === "now"
        ? new Date().toISOString().slice(0, 10)
        : startDate || new Date().toISOString().slice(0, 10);

    const days = Number(duration || pkg?.duration || 7);

    const startObj = new Date(`${start}T00:00:00`);
    const endObj = new Date(startObj);
    endObj.setDate(endObj.getDate() + days);

    const end = endObj.toISOString().slice(0, 10);
    return { start, end };
  };

  const { start, end } = resolveDates();
  const activeCount = (boosts || []).filter((b) => String(b.status || "").toLowerCase() === "active").length;

  const refreshBoosts = async () => {
    const boostsRes = await listCompanyBoosts();
    setBoosts(boostsRes?.items || []);
  };

  const onConfirmBoost = async () => {
    if (!jobId) return ping("Select a job first");
    if (!selectedPkg) return ping("Select a boost plan first");

    try {
      const res = await boostCompanyJob(jobId, {
        planId: selectedPkg,
        cycle,
        startMode,
        startDate,
        durationDays: Number(duration || pkg?.duration || 7),
      });

      setConfirmOpen(false);
      setSuccess(res?.campaign || { job: selectedJob?.title, plan: pkg?.name, end });

      ping("Boost created successfully");
      await refreshBoosts();
    } catch (e) {
      ping(e?.response?.data?.message || "Boost failed");
    }
  };

  const onCancel = async (boostId) => {
    try {
      await cancelCompanyBoost(boostId);
      ping("Boost cancelled");
      await refreshBoosts();
    } catch (e) {
      ping(e?.response?.data?.message || "Cancel failed");
    }
  };

  const onExtend = async (boostId) => {
    try {
      await extendCompanyBoost(boostId, 7);
      ping("Boost extended by 7 days");
      await refreshBoosts();
    } catch (e) {
      ping(e?.response?.data?.message || "Extend failed");
    }
  };

  if (loading) {
    return <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-600">Loading boost page...</div>;
  }

  return (
    <div className="space-y-6 pb-24 md:pb-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#0F172A]">Boost Your Job Posting</h1>
          <p className="mt-1 text-sm text-slate-500">Get more visibility and attract better candidates</p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={cycle}
            onChange={(e) => setCycle(e.target.value)}
            className="h-10 rounded-xl border border-slate-200 px-3 text-sm font-semibold"
          >
            <option value="monthly">Monthly (30 days)</option>
            <option value="yearly">Yearly (1 year)</option>
          </select>

          <button
            onClick={() => activeBoostsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })}
            className="rounded-xl border border-blue-200 px-4 py-2 text-sm font-semibold text-[#2563EB] hover:bg-blue-50"
          >
            View Active Boosts
          </button>
        </div>
      </header>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Available Jobs</p>
          <p className="mt-2 text-2xl font-bold text-[#0F172A]">{jobs.length}</p>
          <p className="mt-1 text-xs text-slate-500">Jobs you can boost right now</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Active Campaigns</p>
          <p className="mt-2 text-2xl font-bold text-[#0F172A]">{activeCount}</p>
          <p className="mt-1 text-xs text-slate-500">Currently running boosts</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Selected Plan Price</p>
          <p className="mt-2 text-2xl font-bold text-[#0F172A]">Rs. {cycle === "yearly" ? (pkg?.yearlyPrice || 0) : (pkg?.monthlyPrice || 0)}</p>
          <p className="mt-1 text-xs text-slate-500">{pkg?.name || "No plan selected"} ({cycle})</p>
        </div>
      </section>

      {success ? (
        <section className="rounded-2xl border border-green-200 bg-green-50 p-4 text-sm text-green-800 shadow-sm">
          <p className="font-semibold">Your job is now boosted.</p>
          <p className="mt-1">
            {(success.title || success.job || selectedJob?.title) || "Job"} is running on {(success.planName || success.plan) || pkg?.name} and expires on {(success.end || end)}.
          </p>
        </section>
      ) : null}

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_330px]">
        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-base font-semibold text-[#0F172A]">Select Job to Boost</h2>
            <select
              value={jobId}
              onChange={(e) => setJobId(e.target.value)}
              className="mt-3 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-blue-300"
            >
              {!jobs.length ? <option value="">No jobs available</option> : null}
              {jobs.map((job) => (
                <option key={job._id} value={job._id}>{job.title}</option>
              ))}
            </select>
            {!jobs.length ? (
              <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800">
                No posted jobs found. Create a job first, then return here to boost it.
              </p>
            ) : null}

            <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-[#0F172A]">{selectedJob?.title || "-"}</p>
                  <p className="mt-1 flex items-center gap-1 text-sm text-slate-600"><FiMapPin />{selectedJob?.location || "-"}</p>
                </div>
                <StatusBadge status={normalizeStatus(selectedJob?.status)} />
              </div>
              <p className="mt-3 flex items-center gap-1 text-sm text-slate-600"><FiUsers />Applications: {selectedJob?.applicationsCount || 0}</p>
            </div>
          </div>

          <div>
            <h2 className="mb-3 text-base font-semibold text-[#0F172A]">Boost Packages</h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {packages.map((p) => (
                <PackageCard key={p.id} pkg={p} cycle={cycle} selected={selectedPkg} onChoose={setSelectedPkg} />
              ))}
            </div>
            {!packages.length ? <p className="mt-3 text-sm text-slate-500">No active boost plans found. Ask admin to create or activate plans.</p> : null}
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-base font-semibold text-[#0F172A]">Boost Schedule</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                onClick={() => setStartMode("now")}
                className={`rounded-lg border px-3 py-1.5 text-sm font-semibold ${
                  startMode === "now" ? "border-blue-200 bg-blue-50 text-[#2563EB]" : "border-slate-200 text-slate-700"
                }`}
              >
                Start Immediately
              </button>
              <button
                onClick={() => setStartMode("later")}
                className={`rounded-lg border px-3 py-1.5 text-sm font-semibold ${
                  startMode === "later" ? "border-blue-200 bg-blue-50 text-[#2563EB]" : "border-slate-200 text-slate-700"
                }`}
              >
                Schedule Later
              </button>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Start Date</label>
                <input
                  type="date"
                  disabled={startMode === "now"}
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Duration</label>
                <select
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm"
                >
                  <option value="3">3 Days</option>
                  <option value="7">7 Days</option>
                  <option value="14">14 Days</option>
                  <option value="30">30 Days</option>
                </select>
              </div>
            </div>

            <p className="mt-3 flex items-center gap-1 rounded-lg bg-blue-50 px-3 py-2 text-sm text-[#2563EB]">
              <FiCalendar /> Your job will be boosted from {start} to {end}
            </p>
          </div>

          <section ref={activeBoostsRef} className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-5 py-4">
              <h3 className="text-base font-semibold text-[#0F172A]">Active Boost Campaigns</h3>
            </div>
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  {["Job Title", "Boost Plan", "Start Date", "End Date", "Status", "Actions"].map((head) => (
                    <th key={head} className="px-4 py-3 text-left font-semibold">{head}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(boosts || []).map((item) => (
                  <tr key={item.id} className="hover:bg-[#EFF6FF]">
                    <td className="px-4 py-3 font-medium text-[#0F172A]">{item.title}</td>
                    <td className="px-4 py-3 text-slate-700">{item.planName} ({item.cycle})</td>
                    <td className="px-4 py-3 text-slate-700">{item.start}</td>
                    <td className="px-4 py-3 text-slate-700">{item.end}</td>
                    <td className="px-4 py-3"><StatusBadge status={item.status} /></td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() => onExtend(item.id)}
                          className="rounded-lg border border-orange-200 px-2.5 py-1.5 text-xs font-semibold text-[#F97316] hover:bg-orange-50"
                        >
                          Extend +7d
                        </button>
                        <button
                          onClick={() => onCancel(item.id)}
                          className="rounded-lg border border-red-200 px-2.5 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50"
                        >
                          Cancel
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {!boosts?.length ? (
                  <tr>
                    <td className="px-4 py-6 text-slate-500" colSpan={6}>
                      No boost campaigns yet.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </section>
        </div>

        <aside className="space-y-4">
          <div className="rounded-2xl border border-amber-200 bg-white p-5 shadow-sm">
            <h3 className="text-base font-semibold text-[#0F172A]">What happens when you boost?</h3>
            <ul className="mt-3 space-y-2 text-sm text-slate-700">
              <li className="flex items-start gap-2"><FiStar className="mt-0.5 text-amber-500" />Appears at top of relevant search results</li>
              <li className="flex items-start gap-2"><FiTarget className="mt-0.5 text-amber-500" />Highlighted with premium orange border</li>
              <li className="flex items-start gap-2"><FiAward className="mt-0.5 text-amber-500" />Placed in featured listings section</li>
              <li className="flex items-start gap-2"><FiUsers className="mt-0.5 text-amber-500" />Increased candidate visibility</li>
              <li className="flex items-start gap-2"><FiClock className="mt-0.5 text-amber-500" />Faster inbound applications</li>
            </ul>

            <div className="mt-4 rounded-xl border-2 border-amber-300 bg-amber-50 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">Boosted Preview</p>
              <p className="mt-1 text-sm font-semibold text-[#0F172A]">{selectedJob?.title || "-"}</p>
              <p className="text-xs text-slate-600">Featured Listing - Priority Placement</p>
            </div>
          </div>

          <button
            onClick={() => setConfirmOpen(true)}
            disabled={!selectedJob || !pkg}
            className="hidden w-full rounded-xl bg-[#F97316] px-4 py-2.5 text-sm font-semibold text-white hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-50 md:block"
          >
            Review and Boost
          </button>
        </aside>
      </section>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white p-3 md:hidden">
        <button
          onClick={() => setConfirmOpen(true)}
          disabled={!selectedJob || !pkg}
          className="w-full rounded-xl bg-[#F97316] px-4 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          Review and Boost
        </button>
      </div>

      <Modal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="Payment Confirmation"
        footer={
          <>
            <button onClick={() => setConfirmOpen(false)} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700">
              Cancel
            </button>
            <button onClick={onConfirmBoost} className="rounded-lg bg-[#F97316] px-4 py-2 text-sm font-semibold text-white">
              Confirm Boost
            </button>
          </>
        }
      >
        <div className="space-y-2 text-sm text-slate-700">
          <p><span className="font-semibold text-[#0F172A]">Selected Job:</span> {selectedJob?.title || "-"}</p>
          <p><span className="font-semibold text-[#0F172A]">Boost Plan:</span> {pkg?.name || "-"}</p>
          <p><span className="font-semibold text-[#0F172A]">Cycle:</span> {cycle}</p>
          <p><span className="font-semibold text-[#0F172A]">Duration:</span> {duration} days</p>
          <p><span className="font-semibold text-[#0F172A]">Schedule:</span> {start} to {end}</p>
          <p className="rounded-lg bg-orange-50 px-3 py-2 font-semibold text-[#F97316]">
            Total Price: Rs. {cycle === "yearly" ? (pkg?.yearlyPrice || 0) : (pkg?.monthlyPrice || 0)}
          </p>
        </div>
      </Modal>

    </div>
  );
}

