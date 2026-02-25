
import { useEffect, useMemo, useState } from "react";
import {
  FiActivity,
  FiAlertCircle,
  FiArchive,
  FiAward,
  FiBookOpen,
  FiBriefcase,
  FiCheckCircle,
  FiEdit2,
  FiFileText,
  FiGlobe,
  FiImage,
  FiBell,
  FiPlus,
  FiSearch,
  FiStar,
  FiTrash2,
  FiUsers,
} from "react-icons/fi";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import Modal from "../../components/common/Modal";
import {
  adminBulkContentAction,
  adminDeleteContentItem,
  adminGetContent,
  adminSaveContentItem,
  adminUpdateContentStatus,
} from "../../services/adminService";

const CATEGORY_META = {
  banners: { title: "Homepage Banners", desc: "Manage hero banners and ads", icon: <FiImage /> },
  testimonials: { title: "Testimonials", desc: "Control student testimonials on homepage", icon: <FiStar /> },
  placed: { title: "Placed Students", desc: "Showcase success stories", icon: <FiAward /> },
  internship: { title: "Internship Content", desc: "Publish internship guidance", icon: <FiBriefcase /> },
  interviewQuestions: { title: "Interview Questions", desc: "Manage interview prep content", icon: <FiBookOpen /> },
  mockTests: { title: "Mock Tests", desc: "Create and update mock tests", icon: <FiFileText /> },
  featuredCompanies: { title: "Featured Companies", desc: "Highlight partner companies", icon: <FiUsers /> },
  announcements: { title: "Platform Announcements", desc: "Manage platform notices", icon: <FiBell /> },
};

function statusClass(status) {
  const s = String(status || "").toLowerCase();
  if (["active", "published"].includes(s)) return "bg-green-50 border-green-200 text-green-700";
  if (s === "scheduled") return "bg-blue-50 border-blue-200 text-[#2563EB]";
  if (["expired", "draft"].includes(s)) return "bg-orange-50 border-orange-200 text-[#F97316]";
  if (["archived", "disabled"].includes(s)) return "bg-slate-100 border-slate-200 text-slate-600";
  return "bg-red-50 border-red-200 text-red-600";
}

function priorityClass(priority) {
  const p = String(priority || "low").toLowerCase();
  if (p === "high") return "bg-red-50 border-red-200 text-red-600";
  if (p === "medium") return "bg-orange-50 border-orange-200 text-[#F97316]";
  return "bg-blue-50 border-blue-200 text-[#2563EB]";
}

function getDate(item) {
  return item.startDate || item.createdAt || item.publishDate || item.date || "";
}

