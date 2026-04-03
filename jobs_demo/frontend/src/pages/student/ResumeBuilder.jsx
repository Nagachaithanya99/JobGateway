// frontend/src/pages/student/ResumeBuilder.jsx
import { createElement, useEffect, useMemo, useState } from "react";
import {
  FiAward,
  FiBookOpen,
  FiCheckCircle,
  FiChevronDown,
  FiFileText,
  FiLayers,
  FiPlus,
  FiSave,
  FiSettings,
  FiTool,
  FiUser,
  FiDownload,
} from "react-icons/fi";
import Modal from "../../components/common/Modal";
import useAuth from "../../hooks/useAuth.js";
import { showSweetToast } from "../../utils/sweetAlert.js";
import {
  studentGetResume,
  studentMe,
  studentSaveResume,
  studentDownloadResumePDF,
} from "../../services/studentService.js";

const templates = [
  "Classic ATS",
  "Modern Minimal",
  "Two-Column Professional",
  "Fresher Clean",
  "Tech Focused",
];

const emptyState = {
  personal: {
    name: "",
    email: "",
    phone: "",
    location: "",
    linkedin: "",
    portfolio: "",
    github: "",
  },
  summary: "",
  education: [],
  skills: [],
  experience: [],
  projects: [],
  certs: [],
  settings: { template: "Classic ATS", fontSize: "Medium", atsMode: true, onePage: true },
};

const sectionMeta = [
  ["personal", "Personal Info", FiUser],
  ["summary", "Professional Summary", FiFileText],
  ["education", "Education", FiBookOpen],
  ["skills", "Skills", FiTool],
  ["experience", "Experience", FiLayers],
  ["projects", "Projects", FiLayers],
  ["certs", "Certifications / Awards", FiAward],
  ["settings", "Resume Settings", FiSettings],
];

function Section({ title, icon, open, done, onToggle, right }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <button type="button" onClick={onToggle} className="flex w-full items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-[#2563EB]">
            {icon}
          </span>
          <span className="font-semibold text-[#0F172A]">{title}</span>
          {done ? <FiCheckCircle className="text-green-600" /> : null}
        </div>
        <span className="inline-flex items-center gap-2 text-xs text-slate-500">
          {right}
          <FiChevronDown className={`transition ${open ? "rotate-180" : ""}`} />
        </span>
      </button>
    </div>
  );
}

function safeArray(v) {
  return Array.isArray(v) ? v : [];
}

function normalizeResume(raw) {
  const r = raw && typeof raw === "object" ? raw : {};
  return {
    personal: { ...emptyState.personal, ...(r.personal || {}) },
    summary: typeof r.summary === "string" ? r.summary : "",
    education: safeArray(r.education).map((x) => ({
      degree: x?.degree ?? "",
      college: x?.college ?? "",
      branch: x?.branch ?? "",
      year: x?.year ?? "",
      cgpa: x?.cgpa ?? "",
    })),
    skills: safeArray(r.skills).map((s) => String(s || "").trim()).filter(Boolean),
    experience: safeArray(r.experience).map((x) => ({
      company: x?.company ?? "",
      role: x?.role ?? "",
      duration: x?.duration ?? "",
      bullets: safeArray(x?.bullets).map((b) => String(b ?? "")),
    })),
    projects: safeArray(r.projects).map((x) => ({
      name: x?.name ?? "",
      stack: x?.stack ?? "",
      bullets: safeArray(x?.bullets).map((b) => String(b ?? "")),
      link: x?.link ?? "",
    })),
    certs: safeArray(r.certs).map((c) => String(c || "").trim()).filter(Boolean),
    settings: { ...emptyState.settings, ...(r.settings || {}) },
  };
}

