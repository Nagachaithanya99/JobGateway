// // frontend/src/pages/student/ResumeBuilder.jsx
// import { createElement, useEffect, useMemo, useState } from "react";
// import {
//   FiAward,
//   FiBookOpen,
//   FiCheckCircle,
//   FiChevronDown,
//   FiFileText,
//   FiLayers,
//   FiPlus,
//   FiSave,
//   FiSettings,
//   FiTool,
//   FiUser,
//   FiDownload,
// } from "react-icons/fi";
// import Modal from "../../components/common/Modal";
// import useAuth from "../../hooks/useAuth.js";
// import {
//   studentGetResume,
//   studentMe,
//   studentSaveResume,
//   studentDownloadResumePDF,
// } from "../../services/studentService.js";

// const templates = [
//   "Classic ATS",
//   "Modern Minimal",
//   "Two-Column Professional",
//   "Fresher Clean",
//   "Tech Focused",
// ];

// const emptyState = {
//   personal: {
//     name: "",
//     email: "",
//     phone: "",
//     location: "",
//     linkedin: "",
//     portfolio: "",
//     github: "",
//   },
//   summary: "",
//   education: [],
//   skills: [],
//   experience: [],
//   projects: [],
//   certs: [],
//   settings: { template: "Classic ATS", fontSize: "Medium", atsMode: true, onePage: true },
// };

// const sectionMeta = [
//   ["personal", "Personal Info", FiUser],
//   ["summary", "Professional Summary", FiFileText],
//   ["education", "Education", FiBookOpen],
//   ["skills", "Skills", FiTool],
//   ["experience", "Experience", FiLayers],
//   ["projects", "Projects", FiLayers],
//   ["certs", "Certifications / Awards", FiAward],
//   ["settings", "Resume Settings", FiSettings],
// ];

// function Section({ title, icon, open, done, onToggle, right }) {
//   return (
//     <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
//       <button type="button" onClick={onToggle} className="flex w-full items-center justify-between gap-2">
//         <div className="flex items-center gap-2">
//           <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-[#2563EB]">
//             {icon}
//           </span>
//           <span className="font-semibold text-[#0F172A]">{title}</span>
//           {done ? <FiCheckCircle className="text-green-600" /> : null}
//         </div>
//         <span className="inline-flex items-center gap-2 text-xs text-slate-500">
//           {right}
//           <FiChevronDown className={`transition ${open ? "rotate-180" : ""}`} />
//         </span>
//       </button>
//     </div>
//   );
// }

// function safeArray(v) {
//   return Array.isArray(v) ? v : [];
// }

// function normalizeResume(raw) {
//   const r = raw && typeof raw === "object" ? raw : {};
//   return {
//     personal: { ...emptyState.personal, ...(r.personal || {}) },
//     summary: typeof r.summary === "string" ? r.summary : "",
//     education: safeArray(r.education).map((x) => ({
//       degree: x?.degree ?? "",
//       college: x?.college ?? "",
//       branch: x?.branch ?? "",
//       year: x?.year ?? "",
//       cgpa: x?.cgpa ?? "",
//     })),
//     skills: safeArray(r.skills).map((s) => String(s || "").trim()).filter(Boolean),
//     experience: safeArray(r.experience).map((x) => ({
//       company: x?.company ?? "",
//       role: x?.role ?? "",
//       duration: x?.duration ?? "",
//       bullets: safeArray(x?.bullets).map((b) => String(b ?? "")),
//     })),
//     projects: safeArray(r.projects).map((x) => ({
//       name: x?.name ?? "",
//       stack: x?.stack ?? "",
//       bullets: safeArray(x?.bullets).map((b) => String(b ?? "")),
//       link: x?.link ?? "",
//     })),
//     certs: safeArray(r.certs).map((c) => String(c || "").trim()).filter(Boolean),
//     settings: { ...emptyState.settings, ...(r.settings || {}) },
//   };
// }

// export default function ResumeBuilder() {
//   const { user } = useAuth();

//   const [data, setData] = useState(emptyState);
//   const [open, setOpen] = useState("personal");

//   const [templateModal, setTemplateModal] = useState(false);
//   const [savedToast, setSavedToast] = useState(false);
//   const [infoToast, setInfoToast] = useState("");

//   const [loading, setLoading] = useState(true);
//   const [saving, setSaving] = useState(false);
//   const [downloading, setDownloading] = useState(false);
//   const [err, setErr] = useState("");

//   // ============================
//   // LOAD resume from backend
//   // ============================
//   useEffect(() => {
//     let mounted = true;

//     const load = async () => {
//       try {
//         setLoading(true);
//         setErr("");

//         // 1) Load resume + profile from backend
//         const [resumeRes, meRes] = await Promise.all([studentGetResume(), studentMe()]);
//         const backendResume = normalizeResume(resumeRes.data);
//         const me = meRes?.data || {};
//         const sp = me?.studentProfile || {};
//         const spPersonal = sp?.personal || {};

//         // 2) Auto-fill basics from profile/auth if missing
//         const filled = {
//           ...backendResume,
//           personal: {
//             ...backendResume.personal,
//             name: backendResume.personal.name || me?.name || spPersonal?.fullName || user?.name || "",
//             email: backendResume.personal.email || me?.email || user?.email || "",
//             phone: backendResume.personal.phone || me?.phone || spPersonal?.phone || "",
//             location: backendResume.personal.location || me?.location || spPersonal?.city || "",
//             linkedin: backendResume.personal.linkedin || me?.linkedin || spPersonal?.linkedin || "",
//             portfolio: backendResume.personal.portfolio || me?.portfolio || spPersonal?.portfolio || "",
//             github: backendResume.personal.github || spPersonal?.github || "",
//           },
//           education:
//             backendResume.education.length > 0
//               ? backendResume.education
//               : (Array.isArray(sp?.education) ? sp.education : []),
//           skills:
//             backendResume.skills.length > 0
//               ? backendResume.skills
//               : (Array.isArray(sp?.skills) ? sp.skills : []),
//           experience:
//             backendResume.experience.length > 0
//               ? backendResume.experience
//               : (Array.isArray(sp?.experience) ? sp.experience : []),
//         };

//         if (mounted) setData(filled);
//       } catch (e) {
//         if (mounted) {
//           setErr(e?.response?.data?.message || e?.message || "Failed to load resume");
//           setData({
//             ...emptyState,
//             personal: {
//               ...emptyState.personal,
//               name: user?.name || "",
//               email: user?.email || "",
//             },
//           });
//         }
//       } finally {
//         if (mounted) setLoading(false);
//       }
//     };

//     load();
//     return () => {
//       mounted = false;
//     };
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, []);

//   const completed = useMemo(
//     () => ({
//       personal: Boolean(data.personal.name && data.personal.email && data.personal.phone),
//       summary: Boolean(String(data.summary || "").trim()),
//       education: Array.isArray(data.education) && data.education.length > 0,
//       skills: Array.isArray(data.skills) && data.skills.length > 0,
//       experience: Array.isArray(data.experience) && data.experience.length > 0,
//       projects: Array.isArray(data.projects) && data.projects.length > 0,
//       certs: Array.isArray(data.certs) && data.certs.length > 0,
//       settings: true,
//     }),
//     [data]
//   );

//   // helpers
//   const addEducation = () =>
//     setData((p) => ({
//       ...p,
//       education: [...safeArray(p.education), { degree: "", college: "", branch: "", year: "", cgpa: "" }],
//     }));

//   const addExperience = () =>
//     setData((p) => ({
//       ...p,
//       experience: [...safeArray(p.experience), { company: "", role: "", duration: "", bullets: [""] }],
//     }));

//   const addExperienceBullet = (idx) =>
//     setData((p) => ({
//       ...p,
//       experience: safeArray(p.experience).map((x, i) =>
//         i === idx ? { ...x, bullets: [...safeArray(x.bullets), ""] } : x
//       ),
//     }));

//   const addProject = () =>
//     setData((p) => ({
//       ...p,
//       projects: [...safeArray(p.projects), { name: "", stack: "", bullets: [""], link: "" }],
//     }));

