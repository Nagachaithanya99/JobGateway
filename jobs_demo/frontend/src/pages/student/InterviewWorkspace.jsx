import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FiCode, FiMaximize, FiMic, FiMicOff, FiMonitor, FiPhoneOff, FiSend, FiVideo, FiWifi } from "react-icons/fi";
import {
  getStudentInterviewWorkspace,
  studentInterviewChat,
  studentInterviewCode,
  studentInterviewQuestion,
  studentInterviewQuestionDraft,
  studentInterviewScreenShare,
  studentInterviewWebrtcAnswer,
  studentInterviewWebrtcCandidate,
} from "../../services/interviewsService.js";

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
  const [chatText, setChatText] = useState("");
  const [questionText, setQuestionText] = useState("");
  const [codeInput, setCodeInput] = useState("");
  const [codeNote, setCodeNote] = useState("");
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
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const videoShellRef = useRef(null);
  const socketRef = useRef(null);
  const screenSenderRef = useRef(null);
  const screenPlaceholderTrackRef = useRef(null);
  const appliedCompanyCandidatesRef = useRef(new Set());
  const pendingCompanyCandidatesRef = useRef([]);
  const appliedOfferSdpRef = useRef("");
  const suppressQuestionDraftSyncRef = useRef(false);
  const suppressCodeSyncRef = useRef(false);
  const isMeetingJoined =
    joined ||
    Boolean(peerRef.current) ||
    Boolean(localStreamRef.current) ||
    remoteReady;

  const load = useCallback(async () => {
    try {
      const res = await getStudentInterviewWorkspace(id);
      const next = res?.interview || null;
      setItem(next);
      if (next?.collaboration?.code && !codeDirty) {
        suppressCodeSyncRef.current = true;
        setCodeInput(String(next.collaboration.code.content || ""));
        setCodeNote(String(next.collaboration.code.note || ""));
      }
    } finally {
      setLoading(false);
    }
  }, [id, codeDirty]);

  useEffect(() => {
    load();
    const timer = setInterval(load, 1500);
    return () => clearInterval(timer);
  }, [load]);

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
  }, [id, applyRemoteOffer, applyCompanyCandidate]);

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
      studentInterviewCode(id, { language: "javascript", content: codeInput, note: codeNote }).catch(() => {});
    }, 500);
    return () => clearTimeout(timer);
  }, [id, codeInput, codeNote]);

  const ensureLocalMedia = useCallback(async () => {
    try {
      setCameraErr("");
      if (localStreamRef.current) return localStreamRef.current;
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          channelCount: 1,
          sampleRate: 48000,
          sampleSize: 16,
          latency: 0,
          googEchoCancellation: true,
          googAutoGainControl: true,
          googNoiseSuppression: true,
          googHighpassFilter: true,
        },
      });
      localStreamRef.current = stream;
      if (localVideoRef.current) localVideoRef.current.srcObject = stream;
      setCameraOn(Boolean(stream.getVideoTracks()?.[0]?.enabled));
      setMicOn(Boolean(stream.getAudioTracks()?.[0]?.enabled));
      return stream;
    } catch (e) {
      setCameraErr(e?.message || "Unable to access camera/microphone");
      throw e;
    }
  }, []);

  const leaveMeeting = useCallback(() => {
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
    if (localVideoRef.current) localVideoRef.current.srcObject = null;
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
    appliedCompanyCandidatesRef.current = new Set();
    appliedOfferSdpRef.current = "";
    setJoined(false);
    setCameraOn(false);
    setMicOn(false);
    setRemoteReady(false);
  }, []);

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
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

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
  }, [ensureLocalMedia, id, item, applyRemoteOffer]);

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
    if (!peerRef.current && !localStreamRef.current) {
      setJoined(false);
    }
  }, [item]);

  useEffect(() => {
    const active = Boolean(item?.collaboration?.screenShare?.active && item?.collaboration?.screenShare?.by === "student");
    setSharing(active);
  }, [item]);

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
      const res = await studentInterviewCode(id, {
        language: "javascript",
        content: codeInput,
        note: codeNote,
      });
      setItem(res?.interview || item);
      setCodeDirty(false);
      setMsg("Code synced");
    } catch (e) {
      setMsg(e?.response?.data?.message || "Unable to sync code");
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
  const liveCodePreview = String(codeInput || codeState?.content || "")
    .split("\n")
    .slice(0, 2)
    .join("\n")
    .trim();

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
              <button onClick={sharing ? stopScreenShare : startScreenShare} className={`grid h-9 w-9 place-items-center rounded-full ${sharing ? "bg-green-600" : "bg-slate-700"}`} title={sharing ? "Stop screen share" : "Share screen"}>
                <FiMonitor />
              </button>
              <button onClick={isMeetingJoined ? leaveMeeting : joinMeeting} className="grid h-9 w-9 place-items-center rounded-full bg-red-600" title={isMeetingJoined ? "Leave meeting" : "Join meeting"}>
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
                <textarea value={codeInput} onChange={(e) => { setCodeInput(e.target.value); setCodeDirty(true); }} rows={8} className="w-full rounded-lg border border-slate-200 px-2 py-2 font-mono text-xs" placeholder="// Shared JavaScript code" />
                <input value={codeNote} onChange={(e) => { setCodeNote(e.target.value); setCodeDirty(true); }} className="mt-2 h-9 w-full rounded-lg border border-slate-200 px-2 text-sm" placeholder="Your code notes..." />
                <button onClick={syncCode} className="mt-2 rounded-lg border border-blue-200 px-3 py-1.5 text-xs font-semibold text-[#2563EB]"><FiCode className="mr-1 inline" />Sync Code</button>
                <div className="mt-2 rounded-lg border border-slate-200 bg-slate-50 p-2 text-xs">
                  <p><b>Output:</b></p>
                  <pre className="whitespace-pre-wrap">{codeState.output || "-"}</pre>
                  {codeState.error ? <p className="text-red-600"><b>Error:</b> {codeState.error}</p> : null}
                </div>
              </div>
            ) : null}
          </div>

          <div className="mt-auto rounded-lg border border-slate-200 bg-white p-3">
            <button onClick={isMeetingJoined ? leaveMeeting : joinMeeting} className="w-full rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-semibold text-[#2563EB]">
              {isMeetingJoined ? "Leave Meeting" : "Join Meeting"}
            </button>
            <button onClick={sharing ? stopScreenShare : startScreenShare} className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700">
              <FiMonitor className="mr-1 inline" /> {sharing ? "Stop Screen Share" : "Share Screen"}
            </button>
            <p className="mt-3 text-xs text-slate-500">Room ID: {item.roomId || "-"}</p>
            <button onClick={() => nav("/student/interviews")} className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700">Exit to Dashboard</button>
          </div>
        </aside>
      </section>
      {msg ? <div className="fixed bottom-5 right-5 rounded-lg bg-[#0F172A] px-3 py-2 text-xs font-semibold text-white">{msg}</div> : null}
    </div>
  );
}