export default function ResumeBuilder() {
  const { user } = useAuth();

  const [data, setData] = useState(emptyState);
  const [open, setOpen] = useState("personal");

  const [templateModal, setTemplateModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [err, setErr] = useState("");

  // ============================
  // LOAD resume from backend
  // ============================
  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        setLoading(true);
        setErr("");

        // 1) Load resume + profile from backend
        const [resumeRes, meRes] = await Promise.all([studentGetResume(), studentMe()]);
        const backendResume = normalizeResume(resumeRes.data);
        const me = meRes?.data || {};
        const sp = me?.studentProfile || {};
        const spPersonal = sp?.personal || {};

        // 2) Auto-fill basics from profile/auth if missing
        const filled = {
          ...backendResume,
          personal: {
            ...backendResume.personal,
            name: backendResume.personal.name || me?.name || spPersonal?.fullName || user?.name || "",
            email: backendResume.personal.email || me?.email || user?.email || "",
            phone: backendResume.personal.phone || me?.phone || spPersonal?.phone || "",
            location: backendResume.personal.location || me?.location || spPersonal?.city || "",
            linkedin: backendResume.personal.linkedin || me?.linkedin || spPersonal?.linkedin || "",
            portfolio: backendResume.personal.portfolio || me?.portfolio || spPersonal?.portfolio || "",
            github: backendResume.personal.github || spPersonal?.github || "",
          },
          education:
            backendResume.education.length > 0
              ? backendResume.education
              : (Array.isArray(sp?.education) ? sp.education : []),
          skills:
            backendResume.skills.length > 0
              ? backendResume.skills
              : (Array.isArray(sp?.skills) ? sp.skills : []),
          experience:
            backendResume.experience.length > 0
              ? backendResume.experience
              : (Array.isArray(sp?.experience) ? sp.experience : []),
        };

        if (mounted) setData(filled);
      } catch (e) {
        if (mounted) {
          setErr(e?.response?.data?.message || e?.message || "Failed to load resume");
          setData({
            ...emptyState,
            personal: {
              ...emptyState.personal,
              name: user?.name || "",
              email: user?.email || "",
            },
          });
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();
    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const completed = useMemo(
    () => ({
      personal: Boolean(data.personal.name && data.personal.email && data.personal.phone),
      summary: Boolean(String(data.summary || "").trim()),
      education: Array.isArray(data.education) && data.education.length > 0,
      skills: Array.isArray(data.skills) && data.skills.length > 0,
      experience: Array.isArray(data.experience) && data.experience.length > 0,
      projects: Array.isArray(data.projects) && data.projects.length > 0,
      certs: Array.isArray(data.certs) && data.certs.length > 0,
      settings: true,
    }),
    [data]
  );

  // helpers
  const addEducation = () =>
    setData((p) => ({
      ...p,
      education: [...safeArray(p.education), { degree: "", college: "", branch: "", year: "", cgpa: "" }],
    }));

  const addExperience = () =>
    setData((p) => ({
      ...p,
      experience: [...safeArray(p.experience), { company: "", role: "", duration: "", bullets: [""] }],
    }));

  const addExperienceBullet = (idx) =>
    setData((p) => ({
      ...p,
      experience: safeArray(p.experience).map((x, i) =>
        i === idx ? { ...x, bullets: [...safeArray(x.bullets), ""] } : x
      ),
    }));

  const addProject = () =>
    setData((p) => ({
      ...p,
      projects: [...safeArray(p.projects), { name: "", stack: "", bullets: [""], link: "" }],
    }));

  // ============================
  // SAVE resume to backend
  // ============================
  const onSaveDraft = async () => {
    try {
      setSaving(true);
      setErr("");
      await studentSaveResume(data);
        void showSweetToast("Draft saved", "success", { timer: 1400 });
    } catch (e) {
      setErr(e?.response?.data?.message || e?.message || "Failed to save resume");
    } finally {
      setSaving(false);
    }
  };

  // ============================
  // DOWNLOAD PDF from backend
  // ============================
  const onDownloadPDF = async () => {
    try {
      setDownloading(true);
      setErr("");

      // Ensure latest saved first (so pdf matches)
      await studentSaveResume(data);

      const res = await studentDownloadResumePDF();
      const blob = new Blob([res.data], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = "resume.pdf";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      setErr(e?.response?.data?.message || e?.message || "Failed to download PDF");
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-[#F8FAFC]">
        <div className="w-full px-4 py-10 sm:px-6 lg:px-8">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-semibold text-slate-700">Loading resume...</p>
            <p className="mt-1 text-xs text-slate-500">Fetching your resume from backend</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#F8FAFC] pb-8">
      <div className="w-full space-y-5 px-4 py-6 sm:px-6 lg:px-8">
        <section>
          <h1 className="text-3xl font-bold text-[#0F172A]">Resume Builder</h1>
          <p className="mt-1 text-sm text-slate-500">Build an ATS-friendly resume in minutes</p>

          {err ? (
            <div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {err}
            </div>
          ) : null}

          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs font-semibold">
            {["Step 1 Profile", "Step 2 Content", "Step 3 Template", "Step 4 Download"].map((s, i) => (
              <span
                key={s}
                className={`rounded-full border px-2.5 py-1 ${
                  i === 2 ? "border-blue-200 bg-blue-50 text-[#2563EB]" : "border-slate-200 bg-white text-slate-600"
                }`}
              >
                {s}
              </span>
            ))}
          </div>
        </section>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_420px]">
          <main className="space-y-3">
            {sectionMeta.map(([key, title, iconComp]) => (
              <div key={key} className="space-y-2">
                <Section
                  title={title}
                  icon={createElement(iconComp)}
                  open={open === key}
                  done={completed[key]}
                  onToggle={() => setOpen((p) => (p === key ? "" : key))}
                  right="Edit"
                />

                {open === key ? (
                  <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                    {key === "personal" ? (
                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                        {Object.keys(data.personal).map((f) => (
                          <input
                            key={f}
                            value={data.personal[f]}
                            onChange={(e) =>
                              setData((p) => ({ ...p, personal: { ...p.personal, [f]: e.target.value } }))
                            }
                            placeholder={f[0].toUpperCase() + f.slice(1)}
                            className="h-10 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-blue-300"
                          />
                        ))}
                      </div>
                    ) : null}

                    {key === "summary" ? (
                      <div className="space-y-2">
                        <textarea
                          value={data.summary}
                          onChange={(e) => setData((p) => ({ ...p, summary: e.target.value }))}
                          rows={4}
                          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-300"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const next = String(data.summary || "")
                              .replace(/\s+/g, " ")
                              .trim()
                              .replace(/^\w/, (c) => c.toUpperCase());
                            setData((p) => ({ ...p, summary: next }));
                            void showSweetToast("Summary refined", "success", { timer: 1400 });
                          }}
                          className="rounded-lg border border-blue-200 px-3 py-1.5 text-xs font-semibold text-[#2563EB] hover:bg-blue-50"
                        >
                          AI Improve
                        </button>
                      </div>
                    ) : null}

                    {key === "education" ? (
                      <div className="space-y-2">
                        {safeArray(data.education).map((ed, idx) => (
                          <div key={`ed_${idx}`} className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                            {Object.keys(ed).map((f) => (
                              <input
                                key={f}
                                value={ed[f]}
                                onChange={(e) =>
                                  setData((p) => ({
                                    ...p,
                                    education: safeArray(p.education).map((x, i) =>
                                      i === idx ? { ...x, [f]: e.target.value } : x
                                    ),
                                  }))
                                }
                                placeholder={f.toUpperCase()}
                                className="h-10 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-blue-300"
                              />
                            ))}
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={addEducation}
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                        >
                          <FiPlus /> Add Education
                        </button>
                      </div>
                    ) : null}

                    {key === "skills" ? (
                      <div className="space-y-2">
                        <input
                          value={safeArray(data.skills).join(", ")}
                          onChange={(e) =>
                            setData((p) => ({
                              ...p,
                              skills: e.target.value
                                .split(",")
                                .map((x) => x.trim())
                                .filter(Boolean),
                            }))
                          }
                          className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-blue-300"
                          placeholder="React, SQL, Communication..."
                        />
                        <label className="inline-flex items-center gap-2 text-xs text-slate-600">
                          <input type="checkbox" className="rounded" /> Highlight Top 5 Skills
                        </label>
                      </div>
                    ) : null}

                    {key === "experience" ? (
                      <div className="space-y-3">
                        {safeArray(data.experience).map((ex, idx) => (
                          <div key={`ex_${idx}`} className="rounded-xl border border-slate-200 bg-slate-50/60 p-3">
                            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                              <input
                                value={ex.company}
                                onChange={(e) =>
                                  setData((p) => ({
                                    ...p,
                                    experience: safeArray(p.experience).map((x, i) =>
                                      i === idx ? { ...x, company: e.target.value } : x
                                    ),
                                  }))
                                }
                                placeholder="Company"
                                className="h-10 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-blue-300"
                              />
                              <input
                                value={ex.role}
                                onChange={(e) =>
                                  setData((p) => ({
                                    ...p,
                                    experience: safeArray(p.experience).map((x, i) =>
                                      i === idx ? { ...x, role: e.target.value } : x
                                    ),
                                  }))
                                }
                                placeholder="Role"
                                className="h-10 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-blue-300"
                              />
                              <input
                                value={ex.duration}
                                onChange={(e) =>
                                  setData((p) => ({
                                    ...p,
                                    experience: safeArray(p.experience).map((x, i) =>
                                      i === idx ? { ...x, duration: e.target.value } : x
                                    ),
                                  }))
                                }
                                placeholder="Duration (Jan 2025 - Jul 2025)"
                                className="h-10 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-blue-300 sm:col-span-2"
                              />
                            </div>

                            <div className="mt-3 space-y-2">
                              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Achievements</p>
                              {safeArray(ex.bullets).map((b, bi) => (
                                <input
                                  key={`b_${bi}`}
                                  value={b}
                                  onChange={(e) =>
                                    setData((p) => ({
                                      ...p,
                                      experience: safeArray(p.experience).map((x, i) =>
                                        i === idx
                                          ? {
                                              ...x,
                                              bullets: safeArray(x.bullets).map((bb, j) =>
                                                j === bi ? e.target.value : bb
                                              ),
                                            }
                                          : x
                                      ),
                                    }))
                                  }
                                  placeholder={`Bullet ${bi + 1}`}
                                  className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-blue-300"
                                />
                              ))}
                              <button
                                type="button"
                                onClick={() => addExperienceBullet(idx)}
                                className="rounded-lg border border-orange-200 px-3 py-1.5 text-xs font-semibold text-[#F97316] hover:bg-orange-50"
                              >
                                Add Achievement Bullet
                              </button>
                            </div>
                          </div>
                        ))}

                        <button
                          type="button"
                          onClick={addExperience}
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                        >
                          <FiPlus /> Add Experience
                        </button>
                      </div>
                    ) : null}

                    {key === "projects" ? (
                      <div className="space-y-3">
                        {safeArray(data.projects).map((pr, idx) => (
                          <div key={`pr_${idx}`} className="rounded-xl border border-slate-200 bg-slate-50/60 p-3">
                            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                              <input
                                value={pr.name}
                                onChange={(e) =>
                                  setData((p) => ({
                                    ...p,
                                    projects: safeArray(p.projects).map((x, i) =>
                                      i === idx ? { ...x, name: e.target.value } : x
                                    ),
                                  }))
                                }
                                placeholder="Project Name"
                                className="h-10 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-blue-300"
                              />
                              <input
                                value={pr.stack}
                                onChange={(e) =>
                                  setData((p) => ({
                                    ...p,
                                    projects: safeArray(p.projects).map((x, i) =>
                                      i === idx ? { ...x, stack: e.target.value } : x
                                    ),
                                  }))
                                }
                                placeholder="Tech Stack (React, Node...)"
                                className="h-10 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-blue-300"
                              />
                              <input
                                value={pr.link}
                                onChange={(e) =>
                                  setData((p) => ({
                                    ...p,
                                    projects: safeArray(p.projects).map((x, i) =>
                                      i === idx ? { ...x, link: e.target.value } : x
                                    ),
                                  }))
                                }
                                placeholder="Project Link"
                                className="h-10 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-blue-300 sm:col-span-2"
                              />
                            </div>

                            <div className="mt-3 space-y-2">
                              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Highlights</p>
                              {safeArray(pr.bullets).map((b, bi) => (
                                <input
                                  key={`prb_${bi}`}
                                  value={b}
                                  onChange={(e) =>
                                    setData((p) => ({
                                      ...p,
                                      projects: safeArray(p.projects).map((x, i) =>
                                        i === idx
                                          ? {
                                              ...x,
                                              bullets: safeArray(x.bullets).map((bb, j) =>
                                                j === bi ? e.target.value : bb
                                              ),
                                            }
                                          : x
                                      ),
                                    }))
                                  }
                                  placeholder={`Bullet ${bi + 1}`}
                                  className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-blue-300"
                                />
                              ))}
                              <button
                                type="button"
                                onClick={() =>
                                  setData((p) => ({
                                    ...p,
                                    projects: safeArray(p.projects).map((x, i) =>
                                      i === idx ? { ...x, bullets: [...safeArray(x.bullets), ""] } : x
                                    ),
                                  }))
                                }
                                className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                              >
                                <FiPlus /> Add Bullet
                              </button>
                            </div>
                          </div>
                        ))}

                        <button
                          type="button"
                          onClick={addProject}
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                        >
                          <FiPlus /> Add Project
                        </button>
                      </div>
                    ) : null}

                    {key === "certs" ? (
                      <input
                        value={safeArray(data.certs).join(", ")}
                        onChange={(e) =>
                          setData((p) => ({
                            ...p,
                            certs: e.target.value
                              .split(",")
                              .map((x) => x.trim())
                              .filter(Boolean),
                          }))
                        }
                        className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-blue-300"
                        placeholder="Certifications / Awards"
                      />
                    ) : null}

                    {key === "settings" ? (
                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                        <select
                          value={data.settings.template}
                          onChange={(e) => setData((p) => ({ ...p, settings: { ...p.settings, template: e.target.value } }))}
                          className="h-10 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-blue-300"
                        >
                          {templates.map((t) => (
                            <option key={t}>{t}</option>
                          ))}
                        </select>
                        <select
                          value={data.settings.fontSize}
                          onChange={(e) => setData((p) => ({ ...p, settings: { ...p.settings, fontSize: e.target.value } }))}
                          className="h-10 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-blue-300"
                        >
                          <option>Small</option>
                          <option>Medium</option>
                          <option>Large</option>
                        </select>

                        <label className="inline-flex items-center gap-2 text-sm text-slate-700">
                          <input
                            type="checkbox"
                            checked={!!data.settings.atsMode}
                            onChange={(e) => setData((p) => ({ ...p, settings: { ...p.settings, atsMode: e.target.checked } }))}
                          />{" "}
                          ATS Mode
                        </label>

                        <label className="inline-flex items-center gap-2 text-sm text-slate-700">
                          <input
                            type="checkbox"
                            checked={!!data.settings.onePage}
                            onChange={(e) => setData((p) => ({ ...p, settings: { ...p.settings, onePage: e.target.checked } }))}
                          />{" "}
                          One-page
                        </label>

                        <button
                          type="button"
                          onClick={() => setTemplateModal(true)}
                          className="rounded-lg border border-blue-200 px-3 py-2 text-sm font-semibold text-[#2563EB] hover:bg-blue-50 sm:col-span-2"
                        >
                          Choose Template
                        </button>
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </div>
            ))}
          </main>

          <aside className="space-y-3 lg:sticky lg:top-20 lg:h-fit">
            <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
              <div className="mb-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={onDownloadPDF}
                  disabled={downloading}
                  className="inline-flex items-center gap-2 rounded-lg bg-[#2563EB] px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
                >
                  <FiDownload />
                  {downloading ? "Downloading..." : "Download PDF"}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const lines = [
                      data.personal.name || "",
                      [data.personal.email, data.personal.phone, data.personal.location].filter(Boolean).join(" | "),
                      "",
                      "SUMMARY",
                      data.summary || "",
                      "",
                      "SKILLS",
                      safeArray(data.skills).join(", "),
                    ];
                    const blob = new Blob([lines.join("\n")], { type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = "resume.docx";
                    document.body.appendChild(a);
                    a.click();
                    a.remove();
                    URL.revokeObjectURL(url);
                  }}
                  className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Export DOCX
                </button>

                <button
                  type="button"
                  onClick={onSaveDraft}
                  disabled={saving}
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                >
                  <FiSave /> {saving ? "Saving..." : "Save Draft"}
                </button>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-5">
                <h2 className="text-xl font-bold text-[#0F172A]">{data.personal.name || "Your Name"}</h2>
                <p className="text-xs text-slate-500">
                  {data.personal.email || "email"} | {data.personal.phone || "phone"} | {data.personal.location || "location"}
                </p>

                <div className="mt-3 border-t border-slate-100 pt-3">
                  <h3 className="text-xs font-bold uppercase tracking-wide text-slate-500">Summary</h3>
                  <p className="mt-1 text-sm text-slate-700">{data.summary || "Write a short summary..."}</p>
                </div>

                <div className="mt-3 border-t border-slate-100 pt-3">
                  <h3 className="text-xs font-bold uppercase tracking-wide text-slate-500">Skills</h3>
                  <p className="mt-1 text-sm text-slate-700">{safeArray(data.skills).join(", ") || "Add skills..."}</p>
                </div>

                {safeArray(data.experience).length ? (
                  <div className="mt-3 border-t border-slate-100 pt-3">
                    <h3 className="text-xs font-bold uppercase tracking-wide text-slate-500">Experience</h3>
                    {safeArray(data.experience).slice(0, 1).map((ex, i) => (
                      <div key={`prev_ex_${i}`}>
                        <p className="mt-1 text-sm font-semibold text-slate-800">
                          {ex.role || "Role"} - {ex.company || "Company"}
                        </p>
                        <ul className="mt-1 list-disc pl-4 text-sm text-slate-700">
                          {safeArray(ex.bullets).filter(Boolean).slice(0, 4).map((b) => (
                            <li key={b}>{b}</li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>

            <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4">
              <h3 className="font-semibold text-[#0F172A]">ATS Tips</h3>
              <ul className="mt-2 space-y-1 text-xs text-slate-700">
                <li>Use role keywords naturally</li>
                <li>Keep headings consistent</li>
                <li>Use achievement-focused bullets</li>
                <li>Export in PDF for stable layout</li>
              </ul>
              <button
                type="button"
                onClick={() => {
                  const issues = [];
                  if (!data.personal.name || !data.personal.email) issues.push("Add full personal details.");
                  if (!String(data.summary || "").trim()) issues.push("Add a professional summary.");
                  if (!safeArray(data.skills).length) issues.push("Add key skills.");
                  if (!safeArray(data.education).length) issues.push("Add education details.");
                  if (!safeArray(data.experience).length && !safeArray(data.projects).length) {
                    issues.push("Add experience or projects to show impact.");
                  }
                  void showSweetToast(issues.length ? `ATS issues: ${issues.length}` : "ATS check passed", issues.length ? "warning" : "success", { timer: 1800 });
                }}
                className="mt-3 rounded-lg bg-[#2563EB] px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700"
              >
                Scan for Issues
              </button>
            </div>
          </aside>
        </div>
      </div>

      <Modal
        open={templateModal}
        onClose={() => setTemplateModal(false)}
        title="Select Resume Template"
        widthClass="max-w-2xl"
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {templates.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => {
                setData((p) => ({ ...p, settings: { ...p.settings, template: t } }));
                setTemplateModal(false);
              }}
              className={`rounded-xl border p-3 text-left transition hover:shadow-sm ${
                data.settings.template === t ? "border-blue-200 bg-blue-50" : "border-slate-200 bg-white"
              }`}
            >
              <p className="font-semibold text-[#0F172A]">{t}</p>
              <p className="mt-1 text-xs text-slate-500">ATS-friendly layout preview</p>
            </button>
          ))}
        </div>
      </Modal>

    </div>
  );
}

