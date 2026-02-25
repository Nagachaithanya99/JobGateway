import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  FiArrowLeft,
  FiBarChart2,
  FiBriefcase,
  FiCheckCircle,
  FiEye,
  FiFileText,
  FiGlobe,
  FiMail,
  FiMapPin,
  FiPhone,
  FiTrash2,
  FiUser,
  FiXCircle,
} from "react-icons/fi";
import {
  Line,
  LineChart,
  Pie,
  PieChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  CartesianGrid,
  XAxis,
  YAxis,
  Legend,
} from "recharts";
import { adminGetCompanyDetails, adminToggleCompanyStatus } from "../../services/adminService";

function badgeClass(type, value) {
  const v = String(value || "").toLowerCase();

  if (type === "account") {
    if (v === "active") return "bg-green-50 text-green-700 border-green-200";
    return "bg-red-50 text-red-700 border-red-200";
  }

  if (type === "planStatus") {
    if (v === "active") return "bg-blue-50 text-blue-700 border-blue-200";
    if (v === "expired") return "bg-orange-50 text-orange-700 border-orange-200";
    return "bg-amber-50 text-amber-700 border-amber-200";
  }

  if (type === "job") {
    if (v === "active") return "bg-green-50 text-green-700 border-green-200";
    if (v === "disabled") return "bg-red-50 text-red-700 border-red-200";
    return "bg-slate-50 text-slate-700 border-slate-200";
  }

  if (type === "application") {
    if (v === "shortlisted") return "bg-green-50 text-green-700 border-green-200";
    if (v === "hold") return "bg-amber-50 text-amber-700 border-amber-200";
    if (v === "rejected") return "bg-red-50 text-red-700 border-red-200";
    return "bg-blue-50 text-blue-700 border-blue-200";
  }

  return "bg-slate-50 text-slate-700 border-slate-200";
}

