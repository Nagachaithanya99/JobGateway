// frontend/src/pages/admin/Companies.jsx
import { useEffect, useMemo, useState } from "react";
import { FiActivity, FiBriefcase, FiCheckCircle, FiUsers } from "react-icons/fi";

import FilterBar from "../../components/admin/companies/FilterBar";
import SummaryCard from "../../components/admin/companies/SummaryCard";
import CompanyTable from "../../components/admin/companies/CompanyTable";
import CompanyDetailsDrawer from "../../components/admin/companies/CompanyDetailsDrawer";
import Modal from "../../components/common/Modal";

import {
  adminCreateCompany,
  adminGetCompanyDetails,
  adminListCompanies,
  adminToggleCompanyStatus,
} from "../../services/adminService";

export default function Companies() {
  const [loading, setLoading] = useState(true);
  const [list, setList] = useState([]);

  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [planType, setPlanType] = useState("all");
  const [category, setCategory] = useState("all");

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [selectedJobs, setSelectedJobs] = useState([]);
  const [selectedApplicants, setSelectedApplicants] = useState([]);

  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    website: "",
    category: "General",
    location: "",
    address: "",
    status: "active",
  });

  const loadCompanies = async () => {
    setLoading(true);
    setError("");
    try {
      const rows = await adminListCompanies();
      setList(Array.isArray(rows) ? rows : []);
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || "Failed to load companies.");
      setList([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCompanies();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const categories = useMemo(() => {
    return Array.from(new Set(list.map((item) => item.category).filter(Boolean)));
  }, [list]);

  const summary = useMemo(() => {
    const total = list.length;
    const active = list.filter((item) => String(item.status).toLowerCase() === "active").length;
    const suspended = list.filter((item) => String(item.status).toLowerCase() === "suspended").length;
    const activePlans = list.filter((item) => String(item.plan?.status).toLowerCase() === "active").length;
    return { total, active, suspended, activePlans };
  }, [list]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();

    return list.filter((item) => {
      const matchSearch =
        !q ||
        String(item.name || "").toLowerCase().includes(q) ||
        String(item.email || "").toLowerCase().includes(q) ||
        String(item.category || "").toLowerCase().includes(q);

      const matchStatus = status === "all" || String(item.status).toLowerCase() === status;
      const matchPlan = planType === "all" || String(item.plan?.name || "").toLowerCase() === planType;
      const matchCategory = category === "all" || item.category === category;

      return matchSearch && matchStatus && matchPlan && matchCategory;
    });
  }, [list, query, status, planType, category]);

  const openDetails = async (row) => {
    setError("");
    setDrawerOpen(true);
    setSelectedCompany(row);
    setSelectedJobs([]);
    setSelectedApplicants([]);

    try {
      const result = await adminGetCompanyDetails(row.id);
      if (result?.company) {
        setSelectedCompany(result.company);
        setSelectedJobs(Array.isArray(result.jobs) ? result.jobs : []);
        setSelectedApplicants(Array.isArray(result.applicants) ? result.applicants : []);
      }
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || "Failed to load company details.");
    }
  };

  const handleEdit = (row) => {
    console.log("Edit company", row.id);
  };

  const handleToggleStatus = async (row) => {
    const next = String(row.status).toLowerCase() === "active" ? "suspended" : "active";

    // optimistic update
    setBusyId(row.id);
    setList((prev) => prev.map((item) => (item.id === row.id ? { ...item, status: next } : item)));
    if (selectedCompany?.id === row.id) {
      setSelectedCompany((prev) => ({ ...prev, status: next }));
    }

    try {
      await adminToggleCompanyStatus(row.id, next);
    } catch (e) {
      // rollback
      const rollback = next === "active" ? "suspended" : "active";
      setList((prev) => prev.map((item) => (item.id === row.id ? { ...item, status: rollback } : item)));
      if (selectedCompany?.id === row.id) {
        setSelectedCompany((prev) => ({ ...prev, status: rollback }));
      }
      setError(e?.response?.data?.message || e?.message || "Failed to update company status.");
    } finally {
      setBusyId("");
    }
  };

  const handleDelete = (row) => {
    // NOTE: delete endpoint is not created in Step 2.
    // For now just remove locally.
    setList((prev) => prev.filter((item) => item.id !== row.id));
    if (selectedCompany?.id === row.id) {
      setDrawerOpen(false);
      setSelectedCompany(null);
      setSelectedJobs([]);
      setSelectedApplicants([]);
    }
  };

  const onAddCompany = async () => {
    if (!form.name.trim() || !form.email.trim()) {
      setError("Company name and email are required.");
      return;
    }
    setAdding(true);
    setError("");
    try {
      await adminCreateCompany({
        name: form.name,
        email: form.email,
        phone: form.phone,
        website: form.website,
        category: form.category,
        location: form.location,
        address: form.address,
        status: form.status,
      });
      setAddOpen(false);
      setForm({
        name: "",
        email: "",
        phone: "",
        website: "",
        category: "General",
        location: "",
        address: "",
        status: "active",
      });
      await loadCompanies();
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || "Failed to add company.");
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="space-y-5">
      <section>
        <h1 className="text-2xl font-bold text-[#1F2937] sm:text-3xl">Companies Management</h1>
        <p className="mt-1 text-sm text-slate-500">Manage all registered companies and monitor activity</p>
      </section>

      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {error}
        </div>
      ) : null}

      <FilterBar
        query={query}
        status={status}
        planType={planType}
        category={category}
        categories={categories}
        onQueryChange={setQuery}
        onStatusChange={setStatus}
        onPlanTypeChange={setPlanType}
        onCategoryChange={setCategory}
        onAddCompany={() => setAddOpen(true)}
      />

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard title="Total Companies" value={summary.total} icon={<FiUsers />} accent="blue" />
        <SummaryCard title="Active Companies" value={summary.active} icon={<FiCheckCircle />} accent="green" />
        <SummaryCard title="Suspended Companies" value={summary.suspended} icon={<FiActivity />} accent="red" />
        <SummaryCard title="Companies with Active Plans" value={summary.activePlans} icon={<FiBriefcase />} accent="amber" />
      </section>

      <CompanyTable
        rows={filtered}
        loading={loading}
        onView={openDetails}
        onEdit={handleEdit}
        onToggleStatus={(row) => (busyId ? null : handleToggleStatus(row))}
        onDelete={handleDelete}
      />

      <CompanyDetailsDrawer
        open={drawerOpen}
        company={selectedCompany}
        jobs={selectedJobs}
        applicants={selectedApplicants}
        onClose={() => setDrawerOpen(false)}
        onSuspend={() => selectedCompany && handleToggleStatus(selectedCompany)}
        onActivate={() => selectedCompany && handleToggleStatus(selectedCompany)}
        onResetPlan={() => console.log("Reset plan", selectedCompany?.id)}
        onUpgradePlan={() => console.log("Upgrade plan", selectedCompany?.id)}
      />

      <Modal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        title="Add Company"
        widthClass="max-w-2xl"
        footer={
          <>
            <button
              type="button"
              onClick={() => setAddOpen(false)}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={adding}
              onClick={onAddCompany}
              className="rounded-lg bg-[#2563EB] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
            >
              {adding ? "Saving..." : "Create Company"}
            </button>
          </>
        }
      >
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <label className="text-sm font-medium text-slate-700">
            Company Name*
            <input
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3"
            />
          </label>
          <label className="text-sm font-medium text-slate-700">
            Email*
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
              className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3"
            />
          </label>
          <label className="text-sm font-medium text-slate-700">
            Phone
            <input
              value={form.phone}
              onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
              className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3"
            />
          </label>
          <label className="text-sm font-medium text-slate-700">
            Website
            <input
              value={form.website}
              onChange={(e) => setForm((p) => ({ ...p, website: e.target.value }))}
              className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3"
            />
          </label>
          <label className="text-sm font-medium text-slate-700">
            Category
            <input
              value={form.category}
              onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}
              className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3"
            />
          </label>
          <label className="text-sm font-medium text-slate-700">
            Status
            <select
              value={form.status}
              onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))}
              className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3"
            >
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
            </select>
          </label>
          <label className="text-sm font-medium text-slate-700">
            Location
            <input
              value={form.location}
              onChange={(e) => setForm((p) => ({ ...p, location: e.target.value }))}
              className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3"
            />
          </label>
          <label className="text-sm font-medium text-slate-700 md:col-span-2">
            Address
            <input
              value={form.address}
              onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))}
              className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3"
            />
          </label>
        </div>
      </Modal>
    </div>
  );
}
