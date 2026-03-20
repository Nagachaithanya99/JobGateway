import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  FiActivity,
  FiMaximize,
  FiMic,
  FiMicOff,
  FiMessageSquare,
  FiMonitor,
  FiPhoneOff,
  FiPlayCircle,
  FiSave,
  FiSend,
  FiShield,
  FiVideo,
} from "react-icons/fi";
import {
  admitCompanyCandidate,
  companyInterviewChat,
  companyInterviewCode,
  companyInterviewQuestion,
  companyInterviewQuestionDraft,
  companyInterviewScreenShare,
  companyInterviewWebrtcCandidate,
  companyInterviewWebrtcOffer,
  companyRunInterviewCode,
  endCompanyInterview,
  endCompanyInterviewRound,
  getCompanyInterviewWorkspace,
} from "../../services/interviewsService.js";
import {
  optimizeSpeechStream,
  optimizeVideoStream,
  SPEECH_AUDIO_CONSTRAINTS,
  ULTRA_HD_VIDEO_CONSTRAINTS,
} from "../../utils/media.js";
import useVirtualBackground from "../../hooks/useVirtualBackground.js";
import VirtualBackgroundPicker from "../../components/interview/VirtualBackgroundPicker.jsx";

const ICE_CONFIG = {
  iceServers: [{ urls: ["stun:stun.l.google.com:19302", "stun:stun1.l.google.com:19302"] }],
};

function candidateKey(c) {
  const rawIdx = Number(c?.sdpMLineIndex);
  const idx = Number.isFinite(rawIdx) ? String(rawIdx) : "null";
  return `${String(c?.candidate || "")}|${String(c?.sdpMid || "")}|${idx}`;
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
  const apiBase = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";
  const u = new URL(apiBase);
  const wsProtocol = u.protocol === "https:" ? "wss:" : "ws:";
  const q = `interviewId=${encodeURIComponent(String(interviewId || ""))}&role=company`;
  return [
    `${wsProtocol}//${u.host}/ws/interviews?${q}`,
    `${wsProtocol}//${u.host}/api/ws/interviews?${q}`,
  ];
}

function Pill({ label, value }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="text-sm font-bold text-[#0F172A]">{value}</p>
    </div>
  );
}

