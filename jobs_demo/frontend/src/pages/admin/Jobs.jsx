import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiBriefcase, FiCheckCircle, FiLock, FiTrendingUp, FiX } from "react-icons/fi";

import Modal from "../../components/common/Modal";
import JobFilters from "../../components/admin/jobs/JobFilters";
import JobsTable from "../../components/admin/jobs/JobsTable";
import {
  adminDeleteJob,
  adminGetJobDetails,
  adminListJobs,
  adminToggleJobStatus,
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

export default function Jobs() {
  const nav = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [jobs, setJobs] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const perPage = 8;

  const [filters, setFilters] = useState({
    q: "",
    status: "all",
    company: "all",
    stream: "all",
    category: "all",
    location: "all",
    salary: "all",
    minApplications: "",
    postedAfter: "",
  });

  const [selectedIds, setSelectedIds] = useState([]);
  const [bulkAction, setBulkAction] = useState("disable");
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerLoading, setDrawerLoading] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);

  useEffect(() => {
    let mounted = true;

    async function load() {
      setLoading(true);
      setError("");
      try {
        const params = {
          q: filters.q || undefined,
          status: filters.status,
          company: filters.company,
          stream: filters.stream,
          category: filters.category,
          location: filters.location,
          minApplications: filters.minApplications || undefined,
          postedAfter: filters.postedAfter || undefined,
          page,
          limit: perPage,
        };

        const res = await adminListJobs(params, { withMeta: true });
        if (!mounted) return;

        const rows = Array.isArray(res?.rows) ? res.rows : [];
        setJobs(rows);
        setTotal(Number(res?.total || rows.length || 0));
      } catch (e) {
        if (!mounted) return;
        setError(e?.response?.data?.message || e?.message || "Failed to load jobs.");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, [filters, page]);

  const options = useMemo(() => {
    const companies = Array.from(new Set(jobs.map((j) => j.companyName).filter(Boolean))).sort();
    const streams = Array.from(new Set(jobs.map((j) => j.stream).filter(Boolean))).sort();
    const categories = Array.from(new Set(jobs.map((j) => j.category).filter(Boolean))).sort();
    const locations = Array.from(new Set(jobs.map((j) => j.location).filter(Boolean))).sort();
    return { companies, streams, categories, locations };
  }, [jobs]);

  const stats = useMemo(() => {
    const totalRows = jobs.length;
    const active = jobs.filter((j) => String(j.status).toLowerCase() === "active").length;
    const closed = jobs.filter((j) => String(j.status).toLowerCase() === "closed").length;
    const disabled = jobs.filter((j) => String(j.status).toLowerCase() === "disabled").length;
    return { totalRows, active, closed, disabled };
  }, [jobs]);

  const totalPages = Math.max(1, Math.ceil(total / perPage));
  const currentPage = Math.min(page, totalPages);

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPage(1);
    setSelectedIds([]);
  };

  const handleReset = () => {
    setFilters({
      q: "",
      status: "all",
      company: "all",
      stream: "all",
      category: "all",
      location: "all",
      salary: "all",
      minApplications: "",
      postedAfter: "",
    });
    setPage(1);
    setSelectedIds([]);
  };

  const handleRowSelect = (id, checked) => {
    setSelectedIds((prev) => (checked ? [...new Set([...prev, id])] : prev.filter((x) => x !== id)));
  };

  const handleTogglePageSelect = (checked) => {
    if (!jobs.length) return;
    if (checked) {
      setSelectedIds((prev) => [...new Set([...prev, ...jobs.map((j) => j.id)])]);
      return;
    }
    const ids = new Set(jobs.map((j) => j.id));
    setSelectedIds((prev) => prev.filter((id) => !ids.has(id)));
  };

  const handleOpen = async (job) => {
    setDrawerOpen(true);
    setDrawerLoading(true);
    setError("");
    try {
      const res = await adminGetJobDetails(job.id);
      setSelectedJob(res?.raw || res?.job || job);
    } catch (e) {
      setSelectedJob(job);
      setError(e?.response?.data?.message || e?.message || "Failed to load job details.");
    } finally {
      setDrawerLoading(false);
    }
  };
  const handleEdit = (job) => nav(`/admin/jobs/${job.id}`);

  const handleToggleStatus = async (job, nextStatus) => {
    const id = job?.id || job?._id;
    if (!id) return;
    try {
      await adminToggleJobStatus(id, nextStatus);
      setJobs((prev) => prev.map((x) => (x.id === id ? { ...x, status: nextStatus } : x)));
      setSelectedJob((prev) =>
        prev && (String(prev.id || prev._id) === String(id)) ? { ...prev, status: nextStatus } : prev,
      );
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || "Failed to update status.");
    }
  };

  const handleDelete = async (job) => {
    const ok = window.confirm(`Delete "${job.title}"? This cannot be undone.`);
    if (!ok) return;

    try {
      await adminDeleteJob(job.id);
      setJobs((prev) => prev.filter((x) => x.id !== job.id));
      setSelectedIds((prev) => prev.filter((id) => id !== job.id));
      setTotal((prev) => Math.max(0, prev - 1));
      if (selectedJob?.id === job.id || selectedJob?._id === job.id) {
        setSelectedJob(null);
        setDrawerOpen(false);
      }
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || "Failed to delete job.");
    }
  };

  const applyBulkAction = async () => {
    if (!selectedIds.length) return;

    try {
      if (bulkAction === "delete") {
        await Promise.all(selectedIds.map((id) => adminDeleteJob(id)));
        setJobs((prev) => prev.filter((x) => !selectedIds.includes(x.id)));
        setTotal((prev) => Math.max(0, prev - selectedIds.length));
      } else {
        const nextStatus = bulkAction === "close" ? "closed" : "disabled";
        await Promise.all(selectedIds.map((id) => adminToggleJobStatus(id, nextStatus)));
        setJobs((prev) =>
          prev.map((x) => (selectedIds.includes(x.id) ? { ...x, status: nextStatus } : x)),
        );
      }
      setSelectedIds([]);
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || "Bulk action failed.");
    }
  };

  const handleExport = () => {
    const header = [
      "Job Title",
      "Company",
      "Main Stream",
      "Category",
      "Location",
      "Salary",
      "Experience",
      "Applications",
      "Status",
      "Posted Date",
    ];

    const lines = jobs.map((job) => [
      job.title,
      job.companyName,
      job.stream,
      job.category,
      job.location,
      job.salary,
      job.experience,
      job.applications,
      job.status,
      job.createdAt,
    ]);

    const csv = [header, ...lines]
      .map((row) => row.map((v) => `"${String(v ?? "").replaceAll("\"", "\"\"")}"`).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "jobgateway_jobs_export.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <section>
        <h1 className="text-2xl font-bold text-[#0F172A] sm:text-3xl">Jobs Management</h1>
        <p className="mt-1 text-sm text-slate-500">Monitor and manage all job postings across companies</p>
        <p className="mt-2 text-xs font-medium text-slate-400">Dashboard &gt; Jobs</p>
      </section>

      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {error}
        </div>
      ) : null}

      <JobFilters
        filters={filters}
        options={options}
        onChange={handleFilterChange}
        onReset={handleReset}
        onExport={handleExport}
        onAdd={() => {}}
        onOpenAdvanced={() => setAdvancedOpen(true)}
      />

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Jobs In Current Page" value={stats.totalRows} trend="Live backend data" icon={<FiBriefcase />} />
        <StatCard title="Active Jobs" value={stats.active} trend="Live backend data" icon={<FiCheckCircle />} />
        <StatCard title="Closed Jobs" value={stats.closed} trend="Live backend data" icon={<FiTrendingUp />} />
        <StatCard title="Jobs Disabled by Admin" value={stats.disabled} trend="Live backend data" icon={<FiLock />} />
      </section>

      {selectedIds.length ? (
        <section className="rounded-2xl border border-orange-200 bg-orange-50 px-4 py-3">
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-sm font-semibold text-[#F97316]">{selectedIds.length} jobs selected</p>
            <select
              value={bulkAction}
              onChange={(e) => setBulkAction(e.target.value)}
              className="h-10 rounded-lg border border-orange-200 bg-white px-3 text-sm outline-none"
            >
              <option value="disable">Disable Selected</option>
              <option value="delete">Delete Selected</option>
              <option value="close">Mark as Closed</option>
            </select>
            <button
              type="button"
              onClick={applyBulkAction}
              className="h-10 rounded-lg bg-[#F97316] px-3 text-sm font-semibold text-white transition hover:bg-orange-600"
            >
              Apply
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
        <>
          <JobsTable
            rows={jobs}
            selectedIds={selectedIds}
            onToggleSelect={handleRowSelect}
            onToggleSelectAll={handleTogglePageSelect}
            onOpen={handleOpen}
            onEdit={handleEdit}
            onToggle={handleToggleStatus}
            onDelete={handleDelete}
          />

          <div className="flex items-center justify-between">
            <div className="text-sm text-slate-500">
              Showing <b>{jobs.length ? (currentPage - 1) * perPage + 1 : 0}</b> -{" "}
              <b>{(currentPage - 1) * perPage + jobs.length}</b> of <b>{total}</b>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
              >
                Prev
              </button>
              <span className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-600">
                {currentPage} / {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={currentPage >= totalPages}
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        </>
      )}

      <Modal
        open={advancedOpen}
        onClose={() => setAdvancedOpen(false)}
        title="Advanced Filters"
        widthClass="max-w-xl"
        footer={
          <>
            <button
              type="button"
              onClick={() => setAdvancedOpen(false)}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
            >
              Close
            </button>
            <button
              type="button"
              onClick={() => setAdvancedOpen(false)}
              className="rounded-lg bg-[#2563EB] px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Apply
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <label className="text-sm font-medium text-slate-600">
              Minimum Applications
              <input
                type="number"
                min="0"
                value={filters.minApplications}
                onChange={(e) => handleFilterChange("minApplications", e.target.value)}
                className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 outline-none focus:border-blue-300"
              />
            </label>

            <label className="text-sm font-medium text-slate-600">
              Date Posted After
              <input
                type="date"
                value={filters.postedAfter}
                onChange={(e) => handleFilterChange("postedAfter", e.target.value)}
                className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 outline-none focus:border-blue-300"
              />
            </label>
          </div>
        </div>
      </Modal>

      {drawerOpen ? (
        <>
          <div
            className="fixed inset-0 z-[60] bg-slate-900/35"
            onClick={() => setDrawerOpen(false)}
          />
          <aside className="fixed right-0 top-0 z-[61] h-screen w-full overflow-y-auto border-l border-slate-200 bg-white shadow-2xl sm:w-[680px]">
            <div className="sticky top-0 z-10 border-b border-slate-100 bg-white px-5 py-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-semibold text-[#0F172A]">
                    {selectedJob?.title || "Job Details"}
                  </h3>
                  <p className="mt-1 text-sm text-slate-600">
                    {selectedJob?.companyName || selectedJob?.company?.name || "-"} • {selectedJob?.location || "-"}
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
                    <div className="grid grid-cols-2 gap-3 text-sm md:grid-cols-4">
                      <p><span className="text-slate-500">Salary:</span> <span className="font-semibold">{selectedJob?.salaryText || selectedJob?.salary || "-"}</span></p>
                      <p><span className="text-slate-500">Experience:</span> <span className="font-semibold">{selectedJob?.experience || "-"}</span></p>
                      <p><span className="text-slate-500">Posted:</span> <span className="font-semibold">{selectedJob?.createdAt ? String(selectedJob.createdAt).slice(0, 10) : "-"}</span></p>
                      <p><span className="text-slate-500">Applications:</span> <span className="font-semibold">{selectedJob?.applications || selectedJob?.applicationsCount || 0}</span></p>
                    </div>
                  </section>

                  <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                    <div className="rounded-2xl border border-slate-200 bg-white p-4">
                      <h4 className="text-sm font-semibold text-[#0F172A]">Overview</h4>
                      <p className="mt-2 text-sm text-slate-600 whitespace-pre-wrap">
                        {selectedJob?.overview || "No overview provided."}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white p-4">
                      <h4 className="text-sm font-semibold text-[#0F172A]">Requirements</h4>
                      <p className="mt-2 text-sm text-slate-600 whitespace-pre-wrap">
                        {selectedJob?.requirements || "No requirements provided."}
                      </p>
                    </div>
                  </section>

                  <section className="rounded-2xl border border-slate-200 bg-white p-4">
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => handleToggleStatus({ id: selectedJob?.id || selectedJob?._id }, "disabled")}
                        className="rounded-lg bg-[#2563EB] px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                      >
                        Disable Job
                      </button>
                      <button
                        type="button"
                        onClick={() => handleToggleStatus({ id: selectedJob?.id || selectedJob?._id }, "closed")}
                        className="rounded-lg border border-red-200 px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50"
                      >
                        Close Job
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete({ id: selectedJob?.id || selectedJob?._id, title: selectedJob?.title || "Job" })}
                        className="rounded-lg border border-red-200 px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50"
                      >
                        Delete Job
                      </button>
                    </div>
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
