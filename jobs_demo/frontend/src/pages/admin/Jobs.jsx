import { useEffect, useMemo, useState } from "react";
import { FiBriefcase, FiCheckCircle, FiGrid, FiList, FiLock, FiTrendingUp, FiX } from "react-icons/fi";

import Modal from "../../components/common/Modal";
import JobFilters from "../../components/admin/jobs/JobFilters";
import { getJobTaxonomy } from "../../data/jobTaxonomy";
import JobCardGrid from "../../components/admin/jobs/JobCardGrid";
import JobsTable from "../../components/admin/jobs/JobsTable";
import { showSweetConfirm, showSweetToast } from "../../utils/sweetAlert.js";
import {
  adminCreateJob,
  adminDeleteJob,
  adminListCompanies,
  adminGetJobDetails,
  adminListJobs,
  adminToggleJobStatus,
  adminUpdateJob,
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

export default function Jobs({ workspace = "company" }) {
  const isMyJobs = workspace === "my";
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
  const [viewMode, setViewMode] = useState("table");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerLoading, setDrawerLoading] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);
  const [companyOptions, setCompanyOptions] = useState([]);
  const [addOpen, setAddOpen] = useState(false);
  const [addingJob, setAddingJob] = useState(false);
  const [editingJobId, setEditingJobId] = useState("");
  const taxonomy = useMemo(() => getJobTaxonomy(), []);
  const taxonomyStreams = useMemo(() => Object.keys(taxonomy || {}), [taxonomy]);
  const knownStreams = useMemo(() => new Set(taxonomyStreams.map((s) => String(s).trim())), [taxonomyStreams]);
  const createEmptyJobForm = (companyId = "") => ({
    companyId,
    title: "",
    stream: taxonomyStreams[0] || "",
    category: "",
    subCategory: "",
    city: "",
    state: "",
    workMode: "Hybrid",
    experience: "Fresher",
    salaryMin: "",
    salaryMax: "",
    overview: "",
    requirements: "",
    status: "active",
  });
  const [jobForm, setJobForm] = useState(() => createEmptyJobForm());

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
          stream: filters.stream === "other" ? "all" : filters.stream,
          category: filters.category,
          location: filters.location,
          minApplications: filters.minApplications || undefined,
          postedAfter: filters.postedAfter || undefined,
          source: isMyJobs ? "admin" : "company",
          page,
          limit: perPage,
        };

        const res = await adminListJobs(params, { withMeta: true });
        if (!mounted) return;

        let rows = Array.isArray(res?.rows) ? res.rows : [];
        if (filters.stream === "other") {
          rows = rows.filter((j) => !knownStreams.has(String(j?.stream || "").trim()));
        }
        setJobs(rows);
        const baseTotal = Number(res?.total || rows.length || 0);
        setTotal(filters.stream === "other" ? rows.length : baseTotal);
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
  }, [filters, page, knownStreams, isMyJobs]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const rows = await adminListCompanies();
        if (!mounted) return;
        const companies = Array.isArray(rows) ? rows : [];
        setCompanyOptions(companies);
        if (companies.length) {
          setJobForm((prev) => ({ ...prev, companyId: prev.companyId || companies[0].id }));
        }
      } catch {
        if (mounted) setCompanyOptions([]);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const options = useMemo(() => {
    const companies = Array.from(new Set(jobs.map((j) => j.companyName).filter(Boolean))).sort();
    const jobStreams = jobs.map((j) => String(j.stream || "").trim()).filter(Boolean);
    const streams = Array.from(new Set([...taxonomyStreams, ...jobStreams, "Other"])).sort((a, b) =>
      a === "Other" ? 1 : b === "Other" ? -1 : a.localeCompare(b),
    );

    const taxonomyCategories =
      filters.stream && filters.stream !== "all" && filters.stream !== "other"
        ? Object.keys(taxonomy?.[filters.stream] || {})
        : Object.values(taxonomy || {}).flatMap((cats) => Object.keys(cats || {}));
    const categories = Array.from(new Set([...taxonomyCategories, ...jobs.map((j) => j.category).filter(Boolean)])).sort();
    const locations = Array.from(new Set(jobs.map((j) => j.location).filter(Boolean))).sort();
    return { companies, streams, categories, locations };
  }, [jobs, taxonomy, taxonomyStreams, filters.stream]);

  const stats = useMemo(() => {
    const totalRows = jobs.length;
    const active = jobs.filter((j) => String(j.status).toLowerCase() === "active").length;
    const closed = jobs.filter((j) => String(j.status).toLowerCase() === "closed").length;
    const disabled = jobs.filter((j) => String(j.status).toLowerCase() === "disabled").length;
    return { totalRows, active, closed, disabled };
  }, [jobs]);

  const totalPages = Math.max(1, Math.ceil(total / perPage));
  const currentPage = Math.min(page, totalPages);
  const pageTitle = isMyJobs ? "My Jobs" : "Company Jobs";
  const pageSubtitle = isMyJobs
    ? "Post jobs for companies and manage every job operation from one workspace"
    : "Monitor jobs posted across all registered companies";
  const breadcrumbLabel = isMyJobs ? "My Jobs" : "Company Jobs";

  const resolveCompanyId = (job = {}) => {
    const company = job.company;
    if (typeof company === "string") return company;
    if (company?._id) return String(company._id);
    if (job.companyId) return String(job.companyId);
    const byName = companyOptions.find((c) => c.name === job.companyName || c.companyName === job.companyName);
    return byName?.id || companyOptions[0]?.id || "";
  };

  const normalizeFormStatus = (status = "active") => {
    const s = String(status || "active").toLowerCase();
    if (s === "disabled") return "disabled";
    if (s === "closed") return "closed";
    if (s === "draft") return "draft";
    return "active";
  };

  const toJobForm = (job = {}) => ({
    ...createEmptyJobForm(resolveCompanyId(job)),
    title: job.title || "",
    stream: job.stream || job.mainStream || taxonomyStreams[0] || "",
    category: job.category || "",
    subCategory: job.subCategory || "",
    city: job.city || "",
    state: job.state || "",
    workMode: job.workMode || job.mode || "Hybrid",
    experience: job.experience || "",
    salaryMin: job.salaryMin ? String(job.salaryMin) : "",
    salaryMax: job.salaryMax ? String(job.salaryMax) : "",
    overview: job.overview || "",
    requirements: job.requirements || "",
    status: normalizeFormStatus(job.status),
  });

  const buildJobPayload = () => ({
    companyId: jobForm.companyId,
    title: jobForm.title,
    stream: jobForm.stream,
    category: jobForm.category,
    subCategory: jobForm.subCategory,
    city: jobForm.city,
    state: jobForm.state,
    workMode: jobForm.workMode,
    experience: jobForm.experience,
    salaryMin: Number(jobForm.salaryMin || 0),
    salaryMax: Number(jobForm.salaryMax || 0),
    overview: jobForm.overview,
    requirements: jobForm.requirements,
    status: jobForm.status,
  });

  const handleFilterChange = (key, value) => {
    setFilters((prev) => {
      if (key === "stream") {
        return {
          ...prev,
          stream: String(value || "all").toLowerCase() === "other" ? "other" : value,
          // Stream is a parent filter, so reset dependent category.
          category: "all",
        };
      }
      return { ...prev, [key]: value };
    });
    setPage(1);
    setSelectedIds([]);
  };

  const streamCategories = useMemo(() => {
    if (!jobForm.stream) return [];
    return Object.keys(taxonomy[jobForm.stream] || {});
  }, [jobForm.stream, taxonomy]);

  const subCategoryOptions = useMemo(() => {
    if (!jobForm.stream || !jobForm.category) return [];
    return taxonomy[jobForm.stream]?.[jobForm.category] || [];
  }, [jobForm.stream, jobForm.category, taxonomy]);

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
  const openCreateJob = () => {
    if (!isMyJobs) return;
    setEditingJobId("");
    setJobForm(createEmptyJobForm(companyOptions[0]?.id || ""));
    setAddOpen(true);
  };

  const closeJobModal = () => {
    setAddOpen(false);
    setEditingJobId("");
  };

  const handleEdit = async (job) => {
    if (!isMyJobs) return;
    const id = job?.id || job?._id;
    if (!id) return;

    setEditingJobId(id);
    setAddOpen(true);
    setAddingJob(true);
    setError("");
    try {
      const res = await adminGetJobDetails(id);
      setJobForm(toJobForm(res?.raw || res?.job || job));
    } catch (e) {
      setJobForm(toJobForm(job));
      setError(e?.response?.data?.message || e?.message || "Failed to load job for editing.");
    } finally {
      setAddingJob(false);
    }
  };

  const handleToggleStatus = async (job, nextStatus) => {
    const id = job?.id || job?._id;
    if (!id) return;

    const jobTitle = job?.title || "this job";
    const actionCopy =
      nextStatus === "disabled"
        ? {
            title: "Suspend Job?",
            text: `Suspend "${jobTitle}"? Students will not be able to apply until it is activated again.`,
            confirmButtonText: "Suspend",
            success: `"${jobTitle}" suspended successfully.`,
          }
        : nextStatus === "active"
        ? {
            title: "Activate Job?",
            text: `Activate "${jobTitle}"? Students will be able to apply again.`,
            confirmButtonText: "Activate",
            success: `"${jobTitle}" activated successfully.`,
          }
        : {
            title: "Close Job?",
            text: `Close "${jobTitle}"? Students will no longer be able to apply for this job.`,
            confirmButtonText: "Close",
            success: `"${jobTitle}" closed successfully.`,
          };

    const ok = await showSweetConfirm({
      title: actionCopy.title,
      text: actionCopy.text,
      confirmButtonText: actionCopy.confirmButtonText,
      cancelButtonText: "Cancel",
      tone: "warning",
      focusCancel: true,
    });
    if (!ok) return;

    try {
      await adminToggleJobStatus(id, nextStatus);
      setJobs((prev) => prev.map((x) => (x.id === id ? { ...x, status: nextStatus } : x)));
      setSelectedJob((prev) =>
        prev && (String(prev.id || prev._id) === String(id)) ? { ...prev, status: nextStatus } : prev,
      );
      void showSweetToast(actionCopy.success, "success", { timer: 1600 });
    } catch (e) {
      const message = e?.response?.data?.message || e?.message || "Failed to update status.";
      setError(message);
      void showSweetToast(message, "error", { timer: 1800 });
    }
  };

  const handleDelete = async (job) => {
    const ok = await showSweetConfirm({
      title: "Delete Job?",
      text: `Delete "${job.title}"? This cannot be undone.`,
      confirmButtonText: "Delete",
      tone: "warning",
    });
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
      void showSweetToast(`"${job.title}" deleted successfully.`, "success", { timer: 1600 });
    } catch (e) {
      const message = e?.response?.data?.message || e?.message || "Failed to delete job.";
      setError(message);
      void showSweetToast(message, "error", { timer: 1800 });
    }
  };

  const applyBulkAction = async () => {
    if (!selectedIds.length) return;

    const actionCopy =
      bulkAction === "delete"
        ? {
            title: "Delete Selected Jobs?",
            text: `Delete ${selectedIds.length} selected jobs? This cannot be undone.`,
            confirmButtonText: "Delete selected",
            success: `${selectedIds.length} jobs deleted successfully.`,
          }
        : bulkAction === "close"
        ? {
            title: "Close Selected Jobs?",
            text: `Close ${selectedIds.length} selected jobs? Students will no longer be able to apply.`,
            confirmButtonText: "Close selected",
            success: `${selectedIds.length} jobs closed successfully.`,
          }
        : {
            title: "Suspend Selected Jobs?",
            text: `Suspend ${selectedIds.length} selected jobs? Students will not be able to apply until they are activated again.`,
            confirmButtonText: "Suspend selected",
            success: `${selectedIds.length} jobs suspended successfully.`,
          };

    const ok = await showSweetConfirm({
      title: actionCopy.title,
      text: actionCopy.text,
      confirmButtonText: actionCopy.confirmButtonText,
      cancelButtonText: "Cancel",
      tone: "warning",
      focusCancel: true,
    });
    if (!ok) return;

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
      void showSweetToast(actionCopy.success, "success", { timer: 1600 });
    } catch (e) {
      const message = e?.response?.data?.message || e?.message || "Bulk action failed.";
      setError(message);
      void showSweetToast(message, "error", { timer: 1800 });
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

  const onSaveJob = async () => {
    if (!jobForm.companyId || !jobForm.title.trim()) {
      setError("Company and job title are required.");
      return;
    }
    setAddingJob(true);
    setError("");
    try {
      const payload = buildJobPayload();
      if (editingJobId) {
        const res = await adminUpdateJob(editingJobId, payload);
        const updated = res?.job;
        if (updated?.id) {
          setJobs((prev) => prev.map((job) => (job.id === updated.id ? updated : job)));
        }
      } else {
        await adminCreateJob(payload);
      }
      closeJobModal();
      setJobForm(createEmptyJobForm(companyOptions[0]?.id || ""));
      setPage(1);
      // trigger reload
      setFilters((prev) => ({ ...prev }));
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || "Failed to save job.");
    } finally {
      setAddingJob(false);
    }
  };

  return (
    <div className="space-y-6">
      <section>
        <h1 className="text-2xl font-bold text-[#0F172A] sm:text-3xl">{pageTitle}</h1>
        <p className="mt-1 text-sm text-slate-500">{pageSubtitle}</p>
        <p className="mt-2 text-xs font-medium text-slate-400">Dashboard &gt; {breadcrumbLabel}</p>
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
        onAdd={isMyJobs ? openCreateJob : undefined}
        onOpenAdvanced={() => setAdvancedOpen(true)}
      />

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Jobs In Current Page" value={stats.totalRows} trend="Live backend data" icon={<FiBriefcase />} />
        <StatCard title="Active Jobs" value={stats.active} trend="Live backend data" icon={<FiCheckCircle />} />
        <StatCard title="Closed Jobs" value={stats.closed} trend="Live backend data" icon={<FiTrendingUp />} />
        <StatCard title="Jobs Disabled by Admin" value={stats.disabled} trend="Live backend data" icon={<FiLock />} />
      </section>

      <section className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-[#0F172A]">Choose View</p>
          <p className="text-xs text-slate-500">Switch between the compact table and a friendly card layout.</p>
        </div>
        <div className="inline-flex rounded-xl border border-slate-200 bg-slate-50 p-1">
          <button
            type="button"
            onClick={() => setViewMode("table")}
            className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition ${
              viewMode === "table" ? "bg-white text-[#2563EB] shadow-sm" : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <FiList /> Table
          </button>
          <button
            type="button"
            onClick={() => setViewMode("cards")}
            className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition ${
              viewMode === "cards" ? "bg-white text-[#2563EB] shadow-sm" : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <FiGrid /> Cards
          </button>
        </div>
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
          {viewMode === "table" ? (
            <JobsTable
              rows={jobs}
              selectedIds={selectedIds}
              onToggleSelect={handleRowSelect}
              onToggleSelectAll={handleTogglePageSelect}
              onOpen={handleOpen}
              onEdit={isMyJobs ? handleEdit : undefined}
              onToggle={handleToggleStatus}
              onDelete={handleDelete}
            />
          ) : (
            <JobCardGrid
              rows={jobs}
              onOpen={handleOpen}
              onEdit={isMyJobs ? handleEdit : undefined}
              onToggle={handleToggleStatus}
              onDelete={handleDelete}
            />
          )}

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

      <Modal
        open={isMyJobs && addOpen}
        onClose={closeJobModal}
        title={editingJobId ? "Edit Job" : "Add Job"}
        widthClass="max-w-3xl"
        footer={
          <>
            <button
              type="button"
              onClick={closeJobModal}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={addingJob}
              onClick={onSaveJob}
              className="rounded-lg bg-[#2563EB] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
            >
              {addingJob ? "Saving..." : editingJobId ? "Update Job" : "Create Job"}
            </button>
          </>
        }
      >
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <label className="text-sm font-medium text-slate-700">
            Company*
            <select
              value={jobForm.companyId}
              onChange={(e) => setJobForm((p) => ({ ...p, companyId: e.target.value }))}
              className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3"
            >
              <option value="">Select company</option>
              {companyOptions.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </label>
          <label className="text-sm font-medium text-slate-700">
            Job Title*
            <input
              value={jobForm.title}
              onChange={(e) => setJobForm((p) => ({ ...p, title: e.target.value }))}
              className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3"
            />
          </label>
          <label className="text-sm font-medium text-slate-700">
            Main Stream
            <select
              value={jobForm.stream}
              onChange={(e) => {
                const stream = e.target.value;
                const nextCategory = Object.keys(taxonomy[stream] || {})[0] || "";
                const nextSub = taxonomy[stream]?.[nextCategory]?.[0] || "";
                setJobForm((p) => ({ ...p, stream, category: nextCategory, subCategory: nextSub }));
              }}
              className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3"
            >
              {taxonomyStreams.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </label>
          <label className="text-sm font-medium text-slate-700">
            Category
            <select
              value={jobForm.category}
              onChange={(e) => {
                const category = e.target.value;
                const nextSub = taxonomy[jobForm.stream]?.[category]?.[0] || "";
                setJobForm((p) => ({ ...p, category, subCategory: nextSub }));
              }}
              className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3"
            >
              <option value="">Select category</option>
              {streamCategories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </label>
          <label className="text-sm font-medium text-slate-700">
            Sub Category
            <select
              value={jobForm.subCategory}
              onChange={(e) => setJobForm((p) => ({ ...p, subCategory: e.target.value }))}
              className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3"
            >
              <option value="">Select sub category</option>
              {subCategoryOptions.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </label>
          <label className="text-sm font-medium text-slate-700">
            Work Mode
            <select
              value={jobForm.workMode}
              onChange={(e) => setJobForm((p) => ({ ...p, workMode: e.target.value }))}
              className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3"
            >
              <option>Hybrid</option>
              <option>Remote</option>
              <option>On-site</option>
            </select>
          </label>
          <label className="text-sm font-medium text-slate-700">
            City
            <input
              value={jobForm.city}
              onChange={(e) => setJobForm((p) => ({ ...p, city: e.target.value }))}
              className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3"
            />
          </label>
          <label className="text-sm font-medium text-slate-700">
            State
            <input
              value={jobForm.state}
              onChange={(e) => setJobForm((p) => ({ ...p, state: e.target.value }))}
              className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3"
            />
          </label>
          <label className="text-sm font-medium text-slate-700">
            Experience
            <input
              value={jobForm.experience}
              onChange={(e) => setJobForm((p) => ({ ...p, experience: e.target.value }))}
              className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3"
              placeholder="Fresher / 1 Year / 2+ Years"
            />
          </label>
          <label className="text-sm font-medium text-slate-700">
            Salary Min
            <input
              type="number"
              min="0"
              value={jobForm.salaryMin}
              onChange={(e) => setJobForm((p) => ({ ...p, salaryMin: e.target.value }))}
              className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3"
            />
          </label>
          <label className="text-sm font-medium text-slate-700">
            Salary Max
            <input
              type="number"
              min="0"
              value={jobForm.salaryMax}
              onChange={(e) => setJobForm((p) => ({ ...p, salaryMax: e.target.value }))}
              className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3"
            />
          </label>
          <label className="text-sm font-medium text-slate-700">
            Job Status
            <select
              value={jobForm.status}
              onChange={(e) => setJobForm((p) => ({ ...p, status: e.target.value }))}
              className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3"
            >
              <option value="active">Active</option>
              <option value="disabled">Disabled</option>
              <option value="closed">Closed</option>
              <option value="draft">Draft</option>
            </select>
          </label>
          <label className="text-sm font-medium text-slate-700 md:col-span-2">
            Overview
            <textarea
              value={jobForm.overview}
              onChange={(e) => setJobForm((p) => ({ ...p, overview: e.target.value }))}
              rows={3}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
            />
          </label>
          <label className="text-sm font-medium text-slate-700 md:col-span-2">
            Requirements
            <textarea
              value={jobForm.requirements}
              onChange={(e) => setJobForm((p) => ({ ...p, requirements: e.target.value }))}
              rows={3}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
            />
          </label>
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
