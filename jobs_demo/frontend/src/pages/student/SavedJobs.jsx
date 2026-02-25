import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  FiBookmark,
  FiExternalLink,
  FiMapPin,
  FiTrash2,
} from "react-icons/fi";
import {
  studentListSavedJobs,
  studentToggleSaveJob,
} from "../../services/studentService.js";

const pageSize = 6;

export default function SavedJobs() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const [filtersDraft, setFiltersDraft] = useState({
    q: "",
    location: "",
    jobType: "",
    workMode: "",
  });
  const [filters, setFilters] = useState({
    q: "",
    location: "",
    jobType: "",
    workMode: "",
  });
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({ total: 0, pages: 1, limit: pageSize });

  async function fetchSavedJobs(nextPage = 1, nextFilters = filters) {
    try {
      setLoading(true);
      setErr("");
      const res = await studentListSavedJobs({
        ...nextFilters,
        page: nextPage,
        limit: pageSize,
      });
      const data = res?.data || {};
      setJobs(Array.isArray(data?.rows) ? data.rows : []);
      setMeta({
        total: Number(data?.total || 0),
        pages: Number(data?.pages || 1),
        limit: Number(data?.limit || pageSize),
      });
      setPage(Number(data?.page || nextPage));
    } catch (e) {
      console.error("Failed to load saved jobs:", e);
      setErr(e?.response?.data?.message || "Failed to load saved jobs.");
      setJobs([]);
      setMeta({ total: 0, pages: 1, limit: pageSize });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchSavedJobs(1, filters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function removeSaved(jobId) {
    try {
      await studentToggleSaveJob(jobId);
      fetchSavedJobs(page, filters);
    } catch (e) {
      console.error("Remove failed:", e);
      setErr(e?.response?.data?.message || "Failed to remove saved job.");
    }
  }

  const applyFilters = () => {
    const next = { ...filtersDraft };
    setFilters(next);
    fetchSavedJobs(1, next);
  };

  const clearFilters = () => {
    const reset = { q: "", location: "", jobType: "", workMode: "" };
    setFiltersDraft(reset);
    setFilters(reset);
    fetchSavedJobs(1, reset);
  };

  const list = useMemo(() => jobs, [jobs]);

  return (
    <div className="bg-[#F8FAFC]">
      <div className="mx-auto max-w-[1200px] space-y-5 px-4 py-6 sm:px-6 lg:px-8">
        <section>
          <h1 className="text-3xl font-bold text-[#0F172A]">
            Saved Jobs
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Jobs you bookmarked to apply later
          </p>
          <p className="mt-1 text-xs font-semibold text-slate-500">
            {meta.total} saved jobs
          </p>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
            <input
              value={filtersDraft.q}
              onChange={(e) =>
                setFiltersDraft((p) => ({ ...p, q: e.target.value }))
              }
              placeholder="Search by title or company"
              className="h-10 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-blue-300"
            />

            <input
              value={filtersDraft.location}
              onChange={(e) =>
                setFiltersDraft((p) => ({ ...p, location: e.target.value }))
              }
              placeholder="Location"
              className="h-10 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-blue-300"
            />

            <input
              value={filtersDraft.jobType}
              onChange={(e) =>
                setFiltersDraft((p) => ({ ...p, jobType: e.target.value }))
              }
              placeholder="Job Type"
              className="h-10 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-blue-300"
            />

            <input
              value={filtersDraft.workMode}
              onChange={(e) =>
                setFiltersDraft((p) => ({ ...p, workMode: e.target.value }))
              }
              placeholder="Work Mode"
              className="h-10 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-blue-300"
            />
          </div>

          <div className="mt-3 flex gap-2">
            <button
              onClick={applyFilters}
              className="rounded-lg bg-[#2563EB] px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Apply Filter
            </button>
            <button
              onClick={clearFilters}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Clear
            </button>
          </div>
        </section>

        {loading ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500 shadow-sm">
            Loading saved jobs...
          </div>
        ) : err ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center text-sm text-red-700 shadow-sm">
            {err}
          </div>
        ) : meta.total === 0 ? (
          <section className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
            <FiBookmark className="mx-auto text-3xl text-blue-500" />
            <h2 className="mt-4 text-xl font-semibold text-[#0F172A]">
              No saved jobs yet
            </h2>
            <Link
              to="/student/jobs"
              className="mt-4 inline-flex rounded-lg bg-[#2563EB] px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Browse Jobs
            </Link>
          </section>
        ) : (
          <>
            <section className="space-y-3">
              {list.map((item) => (
                <article
                  key={item._id || item.id}
                  className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <h2 className="text-lg font-semibold text-[#0F172A]">
                        {item.title}
                      </h2>
                      <p className="text-sm text-slate-600">
                        {item.companyName}
                      </p>

                      <div className="mt-2 flex flex-wrap gap-3 text-sm text-slate-600">
                        <span className="inline-flex items-center gap-1">
                          <FiMapPin /> {item.location}
                        </span>
                        <span>{item.salary}</span>
                      </div>
                    </div>

                    <div className="flex flex-col items-start gap-2 lg:items-end">
                      <button
                        onClick={() => removeSaved(item._id || item.id)}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-red-200 text-red-600 hover:bg-red-50"
                        aria-label="Remove saved job"
                      >
                        <FiTrash2 />
                      </button>

                      <Link
                        to={`/student/jobs/${item._id || item.id}`}
                        className="inline-flex items-center gap-1 text-sm font-semibold text-[#2563EB] hover:underline"
                      >
                        View Details <FiExternalLink />
                      </Link>
                    </div>
                  </div>
                </article>
              ))}
            </section>

            <section className="flex items-center justify-center gap-1">
              {Array.from({ length: Math.max(1, meta.pages) }).map((_, idx) => {
                const p = idx + 1;
                return (
                  <button
                    key={p}
                    onClick={() => fetchSavedJobs(p, filters)}
                    className={`h-9 min-w-9 rounded-lg border px-3 text-sm font-semibold transition ${
                      p === page
                        ? "border-blue-200 bg-blue-50 text-[#2563EB]"
                        : "border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {p}
                  </button>
                );
              })}
            </section>
          </>
        )}
      </div>
    </div>
  );
}
