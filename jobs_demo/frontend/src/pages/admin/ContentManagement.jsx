import { useEffect, useMemo, useRef, useState } from "react";
import {
  FiAlertCircle,
  FiBell,
  FiEdit2,
  FiFileText,
  FiGlobe,
  FiImage,
  FiPlus,
  FiSearch,
  FiTrash2,
  FiUsers,
} from "react-icons/fi";
import { CartesianGrid, Line, LineChart, Tooltip, XAxis, YAxis } from "recharts";

import Modal from "../../components/common/Modal";
import {
  adminBulkContentAction,
  adminDeleteContentItem,
  adminGetContent,
  adminSaveContentItem,
  adminUpdateContentStatus,
} from "../../services/adminService";
import uploadService from "../../services/uploadService.js";
import { toAbsoluteMediaUrl } from "../../utils/media.js";

const CATEGORY_META = {
  homeSlides: { title: "Home Slides", desc: "Student homepage slideshow images", icon: <FiImage /> },
  publicPages: { title: "Public Pages", desc: "About/Contact content blocks", icon: <FiGlobe /> },
  announcements: { title: "Platform Announcements", desc: "Short notices across pages", icon: <FiBell /> },
  blogs: { title: "Blogs", desc: "Blog cards and article highlights", icon: <FiFileText /> },
  featuredCompanies: { title: "Featured Companies", desc: "Highlighted partner companies", icon: <FiUsers /> },
};

function statusClass(status) {
  const s = String(status || "").toLowerCase();
  if (["active", "published"].includes(s)) return "bg-green-50 border-green-200 text-green-700";
  if (["draft", "disabled", "archived"].includes(s)) return "bg-slate-100 border-slate-200 text-slate-600";
  return "bg-orange-50 border-orange-200 text-[#F97316]";
}

function getDate(item) {
  return item.startDate || item.createdAt || item.publishDate || "";
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

  return <div ref={containerRef} className={className}>{size.width > 0 && size.height > 0 ? children(size) : null}</div>;
}

