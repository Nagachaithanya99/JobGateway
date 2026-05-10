import { useEffect, useMemo, useRef, useState } from "react";
import {
  FiActivity,
  FiBarChart2,
  FiDollarSign,
  FiEdit2,
  FiFileText,
  FiPlus,
  FiTrash2,
  FiUsers,
} from "react-icons/fi";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import Modal from "../../components/common/Modal";
import { showSweetConfirm } from "../../utils/sweetAlert.js";
import {
  adminDeletePlan,
  adminListPlans,
  adminListPlanRequests,
  adminRunPlanRequestAction,
  adminSavePlan,
  adminUpdatePlanRequest,
} from "../../services/adminService";

const PIE_COLORS = ["#2563EB", "#F97316", "#7C3AED", "#0EA5E9"];

function formatMoney(value) {
  return `Rs ${Number(value || 0).toLocaleString("en-IN")}`;
}

function toNumberAmount(text) {
  const n = String(text || "").replace(/[^\d.]/g, "");
  return Number(n || 0);
}

function statusClass(value) {
  const v = String(value || "pending").toLowerCase();
  if (v === "approved") return "bg-green-50 border-green-200 text-green-700";
  if (v === "rejected" || v === "failed") return "bg-red-50 border-red-200 text-red-600";
  if (v === "created") return "bg-blue-50 border-blue-200 text-blue-700";
  if (v === "inactive") return "bg-slate-100 border-slate-200 text-slate-600";
  return "bg-orange-50 border-orange-200 text-[#F97316]";
}

function statusLabel(value) {
  const v = String(value || "pending").toLowerCase();
  if (v === "pending") return "Pending Approval";
  if (v === "approved") return "Approved";
  if (v === "rejected") return "Rejected";
  if (v === "created") return "Payment Pending";
  if (v === "failed") return "Payment Failed";
  if (v === "inactive") return "Inactive";
  return value || "Pending";
}

function isReviewableRequest(row) {
  return String(row?.status || "").toLowerCase() === "pending" && String(row?.source || "manual") === "manual";
}

function canApproveRow(row) {
  const status = String(row?.status || "").toLowerCase();
  return ["pending", "created", "failed"].includes(status);
}

function canActivateRow(row) {
  return String(row?.status || "").toLowerCase() === "inactive";
}

function canDeactivateRow(row) {
  return String(row?.status || "").toLowerCase() === "approved";
}

function canRejectRow(row) {
  return String(row?.source || "").toLowerCase() === "manual"
    && String(row?.status || "").toLowerCase() === "pending";
}

function canDeleteRow(row) {
  return Boolean(row?.id);
}

function actionPrompt(action, row) {
  const company = row?.companyName || "this company";
  const plan = row?.planName || "selected plan";

  if (action === "approve") {
    return {
      title: "Approve Plan?",
      text: `Approve ${company} for the ${plan} plan?`,
      confirmButtonText: "Approve",
      tone: "info",
    };
  }
  if (action === "active") {
    return {
      title: "Activate Subscription?",
      text: `Activate ${company} on the ${plan} plan?`,
      confirmButtonText: "Active",
      tone: "info",
    };
  }
  if (action === "inactive") {
    return {
      title: "Mark Subscription Inactive?",
      text: `Set ${company}'s ${plan} plan to inactive?`,
      confirmButtonText: "In-Active",
      tone: "warning",
    };
  }
  if (action === "reject") {
    return {
      title: "Reject Plan Request?",
      text: `Reject ${company} for the ${plan} plan?`,
      confirmButtonText: "Reject",
      tone: "warning",
    };
  }
  return {
    title: "Delete Plan Record?",
    text: `Delete the ${plan} plan record for ${company}?`,
    confirmButtonText: "Delete",
    tone: "warning",
  };
}

function InputField({ label, children }) {
  return (
    <label className="text-sm font-medium text-slate-600">
      {label}
      <div className="mt-1">{children}</div>
    </label>
  );
}

function SafeChartContainer({ className, children }) {
  const containerRef = useRef(null);
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return undefined;

    const measure = () => {
      const rect = el.getBoundingClientRect();
      setSize({
        width: Math.max(0, Math.floor(rect.width)),
        height: Math.max(0, Math.floor(rect.height)),
      });
    };

    measure();

    let observer = null;
    if (typeof ResizeObserver !== "undefined") {
      observer = new ResizeObserver(measure);
      observer.observe(el);
    }

    window.addEventListener("resize", measure);
    return () => {
      window.removeEventListener("resize", measure);
      if (observer) observer.disconnect();
    };
  }, []);

  return (
    <div ref={containerRef} className={className}>
      {size.width > 0 && size.height > 0 ? children(size) : null}
    </div>
  );
}

