import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  FiBookmark,
  FiChevronDown,
  FiMapPin,
  FiSearch,
  FiPhoneCall,
  FiExternalLink,
} from "react-icons/fi";
import StatusPopup from "../../components/common/StatusPopup.jsx";
import useAuth from "../../hooks/useAuth.js";
import api from "../../services/api.js";
import {
  studentApplyJob,
  studentGetSavedJobs,
  studentMe,
  studentMyApplications,
  studentToggleSaveJob,
} from "../../services/studentService.js";
import { OTHER_OPTION, resolveHierarchyValue } from "../../data/jobTaxonomy.js";

import illTop from "../../assets/images/student-internship/internship-illustration-top.png";
import illBottom from "../../assets/images/student-internship/internship-illustration-bottom.png";

const CHIP_TABS = ["All Internships", "IT & Software", "Marketing", "Engineering", "Finance"];
const internshipTaxonomy = {
  "IT & Software": {
    Development: ["Frontend Intern", "Backend Intern", "Full Stack Intern", "Mobile Intern"],
    Testing: ["Manual Testing Intern", "Automation Testing Intern"],
    Data: ["Data Analyst Intern", "Data Engineer Intern", "ML Intern"],
    DevOps: ["DevOps Intern", "Cloud Intern"],
    "Cyber Security": ["SOC Intern", "VAPT Intern"],
  },
  "Medical & Healthcare": {
    Nursing: ["Nursing Intern", "ICU Intern"],
    Pharmacy: ["Pharmacy Intern"],
    Lab: ["Lab Intern"],
    "Hospital Admin": ["Admin Intern"],
  },
  Marketing: {
    "Digital Marketing": ["SEO Intern", "Social Media Intern"],
    Sales: ["Sales Intern"],
    Content: ["Content Writing Intern"],
  },
  Education: {
    Teaching: ["Teaching Intern", "Tutor Intern"],
    Administration: ["Admin Intern"],
  },
  Finance: {
    Banking: ["Banking Intern"],
    Accounts: ["Accounts Intern"],
  },
};

const badgeCls = {
  Internship: "bg-emerald-50 border-emerald-200 text-emerald-700",
  New: "bg-blue-50 border-blue-200 text-[#2563EB]",
};

function toInitials(name = "") {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((x) => x[0])
    .join("")
    .toUpperCase();
}

function money(n) {
  const v = Number(n || 0);
  return `₹${v.toLocaleString("en-IN")}`;
}

function mapFromApi(x) {
  if (!x) return null;
  return {
    id: x.id || x._id,
    title: x.title || "",
    company: x.company || x.companyName || "",
    location: x.location || "",
    stipendMin: Number(x.stipendMin || 0),
    stipendMax: Number(x.stipendMax || 0),
    duration: x.duration || "",
    tags: Array.isArray(x.tags) ? x.tags : [],
    category: x.category || "",
    subCategory: x.subCategory || x.subcategory || x.role || "",
    stream: x.stream || "",
    workMode: x.workMode || "",
    type: x.type || "",
    createdAt: x.createdAt || null,
    phone: x.phone || x.companyPhone || "",
  };
}

function daysAgo(dt) {
  if (!dt) return "";
  const d = new Date(dt);
  if (Number.isNaN(d.getTime())) return "";
  const diff = Date.now() - d.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days <= 0) return "Today";
  if (days === 1) return "1 day ago";
  return `${days} days ago`;
}

function isNew(createdAt) {
  if (!createdAt) return false;
  const d = new Date(createdAt);
  if (Number.isNaN(d.getTime())) return false;
  const diffDays = Math.floor((Date.now() - d.getTime()) / (1000 * 60 * 60 * 24));
  return diffDays <= 7;
}

function readProfileCompletion(payload) {
  const data = payload?.data ?? payload ?? {};
  const n = Number(data?.profileCompletion ?? data?.studentProfile?.profileCompletion ?? 0);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(100, Math.round(n)));
}

