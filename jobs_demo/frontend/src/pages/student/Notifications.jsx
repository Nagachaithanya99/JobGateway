// // frontend/src/pages/student/Notifications.jsx
// import { useEffect, useMemo, useRef, useState } from "react";
// import { Link, useNavigate } from "react-router-dom";
// import {
//   FiBell,
//   FiBookmark,
//   FiBriefcase,
//   FiCheckCircle,
//   FiClock,
//   FiMessageCircle,
//   FiMoreVertical,
//   FiRefreshCw,
// } from "react-icons/fi";
// import Modal from "../../components/common/Modal";

// // ✅ Backend APIs
// import {
//   studentListNotifications,
//   studentMarkAllNotificationsRead,
//   studentToggleNotificationRead,
//   studentGetNotificationPrefs,
//   studentSaveNotificationPrefs,
//   studentToggleSaveJob,
// } from "../../services/studentService";

// function Toggle({ checked, onChange }) {
//   return (
//     <button
//       type="button"
//       onClick={onChange}
//       className={`relative h-5 w-10 rounded-full transition ${
//         checked ? "bg-[#2563EB]" : "bg-slate-300"
//       }`}
//     >
//       <span
//         className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition ${
//           checked ? "left-[22px]" : "left-0.5"
//         }`}
//       />
//     </button>
//   );
// }

// const iconByType = {
//   application: <FiCheckCircle className="text-[#2563EB]" />,
//   shortlisted: <FiCheckCircle className="text-green-600" />,
//   hold: <FiClock className="text-[#F97316]" />,
//   rejected: <FiRefreshCw className="text-red-600" />,
//   job: <FiBriefcase className="text-[#2563EB]" />,
//   message: <FiMessageCircle className="text-[#2563EB]" />,
//   system: <FiBell className="text-[#2563EB]" />,
// };

// const DEFAULT_FILTERS = { type: "All", status: "All", range: "Last 30 days" };

// const DEFAULT_PREFS = {
//   appStatus: true,
//   employerMessages: true,
//   jobRecs: true,
//   govUpdates: true,
//   internshipAlerts: true,
//   announcements: true,
//   emailStatus: true,
//   emailJobs: true,
//   emailMessages: true,
//   weeklyDigest: false,
//   whatsapp: false,
//   sms: false,
//   frequency: "Instant",
// };

// export default function Notifications() {
//   const navigate = useNavigate();
//   const shownBrowserAlertsRef = useRef(new Set());
//   const [items, setItems] = useState([]);
//   const [apiUnread, setApiUnread] = useState(0);
//   const [loading, setLoading] = useState(true);
//   const [err, setErr] = useState("");

//   const [search, setSearch] = useState("");
//   const [draft, setDraft] = useState(DEFAULT_FILTERS);
//   const [filters, setFilters] = useState(DEFAULT_FILTERS);

//   const [prefs, setPrefs] = useState(DEFAULT_PREFS);
//   const [prefsLoading, setPrefsLoading] = useState(true);

//   const [mobilePrefsOpen, setMobilePrefsOpen] = useState(false);
//   const [saveModal, setSaveModal] = useState(false);

//   // ===========
//   // Backend load
//   // ===========
//   const fetchNotifications = async (opts = {}) => {
//     try {
//       setErr("");
//       setLoading(true);

//       const params = {
//         type: opts.type ?? filters.type,
//         status: opts.status ?? filters.status,
//         q: opts.q ?? search,
//       };

//       const res = await studentListNotifications(params);
//       // backend returns { items, unreadCount }
//       setItems(res?.data?.items || []);
//       setApiUnread(Number(res?.data?.unreadCount || 0));
//     } catch (e) {
//       setErr(e?.response?.data?.message || e?.message || "Failed to load notifications");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const fetchPrefs = async () => {
//     try {
//       setPrefsLoading(true);
//       const res = await studentGetNotificationPrefs();
//       setPrefs((p) => ({ ...p, ...(res?.data || {}) }));
//     } catch {
//       // keep defaults (don't block UI)
//     } finally {
//       setPrefsLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchPrefs();
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, []);

//   // fetch on first mount + when filters/search change (debounced)
//   useEffect(() => {
//     const t = setTimeout(() => {
//       fetchNotifications();
//     }, 250);
//     return () => clearTimeout(t);
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [filters.type, filters.status, search]);

//   useEffect(() => {
//     const timer = setInterval(() => {
//       fetchNotifications();
//     }, 30000);
//     return () => clearInterval(timer);
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, []);

//   const unreadCount = useMemo(
//     () => (apiUnread || items.filter((item) => item.status === "Unread").length),
//     [apiUnread, items]
//   );

//   const filtered = useMemo(() => {
//     // backend already filters by type/status/q
//     // we can still do client-side range filter if you want (Today/Last 7/Last 30)
//     const range = filters.range;

//     if (!range || range === "Last 30 days") return items;

//     const now = Date.now();
//     const maxAgeDays = range === "Today" ? 1 : range === "Last 7 days" ? 7 : 30;

//     return items.filter((x) => {
//       const created = new Date(x.createdAt || x.time || Date.now()).getTime();
//       const ageDays = (now - created) / (1000 * 60 * 60 * 24);
//       return ageDays <= maxAgeDays;
//     });
//   }, [items, filters.range]);

//   const grouped = useMemo(() => {
//     return {
//       Today: filtered.filter((x) => x.group === "Today"),
//       Yesterday: filtered.filter((x) => x.group === "Yesterday"),
//       Earlier: filtered.filter((x) => x.group === "Earlier"),
//     };
//   }, [filtered]);

//   useEffect(() => {
//     if (typeof window === "undefined" || !("Notification" in window)) return;
//     if (window.Notification.permission !== "granted") return;

//     items.forEach((item) => {
//       const isReminder =
//         item?.status === "Unread" &&
//         /interview reminder|starting now/i.test(String(item?.title || ""));
//       if (!isReminder) return;
//       if (shownBrowserAlertsRef.current.has(item.id)) return;

//       shownBrowserAlertsRef.current.add(item.id);
//       try {
//         // Browser-level alert when reminders arrive.
//         new window.Notification(item.title || "Interview Reminder", {
//           body: item.description || "",
//         });
//       } catch {
//         // no-op
//       }
//     });
//   }, [items]);

//   // ===========
//   // Actions
//   // ===========
//   const applyFilter = () => setFilters(draft);

//   const clearFilter = () => {
//     setDraft(DEFAULT_FILTERS);
//     setFilters(DEFAULT_FILTERS);
//     setSearch("");
//   };

//   const markAllRead = async () => {
//     try {
//       await studentMarkAllNotificationsRead();
//       // optimistic update
//       setItems((prev) => prev.map((x) => ({ ...x, status: "Read" })));
//       setApiUnread(0);
//     } catch (e) {
//       setErr(e?.response?.data?.message || e?.message || "Failed to mark all read");
//     }
//   };

//   const toggleRead = async (id) => {
//     try {
//       await studentToggleNotificationRead(id);
//       setItems((prev) => {
//         const target = prev.find((x) => x.id === id);
//         const wasUnread = target?.status === "Unread";
//         setApiUnread((n) => Math.max(0, n + (wasUnread ? -1 : 1)));
//         return prev.map((x) =>
//           x.id === id
//             ? { ...x, status: x.status === "Unread" ? "Read" : "Unread" }
//             : x
//         );
//       });
//     } catch (e) {
//       setErr(e?.response?.data?.message || e?.message || "Failed to update notification");
//     }
//   };

//   const markAsRead = async (id) => {
//     try {
//       const target = items.find((x) => x.id === id);
//       if (!target || target.status !== "Unread") return;

//       await studentToggleNotificationRead(id);
//       setItems((prev) =>
//         prev.map((x) => (x.id === id ? { ...x, status: "Read" } : x))
//       );
//       setApiUnread((n) => Math.max(0, n - 1));
//     } catch (e) {
//       setErr(e?.response?.data?.message || e?.message || "Failed to update notification");
//     }
//   };

//   const savePrefs = async () => {
//     try {
//       await studentSaveNotificationPrefs(prefs);
//       setSaveModal(true);
//     } catch (e) {
//       setErr(e?.response?.data?.message || e?.message || "Failed to save preferences");
//     }
//   };

//   // Button renderer (keeps your UI same style)
//   const onAction = async (item, action) => {
//     const meta = item?.meta || {};
//     if (action === "Reply") {
//       if (meta.conversationId) {
//         navigate(`/student/messages?thread=${meta.conversationId}`);
//       } else {
//         navigate("/student/messages");
//       }
//       return;
//     }
//     if (action === "View Job") {
//       if (meta.jobId) navigate(`/student/jobs/${meta.jobId}`);
//       else navigate("/student/jobs");
//       return;
//     }
//     if (action === "View Application") {
//       navigate("/student/my-jobs");
//       return;
//     }
//     if (action === "Join Meeting") {
//       if (meta.url) {
//         window.open(meta.url, "_blank", "noopener,noreferrer");
//       }
//       return;
//     }
//     if (action === "Save Job") {
//       try {
//         if (!meta.jobId) return;
//         await studentToggleSaveJob(meta.jobId);
//       } catch (e) {
//         setErr(e?.response?.data?.message || e?.message || "Failed to save job.");
//       }
//       return;
//     }
//     if (meta.url) {
//       window.open(meta.url, "_blank", "noopener,noreferrer");
//     }
//   };

//   const actionButton = (item, action) => {
//     if (action === "Reply") {
//       return (
//         <button
//           type="button"
//           onClick={(e) => {
//             e.stopPropagation();
//             onAction(item, action);
//           }}
//           className="rounded-md border border-blue-200 px-2.5 py-1 text-xs font-semibold text-[#2563EB] hover:bg-blue-50"
//         >
//           Reply
//         </button>
//       );
//     }
//     if (action === "Save Job") {
//       return (
//         <button
//           type="button"
//           onClick={(e) => {
//             e.stopPropagation();
//             onAction(item, action);
//           }}
//           className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50"
//         >
//           <FiBookmark />
//           Save Job
//         </button>
//       );
//     }
//     return (
//       <button
//         type="button"
//         onClick={(e) => {
//           e.stopPropagation();
//           onAction(item, action);
//         }}
//         className="rounded-md px-1 py-1 text-xs font-semibold text-[#2563EB] hover:underline"
//       >
//         {action}
//       </button>
//     );
//   };

//   const renderFeed = (label, data) => {
//     if (data.length === 0) return null;
//     return (
//       <section key={label} className="space-y-2">
//         <h3 className="text-sm font-semibold text-slate-500">{label}</h3>
//         {data.map((item) => (
//           <article
//             key={item.id}
//             onClick={() => markAsRead(item.id)}
//             className={`rounded-2xl border p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${
//               item.status === "Unread"
//                 ? "border-blue-200 bg-blue-50/50"
//                 : "border-slate-200 bg-white"
//             }`}
//           >
//             <div className="flex items-start gap-3">
//               <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white border border-slate-200">
//                 {iconByType[item.icon] || <FiBell className="text-[#2563EB]" />}
//               </div>

//               <div className="min-w-0 flex-1">
//                 <p
//                   className={`text-sm ${
//                     item.status === "Unread"
//                       ? "font-semibold text-[#0F172A]"
//                       : "font-medium text-slate-700"
//                   }`}
//                 >
//                   {item.title}
//                 </p>
//                 <p className="mt-1 text-sm text-slate-600">{item.description}</p>
//                 <p className="mt-1 text-xs text-slate-500">{item.time}</p>

//                 <div className="mt-2 flex flex-wrap items-center gap-2">
//                   {(item.actions || []).map((action) => (
//                     <span key={`${item.id}_${action}`}>{actionButton(item, action)}</span>
//                   ))}
//                 </div>
//               </div>

//               <div className="flex items-center gap-2">
//                 {item.status === "Unread" ? (
//                   <span className="h-2.5 w-2.5 rounded-full bg-[#2563EB]" />
//                 ) : null}
//                 <button
//                   type="button"
//                   onClick={(e) => {
//                     e.stopPropagation();
//                     toggleRead(item.id);
//                   }}
//                   className="rounded-md p-1 text-slate-500 hover:bg-slate-100"
//                   title={item.status === "Unread" ? "Mark as read" : "Mark as unread"}
//                 >
//                   <FiMoreVertical />
//                 </button>
//               </div>
//             </div>
//           </article>
//         ))}
//       </section>
//     );
//   };

//   return (
//     <div className="bg-[#F8FAFC] pb-20 md:pb-8">
//       <div className="w-full space-y-5 px-4 py-6 sm:px-6 lg:px-8">
//         <section className="flex flex-wrap items-start justify-between gap-3">
//           <div>
//             <h1 className="text-3xl font-bold text-[#0F172A]">Notifications</h1>
//             <p className="mt-1 text-sm text-slate-500">
//               Stay updated on applications, job alerts, and employer messages
//             </p>
//             {err ? (
//               <div className="mt-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
//                 {err}
//               </div>
//             ) : null}
//           </div>

//           <div className="flex items-center gap-2">
//             <button
//               type="button"
//               onClick={markAllRead}
//               className="rounded-lg border border-blue-200 px-3 py-2 text-sm font-semibold text-[#2563EB] hover:bg-blue-50"
//             >
//               Mark All as Read
//             </button>
//           </div>
//         </section>

//         <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
//           <main className="space-y-4">
//             <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
//               <div className="grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-5">
//                 <input
//                   value={search}
//                   onChange={(e) => setSearch(e.target.value)}
//                   placeholder="Search notifications..."
//                   className="h-10 rounded-lg border border-slate-200 px-3 text-sm outline-none xl:col-span-2 focus:border-blue-300"
//                 />
//                 <select
//                   value={draft.type}
//                   onChange={(e) => setDraft((p) => ({ ...p, type: e.target.value }))}
//                   className="h-10 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-blue-300"
//                 >
//                   <option>All</option>
//                   <option>Applications</option>
//                   <option>Jobs</option>
//                   <option>Messages</option>
//                   <option>System</option>
//                 </select>
//                 <select
//                   value={draft.status}
//                   onChange={(e) => setDraft((p) => ({ ...p, status: e.target.value }))}
//                   className="h-10 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-blue-300"
//                 >
//                   <option>All</option>
//                   <option>Unread</option>
//                   <option>Read</option>
//                 </select>
//                 <select
//                   value={draft.range}
//                   onChange={(e) => setDraft((p) => ({ ...p, range: e.target.value }))}
//                   className="h-10 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-blue-300"
//                 >
//                   <option>Today</option>
//                   <option>Last 7 days</option>
//                   <option>Last 30 days</option>
//                 </select>
//               </div>

//               <div className="mt-3 flex gap-2">
//                 <button
//                   type="button"
//                   onClick={applyFilter}
//                   className="rounded-lg bg-[#2563EB] px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
//                 >
//                   Apply
//                 </button>
//                 <button
//                   type="button"
//                   onClick={clearFilter}
//                   className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
//                 >
//                   Clear
//                 </button>
//                 <button
//                   type="button"
//                   onClick={() => fetchNotifications()}
//                   className="ml-auto rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
//                   title="Refresh"
//                 >
//                   Refresh
//                 </button>
//               </div>
//             </section>

//             {loading ? (
//               <section className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
//                 <div className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-full bg-blue-50 text-[#2563EB]">
//                   <FiBell />
//                 </div>
//                 <h2 className="mt-3 text-xl font-semibold text-[#0F172A]">
//                   Loading notifications...
//                 </h2>
//                 <p className="mt-1 text-sm text-slate-500">Please wait.</p>
//               </section>
//             ) : filtered.length === 0 ? (
//               <section className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
//                 <div className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-full bg-blue-50 text-[#2563EB]">
//                   <FiBell />
//                 </div>
//                 <h2 className="mt-3 text-xl font-semibold text-[#0F172A]">
//                   You&apos;re all caught up
//                 </h2>
//                 <p className="mt-1 text-sm text-slate-500">
//                   No notifications match your current filters.
//                 </p>
//                 <Link
//                   to="/student/jobs"
//                   className="mt-4 inline-flex rounded-lg bg-[#2563EB] px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
//                 >
//                   Browse Jobs
//                 </Link>
//               </section>
//             ) : (
//               <section className="space-y-4">
//                 {renderFeed("Today", grouped.Today)}
//                 {renderFeed("Yesterday", grouped.Yesterday)}
//                 {renderFeed("Earlier", grouped.Earlier)}
//               </section>
//             )}
//           </main>

//           <aside
//             id="preferences"
//             className={`lg:sticky lg:top-20 lg:h-fit ${
//               mobilePrefsOpen ? "" : "max-md:hidden"
//             }`}
//           >
//             <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
//               <h2 className="text-lg font-semibold text-[#0F172A]">
//                 Notification Preferences
//               </h2>
//               <p className="mt-1 text-xs text-slate-500">
//                 Choose how you want to receive updates.
//               </p>

//               {prefsLoading ? (
//                 <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
//                   Loading preferences...
//                 </div>
//               ) : (
//                 <>
//                   <div className="mt-4 space-y-2">
//                     <p className="text-xs font-semibold text-slate-500">
//                       In-App Preferences
//                     </p>
//                     {[
//                       ["Application status updates", "appStatus"],
//                       ["Employer messages", "employerMessages"],
//                       ["New job recommendations", "jobRecs"],
//                       ["Government job updates", "govUpdates"],
//                       ["Internship alerts", "internshipAlerts"],
//                       ["System announcements", "announcements"],
//                     ].map(([label, key]) => (
//                       <div
//                         key={key}
//                         className="flex items-center justify-between text-sm text-slate-700"
//                       >
//                         <span>{label}</span>
//                         <Toggle
//                           checked={!!prefs[key]}
//                           onChange={() =>
//                             setPrefs((p) => ({ ...p, [key]: !p[key] }))
//                           }
//                         />
//                       </div>
//                     ))}
//                   </div>

//                   <div className="mt-5 space-y-2 border-t border-slate-100 pt-4">
//                     <p className="text-xs font-semibold text-slate-500">
//                       Email Preferences
//                     </p>
//                     {[
//                       ["Email for application status", "emailStatus"],
//                       ["Email for job alerts", "emailJobs"],
//                       ["Email for employer messages", "emailMessages"],
//                       ["Weekly job digest", "weeklyDigest"],
//                     ].map(([label, key]) => (
//                       <div
//                         key={key}
//                         className="flex items-center justify-between text-sm text-slate-700"
//                       >
//                         <span>{label}</span>
//                         <Toggle
//                           checked={!!prefs[key]}
//                           onChange={() =>
//                             setPrefs((p) => ({ ...p, [key]: !p[key] }))
//                           }
//                         />
//                       </div>
//                     ))}
//                     <select
//                       value={prefs.frequency}
//                       onChange={(e) =>
//                         setPrefs((p) => ({ ...p, frequency: e.target.value }))
//                       }
//                       className="mt-2 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-blue-300"
//                     >
//                       <option>Instant</option>
//                       <option>Daily summary</option>
//                       <option>Weekly summary</option>
//                     </select>
//                   </div>

//                   <div className="mt-5 space-y-2 border-t border-slate-100 pt-4">
//                     <p className="text-xs font-semibold text-slate-500">
//                       Optional Channels
//                     </p>
//                     <div className="flex items-center justify-between text-sm text-slate-700">
//                       <span>WhatsApp alerts</span>
//                       <Toggle
//                         checked={!!prefs.whatsapp}
//                         onChange={() =>
//                           setPrefs((p) => ({ ...p, whatsapp: !p.whatsapp }))
//                         }
//                       />
//                     </div>
//                     <div className="flex items-center justify-between text-sm text-slate-700">
//                       <span>SMS alerts</span>
//                       <Toggle
//                         checked={!!prefs.sms}
//                         onChange={() =>
//                           setPrefs((p) => ({ ...p, sms: !p.sms }))
//                         }
//                       />
//                     </div>
//                     {prefs.whatsapp || prefs.sms ? (
//                       <button
//                         type="button"
//                         className="text-xs font-semibold text-[#2563EB] hover:underline"
//                       >
//                         Verify phone number
//                       </button>
//                     ) : null}
//                   </div>

//                   <div className="mt-5 flex gap-2">
//                     <button
//                       type="button"
//                       onClick={savePrefs}
//                       className="rounded-lg bg-[#2563EB] px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
//                     >
//                       Save Preferences
//                     </button>
//                     <button
//                       type="button"
//                       onClick={() => setPrefs(DEFAULT_PREFS)}
//                       className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
//                     >
//                       Reset
//                     </button>
//                   </div>
//                 </>
//               )}
//             </div>
//           </aside>
//         </div>
//       </div>

//       <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white p-3 shadow-[0_-8px_24px_rgba(15,23,42,0.08)] md:hidden">
//         <div className="grid grid-cols-2 gap-2">
//           <button
//             type="button"
//             onClick={markAllRead}
//             className="rounded-lg border border-blue-200 px-3 py-2 text-sm font-semibold text-[#2563EB]"
//           >
//             Mark all read
//           </button>
//           <button
//             type="button"
//             onClick={() => setMobilePrefsOpen((v) => !v)}
//             className="rounded-lg bg-[#2563EB] px-3 py-2 text-sm font-semibold text-white"
//           >
//             {mobilePrefsOpen ? "Hide Settings" : `Settings (${unreadCount})`}
//           </button>
//         </div>
//       </div>

//       <Modal
//         open={saveModal}
//         onClose={() => setSaveModal(false)}
//         title="Preferences saved"
//         footer={
//           <button
//             type="button"
//             onClick={() => setSaveModal(false)}
//             className="rounded-lg bg-[#2563EB] px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
//           >
//             Done
//           </button>
//         }
//       >
//         <p className="text-sm text-slate-700">Preferences saved successfully.</p>
//       </Modal>
//     </div>
//   );
// }



/////////////////////////////////////////////////////////////////////////////////////////////////////////



