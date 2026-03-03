import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { FiExternalLink, FiFilter, FiSearch, FiChevronDown } from "react-icons/fi";
import { studentListGovernmentJobs } from "../../services/studentService.js";

const ILL_TOP = "/images/student-government/gov-illustration-top.png";
const ILL_BOTTOM = "/images/student-government/gov-illustration-bottom.png";

function fmt(v) {
  if (!v) return "";
  return new Date(v).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function GovernmentJobs() {
  const location = useLocation();
  const isStudentView = location.pathname.startsWith("/student");
  const withBase = (path) => `${isStudentView ? "/student" : ""}${path}`;

  const [rows, setRows] = useState([]);
  const [optionRows, setOptionRows] = useState([]);

  const [loading, setLoading] = useState(true);
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [err, setErr] = useState("");

  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({ total: 0, pages: 1, limit: 12 });

  const [selectedChip, setSelectedChip] = useState("All Updates");
  const [filters, setFilters] = useState({
    search: "",
    department: "",
    examType: "",
    state: "",
    jobType: "",
    qualification: "",
    sort: "Most Recent",
  });
  const [draft, setDraft] = useState({ ...filters });

  const departmentOptions = useMemo(
    () =>
      Array.from(
        new Set(optionRows.map((x) => String(x.department || "").trim()).filter(Boolean))
      ).sort((a, b) => a.localeCompare(b)),
    [optionRows]
  );

  const examTypeOptions = useMemo(
    () =>
      Array.from(
        new Set(optionRows.map((x) => String(x.examType || "").trim()).filter(Boolean))
      ).sort((a, b) => a.localeCompare(b)),
    [optionRows]
  );

  const stateOptions = useMemo(
    () =>
      Array.from(
        new Set(optionRows.map((x) => String(x.state || "").trim()).filter(Boolean))
      ).sort((a, b) => a.localeCompare(b)),
    [optionRows]
  );

  const jobTypeOptions = useMemo(
    () =>
      Array.from(
        new Set(optionRows.map((x) => String(x.jobType || "").trim()).filter(Boolean))
      ).sort((a, b) => a.localeCompare(b)),
    [optionRows]
  );

  const qualificationOptions = useMemo(
    () =>
      Array.from(
        new Set(optionRows.map((x) => String(x.qualification || "").trim()).filter(Boolean))
      ).sort((a, b) => a.localeCompare(b)),
    [optionRows]
  );

  const chips = useMemo(() => {
    const dynamic = examTypeOptions.slice(0, 8);
    return ["All Updates", "Latest", ...dynamic];
  }, [examTypeOptions]);

  const load = async ({ nextFilters = filters, nextPage = 1, chip = selectedChip } = {}) => {
    try {
      setErr("");
      setLoading(true);

      const params = {
        search: nextFilters.search || undefined,
        department: nextFilters.department || undefined,
        examType: nextFilters.examType || undefined,
        state: nextFilters.state || undefined,
        jobType: nextFilters.jobType || undefined,
        qualification: nextFilters.qualification || undefined,
        page: nextPage,
        limit: meta.limit,
      };

      if (chip && chip !== "All Updates") {
        if (chip === "Latest") params.search = params.search || "";
        else params.examType = params.examType || chip;
      }

      const res = await studentListGovernmentJobs(params);
      const payload = res?.data || {};
      let items = Array.isArray(payload?.items) ? payload.items : [];

      if (nextFilters.sort === "Oldest") {
        items = [...items].sort((a, b) => {
          const da = new Date(a?.publishedAt || a?.createdAt || 0).getTime();
          const db = new Date(b?.publishedAt || b?.createdAt || 0).getTime();
          return da - db;
        });
      }

      setRows(items);
      setMeta({
        total: Number(payload?.total || 0),
        pages: Number(payload?.pages || 1),
        limit: Number(payload?.limit || meta.limit),
      });
      setPage(Number(payload?.page || nextPage));
    } catch (e) {
      console.error("government list error:", e);
      setErr(e?.response?.data?.message || "Failed to load government jobs.");
      setRows([]);
      setMeta((m) => ({ ...m, total: 0, pages: 1 }));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load({ nextPage: 1, nextFilters: filters, chip: selectedChip });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        setLoadingOptions(true);
        const res = await studentListGovernmentJobs({ page: 1, limit: 200 });
        if (!active) return;
        const items = Array.isArray(res?.data?.items) ? res.data.items : [];
        setOptionRows(items);
      } catch (e) {
        console.error("government options load error:", e);
      } finally {
        if (active) setLoadingOptions(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const applyFilters = () => {
    const next = { ...draft };
    setFilters(next);
    load({ nextPage: 1, nextFilters: next, chip: selectedChip });
  };

  const clearFilters = () => {
    const reset = {
      search: "",
      department: "",
      examType: "",
      state: "",
      jobType: "",
      qualification: "",
      sort: "Most Recent",
    };
    setDraft(reset);
    setFilters(reset);
    setSelectedChip("All Updates");
    load({ nextPage: 1, nextFilters: reset, chip: "All Updates" });
  };

  return (
    <div className="bg-[#F8FAFC] pb-20 md:pb-6">
      <div className="w-full px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-5">
          <p className="text-xs text-slate-500">
            <Link to={withBase("/")} className="hover:text-[#F97316]">
              Home
            </Link>
            <span className="px-1.5">{">"}</span>
            <span className="text-slate-700">Government Jobs</span>
          </p>
          <h1 className="mt-1 text-3xl font-bold text-[#0F172A]">Government Jobs</h1>
          <p className="mt-1 text-sm text-slate-500">
            Latest notifications, exams and recruitment openings
          </p>
        </div>

        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_220px_160px]">
            <div className="relative">
              <FiSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={draft.search}
                onChange={(e) => setDraft((p) => ({ ...p, search: e.target.value }))}
                placeholder="Search government jobs (title, department, exam...)"
                className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-sm outline-none focus:border-orange-300"
              />
            </div>

            <div className="relative">
              <select
                value={draft.state}
                onChange={(e) => setDraft((p) => ({ ...p, state: e.target.value }))}
                className="h-11 w-full appearance-none rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-orange-300"
              >
                <option value="">{loadingOptions ? "Loading states..." : "Location / State"}</option>
                {stateOptions.map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
              <FiChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
            </div>

            <button
              type="button"
              onClick={applyFilters}
              className="h-11 rounded-xl bg-[#F97316] px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-orange-600"
            >
              Search Updates
            </button>
          </div>
        </section>

        <section className="mt-4 flex flex-wrap gap-2">
          {chips.map((chip) => {
            const active = selectedChip === chip;
            return (
              <button
                key={chip}
                type="button"
                onClick={() => {
                  setSelectedChip(chip);
                  load({ nextPage: 1, nextFilters: filters, chip });
                }}
                className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                  active
                    ? "border-orange-200 bg-orange-50 text-[#F97316]"
                    : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                }`}
              >
                {chip}
              </button>
            );
          })}
        </section>

        <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-[280px_minmax(0,1fr)_300px]">
          <aside className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm lg:sticky lg:top-20 lg:h-fit">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-orange-50 text-[#F97316]">
                  <FiFilter />
                </span>
                <div>
                  <p className="text-sm font-semibold text-[#0F172A]">Filter Updates</p>
                  <p className="text-xs text-slate-500">{meta.total || rows.length} results</p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <select
                value={draft.department}
                onChange={(e) => setDraft((p) => ({ ...p, department: e.target.value }))}
                className="h-10 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-orange-300"
              >
                <option value="">{loadingOptions ? "Loading departments..." : "Department"}</option>
                {departmentOptions.map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>

              <select
                value={draft.examType}
                onChange={(e) => setDraft((p) => ({ ...p, examType: e.target.value }))}
                className="h-10 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-orange-300"
              >
                <option value="">{loadingOptions ? "Loading exam types..." : "Exam Type"}</option>
                {examTypeOptions.map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>

              <select
                value={draft.jobType}
                onChange={(e) => setDraft((p) => ({ ...p, jobType: e.target.value }))}
                className="h-10 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-orange-300"
              >
                <option value="">{loadingOptions ? "Loading job types..." : "Job Type"}</option>
                {jobTypeOptions.map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>

              <select
                value={draft.qualification}
                onChange={(e) => setDraft((p) => ({ ...p, qualification: e.target.value }))}
                className="h-10 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-orange-300"
              >
                <option value="">
                  {loadingOptions ? "Loading qualifications..." : "Qualification"}
                </option>
                {qualificationOptions.map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>

              <div className="relative">
                <select
                  value={draft.sort}
                  onChange={(e) => setDraft((p) => ({ ...p, sort: e.target.value }))}
                  className="h-10 w-full appearance-none rounded-xl border border-slate-200 bg-white px-3 pr-9 text-sm outline-none focus:border-orange-300"
                >
                  <option>Most Recent</option>
                  <option>Oldest</option>
                </select>
                <FiChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={applyFilters}
                  className="h-10 rounded-xl bg-[#2563EB] px-3 text-sm font-semibold text-white hover:bg-blue-700"
                >
                  Apply
                </button>
                <button
                  type="button"
                  onClick={clearFilters}
                  className="h-10 rounded-xl border border-slate-200 px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Clear
                </button>
              </div>
            </div>
          </aside>

          <main className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
              <div className="text-sm font-semibold text-slate-700">
                {loading ? "Loading..." : `${meta.total || rows.length} Government Updates`}
              </div>
            </div>

            {err ? (
              <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
                {err}
              </div>
            ) : null}

            {loading ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500 shadow-sm">
                Loading government jobs...
              </div>
            ) : (
              <>
                {rows.map((item) => (
                  <article
                    key={item.id || item._id}
                    className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h2 className="truncate text-base font-semibold text-[#0F172A]">
                          {item.title || "Government Update"}
                        </h2>
                        <p className="mt-1 text-xs text-slate-500">
                          {item.source || item.department || "Government"}
                          {item.publishedAt ? ` • ${fmt(item.publishedAt)}` : ""}
                        </p>

                        <div className="mt-2 flex flex-wrap gap-1.5 text-[11px]">
                          {item.department ? (
                            <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 font-semibold text-slate-600">
                              {item.department}
                            </span>
                          ) : null}
                          {item.examType ? (
                            <span className="rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 font-semibold text-[#2563EB]">
                              {item.examType}
                            </span>
                          ) : null}
                          {item.state ? (
                            <span className="rounded-full border border-indigo-200 bg-indigo-50 px-2 py-0.5 font-semibold text-indigo-700">
                              {item.state}
                            </span>
                          ) : null}
                          {item.qualification ? (
                            <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 font-semibold text-amber-700">
                              {item.qualification}
                            </span>
                          ) : null}
                        </div>

                        <p className="mt-2 line-clamp-2 text-sm text-slate-700">
                          {item.summary || ""}
                        </p>

                        {item.startDate || item.endDate ? (
                          <p className="mt-2 text-xs font-semibold text-slate-500">
                            Application Window: {item.startDate ? fmt(item.startDate) : "-"} to{" "}
                            {item.endDate ? fmt(item.endDate) : "-"}
                          </p>
                        ) : null}
                      </div>

                      <div className="flex flex-col items-end gap-2">
                        <Link
                          to={withBase(`/government/${item.id || item._id}`)}
                          className="inline-flex rounded-xl bg-[#2563EB] px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700"
                        >
                          View Details
                        </Link>
                        {item.link ? (
                          <a
                            href={item.link}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                          >
                            Official <FiExternalLink />
                          </a>
                        ) : null}
                      </div>
                    </div>
                  </article>
                ))}

                {!rows.length ? (
                  <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500 shadow-sm">
                    No government jobs found.
                  </div>
                ) : null}

                {meta.pages > 1 ? (
                  <div className="flex items-center justify-center gap-1 pt-2">
                    {Array.from({ length: meta.pages }).map((_, idx) => {
                      const p = idx + 1;
                      return (
                        <button
                          key={p}
                          type="button"
                          onClick={() => load({ nextFilters: filters, nextPage: p, chip: selectedChip })}
                          className={`h-9 min-w-9 rounded-xl border px-3 text-sm font-semibold transition ${
                            page === p
                              ? "border-orange-200 bg-orange-50 text-[#F97316]"
                              : "border-slate-200 text-slate-600 hover:bg-slate-50"
                          }`}
                        >
                          {p}
                        </button>
                      );
                    })}
                  </div>
                ) : null}
              </>
            )}
          </main>

          <aside className="space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
                <img
                  src={ILL_TOP}
                  alt="Government jobs tips"
                  className="h-[170px] w-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
              </div>
              <h3 className="mt-3 text-sm font-semibold text-[#0F172A]">Stay Updated & Apply Smart</h3>
              <ul className="mt-2 space-y-1 text-xs text-slate-600">
                <li>• Get latest notifications quickly</li>
                <li>• Track application deadlines</li>
                <li>• Verify official links before applying</li>
              </ul>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
                <img
                  src={ILL_BOTTOM}
                  alt="Preparation resources"
                  className="h-[170px] w-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
              </div>
              <h3 className="mt-3 text-sm font-semibold text-[#0F172A]">Preparation Resources</h3>
              <ul className="mt-2 space-y-1 text-xs text-slate-600">
                <li>• Previous papers & syllabus</li>
                <li>• Exam patterns & tips</li>
                <li>• Interview questions</li>
              </ul>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

