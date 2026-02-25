// frontend/src/pages/student/Profile.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@clerk/clerk-react";
import {
  FiBook,
  FiBriefcase,
  FiChevronDown,
  FiChevronUp,
  FiMapPin,
  FiSave,
  FiUploadCloud,
  FiUser,
  FiTrash2,
} from "react-icons/fi";

import { studentMe, studentUpdateProfile } from "../../services/studentService.js";
import { uploadResume } from "../../services/uploadService.js";

const EMPTY = {
  personal: {
    fullName: "",
    email: "",
    phone: "",
    dob: "",
    gender: "Male",
    address: "",
    city: "",
    state: "",
    location: "",
    linkedin: "",
    portfolio: "",
  },
  education: [],
  skills: [],
  fresher: true,
  experience: [{ id: "ex1", company: "", role: "", years: "", description: "" }],
  preferred: {
    stream: "",
    category: "",
    subcategory: "",
    locations: "",
    salary: "",
    workMode: "Hybrid",
  },
  resume: { fileName: "", size: "", updatedAt: "" },
};

const safeObj = (x) => (x && typeof x === "object" ? x : {});
const safeArr = (x) => (Array.isArray(x) ? x : []);

const initials = (name) =>
  String(name || "Student")
    .trim()
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase() || "")
    .join("");

