import { useEffect, useMemo, useState } from "react";
import {
  FiCheckCircle,
  FiClock,
  FiDownload,
  FiEdit2,
  FiExternalLink,
  FiEye,
  FiFileText,
  FiLink,
  FiPlay,
  FiPlus,
  FiSearch,
  FiTrash2,
  FiUploadCloud,
} from "react-icons/fi";

import Modal from "../../components/common/Modal";
import {
  adminBulkGovUpdates,
  adminDeleteGovUpdate,
  adminListGovUpdates,
  adminSaveGovUpdate,
  adminUpdateGovStatus,
} from "../../services/adminService";

const STATES = ["All", "Telangana", "Andhra Pradesh", "Karnataka", "Maharashtra", "Tamil Nadu"];
const DEPARTMENTS = ["All", "Railway", "Banking", "SSC", "UPSC", "Defense", "State Public Service"];
const JOB_TYPES = ["All", "Central", "State", "PSU"];

function statusClass(status) {
  const s = String(status || "").toLowerCase();
  if (s === "published") return "bg-green-50 border-green-200 text-green-700";
  if (s === "draft") return "bg-orange-50 border-orange-200 text-[#F97316]";
  return "bg-red-50 border-red-200 text-red-600";
}

function StatCard({ title, value, icon }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-1 hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{title}</p>
          <p className="mt-2 text-2xl font-bold text-[#0F172A]">{value}</p>
        </div>
        <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-blue-50 text-[#2563EB]">
          {icon}
        </span>
      </div>
    </div>
  );
}

