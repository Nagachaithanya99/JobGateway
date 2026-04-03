import Card from "../../common/Card.jsx";
import { FiClock, FiPlayCircle, FiTarget } from "react-icons/fi";
import { showSweetAlert } from "../../../utils/sweetAlert.js";

const MOCKS = [
  { id: "m1", title: "JavaScript Mock Test", mins: 60, questions: 50 },
  { id: "m2", title: "Aptitude Test", mins: 45, questions: 40 },
  { id: "m3", title: "Logical Reasoning", mins: 30, questions: 30 },
];

const TASKS = [
  {
    id: "p1",
    title: "Coding Challenges",
    desc: "Practice coding problems from easy to advanced level. Build your problem solving skills.",
    pills: [
      { t: "Easy: 5", c: "bg-green-50 text-green-700 border-green-200" },
      { t: "Medium: 10", c: "bg-yellow-50 text-yellow-700 border-yellow-200" },
      { t: "Hard: 20", c: "bg-red-50 text-red-700 border-red-200" },
    ],
    btn: "Start Coding",
  },
  {
    id: "p2",
    title: "Group Discussion Topics",
    desc: "Prepare for group discussions with trending topics and sample discussions.",
    pills: [
      { t: "Technology: 25", c: "bg-blue-50 text-blue-700 border-blue-200" },
      { t: "Business: 20", c: "bg-purple-50 text-purple-700 border-purple-200" },
      { t: "Social: 15", c: "bg-pink-50 text-pink-700 border-pink-200" },
    ],
    btn: "View Topics",
  },
  {
    id: "p3",
    title: "Resume Builder",
    desc: "Create a professional resume with our easy to use resume builder tool.",
    pills: [
      { t: "15+ templates", c: "bg-orange-50 text-orange-700 border-orange-200" },
      { t: "ATS Friendly", c: "bg-slate-50 text-slate-700 border-slate-200" },
    ],
    btn: "Build Resume",
  },
  {
    id: "p4",
    title: "Aptitude Practice",
    desc: "Improve your quantitative and logical reasoning skills with daily practice.",
    pills: [
      { t: "Quantitative", c: "bg-emerald-50 text-emerald-700 border-emerald-200" },
      { t: "Logical", c: "bg-indigo-50 text-indigo-700 border-indigo-200" },
      { t: "Verbal", c: "bg-rose-50 text-rose-700 border-rose-200" },
    ],
    btn: "Start Practice",
  },
];

export default function MockTests() {
  return (
    <section className="space-y-6">
      {/* Mock Tests */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <FiTarget className="text-orange-600" />
          <h2 className="text-lg font-extrabold text-slate-900">Mock Tests</h2>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {MOCKS.map((m) => (
            <Card key={m.id} className="p-4 border border-slate-200">
              <p className="font-extrabold text-slate-900 text-sm">{m.title}</p>

              <div className="mt-3 flex items-center justify-between text-xs text-slate-600">
                <span className="inline-flex items-center gap-2">
                  <FiClock className="text-orange-600" /> {m.mins} min
                </span>
                <span>{m.questions} Questions</span>
              </div>

              <button
                className="mt-4 w-full h-9 rounded-lg bg-orange-600 text-white font-extrabold text-sm hover:bg-orange-700 transition inline-flex items-center justify-center gap-2"
                onClick={() =>
                  void showSweetAlert(`Start Test: ${m.title} (Test engine will be added in next step)`)
                }
              >
                <FiPlayCircle /> Start Test
              </button>
            </Card>
          ))}
        </div>

        <p className="text-xs text-slate-500">
          Mock test engine (timer + scoring + result) will be added in next step.
        </p>
      </div>

      {/* Practice Tasks */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <FiTarget className="text-orange-600" />
          <h2 className="text-lg font-extrabold text-slate-900">Practice Tasks</h2>
        </div>

        <div className="grid lg:grid-cols-2 gap-4">
          {TASKS.map((t) => (
            <Card key={t.id} className="p-5 border border-slate-200">
              <p className="font-extrabold text-slate-900">{t.title}</p>
              <p className="text-sm text-slate-600 mt-1">{t.desc}</p>

              <div className="mt-3 flex flex-wrap gap-2">
                {t.pills.map((p, idx) => (
                  <span
                    key={idx}
                    className={`text-[11px] px-2 py-1 rounded-full border font-bold ${p.c}`}
                  >
                    {p.t}
                  </span>
                ))}
              </div>

              <button
                className="mt-4 w-full h-10 rounded-lg bg-orange-600 text-white font-extrabold text-sm hover:bg-orange-700 transition"
                onClick={() =>
                  void showSweetAlert(`${t.btn}: ${t.title} (Feature will be added in next step)`)
                }
              >
                {t.btn}
              </button>
            </Card>
          ))}
        </div>

        <p className="text-xs text-slate-500">
          Resume Builder + Coding + GD topics + Aptitude practice will be connected in next step.
        </p>
      </div>
    </section>
  );
}
