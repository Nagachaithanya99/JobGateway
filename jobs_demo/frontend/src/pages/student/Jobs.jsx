import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import {
  FiChevronDown,
  FiMapPin,
  FiSearch,
  FiClock,
  FiStar,
} from "react-icons/fi";
import {
  studentApplyJob,
  studentHome,
  studentSearchJobs,
} from "../../services/studentService.js";
import {
  getDefaultHierarchy,
  getJobTaxonomy,
  OTHER_OPTION,
  persistCustomHierarchy,
  resolveHierarchyValue,
} from "../../data/jobTaxonomy.js";

const TIPS_BANNER = "/images/jobs/tips-banner.png";
const TIPS_ILLUS = "/images/jobs/tips-illustration.png";
const INITIAL_TAXONOMY = getJobTaxonomy();
const DEFAULT_HIERARCHY = getDefaultHierarchy(INITIAL_TAXONOMY);

function moneyRange(job) {
  if (job?.salaryText) return job.salaryText;
  const min = Number(job?.salaryMin || 0);
  const max = Number(job?.salaryMax || 0);
  if (min || max) return `₹${min || ""} - ₹${max || ""} /mo`;
  return "—";
}

function postedAgo(createdAt) {
  if (!createdAt) return "";
  const d = new Date(createdAt);
  const ms = Date.now() - d.getTime();
  const mins = Math.floor(ms / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins} mins ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hours ago`;
  const days = Math.floor(hrs / 24);
  return `${days} days ago`;
}

function initials(name = "") {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((x) => x[0])
    .join("")
    .toUpperCase();
}

function normalizeItems(payload) {
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload)) return payload;
  return [];
}

export default function Jobs() {
  const locationPath = useLocation();
  const nav = useNavigate();
  const [searchParams] = useSearchParams();
  const isStudentView = locationPath.pathname.startsWith("/student");
  const withBase = (path) => `${isStudentView ? "/student" : ""}${path}`;
  const redirectToLogin = () => {
    const redirect = isStudentView
      ? `${locationPath.pathname}${locationPath.search || ""}`
      : `/student${locationPath.pathname === "/" ? "" : locationPath.pathname}${locationPath.search || ""}`;
    if (isStudentView) {
      nav("/student/login");
      return;
    }
    nav(`/login?role=student&redirect=${encodeURIComponent(redirect)}`);
  };
  const initialQ = String(searchParams.get("q") || "").trim();

  const [q, setQ] = useState(initialQ);
  const [stream, setStream] = useState("");
  const [location, setLocation] = useState("");
  const [pill, setPill] = useState("All Jobs");
  const [taxonomy, setTaxonomy] = useState(INITIAL_TAXONOMY);
  const [selectedMainStream, setSelectedMainStream] = useState(DEFAULT_HIERARCHY.stream);
  const [selectedCategory, setSelectedCategory] = useState(DEFAULT_HIERARCHY.category);
  const [selectedSubCategory, setSelectedSubCategory] = useState(DEFAULT_HIERARCHY.subCategory);
  const [mainStreamOther, setMainStreamOther] = useState("");
  const [categoryOther, setCategoryOther] = useState("");
  const [subCategoryOther, setSubCategoryOther] = useState("");

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, pages: 1, limit: 8 });
  const [optionRows, setOptionRows] = useState([]);
  const [categories, setCategories] = useState([]);

  const streamCounts = useMemo(() => {
    const map = new Map();
    optionRows.forEach((j) => {
      const k = String(j.stream || j.category || "").trim();
      if (!k) return;
      map.set(k, (map.get(k) || 0) + 1);
    });
    return Array.from(map.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }, [optionRows]);

  const locationOptions = useMemo(() => {
    const set = new Set();
    optionRows.forEach((j) => {
      const v = String(j.location || j.city || "").trim();
      if (v) set.add(v);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [optionRows]);

  const categoryPills = useMemo(() => {
    const fromHome = (categories || []).filter(Boolean).slice(0, 4);
    if (fromHome.length) return ["All Jobs", ...fromHome];
    const fromJobs = streamCounts.slice(0, 4).map((s) => s.name);
    return ["All Jobs", ...fromJobs];
  }, [categories, streamCounts]);

  const taxonomyMainStreams = useMemo(() => Object.keys(taxonomy), [taxonomy]);
  const taxonomyCategories = useMemo(() => {
    if (!selectedMainStream || selectedMainStream === OTHER_OPTION) return [];
    return Object.keys(taxonomy[selectedMainStream] || {});
  }, [selectedMainStream, taxonomy]);
  const taxonomySubCategories = useMemo(() => {
    if (!selectedMainStream || !selectedCategory) return [];
    if (selectedMainStream === OTHER_OPTION || selectedCategory === OTHER_OPTION) return [];
    return taxonomy[selectedMainStream]?.[selectedCategory] || [];
  }, [selectedMainStream, selectedCategory, taxonomy]);

  const buildParams = (page = 1, overrides = {}) => {
    const mainStream = resolveHierarchyValue(overrides.mainStream ?? selectedMainStream, mainStreamOther);
    const category = resolveHierarchyValue(overrides.category ?? selectedCategory, categoryOther);
    const subCategory = resolveHierarchyValue(overrides.subCategory ?? selectedSubCategory, subCategoryOther);
    const hasHierarchyOverride =
      Object.prototype.hasOwnProperty.call(overrides, "mainStream") ||
      Object.prototype.hasOwnProperty.call(overrides, "category") ||
      Object.prototype.hasOwnProperty.call(overrides, "subCategory");
    const isOnlyDefaultHierarchySelection =
      !hasHierarchyOverride &&
      mainStream === DEFAULT_HIERARCHY.stream &&
      category === DEFAULT_HIERARCHY.category &&
      subCategory === DEFAULT_HIERARCHY.subCategory &&
      !mainStreamOther &&
      !categoryOther &&
      !subCategoryOther;

    const params = {
      q: q || undefined,
      location: location || undefined,
      page,
      limit: meta.limit,
    };

    const topStream = stream || undefined;
    const pillStream = pill !== "All Jobs" ? pill : undefined;
    params.stream = (isOnlyDefaultHierarchySelection ? "" : mainStream) || topStream || pillStream;
    if (!isOnlyDefaultHierarchySelection && category) params.category = category;
    if (!isOnlyDefaultHierarchySelection && subCategory) {
      params.subCategory = subCategory;
      params.subcategory = subCategory;
    }

    return params;
  };

  const fetchJobs = async (page = 1, overrides = {}) => {
    try {
      setLoading(true);
      setErr("");
      const res = await studentSearchJobs(buildParams(page, overrides));
      const payload = res?.data || {};
      const nextItems = normalizeItems(payload);
      setItems(nextItems);
      setMeta((m) => ({
        ...m,
        total: payload.total ?? nextItems.length,
        pages: payload.pages ?? 1,
        page: payload.page ?? page,
        limit: payload.limit ?? m.limit,
      }));
    } catch (e) {
      setErr(e?.response?.data?.message || "Failed to load jobs.");
      setItems([]);
      setMeta((m) => ({ ...m, total: 0, pages: 1, page: 1 }));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const [jobsRes, homeRes] = await Promise.all([
          studentSearchJobs({ page: 1, limit: 200 }),
          studentHome(),
        ]);
        setOptionRows(normalizeItems(jobsRes?.data || {}));
        setCategories(Array.isArray(homeRes?.data?.categories) ? homeRes.data.categories : []);
      } catch (e) {
        setOptionRows([]);
        setCategories([]);
      }
    })();
  }, []);

  const clearFilters = () => {
    setStream("");
    setLocation("");
    setPill("All Jobs");
    setSelectedMainStream(DEFAULT_HIERARCHY.stream);
    setSelectedCategory(DEFAULT_HIERARCHY.category);
    setSelectedSubCategory(DEFAULT_HIERARCHY.subCategory);
    setMainStreamOther("");
    setCategoryOther("");
    setSubCategoryOther("");
    fetchJobs(1, DEFAULT_HIERARCHY);
  };

  const applyFilters = () => {
    const resolvedStream = resolveHierarchyValue(selectedMainStream, mainStreamOther);
    const resolvedCategory = resolveHierarchyValue(selectedCategory, categoryOther);
    const resolvedSubCategory = resolveHierarchyValue(selectedSubCategory, subCategoryOther);

    if (
      selectedMainStream === OTHER_OPTION ||
      selectedCategory === OTHER_OPTION ||
      selectedSubCategory === OTHER_OPTION
    ) {
      setTaxonomy(
        persistCustomHierarchy({
          stream: resolvedStream,
          category: resolvedCategory,
          subCategory: resolvedSubCategory,
        })
      );
    }
    fetchJobs(1, {
      mainStream: selectedMainStream,
      category: selectedCategory,
      subCategory: selectedSubCategory,
    });
  };

  const goto = (p) => {
    const next = Math.max(1, Math.min(meta.pages || 1, p));
    fetchJobs(next);
  };

  const onQuickApply = async (jobId) => {
    try {
      if (!jobId) return;
      await studentApplyJob(jobId);
    } catch (e) {
      const status = Number(e?.response?.status || 0);
      if (status === 401 || status === 403) {
        redirectToLogin();
        return;
      }
      setErr(e?.response?.data?.message || "Apply failed.");
    }
  };

  return (
    <div className="min-h-screen bg-[#fbf7f7] text-slate-900">
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(900px_circle_at_20%_10%,rgba(255,122,0,0.12),transparent_60%),radial-gradient(800px_circle_at_80%_20%,rgba(255,184,120,0.18),transparent_55%),radial-gradient(900px_circle_at_50%_90%,rgba(0,0,0,0.03),transparent_60%)]" />
        <div className="absolute inset-0 opacity-[0.16] [background-image:radial-gradient(#000_1px,transparent_1px)] [background-size:18px_18px]" />
      </div>

      <div className="w-full px-6 pb-12 pt-7">
        <div className="text-[12px] text-slate-500">
          <span>Home</span>
          <span className="mx-2">/</span>
          <span className="text-slate-700">Jobs</span>
        </div>

        <h1 className="mt-2 text-[40px] font-extrabold tracking-tight text-slate-900">
          {meta.total.toLocaleString()} Jobs Available
        </h1>

        <div className="mt-5 rounded-[22px] border border-white/70 bg-white/70 p-3 shadow-[0_16px_45px_rgba(15,23,42,0.08)] backdrop-blur">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-[1.1fr_0.7fr_0.8fr_0.55fr]">
            <div className="relative">
              <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Job Title, Skills..."
                className="h-[46px] w-full rounded-[16px] border border-slate-200 bg-white pl-11 pr-4 text-[14px] font-medium outline-none focus:border-orange-300 focus:ring-4 focus:ring-orange-100"
              />
            </div>

            <div className="relative">
              <select
                value={stream}
                onChange={(e) => setStream(e.target.value)}
                className="h-[46px] w-full appearance-none rounded-[16px] border border-slate-200 bg-white px-4 pr-10 text-[14px] font-medium outline-none focus:border-orange-300 focus:ring-4 focus:ring-orange-100"
              >
                <option value="">Select Stream</option>
                {streamCounts.map((s) => (
                  <option key={s.name} value={s.name}>
                    {s.name}
                  </option>
                ))}
              </select>
              <FiChevronDown className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" />
            </div>

            <div className="relative">
              <FiMapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <select
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="h-[46px] w-full appearance-none rounded-[16px] border border-slate-200 bg-white pl-11 pr-10 text-[14px] font-medium outline-none focus:border-orange-300 focus:ring-4 focus:ring-orange-100"
              >
                <option value="">Location</option>
                {locationOptions.map((loc) => (
                  <option key={loc} value={loc}>
                    {loc}
                  </option>
                ))}
              </select>
              <FiChevronDown className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" />
            </div>

            <button
              type="button"
              onClick={() => fetchJobs(1)}
              className="h-[46px] rounded-[16px] bg-[#ff7a00] text-[14px] font-extrabold text-white shadow-[0_10px_25px_rgba(255,122,0,0.35)] transition hover:bg-[#ff6a00]"
            >
              Search Jobs
            </button>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-3">
          {categoryPills.map((x) => {
            const active = pill === x;
            return (
              <button
                key={x}
                type="button"
                onClick={() => {
                  setPill(x);
                  setTimeout(() => fetchJobs(1), 0);
                }}
                className={`h-[34px] rounded-full border px-5 text-[13px] font-bold transition ${
                  active
                    ? "border-orange-200 bg-orange-100 text-[#c45500]"
                    : "border-slate-200 bg-white/70 text-slate-700 hover:bg-white"
                }`}
              >
                {x}
              </button>
            );
          })}
        </div>

        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[300px_1fr]">
          <aside className="rounded-[22px] border border-white/70 bg-white/70 p-5 shadow-[0_16px_45px_rgba(15,23,42,0.07)] backdrop-blur">
            <div className="flex items-center justify-between">
              <h3 className="text-[18px] font-extrabold text-slate-900">Filter Jobs</h3>
              <button
                type="button"
                onClick={clearFilters}
                className="text-[12px] font-bold text-orange-600 hover:text-orange-700"
              >
                Clear
              </button>
            </div>

            <div className="mt-4 space-y-5">
              <section className="border-t border-slate-200/70 pt-4">
                <p className="text-[14px] font-extrabold text-[#c45500]">Main Stream</p>
                <div className="relative mt-2">
                  <select
                    value={selectedMainStream}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value && value !== OTHER_OPTION) {
                        const nextCategories = Object.keys(taxonomy[value] || {});
                        const nextCategory = nextCategories[0] || "";
                        const nextSubCategory = nextCategory ? taxonomy[value]?.[nextCategory]?.[0] || "" : "";
                        setSelectedMainStream(value);
                        setMainStreamOther("");
                        setSelectedCategory(nextCategory);
                        setCategoryOther("");
                        setSelectedSubCategory(nextSubCategory);
                        setSubCategoryOther("");
                        fetchJobs(1, { mainStream: value, category: nextCategory, subCategory: nextSubCategory });
                        return;
                      }
                      setSelectedMainStream(value);
                      if (value !== OTHER_OPTION) setMainStreamOther("");
                      setSelectedCategory("");
                      setCategoryOther("");
                      setSelectedSubCategory("");
                      setSubCategoryOther("");
                      fetchJobs(1, { mainStream: value, category: "", subCategory: "" });
                    }}
                    className="h-10 w-full appearance-none rounded-xl border border-slate-200 bg-white px-3 pr-9 text-[13px] font-semibold text-slate-700 outline-none focus:border-orange-300"
                  >
                    <option value="">Main Stream (e.g., IT & Software)</option>
                    {taxonomyMainStreams.map((v) => (
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
                    className="mt-2 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-[13px] font-semibold text-slate-700 outline-none focus:border-orange-300"
                  />
                ) : null}
              </section>

              <section className="border-t border-slate-200/70 pt-4">
                <p className="text-[14px] font-extrabold text-slate-900">Category</p>
                <div className="relative mt-2">
                  <select
                    value={selectedCategory}
                    disabled={!selectedMainStream}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (
                        value &&
                        value !== OTHER_OPTION &&
                        selectedMainStream &&
                        selectedMainStream !== OTHER_OPTION
                      ) {
                        const nextSubCategory = taxonomy[selectedMainStream]?.[value]?.[0] || "";
                        setSelectedCategory(value);
                        setCategoryOther("");
                        setSelectedSubCategory(nextSubCategory);
                        setSubCategoryOther("");
                        fetchJobs(1, {
                          mainStream: selectedMainStream,
                          category: value,
                          subCategory: nextSubCategory,
                        });
                        return;
                      }
                      setSelectedCategory(value);
                      if (value !== OTHER_OPTION) setCategoryOther("");
                      setSelectedSubCategory("");
                      setSubCategoryOther("");
                      fetchJobs(1, {
                        mainStream: selectedMainStream,
                        category: value,
                        subCategory: "",
                      });
                    }}
                    className="h-10 w-full appearance-none rounded-xl border border-slate-200 bg-white px-3 pr-9 text-[13px] font-semibold text-slate-700 outline-none focus:border-orange-300 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400"
                  >
                    <option value="">Category (e.g., Development)</option>
                    {taxonomyCategories.map((v) => (
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
                    className="mt-2 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-[13px] font-semibold text-slate-700 outline-none focus:border-orange-300"
                  />
                ) : null}
              </section>

              <section className="border-t border-slate-200/70 pt-4">
                <p className="text-[14px] font-extrabold text-slate-900">Sub Category</p>
                <div className="relative mt-2">
                  <select
                    value={selectedSubCategory}
                    disabled={!selectedCategory}
                    onChange={(e) => {
                      const value = e.target.value;
                      setSelectedSubCategory(value);
                      if (value !== OTHER_OPTION) setSubCategoryOther("");
                      fetchJobs(1, {
                        mainStream: selectedMainStream,
                        category: selectedCategory,
                        subCategory: value,
                      });
                    }}
                    className="h-10 w-full appearance-none rounded-xl border border-slate-200 bg-white px-3 pr-9 text-[13px] font-semibold text-slate-700 outline-none focus:border-orange-300 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400"
                  >
                    <option value="">Sub Category (e.g., Frontend)</option>
                    {taxonomySubCategories.map((v) => (
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
                    className="mt-2 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-[13px] font-semibold text-slate-700 outline-none focus:border-orange-300"
                  />
                ) : null}
              </section>

              <button
                type="button"
                onClick={applyFilters}
                className="mt-2 h-[40px] w-full rounded-[14px] bg-[#ff7a00] text-[13px] font-extrabold text-white shadow-[0_10px_25px_rgba(255,122,0,0.32)] hover:bg-[#ff6a00]"
              >
                Apply Filter
              </button>

              <div className="rounded-[16px] border border-slate-200/70 bg-white/70 p-3 text-[12px] font-semibold text-slate-600">
                Tip: Choose Main Stream &rarr; Category &rarr; Sub Category for exact results.
              </div>
            </div>
          </aside>

          <section>
            <div className="rounded-[22px] border border-white/70 bg-white/70 p-5 shadow-[0_16px_45px_rgba(15,23,42,0.07)] backdrop-blur">
              {err ? (
                <div className="rounded-[16px] border border-rose-200 bg-rose-50 px-4 py-3 text-[13px] font-semibold text-rose-700">
                  {err}
                </div>
              ) : null}

              {loading ? (
                <div className="py-12 text-center text-[14px] font-semibold text-slate-600">
                  Loading jobs...
                </div>
              ) : items.length === 0 ? (
                <div className="py-14 text-center text-[14px] font-semibold text-slate-600">
                  No jobs found.
                </div>
              ) : (
                <div className="space-y-4">
                  {items.map((job) => {
                    const id = String(job?._id || job?.id || "");
                    const title = job?.title || "Job";
                    const company = job?.companyName || job?.company?.name || "Company";
                    const loc = job?.location || job?.city || "India";
                    const tag = job?.category || job?.stream || "General";
                    const rating = Number.isFinite(Number(job?.rating)) ? Number(job.rating) : 0;

                    return (
                      <article
                        key={id || `${title}-${company}`}
                        className="rounded-[22px] border border-slate-200/70 bg-white/80 px-5 py-4 shadow-[0_10px_25px_rgba(15,23,42,0.06)]"
                      >
                        <div className="flex gap-4">
                          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[14px] bg-gradient-to-b from-orange-400 to-orange-500 text-[18px] font-extrabold text-white shadow-sm">
                            {initials(company) || "JG"}
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="truncate text-[22px] font-extrabold text-slate-900">
                                {title}
                              </h3>
                              <div className="ml-auto flex items-center gap-2 text-[12px] font-semibold text-slate-500">
                                <FiClock />
                                {postedAgo(job?.createdAt)}
                              </div>
                            </div>

                            <p className="-mt-0.5 text-[15px] font-semibold text-slate-600">{company}</p>

                            <div className="mt-2 flex flex-wrap items-center gap-x-6 gap-y-2 text-[14px] font-semibold text-slate-600">
                              <span className="inline-flex items-center gap-2">
                                <FiMapPin className="text-slate-500" />
                                {loc}
                              </span>

                              <span className="text-[18px] font-extrabold text-emerald-700">{moneyRange(job)}</span>

                              <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-4 py-1 text-[13px] font-bold text-slate-700">
                                <span className="h-2 w-2 rounded-full bg-slate-400" />
                                {tag}
                              </span>

                              <span className="ml-auto inline-flex items-center gap-2 text-[13px] font-extrabold text-orange-600">
                                <Stars value={rating} />
                                <span className="text-slate-600">{rating ? rating.toFixed(1) : "N/A"}</span>
                              </span>
                            </div>
                          </div>

                          <div className="hidden shrink-0 flex-col items-end gap-2 md:flex">
                            {id ? (
                              <Link
                                to={withBase(`/jobs/${id}`)}
                                className="h-[40px] w-[132px] rounded-[14px] border border-slate-200 bg-white text-center text-[13px] font-extrabold leading-[40px] text-slate-700 hover:bg-slate-50"
                              >
                                View Details
                              </Link>
                            ) : null}
                            <button
                              type="button"
                              onClick={() => onQuickApply(id)}
                              disabled={!id}
                              className="h-[40px] w-[132px] rounded-[14px] bg-[#ff7a00] text-[13px] font-extrabold text-white shadow-[0_10px_25px_rgba(255,122,0,0.35)] hover:bg-[#ff6a00] disabled:opacity-50"
                            >
                              Quick Apply
                            </button>
                          </div>
                        </div>

                        <div className="mt-4 flex gap-2 md:hidden">
                          {id ? (
                            <Link
                              to={withBase(`/jobs/${id}`)}
                              className="flex-1 rounded-[14px] border border-slate-200 bg-white py-2 text-center text-[13px] font-extrabold text-slate-700"
                            >
                              View Details
                            </Link>
                          ) : null}
                          <button
                            type="button"
                            onClick={() => onQuickApply(id)}
                            disabled={!id}
                            className="flex-1 rounded-[14px] bg-[#ff7a00] py-2 text-[13px] font-extrabold text-white disabled:opacity-50"
                          >
                            Quick Apply
                          </button>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}

              <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
                <p className="text-[12px] font-semibold text-slate-500">
                  Showing {items.length ? (meta.page - 1) * meta.limit + 1 : 0} -{" "}
                  {Math.min(meta.page * meta.limit, meta.total)} of {meta.total.toLocaleString()} jobs
                </p>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => goto(meta.page - 1)}
                    disabled={meta.page <= 1}
                    className="h-[38px] rounded-[14px] border border-slate-200 bg-white px-4 text-[13px] font-extrabold text-slate-700 disabled:opacity-50"
                  >
                    Prev
                  </button>

                  {Array.from({ length: Math.min(5, meta.pages || 1) }).map((_, i) => {
                    const n = i + 1;
                    const active = n === meta.page;
                    return (
                      <button
                        key={n}
                        type="button"
                        onClick={() => goto(n)}
                        className={`h-[38px] w-[38px] rounded-[14px] border text-[13px] font-extrabold ${
                          active
                            ? "border-orange-200 bg-orange-100 text-[#c45500]"
                            : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        {n}
                      </button>
                    );
                  })}

                  <button
                    type="button"
                    onClick={() => goto(meta.page + 1)}
                    disabled={meta.page >= meta.pages}
                    className="h-[38px] rounded-[14px] border border-slate-200 bg-white px-4 text-[13px] font-extrabold text-slate-700 disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="overflow-hidden rounded-[22px] border border-white/70 bg-white/70 shadow-[0_16px_45px_rgba(15,23,42,0.07)] backdrop-blur">
                <div className="h-[190px] w-full">
                  <img
                    src={TIPS_ILLUS}
                    alt="Tips banner"
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = TIPS_BANNER;
                    }}
                  />
                </div>
              </div>

              <div className="overflow-hidden rounded-[22px] border border-white/70 bg-white/70 shadow-[0_16px_45px_rgba(15,23,42,0.07)] backdrop-blur">
                <div className="flex h-[190px] w-full">
                  <div className="flex-1 p-6">
                    <h4 className="text-[20px] font-extrabold text-slate-900">Tips &amp; Resources</h4>

                    <ul className="mt-4 space-y-2 text-[14px] font-semibold text-slate-700">
                      <li className="flex items-center gap-3">
                        <span className="h-2 w-2 rounded-full bg-orange-400" />
                        Resume Tips
                      </li>
                      <li className="flex items-center gap-3">
                        <span className="h-2 w-2 rounded-full bg-orange-400" />
                        Interview Questions
                      </li>
                      <li className="flex items-center gap-3">
                        <span className="h-2 w-2 rounded-full bg-orange-400" />
                        Career Advice
                      </li>
                      <li className="flex items-center gap-3">
                        <span className="h-2 w-2 rounded-full bg-orange-400" />
                        Govt Job Updates
                      </li>
                    </ul>

                    <button
                      type="button"
                      className="mt-5 h-[40px] rounded-[14px] bg-[#ff7a00] px-6 text-[13px] font-extrabold text-white shadow-[0_10px_25px_rgba(255,122,0,0.35)] hover:bg-[#ff6a00]"
                    >
                      View All Tips
                    </button>
                  </div>

                  <div className="hidden w-[180px] items-end justify-end p-3 md:flex">
                    <img
                      src={TIPS_BANNER}
                      alt="Resources"
                      className="h-[150px] w-[160px] object-contain opacity-90"
                    />
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function Stars({ value = 0 }) {
  const full = Math.max(0, Math.min(5, Math.round(value)));
  return (
    <span className="inline-flex items-center gap-[2px]">
      {Array.from({ length: 5 }).map((_, i) => (
        <FiStar key={i} className={i < full ? "text-orange-500" : "text-slate-300"} />
      ))}
    </span>
  );
}


