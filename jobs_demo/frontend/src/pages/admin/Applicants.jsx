import { useEffect, useMemo, useState } from "react";
import {
  FiCheckCircle,
  FiClock,
  FiDownload,
  FiFileText,
  FiFilter,
  FiSearch,
  FiTrendingUp,
  FiX,
} from "react-icons/fi";

import ApplicantsTable from "../../components/admin/applicants/ApplicantsTable";
import { getJobTaxonomy } from "../../data/jobTaxonomy";
import {
  adminDeleteApplicant,
  adminGetApplicant,
  adminListApplicants,
  adminUpdateApplicantStatus,
} from "../../services/adminService";

export default function Applicants() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [list, setList] = useState([]);
  const [filters, setFilters] = useState({
    q: "",
    status: "all",
    company: "all",
    jobTitle: "all",
    stream: "all",
    experience: "all",
    dateRange: "all",
  });

  const [selectedIds, setSelectedIds] = useState([]);
  const [bulkAction, setBulkAction] = useState("shortlisted");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerLoading, setDrawerLoading] = useState(false);
  const [selectedApplicant, setSelectedApplicant] = useState(null);
  const taxonomy = useMemo(() => getJobTaxonomy(), []);
  const taxonomyStreams = useMemo(() => Object.keys(taxonomy || {}), [taxonomy]);
  const knownStreams = useMemo(() => new Set(taxonomyStreams.map((s) => String(s).trim())), [taxonomyStreams]);

  useEffect(() => {
    let mounted = true;

    async function load() {
      setLoading(true);
      setError("");
      try {
        const rows = await adminListApplicants();
        if (!mounted) return;
        setList(Array.isArray(rows) ? rows : []);
      } catch (e) {
        if (!mounted) return;
        setError(e?.response?.data?.message || e?.message || "Failed to load applications.");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, []);

  const stats = useMemo(
    () => ({
      total: list.length,
      shortlisted: list.filter((x) => String(x.status).toLowerCase() === "shortlisted").length,
      hold: list.filter((x) => String(x.status).toLowerCase() === "hold").length,
      rejected: list.filter((x) => String(x.status).toLowerCase() === "rejected").length,
    }),
    [list],
  );

  const options = useMemo(() => {
    const companies = Array.from(
      new Set(list.map((x) => x?.job?.companyName).filter(Boolean)),
    ).sort();
    const jobTitles = Array.from(
      new Set(
        list
          .filter((x) => {
            if (filters.stream === "all") return true;
            const streamValue = String(x?.job?.stream || "").trim();
            if (filters.stream === "other") return !knownStreams.has(streamValue);
            return streamValue === filters.stream;
          })
          .map((x) => x?.job?.title)
          .filter(Boolean),
      ),
    ).sort();
    const streamFromData = list.map((x) => String(x?.job?.stream || "").trim()).filter(Boolean);
    const streams = Array.from(new Set([...taxonomyStreams, ...streamFromData, "Other"])).sort((a, b) =>
      a === "Other" ? 1 : b === "Other" ? -1 : a.localeCompare(b),
    );
    return { companies, jobTitles, streams };
  }, [list, filters.stream, knownStreams, taxonomyStreams]);

  const rows = useMemo(() => {
    const q = filters.q.trim().toLowerCase();
    const now = Date.now();

    return list.filter((row) => {
      const s = row?.student || {};
      const j = row?.job || {};
      const st = String(row?.status || "").toLowerCase();

      const matchQ =
        !q ||
        `${s.name || ""} ${s.email || ""} ${j.title || ""} ${j.companyName || ""}`
          .toLowerCase()
          .includes(q);
      const matchStatus = filters.status === "all" || st === filters.status;
      const matchCompany = filters.company === "all" || j.companyName === filters.company;
      const matchJobTitle = filters.jobTitle === "all" || j.title === filters.jobTitle;
      const streamValue = String(j.stream || "").trim();
      const matchStream =
        filters.stream === "all" ||
        (filters.stream === "other" ? !knownStreams.has(streamValue) : streamValue === filters.stream);

      const expNum = Number.parseFloat(String(s.experience || "").replace(/[^\d.]/g, ""));
      const matchExperience =
        filters.experience === "all" ||
        (filters.experience === "0-1" && (!Number.isFinite(expNum) || expNum <= 1)) ||
        (filters.experience === "1-3" && Number.isFinite(expNum) && expNum > 1 && expNum <= 3) ||
        (filters.experience === "3+" && Number.isFinite(expNum) && expNum > 3);

      const createdAt = row?.createdAt ? new Date(row.createdAt).getTime() : 0;
      const matchDate =
        filters.dateRange === "all" ||
        (filters.dateRange === "7d" && createdAt >= now - 7 * 24 * 60 * 60 * 1000) ||
        (filters.dateRange === "30d" && createdAt >= now - 30 * 24 * 60 * 60 * 1000);

      return (
        matchQ &&
        matchStatus &&
        matchCompany &&
        matchJobTitle &&
        matchStream &&
        matchExperience &&
        matchDate
      );
    });
  }, [list, filters, knownStreams]);

  const setFilter = (key, value) => {
    setFilters((prev) => {
      if (key === "stream") {
        return {
          ...prev,
          stream: String(value || "all").toLowerCase() === "other" ? "other" : value,
          // Stream is parent filter; clear dependent job title.
          jobTitle: "all",
        };
      }
      return { ...prev, [key]: value };
    });
    setSelectedIds([]);
  };

  const resetFilters = () => {
    setFilters({
      q: "",
      status: "all",
      company: "all",
      jobTitle: "all",
      stream: "all",
      experience: "all",
      dateRange: "all",
    });
    setSelectedIds([]);
  };

  const exportCsv = () => {
    const header = [
      "Student Name",
      "Email",
      "Job Title",
      "Company",
      "Stream",
      "Experience",
      "Education",
      "Applied Date",
      "Status",
    ];

    const lines = rows.map((r) => [
      r.student?.name || "",
      r.student?.email || "",
      r.job?.title || "",
      r.job?.companyName || "",
      r.job?.stream || "",
      r.student?.experience || "",
      r.student?.education || "",
      r.appliedAt || "",
      r.status || "",
    ]);

    const csv = [header, ...lines]
      .map((row) => row.map((v) => `"${String(v ?? "").replaceAll("\"", "\"\"")}"`).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "jobgateway_applications_export.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  const onDelete = async (row) => {
    const ok = window.confirm("Delete this application?");
    if (!ok) return;

    try {
      await adminDeleteApplicant(row.id);
      setList((prev) => prev.filter((x) => x.id !== row.id));
      setSelectedIds((prev) => prev.filter((id) => id !== row.id));
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || "Failed to delete application.");
    }
  };

  const onToggleSelect = (id, checked) => {
    setSelectedIds((prev) =>
      checked ? [...new Set([...prev, id])] : prev.filter((x) => x !== id),
    );
  };

  const onToggleSelectAll = (checked) => {
    if (checked) {
      setSelectedIds(rows.map((x) => x.id));
      return;
    }
    setSelectedIds([]);
  };

  const applyBulkAction = async () => {
    if (!selectedIds.length) return;

    try {
      if (bulkAction === "delete") {
        await Promise.all(selectedIds.map((id) => adminDeleteApplicant(id)));
        setList((prev) => prev.filter((x) => !selectedIds.includes(x.id)));
      } else {
        await Promise.all(
          selectedIds.map((id) => adminUpdateApplicantStatus(id, bulkAction)),
        );
        setList((prev) =>
          prev.map((x) =>
            selectedIds.includes(x.id) ? { ...x, status: bulkAction } : x,
          ),
        );
      }
      setSelectedIds([]);
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || "Bulk action failed.");
    }
  };

  const openApplicantDrawer = async (row) => {
    setDrawerOpen(true);
    setDrawerLoading(true);
    setSelectedApplicant(row);
    try {
      const full = await adminGetApplicant(row.id);
      setSelectedApplicant(full || row);
    } catch {
      setSelectedApplicant(row);
    } finally {
      setDrawerLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <section>
        <h1 className="text-2xl font-bold text-[#0F172A]">Applicants Management</h1>
        <p className="text-sm text-slate-500">Monitor and manage all job applications</p>
      </section>

      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {error}
        </div>
      ) : null}

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="space-y-3">
          <div className="grid w-full grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
            <select value={filters.status} onChange={(e) => setFilter("status", e.target.value)} className="h-11 rounded-xl border border-slate-200 px-3 text-sm">
              <option value="all">Status: All</option>
              <option value="applied">Applied</option>
              <option value="shortlisted">Shortlisted</option>
              <option value="hold">On Hold</option>
              <option value="rejected">Rejected</option>
            </select>
            <select value={filters.company} onChange={(e) => setFilter("company", e.target.value)} className="h-11 rounded-xl border border-slate-200 px-3 text-sm">
              <option value="all">Company: All</option>
              {options.companies.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <select value={filters.jobTitle} onChange={(e) => setFilter("jobTitle", e.target.value)} className="h-11 rounded-xl border border-slate-200 px-3 text-sm">
              <option value="all">Job Title: All</option>
              {options.jobTitles.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
            <select value={filters.stream} onChange={(e) => setFilter("stream", e.target.value)} className="h-11 rounded-xl border border-slate-200 px-3 text-sm">
              <option value="all">Main Stream: All</option>
              {options.streams.map((s) => (
                <option key={s} value={String(s).toLowerCase() === "other" ? "other" : s}>{s}</option>
              ))}
            </select>
            <select value={filters.experience} onChange={(e) => setFilter("experience", e.target.value)} className="h-11 rounded-xl border border-slate-200 px-3 text-sm">
              <option value="all">Ex: All</option>
              <option value="0-1">0-1 yrs</option>
              <option value="1-3">1-3 yrs</option>
              <option value="3+">3+ yrs</option>
            </select>
            <select value={filters.dateRange} onChange={(e) => setFilter("dateRange", e.target.value)} className="h-11 rounded-xl border border-slate-200 px-3 text-sm">
              <option value="all">Date: All</option>
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
            </select>
            <button type="button" className="inline-flex h-11 items-center gap-2 rounded-xl border border-orange-200 bg-orange-50 px-4 text-sm font-semibold text-[#F97316]">
              <FiFilter /> Smart Filter
            </button>
            <button type="button" onClick={exportCsv} className="inline-flex h-11 items-center gap-2 rounded-xl border border-blue-200 bg-white px-4 text-sm font-semibold text-[#2563EB]">
              <FiDownload /> Export CSV
            </button>
            <select value={bulkAction} onChange={(e) => setBulkAction(e.target.value)} className="h-11 rounded-xl border border-slate-200 px-3 text-sm">
              <option value="shortlisted">Bulk: Shortlist</option>
              <option value="hold">Bulk: Hold</option>
              <option value="rejected">Bulk: Reject</option>
              <option value="delete">Bulk: Delete</option>
            </select>
            <button type="button" onClick={applyBulkAction} className="h-11 rounded-xl bg-[#2563EB] px-4 text-sm font-semibold text-white hover:bg-blue-700">
              Bulk Actions
            </button>
            <button type="button" onClick={resetFilters} className="h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50">
              Reset
            </button>
          </div>

          <div className="relative">
            <FiSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={filters.q}
              onChange={(e) => setFilter("q", e.target.value)}
              placeholder="Search by student, email, job title, company..."
              className="h-12 w-full rounded-xl border border-slate-200 pl-10 pr-3 text-sm outline-none focus:border-blue-300"
            />
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Total Applications" value={stats.total} icon={<FiFileText />} trend="+11% this month" />
        <StatCard title="Shortlisted" value={stats.shortlisted} icon={<FiCheckCircle />} trend="+5 this week" />
        <StatCard title="On Hold" value={stats.hold} icon={<FiClock />} trend="-2 this week" />
        <StatCard title="Rejected" value={stats.rejected} icon={<FiTrendingUp />} trend="+3 this week" />
      </section>

      {loading ? (
        <div className="rounded-2xl bg-white p-6 shadow-sm">Loading applications...</div>
      ) : (
        <ApplicantsTable
          rows={rows}
          selectedIds={selectedIds}
          onToggleSelect={onToggleSelect}
          onToggleSelectAll={onToggleSelectAll}
          onDelete={onDelete}
          onView={openApplicantDrawer}
          onDownloadResume={(row) => {
            if (row?.student?.resumeUrl) window.open(row.student.resumeUrl, "_blank");
          }}
        />
      )}

      {drawerOpen ? (
        <>
          <div
            className="fixed inset-0 z-[60] bg-slate-900/35"
            onClick={() => setDrawerOpen(false)}
          />
          <aside className="fixed right-0 top-0 z-[61] h-screen w-full overflow-y-auto border-l border-slate-200 bg-white shadow-2xl sm:w-[640px]">
            <div className="sticky top-0 z-10 border-b border-slate-100 bg-white px-5 py-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-semibold text-[#0F172A]">
                    {selectedApplicant?.student?.name || "Applicant Profile"}
                  </h3>
                  <p className="mt-1 text-sm text-slate-600">
                    {selectedApplicant?.job?.title || "-"} • {selectedApplicant?.job?.companyName || "-"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setDrawerOpen(false)}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition hover:bg-slate-50"
                >
                  <FiX />
                </button>
              </div>
            </div>

            <div className="space-y-4 p-5">
              {drawerLoading ? (
                <div className="h-36 animate-pulse rounded-xl bg-slate-100" />
              ) : (
                <>
                  <section className="rounded-2xl border border-slate-200 bg-white p-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={selectedApplicant?.student?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedApplicant?.student?.name || "Student")}&background=DBEAFE&color=2563EB&bold=true`}
                        alt={selectedApplicant?.student?.name || "Student"}
                        className="h-14 w-14 rounded-full border border-slate-200 object-cover"
                      />
                      <div>
                        <p className="text-base font-semibold text-[#0F172A]">{selectedApplicant?.student?.name || "-"}</p>
                        <p className="text-sm text-slate-600">{selectedApplicant?.student?.email || "-"}</p>
                        <p className="text-xs text-slate-500">{selectedApplicant?.student?.phone || "-"}</p>
                      </div>
                    </div>
                  </section>

                  <section className="rounded-2xl border border-slate-200 bg-white p-4">
                    <h4 className="text-sm font-semibold text-[#0F172A]">Application Details</h4>
                    <div className="mt-3 grid grid-cols-1 gap-2 text-sm text-slate-700 sm:grid-cols-2">
                      <p><span className="text-slate-500">Status:</span> <span className="font-semibold capitalize">{selectedApplicant?.status || "-"}</span></p>
                      <p><span className="text-slate-500">Applied Date:</span> <span className="font-semibold">{selectedApplicant?.appliedAt || "-"}</span></p>
                      <p><span className="text-slate-500">Experience:</span> <span className="font-semibold">{selectedApplicant?.student?.experience || "-"}</span></p>
                      <p><span className="text-slate-500">Education:</span> <span className="font-semibold">{selectedApplicant?.student?.education || "-"}</span></p>
                      <p><span className="text-slate-500">Main Stream:</span> <span className="font-semibold">{selectedApplicant?.job?.stream || "-"}</span></p>
                      <p><span className="text-slate-500">Category:</span> <span className="font-semibold">{selectedApplicant?.job?.category || "-"}</span></p>
                    </div>
                  </section>

                  <section className="rounded-2xl border border-slate-200 bg-white p-4">
                    <h4 className="text-sm font-semibold text-[#0F172A]">Resume</h4>
                    {selectedApplicant?.student?.resumeUrl ? (
                      <div className="mt-3 flex gap-2">
                        <a
                          href={selectedApplicant.student.resumeUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="rounded-lg border border-blue-200 px-3 py-2 text-sm font-semibold text-[#2563EB] hover:bg-blue-50"
                        >
                          View Resume
                        </a>
                        <button
                          type="button"
                          onClick={() => window.open(selectedApplicant.student.resumeUrl, "_blank")}
                          className="rounded-lg bg-[#2563EB] px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                        >
                          Download Resume
                        </button>
                      </div>
                    ) : (
                      <p className="mt-2 text-sm text-slate-500">Resume not available.</p>
                    )}
                  </section>
                </>
              )}
            </div>
          </aside>
        </>
      ) : null}
    </div>
  );
}

function StatCard({ title, value, icon, trend }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase text-slate-500">{title}</p>
          <p className="mt-2 text-2xl font-bold">{value}</p>
          {trend ? <p className="mt-2 text-xs font-semibold text-[#F97316]">{trend}</p> : null}
        </div>
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 text-[#2563EB]">
          {icon}
        </span>
      </div>
    </div>
  );
}