function Switch({ checked, onChange }) {
  return (
    <button
      type="button"
      onClick={onChange}
      className={`relative h-6 w-11 rounded-full transition ${checked ? "bg-[#2563EB]" : "bg-slate-300"}`}
    >
      <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition ${checked ? "left-[22px]" : "left-0.5"}`} />
    </button>
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
        <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-blue-50 text-[#2563EB]">{icon}</span>
      </div>
    </div>
  );
}

function CategoryCard({ item, active, onClick }) {
  return (
    <div className={`rounded-2xl border bg-white p-4 shadow-sm transition hover:-translate-y-1 hover:shadow-md ${active ? "border-blue-300" : "border-slate-200"}`}>
      <div className="flex items-start justify-between gap-3">
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 text-[#2563EB]">{item.icon}</span>
        <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs font-semibold text-slate-600">{item.count} items</span>
      </div>
      <h3 className="mt-3 text-sm font-semibold text-[#0F172A]">{item.title}</h3>
      <p className="mt-1 text-xs text-slate-500">{item.desc}</p>
      <button type="button" onClick={onClick} className="mt-4 rounded-lg border border-blue-200 px-3 py-2 text-xs font-semibold text-[#2563EB] hover:bg-blue-50">Manage</button>
    </div>
  );
}

export default function ContentManagement() {
  const [loading, setLoading] = useState(true);
  const [saveBusy, setSaveBusy] = useState(false);
  const [sections, setSections] = useState({
    banners: [],
    testimonials: [],
    placed: [],
    internship: [],
    interviewQuestions: [],
    mockTests: [],
    featuredCompanies: [],
    announcements: [],
  });
  const [activeSection, setActiveSection] = useState("banners");

  const [filters, setFilters] = useState({ search: "", category: "all", status: "all", fromDate: "", toDate: "" });
  const [selectedIds, setSelectedIds] = useState([]);
  const [bulkAction, setBulkAction] = useState("publish");

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    title: "",
    subtitle: "",
    image: "",
    url: "",
    startDate: "",
    endDate: "",
    status: "active",
    description: "",
    priority: "medium",
  });

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res = await adminGetContent();
        setSections({
          banners: Array.isArray(res?.banners) ? res.banners : [],
          testimonials: Array.isArray(res?.testimonials) ? res.testimonials : [],
          placed: Array.isArray(res?.placed) ? res.placed : [],
          internship: Array.isArray(res?.internship) ? res.internship : [],
          interviewQuestions: Array.isArray(res?.interviewQuestions) ? res.interviewQuestions : [],
          mockTests: Array.isArray(res?.mockTests) ? res.mockTests : [],
          featuredCompanies: Array.isArray(res?.featuredCompanies) ? res.featuredCompanies : [],
          announcements: Array.isArray(res?.announcements) ? res.announcements : [],
        });
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  const cards = useMemo(() => Object.entries(CATEGORY_META).map(([key, m]) => ({ key, ...m, count: sections[key]?.length || 0 })), [sections]);
  const allItems = useMemo(() => Object.values(sections).flat(), [sections]);

  const analytics = useMemo(() => {
    const published = allItems.filter((x) => ["published", "active", "scheduled"].includes(String(x.status || "").toLowerCase())).length;
    const drafts = allItems.filter((x) => ["draft", "disabled", "archived"].includes(String(x.status || "").toLowerCase())).length;
    const clickRate = 6.8;
    const mostViewedSection = Object.entries(sections).map(([key, items]) => ({ key, views: items.reduce((a, b) => a + Number(b.views || 0), 0) })).sort((a, b) => b.views - a.views)[0]?.key || "internship";
    const trend = ["W1", "W2", "W3", "W4", "W5", "W6"].map((label, idx) => ({ label, value: Math.max(15, Math.round((published || 30) * (0.5 + idx * 0.1))) }));
    return { published, drafts, clickRate, mostViewedSection, trend };
  }, [allItems, sections]);

  const rows = useMemo(() => {
    const list = sections[activeSection] || [];
    const q = filters.search.trim().toLowerCase();
    return list.filter((x) => {
      const bag = `${x.title || x.name || ""} ${x.subtitle || ""} ${x.description || ""} ${x.company || ""}`.toLowerCase();
      const s = String(x.status || "").toLowerCase();
      const d = Date.parse(getDate(x));
      const from = filters.fromDate ? Date.parse(filters.fromDate) : 0;
      const to = filters.toDate ? Date.parse(filters.toDate) : 0;
      return (!q || bag.includes(q)) && (filters.category === "all" || activeSection === filters.category) && (filters.status === "all" || s === filters.status) && (!from || !Number.isFinite(d) || d >= from) && (!to || !Number.isFinite(d) || d <= to);
    });
  }, [sections, activeSection, filters]);

  const allSelected = rows.length > 0 && rows.every((x) => selectedIds.includes(x.id));

  const resetForm = () => setForm({ title: "", subtitle: "", image: "", url: "", startDate: "", endDate: "", status: "active", description: "", priority: "medium" });
  const openCreate = () => { setEditing(null); resetForm(); setModalOpen(true); };

  const openEdit = (item) => {
    setEditing(item);
    setForm({
      title: item.title || item.name || "",
      subtitle: item.subtitle || item.designation || "",
      image: item.image || "",
      url: item.url || "",
      startDate: item.startDate || item.createdAt || item.publishDate || "",
      endDate: item.endDate || "",
      status: item.status || "active",
      description: item.description || item.quote || item.story || "",
      priority: item.priority || "medium",
    });
    setModalOpen(true);
  };

  const saveItem = async () => {
    setSaveBusy(true);
    try {
      const payload = {
        ...(editing || {}),
        id: editing?.id,
        section: activeSection,
        title: form.title,
        name: activeSection === "testimonials" || activeSection === "placed" ? form.title : undefined,
        subtitle: form.subtitle,
        designation: activeSection === "testimonials" ? form.subtitle : undefined,
        image: form.image,
        url: form.url,
        startDate: form.startDate,
        endDate: form.endDate,
        status: form.status,
        description: form.description,
        quote: activeSection === "testimonials" ? form.description : undefined,
        story: activeSection === "placed" ? form.description : undefined,
        priority: form.priority,
        showOnHomepage: editing?.showOnHomepage ?? true,
      };

      const res = await adminSaveContentItem(payload);
      const item = res?.item;
      if (!item) return;

      setSections((prev) => {
        const current = prev[activeSection] || [];
        const exists = current.some((x) => x.id === item.id);
        return {
          ...prev,
          [activeSection]: exists
            ? current.map((x) => (x.id === item.id ? item : x))
            : [item, ...current],
        };
      });
      setModalOpen(false);
    } finally {
      setSaveBusy(false);
    }
  };

  const updateRows = (mutate) =>
    setSections((prev) => ({
      ...prev,
      [activeSection]: mutate(prev[activeSection] || []),
    }));

  const onDelete = async (row) => {
    await adminDeleteContentItem(row.id);
    updateRows((list) => list.filter((x) => x.id !== row.id));
    setSelectedIds((prev) => prev.filter((id) => id !== row.id));
  };

  const onToggle = async (row, nextStatus) => {
    const res = await adminUpdateContentStatus(row.id, nextStatus);
    const item = res?.item;
    if (!item) return;
    updateRows((list) => list.map((x) => (x.id === row.id ? item : x)));
  };

  const onToggleHomepage = async (row) => {
    const payload = {
      ...row,
      id: row.id,
      section: activeSection,
      showOnHomepage: !row.showOnHomepage,
    };
    const res = await adminSaveContentItem(payload);
    const item = res?.item;
    if (!item) return;
    updateRows((list) => list.map((x) => (x.id === row.id ? item : x)));
  };

  const onApplyBulk = async () => {
    if (!selectedIds.length) return;
    await adminBulkContentAction(selectedIds, bulkAction);

    if (bulkAction === "delete") {
      updateRows((list) => list.filter((x) => !selectedIds.includes(x.id)));
    } else {
      const nextStatus = bulkAction === "publish" ? "published" : "archived";
      updateRows((list) =>
        list.map((x) =>
          selectedIds.includes(x.id)
            ? {
                ...x,
                status: nextStatus,
              }
            : x,
        ),
      );
    }

    setSelectedIds([]);
  };
  const onExport = () => {
    const headers = ["Title", "Status", "Date", "Category"];
    const lines = rows.map((x) => [x.title || x.name, x.status, getDate(x), CATEGORY_META[activeSection].title]);
    const csv = [headers, ...lines].map((row) => row.map((v) => `"${String(v ?? "").replaceAll('"', '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `content_${activeSection}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <section>
        <h1 className="text-2xl font-bold text-[#0F172A] sm:text-3xl">Content Management</h1>
        <p className="mt-1 text-sm text-slate-500">Manage website content, banners, and informational sections</p>
        <p className="mt-2 text-xs font-medium text-slate-400">Dashboard &gt; Content Management</p>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Total Published Content" value={analytics.published} trend="+12 this month" icon={<FiCheckCircle />} />
        <StatCard title="Draft Content" value={analytics.drafts} trend="Needs review" icon={<FiArchive />} />
        <StatCard title="Homepage Click Rate" value={`${analytics.clickRate}%`} trend="+1.4% this week" icon={<FiActivity />} />
        <StatCard title="Most Viewed Section" value={CATEGORY_META[analytics.mostViewedSection]?.title || "Internship"} trend="Top engagement" icon={<FiGlobe />} />
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-lg font-semibold text-[#0F172A]">Content Categories</h2>
        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {cards.map((c) => (
            <CategoryCard key={c.key} item={c} active={activeSection === c.key} onClick={() => { setActiveSection(c.key); setSelectedIds([]); }} />
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-lg font-semibold text-[#0F172A]">{CATEGORY_META[activeSection]?.title}</h3>
            <p className="text-sm text-slate-500">{CATEGORY_META[activeSection]?.desc}</p>
          </div>
          <button type="button" onClick={openCreate} className="inline-flex items-center gap-2 rounded-xl bg-[#2563EB] px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">
            <FiPlus /> {activeSection === "banners" ? "Add New Banner" : "Create New Content"}
          </button>
        </div>

        <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
          <div className="relative xl:col-span-2">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={filters.search} onChange={(e) => setFilters((p) => ({ ...p, search: e.target.value }))} placeholder="Search content" className="h-10 w-full rounded-lg border border-slate-200 pl-9 pr-3 text-sm outline-none focus:border-blue-300" />
          </div>
          <select value={filters.category} onChange={(e) => setFilters((p) => ({ ...p, category: e.target.value }))} className="h-10 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-blue-300">
            <option value="all">All Categories</option>
            {Object.entries(CATEGORY_META).map(([key, meta]) => <option key={key} value={key}>{meta.title}</option>)}
          </select>
          <select value={filters.status} onChange={(e) => setFilters((p) => ({ ...p, status: e.target.value }))} className="h-10 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-blue-300">
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="scheduled">Scheduled</option>
            <option value="expired">Expired</option>
            <option value="disabled">Disabled</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
            <option value="archived">Archived</option>
          </select>
          <button type="button" onClick={onExport} className="h-10 rounded-lg border border-blue-200 px-3 text-sm font-semibold text-[#2563EB] hover:bg-blue-50">Export</button>
        </div>

        <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-2">
          <input type="date" value={filters.fromDate} onChange={(e) => setFilters((p) => ({ ...p, fromDate: e.target.value }))} className="h-10 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-blue-300" />
          <input type="date" value={filters.toDate} onChange={(e) => setFilters((p) => ({ ...p, toDate: e.target.value }))} className="h-10 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-blue-300" />
        </div>

        {selectedIds.length > 0 ? (
          <div className="mb-3 rounded-xl border border-blue-200 bg-blue-50 px-3 py-2">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-semibold text-[#2563EB]">{selectedIds.length} selected</p>
              <select value={bulkAction} onChange={(e) => setBulkAction(e.target.value)} className="h-9 rounded-lg border border-blue-200 bg-white px-2 text-sm">
                <option value="publish">Publish Selected</option>
                <option value="archive">Archive Selected</option>
                <option value="delete">Delete Selected</option>
              </select>
              <button type="button" onClick={onApplyBulk} className="h-9 rounded-lg bg-[#2563EB] px-3 text-sm font-semibold text-white hover:bg-blue-700">Apply</button>
            </div>
          </div>
        ) : null}

        {activeSection === "placed" || activeSection === "announcements" ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {rows.map((row) => (
              <div key={row.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="mb-3 flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-[#0F172A]">{row.title || row.name}</p>
                    <p className="text-xs text-slate-500">{row.company || row.subtitle || row.publishDate}</p>
                  </div>
                  <input type="checkbox" checked={selectedIds.includes(row.id)} onChange={(e) => setSelectedIds((prev) => (e.target.checked ? [...new Set([...prev, row.id])] : prev.filter((x) => x !== row.id)))} className="h-4 w-4 rounded border-slate-300 text-[#2563EB]" />
                </div>
                {activeSection === "placed" ? (
                  <>
                    <p className="text-sm text-slate-600">{row.story}</p>
                    <p className="mt-2 text-sm font-semibold text-[#F97316]">{row.salary}</p>
                    <div className="mt-3 flex items-center justify-between">
                      <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold capitalize ${statusClass(row.status)}`}>{row.status}</span>
                      <Switch checked={String(row.status).toLowerCase() === "published"} onChange={() => onToggle(row, String(row.status).toLowerCase() === "published" ? "draft" : "published")} />
                    </div>
                  </>
                ) : (
                  <>
                    <p className="text-sm text-slate-600">{row.description}</p>
                    <div className="mt-3 flex items-center gap-2">
                      <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold capitalize ${priorityClass(row.priority)}`}>{row.priority}</span>
                      <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold capitalize ${statusClass(row.status)}`}>{row.status}</span>
                    </div>
                  </>
                )}
                <div className="mt-3 flex items-center gap-2">
                  <button type="button" onClick={() => openEdit(row)} className="rounded-lg border border-blue-200 px-2.5 py-1.5 text-xs font-semibold text-[#2563EB] hover:bg-blue-50">Edit</button>
                  <button type="button" onClick={() => onDelete(row)} className="rounded-lg border border-red-200 px-2.5 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50">Delete</button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3"><input type="checkbox" checked={allSelected} onChange={(e) => setSelectedIds(e.target.checked ? rows.map((x) => x.id) : [])} className="h-4 w-4 rounded border-slate-300 text-[#2563EB]" /></th>
                  {activeSection === "banners" ? <th className="px-4 py-3">Preview</th> : null}
                  <th className="px-4 py-3">{activeSection === "testimonials" ? "Name" : "Title"}</th>
                  {activeSection === "testimonials" ? <th className="px-4 py-3">Designation</th> : null}
                  <th className="px-4 py-3">{activeSection === "testimonials" ? "Company" : "Category"}</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id} className="border-t border-slate-100 transition hover:bg-blue-50/40">
                    <td className="px-4 py-3"><input type="checkbox" checked={selectedIds.includes(row.id)} onChange={(e) => setSelectedIds((prev) => (e.target.checked ? [...new Set([...prev, row.id])] : prev.filter((x) => x !== row.id)))} className="h-4 w-4 rounded border-slate-300 text-[#2563EB]" /></td>
                    {activeSection === "banners" ? <td className="px-4 py-3"><div className="h-10 w-16 rounded-lg border border-slate-200 bg-slate-100 text-[10px] text-slate-500 flex items-center justify-center">IMG</div></td> : null}
                    <td className="px-4 py-3"><p className="font-semibold text-slate-800">{row.title || row.name}</p><p className="text-xs text-slate-500">{row.subtitle || row.quote || row.url || "-"}</p></td>
                    {activeSection === "testimonials" ? <td className="px-4 py-3 text-slate-700">{row.designation}</td> : null}
                    <td className="px-4 py-3 text-slate-700">{row.company || row.category || "-"}</td>
                    <td className="px-4 py-3 text-slate-600">{getDate(row) || "-"}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold capitalize ${statusClass(row.status)}`}>{row.status}</span>
                        {activeSection === "testimonials" ? (
                          <Switch checked={!!row.showOnHomepage} onChange={() => onToggleHomepage(row)} />
                        ) : null}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button type="button" onClick={() => openEdit(row)} className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-blue-200 text-[#2563EB] hover:bg-blue-50"><FiEdit2 /></button>
                        <button type="button" onClick={() => onToggle(row, String(row.status).toLowerCase() === "disabled" ? "active" : "disabled")} className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-orange-200 text-[#F97316] hover:bg-orange-50"><FiAlertCircle /></button>
                        <button type="button" onClick={() => onDelete(row)} className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-red-200 text-red-600 hover:bg-red-50"><FiTrash2 /></button>
                      </div>
                    </td>
                  </tr>
                ))}
                {!rows.length ? <tr className="border-t border-slate-100"><td colSpan={8} className="px-4 py-12 text-center text-sm text-slate-500">No content found.</td></tr> : null}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <h3 className="text-sm font-semibold text-[#0F172A]">Engagement Trend</h3>
        <div className="mt-3 h-56">
          <ResponsiveContainer width="100%" height="100%" minWidth={320} minHeight={220}>
            <LineChart data={analytics.trend}>
              <CartesianGrid stroke="#E2E8F0" strokeDasharray="3 3" />
              <XAxis dataKey="label" tick={{ fill: "#64748B", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#64748B", fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip />
              <Line type="monotone" dataKey="value" stroke="#2563EB" strokeWidth={3} dot={{ r: 4, fill: "#2563EB" }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? "Edit Content" : "Add Content"}
        widthClass="max-w-3xl"
        footer={
          <>
            <button type="button" onClick={() => setModalOpen(false)} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50">Cancel</button>
            <button type="button" disabled={saveBusy} onClick={saveItem} className="rounded-lg bg-[#2563EB] px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70">{saveBusy ? "Saving..." : "Save"}</button>
          </>
        }
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <label className="text-sm font-medium text-slate-600">Title<input value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 outline-none focus:border-blue-300" /></label>
          <label className="text-sm font-medium text-slate-600">Subtitle<input value={form.subtitle} onChange={(e) => setForm((p) => ({ ...p, subtitle: e.target.value }))} className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 outline-none focus:border-blue-300" /></label>
          <label className="text-sm font-medium text-slate-600">Upload Image URL<input value={form.image} onChange={(e) => setForm((p) => ({ ...p, image: e.target.value }))} className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 outline-none focus:border-blue-300" /></label>
          <label className="text-sm font-medium text-slate-600">Redirect URL<input value={form.url} onChange={(e) => setForm((p) => ({ ...p, url: e.target.value }))} className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 outline-none focus:border-blue-300" /></label>
          <label className="text-sm font-medium text-slate-600">Start Date<input type="date" value={form.startDate} onChange={(e) => setForm((p) => ({ ...p, startDate: e.target.value }))} className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 outline-none focus:border-blue-300" /></label>
          <label className="text-sm font-medium text-slate-600">End Date<input type="date" value={form.endDate} onChange={(e) => setForm((p) => ({ ...p, endDate: e.target.value }))} className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 outline-none focus:border-blue-300" /></label>
          <label className="text-sm font-medium text-slate-600">Status<select value={form.status} onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))} className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 outline-none focus:border-blue-300"><option value="active">Active</option><option value="scheduled">Scheduled</option><option value="expired">Expired</option><option value="disabled">Disabled</option><option value="published">Published</option><option value="draft">Draft</option><option value="archived">Archived</option></select></label>
          <label className="text-sm font-medium text-slate-600">Priority<select value={form.priority} onChange={(e) => setForm((p) => ({ ...p, priority: e.target.value }))} className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 outline-none focus:border-blue-300"><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option></select></label>
          <label className="md:col-span-2 text-sm font-medium text-slate-600">Description (Rich Text)<textarea value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} rows={5} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 outline-none focus:border-blue-300" /></label>
          <div className="md:col-span-2 rounded-lg border border-slate-200 bg-slate-50/70 p-3"><p className="text-xs font-semibold text-slate-500">Preview</p><p className="mt-1 text-sm text-slate-700">{form.description || "Content preview appears here."}</p></div>
        </div>
      </Modal>

      {loading ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="h-4 w-1/3 animate-pulse rounded bg-slate-100" />
          <div className="mt-3 h-4 w-2/3 animate-pulse rounded bg-slate-100" />
          <div className="mt-5 h-48 animate-pulse rounded-xl bg-slate-100" />
        </div>
      ) : null}
    </div>
  );
}







