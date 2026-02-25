// frontend/src/pages/student/Notifications.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FiBell,
  FiBookmark,
  FiBriefcase,
  FiCheckCircle,
  FiClock,
  FiMessageCircle,
  FiMoreVertical,
  FiRefreshCw,
} from "react-icons/fi";
import Modal from "../../components/common/Modal";

// ✅ Backend APIs
import {
  studentListNotifications,
  studentMarkAllNotificationsRead,
  studentToggleNotificationRead,
  studentGetNotificationPrefs,
  studentSaveNotificationPrefs,
  studentToggleSaveJob,
} from "../../services/studentService";

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

const iconByType = {
  application: <FiCheckCircle className="text-[#2563EB]" />,
  shortlisted: <FiCheckCircle className="text-green-600" />,
  hold: <FiClock className="text-[#F97316]" />,
  rejected: <FiRefreshCw className="text-red-600" />,
  job: <FiBriefcase className="text-[#2563EB]" />,
  message: <FiMessageCircle className="text-[#2563EB]" />,
  system: <FiBell className="text-[#2563EB]" />,
};

const DEFAULT_FILTERS = { type: "All", status: "All", range: "Last 30 days" };

const DEFAULT_PREFS = {
  appStatus: true,
  employerMessages: true,
  jobRecs: true,
  govUpdates: true,
  internshipAlerts: true,
  announcements: true,
  emailStatus: true,
  emailJobs: true,
  emailMessages: true,
  weeklyDigest: false,
  whatsapp: false,
  sms: false,
  frequency: "Instant",
};

