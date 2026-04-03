// src/pages/company/Settings.jsx
import { useEffect, useState } from "react";
import { FiDownload, FiPlus, FiTrash2 } from "react-icons/fi";
import Modal from "../../components/common/Modal.jsx";
import { showSweetPrompt, showSweetToast } from "../../utils/sweetAlert.js";
import {
  getCompanySettingsMe,
  updateCompanyProfile,
  updateCompanyPreferences,
  updateCompanyNotifications,
  updateCompanyBilling,
  updateCompanyPrivacy,
  inviteCompanyTeamMember,
  removeCompanyTeamMember,
  updateCompanyTeamMemberRole,
  exportCompanyData,
  deleteCompanyAccount,
  sendCompanySecurityOtp,
  verifyCompanySecurityOtp,
  updateCompanySecurity,
} from "../../services/companyService.js";

const tabs = [
  "Profile",
  "Hiring Preferences",
  "Team Access",
  "Notifications",
  "Security",
  "Billing",
  "Privacy",
];

function Input({ label, type = "text", value, onChange, placeholder = "", readOnly = false }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </span>
      <input
        type={type}
        value={value ?? ""}
        onChange={onChange}
        placeholder={placeholder}
        readOnly={readOnly}
        className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none transition focus:border-blue-300"
      />
    </label>
  );
}

