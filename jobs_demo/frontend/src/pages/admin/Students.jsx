import { useEffect, useMemo, useState } from "react";
import {
  FiCheckCircle,
  FiClock,
  FiDownload,
  FiMail,
  FiTrash2,
  FiUser,
  FiUserCheck,
  FiUserX,
  FiX,
} from "react-icons/fi";

import StudentsTable from "../../components/admin/students/StudentsTable";
import {
  adminDeleteStudent,
  adminGetStudent,
  adminListStudents,
  adminToggleStudentStatus,
} from "../../services/adminService";

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

function completionBucket(value) {
  const v = Number(value || 0);
  if (v < 50) return "0-50";
  if (v < 80) return "50-80";
  return "80-100";
}

function experienceLevel(value = "") {
  const v = String(value).toLowerCase();
  if (v.includes("fresher") || v.includes("0") || v.includes("1")) return "entry";
  if (v.includes("2") || v.includes("3")) return "mid";
  return "senior";
}

function dateRangeMatch(dateText, mode) {
  if (mode === "all") return true;
  const value = Date.parse(dateText || "");
  if (!Number.isFinite(value)) return false;
  const now = Date.now();
  const days = Math.floor((now - value) / (1000 * 60 * 60 * 24));
  if (mode === "last7") return days <= 7;
  if (mode === "last30") return days <= 30;
  if (mode === "last90") return days <= 90;
  return true;
}

function normalizeStudents(rows = []) {
  return rows.map((row) => ({
    ...row,
    registrationDate: row.registrationDate || row.createdAt || "",
    avatar: row.avatar || row.profilePhoto || "",
  }));
}