// // frontend/src/pages/student/Notifications.jsx
// import { useEffect, useMemo, useRef, useState } from "react";
// import { Link, useNavigate } from "react-router-dom";
// import {
//   FiBell,
//   FiBookmark,
//   FiMoreVertical,
//   FiRefreshCw,
//   FiSettings,
//   FiX,
//   FiMapPin,
//   FiBriefcase,
// } from "react-icons/fi";
// import Modal from "../../components/common/Modal";

// import {
//   studentListNotifications,
//   studentMarkAllNotificationsRead,
//   studentToggleNotificationRead,
//   studentGetNotificationPrefs,
//   studentSaveNotificationPrefs,
//   studentToggleSaveJob,
// } from "../../services/studentService";

// /* ─────────────────────────────────────────
//    TOGGLE
// ───────────────────────────────────────── */
// function Toggle({ checked, onChange }) {
//   return (
//     <button
//       type="button"
//       onClick={onChange}
//       className={`relative h-5 w-10 shrink-0 rounded-full transition-colors duration-200 ${
//         checked ? "bg-[#0A66C2]" : "bg-[#54666F]"
//       }`}
//     >
//       <span
//         className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all duration-200 ${
//           checked ? "left-[22px]" : "left-0.5"
//         }`}
//       />
//     </button>
//   );
// }

// /* ─────────────────────────────────────────
//    NOTIFICATION AVATAR  (square logo like LinkedIn)
// ───────────────────────────────────────── */
// function NotifAvatar({ item }) {
//   const colorMap = {
//     job:         "bg-[#0A66C2]",
//     application: "bg-emerald-600",
//     shortlisted: "bg-emerald-600",
//     hold:        "bg-amber-500",
//     rejected:    "bg-red-600",
//     message:     "bg-violet-600",
//     system:      "bg-[#3D4F58]",
//   };
//   const bg     = colorMap[item.icon] || "bg-[#3D4F58]";
//   const letter = (item.senderName || item.title || "N").charAt(0).toUpperCase();

//   if (item.avatar) {
//     return (
//       <img
//         src={item.avatar}
//         alt={item.senderName || "logo"}
//         className="h-12 w-12 flex-shrink-0 rounded-sm object-cover"
//       />
//     );
//   }
//   return (
//     <div className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-sm text-lg font-bold text-white ${bg}`}>
//       {letter}
//     </div>
//   );
// }

// /* ─────────────────────────────────────────
//    STATIC DATA  (follow suggestions)
// ───────────────────────────────────────── */
// const PEOPLE_SUGGESTIONS = [
//   { id: "p1", name: "Arjun Mehta",    role: "Frontend Developer at Infosys",     mutual: "12 mutual connections", avatar: null, initials: "AM", color: "bg-teal-600" },
//   { id: "p2", name: "Priya Sharma",   role: "Data Scientist at TCS",             mutual: "8 mutual connections",  avatar: null, initials: "PS", color: "bg-pink-600" },
//   { id: "p3", name: "Rahul Verma",    role: "Backend Engineer at Wipro",         mutual: "5 mutual connections",  avatar: null, initials: "RV", color: "bg-orange-600" },
// ];
// const COMPANY_SUGGESTIONS = [
//   { id: "c1", name: "Zoho Corporation", industry: "Software · 12k followers",  avatar: null, initials: "Z",  color: "bg-red-600" },
//   { id: "c2", name: "Freshworks",       industry: "SaaS · 45k followers",       avatar: null, initials: "F",  color: "bg-green-700" },
//   { id: "c3", name: "Razorpay",         industry: "Fintech · 30k followers",    avatar: null, initials: "R",  color: "bg-[#0A66C2]" },
// ];

// /* ─────────────────────────────────────────
//    CONSTANTS
// ───────────────────────────────────────── */
// const TABS            = ["All", "Jobs", "My posts", "Mentions"];
// const DEFAULT_FILTERS = { status: "All", range: "Last 30 days" };
// const DEFAULT_PREFS   = {
//   appStatus: true, employerMessages: true, jobRecs: true,
//   govUpdates: true, internshipAlerts: true, announcements: true,
//   emailStatus: true, emailJobs: true, emailMessages: true,
//   weeklyDigest: false, whatsapp: false, sms: false,
//   frequency: "Instant",
// };

// /* ═════════════════════════════════════════
//    MAIN COMPONENT
// ═════════════════════════════════════════ */
// export default function Notifications() {
//   const navigate              = useNavigate();
//   const shownAlertsRef        = useRef(new Set());

//   const [items,        setItems]        = useState([]);
//   const [apiUnread,    setApiUnread]    = useState(0);
//   const [loading,      setLoading]      = useState(true);
//   const [err,          setErr]          = useState("");
//   const [activeTab,    setActiveTab]    = useState("All");
//   const [search,       setSearch]       = useState("");
//   const [filters,      setFilters]      = useState(DEFAULT_FILTERS);
//   const [prefs,        setPrefs]        = useState(DEFAULT_PREFS);
//   const [prefsLoading, setPrefsLoading] = useState(true);
//   const [prefsOpen,    setPrefsOpen]    = useState(false);
//   const [saveModal,    setSaveModal]    = useState(false);

//   // follow state for suggestions
//   const [followed, setFollowed] = useState({});
//   const toggleFollow = (id) => setFollowed((f) => ({ ...f, [id]: !f[id] }));

//   /* ── fetch notifications ── */
//   const fetchNotifications = async (opts = {}) => {
//     try {
//       setErr(""); setLoading(true);
//       const res = await studentListNotifications({
//         status: opts.status ?? filters.status,
//         q:      opts.q      ?? search,
//       });
//       setItems(res?.data?.items || []);
//       setApiUnread(Number(res?.data?.unreadCount || 0));
//     } catch (e) {
//       setErr(e?.response?.data?.message || e?.message || "Failed to load notifications");
//     } finally { setLoading(false); }
//   };

//   const fetchPrefs = async () => {
//     try {
//       setPrefsLoading(true);
//       const res = await studentGetNotificationPrefs();
//       setPrefs((p) => ({ ...p, ...(res?.data || {}) }));
//     } catch { /* keep defaults */ } finally { setPrefsLoading(false); }
//   };

//   useEffect(() => { fetchPrefs(); }, []);
//   useEffect(() => {
//     const t = setTimeout(() => fetchNotifications(), 250);
//     return () => clearTimeout(t);
//   }, [filters.status, search]);
//   useEffect(() => {
//     const timer = setInterval(() => fetchNotifications(), 30_000);
//     return () => clearInterval(timer);
//   }, []);

//   /* browser push */
//   useEffect(() => {
//     if (typeof window === "undefined" || !("Notification" in window)) return;
//     if (window.Notification.permission !== "granted") return;
//     items.forEach((item) => {
//       if (item?.status !== "Unread" || shownAlertsRef.current.has(item.id)) return;
//       if (!/interview reminder|starting now/i.test(String(item?.title || ""))) return;
//       shownAlertsRef.current.add(item.id);
//       try { new window.Notification(item.title, { body: item.description || "" }); } catch {}
//     });
//   }, [items]);

//   const unreadCount = useMemo(
//     () => apiUnread || items.filter((x) => x.status === "Unread").length,
//     [apiUnread, items]
//   );

//   /* filter + group */
//   const tabTypeMap = { Jobs: "job", "My posts": "application", Mentions: "message" };
//   const filtered = useMemo(() => {
//     let list = items;
//     if (activeTab !== "All") {
//       const t = tabTypeMap[activeTab];
//       if (t) list = list.filter((x) => x.icon === t || x.type?.toLowerCase() === t);
//     }
//     if (filters.status !== "All") list = list.filter((x) => x.status === filters.status);
//     if (filters.range !== "Last 30 days") {
//       const now  = Date.now();
//       const days = filters.range === "Today" ? 1 : 7;
//       list = list.filter((x) => (now - new Date(x.createdAt || Date.now()).getTime()) / 86_400_000 <= days);
//     }
//     return list;
//   }, [items, activeTab, filters]);

//   const grouped = useMemo(() => ({
//     Today:     filtered.filter((x) => x.group === "Today"),
//     Yesterday: filtered.filter((x) => x.group === "Yesterday"),
//     Earlier:   filtered.filter((x) => x.group === "Earlier"),
//   }), [filtered]);

//   /* actions */
//   const markAllRead = async () => {
//     try {
//       await studentMarkAllNotificationsRead();
//       setItems((prev) => prev.map((x) => ({ ...x, status: "Read" })));
//       setApiUnread(0);
//     } catch (e) { setErr(e?.response?.data?.message || e?.message || "Failed"); }
//   };

//   const toggleRead = async (id) => {
//     try {
//       await studentToggleNotificationRead(id);
//       setItems((prev) => {
//         const wasUnread = prev.find((x) => x.id === id)?.status === "Unread";
//         setApiUnread((n) => Math.max(0, n + (wasUnread ? -1 : 1)));
//         return prev.map((x) => x.id === id ? { ...x, status: wasUnread ? "Read" : "Unread" } : x);
//       });
//     } catch (e) { setErr(e?.response?.data?.message || e?.message || "Failed"); }
//   };

//   const markAsRead = async (id) => {
//     const target = items.find((x) => x.id === id);
//     if (!target || target.status !== "Unread") return;
//     try {
//       await studentToggleNotificationRead(id);
//       setItems((prev) => prev.map((x) => x.id === id ? { ...x, status: "Read" } : x));
//       setApiUnread((n) => Math.max(0, n - 1));
//     } catch (e) { setErr(e?.response?.data?.message || e?.message || "Failed"); }
//   };

//   const savePrefs = async () => {
//     try { await studentSaveNotificationPrefs(prefs); setSaveModal(true); }
//     catch (e) { setErr(e?.response?.data?.message || e?.message || "Failed to save"); }
//   };

//   const onAction = async (item, action) => {
//     const meta = item?.meta || {};
//     if (action === "Reply")            { navigate(meta.conversationId ? `/student/messages?thread=${meta.conversationId}` : "/student/messages"); return; }
//     if (action === "View Job")         { navigate(meta.jobId ? `/student/jobs/${meta.jobId}` : "/student/jobs"); return; }
//     if (action === "View Application") { navigate("/student/my-jobs"); return; }
//     if (action === "Join Meeting")     { if (meta.url) window.open(meta.url, "_blank", "noopener,noreferrer"); return; }
//     if (action === "Save Job")         { try { if (meta.jobId) await studentToggleSaveJob(meta.jobId); } catch {} return; }
//     if (meta.url) window.open(meta.url, "_blank", "noopener,noreferrer");
//   };

//   const actionBtn = (item, action) => (
//     <button
//       key={action}
//       type="button"
//       onClick={(e) => { e.stopPropagation(); onAction(item, action); }}
//       className="inline-flex items-center gap-1 rounded-full border border-[#70B5F9] px-3 py-0.5 text-xs font-semibold text-[#70B5F9] hover:bg-[#70B5F9]/10 transition-colors"
//     >
//       {action === "Save Job" && <FiBookmark size={11} />}
//       {action}
//     </button>
//   );

//   /* render a time-group of notification rows */
//   const renderGroup = (label, data) => {
//     if (!data.length) return null;
//     return (
//       <div key={label}>
//         <p className="px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-[#8C9AA5] border-b border-[#38434F]">
//           {label}
//         </p>
//         {data.map((item) => {
//           const unread = item.status === "Unread";
//           return (
//             <div
//               key={item.id}
//               onClick={() => markAsRead(item.id)}
//               className={`group relative flex cursor-pointer items-start border-b border-[#38434F] transition-colors hover:bg-[#26343E] ${unread ? "bg-[#1A2733]" : ""}`}
//             >
//               {/* left unread dot */}
//               <div className="flex w-7 shrink-0 items-center justify-center pt-5">
//                 {unread
//                   ? <span className="h-2.5 w-2.5 rounded-full bg-[#0A66C2]" />
//                   : <span className="h-2.5 w-2.5" />}
//               </div>

//               {/* square company/person logo */}
//               <div className="shrink-0 pt-3.5">
//                 <NotifAvatar item={item} />
//               </div>

//               {/* text */}
//               <div className="min-w-0 flex-1 px-3 py-3.5">
//                 <p className={`text-sm leading-snug ${unread ? "font-semibold text-white" : "font-normal text-[#B0B7BE]"}`}>
//                   {item.title}
//                 </p>
//                 {item.description && (
//                   <p className="mt-0.5 text-sm text-[#8C9AA5] line-clamp-2">{item.description}</p>
//                 )}
//                 <p className={`mt-1 text-xs font-medium ${unread ? "text-[#70B5F9]" : "text-[#8C9AA5]"}`}>
//                   {item.time}
//                 </p>
//                 <div className="mt-1 flex flex-wrap gap-2">
//                   {(item.actions || []).map((a) => actionBtn(item, a))}
//                 </div>
//               </div>

//               {/* ⋮ on hover */}
//               <div className="flex shrink-0 items-start pt-3.5 pr-3">
//                 <button
//                   type="button"
//                   onClick={(e) => { e.stopPropagation(); toggleRead(item.id); }}
//                   title={unread ? "Mark as read" : "Mark as unread"}
//                   className="rounded-full p-1.5 text-[#8C9AA5] opacity-0 transition-opacity group-hover:opacity-100 hover:bg-[#38434F]"
//                 >
//                   <FiMoreVertical size={16} />
//                 </button>
//               </div>
//             </div>
//           );
//         })}
//       </div>
//     );
//   };

//   /* shared prefs panel */
//   const PrefsPanel = () => (
//     prefsLoading
//       ? <p className="p-4 text-sm text-[#8C9AA5]">Loading…</p>
//       : (
//         <div className="p-4 space-y-4">
//           <div className="space-y-3">
//             <p className="text-xs font-semibold uppercase tracking-wider text-[#8C9AA5]">In-App</p>
//             {[
//               ["Application updates",  "appStatus"],
//               ["Employer messages",    "employerMessages"],
//               ["Job recommendations",  "jobRecs"],
//               ["Govt job updates",     "govUpdates"],
//               ["Internship alerts",    "internshipAlerts"],
//               ["Announcements",        "announcements"],
//             ].map(([label, key]) => (
//               <div key={key} className="flex items-center justify-between text-sm text-[#B0B7BE]">
//                 <span>{label}</span>
//                 <Toggle checked={!!prefs[key]} onChange={() => setPrefs((p) => ({ ...p, [key]: !p[key] }))} />
//               </div>
//             ))}
//           </div>

//           <div className="space-y-3 border-t border-[#38434F] pt-3">
//             <p className="text-xs font-semibold uppercase tracking-wider text-[#8C9AA5]">Email</p>
//             {[
//               ["Application status",  "emailStatus"],
//               ["Job alerts",          "emailJobs"],
//               ["Employer messages",   "emailMessages"],
//               ["Weekly digest",       "weeklyDigest"],
//             ].map(([label, key]) => (
//               <div key={key} className="flex items-center justify-between text-sm text-[#B0B7BE]">
//                 <span>{label}</span>
//                 <Toggle checked={!!prefs[key]} onChange={() => setPrefs((p) => ({ ...p, [key]: !p[key] }))} />
//               </div>
//             ))}
//             <select
//               value={prefs.frequency}
//               onChange={(e) => setPrefs((p) => ({ ...p, frequency: e.target.value }))}
//               className="mt-1 h-9 w-full rounded-lg border border-[#38434F] bg-[#1D2226] px-3 text-sm text-[#B0B7BE] outline-none focus:border-[#0A66C2]"
//             >
//               <option>Instant</option>
//               <option>Daily summary</option>
//               <option>Weekly summary</option>
//             </select>
//           </div>

//           <div className="space-y-3 border-t border-[#38434F] pt-3">
//             <p className="text-xs font-semibold uppercase tracking-wider text-[#8C9AA5]">Other Channels</p>
//             {[["WhatsApp", "whatsapp"], ["SMS", "sms"]].map(([label, key]) => (
//               <div key={key} className="flex items-center justify-between text-sm text-[#B0B7BE]">
//                 <span>{label}</span>
//                 <Toggle checked={!!prefs[key]} onChange={() => setPrefs((p) => ({ ...p, [key]: !p[key] }))} />
//               </div>
//             ))}
//             {(prefs.whatsapp || prefs.sms) && (
//               <button type="button" className="text-xs font-semibold text-[#70B5F9] hover:underline">
//                 Verify phone number
//               </button>
//             )}
//           </div>

//           <div className="flex gap-2 border-t border-[#38434F] pt-3">
//             <button type="button" onClick={savePrefs}
//               className="flex-1 rounded-full bg-[#0A66C2] py-2 text-sm font-semibold text-white hover:bg-[#004182] transition-colors">
//               Save
//             </button>
//             <button type="button" onClick={() => setPrefs(DEFAULT_PREFS)}
//               className="flex-1 rounded-full border border-[#38434F] py-2 text-sm font-semibold text-[#B0B7BE] hover:bg-[#313B46] transition-colors">
//               Reset
//             </button>
//           </div>
//         </div>
//       )
//   );

//   /* ═══════════════════════════════════════
//      RENDER
//   ═══════════════════════════════════════ */
//   return (
//     <div className="min-h-screen bg-[#1D2226]">
//       {/* ── page wrapper with LinkedIn-style gutters ── */}
//       <div className="mx-auto max-w-[1128px] px-4 py-5">
//         <div className="flex gap-5">

//           {/* ════════════════════════════
//               LEFT SIDEBAR
//           ════════════════════════════ */}
//           <aside className="hidden w-[225px] shrink-0 lg:block space-y-3">

//             {/* Profile card */}
//             <div className="overflow-hidden rounded-xl border border-[#38434F] bg-[#1D2226]">
//               {/* banner */}
//               <div className="h-14 bg-gradient-to-r from-[#0A66C2] to-[#0073B1]" />
//               {/* avatar */}
//               <div className="px-4 pb-3">
//                 <div className="-mt-7 mb-2">
//                   <div className="h-14 w-14 rounded-full border-2 border-[#1D2226] bg-gradient-to-br from-slate-500 to-slate-700 flex items-center justify-center text-white text-xl font-bold">
//                     S
//                   </div>
//                 </div>
//                 <p className="text-sm font-semibold text-white">Shyam Sss</p>
//                 <p className="text-xs text-[#8C9AA5] leading-snug mt-0.5">
//                   Computer Science Student · Junior Web Developer
//                 </p>
//                 <div className="flex items-center gap-1 mt-1">
//                   <FiMapPin size={11} className="text-[#8C9AA5]" />
//                   <p className="text-xs text-[#8C9AA5]">Bengaluru, Karnataka</p>
//                 </div>
//                 <div className="mt-3 border-t border-[#38434F] pt-3 space-y-1.5">
//                   <div className="flex justify-between text-xs">
//                     <span className="text-[#8C9AA5]">Profile viewers</span>
//                     <span className="font-semibold text-[#70B5F9]">142</span>
//                   </div>
//                   <div className="flex justify-between text-xs">
//                     <span className="text-[#8C9AA5]">Post impressions</span>
//                     <span className="font-semibold text-[#70B5F9]">1,204</span>
//                   </div>
//                 </div>
//               </div>
//             </div>

//             {/* Manage notifications */}
//             <div className="rounded-xl border border-[#38434F] bg-[#1D2226] p-3">
//               <p className="text-sm font-semibold text-white">Manage your notifications</p>
//               <button
//                 type="button"
//                 onClick={() => setPrefsOpen(true)}
//                 className="mt-2 text-xs font-semibold text-[#70B5F9] hover:underline"
//               >
//                 View settings
//               </button>
//             </div>
//           </aside>

//           {/* ════════════════════════════
//               CENTER  FEED
//           ════════════════════════════ */}
//           <main className="min-w-0 flex-1">
//             <div className="overflow-hidden rounded-xl border border-[#38434F] bg-[#1D2226]">

//               {/* header */}
//               <div className="flex items-center justify-between border-b border-[#38434F] px-4 py-3">
//                 <div className="flex items-center gap-2">
//                   <h1 className="text-lg font-semibold text-white">Notifications</h1>
//                   {unreadCount > 0 && (
//                     <span className="rounded-full bg-[#CC1016] px-1.5 py-0.5 text-[11px] font-bold text-white leading-none">
//                       {unreadCount}
//                     </span>
//                   )}
//                 </div>
//                 <div className="flex items-center gap-1">
//                   {unreadCount > 0 && (
//                     <button type="button" onClick={markAllRead}
//                       className="hidden sm:block rounded-full px-3 py-1 text-xs font-semibold text-[#70B5F9] hover:bg-[#26343E] transition-colors">
//                       Mark all as read
//                     </button>
//                   )}
//                   <button type="button" onClick={() => fetchNotifications()}
//                     className="rounded-full p-1.5 text-[#8C9AA5] hover:bg-[#313B46] transition-colors" title="Refresh">
//                     <FiRefreshCw size={15} />
//                   </button>
//                   <button type="button" onClick={() => setPrefsOpen(true)}
//                     className="rounded-full p-1.5 text-[#8C9AA5] hover:bg-[#313B46] transition-colors lg:hidden">
//                     <FiSettings size={15} />
//                   </button>
//                 </div>
//               </div>

//               {/* tabs */}
//               <div className="flex items-center gap-1 border-b border-[#38434F] px-3 py-1">
//                 {TABS.map((tab) => (
//                   <button key={tab} type="button" onClick={() => setActiveTab(tab)}
//                     className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
//                       activeTab === tab
//                         ? "bg-[#0A66C2] text-white"
//                         : "text-[#B0B7BE] hover:bg-[#313B46] hover:text-white"
//                     }`}>
//                     {tab}
//                   </button>
//                 ))}
//               </div>

