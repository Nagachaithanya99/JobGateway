import { useEffect, useMemo, useState } from "react";
import { FiLogOut, FiMail, FiSave } from "react-icons/fi";
import { adminGetProfile, adminSaveProfile } from "../../services/adminService";

function Toggle({ checked, onChange }) {
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

function Card({ title, children }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="text-base font-semibold text-[#0F172A]">{title}</h3>
      <div className="mt-4">{children}</div>
    </section>
  );
}

const initialForm = {
  fullName: "",
  email: "",
  phone: "",
  designation: "",
  bio: "",
};

const initialPreferences = {
  emailNotifications: true,
  planApprovalAlerts: true,
  registrationAlerts: true,
};

export default function Profile() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const [form, setForm] = useState(initialForm);
  const [preferences, setPreferences] = useState(initialPreferences);
  const [activity, setActivity] = useState({
    lastLogin: "",
    lastPasswordChange: "",
    activeSessions: 1,
  });

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const data = await adminGetProfile();

        setForm({
          fullName: data?.profile?.fullName || "",
          email: data?.profile?.email || "",
          phone: data?.profile?.phone || "",
          designation: data?.profile?.designation || "Super Admin",
          bio: data?.profile?.bio || "",
        });

        setPreferences({
          emailNotifications: data?.preferences?.emailNotifications !== false,
          planApprovalAlerts: data?.preferences?.planApprovalAlerts !== false,
          registrationAlerts: data?.preferences?.registrationAlerts !== false,
        });

        setActivity({
          lastLogin: data?.activity?.lastLogin || "",
          lastPasswordChange: data?.activity?.lastPasswordChange || "",
          activeSessions: Number(data?.activity?.activeSessions || 1),
        });
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  const initials = useMemo(
    () =>
      (form.fullName || "Admin User")
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((x) => x[0]?.toUpperCase() || "")
        .join(""),
    [form.fullName],
  );

  const formatDate = (value) => {
    if (!value) return "-";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return value;
    return d.toLocaleString();
  };

  const onSave = async () => {
    setSaving(true);
    setMessage("");
    try {
      const res = await adminSaveProfile({ profile: form, preferences });
      setMessage(res?.ok ? "Profile updated." : "Saved.");
    } catch {
      setMessage("Unable to save profile.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="h-6 w-1/3 animate-pulse rounded bg-slate-100" />
        <div className="mt-4 h-40 animate-pulse rounded-xl bg-slate-100" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section>
        <h1 className="text-2xl font-bold text-[#0F172A] sm:text-3xl">Admin Profile</h1>
        <p className="mt-1 text-sm text-slate-500">Manage your account information</p>
        <p className="mt-2 text-xs font-medium text-slate-400">Dashboard &gt; Profile</p>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 text-xl font-semibold text-[#2563EB]">
              {initials}
            </div>
            <div>
              <p className="text-xl font-semibold text-[#0F172A]">{form.fullName || "Admin"}</p>
              <p className="text-sm text-slate-500">{form.designation || "Super Admin"}</p>
              <p className="mt-1 text-sm text-slate-600">{form.email || "-"}</p>
            </div>
          </div>
          <button type="button" onClick={onSave} className="rounded-lg bg-[#2563EB] px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700" disabled={saving}>
            {saving ? "Saving..." : "Edit Profile"}
          </button>
        </div>
      </section>

      <Card title="Profile Information">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <input value={form.fullName} onChange={(e) => setForm((p) => ({ ...p, fullName: e.target.value }))} placeholder="Full Name" className="h-10 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-blue-300" />
          <input value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} placeholder="Email" className="h-10 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-blue-300" />
          <input value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} placeholder="Phone" className="h-10 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-blue-300" />
          <input value={form.designation} onChange={(e) => setForm((p) => ({ ...p, designation: e.target.value }))} placeholder="Designation" className="h-10 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-blue-300" />
          <textarea value={form.bio} onChange={(e) => setForm((p) => ({ ...p, bio: e.target.value }))} rows={4} placeholder="Bio" className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-300 md:col-span-2" />
        </div>
        <button type="button" onClick={onSave} disabled={saving} className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[#2563EB] px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60">
          <FiSave /> {saving ? "Saving..." : "Save Changes"}
        </button>
        {message ? <p className="mt-3 text-sm text-slate-600">{message}</p> : null}
      </Card>

      <Card title="Password Section">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <input type="password" placeholder="Current Password" className="h-10 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-blue-300" disabled />
          <input type="password" placeholder="New Password" className="h-10 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-blue-300" disabled />
          <input type="password" placeholder="Confirm Password" className="h-10 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-blue-300" disabled />
        </div>
        <button type="button" className="mt-4 rounded-lg bg-[#2563EB] px-4 py-2 text-sm font-semibold text-white opacity-70" disabled>
          Managed by Clerk
        </button>
      </Card>

      <Card title="Preferences">
        <div className="space-y-3">
          <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/70 px-3 py-2">
            <span className="text-sm text-slate-700">Email Notifications</span>
            <Toggle checked={preferences.emailNotifications} onChange={() => setPreferences((p) => ({ ...p, emailNotifications: !p.emailNotifications }))} />
          </div>
          <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/70 px-3 py-2">
            <span className="text-sm text-slate-700">Plan Approval Alerts</span>
            <Toggle checked={preferences.planApprovalAlerts} onChange={() => setPreferences((p) => ({ ...p, planApprovalAlerts: !p.planApprovalAlerts }))} />
          </div>
          <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/70 px-3 py-2">
            <span className="text-sm text-slate-700">New Registration Alerts</span>
            <Toggle checked={preferences.registrationAlerts} onChange={() => setPreferences((p) => ({ ...p, registrationAlerts: !p.registrationAlerts }))} />
          </div>
        </div>
      </Card>

      <Card title="Account Activity">
        <div className="space-y-2 text-sm text-slate-600">
          <p><span className="font-semibold text-slate-800">Last Login:</span> {formatDate(activity.lastLogin)}</p>
          <p><span className="font-semibold text-slate-800">Last Password Change:</span> {activity.lastPasswordChange || "-"}</p>
          <p><span className="font-semibold text-slate-800">Active Sessions:</span> {activity.activeSessions || 1} devices</p>
        </div>
        <div className="mt-4 flex gap-2">
          <button type="button" className="inline-flex items-center gap-2 rounded-lg border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50" disabled>
            <FiLogOut /> Logout All Sessions
          </button>
          <button type="button" className="inline-flex items-center gap-2 rounded-lg border border-blue-200 px-4 py-2 text-sm font-semibold text-[#2563EB] hover:bg-blue-50">
            <FiMail /> Contact Support
          </button>
        </div>
      </Card>
    </div>
  );
}