//   // ============================
//   // SAVE resume to backend
//   // ============================
//   const onSaveDraft = async () => {
//     try {
//       setSaving(true);
//       setErr("");
//       await studentSaveResume(data);
//       setSavedToast(true);
//       setTimeout(() => setSavedToast(false), 1400);
//     } catch (e) {
//       setErr(e?.response?.data?.message || e?.message || "Failed to save resume");
//     } finally {
//       setSaving(false);
//     }
//   };

//   // ============================
//   // DOWNLOAD PDF from backend
//   // ============================
//   const onDownloadPDF = async () => {
//     try {
//       setDownloading(true);
//       setErr("");

//       // Ensure latest saved first (so pdf matches)
//       await studentSaveResume(data);

//       const res = await studentDownloadResumePDF();
//       const blob = new Blob([res.data], { type: "application/pdf" });
//       const url = URL.createObjectURL(blob);

//       const a = document.createElement("a");
//       a.href = url;
//       a.download = "resume.pdf";
//       document.body.appendChild(a);
//       a.click();
//       a.remove();
//       URL.revokeObjectURL(url);
//     } catch (e) {
//       setErr(e?.response?.data?.message || e?.message || "Failed to download PDF");
//     } finally {
//       setDownloading(false);
//     }
//   };

//   if (loading) {
//     return (
//       <div className="bg-[#F8FAFC]">
//         <div className="mx-auto max-w-[1200px] px-4 py-10 sm:px-6 lg:px-8">
//           <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
//             <p className="text-sm font-semibold text-slate-700">Loading resume...</p>
//             <p className="mt-1 text-xs text-slate-500">Fetching your resume from backend</p>
//           </div>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="bg-[#F8FAFC] pb-8">
//       <div className="mx-auto max-w-[1200px] space-y-5 px-4 py-6 sm:px-6 lg:px-8">
//         <section>
//           <h1 className="text-3xl font-bold text-[#0F172A]">Resume Builder</h1>
//           <p className="mt-1 text-sm text-slate-500">Build an ATS-friendly resume in minutes</p>

//           {err ? (
//             <div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
//               {err}
//             </div>
//           ) : null}

//           <div className="mt-3 flex flex-wrap items-center gap-2 text-xs font-semibold">
//             {["Step 1 Profile", "Step 2 Content", "Step 3 Template", "Step 4 Download"].map((s, i) => (
//               <span
//                 key={s}
//                 className={`rounded-full border px-2.5 py-1 ${
//                   i === 2 ? "border-blue-200 bg-blue-50 text-[#2563EB]" : "border-slate-200 bg-white text-slate-600"
//                 }`}
//               >
//                 {s}
//               </span>
//             ))}
//           </div>
//         </section>

//         <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_420px]">
//           <main className="space-y-3">
//             {sectionMeta.map(([key, title, iconComp]) => (
//               <div key={key} className="space-y-2">
//                 <Section
//                   title={title}
//                   icon={createElement(iconComp)}
//                   open={open === key}
//                   done={completed[key]}
//                   onToggle={() => setOpen((p) => (p === key ? "" : key))}
//                   right="Edit"
//                 />

//                 {open === key ? (
//                   <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
//                     {key === "personal" ? (
//                       <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
//                         {Object.keys(data.personal).map((f) => (
//                           <input
//                             key={f}
//                             value={data.personal[f]}
//                             onChange={(e) =>
//                               setData((p) => ({ ...p, personal: { ...p.personal, [f]: e.target.value } }))
//                             }
//                             placeholder={f[0].toUpperCase() + f.slice(1)}
//                             className="h-10 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-blue-300"
//                           />
//                         ))}
//                       </div>
//                     ) : null}

//                     {key === "summary" ? (
//                       <div className="space-y-2">
//                         <textarea
//                           value={data.summary}
//                           onChange={(e) => setData((p) => ({ ...p, summary: e.target.value }))}
//                           rows={4}
//                           className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-300"
//                         />
//                         <button
//                           type="button"
//                           onClick={() => {
//                             const next = String(data.summary || "")
//                               .replace(/\s+/g, " ")
//                               .trim()
//                               .replace(/^\w/, (c) => c.toUpperCase());
//                             setData((p) => ({ ...p, summary: next }));
//                             setInfoToast("Summary refined");
//                             setTimeout(() => setInfoToast(""), 1400);
//                           }}
//                           className="rounded-lg border border-blue-200 px-3 py-1.5 text-xs font-semibold text-[#2563EB] hover:bg-blue-50"
//                         >
//                           AI Improve
//                         </button>
//                       </div>
//                     ) : null}

//                     {key === "education" ? (
//                       <div className="space-y-2">
//                         {safeArray(data.education).map((ed, idx) => (
//                           <div key={`ed_${idx}`} className="grid grid-cols-1 gap-2 sm:grid-cols-2">
//                             {Object.keys(ed).map((f) => (
//                               <input
//                                 key={f}
//                                 value={ed[f]}
//                                 onChange={(e) =>
//                                   setData((p) => ({
//                                     ...p,
//                                     education: safeArray(p.education).map((x, i) =>
//                                       i === idx ? { ...x, [f]: e.target.value } : x
//                                     ),
//                                   }))
//                                 }
//                                 placeholder={f.toUpperCase()}
//                                 className="h-10 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-blue-300"
//                               />
//                             ))}
//                           </div>
//                         ))}
//                         <button
//                           type="button"
//                           onClick={addEducation}
//                           className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
//                         >
//                           <FiPlus /> Add Education
//                         </button>
//                       </div>
//                     ) : null}

//                     {key === "skills" ? (
//                       <div className="space-y-2">
//                         <input
//                           value={safeArray(data.skills).join(", ")}
//                           onChange={(e) =>
//                             setData((p) => ({
//                               ...p,
//                               skills: e.target.value
//                                 .split(",")
//                                 .map((x) => x.trim())
//                                 .filter(Boolean),
//                             }))
//                           }
//                           className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-blue-300"
//                           placeholder="React, SQL, Communication..."
//                         />
//                         <label className="inline-flex items-center gap-2 text-xs text-slate-600">
//                           <input type="checkbox" className="rounded" /> Highlight Top 5 Skills
//                         </label>
//                       </div>
//                     ) : null}

//                     {key === "experience" ? (
//                       <div className="space-y-3">
//                         {safeArray(data.experience).map((ex, idx) => (
//                           <div key={`ex_${idx}`} className="rounded-xl border border-slate-200 bg-slate-50/60 p-3">
//                             <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
//                               <input
//                                 value={ex.company}
//                                 onChange={(e) =>
//                                   setData((p) => ({
//                                     ...p,
//                                     experience: safeArray(p.experience).map((x, i) =>
//                                       i === idx ? { ...x, company: e.target.value } : x
//                                     ),
//                                   }))
//                                 }
//                                 placeholder="Company"
//                                 className="h-10 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-blue-300"
//                               />
//                               <input
//                                 value={ex.role}
//                                 onChange={(e) =>
//                                   setData((p) => ({
//                                     ...p,
//                                     experience: safeArray(p.experience).map((x, i) =>
//                                       i === idx ? { ...x, role: e.target.value } : x
//                                     ),
//                                   }))
//                                 }
//                                 placeholder="Role"
//                                 className="h-10 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-blue-300"
//                               />
//                               <input
//                                 value={ex.duration}
//                                 onChange={(e) =>
//                                   setData((p) => ({
//                                     ...p,
//                                     experience: safeArray(p.experience).map((x, i) =>
//                                       i === idx ? { ...x, duration: e.target.value } : x
//                                     ),
//                                   }))
//                                 }
//                                 placeholder="Duration (Jan 2025 - Jul 2025)"
//                                 className="h-10 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-blue-300 sm:col-span-2"
//                               />
//                             </div>

//                             <div className="mt-3 space-y-2">
//                               <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Achievements</p>
//                               {safeArray(ex.bullets).map((b, bi) => (
//                                 <input
//                                   key={`b_${bi}`}
//                                   value={b}
//                                   onChange={(e) =>
//                                     setData((p) => ({
//                                       ...p,
//                                       experience: safeArray(p.experience).map((x, i) =>
//                                         i === idx
//                                           ? {
//                                               ...x,
//                                               bullets: safeArray(x.bullets).map((bb, j) =>
//                                                 j === bi ? e.target.value : bb
//                                               ),
//                                             }
//                                           : x
//                                       ),
//                                     }))
//                                   }
//                                   placeholder={`Bullet ${bi + 1}`}
//                                   className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-blue-300"
//                                 />
//                               ))}
//                               <button
//                                 type="button"
//                                 onClick={() => addExperienceBullet(idx)}
//                                 className="rounded-lg border border-orange-200 px-3 py-1.5 text-xs font-semibold text-[#F97316] hover:bg-orange-50"
//                               >
//                                 Add Achievement Bullet
//                               </button>
//                             </div>
//                           </div>
//                         ))}

