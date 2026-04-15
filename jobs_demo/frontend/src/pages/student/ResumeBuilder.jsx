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

import { createElement, useMemo, useState } from "react";
import {
  FiAward,
  FiBookOpen,
  FiCheckCircle,
  FiChevronDown,
  FiDownload,
  FiFileText,
  FiLayers,
  FiPlus,
  FiSave,
  FiSettings,
  FiTool,
  FiUser,
  FiX,
  FiPrinter,
} from "react-icons/fi";

// ─────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────
const templates = [
  "Classic ATS",
  "Modern Minimal",
  "Two-Column Professional",
  "Fresher Clean",
  "Tech Focused",
];

const sectionMeta = [
  ["personal",    "Personal Info",               FiUser],
  ["summary",     "Professional Summary",        FiFileText],
  ["education",   "Education",                   FiBookOpen],
  ["skills",      "Skills",                      FiTool],
  ["experience",  "Experience",                  FiLayers],
  ["projects",    "Projects",                    FiLayers],
  ["certs",       "Certifications / Awards",     FiAward],
  ["settings",    "Resume Settings",             FiSettings],
];

const INITIAL = {
  personal: {
    name:      "Shyam Shree",
    email:     "sssshyam702@gmail.com",
    phone:     "+91 9353605622",
    location:  "Bangalore",
    linkedin:  "",
    portfolio: "https://my-portfolio-2-rust.vercel.app/",
    github:    "https://github.com/itsme-shyam-702",
  },
  summary:
    "Aspiring Full Stack Developer with foundational knowledge in web development (HTML, CSS, JavaScript, React, Node.js, MongoDB). Eager to gain practical experience, build web applications, and contribute to innovative projects through internships or full-time roles.",
  education: [
    { degree: "Diploma, Computer Science & Engineering", college: "Karnataka (Govt.) Polytechnic", branch: "CSE", year: "2023 – 2026", cgpa: "" },
    { degree: "Secondary (X)", college: "MCKC High School", branch: "", year: "2019", cgpa: "79.36%" },
  ],
  skills: ["React", "JavaScript", "Node.js", "Express.js", "MongoDB", "HTML5", "CSS3", "Python", "GitHub", "Figma", "Postman", "React Router"],
  experience: [
    {
      company:  "School Website Project, Virtual",
      role:     "Student Developer",
      duration: "Aug 2025 – Aug 2025 (1 month)",
      bullets: [
        "Built a responsive school website, improving event visibility and digital accessibility for students and staff.",
        "Enhanced communication efficiency by 40% through streamlined interfaces and features.",
        "Received positive feedback from staff for intuitive design and usability.",
      ],
    },
  ],
  projects: [
    {
      name:  "ThinkBoard Task Management App",
      stack: "React, Node.js, MongoDB, Express.js",
      link:  "https://thinkboard-frontend.onrender.com/",
      bullets: [
        "Built a task management app with features to create, update, and track tasks.",
        "Integrated MongoDB database for storing user data and task details.",
        "Implemented user authentication and CRUD operations using Node.js and Express.js.",
      ],
    },
    {
      name:  "Personal Portfolio Website",
      stack: "React.js, CSS, JavaScript",
      link:  "https://my-portfolio-2-rust.vercel.app/",
      bullets: [
        "Developed a personal portfolio website to showcase projects, skills, and resume.",
        "Implemented responsive design for mobile and desktop screens.",
        "Improved site performance and load time by optimizing images and code.",
      ],
    },
  ],
  certs: ["React.js – Infosys Springboard (Oct 2025)", "ES6 – Infosys Springboard (Sep 2025)", "JavaScript – Infosys Springboard (Aug 2025)"],
  settings: { template: "Classic ATS", fontSize: "Medium", atsMode: true, onePage: true },
};

// ─────────────────────────────────────────────────────────────
// TINY HELPERS
// ─────────────────────────────────────────────────────────────
const arr = (v) => (Array.isArray(v) ? v : []);

function Input({ value, onChange, placeholder, className = "", multiline = false, rows = 3 }) {
  const base =
    "w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100 transition";
  if (multiline)
    return (
      <textarea
        value={value}
        onChange={onChange}
        rows={rows}
        placeholder={placeholder}
        className={`${base} py-2 resize-none ${className}`}
      />
    );
  return (
    <input
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className={`${base} h-10 ${className}`}
    />
  );
}

