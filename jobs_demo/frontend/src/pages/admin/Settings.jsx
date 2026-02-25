import { useEffect, useState } from "react";
import {
  FiAlertTriangle,
  FiDatabase,
  FiMail,
  FiSave,
  FiShield,
  FiSliders,
  FiTool,
} from "react-icons/fi";

import Modal from "../../components/common/Modal";
import { adminGetSettings, adminSaveSettings } from "../../services/adminService";

const TABS = [
  { id: "general", label: "General" },
  { id: "security", label: "Security" },
  { id: "email", label: "Email & Notifications" },
  { id: "features", label: "Feature Controls" },
  { id: "theme", label: "Theme Settings" },
  { id: "system", label: "System Controls" },
];

function SectionCard({ title, children }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="text-base font-semibold text-[#0F172A]">{title}</h3>
      <div className="mt-4">{children}</div>
    </section>
  );
}

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

export default function Settings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("general");
  const [dangerOpen, setDangerOpen] = useState(false);
  const [dangerAction, setDangerAction] = useState("reset");

  const [settings, setSettings] = useState({
    profile: { name: "", email: "", role: "Super Admin", phone: "", address: "", logoUrl: "" },
    social: { linkedin: "", twitter: "", instagram: "", facebook: "" },
    security: { twoFactor: true },
    sessions: { active: 3, lastPasswordChange: "2026-02-10" },
    email: { host: "", port: "", senderEmail: "", senderName: "" },
    notifications: {
      companyRegistration: true,
      studentRegistration: true,
      planPurchase: true,
      jobPosted: true,
      applicationSubmitted: true,
    },
    platform: {
      governmentJobs: true,
      internship: true,
      resumeBuilder: true,
      chatSystem: false,
      videoInterview: false,
      aiResumeMatching: true,
      maintenanceMode: false,
    },
    theme: { mode: "light", accent: "blue" },
  });

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res = await adminGetSettings();
        setSettings((prev) => ({
          ...prev,
          profile: { ...prev.profile, ...(res?.profile || {}) },
          social: { ...prev.social, ...(res?.social || {}) },
          security: { ...prev.security, ...(res?.security || {}) },
          sessions: { ...prev.sessions, ...(res?.sessions || {}) },
          email: { ...prev.email, ...(res?.email || {}) },
          notifications: { ...prev.notifications, ...(res?.notifications || {}) },
          platform: { ...prev.platform, ...(res?.platform || {}) },
          theme: { ...prev.theme, ...(res?.theme || {}) },
        }));
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      await adminSaveSettings(settings);
    } finally {
      setSaving(false);
    }
  };
  const setTabValue = (tab, key, value) => {
    setSettings((prev) => ({ ...prev, [tab]: { ...prev[tab], [key]: value } }));
  };

  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="h-4 w-1/3 animate-pulse rounded bg-slate-100" />
        <div className="mt-4 h-48 animate-pulse rounded-xl bg-slate-100" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section>
        <h1 className="text-2xl font-bold text-[#0F172A] sm:text-3xl">Platform Settings</h1>
        <p className="mt-1 text-sm text-slate-500">Manage global platform configuration and system preferences</p>
        <p className="mt-2 text-xs font-medium text-slate-400">Dashboard &gt; Settings</p>
      </section>

      <section className="grid grid-cols-1 gap-5 lg:grid-cols-[260px_1fr]">
        <aside className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
          <nav className="space-y-1">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`w-full rounded-xl px-3 py-2 text-left text-sm font-semibold transition ${activeTab === tab.id ? "bg-blue-50 text-[#2563EB]" : "text-slate-600 hover:bg-slate-50"}`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </aside>

        <div className="space-y-4">
          {activeTab === "general" ? (
            <>
              <SectionCard title="Platform Information">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <input value={settings.profile.name} onChange={(e) => setTabValue("profile", "name", e.target.value)} placeholder="Platform Name" className="h-10 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-blue-300" />
                  <input value={settings.profile.email} onChange={(e) => setTabValue("profile", "email", e.target.value)} placeholder="Support Email" className="h-10 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-blue-300" />
                  <input value={settings.profile.phone} onChange={(e) => setTabValue("profile", "phone", e.target.value)} placeholder="Support Phone" className="h-10 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-blue-300" />
                  <input value={settings.profile.address} onChange={(e) => setTabValue("profile", "address", e.target.value)} placeholder="Company Address" className="h-10 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-blue-300" />
                  <input value={settings.profile.logoUrl} onChange={(e) => setTabValue("profile", "logoUrl", e.target.value)} placeholder="Logo URL" className="h-10 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-blue-300 md:col-span-2" />
                </div>
                <button type="button" onClick={save} disabled={saving} className="mt-4 rounded-lg bg-[#2563EB] px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60">
                  Save Changes
                </button>
              </SectionCard>

              <SectionCard title="Social Links">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <input value={settings.social.linkedin} onChange={(e) => setTabValue("social", "linkedin", e.target.value)} placeholder="LinkedIn" className="h-10 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-blue-300" />
                  <input value={settings.social.twitter} onChange={(e) => setTabValue("social", "twitter", e.target.value)} placeholder="Twitter" className="h-10 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-blue-300" />
                  <input value={settings.social.instagram} onChange={(e) => setTabValue("social", "instagram", e.target.value)} placeholder="Instagram" className="h-10 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-blue-300" />
                  <input value={settings.social.facebook} onChange={(e) => setTabValue("social", "facebook", e.target.value)} placeholder="Facebook" className="h-10 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-blue-300" />
                </div>
                <button type="button" onClick={save} disabled={saving} className="mt-4 rounded-lg border border-blue-200 px-4 py-2 text-sm font-semibold text-[#2563EB] hover:bg-blue-50 disabled:opacity-60">
                  Save
                </button>
              </SectionCard>
            </>
          ) : null}

          {activeTab === "security" ? (
            <>
              <SectionCard title="Admin Password Change">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <input type="password" placeholder="Current Password" className="h-10 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-blue-300" />
                  <input type="password" placeholder="New Password" className="h-10 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-blue-300" />
                  <input type="password" placeholder="Confirm Password" className="h-10 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-blue-300" />
                </div>
                <button type="button" className="mt-4 rounded-lg bg-[#2563EB] px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">
                  Update Password
                </button>
              </SectionCard>

              <SectionCard title="Two-Factor Authentication">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-700">Enable Two-Factor Authentication</p>
                    <p className="text-xs text-slate-500">{settings.security.twoFactor ? "Enabled" : "Disabled"}</p>
                  </div>
                  <Toggle checked={settings.security.twoFactor} onChange={() => setTabValue("security", "twoFactor", !settings.security.twoFactor)} />
                </div>
              </SectionCard>

              <SectionCard title="Session Control">
                <button type="button" className="rounded-lg border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50">
                  Logout All Devices
                </button>
              </SectionCard>
            </>
          ) : null}

          {activeTab === "email" ? (
            <>
              <SectionCard title="Email Settings">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <input value={settings.email.host} onChange={(e) => setTabValue("email", "host", e.target.value)} placeholder="SMTP Host" className="h-10 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-blue-300" />
                  <input value={settings.email.port} onChange={(e) => setTabValue("email", "port", e.target.value)} placeholder="SMTP Port" className="h-10 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-blue-300" />
                  <input value={settings.email.senderEmail} onChange={(e) => setTabValue("email", "senderEmail", e.target.value)} placeholder="Sender Email" className="h-10 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-blue-300" />
                  <input value={settings.email.senderName} onChange={(e) => setTabValue("email", "senderName", e.target.value)} placeholder="Sender Name" className="h-10 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-blue-300" />
                </div>
                <button type="button" onClick={save} disabled={saving} className="mt-4 rounded-lg bg-[#2563EB] px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60">
                  Save Configuration
                </button>
              </SectionCard>

              <SectionCard title="Notification Toggles">
                <div className="space-y-3">
                  {[
                    ["companyRegistration", "New Company Registration"],
                    ["studentRegistration", "New Student Registration"],
                    ["planPurchase", "Plan Purchase"],
                    ["jobPosted", "Job Posted"],
                    ["applicationSubmitted", "Application Submitted"],
                  ].map(([key, label]) => (
                    <div key={key} className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/70 px-3 py-2">
                      <span className="text-sm text-slate-700">{label}</span>
                      <Toggle checked={settings.notifications[key]} onChange={() => setTabValue("notifications", key, !settings.notifications[key])} />
                    </div>
                  ))}
                </div>
              </SectionCard>
            </>
          ) : null}

          {activeTab === "features" ? (
            <SectionCard title="Feature Controls">
              <div className="space-y-3">
                {[
                  ["governmentJobs", "Government Job Section"],
                  ["internship", "Internship Section"],
                  ["resumeBuilder", "Resume Builder"],
                  ["chatSystem", "Chat System"],
                  ["videoInterview", "Video Interview Tool"],
                  ["aiResumeMatching", "AI Resume Matching"],
                ].map(([key, label]) => (
                  <div key={key} className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/70 px-3 py-2">
                    <span className="text-sm text-slate-700">{label}</span>
                    <Toggle checked={settings.platform[key]} onChange={() => setTabValue("platform", key, !settings.platform[key])} />
                  </div>
                ))}
              </div>
            </SectionCard>
          ) : null}

          {activeTab === "theme" ? (
            <SectionCard title="Theme Settings">
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-slate-700">Theme Mode</p>
                  <div className="mt-2 flex gap-2">
                    <button type="button" onClick={() => setTabValue("theme", "mode", "light")} className={`rounded-lg px-3 py-2 text-sm font-semibold ${settings.theme.mode === "light" ? "bg-blue-50 text-[#2563EB]" : "bg-slate-100 text-slate-600"}`}>
                      Light Mode
                    </button>
                    <button type="button" disabled className="cursor-not-allowed rounded-lg bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-400">
                      Dark Mode (Soon)
                    </button>
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium text-slate-700">Primary Accent Color</p>
                  <div className="mt-2 flex gap-2">
                    {[
                      ["blue", "Blue", "bg-blue-500"],
                      ["orange", "Orange", "bg-orange-500"],
                      ["purple", "Purple", "bg-purple-500"],
                    ].map(([key, label, cls]) => (
                      <button key={key} type="button" onClick={() => setTabValue("theme", "accent", key)} className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold ${settings.theme.accent === key ? "border-blue-300 bg-blue-50 text-[#2563EB]" : "border-slate-200 text-slate-600"}`}>
                        <span className={`h-3 w-3 rounded-full ${cls}`} />
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm font-medium text-slate-700">Theme Preview</p>
                  <div className="mt-3 rounded-lg bg-white p-3 shadow-sm">
                    <div className={`h-2 w-20 rounded ${settings.theme.accent === "orange" ? "bg-orange-500" : settings.theme.accent === "purple" ? "bg-purple-500" : "bg-blue-500"}`} />
                    <div className="mt-2 h-2 w-32 rounded bg-slate-200" />
                  </div>
                </div>
              </div>
            </SectionCard>
          ) : null}

          {activeTab === "system" ? (
            <>
              <SectionCard title="System Controls">
                <div className="space-y-3">
                  <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/70 px-3 py-2">
                    <span className="text-sm text-slate-700">Maintenance Mode</span>
                    <Toggle checked={settings.platform.maintenanceMode} onChange={() => setTabValue("platform", "maintenanceMode", !settings.platform.maintenanceMode)} />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button type="button" className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                      <FiDatabase /> Backup Database
                    </button>
                    <button type="button" className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                      <FiTool /> Clear Cache
                    </button>
                  </div>
                </div>
              </SectionCard>

              <SectionCard title="Danger Zone">
                <div className="rounded-xl border border-red-200 bg-red-50/50 p-4">
                  <p className="text-sm font-medium text-red-700">High impact actions</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button type="button" onClick={() => { setDangerAction("reset"); setDangerOpen(true); }} className="inline-flex items-center gap-2 rounded-lg border border-red-200 px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50">
                      <FiAlertTriangle /> Reset Platform Data
                    </button>
                    <button type="button" onClick={() => { setDangerAction("logs"); setDangerOpen(true); }} className="inline-flex items-center gap-2 rounded-lg border border-red-200 px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50">
                      <FiAlertTriangle /> Delete All Logs
                    </button>
                  </div>
                </div>
              </SectionCard>
            </>
          ) : null}

          <div className="flex justify-end">
            <button type="button" onClick={save} disabled={saving} className="inline-flex items-center gap-2 rounded-lg bg-[#2563EB] px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60">
              <FiSave />
              {saving ? "Saving..." : "Save All Settings"}
            </button>
          </div>
        </div>
      </section>

      <Modal
        open={dangerOpen}
        onClose={() => setDangerOpen(false)}
        title={dangerAction === "reset" ? "Reset Platform Data?" : "Delete All Logs?"}
        footer={
          <>
            <button type="button" onClick={() => setDangerOpen(false)} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50">
              Cancel
            </button>
            <button type="button" onClick={() => setDangerOpen(false)} className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700">
              Confirm
            </button>
          </>
        }
      >
        <p className="text-sm text-slate-600">
          This action is irreversible. Please confirm to continue.
        </p>
      </Modal>
    </div>
  );
}