function StatCard({ title, value, trend, icon }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-1 hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{title}</p>
          <p className="mt-2 text-2xl font-bold text-[#0F172A]">{value}</p>
          <p className="mt-2 text-xs font-semibold text-[#F97316]">{trend}</p>
        </div>
        <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-blue-50 text-[#2563EB]">
          {icon}
        </span>
      </div>
    </div>
  );
}

function PlanCard({ plan, onEdit, onToggle, onDelete }) {
  return (
    <div
      className={`rounded-2xl border bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md ${
        plan.highlight ? "border-blue-300" : "border-slate-200"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-[#0F172A]">{plan.name}</p>
          <p className="mt-2 text-3xl font-bold text-[#0F172A]">{formatMoney(plan.price)}</p>
          <p className="mt-1 text-xs text-slate-500">/{plan.durationDays} days</p>
        </div>
        {plan.highlight ? (
          <span className="rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-semibold text-[#2563EB]">
            Recommended
          </span>
        ) : null}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 text-sm text-slate-600">
        <p>Jobs Limit: <span className="font-semibold text-slate-800">{plan.jobsLimit}</span></p>
        <p>Apps Limit: <span className="font-semibold text-slate-800">{plan.appsLimit}</span></p>
        <p>Validity: <span className="font-semibold text-slate-800">{plan.durationDays} days</span></p>
        <p>Active Companies: <span className="font-semibold text-slate-800">{plan.activeCompanies || 0}</span></p>
      </div>

      <p className="mt-3 text-xs text-slate-500">{plan.description || "Flexible subscription plan for company hiring needs."}</p>

      <div className="mt-4 flex items-center gap-2">
        <button
          type="button"
          onClick={() => onEdit(plan)}
          className="inline-flex items-center gap-1 rounded-lg border border-blue-200 px-3 py-2 text-xs font-semibold text-[#2563EB] hover:bg-blue-50"
        >
          <FiEdit2 /> Edit Plan
        </button>
        <button
          type="button"
          onClick={() => onToggle(plan)}
          className="rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50"
        >
          {plan.active ? "Disable Plan" : "Enable Plan"}
        </button>
        <button
          type="button"
          onClick={() => onDelete(plan)}
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-red-200 text-red-600 hover:bg-red-50"
          title="Delete Plan"
        >
          <FiTrash2 />
        </button>
      </div>
    </div>
  );
}

export default function PricingPlans() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [plans, setPlans] = useState([]);
  const [requests, setRequests] = useState([]);

  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");

  const [selectedIds, setSelectedIds] = useState([]);
  const [bulkAction, setBulkAction] = useState("approve");
  const [busyRequestId, setBusyRequestId] = useState("");

  const [planOpen, setPlanOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    name: "",
    price: 0,
    jobsLimit: 1,
    appsLimit: 100,
    durationDays: 30,
    description: "",
    active: true,
    highlight: false,
  });

  const loadPricingData = async () => {
    try {
      setLoading(true);
      setError("");
      const [pl, pr] = await Promise.all([adminListPlans(), adminListPlanRequests()]);
      const safeRequests = (Array.isArray(pr) ? pr : []).map((item) => ({
        ...item,
        status: String(item.status || "pending").toLowerCase(),
        amountValue: toNumberAmount(item.amount),
        paymentMethod: item.paymentMethod || "Manual",
        transactionId: item.utr || item.transactionId || "-",
        activationDate: item.activationDate || "",
        expiryDate: item.expiryDate || "",
      }));

      const approvedByPlan = safeRequests
        .filter((r) => String(r.status).toLowerCase() === "approved")
        .reduce((acc, r) => {
          const key = r.planName || "";
          acc[key] = (acc[key] || 0) + 1;
          return acc;
        }, {});

      setPlans(
        (Array.isArray(pl) ? pl : []).map((item) => ({
          ...item,
          activeCompanies: approvedByPlan[item.name] || 0,
          description: item.description || "Scalable hiring plan with admin controls.",
        })),
      );
      setRequests(safeRequests);
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || "Failed to load pricing data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPricingData();
  }, []);

  const requestRows = useMemo(() => {
    const search = q.trim().toLowerCase();

    return requests
      .filter((row) => {
        const matchSearch =
          !search ||
          `${row.companyName} ${row.planName} ${row.transactionId}`.toLowerCase().includes(search);
        const matchStatus = status === "all" || String(row.status).toLowerCase() === status;
        return matchSearch && matchStatus;
      })
      .sort((a, b) => {
        const sa = String(a.status).toLowerCase() === "pending" ? 0 : 1;
        const sb = String(b.status).toLowerCase() === "pending" ? 0 : 1;
        return sa - sb;
      });
  }, [requests, q, status]);

  const stats = useMemo(() => {
    const activePlans = plans.filter((p) => p.active).length;
    const pendingRequests = requests.filter((r) => String(r.status).toLowerCase() === "pending").length;
    const monthlyRevenue = requests.filter((r) => String(r.status).toLowerCase() === "approved")
      .reduce((sum, r) => sum + Number(r.amountValue || 0), 0);
    const subscribedCompanies = new Set(
      requests.filter((r) => String(r.status).toLowerCase() === "approved").map((r) => r.companyId || r.companyName),
    ).size;

    return {
      activePlans,
      pendingRequests,
      monthlyRevenue,
      subscribedCompanies,
    };
  }, [plans, requests]);

  const analytics = useMemo(() => {
    const planDistributionMap = {};
    requests.filter((r) => String(r.status).toLowerCase() === "approved")
      .forEach((r) => {
        const key = r.planName || "Unknown";
        planDistributionMap[key] = (planDistributionMap[key] || 0) + 1;
      });

    const planDistribution = Object.entries(planDistributionMap).map(([name, value]) => ({
      name,
      value,
    }));

    const monthlyMap = {};
    requests.filter((r) => String(r.status).toLowerCase() === "approved")
      .forEach((r) => {
        const d = new Date(r.createdAt || Date.now());
        const month = d.toLocaleString("en-US", { month: "short" });
        monthlyMap[month] = (monthlyMap[month] || 0) + Number(r.amountValue || 0);
      });
    const monthOrder = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];
    const revenueTrend = monthOrder.map((month) => ({
      month,
      value: Number(monthlyMap[month] || 0),
    }));

    const popularity = plans.map((p) => ({
      name: p.name,
      count: requests.filter((r) => r.planName === p.name && String(r.status).toLowerCase() === "approved").length,
    }));

    const mostPopular = popularity.reduce(
      (best, current) => (current.count > best.count ? current : best),
      { name: "-", count: 0 },
    );

    return { planDistribution, revenueTrend, popularity, mostPopular };
  }, [requests, plans]);

  const revenueInsight = useMemo(() => {
    const monthly = stats.monthlyRevenue;
    const annualProjection = monthly * 12;
    const growth = monthly ? 18 : 0;
    return { monthly, annualProjection, growth };
  }, [stats.monthlyRevenue]);

  const openCreate = () => {
    setEditing(null);
    setForm({
      name: "",
      price: 0,
      jobsLimit: 1,
      appsLimit: 100,
      durationDays: 30,
      description: "",
      active: true,
      highlight: false,
    });
    setPlanOpen(true);
  };

  const openEdit = (plan) => {
    setEditing(plan);
    setForm({
      name: plan.name || "",
      price: plan.price || 0,
      jobsLimit: plan.jobsLimit || 1,
      appsLimit: plan.appsLimit || 100,
      durationDays: plan.durationDays || 30,
      description: plan.description || "",
      active: !!plan.active,
      highlight: !!plan.highlight,
    });
    setPlanOpen(true);
  };

  const onSavePlan = async () => {
    try {
      setError("");
      const payload = {
        ...(editing || {}),
        ...form,
        id: editing?.id || editing?._id,
        jobsLimit: Number(form.jobsLimit || 1),
        appsLimit: Number(form.appsLimit || 100),
      };

      const res = await adminSavePlan(payload);
      const next = res?.plan || payload;

      setPlans((prev) => {
        const nextId = next.id || next._id;
        const exists = prev.some((x) => (x.id || x._id) === nextId);
        if (exists) return prev.map((x) => ((x.id || x._id) === nextId ? { ...x, ...next, id: nextId } : x));
        return [{ ...next, id: nextId, activeCompanies: 0 }, ...prev];
      });

      setPlanOpen(false);
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || "Failed to save plan.");
    }
  };

  const onTogglePlan = async (plan) => {
    try {
      setError("");
      const planId = plan.id || plan._id;
      const res = await adminSavePlan({ ...plan, id: planId, active: !plan.active });
      const next = res?.plan || { ...plan, active: !plan.active };
      setPlans((prev) => prev.map((x) => ((x.id || x._id) === planId ? { ...x, ...next } : x)));
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || "Failed to update plan.");
    }
  };

  const onDeletePlan = async (plan) => {
    const ok = await showSweetConfirm({
      title: "Delete Plan?",
      text: `Delete "${plan.name}" plan?`,
      confirmButtonText: "Delete",
      tone: "warning",
    });
    if (!ok) return;
    try {
      setError("");
      const planId = plan.id || plan._id;
      await adminDeletePlan(planId);
      setPlans((prev) => prev.filter((x) => (x.id || x._id) !== planId));
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || "Failed to delete plan.");
    }
  };

  const applyDecision = async (row, nextStatus, options = {}) => {
    if (!isReviewableRequest(row)) return false;

    if (!options.skipConfirm) {
      const isApprove = nextStatus === "approved";
      const ok = await showSweetConfirm({
        title: isApprove ? "Approve Plan Request?" : "Reject Plan Request?",
        text: `${isApprove ? "Approve" : "Reject"} ${row.companyName} for the ${row.planName} plan?`,
        confirmButtonText: isApprove ? "Approve" : "Reject",
        tone: isApprove ? "info" : "warning",
      });
      if (!ok) return false;
    }

    try {
      setError("");
      setBusyRequestId(row.id);
      const res = await adminUpdatePlanRequest(row.id, nextStatus);
      if (res?.request) {
        setRequests((prev) =>
          prev.map((x) =>
            x.id === row.id
              ? {
                  ...x,
                  ...res.request,
                  status: String(res.request.status || "").toLowerCase(),
                  amountValue: toNumberAmount(res.request.amount),
                }
              : x,
          ),
        );
        return true;
      }
      setRequests((prev) =>
        prev.map((x) =>
          x.id === row.id
            ? { ...x, status: nextStatus }
            : x,
        ),
      );
      return true;
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || "Failed to update request.");
      return false;
    } finally {
      setBusyRequestId("");
    }
  };

  const executePlanAction = async (row, action) => {
    const prompt = actionPrompt(action, row);
    const ok = await showSweetConfirm(prompt);
    if (!ok) return false;

    try {
      setError("");
      setBusyRequestId(row.id);
      await adminRunPlanRequestAction(row.id, {
        action,
        source: row.source,
      });
      setSelectedIds((prev) => prev.filter((id) => id !== row.id));
      await loadPricingData();
      return true;
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || "Failed to update plan record.");
      return false;
    } finally {
      setBusyRequestId("");
    }
  };

  const onToggleSelect = (id, checked) => {
    setSelectedIds((prev) => (checked ? [...new Set([...prev, id])] : prev.filter((x) => x !== id)));
  };

  const onToggleSelectAll = (checked) => {
    if (checked) {
      setSelectedIds(requestRows.map((x) => x.id));
      return;
    }
    setSelectedIds([]);
  };

  const onApplyBulk = async () => {
    if (!selectedIds.length) return;

    if (bulkAction === "export") {
      const rows = requests.filter((x) => selectedIds.includes(x.id));
      const headers = [
        "Company",
        "Plan",
        "Amount",
        "Payment Method",
        "Transaction ID",
        "Request Date",
        "Status",
      ];
      const lines = rows.map((x) => [
        x.companyName,
        x.planName,
        x.amount,
        x.paymentMethod,
        x.transactionId,
        x.createdAt,
        statusLabel(x.status),
      ]);
      const csv = [headers, ...lines]
        .map((row) => row.map((v) => `"${String(v ?? "").replaceAll('"', '""')}"`).join(","))
        .join("\n");

      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "pricing_selected_requests.csv";
      a.click();
      URL.revokeObjectURL(url);
      return;
    }

    const next = bulkAction === "approve" ? "approved" : "rejected";
    const eligibleRows = selectedIds
      .map((id) => requests.find((r) => r.id === id))
      .filter(Boolean)
      .filter(isReviewableRequest);

    if (!eligibleRows.length) {
      setError("Only pending manual plan requests can be approved or rejected from this table.");
      return;
    }

    const ok = await showSweetConfirm({
      title: next === "approved" ? "Approve Selected Requests?" : "Reject Selected Requests?",
      text: `${next === "approved" ? "Approve" : "Reject"} ${eligibleRows.length} selected pending request${eligibleRows.length > 1 ? "s" : ""}?`,
      confirmButtonText: next === "approved" ? "Approve Selected" : "Reject Selected",
      tone: next === "approved" ? "info" : "warning",
    });
    if (!ok) return;

    for (const row of eligibleRows) {
      // Process sequentially so the row-level busy state stays accurate.
      await applyDecision(row, next, { skipConfirm: true });
    }
    setSelectedIds([]);
  };

  const allSelected = requestRows.length > 0 && requestRows.every((x) => selectedIds.includes(x.id));

  return (
    <div className="space-y-6">
      <section>
        <h1 className="text-2xl font-bold text-[#0F172A] sm:text-3xl">Pricing Plans Management</h1>
        <p className="mt-1 text-sm text-slate-500">Manage subscription plans and monitor company billing</p>
        <p className="mt-2 text-xs font-medium text-slate-400">Dashboard &gt; Pricing Plans</p>
      </section>

      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {error}
        </div>
      ) : null}

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Total Active Plans" value={stats.activePlans} trend="+1 this quarter" icon={<FiFileText />} />
        <StatCard title="Pending Plan Requests" value={stats.pendingRequests} trend="Needs review" icon={<FiActivity />} />
        <StatCard title="Monthly Revenue" value={formatMoney(stats.monthlyRevenue)} trend="+18% vs last month" icon={<FiDollarSign />} />
        <StatCard title="Total Subscribed Companies" value={stats.subscribedCompanies} trend="+9 this month" icon={<FiUsers />} />
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-lg font-semibold text-[#0F172A]">Available Pricing Plans</h2>
            <p className="text-sm text-slate-500">Configure and control active subscription plans.</p>
          </div>
          <button type="button" onClick={openCreate} className="inline-flex items-center gap-2 rounded-xl bg-[#2563EB] px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">
            <FiPlus /> Add New Plan
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {plans.map((plan) => (
            <PlanCard key={plan.id} plan={plan} onEdit={openEdit} onToggle={onTogglePlan} onDelete={onDeletePlan} />
          ))}
          {!plans.length && !loading ? (
            <div className="col-span-full rounded-xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">
              No plans available. Create your first plan.
            </div>
          ) : null}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-4 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <h2 className="text-lg font-semibold text-[#0F172A]">Company Plan Requests</h2>
          <div className="flex w-full flex-col gap-3 sm:flex-row xl:w-auto">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="h-10 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-blue-300"
              placeholder="Search company, plan, transaction..."
            />
            <select value={status} onChange={(e) => setStatus(e.target.value)} className="h-10 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-blue-300">
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="created">Payment Pending</option>
              <option value="failed">Payment Failed</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>

        {selectedIds.length > 0 ? (
          <div className="mb-3 rounded-xl border border-blue-200 bg-blue-50 px-3 py-2">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-semibold text-[#2563EB]">{selectedIds.length} selected</p>
              <select value={bulkAction} onChange={(e) => setBulkAction(e.target.value)} className="h-9 rounded-lg border border-blue-200 bg-white px-2 text-sm">
                <option value="approve">Approve Selected</option>
                <option value="reject">Reject Selected</option>
                <option value="export">Export Selected</option>
              </select>
              <button type="button" onClick={onApplyBulk} className="h-9 rounded-lg bg-[#2563EB] px-3 text-sm font-semibold text-white hover:bg-blue-700">
                Apply
              </button>
            </div>
          </div>
        ) : null}

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={(e) => onToggleSelectAll(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-[#2563EB] focus:ring-[#2563EB]"
                  />
                </th>
                <th className="px-4 py-3">Company Name</th>
                <th className="px-4 py-3">Selected Plan</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Payment Method</th>
                <th className="px-4 py-3">Transaction ID</th>
                <th className="px-4 py-3">Request Date</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Activation / Expiry</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {requestRows.map((row) => {
                const isBusy = busyRequestId === row.id;
                const canApprove = canApproveRow(row);
                const canActivate = canActivateRow(row);
                const canDeactivate = canDeactivateRow(row);
                const canReject = canRejectRow(row);
                const canDelete = canDeleteRow(row);
                return (
                  <tr key={row.id} className="border-t border-slate-100 transition hover:bg-blue-50/40">
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(row.id)}
                        onChange={(e) => onToggleSelect(row.id, e.target.checked)}
                        className="h-4 w-4 rounded border-slate-300 text-[#2563EB] focus:ring-[#2563EB]"
                      />
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-800">{row.companyName}</td>
                    <td className="px-4 py-3 text-slate-700">{row.planName}</td>
                    <td className="px-4 py-3 text-slate-700">
                      <p className="font-semibold text-slate-800">{row.amount}</p>
                      {row.billing ? <p className="mt-1 text-xs text-slate-500">GST: {formatMoney(row.billing.gst)} | Total: {formatMoney(row.billing.total)}</p> : null}
                    </td>
                    <td className="px-4 py-3 text-slate-700">{row.paymentMethod}</td>
                    <td className="px-4 py-3 text-slate-700">{row.transactionId}</td>
                    <td className="px-4 py-3 text-slate-600">{row.createdAt}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold capitalize ${statusClass(row.status)}`}>
                        {statusLabel(row.status)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600">
                      {row.status === "approved" ? (
                        <div title="Automatically generated after approval" className="space-y-1">
                          <p>Start: {row.activationDate || "-"}</p>
                          <p>End: {row.expiryDate || "-"}</p>
                        </div>
                      ) : (
                        <span>-</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {canApprove || canActivate || canDeactivate || canReject || canDelete ? (
                        <div className="flex flex-wrap justify-end gap-2">
                          {canApprove ? (
                            <button
                              type="button"
                              onClick={() => executePlanAction(row, "approve")}
                              disabled={isBusy}
                              className="rounded-lg bg-[#2563EB] px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              {isBusy ? "Updating..." : "Approve"}
                            </button>
                          ) : null}
                          {canActivate ? (
                            <button
                              type="button"
                              onClick={() => executePlanAction(row, "active")}
                              disabled={isBusy}
                              className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              Active
                            </button>
                          ) : null}
                          {canDeactivate ? (
                            <button
                              type="button"
                              onClick={() => executePlanAction(row, "inactive")}
                              disabled={isBusy}
                              className="rounded-lg border border-amber-200 px-3 py-1.5 text-xs font-semibold text-amber-700 hover:bg-amber-50 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              In-Active
                            </button>
                          ) : null}
                          {canReject ? (
                            <button
                              type="button"
                              onClick={() => executePlanAction(row, "reject")}
                              disabled={isBusy}
                              className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              Reject
                            </button>
                          ) : null}
                          {canDelete ? (
                            <button
                              type="button"
                              onClick={() => executePlanAction(row, "delete")}
                              disabled={isBusy}
                              className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              Delete
                            </button>
                          ) : null}
                        </div>
                      ) : (
                        <p className="text-right text-xs font-medium text-slate-400">
                          -
                        </p>
                      )}
                    </td>
                  </tr>
                );
              })}
              {!requestRows.length && !loading ? (
                <tr className="border-t border-slate-100">
                  <td colSpan={10} className="px-4 py-12 text-center text-sm text-slate-500">No plan requests found.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <h3 className="text-sm font-semibold text-[#0F172A]">Plan Distribution</h3>
          <SafeChartContainer className="mt-3 h-64">
            {({ width, height }) => (
              <PieChart width={width} height={height}>
                <Pie data={analytics.planDistribution} dataKey="value" innerRadius={45} outerRadius={80}>
                  {analytics.planDistribution.map((item, idx) => (
                    <Cell key={item.name} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            )}
          </SafeChartContainer>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <h3 className="text-sm font-semibold text-[#0F172A]">Revenue Trend</h3>
          <SafeChartContainer className="mt-3 h-64">
            {({ width, height }) => (
              <LineChart width={width} height={height} data={analytics.revenueTrend}>
                <CartesianGrid stroke="#E2E8F0" strokeDasharray="3 3" />
                <XAxis dataKey="month" tick={{ fill: "#64748B", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#64748B", fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip />
                <Line type="monotone" dataKey="value" stroke="#2563EB" strokeWidth={3} dot={{ r: 4, fill: "#2563EB" }} />
              </LineChart>
            )}
          </SafeChartContainer>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <h3 className="text-sm font-semibold text-[#0F172A]">Most Popular Plan</h3>
          <p className="mt-2 text-sm text-slate-500">Top conversion among approved subscriptions.</p>
          <p className="mt-4 text-2xl font-bold text-[#0F172A]">{analytics.mostPopular.name}</p>
          <p className="text-sm text-[#F97316]">{analytics.mostPopular.count} active subscriptions</p>

          <SafeChartContainer className="mt-4 h-36">
            {({ width, height }) => (
              <BarChart width={width} height={height} data={analytics.popularity}>
                <CartesianGrid stroke="#E2E8F0" strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fill: "#64748B", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#64748B", fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip />
                <Bar dataKey="count" fill="#F97316" radius={[6, 6, 0, 0]} />
              </BarChart>
            )}
          </SafeChartContainer>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <h3 className="text-sm font-semibold text-[#0F172A]">Revenue Insights</h3>
        <div className="mt-3 grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
            <p className="text-xs font-semibold uppercase text-slate-500">Monthly Revenue</p>
            <p className="mt-2 text-2xl font-bold text-[#0F172A]">{formatMoney(revenueInsight.monthly)}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
            <p className="text-xs font-semibold uppercase text-slate-500">Annual Projection</p>
            <p className="mt-2 text-2xl font-bold text-[#0F172A]">{formatMoney(revenueInsight.annualProjection)}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
            <p className="text-xs font-semibold uppercase text-slate-500">Revenue Growth</p>
            <p className="mt-2 inline-flex items-center gap-2 text-2xl font-bold text-[#F97316]"><FiBarChart2 /> +{revenueInsight.growth}%</p>
          </div>
        </div>
      </section>

      <Modal
        open={planOpen}
        onClose={() => setPlanOpen(false)}
        title={editing ? "Edit Plan" : "Add New Plan"}
        widthClass="max-w-3xl"
        footer={
          <>
            <button type="button" onClick={() => setPlanOpen(false)} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50">
              Cancel
            </button>
            <button type="button" onClick={onSavePlan} className="rounded-lg bg-[#2563EB] px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">
              Save Plan
            </button>
          </>
        }
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <InputField label="Plan Name">
            <input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} className="h-10 w-full rounded-lg border border-slate-200 px-3 outline-none focus:border-blue-300" />
          </InputField>

          <InputField label="Price (Rs)">
            <input type="number" value={form.price} onChange={(e) => setForm((p) => ({ ...p, price: Number(e.target.value || 0) }))} className="h-10 w-full rounded-lg border border-slate-200 px-3 outline-none focus:border-blue-300" />
          </InputField>

          <InputField label="Jobs Limit">
            <input type="number" min="1" value={form.jobsLimit} onChange={(e) => setForm((p) => ({ ...p, jobsLimit: Number(e.target.value || 1) }))} className="h-10 w-full rounded-lg border border-slate-200 px-3 outline-none focus:border-blue-300" />
          </InputField>

          <InputField label="Applications Limit">
            <input type="number" min="1" value={form.appsLimit} onChange={(e) => setForm((p) => ({ ...p, appsLimit: Number(e.target.value || 100) }))} className="h-10 w-full rounded-lg border border-slate-200 px-3 outline-none focus:border-blue-300" />
          </InputField>

          <InputField label="Validity Duration (Days)">
            <input type="number" value={form.durationDays} onChange={(e) => setForm((p) => ({ ...p, durationDays: Number(e.target.value || 30) }))} className="h-10 w-full rounded-lg border border-slate-200 px-3 outline-none focus:border-blue-300" />
          </InputField>

          <InputField label="Recommended Plan">
            <select value={form.highlight ? "yes" : "no"} onChange={(e) => setForm((p) => ({ ...p, highlight: e.target.value === "yes" }))} className="h-10 w-full rounded-lg border border-slate-200 px-3 outline-none focus:border-blue-300">
              <option value="no">No</option>
              <option value="yes">Yes</option>
            </select>
          </InputField>

          <div className="md:col-span-2">
            <InputField label="Description">
              <textarea value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} rows={3} className="w-full rounded-lg border border-slate-200 px-3 py-2 outline-none focus:border-blue-300" />
            </InputField>
          </div>

          <InputField label="Enable / Disable">
            <select value={form.active ? "enabled" : "disabled"} onChange={(e) => setForm((p) => ({ ...p, active: e.target.value === "enabled" }))} className="h-10 w-full rounded-lg border border-slate-200 px-3 outline-none focus:border-blue-300">
              <option value="enabled">Enabled</option>
              <option value="disabled">Disabled</option>
            </select>
          </InputField>
        </div>
      </Modal>
    </div>
  );
}


