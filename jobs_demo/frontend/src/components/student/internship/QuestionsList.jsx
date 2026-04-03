import Card from "../../common/Card.jsx";
import { FiHelpCircle } from "react-icons/fi";
import { showSweetAlert } from "../../../utils/sweetAlert.js";

const TOPICS = [
  { id: "q1", title: "JavaScript Fundamentals", count: 50 },
  { id: "q2", title: "React Interview Questions", count: 45 },
  { id: "q3", title: "Data Structures & Algorithms", count: 100, badge: "IQ Questions" },
  { id: "q4", title: "System Design", count: 20 },
  { id: "q5", title: "Database & SQL", count: 40 },
  { id: "q6", title: "Behavioral Questions", count: 35 },
];

export default function QuestionsList() {
  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2">
        <FiHelpCircle className="text-orange-600" />
        <h2 className="text-lg font-extrabold text-slate-900">
          Interview Questions by Topic
        </h2>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {TOPICS.map((t) => (
          <Card key={t.id} className="p-4 border border-slate-200">
            <div className="flex items-start justify-between gap-3">
              <p className="font-extrabold text-slate-900 text-sm">{t.title}</p>
              <span className="h-4 w-4 rounded-full border border-slate-300" />
            </div>

            <div className="mt-2 flex items-center gap-2">
              <span className="text-xs font-bold text-orange-600">
                {t.count} Questions
              </span>
              {t.badge ? (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-orange-50 text-orange-700 border border-orange-200 font-bold">
                  {t.badge}
                </span>
              ) : null}
            </div>

            <button
              className="mt-4 w-full h-9 rounded-lg bg-orange-600 text-white font-extrabold text-sm hover:bg-orange-700 transition"
              onClick={() =>
                void showSweetAlert(`Start Practice: ${t.title} (Practice UI will be added in next step)`)
              }
            >
              Start Practice
            </button>
          </Card>
        ))}
      </div>

      <p className="text-xs text-slate-500">
        Practice question player (next/prev, answer reveal, progress) will be added in next step.
      </p>
    </section>
  );
}
