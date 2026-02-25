import { FiTool, FiActivity, FiBriefcase, FiPenTool, FiTrendingUp } from "react-icons/fi";
import { RiMoneyDollarCircleLine } from "react-icons/ri";

const streams = [
  { name: "Engineering", jobs: 1250, icon: <FiTool /> },
  { name: "Healthcare", jobs: 890, icon: <FiActivity /> },
  { name: "Business", jobs: 1100, icon: <FiBriefcase /> },
  { name: "Design", jobs: 650, icon: <FiPenTool /> },
  { name: "Marketing", jobs: 780, icon: <FiTrendingUp /> },
  { name: "Finance", jobs: 920, icon: <RiMoneyDollarCircleLine /> },
];

export default function StreamGrid() {
  return (
    <section className="py-16 bg-white">
      <div className="max-w-6xl mx-auto px-4">
        <h2 className="text-4xl font-extrabold text-center text-slate-900">
          Browse Jobs by Stream
        </h2>

        <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {streams.map((s) => (
            <button
              key={s.name}
              className="bg-white border border-slate-200 rounded-2xl shadow-sm hover:shadow-md transition p-10 text-center"
            >
              <div className="mx-auto h-12 w-12 rounded-2xl bg-orange-50 text-orange-600 grid place-items-center text-2xl">
                {s.icon}
              </div>
              <h3 className="mt-6 text-xl font-bold text-slate-900">{s.name}</h3>
              <p className="mt-2 text-slate-600">{s.jobs} Jobs Available</p>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