//               {/* search + filter bar */}
//               <div className="flex flex-wrap items-center gap-2 border-b border-[#38434F] px-4 py-2">
//                 <input
//                   value={search}
//                   onChange={(e) => setSearch(e.target.value)}
//                   placeholder="Search notifications…"
//                   className="h-8 flex-1 min-w-[120px] rounded-full border border-[#38434F] bg-[#2A3540] px-4 text-sm text-white placeholder-[#8C9AA5] outline-none focus:border-[#0A66C2]"
//                 />
//                 <select value={filters.status}
//                   onChange={(e) => setFilters((p) => ({ ...p, status: e.target.value }))}
//                   className="h-8 rounded-full border border-[#38434F] bg-[#2A3540] px-3 text-xs text-[#B0B7BE] outline-none">
//                   <option>All</option><option>Unread</option><option>Read</option>
//                 </select>
//                 <select value={filters.range}
//                   onChange={(e) => setFilters((p) => ({ ...p, range: e.target.value }))}
//                   className="h-8 rounded-full border border-[#38434F] bg-[#2A3540] px-3 text-xs text-[#B0B7BE] outline-none">
//                   <option>Today</option><option>Last 7 days</option><option>Last 30 days</option>
//                 </select>
//               </div>

//               {/* error */}
//               {err && (
//                 <div className="mx-4 mt-3 rounded-lg border border-red-800 bg-red-900/30 px-3 py-2 text-sm text-red-300">
//                   {err}
//                 </div>
//               )}

//               {/* feed */}
//               {loading ? (
//                 <div className="flex flex-col items-center justify-center py-20">
//                   <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#2A3540] text-[#0A66C2]">
//                     <FiBell size={22} />
//                   </div>
//                   <p className="text-sm text-[#8C9AA5]">Loading notifications…</p>
//                 </div>
//               ) : filtered.length === 0 ? (
//                 <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
//                   <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-[#2A3540] text-[#0A66C2]">
//                     <FiBell size={26} />
//                   </div>
//                   <p className="text-base font-semibold text-white">You're all caught up</p>
//                   <p className="mt-1 text-sm text-[#8C9AA5]">No notifications match your filters.</p>
//                   <Link to="/student/jobs"
//                     className="mt-5 rounded-full bg-[#0A66C2] px-6 py-2 text-sm font-semibold text-white hover:bg-[#004182] transition-colors">
//                     Browse Jobs
//                   </Link>
//                 </div>
//               ) : (
//                 <>
//                   {renderGroup("Today",     grouped.Today)}
//                   {renderGroup("Yesterday", grouped.Yesterday)}
//                   {renderGroup("Earlier",   grouped.Earlier)}
//                 </>
//               )}
//             </div>
//           </main>

//           {/* ════════════════════════════
//               RIGHT SIDEBAR
//           ════════════════════════════ */}
//           <aside className="hidden w-[300px] shrink-0 xl:block space-y-3">

//             {/* People you may know */}
//             <div className="rounded-xl border border-[#38434F] bg-[#1D2226] overflow-hidden">
//               <div className="px-4 pt-4 pb-2">
//                 <p className="text-sm font-semibold text-white">People you may know</p>
//               </div>
//               <div className="divide-y divide-[#38434F]">
//                 {PEOPLE_SUGGESTIONS.map((p) => (
//                   <div key={p.id} className="flex items-start gap-3 px-4 py-3">
//                     {/* avatar */}
//                     <div className={`h-12 w-12 shrink-0 rounded-full flex items-center justify-center text-white font-bold text-base ${p.color}`}>
//                       {p.initials}
//                     </div>
//                     <div className="min-w-0 flex-1">
//                       <p className="text-sm font-semibold text-white truncate">{p.name}</p>
//                       <p className="text-xs text-[#8C9AA5] leading-snug truncate">{p.role}</p>
//                       <p className="text-xs text-[#8C9AA5] mt-0.5">{p.mutual}</p>
//                       <button
//                         type="button"
//                         onClick={() => toggleFollow(p.id)}
//                         className={`mt-2 rounded-full border px-4 py-0.5 text-xs font-semibold transition-colors ${
//                           followed[p.id]
//                             ? "border-[#38434F] bg-[#313B46] text-[#B0B7BE]"
//                             : "border-[#70B5F9] text-[#70B5F9] hover:bg-[#70B5F9]/10"
//                         }`}
//                       >
//                         {followed[p.id] ? "Following" : "+ Follow"}
//                       </button>
//                     </div>
//                     <button type="button" className="mt-1 shrink-0 rounded-full p-1 text-[#8C9AA5] hover:bg-[#38434F]">
//                       <FiX size={14} />
//                     </button>
//                   </div>
//                 ))}
//               </div>
//               <button type="button" className="w-full px-4 py-3 text-xs font-semibold text-[#8C9AA5] hover:bg-[#26343E] transition-colors text-center border-t border-[#38434F]">
//                 Show all recommendations →
//               </button>
//             </div>

//             {/* Companies to follow */}
//             <div className="rounded-xl border border-[#38434F] bg-[#1D2226] overflow-hidden">
//               <div className="px-4 pt-4 pb-2">
//                 <p className="text-sm font-semibold text-white">Companies to follow</p>
//               </div>
//               <div className="divide-y divide-[#38434F]">
//                 {COMPANY_SUGGESTIONS.map((c) => (
//                   <div key={c.id} className="flex items-start gap-3 px-4 py-3">
//                     {/* square logo */}
//                     <div className={`h-12 w-12 shrink-0 rounded-sm flex items-center justify-center text-white font-bold text-lg ${c.color}`}>
//                       {c.initials}
//                     </div>
//                     <div className="min-w-0 flex-1">
//                       <p className="text-sm font-semibold text-white truncate">{c.name}</p>
//                       <p className="text-xs text-[#8C9AA5] leading-snug">{c.industry}</p>
//                       <button
//                         type="button"
//                         onClick={() => toggleFollow(c.id)}
//                         className={`mt-2 rounded-full border px-4 py-0.5 text-xs font-semibold transition-colors ${
//                           followed[c.id]
//                             ? "border-[#38434F] bg-[#313B46] text-[#B0B7BE]"
//                             : "border-[#70B5F9] text-[#70B5F9] hover:bg-[#70B5F9]/10"
//                         }`}
//                       >
//                         {followed[c.id] ? "Following" : "+ Follow"}
//                       </button>
//                     </div>
//                     <button type="button" className="mt-1 shrink-0 rounded-full p-1 text-[#8C9AA5] hover:bg-[#38434F]">
//                       <FiX size={14} />
//                     </button>
//                   </div>
//                 ))}
//               </div>
//               <button type="button" className="w-full px-4 py-3 text-xs font-semibold text-[#8C9AA5] hover:bg-[#26343E] transition-colors text-center border-t border-[#38434F]">
//                 Show all companies →
//               </button>
//             </div>

//             {/* Footer links */}
//             <div className="px-1">
//               <div className="flex flex-wrap gap-x-2 gap-y-1">
//                 {["About", "Accessibility", "Help Center", "Privacy & Terms", "Ad Choices", "Advertising", "More"].map((l) => (
//                   <button key={l} type="button" className="text-xs text-[#8C9AA5] hover:underline">{l}</button>
//                 ))}
//               </div>
//               <p className="mt-2 text-xs text-[#8C9AA5]">JobPortal © {new Date().getFullYear()}</p>
//             </div>
//           </aside>
//         </div>
//       </div>

//       {/* ── Mobile bottom bar ── */}
//       <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[#38434F] bg-[#1D2226] px-4 py-2.5 lg:hidden">
//         <div className="flex gap-2">
//           <button type="button" onClick={markAllRead}
//             className="flex-1 rounded-full border border-[#38434F] py-2 text-sm font-semibold text-[#70B5F9] hover:bg-[#313B46]">
//             Mark all read
//           </button>
//           <button type="button" onClick={() => setPrefsOpen(true)}
//             className="flex-1 rounded-full bg-[#0A66C2] py-2 text-sm font-semibold text-white hover:bg-[#004182]">
//             Settings {unreadCount > 0 ? `(${unreadCount})` : ""}
//           </button>
//         </div>
//       </div>

//       {/* ── Prefs drawer (mobile + desktop settings) ── */}
//       {prefsOpen && (
//         <div className="fixed inset-0 z-50 flex items-end bg-black/70 lg:items-center lg:justify-center"
//           onClick={() => setPrefsOpen(false)}>
//           <div
//             className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-t-2xl lg:rounded-2xl border border-[#38434F] bg-[#1D2226]"
//             onClick={(e) => e.stopPropagation()}
//           >
//             <div className="flex items-center justify-between border-b border-[#38434F] px-4 py-3">
//               <span className="text-base font-semibold text-white">Notification Settings</span>
//               <button type="button" onClick={() => setPrefsOpen(false)}
//                 className="rounded-full p-1 text-[#8C9AA5] hover:bg-[#38434F]">
//                 <FiX size={18} />
//               </button>
//             </div>
//             <PrefsPanel />
//           </div>
//         </div>
//       )}

//       {/* ── Save modal ── */}
//       <Modal open={saveModal} onClose={() => setSaveModal(false)} title="Preferences saved"
//         footer={
//           <button type="button" onClick={() => setSaveModal(false)}
//             className="rounded-full bg-[#0A66C2] px-5 py-2 text-sm font-semibold text-white hover:bg-[#004182]">
//             Done
//           </button>
//         }>
//         <p className="text-sm text-[#B0B7BE]">Your notification preferences have been saved.</p>
//       </Modal>
//     </div>
//   );
// }

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////



// // frontend/src/pages/student/Notifications.jsx
// import { useEffect, useMemo, useRef, useState, useCallback } from "react";
// import { Link, useNavigate } from "react-router-dom";
// import {
//   FiBell, FiBookmark, FiMoreVertical, FiRefreshCw,
//   FiSettings, FiX, FiMapPin, FiUserPlus, FiCheck,
// } from "react-icons/fi";
// import Modal from "../../components/common/Modal";

// import {
//   studentListNotifications,
//   studentMarkAllNotificationsRead,
//   studentToggleNotificationRead,
//   studentGetNotificationPrefs,
//   studentSaveNotificationPrefs,
//   studentToggleSaveJob,
//   // NEW real-data service calls (add these to studentService.js – see bottom of file)
//   studentGetProfileStats,
//   studentGetPeopleSuggestions,
//   studentGetCompanySuggestions,
//   studentFollowTarget,
//   studentUnfollowTarget,
// } from "../../services/studentService";

// /* ─────────────────────────────────────────
//    TOGGLE
// ───────────────────────────────────────── */
// function Toggle({ checked, onChange }) {
//   return (
//     <button
//       type="button"
//       onClick={onChange}
//       className={`relative h-5 w-10 shrink-0 rounded-full transition-colors duration-200 ${
//         checked ? "bg-[#0A66C2]" : "bg-[#54666F]"
//       }`}
//     >
//       <span
//         className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all duration-200 ${
//           checked ? "left-[22px]" : "left-0.5"
//         }`}
//       />
//     </button>
//   );
// }

// /* ─────────────────────────────────────────
//    NOTIFICATION AVATAR
// ───────────────────────────────────────── */
// function NotifAvatar({ item }) {
//   const colorMap = {
//     job:         "bg-[#0A66C2]",
//     application: "bg-emerald-600",
//     shortlisted: "bg-emerald-600",
//     hold:        "bg-amber-500",
//     rejected:    "bg-red-600",
//     message:     "bg-violet-600",
//     system:      "bg-[#3D4F58]",
//   };
//   const bg     = colorMap[item.icon] || "bg-[#3D4F58]";
//   const letter = (item.senderName || item.title || "N").charAt(0).toUpperCase();

//   if (item.avatar) {
//     return (
//       <img
//         src={item.avatar}
//         alt={item.senderName || "logo"}
//         className="h-12 w-12 flex-shrink-0 rounded-sm object-cover"
//       />
//     );
//   }
//   return (
//     <div className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-sm text-lg font-bold text-white ${bg}`}>
//       {letter}
//     </div>
//   );
// }

// /* ─────────────────────────────────────────
//    PERSON AVATAR (circular, for sidebar)
// ───────────────────────────────────────── */
// const AVATAR_COLORS = [
//   "bg-teal-600","bg-pink-600","bg-orange-600",
//   "bg-purple-600","bg-sky-600","bg-rose-600",
// ];
// function PersonAvatar({ person, size = "h-12 w-12" }) {
//   const color = AVATAR_COLORS[person.name.charCodeAt(0) % AVATAR_COLORS.length];
//   const initials = person.name.split(" ").map((w) => w[0]).join("").slice(0,2).toUpperCase();
//   if (person.avatar) {
//     return <img src={person.avatar} alt={person.name} className={`${size} shrink-0 rounded-full object-cover`} />;
//   }
//   return (
//     <div className={`${size} shrink-0 rounded-full flex items-center justify-center text-white font-bold text-base ${color}`}>
//       {initials}
//     </div>
//   );
// }

// /* ─────────────────────────────────────────
//    COMPANY LOGO (square, for sidebar)
// ───────────────────────────────────────── */
// const COMPANY_COLORS = [
//   "bg-red-600","bg-green-700","bg-[#0A66C2]",
//   "bg-amber-600","bg-indigo-700","bg-emerald-700",
// ];
// function CompanyLogo({ company, size = "h-12 w-12" }) {
//   const color = COMPANY_COLORS[company.name.charCodeAt(0) % COMPANY_COLORS.length];
//   const initial = company.name.charAt(0).toUpperCase();
//   if (company.logo) {
//     return <img src={company.logo} alt={company.name} className={`${size} shrink-0 rounded-sm object-cover`} />;
//   }
//   return (
//     <div className={`${size} shrink-0 rounded-sm flex items-center justify-center text-white font-bold text-lg ${color}`}>
//       {initial}
//     </div>
//   );
// }

// /* ─────────────────────────────────────────
//    CONSTANTS
// ───────────────────────────────────────── */
// const TABS            = ["All", "Jobs", "My posts", "Mentions"];
// const DEFAULT_FILTERS = { status: "All", range: "Last 30 days" };
// const DEFAULT_PREFS   = {
//   appStatus: true, employerMessages: true, jobRecs: true,
//   govUpdates: true, internshipAlerts: true, announcements: true,
//   emailStatus: true, emailJobs: true, emailMessages: true,
//   weeklyDigest: false, whatsapp: false, sms: false,
//   frequency: "Instant",
// };

// /* ═════════════════════════════════════════
//    MAIN COMPONENT
// ═════════════════════════════════════════ */
// export default function Notifications() {
//   const navigate       = useNavigate();
//   const shownAlertsRef = useRef(new Set());

//   /* notifications state */
//   const [items,        setItems]        = useState([]);
//   const [apiUnread,    setApiUnread]    = useState(0);
//   const [loading,      setLoading]      = useState(true);
//   const [err,          setErr]          = useState("");

//   /* filters */
//   const [activeTab,    setActiveTab]    = useState("All");
//   const [search,       setSearch]       = useState("");
//   const [filters,      setFilters]      = useState(DEFAULT_FILTERS);

//   /* prefs */
//   const [prefs,        setPrefs]        = useState(DEFAULT_PREFS);
//   const [prefsLoading, setPrefsLoading] = useState(true);
//   const [prefsOpen,    setPrefsOpen]    = useState(false);
//   const [saveModal,    setSaveModal]    = useState(false);

//   /* ── REAL profile stats ── */
//   const [profileStats, setProfileStats] = useState({ profileViews: 0, postImpressions: 0 });
//   const [statsLoading, setStatsLoading] = useState(true);

//   /* ── REAL sidebar suggestions ── */
//   const [people,        setPeople]        = useState([]);
//   const [companies,     setCompanies]     = useState([]);
//   const [suggestLoading,setSuggestLoading]= useState(true);

//   /* follow state – keyed by id */
//   const [followed, setFollowed] = useState({});
//   /* dismissed suggestions */
//   const [dismissed, setDismissed] = useState({});

//   /* ── fetch notifications ── */
//   const fetchNotifications = useCallback(async (opts = {}) => {
//     try {
//       setErr(""); setLoading(true);
//       const res = await studentListNotifications({
//         status: opts.status ?? filters.status,
//         q:      opts.q      ?? search,
//       });
//       setItems(res?.data?.items || []);
//       setApiUnread(Number(res?.data?.unreadCount || 0));
//     } catch (e) {
//       setErr(e?.response?.data?.message || e?.message || "Failed to load notifications");
//     } finally { setLoading(false); }
//   }, [filters.status, search]);

//   /* ── fetch prefs ── */
//   const fetchPrefs = async () => {
//     try {
//       setPrefsLoading(true);
//       const res = await studentGetNotificationPrefs();
//       setPrefs((p) => ({ ...p, ...(res?.data || {}) }));
//     } catch { /* keep defaults */ } finally { setPrefsLoading(false); }
//   };

//   /* ── fetch real profile stats ── */
//   const fetchProfileStats = async () => {
//     try {
//       setStatsLoading(true);
//       const res = await studentGetProfileStats();
//       if (res?.data) setProfileStats(res.data);
//     } catch { /* silently keep 0 */ } finally { setStatsLoading(false); }
//   };

//   /* ── fetch real sidebar suggestions ── */
//   const fetchSuggestions = async () => {
//     try {
//       setSuggestLoading(true);
//       const [peopleRes, companiesRes] = await Promise.all([
//         studentGetPeopleSuggestions(),
//         studentGetCompanySuggestions(),
//       ]);
//       const pData = peopleRes?.data || [];
//       const cData = companiesRes?.data || [];

//       /* seed followed state from server data */
//       const initFollowed = {};
//       [...pData, ...cData].forEach((x) => { if (x.isFollowing) initFollowed[x.id] = true; });
//       setFollowed((f) => ({ ...initFollowed, ...f }));

//       setPeople(pData);
//       setCompanies(cData);
//     } catch { /* silent */ } finally { setSuggestLoading(false); }
//   };

//   /* ── mount ── */
//   useEffect(() => {
//     fetchPrefs();
//     fetchProfileStats();
//     fetchSuggestions();
//   }, []);

//   useEffect(() => {
//     const t = setTimeout(() => fetchNotifications(), 250);
//     return () => clearTimeout(t);
//   }, [filters.status, search]);

//   useEffect(() => {
//     const timer = setInterval(() => fetchNotifications(), 30_000);
//     return () => clearInterval(timer);
//   }, []);

//   /* browser push */
//   useEffect(() => {
//     if (typeof window === "undefined" || !("Notification" in window)) return;
//     if (window.Notification.permission !== "granted") return;
//     items.forEach((item) => {
//       if (item?.status !== "Unread" || shownAlertsRef.current.has(item.id)) return;
//       if (!/interview reminder|starting now/i.test(String(item?.title || ""))) return;
//       shownAlertsRef.current.add(item.id);
//       try { new window.Notification(item.title, { body: item.description || "" }); } catch {}
//     });
//   }, [items]);

//   const unreadCount = useMemo(
//     () => apiUnread || items.filter((x) => x.status === "Unread").length,
//     [apiUnread, items]
//   );

//   /* ── follow / unfollow ── */
//   const handleFollow = async (id) => {
//     const isNowFollowed = !followed[id];
//     setFollowed((f) => ({ ...f, [id]: isNowFollowed }));
//     try {
//       if (isNowFollowed) await studentFollowTarget(id);
//       else               await studentUnfollowTarget(id);
//     } catch {
//       /* revert on error */
//       setFollowed((f) => ({ ...f, [id]: !isNowFollowed }));
//     }
//   };

//   const dismissSuggestion = (id) => setDismissed((d) => ({ ...d, [id]: true }));

//   /* ── filter + group ── */
//   const tabTypeMap = { Jobs: "job", "My posts": "application", Mentions: "message" };
//   const filtered = useMemo(() => {
//     let list = items;
//     if (activeTab !== "All") {
//       const t = tabTypeMap[activeTab];
//       if (t) list = list.filter((x) => x.icon === t || x.type?.toLowerCase() === t);
//     }
//     if (filters.status !== "All") list = list.filter((x) => x.status === filters.status);
//     if (filters.range !== "Last 30 days") {
//       const now  = Date.now();
//       const days = filters.range === "Today" ? 1 : 7;
//       list = list.filter((x) => (now - new Date(x.createdAt || Date.now()).getTime()) / 86_400_000 <= days);
//     }
//     return list;
//   }, [items, activeTab, filters]);

//   const grouped = useMemo(() => ({
//     Today:     filtered.filter((x) => x.group === "Today"),
//     Yesterday: filtered.filter((x) => x.group === "Yesterday"),
//     Earlier:   filtered.filter((x) => x.group === "Earlier"),
//   }), [filtered]);

//   /* ── actions ── */
//   const markAllRead = async () => {
//     try {
//       await studentMarkAllNotificationsRead();
//       setItems((prev) => prev.map((x) => ({ ...x, status: "Read" })));
//       setApiUnread(0);
//     } catch (e) { setErr(e?.response?.data?.message || e?.message || "Failed"); }
//   };

//   const toggleRead = async (id) => {
//     try {
//       await studentToggleNotificationRead(id);
//       setItems((prev) => {
//         const wasUnread = prev.find((x) => x.id === id)?.status === "Unread";
//         setApiUnread((n) => Math.max(0, n + (wasUnread ? -1 : 1)));
//         return prev.map((x) => x.id === id ? { ...x, status: wasUnread ? "Read" : "Unread" } : x);
//       });
//     } catch (e) { setErr(e?.response?.data?.message || e?.message || "Failed"); }
//   };

//   const markAsRead = async (id) => {
//     const target = items.find((x) => x.id === id);
//     if (!target || target.status !== "Unread") return;
//     try {
//       await studentToggleNotificationRead(id);
//       setItems((prev) => prev.map((x) => x.id === id ? { ...x, status: "Read" } : x));
//       setApiUnread((n) => Math.max(0, n - 1));
//     } catch (e) { setErr(e?.response?.data?.message || e?.message || "Failed"); }
//   };

//   const savePrefs = async () => {
//     try { await studentSaveNotificationPrefs(prefs); setSaveModal(true); }
//     catch (e) { setErr(e?.response?.data?.message || e?.message || "Failed to save"); }
//   };

