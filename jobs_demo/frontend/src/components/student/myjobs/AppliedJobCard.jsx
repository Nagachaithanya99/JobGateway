import { FiMapPin, FiCalendar, FiPhone, FiExternalLink } from "react-icons/fi";
import { HiTrendingUp } from "react-icons/hi";

const badgeCls = (status) => {
  // matches screenshot colors
  if (status === "Shortlisted") return "bg-green-50 text-green-700 border-green-200";
  if (status === "Rejected") return "bg-red-50 text-red-700 border-red-200";
  if (status === "Hold") return "bg-yellow-50 text-yellow-700 border-yellow-200";
  // Applied / In Progress
  return "bg-blue-50 text-blue-700 border-blue-200";
};

export default function AppliedJobCard({ app, onCall, onView }) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-extrabold text-slate-900">{app.jobTitle}</h3>
          <p className="text-slate-600">{app.company}</p>
        </div>

        <span
          className={`px-3 py-1 rounded-full text-xs font-bold border ${badgeCls(
            app.status
          )}`}
        >
          {app.status}
        </span>
      </div>

      <div className="mt-4 grid md:grid-cols-3 gap-3 text-sm text-slate-700">
        <div className="flex items-center gap-2">
          <FiMapPin className="text-orange-600" />
          <span>{app.location || "Bangalore, Karnataka"}</span>
        </div>

        <div className="flex items-center gap-2">
          <HiTrendingUp className="text-orange-600" />
          <span className="font-semibold">{app.salary || "₹8-12 LPA"}</span>
        </div>

        <div className="flex items-center gap-2 md:justify-end">
          <FiCalendar className="text-orange-600" />
          <span>
            Applied on <span className="font-semibold">{app.date}</span>
          </span>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-3">
        <button
          onClick={() => onCall?.(app)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-blue-200 text-blue-700 font-bold hover:bg-blue-50 transition"
        >
          <FiPhone />
          Call Now
        </button>

        <button
          onClick={() => onView?.(app)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-orange-200 text-orange-700 font-bold hover:bg-orange-50 transition"
        >
          <FiExternalLink />
          View Details
        </button>
      </div>
    </div>
  );
}
