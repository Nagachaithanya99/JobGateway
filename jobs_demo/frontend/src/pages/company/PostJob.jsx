import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  FiArrowRight,
  FiBriefcase,
  FiCheckCircle,
  FiEye,
  FiFileText,
  FiLayers,
  FiMapPin,
  FiPlus,
  FiSave,
  FiShield,
  FiTrash2,
  FiTrendingUp,
} from "react-icons/fi";

import Modal from "../../components/common/Modal.jsx";
import {
  createCompanyJob,
  getCompanyBillingMe,
  getCompanyJob,
  updateCompanyJob,
} from "../../services/companyService.js";
import { showSweetToast } from "../../utils/sweetAlert.js";
import {
  getCompanyJobPostingAccess,
  promptCompanyJobPostingAccess,
} from "../../utils/companyJobPostingAccess.js";
import {
  getDefaultHierarchy,
  getJobTaxonomy,
  OTHER_OPTION,
  persistCustomHierarchy,
  resolveHierarchyValue,
} from "../../data/jobTaxonomy.js";

const LOCAL_DRAFT_KEY = "company_post_job_local_draft_v3";
const SCREENING_TYPES = ["Yes/No", "Multiple choice", "Short answer", "Long answer", "Number"];
const INITIAL_TAXONOMY = getJobTaxonomy();
const DEFAULT_HIERARCHY = getDefaultHierarchy(INITIAL_TAXONOMY);

const QUICK_TEMPLATES = [
  {
    id: "frontend",
    label: "Frontend Developer",
    hint: "React, UI delivery, APIs",
    patch: {
      title: "Frontend Developer",
      jobType: "Full-time",
      workMode: "Hybrid",
      openings: 2,
      isFresher: false,
      experienceMinYears: "1",
      experienceMaxYears: "3",
      salaryType: "Yearly",
      salaryMin: "450000",
      salaryMax: "700000",
      overview:
        "Build responsive web interfaces, work closely with product and design teams, and ship polished features quickly.",
      responsibilities:
        "Develop reusable UI components\nIntegrate APIs and manage client-side state\nImprove performance and mobile responsiveness\nCollaborate with design and QA teams",
      requirements:
        "Good React fundamentals\nStrong JavaScript, HTML, and CSS knowledge\nExperience working with REST APIs\nComfortable with Git and team collaboration",
      skills: "React, JavaScript, HTML, CSS, REST API, Git",
      enableAiRanking: true,
    },
  },
  {
    id: "sales",
    label: "Sales Executive",
    hint: "Lead follow-up, field and phone sales",
    patch: {
      title: "Sales Executive",
      jobType: "Full-time",
      workMode: "On-site",
      openings: 4,
      isFresher: false,
      experienceMinYears: "1",
      experienceMaxYears: "4",
      salaryType: "Monthly",
      salaryMin: "18000",
      salaryMax: "30000",
      overview:
        "Drive lead conversion, maintain client relationships, and help grow monthly business targets through consistent follow-up.",
      responsibilities:
        "Handle inbound and outbound leads\nExplain product benefits clearly\nMaintain CRM updates and daily follow-up\nCoordinate with operations for closures",
      requirements:
        "Good communication skills\nTarget-oriented attitude\nBasic CRM or spreadsheet comfort\nWillingness to travel locally if needed",
      skills: "Sales, Lead Conversion, Negotiation, CRM, Communication",
      enableAiRanking: false,
    },
  },
  {
    id: "intern",
    label: "Internship Role",
    hint: "Freshers and campus hiring",
    patch: {
      title: "Software Intern",
      jobType: "Internship",
      workMode: "Remote",
      openings: 3,
      isFresher: true,
      experienceMinYears: "",
      experienceMaxYears: "",
      salaryType: "Monthly",
      salaryMin: "10000",
      salaryMax: "18000",
      overview:
        "Support the engineering team on guided tasks, learn practical workflows, and contribute to product improvements in a structured environment.",
      responsibilities:
        "Assist with small feature development\nLearn code review and deployment basics\nWrite clear documentation for tasks completed\nParticipate in team standups and demos",
      requirements:
        "Basic programming fundamentals\nWillingness to learn quickly\nGood communication and ownership\nA portfolio, GitHub, or small projects are a plus",
      skills: "JavaScript, Problem Solving, GitHub, Teamwork, Learning Agility",
      enableAiRanking: true,
    },
  },
];

function makeInitialForm() {
  return {
    title: "",
    stream: DEFAULT_HIERARCHY.stream,
    category: DEFAULT_HIERARCHY.category,
    subCategory: DEFAULT_HIERARCHY.subCategory,
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
    isFresher: true,
    experienceMinYears: "",
    experienceMaxYears: "",
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
    applicantProfileRequirement: "both",
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
    aiExperienceBand: "Auto",

    boostJob: false,
    boostDays: "7 days",
  };
}

function normalizePayload(form, questions, status) {
  const {
    streamOther,
    categoryOther,
    subCategoryOther,
    isFresher,
    experienceMinYears,
    experienceMaxYears,
    experience,
    ...rest
  } = form;

  const expMin = Number(experienceMinYears || 0);
  const expMax = Number(experienceMaxYears || 0);
  const normalizedExperience = isFresher
    ? "Fresher"
    : expMin && expMax
      ? expMin === expMax
        ? `${expMin} Years`
        : `${expMin}-${expMax} Years`
      : expMin
        ? `${expMin}+ Years`
        : String(experience || "").trim();

  return {
    ...rest,
    status,
    stream: resolveHierarchyValue(form.stream, streamOther),
    category: resolveHierarchyValue(form.category, categoryOther),
    subCategory: resolveHierarchyValue(form.subCategory, subCategoryOther),
    experience: normalizedExperience || "Fresher",
    experienceMin: isFresher ? 0 : expMin,
    experienceMax: isFresher ? 0 : expMax,
    salaryMin: Number(form.salaryMin || 0),
    salaryMax: Number(form.salaryMax || 0),
    skills: String(form.skills || "")
      .split(",")
      .map((entry) => entry.trim())
      .filter(Boolean),
    questions: (questions || [])
      .map((question) => ({
        ...question,
        text: String(question.text || "").trim(),
        options: Array.isArray(question.options)
          ? question.options.map((entry) => String(entry).trim()).filter(Boolean)
          : [],
      }))
      .filter((question) => question.text),
  };
}

function cloneQuestions(questions = []) {
  if (!Array.isArray(questions)) return [];
  return questions.map((question) => ({
    ...question,
    options: Array.isArray(question?.options) ? [...question.options] : [],
  }));
}

