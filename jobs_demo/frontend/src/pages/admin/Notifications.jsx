import { useEffect, useMemo, useState } from "react";
import {
  FiEdit2,
  FiEye,
  FiPlus,
  FiSend,
  FiTrash2,
} from "react-icons/fi";

import Modal from "../../components/common/Modal";
import {
  adminDeleteNotification,
  adminDeleteNotificationTemplate,
  adminGetNotificationsCenter,
  adminListSpamReports,
  adminReviewSpamReport,
  adminSaveNotificationTemplate,
  adminSendBroadcastNotification,
  adminToggleNotificationTemplateStatus,
  adminUpdateNotificationSetting,
  adminUpdateNotificationStatus,
} from "../../services/adminService";

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

function statusClass(status) {
  const s = String(status || "").toLowerCase();
  if (s === "sent") return "bg-green-50 border-green-200 text-green-700";
  if (s === "scheduled") return "bg-blue-50 border-blue-200 text-[#2563EB]";
  return "bg-red-50 border-red-200 text-red-600";
}

export default function Notifications() {
  const [loading, setLoading] = useState(true);
  const [saveBusy, setSaveBusy] = useState(false);

  const [notifications, setNotifications] = useState([]);
  const [settings, setSettings] = useState({});
  const [templates, setTemplates] = useState([]);

  const [templateOpen, setTemplateOpen] = useState(false);
  const [spamReports, setSpamReports] = useState([]);
  const [spamBusyId, setSpamBusyId] = useState("");
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [templateForm, setTemplateForm] = useState({
    name: "",
    trigger: "New Company Registration",
    subject: "",
    body: "",
    status: "active",
  });

  const [confirmBroadcastOpen, setConfirmBroadcastOpen] = useState(false);
  const [broadcast, setBroadcast] = useState({
    title: "",
    message: "",
    audience: "All Users",
    mode: "immediate",
    scheduleAt: "",
  });

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const data = await adminGetNotificationsCenter();
        setNotifications(Array.isArray(data?.notifications) ? data.notifications : []);
        setSettings(data?.settings && typeof data.settings === "object" ? data.settings : {});
        setTemplates(Array.isArray(data?.templates) ? data.templates : []);
        const spam = await adminListSpamReports();
        setSpamReports(Array.isArray(spam) ? spam : []);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const settingsRows = useMemo(
    () =>
      Object.entries(settings).map(([key, value]) => [key, value?.label || key]),
    [settings],
  );

  const openCreateTemplate = () => {
    setEditingTemplate(null);
    setTemplateForm({ name: "", trigger: "New Company Registration", subject: "", body: "", status: "active" });
    setTemplateOpen(true);
  };

  const openEditTemplate = (row) => {
    setEditingTemplate(row);
    setTemplateForm({
      name: row.name,
      trigger: row.trigger,
      subject: row.subject,
      body: row.body,
      status: row.status,
    });
    setTemplateOpen(true);
  };

  const saveTemplate = async () => {
    setSaveBusy(true);
    try {
      const res = await adminSaveNotificationTemplate({
        id: editingTemplate?.id,
        name: templateForm.name,
        trigger: templateForm.trigger,
        subject: templateForm.subject,
        body: templateForm.body,
        status: templateForm.status,
      });

      const row = res?.template;
      if (!row) return;

      setTemplates((prev) => {
        const exists = prev.some((x) => x.id === row.id);
        return exists ? prev.map((x) => (x.id === row.id ? row : x)) : [row, ...prev];
      });
      setTemplateOpen(false);
    } finally {
      setSaveBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="h-6 w-1/3 animate-pulse rounded bg-slate-100" />
        <div className="mt-4 h-44 animate-pulse rounded-xl bg-slate-100" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section>
        <h1 className="text-2xl font-bold text-[#0F172A] sm:text-3xl">Notification Center</h1>
        <p className="mt-1 text-sm text-slate-500">Manage system alerts and user notifications</p>
        <p className="mt-2 text-xs font-medium text-slate-400">Dashboard &gt; Notifications</p>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-[#0F172A]">Spam Reports</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Reported User</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Reason</th>
                <th className="px-4 py-3">Reported By</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Created</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {spamReports.map((row) => (
                <tr key={row.id} className="border-t border-slate-100 transition hover:bg-blue-50/40">
                  <td className="px-4 py-3 font-medium text-slate-800">{row.reportedUser?.name || "-"}</td>
                  <td className="px-4 py-3 text-slate-700 capitalize">{row.reportedRole || "-"}</td>
                  <td className="px-4 py-3 text-slate-700">
                    {row.reason}
                    {row.details ? <p className="mt-0.5 text-xs text-slate-500">{row.details}</p> : null}
                  </td>
                  <td className="px-4 py-3 text-slate-700">{row.reporter?.name || "-"}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold capitalize ${row.status === "resolved" ? "bg-green-50 border-green-200 text-green-700" : row.status === "rejected" ? "bg-red-50 border-red-200 text-red-600" : "bg-amber-50 border-amber-200 text-amber-700"}`}>
                      {row.blocked ? "blocked" : row.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{row.createdAt ? new Date(row.createdAt).toISOString().slice(0, 10) : "-"}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1.5">
                      <button
                        type="button"
                        disabled={spamBusyId === row.id}
                        onClick={async () => {
                          setSpamBusyId(row.id);
                          try {
                            const res = await adminReviewSpamReport(row.id, { status: "in_review" });
                            const next = res?.report;
                            if (next) setSpamReports((prev) => prev.map((x) => (x.id === row.id ? next : x)));
                          } finally {
                            setSpamBusyId("");
                          }
                        }}
                        className="inline-flex h-8 items-center justify-center rounded-lg border border-blue-200 px-2 text-xs font-semibold text-[#2563EB] hover:bg-blue-50 disabled:opacity-60"
                      >
                        Review
                      </button>
                      <button
                        type="button"
                        disabled={spamBusyId === row.id || row.blocked}
                        onClick={async () => {
                          setSpamBusyId(row.id);
                          try {
                            const res = await adminReviewSpamReport(row.id, { status: "resolved", action: "block" });
                            const next = res?.report;
                            if (next) setSpamReports((prev) => prev.map((x) => (x.id === row.id ? next : x)));
                          } finally {
                            setSpamBusyId("");
                          }
                        }}
                        className="inline-flex h-8 items-center justify-center rounded-lg border border-red-200 px-2 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-60"
                      >
                        {row.blocked ? "Blocked" : "Block User"}
                      </button>
                      <button
                        type="button"
                        disabled={spamBusyId === row.id}
                        onClick={async () => {
                          setSpamBusyId(row.id);
                          try {
                            const res = await adminReviewSpamReport(row.id, { status: "rejected" });
                            const next = res?.report;
                            if (next) setSpamReports((prev) => prev.map((x) => (x.id === row.id ? next : x)));
                          } finally {
                            setSpamBusyId("");
                          }
                        }}
                        className="inline-flex h-8 items-center justify-center rounded-lg border border-slate-200 px-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                      >
                        Dismiss
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!spamReports.length ? (
                <tr className="border-t border-slate-100"><td colSpan={7} className="px-4 py-8 text-center text-slate-500">No spam reports yet.</td></tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-[#0F172A]">Recent Notifications</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Title</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Target</th>
                <th className="px-4 py-3">Triggered By</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {notifications.map((row) => (
                <tr key={row.id} className="border-t border-slate-100 transition hover:bg-blue-50/40">
                  <td className="px-4 py-3 font-medium text-slate-800">{row.title}</td>
                  <td className="px-4 py-3 text-slate-700">{row.type}</td>
                  <td className="px-4 py-3 text-slate-700">{row.target}</td>
                  <td className="px-4 py-3 text-slate-700">{row.triggeredBy}</td>
                  <td className="px-4 py-3 text-slate-600">{row.date}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold capitalize ${statusClass(row.status)}`}>{row.status}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1.5">
                      <button type="button" title="View" className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-blue-200 text-[#2563EB] hover:bg-blue-50"><FiEye /></button>
                      <button type="button" title="Resend" onClick={async () => {
                        const res = await adminUpdateNotificationStatus(row.id, "sent");
                        const nextRow = res?.notification;
                        if (!nextRow) return;
                        setNotifications((prev) => prev.map((x) => (x.id === row.id ? nextRow : x)));
                      }} className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-green-200 text-green-700 hover:bg-green-50"><FiSend /></button>
                      <button type="button" title="Delete" onClick={async () => {
                        await adminDeleteNotification(row.id);
                        setNotifications((prev) => prev.filter((x) => x.id !== row.id));
                      }} className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-red-200 text-red-600 hover:bg-red-50"><FiTrash2 /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {!notifications.length ? (
                <tr className="border-t border-slate-100"><td colSpan={7} className="px-4 py-10 text-center text-slate-500">No notifications found.</td></tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-[#0F172A]">Notification Settings</h2>
        <div className="space-y-3">
          {settingsRows.map(([key, label]) => (
            <div key={key} className="grid grid-cols-1 items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/70 px-3 py-2 md:grid-cols-[1fr_auto_auto_auto]">
              <p className="text-sm font-medium text-slate-700">{label}</p>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500">Email</span>
                <Toggle checked={!!settings[key]?.email} onChange={async () => {
                  const next = { ...(settings[key] || {}), email: !settings[key]?.email };
                  setSettings((prev) => ({ ...prev, [key]: { ...prev[key], email: next.email } }));
                  await adminUpdateNotificationSetting(key, { email: next.email, app: !!settings[key]?.app, sms: !!settings[key]?.sms });
                }} />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500">In-App</span>
                <Toggle checked={!!settings[key]?.app} onChange={async () => {
                  const next = { ...(settings[key] || {}), app: !settings[key]?.app };
                  setSettings((prev) => ({ ...prev, [key]: { ...prev[key], app: next.app } }));
                  await adminUpdateNotificationSetting(key, { email: !!settings[key]?.email, app: next.app, sms: !!settings[key]?.sms });
                }} />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500">SMS</span>
                <Toggle checked={!!settings[key]?.sms} onChange={async () => {
                  const next = { ...(settings[key] || {}), sms: !settings[key]?.sms };
                  setSettings((prev) => ({ ...prev, [key]: { ...prev[key], sms: next.sms } }));
                  await adminUpdateNotificationSetting(key, { email: !!settings[key]?.email, app: !!settings[key]?.app, sms: next.sms });
                }} />
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-[#0F172A]">Email Templates</h2>
          <button type="button" onClick={openCreateTemplate} className="inline-flex items-center gap-2 rounded-lg bg-[#2563EB] px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">
            <FiPlus /> Create New Template
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Template Name</th>
                <th className="px-4 py-3">Trigger Event</th>
                <th className="px-4 py-3">Last Modified</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {templates.map((row) => (
                <tr key={row.id} className="border-t border-slate-100 transition hover:bg-blue-50/40">
                  <td className="px-4 py-3 font-medium text-slate-800">{row.name}</td>
                  <td className="px-4 py-3 text-slate-700">{row.trigger}</td>
                  <td className="px-4 py-3 text-slate-600">{row.modified}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold capitalize ${row.status === "active" ? "bg-green-50 border-green-200 text-green-700" : "bg-slate-100 border-slate-200 text-slate-600"}`}>
                      {row.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1.5">
                      <button type="button" title="Edit Template" onClick={() => openEditTemplate(row)} className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-blue-200 text-[#2563EB] hover:bg-blue-50"><FiEdit2 /></button>
                      <button type="button" title="Preview" onClick={() => openEditTemplate(row)} className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-green-200 text-green-700 hover:bg-green-50"><FiEye /></button>
                      <button type="button" title="Disable" onClick={async () => {
                        const nextStatus = row.status === "active" ? "disabled" : "active";
                        const res = await adminToggleNotificationTemplateStatus(row.id, nextStatus);
                        const nextRow = res?.template;
                        if (!nextRow) return;
                        setTemplates((prev) => prev.map((x) => (x.id === row.id ? nextRow : x)));
                      }} className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-red-200 text-red-600 hover:bg-red-50"><FiTrash2 /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {!templates.length ? (
                <tr className="border-t border-slate-100"><td colSpan={5} className="px-4 py-10 text-center text-slate-500">No templates found.</td></tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-[#0F172A]">Send Broadcast Notification</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <input value={broadcast.title} onChange={(e) => setBroadcast((p) => ({ ...p, title: e.target.value }))} placeholder="Title" className="h-10 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-blue-300" />
          <select value={broadcast.audience} onChange={(e) => setBroadcast((p) => ({ ...p, audience: e.target.value }))} className="h-10 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-blue-300">
            <option>All Users</option>
            <option>Companies</option>
            <option>Students</option>
            <option>Admins</option>
          </select>
          <textarea value={broadcast.message} onChange={(e) => setBroadcast((p) => ({ ...p, message: e.target.value }))} rows={4} placeholder="Message" className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-300 md:col-span-2" />
          <select value={broadcast.mode} onChange={(e) => setBroadcast((p) => ({ ...p, mode: e.target.value }))} className="h-10 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-blue-300">
            <option value="immediate">Send Immediately</option>
            <option value="scheduled">Schedule</option>
          </select>
          <input type="datetime-local" value={broadcast.scheduleAt} onChange={(e) => setBroadcast((p) => ({ ...p, scheduleAt: e.target.value }))} className="h-10 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-blue-300" />
        </div>
        <button type="button" onClick={() => setConfirmBroadcastOpen(true)} className="mt-4 rounded-lg bg-[#2563EB] px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">
          Send Broadcast
        </button>
      </section>

      <Modal
        open={templateOpen}
        onClose={() => setTemplateOpen(false)}
        title={editingTemplate ? "Edit Email Template" : "Create Email Template"}
        widthClass="max-w-5xl"
        footer={
          <>
            <button type="button" onClick={() => setTemplateOpen(false)} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50">
              Cancel
            </button>
            <button type="button" disabled={saveBusy} onClick={saveTemplate} className="rounded-lg bg-[#2563EB] px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70">
              {saveBusy ? "Saving..." : "Save Template"}
            </button>
          </>
        }
      >
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <div className="space-y-4">
            <input value={templateForm.name} onChange={(e) => setTemplateForm((p) => ({ ...p, name: e.target.value }))} placeholder="Template Name" className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-blue-300" />
            <input value={templateForm.subject} onChange={(e) => setTemplateForm((p) => ({ ...p, subject: e.target.value }))} placeholder="Subject Line" className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-blue-300" />
            <select value={templateForm.trigger} onChange={(e) => setTemplateForm((p) => ({ ...p, trigger: e.target.value }))} className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-blue-300">
              <option>New Company Registration</option>
              <option>New Student Registration</option>
              <option>Plan Purchase</option>
              <option>Plan Expiry</option>
              <option>Job Posted</option>
              <option>Application Submitted</option>
            </select>
            <textarea value={templateForm.body} onChange={(e) => setTemplateForm((p) => ({ ...p, body: e.target.value }))} rows={8} placeholder="Email Body (Rich Text)" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-300" />
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Variables</p>
              <p className="mt-1 text-sm text-slate-600">{"{{company_name}}, {{student_name}}, {{job_title}}, {{expiry_date}}"}</p>
            </div>
            <button type="button" className="rounded-lg border border-blue-200 px-3 py-2 text-sm font-semibold text-[#2563EB] hover:bg-blue-50">
              Send Test Email
            </button>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm font-semibold text-[#0F172A]">Preview</p>
            <p className="mt-2 text-sm font-medium text-slate-800">{templateForm.subject || "Subject preview"}</p>
            <div className="mt-3 rounded-lg bg-white p-3 text-sm text-slate-700 shadow-sm">
              {templateForm.body || "Email body preview appears here."}
            </div>
          </div>
        </div>
      </Modal>

      <Modal
        open={confirmBroadcastOpen}
        onClose={() => setConfirmBroadcastOpen(false)}
        title="Send Broadcast Notification?"
        footer={
          <>
            <button type="button" onClick={() => setConfirmBroadcastOpen(false)} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50">
              Cancel
            </button>
            <button type="button" onClick={async () => {
              const res = await adminSendBroadcastNotification(broadcast);
              const row = res?.notification;
              if (row) setNotifications((prev) => [row, ...prev]);
              setConfirmBroadcastOpen(false);
              setBroadcast({ title: "", message: "", audience: "All Users", mode: "immediate", scheduleAt: "" });
            }} className="rounded-lg bg-[#2563EB] px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">
              Confirm Send
            </button>
          </>
        }
      >
        <p className="text-sm text-slate-600">This will send the broadcast to <span className="font-semibold text-[#0F172A]">{broadcast.audience}</span>.</p>
      </Modal>
    </div>
  );
}
