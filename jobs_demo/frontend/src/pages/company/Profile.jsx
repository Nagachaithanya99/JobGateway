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
import { uploadCompanyLogo } from "../../services/uploadService.js";
import { toAbsoluteMediaUrl } from "../../utils/media.js";
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
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteText, setDeleteText] = useState("");
  const [profileViewMode, setProfileViewMode] = useState("company");

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
    profileAudience: "both",
    culture: "",
    perks: "",
    hiringProcess: "",
    studentMessage: "",
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
          profileAudience: c.profileAudience || "both",
          culture: c.culture || "",
          perks: c.perks || "",
          hiringProcess: c.hiringProcess || "",
          studentMessage: c.studentMessage || "",
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
        profileAudience: form.profileAudience,
        culture: form.culture,
        perks: form.perks,
        hiringProcess: form.hiringProcess,
        studentMessage: form.studentMessage,
      });

      notify("Profile updated successfully");
      setEditMode(false);
    } catch (err) {
      notify(err?.response?.data?.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleLogoFile = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    try {
      setUploadingLogo(true);
      const { data } = await uploadCompanyLogo(file);
      const logoUrl = data?.logoUrl || data?.imageUrl || "";
      if (!logoUrl) throw new Error("Upload did not return a logo URL");
      set("logoUrl", logoUrl);
      notify("Logo uploaded. Save changes to update profile.");
    } catch (err) {
      notify(err?.response?.data?.message || err?.message || "Logo upload failed");
    } finally {
      setUploadingLogo(false);
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

  const websiteLink = form.website ? (form.website.startsWith("http") ? form.website : `https://${form.website}`) : "";
  const showStudentPreview = profileViewMode === "student";

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

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setProfileViewMode((v) => (v === "company" ? "student" : "company"))}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            {profileViewMode === "company" ? "Switch to student-style theme" : "Switch to company-style theme"}
          </button>
          <button
            onClick={() => setEditMode((v) => !v)}
            className="rounded-xl border border-blue-200 px-4 py-2 text-sm font-semibold text-[#2563EB] hover:bg-blue-50"
          >
            <span className="inline-flex items-center gap-1">
              <FiEdit2 />
              {editMode ? "Cancel" : "Edit Profile"}
            </span>
          </button>
        </div>
      </header>

      {showStudentPreview ? (
        <section className="rounded-[32px] overflow-hidden border border-slate-200 shadow-sm bg-white">
          <div className="bg-gradient-to-r from-blue-600 via-sky-600 to-violet-600 px-6 py-8 text-white">
            <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-4">
                <div className="relative h-24 w-24 overflow-hidden rounded-full border-4 border-white bg-slate-100 shadow-xl">
                  {form.logoUrl ? (
                    <img src={toAbsoluteMediaUrl(form.logoUrl)} alt={form.name || "Company logo"} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-slate-300 text-3xl font-black text-white">{form.name?.slice(0, 2).toUpperCase()}</div>
                  )}
                </div>
                <div className="min-w-0">
                  <div className="inline-flex rounded-full border border-white/25 bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-white/90">
                    Company
                  </div>
                  <h2 className="mt-4 text-3xl font-black tracking-tight text-white">{form.name || "Company name"}</h2>
                  <p className="mt-2 max-w-2xl text-sm text-white/80">
                    {form.industry || "Industry"}{form.size ? ` • ${form.size}` : ""}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => setEditMode(true)}
                  className="rounded-full border border-white/25 bg-white/10 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-slate-900/10 hover:bg-white/20"
                >
                  Edit Profile
                </button>
                {websiteLink ? (
                  <a
                    href={websiteLink}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-900 shadow-lg shadow-slate-900/10 hover:bg-slate-100"
                  >
                    Visit Website
                  </a>
                ) : null}
              </div>
            </div>
          </div>

          <div className="space-y-6 p-6 md:p-8">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Founded</p>
                <p className="mt-3 text-2xl font-black text-slate-900">{form.founded || "-"}</p>
              </div>
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Profile Audience</p>
                <p className="mt-3 text-2xl font-black text-slate-900">{form.profileAudience === "both" ? "Company + Student" : form.profileAudience === "company" ? "Company only" : "Student facing"}</p>
              </div>
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Contact</p>
                <p className="mt-3 text-sm text-slate-800">{form.email || "No email"}</p>
                <p className="mt-1 text-sm text-slate-800">{form.phone || "No phone"}</p>
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                <h3 className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">About the Company</h3>
                <p className="mt-3 text-sm leading-7 text-slate-700">{form.about || "Add an about section to tell students what your company does."}</p>
              </div>
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                <h3 className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">Mission</h3>
                <p className="mt-3 text-sm leading-7 text-slate-700">{form.mission || "Share your mission to attract the right candidates."}</p>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
              <h3 className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">Culture, Perks & Hiring</h3>
              <div className="mt-4 space-y-4 text-sm leading-7 text-slate-700">
                <div>
                  <p className="font-semibold text-slate-900">Culture</p>
                  <p>{form.culture || "Describe your culture here."}</p>
                </div>
                <div>
                  <p className="font-semibold text-slate-900">Perks</p>
                  <p>{form.perks || "Share your key benefits for employees."}</p>
                </div>
                <div>
                  <p className="font-semibold text-slate-900">Hiring Process</p>
                  <p>{form.hiringProcess || "Explain how candidates can apply and what to expect."}</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      ) : null}

      {/* Profile Card */}
      {profileViewMode === "company" ? (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-start gap-4">
          <div className="relative inline-flex h-20 w-20 items-center justify-center rounded-2xl bg-blue-50 text-xl font-bold text-[#2563EB]">
            {form.logoUrl ? (
              <img
                src={toAbsoluteMediaUrl(form.logoUrl)}
                alt={form.name || "Company logo"}
                className="h-full w-full rounded-2xl object-cover"
              />
            ) : (
              form.name?.slice(0, 2).toUpperCase()
            )}
            {editMode && (
              <div className="absolute -right-1 -top-1">
                <label className="inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded-full border border-blue-200 bg-white text-[#2563EB] hover:bg-blue-50" title="Upload logo from device">
                  <FiUpload size={14} />
                  <input type="file" accept="image/*" onChange={handleLogoFile} className="hidden" disabled={uploadingLogo} />
                </label>
              </div>
            )}
          </div>

          <div className="min-w-[240px] flex-1">
            <h2 className="text-xl font-bold text-[#0F172A]">
              {form.name}
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              {form.industry} {form.size && `- ${form.size}`}
            </p>
            {uploadingLogo ? <p className="mt-2 text-xs font-semibold text-[#2563EB]">Uploading logo...</p> : null}
          </div>
        </div>
        {editMode ? (
          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-[1fr_auto]">
            <Input
              label="Logo URL"
              value={form.logoUrl}
              onChange={(e) => set("logoUrl", e.target.value)}
              placeholder="https://example.com/logo.png"
            />
            <button
              type="button"
              onClick={async () => {
                const { isConfirmed, value } = await showSweetPrompt({
                  title: "Company Logo URL",
                  inputValue: form.logoUrl || "",
                  inputPlaceholder: "https://example.com/logo.png",
                  confirmButtonText: "Use URL",
                });
                if (!isConfirmed) return;
                set("logoUrl", String(value || "").trim());
              }}
              className="self-end rounded-xl border border-blue-200 px-4 py-2 text-sm font-semibold text-[#2563EB] hover:bg-blue-50"
            >
              Add URL
            </button>
          </div>
        ) : null}
      </section>
      ) : null}

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
          <label className="block">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
              Profile Visible To
            </span>
            <select
              value={form.profileAudience}
              onChange={(e) => set("profileAudience", e.target.value)}
              disabled={!editMode}
              className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-blue-300 disabled:bg-slate-50"
            >
              <option value="both">Company and Student profile</option>
              <option value="company">Company profile only</option>
              <option value="student">Student-facing profile only</option>
            </select>
          </label>
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
            Culture
          </span>
          <textarea
            value={form.culture}
            onChange={(e) => set("culture", e.target.value)}
            readOnly={!editMode}
            rows={3}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-300"
          />
        </label>
        <label className="mt-3 block">
          <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
            Perks And Benefits
          </span>
          <textarea
            value={form.perks}
            onChange={(e) => set("perks", e.target.value)}
            readOnly={!editMode}
            rows={3}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-300"
          />
        </label>
        <label className="mt-3 block">
          <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
            Hiring Process
          </span>
          <textarea
            value={form.hiringProcess}
            onChange={(e) => set("hiringProcess", e.target.value)}
            readOnly={!editMode}
            rows={3}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-300"
          />
        </label>
        <label className="mt-3 block">
          <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
            Student Profile Message
          </span>
          <textarea
            value={form.studentMessage}
            onChange={(e) => set("studentMessage", e.target.value)}
            readOnly={!editMode}
            rows={3}
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
