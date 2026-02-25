import { FiBriefcase, FiMapPin, FiSearch } from "react-icons/fi";

const cats = [
  { label: "IT & Software", icon: "💻" },
  { label: "Marketing", icon: "📣" },
  { label: "Healthcare", icon: "🩺" },
];

export default function HeroSearch() {
  return (
    <section className="bg-[#FBF6F1]">
      <div className="max-w-6xl mx-auto px-4 pt-14 pb-12">
        {/* Top badge */}
        <div className="flex justify-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/80 border border-orange-100 text-xs font-semibold text-slate-700 shadow-sm">
            <span className="h-2 w-2 rounded-full bg-orange-600" />
            Jobs • Internships • Government Updates
          </div>
        </div>

        {/* Title */}
        <div className="text-center mt-6">
          <h1 className="text-4xl md:text-6xl font-extrabold text-slate-900 leading-tight">
            Find Your Dream Job
          </h1>
          <p className="mt-3 text-base md:text-lg text-slate-600">
            Discover thousands of opportunities from top companies
          </p>
        </div>

        {/* Hero banner card */}
        <div className="mt-8 rounded-3xl border border-orange-100 bg-gradient-to-r from-white to-orange-50 shadow-sm overflow-hidden">
          <div className="grid md:grid-cols-[1.2fr_.8fr] gap-6 p-6 md:p-8 items-center">
            {/* Left: content + search */}
            <div className="space-y-5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-3 py-1 rounded-full bg-orange-50 border border-orange-100 text-xs font-semibold text-orange-700">
                  Quick Apply
                </span>
                <span className="px-3 py-1 rounded-full bg-white border border-slate-200 text-xs font-semibold text-slate-700">
                  Verified Companies
                </span>
                <span className="px-3 py-1 rounded-full bg-white border border-slate-200 text-xs font-semibold text-slate-700">
                  Internship Hub
                </span>
              </div>

              {/* Search bar */}
              <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-4">
                <div className="grid md:grid-cols-[1fr_1fr_auto] gap-3 items-center">
                  <div className="flex items-center gap-3 bg-slate-50 rounded-xl px-4 py-3">
                    <FiBriefcase className="text-slate-500" />
                    <input
                      className="w-full bg-transparent outline-none text-slate-700 placeholder:text-slate-400"
                      placeholder="Job title, keywords..."
                    />
                  </div>

                  <div className="flex items-center gap-3 bg-slate-50 rounded-xl px-4 py-3">
                    <FiMapPin className="text-slate-500" />
                    <input
                      className="w-full bg-transparent outline-none text-slate-700 placeholder:text-slate-400"
                      placeholder="Location"
                    />
                  </div>

                  <button
                    onClick={() => alert("Search (API will be connected in next step)")}
                    className="h-[48px] px-6 rounded-xl bg-orange-600 text-white font-bold flex items-center justify-center gap-2 hover:bg-orange-700 transition"
                  >
                    <FiSearch />
                    Search
                  </button>
                </div>

                {/* helper text */}
                <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-500">
                  <span className="px-2 py-1 rounded-lg bg-slate-50 border border-slate-200">
                    Tip: Try “React Developer”
                  </span>
                  <span className="px-2 py-1 rounded-lg bg-slate-50 border border-slate-200">
                    Tip: Try “Bengaluru”
                  </span>
                </div>
              </div>

              {/* CTA row */}
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => alert("Apply Job Now (next step)")}
                  className="w-full sm:w-auto px-8 py-3 rounded-xl bg-orange-600 text-white font-extrabold hover:bg-orange-700 transition shadow"
                >
                  Apply Job Now
                </button>

                <button
                  onClick={() => alert("Hire Now (next step)")}
                  className="w-full sm:w-auto px-8 py-3 rounded-xl bg-white border border-orange-200 text-orange-700 font-extrabold hover:bg-orange-50 transition"
                >
                  Hire Now
                </button>
              </div>
            </div>

            {/* Right: image */}
            <div className="relative">
              <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-orange-200/50 blur-2xl" />
              <div className="absolute -bottom-10 -left-10 h-44 w-44 rounded-full bg-sky-200/40 blur-2xl" />

              <div className="rounded-3xl overflow-hidden border border-white/60 bg-white shadow-sm">
                <img
                  src="https://images.unsplash.com/photo-1521737604893-d14cc237f11d?q=80&w=1200&auto=format&fit=crop"
                  alt="Find job"
                  className="h-56 md:h-72 w-full object-cover"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Popular Categories (like screenshot row) */}
        <div className="mt-8">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-extrabold text-slate-900">
              Popular Categories
            </h3>
            <button
              onClick={() => alert("View all categories (next step)")}
              className="text-sm font-semibold text-orange-700 hover:text-orange-800"
            >
              View all →
            </button>
          </div>

          <div className="mt-3 grid sm:grid-cols-3 gap-3">
            {cats.map((c) => (
              <button
                key={c.label}
                onClick={() => alert(`Category: ${c.label} (next step)`)}
                className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-orange-200 hover:shadow-sm transition text-left flex items-center gap-3"
              >
                <div className="h-10 w-10 rounded-xl bg-orange-50 border border-orange-100 grid place-items-center text-lg">
                  {c.icon}
                </div>
                <div>
                  <div className="font-extrabold text-slate-900">{c.label}</div>
                  <div className="text-xs text-slate-500">Explore jobs</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