function parseExperienceFields(value) {
  const raw = String(value || "").trim();
  if (!raw || raw.toLowerCase() === "fresher") {
    return {
      experience: "Fresher",
      isFresher: true,
      experienceMinYears: "",
      experienceMaxYears: "",
    };
  }

  const rangeMatch = raw.match(/(\d+)\s*-\s*(\d+)/i);
  if (rangeMatch) {
    return {
      experience: raw,
      isFresher: false,
      experienceMinYears: rangeMatch[1],
      experienceMaxYears: rangeMatch[2],
    };
  }

  const plusMatch = raw.match(/(\d+)\s*\+/i);
  if (plusMatch) {
    return {
      experience: raw,
      isFresher: false,
      experienceMinYears: plusMatch[1],
      experienceMaxYears: "",
    };
  }

  const singleMatch = raw.match(/(\d+)/);
  if (singleMatch) {
    return {
      experience: raw,
      isFresher: false,
      experienceMinYears: singleMatch[1],
      experienceMaxYears: singleMatch[1],
    };
  }

  return {
    experience: raw,
    isFresher: false,
    experienceMinYears: "",
    experienceMaxYears: "",
  };
}

function makeFormFromJob(job = {}) {
  const experienceFields = parseExperienceFields(job?.experience);
  return {
    ...makeInitialForm(),
    title: job?.title || "",
    stream: job?.stream || DEFAULT_HIERARCHY.stream,
    category: job?.category || DEFAULT_HIERARCHY.category,
    subCategory: job?.subCategory || DEFAULT_HIERARCHY.subCategory,
    jobType: job?.jobType || "Full-time",
    workMode: job?.workMode || (job?.mode === "Onsite" ? "On-site" : job?.mode || "Hybrid"),
    city: job?.city || "",
    state: job?.state || "",
    openings: Number(job?.openings || 1),
    deadline: String(job?.deadline || "").slice(0, 10),
    ...experienceFields,
    salaryType: job?.salaryType || "Yearly",
    salaryMin: job?.salaryMin ? String(job.salaryMin) : "",
    salaryMax: job?.salaryMax ? String(job.salaryMax) : "",
    benefits: job?.benefits || "",
    showSalary: job?.showSalary !== false,
    overview: job?.overview || "",
    responsibilities: job?.responsibilities || "",
    requirements: job?.requirements || "",
    skills: Array.isArray(job?.skills) ? job.skills.join(", ") : String(job?.skills || ""),
    requireResume: job?.requireResume !== false,
    requireProfile100: !!job?.requireProfile100,
    applicantProfileRequirement: job?.applicantProfileRequirement || "both",
    oneClickApply: job?.oneClickApply !== false,
    allowWhatsapp: !!job?.allowWhatsapp,
    allowCall: !!job?.allowCall,
    allowEmailThread: job?.allowEmailThread !== false,
    enableAiRanking: !!job?.enableAiRanking,
    skillsWeight: Number(job?.skillsWeight ?? 35),
    experienceWeight: Number(job?.experienceWeight ?? 25),
    educationWeight: Number(job?.educationWeight ?? 15),
    screeningWeight: Number(job?.screeningWeight ?? 25),
    autoHighlightTop10: !!job?.autoHighlightTop10,
    autoTagMatch: !!job?.autoTagMatch,
    allowInterviewSuggestions: !!job?.allowInterviewSuggestions,
    aiExperienceBand: "Auto",
    boostJob: !!job?.boostActive,
    boostDays: job?.boostPlanName || "7 days",
  };
}

function Card({ title, subtitle, right, children }) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-[#0F172A]">{title}</h3>
          {subtitle ? <p className="mt-1 text-sm text-slate-500">{subtitle}</p> : null}
        </div>
        {right}
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
  return <input {...props} className={`h-11 rounded-xl border border-slate-200 px-3 text-sm outline-none transition focus:border-blue-300 focus:ring-2 focus:ring-blue-100 ${className}`} />;
}

function Select({ className = "", children, ...props }) {
  return <select {...props} className={`h-11 rounded-xl border border-slate-200 px-3 text-sm outline-none transition focus:border-blue-300 focus:ring-2 focus:ring-blue-100 ${className}`}>{children}</select>;
}

function Textarea({ className = "", ...props }) {
  return <textarea {...props} className={`w-full rounded-2xl border border-slate-200 px-3 py-3 text-sm outline-none transition focus:border-blue-300 focus:ring-2 focus:ring-blue-100 ${className}`} />;
}

function ChoiceChips({ value, onChange, options = [] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => (
        <button
          key={option}
          type="button"
          onClick={() => onChange(option)}
          className={`rounded-full border px-3 py-2 text-sm font-semibold transition ${value === option ? "border-blue-200 bg-blue-50 text-[#2563EB]" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"}`}
        >
          {option}
        </button>
      ))}
    </div>
  );
}