//   const onAction = async (item, action) => {
//     const meta = item?.meta || {};
//     if (action === "Reply")            { navigate(meta.conversationId ? `/student/messages?thread=${meta.conversationId}` : "/student/messages"); return; }
//     if (action === "View Job")         { navigate(meta.jobId ? `/student/jobs/${meta.jobId}` : "/student/jobs"); return; }
//     if (action === "View Application") { navigate("/student/my-jobs"); return; }
//     if (action === "Join Meeting")     { if (meta.url) window.open(meta.url, "_blank", "noopener,noreferrer"); return; }
//     if (action === "Save Job")         { try { if (meta.jobId) await studentToggleSaveJob(meta.jobId); } catch {} return; }
//     if (meta.url) window.open(meta.url, "_blank", "noopener,noreferrer");
//   };

//   const actionBtn = (item, action) => (
//     <button
//       key={action}
//       type="button"
//       onClick={(e) => { e.stopPropagation(); onAction(item, action); }}
//       className="inline-flex items-center gap-1 rounded-full border border-[#70B5F9] px-3 py-0.5 text-xs font-semibold text-[#70B5F9] hover:bg-[#70B5F9]/10 transition-colors"
//     >
//       {action === "Save Job" && <FiBookmark size={11} />}
//       {action}
//     </button>
//   );

//   /* ── render a time-group ── */
//   const renderGroup = (label, data) => {
//     if (!data.length) return null;
//     return (
//       <div key={label}>
//         <p className="px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-[#8C9AA5] border-b border-[#38434F]">
//           {label}
//         </p>
//         {data.map((item) => {
//           const unread = item.status === "Unread";
//           return (
//             <div
//               key={item.id}
//               onClick={() => markAsRead(item.id)}
//               className={`group relative flex cursor-pointer items-start border-b border-[#38434F] transition-colors hover:bg-[#26343E] ${unread ? "bg-[#1A2733]" : ""}`}
//             >
//               {/* unread dot */}
//               <div className="flex w-7 shrink-0 items-center justify-center pt-5">
//                 {unread
//                   ? <span className="h-2.5 w-2.5 rounded-full bg-[#0A66C2]" />
//                   : <span className="h-2.5 w-2.5" />}
//               </div>

//               <div className="shrink-0 pt-3.5">
//                 <NotifAvatar item={item} />
//               </div>

//               <div className="min-w-0 flex-1 px-3 py-3.5">
//                 <p className={`text-sm leading-snug ${unread ? "font-semibold text-white" : "font-normal text-[#B0B7BE]"}`}>
//                   {item.title}
//                 </p>
//                 {item.description && (
//                   <p className="mt-0.5 text-sm text-[#8C9AA5] line-clamp-2">{item.description}</p>
//                 )}
//                 <p className={`mt-1 text-xs font-medium ${unread ? "text-[#70B5F9]" : "text-[#8C9AA5]"}`}>
//                   {item.time}
//                 </p>
//                 <div className="mt-1 flex flex-wrap gap-2">
//                   {(item.actions || []).map((a) => actionBtn(item, a))}
//                 </div>
//               </div>

//               <div className="flex shrink-0 items-start pt-3.5 pr-3">
//                 <button
//                   type="button"
//                   onClick={(e) => { e.stopPropagation(); toggleRead(item.id); }}
//                   title={unread ? "Mark as read" : "Mark as unread"}
//                   className="rounded-full p-1.5 text-[#8C9AA5] opacity-0 transition-opacity group-hover:opacity-100 hover:bg-[#38434F]"
//                 >
//                   <FiMoreVertical size={16} />
//                 </button>
//               </div>
//             </div>
//           );
//         })}
//       </div>
//     );
//   };

//   /* ── prefs panel ── */
//   const PrefsPanel = () => (
//     prefsLoading
//       ? <p className="p-4 text-sm text-[#8C9AA5]">Loading…</p>
//       : (
//         <div className="p-4 space-y-4">
//           <div className="space-y-3">
//             <p className="text-xs font-semibold uppercase tracking-wider text-[#8C9AA5]">In-App</p>
//             {[
//               ["Application updates",  "appStatus"],
//               ["Employer messages",    "employerMessages"],
//               ["Job recommendations",  "jobRecs"],
//               ["Govt job updates",     "govUpdates"],
//               ["Internship alerts",    "internshipAlerts"],
//               ["Announcements",        "announcements"],
//             ].map(([label, key]) => (
//               <div key={key} className="flex items-center justify-between text-sm text-[#B0B7BE]">
//                 <span>{label}</span>
//                 <Toggle checked={!!prefs[key]} onChange={() => setPrefs((p) => ({ ...p, [key]: !p[key] }))} />
//               </div>
//             ))}
//           </div>

//           <div className="space-y-3 border-t border-[#38434F] pt-3">
//             <p className="text-xs font-semibold uppercase tracking-wider text-[#8C9AA5]">Email</p>
//             {[
//               ["Application status",  "emailStatus"],
//               ["Job alerts",          "emailJobs"],
//               ["Employer messages",   "emailMessages"],
//               ["Weekly digest",       "weeklyDigest"],
//             ].map(([label, key]) => (
//               <div key={key} className="flex items-center justify-between text-sm text-[#B0B7BE]">
//                 <span>{label}</span>
//                 <Toggle checked={!!prefs[key]} onChange={() => setPrefs((p) => ({ ...p, [key]: !p[key] }))} />
//               </div>
//             ))}
//             <select
//               value={prefs.frequency}
//               onChange={(e) => setPrefs((p) => ({ ...p, frequency: e.target.value }))}
//               className="mt-1 h-9 w-full rounded-lg border border-[#38434F] bg-[#1D2226] px-3 text-sm text-[#B0B7BE] outline-none focus:border-[#0A66C2]"
//             >
//               <option>Instant</option>
//               <option>Daily summary</option>
//               <option>Weekly summary</option>
//             </select>
//           </div>

//           <div className="space-y-3 border-t border-[#38434F] pt-3">
//             <p className="text-xs font-semibold uppercase tracking-wider text-[#8C9AA5]">Other Channels</p>
//             {[["WhatsApp", "whatsapp"], ["SMS", "sms"]].map(([label, key]) => (
//               <div key={key} className="flex items-center justify-between text-sm text-[#B0B7BE]">
//                 <span>{label}</span>
//                 <Toggle checked={!!prefs[key]} onChange={() => setPrefs((p) => ({ ...p, [key]: !p[key] }))} />
//               </div>
//             ))}
//             {(prefs.whatsapp || prefs.sms) && (
//               <button type="button" className="text-xs font-semibold text-[#70B5F9] hover:underline">
//                 Verify phone number
//               </button>
//             )}
//           </div>

//           <div className="flex gap-2 border-t border-[#38434F] pt-3">
//             <button type="button" onClick={savePrefs}
//               className="flex-1 rounded-full bg-[#0A66C2] py-2 text-sm font-semibold text-white hover:bg-[#004182] transition-colors">
//               Save
//             </button>
//             <button type="button" onClick={() => setPrefs(DEFAULT_PREFS)}
//               className="flex-1 rounded-full border border-[#38434F] py-2 text-sm font-semibold text-[#B0B7BE] hover:bg-[#313B46] transition-colors">
//               Reset
//             </button>
//           </div>
//         </div>
//       )
//   );

//   /* ── visible suggestions (not dismissed) ── */
//   const visiblePeople    = people.filter((p) => !dismissed[p.id]);
//   const visibleCompanies = companies.filter((c) => !dismissed[c.id]);

//   /* ═══════════════════════════════════════
//      RENDER
//   ═══════════════════════════════════════ */
//   return (
//     <div className="min-h-screen bg-[#1D2226]">
//       <div className="mx-auto max-w-[1280px] px-4 py-5">
//         <div className="flex gap-5">

//           {/* ════════════════════════════
//               LEFT SIDEBAR
//           ════════════════════════════ */}
//           <aside className="hidden w-[225px] shrink-0 lg:block space-y-3">

//             {/* Profile card with REAL stats */}
//             <div className="overflow-hidden rounded-xl border border-[#38434F] bg-[#1D2226]">
//               <div className="h-14 bg-gradient-to-r from-[#0A66C2] to-[#0073B1]" />
//               <div className="px-4 pb-3">
//                 <div className="-mt-7 mb-2">
//                   <div className="h-14 w-14 rounded-full border-2 border-[#1D2226] bg-gradient-to-br from-slate-500 to-slate-700 flex items-center justify-center text-white text-xl font-bold">
//                     S
//                   </div>
//                 </div>
//                 <p className="text-sm font-semibold text-white">Shyam Sss</p>
//                 <p className="text-xs text-[#8C9AA5] leading-snug mt-0.5">
//                   Computer Science Student · Junior Web Developer
//                 </p>
//                 <div className="flex items-center gap-1 mt-1">
//                   <FiMapPin size={11} className="text-[#8C9AA5]" />
//                   <p className="text-xs text-[#8C9AA5]">Bengaluru, Karnataka</p>
//                 </div>
//                 <div className="mt-3 border-t border-[#38434F] pt-3 space-y-1.5">
//                   <div className="flex justify-between text-xs">
//                     <span className="text-[#8C9AA5]">Profile viewers</span>
//                     {statsLoading
//                       ? <span className="text-[#8C9AA5]">—</span>
//                       : <span className="font-semibold text-[#70B5F9]">{profileStats.profileViews.toLocaleString()}</span>
//                     }
//                   </div>
//                   <div className="flex justify-between text-xs">
//                     <span className="text-[#8C9AA5]">Post impressions</span>
//                     {statsLoading
//                       ? <span className="text-[#8C9AA5]">—</span>
//                       : <span className="font-semibold text-[#70B5F9]">{profileStats.postImpressions.toLocaleString()}</span>
//                     }
//                   </div>
//                 </div>
//               </div>
//             </div>

//             {/* Manage notifications */}
//             <div className="rounded-xl border border-[#38434F] bg-[#1D2226] p-3">
//               <p className="text-sm font-semibold text-white">Manage your notifications</p>
//               <button
//                 type="button"
//                 onClick={() => setPrefsOpen(true)}
//                 className="mt-2 text-xs font-semibold text-[#70B5F9] hover:underline"
//               >
//                 View settings
//               </button>
//             </div>
//           </aside>

//           {/* ════════════════════════════
//               CENTER FEED  (wider)
//           ════════════════════════════ */}
//           <main className="min-w-0 flex-1">
//             <div className="overflow-hidden rounded-xl border border-[#38434F] bg-[#1D2226]">

//               {/* header */}
//               <div className="flex items-center justify-between border-b border-[#38434F] px-4 py-3">
//                 <div className="flex items-center gap-2">
//                   <h1 className="text-lg font-semibold text-white">Notifications</h1>
//                   {unreadCount > 0 && (
//                     <span className="rounded-full bg-[#CC1016] px-1.5 py-0.5 text-[11px] font-bold text-white leading-none">
//                       {unreadCount}
//                     </span>
//                   )}
//                 </div>
//                 <div className="flex items-center gap-1">
//                   {unreadCount > 0 && (
//                     <button type="button" onClick={markAllRead}
//                       className="hidden sm:block rounded-full px-3 py-1 text-xs font-semibold text-[#70B5F9] hover:bg-[#26343E] transition-colors">
//                       Mark all as read
//                     </button>
//                   )}
//                   <button type="button" onClick={() => fetchNotifications()}
//                     className="rounded-full p-1.5 text-[#8C9AA5] hover:bg-[#313B46] transition-colors" title="Refresh">
//                     <FiRefreshCw size={15} />
//                   </button>
//                   <button type="button" onClick={() => setPrefsOpen(true)}
//                     className="rounded-full p-1.5 text-[#8C9AA5] hover:bg-[#313B46] transition-colors lg:hidden">
//                     <FiSettings size={15} />
//                   </button>
//                 </div>
//               </div>

//               {/* tabs */}
//               <div className="flex items-center gap-1 border-b border-[#38434F] px-3 py-1">
//                 {TABS.map((tab) => (
//                   <button key={tab} type="button" onClick={() => setActiveTab(tab)}
//                     className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
//                       activeTab === tab
//                         ? "bg-[#0A66C2] text-white"
//                         : "text-[#B0B7BE] hover:bg-[#313B46] hover:text-white"
//                     }`}>
//                     {tab}
//                   </button>
//                 ))}
//               </div>

//               {/* search + filter bar */}
//               <div className="flex flex-wrap items-center gap-2 border-b border-[#38434F] px-4 py-2">
//                 <input
//                   value={search}
//                   onChange={(e) => setSearch(e.target.value)}
//                   placeholder="Search notifications…"
//                   className="h-8 flex-1 min-w-[140px] rounded-full border border-[#38434F] bg-[#2A3540] px-4 text-sm text-white placeholder-[#8C9AA5] outline-none focus:border-[#0A66C2]"
//                 />
//                 <select value={filters.status}
//                   onChange={(e) => setFilters((p) => ({ ...p, status: e.target.value }))}
//                   className="h-8 rounded-full border border-[#38434F] bg-[#2A3540] px-3 text-xs text-[#B0B7BE] outline-none">
//                   <option>All</option><option>Unread</option><option>Read</option>
//                 </select>
//                 <select value={filters.range}
//                   onChange={(e) => setFilters((p) => ({ ...p, range: e.target.value }))}
//                   className="h-8 rounded-full border border-[#38434F] bg-[#2A3540] px-3 text-xs text-[#B0B7BE] outline-none">
//                   <option>Today</option><option>Last 7 days</option><option>Last 30 days</option>
//                 </select>
//               </div>

//               {/* error */}
//               {err && (
//                 <div className="mx-4 mt-3 rounded-lg border border-red-800 bg-red-900/30 px-3 py-2 text-sm text-red-300">
//                   {err}
//                 </div>
//               )}

//               {/* feed */}
//               {loading ? (
//                 <div className="flex flex-col items-center justify-center py-20">
//                   <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#2A3540] text-[#0A66C2]">
//                     <FiBell size={22} />
//                   </div>
//                   <p className="text-sm text-[#8C9AA5]">Loading notifications…</p>
//                 </div>
//               ) : filtered.length === 0 ? (
//                 <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
//                   <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-[#2A3540] text-[#0A66C2]">
//                     <FiBell size={26} />
//                   </div>
//                   <p className="text-base font-semibold text-white">You're all caught up</p>
//                   <p className="mt-1 text-sm text-[#8C9AA5]">No notifications match your filters.</p>
//                   <Link to="/student/jobs"
//                     className="mt-5 rounded-full bg-[#0A66C2] px-6 py-2 text-sm font-semibold text-white hover:bg-[#004182] transition-colors">
//                     Browse Jobs
//                   </Link>
//                 </div>
//               ) : (
//                 <>
//                   {renderGroup("Today",     grouped.Today)}
//                   {renderGroup("Yesterday", grouped.Yesterday)}
//                   {renderGroup("Earlier",   grouped.Earlier)}
//                 </>
//               )}
//             </div>
//           </main>

//           {/* ════════════════════════════
//               RIGHT SIDEBAR  (real data)
//           ════════════════════════════ */}
//           <aside className="hidden w-[300px] shrink-0 xl:block space-y-3">

//             {/* People you may know – real students */}
//             <div className="rounded-xl border border-[#38434F] bg-[#1D2226] overflow-hidden">
//               <div className="px-4 pt-4 pb-2">
//                 <p className="text-sm font-semibold text-white">People you may know</p>
//               </div>

//               {suggestLoading ? (
//                 <p className="px-4 pb-4 text-xs text-[#8C9AA5]">Loading…</p>
//               ) : visiblePeople.length === 0 ? (
//                 <p className="px-4 pb-4 text-xs text-[#8C9AA5]">No suggestions right now.</p>
//               ) : (
//                 <div className="divide-y divide-[#38434F]">
//                   {visiblePeople.slice(0,3).map((p) => (
//                     <div key={p.id} className="flex items-start gap-3 px-4 py-3">
//                       <PersonAvatar person={p} />
//                       <div className="min-w-0 flex-1">
//                         <p className="text-sm font-semibold text-white truncate">{p.name}</p>
//                         <p className="text-xs text-[#8C9AA5] leading-snug truncate">{p.role}</p>
//                         <p className="text-xs text-[#8C9AA5] mt-0.5">{p.mutual}</p>
//                         <button
//                           type="button"
//                           onClick={() => handleFollow(p.id)}
//                           className={`mt-2 inline-flex items-center gap-1 rounded-full border px-4 py-0.5 text-xs font-semibold transition-colors ${
//                             followed[p.id]
//                               ? "border-[#38434F] bg-[#313B46] text-[#B0B7BE]"
//                               : "border-[#70B5F9] text-[#70B5F9] hover:bg-[#70B5F9]/10"
//                           }`}
//                         >
//                           {followed[p.id] ? <><FiCheck size={11} /> Following</> : <><FiUserPlus size={11} /> Follow</>}
//                         </button>
//                       </div>
//                       <button type="button" onClick={() => dismissSuggestion(p.id)}
//                         className="mt-1 shrink-0 rounded-full p-1 text-[#8C9AA5] hover:bg-[#38434F]">
//                         <FiX size={14} />
//                       </button>
//                     </div>
//                   ))}
//                 </div>
//               )}

//               {visiblePeople.length > 3 && (
//                 <button type="button" className="w-full px-4 py-3 text-xs font-semibold text-[#8C9AA5] hover:bg-[#26343E] transition-colors text-center border-t border-[#38434F]">
//                   Show all recommendations →
//                 </button>
//               )}
//             </div>

//             {/* Companies to follow – real registered companies */}
//             <div className="rounded-xl border border-[#38434F] bg-[#1D2226] overflow-hidden">
//               <div className="px-4 pt-4 pb-2">
//                 <p className="text-sm font-semibold text-white">Companies to follow</p>
//               </div>

//               {suggestLoading ? (
//                 <p className="px-4 pb-4 text-xs text-[#8C9AA5]">Loading…</p>
//               ) : visibleCompanies.length === 0 ? (
//                 <p className="px-4 pb-4 text-xs text-[#8C9AA5]">No companies to show yet.</p>
//               ) : (
//                 <div className="divide-y divide-[#38434F]">
//                   {visibleCompanies.slice(0,3).map((c) => (
//                     <div key={c.id} className="flex items-start gap-3 px-4 py-3">
//                       <CompanyLogo company={c} />
//                       <div className="min-w-0 flex-1">
//                         <p className="text-sm font-semibold text-white truncate">{c.name}</p>
//                         <p className="text-xs text-[#8C9AA5] leading-snug">
//                           {c.industry} · {c.followerCount.toLocaleString()} follower{c.followerCount !== 1 ? "s" : ""}
//                         </p>
//                         <button
//                           type="button"
//                           onClick={() => handleFollow(c.id)}
//                           className={`mt-2 inline-flex items-center gap-1 rounded-full border px-4 py-0.5 text-xs font-semibold transition-colors ${
//                             followed[c.id]
//                               ? "border-[#38434F] bg-[#313B46] text-[#B0B7BE]"
//                               : "border-[#70B5F9] text-[#70B5F9] hover:bg-[#70B5F9]/10"
//                           }`}
//                         >
//                           {followed[c.id] ? <><FiCheck size={11} /> Following</> : "+ Follow"}
//                         </button>
//                       </div>
//                       <button type="button" onClick={() => dismissSuggestion(c.id)}
//                         className="mt-1 shrink-0 rounded-full p-1 text-[#8C9AA5] hover:bg-[#38434F]">
//                         <FiX size={14} />
//                       </button>
//                     </div>
//                   ))}
//                 </div>
//               )}

//               {visibleCompanies.length > 3 && (
//                 <button type="button" className="w-full px-4 py-3 text-xs font-semibold text-[#8C9AA5] hover:bg-[#26343E] transition-colors text-center border-t border-[#38434F]">
//                   Show all companies →
//                 </button>
//               )}
//             </div>

//             {/* Footer */}
//             <div className="px-1">
//               <div className="flex flex-wrap gap-x-2 gap-y-1">
//                 {["About","Accessibility","Help Center","Privacy & Terms","Ad Choices","Advertising","More"].map((l) => (
//                   <button key={l} type="button" className="text-xs text-[#8C9AA5] hover:underline">{l}</button>
//                 ))}
//               </div>
//               <p className="mt-2 text-xs text-[#8C9AA5]">JobPortal © {new Date().getFullYear()}</p>
//             </div>
//           </aside>
//         </div>
//       </div>

//       {/* Mobile bottom bar */}
//       <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[#38434F] bg-[#1D2226] px-4 py-2.5 lg:hidden">
//         <div className="flex gap-2">
//           <button type="button" onClick={markAllRead}
//             className="flex-1 rounded-full border border-[#38434F] py-2 text-sm font-semibold text-[#70B5F9] hover:bg-[#313B46]">
//             Mark all read
//           </button>
//           <button type="button" onClick={() => setPrefsOpen(true)}
//             className="flex-1 rounded-full bg-[#0A66C2] py-2 text-sm font-semibold text-white hover:bg-[#004182]">
//             Settings {unreadCount > 0 ? `(${unreadCount})` : ""}
//           </button>
//         </div>
//       </div>

//       {/* Prefs drawer */}
//       {prefsOpen && (
//         <div className="fixed inset-0 z-50 flex items-end bg-black/70 lg:items-center lg:justify-center"
//           onClick={() => setPrefsOpen(false)}>
//           <div
//             className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-t-2xl lg:rounded-2xl border border-[#38434F] bg-[#1D2226]"
//             onClick={(e) => e.stopPropagation()}
//           >
//             <div className="flex items-center justify-between border-b border-[#38434F] px-4 py-3">
//               <span className="text-base font-semibold text-white">Notification Settings</span>
//               <button type="button" onClick={() => setPrefsOpen(false)}
//                 className="rounded-full p-1 text-[#8C9AA5] hover:bg-[#38434F]">
//                 <FiX size={18} />
//               </button>
//             </div>
//             <PrefsPanel />
//           </div>
//         </div>
//       )}

