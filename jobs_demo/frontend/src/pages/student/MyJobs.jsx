import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FiArrowRight,
  FiChevronDown,
  FiExternalLink,
  FiMail,
  FiMapPin,
  FiMessageCircle,
  FiPhoneCall,
  FiSearch,
} from "react-icons/fi";
import { studentMyApplications } from "../../services/studentService.js";
import illu from "../../assets/images/student-myjobs/myjobs-illustration.png";

const STATUS_TABS = [
  { key: "Applied", label: "Applied" },
  { key: "Shortlisted", label: "Shortlisted" },
  { key: "Hold", label: "Hold" },
  { key: "Rejected", label: "Rejected" },
];

const STATUS_BADGE = {
  Applied: "border-blue-200 bg-blue-50 text-[#2563EB]",
  Shortlisted: "border-green-200 bg-green-50 text-green-700",
  Hold: "border-sky-200 bg-sky-50 text-sky-700",
  Rejected: "border-red-200 bg-red-50 text-red-600",
  "Interview Scheduled": "border-indigo-200 bg-indigo-50 text-indigo-700",
};

const sortOptions = ["Most Recent", "Oldest", "A-Z"];

function initials(name = "") {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((x) => x[0])
    .join("")
    .toUpperCase();
}

function postedAgo(dateLike) {
  if (!dateLike) return "";
  const d = new Date(dateLike);
  const ms = Date.now() - d.getTime();
  const mins = Math.floor(ms / 60000);
  if (mins < 60) return `${mins} mins ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hours ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days} days ago`;
  const w = Math.floor(days / 7);
  return `${w} weeks ago`;
}

function normalizeRows(payload) {
  const data = payload?.data ?? payload ?? {};
  const rows = Array.isArray(data?.rows)
    ? data.rows
    : Array.isArray(data?.items)
    ? data.items
    : Array.isArray(data)
    ? data
    : [];

  return {
    rows,
    total: Number(data?.total || data?.meta?.total || rows.length || 0),
    pages: Number(data?.pages || data?.meta?.pages || 1),
    page: Number(data?.page || data?.meta?.page || 1),
    limit: Number(data?.limit || data?.meta?.limit || 6),
  };
}

function sortList(items, sortBy) {
  const list = [...items];
  if (sortBy === "A-Z") {
    list.sort((a, b) => String(a?.title || "").localeCompare(String(b?.title || "")));
    return list;
  }
  list.sort((a, b) => {
    const da = new Date(a?.appliedAt || a?.appliedOn || a?.createdAt || 0).getTime();
    const db = new Date(b?.appliedAt || b?.appliedOn || b?.createdAt || 0).getTime();
    return sortBy === "Oldest" ? da - db : db - da;
  });
  return list;
}

