// frontend/src/pages/admin/Dashboard.jsx
import { useEffect, useMemo, useState } from "react";
import {
  FiBriefcase,
  FiClock,
  FiDollarSign,
  FiFileText,
  FiTrendingUp,
  FiUser,
  FiUsers,
} from "react-icons/fi";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import {
  adminApprovePlanRequest,
  adminGetDashboard,
  adminRejectPlanRequest,
} from "../../services/adminService";

const monthLabels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];
const dayLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function formatTrend(trend) {
  if (!trend?.value) return "No trend data";
  return `${trend.value} ${trend.label || ""}`.trim();
}

function companyAvatar(row) {
  if (row?.logoUrl) return row.logoUrl;
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(
    row?.company || "Company"
  )}&background=DBEAFE&color=2563EB&bold=true`;
}

function StatCard({ title, value, trend, icon }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className="mt-3 text-3xl font-bold text-[#1F2937]">{value}</p>
          <p className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-[#F97316]">
            <FiTrendingUp className="text-xs" />
            {formatTrend(trend)}
          </p>
        </div>

        <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-xl text-[#2563EB]">
          {icon}
        </div>
      </div>
    </div>
  );
}

function ChartCard({ title, children }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="text-base font-semibold text-[#1F2937]">{title}</h3>
      <div className="mt-5 h-72">{children}</div>
    </div>
  );
}

function StatusBadge({ value }) {
  const v = String(value || "pending").toLowerCase();
  const cls =
    v === "approved"
      ? "bg-green-50 text-[#22C55E] border-green-200"
      : v === "rejected"
      ? "bg-red-50 text-[#EF4444] border-red-200"
      : "bg-amber-50 text-[#F59E0B] border-amber-200";

  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold capitalize ${cls}`}
    >
      {v}
    </span>
  );
}

