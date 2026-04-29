// frontend/src/components/admin/jobs/JobFilters.jsx
import { FiDownload, FiFilter, FiPlus, FiRefreshCcw, FiSearch } from "react-icons/fi";

export default function JobFilters({
  filters,
  options,
  onChange,
  onReset,
  onExport,
  onAdd,
  onOpenAdvanced,
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        {/* Search */}
        <div className="relative w-full lg:max-w-sm">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={filters.q}
            onChange={(e) => onChange("q", e.target.value)}
            placeholder="Search by job / company / category..."
            className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-sm outline-none focus:border-blue-300"
          />
        </div>

        {/* Filters */}
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:flex lg:flex-wrap lg:items-center">
          <select
            value={filters.status}
            onChange={(e) => onChange("status", e.target.value)}
            className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none"
          >
            <option value="all">Status: All</option>
            <option value="active">Active</option>
            <option value="disabled">Disabled</option>
            <option value="closed">Closed</option>
          </select>

          <select
            value={filters.company}
            onChange={(e) => onChange("company", e.target.value)}
            className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none"
          >
            <option value="all">Company: All</option>
            {(options?.companies || []).map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          <select
            value={filters.stream}
            onChange={(e) => onChange("stream", e.target.value)}
            className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none"
          >
            <option value="all">Stream: All</option>
            {(options?.streams || []).map((s) => (
              <option key={s} value={String(s).toLowerCase() === "other" ? "other" : s}>
                {s}
              </option>
            ))}
          </select>

          <select
            value={filters.category}
            onChange={(e) => onChange("category", e.target.value)}
            className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none"
          >
            <option value="all">Category: All</option>
            {(options?.categories || []).map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          <select
            value={filters.location}
            onChange={(e) => onChange("location", e.target.value)}
            className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none"
          >
            <option value="all">Location: All</option>
            {(options?.locations || []).map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </select>

          <select
            value={filters.salary}
            onChange={(e) => onChange("salary", e.target.value)}
            className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none"
          >
            <option value="all">Salary: All</option>
            <option value="low">Low</option>
            <option value="mid">Mid</option>
            <option value="high">High</option>
          </select>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onOpenAdvanced}
            className="inline-flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            <FiFilter /> Advanced
          </button>

          <button
            type="button"
            onClick={onReset}
            className="inline-flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            <FiRefreshCcw /> Reset
          </button>

          <button
            type="button"
            onClick={onExport}
            className="inline-flex h-11 items-center gap-2 rounded-xl border border-orange-200 bg-orange-50 px-3 text-sm font-semibold text-[#F97316] hover:bg-orange-100"
          >
            <FiDownload /> Export
          </button>

          {onAdd ? (
            <button
              type="button"
              onClick={onAdd}
              className="inline-flex h-11 items-center gap-2 rounded-xl bg-[#2563EB] px-3 text-sm font-semibold text-white hover:bg-blue-700"
            >
              <FiPlus /> Add Job
            </button>
          ) : null}
        </div>
      </div>
    </section>
  );
}
