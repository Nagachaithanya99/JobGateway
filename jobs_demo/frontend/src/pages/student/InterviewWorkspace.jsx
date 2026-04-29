import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FiCode, FiMaximize, FiMic, FiMicOff, FiMonitor, FiPhoneOff, FiSend, FiVideo, FiWifi } from "react-icons/fi";
import { showSweetToast } from "../../utils/sweetAlert.js";
import {
  getStudentInterviewWorkspace,
  studentLeaveInterview,
  studentInterviewAdminMonitorAnswer,
  studentInterviewAdminMonitorCandidate,
  studentInterviewChat,
  studentInterviewCode,
  studentRunInterviewCode,
  studentInterviewQuestion,
  studentInterviewQuestionDraft,
  studentInterviewScreenShare,
  studentInterviewWebrtcAnswer,
  studentInterviewWebrtcCandidate,
} from "../../services/interviewsService.js";
import {
  optimizeSpeechStream,
  optimizeVideoSenderForInterview,
  optimizeVideoStream,
  INTERVIEW_CAMERA_VIDEO_CONSTRAINTS,
  SPEECH_AUDIO_CONSTRAINTS,
} from "../../utils/media.js";
import { getApiOrigin } from "../../utils/apiBaseUrl.js";
import useVirtualBackground from "../../hooks/useVirtualBackground.js";

const ICE_CONFIG = {
  iceServers: [{ urls: ["stun:stun.l.google.com:19302", "stun:stun1.l.google.com:19302"] }],
};

const TOOL_PANEL_POSITION_KEY = "jobgateway_student_interview_tool_panel_position";

function readToolPanelPosition() {
  try {
    const parsed = JSON.parse(localStorage.getItem(TOOL_PANEL_POSITION_KEY) || "null");
    if (Number.isFinite(parsed?.y)) {
      return {
        x: Number.isFinite(parsed?.x) ? parsed.x : null,
        y: parsed.y,
      };
    }
  } catch {
    // ignore storage failures
  }

  return { x: null, y: 56 };
}

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
  const u = new URL(getApiOrigin());
  const wsProtocol = u.protocol === "https:" ? "wss:" : "ws:";
  const q = `interviewId=${encodeURIComponent(String(interviewId || ""))}&role=student`;
  return [
    `${wsProtocol}//${u.host}/ws/interviews?${q}`,
    `${wsProtocol}//${u.host}/api/ws/interviews?${q}`,
  ];
}