export default function GovernmentUpdates() {
  const [loading, setLoading] = useState(true);
  const [saveBusy, setSaveBusy] = useState(false);
  const [list, setList] = useState([]);

  const [filters, setFilters] = useState({
    q: "",
    status: "all",
    state: "all",
    department: "all",
    jobType: "all",
    deadline: "all",
  });

  const [selectedIds, setSelectedIds] = useState([]);
  const [bulkAction, setBulkAction] = useState("publish");

  const [editorOpen, setEditorOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [previewItem, setPreviewItem] = useState(null);

  const [form, setForm] = useState({
    title: "",
    department: "Railway",
    state: "Telangana",
    jobType: "Central",
    officialWebsite: "",
    applicationStartDate: "",
    applicationEndDate: "",
    shortDescription: "",
    fullDescription: "",
    attachmentType: "PDF",
    attachmentUrl: "",
    imageUrl: "",
    videoUrl: "",
    externalUrl: "",
    metaTitle: "",
    metaDescription: "",
    status: "draft",
  });

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res = await adminListGovUpdates();
        setList(Array.isArray(res) ? res : []);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  const filtered = useMemo(() => {
    const q = filters.q.trim().toLowerCase();
    return list.filter((row) => {
      const matchQ = !q || `${row.title} ${row.department} ${row.state}`.toLowerCase().includes(q);
      const matchStatus = filters.status === "all" || String(row.status).toLowerCase() === filters.status;
      const matchState = filters.state === "all" || row.state === filters.state;
      const matchDepartment = filters.department === "all" || row.department === filters.department;
      const matchType = filters.jobType === "all" || row.jobType === filters.jobType;
      const deadlineTs = Date.parse(row.applicationDeadline || "");
      const matchDeadline =
        filters.deadline === "all" ||
        (!Number.isNaN(deadlineTs) &&
          (filters.deadline === "upcoming" ? deadlineTs >= Date.now() : deadlineTs < Date.now()));

      return matchQ && matchStatus && matchState && matchDepartment && matchType && matchDeadline;
    });
  }, [list, filters]);

  const stats = useMemo(() => {
    const total = list.length;
    const published = list.filter((x) => x.status === "published").length;
    const draft = list.filter((x) => x.status === "draft").length;
    const expired = list.filter((x) => x.status === "expired").length;
    return { total, published, draft, expired };
  }, [list]);

  const openCreate = () => {
    setEditing(null);
    setForm({
      title: "",
      department: "Railway",
      state: "Telangana",
      jobType: "Central",
      officialWebsite: "",
      applicationStartDate: "",
      applicationEndDate: "",
      shortDescription: "",
      fullDescription: "",
      attachmentType: "PDF",
      attachmentUrl: "",
      imageUrl: "",
      videoUrl: "",
      externalUrl: "",
      metaTitle: "",
      metaDescription: "",
      status: "draft",
    });
    setEditorOpen(true);
  };

  const openEdit = (row) => {
    setEditing(row);
    setForm({ ...row });
    setEditorOpen(true);
  };

  const saveUpdate = async (overrideStatus) => {
    setSaveBusy(true);
    try {
      const res = await adminSaveGovUpdate({
        ...form,
        id: editing?.id,
        status: overrideStatus || form.status,
      });

      const row = res?.row;
      if (!row) return;

      setList((prev) => {
        const exists = prev.some((x) => x.id === row.id);
        return exists ? prev.map((x) => (x.id === row.id ? row : x)) : [row, ...prev];
      });

      setEditorOpen(false);
      setEditing(null);
    } finally {
      setSaveBusy(false);
    }
  };

  const onDelete = async (row) => {
    await adminDeleteGovUpdate(row.id);
    setList((prev) => prev.filter((x) => x.id !== row.id));
    setSelectedIds((prev) => prev.filter((id) => id !== row.id));
  };

  const onTogglePublish = async (row) => {
    const nextStatus = row.status === "published" ? "draft" : "published";
    const res = await adminUpdateGovStatus(row.id, nextStatus);
    const nextRow = res?.row;
    if (!nextRow) return;
    setList((prev) => prev.map((x) => (x.id === row.id ? nextRow : x)));
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

  const onApplyBulk = async () => {
    if (!selectedIds.length) return;

    await adminBulkGovUpdates(selectedIds, bulkAction);

    if (bulkAction === "delete") {
      setList((prev) => prev.filter((x) => !selectedIds.includes(x.id)));
      setSelectedIds([]);
      return;
    }

    const status = bulkAction === "publish" ? "published" : "draft";
    setList((prev) => prev.map((x) => (selectedIds.includes(x.id) ? { ...x, status } : x)));
    setSelectedIds([]);
  };

  const onExport = () => {
    const headers = ["Title", "Department", "State", "Deadline", "Posted", "Status"];
    const lines = filtered.map((x) => [x.title, x.department, x.state, x.applicationDeadline, x.postedDate, x.status]);
    const csv = [headers, ...lines]
      .map((row) => row.map((v) => `"${String(v ?? "").replaceAll('"', '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "government_updates.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const allSelected = filtered.length > 0 && filtered.every((row) => selectedIds.includes(row.id));

  return (
    <div className="space-y-6">
      <section>
        <h1 className="text-2xl font-bold text-[#0F172A] sm:text-3xl">Government Job Updates</h1>
        <p className="mt-1 text-sm text-slate-500">Manage official job notifications and public sector opportunities</p>
        <p className="mt-2 text-xs font-medium text-slate-400">Dashboard &gt; Government Updates</p>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="grid w-full grid-cols-1 gap-3 lg:grid-cols-3 xl:grid-cols-6">
            <div className="relative xl:col-span-2">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={filters.q}
                onChange={(e) => setFilters((p) => ({ ...p, q: e.target.value }))}
                placeholder="Search by title, department, state..."
                className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm outline-none focus:border-blue-300 focus:bg-white"
              />
            </div>
            <select value={filters.status} onChange={(e) => setFilters((p) => ({ ...p, status: e.target.value }))} className="h-11 rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-blue-300">
              <option value="all">Status: All</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
              <option value="expired">Expired</option>
            </select>
            <select value={filters.state} onChange={(e) => setFilters((p) => ({ ...p, state: e.target.value }))} className="h-11 rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-blue-300">
              {STATES.map((x) => <option key={x} value={x.toLowerCase() === "all" ? "all" : x}>{`State: ${x}`}</option>)}
            </select>
            <select value={filters.department} onChange={(e) => setFilters((p) => ({ ...p, department: e.target.value }))} className="h-11 rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-blue-300">
              {DEPARTMENTS.map((x) => <option key={x} value={x.toLowerCase() === "all" ? "all" : x}>{`Department: ${x}`}</option>)}
            </select>
            <div className="grid grid-cols-2 gap-3">
              <select value={filters.jobType} onChange={(e) => setFilters((p) => ({ ...p, jobType: e.target.value }))} className="h-11 rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-blue-300">
                {JOB_TYPES.map((x) => <option key={x} value={x.toLowerCase() === "all" ? "all" : x}>{x === "All" ? "Job Type" : x}</option>)}
              </select>
              <select value={filters.deadline} onChange={(e) => setFilters((p) => ({ ...p, deadline: e.target.value }))} className="h-11 rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-blue-300">
                <option value="all">Deadline</option>
                <option value="upcoming">Upcoming</option>
                <option value="expired">Expired</option>
              </select>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 xl:justify-end">
            <button type="button" onClick={onExport} className="h-11 rounded-xl border border-blue-200 bg-white px-3 text-sm font-semibold text-[#2563EB] hover:bg-blue-50">
              Export
            </button>
            <button type="button" onClick={openCreate} className="h-11 rounded-xl bg-[#2563EB] px-3 text-sm font-semibold text-white hover:bg-blue-700">
              <span className="inline-flex items-center gap-2"><FiPlus /> Add New Update</span>
            </button>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Total Updates" value={stats.total} icon={<FiFileText />} />
        <StatCard title="Published" value={stats.published} icon={<FiCheckCircle />} />
        <StatCard title="Draft" value={stats.draft} icon={<FiClock />} />
        <StatCard title="Expired" value={stats.expired} icon={<FiClock />} />
      </section>

      {selectedIds.length > 0 ? (
        <section className="sticky top-[86px] z-20 rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 shadow-sm">
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-sm font-semibold text-[#2563EB]">{selectedIds.length} selected</p>
            <select value={bulkAction} onChange={(e) => setBulkAction(e.target.value)} className="h-10 rounded-lg border border-blue-200 bg-white px-3 text-sm outline-none">
              <option value="publish">Publish Selected</option>
              <option value="unpublish">Unpublish Selected</option>
              <option value="delete">Delete Selected</option>
            </select>
            <button type="button" onClick={onApplyBulk} className="h-10 rounded-lg bg-[#2563EB] px-3 text-sm font-semibold text-white hover:bg-blue-700">
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
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="hidden overflow-x-auto md:block">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">
                    <input type="checkbox" checked={allSelected} onChange={(e) => onToggleSelectAll(e.target.checked)} className="h-4 w-4 rounded border-slate-300 text-[#2563EB]" />
                  </th>
                  <th className="px-4 py-3">Title</th>
                  <th className="px-4 py-3">Department</th>
                  <th className="px-4 py-3">State</th>
                  <th className="px-4 py-3">Application Deadline</th>
                  <th className="px-4 py-3">Posted Date</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Attachment</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((row) => (
                  <tr key={row.id} className="border-t border-slate-100 transition hover:bg-blue-50/40">
                    <td className="px-4 py-3">
                      <input type="checkbox" checked={selectedIds.includes(row.id)} onChange={(e) => onToggleSelect(row.id, e.target.checked)} className="h-4 w-4 rounded border-slate-300 text-[#2563EB]" />
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-slate-800">{row.title}</p>
                      <p className="text-xs text-slate-500">{row.jobType}</p>
                    </td>
                    <td className="px-4 py-3 text-slate-700">{row.department}</td>
                    <td className="px-4 py-3 text-slate-700">{row.state}</td>
                    <td className="px-4 py-3 font-medium text-[#F97316]">{row.applicationDeadline}</td>
                    <td className="px-4 py-3 text-slate-600">{row.postedDate}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold capitalize ${statusClass(row.status)}`}>{row.status}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {row.attachmentType === "VIDEO" ? <FiPlay className="text-[#2563EB]" /> : row.attachmentType === "LINK" ? <FiExternalLink className="text-[#2563EB]" /> : <FiFileText className="text-[#2563EB]" />}
                        <a href={row.attachmentUrl || "#"} target="_blank" rel="noreferrer" className="text-xs font-semibold text-[#2563EB] hover:underline">View</a>
                        <button type="button" onClick={() => window.open(row.attachmentUrl || "#", "_blank")} className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-blue-200 text-[#2563EB] hover:bg-blue-50">
                          <FiDownload className="text-xs" />
                        </button>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1.5">
                        <button type="button" title="View" onClick={() => { setPreviewItem(row); setPreviewOpen(true); }} className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-blue-200 text-[#2563EB] hover:bg-blue-50"><FiEye /></button>
                        <button type="button" title="Edit" onClick={() => openEdit(row)} className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-orange-200 text-[#F97316] hover:bg-orange-50"><FiEdit2 /></button>
                        <button type="button" title="Unpublish" onClick={() => onTogglePublish(row)} className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-red-200 text-red-600 hover:bg-red-50"><FiUploadCloud /></button>
                        <button type="button" title="Delete" onClick={() => onDelete(row)} className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-red-200 text-red-600 hover:bg-red-50"><FiTrash2 /></button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 ? (
                  <tr className="border-t border-slate-100">
                    <td colSpan={9} className="px-4 py-12 text-center text-sm text-slate-500">No updates found.</td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>

          <div className="space-y-3 p-4 md:hidden">
            {filtered.map((row) => (
              <div key={row.id} className="rounded-xl border border-slate-200 p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-800">{row.title}</p>
                    <p className="text-xs text-slate-500">{row.department} - {row.state}</p>
                  </div>
                  <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold capitalize ${statusClass(row.status)}`}>{row.status}</span>
                </div>
                <p className="mt-2 text-xs text-[#F97316]">Deadline: {row.applicationDeadline}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <Modal
        open={editorOpen}
        onClose={() => setEditorOpen(false)}
        title={editing ? "Edit Government Update" : "Add Government Update"}
        widthClass="max-w-4xl"
        footer={
          <>
            <button type="button" disabled={saveBusy} onClick={() => saveUpdate("draft")} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-70">
              Save as Draft
            </button>
            <button type="button" disabled={saveBusy} onClick={() => saveUpdate("published")} className="rounded-lg bg-[#2563EB] px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70">
              {saveBusy ? "Saving..." : "Publish"}
            </button>
          </>
        }
      >
        <div className="space-y-5">
          <section>
            <h4 className="text-sm font-semibold text-[#0F172A]">Basic Information</h4>
            <div className="mt-3 grid grid-cols-1 gap-4 md:grid-cols-2">
              <input value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} placeholder="Title" className="h-10 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-blue-300" />
              <select value={form.department} onChange={(e) => setForm((p) => ({ ...p, department: e.target.value }))} className="h-10 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-blue-300">{DEPARTMENTS.slice(1).map((x) => <option key={x}>{x}</option>)}</select>
              <select value={form.state} onChange={(e) => setForm((p) => ({ ...p, state: e.target.value }))} className="h-10 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-blue-300">{STATES.slice(1).map((x) => <option key={x}>{x}</option>)}</select>
              <select value={form.jobType} onChange={(e) => setForm((p) => ({ ...p, jobType: e.target.value }))} className="h-10 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-blue-300">{JOB_TYPES.slice(1).map((x) => <option key={x}>{x}</option>)}</select>
              <input value={form.officialWebsite} onChange={(e) => setForm((p) => ({ ...p, officialWebsite: e.target.value }))} placeholder="Official Website Link" className="h-10 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-blue-300" />
              <input type="date" value={form.applicationStartDate} onChange={(e) => setForm((p) => ({ ...p, applicationStartDate: e.target.value }))} className="h-10 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-blue-300" />
              <input type="date" value={form.applicationEndDate} onChange={(e) => setForm((p) => ({ ...p, applicationEndDate: e.target.value }))} className="h-10 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-blue-300" />
            </div>
          </section>

          <section>
            <h4 className="text-sm font-semibold text-[#0F172A]">Content Section</h4>
            <div className="mt-3 space-y-3">
              <input value={form.shortDescription} onChange={(e) => setForm((p) => ({ ...p, shortDescription: e.target.value }))} placeholder="Short Description" className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-blue-300" />
              <textarea value={form.fullDescription} onChange={(e) => setForm((p) => ({ ...p, fullDescription: e.target.value }))} rows={4} placeholder="Full Description (Rich Text)" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-300" />
            </div>
          </section>

          <section>
            <h4 className="text-sm font-semibold text-[#0F172A]">Attachment Section</h4>
            <div className="mt-3 grid grid-cols-1 gap-4 md:grid-cols-2">
              <select value={form.attachmentType} onChange={(e) => setForm((p) => ({ ...p, attachmentType: e.target.value }))} className="h-10 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-blue-300">
                <option value="PDF">PDF</option>
                <option value="VIDEO">Video</option>
                <option value="LINK">External Link</option>
              </select>
              <input value={form.attachmentUrl} onChange={(e) => setForm((p) => ({ ...p, attachmentUrl: e.target.value }))} placeholder="Attachment URL" className="h-10 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-blue-300" />
              <input value={form.imageUrl} onChange={(e) => setForm((p) => ({ ...p, imageUrl: e.target.value }))} placeholder="Banner Image URL" className="h-10 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-blue-300" />
              <input value={form.videoUrl} onChange={(e) => setForm((p) => ({ ...p, videoUrl: e.target.value }))} placeholder="Video URL" className="h-10 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-blue-300" />
              <input value={form.externalUrl} onChange={(e) => setForm((p) => ({ ...p, externalUrl: e.target.value }))} placeholder="External Link" className="h-10 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-blue-300" />
            </div>
          </section>

          <section>
            <h4 className="text-sm font-semibold text-[#0F172A]">SEO Section</h4>
            <div className="mt-3 grid grid-cols-1 gap-4">
              <input value={form.metaTitle} onChange={(e) => setForm((p) => ({ ...p, metaTitle: e.target.value }))} placeholder="Meta Title" className="h-10 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-blue-300" />
              <textarea value={form.metaDescription} onChange={(e) => setForm((p) => ({ ...p, metaDescription: e.target.value }))} rows={3} placeholder="Meta Description" className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-300" />
            </div>
          </section>

          <section className="flex items-center gap-2">
            <FiLink className="text-[#2563EB]" />
            <span className="text-sm font-medium text-slate-600">Status</span>
            <select value={form.status} onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))} className="h-9 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-blue-300">
              <option value="draft">Draft</option>
              <option value="published">Publish</option>
              <option value="expired">Expired</option>
            </select>
          </section>

          <button type="button" onClick={() => saveUpdate(form.status)} className="hidden" aria-hidden="true" />
        </div>
      </Modal>

      <Modal
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        title="Update Preview"
        widthClass="max-w-3xl"
        footer={
          <button type="button" onClick={() => setPreviewOpen(false)} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50">
            Close
          </button>
        }
      >
        {previewItem ? (
          <div className="space-y-4">
            <div className="h-40 w-full rounded-xl border border-slate-200 bg-slate-100 flex items-center justify-center text-slate-400">
              {previewItem.imageUrl ? <img src={previewItem.imageUrl} alt={previewItem.title} className="h-full w-full rounded-xl object-cover" /> : "Banner Preview"}
            </div>
            <h3 className="text-xl font-semibold text-[#0F172A]">{previewItem.title}</h3>
            <p className="text-sm text-slate-600">{previewItem.department} - {previewItem.state}</p>
            <p className="text-sm font-semibold text-[#F97316]">Application Deadline: {previewItem.applicationDeadline}</p>
            <p className="text-sm text-slate-700">{previewItem.fullDescription || previewItem.shortDescription}</p>
            <div className="flex flex-wrap gap-2">
              <a href={previewItem.attachmentUrl || "#"} target="_blank" rel="noreferrer" className="rounded-lg border border-blue-200 px-3 py-2 text-sm font-semibold text-[#2563EB] hover:bg-blue-50">
                Download PDF
              </a>
              <a href={previewItem.officialWebsite || "#"} target="_blank" rel="noreferrer" className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                Official Website
              </a>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