export default function InterviewWorkspace() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const nav = useNavigate();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [note, setNote] = useState("");
  const [msg, setMsg] = useState("");
  const [decision, setDecision] = useState("");
  const [cameraOn, setCameraOn] = useState(false);
  const [micOn, setMicOn] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [cameraErr, setCameraErr] = useState("");
  const [remoteReady, setRemoteReady] = useState(false);
  const [remoteScreenReady, setRemoteScreenReady] = useState(false);
  const [focusLocal, setFocusLocal] = useState(false);
  const [joined, setJoined] = useState(false);
  const [activeTool, setActiveTool] = useState("chat");
  const [chatText, setChatText] = useState("");
  const [questionText, setQuestionText] = useState("");
  const [codeInput, setCodeInput] = useState("");
  const [codeNote, setCodeNote] = useState("");
  const [codeDirty, setCodeDirty] = useState(false);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const remoteScreenVideoRef = useRef(null);
  const videoShellRef = useRef(null);
  const streamRef = useRef(null);
  const remoteStreamRef = useRef(null);
  const remoteScreenStreamRef = useRef(null);
  const peerRef = useRef(null);
  const socketRef = useRef(null);
  const appliedStudentCandidatesRef = useRef(new Set());
  const pendingStudentCandidatesRef = useRef([]);
  const appliedAnswerSdpRef = useRef("");
  const suppressQuestionDraftSyncRef = useRef(false);
  const suppressCodeSyncRef = useRef(false);
  const {
    backgroundOptions,
    bindStream: bindVirtualBackgroundStream,
    bindVideoSender,
    getOutgoingVideoTrack,
    reset: resetVirtualBackground,
    selectedBackground,
    setSelectedBackground,
    syncVideoEnabled,
  } = useVirtualBackground(localVideoRef);
  const [scorecard, setScorecard] = useState({
    technicalKnowledge: 0,
    problemSolving: 0,
    communication: 0,
    confidence: 0,
    cultureFit: 0,
    overall: 0,
  });

  const load = useCallback(async () => {
    try {
      const res = await getCompanyInterviewWorkspace(id);
      const next = res?.interview || null;
      setItem(next);
      if (next?.collaboration?.code && !codeDirty) {
        suppressCodeSyncRef.current = true;
        setCodeInput(String(next.collaboration.code.content || ""));
        setCodeNote(String(next.collaboration.code.note || ""));
      }
    } catch (e) {
      setMsg(e?.response?.data?.message || "Failed to load workspace");
    } finally {
      setLoading(false);
    }
  }, [id, codeDirty]);

  useEffect(() => {
    load();
    const timer = setInterval(load, 1500);
    return () => clearInterval(timer);
  }, [load]);

  const applyStudentCandidate = useCallback(async (candidateLike) => {
    const pc = peerRef.current;
    if (!pc || !candidateLike?.candidate) return;
    const key = candidateKey(candidateLike);
    if (appliedStudentCandidatesRef.current.has(key)) return;

    if (!pc.remoteDescription) {
      if (!pendingStudentCandidatesRef.current.find((c) => candidateKey(c) === key)) {
        pendingStudentCandidatesRef.current.push(candidateLike);
      }
      return;
    }

    try {
      const init = buildIceCandidateInit(candidateLike);
      await pc.addIceCandidate(new RTCIceCandidate(init));
      appliedStudentCandidatesRef.current.add(key);
    } catch {
      // keep candidate for next retry
      if (!pendingStudentCandidatesRef.current.find((c) => candidateKey(c) === key)) {
        pendingStudentCandidatesRef.current.push(candidateLike);
      }
    }
  }, []);

  const applyRemoteAnswer = useCallback(async (answerLike) => {
    const pc = peerRef.current;
    if (!pc) return;
    const answerSdp = normalizeRemoteSdp(answerLike?.sdp);
    if (!answerSdp || !/^v=0(?:\r?\n|$)/.test(answerSdp)) return;
    if (appliedAnswerSdpRef.current === answerSdp) return;
    if (!pc.localDescription) return;

    try {
      await pc.setRemoteDescription(new RTCSessionDescription({ type: answerLike?.type || "answer", sdp: answerSdp }));
      appliedAnswerSdpRef.current = answerSdp;
      const pending = [...pendingStudentCandidatesRef.current];
      pendingStudentCandidatesRef.current = [];
      for (const c of pending) {
        await applyStudentCandidate(c);
      }
    } catch (e) {
      console.debug("company setRemoteDescription retry:", e?.message || e);
    }
  }, [applyStudentCandidate]);

  useEffect(() => {
    if (!id) return undefined;
    const urls = buildInterviewWsUrl(id);
    let triedFallback = false;
    let localClosed = false;
    let ws = null;
    let reconnectTimer = null;

    const openSocket = (url) => {
      ws = new WebSocket(url);
      socketRef.current = ws;

      ws.onopen = () => {
        if (localClosed) {
          try {
            ws.close();
          } catch {
            // ignore
          }
          return;
        }
        triedFallback = false;
      };

      ws.onerror = () => {
        // browser already reports handshake/runtime errors
      };

      ws.onclose = () => {
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

      ws.onmessage = (evt) => {
        let payload = null;
        try {
          payload = JSON.parse(String(evt.data || "{}"));
        } catch {
          return;
        }
        if (!payload?.event) return;
        if (payload.event === "webrtc_answer") {
          const answer = payload?.data?.answer || null;
          if (!answer?.sdp) return;
          applyRemoteAnswer(answer);
          setItem((prev) => {
            if (!prev) return prev;
            return {
              ...prev,
              collaboration: {
                ...(prev.collaboration || {}),
                webrtc: {
                  ...((prev.collaboration || {}).webrtc || {}),
                  answer,
                },
              },
            };
          });
        } else if (payload.event === "webrtc_candidate" && payload?.data?.from === "student") {
          const candidate = payload?.data?.candidate;
          if (!candidate?.candidate) return;
          applyStudentCandidate(candidate);
          setItem((prev) => {
            if (!prev) return prev;
            const rtc = ((prev.collaboration || {}).webrtc || {});
            const list = Array.isArray(rtc.studentCandidates) ? rtc.studentCandidates : [];
            return {
              ...prev,
              collaboration: {
                ...(prev.collaboration || {}),
                webrtc: {
                  ...rtc,
                  studentCandidates: [...list, candidate].slice(-150),
                },
              },
            };
          });
        } else if (payload.event === "collab_chat") {
          const row = payload?.data || null;
          if (!row?.text) return;
          setItem((prev) => {
            if (!prev) return prev;
            const chat = Array.isArray(prev?.collaboration?.chat) ? prev.collaboration.chat : [];
            return {
              ...prev,
              collaboration: {
                ...(prev.collaboration || {}),
                chat: [...chat, row].slice(-300),
              },
            };
          });
        } else if (payload.event === "collab_question") {
          const row = payload?.data || null;
          if (!row?.text) return;
          setItem((prev) => {
            if (!prev) return prev;
            const questions = Array.isArray(prev?.collaboration?.questions) ? prev.collaboration.questions : [];
            return {
              ...prev,
              collaboration: {
                ...(prev.collaboration || {}),
                questions: [...questions, row].slice(-300),
                liveQuestionDraft: { text: "", by: row?.senderRole || "student", updatedAt: row?.createdAt || new Date().toISOString() },
              },
            };
          });
        } else if (payload.event === "collab_question_draft") {
          const draft = payload?.data || null;
          suppressQuestionDraftSyncRef.current = true;
          setQuestionText(String(draft?.text || ""));
          setItem((prev) => {
            if (!prev) return prev;
            return {
              ...prev,
              collaboration: {
                ...(prev.collaboration || {}),
                liveQuestionDraft: {
                  text: String(draft?.text || ""),
                  by: String(draft?.by || "student"),
                  updatedAt: draft?.updatedAt || new Date().toISOString(),
                },
              },
            };
          });
        } else if (payload.event === "collab_code") {
          const code = payload?.data || null;
          suppressCodeSyncRef.current = true;
          setCodeInput(String(code?.content || ""));
          setCodeNote(String(code?.note || ""));
          setCodeDirty(false);
          setItem((prev) => {
            if (!prev) return prev;
            return {
              ...prev,
              collaboration: {
                ...(prev.collaboration || {}),
                code: {
                  ...((prev.collaboration || {}).code || {}),
                  language: String(code?.language || "javascript"),
                  content: String(code?.content || ""),
                  note: String(code?.note || ""),
                  lastUpdatedBy: String(code?.lastUpdatedBy || "student"),
                  updatedAt: code?.updatedAt || new Date().toISOString(),
                },
              },
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
        if (ws && ws.readyState === WebSocket.OPEN) ws.close();
      } catch {
        // ignore
      }
      if (socketRef.current === ws) {
        socketRef.current = null;
      }
    };
  }, [id, applyRemoteAnswer, applyStudentCandidate]);

  useEffect(() => {
    if (!id) return undefined;
    if (suppressQuestionDraftSyncRef.current) {
      suppressQuestionDraftSyncRef.current = false;
      return undefined;
    }
    const timer = setTimeout(() => {
      companyInterviewQuestionDraft(id, questionText).catch(() => {});
      setItem((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          collaboration: {
            ...(prev.collaboration || {}),
            liveQuestionDraft: {
              text: String(questionText || ""),
              by: "company",
              updatedAt: new Date().toISOString(),
            },
          },
        };
      });
    }, 350);
    return () => clearTimeout(timer);
  }, [id, questionText]);

  useEffect(() => {
    if (!id) return undefined;
    if (suppressCodeSyncRef.current) {
      suppressCodeSyncRef.current = false;
      return undefined;
    }
    const timer = setTimeout(() => {
      companyInterviewCode(id, { language: "javascript", content: codeInput, note: codeNote }).catch(() => {});
    }, 500);
    return () => clearTimeout(timer);
  }, [id, codeInput, codeNote]);

  const ensureLocalMedia = useCallback(async () => {
    try {
      setCameraErr("");
      if (streamRef.current) return streamRef.current;
      const stream = await navigator.mediaDevices.getUserMedia({
        video: ULTRA_HD_VIDEO_CONSTRAINTS,
        audio: SPEECH_AUDIO_CONSTRAINTS,
      });
      await optimizeVideoStream(stream);
      await optimizeSpeechStream(stream);
      streamRef.current = stream;
      await bindVirtualBackgroundStream(stream);
      setCameraOn(Boolean(stream.getVideoTracks()?.[0]?.enabled));
      setMicOn(Boolean(stream.getAudioTracks()?.[0]?.enabled));
      return stream;
    } catch (e) {
      setCameraErr(e?.message || "Unable to access camera/microphone");
      throw e;
    }
  }, [bindVirtualBackgroundStream]);

  const leaveMeeting = useCallback(() => {
    if (peerRef.current) {
      peerRef.current.ontrack = null;
      peerRef.current.onicecandidate = null;
      peerRef.current.close();
      peerRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (remoteStreamRef.current) {
      remoteStreamRef.current.getTracks().forEach((t) => t.stop());
      remoteStreamRef.current = null;
    }
    if (remoteScreenStreamRef.current) {
      remoteScreenStreamRef.current.getTracks().forEach((t) => t.stop());
      remoteScreenStreamRef.current = null;
    }
    resetVirtualBackground();
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
    if (remoteScreenVideoRef.current) remoteScreenVideoRef.current.srcObject = null;
    appliedStudentCandidatesRef.current = new Set();
    appliedAnswerSdpRef.current = "";
    setCameraOn(false);
    setMicOn(false);
    setSharing(false);
    setRemoteReady(false);
    setRemoteScreenReady(false);
    setJoined(false);
  }, [resetVirtualBackground]);

  const joinMeeting = useCallback(async () => {
    try {
      if (peerRef.current) return;
      const localStream = await ensureLocalMedia();
      const pc = new RTCPeerConnection(ICE_CONFIG);
      peerRef.current = pc;

      const audioTracks = localStream.getAudioTracks();
      const outgoingVideoTrack = await getOutgoingVideoTrack(localStream);
      const outgoingStream = new MediaStream([...audioTracks, ...(outgoingVideoTrack ? [outgoingVideoTrack] : [])]);

      audioTracks.forEach((track) => pc.addTrack(track, outgoingStream));
      if (outgoingVideoTrack) {
        const videoSender = pc.addTrack(outgoingVideoTrack, outgoingStream);
        await bindVideoSender(videoSender);
      }
      pc.addTransceiver("video", { direction: "recvonly" });

      pc.ontrack = (event) => {
        const track = event.track;
        const isVideo = track?.kind === "video";
        const hasCameraTrack = Boolean(remoteStreamRef.current?.getVideoTracks().length);
        const shouldUseScreenStream = isVideo && hasCameraTrack;
        const targetRef = shouldUseScreenStream ? remoteScreenStreamRef : remoteStreamRef;
        if (!targetRef.current) targetRef.current = new MediaStream();

        if (track && !targetRef.current.getTracks().find((t) => t.id === track.id)) {
          targetRef.current.addTrack(track);
        }

        if (shouldUseScreenStream) {
          if (remoteScreenVideoRef.current) {
            remoteScreenVideoRef.current.srcObject = remoteScreenStreamRef.current;
            remoteScreenVideoRef.current.play?.().catch(() => {});
          }
        } else if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = remoteStreamRef.current;
          remoteVideoRef.current.play?.().catch(() => {});
        }

        const hasCameraVideo = Boolean(remoteStreamRef.current?.getVideoTracks().length);
        const hasScreenVideo = Boolean(remoteScreenStreamRef.current?.getVideoTracks().length);
        setRemoteReady(hasCameraVideo || hasScreenVideo);
        setRemoteScreenReady(hasScreenVideo);

        if (track) {
          track.onended = () => {
            try {
              remoteStreamRef.current?.removeTrack(track);
              remoteScreenStreamRef.current?.removeTrack(track);
            } catch {
              // ignore
            }
            const cameraActive = Boolean(remoteStreamRef.current?.getVideoTracks().length);
            const screenActive = Boolean(remoteScreenStreamRef.current?.getVideoTracks().length);
            setRemoteReady(cameraActive || screenActive);
            setRemoteScreenReady(screenActive);
          };
        }
      };

      pc.onicecandidate = async (event) => {
        if (!event.candidate) return;
        try {
          await companyInterviewWebrtcCandidate(id, event.candidate.toJSON());
        } catch {
          // ignore intermittent signaling writes
        }
      };

      pc.onconnectionstatechange = () => {
        const st = pc.connectionState;
        if (st === "connected") setMsg("Meeting connected");
        if (["disconnected", "failed", "closed"].includes(st)) {
          setRemoteReady(false);
          setRemoteScreenReady(false);
        }
      };

      const offer = await pc.createOffer({ offerToReceiveAudio: true, offerToReceiveVideo: true });
      await pc.setLocalDescription(offer);
      await companyInterviewWebrtcOffer(id, { type: offer.type, sdp: offer.sdp });
      setJoined(true);
      setMsg("Waiting for candidate to connect...");
    } catch (e) {
      setMsg(e?.response?.data?.message || e?.message || "Unable to join meeting");
    }
  }, [bindVideoSender, ensureLocalMedia, getOutgoingVideoTrack, id]);

  useEffect(() => () => leaveMeeting(), [leaveMeeting]);

  useEffect(() => {
    if (!remoteVideoRef.current || !remoteStreamRef.current) return;
    if (remoteVideoRef.current.srcObject !== remoteStreamRef.current) {
      remoteVideoRef.current.srcObject = remoteStreamRef.current;
    }
    remoteVideoRef.current.play?.().catch(() => {});
  }, [remoteReady]);

  useEffect(() => {
    if (!remoteScreenVideoRef.current || !remoteScreenStreamRef.current) return;
    if (remoteScreenVideoRef.current.srcObject !== remoteScreenStreamRef.current) {
      remoteScreenVideoRef.current.srcObject = remoteScreenStreamRef.current;
    }
    remoteScreenVideoRef.current.play?.().catch(() => {});
  }, [remoteScreenReady]);

  useEffect(() => {
    if (!item || !peerRef.current) return;
    const rtc = item?.collaboration?.webrtc || {};
    const answer = rtc?.answer;
    const studentCandidates = Array.isArray(rtc?.studentCandidates) ? rtc.studentCandidates : [];

    const applyRemote = async () => {
      try {
        await applyRemoteAnswer(answer);
        for (const c of studentCandidates) {
          if (!c?.candidate) continue;
          await applyStudentCandidate(c);
        }
      } catch (e) {
        console.debug("company signaling retry:", e?.message || e);
      }
    };

    applyRemote();
  }, [item, applyRemoteAnswer, applyStudentCandidate]);

  useEffect(() => {
    if (!item) return;
    if (searchParams.get("autocam") === "1") joinMeeting();
  }, [item, searchParams, joinMeeting]);

  useEffect(() => {
    const active = Boolean(item?.collaboration?.screenShare?.active && item?.collaboration?.screenShare?.by === "company");
    setSharing(active);
  }, [item]);

  const admit = async () => {
    try {
      const res = await admitCompanyCandidate(id);
      setItem(res?.interview || item);
      setMsg("Candidate admitted. Interview is live.");
    } catch (e) {
      setMsg(e?.response?.data?.message || "Unable to admit candidate");
    }
  };

  const endRound = async () => {
    try {
      const res = await endCompanyInterviewRound(id, { scorecard, summary: note, moveToNextRound: false });
      setItem(res?.interview || item);
      setMsg("Round data saved");
    } catch (e) {
      setMsg(e?.response?.data?.message || "Unable to end round");
    }
  };

  const endInterviewNow = async () => {
    try {
      const res = await endCompanyInterview(id, { decision, scorecard, notes: note });
      setItem(res?.interview || item);
      setMsg("Interview ended and moved to review");
      leaveMeeting();
    } catch (e) {
      setMsg(e?.response?.data?.message || "Unable to end interview");
    }
  };

  const toggleCamera = async () => {
    try {
      const stream = await ensureLocalMedia();
      const track = stream.getVideoTracks()[0];
      if (!track) return;
      track.enabled = !track.enabled;
      syncVideoEnabled(track.enabled);
      setCameraOn(track.enabled);
    } catch {
      // handled in ensureLocalMedia
    }
  };

  const toggleMic = async () => {
    try {
      const stream = await ensureLocalMedia();
      const track = stream.getAudioTracks()[0];
      if (!track) return;
      track.enabled = !track.enabled;
      setMicOn(track.enabled);
    } catch {
      // handled in ensureLocalMedia
    }
  };

  const toggleScreenShare = async () => {
    try {
      const next = !sharing;
      await companyInterviewScreenShare(id, next);
      setSharing(next);
    } catch {
      setMsg("Unable to update screen share");
    }
  };

  const toggleFullscreen = async () => {
    try {
      const el = videoShellRef.current;
      if (!el) return;
      if (!document.fullscreenElement) {
        await el.requestFullscreen?.();
      } else {
        await document.exitFullscreen?.();
      }
    } catch {
      // ignore fullscreen errors
    }
  };

  const sendChat = async () => {
    if (!chatText.trim()) return;
    try {
      const res = await companyInterviewChat(id, chatText.trim());
      setItem(res?.interview || item);
      setChatText("");
    } catch (e) {
      setMsg(e?.response?.data?.message || "Unable to send message");
    }
  };

  const sendQuestion = async () => {
    if (!questionText.trim()) return;
    try {
      const res = await companyInterviewQuestion(id, questionText.trim());
      setItem(res?.interview || item);
      setQuestionText("");
    } catch (e) {
      setMsg(e?.response?.data?.message || "Unable to send question");
    }
  };

  const saveCode = async () => {
    try {
      const res = await companyInterviewCode(id, { language: "javascript", content: codeInput, note: codeNote });
      setItem(res?.interview || item);
      setCodeDirty(false);
      setMsg("Code synced to student");
    } catch (e) {
      setMsg(e?.response?.data?.message || "Unable to sync code");
    }
  };

  const runCode = async () => {
    try {
      await companyInterviewCode(id, { language: "javascript", content: codeInput, note: codeNote });
      setCodeDirty(false);
      const res = await companyRunInterviewCode(id);
      setItem(res?.interview || item);
    } catch (e) {
      setMsg(e?.response?.data?.message || "Unable to run code");
    }
  };

  const chatRows = useMemo(() => item?.collaboration?.chat || [], [item]);
  const questionRows = useMemo(() => item?.collaboration?.questions || [], [item]);
  const codeState = item?.collaboration?.code || {};
  const liveQuestionText = String(item?.collaboration?.liveQuestionDraft?.text || "").trim()
    || String(questionRows[questionRows.length - 1]?.text || "").trim();
  const liveCodePreview = String(codeInput || codeState?.content || "")
    .split("\n")
    .slice(0, 2)
    .join("\n")
    .trim();
  const screenAsMain = remoteScreenReady;

  if (loading) return <div className="rounded-xl border border-slate-200 bg-white p-5 text-sm text-slate-600">Loading workspace...</div>;
  if (!item) return <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">Interview not found.</div>;

  return (
    <div className="space-y-4 pb-12">
      <header className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-[#0F172A]">Interview Workspace</h1>
            <p className="text-sm text-slate-500">{item.candidate} - {item.job}</p>
          </div>
          <div className="flex gap-2">
            <button onClick={endRound} className="rounded-lg border border-blue-200 px-3 py-2 text-sm font-semibold text-[#2563EB]">End Round</button>
            <button onClick={endInterviewNow} className="rounded-lg bg-red-600 px-3 py-2 text-sm font-semibold text-white">End Interview</button>
            <button onClick={() => nav("/company/interviews")} className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700">Back to Hub</button>
          </div>
        </div>
      </header>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-[280px_minmax(0,1fr)_360px]">
        <aside className="space-y-3 rounded-xl border border-slate-200 bg-white p-3">
          <Pill label="Status" value={item.status} />
          <Pill label="Round" value={item.currentRound || item.stage} />
          <Pill label="Timer" value={`${item.duration || "30 mins"}`} />
          <Pill label="Candidate Online" value={item.candidateReadiness?.online ? "Yes" : "No"} />
          <Pill label="Camera Ready" value={item.candidateReadiness?.cameraReady ? "Yes" : "No"} />
          <Pill label="Mic Ready" value={item.candidateReadiness?.microphoneReady ? "Yes" : "No"} />
          <Pill label="Student Screen Share" value={item?.collaboration?.screenShare?.active && item?.collaboration?.screenShare?.by === "student" ? "Active" : "Not Active"} />
          <button disabled={item.status === "Live"} onClick={admit} className="w-full rounded-lg border border-green-200 px-3 py-2 text-sm font-semibold text-green-700 disabled:opacity-50">
            Admit Candidate
          </button>
        </aside>

        <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-3">
          <div className="grid grid-cols-2 gap-2">
            <Pill label="Interview Date" value={`${item.date} ${item.time}`} />
            <Pill label="Recording" value={item.status === "Live" ? "Active" : "Standby"} />
          </div>

          <div ref={videoShellRef} className="relative h-[420px] overflow-hidden rounded-xl border border-slate-300 bg-black">
            <VirtualBackgroundPicker
              options={backgroundOptions}
              value={selectedBackground}
              onChange={setSelectedBackground}
            />
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              onClick={() => focusLocal && setFocusLocal(false)}
              className={screenAsMain
                ? "absolute bottom-3 left-3 z-20 h-28 w-40 cursor-pointer rounded-lg border border-white/20 bg-slate-700 object-cover"
                : focusLocal
                ? "absolute bottom-3 right-3 z-20 h-28 w-40 cursor-pointer rounded-lg border border-white/20 bg-slate-700 object-cover"
                : "h-full w-full object-cover"}
            />
            {!remoteReady && !focusLocal ? (
              <div className="pointer-events-none absolute inset-0 grid place-items-center bg-black/70 text-slate-200">
                <div className="text-center">
                  <FiVideo className="mx-auto text-3xl" />
                  <p className="mt-2 text-sm font-semibold">Waiting for candidate video...</p>
                </div>
              </div>
            ) : null}
            {remoteScreenReady ? (
              <div className={screenAsMain && !focusLocal ? "absolute inset-0 z-5" : "hidden"}>
                <video
                  ref={remoteScreenVideoRef}
                  autoPlay
                  playsInline
                  className="h-full w-full bg-slate-900 object-cover"
                />
                <p className="absolute left-3 top-12 z-20 rounded bg-black/50 px-2 py-0.5 text-[10px] font-semibold text-emerald-200">Candidate Screen Share</p>
              </div>
            ) : null}
            <video
              ref={localVideoRef}
              autoPlay
              muted
              playsInline
              onClick={() => !focusLocal && setFocusLocal(true)}
              className={focusLocal
                ? "absolute inset-0 z-10 h-full w-full object-cover"
                : "absolute bottom-3 right-3 z-20 h-28 w-40 cursor-pointer rounded-lg border border-white/20 bg-slate-700 object-cover"}
            />
            <button
              onClick={() => setFocusLocal((v) => !v)}
              className="absolute left-3 top-3 z-30 rounded-md bg-black/50 px-2 py-1 text-[11px] font-semibold text-white"
            >
              {focusLocal ? (screenAsMain ? "Show Screen Large" : "Show Candidate Large") : "Show My Video Large"}
            </button>
            <div className="absolute bottom-3 left-3 z-30 max-w-[70%] rounded-md bg-black/50 px-2 py-1 text-[11px] text-white">
              {liveQuestionText ? <p className="truncate"><b>Q:</b> {liveQuestionText}</p> : null}
              {liveCodePreview ? <p className="mt-1 truncate"><b>Code:</b> {liveCodePreview}</p> : null}
            </div>
            <div className="absolute bottom-3 left-1/2 z-30 flex -translate-x-1/2 items-center gap-2 rounded-full bg-black/55 px-3 py-2 text-white">
              <button onClick={toggleMic} className={`grid h-9 w-9 place-items-center rounded-full ${micOn ? "bg-slate-700" : "bg-red-600"}`} title={micOn ? "Mute microphone" : "Unmute microphone"}>
                {micOn ? <FiMic /> : <FiMicOff />}
              </button>
              <button onClick={toggleCamera} className={`grid h-9 w-9 place-items-center rounded-full ${cameraOn ? "bg-slate-700" : "bg-red-600"}`} title={cameraOn ? "Turn off camera" : "Turn on camera"}>
                <FiVideo />
              </button>
              <button onClick={toggleScreenShare} className={`grid h-9 w-9 place-items-center rounded-full ${sharing ? "bg-green-600" : "bg-slate-700"}`} title={sharing ? "Stop screen share" : "Share screen"}>
                <FiMonitor />
              </button>
              <button onClick={joined ? leaveMeeting : joinMeeting} className="grid h-9 w-9 place-items-center rounded-full bg-red-600" title={joined ? "Leave meeting" : "Join meeting"}>
                <FiPhoneOff />
              </button>
              <button onClick={toggleFullscreen} className="grid h-9 w-9 place-items-center rounded-full bg-slate-700" title="Toggle fullscreen">
                <FiMaximize />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-2 rounded-xl border border-slate-200 bg-white p-2 md:grid-cols-[190px_minmax(0,1fr)]">
            <div className="space-y-2">
              <button onClick={joined ? leaveMeeting : joinMeeting} className="w-full rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-semibold text-[#2563EB]">
                {joined ? "Leave Meeting" : "Join Meeting"}
              </button>
              <button onClick={toggleCamera} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700">
                {cameraOn ? "Stop Camera" : "Start Camera"}
              </button>
              <p className="text-[11px] text-slate-500">Room ID: {item.roomId || "-"}</p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-2">
              <p className="text-xs text-slate-600">Click the small preview or toggle button on video to swap large view.</p>
              {cameraErr ? <p className="mt-1 text-xs text-red-600">{cameraErr}</p> : null}
            </div>
          </div>
        </div>

        <aside className="space-y-3 rounded-xl border border-slate-200 bg-white p-3">
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
            <p className="text-sm font-bold text-[#0F172A]">AI Live</p>
            <p className="mt-1 text-xs text-slate-600">Transcript, live summary, bookmarks are available during the interview.</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-3">
            <div className="grid grid-cols-3 gap-2">
              <button onClick={() => setActiveTool("chat")} className={`rounded-lg border px-2 py-2 text-xs font-semibold ${activeTool === "chat" ? "border-blue-200 bg-blue-50 text-[#2563EB]" : "border-slate-200 text-slate-700"}`}><FiMessageSquare className="mr-1 inline" />Chat</button>
              <button onClick={() => setActiveTool("questions")} className={`rounded-lg border px-2 py-2 text-xs font-semibold ${activeTool === "questions" ? "border-blue-200 bg-blue-50 text-[#2563EB]" : "border-slate-200 text-slate-700"}`}><FiPlayCircle className="mr-1 inline" />Questions</button>
              <button onClick={() => setActiveTool("coding")} className={`rounded-lg border px-2 py-2 text-xs font-semibold ${activeTool === "coding" ? "border-blue-200 bg-blue-50 text-[#2563EB]" : "border-slate-200 text-slate-700"}`}><FiActivity className="mr-1 inline" />Coding</button>
            </div>

            {activeTool === "chat" ? (
              <div className="mt-3">
                <div className="max-h-40 space-y-1 overflow-auto rounded-lg border border-slate-200 bg-slate-50 p-2 text-xs">
                  {chatRows.map((x, i) => <p key={`${i}_${x.createdAt || ""}`}><b>{x.senderRole}:</b> {x.text}</p>)}
                  {!chatRows.length ? <p className="text-slate-500">No chat yet.</p> : null}
                </div>
                <div className="mt-2 flex gap-2">
                  <input
                    value={chatText}
                    onChange={(e) => setChatText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        sendChat();
                      }
                    }}
                    className="h-9 flex-1 rounded-lg border border-slate-200 px-2 text-sm"
                    placeholder="Type message..."
                  />
                  <button onClick={sendChat} className="rounded-lg border border-blue-200 px-3 text-xs font-semibold text-[#2563EB]"><FiSend /></button>
                </div>
              </div>
            ) : null}

            {activeTool === "questions" ? (
              <div className="mt-3">
                <div className="max-h-40 space-y-1 overflow-auto rounded-lg border border-slate-200 bg-slate-50 p-2 text-xs">
                  {questionRows.map((x, i) => <p key={`${i}_${x.createdAt || ""}`}><b>{x.senderRole}:</b> {x.text}</p>)}
                  {!questionRows.length ? <p className="text-slate-500">No questions yet.</p> : null}
                </div>
                <div className="mt-2 flex gap-2">
                  <input
                    value={questionText}
                    onChange={(e) => setQuestionText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        sendQuestion();
                      }
                    }}
                    className="h-9 flex-1 rounded-lg border border-slate-200 px-2 text-sm"
                    placeholder="Type question..."
                  />
                  <button onClick={sendQuestion} className="rounded-lg border border-blue-200 px-3 text-xs font-semibold text-[#2563EB]"><FiSend /></button>
                </div>
              </div>
            ) : null}

            {activeTool === "coding" ? (
              <div className="mt-3">
                <textarea value={codeInput} onChange={(e) => { setCodeInput(e.target.value); setCodeDirty(true); }} rows={8} className="w-full rounded-lg border border-slate-200 px-2 py-2 font-mono text-xs" placeholder="// Shared JavaScript code" />
                <input value={codeNote} onChange={(e) => { setCodeNote(e.target.value); setCodeDirty(true); }} className="mt-2 h-9 w-full rounded-lg border border-slate-200 px-2 text-sm" placeholder="Code note/instruction..." />
                <div className="mt-2 flex gap-2">
                  <button onClick={saveCode} className="rounded-lg border border-blue-200 px-3 py-1.5 text-xs font-semibold text-[#2563EB]">Sync</button>
                  <button onClick={runCode} className="rounded-lg border border-green-200 px-3 py-1.5 text-xs font-semibold text-green-700">Run</button>
                </div>
                <div className="mt-2 rounded-lg border border-slate-200 bg-slate-50 p-2 text-xs">
                  <p><b>Output:</b></p>
                  <pre className="whitespace-pre-wrap">{codeState.output || "-"}</pre>
                  {codeState.error ? <p className="text-red-600"><b>Error:</b> {codeState.error}</p> : null}
                </div>
              </div>
            ) : null}
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
            <p className="text-sm font-bold text-[#0F172A]"><FiShield className="mr-1 inline" />Proctoring</p>
            <p className="mt-1 text-xs text-slate-600">Risk: {item.proctoring?.riskLevel || "Low"}</p>
            <p className="text-xs text-slate-600">Alerts: {item.proctoring?.alerts?.length || 0}</p>
          </div>
          <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={4} placeholder="Round notes / summary..." className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
          <div className="grid grid-cols-2 gap-2">
            {Object.keys(scorecard).map((key) => (
              <label key={key} className="text-xs font-semibold text-slate-600">
                {key}
                <input type="number" min="0" max="10" value={scorecard[key]} onChange={(e) => setScorecard((s) => ({ ...s, [key]: Number(e.target.value || 0) }))} className="mt-1 h-9 w-full rounded-lg border border-slate-200 px-2 text-sm" />
              </label>
            ))}
          </div>
          <select value={decision} onChange={(e) => setDecision(e.target.value)} className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm">
            <option value="">Final Decision</option>
            <option value="Strong Hire">Strong Hire</option>
            <option value="Hire">Hire</option>
            <option value="Hold">Hold</option>
            <option value="Reject">Reject</option>
          </select>
          <button onClick={endRound} className="w-full rounded-lg border border-blue-200 px-3 py-2 text-sm font-semibold text-[#2563EB]"><FiSave className="mr-1 inline" />Save Round</button>
        </aside>
      </section>

      {msg ? <div className="fixed bottom-5 right-5 rounded-lg bg-[#0F172A] px-3 py-2 text-xs font-semibold text-white">{msg}</div> : null}
    </div>
  );
}
