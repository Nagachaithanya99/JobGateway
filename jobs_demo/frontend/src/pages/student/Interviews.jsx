import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { FiCalendar, FiCheckCircle, FiClock, FiExternalLink, FiFileText, FiMapPin } from "react-icons/fi";
import { studentListInterviews } from "../../services/studentService.js";

const STATUS_TONE = {
  Scheduled: "border-blue-200 bg-blue-50 text-[#2563EB]",
  Rescheduled: "border-orange-200 bg-orange-50 text-[#C2410C]",
  Completed: "border-emerald-200 bg-emerald-50 text-emerald-700",
  Cancelled: "border-red-200 bg-red-50 text-red-600",
  "Pending Confirmation": "border-indigo-200 bg-indigo-50 text-indigo-700",
};

const VERIFICATION_TONE = {
  Pending: "border-slate-200 bg-slate-50 text-slate-700",
  Submitted: "border-blue-200 bg-blue-50 text-[#2563EB]",
  Verified: "border-emerald-200 bg-emerald-50 text-emerald-700",
  Rejected: "border-red-200 bg-red-50 text-red-600",
};

export default function StudentInterviews() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [status, setStatus] = useState("");
  const [stage, setStage] = useState("");
  const [active, setActive] = useState(null);

  const load = async (params = {}) => {
    try {
      setLoading(true);
      setErr("");
      const res = await studentListInterviews(params);
      const items = Array.isArray(res?.data?.items) ? res.data.items : [];
      setRows(items);
      if (!active && items.length) setActive(items[0]);
      if (active) {
        const nextActive = items.find((x) => x.id === active.id);
        setActive(nextActive || (items[0] || null));
      }
    } catch (e) {
      setErr(e?.response?.data?.message || "Failed to load interviews");
      setRows([]);
      setActive(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load({ status: status || undefined, stage: stage || undefined });
  }, [status, stage]);

  const summary = useMemo(() => {
    const now = Date.now();
    const upcoming = rows.filter((x) => new Date(x.scheduledAt).getTime() >= now && x.status !== "Cancelled").length;
    const done = rows.filter((x) => x.status === "Completed").length;
    const pendingDocs = rows.filter((x) => x.documentsRequired?.length && x.verificationStatus !== "Verified").length;
    return { upcoming, done, pendingDocs };
  }, [rows]);

  return (
    <div className="bg-[#F7F3F6] pb-24 md:pb-10">
      <div className="w-full px-4 py-6 sm:px-6 lg:px-8">
        <div className="text-xs text-slate-500">
          <Link className="hover:text-slate-700" to="/student">
            Home
          </Link>
          <span className="px-2">/</span>
          <span className="text-slate-700">Interviews</span>
        </div>

        <div className="mt-2">
          <h1 className="text-[28px] font-extrabold tracking-tight text-[#0F172A]">Interview Center</h1>
          <p className="mt-1 text-sm text-slate-500">Interview links, questions, required documents and verification details in one place.</p>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-white/70 bg-white/80 p-4 shadow-sm backdrop-blur">
            <div className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-[#2563EB]"><FiCalendar /></div>
            <p className="mt-2 text-2xl font-extrabold text-[#0F172A]">{summary.upcoming}</p>
            <p className="text-xs text-slate-500">Upcoming Interviews</p>
          </div>
          <div className="rounded-2xl border border-white/70 bg-white/80 p-4 shadow-sm backdrop-blur">
            <div className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700"><FiCheckCircle /></div>
            <p className="mt-2 text-2xl font-extrabold text-[#0F172A]">{summary.done}</p>
            <p className="text-xs text-slate-500">Completed Interviews</p>
          </div>
          <div className="rounded-2xl border border-white/70 bg-white/80 p-4 shadow-sm backdrop-blur">
            <div className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-orange-50 text-[#C2410C]"><FiFileText /></div>
            <p className="mt-2 text-2xl font-extrabold text-[#0F172A]">{summary.pendingDocs}</p>
            <p className="text-xs text-slate-500">Pending Document Verification</p>
          </div>
        </div>

        <div className="mt-4 rounded-2xl border border-white/70 bg-white/80 p-3 shadow-sm backdrop-blur">
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            <select value={status} onChange={(e) => setStatus(e.target.value)} className="h-10 rounded-xl border border-slate-200 px-3 text-sm">
              <option value="">All Status</option>
              <option>Scheduled</option>
              <option>Rescheduled</option>
              <option>Completed</option>
              <option>Cancelled</option>
              <option>Pending Confirmation</option>
            </select>
            <select value={stage} onChange={(e) => setStage(e.target.value)} className="h-10 rounded-xl border border-slate-200 px-3 text-sm">
              <option value="">All Stages</option>
              <option>HR</option>
              <option>Technical</option>
              <option>Final</option>
            </select>
            <button type="button" onClick={() => load({ status: status || undefined, stage: stage || undefined })} className="h-10 rounded-xl bg-[#F97316] px-4 text-sm font-bold text-white hover:bg-orange-600">
              Refresh
            </button>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_380px]">
          <div className="space-y-3">
            {loading ? <div className="rounded-2xl border border-white/70 bg-white/80 p-6 text-sm text-slate-500">Loading interviews...</div> : null}
            {err ? <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{err}</div> : null}
            {!loading && !err && !rows.length ? <div className="rounded-2xl border border-white/70 bg-white/80 p-6 text-sm text-slate-500">No interviews found.</div> : null}

            {rows.map((it) => {
              const isActive = active?.id === it.id;
              return (
                <button
                  key={it.id}
                  type="button"
                  onClick={() => setActive(it)}
                  className={`w-full rounded-2xl border p-4 text-left shadow-sm transition ${isActive ? "border-orange-200 bg-orange-50/70" : "border-white/70 bg-white/80 hover:border-slate-200"}`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="text-base font-extrabold text-[#0F172A]">{it.jobTitle || "Interview"}</p>
                      <p className="text-sm text-slate-600">{it.companyName || "Company"}</p>
                    </div>
                    <span className={`rounded-full border px-2.5 py-1 text-[11px] font-extrabold ${STATUS_TONE[it.status] || "border-slate-200 bg-slate-50 text-slate-700"}`}>{it.status}</span>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-3 text-xs font-semibold text-slate-600">
                    <span className="inline-flex items-center gap-1"><FiClock /> {it.date} | {it.time}</span>
                    <span className="rounded-full border border-slate-200 bg-white px-2 py-0.5">{it.stage} Round</span>
                    <span className="rounded-full border border-slate-200 bg-white px-2 py-0.5">{it.mode}</span>
                  </div>
                </button>
              );
            })}
          </div>

          <aside className="lg:sticky lg:top-20 lg:h-fit">
            <div className="rounded-2xl border border-white/70 bg-white/80 p-4 shadow-sm backdrop-blur">
              {!active ? (
                <p className="text-sm text-slate-500">Select an interview to view full details.</p>
              ) : (
                <div className="space-y-4">
                  <div>
                    <p className="text-lg font-extrabold text-[#0F172A]">{active.jobTitle}</p>
                    <p className="text-sm text-slate-600">{active.companyName}</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <span className={`rounded-full border px-2.5 py-1 text-[11px] font-extrabold ${STATUS_TONE[active.status] || "border-slate-200 bg-slate-50 text-slate-700"}`}>{active.status}</span>
                      <span className={`rounded-full border px-2.5 py-1 text-[11px] font-extrabold ${VERIFICATION_TONE[active.verificationStatus] || "border-slate-200 bg-slate-50 text-slate-700"}`}>Verification: {active.verificationStatus}</span>
                    </div>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
                    <p><span className="font-semibold text-[#0F172A]">Date & Time:</span> {active.date} | {active.time}</p>
                    <p className="mt-1"><span className="font-semibold text-[#0F172A]">Stage:</span> {active.stage}</p>
                    <p className="mt-1"><span className="font-semibold text-[#0F172A]">Mode:</span> {active.mode}</p>
                    {active.location ? <p className="mt-1 inline-flex items-center gap-1"><FiMapPin /> {active.location}</p> : null}
                  </div>

                  {active.meetingLink ? (
                    <a
                      href={active.meetingLink}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-bold text-[#2563EB] hover:bg-blue-100"
                    >
                      Join Interview <FiExternalLink />
                    </a>
                  ) : null}

                  {active.interviewLinks?.length ? (
                    <div>
                      <p className="text-sm font-extrabold text-[#0F172A]">Interview Links</p>
                      <div className="mt-2 space-y-2">
                        {active.interviewLinks.map((url) => (
                          <a key={url} href={url} target="_blank" rel="noreferrer" className="block truncate rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-[#2563EB] hover:bg-blue-50">
                            {url}
                          </a>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  {active.interviewQuestions?.length ? (
                    <div>
                      <p className="text-sm font-extrabold text-[#0F172A]">Questions Shared by Company</p>
                      <ul className="mt-2 space-y-1 text-sm text-slate-700">
                        {active.interviewQuestions.map((q) => (
                          <li key={q} className="rounded-lg border border-slate-200 bg-white px-3 py-2">{q}</li>
                        ))}
                      </ul>
                    </div>
                  ) : null}

                  {active.documentsRequired?.length ? (
                    <div>
                      <p className="text-sm font-extrabold text-[#0F172A]">Required Documents</p>
                      <ul className="mt-2 space-y-1 text-sm text-slate-700">
                        {active.documentsRequired.map((d) => (
                          <li key={d} className="rounded-lg border border-slate-200 bg-white px-3 py-2">{d}</li>
                        ))}
                      </ul>
                    </div>
                  ) : null}

                  {active.verificationDetails ? (
                    <div className="rounded-xl border border-orange-200 bg-orange-50 p-3 text-sm text-[#7C2D12]">
                      <p className="font-extrabold">Document Verification Details</p>
                      <p className="mt-1 whitespace-pre-wrap">{active.verificationDetails}</p>
                    </div>
                  ) : null}

                  {active.additionalDetails ? (
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
                      <p className="font-extrabold text-[#0F172A]">Additional Details</p>
                      <p className="mt-1 whitespace-pre-wrap">{active.additionalDetails}</p>
                    </div>
                  ) : null}

                  {active.messageToCandidate ? (
                    <div className="rounded-xl border border-blue-200 bg-blue-50 p-3 text-sm text-[#1D4ED8]">
                      <p className="font-extrabold">Message from Company</p>
                      <p className="mt-1 whitespace-pre-wrap">{active.messageToCandidate}</p>
                    </div>
                  ) : null}
                </div>
              )}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}