//                         <button
//                           type="button"
//                           onClick={addExperience}
//                           className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
//                         >
//                           <FiPlus /> Add Experience
//                         </button>
//                       </div>
//                     ) : null}

//                     {key === "projects" ? (
//                       <div className="space-y-3">
//                         {safeArray(data.projects).map((pr, idx) => (
//                           <div key={`pr_${idx}`} className="rounded-xl border border-slate-200 bg-slate-50/60 p-3">
//                             <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
//                               <input
//                                 value={pr.name}
//                                 onChange={(e) =>
//                                   setData((p) => ({
//                                     ...p,
//                                     projects: safeArray(p.projects).map((x, i) =>
//                                       i === idx ? { ...x, name: e.target.value } : x
//                                     ),
//                                   }))
//                                 }
//                                 placeholder="Project Name"
//                                 className="h-10 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-blue-300"
//                               />
//                               <input
//                                 value={pr.stack}
//                                 onChange={(e) =>
//                                   setData((p) => ({
//                                     ...p,
//                                     projects: safeArray(p.projects).map((x, i) =>
//                                       i === idx ? { ...x, stack: e.target.value } : x
//                                     ),
//                                   }))
//                                 }
//                                 placeholder="Tech Stack (React, Node...)"
//                                 className="h-10 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-blue-300"
//                               />
//                               <input
//                                 value={pr.link}
//                                 onChange={(e) =>
//                                   setData((p) => ({
//                                     ...p,
//                                     projects: safeArray(p.projects).map((x, i) =>
//                                       i === idx ? { ...x, link: e.target.value } : x
//                                     ),
//                                   }))
//                                 }
//                                 placeholder="Project Link"
//                                 className="h-10 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-blue-300 sm:col-span-2"
//                               />
//                             </div>

//                             <div className="mt-3 space-y-2">
//                               <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Highlights</p>
//                               {safeArray(pr.bullets).map((b, bi) => (
//                                 <input
//                                   key={`prb_${bi}`}
//                                   value={b}
//                                   onChange={(e) =>
//                                     setData((p) => ({
//                                       ...p,
//                                       projects: safeArray(p.projects).map((x, i) =>
//                                         i === idx
//                                           ? {
//                                               ...x,
//                                               bullets: safeArray(x.bullets).map((bb, j) =>
//                                                 j === bi ? e.target.value : bb
//                                               ),
//                                             }
//                                           : x
//                                       ),
//                                     }))
//                                   }
//                                   placeholder={`Bullet ${bi + 1}`}
//                                   className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-blue-300"
//                                 />
//                               ))}
//                               <button
//                                 type="button"
//                                 onClick={() =>
//                                   setData((p) => ({
//                                     ...p,
//                                     projects: safeArray(p.projects).map((x, i) =>
//                                       i === idx ? { ...x, bullets: [...safeArray(x.bullets), ""] } : x
//                                     ),
//                                   }))
//                                 }
//                                 className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
//                               >
//                                 <FiPlus /> Add Bullet
//                               </button>
//                             </div>
//                           </div>
//                         ))}

//                         <button
//                           type="button"
//                           onClick={addProject}
//                           className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
//                         >
//                           <FiPlus /> Add Project
//                         </button>
//                       </div>
//                     ) : null}

//                     {key === "certs" ? (
//                       <input
//                         value={safeArray(data.certs).join(", ")}
//                         onChange={(e) =>
//                           setData((p) => ({
//                             ...p,
//                             certs: e.target.value
//                               .split(",")
//                               .map((x) => x.trim())
//                               .filter(Boolean),
//                           }))
//                         }
//                         className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-blue-300"
//                         placeholder="Certifications / Awards"
//                       />
//                     ) : null}

//                     {key === "settings" ? (
//                       <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
//                         <select
//                           value={data.settings.template}
//                           onChange={(e) => setData((p) => ({ ...p, settings: { ...p.settings, template: e.target.value } }))}
//                           className="h-10 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-blue-300"
//                         >
//                           {templates.map((t) => (
//                             <option key={t}>{t}</option>
//                           ))}
//                         </select>
//                         <select
//                           value={data.settings.fontSize}
//                           onChange={(e) => setData((p) => ({ ...p, settings: { ...p.settings, fontSize: e.target.value } }))}
//                           className="h-10 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-blue-300"
//                         >
//                           <option>Small</option>
//                           <option>Medium</option>
//                           <option>Large</option>
//                         </select>

//                         <label className="inline-flex items-center gap-2 text-sm text-slate-700">
//                           <input
//                             type="checkbox"
//                             checked={!!data.settings.atsMode}
//                             onChange={(e) => setData((p) => ({ ...p, settings: { ...p.settings, atsMode: e.target.checked } }))}
//                           />{" "}
//                           ATS Mode
//                         </label>

//                         <label className="inline-flex items-center gap-2 text-sm text-slate-700">
//                           <input
//                             type="checkbox"
//                             checked={!!data.settings.onePage}
//                             onChange={(e) => setData((p) => ({ ...p, settings: { ...p.settings, onePage: e.target.checked } }))}
//                           />{" "}
//                           One-page
//                         </label>

//                         <button
//                           type="button"
//                           onClick={() => setTemplateModal(true)}
//                           className="rounded-lg border border-blue-200 px-3 py-2 text-sm font-semibold text-[#2563EB] hover:bg-blue-50 sm:col-span-2"
//                         >
//                           Choose Template
//                         </button>
//                       </div>
//                     ) : null}
//                   </div>
//                 ) : null}
//               </div>
//             ))}
//           </main>

//           <aside className="space-y-3 lg:sticky lg:top-20 lg:h-fit">
//             <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
//               <div className="mb-3 flex flex-wrap gap-2">
//                 <button
//                   type="button"
//                   onClick={onDownloadPDF}
//                   disabled={downloading}
//                   className="inline-flex items-center gap-2 rounded-lg bg-[#2563EB] px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
//                 >
//                   <FiDownload />
//                   {downloading ? "Downloading..." : "Download PDF"}
//                 </button>

//                 <button
//                   type="button"
//                   onClick={() => {
//                     const lines = [
//                       data.personal.name || "",
//                       [data.personal.email, data.personal.phone, data.personal.location].filter(Boolean).join(" | "),
//                       "",
//                       "SUMMARY",
//                       data.summary || "",
//                       "",
//                       "SKILLS",
//                       safeArray(data.skills).join(", "),
//                     ];
//                     const blob = new Blob([lines.join("\n")], { type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" });
//                     const url = URL.createObjectURL(blob);
//                     const a = document.createElement("a");
//                     a.href = url;
//                     a.download = "resume.docx";
//                     document.body.appendChild(a);
//                     a.click();
//                     a.remove();
//                     URL.revokeObjectURL(url);
//                   }}
//                   className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
//                 >
//                   Export DOCX
//                 </button>

//                 <button
//                   type="button"
//                   onClick={onSaveDraft}
//                   disabled={saving}
//                   className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
//                 >
//                   <FiSave /> {saving ? "Saving..." : "Save Draft"}
//                 </button>
//               </div>

//               <div className="rounded-xl border border-slate-200 bg-white p-5">
//                 <h2 className="text-xl font-bold text-[#0F172A]">{data.personal.name || "Your Name"}</h2>
//                 <p className="text-xs text-slate-500">
//                   {data.personal.email || "email"} | {data.personal.phone || "phone"} | {data.personal.location || "location"}
//                 </p>

//                 <div className="mt-3 border-t border-slate-100 pt-3">
//                   <h3 className="text-xs font-bold uppercase tracking-wide text-slate-500">Summary</h3>
//                   <p className="mt-1 text-sm text-slate-700">{data.summary || "Write a short summary..."}</p>
//                 </div>