function Tag({ label, onRemove }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 border border-blue-200 px-2.5 py-0.5 text-xs font-medium text-blue-700">
      {label}
      <button type="button" onClick={onRemove} className="text-blue-400 hover:text-red-500">
        <FiX size={11} />
      </button>
    </span>
  );
}

function SmallBtn({ onClick, children, variant = "ghost" }) {
  const styles = {
    ghost:  "border border-slate-200 text-slate-700 hover:bg-slate-50",
    blue:   "border border-blue-200 text-blue-600 hover:bg-blue-50",
    orange: "border border-orange-200 text-orange-500 hover:bg-orange-50",
  };
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${styles[variant]}`}
    >
      {children}
    </button>
  );
}

// ─────────────────────────────────────────────────────────────
// SECTION ACCORDION HEADER
// ─────────────────────────────────────────────────────────────
function SectionHeader({ title, icon, open, done, onToggle }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="flex w-full items-center justify-between gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3.5 shadow-sm hover:bg-slate-50/60 transition"
    >
      <div className="flex items-center gap-2.5">
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
          {icon}
        </span>
        <span className="font-semibold text-slate-800">{title}</span>
        {done && <FiCheckCircle size={14} className="text-emerald-500" />}
      </div>
      <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
        Edit
        <FiChevronDown className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </div>
    </button>
  );
}

// ─────────────────────────────────────────────────────────────
// MODAL
// ─────────────────────────────────────────────────────────────
function Modal({ open, onClose, title, children }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
      <div className="relative w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-6 shadow-xl mx-4">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-900">{title}</h3>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-700">
            <FiX size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// RESUME PREVIEW (right panel)
// ─────────────────────────────────────────────────────────────
function ResumePreview({ data }) {
  const p = data.personal;
  const contacts = [p.email, p.phone, p.location, p.linkedin, p.github, p.portfolio].filter(Boolean);

  return (
    <div
      id="resume-print-area"
      className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden"
      style={{ fontFamily: "Georgia, serif", fontSize: "10.5px", lineHeight: "1.55", color: "#1e293b" }}
    >
      {/* Header */}
      <div className="bg-slate-800 text-white px-7 py-5 text-center">
        <h1 style={{ fontSize: "20px", fontFamily: "Arial, sans-serif", fontWeight: 700, letterSpacing: "1.5px", marginBottom: 4 }}>
          {p.name || "Your Name"}
        </h1>
        <p style={{ fontSize: "9.5px", color: "#94a3b8", wordBreak: "break-all" }}>
          {contacts.join("  •  ")}
        </p>
      </div>

      <div className="px-7 py-5 space-y-4">
        {/* Summary */}
        {data.summary && (
          <PreviewSection title="Professional Summary">
            <p className="text-slate-700" style={{ fontSize: "10px" }}>{data.summary}</p>
          </PreviewSection>
        )}

        {/* Education */}
        {arr(data.education).length > 0 && (
          <PreviewSection title="Education">
            {arr(data.education).map((ed, i) => (
              <div key={i} className="flex justify-between items-start" style={{ marginBottom: 6 }}>
                <div>
                  <div className="font-semibold" style={{ fontSize: "10.5px" }}>{ed.degree}</div>
                  <div className="text-slate-500" style={{ fontSize: "9.5px" }}>
                    {ed.college}{ed.branch ? ` — ${ed.branch}` : ""}
                  </div>
                </div>
                <div className="text-right text-slate-500 shrink-0 pl-4" style={{ fontSize: "9.5px" }}>
                  <div>{ed.year}</div>
                  {ed.cgpa && <div>{ed.cgpa}</div>}
                </div>
              </div>
            ))}
          </PreviewSection>
        )}

        {/* Experience */}
        {arr(data.experience).length > 0 && (
          <PreviewSection title="Work Experience">
            {arr(data.experience).map((ex, i) => (
              <div key={i} style={{ marginBottom: 8 }}>
                <div className="flex justify-between">
                  <span className="font-semibold" style={{ fontSize: "10.5px" }}>{ex.role}</span>
                  <span className="text-slate-500 shrink-0 pl-4" style={{ fontSize: "9.5px" }}>{ex.duration}</span>
                </div>
                <div className="text-slate-500" style={{ fontSize: "9.5px", marginBottom: 3 }}>{ex.company}</div>
                <ul style={{ paddingLeft: 14, margin: 0 }}>
                  {arr(ex.bullets).filter(Boolean).map((b, j) => (
                    <li key={j} className="text-slate-700" style={{ fontSize: "9.5px", marginBottom: 2 }}>{b}</li>
                  ))}
                </ul>
              </div>
            ))}
          </PreviewSection>
        )}

        {/* Projects */}
        {arr(data.projects).length > 0 && (
          <PreviewSection title="Projects">
            {arr(data.projects).map((pr, i) => (
              <div key={i} style={{ marginBottom: 8 }}>
                <div className="flex justify-between">
                  <span className="font-semibold" style={{ fontSize: "10.5px" }}>{pr.name}</span>
                  {pr.link && (
                    <a href={pr.link} className="text-blue-600 shrink-0 pl-4" style={{ fontSize: "9px" }}>
                      {pr.link}
                    </a>
                  )}
                </div>
                {pr.stack && (
                  <div className="text-slate-500" style={{ fontSize: "9.5px", marginBottom: 3 }}>
                    Tech: {pr.stack}
                  </div>
                )}
                <ul style={{ paddingLeft: 14, margin: 0 }}>
                  {arr(pr.bullets).filter(Boolean).map((b, j) => (
                    <li key={j} className="text-slate-700" style={{ fontSize: "9.5px", marginBottom: 2 }}>{b}</li>
                  ))}
                </ul>
              </div>
            ))}
          </PreviewSection>
        )}

        {/* Skills */}
        {arr(data.skills).length > 0 && (
          <PreviewSection title="Skills">
            <div className="flex flex-wrap gap-1.5">
              {arr(data.skills).map((s, i) => (
                <span key={i} className="rounded bg-slate-100 border border-slate-200 px-2 py-0.5 text-slate-700"
                  style={{ fontSize: "9.5px" }}>
                  {s}
                </span>
              ))}
            </div>
          </PreviewSection>
        )}

        {/* Certifications */}
        {arr(data.certs).length > 0 && (
          <PreviewSection title="Certifications / Awards">
            <ul style={{ paddingLeft: 14, margin: 0 }}>
              {arr(data.certs).map((c, i) => (
                <li key={i} className="text-slate-700" style={{ fontSize: "9.5px", marginBottom: 2 }}>{c}</li>
              ))}
            </ul>
          </PreviewSection>
        )}
      </div>
    </div>
  );
}

function PreviewSection({ title, children }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-2" style={{ borderBottom: "1.5px solid #1e3a5f", paddingBottom: 3 }}>
        <h2 style={{
          fontSize: "10px", fontFamily: "Arial, sans-serif", fontWeight: 700,
          textTransform: "uppercase", letterSpacing: "1px", color: "#1e3a5f", margin: 0,
        }}>
          {title}
        </h2>
      </div>
      {children}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────
export default function ResumeBuilder() {
  const [data, setData]               = useState(INITIAL);
  const [openSection, setOpenSection] = useState("personal");
  const [templateModal, setTemplateModal] = useState(false);
  const [savedToast, setSavedToast]   = useState(false);
  const [infoToast, setInfoToast]     = useState("");
  const [newSkill, setNewSkill]       = useState("");

  // ── completion flags ──────────────────────────────────────
  const completed = useMemo(() => ({
    personal:   Boolean(data.personal.name && data.personal.email && data.personal.phone),
    summary:    Boolean(String(data.summary || "").trim()),
    education:  arr(data.education).length > 0,
    skills:     arr(data.skills).length > 0,
    experience: arr(data.experience).length > 0,
    projects:   arr(data.projects).length > 0,
    certs:      arr(data.certs).length > 0,
    settings:   true,
  }), [data]);

  // ── toggle accordion ─────────────────────────────────────
  const toggle = (key) => setOpenSection((p) => (p === key ? "" : key));

  // ── setters ───────────────────────────────────────────────
  const setPersonal  = (f, v) => setData((p) => ({ ...p, personal: { ...p.personal, [f]: v } }));
  const setSummary   = (v)    => setData((p) => ({ ...p, summary: v }));
  const setCerts     = (v)    => setData((p) => ({
    ...p, certs: v.split(",").map((x) => x.trim()).filter(Boolean),
  }));

  // education
  const addEdu = () =>
    setData((p) => ({ ...p, education: [...arr(p.education), { degree: "", college: "", branch: "", year: "", cgpa: "" }] }));
  const setEdu = (idx, f, v) =>
    setData((p) => ({ ...p, education: arr(p.education).map((x, i) => i === idx ? { ...x, [f]: v } : x) }));
  const removeEdu = (idx) =>
    setData((p) => ({ ...p, education: arr(p.education).filter((_, i) => i !== idx) }));

  // skills
  const addSkill = () => {
    const s = newSkill.trim();
    if (!s) return;
    setData((p) => ({ ...p, skills: [...arr(p.skills), s] }));
    setNewSkill("");
  };
  const removeSkill = (i) =>
    setData((p) => ({ ...p, skills: arr(p.skills).filter((_, idx) => idx !== i) }));

  // experience
  const addExp = () =>
    setData((p) => ({ ...p, experience: [...arr(p.experience), { company: "", role: "", duration: "", bullets: [""] }] }));
  const setExp = (idx, f, v) =>
    setData((p) => ({ ...p, experience: arr(p.experience).map((x, i) => i === idx ? { ...x, [f]: v } : x) }));
  const setExpBullet = (idx, bi, v) =>
    setData((p) => ({
      ...p,
      experience: arr(p.experience).map((x, i) =>
        i === idx ? { ...x, bullets: arr(x.bullets).map((b, j) => (j === bi ? v : b)) } : x
      ),
    }));
  const addExpBullet = (idx) =>
    setData((p) => ({
      ...p,
      experience: arr(p.experience).map((x, i) => i === idx ? { ...x, bullets: [...arr(x.bullets), ""] } : x),
    }));
  const removeExp = (idx) =>
    setData((p) => ({ ...p, experience: arr(p.experience).filter((_, i) => i !== idx) }));

  // projects
  const addProject = () =>
    setData((p) => ({ ...p, projects: [...arr(p.projects), { name: "", stack: "", link: "", bullets: [""] }] }));
  const setProj = (idx, f, v) =>
    setData((p) => ({ ...p, projects: arr(p.projects).map((x, i) => i === idx ? { ...x, [f]: v } : x) }));
  const setProjBullet = (idx, bi, v) =>
    setData((p) => ({
      ...p,
      projects: arr(p.projects).map((x, i) =>
        i === idx ? { ...x, bullets: arr(x.bullets).map((b, j) => (j === bi ? v : b)) } : x
      ),
    }));
  const addProjBullet = (idx) =>
    setData((p) => ({
      ...p,
      projects: arr(p.projects).map((x, i) => i === idx ? { ...x, bullets: [...arr(x.bullets), ""] } : x),
    }));
  const removeProj = (idx) =>
    setData((p) => ({ ...p, projects: arr(p.projects).filter((_, i) => i !== idx) }));

  // ── save draft (localStorage) ─────────────────────────────
  const saveDraft = () => {
    localStorage.setItem("resumeBuilderDraft", JSON.stringify(data));
    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 1600);
  };

  // ── download PDF via print dialog ────────────────────────
  const downloadPDF = () => {
    const style = document.createElement("style");
    style.innerHTML = `
      @media print {
        body > * { display: none !important; }
        #resume-print-wrapper { display: block !important; position: fixed; inset: 0; background: white; z-index: 9999; padding: 0; margin: 0; }
      }
    `;
    document.head.appendChild(style);
    const wrapper = document.getElementById("resume-print-wrapper");
    if (wrapper) wrapper.style.display = "block";
    window.print();
    setTimeout(() => {
      document.head.removeChild(style);
      if (wrapper) wrapper.style.display = "none";
    }, 500);
  };

  // ── ATS scan ─────────────────────────────────────────────
  const atsScan = () => {
    const issues = [];
    if (!data.personal.name || !data.personal.email) issues.push("Complete personal details.");
    if (!String(data.summary || "").trim()) issues.push("Add a professional summary.");
    if (!arr(data.skills).length) issues.push("Add key skills.");
    if (!arr(data.education).length) issues.push("Add education.");
    if (!arr(data.experience).length && !arr(data.projects).length) issues.push("Add experience or projects.");
    setInfoToast(issues.length ? `⚠ ${issues.length} ATS issue(s) found` : "✅ ATS check passed!");
    setTimeout(() => setInfoToast(""), 2500);
  };

  // ─────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-10">

      {/* Hidden print target */}
      <div id="resume-print-wrapper" style={{ display: "none" }}>
        <ResumePreview data={data} />
      </div>

      <div className="mx-auto max-w-[1200px] space-y-5 px-4 py-6 sm:px-6 lg:px-8">

        {/* ── Page header ── */}
        <section>
          <h1 className="text-3xl font-bold text-slate-900">Resume Builder</h1>
          <p className="mt-1 text-sm text-slate-500">Build an ATS-friendly resume in minutes</p>
          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs font-semibold">
            {["Step 1 Profile", "Step 2 Content", "Step 3 Template", "Step 4 Download"].map((s, i) => (
              <span key={s}
                className={`rounded-full border px-2.5 py-1 ${
                  i === 2
                    ? "border-blue-200 bg-blue-50 text-blue-600"
                    : "border-slate-200 bg-white text-slate-600"
                }`}>
                {s}
              </span>
            ))}
          </div>
        </section>

        {/* ── Two-column grid ── */}
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_400px]">

          {/* ════════════ LEFT — FORM PANEL ════════════ */}
          <main className="space-y-2">
            {sectionMeta.map(([key, title, iconComp]) => (
              <div key={key} className="space-y-1.5">

                {/* Accordion header */}
                <SectionHeader
                  title={title}
                  icon={createElement(iconComp, { size: 15 })}
                  open={openSection === key}
                  done={completed[key]}
                  onToggle={() => toggle(key)}
                />

                {/* Accordion body */}
                {openSection === key && (
                  <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-3">

                    {/* ── Personal ── */}
                    {key === "personal" && (
                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                        {Object.keys(data.personal).map((f) => (
                          <Input
                            key={f}
                            value={data.personal[f]}
                            onChange={(e) => setPersonal(f, e.target.value)}
                            placeholder={f.charAt(0).toUpperCase() + f.slice(1)}
                          />
                        ))}
                      </div>
                    )}

                    {/* ── Summary ── */}
                    {key === "summary" && (
                      <div className="space-y-2">
                        <Input multiline rows={5} value={data.summary} onChange={(e) => setSummary(e.target.value)}
                          placeholder="Write a short professional summary..." />
                        <SmallBtn variant="blue"
                          onClick={() => {
                            const next = String(data.summary || "").replace(/\s+/g, " ").trim().replace(/^\w/, (c) => c.toUpperCase());
                            setSummary(next);
                            setInfoToast("Summary refined ✨");
                            setTimeout(() => setInfoToast(""), 1400);
                          }}>
                          ✨ AI Improve
                        </SmallBtn>
                      </div>
                    )}

                    {/* ── Education ── */}
                    {key === "education" && (
                      <div className="space-y-3">
                        {arr(data.education).map((ed, idx) => (
                          <div key={idx} className="rounded-xl border border-slate-200 bg-slate-50/60 p-3">
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Entry {idx + 1}</span>
                              <button type="button" onClick={() => removeEdu(idx)}
                                className="text-red-400 hover:text-red-600 text-xs font-semibold">Remove</button>
                            </div>
                            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                              {[["degree","Degree / Certificate"],["college","Institution"],["branch","Branch / Board"],["year","Year"],["cgpa","CGPA / Percentage"]].map(([f, ph]) => (
                                <Input key={f} value={ed[f]} onChange={(e) => setEdu(idx, f, e.target.value)} placeholder={ph} />
                              ))}
                            </div>
                          </div>
                        ))}
                        <SmallBtn onClick={addEdu}><FiPlus size={12} /> Add Education</SmallBtn>
                      </div>
                    )}

                    {/* ── Skills ── */}
                    {key === "skills" && (
                      <div className="space-y-2">
                        <div className="flex flex-wrap gap-1.5 min-h-[28px]">
                          {arr(data.skills).map((s, i) => (
                            <Tag key={i} label={s} onRemove={() => removeSkill(i)} />
                          ))}
                        </div>
                        <div className="flex gap-2">
                          <Input value={newSkill} onChange={(e) => setNewSkill(e.target.value)}
                            placeholder="Type a skill and press Enter or +"
                            className="flex-1"
                            onKeyDown={(e) => e.key === "Enter" && addSkill()} />
                          <button type="button" onClick={addSkill}
                            className="h-10 w-10 flex items-center justify-center rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition">
                            <FiPlus />
                          </button>
                        </div>
                        <label className="inline-flex items-center gap-2 text-xs text-slate-600">
                          <input type="checkbox" className="rounded" /> Highlight Top 5 Skills
                        </label>
                      </div>
                    )}

                    {/* ── Experience ── */}
                    {key === "experience" && (
                      <div className="space-y-3">
                        {arr(data.experience).map((ex, idx) => (
                          <div key={idx} className="rounded-xl border border-slate-200 bg-slate-50/60 p-3">
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Experience {idx + 1}</span>
                              <button type="button" onClick={() => removeExp(idx)}
                                className="text-red-400 hover:text-red-600 text-xs font-semibold">Remove</button>
                            </div>
                            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                              <Input value={ex.company}  onChange={(e) => setExp(idx,"company",e.target.value)}  placeholder="Company" />
                              <Input value={ex.role}     onChange={(e) => setExp(idx,"role",e.target.value)}     placeholder="Role / Title" />
                              <Input value={ex.duration} onChange={(e) => setExp(idx,"duration",e.target.value)} placeholder="Duration (Jan 2025 – Jun 2025)" className="sm:col-span-2" />
                            </div>
                            <div className="mt-3 space-y-1.5">
                              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Achievement Bullets</p>
                              {arr(ex.bullets).map((b, bi) => (
                                <Input key={bi} value={b} onChange={(e) => setExpBullet(idx, bi, e.target.value)}
                                  placeholder={`Bullet ${bi + 1}`} />
                              ))}
                              <SmallBtn variant="orange" onClick={() => addExpBullet(idx)}>
                                <FiPlus size={12} /> Add Bullet
                              </SmallBtn>
                            </div>
                          </div>
                        ))}
                        <SmallBtn onClick={addExp}><FiPlus size={12} /> Add Experience</SmallBtn>
                      </div>
                    )}

                    {/* ── Projects ── */}
                    {key === "projects" && (
                      <div className="space-y-3">
                        {arr(data.projects).map((pr, idx) => (
                          <div key={idx} className="rounded-xl border border-slate-200 bg-slate-50/60 p-3">
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Project {idx + 1}</span>
                              <button type="button" onClick={() => removeProj(idx)}
                                className="text-red-400 hover:text-red-600 text-xs font-semibold">Remove</button>
                            </div>
                            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                              <Input value={pr.name}  onChange={(e) => setProj(idx,"name",e.target.value)}  placeholder="Project Name" />
                              <Input value={pr.stack} onChange={(e) => setProj(idx,"stack",e.target.value)} placeholder="Tech Stack (React, Node...)" />
                              <Input value={pr.link}  onChange={(e) => setProj(idx,"link",e.target.value)}  placeholder="Live / GitHub Link" className="sm:col-span-2" />
                            </div>
                            <div className="mt-3 space-y-1.5">
                              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Highlights</p>
                              {arr(pr.bullets).map((b, bi) => (
                                <Input key={bi} value={b} onChange={(e) => setProjBullet(idx, bi, e.target.value)}
                                  placeholder={`Highlight ${bi + 1}`} />
                              ))}
                              <SmallBtn onClick={() => addProjBullet(idx)}>
                                <FiPlus size={12} /> Add Bullet
                              </SmallBtn>
                            </div>
                          </div>
                        ))}
                        <SmallBtn onClick={addProject}><FiPlus size={12} /> Add Project</SmallBtn>
                      </div>
                    )}

                    {/* ── Certifications ── */}
                    {key === "certs" && (
                      <div className="space-y-2">
                        <Input
                          value={arr(data.certs).join(", ")}
                          onChange={(e) => setCerts(e.target.value)}
                          placeholder="Cert 1, Award 2, ..."
                        />
                        <p className="text-xs text-slate-400">Separate multiple entries with commas</p>
                      </div>
                    )}

                    {/* ── Settings ── */}
                    {key === "settings" && (
                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                        <select value={data.settings.template}
                          onChange={(e) => setData((p) => ({ ...p, settings: { ...p.settings, template: e.target.value } }))}
                          className="h-10 rounded-lg border border-slate-200 px-3 text-sm text-slate-700 outline-none focus:border-blue-400">
                          {templates.map((t) => <option key={t}>{t}</option>)}
                        </select>
                        <select value={data.settings.fontSize}
                          onChange={(e) => setData((p) => ({ ...p, settings: { ...p.settings, fontSize: e.target.value } }))}
                          className="h-10 rounded-lg border border-slate-200 px-3 text-sm text-slate-700 outline-none focus:border-blue-400">
                          {["Small","Medium","Large"].map((s) => <option key={s}>{s}</option>)}
                        </select>
                        <label className="inline-flex items-center gap-2 text-sm text-slate-700">
                          <input type="checkbox" checked={!!data.settings.atsMode}
                            onChange={(e) => setData((p) => ({ ...p, settings: { ...p.settings, atsMode: e.target.checked } }))} />
                          ATS Mode
                        </label>
                        <label className="inline-flex items-center gap-2 text-sm text-slate-700">
                          <input type="checkbox" checked={!!data.settings.onePage}
                            onChange={(e) => setData((p) => ({ ...p, settings: { ...p.settings, onePage: e.target.checked } }))} />
                          One-page
                        </label>
                        <button type="button" onClick={() => setTemplateModal(true)}
                          className="sm:col-span-2 rounded-lg border border-blue-200 px-3 py-2 text-sm font-semibold text-blue-600 hover:bg-blue-50 transition">
                          Choose Template
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </main>

          {/* ════════════ RIGHT — PREVIEW & TOOLS ════════════ */}
          <aside className="space-y-3 lg:sticky lg:top-6 lg:h-fit">

            {/* Action buttons */}
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex flex-wrap gap-2 mb-4">
                <button type="button" onClick={downloadPDF}
                  className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition">
                  <FiDownload size={14} /> Download PDF
                </button>
                <button type="button" onClick={saveDraft}
                  className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition">
                  <FiSave size={14} /> Save Draft
                </button>
                <button type="button" onClick={downloadPDF}
                  className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition">
                  <FiPrinter size={14} /> Print
                </button>
              </div>

              {/* Resume preview card */}
              <ResumePreview data={data} />
            </div>

            {/* ATS Tips panel */}
            <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4 shadow-sm">
              <h3 className="font-semibold text-slate-800 mb-2">ATS Tips</h3>
              <ul className="space-y-1 text-xs text-slate-600">
                <li>• Use role-specific keywords naturally</li>
                <li>• Keep headings consistent (e.g. "Experience")</li>
                <li>• Write achievement-focused bullet points</li>
                <li>• Export as PDF for stable layout</li>
                <li>• Avoid tables, columns, graphics in ATS mode</li>
              </ul>
              <button type="button" onClick={atsScan}
                className="mt-3 w-full rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700 transition">
                🔍 Scan for ATS Issues
              </button>
            </div>

            {/* Completion tracker */}
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <h3 className="font-semibold text-slate-800 mb-3 text-sm">Section Completion</h3>
              <div className="space-y-1.5">
                {sectionMeta.map(([key, title]) => (
                  <div key={key} className="flex items-center justify-between">
                    <span className="text-xs text-slate-600">{title}</span>
                    {completed[key]
                      ? <FiCheckCircle size={13} className="text-emerald-500" />
                      : <span className="h-3 w-3 rounded-full border-2 border-slate-300" />}
                  </div>
                ))}
              </div>
              <div className="mt-3">
                <div className="h-1.5 w-full rounded-full bg-slate-100">
                  <div
                    className="h-1.5 rounded-full bg-blue-500 transition-all duration-500"
                    style={{ width: `${(Object.values(completed).filter(Boolean).length / sectionMeta.length) * 100}%` }}
                  />
                </div>
                <p className="mt-1 text-xs text-slate-400 text-right">
                  {Object.values(completed).filter(Boolean).length}/{sectionMeta.length} complete
                </p>
              </div>
            </div>
          </aside>
        </div>
      </div>

      {/* Template modal */}
      <Modal open={templateModal} onClose={() => setTemplateModal(false)} title="Select Resume Template">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {templates.map((t) => (
            <button key={t} type="button"
              onClick={() => { setData((p) => ({ ...p, settings: { ...p.settings, template: t } })); setTemplateModal(false); }}
              className={`rounded-xl border p-4 text-left transition hover:shadow-sm ${
                data.settings.template === t ? "border-blue-300 bg-blue-50" : "border-slate-200 bg-white hover:bg-slate-50"
              }`}>
              <p className="font-semibold text-slate-800 text-sm">{t}</p>
              <p className="mt-0.5 text-xs text-slate-400">ATS-friendly layout</p>
            </button>
          ))}
        </div>
      </Modal>

      {/* Toasts */}
      {savedToast && (
        <div className="fixed bottom-6 right-6 z-50 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-xl animate-fade-in">
          ✓ Draft saved to local storage
        </div>
      )}
      {infoToast && (
        <div className="fixed bottom-16 right-6 z-50 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-xl">
          {infoToast}
        </div>
      )}
    </div>
  );
}