export default function MyJobs() {
  const navigate = useNavigate();
  const pageSize = 6;

  const [activeTab, setActiveTab] = useState("Applied");
  const [searchText, setSearchText] = useState("");
  const [sortBy, setSortBy] = useState("Most Recent");
  const [activeCategory, setActiveCategory] = useState("All");

  const [page, setPage] = useState(1);
  const [allRows, setAllRows] = useState([]);
  const [meta, setMeta] = useState({ total: 0, pages: 1, page: 1, limit: pageSize });
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [counts, setCounts] = useState({ Applied: 0, Shortlisted: 0, Hold: 0, Rejected: 0 });

  const fetchRows = async ({ nextPage = 1, q = searchText, sort = sortBy } = {}) => {
    try {
      setLoading(true);
      setErr("");

      const res = await studentMyApplications({
        status: "All",
        company: q || undefined,
        page: 1,
        limit: 500,
      });

      const parsed = normalizeRows(res);
      const sorted = sortList(parsed.rows || [], sort);
      setAllRows(sorted);
      setPage(nextPage);
    } catch (e) {
      setErr(e?.response?.data?.message || e?.message || "Failed to load applications");
      setAllRows([]);
      setMeta({ total: 0, pages: 1, page: 1, limit: pageSize });
    } finally {
      setLoading(false);
    }
  };

  const fetchCounts = async () => {
    try {
      const all = await studentMyApplications({ status: "All", page: 1, limit: 500 });
      const rows = normalizeRows(all).rows || [];
      setCounts({
        Applied: rows.filter((x) => String(x?.status || "").toLowerCase() === "applied").length,
        Shortlisted: rows.filter((x) =>
          ["shortlisted", "interview scheduled"].includes(String(x?.status || "").toLowerCase())
        ).length,
        Hold: rows.filter((x) => String(x?.status || "").toLowerCase() === "hold").length,
        Rejected: rows.filter((x) => String(x?.status || "").toLowerCase() === "rejected").length,
      });
    } catch (_) {}
  };

  useEffect(() => {
    fetchCounts();
    fetchRows({ nextPage: 1, q: searchText, sort: sortBy });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const categories = useMemo(() => {
    const set = new Set();
    allRows.forEach((r) => {
      const c = String(r?.stream || r?.category || "").trim();
      if (c) set.add(c);
    });
    return ["All", ...Array.from(set).slice(0, 4)];
  }, [allRows]);

  const filteredByTab = useMemo(() => {
    if (activeTab === "Shortlisted") {
      return allRows.filter((r) =>
        ["shortlisted", "interview scheduled"].includes(String(r?.status || "").toLowerCase())
      );
    }
    return allRows.filter((r) => String(r?.status || "").toLowerCase() === String(activeTab).toLowerCase());
  }, [allRows, activeTab]);

  const filteredByCategory = useMemo(() => {
    if (activeCategory === "All") return filteredByTab;
    return filteredByTab.filter((r) => String(r?.stream || r?.category || "") === activeCategory);
  }, [filteredByTab, activeCategory]);

  const pages = useMemo(() => Math.max(1, Math.ceil(filteredByCategory.length / pageSize)), [filteredByCategory.length]);
  const list = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredByCategory.slice(start, start + pageSize);
  }, [filteredByCategory, page]);

  useEffect(() => {
    const total = filteredByCategory.length;
    setMeta({ total, pages, page, limit: pageSize });
  }, [filteredByCategory.length, pages, page]);

  const onSearch = () => {
    setPage(1);
    fetchRows({ nextPage: 1, q: searchText, sort: sortBy });
  };

  const onTab = (tabKey) => {
    setActiveTab(tabKey);
    setPage(1);
  };

  const onSort = (v) => {
    setSortBy(v);
    fetchRows({ nextPage: 1, q: searchText, sort: v });
  };

  return (
    <div className="bg-[#F7F3F6] pb-24 md:pb-10">
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-24 left-1/2 h-[22rem] w-[60rem] -translate-x-1/2 rounded-full bg-orange-200/30 blur-3xl" />
        <div className="absolute top-40 right-[-12rem] h-[24rem] w-[24rem] rounded-full bg-rose-200/25 blur-3xl" />
        <div className="absolute bottom-[-10rem] left-[-12rem] h-[26rem] w-[26rem] rounded-full bg-violet-200/18 blur-3xl" />
        <div className="absolute inset-0 opacity-[0.18] [background-image:radial-gradient(rgba(15,23,42,0.18)_1px,transparent_1px)] [background-size:18px_18px]" />
      </div>

      <div className="mx-auto max-w-[1100px] px-4 py-6 sm:px-6 lg:px-8">
        <div className="text-xs text-slate-500">
          <Link className="hover:text-slate-700" to="/student">
            Home
          </Link>
          <span className="px-2">/</span>
          <span className="text-slate-700">Jobs</span>
        </div>

        <div className="mt-2">
          <h1 className="text-[28px] font-extrabold tracking-tight text-[#0F172A]">My Jobs</h1>
          <p className="mt-1 text-sm text-slate-500">Track your job applications status</p>
        </div>

        <div className="mt-4 rounded-3xl border border-white/70 bg-white/70 p-3 shadow-sm backdrop-blur">
          <div className="flex flex-wrap items-center gap-2">
            {STATUS_TABS.map((t) => {
              const active = activeTab === t.key;
              const badgeTone =
                t.key === "Applied"
                  ? "bg-blue-50 text-[#2563EB] border-blue-200"
                  : t.key === "Shortlisted"
                  ? "bg-green-50 text-green-700 border-green-200"
                  : t.key === "Hold"
                  ? "bg-sky-50 text-sky-700 border-sky-200"
                  : "bg-red-50 text-red-600 border-red-200";

              return (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => onTab(t.key)}
                  className={[
                    "inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition",
                    active ? "bg-white border border-slate-200 shadow-sm text-slate-900" : "bg-slate-50 border border-slate-200 text-slate-700 hover:bg-white",
                  ].join(" ")}
                >
                  {t.label}
                  <span className={`inline-flex h-5 min-w-5 items-center justify-center rounded-full border px-1 text-[11px] font-extrabold ${badgeTone}`}>
                    {Number(counts?.[t.key] || 0)}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-3 rounded-3xl border border-white/70 bg-white/70 p-3 shadow-sm backdrop-blur">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                placeholder="Search by company..."
                className="h-12 w-full rounded-2xl border border-slate-200 bg-white/80 pl-11 pr-4 text-sm outline-none focus:border-orange-300"
              />
            </div>
            <button
              type="button"
              onClick={onSearch}
              className="h-12 rounded-2xl bg-[#F97316] px-6 text-sm font-extrabold text-white shadow-sm transition hover:bg-orange-600"
            >
              Search
            </button>
          </div>
        </div>

        <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            {categories.map((c, idx) => (
              <button
                key={c}
                type="button"
                onClick={() => setActiveCategory(c)}
                className={[
                  "rounded-full border px-4 py-2 text-xs font-extrabold transition",
                  activeCategory === c || (idx === 0 && activeCategory === "All")
                    ? "border-orange-200 bg-orange-50 text-[#C2410C]"
                    : "border-slate-200 bg-white/70 text-slate-700 hover:bg-white",
                ].join(" ")}
              >
                {c}
              </button>
            ))}
          </div>

          <div className="flex items-center justify-between gap-2 sm:justify-end">
            <span className="text-xs font-semibold text-slate-500">Sort by</span>
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => onSort(e.target.value)}
                className="h-10 rounded-2xl border border-slate-200 bg-white/70 px-4 pr-10 text-sm font-semibold text-slate-700 outline-none hover:bg-white"
              >
                {sortOptions.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
              <FiChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
            </div>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-3">
            {loading ? (
              <div className="rounded-3xl border border-white/70 bg-white/70 p-8 text-center text-sm text-slate-500 shadow-sm backdrop-blur">
                Loading applications...
              </div>
            ) : err ? (
              <div className="rounded-3xl border border-red-200 bg-red-50 p-6 text-sm text-red-700 shadow-sm">
                {err}
              </div>
            ) : list.length === 0 ? (
              <div className="rounded-3xl border border-white/70 bg-white/70 p-8 text-center text-sm text-slate-500 shadow-sm backdrop-blur">
                No applications found.
              </div>
            ) : (
              list.map((item) => {
                const status = item.status || "Applied";
                const company = item.companyName || item.company || "";
                const title = item.title || item.jobTitle || "";
                const location = item.location || item.city || "";
                const salary = item.salary || item.salaryText || "";
                const stream = item.stream || item.category || "";
                const when = item.appliedAt || item.appliedOn || item.createdAt;
                const logoText = initials(company) || "C";

                return (
                  <article
                    key={String(item._id || item.id || `${title}-${company}-${when}`)}
                    className="rounded-3xl border border-white/70 bg-white/70 p-4 shadow-sm backdrop-blur transition hover:shadow-md"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white border border-slate-200 text-[#F97316] font-extrabold">
                          {logoText}
                        </div>

                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h2 className="text-base font-extrabold text-slate-900">{title || "Job"}</h2>
                            <span className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-extrabold ${STATUS_BADGE[status] || "border-slate-200 bg-slate-50 text-slate-700"}`}>
                              {status}
                            </span>
                          </div>

                          <p className="text-sm text-slate-600">{company || "-"}</p>

                          <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-slate-600">
                            {location ? (
                              <span className="inline-flex items-center gap-1">
                                <FiMapPin /> {location}
                              </span>
                            ) : null}
                            {salary ? <span className="font-extrabold text-[#0F172A]">{salary}</span> : null}
                          </div>

                          <div className="mt-2 flex flex-wrap items-center gap-2">
                            {stream ? (
                              <span className="inline-flex rounded-full border border-slate-200 bg-white/80 px-3 py-1 text-[11px] font-extrabold text-slate-700">
                                {stream}
                              </span>
                            ) : null}
                            {item.round ? (
                              <span className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[11px] font-extrabold text-emerald-700">
                                {item.round}
                              </span>
                            ) : null}
                          </div>
                        </div>
                      </div>

                      <div className="text-xs font-semibold text-slate-500">{when ? postedAgo(when) : ""}</div>
                    </div>

                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      {item.phone ? (
                        <a
                          href={`https://wa.me/${String(item.phone).replace(/\D/g, "")}?text=${encodeURIComponent(
                            `Hi, I applied for ${title || "this role"} at ${company || "your company"}.`
                          )}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-extrabold text-emerald-700 hover:bg-emerald-100"
                        >
                          <FiMessageCircle /> WhatsApp Now
                        </a>
                      ) : null}

                      {item.phone ? (
                        <a
                          href={`tel:${item.phone}`}
                          className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-xs font-extrabold text-[#2563EB] hover:bg-blue-100"
                        >
                          <FiPhoneCall /> Call HR
                        </a>
                      ) : null}

                      {item.email ? (
                        <a
                          href={`mailto:${item.email}?subject=${encodeURIComponent(`Regarding ${title || "Application"}`)}`}
                          className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-4 py-2 text-xs font-extrabold text-[#C2410C] hover:bg-orange-100"
                        >
                          <FiMail /> Write Mail
                        </a>
                      ) : null}

                      <button
                        type="button"
                        onClick={() =>
                          navigate(
                            item.conversationId
                              ? `/student/messages?thread=${item.conversationId}`
                              : "/student/messages"
                          )
                        }
                        className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-4 py-2 text-xs font-extrabold text-slate-700 hover:bg-white"
                      >
                        Email MS <FiArrowRight />
                      </button>

                      {item.jobId || item.job?._id ? (
                        <Link
                          to={`/student/jobs/${item.jobId || item.job?._id}`}
                          className="ml-auto inline-flex items-center gap-1 text-xs font-extrabold text-[#2563EB] hover:underline"
                        >
                          View Details <FiExternalLink />
                        </Link>
                      ) : null}
                    </div>
                  </article>
                );
              })
            )}
          </div>

          <aside className="lg:sticky lg:top-20 lg:h-fit">
            <div className="rounded-3xl border border-white/70 bg-white/70 p-4 shadow-sm backdrop-blur">
              <img
                src={illu}
                alt="Applied jobs illustration"
                className="h-[170px] w-full rounded-3xl object-contain"
                draggable="false"
              />

              <div className="mt-3 rounded-3xl border border-slate-200 bg-white p-4">
                <h3 className="text-sm font-extrabold text-slate-900">All Your Applied Jobs In One Place!</h3>
                <ul className="mt-3 space-y-2 text-xs font-semibold text-slate-600">
                  <li className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-[#F97316]" />
                    Real-time Status Updates
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-[#F97316]" />
                    One-Click Communication
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-[#F97316]" />
                    Easy Job Management
                  </li>
                </ul>

                <button
                  type="button"
                  onClick={() => navigate("/student/notifications")}
                  className="mt-4 w-full rounded-2xl bg-[#F97316] px-4 py-2.5 text-sm font-extrabold text-white shadow-sm hover:bg-orange-600"
                >
                  Create Job Alert
                </button>
              </div>
            </div>
          </aside>
        </div>

        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-xs text-slate-500">
            Showing{" "}
            <span className="font-extrabold text-slate-700">{list.length ? (page - 1) * pageSize + 1 : 0}</span>{" "}
            - <span className="font-extrabold text-slate-700">{(page - 1) * pageSize + list.length}</span> of{" "}
            <span className="font-extrabold text-slate-700">{meta.total}</span> applied jobs
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => page > 1 && setPage((p) => p - 1)}
              className="h-9 rounded-full border border-slate-200 bg-white/70 px-4 text-xs font-extrabold text-slate-700 hover:bg-white disabled:opacity-50"
              disabled={page <= 1}
            >
              Prev
            </button>

            {Array.from({ length: pages }).slice(0, 6).map((_, idx) => {
              const p = idx + 1;
              const active = p === page;
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPage(p)}
                  className={[
                    "h-9 min-w-9 rounded-full border px-3 text-xs font-extrabold transition",
                    active
                      ? "border-orange-200 bg-orange-50 text-[#C2410C]"
                      : "border-slate-200 bg-white/70 text-slate-700 hover:bg-white",
                  ].join(" ")}
                >
                  {p}
                </button>
              );
            })}

            <button
              type="button"
              onClick={() => page < pages && setPage((p) => p + 1)}
              className="h-9 rounded-full border border-slate-200 bg-white/70 px-4 text-xs font-extrabold text-slate-700 hover:bg-white disabled:opacity-50"
              disabled={page >= pages}
            >
              Next
            </button>
          </div>
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-white/60 bg-white/80 p-3 shadow-[0_-6px_20px_rgba(15,23,42,0.08)] backdrop-blur lg:hidden">
        <button
          type="button"
          onClick={() => navigate("/student/jobs")}
          className="w-full rounded-2xl bg-[#F97316] px-4 py-3 text-sm font-extrabold text-white hover:bg-orange-600"
        >
          Browse Jobs
        </button>
      </div>
    </div>
  );
}
