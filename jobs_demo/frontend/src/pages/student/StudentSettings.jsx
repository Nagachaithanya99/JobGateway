import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Modal from "../../components/common/Modal";
import {
  studentGetSettings,
  studentSaveSettings,
  studentDeleteAccount,
  studentMe,
  studentGetResume,
} from "../../services/studentService";

const tabs = ["Account", "Security", "Notifications", "Preferences", "Privacy"];

function Toggle({ checked, onChange }) {
  return (
    <button
      type="button"
      onClick={onChange}
      className={`relative h-5 w-10 rounded-full transition ${
        checked ? "bg-[#2563EB]" : "bg-slate-300"
      }`}
    >
      <span
        className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition ${
          checked ? "left-[22px]" : "left-0.5"
        }`}
      />
    </button>
  );
}

function Card({ title, children }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <h3 className="text-base font-semibold text-[#0F172A]">{title}</h3>
      <div className="mt-3">{children}</div>
    </section>
  );
}

const emptyState = {
  account: {
    fullName: "",
    email: "",
    phone: "",
    location: "",
    linkedin: "",
    portfolio: "",
  },
  security: {
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
    twoFactor: false,
  },
  notifications: {
    appStatus: true,
    employerMessages: true,
    interviewUpdates: true,
    jobRecommendations: true,
    governmentUpdates: true,
    internshipAlerts: true,
    systemAnnouncements: true,
    emailStatus: true,
    emailMessages: true,
    emailJobs: true,
    weeklyDigest: false,
    whatsappAlerts: false,
    smsAlerts: false,
    frequency: "Instant",
  },
  preferences: {
    stream: "",
    category: "",
    subcategory: "",
    locations: "",
    expectedSalary: "",
    workMode: "Hybrid",
    oneClickApply: true,
    autoAttachResume: true,
    autoSaveHistory: true,
    simpleMode: false,
    voiceGuidance: true,
  },
  privacy: {
    profileVisibility: "Visible to Employers",
    showPhoneAfterShortlist: true,
    allowEmployerMessages: true,
  },
};

export default function StudentSettings() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("Account");
  const [state, setState] = useState(emptyState);
  const [initial, setInitial] = useState(emptyState);
  const [meData, setMeData] = useState(null);

  const [dirty, setDirty] = useState(false);
  const [toast, setToast] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");

  const [profileCompletion, setProfileCompletion] = useState(80);
  const disableOneClick = profileCompletion < 100;

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);

        // pull settings
        const res = await studentGetSettings();
        const payload = res.data || emptyState;

        // use /student/me for profile completion + account metadata
        try {
          const me = await studentMe();
          const pc = Number(me?.data?.profileCompletion ?? me?.data?.profile?.completion ?? 80);
          if (alive) {
            setProfileCompletion(Number.isFinite(pc) ? pc : 80);
            setMeData(me?.data || null);
          }
        } catch {
          // ignore if not implemented
        }

        if (!alive) return;
        setState(payload);
        setInitial(payload);
        setDirty(false);
      } catch (e) {
        if (!alive) return;
        setState(emptyState);
        setInitial(emptyState);
        setToast(e?.response?.data?.message || "Failed to load settings");
        setTimeout(() => setToast(""), 1500);
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  const onChange = (section, key, value) => {
    setState((p) => ({ ...p, [section]: { ...p[section], [key]: value } }));
    setDirty(true);
  };

  const saveChanges = async () => {
    try {
      setSaving(true);
      const res = await studentSaveSettings(state);
      setState(res.data);
      setInitial(res.data);
      setDirty(false);
      setToast("Saved successfully");
      setTimeout(() => setToast(""), 1300);
    } catch (e) {
      setToast(e?.response?.data?.message || "Save failed");
      setTimeout(() => setToast(""), 1500);
    } finally {
      setSaving(false);
    }
  };

  const discardChanges = () => {
    setState(initial);
    setDirty(false);
  };

  const sessions = useMemo(() => {
    const ua = typeof navigator !== "undefined" ? navigator.userAgent : "Unknown device";
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "Local timezone";
    const shortUa = ua.length > 72 ? `${ua.slice(0, 72)}...` : ua;
    return [`${shortUa} - ${tz} - Active now`];
  }, []);

  const lastSeenText = useMemo(() => {
    const ts = meData?.updatedAt || meData?.createdAt;
    if (!ts) return "Last activity not available";
    const d = new Date(ts);
    if (Number.isNaN(d.getTime())) return "Last activity not available";
    return `Last activity: ${d.toLocaleString("en-IN")}`;
  }, [meData]);

  const downloadMyData = async () => {
    try {
      const [meRes, resumeRes] = await Promise.all([studentMe(), studentGetResume()]);
      const payload = {
        exportedAt: new Date().toISOString(),
        account: meRes?.data || {},
        settings: state,
        resume: resumeRes?.data || {},
      };
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "student_data_export.json";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      setToast(e?.response?.data?.message || "Failed to export data");
      setTimeout(() => setToast(""), 1500);
    }
  };

  const doDelete = async () => {
    try {
      await studentDeleteAccount();
      setDeleteOpen(false);
      setToast("Account deleted (soft delete). Please logout.");
      setTimeout(() => setToast(""), 1800);
    } catch (e) {
      setToast(e?.response?.data?.message || "Delete failed");
      setTimeout(() => setToast(""), 1500);
    }
  };

  if (loading) {
    return (
      <div className="bg-[#F8FAFC]">
        <div className="mx-auto max-w-[1200px] px-4 py-10 sm:px-6 lg:px-8">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm text-slate-600">Loading settings...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#F8FAFC] pb-24 md:pb-8">
      <div className="mx-auto max-w-[1200px] space-y-5 px-4 py-6 sm:px-6 lg:px-8">
        <section>
          <p className="text-xs font-semibold text-slate-500">
            <Link to="/student" className="hover:text-[#2563EB]">
              Home
            </Link>{" "}
            {" > "} Settings
          </p>
          <h1 className="mt-1 text-3xl font-bold text-[#0F172A]">Settings</h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage your account, privacy and notifications
          </p>
        </section>

        <section className="overflow-x-auto rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
          <div className="flex min-w-max gap-2">
            {tabs.map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                  activeTab === tab
                    ? "bg-blue-50 text-[#2563EB]"
                    : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </section>

        <div className="space-y-4">
          {activeTab === "Account" ? (
            <>
              <Card title="Profile Info">
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <input
                    value={state.account.fullName}
                    onChange={(e) => onChange("account", "fullName", e.target.value)}
                    placeholder="Full Name"
                    className="h-10 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-blue-300"
                  />
                  <input
                    value={state.account.email}
                    readOnly
                    className="h-10 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-500"
                  />
                  <input
                    value={state.account.phone}
                    onChange={(e) => onChange("account", "phone", e.target.value)}
                    placeholder="Phone"
                    className="h-10 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-blue-300"
                  />
                  <input
                    value={state.account.location}
                    onChange={(e) => onChange("account", "location", e.target.value)}
                    placeholder="Location"
                    className="h-10 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-blue-300"
                  />
                  <input
                    value={state.account.linkedin}
                    onChange={(e) => onChange("account", "linkedin", e.target.value)}
                    placeholder="LinkedIn URL"
                    className="h-10 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-blue-300 sm:col-span-2"
                  />
                  <input
                    value={state.account.portfolio}
                    onChange={(e) => onChange("account", "portfolio", e.target.value)}
                    placeholder="Portfolio URL"
                    className="h-10 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-blue-300 sm:col-span-2"
                  />
                </div>

                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    disabled={saving}
                    onClick={saveChanges}
                    className="rounded-lg bg-[#2563EB] px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
                  >
                    {saving ? "Saving..." : "Save Changes"}
                  </button>
                  <button
                    type="button"
                    onClick={discardChanges}
                    className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                </div>
              </Card>

              <Card title="Profile Photo">
                <div className="flex items-center gap-3">
                  <span className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-orange-100 text-lg font-bold text-[#F97316]">
                    {(state.account.fullName || "Student")
                      .split(" ")
                      .filter(Boolean)
                      .slice(0, 2)
                      .map((x) => x[0]?.toUpperCase())
                      .join("")}
                  </span>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => navigate("/student/profile")}
                      className="rounded-lg border border-blue-200 px-3 py-2 text-sm font-semibold text-[#2563EB] hover:bg-blue-50"
                    >
                      Manage photo
                    </button>
                    <button
                      type="button"
                      onClick={() => navigate("/student/profile")}
                      className="rounded-lg px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50"
                    >
                      Open profile
                    </button>
                  </div>
                </div>
              </Card>
            </>
          ) : null}

          {activeTab === "Security" ? (
            <>
              <Card title="Change Password (Clerk)">
                <p className="text-sm text-slate-600">
                  Your authentication is handled by <b>Clerk</b>. Password change must be done using Clerk UI.
                </p>
              </Card>

              <Card title="Login & Sessions">
                <p className="text-sm text-slate-600">{lastSeenText}</p>
                <ul className="mt-2 space-y-1 text-sm text-slate-700">
                  {sessions.map((s) => (
                    <li key={s}>{s}</li>
                  ))}
                </ul>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled
                    className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Logout via Clerk
                  </button>
                  <button
                    type="button"
                    disabled
                    className="rounded-lg border border-red-200 px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50"
                  >
                    Logout all via Clerk
                  </button>
                </div>
              </Card>

              <Card title="Two-Step Verification">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-slate-700">Enable 2FA (stored in DB)</p>
                  <Toggle
                    checked={state.security.twoFactor}
                    onChange={() => onChange("security", "twoFactor", !state.security.twoFactor)}
                  />
                </div>
              </Card>
            </>
          ) : null}

          {activeTab === "Notifications" ? (
            <>
              <Card title="In-App Notifications">
                <div className="space-y-2">
                  {[
                    ["Application status updates", "appStatus"],
                    ["Employer messages", "employerMessages"],
                    ["Interview updates", "interviewUpdates"],
                    ["Job recommendations", "jobRecommendations"],
                    ["Government job updates", "governmentUpdates"],
                    ["Internship alerts", "internshipAlerts"],
                    ["System announcements", "systemAnnouncements"],
                  ].map(([label, key]) => (
                    <div key={key} className="flex items-center justify-between text-sm text-slate-700">
                      <span>{label}</span>
                      <Toggle
                        checked={!!state.notifications[key]}
                        onChange={() => onChange("notifications", key, !state.notifications[key])}
                      />
                    </div>
                  ))}
                </div>
              </Card>

              <Card title="Email Notifications">
                <div className="space-y-2">
                  {[
                    ["Email for application status", "emailStatus"],
                    ["Email for employer messages", "emailMessages"],
                    ["Email for job alerts", "emailJobs"],
                    ["Weekly job digest", "weeklyDigest"],
                    ["WhatsApp alerts", "whatsappAlerts"],
                    ["SMS alerts", "smsAlerts"],
                  ].map(([label, key]) => (
                    <div key={key} className="flex items-center justify-between text-sm text-slate-700">
                      <span>{label}</span>
                      <Toggle
                        checked={!!state.notifications[key]}
                        onChange={() => onChange("notifications", key, !state.notifications[key])}
                      />
                    </div>
                  ))}

                  <select
                    value={state.notifications.frequency}
                    onChange={(e) => onChange("notifications", "frequency", e.target.value)}
                    className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-blue-300"
                  >
                    <option>Instant</option>
                    <option>Daily summary</option>
                    <option>Weekly summary</option>
                  </select>

                  <button
                    type="button"
                    disabled={saving}
                    onClick={saveChanges}
                    className="rounded-lg bg-[#2563EB] px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
                  >
                    {saving ? "Saving..." : "Save Notification Settings"}
                  </button>
                </div>
              </Card>
            </>
          ) : null}

          {activeTab === "Preferences" ? (
            <>
              <Card title="Job Preferences">
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <select
                    value={state.preferences.stream}
                    onChange={(e) => onChange("preferences", "stream", e.target.value)}
                    className="h-10 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-blue-300"
                  >
                    <option value="">Select stream</option>
                    <option>IT & Software</option>
                    <option>Healthcare</option>
                    <option>Finance</option>
                  </select>

                  <input
                    value={state.preferences.category}
                    onChange={(e) => onChange("preferences", "category", e.target.value)}
                    placeholder="Preferred Category"
                    className="h-10 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-blue-300"
                  />
                  <input
                    value={state.preferences.subcategory}
                    onChange={(e) => onChange("preferences", "subcategory", e.target.value)}
                    placeholder="Preferred Subcategory"
                    className="h-10 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-blue-300"
                  />
                  <input
                    value={state.preferences.locations}
                    onChange={(e) => onChange("preferences", "locations", e.target.value)}
                    placeholder="Preferred Locations"
                    className="h-10 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-blue-300"
                  />
                  <input
                    value={state.preferences.expectedSalary}
                    onChange={(e) => onChange("preferences", "expectedSalary", e.target.value)}
                    placeholder="Expected Salary"
                    className="h-10 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-blue-300"
                  />
                  <select
                    value={state.preferences.workMode}
                    onChange={(e) => onChange("preferences", "workMode", e.target.value)}
                    className="h-10 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-blue-300"
                  >
                    <option>Remote</option>
                    <option>On-site</option>
                    <option>Hybrid</option>
                  </select>
                </div>

                <button
                  type="button"
                  disabled={saving}
                  onClick={saveChanges}
                  className="mt-3 rounded-lg bg-[#2563EB] px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
                >
                  {saving ? "Saving..." : "Save Preferences"}
                </button>
              </Card>

              <Card title="Resume & Apply Settings">
                <div className="space-y-2 text-sm text-slate-700">
                  <div className="flex items-center justify-between">
                    <span>Enable One-Click Apply</span>
                    <Toggle
                      checked={!!state.preferences.oneClickApply && !disableOneClick}
                      onChange={() =>
                        onChange("preferences", "oneClickApply", !state.preferences.oneClickApply)
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <span>Auto attach latest resume</span>
                    <Toggle
                      checked={!!state.preferences.autoAttachResume}
                      onChange={() =>
                        onChange("preferences", "autoAttachResume", !state.preferences.autoAttachResume)
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <span>Auto save applied job to history</span>
                    <Toggle
                      checked={!!state.preferences.autoSaveHistory}
                      onChange={() =>
                        onChange("preferences", "autoSaveHistory", !state.preferences.autoSaveHistory)
                      }
                    />
                  </div>

                  {disableOneClick ? (
                    <p className="rounded-lg border border-orange-200 bg-orange-50 px-3 py-2 text-xs text-[#9A3412]">
                      If profile not complete, One-Click Apply will be disabled.
                    </p>
                  ) : null}
                </div>
              </Card>

              <Card title="Blue Collar Simple Mode">
                <div className="space-y-2 text-sm text-slate-700">
                  <div className="flex items-center justify-between">
                    <span>Enable Simple Mode (big buttons + one-tap apply)</span>
                    <Toggle
                      checked={!!state.preferences.simpleMode}
                      onChange={() =>
                        onChange("preferences", "simpleMode", !state.preferences.simpleMode)
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Enable voice guidance in jobs</span>
                    <Toggle
                      checked={!!state.preferences.voiceGuidance}
                      onChange={() =>
                        onChange("preferences", "voiceGuidance", !state.preferences.voiceGuidance)
                      }
                    />
                  </div>
                  <p className="text-xs text-slate-500">
                    Use this mode for low-literacy users. It keeps normal mode available.
                  </p>
                </div>
              </Card>
            </>
          ) : null}

          {activeTab === "Privacy" ? (
            <>
              <Card title="Profile Visibility">
                <select
                  value={state.privacy.profileVisibility}
                  onChange={(e) => onChange("privacy", "profileVisibility", e.target.value)}
                  className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-blue-300"
                >
                  <option>Visible to Employers</option>
                  <option>Visible only when applied</option>
                  <option>Hidden (not recommended)</option>
                </select>
              </Card>

              <Card title="Contact Visibility">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm text-slate-700">
                    <span>Show phone to employers after shortlist</span>
                    <Toggle
                      checked={!!state.privacy.showPhoneAfterShortlist}
                      onChange={() =>
                        onChange(
                          "privacy",
                          "showPhoneAfterShortlist",
                          !state.privacy.showPhoneAfterShortlist
                        )
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between text-sm text-slate-700">
                    <span>Allow employers to message me</span>
                    <Toggle
                      checked={!!state.privacy.allowEmployerMessages}
                      onChange={() =>
                        onChange(
                          "privacy",
                          "allowEmployerMessages",
                          !state.privacy.allowEmployerMessages
                        )
                      }
                    />
                  </div>
                </div>
              </Card>

              <Card title="Data Controls">
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={downloadMyData}
                    className="rounded-lg border border-blue-200 px-3 py-2 text-sm font-semibold text-[#2563EB] hover:bg-blue-50"
                  >
                    Download my data
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteOpen(true)}
                    className="rounded-lg bg-red-600 px-3 py-2 text-sm font-semibold text-white hover:bg-red-700"
                  >
                    Delete my account
                  </button>
                </div>
              </Card>
            </>
          ) : null}
        </div>
      </div>

      {dirty ? (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 p-3 shadow-[0_-8px_24px_rgba(15,23,42,0.08)] backdrop-blur">
          <div className="mx-auto flex w-full max-w-[1200px] flex-wrap items-center justify-between gap-2 px-1">
            <p className="text-sm font-semibold text-slate-700">You have unsaved changes</p>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={saving}
                onClick={saveChanges}
                className="rounded-lg bg-[#2563EB] px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
              >
                {saving ? "Saving..." : "Save"}
              </button>
              <button
                type="button"
                onClick={discardChanges}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Discard
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <Modal
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title="Delete Account"
        footer={
          <>
            <button
              type="button"
              onClick={() => setDeleteOpen(false)}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={doDelete}
              disabled={deleteConfirm !== "DELETE"}
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              Confirm Delete
            </button>
          </>
        }
      >
        <p className="text-sm text-slate-700">
          Type <span className="font-bold">DELETE</span> to confirm account deletion.
        </p>
        <input
          value={deleteConfirm}
          onChange={(e) => setDeleteConfirm(e.target.value)}
          className="mt-3 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-blue-300"
          placeholder="Type DELETE"
        />
      </Modal>

      {toast ? (
        <div className="fixed bottom-5 right-5 rounded-lg bg-[#0F172A] px-3 py-2 text-xs font-semibold text-white shadow-lg">
          {toast}
        </div>
      ) : null}
    </div>
  );
}