function Badge({ type, value }) {
  return (
    <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold capitalize ${badgeClass(type, value)}`}>
      {String(value || "-")}
    </span>
  );
}

function StatCard({ label, value, trend, icon }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-1 hover:shadow-md">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
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

function UsageBar({ label, used = 0, limit = 0, color = "blue" }) {
  const safeLimit = Number(limit) || 0;
  const safeUsed = Number(used) || 0;
  const pct = safeLimit > 0 ? Math.min(100, Math.round((safeUsed / safeLimit) * 100)) : 0;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs font-medium text-slate-600">
        <span>{label}</span>
        <span>{safeUsed}/{safeLimit}</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
        <div
          className={`h-full rounded-full transition-all ${color === "orange" ? "bg-[#F97316]" : "bg-[#2563EB]"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function avatarFor(company) {
  if (company?.logoUrl) return company.logoUrl;
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(company?.name || "Company")}&background=DBEAFE&color=2563EB&bold=true`;
}

export default function CompanyDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [company, setCompany] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      const result = await adminGetCompanyDetails(id);
      if (!active) return;

      const c = result?.company || result || null;
      const j = Array.isArray(result?.jobs) ? result.jobs : Array.isArray(c?.jobs) ? c.jobs : [];
      const a = Array.isArray(result?.applicants) ? result.applicants : Array.isArray(c?.applicants) ? c.applicants : [];

      setCompany(c);
      setJobs(j);
      setApplications(a);
      setLoading(false);
    }

    load();
    return () => {
      active = false;
    };
  }, [id]);

  const activeJobs = useMemo(
    () => jobs.filter((job) => String(job.status || "").toLowerCase() === "active").length,
    [jobs],
  );

  const shortlisted = useMemo(
    () => applications.filter((app) => String(app.status || "").toLowerCase() === "shortlisted").length,
    [applications],
  );

  const lineData = useMemo(() => {
    const base = applications.length || 8;
    return ["Week 1", "Week 2", "Week 3", "Week 4", "Week 5"].map((label, i) => ({
      label,
      applications: Math.max(2, Math.round(base * (0.6 + i * 0.18))),
    }));
  }, [applications.length]);

  const shortlistingRate = useMemo(() => {
    const short = shortlisted;
    const rest = Math.max(applications.length - short, 0);
    return [
      { name: "Shortlisted", value: short || 1 },
      { name: "Others", value: rest || 1 },
    ];
  }, [applications.length, shortlisted]);

  const topJob = useMemo(() => {
    if (!jobs.length) return "No job data";
    const sorted = [...jobs].sort((a, b) => Number(b.applications || 0) - Number(a.applications || 0));
    return sorted[0]?.title || "No job data";
  }, [jobs]);

  const isActive = String(company?.status || "").toLowerCase() === "active";
  const nearingJobsLimit = (company?.plan?.jobsLimit || 0) > 0 && (company?.plan?.jobsUsed || 0) / company?.plan?.jobsLimit >= 0.8;
  const nearingAppsLimit = (company?.plan?.appsLimit || 0) > 0 && (company?.plan?.appsUsed || 0) / company?.plan?.appsLimit >= 0.8;

  const handleToggleStatus = async () => {
    if (!company) return;
    const nextStatus = isActive ? "suspended" : "active";
    await adminToggleCompanyStatus(company.id, nextStatus);
    setCompany((prev) => ({ ...prev, status: nextStatus }));
  };

  return (
    <div className="space-y-6">
      <section className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <nav className="text-sm text-slate-500">
            <Link className="hover:text-[#2563EB]" to="/admin">Dashboard</Link>
            <span className="px-2">&gt;</span>
            <Link className="hover:text-[#2563EB]" to="/admin/companies">Companies</Link>
            <span className="px-2">&gt;</span>
            <span className="font-medium text-slate-700">{company?.name || "Company"}</span>
          </nav>
          <button
            type="button"
            onClick={() => navigate("/admin/companies")}
            className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-[#2563EB] hover:underline"
          >
            <FiArrowLeft /> Back to Companies
          </button>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        {loading ? (
          <div className="h-24 animate-pulse rounded-xl bg-slate-100" />
        ) : (
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex items-start gap-4">
              <img src={avatarFor(company)} alt={company?.name} className="h-20 w-20 rounded-2xl border border-slate-200 object-cover" />
              <div>
                <h1 className="text-2xl font-bold text-[#0F172A]">{company?.name}</h1>
                <p className="mt-1 text-sm text-slate-600">{company?.category || "-"} • {company?.location || "-"}</p>
                <a href={company?.website || "#"} target="_blank" rel="noreferrer" className="mt-2 inline-flex text-sm font-medium text-[#2563EB] hover:underline">
                  {company?.website || "Website"}
                </a>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <div className="flex flex-wrap gap-2">
                <Badge type="account" value={company?.status || "active"} />
                <Badge type="planStatus" value={company?.plan?.status || "pending"} />
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handleToggleStatus}
                  className={`rounded-xl border px-3 py-2 text-sm font-semibold transition ${
                    isActive
                      ? "border-red-200 text-red-600 hover:bg-red-50"
                      : "border-green-200 bg-green-600 text-white hover:bg-green-700"
                  }`}
                >
                  {isActive ? "Suspend Company" : "Activate Company"}
                </button>
                <button type="button" className="rounded-xl border border-red-200 px-3 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50">
                  Delete Company
                </button>
              </div>
            </div>
          </div>
        )}
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Jobs Posted" value={jobs.length} trend="+8% this month" icon={<FiBriefcase />} />
        <StatCard label="Active Jobs" value={activeJobs} trend="+3 this week" icon={<FiCheckCircle />} />
        <StatCard label="Total Applications" value={applications.length} trend="+14% this month" icon={<FiFileText />} />
        <StatCard label="Shortlisted Candidates" value={shortlisted} trend="+6 this week" icon={<FiUser />} />
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="xl:col-span-2 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-[#0F172A]">Subscription Plan Details</h2>
            <Badge type="planStatus" value={company?.plan?.status || "pending"} />
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3 text-sm md:grid-cols-4">
            <p><span className="text-slate-500">Plan Name:</span> <span className="font-semibold text-[#2563EB]">{company?.plan?.name || "-"}</span></p>
            <p><span className="text-slate-500">Plan Price:</span> <span className="font-semibold">{company?.plan?.amount || "$299/mo"}</span></p>
            <p><span className="text-slate-500">Start Date:</span> <span className="font-semibold">{company?.plan?.start || "-"}</span></p>
            <p><span className="text-slate-500">End Date:</span> <span className="font-semibold">{company?.plan?.end || "-"}</span></p>
            <p><span className="text-slate-500">Jobs Limit:</span> <span className="font-semibold">{company?.plan?.jobsLimit || 0}</span></p>
            <p><span className="text-slate-500">Jobs Used:</span> <span className="font-semibold">{company?.plan?.jobsUsed || 0}</span></p>
            <p><span className="text-slate-500">Applications Limit:</span> <span className="font-semibold">{company?.plan?.appsLimit || 0}</span></p>
            <p><span className="text-slate-500">Applications Used:</span> <span className="font-semibold">{company?.plan?.appsUsed || 0}</span></p>
          </div>

          <div className="mt-5 space-y-4">
            <UsageBar label="Jobs Usage" used={company?.plan?.jobsUsed} limit={company?.plan?.jobsLimit} color="blue" />
            <UsageBar label="Applications Usage" used={company?.plan?.appsUsed} limit={company?.plan?.appsLimit} color="orange" />
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            {nearingJobsLimit ? <Badge type="planStatus" value="pending" /> : null}
            {nearingAppsLimit ? <Badge type="planStatus" value="pending" /> : null}
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <button className="rounded-xl bg-[#2563EB] px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700">Upgrade Plan</button>
            <button className="rounded-xl border border-orange-200 px-4 py-2 text-sm font-semibold text-[#F97316] transition hover:bg-orange-50">Reset Usage</button>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-base font-semibold text-[#0F172A]">Company Contact</h2>
          <div className="mt-4 grid grid-cols-1 gap-3 text-sm text-slate-700">
            <p className="flex items-center gap-2"><FiMail className="text-slate-400" /> {company?.email || "-"}</p>
            <p className="flex items-center gap-2"><FiPhone className="text-slate-400" /> {company?.phone || "-"}</p>
            <p className="flex items-center gap-2"><FiUser className="text-slate-400" /> {company?.hrName || "-"}</p>
            <p className="flex items-center gap-2"><FiPhone className="text-slate-400" /> {company?.hrPhone || "-"}</p>
            <p className="flex items-center gap-2"><FiMapPin className="text-slate-400" /> {company?.address || "-"}</p>
            <p className="flex items-center gap-2"><FiGlobe className="text-slate-400" /> {company?.website || "-"}</p>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-5 py-4">
          <h2 className="text-base font-semibold text-[#0F172A]">Jobs Posted</h2>
        </div>

        <div className="hidden overflow-x-auto md:block">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Job Title</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Location</th>
                <th className="px-4 py-3">Salary</th>
                <th className="px-4 py-3">Experience</th>
                <th className="px-4 py-3">Applications</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Created Date</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {jobs.map((job) => (
                <tr key={job.id} className="border-t border-slate-100 transition hover:bg-blue-50/50">
                  <td className="px-4 py-3 font-medium text-slate-800">{job.title}</td>
                  <td className="px-4 py-3 text-slate-600">{job.category || job.stream || "-"}</td>
                  <td className="px-4 py-3 text-slate-600">{job.location || "-"}</td>
                  <td className="px-4 py-3 text-slate-600">{job.salary || "-"}</td>
                  <td className="px-4 py-3 text-slate-600">{job.experience || "-"}</td>
                  <td className="px-4 py-3 text-slate-700">{job.applications || 0}</td>
                  <td className="px-4 py-3"><Badge type="job" value={job.status || "closed"} /></td>
                  <td className="px-4 py-3 text-slate-600">{job.createdAt || "-"}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <button className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-blue-200 text-[#2563EB] hover:bg-blue-50"><FiEye /></button>
                      <button className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-orange-200 text-[#F97316] hover:bg-orange-50"><FiXCircle /></button>
                      <button className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-red-200 text-red-600 hover:bg-red-50"><FiTrash2 /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="space-y-3 p-4 md:hidden">
          {jobs.map((job) => (
            <div key={job.id} className="rounded-xl border border-slate-200 p-3">
              <p className="font-semibold text-slate-800">{job.title}</p>
              <p className="mt-1 text-xs text-slate-500">{job.category || job.stream} • {job.location}</p>
              <div className="mt-2 flex items-center justify-between">
                <Badge type="job" value={job.status || "closed"} />
                <span className="text-xs text-slate-600">Apps: {job.applications || 0}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-5 py-4">
          <h2 className="text-base font-semibold text-[#0F172A]">Recent Applications</h2>
        </div>

        <div className="hidden overflow-x-auto md:block">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Student Name</th>
                <th className="px-4 py-3">Applied Job</th>
                <th className="px-4 py-3">Experience</th>
                <th className="px-4 py-3">Education</th>
                <th className="px-4 py-3">Applied Date</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {applications.map((app) => (
                <tr key={app.id} className="border-t border-slate-100 transition hover:bg-blue-50/50">
                  <td className="px-4 py-3 font-medium text-slate-800">{app.name}</td>
                  <td className="px-4 py-3 text-slate-600">{app.role || app.jobTitle || "-"}</td>
                  <td className="px-4 py-3 text-slate-600">1-3 yrs</td>
                  <td className="px-4 py-3 text-slate-600">B.Tech</td>
                  <td className="px-4 py-3 text-slate-600">{app.appliedAt || "-"}</td>
                  <td className="px-4 py-3"><Badge type="application" value={app.status || "applied"} /></td>
                  <td className="px-4 py-3 text-right">
                    <button className="rounded-lg border border-blue-200 px-3 py-1.5 text-xs font-semibold text-[#2563EB] transition hover:bg-blue-50">
                      View Profile
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="space-y-3 p-4 md:hidden">
          {applications.map((app) => (
            <div key={app.id} className="rounded-xl border border-slate-200 p-3">
              <p className="font-semibold text-slate-800">{app.name}</p>
              <p className="mt-1 text-xs text-slate-500">{app.role || app.jobTitle || "-"}</p>
              <div className="mt-2 flex items-center justify-between">
                <Badge type="application" value={app.status || "applied"} />
                <button className="rounded-lg border border-blue-200 px-2 py-1 text-xs font-semibold text-[#2563EB]">View Profile</button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <FiBarChart2 className="text-[#7C3AED]" />
          <h2 className="text-base font-semibold text-[#0F172A]">Performance Insights</h2>
        </div>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
          <div className="xl:col-span-2 rounded-xl border border-slate-100 p-3">
            <p className="mb-2 text-sm font-semibold text-slate-700">Application Trend</p>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%" minWidth={320} minHeight={220}>
                <LineChart data={lineData}>
                  <CartesianGrid stroke="#E2E8F0" strokeDasharray="3 3" />
                  <XAxis dataKey="label" tick={{ fill: "#64748B", fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#64748B", fontSize: 12 }} axisLine={false} tickLine={false} />
                  <Tooltip />
                  <Line type="monotone" dataKey="applications" stroke="#2563EB" strokeWidth={3} dot={{ r: 4, fill: "#2563EB" }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-xl border border-slate-100 p-3">
            <p className="mb-2 text-sm font-semibold text-slate-700">Shortlisting Rate</p>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%" minWidth={320} minHeight={220}>
                <PieChart>
                  <Pie data={shortlistingRate} dataKey="value" cx="50%" cy="50%" outerRadius={78} innerRadius={48}>
                    <Cell fill="#F97316" />
                    <Cell fill="#2563EB" />
                  </Pie>
                  <Legend />
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <p className="mt-2 text-sm text-slate-600">Top Performing Job: <span className="font-semibold text-[#0F172A]">{topJob}</span></p>
          </div>
        </div>
      </section>
    </div>
  );
}

