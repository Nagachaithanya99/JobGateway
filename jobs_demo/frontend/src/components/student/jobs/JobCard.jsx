import { FiMapPin, FiBriefcase } from "react-icons/fi";
import { HiTrendingUp } from "react-icons/hi";
import { useNavigate } from "react-router-dom";

export default function JobCard({ job }) {
  const nav = useNavigate();

  const tags = job.tags || ["React", "Node.js", "TypeScript"].slice(0, 3);
  const posted = job.posted || "Posted 2 days ago";

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 flex flex-col justify-between">
      <div>
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-extrabold text-slate-900">{job.title}</h3>
            <p className="text-slate-600">{job.company}</p>
          </div>

          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-orange-50 text-orange-700 border border-orange-100">
            Full Time
          </span>
        </div>

        <div className="mt-4 space-y-2 text-sm text-slate-700">
          <div className="flex items-center gap-2">
            <FiMapPin className="text-slate-500" />
            <span>{job.location}</span>
          </div>

          <div className="flex items-center gap-2">
            <FiBriefcase className="text-slate-500" />
            <span>{job.exp} Years</span>
          </div>

          <div className="flex items-center gap-2">
            <HiTrendingUp className="text-orange-600" />
            <span className="font-semibold">
              ₹{Math.round(job.salary / 100000)}-{Math.round(job.salary / 100000) + 2} LPA
            </span>
          </div>
        </div>

        <div className="mt-4">
          <p className="text-xs font-semibold text-slate-500 mb-2">Required Skills</p>
          <div className="flex flex-wrap gap-2">
            {tags.map((t) => (
              <span
                key={t}
                className="px-3 py-1 rounded-full text-xs bg-slate-100 text-slate-700 border border-slate-200"
              >
                {t}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-6 flex items-center justify-between">
        <p className="text-xs text-slate-500">{posted}</p>
        <button
          onClick={() => nav(`/student/jobs/${job.id}`)}
          className="px-4 py-2 rounded-lg bg-orange-600 text-white font-bold hover:bg-orange-700 transition"
        >
          Apply Now
        </button>
      </div>
    </div>
  );
}