export default function StudentInterviewWorkspace() {
  const { id } = useParams();
  const nav = useNavigate();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");
  const [activeTool, setActiveTool] = useState("chat");
  const [toolPanelPosition, setToolPanelPosition] = useState(readToolPanelPosition);
  const toolPanelDragRef = useRef(null);
  const [chatText, setChatText] = useState("");
  const [questionText, setQuestionText] = useState("");

  useEffect(() => {
    if (!msg) return;
    void showSweetToast(msg, "info", { timer: 1800 });
  }, [msg]);
  const [codeInput, setCodeInput] = useState("");
  const [codeNote, setCodeNote] = useState("");
  const [codeLanguage, setCodeLanguage] = useState("javascript");
  const [codeOutputView, setCodeOutputView] = useState("console");
  const [codeDirty, setCodeDirty] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [joined, setJoined] = useState(false);
  const [cameraOn, setCameraOn] = useState(false);
  const [micOn, setMicOn] = useState(false);
  const [cameraErr, setCameraErr] = useState("");
  const [remoteReady, setRemoteReady] = useState(false);
  const [focusLocal, setFocusLocal] = useState(false);
  const screenStreamRef = useRef(null);
  const localStreamRef = useRef(null);
  const remoteStreamRef = useRef(null);
  const peerRef = useRef(null);
  const adminMonitorPeerRef = useRef(null);
  const adminMonitorVideoSenderRef = useRef(null);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const videoShellRef = useRef(null);
  const socketRef = useRef(null);
  const screenSenderRef = useRef(null);
  const screenPlaceholderTrackRef = useRef(null);
  const appliedCompanyCandidatesRef = useRef(new Set());
  const pendingCompanyCandidatesRef = useRef([]);
  const appliedOfferSdpRef = useRef("");
  const appliedAdminMonitorCandidatesRef = useRef(new Set());
  const pendingAdminMonitorCandidatesRef = useRef([]);
  const appliedAdminMonitorOfferSdpRef = useRef("");
  const suppressQuestionDraftSyncRef = useRef(false);
  const suppressCodeSyncRef = useRef(false);
  const {
    bindStream: bindVirtualBackgroundStream,
    bindVideoSender,
    removeSender,
    getOutgoingVideoTrack,
    reset: resetVirtualBackground,
    syncVideoEnabled,
  } = useVirtualBackground(localVideoRef);
  const isMeetingJoined =
    joined ||
    Boolean(peerRef.current) ||
    Boolean(localStreamRef.current) ||
    remoteReady;

  useEffect(() => {
    try {
      localStorage.setItem(TOOL_PANEL_POSITION_KEY, JSON.stringify(toolPanelPosition));
    } catch {
      // ignore storage failures
    }
  }, [toolPanelPosition]);

  const startToolPanelDrag = useCallback((event) => {
    const shell = videoShellRef.current;
    if (!shell) return;
    const pointer = event.touches?.[0] || event;
    const shellRect = shell.getBoundingClientRect();
    const panelEl = event.currentTarget.closest("[data-interview-tool-panel]");
    const panelRect = panelEl?.getBoundingClientRect();
    const originX = panelRect ? panelRect.left - shellRect.left : (toolPanelPosition.x ?? 12);
    const originY = panelRect ? panelRect.top - shellRect.top : toolPanelPosition.y;

    toolPanelDragRef.current = {
      startX: pointer.clientX,
      startY: pointer.clientY,
      originX,
      originY,
    };

    const move = (moveEvent) => {
      if (!toolPanelDragRef.current) return;
      const nextPointer = moveEvent.touches?.[0] || moveEvent;
      const panelWidth = panelEl?.offsetWidth || 390;
      const panelHeight = panelEl?.offsetHeight || 150;
      const maxX = Math.max(12, shell.clientWidth - panelWidth - 12);
      const maxY = Math.max(12, shell.clientHeight - panelHeight - 12);
      const nextX = toolPanelDragRef.current.originX + (nextPointer.clientX - toolPanelDragRef.current.startX);
      const nextY = toolPanelDragRef.current.originY + (nextPointer.clientY - toolPanelDragRef.current.startY);
      setToolPanelPosition({
        x: Math.min(maxX, Math.max(12, nextX)),
        y: Math.min(maxY, Math.max(12, nextY)),
      });
    };

    const stop = () => {
      toolPanelDragRef.current = null;
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseup", stop);
      window.removeEventListener("touchmove", move);
      window.removeEventListener("touchend", stop);
    };

    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", stop);
    window.addEventListener("touchmove", move, { passive: true });
    window.addEventListener("touchend", stop);
  }, [toolPanelPosition]);

  const load = useCallback(async () => {
    try {
      const res = await getStudentInterviewWorkspace(id);
      const next = res?.interview || null;
      setItem(next);
      if (next?.collaboration?.code && !codeDirty) {
        suppressCodeSyncRef.current = true;
        setCodeLanguage(String(next.collaboration.code.language || "javascript"));
        setCodeOutputView(String(next.collaboration.code.outputMode || "console"));
        setCodeInput(String(next.collaboration.code.content || ""));
        setCodeNote(String(next.collaboration.code.note || ""));
      }
    } finally {
      setLoading(false);
    }
  }, [id, codeDirty]);

  useEffect(() => {
    let cancelled = false;
    let timer = null;
    const refreshMs = joined || remoteReady ? 5000 : 2500;

    const run = async () => {
      await load();
      if (cancelled) return;
      timer = setTimeout(run, refreshMs);
    };

    run();
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [joined, load, remoteReady]);

  const applyCompanyCandidate = useCallback(async (candidateLike) => {
    const pc = peerRef.current;
    if (!pc || !candidateLike?.candidate) return;
    const key = candidateKey(candidateLike);
    if (appliedCompanyCandidatesRef.current.has(key)) return;

    if (!pc.remoteDescription) {
      if (!pendingCompanyCandidatesRef.current.find((c) => candidateKey(c) === key)) {
        pendingCompanyCandidatesRef.current.push(candidateLike);
      }
      return;
    }

    try {
      const init = buildIceCandidateInit(candidateLike);
      await pc.addIceCandidate(new RTCIceCandidate(init));
      appliedCompanyCandidatesRef.current.add(key);
    } catch {
      if (!pendingCompanyCandidatesRef.current.find((c) => candidateKey(c) === key)) {
        pendingCompanyCandidatesRef.current.push(candidateLike);
      }
    }
  }, []);

  const applyRemoteOffer = useCallback(async (offerLike) => {
    const pc = peerRef.current;
    if (!pc) return;
    const offerSdp = normalizeRemoteSdp(offerLike?.sdp);
    if (!offerSdp || !/^v=0(?:\r?\n|$)/.test(offerSdp)) return;
    if (appliedOfferSdpRef.current === offerSdp) return;
    if (pc.signalingState !== "stable") return;

    try {
      await pc.setRemoteDescription(new RTCSessionDescription({ type: offerLike?.type || "offer", sdp: offerSdp }));
      appliedOfferSdpRef.current = offerSdp;
      if (!screenSenderRef.current) {
        const freeVideoTransceiver = pc
          .getTransceivers()
          .find((t) => t?.receiver?.track?.kind === "video" && t?.sender && !t.sender.track);
        if (freeVideoTransceiver?.sender) {
          const canvas = document.createElement("canvas");
          canvas.width = 16;
          canvas.height = 9;
          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.fillStyle = "#000000";
            ctx.fillRect(0, 0, canvas.width, canvas.height);
          }
          const placeholderStream = canvas.captureStream(1);
          const placeholderTrack = placeholderStream.getVideoTracks()[0];
          if (placeholderTrack) {
            placeholderTrack.enabled = false;
            await freeVideoTransceiver.sender.replaceTrack(placeholderTrack);
            screenSenderRef.current = freeVideoTransceiver.sender;
            screenPlaceholderTrackRef.current = placeholderTrack;
          }
        }
      }
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      await studentInterviewWebrtcAnswer(id, { type: answer.type, sdp: answer.sdp });

      const pending = [...pendingCompanyCandidatesRef.current];
      pendingCompanyCandidatesRef.current = [];
      for (const c of pending) {
        await applyCompanyCandidate(c);
      }
    } catch (e) {
      console.debug("student setRemoteDescription retry:", e?.message || e);
    }
  }, [id, applyCompanyCandidate]);

  const closeAdminMonitorConnection = useCallback(() => {
    if (adminMonitorVideoSenderRef.current) {
      removeSender(adminMonitorVideoSenderRef.current);
      adminMonitorVideoSenderRef.current = null;
    }
    if (adminMonitorPeerRef.current) {
      adminMonitorPeerRef.current.onicecandidate = null;
      adminMonitorPeerRef.current.onconnectionstatechange = null;
      try {
        adminMonitorPeerRef.current.close();
      } catch {
        // ignore close races
      }
      adminMonitorPeerRef.current = null;
    }
    appliedAdminMonitorCandidatesRef.current = new Set();
    pendingAdminMonitorCandidatesRef.current = [];
    appliedAdminMonitorOfferSdpRef.current = "";
  }, [removeSender]);

  const ensureAdminMonitorPeer = useCallback(async () => {
    if (adminMonitorPeerRef.current) return adminMonitorPeerRef.current;
    const localStream = localStreamRef.current;
    if (!localStream) return null;

    const peer = new RTCPeerConnection(ICE_CONFIG);
    adminMonitorPeerRef.current = peer;
    const audioTracks = localStream.getAudioTracks();
    const outgoingVideoTrack = await getOutgoingVideoTrack(localStream);
    const outgoingStream = new MediaStream([...audioTracks, ...(outgoingVideoTrack ? [outgoingVideoTrack] : [])]);

    audioTracks.forEach((track) => peer.addTrack(track, outgoingStream));
    if (outgoingVideoTrack) {
      const videoSender = peer.addTrack(outgoingVideoTrack, outgoingStream);
      adminMonitorVideoSenderRef.current = videoSender;
      await bindVideoSender(videoSender);
      await optimizeVideoSenderForInterview(videoSender);
    }

    peer.onicecandidate = async (event) => {
      if (!event.candidate) return;
      try {
        await studentInterviewAdminMonitorCandidate(id, event.candidate.toJSON());
      } catch {
        // ignore intermittent signaling writes
      }
    };

    peer.onconnectionstatechange = () => {
      if (["failed", "closed"].includes(peer.connectionState)) {
        closeAdminMonitorConnection();
      }
    };

    return peer;
  }, [bindVideoSender, closeAdminMonitorConnection, getOutgoingVideoTrack, id]);

  const applyAdminMonitorCandidate = useCallback(async (candidateLike) => {
    const peer = adminMonitorPeerRef.current;
    if (!peer || !candidateLike?.candidate) return;
    const key = candidateKey(candidateLike);
    if (appliedAdminMonitorCandidatesRef.current.has(key)) return;

    if (!peer.remoteDescription) {
      if (!pendingAdminMonitorCandidatesRef.current.find((row) => candidateKey(row) === key)) {
        pendingAdminMonitorCandidatesRef.current.push(candidateLike);
      }
      return;
    }

    try {
      await peer.addIceCandidate(new RTCIceCandidate(buildIceCandidateInit(candidateLike)));
      appliedAdminMonitorCandidatesRef.current.add(key);
    } catch {
      if (!pendingAdminMonitorCandidatesRef.current.find((row) => candidateKey(row) === key)) {
        pendingAdminMonitorCandidatesRef.current.push(candidateLike);
      }
    }
  }, []);

  const applyAdminMonitorOffer = useCallback(async (offerLike) => {
    const offerSdp = normalizeRemoteSdp(offerLike?.sdp);
    if (!offerSdp || !/^v=0(?:\r?\n|$)/.test(offerSdp)) return;
    if (appliedAdminMonitorOfferSdpRef.current === offerSdp) return;
    const peer = await ensureAdminMonitorPeer();
    if (!peer || peer.signalingState !== "stable") return;

    try {
      await peer.setRemoteDescription(new RTCSessionDescription({ type: offerLike?.type || "offer", sdp: offerSdp }));
      appliedAdminMonitorOfferSdpRef.current = offerSdp;
      const answer = await peer.createAnswer();
      await peer.setLocalDescription(answer);
      await studentInterviewAdminMonitorAnswer(id, { type: answer.type, sdp: answer.sdp });

      const pending = [...pendingAdminMonitorCandidatesRef.current];
      pendingAdminMonitorCandidatesRef.current = [];
      for (const candidate of pending) {
        await applyAdminMonitorCandidate(candidate);
      }
    } catch (e) {
      console.debug("student admin monitor retry:", e?.message || e);
    }
  }, [applyAdminMonitorCandidate, ensureAdminMonitorPeer, id]);

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
        if (payload.event === "webrtc_offer") {
          const offer = payload?.data?.offer || null;
          if (!offer?.sdp) return;
          applyRemoteOffer(offer);
          setItem((prev) => {
            if (!prev) return prev;
            return {
              ...prev,
              collaboration: {
                ...(prev.collaboration || {}),
                webrtc: {
                  ...((prev.collaboration || {}).webrtc || {}),
                  offer,
                },
              },
            };
          });
        } else if (payload.event === "admin_monitor_offer" && payload?.data?.target === "student") {
          const offer = payload?.data?.offer || null;
          if (!offer?.sdp) return;
          if (localStreamRef.current) {
            void applyAdminMonitorOffer(offer);
          }
          setItem((prev) => {
            if (!prev) return prev;
            const rtc = ((prev.collaboration || {}).webrtc || {});
            const monitor = (rtc.adminMonitor || {});
            return {
              ...prev,
              collaboration: {
                ...(prev.collaboration || {}),
                webrtc: {
                  ...rtc,
                  adminMonitor: {
                    company: monitor.company || {},
                    student: {
                      ...(monitor.student || {}),
                      sessionId: payload?.data?.sessionId || monitor?.student?.sessionId || "",
                      offer,
                    },
                  },
                },
              },
            };
          });
        } else if (
          payload.event === "admin_monitor_candidate"
          && payload?.data?.from === "admin"
          && payload?.data?.target === "student"
        ) {
          const candidate = payload?.data?.candidate;
          if (!candidate?.candidate) return;
          if (localStreamRef.current) {
            void applyAdminMonitorCandidate(candidate);
          }
          setItem((prev) => {
            if (!prev) return prev;
            const rtc = ((prev.collaboration || {}).webrtc || {});
            const monitor = (rtc.adminMonitor || {});
            const current = monitor.student || {};
            const list = Array.isArray(current.adminCandidates) ? current.adminCandidates : [];
            return {
              ...prev,
              collaboration: {
                ...(prev.collaboration || {}),
                webrtc: {
                  ...rtc,
                  adminMonitor: {
                    company: monitor.company || {},
                    student: {
                      ...current,
                      adminCandidates: [...list, candidate].slice(-150),
                    },
                  },
                },
              },
            };
          });
        } else if (payload.event === "webrtc_candidate" && payload?.data?.from === "company") {
          const candidate = payload?.data?.candidate;
          if (!candidate?.candidate) return;
          applyCompanyCandidate(candidate);
          setItem((prev) => {
            if (!prev) return prev;
            const rtc = ((prev.collaboration || {}).webrtc || {});
            const list = Array.isArray(rtc.companyCandidates) ? rtc.companyCandidates : [];
            return {
              ...prev,
              collaboration: {
                ...(prev.collaboration || {}),
                webrtc: {
                  ...rtc,
                  companyCandidates: [...list, candidate].slice(-150),
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
                liveQuestionDraft: { text: "", by: row?.senderRole || "company", updatedAt: row?.createdAt || new Date().toISOString() },
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
                  by: String(draft?.by || "company"),
                  updatedAt: draft?.updatedAt || new Date().toISOString(),
                },
              },
            };
          });
        } else if (payload.event === "collab_code") {
          const code = payload?.data || null;
          suppressCodeSyncRef.current = true;
          setCodeLanguage(String(code?.language || "javascript"));
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
                  lastUpdatedBy: String(code?.lastUpdatedBy || "company"),
                  outputMode: String(code?.outputMode || "console"),
                  output: String(code?.output || ""),
                  error: String(code?.error || ""),
                  serverOutput: String(code?.serverOutput || ""),
                  serverError: String(code?.serverError || ""),
                  previewHtml: String(code?.previewHtml || ""),
                  updatedAt: code?.updatedAt || new Date().toISOString(),
                },
              },
            };
          });
        } else if (payload.event === "collab_code_result") {
          const code = payload?.data || null;
          if (!code) return;
          setCodeOutputView(String(code?.outputMode || "console"));
          setItem((prev) => {
            if (!prev) return prev;
            return {
              ...prev,
              collaboration: {
                ...(prev.collaboration || {}),
                code: {
                  ...((prev.collaboration || {}).code || {}),
                  outputMode: String(code?.outputMode || "console"),
                  output: String(code?.output || ""),
                  error: String(code?.error || ""),
                  serverOutput: String(code?.serverOutput || ""),
                  serverError: String(code?.serverError || ""),
                  previewHtml: String(code?.previewHtml || ""),
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
  }, [id, applyAdminMonitorCandidate, applyAdminMonitorOffer, applyRemoteOffer, applyCompanyCandidate]);

  useEffect(() => {
    if (!id) return undefined;
    if (suppressQuestionDraftSyncRef.current) {
      suppressQuestionDraftSyncRef.current = false;
      return undefined;
    }
    const timer = setTimeout(() => {
      studentInterviewQuestionDraft(id, questionText).catch(() => {});
      setItem((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          collaboration: {
            ...(prev.collaboration || {}),
            liveQuestionDraft: {
              text: String(questionText || ""),
              by: "student",
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
      studentInterviewCode(id, { language: codeLanguage, content: codeInput, note: codeNote }).catch(() => {});
    }, 500);
    return () => clearTimeout(timer);
  }, [id, codeInput, codeNote, codeLanguage]);

  const ensureLocalMedia = useCallback(async () => {
    try {
      setCameraErr("");
      if (localStreamRef.current) return localStreamRef.current;
      const stream = await navigator.mediaDevices.getUserMedia({
        video: INTERVIEW_CAMERA_VIDEO_CONSTRAINTS,
        audio: SPEECH_AUDIO_CONSTRAINTS,
      });
      await optimizeVideoStream(stream);
      await optimizeSpeechStream(stream);
      localStreamRef.current = stream;
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
    closeAdminMonitorConnection();
    if (screenSenderRef.current) {
      try {
        screenSenderRef.current.replaceTrack(screenPlaceholderTrackRef.current || null);
      } catch {
        // ignore
      }
      screenSenderRef.current = null;
    }
    if (screenPlaceholderTrackRef.current) {
      try {
        screenPlaceholderTrackRef.current.stop();
      } catch {
        // ignore
      }
      screenPlaceholderTrackRef.current = null;
    }
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((t) => t.stop());
      screenStreamRef.current = null;
    }
    if (peerRef.current) {
      peerRef.current.ontrack = null;
      peerRef.current.onicecandidate = null;
      peerRef.current.close();
      peerRef.current = null;
    }
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => t.stop());
      localStreamRef.current = null;
    }
    if (remoteStreamRef.current) {
      remoteStreamRef.current.getTracks().forEach((t) => t.stop());
      remoteStreamRef.current = null;
    }
    resetVirtualBackground();
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
    appliedCompanyCandidatesRef.current = new Set();
    appliedOfferSdpRef.current = "";
    setJoined(false);
    setSharing(false);
    setCameraOn(false);
    setMicOn(false);
    setRemoteReady(false);
  }, [closeAdminMonitorConnection, resetVirtualBackground]);

  const publishScreenTrack = useCallback(async (track) => {
    const pc = peerRef.current;
    if (!pc || !track) return false;

    if (screenSenderRef.current) {
      try {
        await screenSenderRef.current.replaceTrack(track);
        return true;
      } catch {
        return false;
      }
    }

    const reusable = pc
      .getTransceivers()
      .find((t) => t?.receiver?.track?.kind === "video" && t?.sender && !t.sender.track);
    if (!reusable?.sender) return false;

    try {
      await reusable.sender.replaceTrack(track);
      screenSenderRef.current = reusable.sender;
      return true;
    } catch {
      return false;
    }
  }, []);

  const joinMeeting = useCallback(async () => {
    try {
      if (peerRef.current) {
        setJoined(true);
        return;
      }
      const rtc = item?.collaboration?.webrtc || {};
      const offer = rtc?.offer;
      const offerSdp = normalizeRemoteSdp(offer?.sdp);
      if (!offerSdp || !/^v=0(?:\r?\n|$)/.test(offerSdp)) {
        setJoined(false);
        setMsg("Waiting for interviewer to start meeting");
        return;
      }

      const stream = await ensureLocalMedia();
      setJoined(true);
      const pc = new RTCPeerConnection(ICE_CONFIG);
      peerRef.current = pc;
      const audioTracks = stream.getAudioTracks();
      const outgoingVideoTrack = await getOutgoingVideoTrack(stream);
      const outgoingStream = new MediaStream([...audioTracks, ...(outgoingVideoTrack ? [outgoingVideoTrack] : [])]);

      audioTracks.forEach((track) => pc.addTrack(track, outgoingStream));
      if (outgoingVideoTrack) {
        const videoSender = pc.addTrack(outgoingVideoTrack, outgoingStream);
        await bindVideoSender(videoSender);
        await optimizeVideoSenderForInterview(videoSender);
      }

      pc.ontrack = (event) => {
        setJoined(true);
        if (!remoteStreamRef.current) remoteStreamRef.current = new MediaStream();
        const primaryTrack = event.track;
        if (primaryTrack && !remoteStreamRef.current.getTracks().find((t) => t.id === primaryTrack.id)) {
          remoteStreamRef.current.addTrack(primaryTrack);
        }
        const tracksFromStream = event.streams?.[0]?.getTracks?.() || [];
        const incomingTracks = tracksFromStream.length ? tracksFromStream : [event.track].filter(Boolean);
        incomingTracks.forEach((track) => {
          if (!remoteStreamRef.current.getTracks().find((t) => t.id === track.id)) {
            remoteStreamRef.current.addTrack(track);
          }
        });
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = remoteStreamRef.current;
          remoteVideoRef.current.play?.().catch(() => {});
        }
        const videoTracks = remoteStreamRef.current.getVideoTracks();
        const hasRemoteVideo = videoTracks.length > 0;
        if (hasRemoteVideo) {
          setRemoteReady(true);
          videoTracks.forEach((vt) => {
            vt.onended = () => setRemoteReady(false);
            vt.onmute = () => setRemoteReady(false);
            vt.onunmute = () => setRemoteReady(true);
          });
        } else {
          setRemoteReady(false);
        }
      };

      pc.onicecandidate = async (event) => {
        if (!event.candidate) return;
        try {
          await studentInterviewWebrtcCandidate(id, event.candidate.toJSON());
        } catch {
          // ignore intermittent signaling writes
        }
      };

      pc.onconnectionstatechange = () => {
        const st = pc.connectionState;
        if (["new", "connecting", "connected"].includes(st)) setJoined(true);
        if (["failed", "closed"].includes(st)) {
          setJoined(false);
          setRemoteReady(false);
        }
      };

      await applyRemoteOffer({ type: offer.type || "offer", sdp: offerSdp });
      setJoined(true);
      setMsg("Connecting to interviewer...");
    } catch (e) {
      setJoined(false);
      setMsg(e?.response?.data?.message || e?.message || "Unable to join meeting");
    }
  }, [applyRemoteOffer, bindVideoSender, ensureLocalMedia, getOutgoingVideoTrack, id, item]);

  useEffect(() => () => leaveMeeting(), [leaveMeeting]);

  useEffect(() => {
    if (!remoteVideoRef.current || !remoteStreamRef.current) return;
    if (remoteVideoRef.current.srcObject !== remoteStreamRef.current) {
      remoteVideoRef.current.srcObject = remoteStreamRef.current;
    }
    remoteVideoRef.current.play?.().catch(() => {});
  }, [remoteReady]);

  useEffect(() => {
    if (!item || !peerRef.current) return;
    const rtc = item?.collaboration?.webrtc || {};
    const offer = rtc?.offer;
    const companyCandidates = Array.isArray(rtc?.companyCandidates) ? rtc.companyCandidates : [];

    const applyRemote = async () => {
      try {
        await applyRemoteOffer(offer);
        for (const c of companyCandidates) {
          if (!c?.candidate) continue;
          await applyCompanyCandidate(c);
        }
      } catch (e) {
        console.debug("student signaling retry:", e?.message || e);
      }
    };

    applyRemote();
  }, [id, item, applyRemoteOffer, applyCompanyCandidate]);

  useEffect(() => {
    if (!item || !isMeetingJoined || !localStreamRef.current) return;
    const studentMonitor = item?.collaboration?.webrtc?.adminMonitor?.student || {};
    const offer = studentMonitor?.offer || null;
    const adminCandidates = Array.isArray(studentMonitor?.adminCandidates) ? studentMonitor.adminCandidates : [];

    const syncAdminMonitor = async () => {
      try {
        if (offer?.sdp) {
          await applyAdminMonitorOffer(offer);
        }
        for (const candidate of adminCandidates) {
          if (!candidate?.candidate) continue;
          await applyAdminMonitorCandidate(candidate);
        }
      } catch (e) {
        console.debug("student admin monitor sync retry:", e?.message || e);
      }
    };

    syncAdminMonitor();
  }, [item, isMeetingJoined, applyAdminMonitorCandidate, applyAdminMonitorOffer]);

  useEffect(() => {
    if (!peerRef.current && !localStreamRef.current) {
      setJoined(false);
    }
  }, [item]);

  useEffect(() => {
    const active = Boolean(item?.collaboration?.screenShare?.active && item?.collaboration?.screenShare?.by === "student");
    setSharing(active);
  }, [item]);

  const exitMeeting = useCallback(async () => {
    try {
      const res = await studentLeaveInterview(id);
      setItem(res?.interview || item);
    } catch (e) {
      setMsg(e?.response?.data?.message || "Unable to exit meeting");
    } finally {
      leaveMeeting();
    }
  }, [id, item, leaveMeeting]);

  const exitToDashboard = useCallback(async () => {
    if (isMeetingJoined) {
      await exitMeeting();
    } else {
      leaveMeeting();
    }
    nav("/student/interviews", { replace: true });
  }, [exitMeeting, isMeetingJoined, leaveMeeting, nav]);

  useEffect(() => {
    if (!item?.status) return;
    if (!["Review Ready", "Completed", "Cancelled", "No Show"].includes(String(item.status))) return;
    leaveMeeting();
    nav("/student/interviews", { replace: true });
  }, [item?.status, leaveMeeting, nav]);

  const sendChat = async () => {
    if (!chatText.trim()) return;
    try {
      const res = await studentInterviewChat(id, chatText.trim());
      setItem(res?.interview || item);
      setChatText("");
    } catch (e) {
      setMsg(e?.response?.data?.message || "Unable to send chat");
    }
  };

  const sendQuestion = async () => {
    if (!questionText.trim()) return;
    try {
      const res = await studentInterviewQuestion(id, questionText.trim());
      setItem(res?.interview || item);
      setQuestionText("");
    } catch (e) {
      setMsg(e?.response?.data?.message || "Unable to send question");
    }
  };

  const syncCode = async () => {
    try {
      await studentInterviewCode(id, {
        language: codeLanguage,
        content: codeInput,
        note: codeNote,
      });
      setCodeDirty(false);
      const res = await studentRunInterviewCode(id, codeOutputView);
      setItem(res?.interview || item);
      setMsg(codeOutputView === "server" ? "Code synced and server output updated" : "Code synced and output updated");
    } catch (e) {
      setMsg(e?.response?.data?.message || "Unable to sync code");
    }
  };

  const runCode = async () => {
    try {
      await studentInterviewCode(id, {
        language: codeLanguage,
        content: codeInput,
        note: codeNote,
      });
      setCodeDirty(false);
      const res = await studentRunInterviewCode(id, codeOutputView);
      setItem(res?.interview || item);
      setMsg(codeOutputView === "server" ? "Server output updated" : "Code output updated");
    } catch (e) {
      setMsg(e?.response?.data?.message || "Unable to run code");
    }
  };

  const startScreenShare = async () => {
    try {
      if (screenStreamRef.current) return;
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false });
      screenStreamRef.current = stream;
      const track = stream.getVideoTracks()[0];
      if (track) {
        try {
          track.contentHint = "detail";
        } catch {
          // ignore unsupported browsers
        }
        if (peerRef.current) {
          const published = await publishScreenTrack(track);
          if (!published) {
            setMsg("Screen selected, but live share could not start yet. Rejoin meeting once connected.");
          }
        }
      }
      setSharing(true);
      await studentInterviewScreenShare(id, true);
      if (track) {
        track.onended = async () => {
          setSharing(false);
          if (screenSenderRef.current) {
            try {
              await screenSenderRef.current.replaceTrack(screenPlaceholderTrackRef.current || null);
            } catch {
              // ignore
            }
          }
          screenStreamRef.current = null;
          await studentInterviewScreenShare(id, false);
        };
      } else {
        setSharing(false);
      }
    } catch (e) {
      setMsg(e?.message || "Unable to share screen");
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
      // handled by ensureLocalMedia
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
      // handled by ensureLocalMedia
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
      // ignore fullscreen failures
    }
  };

  const stopScreenShare = async () => {
    if (screenSenderRef.current) {
      try {
        await screenSenderRef.current.replaceTrack(screenPlaceholderTrackRef.current || null);
      } catch {
        // ignore
      }
    }
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((t) => t.stop());
      screenStreamRef.current = null;
    }
    setSharing(false);
    try {
      await studentInterviewScreenShare(id, false);
    } catch {
      // ignore
    }
  };

  useEffect(() => () => {
    if (screenSenderRef.current) {
      try {
        screenSenderRef.current.replaceTrack(screenPlaceholderTrackRef.current || null);
      } catch {
        // ignore
      }
      screenSenderRef.current = null;
    }
    if (screenPlaceholderTrackRef.current) {
      try {
        screenPlaceholderTrackRef.current.stop();
      } catch {
        // ignore
      }
      screenPlaceholderTrackRef.current = null;
    }
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((t) => t.stop());
      screenStreamRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!peerRef.current || !screenStreamRef.current) return;
    const track = screenStreamRef.current.getVideoTracks()[0];
    if (!track) return;
    publishScreenTrack(track).catch(() => {});
  }, [joined, publishScreenTrack]);

  const chatRows = useMemo(() => item?.collaboration?.chat || [], [item]);
  const questionRows = useMemo(() => item?.collaboration?.questions || [], [item]);
  const codeState = item?.collaboration?.code || {};
  const liveQuestionText = String(item?.collaboration?.liveQuestionDraft?.text || "").trim()
    || String(questionRows[questionRows.length - 1]?.text || "").trim();
  const sharedCodeValue = String(codeInput || codeState?.content || "");
  const liveCodePreview = sharedCodeValue
    .split("\n")
    .slice(0, 2)
    .join("\n")
    .trim();
  const liveChatRows = chatRows.slice(-6);
  const liveQuestionRows = questionRows.slice(-5);

  if (loading) return <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-600">Loading workspace...</div>;
  if (!item) return <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">Interview not found.</div>;

  return (
    <div className="space-y-4 pb-12">
      <header className="rounded-xl border border-slate-200 bg-white p-4">
        <h1 className="text-xl font-bold text-[#0F172A]">Interview Room</h1>
        <p className="text-sm text-slate-500">{item.companyName} - {item.jobTitle} ({item.stage})</p>
      </header>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-3">
          <div className="flex flex-wrap gap-2 text-xs">
            <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-1">Status: {item.status}</span>
            <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-1"><FiWifi className="mr-1 inline" />{item.candidateReadiness?.networkQuality || "Unknown"}</span>
            <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-1">Timer: {item.durationLabel || `${item.durationMins || 30} mins`}</span>
          </div>

          <div ref={videoShellRef} className="relative h-[520px] overflow-hidden rounded-xl border border-slate-300 bg-black lg:h-[620px]">
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              onClick={() => focusLocal && setFocusLocal(false)}
              className={focusLocal
                ? "absolute bottom-3 right-3 z-20 h-28 w-40 cursor-pointer rounded-lg border border-white/20 bg-slate-700 object-cover"
                : "h-full w-full object-cover"}
            />
            {!remoteReady && !focusLocal ? (
              <div className="pointer-events-none absolute inset-0 grid place-items-center bg-black/70 text-slate-200">
                <div className="text-center">
                  <FiVideo className="mx-auto text-3xl" />
                  <p className="mt-2 text-sm font-semibold">Waiting for interviewer video...</p>
                </div>
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
              {focusLocal ? "Show Interviewer Large" : "Show My Video Large"}
            </button>
            <div
              data-interview-tool-panel
              className="absolute z-30 w-[min(390px,calc(100%-24px))] rounded-2xl border border-white/15 bg-slate-950/75 text-white shadow-2xl backdrop-blur"
              style={toolPanelPosition.x == null ? { right: 12, top: toolPanelPosition.y } : { left: toolPanelPosition.x, top: toolPanelPosition.y }}
            >
              <div
                className="flex cursor-move flex-wrap items-center justify-between gap-2 border-b border-white/10 px-3 py-3"
                onMouseDown={startToolPanelDrag}
                onTouchStart={startToolPanelDrag}
              >
                <div className="flex gap-2">
                  <button onClick={() => setActiveTool("chat")} className={`rounded-full px-3 py-1 text-[11px] font-semibold ${activeTool === "chat" ? "bg-blue-500 text-white" : "bg-white/10 text-slate-200"}`}>Chat</button>
                  <button onClick={() => setActiveTool("questions")} className={`rounded-full px-3 py-1 text-[11px] font-semibold ${activeTool === "questions" ? "bg-blue-500 text-white" : "bg-white/10 text-slate-200"}`}>Question</button>
                  <button onClick={() => setActiveTool("coding")} className={`rounded-full px-3 py-1 text-[11px] font-semibold ${activeTool === "coding" ? "bg-blue-500 text-white" : "bg-white/10 text-slate-200"}`}>Code</button>
                </div>
                {activeTool === "coding" ? (
                  <div className="flex gap-1">
                    <button onClick={() => setCodeOutputView("console")} className={`rounded-full px-3 py-1 text-[11px] font-semibold ${codeOutputView === "console" ? "bg-emerald-500 text-white" : "bg-white/10 text-slate-200"}`}>Normal Output</button>
                    <button onClick={() => setCodeOutputView("server")} className={`rounded-full px-3 py-1 text-[11px] font-semibold ${codeOutputView === "server" ? "bg-emerald-500 text-white" : "bg-white/10 text-slate-200"}`}>Server Output</button>
                  </div>
                ) : null}
              </div>

              <div className="max-h-[310px] overflow-auto px-3 py-3">
                {activeTool === "chat" ? (
                  <div className="space-y-2">
                    {liveChatRows.length ? liveChatRows.map((row, index) => (
                      <div key={`${row.createdAt || index}_${row.text || ""}`} className="rounded-xl bg-white/8 px-3 py-2 text-sm leading-6">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-blue-200">{row.senderRole}</p>
                        <p className="mt-1 whitespace-pre-wrap text-slate-100">{row.text}</p>
                      </div>
                    )) : <p className="text-sm text-slate-300">No chat yet.</p>}
                  </div>
                ) : null}

                {activeTool === "questions" ? (
                  <div className="space-y-2">
                    {liveQuestionText ? (
                      <div className="rounded-xl border border-amber-300/30 bg-amber-500/10 px-3 py-2 text-sm leading-6 text-amber-50">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-amber-200">Live Draft</p>
                        <p className="mt-1 whitespace-pre-wrap">{liveQuestionText}</p>
                      </div>
                    ) : null}
                    {liveQuestionRows.length ? liveQuestionRows.map((row, index) => (
                      <div key={`${row.createdAt || index}_${row.text || ""}`} className="rounded-xl bg-white/8 px-3 py-2 text-sm leading-6">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-blue-200">{row.senderRole}</p>
                        <p className="mt-1 whitespace-pre-wrap text-slate-100">{row.text}</p>
                      </div>
                    )) : <p className="text-sm text-slate-300">No questions yet.</p>}
                  </div>
                ) : null}

                {activeTool === "coding" ? (
                  <div className="space-y-3">
                    <div className="rounded-xl bg-white/8 p-3">
                      <div className="flex items-center justify-between gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-blue-200">
                        <span>{codeLanguage}</span>
                        <span>{codeState?.lastUpdatedBy || "shared"}</span>
                      </div>
                      <pre className="mt-2 max-h-32 overflow-auto whitespace-pre-wrap rounded-lg bg-black/35 p-3 text-[11px] leading-5 text-slate-100">
                        {sharedCodeValue || "// Shared code appears here"}
                      </pre>
                    </div>

                    {codeOutputView === "console" ? (
                      <div className="rounded-xl bg-white/8 p-3">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-emerald-200">Normal Output</p>
                        <pre className="mt-2 max-h-36 overflow-auto whitespace-pre-wrap rounded-lg bg-black/35 p-3 text-[11px] leading-5 text-slate-100">
                          {codeState?.output || codeState?.error || "Run code to see output."}
                        </pre>
                      </div>
                    ) : (
                      <div className="rounded-xl bg-white/8 p-3">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-emerald-200">Server Output</p>
                        {codeState?.previewHtml ? (
                          <iframe
                            title="Interview code preview"
                            srcDoc={codeState.previewHtml}
                            sandbox="allow-scripts"
                            className="mt-2 h-44 w-full rounded-lg border border-white/10 bg-white"
                          />
                        ) : null}
                        <div className="mt-2 space-y-2 text-xs leading-5 text-slate-200">
                          {codeState?.serverOutput ? <p>{codeState.serverOutput}</p> : null}
                          {codeState?.serverError ? <p className="text-rose-200">{codeState.serverError}</p> : null}
                          {!codeState?.previewHtml && !codeState?.serverOutput && !codeState?.serverError ? <p>Run server output to see browser preview details.</p> : null}
                        </div>
                      </div>
                    )}
                  </div>
                ) : null}
              </div>
            </div>
            <div className="absolute bottom-3 left-3 z-30 max-w-[55%] rounded-md bg-black/50 px-2 py-1 text-[11px] text-white">
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
              <button onClick={sharing ? stopScreenShare : startScreenShare} className={`grid h-9 w-9 place-items-center rounded-full ${sharing ? "bg-green-600" : "bg-slate-700"}`} title={sharing ? "Stop screen share" : "Share screen"}>
                <FiMonitor />
              </button>
              <button onClick={isMeetingJoined ? exitMeeting : joinMeeting} className="grid h-9 w-9 place-items-center rounded-full bg-red-600" title={isMeetingJoined ? "Exit meeting" : "Join meeting"}>
                <FiPhoneOff />
              </button>
              <button onClick={toggleFullscreen} className="grid h-9 w-9 place-items-center rounded-full bg-slate-700" title="Toggle fullscreen">
                <FiMaximize />
              </button>
            </div>
          </div>
          {cameraErr ? <p className="text-xs text-red-600">{cameraErr}</p> : null}
        </div>

        <aside className="flex h-full flex-col gap-3 rounded-xl border border-slate-200 bg-white p-3">
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
            <p className="font-semibold text-[#0F172A]">Interview Rules</p>
            <ul className="mt-2 space-y-1 text-xs">
              <li>Keep camera on during interview.</li>
              <li>Do not switch tabs or open external apps.</li>
              <li>No second person should be present.</li>
              <li>Coding tests are monitored.</li>
            </ul>
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
            <p className="font-semibold text-[#0F172A]">Round Timeline</p>
            <div className="mt-2 space-y-1 text-xs">
              {(item.statusTimeline || []).map((x, i) => <p key={`${x.roundType}_${i}`}>{x.roundType}: {x.status}</p>)}
              {!item.statusTimeline?.length ? <p>No rounds added yet.</p> : null}
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-3">
            <div className="grid grid-cols-3 gap-2">
              <button onClick={() => setActiveTool("chat")} className={`rounded-lg border px-2 py-2 text-xs font-semibold ${activeTool === "chat" ? "border-blue-200 bg-blue-50 text-[#2563EB]" : "border-slate-200 text-slate-700"}`}>Chat</button>
              <button onClick={() => setActiveTool("questions")} className={`rounded-lg border px-2 py-2 text-xs font-semibold ${activeTool === "questions" ? "border-blue-200 bg-blue-50 text-[#2563EB]" : "border-slate-200 text-slate-700"}`}>Questions</button>
              <button onClick={() => setActiveTool("coding")} className={`rounded-lg border px-2 py-2 text-xs font-semibold ${activeTool === "coding" ? "border-blue-200 bg-blue-50 text-[#2563EB]" : "border-slate-200 text-slate-700"}`}>Coding</button>
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
                    placeholder="Answer / ask question..."
                  />
                  <button onClick={sendQuestion} className="rounded-lg border border-blue-200 px-3 text-xs font-semibold text-[#2563EB]"><FiSend /></button>
                </div>
              </div>
            ) : null}

            {activeTool === "coding" ? (
              <div className="mt-3">
                <div className="flex flex-wrap gap-2">
                  <select value={codeLanguage} onChange={(e) => { setCodeLanguage(e.target.value); setCodeDirty(true); }} className="h-9 rounded-lg border border-slate-200 px-3 text-sm">
                    <option value="javascript">JavaScript</option>
                    <option value="html">HTML / Browser Preview</option>
                  </select>
                  <button onClick={() => setCodeOutputView("console")} className={`rounded-lg border px-3 py-1.5 text-xs font-semibold ${codeOutputView === "console" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-slate-200 text-slate-700"}`}>Normal Output</button>
                  <button onClick={() => setCodeOutputView("server")} className={`rounded-lg border px-3 py-1.5 text-xs font-semibold ${codeOutputView === "server" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-slate-200 text-slate-700"}`}>Server Output</button>
                </div>
                <textarea value={codeInput} onChange={(e) => { setCodeInput(e.target.value); setCodeDirty(true); }} rows={8} className="mt-2 w-full rounded-lg border border-slate-200 px-2 py-2 font-mono text-xs" placeholder={codeLanguage === "html" ? "<div>Hello interviewer</div>" : "// Shared JavaScript code"} />
                <input value={codeNote} onChange={(e) => { setCodeNote(e.target.value); setCodeDirty(true); }} className="mt-2 h-9 w-full rounded-lg border border-slate-200 px-2 text-sm" placeholder="Your code notes..." />
                <div className="mt-2 flex gap-2">
                  <button onClick={syncCode} className="rounded-lg border border-blue-200 px-3 py-1.5 text-xs font-semibold text-[#2563EB]"><FiCode className="mr-1 inline" />Sync Code</button>
                  <button onClick={runCode} className="rounded-lg border border-green-200 px-3 py-1.5 text-xs font-semibold text-green-700">Run Code</button>
                </div>
                <div className="mt-2 rounded-lg border border-slate-200 bg-slate-50 p-2 text-xs">
                  <p><b>{codeOutputView === "console" ? "Output" : "Server Output"}:</b></p>
                  {codeOutputView === "console" ? (
                    <>
                      <pre className="whitespace-pre-wrap">{codeState.output || "-"}</pre>
                      {codeState.error ? <p className="text-red-600"><b>Error:</b> {codeState.error}</p> : null}
                    </>
                  ) : (
                    <>
                      {codeState.previewHtml ? <iframe title="Student code output preview" srcDoc={codeState.previewHtml} sandbox="allow-scripts" className="mt-2 h-40 w-full rounded-lg border border-slate-200 bg-white" /> : null}
                      {codeState.serverOutput ? <p className="mt-2 whitespace-pre-wrap text-slate-700">{codeState.serverOutput}</p> : null}
                      {codeState.serverError ? <p className="mt-2 whitespace-pre-wrap text-red-600"><b>Error:</b> {codeState.serverError}</p> : null}
                      {!codeState.previewHtml && !codeState.serverOutput && !codeState.serverError ? <p>-</p> : null}
                    </>
                  )}
                </div>
              </div>
            ) : null}
          </div>

          <div className="mt-auto rounded-lg border border-slate-200 bg-white p-3">
            <button onClick={isMeetingJoined ? exitMeeting : joinMeeting} className="w-full rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-semibold text-[#2563EB]">
              {isMeetingJoined ? "Exit Meeting" : "Join Meeting"}
            </button>
            <button onClick={sharing ? stopScreenShare : startScreenShare} className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700">
              <FiMonitor className="mr-1 inline" /> {sharing ? "Stop Screen Share" : "Share Screen"}
            </button>
            <p className="mt-3 text-xs text-slate-500">Room ID: {item.roomId || "-"}</p>
            <button onClick={exitToDashboard} className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700">Exit to Dashboard</button>
          </div>
        </aside>
      </section>
    </div>
  );
}