export default function Internship() {
  const { isAuthed, role } = useAuth();
  const navigate = useNavigate();
  const routeLocation = useLocation();
  const isStudentView = routeLocation.pathname.startsWith("/student");
  const withBase = (path) => `${isStudentView ? "/student" : ""}${path}`;
  const redirectToLogin = () => {
    const redirect = isStudentView
      ? `${routeLocation.pathname}${routeLocation.search || ""}`
      : `/student${routeLocation.pathname === "/" ? "" : routeLocation.pathname}${routeLocation.search || ""}`;
    if (isStudentView) {
      navigate("/student/login");
      return;
    }
    navigate(`/login?role=student&redirect=${encodeURIComponent(redirect)}`);
  };
  const [q, setQ] = useState("");
  const [location, setLocation] = useState("");
  const [activeTab, setActiveTab] = useState("All Internships");
  const [selectedMainStream, setSelectedMainStream] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedSubCategory, setSelectedSubCategory] = useState("");
  const [mainStreamOther, setMainStreamOther] = useState("");
  const [categoryOther, setCategoryOther] = useState("");
  const [subCategoryOther, setSubCategoryOther] = useState("");

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState({ total: 0, pages: 1, page: 1, limit: 10 });

  const [savedMap, setSavedMap] = useState({});
  const [savedBusy, setSavedBusy] = useState({});
  const [appliedIds, setAppliedIds] = useState(new Set());
  const [profileCompletion, setProfileCompletion] = useState(0);
  const [popup, setPopup] = useState({
    open: false,
    variant: "info",
    badge: "Status",
    title: "",
    message: "",
    details: [],
    primaryLabel: "Done",
    primaryHref: "",
    secondaryLabel: "",
    onPrimary: null,
  });

  const mainStreamOptions = useMemo(() => Object.keys(internshipTaxonomy), []);
  const categoryOptions = useMemo(() => {
    if (!selectedMainStream || selectedMainStream === OTHER_OPTION) return [];
    return Object.keys(internshipTaxonomy[selectedMainStream] || {});
  }, [selectedMainStream]);
  const subCategoryOptions = useMemo(() => {
    if (!selectedMainStream || !selectedCategory) return [];
    if (selectedMainStream === OTHER_OPTION || selectedCategory === OTHER_OPTION) return [];
    return internshipTaxonomy[selectedMainStream]?.[selectedCategory] || [];
  }, [selectedMainStream, selectedCategory]);

  const fetchList = async (
    nextPage = 1,
    overrides = {}
  ) => {
    try {
      setErr("");
      setLoading(true);
      const mainStream = resolveHierarchyValue(overrides.mainStream ?? selectedMainStream, mainStreamOther);
      const category = resolveHierarchyValue(overrides.category ?? selectedCategory, categoryOther);
      const subCategory = resolveHierarchyValue(overrides.subCategory ?? selectedSubCategory, subCategoryOther);
      const streamParam = mainStream || (activeTab !== "All Internships" ? activeTab : undefined);

      const params = {
        page: nextPage,
        limit: meta.limit,
        q: q || undefined,
        location: location || undefined,
        stream: streamParam,
        category: category || undefined,
        subCategory: subCategory || undefined,
        subcategory: subCategory || undefined,
      };

      const res = await api.get("/student/internships", { params });
      const payload = res?.data || {};
      const list = Array.isArray(payload.items)
        ? payload.items.map(mapFromApi).filter(Boolean)
        : [];

      setItems(list);
      setMeta({
        total: Number(payload.total || list.length || 0),
        pages: Number(payload.pages || 1),
        page: Number(payload.page || nextPage),
        limit: Number(payload.limit || meta.limit),
      });
    } catch (e) {
      console.error("internships fetch error:", e);
      setErr(e?.response?.data?.message || "Failed to load internships.");
      setItems([]);
      setMeta((m) => ({ ...m, total: 0, pages: 1, page: 1 }));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchList(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const [savedRes, appsRes, meRes] = await Promise.all([
          studentGetSavedJobs(),
          studentMyApplications({ page: 1, limit: 300 }),
          studentMe(),
        ]);
        const rows = Array.isArray(savedRes?.data) ? savedRes.data : [];
        const next = {};
        rows.forEach((r) => {
          const id = String(r?._id || r?.id || "");
          if (id) next[id] = true;
        });
        if (!mounted) return;
        setSavedMap(next);
        const appRows = Array.isArray(appsRes?.data?.items) ? appsRes.data.items : [];
        setAppliedIds(new Set(appRows.map((x) => String(x?.jobId || x?.job?._id || x?.job || "")).filter(Boolean)));
        setProfileCompletion(readProfileCompletion(meRes));
      } catch {
        if (mounted) {
          setSavedMap({});
          setAppliedIds(new Set());
        }
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const openPopup = (next) => {
    setPopup({
      open: true,
      variant: next.variant || "info",
      badge: next.badge || "Status",
      title: next.title || "",
      message: next.message || "",
      details: Array.isArray(next.details) ? next.details : [],
      primaryLabel: next.primaryLabel || "Done",
      primaryHref: next.primaryHref || "",
      secondaryLabel: next.secondaryLabel || "",
      onPrimary: next.onPrimary || null,
    });
  };

  const closePopup = () => {
    setPopup((prev) => ({ ...prev, open: false, onPrimary: null, primaryHref: "" }));
  };

  const ensureLatestCompletion = async () => {
    try {
      const meRes = await studentMe();
      const value = readProfileCompletion(meRes);
      setProfileCompletion(value);
      return value;
    } catch {
      return profileCompletion;
    }
  };

  const onApply = (item) => {
    if (!isAuthed || role !== "student") {
      redirectToLogin();
      return;
    }
    if (appliedIds.has(String(item?.id || ""))) {
      openPopup({
        variant: "info",
        badge: "Already Applied",
        title: "Application already exists",
        message: "You already applied for this internship. You can wait for the recruiter response.",
      });
      return;
    }
    openPopup({
      variant: "info",
      badge: "Confirm Apply",
      title: "Apply with your saved profile",
      message: `We will use your current profile and resume for ${item?.title || "this internship"}.`,
      primaryLabel: "Confirm Apply",
      secondaryLabel: "Cancel",
      onPrimary: async () => {
        try {
          const completion = await ensureLatestCompletion();
          if (completion < 100) {
            openPopup({
              variant: "warning",
              badge: "Complete Profile",
              title: "Finish your profile before applying",
              message: "Your profile needs to be fully completed before this application can be submitted.",
              details: [`Current profile completion: ${completion}%`],
              primaryLabel: "Complete Profile",
              primaryHref: "/student/profile",
              secondaryLabel: "Close",
            });
            return;
          }
          const res = await studentApplyJob(item?.id);
          setAppliedIds((prev) => new Set(prev).add(String(item?.id || "")));
          openPopup(
            res?.data?.alreadyApplied
              ? {
                  variant: "info",
                  badge: "Already Applied",
                  title: "Application already exists",
                  message: "You already applied for this internship. No duplicate application was created.",
                }
              : {
                  variant: "success",
                  badge: "Applied",
                  title: "Internship application submitted",
                  message: "Your internship application has been sent successfully.",
                }
          );
        } catch (e) {
          const status = Number(e?.response?.status || 0);
          if (status === 401 || status === 403) {
            redirectToLogin();
            return;
          }
          if (e?.response?.data?.profileIncomplete) {
            const completion = readProfileCompletion(e?.response);
            setProfileCompletion(completion);
            openPopup({
              variant: "warning",
              badge: "Complete Profile",
              title: "Finish your profile before applying",
              message: "Your profile needs to be fully completed before this application can be submitted.",
              details: [`Current profile completion: ${completion}%`],
              primaryLabel: "Complete Profile",
              primaryHref: "/student/profile",
              secondaryLabel: "Close",
            });
            return;
          }
          if (e?.response?.data?.alreadyApplied) {
            setAppliedIds((prev) => new Set(prev).add(String(item?.id || "")));
            openPopup({
              variant: "info",
              badge: "Already Applied",
              title: "Application already exists",
              message: "You already applied for this internship. No duplicate application was created.",
            });
            return;
          }
          setErr(e?.response?.data?.message || "Apply failed. Please try again.");
          closePopup();
        }
      },
    });
  };

  const onSearch = () => fetchList(1);

  const toggleSaved = async (id) => {
    try {
      setSavedBusy((p) => ({ ...p, [id]: true }));
      const res = await studentToggleSaveJob(id);
      setSavedMap((p) => ({ ...p, [id]: !!res?.data?.saved }));
    } catch (e) {
      setErr(e?.response?.data?.message || "Failed to update saved jobs.");
    } finally {
      setSavedBusy((p) => ({ ...p, [id]: false }));
    }
  };

  return (
    <div className="bg-[#F6F8FF] pb-24 md:pb-10">
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-24 left-1/2 h-[26rem] w-[52rem] -translate-x-1/2 rounded-full bg-blue-200/45 blur-3xl" />
        <div className="absolute top-28 right-[-12rem] h-[22rem] w-[22rem] rounded-full bg-orange-200/35 blur-3xl" />
        <div className="absolute bottom-[-10rem] left-[-10rem] h-[28rem] w-[28rem] rounded-full bg-violet-200/25 blur-3xl" />
        <div className="absolute inset-0 opacity-[0.35] [background-image:radial-gradient(rgba(15,23,42,0.08)_1px,transparent_1px)] [background-size:18px_18px]" />
      </div>

      <div className="w-full px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-4">
          <p className="text-xs text-slate-500">
            <Link to={withBase("/")} className="hover:text-[#2563EB]">
              Home
            </Link>{" "}
            <span className="px-1.5">/</span>
            <span className="text-slate-700">Internships</span>
          </p>
          <h1 className="mt-2 text-3xl font-extrabold text-[#0F172A]">Internships</h1>
          <p className="mt-1 text-sm text-slate-500">Find your ideal internship opportunity</p>
          {err ? <p className="mt-2 text-sm font-semibold text-red-600">{err}</p> : null}
        </div>

        <div className="rounded-2xl border border-white/60 bg-white/70 p-3 shadow-sm backdrop-blur">
          <div className="grid grid-cols-1 gap-2 md:grid-cols-[1fr_220px_220px_170px]">
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search internships..."
                className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-sm outline-none focus:border-orange-300"
              />
            </div>

            <div className="relative">
              <select
                value={activeTab}
                onChange={(e) => setActiveTab(e.target.value)}
                className="h-11 w-full appearance-none rounded-xl border border-slate-200 bg-white px-3 pr-9 text-sm font-semibold text-slate-700"
              >
                {CHIP_TABS.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
              <FiChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-500" />
            </div>

            <div className="relative">
              <input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Location"
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 pr-9 text-sm font-semibold text-slate-700"
              />
              <FiChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 opacity-0" />
            </div>

            <button
              type="button"
              onClick={onSearch}
              className="h-11 rounded-xl bg-[#F97316] px-4 text-sm font-extrabold text-white shadow-sm hover:bg-orange-600"
            >
              Search Internships
            </button>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            {CHIP_TABS.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => {
                  setActiveTab(t);
                  fetchList(1);
                }}
                className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                  activeTab === t
                    ? "border-orange-200 bg-orange-50 text-[#F97316]"
                    : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-[280px_minmax(0,1fr)_320px]">
                    <aside className="space-y-3">
            <div className="rounded-2xl border border-white/60 bg-white/70 p-4 shadow-sm backdrop-blur">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-extrabold text-[#0F172A]">Filter Internships</h3>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedMainStream("");
                    setSelectedCategory("");
                    setSelectedSubCategory("");
                    setMainStreamOther("");
                    setCategoryOther("");
                    setSubCategoryOther("");
                    fetchList(1, { mainStream: "", category: "", subCategory: "" });
                  }}
                  className="text-xs font-extrabold text-[#F97316] hover:text-orange-600"
                >
                  Clear
                </button>
              </div>

              <div className="mt-3">
                <p className="text-xs font-bold text-slate-700">Main Stream</p>
                <div className="relative mt-2">
                  <select
                    value={selectedMainStream}
                    onChange={(e) => {
                      const value = e.target.value;
                      setSelectedMainStream(value);
                      if (value !== OTHER_OPTION) setMainStreamOther("");
                      setSelectedCategory("");
                      setCategoryOther("");
                      setSelectedSubCategory("");
                      setSubCategoryOther("");
                      if (!value) {
                        fetchList(1, { mainStream: "", category: "", subCategory: "" });
                        return;
                      }
                      if (value !== OTHER_OPTION) {
                        fetchList(1, { mainStream: value, category: "", subCategory: "" });
                      }
                    }}
                    className="h-10 w-full appearance-none rounded-xl border border-slate-200 bg-white px-3 pr-9 text-sm font-semibold text-slate-700 outline-none focus:border-orange-300"
                  >
                    <option value="">Select Main Stream</option>
                    {mainStreamOptions.map((v) => (
                      <option key={v} value={v}>
                        {v}
                      </option>
                    ))}
                    <option value={OTHER_OPTION}>Other</option>
                  </select>
                  <FiChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                </div>
                {selectedMainStream === OTHER_OPTION ? (
                  <input
                    value={mainStreamOther}
                    onChange={(e) => setMainStreamOther(e.target.value)}
                    placeholder="Enter custom main stream"
                    className="mt-2 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none focus:border-orange-300"
                  />
                ) : null}
              </div>

              <div className="mt-4">
                <p className="text-xs font-bold text-slate-700">Category</p>
                <div className="relative mt-2">
                  <select
                    value={selectedCategory}
                    disabled={!selectedMainStream}
                    onChange={(e) => {
                      const value = e.target.value;
                      setSelectedCategory(value);
                      if (value !== OTHER_OPTION) setCategoryOther("");
                      setSelectedSubCategory("");
                      setSubCategoryOther("");
                      if (!value) {
                        fetchList(1, {
                          mainStream: selectedMainStream,
                          category: "",
                          subCategory: "",
                        });
                        return;
                      }
                      if (value !== OTHER_OPTION) {
                        fetchList(1, {
                          mainStream: selectedMainStream,
                          category: value,
                          subCategory: "",
                        });
                      }
                    }}
                    className="h-10 w-full appearance-none rounded-xl border border-slate-200 bg-white px-3 pr-9 text-sm font-semibold text-slate-700 outline-none focus:border-orange-300 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400"
                  >
                    <option value="">Select Category</option>
                    {categoryOptions.map((v) => (
                      <option key={v} value={v}>
                        {v}
                      </option>
                    ))}
                    {selectedMainStream ? <option value={OTHER_OPTION}>Other</option> : null}
                  </select>
                  <FiChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                </div>
                {selectedCategory === OTHER_OPTION ? (
                  <input
                    value={categoryOther}
                    onChange={(e) => setCategoryOther(e.target.value)}
                    placeholder="Enter custom category"
                    className="mt-2 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none focus:border-orange-300"
                  />
                ) : null}
              </div>

              <div className="mt-4">
                <p className="text-xs font-bold text-slate-700">Sub Category</p>
                <div className="relative mt-2">
                  <select
                    value={selectedSubCategory}
                    disabled={!selectedCategory}
                    onChange={(e) => {
                      const value = e.target.value;
                      setSelectedSubCategory(value);
                      if (value !== OTHER_OPTION) setSubCategoryOther("");
                      if (!value) {
                        fetchList(1, {
                          mainStream: selectedMainStream,
                          category: selectedCategory,
                          subCategory: "",
                        });
                        return;
                      }
                      if (value !== OTHER_OPTION) {
                        fetchList(1, {
                          mainStream: selectedMainStream,
                          category: selectedCategory,
                          subCategory: value,
                        });
                      }
                    }}
                    className="h-10 w-full appearance-none rounded-xl border border-slate-200 bg-white px-3 pr-9 text-sm font-semibold text-slate-700 outline-none focus:border-orange-300 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400"
                  >
                    <option value="">Select Sub Category</option>
                    {subCategoryOptions.map((v) => (
                      <option key={v} value={v}>
                        {v}
                      </option>
                    ))}
                    {selectedCategory ? <option value={OTHER_OPTION}>Other</option> : null}
                  </select>
                  <FiChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                </div>
                {selectedSubCategory === OTHER_OPTION ? (
                  <input
                    value={subCategoryOther}
                    onChange={(e) => setSubCategoryOther(e.target.value)}
                    placeholder="Enter custom sub category"
                    className="mt-2 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none focus:border-orange-300"
                  />
                ) : null}
              </div>

              <button
                type="button"
                onClick={() => fetchList(1)}
                className="mt-4 w-full rounded-xl bg-[#F97316] px-4 py-2.5 text-sm font-extrabold text-white hover:bg-orange-600"
              >
                Apply Filter
              </button>

              <div className="mt-3 rounded-[16px] border border-slate-200/70 bg-white/70 p-3 text-[12px] font-semibold text-slate-600">
                Tip: Choose Main Stream &rarr; Category &rarr; Sub Category for exact results.
              </div>
            </div>
          </aside>

          <main className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <div className="text-sm font-extrabold text-[#0F172A]">
                {meta.total.toLocaleString("en-IN")} Internship Opportunities
              </div>
            </div>

            {loading ? (
              <div className="rounded-2xl border border-white/60 bg-white/70 p-5 text-sm text-slate-600 shadow-sm backdrop-blur">
                Loading internships...
              </div>
            ) : null}

            {!loading && items.length === 0 ? (
              <div className="rounded-2xl border border-white/60 bg-white/70 p-5 text-sm text-slate-600 shadow-sm backdrop-blur">
                No internships found.
              </div>
            ) : null}

            {!loading &&
              items.map((it) => (
                <article
                  key={it.id}
                  className="rounded-2xl border border-white/60 bg-white/70 p-4 shadow-sm backdrop-blur transition hover:shadow-md"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 font-bold text-[#2563EB]">
                        {toInitials(it.company)}
                      </div>

                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-extrabold ${badgeCls.Internship}`}
                          >
                            Internship
                          </span>
                          {isNew(it.createdAt) ? (
                            <span
                              className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-extrabold ${badgeCls.New}`}
                            >
                              NEW
                            </span>
                          ) : null}
                        </div>

                        <Link
                          to={withBase(`/internship/${it.id}`)}
                          className="mt-2 block truncate text-base font-extrabold text-[#0F172A] hover:text-[#2563EB]"
                        >
                          {it.title || "Internship"}
                        </Link>

                        <p className="text-sm font-semibold text-slate-600">
                          {it.company || "Company"}
                        </p>

                        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-slate-600">
                          {it.location ? (
                            <span className="inline-flex items-center gap-1">
                              <FiMapPin /> {it.location}
                            </span>
                          ) : null}
                          {(it.stipendMin || it.stipendMax) ? (
                            <span className="font-extrabold text-[#F97316]">
                              {money(it.stipendMin)} - {money(it.stipendMax)}/month
                            </span>
                          ) : null}
                          {it.duration ? <span className="text-slate-500">{it.duration}</span> : null}
                        </div>
                      </div>
                    </div>

                    <div className="text-xs font-semibold text-slate-400">
                      {daysAgo(it.createdAt)}
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => navigate(withBase(`/internship/${it.id}`))}
                      className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-extrabold text-slate-700 hover:bg-slate-50"
                    >
                      <FiExternalLink /> View Details
                    </button>

                    {it.phone ? (
                      <button
                        type="button"
                        className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-xs font-extrabold text-[#2563EB] hover:bg-blue-100"
                        onClick={() => {
                          window.open(`tel:${it.phone}`, "_self");
                        }}
                      >
                        <FiPhoneCall /> Call HR
                      </button>
                    ) : null}

                    <button
                      type="button"
                      onClick={() => onApply(it)}
                      className={`ml-auto inline-flex items-center justify-center rounded-full px-5 py-2 text-xs font-extrabold text-white ${
                        appliedIds.has(String(it.id)) ? "bg-emerald-600 hover:bg-emerald-600" : "bg-[#F97316] hover:bg-orange-600"
                      }`}
                    >
                      {appliedIds.has(String(it.id)) ? "Applied" : "Quick Apply"}
                    </button>

                    <button
                      type="button"
                      onClick={() => toggleSaved(it.id)}
                      disabled={!!savedBusy[it.id]}
                      className={`inline-flex h-9 w-9 items-center justify-center rounded-full border transition ${
                        savedMap[it.id]
                          ? "border-blue-200 bg-blue-50 text-[#2563EB]"
                          : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                      }`}
                      title="Save"
                    >
                      <FiBookmark />
                    </button>
                  </div>
                </article>
              ))}

            <div className="flex items-center justify-center gap-1 pt-1">
              <span className="mr-2 text-xs text-slate-500">
                Showing {(meta.page - 1) * meta.limit + (items.length ? 1 : 0)} -{" "}
                {(meta.page - 1) * meta.limit + items.length} of {meta.total.toLocaleString("en-IN")} internships
              </span>
              {Array.from({ length: Math.min(5, meta.pages || 1) }).map((_, idx) => {
                const p = idx + 1;
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => fetchList(p)}
                    className={`h-8 min-w-8 rounded-lg border px-2 text-xs font-extrabold transition ${
                      p === meta.page
                        ? "border-orange-200 bg-orange-50 text-[#F97316]"
                        : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {p}
                  </button>
                );
              })}
              <button
                type="button"
                onClick={() => fetchList(Math.min(meta.pages || 1, meta.page + 1))}
                className="h-8 rounded-lg border border-slate-200 bg-white px-3 text-xs font-extrabold text-slate-600 hover:bg-slate-50"
                disabled={meta.page >= meta.pages}
              >
                Next
              </button>
            </div>
          </main>

          <aside className="space-y-3">
            <div className="rounded-2xl border border-white/60 bg-white/70 p-4 shadow-sm backdrop-blur">
              <img src={illTop} alt="tips" className="h-40 w-full object-contain" draggable="false" />
              <h3 className="mt-2 text-sm font-extrabold text-[#0F172A]">Manage Your Job Alerts</h3>
              <ul className="mt-2 space-y-2 text-xs font-semibold text-slate-600">
                <li className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-[#F97316]" /> Resume Tips
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-[#F97316]" /> Interview Questions
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-[#F97316]" /> Career Advice
                </li>
              </ul>
            </div>

            <div className="rounded-2xl border border-white/60 bg-white/70 p-4 shadow-sm backdrop-blur">
              <img src={illBottom} alt="resources" className="h-40 w-full object-contain" draggable="false" />
              <h3 className="mt-2 text-sm font-extrabold text-[#0F172A]">Tips & Resources</h3>
              <ul className="mt-2 space-y-2 text-xs font-semibold text-slate-600">
                <li className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-[#2563EB]" /> Resume Tips
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-[#2563EB]" /> Interview Questions
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-[#2563EB]" /> Career Advice
                </li>
              </ul>
            </div>
          </aside>
        </div>
      </div>

      <StatusPopup
        open={popup.open}
        onClose={closePopup}
        variant={popup.variant}
        badge={popup.badge}
        title={popup.title}
        message={popup.message}
        details={popup.details}
        primaryLabel={popup.primaryLabel}
        primaryHref={popup.primaryHref}
        onPrimary={popup.onPrimary}
        secondaryLabel={popup.secondaryLabel}
      />
    </div>
  );
}


