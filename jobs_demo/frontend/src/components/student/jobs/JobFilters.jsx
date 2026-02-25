import { useMemo, useState } from "react";
import { FiSearch, FiSliders } from "react-icons/fi";

const STREAMS = ["", "IT & Software", "Medical & Healthcare", "Business", "Education"];
const CATEGORIES_BY_STREAM = {
  "": [""],
  "IT & Software": ["", "Development", "Testing", "Data"],
  "Medical & Healthcare": ["", "Nurses", "Pharmacy", "Lab"],
  Business: ["", "Sales", "Marketing", "Operations"],
  Education: ["", "Teaching", "Administration"],
};
const SUB_BY_CATEGORY = {
  Development: ["", "Frontend", "Backend", "Full Stack"],
  Testing: ["", "Manual", "Automation"],
  Data: ["", "Analyst", "Engineer"],
  Nurses: ["", "Staff Nurse", "ICU Nurse"],
  Pharmacy: ["", "Retail", "Hospital"],
  Lab: ["", "Technician"],
  Sales: ["", "B2B", "B2C"],
  Marketing: ["", "SEO", "Performance"],
  Operations: ["", "Business Ops"],
  Teaching: ["", "High School", "Primary"],
  Administration: ["", "Office"],
};

const EXP = ["", "0-1", "0-2", "1-3", "2-4", "3-5", "4-6"];
const SALARY = [
  { label: "Salary Range", value: "" },
  { label: "₹0 - ₹3 LPA", value: "0-300000" },
  { label: "₹3 - ₹6 LPA", value: "300000-600000" },
  { label: "₹6 - ₹10 LPA", value: "600000-1000000" },
  { label: "₹10+ LPA", value: "1000000-99999999" },
];

export default function JobFilters({ value, onChange }) {
  const [showMore, setShowMore] = useState(false);

  const categories = useMemo(
    () => CATEGORIES_BY_STREAM[value.stream] || [""],
    [value.stream]
  );
  const subs = useMemo(
    () => SUB_BY_CATEGORY[value.category] || [""],
    [value.category]
  );

  const set = (patch) => onChange({ ...value, ...patch });

  const apply = () => {
    // You already filter live; but we keep this button for UX like screenshot
    onChange({ ...value });
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5">
      <p className="text-sm text-slate-600 mb-3">Discover job opportunities</p>

      {/* Row 1 */}
      <div className="grid md:grid-cols-4 gap-3">
        <select
          value={value.stream}
          onChange={(e) => set({ stream: e.target.value, category: "", subcategory: "" })}
          className="input"
        >
          <option value="">Main Stream</option>
          {STREAMS.filter(Boolean).map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>

        <select
          value={value.category}
          onChange={(e) => set({ category: e.target.value, subcategory: "" })}
          className="input"
        >
          <option value="">Category</option>
          {categories.filter(Boolean).map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>

        <select
          value={value.subcategory}
          onChange={(e) => set({ subcategory: e.target.value })}
          className="input"
        >
          <option value="">Sub Category</option>
          {subs.filter(Boolean).map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>

        <input
          value={value.location}
          onChange={(e) => set({ location: e.target.value })}
          className="input"
          placeholder="Location"
        />
      </div>

      {/* Row 2 */}
      <div className="mt-3 grid md:grid-cols-[1fr_1fr_2fr_auto] gap-3 items-center">
        <select value={value.exp} onChange={(e) => set({ exp: e.target.value })} className="input">
          <option value="">Experience</option>
          {EXP.filter(Boolean).map((x) => (
            <option key={x} value={x}>
              {x} years
            </option>
          ))}
        </select>

        <select
          value={value.salaryRange || ""}
          onChange={(e) => {
            const v = e.target.value;
            if (!v) return set({ salaryRange: "", minSalary: "" });
            const [min] = v.split("-");
            set({ salaryRange: v, minSalary: min }); // works with your filter logic
          }}
          className="input"
        >
          {SALARY.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>

        <div className="relative">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            value={value.q}
            onChange={(e) => set({ q: e.target.value })}
            className="input pl-10"
            placeholder="Search by job title or company..."
          />
        </div>

        <button
          onClick={apply}
          className="h-11 px-6 rounded-xl bg-orange-600 text-white font-bold hover:bg-orange-700 transition"
        >
          Apply Filters
        </button>
      </div>

      {/* More filters */}
      <div className="mt-3">
        <button
          onClick={() => setShowMore((s) => !s)}
          className="text-sm font-semibold text-slate-700 inline-flex items-center gap-2 hover:text-slate-900"
        >
          <FiSliders />
          {showMore ? "Hide Filters" : "More Filters"}
        </button>

        {showMore && (
          <div className="mt-3 grid md:grid-cols-3 gap-3">
            <input
              value={value.minSalary}
              onChange={(e) => set({ minSalary: e.target.value })}
              className="input"
              placeholder="Min Salary (number)"
            />
            <div className="text-xs text-slate-500 flex items-center">
              (Extra filters will be enhanced in next step)
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
