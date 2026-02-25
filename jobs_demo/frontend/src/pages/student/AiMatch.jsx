import { useState } from "react";
import { Link } from "react-router-dom";
import { FiAlertCircle, FiCheck, FiCopy, FiInfo, FiPlus, FiRefreshCw } from "react-icons/fi";
import Modal from "../../components/common/Modal";

const score = 78;
const keywords = ["React", "Node.js", "REST APIs", "MongoDB", "AWS", "Docker"];

export default function AiMatch() {
  const [whyOpen, setWhyOpen] = useState(false);
  const [added, setAdded] = useState({});
  const [toast, setToast] = useState("");

  const level = score >= 75 ? "Strong Match" : score >= 55 ? "Moderate Match" : "Low Match";
  const levelCls = score >= 75 ? "bg-green-50 text-green-700 border-green-200" : score >= 55 ? "bg-orange-50 text-[#F97316] border-orange-200" : "bg-red-50 text-red-600 border-red-200";

  const addKeyword = (k) => {
    setAdded((p) => ({ ...p, [k]: true }));
    setToast("Keyword added to resume");
    setTimeout(() => setToast(""), 1200);
  };

  return (
    <div className="bg-[#F8FAFC] pb-20 md:pb-8">
      <div className="mx-auto max-w-[1200px] space-y-5 px-4 py-6 sm:px-6 lg:px-8">
        <section>
          <h1 className="text-3xl font-bold text-[#0F172A]">AI Match Results</h1>
          <p className="mt-1 text-sm text-slate-500">See how your resume matches this job and what to improve</p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <select className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-blue-300">
              <option>Selected Job: Full Stack Developer at TechCorp</option>
            </select>
            <button type="button" className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">Compare with another job</button>
          </div>
        </section>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_330px]">
          <main className="space-y-4">
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm text-slate-500">Match Score</p>
                  <div className="mt-1 inline-flex items-center gap-2">
                    <span className="text-4xl font-bold text-[#0F172A]">{score}%</span>
                    <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${levelCls}`}>{level}</span>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">Based on skills, experience, keywords, and education</p>
                </div>
                <button type="button" onClick={() => setWhyOpen(true)} className="text-sm font-semibold text-[#2563EB] hover:underline">Why this score?</button>
              </div>
              <div className="mt-4">
                <div className="h-3 overflow-hidden rounded-full border border-slate-200 bg-white">
                  <div className="flex h-full">
                    <div className="w-1/3 bg-red-300" />
                    <div className="w-1/3 bg-orange-300" />
                    <div className="w-1/3 bg-green-400" />
                  </div>
                </div>
                <div className="mt-1 text-xs text-slate-500">Pointer: {score}%</div>
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-semibold text-[#0F172A]">Skills Match</h2>
              <p className="mt-2 text-xs text-slate-500">Matched skills</p>
              <div className="mt-1 flex flex-wrap gap-1.5">
                {["React", "JavaScript", "SQL"].map((x) => <span key={x} className="rounded-full border border-green-200 bg-green-50 px-2.5 py-1 text-xs font-semibold text-green-700">{x}</span>)}
              </div>
              <p className="mt-3 text-xs text-slate-500">Missing skills</p>
              <div className="mt-1 flex flex-wrap gap-1.5">
                {["Node.js", "Docker", "AWS"].map((x) => <span key={x} className="rounded-full border border-orange-200 bg-orange-50 px-2.5 py-1 text-xs font-semibold text-[#F97316]">{x}</span>)}
              </div>
              <button type="button" className="mt-3 rounded-lg bg-[#2563EB] px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700">Add missing skills to profile</button>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-semibold text-[#0F172A]">Experience Match</h2>
              <p className="mt-2 text-sm text-slate-700">Role alignment is good for frontend responsibilities.</p>
              <p className="mt-1 text-sm text-[#9A3412]">Gap: Needs 1+ year with React production deployments.</p>
              <ul className="mt-2 list-disc pl-5 text-sm text-slate-700">
                <li>Add measurable impact bullets in internship section</li>
                <li>Highlight API integration and state management work</li>
              </ul>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-semibold text-[#0F172A]">Keywords & ATS Readability</h2>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {["REST APIs", "Microservices", "CI/CD"].map((x) => (
                  <button key={x} type="button" className="rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-semibold text-[#2563EB] hover:bg-blue-100">
                    {x} + Add to summary
                  </button>
                ))}
              </div>
              <ul className="mt-3 space-y-1 text-sm text-slate-700">
                <li className="inline-flex items-center gap-2"><FiCheck className="text-green-600" /> Headings are consistent</li>
                <li className="inline-flex items-center gap-2"><FiCheck className="text-green-600" /> Bullet structure is readable</li>
                <li className="inline-flex items-center gap-2"><FiAlertCircle className="text-[#F97316]" /> Date formats are inconsistent</li>
              </ul>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-semibold text-[#0F172A]">Education / Certification Match</h2>
              <p className="mt-2 text-sm text-slate-700">Degree requirement matched. Add one cloud certification for stronger fit.</p>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-semibold text-[#0F172A]">Recommended Improvements</h2>
              <div className="mt-3 space-y-2">
                {[
                  ["High", "Improve summary with backend keyword coverage"],
                  ["Medium", "Add 3 achievement bullets in experience"],
                  ["Low", "Reorder sections for ATS preference"],
                ].map(([priority, text]) => (
                  <div key={text} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${priority === "High" ? "bg-red-50 text-red-600" : priority === "Medium" ? "bg-orange-50 text-[#F97316]" : "bg-blue-50 text-[#2563EB]"}`}>{priority}</span>
                        <p className="text-sm text-slate-700">{text}</p>
                      </div>
                      <div className="flex gap-2">
                        <button type="button" className="rounded-lg border border-blue-200 px-2.5 py-1 text-xs font-semibold text-[#2563EB] hover:bg-blue-50">Apply suggestion</button>
                        <button type="button" className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-white"><FiCopy /> Copy</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </main>

          <aside className="space-y-3 lg:sticky lg:top-20 lg:h-fit">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <h3 className="font-semibold text-[#0F172A]">Quick Actions</h3>
              <div className="mt-3 space-y-2">
                <button type="button" className="w-full rounded-lg bg-[#2563EB] px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700">Update Resume</button>
                <Link to="/student/resume-builder" className="block w-full rounded-lg border border-slate-200 px-3 py-2 text-center text-sm font-semibold text-slate-700 hover:bg-slate-50">Open Resume Builder</Link>
                <button type="button" className="inline-flex w-full items-center justify-center gap-1 rounded-lg border border-orange-200 px-3 py-2 text-sm font-semibold text-[#F97316] hover:bg-orange-50"><FiRefreshCw /> Re-scan Resume</button>
                <button type="button" className="w-full rounded-lg bg-[#F97316] px-3 py-2 text-sm font-semibold text-white hover:bg-orange-600">Apply to Job</button>
              </div>
              <div className="mt-3 rounded-xl border border-orange-200 bg-orange-50 p-3 text-xs text-[#9A3412]">
                Complete profile and latest resume to maximize approval chances.
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <h3 className="font-semibold text-[#0F172A]">Keywords to Include</h3>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {keywords.map((k) => (
                  <button key={k} type="button" onClick={() => addKeyword(k)} className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold transition ${added[k] ? "border-green-200 bg-green-50 text-green-700" : "border-blue-200 bg-blue-50 text-[#2563EB] hover:bg-blue-100"}`}>
                    {added[k] ? <FiCheck /> : <FiPlus />}
                    {k}
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4 text-xs text-slate-600 shadow-sm">
              <p className="inline-flex items-center gap-1 font-semibold text-slate-700"><FiInfo /> AI transparency</p>
              <p className="mt-1">AI suggestions are recommendations. Always review before applying.</p>
              <div className="mt-2 flex gap-2">
                <button type="button" className="rounded-lg border border-slate-200 px-2 py-1 font-semibold hover:bg-slate-50">Helpful</button>
                <button type="button" className="rounded-lg border border-slate-200 px-2 py-1 font-semibold hover:bg-slate-50">Not helpful</button>
              </div>
            </div>
          </aside>
        </div>
      </div>

      <Modal
        open={whyOpen}
        onClose={() => setWhyOpen(false)}
        title="Why this score?"
        footer={<button type="button" onClick={() => setWhyOpen(false)} className="rounded-lg bg-[#2563EB] px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">Close</button>}
      >
        <p className="text-sm text-slate-700">
          Score combines skill overlap, keyword relevance, experience alignment, and resume readability checks.
        </p>
      </Modal>

      {toast ? (
        <div className="fixed bottom-5 right-5 rounded-lg bg-[#0F172A] px-3 py-2 text-xs font-semibold text-white shadow-lg">
          {toast}
        </div>
      ) : null}
    </div>
  );
}

