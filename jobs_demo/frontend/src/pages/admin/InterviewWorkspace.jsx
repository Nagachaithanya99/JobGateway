import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FiShield, FiVideo } from "react-icons/fi";
import { adminEndInterview, adminInterviewWorkspace } from "../../services/interviewsService.js";
import { showSweetToast } from "../../utils/sweetAlert.js";

export default function AdminInterviewWorkspace() {
  const { id } = useParams();
  const nav = useNavigate();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [decision, setDecision] = useState("");
  const [msg, setMsg] = useState("");

  useEffect(() => {
    if (!msg) return;
    void showSweetToast(msg, "info", { timer: 1800 });
  }, [msg]);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await adminInterviewWorkspace(id);
      setItem(res?.interview || null);
    } catch (e) {
      setMsg(e?.response?.data?.message || "Failed to load workspace");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const endNow = async () => {
    try {
      const res = await adminEndInterview(id, { decision });
      setItem(res?.interview || item);
      setMsg("Interview moved to review");
    } catch (e) {
      setMsg(e?.response?.data?.message || "Unable to end interview");
    }
  };

  if (loading) return <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-600">Loading workspace...</div>;
  if (!item) return <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">Interview not found.</div>;

  return (
    <div className="space-y-4 pb-10">
      <header className="rounded-xl border border-slate-200 bg-white p-4">
        <h1 className="text-xl font-bold text-[#0F172A]">Admin Interview Workspace</h1>
        <p className="text-sm text-slate-500">{item.companyName} - {item.studentName} - {item.jobTitle}</p>
      </header>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-3">
          <div className="flex flex-wrap gap-2 text-xs">
            <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-1">Status: {item.status}</span>
            <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-1">Round: {item.currentRound || item.stage}</span>
            <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-1">Session: {item.sessionId || "-"}</span>
          </div>
          <div className="grid h-[360px] place-items-center rounded-xl border border-dashed border-slate-300 bg-slate-50 text-slate-500">
            <div className="text-center">
              <FiVideo className="mx-auto text-3xl" />
              <p className="mt-2 text-sm font-semibold">Live Monitor Preview</p>
            </div>
          </div>
        </div>

        <aside className="space-y-3 rounded-xl border border-slate-200 bg-white p-3">
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
            <p className="font-semibold text-[#0F172A]"><FiShield className="mr-1 inline" />Proctoring</p>
            <p className="mt-1">Risk: {item.proctoring?.riskLevel || "Low"}</p>
            <p>Alerts: {item.proctoring?.alerts?.length || 0}</p>
          </div>
          <select value={decision} onChange={(e) => setDecision(e.target.value)} className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm">
            <option value="">Set Decision</option>
            <option value="Strong Hire">Strong Hire</option>
            <option value="Hire">Hire</option>
            <option value="Hold">Hold</option>
            <option value="Reject">Reject</option>
          </select>
          <button onClick={endNow} className="w-full rounded-lg bg-red-600 px-3 py-2 text-sm font-semibold text-white">End Interview</button>
          <button onClick={() => nav("/admin/interviews")} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700">Back to Interviews</button>
        </aside>
      </section>

    </div>
  );
}