//       {/* Save modal */}
//       <Modal open={saveModal} onClose={() => setSaveModal(false)} title="Preferences saved"
//         footer={
//           <button type="button" onClick={() => setSaveModal(false)}
//             className="rounded-full bg-[#0A66C2] px-5 py-2 text-sm font-semibold text-white hover:bg-[#004182]">
//             Done
//           </button>
//         }>
//         <p className="text-sm text-[#B0B7BE]">Your notification preferences have been saved.</p>
//       </Modal>
//     </div>
//   );
// }


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


// // frontend/src/pages/student/Notifications.jsx
// // ✅ Left sidebar now reads from the SAME studentMe API as Profile.jsx
// //    — shows real name, avatar, designation, location, profileViews,
// //      postImpressions, applicationsSent, followers, following

// import { useEffect, useMemo, useRef, useState, useCallback } from "react";
// import { Link, useNavigate } from "react-router-dom";
// import {
//   FiBell, FiBookmark, FiMoreVertical, FiRefreshCw,
//   FiSettings, FiX, FiMapPin, FiUserPlus, FiCheck,
// } from "react-icons/fi";
// import Modal from "../../components/common/Modal";
// import {
//   studentListNotifications,
//   studentMarkAllNotificationsRead,
//   studentToggleNotificationRead,
//   studentGetNotificationPrefs,
//   studentSaveNotificationPrefs,
//   studentToggleSaveJob,
//   studentMe,                      // ← same call as Profile.jsx
//   studentGetPeopleSuggestions,
//   studentGetCompanySuggestions,
//   studentFollowTarget,
//   studentUnfollowTarget,
// } from "../../services/studentService";

// /* ─── helpers ─────────────────────────────────────────────────────── */
// const safeNum = (val) => {
//   const n = Number(val);
//   return Number.isFinite(n) ? n.toLocaleString() : "0";
// };

// const safeObj = (x) => (x && typeof x === "object" ? x : {});
// const safeArr = (x) => (Array.isArray(x) ? x : []);

// /** Mirror of Profile.jsx mapProfileToForm — only the fields the sidebar needs */
// function mapProfileToSidebar(me = {}) {
//   const p = safeObj(me.studentProfile);
//   const personal = safeObj(p.personal);
//   return {
//     name:             personal.fullName  || me.name      || "",
//     headline:         personal.about     || me.headline  || "",
//     designation:      personal.designation               || "Student",
//     location:
//       [personal.city, personal.state].filter(Boolean).join(", ") ||
//       me.location || "",
//     avatar:           personal.avatarUrl || me.avatarUrl || null,
//     // stats
//     profileViews:     me.profileViews    ?? 0,
//     postImpressions:  me.postImpressions ?? 0,
//     applicationsSent: me.applicationsSent ?? 0,
//     followers:        safeArr(me.followers).length,
//     following:        safeArr(me.following).length,
//   };
// }

// /* ─── TOGGLE ──────────────────────────────────────────────────────── */
// function Toggle({ checked, onChange }) {
//   return (
//     <button
//       type="button"
//       onClick={onChange}
//       className={`relative h-5 w-10 shrink-0 rounded-full transition-colors duration-200 ${
//         checked ? "bg-[#0A66C2]" : "bg-[#54666F]"
//       }`}
//     >
//       <span
//         className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all duration-200 ${
//           checked ? "left-[22px]" : "left-0.5"
//         }`}
//       />
//     </button>
//   );
// }

// /* ─── NOTIFICATION AVATAR ─────────────────────────────────────────── */
// function NotifAvatar({ item }) {
//   const colorMap = {
//     job: "bg-[#0A66C2]", application: "bg-emerald-600",
//     shortlisted: "bg-emerald-600", hold: "bg-amber-500",
//     rejected: "bg-red-600", message: "bg-violet-600", system: "bg-[#3D4F58]",
//   };
//   const bg     = colorMap[item?.icon] || "bg-[#3D4F58]";
//   const letter = String(item?.senderName || item?.title || "N").charAt(0).toUpperCase();
//   if (item?.avatar) {
//     return (
//       <img src={item.avatar} alt={item.senderName || "logo"}
//         className="h-12 w-12 flex-shrink-0 rounded-sm object-cover" />
//     );
//   }
//   return (
//     <div className={`flex h-12 w-12 flex-shrink-0 items-center justify-center
//       rounded-sm text-lg font-bold text-white ${bg}`}>
//       {letter}
//     </div>
//   );
// }

// /* ─── PERSON AVATAR ──────────────────────────────────────────────── */
// const AVATAR_COLORS = [
//   "bg-teal-600","bg-pink-600","bg-orange-600",
//   "bg-purple-600","bg-sky-600","bg-rose-600",
// ];
// function PersonAvatar({ person }) {
//   const name     = person?.name || "";
//   const color    = AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];
//   const initials = name.split(" ").map((w) => w[0] || "").join("").slice(0, 2).toUpperCase() || "?";
//   if (person?.avatar) {
//     return (
//       <img src={person.avatar} alt={name}
//         className="h-12 w-12 shrink-0 rounded-full object-cover" />
//     );
//   }
//   return (
//     <div className={`h-12 w-12 shrink-0 rounded-full flex items-center justify-center
//       text-white font-bold text-sm ${color}`}>
//       {initials}
//     </div>
//   );
// }

// /* ─── COMPANY LOGO ───────────────────────────────────────────────── */
// const COMPANY_COLORS = [
//   "bg-red-600","bg-green-700","bg-[#0A66C2]",
//   "bg-amber-600","bg-indigo-700","bg-emerald-700",
// ];
// function CompanyLogo({ company }) {
//   const name    = company?.name || "";
//   const color   = COMPANY_COLORS[name.charCodeAt(0) % COMPANY_COLORS.length];
//   const initial = name.charAt(0).toUpperCase() || "?";
//   if (company?.logo) {
//     return (
//       <img src={company.logo} alt={name}
//         className="h-12 w-12 shrink-0 rounded-sm object-cover" />
//     );
//   }
//   return (
//     <div className={`h-12 w-12 shrink-0 rounded-sm flex items-center justify-center
//       text-white font-bold text-lg ${color}`}>
//       {initial}
//     </div>
//   );
// }

// /* ─── SIDEBAR SKELETON ───────────────────────────────────────────── */
// function SidebarSkeleton({ count = 3, rounded = "rounded-full" }) {
//   return (
//     <div className="divide-y divide-[#38434F]">
//       {Array.from({ length: count }).map((_, i) => (
//         <div key={i} className="flex items-center gap-3 px-4 py-3">
//           <div className={`h-12 w-12 ${rounded} bg-[#2A3540] animate-pulse shrink-0`} />
//           <div className="flex-1 space-y-2">
//             <div className="h-3 w-28 rounded bg-[#2A3540] animate-pulse" />
//             <div className="h-2.5 w-20 rounded bg-[#2A3540] animate-pulse" />
//           </div>
//         </div>
//       ))}
//     </div>
//   );
// }

// /* ─── PROFILE CARD SKELETON ─────────────────────────────────────── */
// function ProfileCardSkeleton() {
//   return (
//     <div className="overflow-hidden rounded-xl border border-[#38434F] bg-[#1D2226]">
//       <div className="h-14 bg-[#2A3540] animate-pulse" />
//       <div className="px-4 pb-3">
//         <div className="-mt-7 mb-2">
//           <div className="h-14 w-14 rounded-full bg-[#2A3540] animate-pulse border-2 border-[#1D2226]" />
//         </div>
//         <div className="space-y-2 mt-1">
//           <div className="h-3.5 w-28 rounded bg-[#2A3540] animate-pulse" />
//           <div className="h-2.5 w-36 rounded bg-[#2A3540] animate-pulse" />
//           <div className="h-2.5 w-24 rounded bg-[#2A3540] animate-pulse" />
//         </div>
//         <div className="mt-3 border-t border-[#38434F] pt-3 space-y-2">
//           {[1,2,3].map(i => (
//             <div key={i} className="flex justify-between">
//               <div className="h-2.5 w-24 rounded bg-[#2A3540] animate-pulse" />
//               <div className="h-2.5 w-6 rounded bg-[#2A3540] animate-pulse" />
//             </div>
//           ))}
//         </div>
//       </div>
//     </div>
//   );
// }

// /* ─── CONSTANTS ──────────────────────────────────────────────────── */
// const TABS            = ["All", "Jobs", "My posts", "Mentions"];
// const DEFAULT_FILTERS = { status: "All", range: "Last 30 days" };
// const DEFAULT_PREFS   = {
//   appStatus: true, employerMessages: true, jobRecs: true,
//   govUpdates: true, internshipAlerts: true, announcements: true,
//   emailStatus: true, emailJobs: true, emailMessages: true,
//   weeklyDigest: false, whatsapp: false, sms: false, frequency: "Instant",
// };

// /* ═══════════════════════════════════════════════════════════════════
//    MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════ */
// export default function Notifications() {
//   const navigate       = useNavigate();
//   const shownAlertsRef = useRef(new Set());

//   /* notifications */
//   const [items,     setItems]     = useState([]);
//   const [apiUnread, setApiUnread] = useState(0);
//   const [loading,   setLoading]   = useState(true);
//   const [err,       setErr]       = useState("");

//   /* filters */
//   const [activeTab, setActiveTab] = useState("All");
//   const [search,    setSearch]    = useState("");
//   const [filters,   setFilters]   = useState(DEFAULT_FILTERS);

//   /* prefs */
//   const [prefs,        setPrefs]        = useState(DEFAULT_PREFS);
//   const [prefsLoading, setPrefsLoading] = useState(true);
//   const [prefsOpen,    setPrefsOpen]    = useState(false);
//   const [saveModal,    setSaveModal]    = useState(false);

//   /* ── Profile sidebar — same shape as Profile.jsx ── */
//   const [profileData,   setProfileData]   = useState(null);   // null = loading
//   const [statsLoading,  setStatsLoading]  = useState(true);

//   /* suggestions */
//   const [people,         setPeople]        = useState([]);
//   const [companies,      setCompanies]     = useState([]);
//   const [suggestLoading, setSuggestLoading] = useState(true);

//   /* follow state */
//   const [followed,      setFollowed]      = useState({});
//   const [followPending, setFollowPending] = useState({});

//   /* dismissed */
//   const [dismissed, setDismissed] = useState({});

//   /* ─── fetch notifications ─── */
//   const fetchNotifications = useCallback(async () => {
//     try {
//       setErr(""); setLoading(true);
//       const res = await studentListNotifications({ status: filters.status, q: search });
//       setItems(Array.isArray(res?.data?.items) ? res.data.items : []);
//       setApiUnread(Number(res?.data?.unreadCount) || 0);
//     } catch (e) {
//       setErr(e?.response?.data?.message || e?.message || "Failed to load notifications");
//     } finally { setLoading(false); }
//   }, [filters.status, search]);

//   /* ─── fetch prefs ─── */
//   const fetchPrefs = useCallback(async () => {
//     try {
//       setPrefsLoading(true);
//       const res = await studentGetNotificationPrefs();
//       if (res?.data && typeof res.data === "object") {
//         setPrefs((p) => ({ ...p, ...res.data }));
//       }
//     } catch { /* keep defaults */ } finally { setPrefsLoading(false); }
//   }, []);

//   /* ─── fetch REAL profile (same studentMe as Profile.jsx) ─── */
//   const fetchProfile = useCallback(async () => {
//     try {
//       setStatsLoading(true);
//       const res = await studentMe();          // no token arg — interceptor handles it
//       const me  = res?.data?.data ?? res?.data ?? {};
//       setProfileData(mapProfileToSidebar(me));
//     } catch {
//       // graceful fallback — show zeros rather than crash
//       setProfileData({
//         name: "", headline: "", designation: "Student",
//         location: "", avatar: null,
//         profileViews: 0, postImpressions: 0, applicationsSent: 0,
//         followers: 0, following: 0,
//       });
//     } finally { setStatsLoading(false); }
//   }, []);

//   /* ─── fetch suggestions ─── */
//   const fetchSuggestions = useCallback(async () => {
//     try {
//       setSuggestLoading(true);
//       const [pRes, cRes] = await Promise.all([
//         studentGetPeopleSuggestions().catch(() => ({ data: [] })),
//         studentGetCompanySuggestions().catch(() => ({ data: [] })),
//       ]);
//       const pList = Array.isArray(pRes?.data) ? pRes.data : [];
//       const cList = Array.isArray(cRes?.data) ? cRes.data : [];

//       const initMap = {};
//       [...pList, ...cList].forEach((x) => {
//         if (x?.id) initMap[x.id] = !!x.isFollowing;
//       });
//       setFollowed((f) => ({ ...initMap, ...f }));
//       setPeople(pList);
//       setCompanies(cList);
//     } catch { /* silent */ }
//     finally { setSuggestLoading(false); }
//   }, []);

//   /* ─── effects ─── */
//   useEffect(() => {
//     fetchPrefs();
//     fetchProfile();
//     fetchSuggestions();
//   }, []); // eslint-disable-line

//   useEffect(() => {
//     const t = setTimeout(fetchNotifications, 250);
//     return () => clearTimeout(t);
//   }, [fetchNotifications]);

//   useEffect(() => {
//     const timer = setInterval(fetchNotifications, 30_000);
//     return () => clearInterval(timer);
//   }, [fetchNotifications]);

//   /* browser push */
//   useEffect(() => {
//     if (!("Notification" in window)) return;
//     if (window.Notification.permission !== "granted") return;
//     items.forEach((item) => {
//       if (!item?.id || item.status !== "Unread") return;
//       if (shownAlertsRef.current.has(item.id)) return;
//       if (!/interview reminder|starting now/i.test(String(item.title || ""))) return;
//       shownAlertsRef.current.add(item.id);
//       try { new window.Notification(item.title, { body: item.description || "" }); } catch {}
//     });
//   }, [items]);

//   /* derived */
//   const unreadCount = useMemo(
//     () => apiUnread || items.filter((x) => x?.status === "Unread").length,
//     [apiUnread, items]
//   );

//   const tabTypeMap = { Jobs: "job", "My posts": "application", Mentions: "message" };
//   const filtered = useMemo(() => {
//     let list = [...items];
//     if (activeTab !== "All") {
//       const t = tabTypeMap[activeTab];
//       if (t) list = list.filter((x) => x?.icon === t || x?.type?.toLowerCase() === t);
//     }
//     if (filters.status !== "All") list = list.filter((x) => x?.status === filters.status);
//     if (filters.range !== "Last 30 days") {
//       const now = Date.now(), days = filters.range === "Today" ? 1 : 7;
//       list = list.filter(
//         (x) => (now - new Date(x?.createdAt || Date.now()).getTime()) / 86_400_000 <= days
//       );
//     }
//     return list;
//   }, [items, activeTab, filters]);

//   const grouped = useMemo(() => ({
//     Today:     filtered.filter((x) => x?.group === "Today"),
//     Yesterday: filtered.filter((x) => x?.group === "Yesterday"),
//     Earlier:   filtered.filter((x) => x?.group === "Earlier"),
//   }), [filtered]);

//   const visiblePeople    = useMemo(() => people.filter((p) => p?.id && !dismissed[p.id]), [people, dismissed]);
//   const visibleCompanies = useMemo(() => companies.filter((c) => c?.id && !dismissed[c.id]), [companies, dismissed]);

//   /* ─── notification actions ─── */
//   const markAllRead = async () => {
//     try {
//       await studentMarkAllNotificationsRead();
//       setItems((p) => p.map((x) => ({ ...x, status: "Read" })));
//       setApiUnread(0);
//     } catch (e) { setErr(e?.response?.data?.message || e?.message || "Failed"); }
//   };

//   const toggleRead = async (id) => {
//     try {
//       await studentToggleNotificationRead(id);
//       setItems((prev) => {
//         const wasUnread = prev.find((x) => x?.id === id)?.status === "Unread";
//         setApiUnread((n) => Math.max(0, n + (wasUnread ? -1 : 1)));
//         return prev.map((x) =>
//           x?.id === id ? { ...x, status: wasUnread ? "Read" : "Unread" } : x
//         );
//       });
//     } catch (e) { setErr(e?.response?.data?.message || e?.message || "Failed"); }
//   };

//   const markAsRead = async (id) => {
//     const target = items.find((x) => x?.id === id);
//     if (!target || target.status !== "Unread") return;
//     try {
//       await studentToggleNotificationRead(id);
//       setItems((p) => p.map((x) => x?.id === id ? { ...x, status: "Read" } : x));
//       setApiUnread((n) => Math.max(0, n - 1));
//     } catch (e) { setErr(e?.response?.data?.message || e?.message || "Failed"); }
//   };

//   const savePrefs = async () => {
//     try { await studentSaveNotificationPrefs(prefs); setSaveModal(true); }
//     catch (e) { setErr(e?.response?.data?.message || e?.message || "Failed to save"); }
//   };

//   const onAction = async (item, action) => {
//     const meta = item?.meta || {};
//     if (action === "Reply")            { navigate(meta.conversationId ? `/student/messages?thread=${meta.conversationId}` : "/student/messages"); return; }
//     if (action === "View Job")         { navigate(meta.jobId ? `/student/jobs/${meta.jobId}` : "/student/jobs"); return; }
//     if (action === "View Application") { navigate("/student/my-jobs"); return; }
//     if (action === "Join Meeting")     { if (meta.url) window.open(meta.url, "_blank", "noopener,noreferrer"); return; }
//     if (action === "Save Job")         { try { if (meta.jobId) await studentToggleSaveJob(meta.jobId); } catch {} return; }
//     if (meta.url) window.open(meta.url, "_blank", "noopener,noreferrer");
//   };

//   /* ─── follow toggle ─── */
//   const handleFollow = async (id) => {
//     if (followPending[id]) return;
//     const nowFollowing = !followed[id];
//     setFollowed((f) => ({ ...f, [id]: nowFollowing }));
//     setFollowPending((f) => ({ ...f, [id]: true }));
//     try {
//       if (nowFollowing) await studentFollowTarget(id);
//       else              await studentUnfollowTarget(id);
//     } catch {
//       setFollowed((f) => ({ ...f, [id]: !nowFollowing }));
//     } finally {
//       setFollowPending((f) => ({ ...f, [id]: false }));
//     }
//   };

//   const dismissSuggestion = (id) => setDismissed((d) => ({ ...d, [id]: true }));

//   const actionBtn = (item, action) => (
//     <button
//       key={action}
//       type="button"
//       onClick={(e) => { e.stopPropagation(); onAction(item, action); }}
//       className="inline-flex items-center gap-1 rounded-full border border-[#70B5F9]
//         px-3 py-0.5 text-xs font-semibold text-[#70B5F9] hover:bg-[#70B5F9]/10 transition-colors"
//     >
//       {action === "Save Job" && <FiBookmark size={11} />}
//       {action}
//     </button>
//   );

//   /* ─── render one time-group ─── */
//   const renderGroup = (label, data) => {
//     if (!data.length) return null;
//     return (
//       <div key={label}>
//         <p className="px-4 py-1.5 text-xs font-semibold uppercase tracking-wider
//           text-[#8C9AA5] border-b border-[#38434F]">
//           {label}
//         </p>
//         {data.map((item) => {
//           const unread = item?.status === "Unread";
//           const id     = item?.id;
//           return (
//             <div
//               key={id}
//               onClick={() => markAsRead(id)}
//               className={`group relative flex cursor-pointer items-start border-b
//                 border-[#38434F] transition-colors hover:bg-[#26343E]
//                 ${unread ? "bg-[#1A2733]" : ""}`}
//             >
//               <div className="flex w-7 shrink-0 items-center justify-center pt-5">
//                 {unread
//                   ? <span className="h-2.5 w-2.5 rounded-full bg-[#0A66C2]" />
//                   : <span className="h-2.5 w-2.5" />}
//               </div>
//               <div className="shrink-0 pt-3.5">
//                 <NotifAvatar item={item} />
//               </div>
//               <div className="min-w-0 flex-1 px-3 py-3.5">
//                 <p className={`text-sm leading-snug ${
//                   unread ? "font-semibold text-white" : "font-normal text-[#B0B7BE]"
//                 }`}>
//                   {item?.title}
//                 </p>
//                 {item?.description && (
//                   <p className="mt-0.5 text-sm text-[#8C9AA5] line-clamp-2">
//                     {item.description}
//                   </p>
//                 )}
//                 <p className={`mt-1 text-xs font-medium ${
//                   unread ? "text-[#70B5F9]" : "text-[#8C9AA5]"
//                 }`}>
//                   {item?.time}
//                 </p>
//                 <div className="mt-1 flex flex-wrap gap-2">
//                   {(item?.actions || []).map((a) => actionBtn(item, a))}
//                 </div>
//               </div>
//               <div className="flex shrink-0 items-start pt-3.5 pr-3">
//                 <button
//                   type="button"
//                   onClick={(e) => { e.stopPropagation(); toggleRead(id); }}
//                   title={unread ? "Mark as read" : "Mark as unread"}
//                   className="rounded-full p-1.5 text-[#8C9AA5] opacity-0
//                     transition-opacity group-hover:opacity-100 hover:bg-[#38434F]"
//                 >
//                   <FiMoreVertical size={16} />
//                 </button>
//               </div>
//             </div>
//           );
//         })}
//       </div>
//     );
//   };