function Toggle({ label, checked, onChange }) {
  return (
    <label className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <input
        type="checkbox"
        checked={!!checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 accent-[#2563EB]"
      />
    </label>
  );
}

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

function Badge({ tone = "slate", children }) {
  const cls = {
    green: "border border-green-200 bg-green-50 text-green-700",
    orange: "border border-orange-200 bg-orange-50 text-orange-700",
    slate: "border border-slate-200 bg-slate-100 text-slate-600",
    blue: "border border-blue-200 bg-blue-50 text-blue-700",
  };
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${cls[tone] || cls.slate}`}>
      {children}
    </span>
  );
}

export default function Settings() {
  const [activeTab, setActiveTab] = useState("Profile");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // --- Forms (defaults; will be overwritten by API /me) ---
  const [profile, setProfile] = useState({
    name: "",
    website: "",
    industry: "",
    size: "",
    founded: "",
    hrEmail: "",
    hrPhone: "",
    address: "",
    city: "",
    state: "",
    about: "",
    mission: "",
  });

  const [preferences, setPreferences] = useState({
    location: "",
    experience: "",
    salary: "",
    oneClick: true,
    aiRanking: true,
    preScreening: true,
  });

  const [team, setTeam] = useState([]); // from API: teamMembers
  const [notifications, setNotifications] = useState({
    newApplication: true,
    interviewScheduled: true,
    candidateMessage: true,
    planExpiry: true,
    boostExpiry: true,
    sms: false,
    whatsapp: true,
    dailySummary: true,
  });

  const [security, setSecurity] = useState({
    current: "",
    next: "",
    confirm: "",
    twofa: false,
  });

  const [billing, setBilling] = useState({
    companyName: "",
    gst: "",
    billingEmail: "",
    billingAddress: "",
    card: "", // UI only (masked)
  });

  const [privacy, setPrivacy] = useState({
    publicProfile: true,
    hideContactUntilShortlist: true,
  });
  const [sessions, setSessions] = useState([]);
  const [invoices, setInvoices] = useState([]);

  // Modals
  const [teamModal, setTeamModal] = useState({
    open: false,
    name: "",
    email: "",
    role: "Recruiter",
  });
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteText, setDeleteText] = useState("");

  // OTP UI
  const [otpModal, setOtpModal] = useState({
    open: false,
    otp: "",
    purpose: "verify_email",
  });
  const [otpSending, setOtpSending] = useState(false);
  const [otpVerifying, setOtpVerifying] = useState(false);

  const notify = (message) => {
    void showSweetToast(message, "info", { timer: 1400 });
  };

  // --- Load from backend ---
  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        const data = await getCompanySettingsMe();
        if (cancelled) return;

        const c = data?.company || {};

        setProfile((p) => ({
          ...p,
          name: c.name || "",
          website: c.website || "",
          industry: c.industry || "",
          size: c.size || "",
          founded: c.founded || "",
          hrEmail: c.hrEmail || c.email || "",
          hrPhone: c.hrPhone || c.phone || "",
          address: c.address || "",
          city: c.city || "",
          state: c.state || "",
          about: c.about || "",
          mission: c.mission || "",
        }));

        setPreferences((p) => ({
          ...p,
          location: c.preferences?.location || "",
          experience: c.preferences?.experience || "",
          salary: c.preferences?.salary || "",
          oneClick: c.preferences?.oneClick ?? true,
          aiRanking: c.preferences?.aiRanking ?? true,
          preScreening: c.preferences?.preScreening ?? true,
        }));

        setTeam(Array.isArray(c.teamMembers) ? c.teamMembers : []);

        setNotifications((p) => ({
          ...p,
          ...(c.notifications || {}),
        }));

        setSecurity((p) => ({
          ...p,
          twofa: Boolean(c.security?.twofa),
        }));

        setBilling((p) => ({
          ...p,
          companyName: c.billing?.companyName || c.name || "",
          gst: c.billing?.gst || "",
          billingEmail: c.billing?.billingEmail || c.hrEmail || c.email || "",
          billingAddress: c.billing?.billingAddress || "",
          card: c.billing?.cardLast4 ? `**** **** **** ${c.billing.cardLast4}` : p.card || "",
        }));

        setPrivacy((p) => ({
          ...p,
          ...(c.privacy || {}),
        }));
        setSessions(Array.isArray(data?.sessions) ? data.sessions : []);
        setInvoices(Array.isArray(data?.invoices) ? data.invoices : []);
      } catch (e) {
        console.error(e);
        if (!cancelled) notify("Failed to load settings");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- Team API ---
  const addMember = async () => {
    if (!teamModal.email?.trim()) return notify("Email is required");

    try {
      setSaving(true);
      const res = await inviteCompanyTeamMember({
        name: teamModal.name,
        email: teamModal.email,
        role: teamModal.role,
      });

      // API returns teamMembers
      if (Array.isArray(res?.teamMembers)) setTeam(res.teamMembers);

      setTeamModal({ open: false, name: "", email: "", role: "Recruiter" });
      notify("Invite sent");
    } catch (e) {
      console.error(e);
      notify(e?.response?.data?.message || "Invite failed");
    } finally {
      setSaving(false);
    }
  };

  const removeMember = async (memberId) => {
    try {
      setSaving(true);
      const res = await removeCompanyTeamMember(memberId);
      if (Array.isArray(res?.teamMembers)) setTeam(res.teamMembers);
      notify("Team member removed");
    } catch (e) {
      console.error(e);
      notify(e?.response?.data?.message || "Remove failed");
    } finally {
      setSaving(false);
    }
  };

  const cycleRole = async (member) => {
    const order = ["Viewer", "Recruiter", "Admin"];
    const current = order.indexOf(member.role);
    const nextRole = order[(current + 1) % order.length];
    try {
      setSaving(true);
      const res = await updateCompanyTeamMemberRole(member._id || member.id, nextRole);
      if (Array.isArray(res?.teamMembers)) setTeam(res.teamMembers);
      notify(`Role updated to ${nextRole}`);
    } catch (e) {
      console.error(e);
      notify(e?.response?.data?.message || "Role update failed");
    } finally {
      setSaving(false);
    }
  };

  // --- Save by tab ---
  const saveCurrentTab = async () => {
    try {
      setSaving(true);

      if (activeTab === "Profile") {
        await updateCompanyProfile(profile);
      } else if (activeTab === "Hiring Preferences") {
        await updateCompanyPreferences(preferences);
      } else if (activeTab === "Notifications") {
        await updateCompanyNotifications(notifications);
      } else if (activeTab === "Billing") {
        // backend expects cardLast4 optional; UI has masked card
        const payload = { ...billing };
        delete payload.card;
        await updateCompanyBilling(payload);
      } else if (activeTab === "Privacy") {
        await updateCompanyPrivacy(privacy);
      } else if (activeTab === "Security") {
        await updateCompanySecurity({ twofa: security.twofa });
        setSecurity((p) => ({ ...p, current: "", next: "", confirm: "" }));
      }

      notify(`${activeTab} saved`);
    } catch (e) {
      console.error(e);
      notify(e?.response?.data?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  // --- Export + Delete ---
  const onExport = async () => {
    try {
      const res = await exportCompanyData();
      const payload = res?.export || res || {};
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `company_export_${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      notify("Export downloaded");
    } catch (e) {
      console.error(e);
      notify("Export failed");
    }
  };

  const onDeleteAccount = async () => {
    if (deleteText !== "DELETE") return;

    try {
      setSaving(true);
      await deleteCompanyAccount("DELETE");
      setDeleteModalOpen(false);
      setDeleteText("");
      notify("Account deactivated");
      // Optionally redirect/log out from your AuthContext
      // window.location.href = "/company/login";
    } catch (e) {
      console.error(e);
      notify(e?.response?.data?.message || "Delete failed");
    } finally {
      setSaving(false);
    }
  };

  // --- OTP ---
  const openOtp = () => setOtpModal((p) => ({ ...p, open: true, otp: "" }));

  const sendOtp = async () => {
    try {
      setOtpSending(true);
      await sendCompanySecurityOtp(otpModal.purpose);
      notify("OTP sent to email");
    } catch (e) {
      console.error(e);
      notify(e?.response?.data?.message || "OTP send failed");
    } finally {
      setOtpSending(false);
    }
  };

  const verifyOtp = async () => {
    if (!otpModal.otp?.trim()) return notify("Enter OTP");

    try {
      setOtpVerifying(true);
      await verifyCompanySecurityOtp(otpModal.otp, otpModal.purpose);
      setOtpModal((p) => ({ ...p, open: false, otp: "" }));
      notify("OTP verified");
    } catch (e) {
      console.error(e);
      notify(e?.response?.data?.message || "OTP verify failed");
    } finally {
      setOtpVerifying(false);
    }
  };

  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600 shadow-sm">
        Loading settings...
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-20 md:pb-6">
      <header>
        <h1 className="text-2xl font-bold text-[#0F172A]">Company Settings</h1>
        <p className="mt-1 text-sm text-slate-500">Manage company profile and system preferences</p>
      </header>

      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
        <div className="flex min-w-max gap-2">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                activeTab === tab ? "bg-[#2563EB] text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {activeTab === "Profile" ? (
        <div className="space-y-4">
          <Section title="Basic Information">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <Input label="Company Name" value={profile.name} onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))} />
              <Input label="Website" value={profile.website} onChange={(e) => setProfile((p) => ({ ...p, website: e.target.value }))} />
              <Input label="Industry" value={profile.industry} onChange={(e) => setProfile((p) => ({ ...p, industry: e.target.value }))} />
              <Input label="Company Size" value={profile.size} onChange={(e) => setProfile((p) => ({ ...p, size: e.target.value }))} />
              <Input label="Founded Year" value={profile.founded} onChange={(e) => setProfile((p) => ({ ...p, founded: e.target.value }))} />
            </div>
          </Section>

          <Section title="Contact Information">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <Input label="HR Email" value={profile.hrEmail} onChange={(e) => setProfile((p) => ({ ...p, hrEmail: e.target.value }))} />
              <Input label="HR Phone" value={profile.hrPhone} onChange={(e) => setProfile((p) => ({ ...p, hrPhone: e.target.value }))} />
              <Input label="Office Address" value={profile.address} onChange={(e) => setProfile((p) => ({ ...p, address: e.target.value }))} />
              <Input label="City" value={profile.city} onChange={(e) => setProfile((p) => ({ ...p, city: e.target.value }))} />
              <Input label="State" value={profile.state} onChange={(e) => setProfile((p) => ({ ...p, state: e.target.value }))} />
            </div>
          </Section>

          <Section title="About Company">
            <div className="space-y-3">
              <label className="block">
                <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Company Description</span>
                <textarea
                  value={profile.about}
                  onChange={(e) => setProfile((p) => ({ ...p, about: e.target.value }))}
                  rows={4}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-300"
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Mission Statement</span>
                <textarea
                  value={profile.mission}
                  onChange={(e) => setProfile((p) => ({ ...p, mission: e.target.value }))}
                  rows={3}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-300"
                />
              </label>
            </div>
          </Section>
        </div>
      ) : null}

      {activeTab === "Hiring Preferences" ? (
        <Section title="Hiring Preferences">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <Input label="Default Job Location" value={preferences.location} onChange={(e) => setPreferences((p) => ({ ...p, location: e.target.value }))} />
            <Input label="Default Experience Level" value={preferences.experience} onChange={(e) => setPreferences((p) => ({ ...p, experience: e.target.value }))} />
            <Input label="Default Salary Range" value={preferences.salary} onChange={(e) => setPreferences((p) => ({ ...p, salary: e.target.value }))} />
          </div>
          <div className="mt-4 space-y-2">
            <Toggle label="Enable One-click Shortlisting" checked={preferences.oneClick} onChange={(v) => setPreferences((p) => ({ ...p, oneClick: v }))} />
            <Toggle label="Enable AI Resume Ranking" checked={preferences.aiRanking} onChange={(v) => setPreferences((p) => ({ ...p, aiRanking: v }))} />
            <Toggle label="Enable Pre-screening Questions by default" checked={preferences.preScreening} onChange={(v) => setPreferences((p) => ({ ...p, preScreening: v }))} />
          </div>
        </Section>
      ) : null}

      {activeTab === "Team Access" ? (
        <Section
          title="Team Members"
          action={
            <button
              onClick={() => setTeamModal((p) => ({ ...p, open: true }))}
              className="rounded-lg bg-[#2563EB] px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700"
            >
              <span className="inline-flex items-center gap-1">
                <FiPlus />
                Add Team Member
              </span>
            </button>
          }
        >
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  {["Name", "Email", "Role", "Status", "Actions"].map((h) => (
                    <th key={h} className="px-3 py-2 text-left font-semibold">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {team.map((member) => (
                  <tr key={member._id || member.id} className="hover:bg-[#EFF6FF]">
                    <td className="px-3 py-2 font-medium text-[#0F172A]">{member.name}</td>
                    <td className="px-3 py-2 text-slate-700">{member.email}</td>
                    <td className="px-3 py-2 text-slate-700">{member.role}</td>
                    <td className="px-3 py-2">
                      <Badge tone={member.status === "Active" ? "green" : member.status === "Invited" ? "blue" : "slate"}>
                        {member.status}
                      </Badge>
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex gap-2">
                        <button
                          onClick={() => cycleRole(member)}
                          className="rounded-md border border-blue-200 px-2 py-1 text-xs font-semibold text-[#2563EB] hover:bg-blue-50"
                        >
                          Change Role
                        </button>
                        <button
                          onClick={() => removeMember(member._id || member.id)}
                          className="rounded-md border border-red-200 px-2 py-1 text-xs font-semibold text-red-600 hover:bg-red-50"
                        >
                          Remove
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {team.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-3 py-6 text-center text-slate-500">
                      No team members yet
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </Section>
      ) : null}

      {activeTab === "Notifications" ? (
        <div className="space-y-4">
          <Section title="Email Notifications">
            <div className="space-y-2">
              <Toggle label="New Application" checked={notifications.newApplication} onChange={(v) => setNotifications((p) => ({ ...p, newApplication: v }))} />
              <Toggle label="Interview Scheduled" checked={notifications.interviewScheduled} onChange={(v) => setNotifications((p) => ({ ...p, interviewScheduled: v }))} />
              <Toggle label="Candidate Message" checked={notifications.candidateMessage} onChange={(v) => setNotifications((p) => ({ ...p, candidateMessage: v }))} />
              <Toggle label="Plan Expiry" checked={notifications.planExpiry} onChange={(v) => setNotifications((p) => ({ ...p, planExpiry: v }))} />
              <Toggle label="Boost Expiry" checked={notifications.boostExpiry} onChange={(v) => setNotifications((p) => ({ ...p, boostExpiry: v }))} />
            </div>
          </Section>
          <Section title="SMS / WhatsApp Alerts">
            <div className="space-y-2">
              <Toggle label="Enable SMS" checked={notifications.sms} onChange={(v) => setNotifications((p) => ({ ...p, sms: v }))} />
              <Toggle label="Enable WhatsApp" checked={notifications.whatsapp} onChange={(v) => setNotifications((p) => ({ ...p, whatsapp: v }))} />
            </div>
          </Section>
          <Section title="Daily Summary">
            <Toggle label="Receive daily hiring summary email" checked={notifications.dailySummary} onChange={(v) => setNotifications((p) => ({ ...p, dailySummary: v }))} />
          </Section>
        </div>
      ) : null}

      {activeTab === "Security" ? (
        <div className="space-y-4">
          <Section title="Change Password">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <Input type="password" label="Current Password" value={security.current} onChange={(e) => setSecurity((p) => ({ ...p, current: e.target.value }))} />
              <Input type="password" label="New Password" value={security.next} onChange={(e) => setSecurity((p) => ({ ...p, next: e.target.value }))} />
              <Input type="password" label="Confirm Password" value={security.confirm} onChange={(e) => setSecurity((p) => ({ ...p, confirm: e.target.value }))} />
            </div>
            <p className="mt-2 text-xs text-slate-500">
              Password change is usually handled by your auth provider (Clerk). This UI is optional.
            </p>
          </Section>

          <Section
            title="Email OTP Verification (Optional)"
            action={
              <button
                onClick={openOtp}
                className="rounded-lg border border-orange-200 bg-orange-50 px-3 py-1.5 text-xs font-semibold text-[#F97316] hover:bg-orange-100"
              >
                Verify via OTP
              </button>
            }
          >
            <p className="text-sm text-slate-600">
              Use email OTP to verify or secure sensitive actions. (Requires SMTP configured in backend)
            </p>
          </Section>

          <Section title="Two-Factor Authentication">
            <Toggle label="Enable 2FA" checked={security.twofa} onChange={(v) => setSecurity((p) => ({ ...p, twofa: v }))} />
            <p className="mt-2 text-xs text-slate-500">This is a settings flag. If you want true 2FA enforcement, do it in Clerk.</p>
          </Section>

          <Section title="Active Sessions">
            <div className="space-y-2">
              {sessions.map((s) => (
                <div key={s.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 px-3 py-2">
                  <div>
                    <p className="text-sm font-semibold text-[#0F172A]">{s.device}</p>
                    <p className="text-xs text-slate-500">
                      {s.location} | {s.active}
                    </p>
                  </div>
                  <Badge tone="blue">Current</Badge>
                </div>
              ))}
              {sessions.length === 0 ? <p className="text-sm text-slate-500">No active session records.</p> : null}
            </div>
          </Section>
        </div>
      ) : null}

      {activeTab === "Billing" ? (
        <div className="space-y-4">
          <Section title="Billing Info">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <Input label="Company Name" value={billing.companyName} onChange={(e) => setBilling((p) => ({ ...p, companyName: e.target.value }))} />
              <Input label="GST Number" value={billing.gst} onChange={(e) => setBilling((p) => ({ ...p, gst: e.target.value }))} />
              <Input label="Billing Email" value={billing.billingEmail} onChange={(e) => setBilling((p) => ({ ...p, billingEmail: e.target.value }))} />
              <Input label="Billing Address" value={billing.billingAddress} onChange={(e) => setBilling((p) => ({ ...p, billingAddress: e.target.value }))} />
            </div>
          </Section>

          <Section
            title="Payment Method"
            action={
              <button
                onClick={async () => {
                  const { isConfirmed, value } = await showSweetPrompt({
                    title: "Update Payment Method",
                    text: "Enter last 4 digits of card",
                    inputValue: "",
                    inputPlaceholder: "1234",
                    confirmButtonText: "Update",
                  });
                  const last4 = String(value || "").trim();
                  if (!isConfirmed || !last4) return;
                  try {
                    setSaving(true);
                    await updateCompanyBilling({ cardLast4: String(last4).slice(-4) });
                    setBilling((p) => ({ ...p, card: `**** **** **** ${String(last4).slice(-4)}` }));
                    notify("Payment method updated");
                  } catch (e) {
                    notify(e?.response?.data?.message || "Payment update failed");
                  } finally {
                    setSaving(false);
                  }
                }}
                className="rounded-lg border border-blue-200 px-3 py-1.5 text-xs font-semibold text-[#2563EB] hover:bg-blue-50"
              >
                Update Payment
              </button>
            }
          >
            <p className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
              Primary Card: {billing.card || "Not added"}
            </p>
          </Section>

          <Section title="Invoices">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50 text-slate-600">
                  <tr>
                    {["Invoice ID", "Amount", "Date", "Download"].map((h) => (
                      <th key={h} className="px-3 py-2 text-left font-semibold">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {invoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-[#EFF6FF]">
                      <td className="px-3 py-2 font-medium text-[#0F172A]">{inv.id}</td>
                      <td className="px-3 py-2 text-slate-700">Rs. {inv.amount}</td>
                      <td className="px-3 py-2 text-slate-700">{inv.date}</td>
                      <td className="px-3 py-2">
                        <button
                          onClick={() => {
                            const blob = new Blob([JSON.stringify(inv, null, 2)], { type: "application/json;charset=utf-8" });
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement("a");
                            a.href = url;
                            a.download = `${inv.id}.json`;
                            a.click();
                            URL.revokeObjectURL(url);
                          }}
                          className="rounded-lg border border-blue-200 px-2.5 py-1.5 text-xs font-semibold text-[#2563EB] hover:bg-blue-50"
                        >
                          <span className="inline-flex items-center gap-1">
                            <FiDownload />
                            Download
                          </span>
                        </button>
                      </td>
                    </tr>
                  ))}
                  {invoices.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-3 py-6 text-center text-slate-500">No invoices found</td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </Section>
        </div>
      ) : null}

      {activeTab === "Privacy" ? (
        <div className="space-y-4">
          <Section title="Company Visibility">
            <div className="space-y-2">
              <Toggle label="Show Company Profile Publicly" checked={privacy.publicProfile} onChange={(v) => setPrivacy((p) => ({ ...p, publicProfile: v }))} />
              <Toggle label="Hide company contact until shortlist" checked={privacy.hideContactUntilShortlist} onChange={(v) => setPrivacy((p) => ({ ...p, hideContactUntilShortlist: v }))} />
            </div>
          </Section>

          <Section title="Data Management">
            <button onClick={onExport} className="rounded-lg border border-blue-200 px-3 py-2 text-sm font-semibold text-[#2563EB] hover:bg-blue-50">
              <span className="inline-flex items-center gap-1">
                <FiDownload />
                Download Company Data
              </span>
            </button>
          </Section>

          <Section title="Danger Zone" action={<span className="rounded-full border border-red-200 bg-red-50 px-2 py-1 text-[11px] font-semibold text-red-600">High Risk</span>}>
            <button onClick={() => setDeleteModalOpen(true)} className="rounded-lg bg-red-600 px-3 py-2 text-sm font-semibold text-white hover:bg-red-700">
              <span className="inline-flex items-center gap-1">
                <FiTrash2 />
                Delete Company Account
              </span>
            </button>
          </Section>
        </div>
      ) : null}

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white p-3 md:static md:border-0 md:bg-transparent md:p-0">
        <button
          onClick={saveCurrentTab}
          disabled={saving}
          className="w-full rounded-xl bg-[#2563EB] px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60 md:w-auto"
        >
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>

      {/* TEAM MODAL */}
      <Modal
        open={teamModal.open}
        onClose={() => setTeamModal({ open: false, name: "", email: "", role: "Recruiter" })}
        title="Add Team Member"
        footer={
          <>
            <button onClick={() => setTeamModal({ open: false, name: "", email: "", role: "Recruiter" })} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700">
              Cancel
            </button>
            <button onClick={addMember} disabled={saving} className="rounded-lg bg-[#2563EB] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">
              {saving ? "Sending..." : "Send Invite"}
            </button>
          </>
        }
      >
        <div className="space-y-3">
          <Input label="Name" value={teamModal.name} onChange={(e) => setTeamModal((p) => ({ ...p, name: e.target.value }))} />
          <Input label="Email" value={teamModal.email} onChange={(e) => setTeamModal((p) => ({ ...p, email: e.target.value }))} />
          <label className="block">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Assign Role</span>
            <select value={teamModal.role} onChange={(e) => setTeamModal((p) => ({ ...p, role: e.target.value }))} className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm">
              <option>Admin</option>
              <option>Recruiter</option>
              <option>Viewer</option>
            </select>
          </label>
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
            <p>Admin - Full control</p>
            <p>Recruiter - Hiring access</p>
            <p>Viewer - Read-only</p>
          </div>
        </div>
      </Modal>

      {/* DELETE MODAL */}
      <Modal
        open={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setDeleteText("");
        }}
        title="Confirm Account Deletion"
        footer={
          <>
            <button onClick={() => { setDeleteModalOpen(false); setDeleteText(""); }} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700">
              Cancel
            </button>
            <button
              onClick={onDeleteAccount}
              disabled={deleteText !== "DELETE" || saving}
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? "Submitting..." : "Confirm Delete"}
            </button>
          </>
        }
      >
        <p className="mb-3 text-sm text-slate-600">
          Type <span className="font-semibold text-red-600">DELETE</span> to confirm company account deletion.
        </p>
        <Input label="Confirmation" value={deleteText} onChange={(e) => setDeleteText(e.target.value)} placeholder="Type DELETE" />
      </Modal>

      {/* OTP MODAL */}
      <Modal
        open={otpModal.open}
        onClose={() => setOtpModal({ open: false, otp: "", purpose: "verify_email" })}
        title="Email OTP Verification"
        footer={
          <>
            <button onClick={() => setOtpModal({ open: false, otp: "", purpose: "verify_email" })} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700">
              Close
            </button>
            <button
              onClick={verifyOtp}
              disabled={otpVerifying}
              className="rounded-lg bg-[#F97316] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
            >
              {otpVerifying ? "Verifying..." : "Verify OTP"}
            </button>
          </>
        }
      >
        <div className="space-y-3">
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
            OTP will be sent to HR email (fallback: company email). Ensure SMTP is configured in backend.
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={sendOtp}
              disabled={otpSending}
              className="rounded-lg border border-orange-200 bg-orange-50 px-3 py-2 text-sm font-semibold text-[#F97316] hover:bg-orange-100 disabled:opacity-60"
            >
              {otpSending ? "Sending..." : "Send OTP"}
            </button>
            <select
              value={otpModal.purpose}
              onChange={(e) => setOtpModal((p) => ({ ...p, purpose: e.target.value }))}
              className="h-10 rounded-lg border border-slate-200 px-3 text-sm"
            >
              <option value="verify_email">Verify Email</option>
              <option value="sensitive_action">Sensitive Action</option>
            </select>
          </div>

          <Input
            label="Enter OTP"
            value={otpModal.otp}
            onChange={(e) => setOtpModal((p) => ({ ...p, otp: e.target.value }))}
            placeholder="6-digit OTP"
          />
        </div>
      </Modal>

    </div>
  );
}