function UsageBar({ used, limit }) {
  const safeLimit = Math.max(1, Number(limit || 1));
  const pct = Math.min(100, Math.round((Number(used || 0) / safeLimit) * 100));
  return (
    <div>
      <div className="mb-1 flex justify-between text-xs text-slate-600">
        <span>Jobs used</span>
        <span>{used}/{limit >= 999999 ? "Unlimited" : limit}</span>
      </div>
      <div className="h-2 rounded-full bg-slate-200">
        <div className="h-2 rounded-full bg-[#2563EB]" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function QuestionEmptyState({ onAddQuestion, onAddKnockout }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center">
      <p className="text-sm font-semibold text-slate-700">No screening questions yet</p>
      <p className="mt-1 text-sm text-slate-500">Add simple filters so your team gets better applications from day one.</p>
      <div className="mt-4 flex flex-wrap justify-center gap-2">
        <button type="button" onClick={onAddQuestion} className="rounded-xl border border-blue-200 px-3 py-2 text-sm font-semibold text-[#2563EB] hover:bg-blue-50">
          Add Question
        </button>
        <button type="button" onClick={onAddKnockout} className="rounded-xl border border-orange-200 px-3 py-2 text-sm font-semibold text-[#F97316] hover:bg-orange-50">
          Add Eligibility Question
        </button>
      </div>
    </div>
  );
}

export default function PostJob() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = String(searchParams.get("edit") || "").trim();
  const isEditMode = Boolean(editId);
  const localDraftKey = isEditMode ? `${LOCAL_DRAFT_KEY}_edit_${editId}` : LOCAL_DRAFT_KEY;

  const [taxonomy, setTaxonomy] = useState(INITIAL_TAXONOMY);
  const [form, setForm] = useState(makeInitialForm);
  const [questions, setQuestions] = useState([]);
  const [publishOpen, setPublishOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [subscription, setSubscription] = useState(null);
  const [billingLoading, setBillingLoading] = useState(true);
  const [draftHydrated, setDraftHydrated] = useState(false);
  const [lastLocalSaveAt, setLastLocalSaveAt] = useState("");
  const [loadedStatus, setLoadedStatus] = useState("Draft");
  const [savedSnapshot, setSavedSnapshot] = useState(null);

  const set = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  useEffect(() => {
    let active = true;

    (async () => {
      try {
        const data = await getCompanyBillingMe();
        if (!active) return;
        setSubscription(data?.subscription || null);
      } catch {
        if (active) setSubscription(null);
      } finally {
        if (active) setBillingLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    setDraftHydrated(false);

    (async () => {
      try {
        let nextTaxonomy = getJobTaxonomy();
        let nextForm = makeInitialForm();
        let nextQuestions = [];
        let nextStatus = "Draft";
        let nextSnapshot = null;
        let nextSavedAt = "";

        if (isEditMode) {
          const data = await getCompanyJob(editId);
          const job = data?.job || {};
          nextTaxonomy = persistCustomHierarchy({
            stream: job?.stream,
            category: job?.category,
            subCategory: job?.subCategory,
          });
          nextForm = makeFormFromJob(job);
          nextQuestions = cloneQuestions(job?.questions || []);
          nextStatus = job?.status || "Active";
          nextSnapshot = {
            form: { ...nextForm },
            questions: cloneQuestions(nextQuestions),
            taxonomy: nextTaxonomy,
            status: nextStatus,
          };
        }

        try {
          const raw = window.localStorage.getItem(localDraftKey);
          if (raw) {
            const parsed = JSON.parse(raw);
            if (parsed?.form && typeof parsed.form === "object") {
              nextForm = { ...nextForm, ...parsed.form };
            }
            if (Array.isArray(parsed?.questions)) {
              nextQuestions = cloneQuestions(parsed.questions);
            }
            if (typeof parsed?.savedAt === "string") {
              nextSavedAt = parsed.savedAt;
            }
          }
        } catch {
          nextSavedAt = "";
        }

        if (!active) return;
        setLastLocalSaveAt(nextSavedAt);
        setTaxonomy(nextTaxonomy);
        setForm(nextForm);
        setQuestions(nextQuestions);
        setLoadedStatus(nextStatus);
        setSavedSnapshot(nextSnapshot);
      } catch (err) {
        console.error(err);
        if (!active) return;
        void showSweetToast(err?.response?.data?.message || "Failed to load job details", "error");
        navigate("/company/my-jobs");
        return;
      } finally {
        if (active) {
          setDraftHydrated(true);
        }
      }
    })();

    return () => {
      active = false;
    };
  }, [editId, isEditMode, localDraftKey, navigate]);

  useEffect(() => {
    if (!draftHydrated) return;
    const savedAt = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    setLastLocalSaveAt(savedAt);
    window.localStorage.setItem(
      localDraftKey,
      JSON.stringify({
        form,
        questions,
        savedAt,
      })
    );
  }, [draftHydrated, form, localDraftKey, questions]);

  const mainStreamOptions = useMemo(() => Object.keys(taxonomy), [taxonomy]);
  const categoryOptions = useMemo(() => {
    if (!form.stream || form.stream === OTHER_OPTION) return [];
    return Object.keys(taxonomy[form.stream] || {});
  }, [form.stream, taxonomy]);
  const subCategoryOptions = useMemo(() => {
    if (!form.stream || !form.category) return [];
    if (form.stream === OTHER_OPTION || form.category === OTHER_OPTION) return [];
    return taxonomy[form.stream]?.[form.category] || [];
  }, [form.category, form.stream, taxonomy]);

  const onStreamChange = (value) => {
    const nextCategories = value && value !== OTHER_OPTION ? Object.keys(taxonomy[value] || {}) : [];
    const nextCategory = nextCategories[0] || "";
    const nextSubCategory = nextCategory ? taxonomy[value]?.[nextCategory]?.[0] || "" : "";

    setForm((prev) => ({
      ...prev,
      stream: value,
      streamOther: value === OTHER_OPTION ? prev.streamOther : "",
      category: value === OTHER_OPTION ? "" : nextCategory,
      categoryOther: "",
      subCategory: value === OTHER_OPTION ? "" : nextSubCategory,
      subCategoryOther: "",
    }));
  };

  const onCategoryChange = (value) => {
    const nextSubCategory =
      value && value !== OTHER_OPTION && form.stream && form.stream !== OTHER_OPTION
        ? taxonomy[form.stream]?.[value]?.[0] || ""
        : "";

    setForm((prev) => ({
      ...prev,
      category: value,
      categoryOther: value === OTHER_OPTION ? prev.categoryOther : "",
      subCategory: value === OTHER_OPTION ? "" : nextSubCategory,
      subCategoryOther: "",
    }));
  };

  const createQuestion = (overrides = {}) => ({
    id: `q_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    text: "",
    type: "Short answer",
    required: true,
    knockout: false,
    knockoutRule: false,
    options: ["Option 1", "Option 2"],
    ...overrides,
  });

  const addQuestion = (overrides = {}) => {
    setQuestions((prev) => [...prev, createQuestion(overrides)]);
  };

  const updateQuestion = (id, key, value) => {
    setQuestions((prev) => prev.map((question) => (question.id === id ? { ...question, [key]: value } : question)));
  };

  const updateQuestionType = (id, type) => {
    setQuestions((prev) =>
      prev.map((question) =>
        question.id === id
          ? {
              ...question,
              type,
              options: type === "Multiple choice"
                ? Array.isArray(question.options) && question.options.length
                  ? question.options
                  : ["Option 1", "Option 2"]
                : question.options,
            }
          : question
      )
    );
  };

  const removeQuestion = (id) => {
    setQuestions((prev) => prev.filter((question) => question.id !== id));
  };

  const addOption = (id) => {
    setQuestions((prev) =>
      prev.map((question) =>
        question.id === id
          ? { ...question, options: [...(question.options || []), `Option ${(question.options?.length || 0) + 1}`] }
          : question
      )
    );
  };

  const applyTemplate = (template) => {
    setForm((prev) => ({
      ...prev,
      ...template.patch,
    }));

    if (template.id === "intern") {
      setQuestions([
        createQuestion({
          text: "Are you available for a full-time internship for the complete duration?",
          type: "Yes/No",
          knockout: true,
          knockoutRule: true,
          options: ["Yes", "No"],
        }),
      ]);
    } else {
      setQuestions([
        createQuestion({
          text: "Do you have the required core skills for this role?",
          type: "Yes/No",
          knockout: true,
          knockoutRule: true,
          options: ["Yes", "No"],
        }),
        createQuestion({
          text: "Share one project or achievement relevant to this role.",
          type: "Long answer",
          knockout: false,
        }),
      ]);
    }

    showSweetToast(`${template.label} template applied`, "success", { timer: 1200 });
  };

  const clearLocalDraft = () => {
    window.localStorage.removeItem(localDraftKey);
    setLastLocalSaveAt("");
  };

  const resetPage = () => {
    if (isEditMode && savedSnapshot) {
      setTaxonomy(savedSnapshot.taxonomy || getJobTaxonomy());
      setForm({ ...savedSnapshot.form });
      setQuestions(cloneQuestions(savedSnapshot.questions));
      setLoadedStatus(savedSnapshot.status || "Draft");
      clearLocalDraft();
      showSweetToast("Changes reset to the saved job", "success", { timer: 1200 });
      return;
    }

    setForm(makeInitialForm());
    setQuestions([]);
    clearLocalDraft();
    showSweetToast("Local draft cleared", "success", { timer: 1200 });
  };

  const resolvedHierarchy = useMemo(
    () => ({
      stream: resolveHierarchyValue(form.stream, form.streamOther),
      category: resolveHierarchyValue(form.category, form.categoryOther),
      subCategory: resolveHierarchyValue(form.subCategory, form.subCategoryOther),
    }),
    [form.category, form.categoryOther, form.stream, form.streamOther, form.subCategory, form.subCategoryOther]
  );

  const skillsList = useMemo(
    () =>
      String(form.skills || "")
        .split(",")
        .map((entry) => entry.trim())
        .filter(Boolean),
    [form.skills]
  );

  const review = useMemo(() => {
    const location = [form.city, form.state].filter(Boolean).join(", ") || "Not set";
    const salary = form.showSalary
      ? form.salaryMin && form.salaryMax
        ? `${form.salaryMin} - ${form.salaryMax} (${form.salaryType})`
        : "Not set"
      : "Hidden from candidates";
    const experience = form.isFresher
      ? "Fresher"
      : form.experienceMinYears && form.experienceMaxYears
        ? `${form.experienceMinYears}-${form.experienceMaxYears} Years`
        : form.experienceMinYears
          ? `${form.experienceMinYears}+ Years`
          : "Not set";

    return {
      title: form.title || "Untitled Role",
      hierarchy: `${resolvedHierarchy.stream || "Stream"} / ${resolvedHierarchy.category || "Category"} / ${resolvedHierarchy.subCategory || "Sub Category"}`,
      location,
      salary,
      type: `${form.jobType} | ${form.workMode}`,
      experience,
      screeningCount: questions.filter((question) => String(question.text || "").trim()).length,
      overview: form.overview || "Add a simple job overview so candidates quickly understand the role.",
    };
  }, [form, questions, resolvedHierarchy]);

  const readinessChecks = useMemo(() => {
    const formattedQuestions = questions.filter((question) => String(question.text || "").trim());
    return [
      { label: "Job title added", done: Boolean(form.title.trim()), required: true },
      { label: "Category path selected", done: Boolean(resolvedHierarchy.stream && resolvedHierarchy.category && resolvedHierarchy.subCategory), required: true },
      { label: "Location added", done: Boolean(form.city.trim() || form.state.trim()), required: true },
      { label: "Deadline selected", done: Boolean(form.deadline), required: false },
      { label: "Overview written", done: String(form.overview || "").trim().length >= 20, required: true },
      { label: "Requirements added", done: String(form.requirements || "").trim().length >= 20, required: false },
      { label: "At least 3 skills listed", done: skillsList.length >= 3, required: false },
      { label: "Screening questions reviewed", done: true, required: false, helper: `${formattedQuestions.length} added` },
    ];
  }, [form.city, form.deadline, form.overview, form.requirements, form.state, form.title, questions, resolvedHierarchy, skillsList.length]);

  const requiredReadinessChecks = readinessChecks.filter((item) => item.required);
  const readinessDone = readinessChecks.filter((item) => item.done).length;
  const readinessPercent = Math.round((readinessDone / readinessChecks.length) * 100);
  const canPublish = requiredReadinessChecks.every((item) => item.done);

  const selectedExperiencePoint = useMemo(() => {
    if (form.aiExperienceBand && form.aiExperienceBand !== "Auto") return form.aiExperienceBand;
    if (form.isFresher) return "Fresher";
    const minYears = Number(form.experienceMinYears || 0);
    const maxYears = Number(form.experienceMaxYears || 0);
    if (minYears && maxYears) return `${minYears}-${maxYears} Years`;
    if (minYears) return `${minYears}+ Years`;
    return "Not set";
  }, [form.aiExperienceBand, form.experienceMaxYears, form.experienceMinYears, form.isFresher]);

  const totalAiWeight = Number(form.skillsWeight || 0)
    + Number(form.experienceWeight || 0)
    + Number(form.educationWeight || 0)
    + Number(form.screeningWeight || 0);

  const actionToast = (message, type = "info") => {
    void showSweetToast(message, type, { timer: 1400 });
  };

  const openPublishConfirm = () => {
    if (!canPublish && (!isEditMode || loadedStatus !== "Active")) {
      const missing = requiredReadinessChecks.filter((item) => !item.done).map((item) => item.label);
      actionToast(`Complete these before publishing: ${missing.slice(0, 2).join(", ")}`, "warning");
      return;
    }
    setPublishOpen(true);
  };

  const saveJob = async (status) => {
    if (!form.title.trim()) {
      actionToast("Job title is required", "warning");
      return;
    }

    const payload = normalizePayload(form, questions, status);
    if (!payload.stream || !payload.category || !payload.subCategory) {
      actionToast("Select Main Stream, Category and Sub Category", "warning");
      return;
    }

    if (status === "Active" && !canPublish && (!isEditMode || loadedStatus !== "Active")) {
      openPublishConfirm();
      return;
    }

    if (!form.isFresher) {
      const minYears = Number(form.experienceMinYears || 0);
      const maxYears = Number(form.experienceMaxYears || 0);
      if (!minYears) {
        actionToast("Enter at least the minimum experience in years", "warning");
        return;
      }
      if (maxYears && maxYears < minYears) {
        actionToast("Maximum experience must be greater than or equal to minimum", "warning");
        return;
      }
    }

    setSaving(true);
    try {
      if (isEditMode) {
        await updateCompanyJob(editId, payload);
      } else {
        await createCompanyJob(payload);
      }
      setTaxonomy(persistCustomHierarchy(payload));
      setPublishOpen(false);
      clearLocalDraft();
      actionToast(
        isEditMode
          ? status === "Active"
            ? "Job updated successfully"
            : "Job changes saved"
          : status === "Draft"
            ? "Draft saved"
            : "Job published successfully",
        "success"
      );
      navigate("/company/my-jobs");
    } catch (err) {
      console.error(err);
      setPublishOpen(false);
      if (err?.response?.status === 403) {
        const access = getCompanyJobPostingAccess(err?.response?.data?.subscription || null);
        if (!access.allowed) {
          await promptCompanyJobPostingAccess(access, navigate);
          return;
        }
      }
      actionToast(err?.response?.data?.message || "Action failed", "error");
    } finally {
      setSaving(false);
    }
  };

  const jobsLimit = Number(subscription?.jobsLimit ?? 0);
  const jobsUsed = Number(subscription?.jobsUsed ?? 0);
  const jobsRemaining = jobsLimit >= 999999 ? "Unlimited" : Math.max(0, jobsLimit - jobsUsed);
  const breadcrumbTitle = isEditMode ? "Edit Job" : "Post Job";
  const pageTitle = isEditMode ? "Edit This Job" : "Create a Job Post";
  const pageDescription = isEditMode
    ? "Update the role with the same guided cards, keep details clean, and save changes without switching to a small popup."
    : "Post faster with a guided layout, save local progress automatically, and preview the listing before you publish.";
  const templateHeading = isEditMode ? "Quick update helpers" : "Quick start templates";
  const templateDescription = isEditMode
    ? "Use these cards to refresh the role quickly, then adjust the rest of the details below."
    : "Use a starter layout, then customize the details instead of typing everything from scratch.";
  const saveProgressLabel = isEditMode ? "Save Changes" : "Save Draft";
  const publishLabel = isEditMode && loadedStatus !== "Active" ? "Publish Job" : isEditMode ? "Update Job" : "Publish Job";
  const resetLabel = isEditMode ? "Reset Changes" : "Start Fresh";
  const saveProgressStatus = isEditMode ? loadedStatus || "Draft" : "Draft";

  if (!draftHydrated) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-5 text-sm text-slate-600 shadow-sm">
        {isEditMode ? "Loading the job editor..." : "Preparing the job form..."}
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-20 md:pb-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold text-slate-500">Dashboard {">"} {breadcrumbTitle}</p>
          <h1 className="mt-1 text-3xl font-black tracking-tight text-[#0F172A]">{pageTitle}</h1>
          <p className="mt-2 max-w-3xl text-sm text-slate-500">
            {pageDescription}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => saveJob(saveProgressStatus)} disabled={saving} className="rounded-xl border border-blue-200 px-4 py-2 text-sm font-semibold text-[#2563EB] hover:bg-blue-50 disabled:opacity-60">
            <span className="inline-flex items-center gap-2">
              <FiSave />
              {saveProgressLabel}
            </span>
          </button>
          <button type="button" onClick={() => setPreviewOpen(true)} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
            <span className="inline-flex items-center gap-2">
              <FiEye />
              Preview
            </span>
          </button>
          <button type="button" onClick={openPublishConfirm} className="rounded-xl bg-[#2563EB] px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">
            {publishLabel}
          </button>
        </div>
      </header>

      <section className="rounded-[28px] border border-slate-200 bg-[linear-gradient(135deg,#eff6ff_0%,#ffffff_55%,#fff7ed_100%)] p-5 shadow-sm">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div>
            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
              {[
                ["1", "Role setup"],
                ["2", "Compensation"],
                ["3", "Description"],
                ["4", "Apply rules"],
                ["5", "Publish"],
              ].map(([number, label]) => (
                <span key={label} className="inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/80 px-3 py-1 text-slate-700">
                  <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-blue-50 text-[#2563EB]">{number}</span>
                  {label}
                </span>
              ))}
            </div>
            <h2 className="mt-4 text-xl font-bold text-[#0F172A]">{templateHeading}</h2>
            <p className="mt-1 text-sm text-slate-500">
              {templateDescription}
            </p>
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              {QUICK_TEMPLATES.map((template) => (
                <button
                  key={template.id}
                  type="button"
                  onClick={() => applyTemplate(template)}
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md"
                >
                  <p className="text-sm font-semibold text-[#0F172A]">{template.label}</p>
                  <p className="mt-1 text-xs text-slate-500">{template.hint}</p>
                  <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-[#2563EB]">
                    Use template
                    <FiArrowRight />
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-[#0F172A]">Posting readiness</p>
                <p className="mt-1 text-xs text-slate-500">{readinessDone}/{readinessChecks.length} checkpoints done</p>
              </div>
              <span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-[#2563EB]">
                {readinessPercent}%
              </span>
            </div>
            <div className="mt-3 h-2 rounded-full bg-slate-200">
              <div className="h-2 rounded-full bg-[#2563EB]" style={{ width: `${readinessPercent}%` }} />
            </div>
            <p className="mt-3 text-xs text-slate-500">
              {lastLocalSaveAt ? `Autosaved locally at ${lastLocalSaveAt}` : "Autosave starts as soon as you type."}
            </p>
            <div className="mt-4 flex gap-2">
              <button type="button" onClick={() => setPreviewOpen(true)} className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                Preview
              </button>
              <button type="button" onClick={resetPage} className="flex-1 rounded-xl border border-red-200 px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50">
                {resetLabel}
              </button>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_330px]">
        <div className="space-y-4">
          <Card
            title="Section 1 - Role Setup"
            subtitle="Pick the job title, category path, location, and opening details so students can discover the role correctly."
            right={<span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-[#2563EB]">Core details</span>}
          >
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
              <Input value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="Job Title" />

              <div>
                <Select value={form.stream} onChange={(e) => onStreamChange(e.target.value)} className="w-full">
                  <option value="">Main Stream</option>
                  {mainStreamOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                  <option value={OTHER_OPTION}>Other</option>
                </Select>
                {form.stream === OTHER_OPTION ? (
                  <Input
                    value={form.streamOther}
                    onChange={(e) => set("streamOther", e.target.value)}
                    placeholder="Custom main stream"
                    className="mt-2 w-full"
                  />
                ) : null}
              </div>

              <div>
                <Select value={form.category} onChange={(e) => onCategoryChange(e.target.value)} disabled={!form.stream} className="w-full disabled:bg-slate-50">
                  <option value="">Category</option>
                  {categoryOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                  {form.stream ? <option value={OTHER_OPTION}>Other</option> : null}
                </Select>
                {form.category === OTHER_OPTION ? (
                  <Input
                    value={form.categoryOther}
                    onChange={(e) => set("categoryOther", e.target.value)}
                    placeholder="Custom category"
                    className="mt-2 w-full"
                  />
                ) : null}
              </div>

              <div>
                <Select value={form.subCategory} onChange={(e) => set("subCategory", e.target.value)} disabled={!form.category} className="w-full disabled:bg-slate-50">
                  <option value="">Sub Category</option>
                  {subCategoryOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                  {form.category ? <option value={OTHER_OPTION}>Other</option> : null}
                </Select>
                {form.subCategory === OTHER_OPTION ? (
                  <Input
                    value={form.subCategoryOther}
                    onChange={(e) => set("subCategoryOther", e.target.value)}
                    placeholder="Custom sub category"
                    className="mt-2 w-full"
                  />
                ) : null}
              </div>

              <div className="md:col-span-2 lg:col-span-2">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Job Type</p>
                <ChoiceChips value={form.jobType} onChange={(value) => set("jobType", value)} options={["Full-time", "Part-time", "Internship"]} />
              </div>

              <div className="md:col-span-2 lg:col-span-1">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Work Mode</p>
                <ChoiceChips value={form.workMode} onChange={(value) => set("workMode", value)} options={["On-site", "Remote", "Hybrid"]} />
              </div>

              <Input value={form.city} onChange={(e) => set("city", e.target.value)} placeholder="City" />
              <Input value={form.state} onChange={(e) => set("state", e.target.value)} placeholder="State" />
              <Input type="number" min={1} value={form.openings} onChange={(e) => set("openings", Number(e.target.value || 1))} placeholder="Openings" />
              <Input type="date" value={form.deadline} onChange={(e) => set("deadline", e.target.value)} className="md:col-span-2 lg:col-span-1" />
            </div>
          </Card>

          <Card
            title="Section 2 - Compensation & Experience"
            subtitle="Keep this simple and transparent so candidates understand the role level quickly."
            right={<span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">{form.isFresher ? "Fresher friendly" : "Experience based"}</span>}
          >
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
              <div className="flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700">
                <div>
                  <p className="font-semibold text-slate-900">Fresher Role</p>
                  <p className="mt-1 text-xs text-slate-500">Turn this on if no past experience is required.</p>
                </div>
                <Toggle
                  checked={form.isFresher}
                  onChange={() =>
                    setForm((prev) => ({
                      ...prev,
                      isFresher: !prev.isFresher,
                      experience: !prev.isFresher ? "Fresher" : prev.experience,
                      experienceMinYears: !prev.isFresher ? "" : prev.experienceMinYears,
                      experienceMaxYears: !prev.isFresher ? "" : prev.experienceMaxYears,
                    }))
                  }
                />
              </div>

              <Input
                type="number"
                min={0}
                value={form.experienceMinYears}
                onChange={(e) => set("experienceMinYears", e.target.value)}
                placeholder="Min Experience (Years)"
                disabled={form.isFresher}
                className="disabled:bg-slate-50"
              />
              <Input
                type="number"
                min={0}
                value={form.experienceMaxYears}
                onChange={(e) => set("experienceMaxYears", e.target.value)}
                placeholder="Max Experience (Years)"
                disabled={form.isFresher}
                className="disabled:bg-slate-50"
              />

              <Select value={form.salaryType} onChange={(e) => set("salaryType", e.target.value)}>
                <option>Monthly</option>
                <option>Yearly</option>
              </Select>
              <Input value={form.salaryMin} onChange={(e) => set("salaryMin", e.target.value)} placeholder="Salary Min" />
              <Input value={form.salaryMax} onChange={(e) => set("salaryMax", e.target.value)} placeholder="Salary Max" />

              <Input value={form.benefits} onChange={(e) => set("benefits", e.target.value)} placeholder="Benefits (comma separated)" className="md:col-span-2 lg:col-span-2" />
              <div className="flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700">
                <div>
                  <p className="font-semibold text-slate-900">Show salary publicly</p>
                  <p className="mt-1 text-xs text-slate-500">Turn off if you want to discuss compensation later.</p>
                </div>
                <Toggle checked={form.showSalary} onChange={() => set("showSalary", !form.showSalary)} />
              </div>
            </div>
          </Card>

          <Card
            title="Section 3 - Role Description"
            subtitle="Write this like a hiring manager, not a legal document. Candidates should understand the role in under 30 seconds."
            right={<span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700">Candidate-facing</span>}
          >
            <div className="grid grid-cols-1 gap-3">
              <Textarea value={form.overview} onChange={(e) => set("overview", e.target.value)} rows={4} placeholder="Short overview: what this role does, why it matters, and who should apply." />
              <Textarea value={form.responsibilities} onChange={(e) => set("responsibilities", e.target.value)} rows={5} placeholder="Responsibilities: one item per line works best." />
              <Textarea value={form.requirements} onChange={(e) => set("requirements", e.target.value)} rows={5} placeholder="Requirements: must-have skills, tools, education, certifications, or availability." />
              <Input value={form.skills} onChange={(e) => set("skills", e.target.value)} placeholder="Skills Required (comma separated)" />
              {skillsList.length ? (
                <div className="flex flex-wrap gap-2">
                  {skillsList.map((skill) => (
                    <span key={skill} className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-[#2563EB]">
                      {skill}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500">Tip: add at least 3 skills to improve filtering and AI ranking.</p>
              )}
            </div>
          </Card>

          <Card
            title="Section 4 - Application Rules"
            subtitle="Choose how easy you want the apply flow to be for students."
            right={<span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-[#F97316]">Apply settings</span>}
          >
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <div className="rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700 sm:col-span-2 lg:col-span-3">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Candidate Profile Requirement</p>
                <Select value={form.applicantProfileRequirement} onChange={(e) => set("applicantProfileRequirement", e.target.value)} className="w-full">
                  <option value="both">Resume and student profile</option>
                  <option value="resume">Resume only</option>
                  <option value="student_profile">Student profile only</option>
                </Select>
              </div>
              {[
                ["Require Resume Upload", "requireResume"],
                ["Require Profile 100% completion", "requireProfile100"],
                ["One-Click Apply enabled", "oneClickApply"],
                ["Allow WhatsApp contact button", "allowWhatsapp"],
                ["Allow Call Now button", "allowCall"],
                ["Allow Email reply thread", "allowEmailThread"],
              ].map(([label, key]) => (
                <div key={key} className="flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700">
                  <span>{label}</span>
                  <Toggle checked={form[key]} onChange={() => set(key, !form[key])} />
                </div>
              ))}
            </div>
          </Card>

          <Card
            title="Section 5 - Screening Questions"
            subtitle="Add quick eligibility questions so you reduce manual review later."
            right={
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => addQuestion()} className="inline-flex items-center gap-1 rounded-xl border border-blue-200 px-3 py-2 text-sm font-semibold text-[#2563EB] hover:bg-blue-50">
                  <FiPlus />
                  Add Question
                </button>
                <button
                  type="button"
                  onClick={() => addQuestion({ type: "Yes/No", knockout: true, knockoutRule: true, options: ["Yes", "No"], text: "Are you eligible for this role?" })}
                  className="inline-flex items-center gap-1 rounded-xl border border-orange-200 px-3 py-2 text-sm font-semibold text-[#F97316] hover:bg-orange-50"
                >
                  <FiShield />
                  Add Knockout
                </button>
              </div>
            }
          >
            {!questions.length ? (
              <QuestionEmptyState
                onAddQuestion={() => addQuestion()}
                onAddKnockout={() => addQuestion({ type: "Yes/No", knockout: true, knockoutRule: true, options: ["Yes", "No"], text: "Are you eligible for this role?" })}
              />
            ) : (
              <div className="space-y-3">
                {questions.map((question, index) => (
                  <div key={question.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <p className="text-sm font-semibold text-[#0F172A]">Question {index + 1}</p>
                      <button type="button" onClick={() => removeQuestion(question.id)} className="inline-flex items-center gap-1 rounded-xl border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50">
                        <FiTrash2 />
                        Delete
                      </button>
                    </div>

                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
                      <Input value={question.text} onChange={(e) => updateQuestion(question.id, "text", e.target.value)} placeholder="Question text" className="lg:col-span-2" />
                      <Select value={question.type} onChange={(e) => updateQuestionType(question.id, e.target.value)}>
                        {SCREENING_TYPES.map((type) => (
                          <option key={type}>{type}</option>
                        ))}
                      </Select>
                      <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm">
                        <span>Required</span>
                        <Toggle checked={question.required} onChange={() => updateQuestion(question.id, "required", !question.required)} />
                      </div>
                      <div className="flex items-center justify-between rounded-2xl border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-[#9A3412]">
                        <span>Knockout Question</span>
                        <Toggle tone="orange" checked={question.knockout} onChange={() => updateQuestion(question.id, "knockout", !question.knockout)} />
                      </div>
                    </div>

                    {question.type === "Multiple choice" ? (
                      <div className="mt-3 space-y-2">
                        {(question.options || []).map((option, optionIndex) => (
                          <Input
                            key={`${question.id}_opt_${optionIndex}`}
                            value={option}
                            onChange={(e) => updateQuestion(question.id, "options", question.options.map((entry, idx) => (idx === optionIndex ? e.target.value : entry)))}
                            placeholder={`Option ${optionIndex + 1}`}
                          />
                        ))}
                        <button type="button" onClick={() => addOption(question.id)} className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-white">
                          + Add option
                        </button>
                      </div>
                    ) : null}

                    {question.knockout ? (
                      <div className="mt-3 flex items-center justify-between rounded-2xl border border-orange-200 bg-orange-50 px-4 py-3 text-xs text-[#9A3412]">
                        <span>If the candidate fails this question, auto-reject the application.</span>
                        <Toggle tone="orange" checked={question.knockoutRule} onChange={() => updateQuestion(question.id, "knockoutRule", !question.knockoutRule)} />
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card
            title="Section 6 - AI Ranking"
            subtitle="Use AI as a sorting assistant, then let your team make the final call."
            right={<span className="rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-xs font-semibold text-violet-700">Optional</span>}
          >
            <div className="flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-3 text-sm">
              <div>
                <p className="font-semibold text-slate-900">Enable AI Ranking</p>
                <p className="mt-1 text-xs text-slate-500">Score candidates based on skills, experience, education, and screening answers.</p>
              </div>
              <Toggle checked={form.enableAiRanking} onChange={() => set("enableAiRanking", !form.enableAiRanking)} />
            </div>

            {form.enableAiRanking ? (
              <div className="mt-4 space-y-4">
                {[
                  ["Skills Weight", "skillsWeight"],
                  ["Experience Weight", "experienceWeight"],
                  ["Education Weight", "educationWeight"],
                  ["Screening Answers Weight", "screeningWeight"],
                ].map(([label, key]) => (
                  <div key={key}>
                    <div className="mb-1 flex justify-between text-xs font-semibold text-slate-600">
                      <span>{label}</span>
                      <span>{key === "experienceWeight" ? `${form[key]}% | ${selectedExperiencePoint}` : `${form[key]}%`}</span>
                    </div>
                    <input type="range" min={0} max={100} value={form[key]} onChange={(e) => set(key, Number(e.target.value))} className="w-full accent-[#2563EB]" />
                  </div>
                ))}

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Experience Reference</p>
                    <Select value={form.aiExperienceBand} onChange={(e) => set("aiExperienceBand", e.target.value)} className="w-full">
                      <option value="Auto">Auto (Use Job Experience)</option>
                      <option value="Fresher">Fresher</option>
                      <option value="1 Year">1 Year</option>
                      <option value="2 Years">2 Years</option>
                      <option value="3 Years">3 Years</option>
                      <option value="4 Years">4 Years</option>
                      <option value="5 Years">5 Years</option>
                      <option value="6 Years">6 Years</option>
                      <option value="7 Years">7 Years</option>
                      <option value="8 Years">8 Years</option>
                      <option value="9 Years">9 Years</option>
                      <option value="10+ Years">10+ Years</option>
                    </Select>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Weight Health</p>
                    <p className={`mt-2 text-sm font-semibold ${totalAiWeight === 100 ? "text-green-700" : "text-[#F97316]"}`}>
                      Total AI weight: {totalAiWeight}%
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {totalAiWeight === 100 ? "Nice. Your score distribution is balanced." : "Tip: keep the total around 100% for easier interpretation."}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div className="flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-3 text-sm"><span>Auto-highlight top 10</span><Toggle checked={form.autoHighlightTop10} onChange={() => set("autoHighlightTop10", !form.autoHighlightTop10)} /></div>
                  <div className="flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-3 text-sm"><span>Auto-tag match quality</span><Toggle checked={form.autoTagMatch} onChange={() => set("autoTagMatch", !form.autoTagMatch)} /></div>
                  <div className="flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-3 text-sm"><span>AI interview suggestions</span><Toggle checked={form.allowInterviewSuggestions} onChange={() => set("allowInterviewSuggestions", !form.allowInterviewSuggestions)} /></div>
                </div>

                <p className="rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-xs text-[#1E40AF]">
                  AI gives recommendations only. Your hiring team still makes the final decision.
                </p>
              </div>
            ) : null}
          </Card>

          <Card
            title="Section 7 - Boost Visibility"
            subtitle="Use this only if you want more reach for important or urgent openings."
            right={<span className="rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-xs font-semibold text-[#F97316]">Premium</span>}
          >
            <div className="flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-3 text-sm">
              <div>
                <p className="font-semibold text-slate-900">Boost job for more visibility</p>
                <p className="mt-1 text-xs text-slate-500">Premium feature for faster reach on urgent roles.</p>
              </div>
              <Toggle tone="orange" checked={form.boostJob} onChange={() => set("boostJob", !form.boostJob)} />
            </div>

            {form.boostJob ? (
              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
                <Select value={form.boostDays} onChange={(e) => set("boostDays", e.target.value)}>
                  <option>3 days</option>
                  <option>7 days</option>
                  <option>14 days</option>
                </Select>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">Estimated reach: 2.5x visibility</div>
                <button type="button" onClick={() => navigate("/company/pricing")} className="rounded-2xl bg-[#F97316] px-4 py-3 text-sm font-semibold text-white hover:bg-orange-600">Upgrade Plan</button>
              </div>
            ) : null}
          </Card>
        </div>

        <div className="space-y-4 xl:sticky xl:top-4 xl:self-start">
          <Card
            title="Live Preview"
            subtitle="Candidates will see a version of this summary before opening the full job."
            right={<span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700">Preview</span>}
          >
            <div className="rounded-[28px] border border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-lg font-bold text-[#0F172A]">{review.title}</p>
                  <p className="mt-1 text-sm text-slate-500">{review.hierarchy}</p>
                </div>
                <span className="rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-semibold text-[#2563EB]">
                  {form.jobType}
                </span>
              </div>

              <div className="mt-4 grid gap-2 text-sm text-slate-600">
                <p className="inline-flex items-center gap-2"><FiMapPin className="text-slate-400" /> {review.location}</p>
                <p className="inline-flex items-center gap-2"><FiLayers className="text-slate-400" /> {review.type}</p>
                <p className="inline-flex items-center gap-2"><FiBriefcase className="text-slate-400" /> {review.experience}</p>
                <p className="inline-flex items-center gap-2"><FiTrendingUp className="text-slate-400" /> {review.salary}</p>
              </div>

              <p className="mt-4 text-sm leading-6 text-slate-600">{review.overview}</p>

              <div className="mt-4 flex flex-wrap gap-2">
                {skillsList.slice(0, 6).map((skill) => (
                  <span key={skill} className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          </Card>

          <Card
            title="Publish Checklist"
            subtitle="Required items unblock publishing, and recommended items help the post perform better."
            right={<span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-[#2563EB]">{readinessPercent}% ready</span>}
          >
            <div className="space-y-3">
              {readinessChecks.map((item) => (
                <div key={item.label} className="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3">
                  <span className={`inline-flex h-7 w-7 items-center justify-center rounded-full ${item.done ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"}`}>
                    <FiCheckCircle />
                  </span>
                  <div className="min-w-0">
                    <p className={`text-sm font-semibold ${item.done ? "text-slate-900" : "text-slate-600"}`}>{item.label}</p>
                    <p className="text-xs text-slate-500">
                      {item.done
                        ? item.helper || "Completed"
                        : item.required
                          ? "Required before publish"
                          : "Recommended for a stronger post"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card
            title="Plan Usage"
            subtitle="Current posting capacity from your company subscription."
            right={billingLoading ? <span className="text-xs text-slate-500">Checking...</span> : null}
          >
            <div className="space-y-3 text-sm text-slate-700">
              <p className="text-xs text-slate-500">{subscription?.planName || "Starter"} ({subscription?.status || "inactive"})</p>
              <UsageBar used={jobsUsed} limit={jobsLimit || 0} />
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Remaining slots</p>
                <p className="mt-2 text-lg font-bold text-[#0F172A]">{jobsRemaining}</p>
              </div>
              <p className="text-xs text-slate-500">Drafts do not consume the active jobs limit. Publishing active jobs does.</p>
            </div>
          </Card>

          <Card title="Flow Summary" subtitle="How this post will behave after publishing.">
            <div className="space-y-3 text-sm text-slate-700">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                <p className="font-semibold text-slate-900">Applications</p>
                <p className="mt-1 text-xs text-slate-500">
                  {form.oneClickApply ? "One-click apply is enabled." : "Candidates will follow the full apply flow."}
                  {" "}Required profile: {form.applicantProfileRequirement === "student_profile" ? "student profile only" : form.applicantProfileRequirement === "resume" ? "resume only" : "resume and student profile"}.
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                <p className="font-semibold text-slate-900">Screening</p>
                <p className="mt-1 text-xs text-slate-500">
                  {questions.filter((question) => String(question.text || "").trim()).length} active screening question(s) configured.
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                <p className="font-semibold text-slate-900">AI Assistance</p>
                <p className="mt-1 text-xs text-slate-500">
                  {form.enableAiRanking ? "AI ranking will assist shortlisting." : "Manual screening only for this role."}
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white p-3 shadow-[0_-8px_24px_rgba(15,23,42,0.08)] md:hidden">
        <div className="grid grid-cols-3 gap-2">
          <button type="button" onClick={() => saveJob(saveProgressStatus)} disabled={saving} className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 disabled:opacity-60">{isEditMode ? "Save" : "Draft"}</button>
          <button type="button" onClick={() => setPreviewOpen(true)} className="rounded-xl border border-blue-200 px-3 py-2 text-sm font-semibold text-[#2563EB]">Preview</button>
          <button type="button" onClick={openPublishConfirm} className="rounded-xl bg-[#2563EB] px-3 py-2 text-sm font-semibold text-white">{isEditMode ? "Update" : "Publish"}</button>
        </div>
      </div>

      <Modal
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        title="Job Preview"
        widthClass="max-w-4xl"
        footer={<button type="button" onClick={() => setPreviewOpen(false)} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">Close</button>}
      >
        <div className="space-y-4 text-sm text-slate-700">
          <div className="rounded-[28px] border border-slate-200 bg-[linear-gradient(135deg,#eff6ff_0%,#ffffff_55%,#fff7ed_100%)] p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-2xl font-black tracking-tight text-[#0F172A]">{review.title}</p>
                <p className="mt-2 text-slate-500">{review.hierarchy}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-[#2563EB]">{form.jobType}</span>
                <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700">{form.workMode}</span>
              </div>
            </div>
            <div className="mt-4 grid gap-2 text-slate-600 md:grid-cols-2">
              <p className="inline-flex items-center gap-2"><FiMapPin className="text-slate-400" /> {review.location}</p>
              <p className="inline-flex items-center gap-2"><FiBriefcase className="text-slate-400" /> {review.experience}</p>
              <p className="inline-flex items-center gap-2"><FiTrendingUp className="text-slate-400" /> {review.salary}</p>
              <p className="inline-flex items-center gap-2"><FiFileText className="text-slate-400" /> {review.screeningCount} screening question(s)</p>
            </div>
          </div>

          <Card title="Overview">
            <p className="leading-6">{form.overview || "No overview added yet."}</p>
          </Card>

          <div className="grid gap-4 md:grid-cols-2">
            <Card title="Responsibilities">
              <p className="whitespace-pre-line leading-6">{form.responsibilities || "No responsibilities added yet."}</p>
            </Card>
            <Card title="Requirements">
              <p className="whitespace-pre-line leading-6">{form.requirements || "No requirements added yet."}</p>
            </Card>
          </div>

          <Card title="Skills & Settings">
            <div className="flex flex-wrap gap-2">
              {skillsList.length ? skillsList.map((skill) => (
                <span key={skill} className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-[#2563EB]">
                  {skill}
                </span>
              )) : <span className="text-slate-500">No skills added yet.</span>}
            </div>
            <div className="mt-4 grid gap-2 md:grid-cols-2">
              <p>Resume Required: <span className="font-semibold text-slate-900">{form.requireResume ? "Yes" : "No"}</span></p>
              <p>Profile Requirement: <span className="font-semibold text-slate-900">{form.applicantProfileRequirement === "student_profile" ? "Student profile" : form.applicantProfileRequirement === "resume" ? "Resume" : "Resume + student profile"}</span></p>
              <p>One-click Apply: <span className="font-semibold text-slate-900">{form.oneClickApply ? "Enabled" : "Disabled"}</span></p>
              <p>WhatsApp Contact: <span className="font-semibold text-slate-900">{form.allowWhatsapp ? "Enabled" : "Disabled"}</span></p>
              <p>AI Ranking: <span className="font-semibold text-slate-900">{form.enableAiRanking ? "Enabled" : "Disabled"}</span></p>
            </div>
          </Card>
        </div>
      </Modal>

      <Modal
        open={publishOpen}
        onClose={() => setPublishOpen(false)}
        title={isEditMode && loadedStatus === "Active" ? "Save these job updates?" : "Publish this job now?"}
        footer={
          <>
            <button type="button" onClick={() => setPublishOpen(false)} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">Cancel</button>
            <button type="button" disabled={saving} onClick={() => saveJob("Active")} className="rounded-xl bg-[#2563EB] px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60">
              {saving ? (isEditMode ? "Saving..." : "Publishing...") : publishLabel}
            </button>
          </>
        }
      >
        <div className="space-y-3 text-sm text-slate-700">
          <p>
            {isEditMode && loadedStatus === "Active"
              ? "These updates will refresh the live job card, details, and application settings for candidates."
              : "This will make the job visible to candidates using your selected application rules, screening setup, and AI settings."}
          </p>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
            <p className="font-semibold text-slate-900">{review.title}</p>
            <p className="mt-1 text-slate-500">{review.location} | {review.type}</p>
            <p className="mt-2 text-xs text-slate-500">
              Checklist score: {readinessDone}/{readinessChecks.length} items ready
            </p>
          </div>
        </div>
      </Modal>
    </div>
  );
}
