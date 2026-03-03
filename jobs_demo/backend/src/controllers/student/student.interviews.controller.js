import Interview from "../../models/Interview.js";

const STATUS_ALLOWED = ["Scheduled", "Completed", "Rescheduled", "Cancelled", "Pending Confirmation"];
const STAGE_ALLOWED = ["HR", "Technical", "Final"];

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

function mapStudentInterview(x) {
  const d = new Date(x.scheduledAt);
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
    status: x.status || "Scheduled",
    scheduledAt: d.toISOString(),
    date: toDateOnly(d),
    time: toTime12h(d),
    durationMins: Number(x.durationMins || 30),
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