//   /* ─── prefs panel ─── */
//   const PrefsPanel = () => (
//     prefsLoading ? (
//       <p className="p-4 text-sm text-[#8C9AA5]">Loading…</p>
//     ) : (
//       <div className="p-4 space-y-4">
//         <div className="space-y-3">
//           <p className="text-xs font-semibold uppercase tracking-wider text-[#8C9AA5]">In-App</p>
//           {[
//             ["Application updates", "appStatus"],
//             ["Employer messages",   "employerMessages"],
//             ["Job recommendations", "jobRecs"],
//             ["Govt job updates",    "govUpdates"],
//             ["Internship alerts",   "internshipAlerts"],
//             ["Announcements",       "announcements"],
//           ].map(([label, key]) => (
//             <div key={key} className="flex items-center justify-between text-sm text-[#B0B7BE]">
//               <span>{label}</span>
//               <Toggle checked={!!prefs[key]} onChange={() => setPrefs((p) => ({ ...p, [key]: !p[key] }))} />
//             </div>
//           ))}
//         </div>

//         <div className="space-y-3 border-t border-[#38434F] pt-3">
//           <p className="text-xs font-semibold uppercase tracking-wider text-[#8C9AA5]">Email</p>
//           {[
//             ["Application status", "emailStatus"],
//             ["Job alerts",         "emailJobs"],
//             ["Employer messages",  "emailMessages"],
//             ["Weekly digest",      "weeklyDigest"],
//           ].map(([label, key]) => (
//             <div key={key} className="flex items-center justify-between text-sm text-[#B0B7BE]">
//               <span>{label}</span>
//               <Toggle checked={!!prefs[key]} onChange={() => setPrefs((p) => ({ ...p, [key]: !p[key] }))} />
//             </div>
//           ))}
//           <select
//             value={prefs.frequency}
//             onChange={(e) => setPrefs((p) => ({ ...p, frequency: e.target.value }))}
//             className="mt-1 h-9 w-full rounded-lg border border-[#38434F] bg-[#1D2226]
//               px-3 text-sm text-[#B0B7BE] outline-none focus:border-[#0A66C2]"
//           >
//             <option>Instant</option>
//             <option>Daily summary</option>
//             <option>Weekly summary</option>
//           </select>
//         </div>

//         <div className="space-y-3 border-t border-[#38434F] pt-3">
//           <p className="text-xs font-semibold uppercase tracking-wider text-[#8C9AA5]">Other Channels</p>
//           {[["WhatsApp", "whatsapp"], ["SMS", "sms"]].map(([label, key]) => (
//             <div key={key} className="flex items-center justify-between text-sm text-[#B0B7BE]">
//               <span>{label}</span>
//               <Toggle checked={!!prefs[key]} onChange={() => setPrefs((p) => ({ ...p, [key]: !p[key] }))} />
//             </div>
//           ))}
//           {(prefs.whatsapp || prefs.sms) && (
//             <button type="button" className="text-xs font-semibold text-[#70B5F9] hover:underline">
//               Verify phone number
//             </button>
//           )}
//         </div>

//         <div className="flex gap-2 border-t border-[#38434F] pt-3">
//           <button type="button" onClick={savePrefs}
//             className="flex-1 rounded-full bg-[#0A66C2] py-2 text-sm font-semibold
//               text-white hover:bg-[#004182] transition-colors">
//             Save
//           </button>
//           <button type="button" onClick={() => setPrefs(DEFAULT_PREFS)}
//             className="flex-1 rounded-full border border-[#38434F] py-2 text-sm
//               font-semibold text-[#B0B7BE] hover:bg-[#313B46] transition-colors">
//             Reset
//           </button>
//         </div>
//       </div>
//     )
//   );

//   /* ══════════════════════════════════════════════════════════════════
//      RENDER
//   ══════════════════════════════════════════════════════════════════ */
//   return (
//     <div className="min-h-screen bg-[#1D2226]">
//       <div className="mx-auto max-w-[1280px] px-4 py-5">
//         <div className="flex gap-5">

//           {/* ══════════════════════
//               LEFT SIDEBAR
//           ══════════════════════ */}
//           <aside className="hidden w-[225px] shrink-0 lg:block space-y-3">

//             {/* ── Profile card — wired to real studentMe data ── */}
//             {statsLoading || profileData === null ? (
//               <ProfileCardSkeleton />
//             ) : (
//               <div className="overflow-hidden rounded-xl border border-[#38434F] bg-[#1D2226]">
//                 {/* banner */}
//                 <div className="h-14 bg-gradient-to-r from-[#0A66C2] to-[#0073B1]" />

//                 <div className="px-4 pb-3">
//                   {/* avatar */}
//                   <div className="-mt-7 mb-2">
//                     {profileData.avatar ? (
//                       <img
//                         src={profileData.avatar}
//                         alt={profileData.name}
//                         className="h-14 w-14 rounded-full border-2 border-[#1D2226] object-cover"
//                       />
//                     ) : (
//                       <div className="h-14 w-14 rounded-full border-2 border-[#1D2226]
//                         bg-gradient-to-br from-slate-500 to-slate-700 flex items-center
//                         justify-center text-white text-xl font-bold">
//                         {String(profileData.name || "S").charAt(0).toUpperCase()}
//                       </div>
//                     )}
//                   </div>

//                   {/* name / designation / headline / location */}
//                   <Link
//                     to="/student/profile"
//                     className="group block"
//                     title="View your profile"
//                   >
//                     <p className="text-sm font-semibold text-white group-hover:underline leading-snug">
//                       {profileData.name || "Student"}
//                     </p>
//                     {profileData.designation && profileData.designation !== "Student" && (
//                       <p className="text-xs text-[#70B5F9] font-medium mt-0.5">
//                         {profileData.designation}
//                       </p>
//                     )}
//                     {profileData.headline && (
//                       <p className="text-xs text-[#8C9AA5] leading-snug mt-0.5 line-clamp-2">
//                         {profileData.headline}
//                       </p>
//                     )}
//                   </Link>

//                   {profileData.location && (
//                     <div className="flex items-center gap-1 mt-1.5">
//                       <FiMapPin size={11} className="text-[#8C9AA5] shrink-0" />
//                       <p className="text-xs text-[#8C9AA5] truncate">{profileData.location}</p>
//                     </div>
//                   )}

//                   {/* stats */}
//                   <div className="mt-3 border-t border-[#38434F] pt-3 space-y-1.5">
//                     {[
//                       ["Profile viewers",   profileData.profileViews],
//                       ["Post impressions",  profileData.postImpressions],
//                       ["Applications sent", profileData.applicationsSent],
//                       ["Followers",         profileData.followers],
//                       ["Following",         profileData.following],
//                     ].map(([label, val]) => (
//                       <div key={label} className="flex justify-between text-xs">
//                         <span className="text-[#8C9AA5]">{label}</span>
//                         <span className="font-semibold text-[#70B5F9]">
//                           {safeNum(val)}
//                         </span>
//                       </div>
//                     ))}
//                   </div>

//                   {/* link to full profile */}
//                   <Link
//                     to="/student/profile"
//                     className="mt-3 block text-center text-xs font-semibold text-[#70B5F9]
//                       hover:underline border border-[#38434F] rounded-full py-1.5
//                       hover:bg-[#26343E] transition-colors"
//                   >
//                     View full profile
//                   </Link>
//                 </div>
//               </div>
//             )}

//             {/* Manage notifications */}
//             <div className="rounded-xl border border-[#38434F] bg-[#1D2226] p-3">
//               <p className="text-sm font-semibold text-white">Manage your notifications</p>
//               <button type="button" onClick={() => setPrefsOpen(true)}
//                 className="mt-2 text-xs font-semibold text-[#70B5F9] hover:underline">
//                 View settings
//               </button>
//             </div>
//           </aside>

//           {/* ══════════════════════════
//               CENTER FEED
//           ══════════════════════════ */}
//           <main className="min-w-0 flex-1">
//             <div className="overflow-hidden rounded-xl border border-[#38434F] bg-[#1D2226]">

//               {/* header */}
//               <div className="flex items-center justify-between border-b border-[#38434F] px-5 py-3">
//                 <div className="flex items-center gap-2">
//                   <h1 className="text-lg font-semibold text-white">Notifications</h1>
//                   {unreadCount > 0 && (
//                     <span className="rounded-full bg-[#CC1016] px-1.5 py-0.5 text-[11px]
//                       font-bold text-white leading-none">
//                       {unreadCount}
//                     </span>
//                   )}
//                 </div>
//                 <div className="flex items-center gap-1">
//                   {unreadCount > 0 && (
//                     <button type="button" onClick={markAllRead}
//                       className="hidden sm:block rounded-full px-3 py-1 text-xs font-semibold
//                         text-[#70B5F9] hover:bg-[#26343E] transition-colors">
//                       Mark all as read
//                     </button>
//                   )}
//                   <button type="button" onClick={fetchNotifications}
//                     className="rounded-full p-1.5 text-[#8C9AA5] hover:bg-[#313B46]
//                       transition-colors" title="Refresh">
//                     <FiRefreshCw size={15} />
//                   </button>
//                   <button type="button" onClick={() => setPrefsOpen(true)}
//                     className="rounded-full p-1.5 text-[#8C9AA5] hover:bg-[#313B46]
//                       transition-colors lg:hidden">
//                     <FiSettings size={15} />
//                   </button>
//                 </div>
//               </div>

//               {/* tabs */}
//               <div className="flex items-center gap-1 border-b border-[#38434F] px-3 py-1.5">
//                 {TABS.map((tab) => (
//                   <button key={tab} type="button" onClick={() => setActiveTab(tab)}
//                     className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
//                       activeTab === tab
//                         ? "bg-[#0A66C2] text-white"
//                         : "text-[#B0B7BE] hover:bg-[#313B46] hover:text-white"
//                     }`}>
//                     {tab}
//                   </button>
//                 ))}
//               </div>

//               {/* search + filters */}
//               <div className="flex flex-wrap items-center gap-2 border-b border-[#38434F] px-5 py-2">
//                 <input
//                   value={search}
//                   onChange={(e) => setSearch(e.target.value)}
//                   placeholder="Search notifications…"
//                   className="h-8 flex-1 min-w-[140px] rounded-full border border-[#38434F]
//                     bg-[#2A3540] px-4 text-sm text-white placeholder-[#8C9AA5]
//                     outline-none focus:border-[#0A66C2]"
//                 />
//                 <select value={filters.status}
//                   onChange={(e) => setFilters((p) => ({ ...p, status: e.target.value }))}
//                   className="h-8 rounded-full border border-[#38434F] bg-[#2A3540]
//                     px-3 text-xs text-[#B0B7BE] outline-none">
//                   <option>All</option><option>Unread</option><option>Read</option>
//                 </select>
//                 <select value={filters.range}
//                   onChange={(e) => setFilters((p) => ({ ...p, range: e.target.value }))}
//                   className="h-8 rounded-full border border-[#38434F] bg-[#2A3540]
//                     px-3 text-xs text-[#B0B7BE] outline-none">
//                   <option>Today</option><option>Last 7 days</option><option>Last 30 days</option>
//                 </select>
//               </div>

//               {/* error */}
//               {err && (
//                 <div className="mx-5 mt-3 rounded-lg border border-red-800
//                   bg-red-900/30 px-3 py-2 text-sm text-red-300">
//                   {err}
//                 </div>
//               )}

//               {/* feed */}
//               {loading ? (
//                 <div className="flex flex-col items-center justify-center py-20">
//                   <div className="mb-3 h-10 w-10 rounded-full border-2 border-[#0A66C2]
//                     border-t-transparent animate-spin" />
//                   <p className="text-sm text-[#8C9AA5]">Loading notifications…</p>
//                 </div>
//               ) : filtered.length === 0 ? (
//                 <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
//                   <div className="mb-3 flex h-14 w-14 items-center justify-center
//                     rounded-full bg-[#2A3540] text-[#0A66C2]">
//                     <FiBell size={26} />
//                   </div>
//                   <p className="text-base font-semibold text-white">You're all caught up</p>
//                   <p className="mt-1 text-sm text-[#8C9AA5]">No notifications match your filters.</p>
//                   <Link to="/student/jobs"
//                     className="mt-5 rounded-full bg-[#0A66C2] px-6 py-2 text-sm
//                       font-semibold text-white hover:bg-[#004182] transition-colors">
//                     Browse Jobs
//                   </Link>
//                 </div>
//               ) : (
//                 <>
//                   {renderGroup("Today",     grouped.Today)}
//                   {renderGroup("Yesterday", grouped.Yesterday)}
//                   {renderGroup("Earlier",   grouped.Earlier)}
//                 </>
//               )}
//             </div>
//           </main>

//           {/* ══════════════════════════
//               RIGHT SIDEBAR
//           ══════════════════════════ */}
//           <aside className="hidden w-[300px] shrink-0 xl:block space-y-3">

//             {/* People you may know */}
//             <div className="rounded-xl border border-[#38434F] bg-[#1D2226] overflow-hidden">
//               <div className="px-4 pt-4 pb-2">
//                 <p className="text-sm font-semibold text-white">People you may know</p>
//               </div>

//               {suggestLoading ? (
//                 <SidebarSkeleton count={3} rounded="rounded-full" />
//               ) : visiblePeople.length === 0 ? (
//                 <p className="px-4 pb-4 text-xs text-[#8C9AA5]">No suggestions right now.</p>
//               ) : (
//                 <div className="divide-y divide-[#38434F]">
//                   {visiblePeople.slice(0, 3).map((person) => (
//                     <div key={person.id} className="flex items-start gap-3 px-4 py-3">
//                       <PersonAvatar person={person} />
//                       <div className="min-w-0 flex-1">
//                         <p className="text-sm font-semibold text-white truncate">{person.name}</p>
//                         <p className="text-xs text-[#8C9AA5] leading-snug line-clamp-2">
//                           {person.role || person.headline || "Student"}
//                         </p>
//                         {Number(person.mutualCount) > 0 && (
//                           <p className="text-xs text-[#8C9AA5] mt-0.5">
//                             {safeNum(person.mutualCount)} mutual connection{person.mutualCount !== 1 ? "s" : ""}
//                           </p>
//                         )}
//                         <button
//                           type="button"
//                           onClick={() => handleFollow(person.id)}
//                           disabled={!!followPending[person.id]}
//                           className={`mt-2 inline-flex items-center gap-1 rounded-full border
//                             px-4 py-0.5 text-xs font-semibold transition-colors
//                             disabled:opacity-60 disabled:cursor-not-allowed ${
//                             followed[person.id]
//                               ? "border-[#38434F] bg-[#313B46] text-[#B0B7BE]"
//                               : "border-[#70B5F9] text-[#70B5F9] hover:bg-[#70B5F9]/10"
//                           }`}
//                         >
//                           {followed[person.id]
//                             ? <><FiCheck size={11} /> Following</>
//                             : <><FiUserPlus size={11} /> Follow</>}
//                         </button>
//                       </div>
//                       <button type="button" onClick={() => dismissSuggestion(person.id)}
//                         className="mt-1 shrink-0 rounded-full p-1 text-[#8C9AA5]
//                           hover:bg-[#38434F] transition-colors">
//                         <FiX size={14} />
//                       </button>
//                     </div>
//                   ))}
//                 </div>
//               )}

//               {visiblePeople.length > 3 && (
//                 <button type="button" className="w-full px-4 py-3 text-xs font-semibold
//                   text-[#8C9AA5] hover:bg-[#26343E] transition-colors text-center
//                   border-t border-[#38434F]">
//                   Show all recommendations →
//                 </button>
//               )}
//             </div>

//             {/* Companies to follow */}
//             <div className="rounded-xl border border-[#38434F] bg-[#1D2226] overflow-hidden">
//               <div className="px-4 pt-4 pb-2">
//                 <p className="text-sm font-semibold text-white">Companies to follow</p>
//               </div>

//               {suggestLoading ? (
//                 <SidebarSkeleton count={3} rounded="rounded-sm" />
//               ) : visibleCompanies.length === 0 ? (
//                 <p className="px-4 pb-4 text-xs text-[#8C9AA5]">No companies to show yet.</p>
//               ) : (
//                 <div className="divide-y divide-[#38434F]">
//                   {visibleCompanies.slice(0, 3).map((company) => (
//                     <div key={company.id} className="flex items-start gap-3 px-4 py-3">
//                       <CompanyLogo company={company} />
//                       <div className="min-w-0 flex-1">
//                         <p className="text-sm font-semibold text-white truncate">{company.name}</p>
//                         <p className="text-xs text-[#8C9AA5] leading-snug">
//                           {[
//                             company.industry,
//                             Number(company.followerCount) > 0
//                               ? `${safeNum(company.followerCount)} follower${company.followerCount !== 1 ? "s" : ""}`
//                               : null,
//                           ].filter(Boolean).join(" · ")}
//                         </p>
//                         <button
//                           type="button"
//                           onClick={() => handleFollow(company.id)}
//                           disabled={!!followPending[company.id]}
//                           className={`mt-2 inline-flex items-center gap-1 rounded-full border
//                             px-4 py-0.5 text-xs font-semibold transition-colors
//                             disabled:opacity-60 disabled:cursor-not-allowed ${
//                             followed[company.id]
//                               ? "border-[#38434F] bg-[#313B46] text-[#B0B7BE]"
//                               : "border-[#70B5F9] text-[#70B5F9] hover:bg-[#70B5F9]/10"
//                           }`}
//                         >
//                           {followed[company.id]
//                             ? <><FiCheck size={11} /> Following</>
//                             : "+ Follow"}
//                         </button>
//                       </div>
//                       <button type="button" onClick={() => dismissSuggestion(company.id)}
//                         className="mt-1 shrink-0 rounded-full p-1 text-[#8C9AA5]
//                           hover:bg-[#38434F] transition-colors">
//                         <FiX size={14} />
//                       </button>
//                     </div>
//                   ))}
//                 </div>
//               )}

//               {visibleCompanies.length > 3 && (
//                 <button type="button" className="w-full px-4 py-3 text-xs font-semibold
//                   text-[#8C9AA5] hover:bg-[#26343E] transition-colors text-center
//                   border-t border-[#38434F]">
//                   Show all companies →
//                 </button>
//               )}
//             </div>

//             {/* Footer */}
//             <div className="px-1">
//               <div className="flex flex-wrap gap-x-2 gap-y-1">
//                 {["About","Accessibility","Help Center","Privacy & Terms","Ad Choices","Advertising","More"].map((l) => (
//                   <button key={l} type="button"
//                     className="text-xs text-[#8C9AA5] hover:underline">{l}</button>
//                 ))}
//               </div>
//               <p className="mt-2 text-xs text-[#8C9AA5]">
//                 JobPortal © {new Date().getFullYear()}
//               </p>
//             </div>
//           </aside>
//         </div>
//       </div>

//       {/* Mobile bottom bar */}
//       <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[#38434F]
//         bg-[#1D2226] px-4 py-2.5 lg:hidden">
//         <div className="flex gap-2">
//           <button type="button" onClick={markAllRead}
//             className="flex-1 rounded-full border border-[#38434F] py-2 text-sm
//               font-semibold text-[#70B5F9] hover:bg-[#313B46]">
//             Mark all read
//           </button>
//           <button type="button" onClick={() => setPrefsOpen(true)}
//             className="flex-1 rounded-full bg-[#0A66C2] py-2 text-sm font-semibold
//               text-white hover:bg-[#004182]">
//             Settings {unreadCount > 0 ? `(${unreadCount})` : ""}
//           </button>
//         </div>
//       </div>

//       {/* Prefs modal */}
//       {prefsOpen && (
//         <div className="fixed inset-0 z-50 flex items-end bg-black/70
//           lg:items-center lg:justify-center"
//           onClick={() => setPrefsOpen(false)}>
//           <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-t-2xl
//             lg:rounded-2xl border border-[#38434F] bg-[#1D2226]"
//             onClick={(e) => e.stopPropagation()}>
//             <div className="flex items-center justify-between border-b
//               border-[#38434F] px-4 py-3">
//               <span className="text-base font-semibold text-white">
//                 Notification Settings
//               </span>
//               <button type="button" onClick={() => setPrefsOpen(false)}
//                 className="rounded-full p-1 text-[#8C9AA5] hover:bg-[#38434F]">
//                 <FiX size={18} />
//               </button>
//             </div>
//             <PrefsPanel />
//           </div>
//         </div>
//       )}

//       {/* Save modal */}
//       <Modal open={saveModal} onClose={() => setSaveModal(false)} title="Preferences saved"
//         footer={
//           <button type="button" onClick={() => setSaveModal(false)}
//             className="rounded-full bg-[#0A66C2] px-5 py-2 text-sm font-semibold
//               text-white hover:bg-[#004182]">
//             Done
//           </button>
//         }>
//         <p className="text-sm text-[#B0B7BE]">
//           Your notification preferences have been saved.
//         </p>
//       </Modal>
//     </div>
//   );
// }

///////////////////////////////////////////////////////////////////////////////////////////////



// frontend/src/pages/student/Notifications.jsx
// ✅ Default LIGHT theme — all colors use CSS variables so dark/light toggle works
//    Left sidebar reads from the SAME studentMe API as Profile.jsx

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FiBell, FiBookmark, FiMoreVertical, FiRefreshCw,
  FiSettings, FiX, FiMapPin, FiUserPlus, FiCheck,
} from "react-icons/fi";
import Modal from "../../components/common/Modal";
import {
  studentListNotifications,
  studentMarkAllNotificationsRead,
  studentToggleNotificationRead,
  studentGetNotificationPrefs,
  studentSaveNotificationPrefs,
  studentToggleSaveJob,
  studentMe,
  studentGetPeopleSuggestions,
  studentGetCompanySuggestions,
  studentFollowTarget,
  studentUnfollowTarget,
} from "../../services/studentService";

