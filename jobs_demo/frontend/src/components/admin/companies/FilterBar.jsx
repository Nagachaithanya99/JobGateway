import { FiPlus } from "react-icons/fi";
import PrimaryButton from "./PrimaryButton";

export default function FilterBar({
  query,
  status,
  planType,
  category,
  categories,
  onQueryChange,
  onStatusChange,
  onPlanTypeChange,
  onCategoryChange,
  onAddCompany,
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div className="grid w-full grid-cols-1 gap-3 lg:grid-cols-4">
          <input
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder="Search by company name, email, category..."
            className="h-11 rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none transition focus:border-blue-300 focus:bg-white"
          />

          <select
            value={status}
            onChange={(e) => onStatusChange(e.target.value)}
            className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-blue-300"
          >
            <option value="all">Status: All</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
          </select>

          <select
            value={planType}
            onChange={(e) => onPlanTypeChange(e.target.value)}
            className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-blue-300"
          >
            <option value="all">Plan: All</option>
            <option value="starter">Starter</option>
            <option value="growth">Growth</option>
            <option value="premium">Premium</option>
            <option value="unlimited">Unlimited</option>
          </select>

          <select
            value={category}
            onChange={(e) => onCategoryChange(e.target.value)}
            className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-blue-300"
          >
            <option value="all">Category: All</option>
            {categories.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>

        <div className="xl:pl-3">
          <PrimaryButton onClick={onAddCompany}>
            <FiPlus className="text-base" />
            + Add Company
          </PrimaryButton>
        </div>
      </div>
    </div>
  );
}
