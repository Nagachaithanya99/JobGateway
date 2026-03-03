// src/pages/company/PricingPlans.jsx
import { useEffect, useMemo, useState } from "react";
import { FiCheckCircle, FiStar, FiTrendingUp, FiZap } from "react-icons/fi";
import Toast from "../../components/common/Toast.jsx";
import Modal from "../../components/common/Modal.jsx";
import {
  getCompanyPlans,
  getCompanyBillingMe,
  subscribeCompanyPlan,
  cancelCompanyPlan,
} from "../../services/companyService.js";

function Card({ children, className = "" }) {
  return (
    <div className={`rounded-2xl border border-slate-200 bg-white p-5 shadow-sm ${className}`}>
      {children}
    </div>
  );
}

function Badge({ children, tone = "blue" }) {
  const tones = {
    blue: "border-blue-200 bg-blue-50 text-[#2563EB]",
    orange: "border-orange-200 bg-orange-50 text-[#F97316]",
    green: "border-green-200 bg-green-50 text-green-700",
    slate: "border-slate-200 bg-slate-50 text-slate-700",
  };
  return <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${tones[tone]}`}>{children}</span>;
}

function UsageBar({ label, used, limit }) {
  const safe = Math.max(1, Number(limit || 1));
  const pct = Math.min(100, Math.round((Number(used || 0) / safe) * 100));
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs text-slate-600">
        <span>{label}</span>
        <span>{used}/{limit >= 999999 ? "Unlimited" : limit}</span>
      </div>
      <div className="h-2 rounded-full bg-slate-200">
        <div className="h-2 rounded-full bg-[#2563EB]" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default function PricingPlans() {
  const [plans, setPlans] = useState([]);
  const [sub, setSub] = useState(null);
  const [loading, setLoading] = useState(true);

  const [cycle, setCycle] = useState("monthly");
  const [confirm, setConfirm] = useState({ open: false, plan: null });

  const [toast, setToast] = useState({ show: false, message: "", tone: "dark" });
  const ping = (message, tone = "dark") => setToast({ show: true, message, tone });

  const load = async () => {
    try {
      setLoading(true);
      const [p, me] = await Promise.all([getCompanyPlans(), getCompanyBillingMe()]);
      setPlans(p?.items || []);
      setSub(me?.subscription || null);
    } catch (e) {
      ping(e?.response?.data?.message || "Failed to load pricing", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const currentPlanName = sub?.planName || "Starter";
  const isActive = sub?.status === "active";

  const planCards = useMemo(() => {
    const sorted = [...plans];
    const order = { Starter: 1, Growth: 2, Premium: 3, Unlimited: 4 };
    sorted.sort((a, b) => (order[a.name] || 99) - (order[b.name] || 99));
    return sorted;
  }, [plans]);

  const priceOf = (p) => (cycle === "yearly" ? p.yearlyPrice : p.monthlyPrice);
  const limitsOf = (p) => (cycle === "yearly" ? p.yearly : p.monthly);
  const activePlan = planCards.find((p) => String(p.name) === String(currentPlanName));
  const selectedPrice = activePlan ? priceOf(activePlan) : 0;
  const selectedLimits = activePlan ? limitsOf(activePlan) : null;
  const jobsLimit = selectedLimits?.jobsLimit || sub?.jobsLimit || 1;
  const appsLimit = selectedLimits?.appsLimit || sub?.applicationsLimit || 100;

  const onSubscribe = async (planId) => {
    try {
      await subscribeCompanyPlan(planId, cycle);
      setConfirm({ open: false, plan: null });
      ping(`Plan activated (${cycle})`, "success");
      await load();
    } catch (e) {
      ping(e?.response?.data?.message || "Subscribe failed", "error");
    }
  };

  const onCancel = async () => {
    try {
      await cancelCompanyPlan();
      ping("Subscription cancelled", "success");
      await load();
    } catch (e) {
      ping(e?.response?.data?.message || "Cancel failed", "error");
    }
  };

  if (loading) {
    return <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-600">Loading plans...</div>;
  }

  return (
    <div className="space-y-5 pb-20 md:pb-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#0F172A]">Subscription Plans</h1>
          <p className="mt-1 text-sm text-slate-500">Choose monthly or yearly billing</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={isActive ? "green" : "slate"}>{isActive ? "Active" : "Inactive"}</Badge>
          <Badge tone="orange">Current: {currentPlanName}</Badge>
          {sub?.billingCycle ? <Badge tone="blue">Cycle: {sub.billingCycle}</Badge> : null}

          {isActive ? (
            <button onClick={onCancel} className="rounded-xl border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50">
              Cancel Plan
            </button>
          ) : null}
        </div>
      </header>

      {/* cycle toggle */}
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-[#0F172A]">Billing Cycle</p>
            <p className="text-xs text-slate-500">Switch pricing view + limits</p>
          </div>

          <div className="inline-flex overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
            <button
              onClick={() => setCycle("monthly")}
              className={`px-4 py-2 text-sm font-semibold ${cycle === "monthly" ? "bg-white text-[#0F172A]" : "text-slate-600 hover:bg-white"}`}
            >
              Monthly (30 days)
            </button>
            <button
              onClick={() => setCycle("yearly")}
              className={`px-4 py-2 text-sm font-semibold ${cycle === "yearly" ? "bg-white text-[#0F172A]" : "text-slate-600 hover:bg-white"}`}
            >
              Yearly (365 days)
            </button>
          </div>
        </div>
      </Card>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Current Plan Price</p>
          <p className="mt-2 text-2xl font-bold text-[#0F172A]">Rs {selectedPrice || sub?.price || 0}</p>
          <p className="mt-1 text-xs text-slate-500">{cycle === "yearly" ? "Per year" : "Per month"} for {currentPlanName}</p>
        </Card>
        <Card>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Jobs Capacity</p>
          <p className="mt-2 text-2xl font-bold text-[#0F172A]">{jobsLimit >= 999999 ? "Unlimited" : jobsLimit}</p>
          <p className="mt-1 text-xs text-slate-500">Posting limit in selected cycle</p>
        </Card>
        <Card>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Applications Capacity</p>
          <p className="mt-2 text-2xl font-bold text-[#0F172A]">{appsLimit >= 999999 ? "Unlimited" : appsLimit}</p>
          <p className="mt-1 text-xs text-slate-500">Application processing limit</p>
        </Card>
      </section>

      {/* current usage */}
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-sm font-semibold text-[#0F172A]">Your Current Usage</p>
            <p className="text-xs text-slate-500">
              {sub?.startDate ? `Start: ${sub.startDate}` : "Start: -"} | {sub?.endDate ? `End: ${sub.endDate}` : "End: -"}
            </p>
          </div>

          {sub?.price ? (
            <Badge tone="orange">
              Paid: Rs {sub.price} ({sub.billingCycle || "monthly"})
            </Badge>
          ) : null}
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
          <UsageBar label="Jobs Used" used={sub?.jobsUsed || 0} limit={sub?.jobsLimit || 1} />
          <UsageBar label="Applications Used" used={sub?.applicationsUsed || 0} limit={sub?.applicationsLimit || 100} />
        </div>
      </Card>

      {/* plans */}
      <section className="grid grid-cols-1 gap-4 lg:grid-cols-4">
        {planCards.map((p) => {
          const isCurrent = String(p.name) === String(currentPlanName);
          const highlight = p.name === "Premium" || p.name === "Unlimited";
          const limits = limitsOf(p);
          const price = priceOf(p);

          return (
            <Card key={p.id} className={highlight ? "border-orange-200 shadow-[0_10px_30px_rgba(249,115,22,0.12)]" : ""}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-lg font-bold text-[#0F172A]">{p.name}</p>
                  <p className="mt-1 text-xs text-slate-500">{p.tagline}</p>
                </div>

                {p.name === "Premium" ? (
                  <span className="inline-flex items-center gap-1 rounded-full border border-orange-200 bg-orange-50 px-2 py-1 text-xs font-semibold text-[#F97316]">
                    <FiStar /> Best
                  </span>
                ) : null}
                {p.name === "Unlimited" ? (
                  <span className="inline-flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-2 py-1 text-xs font-semibold text-[#2563EB]">
                    <FiZap /> Pro
                  </span>
                ) : null}
              </div>

              <div className="mt-4 flex items-end gap-1">
                <p className="text-3xl font-extrabold text-[#0F172A]">Rs {price}</p>
                <p className="pb-1 text-sm text-slate-500">{cycle === "yearly" ? "/ year" : "/ month"}</p>
              </div>
              {cycle === "yearly" && p.monthlyPrice ? (
                <p className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-green-700">
                  <FiTrendingUp />
                  Approx save Rs {(Number(p.monthlyPrice || 0) * 12) - Number(p.yearlyPrice || 0)} yearly
                </p>
              ) : null}

              <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700">
                <p className="font-semibold text-[#0F172A]">Limits ({cycle})</p>
                <p className="mt-1">Jobs: {limits?.jobsLimit >= 999999 ? "Unlimited" : limits?.jobsLimit}</p>
                <p>Applications: {limits?.appsLimit >= 999999 ? "Unlimited" : limits?.appsLimit}</p>
              </div>

              <div className="mt-4 space-y-2 text-sm text-slate-700">
                {(p.features || []).map((f) => (
                  <div key={f} className="flex items-start gap-2">
                    <span className="mt-0.5 text-green-600"><FiCheckCircle /></span>
                    <span>{f}</span>
                  </div>
                ))}
              </div>

              <button
                onClick={() => setConfirm({ open: true, plan: p })}
                disabled={isCurrent && isActive}
                className={`mt-5 w-full rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
                  isCurrent && isActive
                    ? "cursor-not-allowed border border-slate-200 bg-slate-100 text-slate-500"
                    : highlight
                      ? "bg-[#F97316] text-white hover:bg-orange-600"
                      : "bg-[#2563EB] text-white hover:bg-blue-700"
                }`}
              >
                {isCurrent && isActive ? "Current Plan" : `Choose ${p.name}`}
              </button>
            </Card>
          );
        })}
      </section>

      {/* confirm */}
      <Modal
        open={confirm.open}
        onClose={() => setConfirm({ open: false, plan: null })}
        title="Confirm Subscription"
        footer={
          <>
            <button onClick={() => setConfirm({ open: false, plan: null })} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700">
              Cancel
            </button>
            <button onClick={() => onSubscribe(confirm.plan?.id)} className="rounded-lg bg-[#2563EB] px-4 py-2 text-sm font-semibold text-white">
              Confirm and Activate
            </button>
          </>
        }
      >
        <div className="space-y-2 text-sm text-slate-700">
          <p>
            Plan: <span className="font-semibold text-[#0F172A]">{confirm.plan?.name}</span>
          </p>
          <p>
            Cycle: <span className="font-semibold">{cycle}</span>
          </p>
          <p>
            Price: <span className="font-semibold">Rs {confirm.plan ? (cycle === "yearly" ? confirm.plan.yearlyPrice : confirm.plan.monthlyPrice) : ""}</span>
          </p>
          <p className="text-xs text-slate-500">
            Subscription will be activated instantly for the selected cycle.
          </p>
        </div>
      </Modal>

      <Toast show={toast.show} message={toast.message} tone={toast.tone} onClose={() => setToast((p) => ({ ...p, show: false }))} />
    </div>
  );
}