/* ─── CSS variables injected once ───────────────────────────────────
   Light defaults; your theme toggle flips them to dark values.
   Place this block in your global CSS / index.css if you prefer.
──────────────────────────────────────────────────────────────────── */
const THEME_STYLE = `
  :root {
    --bg-page:        #F3F2EF;
    --bg-card:        #FFFFFF;
    --bg-hover:       #F5F5F5;
    --bg-input:       #EEF3F8;
    --bg-muted:       #EEF3F8;
    --bg-unread:      #EBF4FF;
    --border:         #E0DFDC;
    --text-primary:   #191919;
    --text-secondary: #434649;
    --text-muted:     #666666;
    --text-link:      #0A66C2;
    --accent:         #0A66C2;
    --accent-hover:   #004182;
    --accent-subtle:  rgba(10,102,194,0.08);
    --unread-dot:     #0A66C2;
    --badge-bg:       #CC1016;
    --skeleton:       #E5E5E5;
    --banner-from:    #0A66C2;
    --banner-to:      #0073B1;
    --toggle-off:     #9AA5AC;
    --shadow-card:    0 0 0 1px rgba(0,0,0,0.08), 0 2px 8px rgba(0,0,0,0.06);
  }

  [data-theme="dark"] {
    --bg-page:        #1D2226;
    --bg-card:        #1D2226;
    --bg-hover:       #26343E;
    --bg-input:       #2A3540;
    --bg-muted:       #2A3540;
    --bg-unread:      #1A2733;
    --border:         #38434F;
    --text-primary:   #FFFFFF;
    --text-secondary: #B0B7BE;
    --text-muted:     #8C9AA5;
    --text-link:      #70B5F9;
    --accent:         #0A66C2;
    --accent-hover:   #004182;
    --accent-subtle:  rgba(112,181,249,0.10);
    --unread-dot:     #0A66C2;
    --badge-bg:       #CC1016;
    --skeleton:       #2A3540;
    --banner-from:    #0A66C2;
    --banner-to:      #0073B1;
    --toggle-off:     #54666F;
    --shadow-card:    none;
  }
`;

/* Inject theme style once */
if (typeof document !== "undefined" && !document.getElementById("notif-theme")) {
  const s = document.createElement("style");
  s.id = "notif-theme";
  s.textContent = THEME_STYLE;
  document.head.appendChild(s);
}

/* ─── helpers ─────────────────────────────────────────────────────── */
const safeNum = (val) => {
  const n = Number(val);
  return Number.isFinite(n) ? n.toLocaleString() : "0";
};
const safeObj = (x) => (x && typeof x === "object" ? x : {});
const safeArr = (x) => (Array.isArray(x) ? x : []);

function mapProfileToSidebar(me = {}) {
  const p = safeObj(me.studentProfile);
  const personal = safeObj(p.personal);
  return {
    name:             personal.fullName  || me.name      || "",
    headline:         personal.about     || me.headline  || "",
    designation:      personal.designation               || "Student",
    location:
      [personal.city, personal.state].filter(Boolean).join(", ") ||
      me.location || "",
    avatar:           personal.avatarUrl || me.avatarUrl || null,
    profileViews:     me.profileViews    ?? 0,
    postImpressions:  me.postImpressions ?? 0,
    applicationsSent: me.applicationsSent ?? 0,
    followers:        safeArr(me.followers).length,
    following:        safeArr(me.following).length,
  };
}

/* ─── TOGGLE ──────────────────────────────────────────────────────── */
function Toggle({ checked, onChange }) {
  return (
    <button
      type="button"
      onClick={onChange}
      style={{
        position: "relative",
        height: 20,
        width: 40,
        borderRadius: 9999,
        border: "none",
        cursor: "pointer",
        backgroundColor: checked ? "var(--accent)" : "var(--toggle-off)",
        transition: "background-color 0.2s",
        flexShrink: 0,
      }}
    >
      <span
        style={{
          position: "absolute",
          top: 2,
          left: checked ? 22 : 2,
          height: 16,
          width: 16,
          borderRadius: "50%",
          backgroundColor: "#fff",
          boxShadow: "0 1px 3px rgba(0,0,0,0.25)",
          transition: "left 0.2s",
          display: "block",
        }}
      />
    </button>
  );
}

/* ─── NOTIFICATION AVATAR ─────────────────────────────────────────── */
function NotifAvatar({ item }) {
  const colorMap = {
    job: "#0A66C2", application: "#059669",
    shortlisted: "#059669", hold: "#D97706",
    rejected: "#DC2626", message: "#7C3AED", system: "#3D4F58",
  };
  const bg     = colorMap[item?.icon] || "#3D4F58";
  const letter = String(item?.senderName || item?.title || "N").charAt(0).toUpperCase();
  if (item?.avatar) {
    return (
      <img src={item.avatar} alt={item.senderName || "logo"}
        style={{ height: 48, width: 48, flexShrink: 0, borderRadius: 4, objectFit: "cover" }} />
    );
  }
  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "center",
      height: 48, width: 48, flexShrink: 0, borderRadius: 4,
      backgroundColor: bg, color: "#fff", fontSize: 18, fontWeight: 700,
    }}>
      {letter}
    </div>
  );
}

/* ─── PERSON AVATAR ──────────────────────────────────────────────── */
const AVATAR_COLORS = ["#0D9488","#DB2777","#EA580C","#7C3AED","#0284C7","#E11D48"];
function PersonAvatar({ person }) {
  const name     = person?.name || "";
  const color    = AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];
  const initials = name.split(" ").map((w) => w[0] || "").join("").slice(0, 2).toUpperCase() || "?";
  if (person?.avatar) {
    return (
      <img src={person.avatar} alt={name}
        style={{ height: 48, width: 48, flexShrink: 0, borderRadius: "50%", objectFit: "cover" }} />
    );
  }
  return (
    <div style={{
      height: 48, width: 48, flexShrink: 0, borderRadius: "50%",
      display: "flex", alignItems: "center", justifyContent: "center",
      backgroundColor: color, color: "#fff", fontWeight: 700, fontSize: 13,
    }}>
      {initials}
    </div>
  );
}

/* ─── COMPANY LOGO ───────────────────────────────────────────────── */
const COMPANY_COLORS = ["#DC2626","#15803D","#0A66C2","#D97706","#4338CA","#047857"];
function CompanyLogo({ company }) {
  const name    = company?.name || "";
  const color   = COMPANY_COLORS[name.charCodeAt(0) % COMPANY_COLORS.length];
  const initial = name.charAt(0).toUpperCase() || "?";
  if (company?.logo) {
    return (
      <img src={company.logo} alt={name}
        style={{ height: 48, width: 48, flexShrink: 0, borderRadius: 4, objectFit: "cover" }} />
    );
  }
  return (
    <div style={{
      height: 48, width: 48, flexShrink: 0, borderRadius: 4,
      display: "flex", alignItems: "center", justifyContent: "center",
      backgroundColor: color, color: "#fff", fontWeight: 700, fontSize: 18,
    }}>
      {initial}
    </div>
  );
}

