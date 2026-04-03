import { useEffect, useState } from "react";
import {
  FiAlertTriangle,
  FiEdit2,
  FiTrash2,
  FiUpload,
} from "react-icons/fi";
import Modal from "../../components/common/Modal.jsx";
import {
  getCompanyProfileMe,
  updateCompanyProfile,
  deleteCompanyAccount,
} from "../../services/companyService.js";
import { showSweetPrompt, showSweetToast } from "../../utils/sweetAlert.js";

function Section({ title, children, action }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-base font-semibold text-[#0F172A]">{title}</h3>
        {action}
      </div>
      {children}
    </section>
  );
}

function Input({
  label,
  value,
  onChange,
  placeholder = "",
  type = "text",
  readOnly = false,
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </span>
      <input
        type={type}
        value={value || ""}
        onChange={onChange}
        placeholder={placeholder}
        readOnly={readOnly}
        className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-blue-300"
      />
    </label>
  );
}

export default function Profile() {
  const [editMode, setEditMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteText, setDeleteText] = useState("");

  const [form, setForm] = useState({
    name: "",
    industry: "",
    size: "",
    founded: "",
    website: "",
    linkedin: "",
    email: "",
    phone: "",
    mission: "",
    about: "",
    logoUrl: "",
  });

  const set = (k, v) => setForm((s) => ({ ...s, [k]: v }));

  const notify = (msg) => {
    void showSweetToast(msg, "info", { timer: 1500 });
  };

  /* =========================================
     LOAD PROFILE FROM BACKEND
  ========================================= */
  useEffect(() => {
    const load = async () => {
      try {
        const res = await getCompanyProfileMe();
        const c = res.company;

        setForm({
          name: c.name || "",
          industry: c.industry || "",
          size: c.size || "",
          founded: c.founded || "",
          website: c.website || "",
          linkedin: c.linkedin || "",
          email: c.hrEmail || c.email || "",
          phone: c.hrPhone || c.phone || "",
          mission: c.mission || "",
          about: c.about || "",
          logoUrl: c.logoUrl || "",
        });
      } catch (err) {
        notify(err?.response?.data?.message || "Failed to load profile");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  /* =========================================
     SAVE PROFILE
  ========================================= */
  const handleSave = async () => {
    try {
      setSaving(true);

      await updateCompanyProfile({
        name: form.name,
        industry: form.industry,
        size: form.size,
        founded: form.founded,
        website: form.website,
        linkedin: form.linkedin,
        hrEmail: form.email,
        hrPhone: form.phone,
        mission: form.mission,
        about: form.about,
        logoUrl: form.logoUrl,
      });

      notify("Profile updated successfully");
      setEditMode(false);
    } catch (err) {
      notify(err?.response?.data?.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  /* =========================================
     DELETE ACCOUNT
  ========================================= */
  const handleDelete = async () => {
    try {
      await deleteCompanyAccount("DELETE");
      notify("Account deletion requested");
      setDeleteOpen(false);
      setDeleteText("");
    } catch (err) {
      notify(err?.response?.data?.message || "Delete failed");
    }
  };

  if (loading) {
    return (
      <div className="p-6 text-sm text-slate-500">Loading profile...</div>
    );
  }

  return (
    <div className="space-y-5 pb-20 md:pb-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#0F172A]">
            Company Profile
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage your company information
          </p>
        </div>

        <button
          onClick={() => setEditMode((v) => !v)}
          className="rounded-xl border border-blue-200 px-4 py-2 text-sm font-semibold text-[#2563EB] hover:bg-blue-50"
        >
          <span className="inline-flex items-center gap-1">
            <FiEdit2 />
            {editMode ? "Cancel" : "Edit Profile"}
          </span>
        </button>
      </header>

      {/* Profile Card */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-start gap-4">
          <div className="relative inline-flex h-20 w-20 items-center justify-center rounded-2xl bg-blue-50 text-xl font-bold text-[#2563EB]">
            {form.logoUrl ? (
              <img
                src={form.logoUrl}
                alt="logo"
                className="h-full w-full rounded-2xl object-cover"
              />
            ) : (
              form.name?.slice(0, 2).toUpperCase()
            )}
            {editMode && (
              <button
                type="button"
                onClick={async () => {
                  const { isConfirmed, value } = await showSweetPrompt({
                    title: "Company Logo URL",
                    inputValue: form.logoUrl || "",
                    inputPlaceholder: "https://example.com/logo.png",
                    confirmButtonText: "Save",
                  });
                  if (!isConfirmed) return;
                  set("logoUrl", String(value || "").trim());
                }}
                className="absolute -right-1 -top-1 inline-flex h-7 w-7 items-center justify-center rounded-full border border-blue-200 bg-white text-[#2563EB] hover:bg-blue-50"
              >
                <FiUpload size={14} />
              </button>
            )}
          </div>

          <div className="min-w-[240px] flex-1">
            <h2 className="text-xl font-bold text-[#0F172A]">
              {form.name}
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              {form.industry} {form.size && `- ${form.size}`}
            </p>
          </div>
        </div>
      </section>

      {/* Company Details */}
      <Section title="Company Details">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <Input
            label="Company Name"
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            readOnly={!editMode}
          />
          <Input
            label="Industry"
            value={form.industry}
            onChange={(e) => set("industry", e.target.value)}
            readOnly={!editMode}
          />
          <Input
            label="Company Size"
            value={form.size}
            onChange={(e) => set("size", e.target.value)}
            readOnly={!editMode}
          />
          <Input
            label="Founded Year"
            value={form.founded}
            onChange={(e) => set("founded", e.target.value)}
            readOnly={!editMode}
          />
          <Input
            label="Website"
            value={form.website}
            onChange={(e) => set("website", e.target.value)}
            readOnly={!editMode}
          />
          <Input
            label="LinkedIn"
            value={form.linkedin}
            onChange={(e) => set("linkedin", e.target.value)}
            readOnly={!editMode}
          />
          <Input
            label="HR Email"
            value={form.email}
            onChange={(e) => set("email", e.target.value)}
            readOnly={!editMode}
          />
          <Input
            label="HR Phone"
            value={form.phone}
            onChange={(e) => set("phone", e.target.value)}
            readOnly={!editMode}
          />
        </div>

        <label className="mt-3 block">
          <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
            About Company
          </span>
          <textarea
            value={form.about}
            onChange={(e) => set("about", e.target.value)}
            readOnly={!editMode}
            rows={4}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-300"
          />
        </label>
        <label className="mt-3 block">
          <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
            Mission
          </span>
          <textarea
            value={form.mission}
            onChange={(e) => set("mission", e.target.value)}
            readOnly={!editMode}
            rows={3}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-300"
          />
        </label>

        {editMode && (
          <button
            onClick={handleSave}
            disabled={saving}
            className="mt-4 rounded-xl bg-[#2563EB] px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        )}
      </Section>

      {/* Danger Zone */}
      <Section
        title="Danger Zone"
        action={
          <span className="rounded-full border border-red-200 bg-red-50 px-2 py-1 text-[11px] font-semibold text-red-600">
            Critical
          </span>
        }
      >
        <button
          onClick={() => setDeleteOpen(true)}
          className="rounded-lg bg-red-600 px-3 py-2 text-sm font-semibold text-white hover:bg-red-700"
        >
          <span className="inline-flex items-center gap-1">
            <FiTrash2 />
            Delete Company Account
          </span>
        </button>
      </Section>

      {/* Delete Modal */}
      <Modal
        open={deleteOpen}
        onClose={() => {
          setDeleteOpen(false);
          setDeleteText("");
        }}
        title="Delete Company Account"
        footer={
          <>
            <button
              onClick={() => {
                setDeleteOpen(false);
                setDeleteText("");
              }}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700"
            >
              Cancel
            </button>
            <button
              disabled={deleteText !== "DELETE"}
              onClick={handleDelete}
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              Confirm Delete
            </button>
          </>
        }
      >
        <div className="space-y-3 text-sm text-slate-600">
          <p className="rounded-lg border border-orange-200 bg-orange-50 px-3 py-2 text-[#F97316]">
            <span className="inline-flex items-center gap-1">
              <FiAlertTriangle />
              This action is irreversible.
            </span>
          </p>
          <p>
            Type <span className="font-semibold text-red-600">DELETE</span>{" "}
            to confirm.
          </p>
          <Input
            label="Confirmation"
            value={deleteText}
            onChange={(e) => setDeleteText(e.target.value)}
            placeholder="Type DELETE"
          />
        </div>
      </Modal>

    </div>
  );
}