//                 <div className="mt-3 border-t border-slate-100 pt-3">
//                   <h3 className="text-xs font-bold uppercase tracking-wide text-slate-500">Skills</h3>
//                   <p className="mt-1 text-sm text-slate-700">{safeArray(data.skills).join(", ") || "Add skills..."}</p>
//                 </div>

//                 {safeArray(data.experience).length ? (
//                   <div className="mt-3 border-t border-slate-100 pt-3">
//                     <h3 className="text-xs font-bold uppercase tracking-wide text-slate-500">Experience</h3>
//                     {safeArray(data.experience).slice(0, 1).map((ex, i) => (
//                       <div key={`prev_ex_${i}`}>
//                         <p className="mt-1 text-sm font-semibold text-slate-800">
//                           {ex.role || "Role"} - {ex.company || "Company"}
//                         </p>
//                         <ul className="mt-1 list-disc pl-4 text-sm text-slate-700">
//                           {safeArray(ex.bullets).filter(Boolean).slice(0, 4).map((b) => (
//                             <li key={b}>{b}</li>
//                           ))}
//                         </ul>
//                       </div>
//                     ))}
//                   </div>
//                 ) : null}
//               </div>
//             </div>

//             <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4">
//               <h3 className="font-semibold text-[#0F172A]">ATS Tips</h3>
//               <ul className="mt-2 space-y-1 text-xs text-slate-700">
//                 <li>Use role keywords naturally</li>
//                 <li>Keep headings consistent</li>
//                 <li>Use achievement-focused bullets</li>
//                 <li>Export in PDF for stable layout</li>
//               </ul>
//               <button
//                 type="button"
//                 onClick={() => {
//                   const issues = [];
//                   if (!data.personal.name || !data.personal.email) issues.push("Add full personal details.");
//                   if (!String(data.summary || "").trim()) issues.push("Add a professional summary.");
//                   if (!safeArray(data.skills).length) issues.push("Add key skills.");
//                   if (!safeArray(data.education).length) issues.push("Add education details.");
//                   if (!safeArray(data.experience).length && !safeArray(data.projects).length) {
//                     issues.push("Add experience or projects to show impact.");
//                   }
//                   setInfoToast(issues.length ? `ATS issues: ${issues.length}` : "ATS check passed");
//                   setTimeout(() => setInfoToast(""), 1800);
//                 }}
//                 className="mt-3 rounded-lg bg-[#2563EB] px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700"
//               >
//                 Scan for Issues
//               </button>
//             </div>
//           </aside>
//         </div>
//       </div>

//       <Modal
//         open={templateModal}
//         onClose={() => setTemplateModal(false)}
//         title="Select Resume Template"
//         widthClass="max-w-2xl"
//       >
//         <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
//           {templates.map((t) => (
//             <button
//               key={t}
//               type="button"
//               onClick={() => {
//                 setData((p) => ({ ...p, settings: { ...p.settings, template: t } }));
//                 setTemplateModal(false);
//               }}
//               className={`rounded-xl border p-3 text-left transition hover:shadow-sm ${
//                 data.settings.template === t ? "border-blue-200 bg-blue-50" : "border-slate-200 bg-white"
//               }`}
//             >
//               <p className="font-semibold text-[#0F172A]">{t}</p>
//               <p className="mt-1 text-xs text-slate-500">ATS-friendly layout preview</p>
//             </button>
//           ))}
//         </div>
//       </Modal>

//       {savedToast ? (
//         <div className="fixed bottom-5 right-5 rounded-lg bg-[#0F172A] px-3 py-2 text-xs font-semibold text-white shadow-lg">
//           Draft saved
//         </div>
//       ) : null}
//       {infoToast ? (
//         <div className="fixed bottom-16 right-5 rounded-lg bg-[#2563EB] px-3 py-2 text-xs font-semibold text-white shadow-lg">
//           {infoToast}
//         </div>
//       ) : null}
//     </div>
//   );
// }


////////////////////////////////////////////////////////////////////////////



// ResumeBuilder.jsx
// Self-contained single component — no backend, no auth hooks required.
// Drop into any React + Tailwind + react-icons project and it works.

import { createElement, useMemo, useState, useRef } from "react";
import {
  FiAward, FiBookOpen, FiCheckCircle, FiChevronDown,
  FiDownload, FiFileText, FiLayers, FiPlus, FiSave,
  FiTool, FiUser, FiX, FiLink,
} from "react-icons/fi";

const INITIAL = {
  personal: {
    name:     "Shyam Shree",
    site:     "my-portfolio-2-rust.vercel.app",
    email:    "sssshyam702@gmail.com",
    phone:    "+91 9353605622",
    location: "Bangalore",
  },
  links: [
    { label: "GitHub",    value: "itsme-shyam-702" },
    { label: "Portfolio", value: "my-portfolio-2-rust.vercel.app" },
  ],
  education: [
    { institution:"Karnataka (Govt.) Polytechnic", degree:"Diploma, Computer Science & Engineering", date:"2023 – 2026", location:"Bangalore", notes:"Branch: CSE" },
    { institution:"MCKC High School", degree:"Secondary (X)", date:"2019", location:"Bangalore", notes:"79.36%" },
  ],
  coursework: {
    col1label: "Recent",
    col1: ["Full Stack Web Dev","Database Systems","Operating Systems","Data Structures","Computer Networks"],
    col2label: "Core",
    col2: ["HTML / CSS / JS","React & Node.js","Python Programming","MongoDB & Express"],
  },
  skills: {
    groups: [
      { label:"Proficient", items:"React, JavaScript, Node.js, Express.js, MongoDB, HTML5, CSS3" },
      { label:"Familiar",   items:"Python, Git, GitHub, Figma, Postman, React Router" },
    ],
  },
  experience: [
    {
      org:"School Website Project", role:"Student Developer", date:"Aug 2025", location:"Virtual",
      bullets:[
        "Built a responsive school website, improving event visibility and digital accessibility for students and staff.",
        "Enhanced communication efficiency by 40% through streamlined interfaces and features.",
        "Received positive feedback from staff for intuitive design and usability.",
      ],
    },
  ],
  research: [
    { org:"ThinkBoard Task Management App", role:"React, Node.js, MongoDB, Express.js", date:"2025", location:"https://thinkboard-frontend.onrender.com/", desc:"Built a task management app with features to create, update, and track tasks. Integrated MongoDB for storing user data. Implemented user authentication and CRUD operations using Node.js and Express.js." },
    { org:"Personal Portfolio Website", role:"React.js, CSS, JavaScript", date:"2025", location:"https://my-portfolio-2-rust.vercel.app/", desc:"Developed a personal portfolio website to showcase projects, skills, and resume. Implemented responsive design for mobile and desktop screens. Optimized images and code for improved performance." },
  ],
  awards: [
    "React.js – Infosys Springboard (Oct 2025)",
    "ES6 – Infosys Springboard (Sep 2025)",
    "JavaScript – Infosys Springboard (Aug 2025)",
  ],
};

const arr = (v) => (Array.isArray(v) ? v : []);

function Input({ value, onChange, placeholder, className="", multiline=false, rows=3, onKeyDown }) {
  const base = "w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-100 transition";
  if (multiline) return <textarea value={value} onChange={onChange} rows={rows} placeholder={placeholder} className={`${base} py-2 resize-none ${className}`}/>;
  return <input value={value} onChange={onChange} placeholder={placeholder} onKeyDown={onKeyDown} className={`${base} h-9 ${className}`}/>;
}

function Btn({ onClick, children, variant="ghost", disabled=false }) {
  const s = { ghost:"border border-slate-200 text-slate-700 hover:bg-slate-50", blue:"bg-indigo-600 text-white hover:bg-indigo-700", red:"text-red-400 hover:text-red-600" };
  return <button type="button" onClick={onClick} disabled={disabled} className={`inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold transition disabled:opacity-60 ${s[variant]}`}>{children}</button>;
}

