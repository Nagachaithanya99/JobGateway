import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FiRefreshCw, FiShield, FiVideo } from "react-icons/fi";
import {
  adminEndInterview,
  adminInterviewMonitorCandidate,
  adminInterviewMonitorOffer,
  adminInterviewWorkspace,
} from "../../services/interviewsService.js";
import { getApiOrigin } from "../../utils/apiBaseUrl.js";
import { showSweetToast } from "../../utils/sweetAlert.js";

const ICE_CONFIG = {
  iceServers: [{ urls: ["stun:stun.l.google.com:19302", "stun:stun1.l.google.com:19302"] }],
};

function candidateKey(candidateLike) {
  const rawIdx = Number(candidateLike?.sdpMLineIndex);
  const idx = Number.isFinite(rawIdx) ? String(rawIdx) : "null";
  return `${String(candidateLike?.candidate || "")}|${String(candidateLike?.sdpMid || "")}|${idx}`;
}

function buildIceCandidateInit(candidateLike = {}) {
  const mLineIndexNum = Number(candidateLike?.sdpMLineIndex);
  const hasMLineIndex = Number.isFinite(mLineIndexNum);
  const hasMid = String(candidateLike?.sdpMid || "").length > 0;
  return {
    candidate: String(candidateLike?.candidate || ""),
    ...(hasMid ? { sdpMid: String(candidateLike.sdpMid) } : {}),
    ...(hasMLineIndex ? { sdpMLineIndex: mLineIndexNum } : {}),
    ...(candidateLike?.usernameFragment ? { usernameFragment: String(candidateLike.usernameFragment) } : {}),
  };
}

function normalizeRemoteSdp(raw) {
  const text = String(raw || "")
    .replace(/\\r\\n/g, "\r\n")
    .replace(/\\n/g, "\n")
    .trim();
  const lines = text
    .split(/\r?\n/)
    .map((line) => String(line || "").trim())
    .filter(Boolean);
  const startIndex = lines.findIndex((line) => line.startsWith("v=0"));
  if (startIndex < 0) return "";
  const allowed = /^(v|o|s|t|a|m|c|b)=/;
  const cleaned = lines.slice(startIndex).filter((line) => allowed.test(line));
  if (!cleaned.length || !cleaned[0].startsWith("v=0")) return "";
  if (!cleaned.some((line) => line.startsWith("m="))) return "";
  return `${cleaned.join("\r\n")}\r\n`;
}

function buildInterviewWsUrl(interviewId) {
  const u = new URL(getApiOrigin());
  const wsProtocol = u.protocol === "https:" ? "wss:" : "ws:";
  const q = `interviewId=${encodeURIComponent(String(interviewId || ""))}&role=admin`;
  return [
    `${wsProtocol}//${u.host}/ws/interviews?${q}`,
    `${wsProtocol}//${u.host}/api/ws/interviews?${q}`,
  ];
}