function ActionButton({ variant = "approve", onClick, disabled, children }) {
  const cls =
    variant === "reject"
      ? "border border-red-200 bg-white text-red-600 hover:bg-red-50"
      : "border border-[#2563EB] bg-[#2563EB] text-white hover:bg-[#1D4ED8]";

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${cls} disabled:cursor-not-allowed disabled:opacity-50`}
    >
      {children}
    </button>
  );
}

function PlanTable({ rows, onApprove, onReject, busyId }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 px-5 py-4">
        <h3 className="text-base font-semibold text-[#1F2937]">
          Pending Plan Requests
        </h3>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-5 py-3">Company Name</th>
              <th className="px-5 py-3">Selected Plan</th>
              <th className="px-5 py-3">Amount</th>
              <th className="px-5 py-3">Request Date</th>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3 text-right">Actions</th>
            </tr>
          </thead>

          <tbody>
            {rows.length ? (
              rows.map((row) => {
                const isPending =
                  String(row.status || "pending").toLowerCase() === "pending";
                const isBusy = busyId === row.id;

                return (
                  <tr
                    key={row.id}
                    className="border-t border-slate-100 transition hover:bg-blue-50/40"
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={companyAvatar(row)}
                          alt={row.company}
                          className="h-9 w-9 rounded-full border border-slate-200 object-cover"
                        />
                        <span className="font-semibold text-[#1F2937]">
                          {row.company}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-slate-600">
                      {row.planLabel || row.plan || "Basic"}
                    </td>
                    <td className="px-5 py-4 font-medium text-slate-700">
                      {row.amount}
                    </td>
                    <td className="px-5 py-4 text-slate-600">
                      {row.date || row.requestedAt || "-"}
                    </td>
                    <td className="px-5 py-4">
                      <StatusBadge value={row.status} />
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-2">
                        <ActionButton
                          variant="approve"
                          onClick={() => onApprove(row.id)}
                          disabled={!isPending || isBusy}
                        >
                          {isBusy ? "..." : "Approve"}
                        </ActionButton>
                        <ActionButton
                          variant="reject"
                          onClick={() => onReject(row.id)}
                          disabled={!isPending || isBusy}
                        >
                          {isBusy ? "..." : "Reject"}
                        </ActionButton>
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td
                  colSpan={6}
                  className="px-5 py-8 text-center text-sm text-slate-500"
                >
                  No pending plan requests.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ActivityCard({ items }) {
  const iconMap = [<FiBriefcase />, <FiFileText />, <FiDollarSign />, <FiUsers />];

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="text-base font-semibold text-[#1F2937]">Recent Activity</h3>
      <div className="mt-4 space-y-3">
        {items.map((item, idx) => (
          <div
            key={item.id || `${item.title}-${idx}`}
            className="rounded-xl border border-slate-100 bg-slate-50/60 p-3"
          >
            <div className="flex items-start gap-3">
              <span className="mt-0.5 inline-flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-[#2563EB]">
                {iconMap[idx % iconMap.length]}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-[#1F2937]">
                  {item.title || item.desc}
                </p>
                <p className="mt-0.5 truncate text-xs text-slate-500">
                  {item.desc}
                </p>
                <p className="mt-1 text-xs font-medium text-slate-400">
                  {item.time || "Just now"}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function buildMonthlyJobs(points = []) {
  return monthLabels.map((month, index) => ({
    month,
    jobs:
      Number(points[index]) ||
      Number(points[index % points.length]) ||
      0,
  }));
}

function buildApplicationGrowth(points = []) {
  return dayLabels.map((day, index) => ({
    day,
    applications: Number(points[index]) || 0,
  }));
}

function buildCategoryDistribution(totalJobs) {
  const base = totalJobs || 300;
  return [
    { name: "IT", value: Math.round(base * 0.38) },
    { name: "Healthcare", value: Math.round(base * 0.24) },
    { name: "Engineering", value: Math.round(base * 0.21) },
    { name: "Design", value: Math.round(base * 0.17) },
  ];
}

const PIE_COLORS = ["#2563EB", "#0EA5E9", "#7C3AED", "#F97316"];

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    async function load() {
      setLoading(true);
      setError("");
      try {
        const response = await adminGetDashboard();
        if (!mounted) return;

        setData(response || null);
        setRows(Array.isArray(response?.planRequests) ? response.planRequests : []);
      } catch (err) {
        if (!mounted) return;
        setError(err?.response?.data?.message || err?.message || "Unable to load admin dashboard data.");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, []);

  const totals = data?.totals || {};
  const trends = data?.trends || {};

  const jobsByMonth = useMemo(
    () => buildMonthlyJobs(data?.charts?.jobs7d || [80, 120, 95, 150, 132, 170]),
    [data?.charts?.jobs7d]
  );

  const appGrowth = useMemo(
    () =>
      buildApplicationGrowth(
        data?.charts?.applications7d || [140, 160, 180, 200, 210, 230, 260]
      ),
    [data?.charts?.applications7d]
  );

  const categoryData = useMemo(
    () => buildCategoryDistribution(totals.jobs),
    [totals.jobs]
  );

  const activity = useMemo(() => {
    if (Array.isArray(data?.activity) && data.activity.length) return data.activity;

    return [
      { id: "ac1", title: "TechCorp posted a new job", desc: "Senior Frontend Engineer role is now live.", time: "2h ago" },
      { id: "ac2", title: "5 students applied for Nurse role", desc: "Applications increased in Healthcare stream.", time: "3h ago" },
      { id: "ac3", title: "Company ABC requested Premium Plan", desc: "Plan request waiting for admin approval.", time: "5h ago" },
    ];
  }, [data?.activity]);

  const onApprove = async (id) => {
    setError("");
    setBusyId(id);
    try {
      await adminApprovePlanRequest(id);
      setRows((prev) =>
        prev.map((row) => (row.id === id ? { ...row, status: "approved" } : row))
      );
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || "Approve failed");
    } finally {
      setBusyId("");
    }
  };

  const onReject = async (id) => {
    setError("");
    setBusyId(id);
    try {
      await adminRejectPlanRequest(id);
      setRows((prev) =>
        prev.map((row) => (row.id === id ? { ...row, status: "rejected" } : row))
      );
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || "Reject failed");
    } finally {
      setBusyId("");
    }
  };

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
        <h2 className="text-lg font-semibold text-[#0F172A]">Platform Overview</h2>
        <p className="mt-1 text-sm text-slate-500">
          Monitor companies, students, job activity, and subscription approvals in one control center.
        </p>
      </section>

      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {error}
        </div>
      ) : null}

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard
          title="Total Students"
          value={loading ? "..." : totals.students || 0}
          trend={trends.students}
          icon={<FiUser />}
        />
        <StatCard
          title="Total Companies"
          value={loading ? "..." : totals.companies || 0}
          trend={trends.companies}
          icon={<FiUsers />}
        />
        <StatCard
          title="Total Jobs"
          value={loading ? "..." : totals.jobs || 0}
          trend={trends.jobs}
          icon={<FiBriefcase />}
        />
        <StatCard
          title="Total Applications"
          value={loading ? "..." : totals.applications || 0}
          trend={trends.applications}
          icon={<FiFileText />}
        />
        <StatCard
          title="Pending Plan Requests"
          value={loading ? "..." : totals.pendingPlans || 0}
          trend={trends.pendingPlans || { value: "0", label: "today" }}
          icon={<FiClock />}
        />
      </section>

      <section className="space-y-4">
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          <ChartCard title="Jobs Posted Per Month">
            <ResponsiveContainer width="100%" height="100%" minWidth={320} minHeight={220}>
              <BarChart data={jobsByMonth}>
                <CartesianGrid stroke="#E5E7EB" strokeDasharray="3 3" />
                <XAxis
                  dataKey="month"
                  tick={{ fill: "#6B7280", fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: "#6B7280", fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip cursor={{ fill: "#EFF6FF" }} />
                <Bar dataKey="jobs" fill="#2563EB" radius={[6, 6, 0, 0]} barSize={28} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Application Growth">
            <ResponsiveContainer width="100%" height="100%" minWidth={320} minHeight={220}>
              <LineChart data={appGrowth}>
                <CartesianGrid stroke="#E5E7EB" strokeDasharray="3 3" />
                <XAxis
                  dataKey="day"
                  tick={{ fill: "#6B7280", fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: "#6B7280", fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="applications"
                  stroke="#2563EB"
                  strokeWidth={3}
                  dot={{ r: 4, fill: "#2563EB" }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        <ChartCard title="Job Category Distribution">
          <ResponsiveContainer width="100%" height="100%" minWidth={320} minHeight={220}>
            <PieChart>
              <Pie
                data={categoryData}
                cx="40%"
                cy="50%"
                innerRadius={70}
                outerRadius={110}
                paddingAngle={2}
                dataKey="value"
                label
              >
                {categoryData.map((entry, index) => (
                  <Cell key={entry.name} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Legend verticalAlign="middle" align="right" layout="vertical" />
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <PlanTable
            rows={rows}
            onApprove={onApprove}
            onReject={onReject}
            busyId={busyId}
          />
        </div>
        <div>
          <ActivityCard items={activity} />
        </div>
      </section>
    </div>
  );
}