function AccHead({ title, icon, open, done, onToggle }) {
  return (
    <button type="button" onClick={onToggle} className="flex w-full items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm hover:bg-slate-50 transition">
      <div className="flex items-center gap-2.5">
        <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">{icon}</span>
        <span className="font-semibold text-slate-800 text-sm">{title}</span>
        {done && <FiCheckCircle size={13} className="text-emerald-500"/>}
      </div>
      <FiChevronDown className={`text-slate-400 transition-transform duration-200 ${open?"rotate-180":""}`}/>
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────
//  DEEDY-STYLE TEMPLATE
//  Dark gray/black text, compact header, clean academic look
// ─────────────────────────────────────────────────────────────────

const D = {
  dark:    "#111111",
  mid:     "#333333",
  muted:   "#555555",
  faint:   "#777777",
  rule:    "#cccccc",
  accent:  "#2b4590",
  bg:      "#ffffff",
};

// Small live preview (scaled down)
function DeedyPreview({ data }) {
  const p = data.personal;

  const Sec = ({ title }) => (
    <div style={{ marginTop:"8px", marginBottom:"3px" }}>
      <div style={{
        fontSize:"7.5px", fontWeight:700, textTransform:"uppercase",
        letterSpacing:"1.5px", color:D.dark,
        borderBottom:`0.75px solid ${D.dark}`, paddingBottom:"1px",
      }}>{title}</div>
    </div>
  );

  return (
    <div style={{ background:D.bg, fontFamily:"'Georgia',serif", fontSize:"7px", color:D.mid, width:"100%", boxSizing:"border-box" }}>
      {/* HEADER */}
      <div style={{ textAlign:"center", padding:"8px 10px 5px", borderBottom:`1px solid ${D.rule}` }}>
        <div style={{ fontSize:"16px", fontWeight:700, color:D.dark, fontFamily:"'Georgia',serif", letterSpacing:"0.5px" }}>{p.name||"Your Name"}</div>
        <div style={{ fontSize:"6.5px", color:D.muted, marginTop:"2px" }}>
          {[p.site, p.email, p.phone, p.location].filter(Boolean).join("  |  ")}
        </div>
        {arr(data.links).some(l=>l.value) && (
          <div style={{ fontSize:"6px", color:D.muted, marginTop:"1px" }}>
            {arr(data.links).filter(l=>l.value).map((l,i)=>(
              <span key={i} style={{ marginRight:"8px" }}><span style={{ fontWeight:700, color:D.dark }}>{l.label}:</span> {l.value}</span>
            ))}
          </div>
        )}
      </div>
      {/* BODY */}
      <div style={{ display:"flex" }}>
        {/* LEFT */}
        <div style={{ width:"36%", padding:"4px 6px", borderRight:`0.75px solid ${D.rule}` }}>
          {arr(data.education).length>0 && (<>
            <Sec title="Education"/>
            {arr(data.education).map((ed,i)=>(
              <div key={i} style={{ marginBottom:"5px" }}>
                <div style={{ fontWeight:700, fontSize:"7px", color:D.dark }}>{ed.institution}</div>
                <div style={{ fontSize:"6.5px", color:D.mid, fontStyle:"italic" }}>{ed.degree}</div>
                <div style={{ fontSize:"6px", color:D.muted }}>{ed.date}{ed.location&&` | ${ed.location}`}</div>
                {ed.notes && <div style={{ fontSize:"6px", color:D.muted }}>{ed.notes}</div>}
              </div>
            ))}
          </>)}

          {arr(data.links).some(l=>l.value) && (<>
            <Sec title="Links"/>
            {arr(data.links).filter(l=>l.value).map((l,i)=>(
              <div key={i} style={{ fontSize:"6.5px", color:D.mid, marginBottom:"2px" }}>
                <span style={{ fontWeight:700, color:D.dark }}>{l.label}:</span> {l.value}
              </div>
            ))}
          </>)}

          {(arr(data.coursework?.col1).length>0 || arr(data.coursework?.col2).length>0) && (<>
            <Sec title="Coursework"/>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0 4px" }}>
              {[...arr(data.coursework?.col1), ...arr(data.coursework?.col2)].map((c,i)=>(
                <div key={i} style={{ fontSize:"6.5px", color:D.mid, padding:"0.75px 0" }}>{c}</div>
              ))}
            </div>
          </>)}

          {arr(data.skills?.groups).length>0 && (<>
            <Sec title="Skills"/>
            {arr(data.skills.groups).map((g,i)=>(
              <div key={i} style={{ marginBottom:"3px" }}>
                <span style={{ fontWeight:700, fontSize:"6.5px", color:D.dark, textTransform:"uppercase", letterSpacing:"0.5px" }}>{g.label}: </span>
                <span style={{ fontSize:"6.5px", color:D.mid }}>{g.items}</span>
              </div>
            ))}
          </>)}
        </div>

        {/* RIGHT */}
        <div style={{ flex:1, padding:"4px 6px" }}>
          {arr(data.experience).length>0 && (<>
            <Sec title="Experience"/>
            {arr(data.experience).map((ex,i)=>(
              <div key={i} style={{ marginBottom:"6px" }}>
                <div style={{ display:"flex", justifyContent:"space-between" }}>
                  <span style={{ fontWeight:700, fontSize:"7px", color:D.dark, textTransform:"uppercase" }}>{ex.org}</span>
                  <span style={{ fontSize:"6px", color:D.muted }}>{ex.date}</span>
                </div>
                <div style={{ fontSize:"6.5px", color:D.muted, fontStyle:"italic", marginBottom:"2px" }}>{ex.role}{ex.location&&` | ${ex.location}`}</div>
                {arr(ex.bullets).filter(Boolean).map((b,j)=>(
                  <div key={j} style={{ fontSize:"6.5px", color:D.mid, paddingLeft:"8px", marginBottom:"1.5px", display:"flex", gap:"3px" }}>
                    <span>•</span><span>{b}</span>
                  </div>
                ))}
              </div>
            ))}
          </>)}

          {arr(data.research).length>0 && (<>
            <Sec title="Projects"/>
            {arr(data.research).map((r,i)=>(
              <div key={i} style={{ marginBottom:"6px" }}>
                <div style={{ display:"flex", justifyContent:"space-between" }}>
                  <span style={{ fontWeight:700, fontSize:"7px", color:D.dark }}>{r.org}</span>
                  <span style={{ fontSize:"6px", color:D.muted }}>{r.date}</span>
                </div>
                <div style={{ fontSize:"6.5px", color:D.muted, fontStyle:"italic" }}>{r.role}</div>
                {r.location && <div style={{ fontSize:"6px", color:D.accent }}>{r.location}</div>}
                <div style={{ fontSize:"6.5px", color:D.mid, marginTop:"1px" }}>{r.desc}</div>
              </div>
            ))}
          </>)}

          {arr(data.awards).length>0 && (<>
            <Sec title="Certifications & Awards"/>
            {arr(data.awards).map((a,i)=>(
              <div key={i} style={{ fontSize:"6.5px", color:D.mid, paddingLeft:"8px", marginBottom:"1.5px", display:"flex", gap:"3px" }}>
                <span>•</span><span>{a}</span>
              </div>
            ))}
          </>)}
        </div>
      </div>
    </div>
  );
}

// Full A4 version for PDF export
function DeedyA4({ data }) {
  const p = data.personal;

  const SecLabel = ({ title }) => (
    <div style={{ marginTop:"14px", marginBottom:"5px" }}>
      <div style={{
        fontSize:"9px", fontWeight:700, textTransform:"uppercase",
        letterSpacing:"2px", color:D.dark,
        borderBottom:`1px solid ${D.dark}`, paddingBottom:"2px",
      }}>{title}</div>
    </div>
  );

  return (
    <div style={{
      background: D.bg,
      fontFamily: "'Georgia','Times New Roman',serif",
      fontSize:   "9.5px",
      color:      D.mid,
      width:      "794px",
      minHeight:  "1123px",
      boxSizing:  "border-box",
    }}>
      {/* HEADER — compact, centered, white bg */}
      <div style={{ textAlign:"center", padding:"22px 40px 14px", borderBottom:`1px solid ${D.rule}` }}>
        <div style={{
          fontSize:"30px", fontWeight:700, color:D.dark,
          fontFamily:"'Georgia',serif", letterSpacing:"1px", lineHeight:1.1,
        }}>{p.name || "Your Name"}</div>

        <div style={{ fontSize:"9px", color:D.muted, marginTop:"5px", letterSpacing:"0.3px" }}>
          {[p.site, p.email, p.phone, p.location].filter(Boolean).join("  |  ")}
        </div>

        {arr(data.links).some(l=>l.value) && (
          <div style={{ fontSize:"8.5px", color:D.muted, marginTop:"3px" }}>
            {arr(data.links).filter(l=>l.value).map((l,i)=>(
              <span key={i} style={{ marginRight:"16px" }}>
                <span style={{ fontWeight:700, color:D.dark }}>{l.label}:</span> {l.value}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* BODY: two columns, no outer margins */}
      <div style={{ display:"flex", minHeight:"900px" }}>

        {/* LEFT SIDEBAR */}
        <div style={{ width:"34%", borderRight:`1px solid ${D.rule}`, padding:"0 16px 20px 20px", boxSizing:"border-box" }}>

          {arr(data.education).length>0 && (<>
            <SecLabel title="Education"/>
            {arr(data.education).map((ed,i)=>(
              <div key={i} style={{ marginBottom:"12px" }}>
                <div style={{ fontWeight:700, fontSize:"10px", color:D.dark }}>{ed.institution}</div>
                <div style={{ fontSize:"9px", color:D.mid, fontStyle:"italic", marginTop:"1px" }}>{ed.degree}</div>
                <div style={{ fontSize:"8.5px", color:D.muted, marginTop:"2px" }}>{ed.date}{ed.location&&` | ${ed.location}`}</div>
                {ed.notes && <div style={{ fontSize:"8.5px", color:D.muted }}>{ed.notes}</div>}
              </div>
            ))}
          </>)}

          {(arr(data.coursework?.col1).length>0 || arr(data.coursework?.col2).length>0) && (<>
            <SecLabel title="Coursework"/>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"1px 8px" }}>
              {[...arr(data.coursework?.col1), ...arr(data.coursework?.col2)].map((c,i)=>(
                <div key={i} style={{ fontSize:"9px", color:D.mid, padding:"2px 0" }}>{c}</div>
              ))}
            </div>
          </>)}

          {arr(data.skills?.groups).length>0 && (<>
            <SecLabel title="Skills"/>
            {arr(data.skills.groups).map((g,i)=>(
              <div key={i} style={{ marginBottom:"8px" }}>
                <div style={{ fontSize:"8.5px", fontWeight:700, color:D.dark, textTransform:"uppercase", letterSpacing:"1px", marginBottom:"2px" }}>{g.label}</div>
                <div style={{ fontSize:"9px", color:D.mid, lineHeight:"1.6" }}>{g.items}</div>
              </div>
            ))}
          </>)}
        </div>

        {/* RIGHT MAIN */}
        <div style={{ flex:1, padding:"0 20px 20px 16px", boxSizing:"border-box" }}>

          {arr(data.experience).length>0 && (<>
            <SecLabel title="Experience"/>
            {arr(data.experience).map((ex,i)=>(
              <div key={i} style={{ marginBottom:"14px" }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"baseline" }}>
                  <span style={{ fontWeight:700, fontSize:"10.5px", color:D.dark, textTransform:"uppercase", letterSpacing:"0.3px" }}>{ex.org}</span>
                  <span style={{ fontSize:"8.5px", color:D.muted, flexShrink:0, marginLeft:"8px" }}>{ex.date}{ex.location&&` | ${ex.location}`}</span>
                </div>
                <div style={{ fontSize:"9px", color:D.muted, fontStyle:"italic", marginBottom:"4px" }}>{ex.role}</div>
                {arr(ex.bullets).filter(Boolean).map((b,j)=>(
                  <div key={j} style={{ fontSize:"9.5px", color:D.mid, paddingLeft:"12px", marginBottom:"3px", display:"flex", gap:"6px", lineHeight:"1.55" }}>
                    <span style={{ flexShrink:0 }}>•</span><span>{b}</span>
                  </div>
                ))}
              </div>
            ))}
          </>)}

          {arr(data.research).length>0 && (<>
            <SecLabel title="Projects"/>
            {arr(data.research).map((r,i)=>(
              <div key={i} style={{ marginBottom:"14px" }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"baseline" }}>
                  <span style={{ fontWeight:700, fontSize:"10.5px", color:D.dark }}>{r.org}</span>
                  <span style={{ fontSize:"8.5px", color:D.muted, flexShrink:0, marginLeft:"8px" }}>{r.date}</span>
                </div>
                <div style={{ fontSize:"9px", color:D.muted, fontStyle:"italic", marginBottom:"2px" }}>{r.role}</div>
                {r.location && <div style={{ fontSize:"8.5px", color:D.accent, marginBottom:"3px" }}>{r.location}</div>}
                <div style={{ fontSize:"9.5px", color:D.mid, lineHeight:"1.55" }}>{r.desc}</div>
              </div>
            ))}
          </>)}

          {arr(data.awards).length>0 && (<>
            <SecLabel title="Certifications & Awards"/>
            {arr(data.awards).map((a,i)=>(
              <div key={i} style={{ fontSize:"9.5px", color:D.mid, paddingLeft:"12px", marginBottom:"4px", display:"flex", gap:"6px" }}>
                <span style={{ flexShrink:0 }}>•</span><span>{a}</span>
              </div>
            ))}
          </>)}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
//  Section config, form UI, state, handlers, layout — unchanged
// ─────────────────────────────────────────────────────────────────

const SECTIONS = [
  ["personal",   "Personal Info",         FiUser],
  ["education",  "Education",             FiBookOpen],
  ["links",      "Links",                 FiLink],
  ["coursework", "Coursework",            FiFileText],
  ["skills",     "Skills",               FiTool],
  ["experience", "Experience",            FiLayers],
  ["research",   "Projects",             FiLayers],
  ["awards",     "Certifications/Awards", FiAward],
];

export default function ResumeBuilder() {
  const [data, setData]       = useState(INITIAL);
  const [open, setOpen]       = useState("personal");
  const [saved, setSaved]     = useState(false);
  const [toast, setToast]     = useState("");
  const [dl, setDl]           = useState(false);
  const [nsg, setNsg]         = useState({ label:"", items:"" });
  const [nl, setNl]           = useState({ label:"", value:"" });
  const [created, setCreated] = useState(null);
  const previewRef            = useRef(null);
  const a4Ref                 = useRef(null);

  const toggle = k => setOpen(p => p === k ? "" : k);

  const done = useMemo(() => ({
    personal:   !!(data.personal.name && data.personal.email),
    education:  arr(data.education).length > 0,
    links:      arr(data.links).some(l => l.value),
    coursework: arr(data.coursework?.col1).length > 0,
    skills:     arr(data.skills?.groups).length > 0,
    experience: arr(data.experience).length > 0,
    research:   arr(data.research).length > 0,
    awards:     arr(data.awards).length > 0,
  }), [data]);

  const setP = (f, v) => setData(p => ({ ...p, personal: { ...p.personal, [f]: v } }));

  const addEdu = () => setData(p => ({ ...p, education: [...arr(p.education), { institution:"", degree:"", date:"", location:"", notes:"" }] }));
  const setEdu = (i, f, v) => setData(p => ({ ...p, education: arr(p.education).map((x, j) => j === i ? { ...x, [f]: v } : x) }));
  const remEdu = (i) => setData(p => ({ ...p, education: arr(p.education).filter((_, j) => j !== i) }));

  const addLink = () => { if (!nl.label) return; setData(p => ({ ...p, links: [...arr(p.links), { ...nl }] })); setNl({ label:"", value:"" }); };
  const remLink = (i) => setData(p => ({ ...p, links: arr(p.links).filter((_, j) => j !== i) }));
  const setLink = (i, f, v) => setData(p => ({ ...p, links: arr(p.links).map((x, j) => j === i ? { ...x, [f]: v } : x) }));

  const setCW  = (col, v) => setData(p => ({ ...p, coursework: { ...p.coursework, [col]: v.split("\n").map(s => s.trim()).filter(Boolean) } }));
  const setCWL = (col, v) => setData(p => ({ ...p, coursework: { ...p.coursework, [col]: v } }));

  const addSG = () => { if (!nsg.label) return; setData(p => ({ ...p, skills: { ...p.skills, groups: [...arr(p.skills?.groups), { ...nsg }] } })); setNsg({ label:"", items:"" }); };
  const remSG = (i) => setData(p => ({ ...p, skills: { ...p.skills, groups: arr(p.skills?.groups).filter((_, j) => j !== i) } }));
  const setSG = (i, f, v) => setData(p => ({ ...p, skills: { ...p.skills, groups: arr(p.skills?.groups).map((x, j) => j === i ? { ...x, [f]: v } : x) } }));

  const addExp    = () => setData(p => ({ ...p, experience: [...arr(p.experience), { org:"", role:"", date:"", location:"", bullets:[""] }] }));
  const setExp    = (i, f, v) => setData(p => ({ ...p, experience: arr(p.experience).map((x, j) => j === i ? { ...x, [f]: v } : x) }));
  const setBullet = (i, bi, v) => setData(p => ({ ...p, experience: arr(p.experience).map((x, j) => j === i ? { ...x, bullets: arr(x.bullets).map((b, k) => k === bi ? v : b) } : x) }));
  const addBullet = (i) => setData(p => ({ ...p, experience: arr(p.experience).map((x, j) => j === i ? { ...x, bullets: [...arr(x.bullets), ""] } : x) }));
  const remBullet = (i, bi) => setData(p => ({ ...p, experience: arr(p.experience).map((x, j) => j === i ? { ...x, bullets: arr(x.bullets).filter((_, k) => k !== bi) } : x) }));
  const remExp    = (i) => setData(p => ({ ...p, experience: arr(p.experience).filter((_, j) => j !== i) }));

  const addRes = () => setData(p => ({ ...p, research: [...arr(p.research), { org:"", role:"", date:"", location:"", desc:"" }] }));
  const setRes = (i, f, v) => setData(p => ({ ...p, research: arr(p.research).map((x, j) => j === i ? { ...x, [f]: v } : x) }));
  const remRes = (i) => setData(p => ({ ...p, research: arr(p.research).filter((_, j) => j !== i) }));

  const setAwards = (v) => setData(p => ({ ...p, awards: v.split("\n").map(s => s.trim()).filter(Boolean) }));

  const saveDraft = () => {
    try { localStorage.setItem("deedyResume", JSON.stringify(data)); } catch(e) {}
    setSaved(true); setTimeout(() => setSaved(false), 1600);
  };

  const handleCreate = () => {
    setCreated(JSON.parse(JSON.stringify(data)));
    setToast("✅ Resume created!"); setTimeout(() => setToast(""), 2000);
  };

  const downloadPDF = async () => {
    if (!a4Ref.current) { setToast("Click Create Resume first!"); setTimeout(() => setToast(""), 2000); return; }
    setDl(true); setToast("Generating PDF…");
    try {
      const load = (src) => new Promise((res, rej) => {
        if (document.querySelector(`script[src="${src}"]`)) { res(); return; }
        const s = document.createElement("script"); s.src = src; s.onload = res; s.onerror = rej; document.head.appendChild(s);
      });
      await load("https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js");
      await load("https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js");
      const node   = a4Ref.current;
      const canvas = await window.html2canvas(node, { scale:3, useCORS:true, backgroundColor:"#ffffff", width:794, height:node.scrollHeight, windowWidth:794 });
      const img    = canvas.toDataURL("image/png");
      const { jsPDF } = window.jspdf;
      const pdf    = new jsPDF({ orientation:"portrait", unit:"mm", format:"a4" });
      const pageH  = (canvas.height * 210) / canvas.width;
      pdf.addImage(img, "PNG", 0, 0, 210, pageH);
      pdf.save(`${(created || data).personal.name || "Resume"}.pdf`);
      setToast("✅ Downloaded!"); setTimeout(() => setToast(""), 2000);
    } catch(err) { console.error(err); setToast("❌ Failed"); setTimeout(() => setToast(""), 2500); }
    finally { setDl(false); }
  };

  const openTab = () => {
    if (!a4Ref.current) { setToast("Click Create Resume first!"); setTimeout(() => setToast(""), 2000); return; }
    const name = (created || data).personal.name;
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${name} Resume</title><style>*{margin:0;padding:0;box-sizing:border-box;}body{background:#e8e8e8;display:flex;justify-content:center;padding:30px;}</style></head><body>${a4Ref.current.outerHTML}</body></html>`;
    window.open(URL.createObjectURL(new Blob([html], { type:"text/html" })), "_blank");
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-12">
      <div className="mx-auto max-w-[1280px] px-4 py-6 sm:px-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Resume Builder</h1>
          <p className="text-sm text-slate-500 mt-1">Classic academic CV style — dark text, clean layout</p>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_460px]">

          {/* ── LEFT FORM ── */}
          <div className="space-y-2">
            {SECTIONS.map(([key, title, Icon]) => (
              <div key={key}>
                <AccHead title={title} icon={createElement(Icon, { size:14 })} open={open === key} done={done[key]} onToggle={() => toggle(key)}/>
                {open === key && (
                  <div className="mt-1.5 rounded-xl border border-slate-200 bg-white p-4 shadow-sm space-y-3">

                    {key === "personal" && (
                      <div className="grid grid-cols-2 gap-2">
                        {[["name","Full Name"],["site","Website"],["email","Email"],["phone","Phone"],["location","Location"]].map(([f, ph]) => (
                          <Input key={f} value={data.personal[f]||""} onChange={e => setP(f, e.target.value)} placeholder={ph} className={f === "name" ? "col-span-2" : ""}/>
                        ))}
                      </div>
                    )}

                    {key === "education" && (
                      <div className="space-y-3">
                        {arr(data.education).map((ed, i) => (
                          <div key={i} className="rounded-lg border border-slate-100 bg-slate-50 p-3 space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">Entry {i+1}</span>
                              <Btn variant="red" onClick={() => remEdu(i)}>Remove</Btn>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <Input value={ed.institution} onChange={e => setEdu(i,"institution",e.target.value)} placeholder="Institution" className="col-span-2"/>
                              <Input value={ed.degree}      onChange={e => setEdu(i,"degree",e.target.value)}      placeholder="Degree / Certificate" className="col-span-2"/>
                              <Input value={ed.date}        onChange={e => setEdu(i,"date",e.target.value)}        placeholder="Year / Date"/>
                              <Input value={ed.location}    onChange={e => setEdu(i,"location",e.target.value)}    placeholder="Location"/>
                              <Input value={ed.notes}       onChange={e => setEdu(i,"notes",e.target.value)}       placeholder="GPA / Notes" className="col-span-2"/>
                            </div>
                          </div>
                        ))}
                        <Btn onClick={addEdu}><FiPlus size={11}/> Add Education</Btn>
                      </div>
                    )}

                    {key === "links" && (
                      <div className="space-y-2">
                        {arr(data.links).map((l, i) => (
                          <div key={i} className="flex gap-2 items-center">
                            <Input value={l.label} onChange={e => setLink(i,"label",e.target.value)} placeholder="Label" className="w-28 shrink-0"/>
                            <Input value={l.value} onChange={e => setLink(i,"value",e.target.value)} placeholder="URL or handle" className="flex-1"/>
                            <button type="button" onClick={() => remLink(i)} className="text-red-400 hover:text-red-600"><FiX size={14}/></button>
                          </div>
                        ))}
                        <div className="flex gap-2 items-center pt-1 border-t border-slate-100">
                          <Input value={nl.label} onChange={e => setNl(p => ({ ...p, label:e.target.value }))} placeholder="Label" className="w-28 shrink-0"/>
                          <Input value={nl.value} onChange={e => setNl(p => ({ ...p, value:e.target.value }))} placeholder="URL or handle" className="flex-1"/>
                          <button type="button" onClick={addLink} className="h-9 w-9 flex items-center justify-center rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition shrink-0"><FiPlus size={14}/></button>
                        </div>
                      </div>
                    )}

                    {key === "coursework" && (
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <Input value={data.coursework?.col1label||""} onChange={e => setCWL("col1label",e.target.value)} placeholder="Column 1 label"/>
                            <Input multiline rows={5} value={arr(data.coursework?.col1).join("\n")} onChange={e => setCW("col1",e.target.value)} placeholder={"Course 1\nCourse 2\n..."}/>
                          </div>
                          <div className="space-y-1">
                            <Input value={data.coursework?.col2label||""} onChange={e => setCWL("col2label",e.target.value)} placeholder="Column 2 label"/>
                            <Input multiline rows={5} value={arr(data.coursework?.col2).join("\n")} onChange={e => setCW("col2",e.target.value)} placeholder={"Course 1\nCourse 2\n..."}/>
                          </div>
                        </div>
                        <p className="text-xs text-slate-400">One course per line</p>
                      </div>
                    )}

                    {key === "skills" && (
                      <div className="space-y-3">
                        {arr(data.skills?.groups).map((g, i) => (
                          <div key={i} className="rounded-lg border border-slate-100 bg-slate-50 p-3 space-y-2">
                            <div className="flex justify-between">
                              <Input value={g.label} onChange={e => setSG(i,"label",e.target.value)} placeholder="Group label" className="flex-1 mr-2"/>
                              <Btn variant="red" onClick={() => remSG(i)}>Remove</Btn>
                            </div>
                            <Input value={g.items} onChange={e => setSG(i,"items",e.target.value)} placeholder="Skill1, Skill2, ..."/>
                          </div>
                        ))}
                        <div className="rounded-lg border border-dashed border-slate-300 p-3 space-y-2">
                          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Add Group</p>
                          <Input value={nsg.label} onChange={e => setNsg(p => ({ ...p, label:e.target.value }))} placeholder="Label (Proficient / Familiar)"/>
                          <Input value={nsg.items} onChange={e => setNsg(p => ({ ...p, items:e.target.value }))} placeholder="Comma-separated skills"/>
                          <Btn onClick={addSG}><FiPlus size={11}/> Add Group</Btn>
                        </div>
                      </div>
                    )}

                    {key === "experience" && (
                      <div className="space-y-3">
                        {arr(data.experience).map((ex, i) => (
                          <div key={i} className="rounded-lg border border-slate-100 bg-slate-50 p-3 space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="text-xs font-bold text-slate-400 uppercase">Experience {i+1}</span>
                              <Btn variant="red" onClick={() => remExp(i)}>Remove</Btn>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <Input value={ex.org}      onChange={e => setExp(i,"org",e.target.value)}      placeholder="Organisation" className="col-span-2"/>
                              <Input value={ex.role}     onChange={e => setExp(i,"role",e.target.value)}     placeholder="Role / Title" className="col-span-2"/>
                              <Input value={ex.date}     onChange={e => setExp(i,"date",e.target.value)}     placeholder="Date range"/>
                              <Input value={ex.location} onChange={e => setExp(i,"location",e.target.value)} placeholder="Location"/>
                            </div>
                            <div className="space-y-1.5">
                              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Bullets</p>
                              {arr(ex.bullets).map((b, bi) => (
                                <div key={bi} className="flex gap-2 items-center">
                                  <Input value={b} onChange={e => setBullet(i, bi, e.target.value)} placeholder={`Bullet ${bi+1}`} className="flex-1"/>
                                  <button type="button" onClick={() => remBullet(i, bi)} className="text-red-400 hover:text-red-600"><FiX size={14}/></button>
                                </div>
                              ))}
                              <Btn onClick={() => addBullet(i)}><FiPlus size={11}/> Add Bullet</Btn>
                            </div>
                          </div>
                        ))}
                        <Btn onClick={addExp}><FiPlus size={11}/> Add Experience</Btn>
                      </div>
                    )}

                    {key === "research" && (
                      <div className="space-y-3">
                        {arr(data.research).map((r, i) => (
                          <div key={i} className="rounded-lg border border-slate-100 bg-slate-50 p-3 space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="text-xs font-bold text-slate-400 uppercase">Project {i+1}</span>
                              <Btn variant="red" onClick={() => remRes(i)}>Remove</Btn>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <Input value={r.org}      onChange={e => setRes(i,"org",e.target.value)}      placeholder="Project Name" className="col-span-2"/>
                              <Input value={r.role}     onChange={e => setRes(i,"role",e.target.value)}     placeholder="Tech Stack" className="col-span-2"/>
                              <Input value={r.date}     onChange={e => setRes(i,"date",e.target.value)}     placeholder="Year"/>
                              <Input value={r.location} onChange={e => setRes(i,"location",e.target.value)} placeholder="Live / GitHub link"/>
                              <Input multiline rows={3} value={r.desc} onChange={e => setRes(i,"desc",e.target.value)} placeholder="Description…" className="col-span-2"/>
                            </div>
                          </div>
                        ))}
                        <Btn onClick={addRes}><FiPlus size={11}/> Add Project</Btn>
                      </div>
                    )}

                    {key === "awards" && (
                      <div className="space-y-1">
                        <Input multiline rows={5} value={arr(data.awards).join("\n")} onChange={e => setAwards(e.target.value)} placeholder={"Award or Certification 1\nAward or Certification 2\n..."}/>
                        <p className="text-xs text-slate-400">One entry per line</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}

            <div className="pt-2">
              <button
                type="button"
                onClick={handleCreate}
                className="w-full rounded-xl py-3.5 text-sm font-bold text-white tracking-wide shadow-lg transition hover:opacity-90 active:scale-[0.99]"
                style={{ background:"#1e293b" }}
              >
                ✦ Create Resume
              </button>
              {created && (
                <p className="text-center text-xs text-emerald-500 font-semibold mt-2">
                  ✓ Resume generated — see the preview panel →
                </p>
              )}
            </div>
          </div>

          {/* ── RIGHT PREVIEW PANEL ── */}
          <div className="space-y-3 lg:sticky lg:top-6 lg:h-fit">
            <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
              <div className="flex flex-wrap gap-2 mb-3">
                <button type="button" onClick={downloadPDF} disabled={dl}
                  className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-bold text-white hover:opacity-90 transition disabled:opacity-60"
                  style={{ background:"#1e293b" }}>
                  <FiDownload size={13}/> {dl ? "Generating…" : "Download PDF"}
                </button>
                <button type="button" onClick={openTab}
                  className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition">
                  Open in New Tab
                </button>
                <button type="button" onClick={saveDraft}
                  className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition">
                  <FiSave size={13}/> Save Draft
                </button>
                {created && (
                  <button type="button" onClick={handleCreate}
                    className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold hover:bg-slate-50 transition ml-auto"
                    style={{ borderColor:"#1e293b", color:"#1e293b" }}>
                    ↺ Refresh
                  </button>
                )}
              </div>

              {created ? (
                <div className="border border-slate-200 rounded-lg overflow-hidden bg-gray-100">
                  <div style={{ width:"794px", transform:"scale(0.557)", transformOrigin:"top left", height:"442px", overflow:"hidden" }}>
                    <DeedyA4 data={created}/>
                  </div>
                </div>
              ) : (
                <>
                  <p className="text-xs text-slate-400 mb-2 text-center">Live preview · fill the form then click <strong>Create Resume</strong></p>
                  <div className="border border-slate-200 rounded-lg overflow-hidden">
                    <div ref={previewRef}><DeedyPreview data={data}/></div>
                  </div>
                </>
              )}
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <h3 className="text-sm font-bold text-slate-800 mb-3">Completion</h3>
              <div className="space-y-1.5">
                {SECTIONS.map(([k, t]) => (
                  <div key={k} className="flex items-center justify-between">
                    <span className="text-xs text-slate-600">{t}</span>
                    {done[k] ? <FiCheckCircle size={13} className="text-emerald-500"/> : <span className="h-3 w-3 rounded-full border-2 border-slate-300"/>}
                  </div>
                ))}
              </div>
              <div className="mt-3 h-1.5 w-full rounded-full bg-slate-100">
                <div className="h-1.5 rounded-full transition-all duration-500"
                  style={{ width:`${(Object.values(done).filter(Boolean).length / SECTIONS.length) * 100}%`, background:"#1e293b" }}/>
              </div>
              <p className="mt-1 text-xs text-slate-400 text-right">
                {Object.values(done).filter(Boolean).length}/{SECTIONS.length} complete
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Hidden A4 for PDF generation */}
      {created && (
        <div style={{ position:"fixed", left:"-9999px", top:0, width:"794px", pointerEvents:"none", opacity:0, zIndex:-1 }}>
          <div ref={a4Ref}>
            <DeedyA4 data={created}/>
          </div>
        </div>
      )}

      {saved && <div className="fixed bottom-6 right-6 z-50 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-xl">✓ Draft saved</div>}
      {toast && <div className="fixed bottom-16 right-6 z-50 rounded-xl px-4 py-2.5 text-sm font-semibold text-white shadow-xl" style={{ background:"#1e293b" }}>{toast}</div>}
    </div>
  );
}
