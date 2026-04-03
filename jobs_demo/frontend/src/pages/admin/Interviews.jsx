import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiAlertTriangle, FiClock, FiPlayCircle, FiSearch } from "react-icons/fi";
import { adminListInterviews, adminStartInterview } from "../../services/interviewsService.js";
import { showSweetToast } from "../../utils/sweetAlert.js";

export default function AdminInterviews() {
  const nav = useNavigate();
  const [rows, setRows] = useState([]);
  const [summary, setSummary] = useState({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [msg, setMsg] = useState("");

  useEffect(() => {
    if (!msg) return;
    void showSweetToast(msg, "info", { timer: 1800 });
  }, [msg]);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await adminListInterviews({
        q: search || undefined,
        status: status || undefined,
      });
      setRows(Array.isArray(res?.items) ? res.items : []);
      setSummary(res?.summary || {});
    } catch (e) {
      setMsg(e?.response?.data?.message || "Failed to load interviews");
    } finally {
      setLoading(false);
    }
  }, [search, status]);

  useEffect(() => {
    load();
  }, [load]);

  const startNow = async (id) => {
    try {
      await adminStartInterview(id);
      nav(`/admin/interviews/${id}/workspace`);
    } catch (e) {
      setMsg(e?.response?.data?.message || "Unable to start");
    }
  };

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-2xl font-bold text-[#0F172A]">Admin Interview Desk</h1>
        <p className="text-sm text-slate-500">Manage interviews for admin-managed jobs and monitor live sessions.</p>
      </header>

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <div className="rounded-xl border border-slate-200 bg-white p-3"><p className="text-xl font-bold">{summary.scheduled || 0}</p><p className="text-xs text-slate-500">Scheduled</p></div>
        <div className="rounded-xl border border-slate-200 bg-white p-3"><p className="text-xl font-bold">{summary.waitingRoom || 0}</p><p className="text-xs text-slate-500">Waiting Room</p></div>
        <div className="rounded-xl border border-slate-200 bg-white p-3"><p className="text-xl font-bold">{summary.live || 0}</p><p className="text-xs text-slate-500">Live</p></div>
        <div className="rounded-xl border border-slate-200 bg-white p-3"><p className="text-xl font-bold">{summary.reviewReady || 0}</p><p className="text-xs text-slate-500">Review Ready</p></div>
        <div className="rounded-xl border border-slate-200 bg-white p-3"><p className="text-xl font-bold">{summary.flagged || 0}</p><p className="text-xs text-slate-500">Flagged</p></div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-3">
        <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
          <div className="flex h-10 items-center gap-2 rounded-lg border border-slate-200 px-3">
            <FiSearch className="text-slate-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search company / candidate / job" className="w-full bg-transparent text-sm outline-none" />
          </div>
          <select value={status} onChange={(e) => setStatus(e.target.value)} className="h-10 rounded-lg border border-slate-200 px-3 text-sm">
            <option value="">All Status</option>
            <option>Scheduled</option>
            <option>Waiting Room</option>
            <option>Live</option>
            <option>Review Ready</option>
            <option>Cancelled</option>
          </select>
          <button onClick={load} className="h-10 rounded-lg border border-slate-200 px-3 text-sm font-semibold text-slate-700">Refresh</button>
        </div>
      </section>

      <section className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full min-w-[1000px] text-sm">
          <thead className="bg-slate-50 text-left text-xs text-slate-600">
            <tr>
              <th className="px-3 py-3">Company</th>
              <th className="px-3 py-3">Candidate</th>
              <th className="px-3 py-3">Role</th>
              <th className="px-3 py-3">Round</th>
              <th className="px-3 py-3">Status</th>
              <th className="px-3 py-3">Time</th>
              <th className="px-3 py-3">Proctoring</th>
              <th className="px-3 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? <tr><td colSpan={8} className="px-3 py-10 text-center text-slate-500">Loading...</td></tr> : null}
            {!loading && !rows.length ? <tr><td colSpan={8} className="px-3 py-10 text-center text-slate-500">No interviews found.</td></tr> : null}
            {!loading && rows.map((x) => (
              <tr key={x.id} className="border-t border-slate-100">
                <td className="px-3 py-3 font-semibold text-[#0F172A]">{x.companyName}</td>
                <td className="px-3 py-3">{x.studentName}</td>
                <td className="px-3 py-3">{x.jobTitle}</td>
                <td className="px-3 py-3">{x.currentRound || x.stage}</td>
                <td className="px-3 py-3">{x.status}</td>
                <td className="px-3 py-3">{x.date} {x.time}</td>
                <td className="px-3 py-3">
                  <span className="inline-flex items-center gap-1 text-xs text-slate-600"><FiAlertTriangle /> {x.proctoring?.riskLevel || "Low"}</span>
                </td>
                <td className="px-3 py-3">
                  <div className="flex flex-wrap gap-1">
                    {["Scheduled", "Waiting Room"].includes(x.status) ? (
                      <button onClick={() => startNow(x.id)} className="rounded-lg border border-green-200 px-2 py-1 text-xs font-semibold text-green-700"><FiPlayCircle className="mr-1 inline" />Start</button>
                    ) : null}
                    <button onClick={() => nav(`/admin/interviews/${x.id}/workspace`)} className="rounded-lg border border-slate-200 px-2 py-1 text-xs font-semibold text-slate-700"><FiClock className="mr-1 inline" />View</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

    </div>
  );
}