export default function Notifications() {
  const navigate = useNavigate();
  const shownBrowserAlertsRef = useRef(new Set());
  const [items, setItems] = useState([]);
  const [apiUnread, setApiUnread] = useState(0);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const [search, setSearch] = useState("");
  const [draft, setDraft] = useState(DEFAULT_FILTERS);
  const [filters, setFilters] = useState(DEFAULT_FILTERS);

  const [prefs, setPrefs] = useState(DEFAULT_PREFS);
  const [prefsLoading, setPrefsLoading] = useState(true);

  const [mobilePrefsOpen, setMobilePrefsOpen] = useState(false);
  const [saveModal, setSaveModal] = useState(false);

  // ===========
  // Backend load
  // ===========
  const fetchNotifications = async (opts = {}) => {
    try {
      setErr("");
      setLoading(true);

      const params = {
        type: opts.type ?? filters.type,
        status: opts.status ?? filters.status,
        q: opts.q ?? search,
      };

      const res = await studentListNotifications(params);
      // backend returns { items, unreadCount }
      setItems(res?.data?.items || []);
      setApiUnread(Number(res?.data?.unreadCount || 0));
    } catch (e) {
      setErr(e?.response?.data?.message || e?.message || "Failed to load notifications");
    } finally {
      setLoading(false);
    }
  };

  const fetchPrefs = async () => {
    try {
      setPrefsLoading(true);
      const res = await studentGetNotificationPrefs();
      setPrefs((p) => ({ ...p, ...(res?.data || {}) }));
    } catch {
      // keep defaults (don't block UI)
    } finally {
      setPrefsLoading(false);
    }
  };

  useEffect(() => {
    fetchPrefs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // fetch on first mount + when filters/search change (debounced)
  useEffect(() => {
    const t = setTimeout(() => {
      fetchNotifications();
    }, 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.type, filters.status, search]);

  useEffect(() => {
    const timer = setInterval(() => {
      fetchNotifications();
    }, 30000);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const unreadCount = useMemo(
    () => (apiUnread || items.filter((item) => item.status === "Unread").length),
    [apiUnread, items]
  );

  const filtered = useMemo(() => {
    // backend already filters by type/status/q
    // we can still do client-side range filter if you want (Today/Last 7/Last 30)
    const range = filters.range;

    if (!range || range === "Last 30 days") return items;

    const now = Date.now();
    const maxAgeDays = range === "Today" ? 1 : range === "Last 7 days" ? 7 : 30;

    return items.filter((x) => {
      const created = new Date(x.createdAt || x.time || Date.now()).getTime();
      const ageDays = (now - created) / (1000 * 60 * 60 * 24);
      return ageDays <= maxAgeDays;
    });
  }, [items, filters.range]);

  const grouped = useMemo(() => {
    return {
      Today: filtered.filter((x) => x.group === "Today"),
      Yesterday: filtered.filter((x) => x.group === "Yesterday"),
      Earlier: filtered.filter((x) => x.group === "Earlier"),
    };
  }, [filtered]);

  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window)) return;
    if (window.Notification.permission !== "granted") return;

    items.forEach((item) => {
      const isReminder =
        item?.status === "Unread" &&
        /interview reminder|starting now/i.test(String(item?.title || ""));
      if (!isReminder) return;
      if (shownBrowserAlertsRef.current.has(item.id)) return;

      shownBrowserAlertsRef.current.add(item.id);
      try {
        // Browser-level alert when reminders arrive.
        new window.Notification(item.title || "Interview Reminder", {
          body: item.description || "",
        });
      } catch {
        // no-op
      }
    });
  }, [items]);

  // ===========
  // Actions
  // ===========
  const applyFilter = () => setFilters(draft);

  const clearFilter = () => {
    setDraft(DEFAULT_FILTERS);
    setFilters(DEFAULT_FILTERS);
    setSearch("");
  };

  const markAllRead = async () => {
    try {
      await studentMarkAllNotificationsRead();
      // optimistic update
      setItems((prev) => prev.map((x) => ({ ...x, status: "Read" })));
      setApiUnread(0);
    } catch (e) {
      setErr(e?.response?.data?.message || e?.message || "Failed to mark all read");
    }
  };

  const toggleRead = async (id) => {
    try {
      await studentToggleNotificationRead(id);
      setItems((prev) => {
        const target = prev.find((x) => x.id === id);
        const wasUnread = target?.status === "Unread";
        setApiUnread((n) => Math.max(0, n + (wasUnread ? -1 : 1)));
        return prev.map((x) =>
          x.id === id
            ? { ...x, status: x.status === "Unread" ? "Read" : "Unread" }
            : x
        );
      });
    } catch (e) {
      setErr(e?.response?.data?.message || e?.message || "Failed to update notification");
    }
  };

  const savePrefs = async () => {
    try {
      await studentSaveNotificationPrefs(prefs);
      setSaveModal(true);
    } catch (e) {
      setErr(e?.response?.data?.message || e?.message || "Failed to save preferences");
    }
  };

  // Button renderer (keeps your UI same style)
  const onAction = async (item, action) => {
    const meta = item?.meta || {};
    if (action === "Reply") {
      if (meta.conversationId) {
        navigate(`/student/messages?thread=${meta.conversationId}`);
      } else {
        navigate("/student/messages");
      }
      return;
    }
    if (action === "View Job") {
      if (meta.jobId) navigate(`/student/jobs/${meta.jobId}`);
      else navigate("/student/jobs");
      return;
    }
    if (action === "View Application") {
      navigate("/student/my-jobs");
      return;
    }
    if (action === "Join Meeting") {
      if (meta.url) {
        window.open(meta.url, "_blank", "noopener,noreferrer");
      }
      return;
    }
    if (action === "Save Job") {
      try {
        if (!meta.jobId) return;
        await studentToggleSaveJob(meta.jobId);
      } catch (e) {
        setErr(e?.response?.data?.message || e?.message || "Failed to save job.");
      }
      return;
    }
    if (meta.url) {
      window.open(meta.url, "_blank", "noopener,noreferrer");
    }
  };

  const actionButton = (item, action) => {
    if (action === "Reply") {
      return (
        <button
          type="button"
          onClick={() => onAction(item, action)}
          className="rounded-md border border-blue-200 px-2.5 py-1 text-xs font-semibold text-[#2563EB] hover:bg-blue-50"
        >
          Reply
        </button>
      );
    }
    if (action === "Save Job") {
      return (
        <button
          type="button"
          onClick={() => onAction(item, action)}
          className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50"
        >
          <FiBookmark />
          Save Job
        </button>
      );
    }
    return (
      <button
        type="button"
        onClick={() => onAction(item, action)}
        className="rounded-md px-1 py-1 text-xs font-semibold text-[#2563EB] hover:underline"
      >
        {action}
      </button>
    );
  };

  const renderFeed = (label, data) => {
    if (data.length === 0) return null;
    return (
      <section key={label} className="space-y-2">
        <h3 className="text-sm font-semibold text-slate-500">{label}</h3>
        {data.map((item) => (
          <article
            key={item.id}
            className={`rounded-2xl border p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${
              item.status === "Unread"
                ? "border-blue-200 bg-blue-50/50"
                : "border-slate-200 bg-white"
            }`}
          >
            <div className="flex items-start gap-3">
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white border border-slate-200">
                {iconByType[item.icon] || <FiBell className="text-[#2563EB]" />}
              </div>

              <div className="min-w-0 flex-1">
                <p
                  className={`text-sm ${
                    item.status === "Unread"
                      ? "font-semibold text-[#0F172A]"
                      : "font-medium text-slate-700"
                  }`}
                >
                  {item.title}
                </p>
                <p className="mt-1 text-sm text-slate-600">{item.description}</p>
                <p className="mt-1 text-xs text-slate-500">{item.time}</p>

                <div className="mt-2 flex flex-wrap items-center gap-2">
                  {(item.actions || []).map((action) => (
                    <span key={`${item.id}_${action}`}>{actionButton(item, action)}</span>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2">
                {item.status === "Unread" ? (
                  <span className="h-2.5 w-2.5 rounded-full bg-[#2563EB]" />
                ) : null}
                <button
                  type="button"
                  onClick={() => toggleRead(item.id)}
                  className="rounded-md p-1 text-slate-500 hover:bg-slate-100"
                  title={item.status === "Unread" ? "Mark as read" : "Mark as unread"}
                >
                  <FiMoreVertical />
                </button>
              </div>
            </div>
          </article>
        ))}
      </section>
    );
  };

  return (
    <div className="bg-[#F8FAFC] pb-20 md:pb-8">
      <div className="mx-auto max-w-[1200px] space-y-5 px-4 py-6 sm:px-6 lg:px-8">
        <section className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold text-[#0F172A]">Notifications</h1>
            <p className="mt-1 text-sm text-slate-500">
              Stay updated on applications, job alerts, and employer messages
            </p>
            {err ? (
              <div className="mt-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {err}
              </div>
            ) : null}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={markAllRead}
              className="rounded-lg border border-blue-200 px-3 py-2 text-sm font-semibold text-[#2563EB] hover:bg-blue-50"
            >
              Mark All as Read
            </button>
          </div>
        </section>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
          <main className="space-y-4">
            <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-5">
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search notifications..."
                  className="h-10 rounded-lg border border-slate-200 px-3 text-sm outline-none xl:col-span-2 focus:border-blue-300"
                />
                <select
                  value={draft.type}
                  onChange={(e) => setDraft((p) => ({ ...p, type: e.target.value }))}
                  className="h-10 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-blue-300"
                >
                  <option>All</option>
                  <option>Applications</option>
                  <option>Jobs</option>
                  <option>Messages</option>
                  <option>System</option>
                </select>
                <select
                  value={draft.status}
                  onChange={(e) => setDraft((p) => ({ ...p, status: e.target.value }))}
                  className="h-10 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-blue-300"
                >
                  <option>All</option>
                  <option>Unread</option>
                  <option>Read</option>
                </select>
                <select
                  value={draft.range}
                  onChange={(e) => setDraft((p) => ({ ...p, range: e.target.value }))}
                  className="h-10 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-blue-300"
                >
                  <option>Today</option>
                  <option>Last 7 days</option>
                  <option>Last 30 days</option>
                </select>
              </div>

              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={applyFilter}
                  className="rounded-lg bg-[#2563EB] px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                >
                  Apply
                </button>
                <button
                  type="button"
                  onClick={clearFilter}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Clear
                </button>
                <button
                  type="button"
                  onClick={() => fetchNotifications()}
                  className="ml-auto rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                  title="Refresh"
                >
                  Refresh
                </button>
              </div>
            </section>

            {loading ? (
              <section className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
                <div className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-full bg-blue-50 text-[#2563EB]">
                  <FiBell />
                </div>
                <h2 className="mt-3 text-xl font-semibold text-[#0F172A]">
                  Loading notifications...
                </h2>
                <p className="mt-1 text-sm text-slate-500">Please wait.</p>
              </section>
            ) : filtered.length === 0 ? (
              <section className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
                <div className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-full bg-blue-50 text-[#2563EB]">
                  <FiBell />
                </div>
                <h2 className="mt-3 text-xl font-semibold text-[#0F172A]">
                  You&apos;re all caught up
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  No notifications match your current filters.
                </p>
                <Link
                  to="/student/jobs"
                  className="mt-4 inline-flex rounded-lg bg-[#2563EB] px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                >
                  Browse Jobs
                </Link>
              </section>
            ) : (
              <section className="space-y-4">
                {renderFeed("Today", grouped.Today)}
                {renderFeed("Yesterday", grouped.Yesterday)}
                {renderFeed("Earlier", grouped.Earlier)}
              </section>
            )}
          </main>

          <aside
            id="preferences"
            className={`lg:sticky lg:top-20 lg:h-fit ${
              mobilePrefsOpen ? "" : "max-md:hidden"
            }`}
          >
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <h2 className="text-lg font-semibold text-[#0F172A]">
                Notification Preferences
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                Choose how you want to receive updates.
              </p>

              {prefsLoading ? (
                <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
                  Loading preferences...
                </div>
              ) : (
                <>
                  <div className="mt-4 space-y-2">
                    <p className="text-xs font-semibold text-slate-500">
                      In-App Preferences
                    </p>
                    {[
                      ["Application status updates", "appStatus"],
                      ["Employer messages", "employerMessages"],
                      ["New job recommendations", "jobRecs"],
                      ["Government job updates", "govUpdates"],
                      ["Internship alerts", "internshipAlerts"],
                      ["System announcements", "announcements"],
                    ].map(([label, key]) => (
                      <div
                        key={key}
                        className="flex items-center justify-between text-sm text-slate-700"
                      >
                        <span>{label}</span>
                        <Toggle
                          checked={!!prefs[key]}
                          onChange={() =>
                            setPrefs((p) => ({ ...p, [key]: !p[key] }))
                          }
                        />
                      </div>
                    ))}
                  </div>

                  <div className="mt-5 space-y-2 border-t border-slate-100 pt-4">
                    <p className="text-xs font-semibold text-slate-500">
                      Email Preferences
                    </p>
                    {[
                      ["Email for application status", "emailStatus"],
                      ["Email for job alerts", "emailJobs"],
                      ["Email for employer messages", "emailMessages"],
                      ["Weekly job digest", "weeklyDigest"],
                    ].map(([label, key]) => (
                      <div
                        key={key}
                        className="flex items-center justify-between text-sm text-slate-700"
                      >
                        <span>{label}</span>
                        <Toggle
                          checked={!!prefs[key]}
                          onChange={() =>
                            setPrefs((p) => ({ ...p, [key]: !p[key] }))
                          }
                        />
                      </div>
                    ))}
                    <select
                      value={prefs.frequency}
                      onChange={(e) =>
                        setPrefs((p) => ({ ...p, frequency: e.target.value }))
                      }
                      className="mt-2 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-blue-300"
                    >
                      <option>Instant</option>
                      <option>Daily summary</option>
                      <option>Weekly summary</option>
                    </select>
                  </div>

                  <div className="mt-5 space-y-2 border-t border-slate-100 pt-4">
                    <p className="text-xs font-semibold text-slate-500">
                      Optional Channels
                    </p>
                    <div className="flex items-center justify-between text-sm text-slate-700">
                      <span>WhatsApp alerts</span>
                      <Toggle
                        checked={!!prefs.whatsapp}
                        onChange={() =>
                          setPrefs((p) => ({ ...p, whatsapp: !p.whatsapp }))
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between text-sm text-slate-700">
                      <span>SMS alerts</span>
                      <Toggle
                        checked={!!prefs.sms}
                        onChange={() =>
                          setPrefs((p) => ({ ...p, sms: !p.sms }))
                        }
                      />
                    </div>
                    {prefs.whatsapp || prefs.sms ? (
                      <button
                        type="button"
                        className="text-xs font-semibold text-[#2563EB] hover:underline"
                      >
                        Verify phone number
                      </button>
                    ) : null}
                  </div>

                  <div className="mt-5 flex gap-2">
                    <button
                      type="button"
                      onClick={savePrefs}
                      className="rounded-lg bg-[#2563EB] px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                    >
                      Save Preferences
                    </button>
                    <button
                      type="button"
                      onClick={() => setPrefs(DEFAULT_PREFS)}
                      className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      Reset
                    </button>
                  </div>
                </>
              )}
            </div>
          </aside>
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white p-3 shadow-[0_-8px_24px_rgba(15,23,42,0.08)] md:hidden">
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={markAllRead}
            className="rounded-lg border border-blue-200 px-3 py-2 text-sm font-semibold text-[#2563EB]"
          >
            Mark all read
          </button>
          <button
            type="button"
            onClick={() => setMobilePrefsOpen((v) => !v)}
            className="rounded-lg bg-[#2563EB] px-3 py-2 text-sm font-semibold text-white"
          >
            {mobilePrefsOpen ? "Hide Settings" : `Settings (${unreadCount})`}
          </button>
        </div>
      </div>

      <Modal
        open={saveModal}
        onClose={() => setSaveModal(false)}
        title="Preferences saved"
        footer={
          <button
            type="button"
            onClick={() => setSaveModal(false)}
            className="rounded-lg bg-[#2563EB] px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
            Done
          </button>
        }
      >
        <p className="text-sm text-slate-700">Preferences saved successfully.</p>
      </Modal>
    </div>
  );
}
