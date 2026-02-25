import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiPlus, FiTrash2 } from "react-icons/fi";
import Modal from "../../components/common/Modal.jsx";
import { createCompanyJob } from "../../services/companyService";

function Card({ title, subtitle, children }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3">
        <h3 className="text-base font-semibold text-[#0F172A]">{title}</h3>
        {subtitle ? <p className="mt-1 text-xs text-slate-500">{subtitle}</p> : null}
      </div>
      {children}
    </section>
  );
}

function Toggle({ checked, onChange, tone = "blue" }) {
  const bg = checked ? (tone === "orange" ? "bg-[#F97316]" : "bg-[#2563EB]") : "bg-slate-300";
  return (
    <button type="button" onClick={onChange} className={`relative h-5 w-10 rounded-full transition ${bg}`}>
      <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition ${checked ? "left-[22px]" : "left-0.5"}`} />
    </button>
  );
}

function Input({ className = "", ...props }) {
  return <input {...props} className={`h-10 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-blue-300 ${className}`} />;
}

function Select({ className = "", children, ...props }) {
  return <select {...props} className={`h-10 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-blue-300 ${className}`}>{children}</select>;
}

const screeningTypes = ["Yes/No", "Multiple choice", "Short answer", "Long answer", "Number"];
const OTHER_OPTION = "__other__";
const JOB_TAXONOMY = {
  "IT & Software": {
    Development: ["Frontend", "Backend", "Full Stack", "Mobile"],
    Testing: ["Manual Testing", "Automation Testing"],
    Data: ["Data Analyst", "Data Engineer", "ML Engineer"],
    DevOps: ["AWS DevOps", "Azure DevOps", "Kubernetes"],
    "Cyber Security": ["SOC Analyst", "Penetration Tester", "GRC"],
  },
  "Medical & Healthcare": {
    Nursing: ["Staff Nurse", "ICU Nurse", "OT Nurse"],
    Pharmacy: ["Pharmacist", "Assistant Pharmacist"],
    Lab: ["Lab Technician", "Phlebotomist"],
    "Hospital Admin": ["Front Office", "Billing Executive"],
  },
  Marketing: {
    "Digital Marketing": ["SEO", "SEM", "Social Media"],
    Sales: ["Inside Sales", "Field Sales"],
    Content: ["Content Writer", "Copywriter"],
  },
  Education: {
    Teaching: ["Primary Teacher", "Lecturer"],
    Administration: ["Coordinator", "Office Admin"],
  },
  Finance: {
    Banking: ["Teller", "Relationship Manager"],
    Accounts: ["Accountant", "Junior Accountant"],
  },
};

function resolveHierarchyValue(value, otherValue) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  if (raw === OTHER_OPTION || raw.toLowerCase() === "other") return String(otherValue || "").trim();
  return raw;
}
function normalizePayload(form, questions, status) {
  const { streamOther, categoryOther, subCategoryOther, ...rest } = form;
  return {
    ...rest,
    status,
    stream: resolveHierarchyValue(form.stream, streamOther),
    category: resolveHierarchyValue(form.category, categoryOther),
    subCategory: resolveHierarchyValue(form.subCategory, subCategoryOther),
    salaryMin: Number(form.salaryMin || 0),
    salaryMax: Number(form.salaryMax || 0),
    skills: String(form.skills || "")
      .split(",")
      .map((x) => x.trim())
      .filter(Boolean),
    questions: (questions || [])
      .map((q) => ({
        ...q,
        text: String(q.text || "").trim(),
        options: Array.isArray(q.options) ? q.options.map((x) => String(x).trim()).filter(Boolean) : [],
      }))
      .filter((q) => q.text),
  };
}

export default function PostJob() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: "",
    stream: "IT & Software",
    category: "Development",
    subCategory: "Frontend",
    streamOther: "",
    categoryOther: "",
    subCategoryOther: "",
    jobType: "Full-time",
    workMode: "Hybrid",
    city: "",
    state: "",
    openings: 1,
    deadline: "",

    experience: "Fresher",
    salaryType: "Yearly",
    salaryMin: "",
    salaryMax: "",
    benefits: "",
    showSalary: true,

    overview: "",
    responsibilities: "",
    requirements: "",
    skills: "",

    requireResume: true,
    requireProfile100: true,
    oneClickApply: true,
    allowWhatsapp: true,
    allowCall: false,
    allowEmailThread: true,

    enableAiRanking: false,
    skillsWeight: 35,
    experienceWeight: 25,
    educationWeight: 15,
    screeningWeight: 25,
    autoHighlightTop10: true,
    autoTagMatch: true,
    allowInterviewSuggestions: true,

    boostJob: false,
    boostDays: "7 days",
  });

  const [questions, setQuestions] = useState([
    {
      id: "q1",
      text: "",
      type: "Yes/No",
      required: true,
      knockout: true,
      knockoutRule: true,
      options: ["Yes", "No"],
    },
  ]);
  const [publishOpen, setPublishOpen] = useState(false);
  const [toast, setToast] = useState("");
  const [saving, setSaving] = useState(false);

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));
  const mainStreamOptions = useMemo(() => Object.keys(JOB_TAXONOMY), []);
  const categoryOptions = useMemo(() => {
    if (!form.stream || form.stream === OTHER_OPTION) return [];
    return Object.keys(JOB_TAXONOMY[form.stream] || {});
  }, [form.stream]);
  const subCategoryOptions = useMemo(() => {
    if (!form.stream || !form.category) return [];
    if (form.stream === OTHER_OPTION || form.category === OTHER_OPTION) return [];
    return JOB_TAXONOMY[form.stream]?.[form.category] || [];
  }, [form.stream, form.category]);

  const onStreamChange = (value) => {
    setForm((prev) => ({
      ...prev,
      stream: value,
      streamOther: value === OTHER_OPTION ? prev.streamOther : "",
      category: "",
      categoryOther: "",
      subCategory: "",
      subCategoryOther: "",
    }));
  };
  const onCategoryChange = (value) => {
    setForm((prev) => ({
      ...prev,
      category: value,
      categoryOther: value === OTHER_OPTION ? prev.categoryOther : "",
      subCategory: "",
      subCategoryOther: "",
    }));
  };
  const addQuestion = () =>
    setQuestions((prev) => [
      ...prev,
      {
        id: `q${Date.now()}`,
        text: "",
        type: "Short answer",
        required: true,
        knockout: false,
        knockoutRule: false,
        options: ["Option 1", "Option 2"],
      },
    ]);

  const updateQuestion = (id, key, value) => {
    setQuestions((prev) => prev.map((q) => (q.id === id ? { ...q, [key]: value } : q)));
  };

  const removeQuestion = (id) => setQuestions((prev) => prev.filter((q) => q.id !== id));

  const addOption = (id) => {
    setQuestions((prev) =>
      prev.map((q) => (q.id === id ? { ...q, options: [...(q.options || []), `Option ${(q.options?.length || 0) + 1}`] } : q))
    );
  };

  const review = useMemo(
    () => ({
      title: form.title || "Untitled Role",
      location: [form.city, form.state].filter(Boolean).join(", ") || "Not set",
      salary: form.salaryMin && form.salaryMax ? `${form.salaryMin} - ${form.salaryMax}` : "Not set",
      type: `${form.jobType} • ${form.workMode}`,
      screeningCount: questions.length,
    }),
    [form, questions.length]
  );

  const actionToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 1300);
  };

  const saveJob = async (status) => {
    if (!form.title.trim()) {
      actionToast("Job title is required");
      return;
    }

    const payload = normalizePayload(form, questions, status);
    if (!payload.stream || !payload.category || !payload.subCategory) {
      actionToast("Select Main Stream, Category and Sub Category");
      return;
    }

    setSaving(true);
    try {
      await createCompanyJob(payload);
      setPublishOpen(false);
      actionToast(status === "Draft" ? "Draft saved" : "Job published successfully");
      navigate("/company/my-jobs");
    } catch (err) {
      console.error(err);
      setPublishOpen(false);
      actionToast(err?.response?.data?.message || "Action failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5 pb-20 md:pb-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold text-slate-500">Dashboard {">"} Post Job</p>
          <h1 className="mt-1 text-2xl font-bold text-[#0F172A]">Post a New Job</h1>
          <p className="mt-1 text-sm text-slate-500">Create a job listing and start receiving applications</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => saveJob("Draft")} disabled={saving} className="rounded-xl border border-blue-200 px-4 py-2 text-sm font-semibold text-[#2563EB] hover:bg-blue-50 disabled:opacity-60">Save Draft</button>
          <button type="button" className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50" onClick={() => actionToast("Review details in Section 8")}>Preview</button>
          <button type="button" onClick={() => setPublishOpen(true)} className="rounded-xl bg-[#2563EB] px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">Publish Job</button>
        </div>
      </header>

      <div className="rounded-2xl border border-slate-200 bg-white p-2">
        <div className="flex flex-wrap gap-2 text-xs font-semibold">
          {["Job Info", "Requirements", "Screening", "Review & Publish"].map((s, i) => (
            <span key={s} className={`rounded-full px-3 py-1 ${i === 0 ? "bg-blue-50 text-[#2563EB]" : "bg-slate-100 text-slate-600"}`}>{s}</span>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        <Card
          title="Section 1 - Job Basic Information"
          subtitle="Select Main Stream -> Category -> Sub Category so students can find the job correctly."
        >
          <div className="mb-2 rounded-lg border border-orange-200 bg-orange-50 px-3 py-2 text-xs text-[#9A3412]">
            Example: Main Stream = IT &amp; Software, Category = Development, Sub Category = Frontend.
          </div>
          <div className="grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-3">
            <Input value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="Job Title" />
            <div>
              <Select value={form.stream} onChange={(e) => onStreamChange(e.target.value)} className="w-full">
                <option value="">Main Stream (e.g., IT & Software)</option>
                {mainStreamOptions.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
                <option value={OTHER_OPTION}>Other</option>
              </Select>
              {form.stream === OTHER_OPTION ? (
                <Input
                  value={form.streamOther}
                  onChange={(e) => set("streamOther", e.target.value)}
                  placeholder="Enter custom main stream (e.g., Medical)"
                  className="mt-2 w-full"
                />
              ) : null}
            </div>
            <div>
              <Select value={form.category} onChange={(e) => onCategoryChange(e.target.value)} disabled={!form.stream} className="w-full disabled:bg-slate-50">
                <option value="">Category (e.g., Development)</option>
                {categoryOptions.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
                {form.stream ? <option value={OTHER_OPTION}>Other</option> : null}
              </Select>
              {form.category === OTHER_OPTION ? (
                <Input
                  value={form.categoryOther}
                  onChange={(e) => set("categoryOther", e.target.value)}
                  placeholder="Enter custom category"
                  className="mt-2 w-full"
                />
              ) : null}
            </div>
            <div>
              <Select
                value={form.subCategory}
                onChange={(e) => set("subCategory", e.target.value)}
                disabled={!form.category}
                className="w-full disabled:bg-slate-50"
              >
                <option value="">Sub Category (e.g., Frontend)</option>
                {subCategoryOptions.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
                {form.category ? <option value={OTHER_OPTION}>Other</option> : null}
              </Select>
              {form.subCategory === OTHER_OPTION ? (
                <Input
                  value={form.subCategoryOther}
                  onChange={(e) => set("subCategoryOther", e.target.value)}
                  placeholder="Enter custom sub category"
                  className="mt-2 w-full"
                />
              ) : null}
            </div>
            <Select value={form.jobType} onChange={(e) => set("jobType", e.target.value)}><option>Full-time</option><option>Part-time</option><option>Internship</option></Select>
            <Select value={form.workMode} onChange={(e) => set("workMode", e.target.value)}><option>On-site</option><option>Remote</option><option>Hybrid</option></Select>
            <Input value={form.city} onChange={(e) => set("city", e.target.value)} placeholder="City" />
            <Input value={form.state} onChange={(e) => set("state", e.target.value)} placeholder="State" />
            <Input type="number" min={1} value={form.openings} onChange={(e) => set("openings", Number(e.target.value || 1))} placeholder="Openings" />
            <Input type="date" value={form.deadline} onChange={(e) => set("deadline", e.target.value)} className="md:col-span-2 lg:col-span-1" />
          </div>
        </Card>

        <Card title="Section 2 - Salary & Experience">
          <div className="grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-3">
            <Select value={form.experience} onChange={(e) => set("experience", e.target.value)}><option>Fresher</option><option>1-2</option><option>3-5</option><option>5+</option></Select>
            <Select value={form.salaryType} onChange={(e) => set("salaryType", e.target.value)}><option>Monthly</option><option>Yearly</option></Select>
            <Input value={form.salaryMin} onChange={(e) => set("salaryMin", e.target.value)} placeholder="Salary Min" />
            <Input value={form.salaryMax} onChange={(e) => set("salaryMax", e.target.value)} placeholder="Salary Max" />
            <Input value={form.benefits} onChange={(e) => set("benefits", e.target.value)} placeholder="Benefits (comma separated)" className="md:col-span-2 lg:col-span-1" />
            <div className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700">
              <span>Show salary publicly</span>
              <Toggle checked={form.showSalary} onChange={() => set("showSalary", !form.showSalary)} />
            </div>
          </div>
        </Card>

        <Card title="Section 3 - Job Description">
          <div className="grid grid-cols-1 gap-2">
            <textarea value={form.overview} onChange={(e) => set("overview", e.target.value)} rows={3} placeholder="Overview" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-300" />
            <textarea value={form.responsibilities} onChange={(e) => set("responsibilities", e.target.value)} rows={4} placeholder="Responsibilities (bulleted)" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-300" />
            <textarea value={form.requirements} onChange={(e) => set("requirements", e.target.value)} rows={4} placeholder="Requirements (bulleted)" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-300" />
            <Input value={form.skills} onChange={(e) => set("skills", e.target.value)} placeholder="Skills Required (tags by comma)" />
          </div>
        </Card>

        <Card title="Section 4 - Application Settings" subtitle="One-click apply uses candidate profile & uploaded resume.">
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {[
              ["Require Resume Upload", "requireResume"],
              ["Require Profile 100% completion", "requireProfile100"],
              ["One-Click Apply enabled", "oneClickApply"],
              ["Allow WhatsApp contact button", "allowWhatsapp"],
              ["Allow Call Now button", "allowCall"],
              ["Allow Email reply thread", "allowEmailThread"],
            ].map(([label, key]) => (
              <div key={key} className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700">
                <span>{label}</span>
                <Toggle checked={form[key]} onChange={() => set(key, !form[key])} />
              </div>
            ))}
          </div>
        </Card>

        <Card title="Section 5 - Pre-Screening Questions" subtitle="Pre-screening questions help filter candidates before review.">
          <div className="mb-3">
            <button type="button" onClick={addQuestion} className="inline-flex items-center gap-1 rounded-lg border border-blue-200 px-3 py-2 text-sm font-semibold text-[#2563EB] hover:bg-blue-50">
              <FiPlus /> Add Question
            </button>
          </div>
          <div className="space-y-3">
            {questions.map((q) => (
              <div key={q.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <div className="grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-4">
                  <Input value={q.text} onChange={(e) => updateQuestion(q.id, "text", e.target.value)} placeholder="Question text" className="lg:col-span-2" />
                  <Select value={q.type} onChange={(e) => updateQuestion(q.id, "type", e.target.value)}>
                    {screeningTypes.map((t) => <option key={t}>{t}</option>)}
                  </Select>
                  <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm">
                    <span>Required</span>
                    <Toggle checked={q.required} onChange={() => updateQuestion(q.id, "required", !q.required)} />
                  </div>
                  <div className="flex items-center justify-between rounded-lg border border-orange-200 bg-orange-50 px-3 py-2 text-sm text-[#9A3412]">
                    <span>Knockout Question</span>
                    <Toggle tone="orange" checked={q.knockout} onChange={() => updateQuestion(q.id, "knockout", !q.knockout)} />
                  </div>
                </div>

                {q.type === "Multiple choice" ? (
                  <div className="mt-2 space-y-1">
                    {(q.options || []).map((opt, idx) => (
                      <Input key={`${q.id}_opt_${idx}`} value={opt} onChange={(e) => updateQuestion(q.id, "options", q.options.map((x, i) => (i === idx ? e.target.value : x)))} placeholder={`Option ${idx + 1}`} />
                    ))}
                    <button type="button" onClick={() => addOption(q.id)} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-white">+ Add option</button>
                  </div>
                ) : null}

                {q.knockout ? (
                  <div className="mt-2 flex items-center justify-between rounded-lg border border-orange-200 bg-orange-50 px-3 py-2 text-xs text-[#9A3412]">
                    <span>If candidate answers "No", auto-reject</span>
                    <Toggle tone="orange" checked={q.knockoutRule} onChange={() => updateQuestion(q.id, "knockoutRule", !q.knockoutRule)} />
                  </div>
                ) : null}

                <div className="mt-2 flex justify-end">
                  <button type="button" onClick={() => removeQuestion(q.id)} className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50">
                    <FiTrash2 /> Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card title="Section 6 - AI Resume Ranking & Scoring (Phase 2)">
          <div className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2 text-sm">
            <span>Enable AI Ranking</span>
            <Toggle checked={form.enableAiRanking} onChange={() => set("enableAiRanking", !form.enableAiRanking)} />
          </div>
          {form.enableAiRanking ? (
            <div className="mt-3 space-y-3">
              <p className="text-sm text-slate-600">AI ranks candidates based on resume keywords, skills match, experience, and screening answers.</p>
              {[
                ["Skills Weight", "skillsWeight"],
                ["Experience Weight", "experienceWeight"],
                ["Education Weight", "educationWeight"],
                ["Screening Answers Weight", "screeningWeight"],
              ].map(([label, key]) => (
                <div key={key}>
                  <div className="mb-1 flex justify-between text-xs font-semibold text-slate-600"><span>{label}</span><span>{form[key]}%</span></div>
                  <input type="range" min={0} max={100} value={form[key]} onChange={(e) => set(key, Number(e.target.value))} className="w-full accent-[#2563EB]" />
                </div>
              ))}
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                <div className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2 text-sm"><span>Auto-highlight top 10</span><Toggle checked={form.autoHighlightTop10} onChange={() => set("autoHighlightTop10", !form.autoHighlightTop10)} /></div>
                <div className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2 text-sm"><span>Auto-tag match quality</span><Toggle checked={form.autoTagMatch} onChange={() => set("autoTagMatch", !form.autoTagMatch)} /></div>
                <div className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2 text-sm"><span>AI interview suggestions</span><Toggle checked={form.allowInterviewSuggestions} onChange={() => set("allowInterviewSuggestions", !form.allowInterviewSuggestions)} /></div>
              </div>
              <p className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs text-[#1E40AF]">AI provides recommendations. Employer makes final decision.</p>
            </div>
          ) : null}
        </Card>

        <Card title="Section 7 - Boost This Job (Premium)">
          <div className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2 text-sm">
            <span>Boost job for more visibility</span>
            <Toggle tone="orange" checked={form.boostJob} onChange={() => set("boostJob", !form.boostJob)} />
          </div>
          {form.boostJob ? (
            <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
              <Select value={form.boostDays} onChange={(e) => set("boostDays", e.target.value)}><option>3 days</option><option>7 days</option><option>14 days</option></Select>
              <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">Estimated reach: 2.5x</div>
              <button type="button" onClick={() => navigate("/company/pricing")} className="rounded-lg bg-[#F97316] px-3 py-2 text-sm font-semibold text-white hover:bg-orange-600">Upgrade Plan</button>
            </div>
          ) : null}
        </Card>

        <Card title="Section 8 - Review & Publish">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
              <p><span className="font-semibold text-[#0F172A]">Job:</span> {review.title}</p>
              <p><span className="font-semibold text-[#0F172A]">Location:</span> {review.location}</p>
              <p><span className="font-semibold text-[#0F172A]">Salary:</span> {review.salary}</p>
              <p><span className="font-semibold text-[#0F172A]">Type:</span> {review.type}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
              <p><span className="font-semibold text-[#0F172A]">Screening Questions:</span> {review.screeningCount}</p>
              <p><span className="font-semibold text-[#0F172A]">AI Ranking:</span> {form.enableAiRanking ? "Enabled" : "Disabled"}</p>
              <p><span className="font-semibold text-[#0F172A]">Resume Required:</span> {form.requireResume ? "Yes" : "No"}</p>
              <p><span className="font-semibold text-[#0F172A]">One-click Apply:</span> {form.oneClickApply ? "Enabled" : "Disabled"}</p>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" onClick={() => saveJob("Draft")} disabled={saving} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60">Save Draft</button>
            <button type="button" className="rounded-xl border border-blue-200 px-4 py-2 text-sm font-semibold text-[#2563EB] hover:bg-blue-50" onClick={() => actionToast("Review details below before publish")}>Preview Listing</button>
            <button type="button" onClick={() => setPublishOpen(true)} className="rounded-xl bg-[#2563EB] px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">Publish Job</button>
          </div>
        </Card>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white p-3 shadow-[0_-8px_24px_rgba(15,23,42,0.08)] md:hidden">
        <div className="grid grid-cols-2 gap-2">
          <button type="button" onClick={() => saveJob("Draft")} disabled={saving} className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 disabled:opacity-60">Save Draft</button>
          <button type="button" onClick={() => setPublishOpen(true)} className="rounded-lg bg-[#2563EB] px-3 py-2 text-sm font-semibold text-white">Publish</button>
        </div>
      </div>

      <Modal
        open={publishOpen}
        onClose={() => setPublishOpen(false)}
        title="Publish this job now?"
        footer={
          <>
            <button type="button" onClick={() => setPublishOpen(false)} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">Cancel</button>
            <button
              type="button"
              disabled={saving}
              onClick={() => saveJob("Active")}
              className="rounded-lg bg-[#2563EB] px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
            >
              {saving ? "Publishing..." : "Yes, Publish"}
            </button>
          </>
        }
      >
        <p className="text-sm text-slate-700">
          This will make the job visible to candidates based on your application settings and screening rules.
        </p>
      </Modal>

      {toast ? (
        <div className="fixed bottom-5 right-5 rounded-lg bg-[#0F172A] px-3 py-2 text-xs font-semibold text-white shadow-lg">
          {toast}
        </div>
      ) : null}
    </div>
  );
}
