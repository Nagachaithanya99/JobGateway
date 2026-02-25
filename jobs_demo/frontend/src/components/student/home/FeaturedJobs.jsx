import { FiMapPin, FiBriefcase } from "react-icons/fi";
import { HiTrendingUp } from "react-icons/hi";

const jobs = [
  {
    title: "Senior Software Engineer",
    company: "TechCorp Solutions",
    location: "Bangalore, Karnataka",
    exp: "3-5 Years",
    salary: "₹12-18 LPA",
    tags: ["React", "Node.js", "TypeScript"],
  },
  {
    title: "Product Designer",
    company: "Design Studio Inc",
    location: "Mumbai, Maharashtra",
    exp: "2-4 Years",
    salary: "₹8-12 LPA",
    tags: ["Figma", "UI/UX", "Prototyping"],
  },
  {
    title: "Digital Marketing Manager",
    company: "Growth Marketing Co",
    location: "Delhi, NCR",
    exp: "4-6 Years",
    salary: "₹10-15 LPA",
    tags: ["SEO", "SEM", "Analytics"],
  },
];

export default function FeaturedJobs() {
  return (
    <section className="py-16 bg-white">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-4xl font-extrabold text-slate-900">
            Featured Jobs
          </h2>
          <button className="px-6 py-2 rounded-xl border border-orange-300 text-orange-700 font-semibold hover:bg-orange-50 transition">
            View All Jobs
          </button>
        </div>

        <div className="mt-10 grid lg:grid-cols-3 gap-8">
          {jobs.map((j) => (
            <div
              key={j.title}
              className="border border-slate-200 rounded-2xl shadow-sm p-8 bg-white"
            >
              <h3 className="text-xl font-extrabold text-slate-900">{j.title}</h3>
              <p className="mt-2 text-slate-600">{j.company}</p>

              <div className="mt-5 space-y-2 text-slate-700">
                <div className="flex items-center gap-2">
                  <FiMapPin className="text-slate-500" />
                  <span>{j.location}</span>
                </div>
                <div className="flex items-center gap-2">
                  <FiBriefcase className="text-slate-500" />
                  <span>{j.exp}</span>
                </div>
                <div className="flex items-center gap-2">
                  <HiTrendingUp className="text-orange-600" />
                  <span className="font-semibold">{j.salary}</span>
                </div>
              </div>

              <div className="mt-6 flex flex-wrap gap-2">
                {j.tags.map((t) => (
                  <span
                    key={t}
                    className="px-3 py-1 rounded-full bg-orange-50 text-orange-700 text-sm border border-orange-100"
                  >
                    {t}
                  </span>
                ))}
              </div>

              <button className="mt-8 w-full py-3 rounded-xl bg-orange-600 text-white font-bold hover:bg-orange-700 transition">
                Apply Now
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