export default function Students() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [list, setList] = useState([]);

  const [filters, setFilters] = useState({
    q: "",
    status: "all",
    completion: "all",
    stream: "all",
    experience: "all",
    location: "all",
    registration: "all",
  });

  const [selectedIds, setSelectedIds] = useState([]);
  const [bulkAction, setBulkAction] = useState("suspend");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerLoading, setDrawerLoading] = useState(false);
  const [drawerTab, setDrawerTab] = useState("overview");
  const [selectedStudent, setSelectedStudent] = useState(null);

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        setLoading(true);
        setError("");
        const res = await adminListStudents({ limit: 100 });
        if (!mounted) return;
        setList(normalizeStudents(Array.isArray(res) ? res : []));
      } catch (e) {
        if (!mounted) return;
        setError(e?.response?.data?.message || e?.message || "Failed to load students.");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, []);

  const options = useMemo(() => {
    const streams = Array.from(new Set(list.map((x) => x.preferred?.stream).filter(Boolean))).sort();
    const locations = Array.from(new Set(list.map((x) => x.location).filter(Boolean))).sort();
    return { streams, locations };
  }, [list]);

  const filtered = useMemo(() => {
    const q = filters.q.trim().toLowerCase();

    return list.filter((row) => {
      const searchText = `${row.name || ""} ${row.email || ""} ${(row.skills || []).join(" ")}`.toLowerCase();
      const matchSearch = !q || searchText.includes(q);
      const matchStatus = filters.status === "all" || String(row.status).toLowerCase() === filters.status;
      const matchCompletion =
        filters.completion === "all" || completionBucket(row.completion) === filters.completion;
      const matchStream = filters.stream === "all" || row.preferred?.stream === filters.stream;
      const matchExperience =
        filters.experience === "all" || experienceLevel(row.experience) === filters.experience;
      const matchLocation = filters.location === "all" || row.location === filters.location;
      const matchRegistration = dateRangeMatch(row.registrationDate, filters.registration);

      return (
        matchSearch &&
        matchStatus &&
        matchCompletion &&
        matchStream &&
        matchExperience &&
        matchLocation &&
        matchRegistration
      );
    });
  }, [list, filters]);

  const stats = useMemo(() => {
    const total = list.length;
    const active = list.filter((x) => String(x.status).toLowerCase() === "active").length;
    const full = list.filter((x) => Number(x.completion) >= 100).length;
    const suspended = list.filter((x) => String(x.status).toLowerCase() === "suspended").length;
    return { total, active, full, suspended };
  }, [list]);

  const onFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const onReset = () => {
    setFilters({
      q: "",
      status: "all",
      completion: "all",
      stream: "all",
      experience: "all",
      location: "all",
      registration: "all",
    });
    setSelectedIds([]);
  };

  const onToggleSelect = (id, checked) => {
    setSelectedIds((prev) => (checked ? [...new Set([...prev, id])] : prev.filter((x) => x !== id)));
  };

  const onToggleSelectAll = (checked) => {
    if (checked) {
      setSelectedIds(filtered.map((x) => x.id));
      return;
    }
    setSelectedIds([]);
  };

  const onSuspend = async (row) => {
    try {
      setError("");
      await adminToggleStudentStatus(row.id, "suspended");
      setList((prev) => prev.map((x) => (x.id === row.id ? { ...x, status: "suspended" } : x)));
      setSelectedStudent((prev) => (prev?.id === row.id ? { ...prev, status: "suspended" } : prev));
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || "Failed to suspend student.");
    }
  };

  const onActivate = async (row) => {
    try {
      setError("");
      await adminToggleStudentStatus(row.id, "active");
      setList((prev) => prev.map((x) => (x.id === row.id ? { ...x, status: "active" } : x)));
      setSelectedStudent((prev) => (prev?.id === row.id ? { ...prev, status: "active" } : prev));
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || "Failed to activate student.");
    }
  };

  const onDelete = async (row) => {
    const ok = window.confirm(`Delete "${row.name || "student"}"?`);
    if (!ok) return;
    try {
      setError("");
      await adminDeleteStudent(row.id);
      setList((prev) => prev.filter((x) => x.id !== row.id));
      setSelectedIds((prev) => prev.filter((id) => id !== row.id));
      setSelectedStudent((prev) => (prev?.id === row.id ? null : prev));
      if (selectedStudent?.id === row.id) setDrawerOpen(false);
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || "Failed to delete student.");
    }
  };

  const onBulkApply = async () => {
    if (!selectedIds.length) return;

    try {
      setError("");
      if (bulkAction === "delete") {
        await Promise.all(selectedIds.map((id) => adminDeleteStudent(id)));
        setList((prev) => prev.filter((x) => !selectedIds.includes(x.id)));
        setSelectedIds([]);
        return;
      }

      if (bulkAction === "email") {
        const mails = list
          .filter((x) => selectedIds.includes(x.id))
          .map((x) => x.email)
          .filter(Boolean)
          .join(",");
        window.location.href = `mailto:${mails}`;
        return;
      }

      await Promise.all(selectedIds.map((id) => adminToggleStudentStatus(id, "suspended")));
      setList((prev) =>
        prev.map((x) => (selectedIds.includes(x.id) ? { ...x, status: "suspended" } : x)),
      );
      setSelectedIds([]);
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || "Bulk action failed.");
    }
  };

  const onExport = () => {
    const headers = [
      "Student Name",
      "Email",
      "Phone",
      "Main Stream",
      "Experience",
      "Profile Completion",
      "Applications",
      "Status",
      "Registration Date",
    ];

    const lines = filtered.map((x) => [
      x.name,
      x.email,
      x.phone,
      x.preferred?.stream,
      x.experience,
      x.completion,
      x.applicationsCount ?? x.applications?.length ?? 0,
      x.status,
      x.registrationDate,
    ]);

    const csv = [headers, ...lines]
      .map((row) => row.map((v) => `"${String(v ?? "").replaceAll('"', '""')}"`).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "jobgateway_students.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <section>
        <h1 className="text-2xl font-bold text-[#0F172A] sm:text-3xl">Students Management</h1>
        <p className="mt-1 text-sm text-slate-500">Monitor and manage all registered students</p>
        <p className="mt-2 text-xs font-medium text-slate-400">Dashboard &gt; Students</p>
      </section>

      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {error}
        </div>
      ) : null}

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="grid w-full grid-cols-1 gap-3 lg:grid-cols-3 xl:grid-cols-6">
            <input
              value={filters.q}
              onChange={(e) => onFilterChange("q", e.target.value)}
              placeholder="Search by student name, email, skill..."
              className="h-11 rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none transition focus:border-blue-300 focus:bg-white"
            />

            <select value={filters.status} onChange={(e) => onFilterChange("status", e.target.value)} className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-blue-300">
              <option value="all">Account Status: All</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
            </select>

            <select value={filters.completion} onChange={(e) => onFilterChange("completion", e.target.value)} className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-blue-300">
              <option value="all">Profile Completion: All</option>
              <option value="0-50">0-50%</option>
              <option value="50-80">50-80%</option>
              <option value="80-100">80-100%</option>
            </select>

            <select value={filters.stream} onChange={(e) => onFilterChange("stream", e.target.value)} className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-blue-300">
              <option value="all">Main Stream: All</option>
              {options.streams.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>

            <select value={filters.experience} onChange={(e) => onFilterChange("experience", e.target.value)} className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-blue-300">
              <option value="all">Experience Level</option>
              <option value="entry">Entry</option>
              <option value="mid">Mid</option>
              <option value="senior">Senior</option>
            </select>

            <div className="grid grid-cols-2 gap-3">
              <select value={filters.location} onChange={(e) => onFilterChange("location", e.target.value)} className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-blue-300">
                <option value="all">Location</option>
                {options.locations.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>

              <select value={filters.registration} onChange={(e) => onFilterChange("registration", e.target.value)} className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-blue-300">
                <option value="all">Registration Date</option>
                <option value="last7">Last 7 days</option>
                <option value="last30">Last 30 days</option>
                <option value="last90">Last 90 days</option>
              </select>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 xl:justify-end">
            <button type="button" onClick={onExport} className="h-11 rounded-xl border border-blue-200 bg-white px-3 text-sm font-semibold text-[#2563EB] hover:bg-blue-50">
              <span className="inline-flex items-center gap-2"><FiDownload /> Export CSV</span>
            </button>
            <button type="button" onClick={onBulkApply} className="h-11 rounded-xl border border-[#2563EB] bg-[#2563EB] px-3 text-sm font-semibold text-white hover:bg-blue-700">
              Bulk Actions
            </button>
            <button type="button" onClick={onReset} className="h-11 rounded-xl border border-slate-200 px-3 text-sm font-semibold text-slate-600 hover:bg-slate-50">
              Reset
            </button>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Total Students" value={stats.total} trend="+12% this month" icon={<FiUser />} />
        <StatCard title="Active Students" value={stats.active} trend="+8 this week" icon={<FiUserCheck />} />
        <StatCard title="Profile Completion 100%" value={stats.full} trend="+5 this week" icon={<FiCheckCircle />} />
        <StatCard title="Suspended Accounts" value={stats.suspended} trend="-2 this week" icon={<FiClock />} />
      </section>

      {selectedIds.length > 0 ? (
        <section className="sticky top-[86px] z-20 rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 shadow-sm">
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-sm font-semibold text-[#2563EB]">{selectedIds.length} selected</p>
            <select value={bulkAction} onChange={(e) => setBulkAction(e.target.value)} className="h-10 rounded-lg border border-blue-200 bg-white px-3 text-sm outline-none">
              <option value="suspend">Suspend Selected</option>
              <option value="delete">Delete Selected</option>
              <option value="email">Send Email</option>
            </select>
            <button type="button" onClick={onBulkApply} className="h-10 rounded-lg bg-[#2563EB] px-3 text-sm font-semibold text-white hover:bg-blue-700">
              Apply Bulk Action
            </button>
          </div>
        </section>
      ) : null}

      {loading ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="h-4 w-1/3 animate-pulse rounded bg-slate-100" />
          <div className="mt-3 h-4 w-2/3 animate-pulse rounded bg-slate-100" />
          <div className="mt-5 h-48 animate-pulse rounded-xl bg-slate-100" />
        </div>
      ) : (
        <StudentsTable
          rows={filtered}
          selectedIds={selectedIds}
          onToggleSelect={onToggleSelect}
          onToggleSelectAll={onToggleSelectAll}
          onView={async (row) => {
            setDrawerOpen(true);
            setDrawerLoading(true);
            setDrawerTab("overview");
            try {
              setError("");
              const full = await adminGetStudent(row.id);
              setSelectedStudent(full || row);
            } catch (e) {
              setSelectedStudent(row);
              setError(e?.response?.data?.message || e?.message || "Failed to load student details.");
            } finally {
              setDrawerLoading(false);
            }
          }}
          onSuspend={onSuspend}
          onActivate={onActivate}
          onDelete={onDelete}
          onSendMail={(row) => {
            if (row.email) window.location.href = `mailto:${row.email}`;
          }}
        />
      )}

      {drawerOpen && selectedStudent ? (
        <div className="fixed inset-0 z-[80]">
          <button
            type="button"
            className="absolute inset-0 bg-slate-900/40"
            onClick={() => setDrawerOpen(false)}
            aria-label="Close drawer backdrop"
          />
          <aside className="absolute right-0 top-0 h-full w-full overflow-y-auto border-l border-slate-200 bg-white shadow-2xl sm:w-[680px]">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-5 py-4">
              <h3 className="text-base font-semibold text-[#0F172A]">Student Details</h3>
              <button type="button" onClick={() => setDrawerOpen(false)} className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50">
                <FiX />
              </button>
            </div>

            <div className="space-y-4 p-5">
              {drawerLoading ? (
                <div className="h-32 animate-pulse rounded-xl bg-slate-100" />
              ) : (
                <>
                  <div className="rounded-2xl border border-slate-200 bg-white p-4">
                    <div className="flex items-start gap-3">
                      <img
                        src={`https://ui-avatars.com/api/?name=${encodeURIComponent(selectedStudent.name || "Student")}&background=DBEAFE&color=2563EB&bold=true`}
                        alt={selectedStudent.name}
                        className="h-14 w-14 rounded-full border border-slate-200 object-cover"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-lg font-semibold text-[#0F172A]">{selectedStudent.name}</p>
                        <p className="truncate text-sm text-slate-500">{selectedStudent.email}</p>
                        <div className="mt-2 inline-flex rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-semibold capitalize text-[#2563EB]">
                          {selectedStudent.status}
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      {String(selectedStudent.status).toLowerCase() === "active" ? (
                        <button type="button" onClick={() => onSuspend(selectedStudent)} className="rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50">
                          <span className="inline-flex items-center gap-1"><FiUserX /> Suspend Account</span>
                        </button>
                      ) : (
                        <button type="button" onClick={() => onActivate(selectedStudent)} className="rounded-lg bg-green-600 px-3 py-2 text-xs font-semibold text-white hover:bg-green-700">
                          Activate Account
                        </button>
                      )}
                      <a href={`mailto:${selectedStudent.email || ""}`} className="rounded-lg border border-blue-200 px-3 py-2 text-xs font-semibold text-[#2563EB] hover:bg-blue-50">
                        <span className="inline-flex items-center gap-1"><FiMail /> Send Email</span>
                      </a>
                      <button type="button" onClick={() => onDelete(selectedStudent)} className="rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50">
                        <span className="inline-flex items-center gap-1"><FiTrash2 /> Delete</span>
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {["overview", "education", "skills", "experience", "applied"].map((tab) => (
                      <button
                        key={tab}
                        type="button"
                        onClick={() => setDrawerTab(tab)}
                        className={`rounded-lg px-3 py-2 text-xs font-semibold capitalize transition ${drawerTab === tab ? "bg-[#2563EB] text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
                      >
                        {tab === "applied" ? "Applied Jobs" : tab}
                      </button>
                    ))}
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 text-sm text-slate-700">
                    {drawerTab === "overview" ? (
                      <div className="space-y-2">
                        <p><span className="font-semibold text-slate-800">Phone:</span> {selectedStudent.phone || "-"}</p>
                        <p><span className="font-semibold text-slate-800">Location:</span> {selectedStudent.location || "-"}</p>
                        <p><span className="font-semibold text-slate-800">Profile Completion:</span> {selectedStudent.completion || 0}%</p>
                        <p><span className="font-semibold text-slate-800">Preferred Stream:</span> {selectedStudent.preferred?.stream || "-"}</p>
                      </div>
                    ) : null}

                    {drawerTab === "education" ? (
                      <p><span className="font-semibold text-slate-800">Education:</span> {selectedStudent.education || "Not provided"}</p>
                    ) : null}

                    {drawerTab === "skills" ? (
                      <div className="flex flex-wrap gap-2">
                        {(selectedStudent.skills || []).map((skill) => (
                          <span key={skill} className="inline-flex rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-semibold text-[#2563EB]">
                            {skill}
                          </span>
                        ))}
                        {(!selectedStudent.skills || selectedStudent.skills.length === 0) ? <p>No skills listed.</p> : null}
                      </div>
                    ) : null}

                    {drawerTab === "experience" ? (
                      <p><span className="font-semibold text-slate-800">Experience:</span> {selectedStudent.experience || "Not provided"}</p>
                    ) : null}

                    {drawerTab === "applied" ? (
                      <div className="space-y-2">
                        {(selectedStudent.applications || []).map((app) => (
                          <div key={app.id} className="rounded-lg border border-slate-200 bg-white p-3">
                            <p className="font-semibold text-slate-800">{app.jobTitle}</p>
                            <p className="text-xs text-slate-500">{app.company} | {app.date}</p>
                            <p className="mt-1 text-xs capitalize text-[#2563EB]">{app.status}</p>
                          </div>
                        ))}
                        {(!selectedStudent.applications || selectedStudent.applications.length === 0) ? <p>No applied jobs.</p> : null}
                      </div>
                    ) : null}
                  </div>
                </>
              )}
            </div>
          </aside>
        </div>
      ) : null}
    </div>
  );
}