function MonitorPill({ label, value, tone = "slate" }) {
  const toneClasses = {
    emerald: "border-emerald-200 bg-emerald-50 text-emerald-700",
    amber: "border-amber-200 bg-amber-50 text-amber-700",
    slate: "border-slate-200 bg-slate-50 text-slate-700",
  };

  return (
    <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${toneClasses[tone] || toneClasses.slate}`}>
      {label}: {value}
    </span>
  );
}

function MonitorVideoCard({ label, videoRef, isLive, note }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-[#0F172A]">{label}</h2>
          <p className="text-xs text-slate-500">{isLive ? "Live interview stream" : note}</p>
        </div>
        <span
          className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
            isLive ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
          }`}
        >
          {isLive ? "Live" : "Waiting"}
        </span>
      </div>

      <div className="relative h-[280px] overflow-hidden rounded-2xl border border-slate-200 bg-black md:h-[340px]">
        <video ref={videoRef} autoPlay playsInline className="h-full w-full object-cover" />
        {!isLive ? (
          <div className="pointer-events-none absolute inset-0 grid place-items-center bg-slate-950/75 text-slate-200">
            <div className="text-center">
              <FiVideo className="mx-auto text-3xl" />
              <p className="mt-2 text-sm font-semibold">{note}</p>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default function AdminInterviewWorkspace() {
  const { id } = useParams();
  const nav = useNavigate();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [decision, setDecision] = useState("");
  const [msg, setMsg] = useState("");
  const [monitorStatus, setMonitorStatus] = useState({ company: "waiting", student: "waiting" });

  const companyVideoRef = useRef(null);
  const studentVideoRef = useRef(null);
  const companyPeerRef = useRef(null);
  const studentPeerRef = useRef(null);
  const companyStreamRef = useRef(null);
  const studentStreamRef = useRef(null);
  const appliedCompanyCandidatesRef = useRef(new Set());
  const appliedStudentCandidatesRef = useRef(new Set());
  const pendingCompanyCandidatesRef = useRef([]);
  const pendingStudentCandidatesRef = useRef([]);
  const appliedCompanyAnswerSdpRef = useRef("");
  const appliedStudentAnswerSdpRef = useRef("");

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
    const timer = setInterval(load, 2000);
    return () => clearInterval(timer);
  }, [load]);

  const getMonitorRefs = useCallback((targetRole) => {
    if (targetRole === "student") {
      return {
        peerRef: studentPeerRef,
        streamRef: studentStreamRef,
        videoRef: studentVideoRef,
        appliedCandidatesRef: appliedStudentCandidatesRef,
        pendingCandidatesRef: pendingStudentCandidatesRef,
        appliedAnswerSdpRef: appliedStudentAnswerSdpRef,
      };
    }

    return {
      peerRef: companyPeerRef,
      streamRef: companyStreamRef,
      videoRef: companyVideoRef,
      appliedCandidatesRef: appliedCompanyCandidatesRef,
      pendingCandidatesRef: pendingCompanyCandidatesRef,
      appliedAnswerSdpRef: appliedCompanyAnswerSdpRef,
    };
  }, []);

  const updateMonitorSnapshot = useCallback((targetRole, updater) => {
    setItem((prev) => {
      if (!prev) return prev;
      const collaboration = prev.collaboration || {};
      const webrtc = collaboration.webrtc || {};
      const adminMonitor = webrtc.adminMonitor || {};
      const currentTarget = adminMonitor[targetRole] || {};
      return {
        ...prev,
        collaboration: {
          ...collaboration,
          webrtc: {
            ...webrtc,
            adminMonitor: {
              company: adminMonitor.company || {},
              student: adminMonitor.student || {},
              [targetRole]: updater(currentTarget),
            },
          },
        },
      };
    });
  }, []);

  const applyMonitorCandidate = useCallback(async (targetRole, candidateLike) => {
    const { peerRef, appliedCandidatesRef, pendingCandidatesRef } = getMonitorRefs(targetRole);
    const peer = peerRef.current;
    if (!peer || !candidateLike?.candidate) return;

    const key = candidateKey(candidateLike);
    if (appliedCandidatesRef.current.has(key)) return;

    if (!peer.remoteDescription) {
      if (!pendingCandidatesRef.current.find((row) => candidateKey(row) === key)) {
        pendingCandidatesRef.current.push(candidateLike);
      }
      return;
    }

    try {
      await peer.addIceCandidate(new RTCIceCandidate(buildIceCandidateInit(candidateLike)));
      appliedCandidatesRef.current.add(key);
    } catch {
      if (!pendingCandidatesRef.current.find((row) => candidateKey(row) === key)) {
        pendingCandidatesRef.current.push(candidateLike);
      }
    }
  }, [getMonitorRefs]);

  const applyMonitorAnswer = useCallback(async (targetRole, answerLike) => {
    const { peerRef, pendingCandidatesRef, appliedAnswerSdpRef } = getMonitorRefs(targetRole);
    const peer = peerRef.current;
    if (!peer) return;

    const answerSdp = normalizeRemoteSdp(answerLike?.sdp);
    if (!answerSdp || !/^v=0(?:\r?\n|$)/.test(answerSdp)) return;
    if (appliedAnswerSdpRef.current === answerSdp) return;
    if (!peer.localDescription) return;

    try {
      await peer.setRemoteDescription(new RTCSessionDescription({ type: answerLike?.type || "answer", sdp: answerSdp }));
      appliedAnswerSdpRef.current = answerSdp;
      setMonitorStatus((prev) => ({ ...prev, [targetRole]: "live" }));
      const pending = [...pendingCandidatesRef.current];
      pendingCandidatesRef.current = [];
      for (const candidate of pending) {
        await applyMonitorCandidate(targetRole, candidate);
      }
    } catch (e) {
      console.debug("admin setRemoteDescription retry:", e?.message || e);
    }
  }, [applyMonitorCandidate, getMonitorRefs]);

  const disconnectMonitor = useCallback((targetRole) => {
    const {
      peerRef,
      streamRef,
      videoRef,
      appliedCandidatesRef,
      pendingCandidatesRef,
      appliedAnswerSdpRef,
    } = getMonitorRefs(targetRole);

    if (peerRef.current) {
      peerRef.current.ontrack = null;
      peerRef.current.onicecandidate = null;
      try {
        peerRef.current.close();
      } catch {
        // ignore close races
      }
      peerRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch {
          // ignore remote track stop failures
        }
      });
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    appliedCandidatesRef.current = new Set();
    pendingCandidatesRef.current = [];
    appliedAnswerSdpRef.current = "";
    setMonitorStatus((prev) => ({ ...prev, [targetRole]: "waiting" }));
  }, [getMonitorRefs]);

  const connectMonitor = useCallback(async (targetRole) => {
    const { peerRef, streamRef, videoRef } = getMonitorRefs(targetRole);
    if (peerRef.current) return;

    const peer = new RTCPeerConnection(ICE_CONFIG);
    peerRef.current = peer;
    setMonitorStatus((prev) => ({ ...prev, [targetRole]: "connecting" }));

    peer.addTransceiver("audio", { direction: "recvonly" });
    peer.addTransceiver("video", { direction: "recvonly" });

    peer.ontrack = (event) => {
      if (!streamRef.current) streamRef.current = new MediaStream();
      const tracks = event.streams?.[0]?.getTracks?.() || [event.track].filter(Boolean);
      tracks.forEach((track) => {
        if (track && !streamRef.current.getTracks().find((row) => row.id === track.id)) {
          streamRef.current.addTrack(track);
        }
      });

      if (videoRef.current) {
        videoRef.current.srcObject = streamRef.current;
        videoRef.current.play?.().catch(() => {});
      }

      const hasLiveVideo = streamRef.current.getVideoTracks().length > 0;
      setMonitorStatus((prev) => ({ ...prev, [targetRole]: hasLiveVideo ? "live" : "connecting" }));

      if (event.track) {
        event.track.onended = () => {
          const stillLive = Boolean(streamRef.current?.getVideoTracks().length);
          setMonitorStatus((prev) => ({ ...prev, [targetRole]: stillLive ? "live" : "waiting" }));
        };
      }
    };

    peer.onicecandidate = async (event) => {
      if (!event.candidate) return;
      try {
        await adminInterviewMonitorCandidate(id, targetRole, event.candidate.toJSON());
      } catch {
        // ignore intermittent signaling writes
      }
    };

    peer.onconnectionstatechange = () => {
      const state = peer.connectionState;
      if (state === "connected") {
        setMonitorStatus((prev) => ({ ...prev, [targetRole]: "live" }));
        return;
      }
      if (["new", "connecting"].includes(state)) {
        setMonitorStatus((prev) => ({ ...prev, [targetRole]: "connecting" }));
        return;
      }
      if (["disconnected", "failed", "closed"].includes(state)) {
        setMonitorStatus((prev) => ({ ...prev, [targetRole]: "waiting" }));
      }
    };

    try {
      const offer = await peer.createOffer({ offerToReceiveAudio: true, offerToReceiveVideo: true });
      await peer.setLocalDescription(offer);
      const res = await adminInterviewMonitorOffer(id, targetRole, { type: offer.type, sdp: offer.sdp });
      if (res?.interview) {
        setItem(res.interview);
      }
    } catch (e) {
      disconnectMonitor(targetRole);
      setMsg(e?.response?.data?.message || e?.message || `Unable to connect ${targetRole} monitor`);
    }
  }, [disconnectMonitor, getMonitorRefs, id]);

  useEffect(() => {
    if (!item) return;
    void connectMonitor("company");
    void connectMonitor("student");
  }, [item, connectMonitor]);

  useEffect(() => {
    if (!item) return;
    const monitor = item?.collaboration?.webrtc?.adminMonitor || {};

    const syncMonitor = async (targetRole) => {
      const state = monitor?.[targetRole] || {};
      const answer = state?.answer || null;
      const candidates = Array.isArray(
        targetRole === "company" ? state?.companyCandidates : state?.studentCandidates,
      )
        ? (targetRole === "company" ? state.companyCandidates : state.studentCandidates)
        : [];

      if (answer?.sdp) {
        await applyMonitorAnswer(targetRole, answer);
      }
      for (const candidate of candidates) {
        if (!candidate?.candidate) continue;
        await applyMonitorCandidate(targetRole, candidate);
      }
    };

    syncMonitor("company").catch(() => {});
    syncMonitor("student").catch(() => {});
  }, [item, applyMonitorAnswer, applyMonitorCandidate]);

  useEffect(() => {
    if (!id) return undefined;
    const urls = buildInterviewWsUrl(id);
    let triedFallback = false;
    let localClosed = false;
    let socket = null;
    let reconnectTimer = null;

    const openSocket = (url) => {
      socket = new WebSocket(url);

      socket.onopen = () => {
        if (localClosed) {
          try {
            socket.close();
          } catch {
            // ignore
          }
          return;
        }
        triedFallback = false;
      };

      socket.onerror = () => {
        // browser handles handshake/runtime logging
      };

      socket.onclose = () => {
        if (localClosed) return;
        if (!triedFallback) {
          triedFallback = true;
          openSocket(urls[1]);
          return;
        }
        reconnectTimer = setTimeout(() => {
          if (localClosed) return;
          triedFallback = false;
          openSocket(urls[0]);
        }, 1500);
      };

      socket.onmessage = (event) => {
        let payload = null;
        try {
          payload = JSON.parse(String(event.data || "{}"));
        } catch {
          return;
        }
        if (!payload?.event) return;

        if (payload.event === "admin_monitor_answer") {
          const from = String(payload?.data?.from || "").toLowerCase();
          const answer = payload?.data?.answer || null;
          if (!["company", "student"].includes(from) || !answer?.sdp) return;
          void applyMonitorAnswer(from, answer);
          updateMonitorSnapshot(from, (currentTarget) => ({
            ...currentTarget,
            sessionId: payload?.data?.sessionId || currentTarget?.sessionId || "",
            answer,
          }));
          return;
        }

        if (payload.event === "admin_monitor_candidate") {
          const from = String(payload?.data?.from || "").toLowerCase();
          const candidate = payload?.data?.candidate || null;
          if (!["company", "student"].includes(from) || !candidate?.candidate) return;
          void applyMonitorCandidate(from, candidate);
          updateMonitorSnapshot(from, (currentTarget) => {
            const key = from === "company" ? "companyCandidates" : "studentCandidates";
            const list = Array.isArray(currentTarget?.[key]) ? currentTarget[key] : [];
            return {
              ...currentTarget,
              [key]: [...list, candidate].slice(-150),
            };
          });
        }
      };
    };

    openSocket(urls[0]);

    return () => {
      localClosed = true;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      try {
        if (socket && socket.readyState === WebSocket.OPEN) socket.close();
      } catch {
        // ignore
      }
    };
  }, [applyMonitorAnswer, applyMonitorCandidate, id, updateMonitorSnapshot]);

  useEffect(() => () => {
    disconnectMonitor("company");
    disconnectMonitor("student");
  }, [disconnectMonitor]);

  const endNow = async () => {
    try {
      const res = await adminEndInterview(id, { decision });
      setItem(res?.interview || item);
      setMsg("Interview moved to review");
    } catch (e) {
      setMsg(e?.response?.data?.message || "Unable to end interview");
    }
  };

  const reconnectMonitors = async () => {
    disconnectMonitor("company");
    disconnectMonitor("student");
    await Promise.allSettled([connectMonitor("company"), connectMonitor("student")]);
  };

  const liveCount = useMemo(
    () => ["company", "student"].filter((targetRole) => monitorStatus[targetRole] === "live").length,
    [monitorStatus],
  );

  if (loading) {
    return <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-600">Loading workspace...</div>;
  }

  if (!item) {
    return <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">Interview not found.</div>;
  }

  return (
    <div className="space-y-4 pb-10">
      <header className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#0F172A]">Admin Interview Workspace</h1>
            <p className="mt-1 text-sm text-slate-500">
              {item.companyName} - {item.studentName} - {item.jobTitle}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <MonitorPill label="Status" value={item.status} />
              <MonitorPill label="Round" value={item.currentRound || item.stage} />
              <MonitorPill label="Session" value={item.sessionId || "-"} />
              <MonitorPill label="Feeds Live" value={`${liveCount}/2`} tone={liveCount ? "emerald" : "amber"} />
            </div>
          </div>

          <button
            type="button"
            onClick={reconnectMonitors}
            className="inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm font-semibold text-[#2563EB]"
          >
            <FiRefreshCw />
            Reconnect Feeds
          </button>
        </div>
      </header>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <MonitorVideoCard
              label={`${item.companyName || "Company"} Camera`}
              videoRef={companyVideoRef}
              isLive={monitorStatus.company === "live"}
              note="Waiting for the company to join the live interview."
            />
            <MonitorVideoCard
              label={`${item.studentName || "Student"} Camera`}
              videoRef={studentVideoRef}
              isLive={monitorStatus.student === "live"}
              note="Waiting for the student to join the live interview."
            />
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="text-sm font-semibold text-[#0F172A]">Monitor Status</h2>
            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Company Feed</p>
                <p className="mt-2 text-sm font-semibold text-slate-800 capitalize">{monitorStatus.company}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Student Feed</p>
                <p className="mt-2 text-sm font-semibold text-slate-800 capitalize">{monitorStatus.student}</p>
              </div>
            </div>
          </div>
        </div>

        <aside className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
            <p className="font-semibold text-[#0F172A]">
              <FiShield className="mr-1 inline" />
              Proctoring
            </p>
            <p className="mt-2">Risk: {item.proctoring?.riskLevel || "Low"}</p>
            <p>Alerts: {item.proctoring?.alerts?.length || 0}</p>
          </div>

          <select
            value={decision}
            onChange={(event) => setDecision(event.target.value)}
            className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm"
          >
            <option value="">Set Decision</option>
            <option value="Strong Hire">Strong Hire</option>
            <option value="Hire">Hire</option>
            <option value="Hold">Hold</option>
            <option value="Reject">Reject</option>
          </select>

          <button
            type="button"
            onClick={endNow}
            className="w-full rounded-xl bg-red-600 px-4 py-3 text-sm font-semibold text-white"
          >
            End Interview
          </button>
          <button
            type="button"
            onClick={() => nav("/admin/interviews")}
            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700"
          >
            Back to Interviews
          </button>
        </aside>
      </section>
    </div>
  );
}