/* ─── SIDEBAR SKELETON ───────────────────────────────────────────── */
function SidebarSkeleton({ count = 3, circle = false }) {
  return (
    <div style={{ borderTop: "1px solid var(--border)" }}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} style={{
          display: "flex", alignItems: "center", gap: 12,
          padding: "12px 16px", borderBottom: "1px solid var(--border)",
        }}>
          <div style={{
            height: 48, width: 48, flexShrink: 0,
            borderRadius: circle ? "50%" : 4,
            backgroundColor: "var(--skeleton)",
            animation: "pulse 1.5s ease-in-out infinite",
          }} />
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ height: 12, width: 112, borderRadius: 4, backgroundColor: "var(--skeleton)" }} />
            <div style={{ height: 10, width: 80, borderRadius: 4, backgroundColor: "var(--skeleton)" }} />
          </div>
        </div>
      ))}
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.45}}`}</style>
    </div>
  );
}

/* ─── PROFILE CARD SKELETON ─────────────────────────────────────── */
function ProfileCardSkeleton() {
  return (
    <div style={{
      overflow: "hidden", borderRadius: 12,
      border: "1px solid var(--border)", backgroundColor: "var(--bg-card)",
      boxShadow: "var(--shadow-card)",
    }}>
      <div style={{ height: 56, backgroundColor: "var(--skeleton)" }} />
      <div style={{ padding: "0 16px 12px" }}>
        <div style={{ marginTop: -28, marginBottom: 8 }}>
          <div style={{
            height: 56, width: 56, borderRadius: "50%",
            backgroundColor: "var(--skeleton)",
            border: "2px solid var(--bg-card)",
          }} />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 4 }}>
          {[112, 144, 96].map((w, i) => (
            <div key={i} style={{ height: i === 0 ? 14 : 10, width: w, borderRadius: 4, backgroundColor: "var(--skeleton)" }} />
          ))}
        </div>
        <div style={{ marginTop: 12, borderTop: "1px solid var(--border)", paddingTop: 12, display: "flex", flexDirection: "column", gap: 8 }}>
          {[1,2,3].map(i => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between" }}>
              <div style={{ height: 10, width: 96, borderRadius: 4, backgroundColor: "var(--skeleton)" }} />
              <div style={{ height: 10, width: 24, borderRadius: 4, backgroundColor: "var(--skeleton)" }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── CONSTANTS ──────────────────────────────────────────────────── */
const TABS            = ["All", "Jobs", "My posts", "Mentions"];
const DEFAULT_FILTERS = { status: "All", range: "Last 30 days" };
const DEFAULT_PREFS   = {
  appStatus: true, employerMessages: true, jobRecs: true,
  govUpdates: true, internshipAlerts: true, announcements: true,
  emailStatus: true, emailJobs: true, emailMessages: true,
  weeklyDigest: false, whatsapp: false, sms: false, frequency: "Instant",
};

/* ═══════════════════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════════════════ */
export default function Notifications() {
  const navigate       = useNavigate();
  const shownAlertsRef = useRef(new Set());

  const [items,     setItems]     = useState([]);
  const [apiUnread, setApiUnread] = useState(0);
  const [loading,   setLoading]   = useState(true);
  const [err,       setErr]       = useState("");

  const [activeTab, setActiveTab] = useState("All");
  const [search,    setSearch]    = useState("");
  const [filters,   setFilters]   = useState(DEFAULT_FILTERS);

  const [prefs,        setPrefs]        = useState(DEFAULT_PREFS);
  const [prefsLoading, setPrefsLoading] = useState(true);
  const [prefsOpen,    setPrefsOpen]    = useState(false);
  const [saveModal,    setSaveModal]    = useState(false);

  const [profileData,  setProfileData]  = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);

  const [people,         setPeople]        = useState([]);
  const [companies,      setCompanies]     = useState([]);
  const [suggestLoading, setSuggestLoading] = useState(true);

  const [followed,      setFollowed]      = useState({});
  const [followPending, setFollowPending] = useState({});
  const [dismissed,     setDismissed]     = useState({});

  /* ─── fetches ─── */
  const fetchNotifications = useCallback(async () => {
    try {
      setErr(""); setLoading(true);
      const res = await studentListNotifications({ status: filters.status, q: search });
      setItems(Array.isArray(res?.data?.items) ? res.data.items : []);
      setApiUnread(Number(res?.data?.unreadCount) || 0);
    } catch (e) {
      setErr(e?.response?.data?.message || e?.message || "Failed to load notifications");
    } finally { setLoading(false); }
  }, [filters.status, search]);

  const fetchPrefs = useCallback(async () => {
    try {
      setPrefsLoading(true);
      const res = await studentGetNotificationPrefs();
      if (res?.data && typeof res.data === "object") setPrefs((p) => ({ ...p, ...res.data }));
    } catch { } finally { setPrefsLoading(false); }
  }, []);

  const fetchProfile = useCallback(async () => {
    try {
      setStatsLoading(true);
      const res = await studentMe();
      const me  = res?.data?.data ?? res?.data ?? {};
      setProfileData(mapProfileToSidebar(me));
    } catch {
      setProfileData({ name:"",headline:"",designation:"Student",location:"",avatar:null,profileViews:0,postImpressions:0,applicationsSent:0,followers:0,following:0 });
    } finally { setStatsLoading(false); }
  }, []);

  const fetchSuggestions = useCallback(async () => {
    try {
      setSuggestLoading(true);
      const [pRes, cRes] = await Promise.all([
        studentGetPeopleSuggestions().catch(() => ({ data: [] })),
        studentGetCompanySuggestions().catch(() => ({ data: [] })),
      ]);
      const pList = Array.isArray(pRes?.data) ? pRes.data : [];
      const cList = Array.isArray(cRes?.data) ? cRes.data : [];
      const initMap = {};
      [...pList, ...cList].forEach((x) => { if (x?.id) initMap[x.id] = !!x.isFollowing; });
      setFollowed((f) => ({ ...initMap, ...f }));
      setPeople(pList); setCompanies(cList);
    } catch { } finally { setSuggestLoading(false); }
  }, []);

  useEffect(() => { fetchPrefs(); fetchProfile(); fetchSuggestions(); }, []); // eslint-disable-line
  useEffect(() => { const t = setTimeout(fetchNotifications, 250); return () => clearTimeout(t); }, [fetchNotifications]);
  useEffect(() => { const t = setInterval(fetchNotifications, 30_000); return () => clearInterval(t); }, [fetchNotifications]);

  useEffect(() => {
    if (!("Notification" in window) || window.Notification.permission !== "granted") return;
    items.forEach((item) => {
      if (!item?.id || item.status !== "Unread") return;
      if (shownAlertsRef.current.has(item.id)) return;
      if (!/interview reminder|starting now/i.test(String(item.title || ""))) return;
      shownAlertsRef.current.add(item.id);
      try { new window.Notification(item.title, { body: item.description || "" }); } catch {}
    });
  }, [items]);

  const unreadCount = useMemo(
    () => apiUnread || items.filter((x) => x?.status === "Unread").length,
    [apiUnread, items]
  );

  const tabTypeMap = { Jobs: "job", "My posts": "application", Mentions: "message" };
  const filtered = useMemo(() => {
    let list = [...items];
    if (activeTab !== "All") {
      const t = tabTypeMap[activeTab];
      if (t) list = list.filter((x) => x?.icon === t || x?.type?.toLowerCase() === t);
    }
    if (filters.status !== "All") list = list.filter((x) => x?.status === filters.status);
    if (filters.range !== "Last 30 days") {
      const now = Date.now(), days = filters.range === "Today" ? 1 : 7;
      list = list.filter((x) => (now - new Date(x?.createdAt || Date.now()).getTime()) / 86_400_000 <= days);
    }
    return list;
  }, [items, activeTab, filters]);

  const grouped = useMemo(() => ({
    Today:     filtered.filter((x) => x?.group === "Today"),
    Yesterday: filtered.filter((x) => x?.group === "Yesterday"),
    Earlier:   filtered.filter((x) => x?.group === "Earlier"),
  }), [filtered]);

  const visiblePeople    = useMemo(() => people.filter((p) => p?.id && !dismissed[p.id]), [people, dismissed]);
  const visibleCompanies = useMemo(() => companies.filter((c) => c?.id && !dismissed[c.id]), [companies, dismissed]);

  /* ─── actions ─── */
  const markAllRead = async () => {
    try {
      await studentMarkAllNotificationsRead();
      setItems((p) => p.map((x) => ({ ...x, status: "Read" })));
      setApiUnread(0);
    } catch (e) { setErr(e?.response?.data?.message || e?.message || "Failed"); }
  };

  const toggleRead = async (id) => {
    try {
      await studentToggleNotificationRead(id);
      setItems((prev) => {
        const wasUnread = prev.find((x) => x?.id === id)?.status === "Unread";
        setApiUnread((n) => Math.max(0, n + (wasUnread ? -1 : 1)));
        return prev.map((x) => x?.id === id ? { ...x, status: wasUnread ? "Read" : "Unread" } : x);
      });
    } catch (e) { setErr(e?.response?.data?.message || e?.message || "Failed"); }
  };

  const markAsRead = async (id) => {
    const target = items.find((x) => x?.id === id);
    if (!target || target.status !== "Unread") return;
    try {
      await studentToggleNotificationRead(id);
      setItems((p) => p.map((x) => x?.id === id ? { ...x, status: "Read" } : x));
      setApiUnread((n) => Math.max(0, n - 1));
    } catch (e) { setErr(e?.response?.data?.message || e?.message || "Failed"); }
  };

  const savePrefs = async () => {
    try { await studentSaveNotificationPrefs(prefs); setSaveModal(true); }
    catch (e) { setErr(e?.response?.data?.message || e?.message || "Failed to save"); }
  };

  const onAction = async (item, action) => {
    const meta = item?.meta || {};
    if (action === "Reply")            { navigate(meta.conversationId ? `/student/messages?thread=${meta.conversationId}` : "/student/messages"); return; }
    if (action === "View Job")         { navigate(meta.jobId ? `/student/jobs/${meta.jobId}` : "/student/jobs"); return; }
    if (action === "View Application") { navigate("/student/my-jobs"); return; }
    if (action === "Join Meeting")     { if (meta.url) window.open(meta.url, "_blank", "noopener,noreferrer"); return; }
    if (action === "Save Job")         { try { if (meta.jobId) await studentToggleSaveJob(meta.jobId); } catch {} return; }
    if (meta.url) window.open(meta.url, "_blank", "noopener,noreferrer");
  };

  const handleFollow = async (id) => {
    if (followPending[id]) return;
    const nowFollowing = !followed[id];
    setFollowed((f) => ({ ...f, [id]: nowFollowing }));
    setFollowPending((f) => ({ ...f, [id]: true }));
    try {
      if (nowFollowing) await studentFollowTarget(id);
      else              await studentUnfollowTarget(id);
    } catch { setFollowed((f) => ({ ...f, [id]: !nowFollowing })); }
    finally  { setFollowPending((f) => ({ ...f, [id]: false })); }
  };

  const dismissSuggestion = (id) => setDismissed((d) => ({ ...d, [id]: true }));

  /* ─── shared styles ─── */
  const cardStyle = {
    overflow: "hidden", borderRadius: 12,
    border: "1px solid var(--border)",
    backgroundColor: "var(--bg-card)",
    boxShadow: "var(--shadow-card)",
  };

  const actionBtn = (item, action) => (
    <button
      key={action}
      type="button"
      onClick={(e) => { e.stopPropagation(); onAction(item, action); }}
      style={{
        display: "inline-flex", alignItems: "center", gap: 4,
        borderRadius: 9999, border: "1.5px solid var(--accent)",
        padding: "2px 12px", fontSize: 12, fontWeight: 600,
        color: "var(--accent)", backgroundColor: "transparent",
        cursor: "pointer", transition: "background-color 0.15s",
      }}
      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "var(--accent-subtle)"}
      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
    >
      {action === "Save Job" && <FiBookmark size={11} />}
      {action}
    </button>
  );

  /* ─── render group ─── */
  const renderGroup = (label, data) => {
    if (!data.length) return null;
    return (
      <div key={label}>
        <p style={{
          padding: "6px 20px", fontSize: 11, fontWeight: 700,
          textTransform: "uppercase", letterSpacing: "0.08em",
          color: "var(--text-muted)", borderBottom: "1px solid var(--border)",
          backgroundColor: "var(--bg-muted)",
        }}>
          {label}
        </p>
        {data.map((item) => {
          const unread = item?.status === "Unread";
          const id     = item?.id;
          return (
            <div
              key={id}
              onClick={() => markAsRead(id)}
              className="notif-row"
              style={{
                display: "flex", alignItems: "flex-start",
                borderBottom: "1px solid var(--border)",
                cursor: "pointer",
                backgroundColor: unread ? "var(--bg-unread)" : "var(--bg-card)",
                transition: "background-color 0.15s",
              }}
              onMouseEnter={(e) => { if (!unread) e.currentTarget.style.backgroundColor = "var(--bg-hover)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = unread ? "var(--bg-unread)" : "var(--bg-card)"; }}
            >
              {/* unread dot */}
              <div style={{ width: 28, flexShrink: 0, display: "flex", justifyContent: "center", paddingTop: 20 }}>
                {unread
                  ? <span style={{ height: 10, width: 10, borderRadius: "50%", backgroundColor: "var(--unread-dot)", display: "block" }} />
                  : <span style={{ height: 10, width: 10, display: "block" }} />}
              </div>
              {/* avatar */}
              <div style={{ flexShrink: 0, paddingTop: 14 }}>
                <NotifAvatar item={item} />
              </div>
              {/* body */}
              <div style={{ flex: 1, minWidth: 0, padding: "14px 12px" }}>
                <p style={{
                  fontSize: 14, lineHeight: 1.4, margin: 0,
                  fontWeight: unread ? 600 : 400,
                  color: unread ? "var(--text-primary)" : "var(--text-secondary)",
                }}>
                  {item?.title}
                </p>
                {item?.description && (
                  <p style={{ marginTop: 2, fontSize: 13, color: "var(--text-muted)", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                    {item.description}
                  </p>
                )}
                <p style={{ marginTop: 4, fontSize: 12, fontWeight: 500, color: unread ? "var(--accent)" : "var(--text-muted)" }}>
                  {item?.time}
                </p>
                <div style={{ marginTop: 4, display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {(item?.actions || []).map((a) => actionBtn(item, a))}
                </div>
              </div>
              {/* more btn */}
              <div style={{ flexShrink: 0, paddingTop: 14, paddingRight: 12 }}>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); toggleRead(id); }}
                  title={unread ? "Mark as read" : "Mark as unread"}
                  className="more-btn"
                  style={{
                    borderRadius: "50%", padding: 6, border: "none",
                    backgroundColor: "transparent", cursor: "pointer",
                    color: "var(--text-muted)", opacity: 0, transition: "opacity 0.15s",
                  }}
                >
                  <FiMoreVertical size={16} />
                </button>
              </div>
            </div>
          );
        })}
        <style>{`.notif-row:hover .more-btn{opacity:1!important}`}</style>
      </div>
    );
  };

  /* ─── prefs panel ─── */
  const PrefsPanel = () => (
    prefsLoading ? (
      <p style={{ padding: 16, fontSize: 14, color: "var(--text-muted)" }}>Loading…</p>
    ) : (
      <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 16 }}>
        {/* In-App */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <p style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)", margin: 0 }}>In-App</p>
          {[
            ["Application updates", "appStatus"],
            ["Employer messages",   "employerMessages"],
            ["Job recommendations", "jobRecs"],
            ["Govt job updates",    "govUpdates"],
            ["Internship alerts",   "internshipAlerts"],
            ["Announcements",       "announcements"],
          ].map(([label, key]) => (
            <div key={key} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 14, color: "var(--text-secondary)" }}>
              <span>{label}</span>
              <Toggle checked={!!prefs[key]} onChange={() => setPrefs((p) => ({ ...p, [key]: !p[key] }))} />
            </div>
          ))}
        </div>

        {/* Email */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12, borderTop: "1px solid var(--border)", paddingTop: 12 }}>
          <p style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)", margin: 0 }}>Email</p>
          {[
            ["Application status", "emailStatus"],
            ["Job alerts",         "emailJobs"],
            ["Employer messages",  "emailMessages"],
            ["Weekly digest",      "weeklyDigest"],
          ].map(([label, key]) => (
            <div key={key} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 14, color: "var(--text-secondary)" }}>
              <span>{label}</span>
              <Toggle checked={!!prefs[key]} onChange={() => setPrefs((p) => ({ ...p, [key]: !p[key] }))} />
            </div>
          ))}
          <select
            value={prefs.frequency}
            onChange={(e) => setPrefs((p) => ({ ...p, frequency: e.target.value }))}
            style={{
              height: 36, width: "100%", borderRadius: 8,
              border: "1px solid var(--border)", backgroundColor: "var(--bg-card)",
              padding: "0 12px", fontSize: 14, color: "var(--text-secondary)", outline: "none",
            }}
          >
            <option>Instant</option>
            <option>Daily summary</option>
            <option>Weekly summary</option>
          </select>
        </div>

        {/* Other channels */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12, borderTop: "1px solid var(--border)", paddingTop: 12 }}>
          <p style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)", margin: 0 }}>Other Channels</p>
          {[["WhatsApp", "whatsapp"], ["SMS", "sms"]].map(([label, key]) => (
            <div key={key} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 14, color: "var(--text-secondary)" }}>
              <span>{label}</span>
              <Toggle checked={!!prefs[key]} onChange={() => setPrefs((p) => ({ ...p, [key]: !p[key] }))} />
            </div>
          ))}
          {(prefs.whatsapp || prefs.sms) && (
            <button type="button" style={{ fontSize: 12, fontWeight: 600, color: "var(--accent)", background: "none", border: "none", cursor: "pointer", textAlign: "left" }}>
              Verify phone number
            </button>
          )}
        </div>

        {/* save / reset */}
        <div style={{ display: "flex", gap: 8, borderTop: "1px solid var(--border)", paddingTop: 12 }}>
          <button type="button" onClick={savePrefs}
            style={{ flex: 1, borderRadius: 9999, backgroundColor: "var(--accent)", padding: "8px 0", fontSize: 14, fontWeight: 600, color: "#fff", border: "none", cursor: "pointer" }}>
            Save
          </button>
          <button type="button" onClick={() => setPrefs(DEFAULT_PREFS)}
            style={{ flex: 1, borderRadius: 9999, border: "1px solid var(--border)", padding: "8px 0", fontSize: 14, fontWeight: 600, color: "var(--text-secondary)", backgroundColor: "transparent", cursor: "pointer" }}>
            Reset
          </button>
        </div>
      </div>
    )
  );

  /* ══════════════════════════════════════════════════════════════════
     RENDER
  ══════════════════════════════════════════════════════════════════ */
  return (
    <div style={{ minHeight: "100vh", backgroundColor: "var(--bg-page)" }}>
      <div style={{ margin: "0 auto", maxWidth: 1280, padding: "20px 16px" }}>
        <div style={{ display: "flex", gap: 20 }}>

          {/* ══ LEFT SIDEBAR ══ */}
          <aside style={{ display: "none", width: 225, flexShrink: 0 }} className="lg-sidebar">
            <style>{`@media(min-width:1024px){.lg-sidebar{display:flex!important;flex-direction:column;gap:12px}}`}</style>

            {/* Profile card */}
            {statsLoading || profileData === null ? (
              <ProfileCardSkeleton />
            ) : (
              <div style={cardStyle}>
                {/* banner */}
                <div style={{ height: 56, background: `linear-gradient(to right, var(--banner-from), var(--banner-to))` }} />
                <div style={{ padding: "0 16px 12px" }}>
                  {/* avatar */}
                  <div style={{ marginTop: -28, marginBottom: 8 }}>
                    {profileData.avatar ? (
                      <img src={profileData.avatar} alt={profileData.name}
                        style={{ height: 56, width: 56, borderRadius: "50%", border: "2px solid var(--bg-card)", objectFit: "cover" }} />
                    ) : (
                      <div style={{
                        height: 56, width: 56, borderRadius: "50%",
                        border: "2px solid var(--bg-card)",
                        background: "linear-gradient(135deg, #64748B, #475569)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        color: "#fff", fontSize: 22, fontWeight: 700,
                      }}>
                        {String(profileData.name || "S").charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>

                  {/* name / designation / headline */}
                  <Link to="/student/profile" style={{ display: "block", textDecoration: "none" }}>
                    <p style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)", margin: 0, lineHeight: 1.3 }}>
                      {profileData.name || "Student"}
                    </p>
                    {profileData.designation && profileData.designation !== "Student" && (
                      <p style={{ fontSize: 12, color: "var(--accent)", fontWeight: 500, margin: "2px 0 0" }}>
                        {profileData.designation}
                      </p>
                    )}
                    {profileData.headline && (
                      <p style={{ fontSize: 12, color: "var(--text-muted)", margin: "2px 0 0", lineHeight: 1.4,
                        display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                        {profileData.headline}
                      </p>
                    )}
                  </Link>

                  {profileData.location && (
                    <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 6 }}>
                      <FiMapPin size={11} style={{ color: "var(--text-muted)", flexShrink: 0 }} />
                      <p style={{ fontSize: 12, color: "var(--text-muted)", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {profileData.location}
                      </p>
                    </div>
                  )}

                  {/* stats */}
                  <div style={{ marginTop: 12, borderTop: "1px solid var(--border)", paddingTop: 12, display: "flex", flexDirection: "column", gap: 6 }}>
                    {[
                      ["Profile viewers",   profileData.profileViews],
                      ["Post impressions",  profileData.postImpressions],
                      ["Applications sent", profileData.applicationsSent],
                      ["Followers",         profileData.followers],
                      ["Following",         profileData.following],
                    ].map(([label, val]) => (
                      <div key={label} style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                        <span style={{ color: "var(--text-muted)" }}>{label}</span>
                        <span style={{ fontWeight: 600, color: "var(--accent)" }}>{safeNum(val)}</span>
                      </div>
                    ))}
                  </div>

                  <Link to="/student/profile"
                    style={{
                      display: "block", marginTop: 12, textAlign: "center",
                      fontSize: 12, fontWeight: 600, color: "var(--accent)",
                      border: "1px solid var(--border)", borderRadius: 9999,
                      padding: "6px 0", textDecoration: "none",
                      transition: "background-color 0.15s",
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "var(--bg-hover)"}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                  >
                    View full profile
                  </Link>
                </div>
              </div>
            )}

            {/* Manage notifications */}
            <div style={{ ...cardStyle, padding: 12 }}>
              <p style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)", margin: 0 }}>Manage your notifications</p>
              <button type="button" onClick={() => setPrefsOpen(true)}
                style={{ marginTop: 8, fontSize: 12, fontWeight: 600, color: "var(--accent)", background: "none", border: "none", cursor: "pointer", padding: 0 }}>
                View settings
              </button>
            </div>
          </aside>

          {/* ══ CENTER FEED ══ */}
          <main style={{ flex: 1, minWidth: 0 }}>
            <div style={cardStyle}>

              {/* header */}
              <div style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                borderBottom: "1px solid var(--border)", padding: "12px 20px",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <h1 style={{ fontSize: 18, fontWeight: 600, color: "var(--text-primary)", margin: 0 }}>Notifications</h1>
                  {unreadCount > 0 && (
                    <span style={{
                      borderRadius: 9999, backgroundColor: "var(--badge-bg)",
                      padding: "1px 6px", fontSize: 11, fontWeight: 700, color: "#fff", lineHeight: 1,
                    }}>
                      {unreadCount}
                    </span>
                  )}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  {unreadCount > 0 && (
                    <button type="button" onClick={markAllRead}
                      style={{
                        display: "none", borderRadius: 9999, padding: "4px 12px",
                        fontSize: 12, fontWeight: 600, color: "var(--accent)",
                        background: "none", border: "none", cursor: "pointer",
                      }}
                      className="sm-show"
                    >
                      Mark all as read
                    </button>
                  )}
                  <button type="button" onClick={fetchNotifications}
                    style={{ borderRadius: "50%", padding: 6, border: "none", backgroundColor: "transparent", cursor: "pointer", color: "var(--text-muted)" }}
                    title="Refresh">
                    <FiRefreshCw size={15} />
                  </button>
                  <button type="button" onClick={() => setPrefsOpen(true)}
                    style={{ borderRadius: "50%", padding: 6, border: "none", backgroundColor: "transparent", cursor: "pointer", color: "var(--text-muted)" }}
                    className="lg-hide">
                    <FiSettings size={15} />
                  </button>
                </div>
              </div>
              <style>{`@media(min-width:640px){.sm-show{display:block!important}}@media(min-width:1024px){.lg-hide{display:none!important}}`}</style>

              {/* tabs */}
              <div style={{ display: "flex", alignItems: "center", gap: 4, borderBottom: "1px solid var(--border)", padding: "6px 12px" }}>
                {TABS.map((tab) => (
                  <button key={tab} type="button" onClick={() => setActiveTab(tab)}
                    style={{
                      borderRadius: 9999, padding: "6px 12px", fontSize: 14, fontWeight: 500,
                      border: "none", cursor: "pointer", transition: "background-color 0.15s",
                      backgroundColor: activeTab === tab ? "var(--accent)" : "transparent",
                      color: activeTab === tab ? "#fff" : "var(--text-secondary)",
                    }}>
                    {tab}
                  </button>
                ))}
              </div>

              {/* search + filters */}
              <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8, borderBottom: "1px solid var(--border)", padding: "8px 20px" }}>
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search notifications…"
                  style={{
                    height: 32, flex: 1, minWidth: 140, borderRadius: 9999,
                    border: "1px solid var(--border)", backgroundColor: "var(--bg-input)",
                    padding: "0 16px", fontSize: 14, color: "var(--text-primary)", outline: "none",
                  }}
                />
                {[
                  { val: filters.status, key: "status", opts: ["All","Unread","Read"] },
                  { val: filters.range,  key: "range",  opts: ["Today","Last 7 days","Last 30 days"] },
                ].map(({ val, key, opts }) => (
                  <select key={key} value={val}
                    onChange={(e) => setFilters((p) => ({ ...p, [key]: e.target.value }))}
                    style={{
                      height: 32, borderRadius: 9999, border: "1px solid var(--border)",
                      backgroundColor: "var(--bg-input)", padding: "0 12px",
                      fontSize: 12, color: "var(--text-secondary)", outline: "none",
                    }}>
                    {opts.map((o) => <option key={o}>{o}</option>)}
                  </select>
                ))}
              </div>

              {/* error */}
              {err && (
                <div style={{ margin: "12px 20px", borderRadius: 8, border: "1px solid #FCA5A5", backgroundColor: "#FEF2F2", padding: "8px 12px", fontSize: 14, color: "#B91C1C" }}>
                  {err}
                </div>
              )}

              {/* feed */}
              {loading ? (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "80px 0" }}>
                  <div style={{
                    marginBottom: 12, height: 40, width: 40, borderRadius: "50%",
                    border: "2px solid var(--accent)", borderTopColor: "transparent",
                    animation: "spin 0.8s linear infinite",
                  }} />
                  <p style={{ fontSize: 14, color: "var(--text-muted)" }}>Loading notifications…</p>
                  <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
                </div>
              ) : filtered.length === 0 ? (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "80px 24px", textAlign: "center" }}>
                  <div style={{
                    marginBottom: 12, height: 56, width: 56, borderRadius: "50%",
                    backgroundColor: "var(--bg-muted)", display: "flex", alignItems: "center", justifyContent: "center",
                    color: "var(--accent)",
                  }}>
                    <FiBell size={26} />
                  </div>
                  <p style={{ fontSize: 16, fontWeight: 600, color: "var(--text-primary)", margin: 0 }}>You're all caught up</p>
                  <p style={{ marginTop: 4, fontSize: 14, color: "var(--text-muted)" }}>No notifications match your filters.</p>
                  <Link to="/student/jobs"
                    style={{ marginTop: 20, borderRadius: 9999, backgroundColor: "var(--accent)", padding: "8px 24px", fontSize: 14, fontWeight: 600, color: "#fff", textDecoration: "none" }}>
                    Browse Jobs
                  </Link>
                </div>
              ) : (
                <>
                  {renderGroup("Today",     grouped.Today)}
                  {renderGroup("Yesterday", grouped.Yesterday)}
                  {renderGroup("Earlier",   grouped.Earlier)}
                </>
              )}
            </div>
          </main>

          {/* ══ RIGHT SIDEBAR ══ */}
          <aside style={{ display: "none", width: 300, flexShrink: 0 }} className="xl-sidebar">
            <style>{`@media(min-width:1280px){.xl-sidebar{display:flex!important;flex-direction:column;gap:12px}}`}</style>

            {/* People */}
            <div style={cardStyle}>
              <div style={{ padding: "16px 16px 8px" }}>
                <p style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)", margin: 0 }}>People you may know</p>
              </div>
              {suggestLoading ? (
                <SidebarSkeleton count={3} circle />
              ) : visiblePeople.length === 0 ? (
                <p style={{ padding: "0 16px 16px", fontSize: 12, color: "var(--text-muted)" }}>No suggestions right now.</p>
              ) : (
                <div>
                  {visiblePeople.slice(0, 3).map((person) => (
                    <div key={person.id} style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "12px 16px", borderTop: "1px solid var(--border)" }}>
                      <PersonAvatar person={person} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{person.name}</p>
                        <p style={{ fontSize: 12, color: "var(--text-muted)", margin: "2px 0 0", lineHeight: 1.4, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                          {person.role || person.headline || "Student"}
                        </p>
                        {Number(person.mutualCount) > 0 && (
                          <p style={{ fontSize: 12, color: "var(--text-muted)", margin: "2px 0 0" }}>
                            {safeNum(person.mutualCount)} mutual connection{person.mutualCount !== 1 ? "s" : ""}
                          </p>
                        )}
                        <button
                          type="button"
                          onClick={() => handleFollow(person.id)}
                          disabled={!!followPending[person.id]}
                          style={{
                            marginTop: 8, display: "inline-flex", alignItems: "center", gap: 4,
                            borderRadius: 9999, padding: "2px 16px", fontSize: 12, fontWeight: 600,
                            cursor: followPending[person.id] ? "not-allowed" : "pointer",
                            opacity: followPending[person.id] ? 0.6 : 1,
                            border: followed[person.id] ? "1px solid var(--border)" : "1.5px solid var(--accent)",
                            backgroundColor: followed[person.id] ? "var(--bg-muted)" : "transparent",
                            color: followed[person.id] ? "var(--text-secondary)" : "var(--accent)",
                            transition: "all 0.15s",
                          }}>
                          {followed[person.id] ? <><FiCheck size={11} /> Following</> : <><FiUserPlus size={11} /> Follow</>}
                        </button>
                      </div>
                      <button type="button" onClick={() => dismissSuggestion(person.id)}
                        style={{ flexShrink: 0, borderRadius: "50%", padding: 4, border: "none", backgroundColor: "transparent", cursor: "pointer", color: "var(--text-muted)" }}>
                        <FiX size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              {visiblePeople.length > 3 && (
                <button type="button" style={{
                  width: "100%", padding: "12px 16px", fontSize: 12, fontWeight: 600,
                  color: "var(--text-muted)", border: "none", borderTop: "1px solid var(--border)",
                  backgroundColor: "transparent", cursor: "pointer", textAlign: "center",
                }}>
                  Show all recommendations →
                </button>
              )}
            </div>

            {/* Companies */}
            <div style={cardStyle}>
              <div style={{ padding: "16px 16px 8px" }}>
                <p style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)", margin: 0 }}>Companies to follow</p>
              </div>
              {suggestLoading ? (
                <SidebarSkeleton count={3} circle={false} />
              ) : visibleCompanies.length === 0 ? (
                <p style={{ padding: "0 16px 16px", fontSize: 12, color: "var(--text-muted)" }}>No companies to show yet.</p>
              ) : (
                <div>
                  {visibleCompanies.slice(0, 3).map((company) => (
                    <div key={company.id} style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "12px 16px", borderTop: "1px solid var(--border)" }}>
                      <CompanyLogo company={company} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{company.name}</p>
                        <p style={{ fontSize: 12, color: "var(--text-muted)", margin: "2px 0 0" }}>
                          {[company.industry, Number(company.followerCount) > 0 ? `${safeNum(company.followerCount)} follower${company.followerCount !== 1 ? "s" : ""}` : null].filter(Boolean).join(" · ")}
                        </p>
                        <button
                          type="button"
                          onClick={() => handleFollow(company.id)}
                          disabled={!!followPending[company.id]}
                          style={{
                            marginTop: 8, display: "inline-flex", alignItems: "center", gap: 4,
                            borderRadius: 9999, padding: "2px 16px", fontSize: 12, fontWeight: 600,
                            cursor: followPending[company.id] ? "not-allowed" : "pointer",
                            opacity: followPending[company.id] ? 0.6 : 1,
                            border: followed[company.id] ? "1px solid var(--border)" : "1.5px solid var(--accent)",
                            backgroundColor: followed[company.id] ? "var(--bg-muted)" : "transparent",
                            color: followed[company.id] ? "var(--text-secondary)" : "var(--accent)",
                            transition: "all 0.15s",
                          }}>
                          {followed[company.id] ? <><FiCheck size={11} /> Following</> : "+ Follow"}
                        </button>
                      </div>
                      <button type="button" onClick={() => dismissSuggestion(company.id)}
                        style={{ flexShrink: 0, borderRadius: "50%", padding: 4, border: "none", backgroundColor: "transparent", cursor: "pointer", color: "var(--text-muted)" }}>
                        <FiX size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              {visibleCompanies.length > 3 && (
                <button type="button" style={{
                  width: "100%", padding: "12px 16px", fontSize: 12, fontWeight: 600,
                  color: "var(--text-muted)", border: "none", borderTop: "1px solid var(--border)",
                  backgroundColor: "transparent", cursor: "pointer", textAlign: "center",
                }}>
                  Show all companies →
                </button>
              )}
            </div>

            {/* Footer */}
            <div style={{ padding: "0 4px" }}>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 8px" }}>
                {["About","Accessibility","Help Center","Privacy & Terms","Ad Choices","Advertising","More"].map((l) => (
                  <button key={l} type="button"
                    style={{ fontSize: 12, color: "var(--text-muted)", background: "none", border: "none", cursor: "pointer", padding: 0 }}>
                    {l}
                  </button>
                ))}
              </div>
              <p style={{ marginTop: 8, fontSize: 12, color: "var(--text-muted)" }}>
                JobPortal © {new Date().getFullYear()}
              </p>
            </div>
          </aside>
        </div>
      </div>

      {/* Mobile bottom bar */}
      <div style={{
        position: "fixed", inset: "auto 0 0 0", zIndex: 40,
        borderTop: "1px solid var(--border)", backgroundColor: "var(--bg-card)",
        padding: "10px 16px",
      }} className="mobile-bar">
        <style>{`@media(min-width:1024px){.mobile-bar{display:none!important}}`}</style>
        <div style={{ display: "flex", gap: 8 }}>
          <button type="button" onClick={markAllRead}
            style={{ flex: 1, borderRadius: 9999, border: "1px solid var(--border)", padding: "8px 0", fontSize: 14, fontWeight: 600, color: "var(--accent)", backgroundColor: "transparent", cursor: "pointer" }}>
            Mark all read
          </button>
          <button type="button" onClick={() => setPrefsOpen(true)}
            style={{ flex: 1, borderRadius: 9999, backgroundColor: "var(--accent)", padding: "8px 0", fontSize: 14, fontWeight: 600, color: "#fff", border: "none", cursor: "pointer" }}>
            Settings {unreadCount > 0 ? `(${unreadCount})` : ""}
          </button>
        </div>
      </div>

      {/* Prefs modal */}
      {prefsOpen && (
        <div
          onClick={() => setPrefsOpen(false)}
          style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "flex-end", justifyContent: "center", backgroundColor: "rgba(0,0,0,0.45)" }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "100%", maxWidth: 512, maxHeight: "90vh", overflowY: "auto",
              borderRadius: "16px 16px 0 0", border: "1px solid var(--border)",
              backgroundColor: "var(--bg-card)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid var(--border)", padding: "12px 16px" }}>
              <span style={{ fontSize: 16, fontWeight: 600, color: "var(--text-primary)" }}>Notification Settings</span>
              <button type="button" onClick={() => setPrefsOpen(false)}
                style={{ borderRadius: "50%", padding: 4, border: "none", backgroundColor: "transparent", cursor: "pointer", color: "var(--text-muted)" }}>
                <FiX size={18} />
              </button>
            </div>
            <PrefsPanel />
          </div>
        </div>
      )}

      {/* Save modal */}
      <Modal open={saveModal} onClose={() => setSaveModal(false)} title="Preferences saved"
        footer={
          <button type="button" onClick={() => setSaveModal(false)}
            style={{ borderRadius: 9999, backgroundColor: "var(--accent)", padding: "8px 20px", fontSize: 14, fontWeight: 600, color: "#fff", border: "none", cursor: "pointer" }}>
            Done
          </button>
        }>
        <p style={{ fontSize: 14, color: "var(--text-secondary)" }}>
          Your notification preferences have been saved.
        </p>
      </Modal>
    </div>
  );
}
