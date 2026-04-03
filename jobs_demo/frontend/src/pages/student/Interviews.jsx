import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiCalendar, FiClock, FiCheckCircle, FiWifi, FiVideo } from "react-icons/fi";
import { showSweetToast } from "../../utils/sweetAlert.js";
import {
  getStudentInterviews,
  studentCompletePreJoin,
  studentCancelInterview,
  studentEnterWaitingRoom,
} from "../../services/interviewsService.js";

function statusChip(status) {
  if (status === "Live") return "border-green-200 bg-green-50 text-green-700";
  if (status === "Waiting Room") return "border-indigo-200 bg-indigo-50 text-indigo-700";
  if (status === "Completed" || status === "Review Ready") return "border-slate-200 bg-slate-100 text-slate-700";
  if (status === "Cancelled" || status === "No Show") return "border-red-200 bg-red-50 text-red-700";
  return "border-blue-200 bg-blue-50 text-blue-700";
}

export default function StudentInterviews() {
  const nav = useNavigate();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");
  const [active, setActive] = useState(null);
  const [prejoin, setPrejoin] = useState({
    open: false,
    interviewId: "",
    cameraReady: true,
    microphoneReady: true,
    networkQuality: "Good",
    consentAccepted: false,
    rulesAccepted: false,
  });

  useEffect(() => {
    if (!msg) return;
    void showSweetToast(msg, "info", { timer: 1800 });
  }, [msg]);

  const load = async () => {
    try {
      setLoading(true);
      const data = await getStudentInterviews();
      const items = Array.isArray(data?.items) ? data.items.filter(Boolean) : [];
      setRows(items);
      setActive((prev) => items.find((x) => x.id === prev?.id) || items[0] || null);
    } catch (e) {
      setMsg(e?.response?.data?.message || "Failed to load interviews");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const summary = useMemo(() => {
    const upcoming = rows.filter((x) => ["Scheduled", "Rescheduled", "Waiting Room"].includes(String(x?.status || ""))).length;
    const today = rows.filter((x) => String(x?.date || "") === new Date().toISOString().slice(0, 10)).length;
    const completed = rows.filter((x) => ["Completed", "Review Ready"].includes(String(x?.status || ""))).length;
    return { upcoming, today, completed };
  }, [rows]);

  const onJoin = (row) => {
    if (["Completed", "Review Ready", "Cancelled", "No Show"].includes(row.status)) {
      setMsg(`Interview is already ${row.status}. Joining is disabled.`);
      return;
    }
    if (!row.joinAllowed) {
      setMsg(`Join opens at ${new Date(row.joinAvailableAt).toLocaleString()}`);
      return;
    }
    setPrejoin({
      open: true,
      interviewId: row.id,
      cameraReady: true,
      microphoneReady: true,
      networkQuality: "Good",
      consentAccepted: false,
      rulesAccepted: false,
    });
  };

  const completePreJoin = async () => {
    try {
      if (!prejoin.consentAccepted || !prejoin.rulesAccepted) {
        setMsg("Please accept consent and interview rules");
        return;
      }
      await studentCompletePreJoin(prejoin.interviewId, {
        cameraReady: prejoin.cameraReady,
        microphoneReady: prejoin.microphoneReady,
        networkQuality: prejoin.networkQuality,
        consentAccepted: prejoin.consentAccepted,
        rulesAccepted: prejoin.rulesAccepted,
      });
      await studentEnterWaitingRoom(prejoin.interviewId);
      setPrejoin((p) => ({ ...p, open: false }));
      nav(`/student/interviews/${prejoin.interviewId}/workspace`);
    } catch (e) {
      setMsg(e?.response?.data?.message || "Unable to join interview");
    }
  };

  const onCancelInterview = async (row) => {
    try {
      await studentCancelInterview(row.id);
      setMsg("Interview cancelled");
      await load();
    } catch (e) {
      setMsg(e?.response?.data?.message || "Unable to cancel interview");
    }
  };

  return (
    <div className="space-y-4 pb-14">
      <header>
        <h1 className="text-2xl font-bold text-[#0F172A]">Interview Center</h1>
        <p className="text-sm text-slate-500">Upcoming interviews, pre-join checks and live interview access.</p>
      </header>

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-3"><FiCalendar className="text-[#2563EB]" /><p className="mt-2 text-xl font-bold">{summary.upcoming}</p><p className="text-xs text-slate-500">Upcoming Interviews</p></div>
        <div className="rounded-xl border border-slate-200 bg-white p-3"><FiClock className="text-[#F97316]" /><p className="mt-2 text-xl font-bold">{summary.today}</p><p className="text-xs text-slate-500">Interviews Today</p></div>
        <div className="rounded-xl border border-slate-200 bg-white p-3"><FiCheckCircle className="text-green-700" /><p className="mt-2 text-xl font-bold">{summary.completed}</p><p className="text-xs text-slate-500">Completed</p></div>
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-2">
          {loading ? <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-500">Loading interviews...</div> : null}
          {!loading && !rows.length ? <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-500">No interviews available.</div> : null}
          {rows.filter(Boolean).map((row) => (
            <button key={row.id} onClick={() => setActive(row)} className={`w-full rounded-xl border p-3 text-left ${active?.id === row.id ? "border-blue-200 bg-blue-50/60" : "border-slate-200 bg-white"}`}>
              <div className="flex items-center justify-between">
                <p className="font-bold text-[#0F172A]">{row.companyName}</p>
                <span className={`rounded-full border px-2 py-1 text-[11px] font-semibold ${statusChip(row.status)}`}>{row.status}</span>
              </div>
              <p className="text-sm text-slate-600">{row.jobTitle} - {row.stage} Round</p>
              <p className="mt-1 text-xs text-slate-500">{row.date} | {row.time}</p>
            </button>
          ))}
        </div>

        <aside className="rounded-xl border border-slate-200 bg-white p-4">
          {!active ? <p className="text-sm text-slate-500">Select an interview to view details.</p> : (
            <div className="space-y-3">
              <div>
                <p className="text-lg font-bold text-[#0F172A]">{active.jobTitle}</p>
                <p className="text-sm text-slate-600">{active.companyName}</p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
                <p>Date: {active.date} {active.time}</p>
                <p>Mode: {active.mode}</p>
                <p>Round: {active.stage}</p>
                <p>Duration: {active.durationLabel || `${active.durationMins || 30} mins`}</p>
                <p>Room ID: {active.roomId || "-"}</p>
              </div>
              {["Completed", "Review Ready", "Cancelled", "No Show"].includes(active.status) ? (
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
                  <p className="font-semibold text-[#0F172A]">Interview Status Details</p>
                  <p className="mt-1">Current Status: {active.status}</p>
                  <p>Ended At: {active.endedAtText || "-"}</p>
                  <p>Room ID: {active.roomId || "-"}</p>
                </div>
              ) : null}
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm">
                <p className="font-semibold text-[#0F172A]">Join Rules</p>
                <p className="mt-1 text-slate-600">Join opens 10 minutes before interview start. Complete device, network and consent checks before entering waiting room.</p>
              </div>
              {["Completed", "Review Ready", "Cancelled", "No Show"].includes(active.status) ? (
                <div className="space-y-2">
                  <button disabled className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-500">Join Disabled - Interview {active.status}</button>
                  <button disabled className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-400">Cancel Disabled</button>
                </div>
              ) : (
                <div className="space-y-2">
                  <button onClick={() => onJoin(active)} className="w-full rounded-lg bg-[#2563EB] px-3 py-2 text-sm font-semibold text-white">Join Meeting</button>
                  <button onClick={() => onCancelInterview(active)} className="w-full rounded-lg border border-red-200 px-3 py-2 text-sm font-semibold text-red-600">Cancel Interview</button>
                </div>
              )}
            </div>
          )}
        </aside>
      </section>

      {prejoin.open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/35 p-4">
          <div className="w-full max-w-xl rounded-xl border border-slate-200 bg-white p-4">
            <h2 className="text-lg font-bold text-[#0F172A]">Pre-Join Setup</h2>
            <div className="mt-3 space-y-3 text-sm">
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <p className="font-semibold"><FiVideo className="mr-1 inline" />Device Check</p>
                <label className="mt-2 block"><input type="checkbox" checked={prejoin.cameraReady} onChange={(e) => setPrejoin((p) => ({ ...p, cameraReady: e.target.checked }))} /> Camera ready</label>
                <label className="block"><input type="checkbox" checked={prejoin.microphoneReady} onChange={(e) => setPrejoin((p) => ({ ...p, microphoneReady: e.target.checked }))} /> Microphone ready</label>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <p className="font-semibold"><FiWifi className="mr-1 inline" />Network Check</p>
                <select value={prejoin.networkQuality} onChange={(e) => setPrejoin((p) => ({ ...p, networkQuality: e.target.value }))} className="mt-2 h-9 rounded-lg border border-slate-200 px-2">
                  <option>Good</option>
                  <option>Average</option>
                  <option>Poor</option>
                </select>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <label className="block"><input type="checkbox" checked={prejoin.consentAccepted} onChange={(e) => setPrejoin((p) => ({ ...p, consentAccepted: e.target.checked }))} /> I agree to recording, AI transcript and proctoring.</label>
                <label className="mt-1 block"><input type="checkbox" checked={prejoin.rulesAccepted} onChange={(e) => setPrejoin((p) => ({ ...p, rulesAccepted: e.target.checked }))} /> I accept interview rules (camera on, no tab switching, no external help).</label>
              </div>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button onClick={() => setPrejoin((p) => ({ ...p, open: false }))} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700">Cancel</button>
              <button onClick={completePreJoin} className="rounded-lg bg-[#2563EB] px-4 py-2 text-sm font-semibold text-white">Enter Waiting Room</button>
            </div>
          </div>
        </div>
      ) : null}

    </div>
  );
}