function SectionCard({ section, item, onClick }) {
  return (
    <div className={`rounded-2xl border bg-white p-4 shadow-sm transition hover:-translate-y-1 hover:shadow-md ${section === item.key ? "border-blue-300" : "border-slate-200"}`}>
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

function emptyForm() {
  return {
    title: "",
    subtitle: "",
    image: "",
    url: "",
    startDate: "",
    endDate: "",
    status: "active",
    description: "",
    priority: "medium",
    pageSlug: "home",
    blockKey: "",
    author: "",
    buttonText: "",
  };
}

function isMongoId(value) {
  return /^[a-fA-F0-9]{24}$/.test(String(value || ""));
}

export default function ContentManagement() {
  const [loading, setLoading] = useState(true);
  const [saveBusy, setSaveBusy] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [sections, setSections] = useState({
    homeSlides: [],
    publicPages: [],
    announcements: [],
    blogs: [],
    featuredCompanies: [],
  });
  const [activeSection, setActiveSection] = useState("homeSlides");
  const [filters, setFilters] = useState({ search: "", status: "all" });
  const [selectedIds, setSelectedIds] = useState([]);
  const [bulkAction, setBulkAction] = useState("publish");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const load = async () => {
    setLoading(true);
    try {
      const res = await adminGetContent();
      setSections({
        homeSlides: Array.isArray(res?.homeSlides) ? res.homeSlides : Array.isArray(res?.banners) ? res.banners : [],
        publicPages: Array.isArray(res?.publicPages) ? res.publicPages : [],
        announcements: Array.isArray(res?.announcements) ? res.announcements : [],
        blogs: Array.isArray(res?.blogs) ? res.blogs : [],
        featuredCompanies: Array.isArray(res?.featuredCompanies) ? res.featuredCompanies : [],
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const cards = useMemo(
    () => Object.entries(CATEGORY_META).map(([key, meta]) => ({ key, ...meta, count: sections[key]?.length || 0 })),
    [sections],
  );

  const rows = useMemo(() => {
    const q = filters.search.trim().toLowerCase();
    return (sections[activeSection] || []).filter((x) => {
      const bag = `${x.title || ""} ${x.subtitle || ""} ${x.description || ""} ${x.pageSlug || ""} ${x.author || ""}`.toLowerCase();
      const matchSearch = !q || bag.includes(q);
      const matchStatus = filters.status === "all" || String(x.status || "").toLowerCase() === filters.status;
      return matchSearch && matchStatus;
    });
  }, [sections, activeSection, filters]);

  const trendData = useMemo(() => {
    const c = rows.length || 1;
    return ["W1", "W2", "W3", "W4", "W5", "W6"].map((label, idx) => ({ label, value: Math.max(1, Math.round(c * (0.6 + idx * 0.1))) }));
  }, [rows.length]);

  const allSelected = rows.length > 0 && rows.every((x) => selectedIds.includes(x.id));

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm());
    setModalOpen(true);
  };

  const openEdit = (item) => {
    setEditing(item);
    setForm({
      title: item.title || "",
      subtitle: item.subtitle || "",
      image: item.image || "",
      url: item.url || "",
      startDate: item.startDate || "",
      endDate: item.endDate || "",
      status: item.status || "active",
      description: item.description || "",
      priority: item.priority || "medium",
      pageSlug: item.pageSlug || "home",
      blockKey: item.blockKey || "",
      author: item.author || "",
      buttonText: item.buttonText || "",
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
        subtitle: form.subtitle,
        image: form.image,
        url: form.url,
        startDate: form.startDate,
        endDate: form.endDate,
        status: form.status,
        description: form.description,
        priority: form.priority,
        pageSlug: form.pageSlug,
        blockKey: form.blockKey,
        author: form.author,
        buttonText: form.buttonText,
      };
      const res = await adminSaveContentItem(payload);
      const item = res?.item;
      if (!item) return;

      setSections((prev) => {
        const current = prev[activeSection] || [];
        const exists = current.some((x) => x.id === item.id);
        return {
          ...prev,
          [activeSection]: exists ? current.map((x) => (x.id === item.id ? item : x)) : [item, ...current],
        };
      });
      setModalOpen(false);
    } finally {
      setSaveBusy(false);
    }
  };

  const onPickImage = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploadingImage(true);
      const res = await uploadService.uploadContentImage(file);
      const imageUrl = String(res?.data?.imageUrl || "");
      if (imageUrl) setForm((p) => ({ ...p, image: imageUrl }));
    } finally {
      setUploadingImage(false);
      e.target.value = "";
    }
  };

  const onDelete = async (row) => {
    if (!row?.id || !isMongoId(row.id)) {
      setSections((prev) => ({ ...prev, [activeSection]: (prev[activeSection] || []).filter((x) => x !== row) }));
      return;
    }
    try {
      await adminDeleteContentItem(row.id);
    } catch (e) {
      if (Number(e?.response?.status || 0) !== 404) throw e;
    } finally {
      setSections((prev) => ({ ...prev, [activeSection]: (prev[activeSection] || []).filter((x) => x.id !== row.id) }));
      setSelectedIds((prev) => prev.filter((id) => id !== row.id));
    }
  };

  const onToggleStatus = async (row) => {
    if (!row?.id) return;
    const current = String(row.status || "").toLowerCase();
    const next = current === "disabled" || current === "draft" || current === "archived" ? "active" : "disabled";
    const res = await adminUpdateContentStatus(row.id, next);
    const item = res?.item;
    if (!item) return;
    setSections((prev) => ({
      ...prev,
      [activeSection]: (prev[activeSection] || []).map((x) => (x.id === row.id ? item : x)),
    }));
  };

  const onApplyBulk = async () => {
    const ids = selectedIds.filter(Boolean);
    if (!ids.length) return;
    await adminBulkContentAction(ids, bulkAction);

    if (bulkAction === "delete") {
      setSections((prev) => ({
        ...prev,
        [activeSection]: (prev[activeSection] || []).filter((x) => !ids.includes(x.id)),
      }));
    } else {
      const nextStatus = bulkAction === "publish" ? "published" : "archived";
      setSections((prev) => ({
        ...prev,
        [activeSection]: (prev[activeSection] || []).map((x) => (
          ids.includes(x.id) ? { ...x, status: nextStatus } : x
        )),
      }));
    }

    setSelectedIds([]);
  };

  return (
    <div className="space-y-6">
      <section>
        <h1 className="text-2xl font-bold text-[#0F172A] sm:text-3xl">Content Management</h1>
        <p className="mt-1 text-sm text-slate-500">Manage home slides, public page blocks, announcements, blogs and media.</p>
        <p className="mt-2 text-xs font-medium text-slate-400">Dashboard &gt; Content Management</p>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-lg font-semibold text-[#0F172A]">Sections</h2>
        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {cards.map((c) => (
            <SectionCard key={c.key} section={activeSection} item={c} onClick={() => { setActiveSection(c.key); setSelectedIds([]); }} />
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
            <FiPlus /> Add New
          </button>
        </div>

        <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-3">
          <div className="relative md:col-span-2">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={filters.search} onChange={(e) => setFilters((p) => ({ ...p, search: e.target.value }))} placeholder="Search content" className="h-10 w-full rounded-lg border border-slate-200 pl-9 pr-3 text-sm outline-none focus:border-blue-300" />
          </div>
          <select value={filters.status} onChange={(e) => setFilters((p) => ({ ...p, status: e.target.value }))} className="h-10 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-blue-300">
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="published">Published</option>
            <option value="disabled">Disabled</option>
            <option value="draft">Draft</option>
            <option value="archived">Archived</option>
          </select>
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

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3"><input type="checkbox" checked={allSelected} onChange={(e) => setSelectedIds(e.target.checked ? rows.map((x) => x.id).filter(Boolean) : [])} className="h-4 w-4 rounded border-slate-300 text-[#2563EB]" /></th>
                <th className="px-4 py-3">Preview</th>
                <th className="px-4 py-3">Title</th>
                <th className="px-4 py-3">Meta</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id || `${row.title}-${row.createdAt}`} className="border-t border-slate-100 transition hover:bg-blue-50/40">
                  <td className="px-4 py-3"><input type="checkbox" disabled={!row.id} checked={selectedIds.includes(row.id)} onChange={(e) => setSelectedIds((prev) => (e.target.checked ? [...new Set([...prev, row.id].filter(Boolean))] : prev.filter((x) => x !== row.id)))} className="h-4 w-4 rounded border-slate-300 text-[#2563EB]" /></td>
                  <td className="px-4 py-3">
                    {row.image ? (
                      <img src={toAbsoluteMediaUrl(row.image)} alt={row.title || "content"} className="h-10 w-16 rounded-lg border border-slate-200 object-cover" />
                    ) : (
                      <div className="flex h-10 w-16 items-center justify-center rounded-lg border border-slate-200 bg-slate-100 text-[10px] text-slate-500">IMG</div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-semibold text-slate-800">{row.title || "-"}</p>
                    <p className="text-xs text-slate-500">{row.subtitle || row.description || "-"}</p>
                  </td>
                  <td className="px-4 py-3 text-slate-700">
                    {row.pageSlug ? <p className="text-xs">Page: {row.pageSlug}</p> : null}
                    {row.blockKey ? <p className="text-xs">Block: {row.blockKey}</p> : null}
                    {row.author ? <p className="text-xs">Author: {row.author}</p> : null}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{getDate(row) || "-"}</td>
                  <td className="px-4 py-3"><span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold capitalize ${statusClass(row.status)}`}>{row.status}</span></td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button type="button" onClick={() => openEdit(row)} className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-blue-200 text-[#2563EB] hover:bg-blue-50"><FiEdit2 /></button>
                      <button type="button" onClick={() => onToggleStatus(row)} className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-orange-200 text-[#F97316] hover:bg-orange-50"><FiAlertCircle /></button>
                      <button type="button" onClick={() => onDelete(row)} className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-red-200 text-red-600 hover:bg-red-50"><FiTrash2 /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {!rows.length && !loading ? <tr className="border-t border-slate-100"><td colSpan={7} className="px-4 py-12 text-center text-sm text-slate-500">No content found.</td></tr> : null}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <h3 className="text-sm font-semibold text-[#0F172A]">Engagement Trend</h3>
        <SafeChartContainer className="mt-3 h-56">
          {({ width, height }) => (
            <LineChart width={width} height={height} data={trendData}>
              <CartesianGrid stroke="#E2E8F0" strokeDasharray="3 3" />
              <XAxis dataKey="label" tick={{ fill: "#64748B", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#64748B", fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip />
              <Line type="monotone" dataKey="value" stroke="#2563EB" strokeWidth={3} dot={{ r: 4, fill: "#2563EB" }} />
            </LineChart>
          )}
        </SafeChartContainer>
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

          <label className="text-sm font-medium text-slate-600">
            Image URL
            <input value={form.image} onChange={(e) => setForm((p) => ({ ...p, image: e.target.value }))} className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 outline-none focus:border-blue-300" />
            <div className="mt-2 flex items-center gap-2">
              <label className="inline-flex cursor-pointer items-center rounded-lg border border-blue-200 px-3 py-2 text-xs font-semibold text-[#2563EB] hover:bg-blue-50">
                {uploadingImage ? "Uploading..." : "Upload Image"}
                <input type="file" accept="image/*" className="hidden" onChange={onPickImage} disabled={uploadingImage} />
              </label>
              {form.image ? <img src={toAbsoluteMediaUrl(form.image)} alt="preview" className="h-10 w-16 rounded-lg border border-slate-200 object-cover" /> : null}
            </div>
          </label>
          <label className="text-sm font-medium text-slate-600">Redirect URL<input value={form.url} onChange={(e) => setForm((p) => ({ ...p, url: e.target.value }))} className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 outline-none focus:border-blue-300" /></label>
          <label className="text-sm font-medium text-slate-600">Start Date<input type="date" value={form.startDate} onChange={(e) => setForm((p) => ({ ...p, startDate: e.target.value }))} className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 outline-none focus:border-blue-300" /></label>
          <label className="text-sm font-medium text-slate-600">End Date<input type="date" value={form.endDate} onChange={(e) => setForm((p) => ({ ...p, endDate: e.target.value }))} className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 outline-none focus:border-blue-300" /></label>
          <label className="text-sm font-medium text-slate-600">Status<select value={form.status} onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))} className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 outline-none focus:border-blue-300"><option value="active">Active</option><option value="published">Published</option><option value="disabled">Disabled</option><option value="draft">Draft</option><option value="archived">Archived</option></select></label>
          <label className="text-sm font-medium text-slate-600">Priority<select value={form.priority} onChange={(e) => setForm((p) => ({ ...p, priority: e.target.value }))} className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 outline-none focus:border-blue-300"><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option></select></label>

          {(activeSection === "publicPages" || activeSection === "blogs") ? (
            <label className="text-sm font-medium text-slate-600">Page Slug<select value={form.pageSlug} onChange={(e) => setForm((p) => ({ ...p, pageSlug: e.target.value }))} className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 outline-none focus:border-blue-300"><option value="home">Home</option><option value="about">About</option><option value="contact">Contact</option></select></label>
          ) : null}
          {activeSection === "publicPages" ? (
            <label className="text-sm font-medium text-slate-600">Block Key<input value={form.blockKey} onChange={(e) => setForm((p) => ({ ...p, blockKey: e.target.value }))} className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 outline-none focus:border-blue-300" /></label>
          ) : null}
          {activeSection === "blogs" ? (
            <label className="text-sm font-medium text-slate-600">Author<input value={form.author} onChange={(e) => setForm((p) => ({ ...p, author: e.target.value }))} className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 outline-none focus:border-blue-300" /></label>
          ) : null}
          {activeSection === "publicPages" ? (
            <label className="text-sm font-medium text-slate-600">Button Text<input value={form.buttonText} onChange={(e) => setForm((p) => ({ ...p, buttonText: e.target.value }))} className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 outline-none focus:border-blue-300" /></label>
          ) : null}

          <label className="md:col-span-2 text-sm font-medium text-slate-600">Description<textarea value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} rows={5} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 outline-none focus:border-blue-300" /></label>
        </div>
      </Modal>
    </div>
  );
}
