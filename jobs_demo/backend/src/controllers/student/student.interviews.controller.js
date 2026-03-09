import mongoose from "mongoose";
import Interview from "../../models/Interview.js";
import { emitInterviewSignal } from "../../realtime/interviewSignaling.js";

const STATUS_ALLOWED = [
  "Scheduled",
  "Waiting Room",
  "Live",
  "Completed",
  "Review Ready",
  "Rescheduled",
  "Cancelled",
  "No Show",
  "Pending Confirmation",
];
const STAGE_ALLOWED = ["HR", "Technical", "Managerial", "Final"];

function toDateOnly(d) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function toTime12h(d) {
  let h = d.getHours();
  const m = String(d.getMinutes()).padStart(2, "0");
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12;
  if (h === 0) h = 12;
  return `${String(h).padStart(2, "0")}:${m} ${ampm}`;
}

function normalizeDurationMins(input, fallback = 30) {
  const n = Number(input);
  if (!Number.isFinite(n)) return fallback;
  if (n < 0) return fallback;
  return Math.floor(n);
}

function normalizeWebRtcSdp(raw) {
  let source = "";
  if (raw && typeof raw === "object" && typeof raw.sdp === "string") {
    source = raw.sdp;
  } else {
    source = String(raw || "").trim();
    if (source.startsWith("{") && source.endsWith("}")) {
      try {
        const parsed = JSON.parse(source);
        if (parsed && typeof parsed.sdp === "string") source = parsed.sdp;
      } catch {
        // keep original source
      }
    }
  }

  const sdp = String(source || "")
    .replace(/\\r\\n/g, "\r\n")
    .replace(/\\n/g, "\n")
    .trim();
  if (!sdp) return "";

  const lines = sdp
    .split(/\r?\n/)
    .map((line) => String(line || "").trim())
    .filter(Boolean);
  const startIndex = lines.findIndex((line) => line.startsWith("v=0"));
  if (startIndex < 0) return "";

  const allowed = /^(v|o|s|t|a|m|c|b)=/;
  const cleaned = lines.slice(startIndex).filter((line) => allowed.test(line));
  if (!cleaned.length || !cleaned[0].startsWith("v=0")) return "";
  if (!cleaned.some((line) => line.startsWith("m="))) return "";

  const normalized = `${cleaned.join("\r\n")}\r\n`;
  return normalized.slice(0, 200000);
}

function normalizeIceCandidate(input = {}) {
  const parsedMLine = Number(input?.sdpMLineIndex);
  const safeMLine = Number.isFinite(parsedMLine) ? parsedMLine : null;
  return {
    candidate: String(input?.candidate || "").slice(0, 4000),
    sdpMid: String(input?.sdpMid || "").slice(0, 100),
    sdpMLineIndex: safeMLine,
    usernameFragment: String(input?.usernameFragment || "").slice(0, 100),
    createdAt: new Date(),
  };
}

function mapStudentInterview(x) {
  const d = new Date(x.scheduledAt);
  const startAllowedAt = new Date(d.getTime() - 10 * 60 * 1000);
  const status = x.status || "Scheduled";
  const joinableStatuses = ["Scheduled", "Rescheduled", "Waiting Room", "Live"];
  const joinAllowed = Date.now() >= startAllowedAt.getTime() && joinableStatuses.includes(status);
  const durationMins = normalizeDurationMins(x.durationMins, 30);
  const durationLabel = durationMins === 0 ? "Unlimited" : `${durationMins} mins`;
  const endedAtDate = x.endedAt ? new Date(x.endedAt) : null;
  return {
    id: String(x._id),
    applicationId: x.application ? String(x.application) : "",
    jobId: x.job ? String(x.job) : "",
    companyId: x.company?._id ? String(x.company._id) : "",
    companyName: x.company?.name || "Company",
    companyEmail: x.company?.email || "",
    companyPhone: x.company?.phone || "",
    candidateName: x.candidateName || "",
    jobTitle: x.jobTitle || "",
    stage: x.stage || "HR",
    status,
    scheduledAt: d.toISOString(),
    date: toDateOnly(d),
    time: toTime12h(d),
    durationMins,
    durationLabel,
    mode: x.mode || "Online",
    meetingLink: x.meetingLink || "",
    interviewLinks: Array.isArray(x.interviewLinks)
      ? x.interviewLinks
      : x.meetingLink
      ? [x.meetingLink]
      : [],
    location: x.location || "",
    interviewer: x.interviewer || "",
    messageToCandidate: x.messageToCandidate || "",
    interviewQuestions: Array.isArray(x.interviewQuestions) ? x.interviewQuestions : [],
    documentsRequired: Array.isArray(x.documentsRequired) ? x.documentsRequired : [],
    verificationDetails: x.verificationDetails || "",
    additionalDetails: x.additionalDetails || "",
    verificationStatus: x.verificationStatus || "Pending",
    roomId: x.roomId || "",
    sessionId: x.sessionId || "",
    endedAt: endedAtDate ? endedAtDate.toISOString() : "",
    endedAtText: endedAtDate ? `${toDateOnly(endedAtDate)} ${toTime12h(endedAtDate)}` : "",
    statusTimeline: Array.isArray(x.rounds) ? x.rounds : [],
    candidateReadiness: x.candidateReadiness || {},
    joinAllowed,
    joinAvailableAt: startAllowedAt.toISOString(),
    collaboration: x.collaboration || {
      chat: [],
      questions: [],
      code: { language: "javascript", content: "", note: "", output: "", error: "" },
      screenShare: { active: false, by: "" },
      liveQuestionDraft: { text: "", by: "", updatedAt: null },
      webrtc: {
        active: false,
        sessionId: "",
        offer: { type: "", sdp: "", by: "", createdAt: null },
        answer: { type: "", sdp: "", by: "", createdAt: null },
        companyCandidates: [],
        studentCandidates: [],
      },
    },
    notes: Array.isArray(x.notes) ? x.notes : [],
    createdAt: x.createdAt,
    updatedAt: x.updatedAt,
  };
}