function Toggle({ checked, onChange }) {
  return (
    <button
      type="button"
      onClick={onChange}
      className={`relative h-6 w-11 rounded-full transition ${
        checked ? "bg-[#2563EB]" : "bg-slate-300"
      }`}
    >
      <span
        className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition ${
          checked ? "left-[22px]" : "left-0.5"
        }`}
      />
    </button>
  );
}

function Card({ icon, title, open, onToggle, children }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-[#2563EB]">
            {icon}
          </span>
          <h3 className="font-semibold text-[#0F172A]">{title}</h3>
        </div>
        <button
          type="button"
          onClick={onToggle}
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
        >
          {open ? <FiChevronUp /> : <FiChevronDown />}
        </button>
      </div>
      {open ? <div className="border-t border-slate-100 px-4 py-4">{children}</div> : null}
    </section>
  );
}

/** Skills: accept any format */
function parseSkillsText(value = "") {
  return String(value)
    .split(/[\n,;/|]+/g)
    .map((s) => s.trim())
    .filter(Boolean);
}

function normalizeSkillsForUi(skills = []) {
  const seen = new Set();
  const out = [];

  safeArr(skills)
    .flatMap((s) => parseSkillsText(typeof s === "string" ? s : s?.name || s?.skill || ""))
    .forEach((name) => {
      const key = name.toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        out.push({ id: `sk_${Date.now()}_${out.length}`, name });
      }
    });

  return out;
}

function normalizedSkillCount(skills = []) {
  return safeArr(skills)
    .flatMap((s) => parseSkillsText(typeof s === "string" ? s : s?.name || s?.skill || ""))
    .length;
}

function hasValidEducation(education = []) {
  return safeArr(education).some((e) => e?.degree && e?.college && e?.year);
}

/** Education bulk paste */
function parseEducationBulk(text = "") {
  const lines = String(text)
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  const out = [];
  for (const line of lines) {
    const parts = line.split(/[|,-]+/g).map((p) => p.trim()).filter(Boolean);
    if (parts.length >= 3) {
      out.push({
        id: `ed_${Date.now()}_${out.length}`,
        degree: parts[0] || "",
        college: parts[1] || "",
        year: parts[2] || "",
        branch: parts[3] || "",
        score: parts[4] || "",
        marksheet: "",
      });
    }
  }
  return out;
}

function mapProfileToForm(me = {}) {
  const p = safeObj(me.studentProfile);
  const preferred = safeObj(p.preferred);
  const preferredLocations = Array.isArray(preferred.locations)
    ? preferred.locations.join(", ")
    : preferred.locations || "";

  return {
    personal: {
      fullName: p.personal?.fullName || me.name || "",
      email: p.personal?.email || me.email || "",
      phone: p.personal?.phone || me.phone || "",
      dob: p.personal?.dob || "",
      gender: p.personal?.gender || "Male",
      address: p.personal?.address || "",
      city: p.personal?.city || "",
      state: p.personal?.state || "",
      location: p.personal?.location || me.location || "",
      linkedin: p.personal?.linkedin || me.linkedin || "",
      portfolio: p.personal?.portfolio || me.portfolio || "",
    },
    education: safeArr(p.education).map((e, idx) => ({
      id: e.id || `ed_${idx}_${Date.now()}`,
      degree: e.degree || "",
      college: e.college || "",
      year: e.year || "",
      branch: e.branch || "",
      score: e.score || "",
      marksheet: e.marksheet || "",
    })),
    skills: safeArr(p.skills).map((s, idx) =>
      typeof s === "string"
        ? { id: `sk_${idx}_${Date.now()}`, name: s }
        : { id: s.id || `sk_${idx}_${Date.now()}`, name: s.name || s.skill || "" }
    ),
    fresher: p.fresher !== undefined ? !!p.fresher : true,
    experience: safeArr(p.experience).length
      ? safeArr(p.experience).map((x, idx) => ({
          id: x.id || `ex_${idx}_${Date.now()}`,
          company: x.company || "",
          role: x.role || "",
          years: x.years || "",
          description: x.description || "",
        }))
      : [{ id: "ex1", company: "", role: "", years: "", description: "" }],
    preferred: {
      stream: preferred.stream || "",
      category: preferred.category || "",
      subcategory: preferred.subcategory || preferred.subCategory || "",
      locations: preferredLocations,
      salary: preferred.salary || preferred.expectedSalary || "",
      workMode: preferred.workMode || "Hybrid",
    },
    resume: {
      fileName: p.resumeMeta?.fileName || (me.resumeUrl ? "Uploaded Resume" : ""),
      size: p.resumeMeta?.size || "",
      updatedAt: p.resumeMeta?.updatedAt || "",
    },
  };
}

export default function Profile() {
  const { getToken } = useAuth();
  const resumeInputRef = useRef(null);

  const [expanded, setExpanded] = useState({
    personal: true,
    education: false,
    skills: false,
    experience: false,
    preferred: false,
    resume: true,
  });

  const [form, setForm] = useState(EMPTY);
  const [initialForm, setInitialForm] = useState(EMPTY);

  const [skillInput, setSkillInput] = useState("");
  const [skillsBulk, setSkillsBulk] = useState("");
  const [educationBulk, setEducationBulk] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingResume, setUploadingResume] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [toast, setToast] = useState("");

  const openResumePicker = () => resumeInputRef.current?.click();

  const setField = (path, value) => {
    setForm((prev) => ({ ...prev, [path[0]]: { ...prev[path[0]], [path[1]]: value } }));
    setDirty(true);
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const token = await getToken();
        const me = (await studentMe(token))?.data || {};
        const next = mapProfileToForm(me);
        next.skills = normalizeSkillsForUi(next.skills);

        if (!mounted) return;
        setForm(next);
        setInitialForm(next);
        setDirty(false);
      } catch (e) {
        setToast("Failed to load profile");
      } finally {
        if (mounted) setLoading(false);
        setTimeout(() => setToast(""), 1800);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [getToken]);

  const completion = useMemo(() => {
    const checks = {
      personal: !!(form.personal.fullName && form.personal.phone && form.personal.city && form.personal.state),
      education: hasValidEducation(form.education),
      skills: normalizedSkillCount(form.skills) >= 2,
      experience: form.fresher || form.experience.some((e) => e.company && e.role),
      resume: !!form.resume.fileName,
      preferred: !!(form.preferred.stream && form.preferred.category && form.preferred.locations),
    };
    const done = Object.values(checks).filter(Boolean).length;
    return { checks, value: Math.round((done / Object.keys(checks).length) * 100) };
  }, [form]);

  const onPickResume = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingResume(true);

      const token = await getToken();
      const res = await uploadResume(file, token);

      const meta = res?.data?.resumeMeta || {};
      setForm((prev) => ({
        ...prev,
        resume: {
          ...prev.resume,
          fileName: meta.fileName || file.name,
          size: meta.size || `${Math.max(1, Math.round(file.size / 1024))} KB`,
          updatedAt: meta.updatedAt || new Date().toISOString(),
        },
      }));

      setDirty(true);
      setToast("Resume uploaded & saved successfully");
    } catch (err) {
      setToast(err?.response?.data?.message || "Resume upload failed");
    } finally {
      setUploadingResume(false);
      e.target.value = "";
      setTimeout(() => setToast(""), 1800);
    }
  };

  const save = async () => {
    try {
      setSaving(true);

      const token = await getToken();

      const cleanEducation = safeArr(form.education).map(({ id, ...rest }) => rest);
      const cleanExperience = safeArr(form.experience).map(({ id, ...rest }) => rest);
      const cleanSkills = safeArr(form.skills)
        .flatMap((s) => parseSkillsText(typeof s === "string" ? s : s?.name || s?.skill || ""))
        .map((s) => s.trim())
        .filter(Boolean);

      const payload = {
        name: form.personal.fullName,
        phone: form.personal.phone,
        location: form.personal.location,
        linkedin: form.personal.linkedin,
        portfolio: form.personal.portfolio,
        studentProfile: {
          personal: form.personal,
          education: cleanEducation,
          skills: cleanSkills,
          fresher: form.fresher,
          experience: cleanExperience,
          preferred: {
            ...form.preferred,
            subCategory: form.preferred.subcategory || "",
            expectedSalary: form.preferred.salary || "",
          },
          resumeMeta: form.resume,
        },
      };

      const updated = (await studentUpdateProfile(payload, token))?.data || {};
      const next = mapProfileToForm(updated);
      next.skills = normalizeSkillsForUi(next.skills);

      setForm(next);
      setInitialForm(next);
      setDirty(false);
      setToast("Profile saved successfully");
    } catch (e) {
      setToast(e?.response?.data?.message || "Save failed");
    } finally {
      setSaving(false);
      setTimeout(() => setToast(""), 1800);
    }
  };

  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold text-slate-700">Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="space-y-5 bg-[#F8FAFC] px-4 pb-24 pt-6 sm:px-6 lg:px-8">
      <section>
        <h1 className="text-3xl font-bold text-[#0F172A]">My Profile</h1>
        <p className="mt-1 text-sm text-slate-500">Complete your profile to get shortlisted faster</p>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-4">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 text-xl font-semibold text-[#2563EB]">
              {initials(form.personal.fullName) || "S"}
            </div>
            <div>
              <p className="text-xl font-semibold text-[#0F172A]">{form.personal.fullName || "Student"}</p>
              <p className="text-sm text-slate-600">
                {form.personal.email || "-"} | {form.personal.phone || "-"}
              </p>
              <p className="mt-1 inline-flex items-center gap-1 text-sm text-slate-500">
                <FiMapPin /> {form.personal.location || "-"}
              </p>
            </div>
          </div>

          <div className="w-full max-w-sm">
            <div className="mb-1 flex items-center justify-between text-sm">
              <span className="font-medium text-slate-600">Profile Completion</span>
              <span className="font-semibold text-[#0F172A]">{completion.value}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-slate-100">
              <div className="h-full bg-[#F97316]" style={{ width: `${completion.value}%` }} />
            </div>
          </div>
        </div>
      </section>

      {/* PERSONAL */}
      <Card
        icon={<FiUser />}
        title="Personal Details"
        open={expanded.personal}
        onToggle={() => setExpanded((p) => ({ ...p, personal: !p.personal }))}
      >
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <input
            value={form.personal.fullName}
            onChange={(e) => setField(["personal", "fullName"], e.target.value)}
            placeholder="Full Name"
            className="h-10 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-blue-300"
          />
          <input
            value={form.personal.email}
            readOnly
            className="h-10 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-500 outline-none"
          />
          <input
            value={form.personal.phone}
            onChange={(e) => setField(["personal", "phone"], e.target.value)}
            placeholder="Phone"
            className="h-10 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-blue-300"
          />
          <input
            value={form.personal.city}
            onChange={(e) => setField(["personal", "city"], e.target.value)}
            placeholder="City"
            className="h-10 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-blue-300"
          />
          <input
            value={form.personal.state}
            onChange={(e) => setField(["personal", "state"], e.target.value)}
            placeholder="State"
            className="h-10 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-blue-300"
          />
          <input
            value={form.personal.location}
            onChange={(e) => setField(["personal", "location"], e.target.value)}
            placeholder="Location"
            className="h-10 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-blue-300"
          />
          <input
            value={form.personal.linkedin}
            onChange={(e) => setField(["personal", "linkedin"], e.target.value)}
            placeholder="LinkedIn URL (optional)"
            className="h-10 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-blue-300"
          />
          <input
            value={form.personal.portfolio}
            onChange={(e) => setField(["personal", "portfolio"], e.target.value)}
            placeholder="Portfolio URL (optional)"
            className="h-10 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-blue-300"
          />
        </div>
      </Card>

      {/* EDUCATION */}
      <Card
        icon={<FiBook />}
        title="Education"
        open={expanded.education}
        onToggle={() => setExpanded((p) => ({ ...p, education: !p.education }))}
      >
        <div className="space-y-3">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <p className="text-xs font-semibold text-slate-700">Bulk Paste (any format)</p>
            <p className="mt-1 text-xs text-slate-500">
              Example lines: <span className="font-mono">B.Tech | ABC College | 2026</span>
            </p>
            <textarea
              value={educationBulk}
              onChange={(e) => setEducationBulk(e.target.value)}
              placeholder={`Paste multiple lines...\nB.Tech | Srinivas University | 2026\nPUC | XYZ College | 2022`}
              className="mt-2 h-24 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-300"
            />
            <div className="mt-2 flex gap-2">
              <button
                type="button"
                onClick={() => {
                  const rows = parseEducationBulk(educationBulk);
                  if (!rows.length) return;
                  setForm((p) => ({ ...p, education: [...p.education, ...rows] }));
                  setEducationBulk("");
                  setDirty(true);
                }}
                className="rounded-lg bg-[#2563EB] px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700"
              >
                Add From Paste
              </button>
              <button
                type="button"
                onClick={() => setEducationBulk("")}
                className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Clear
              </button>
            </div>
          </div>

          {form.education.map((ed) => (
            <div
              key={ed.id}
              className="grid grid-cols-1 gap-3 rounded-xl border border-slate-200 bg-slate-50/60 p-3 md:grid-cols-4"
            >
              <input
                value={ed.degree}
                onChange={(e) => {
                  setForm((p) => ({
                    ...p,
                    education: p.education.map((x) => (x.id === ed.id ? { ...x, degree: e.target.value } : x)),
                  }));
                  setDirty(true);
                }}
                placeholder="Degree"
                className="h-10 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-blue-300"
              />
              <input
                value={ed.college}
                onChange={(e) => {
                  setForm((p) => ({
                    ...p,
                    education: p.education.map((x) => (x.id === ed.id ? { ...x, college: e.target.value } : x)),
                  }));
                  setDirty(true);
                }}
                placeholder="College"
                className="h-10 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-blue-300"
              />
              <input
                value={ed.year}
                onChange={(e) => {
                  setForm((p) => ({
                    ...p,
                    education: p.education.map((x) => (x.id === ed.id ? { ...x, year: e.target.value } : x)),
                  }));
                  setDirty(true);
                }}
                placeholder="Year"
                className="h-10 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-blue-300"
              />
              <button
                type="button"
                onClick={() => {
                  setForm((p) => ({ ...p, education: p.education.filter((x) => x.id !== ed.id) }));
                  setDirty(true);
                }}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                <FiTrash2 /> Remove
              </button>
            </div>
          ))}

          <button
            type="button"
            onClick={() => {
              setForm((p) => ({
                ...p,
                education: [
                  ...p.education,
                  { id: `ed_${Date.now()}`, degree: "", college: "", year: "", branch: "", score: "", marksheet: "" },
                ],
              }));
              setDirty(true);
            }}
            className="rounded-lg border border-blue-200 px-3 py-2 text-sm font-semibold text-[#2563EB] hover:bg-blue-50"
          >
            + Add Education
          </button>
        </div>
      </Card>

      {/* SKILLS */}
      <Card
        icon={<FiBook />}
        title="Skills"
        open={expanded.skills}
        onToggle={() => setExpanded((p) => ({ ...p, skills: !p.skills }))}
      >
        <div className="space-y-3">
          <div className="flex gap-2">
            <input
              value={skillInput}
              onChange={(e) => setSkillInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key !== "Enter") return;
                e.preventDefault();
                const parsed = parseSkillsText(skillInput);
                if (!parsed.length) return;
                setForm((p) => ({ ...p, skills: normalizeSkillsForUi([...p.skills, ...parsed]) }));
                setSkillInput("");
                setDirty(true);
              }}
              placeholder="Add skill (React, Java, SQL...)"
              className="h-10 flex-1 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-blue-300"
            />
            <button
              type="button"
              onClick={() => {
                const parsed = parseSkillsText(skillInput);
                if (!parsed.length) return;
                setForm((p) => ({ ...p, skills: normalizeSkillsForUi([...p.skills, ...parsed]) }));
                setSkillInput("");
                setDirty(true);
              }}
              className="rounded-lg bg-[#2563EB] px-4 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Add
            </button>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <p className="text-xs font-semibold text-slate-700">Paste Skills (any format)</p>
            <p className="mt-1 text-xs text-slate-500">Comma / newline / slash / semicolon supported.</p>
            <textarea
              value={skillsBulk}
              onChange={(e) => setSkillsBulk(e.target.value)}
              placeholder={`React, Node.js, MongoDB\nJava / SQL / Docker`}
              className="mt-2 h-24 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-300"
            />
            <div className="mt-2 flex gap-2">
              <button
                type="button"
                onClick={() => {
                  const parsed = parseSkillsText(skillsBulk);
                  if (!parsed.length) return;
                  setForm((p) => ({ ...p, skills: normalizeSkillsForUi([...p.skills, ...parsed]) }));
                  setSkillsBulk("");
                  setDirty(true);
                }}
                className="rounded-lg bg-[#2563EB] px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700"
              >
                Add From Paste
              </button>
              <button
                type="button"
                onClick={() => setSkillsBulk("")}
                className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Clear
              </button>
              <button
                type="button"
                onClick={() => {
                  setForm((p) => ({ ...p, skills: [] }));
                  setDirty(true);
                }}
                className="ml-auto rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Clear All
              </button>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {form.skills.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => {
                  setForm((p) => ({ ...p, skills: p.skills.filter((x) => x.id !== s.id) }));
                  setDirty(true);
                }}
                className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                title="Click to remove"
              >
                {s.name} ✕
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* EXPERIENCE */}
      <Card
        icon={<FiBriefcase />}
        title="Experience"
        open={expanded.experience}
        onToggle={() => setExpanded((p) => ({ ...p, experience: !p.experience }))}
      >
        <label className="mb-3 inline-flex items-center gap-2 text-sm text-slate-700">
          <Toggle
            checked={form.fresher}
            onChange={() => {
              setForm((p) => ({ ...p, fresher: !p.fresher }));
              setDirty(true);
            }}
          />{" "}
          Fresher
        </label>

        {!form.fresher ? (
          <div className="space-y-3">
            {form.experience.map((ex) => (
              <div
                key={ex.id}
                className="grid grid-cols-1 gap-3 rounded-xl border border-slate-200 bg-slate-50/60 p-3 md:grid-cols-3"
              >
                <input
                  value={ex.company}
                  onChange={(e) => {
                    setForm((p) => ({
                      ...p,
                      experience: p.experience.map((x) => (x.id === ex.id ? { ...x, company: e.target.value } : x)),
                    }));
                    setDirty(true);
                  }}
                  placeholder="Company"
                  className="h-10 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-blue-300"
                />
                <input
                  value={ex.role}
                  onChange={(e) => {
                    setForm((p) => ({
                      ...p,
                      experience: p.experience.map((x) => (x.id === ex.id ? { ...x, role: e.target.value } : x)),
                    }));
                    setDirty(true);
                  }}
                  placeholder="Role"
                  className="h-10 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-blue-300"
                />
                <button
                  type="button"
                  onClick={() => {
                    setForm((p) => ({ ...p, experience: p.experience.filter((x) => x.id !== ex.id) }));
                    setDirty(true);
                  }}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  <FiTrash2 /> Remove
                </button>
              </div>
            ))}

            <button
              type="button"
              onClick={() => {
                setForm((p) => ({
                  ...p,
                  experience: [...p.experience, { id: `ex_${Date.now()}`, company: "", role: "", years: "", description: "" }],
                }));
                setDirty(true);
              }}
              className="rounded-lg border border-blue-200 px-3 py-2 text-sm font-semibold text-[#2563EB] hover:bg-blue-50"
            >
              + Add Experience
            </button>
          </div>
        ) : null}
      </Card>

      {/* PREFERRED */}
      <Card
        icon={<FiBriefcase />}
        title="Preferred Job Settings"
        open={expanded.preferred}
        onToggle={() => setExpanded((p) => ({ ...p, preferred: !p.preferred }))}
      >
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <input
            value={form.preferred.stream}
            onChange={(e) => setField(["preferred", "stream"], e.target.value)}
            placeholder="Main Stream"
            className="h-10 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-blue-300"
          />
          <input
            value={form.preferred.category}
            onChange={(e) => setField(["preferred", "category"], e.target.value)}
            placeholder="Category"
            className="h-10 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-blue-300"
          />
          <input
            value={form.preferred.subcategory}
            onChange={(e) => setField(["preferred", "subcategory"], e.target.value)}
            placeholder="Subcategory"
            className="h-10 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-blue-300"
          />
          <input
            value={form.preferred.locations}
            onChange={(e) => setField(["preferred", "locations"], e.target.value)}
            placeholder="Preferred Location(s)"
            className="h-10 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-blue-300"
          />
          <input
            value={form.preferred.salary}
            onChange={(e) => setField(["preferred", "salary"], e.target.value)}
            placeholder="Expected Salary (optional)"
            className="h-10 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-blue-300"
          />
          <select
            value={form.preferred.workMode}
            onChange={(e) => setField(["preferred", "workMode"], e.target.value)}
            className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-blue-300"
          >
            <option>Remote</option>
            <option>On-site</option>
            <option>Hybrid</option>
          </select>
        </div>
      </Card>

      {/* RESUME */}
      <Card
        icon={<FiUploadCloud />}
        title="Resume Upload"
        open={expanded.resume}
        onToggle={() => setExpanded((p) => ({ ...p, resume: !p.resume }))}
      >
        <div className="rounded-xl border border-dashed border-blue-200 bg-blue-50/40 p-4 text-sm text-slate-600">
          <input
            ref={resumeInputRef}
            type="file"
            accept=".pdf,.doc,.docx"
            className="hidden"
            onChange={onPickResume}
          />

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={openResumePicker}
              disabled={uploadingResume}
              className="rounded-lg border border-blue-200 bg-white px-3 py-2 text-sm font-semibold text-[#2563EB] hover:bg-blue-50 disabled:opacity-60"
            >
              {uploadingResume ? "Uploading..." : "Choose from Device"}
            </button>

            <Link
              to="/student/resume-builder"
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Open Resume Builder
            </Link>
          </div>

          <p className="mt-3 text-xs text-slate-500">
            {form.resume.fileName ? `Current file: ${form.resume.fileName}` : "No resume uploaded yet."}
          </p>

          {form.resume.updatedAt ? (
            <p className="mt-1 text-xs text-slate-500">
              Last updated: {new Date(form.resume.updatedAt).toLocaleString()}
            </p>
          ) : null}
        </div>
      </Card>

      {/* Bottom bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-[1200px] flex-wrap items-center justify-end gap-2 px-4 py-3 sm:px-6 lg:px-8">
          <button
            type="button"
            onClick={save}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-lg bg-[#2563EB] px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
          >
            <FiSave /> {saving ? "Saving..." : "Save Changes"}
          </button>

          <button
            type="button"
            onClick={() => {
              setForm(initialForm);
              setDirty(false);
            }}
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={() => {
              setForm(EMPTY);
              setDirty(true);
            }}
            className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-500 hover:bg-slate-100"
          >
            Reset
          </button>
        </div>
      </div>

      {toast ? (
        <div className="fixed bottom-20 right-4 z-50 rounded-lg bg-[#0F172A] px-4 py-2 text-sm font-semibold text-white shadow-lg">
          {toast}
        </div>
      ) : null}

      {dirty ? (
        <div className="fixed bottom-20 left-4 z-50 rounded-lg border border-orange-200 bg-orange-50 px-3 py-2 text-xs font-semibold text-[#9A3412] shadow-sm">
          You have unsaved changes
        </div>
      ) : null}
    </div>
  );
}