// GET /api/student/interviews
export const listStudentInterviews = async (req, res, next) => {
  try {
    const studentId = req.user?._id;
    if (!studentId) return res.status(401).json({ message: "Unauthorized" });

    const { status = "", stage = "", from = "", to = "" } = req.query;
    const filter = { student: studentId };

    if (status && STATUS_ALLOWED.includes(status)) filter.status = status;
    if (stage && STAGE_ALLOWED.includes(stage)) filter.stage = stage;

    if (from || to) {
      filter.scheduledAt = {};
      if (from) filter.scheduledAt.$gte = new Date(`${from}T00:00:00.000Z`);
      if (to) filter.scheduledAt.$lte = new Date(`${to}T23:59:59.999Z`);
    }

    const items = await Interview.find(filter)
      .sort({ scheduledAt: 1, createdAt: -1 })
      .populate("company", "name email phone")
      .lean();

    return res.json({
      items: items.map(mapStudentInterview),
      total: items.length,
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/student/interviews/:id/prejoin
export const studentCompletePreJoin = async (req, res, next) => {
  try {
    const studentId = req.user?._id;
    if (!studentId) return res.status(401).json({ message: "Unauthorized" });
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) return res.status(400).json({ message: "Invalid interview id" });

    const {
      cameraReady = false,
      microphoneReady = false,
      networkQuality = "Unknown",
      consentAccepted = false,
      rulesAccepted = false,
    } = req.body || {};

    const interview = await Interview.findOne({ _id: id, student: studentId });
    if (!interview) return res.status(404).json({ message: "Interview not found" });

    interview.candidateReadiness = {
      ...(interview.candidateReadiness || {}),
      online: true,
      cameraReady: Boolean(cameraReady),
      microphoneReady: Boolean(microphoneReady),
      networkQuality: String(networkQuality || "Unknown"),
      consentAccepted: Boolean(consentAccepted),
      rulesAccepted: Boolean(rulesAccepted),
      preJoinCompletedAt: new Date(),
    };
    await interview.save();

    return res.json({ ok: true, interview: mapStudentInterview(interview) });
  } catch (err) {
    next(err);
  }
};

// POST /api/student/interviews/:id/waiting-room
export const studentEnterWaitingRoom = async (req, res, next) => {
  try {
    const studentId = req.user?._id;
    if (!studentId) return res.status(401).json({ message: "Unauthorized" });
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) return res.status(400).json({ message: "Invalid interview id" });

    const interview = await Interview.findOne({ _id: id, student: studentId });
    if (!interview) return res.status(404).json({ message: "Interview not found" });
    if (["Cancelled", "No Show", "Completed", "Review Ready"].includes(interview.status)) {
      return res.status(400).json({ message: "Interview is not available for waiting room" });
    }

    interview.candidateReadiness = {
      ...(interview.candidateReadiness || {}),
      online: true,
      enteredWaitingRoomAt: new Date(),
    };
    if (["Scheduled", "Rescheduled"].includes(interview.status)) {
      interview.status = "Waiting Room";
    }
    await interview.save();

    return res.json({ ok: true, interview: mapStudentInterview(interview) });
  } catch (err) {
    next(err);
  }
};

// GET /api/student/interviews/:id/workspace
export const studentInterviewWorkspace = async (req, res, next) => {
  try {
    const studentId = req.user?._id;
    if (!studentId) return res.status(401).json({ message: "Unauthorized" });
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) return res.status(400).json({ message: "Invalid interview id" });

    const interview = await Interview.findOne({ _id: id, student: studentId })
      .populate("company", "name email")
      .lean();
    if (!interview) return res.status(404).json({ message: "Interview not found" });

    const base = mapStudentInterview(interview);
    return res.json({
      interview: {
        ...base,
        companyName: interview?.company?.name || base.companyName,
        allowedTabs: ["Question View", "Coding Panel", "Files", "Chat"],
      },
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/student/interviews/:id/cancel
export const studentCancelInterview = async (req, res, next) => {
  try {
    const studentId = req.user?._id;
    if (!studentId) return res.status(401).json({ message: "Unauthorized" });
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) return res.status(400).json({ message: "Invalid interview id" });

    const interview = await Interview.findOne({ _id: id, student: studentId });
    if (!interview) return res.status(404).json({ message: "Interview not found" });
    if (["Completed", "Review Ready", "Cancelled", "No Show"].includes(interview.status)) {
      return res.status(400).json({ message: "Interview cannot be cancelled in current status" });
    }

    interview.status = "Cancelled";
    interview.endedAt = new Date();
    await interview.save();

    return res.json({ ok: true, interview: mapStudentInterview(interview) });
  } catch (err) {
    next(err);
  }
};

// POST /api/student/interviews/:id/chat
export const studentInterviewChat = async (req, res, next) => {
  try {
    const studentId = req.user?._id;
    if (!studentId) return res.status(401).json({ message: "Unauthorized" });
    const { id } = req.params;
    const { text = "" } = req.body || {};
    const chatText = String(text).trim();
    if (!chatText) return res.status(400).json({ message: "Chat text is required" });
    const createdAt = new Date();
    const updated = await Interview.findOneAndUpdate(
      { _id: id, student: studentId },
      {
        $push: {
          "collaboration.chat": {
            senderRole: "student",
            text: chatText,
            createdAt,
          },
        },
      },
      { returnDocument: "after" }
    );
    if (!updated) return res.status(404).json({ message: "Interview not found" });
    emitInterviewSignal(
      id,
      "collab_chat",
      { senderRole: "student", text: chatText, createdAt: createdAt.toISOString() },
      { excludeRole: "student" }
    );
    return res.json({ ok: true, interview: mapStudentInterview(updated) });
  } catch (err) {
    next(err);
  }
};

// POST /api/student/interviews/:id/questions
export const studentInterviewQuestion = async (req, res, next) => {
  try {
    const studentId = req.user?._id;
    if (!studentId) return res.status(401).json({ message: "Unauthorized" });
    const { id } = req.params;
    const { text = "" } = req.body || {};
    const questionText = String(text).trim();
    if (!questionText) return res.status(400).json({ message: "Question text is required" });
    const createdAt = new Date();
    const updated = await Interview.findOneAndUpdate(
      { _id: id, student: studentId },
      {
        $push: {
          "collaboration.questions": {
            senderRole: "student",
            text: questionText,
            createdAt,
          },
        },
        $set: {
          "collaboration.liveQuestionDraft.text": "",
          "collaboration.liveQuestionDraft.by": "student",
          "collaboration.liveQuestionDraft.updatedAt": createdAt,
        },
      },
      { returnDocument: "after" }
    );
    if (!updated) return res.status(404).json({ message: "Interview not found" });
    emitInterviewSignal(
      id,
      "collab_question",
      { senderRole: "student", text: questionText, createdAt: createdAt.toISOString() },
      { excludeRole: "student" }
    );
    return res.json({ ok: true, interview: mapStudentInterview(updated) });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/student/interviews/:id/questions/draft
export const studentInterviewQuestionDraft = async (req, res, next) => {
  try {
    const studentId = req.user?._id;
    if (!studentId) return res.status(401).json({ message: "Unauthorized" });
    const { id } = req.params;
    const { text = "" } = req.body || {};
    const draftText = String(text || "").slice(0, 2000);
    const updatedAt = new Date();
    const updated = await Interview.findOneAndUpdate(
      { _id: id, student: studentId },
      {
        $set: {
          "collaboration.liveQuestionDraft.text": draftText,
          "collaboration.liveQuestionDraft.by": "student",
          "collaboration.liveQuestionDraft.updatedAt": updatedAt,
        },
      },
      { returnDocument: "after" }
    );
    if (!updated) return res.status(404).json({ message: "Interview not found" });
    emitInterviewSignal(
      id,
      "collab_question_draft",
      { text: draftText, by: "student", updatedAt: updatedAt.toISOString() },
      { excludeRole: "student" }
    );
    return res.json({ ok: true, interview: mapStudentInterview(updated) });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/student/interviews/:id/code
export const studentInterviewCode = async (req, res, next) => {
  try {
    const studentId = req.user?._id;
    if (!studentId) return res.status(401).json({ message: "Unauthorized" });
    const { id } = req.params;
    const { language = "javascript", content = "", note = "" } = req.body || {};
    const updatedAt = new Date();
    const updated = await Interview.findOneAndUpdate(
      { _id: id, student: studentId },
      {
        $set: {
          "collaboration.code.language": String(language || "javascript"),
          "collaboration.code.content": String(content || ""),
          "collaboration.code.note": String(note || ""),
          "collaboration.code.lastUpdatedBy": "student",
          "collaboration.code.updatedAt": updatedAt,
        },
      },
      { returnDocument: "after" }
    );
    if (!updated) return res.status(404).json({ message: "Interview not found" });
    emitInterviewSignal(
      id,
      "collab_code",
      {
        language: String(language || "javascript"),
        content: String(content || ""),
        note: String(note || ""),
        lastUpdatedBy: "student",
        updatedAt: updatedAt.toISOString(),
      },
      { excludeRole: "student" }
    );
    return res.json({ ok: true, interview: mapStudentInterview(updated) });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/student/interviews/:id/screen-share
export const studentInterviewScreenShare = async (req, res, next) => {
  try {
    const studentId = req.user?._id;
    if (!studentId) return res.status(401).json({ message: "Unauthorized" });
    const { id } = req.params;
    const { active = false } = req.body || {};
    const updated = await Interview.findOneAndUpdate(
      { _id: id, student: studentId },
      {
        $set: {
          "collaboration.screenShare.active": Boolean(active),
          "collaboration.screenShare.by": Boolean(active) ? "student" : "",
          "collaboration.screenShare.startedAt": Boolean(active) ? new Date() : null,
        },
      },
      { returnDocument: "after" }
    );
    if (!updated) return res.status(404).json({ message: "Interview not found" });
    return res.json({ ok: true, interview: mapStudentInterview(updated) });
  } catch (err) {
    next(err);
  }
};

// POST /api/student/interviews/:id/webrtc/answer
export const studentInterviewWebrtcAnswer = async (req, res, next) => {
  try {
    const studentId = req.user?._id;
    if (!studentId) return res.status(401).json({ message: "Unauthorized" });
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) return res.status(400).json({ message: "Invalid interview id" });
    const { type = "answer", sdp = "" } = req.body || {};
    const safeSdp = normalizeWebRtcSdp(sdp);
    if (!safeSdp) return res.status(400).json({ message: "Answer SDP is required" });

    const existing = await Interview.findOne({ _id: id, student: studentId }).select("_id sessionId").lean();
    if (!existing) return res.status(404).json({ message: "Interview not found" });
    const sessionId = String(existing.sessionId || "");

    const interview = await Interview.findOneAndUpdate(
      { _id: id, student: studentId },
      {
        $set: {
          "collaboration.webrtc.active": true,
          "collaboration.webrtc.sessionId": sessionId,
          "collaboration.webrtc.answer": {
            type: String(type || "answer"),
            sdp: safeSdp,
            by: "student",
            createdAt: new Date(),
          },
        },
      },
      { returnDocument: "after" }
    );

    emitInterviewSignal(
      id,
      "webrtc_answer",
      {
        sessionId,
        answer: {
          type: String(type || "answer"),
          sdp: safeSdp,
          by: "student",
          createdAt: new Date().toISOString(),
        },
      },
      { excludeRole: "student" }
    );

    return res.json({ ok: true, interview: mapStudentInterview(interview) });
  } catch (err) {
    next(err);
  }
};

// POST /api/student/interviews/:id/webrtc/candidate
export const studentInterviewWebrtcCandidate = async (req, res, next) => {
  try {
    const studentId = req.user?._id;
    if (!studentId) return res.status(401).json({ message: "Unauthorized" });
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) return res.status(400).json({ message: "Invalid interview id" });
    const candidate = normalizeIceCandidate(req.body || {});
    if (!candidate.candidate) return res.status(400).json({ message: "ICE candidate is required" });

    const existing = await Interview.findOne({ _id: id, student: studentId }).select("_id sessionId").lean();
    if (!existing) return res.status(404).json({ message: "Interview not found" });
    const sessionId = String(existing.sessionId || "");

    await Interview.updateOne(
      { _id: id, student: studentId },
      {
        $set: {
          "collaboration.webrtc.active": true,
          "collaboration.webrtc.sessionId": sessionId,
        },
        $push: {
          "collaboration.webrtc.studentCandidates": {
            $each: [candidate],
            $slice: -150,
          },
        },
      }
    );

    emitInterviewSignal(
      id,
      "webrtc_candidate",
      { from: "student", candidate },
      { excludeRole: "student" }
    );

    return res.json({ ok: true });
  } catch (err) {
    next(err);
  }
};
