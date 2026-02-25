import Application from "../../models/Application.js";
import Interview from "../../models/Interview.js";
import StudentNotification from "../../models/StudentNotification.js";
import MessageThread from "../../models/MessageThread.js";
import Message from "../../models/Message.js";

const ALLOWED = ["Applied", "Shortlisted", "Hold", "Rejected", "Interview Scheduled"];

async function notifyStudent({ studentId, type, title, description, icon, actions = [], meta = {} }) {
  if (!studentId) return;
  await StudentNotification.create({
    studentId,
    type,
    title,
    description,
    icon,
    actions,
    meta,
    read: false,
  });
}

async function ensureThreadForApplication(app) {
  const thread = await MessageThread.findOneAndUpdate(
    { application: app._id },
    {
      $setOnInsert: {
        company: app.company,
        student: app.student?._id || app.student,
        job: app.job?._id || app.job,
        application: app._id,
        status: app.status || "Applied",
        lastMessageText: "Conversation started",
        lastMessageAt: new Date(),
        companyUnread: 0,
        studentUnread: 0,
      },
    },
    { upsert: true, returnDocument: "after" }
  ).lean();

  return thread;
}

function toDateTimeText(dt) {
  const dateStr = dt.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  const timeStr = dt.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
  return `${dateStr} at ${timeStr}`;
}

export const listCompanyApplications = async (req, res, next) => {
  try {
    const companyId = req.user._id;

    const {
      q = "",
      status = "All",
      job = "",
      jobId = "",
      skills = "",
      location = "",
    } = req.query;

    const match = { company: companyId };
    if (status && status !== "All") match.status = status;
    if (jobId) match.job = jobId;

    let apps = await Application.find(match)
      .sort({ createdAt: -1 })
      .populate("student", "name email phone resumeUrl location")
      .populate("job", "title location")
      .lean();

    const qLower = String(q || "").toLowerCase().trim();
    const jobLower = String(job || "").toLowerCase().trim();
    const skillsLower = String(skills || "").toLowerCase().trim();
    const locLower = String(location || "").toLowerCase().trim();

    apps = apps.filter((a) => {
      const studentName = (a.student?.name || "").toLowerCase();
      const studentEmail = (a.student?.email || "").toLowerCase();
      const studentLoc = (a.student?.location || "").toLowerCase();
      const jobTitle = (a.job?.title || "").toLowerCase();
      const jobLoc = (a.job?.location || "").toLowerCase();
      const topSkills = (a.topSkills || []).join(" ").toLowerCase();

      if (qLower) {
        const hay = `${studentName} ${studentEmail} ${jobTitle} ${jobLoc} ${studentLoc} ${topSkills}`;
        if (!hay.includes(qLower)) return false;
      }

      if (jobLower && !jobTitle.includes(jobLower)) return false;
      if (skillsLower && !topSkills.includes(skillsLower)) return false;
      if (locLower && !`${jobLoc} ${studentLoc}`.includes(locLower)) return false;

      return true;
    });

    res.json({
      items: apps.map((a) => ({
        id: a._id,
        jobId: a.job?._id ? String(a.job._id) : "",
        name: a.student?.name || "Candidate",
        candidateName: a.student?.name || "Candidate",
        jobTitle: a.job?.title || "-",
        job: a.job?.title || "-",
        experience: a.experienceText || "",
        exp: a.experienceText || "",
        location: a.job?.location || a.student?.location || "-",
        skills: a.topSkills || [],
        topSkills: a.topSkills || [],
        appliedDate: a.createdAt ? new Date(a.createdAt).toISOString().slice(0, 10) : "-",
        date: a.createdAt ? new Date(a.createdAt).toISOString().slice(0, 10) : "-",
        status: a.status || "Applied",
        phone: a.student?.phone || "",
        email: a.student?.email || "",
        resumeUrl: a.student?.resumeUrl || "",
      })),
      total: apps.length,
    });
  } catch (err) {
    next(err);
  }
};

export const updateCompanyApplicationStatus = async (req, res, next) => {
  try {
    const companyId = req.user._id;
    const { id } = req.params;
    const { status } = req.body;

    if (!ALLOWED.includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const app = await Application.findOneAndUpdate(
      { _id: id, company: companyId },
      { $set: { status } },
      { returnDocument: "after" }
    )
      .populate("job", "title")
      .lean();

    if (!app) {
      return res.status(404).json({ message: "Application not found" });
    }

    await notifyStudent({
      studentId: app.student,
      type: "Applications",
      title: `Application status updated: ${status}`,
      description: `Your application for ${app.job?.title || "the role"} is now ${status}.`,
      icon:
        status === "Shortlisted"
          ? "shortlisted"
          : status === "Hold"
          ? "hold"
          : status === "Rejected"
          ? "rejected"
          : "application",
      actions: ["View Application"],
      meta: { applicationId: String(app._id), jobId: app.job?._id ? String(app.job._id) : "" },
    });

    res.json({ ok: true, id: app._id, status: app.status });
  } catch (err) {
    next(err);
  }
};

export const bulkUpdateCompanyApplicationStatus = async (req, res, next) => {
  try {
    const companyId = req.user._id;
    const { ids = [], status } = req.body;

    if (!ALLOWED.includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: "ids required" });
    }

    const r = await Application.updateMany(
      { _id: { $in: ids }, company: companyId },
      { $set: { status } }
    );

    res.json({
      ok: true,
      matched: r.matchedCount ?? r.n,
      modified: r.modifiedCount ?? r.nModified,
    });
  } catch (err) {
    next(err);
  }
};

export const scheduleCompanyInterview = async (req, res, next) => {
  try {
    const companyId = req.user._id;
    const { id } = req.params;

    const {
      date,
      time,
      type = "Online",
      link = "",
      round = "HR",
      message = "",
    } = req.body;

    if (!date || !time) {
      return res.status(400).json({ message: "Date and time required" });
    }

    const app = await Application.findOne({ _id: id, company: companyId })
      .populate("student", "name")
      .populate("job", "title")
      .lean();

    if (!app) return res.status(404).json({ message: "Application not found" });

    const [hh, mm] = String(time).split(":").map((v) => parseInt(v, 10));
    const dt = new Date(date);
    dt.setHours(Number.isFinite(hh) ? hh : 0, Number.isFinite(mm) ? mm : 0, 0, 0);

    const interview = await Interview.create({
      company: companyId,
      application: app._id,
      job: app.job?._id,
      student: app.student?._id,
      candidateName: app.student?.name || "Candidate",
      jobTitle: app.job?.title || "-",
      stage: ["HR", "Technical", "Final"].includes(round) ? round : "HR",
      scheduledAt: dt,
      mode: type === "Onsite" ? "Onsite" : "Online",
      meetingLink: type === "Online" ? String(link || "") : "",
      location: type === "Onsite" ? String(link || "") : "",
      messageToCandidate: String(message || ""),
      status: "Scheduled",
    });

    await Application.updateOne(
      { _id: id, company: companyId },
      { $set: { status: "Interview Scheduled" } }
    );

    const whenText = toDateTimeText(dt);
    const joinLine = type === "Online" && String(link || "").trim() ? ` Join link: ${String(link).trim()}` : "";
    const noteLine = String(message || "").trim() ? ` Note: ${String(message).trim()}` : "";
    const preview = `Interview scheduled for ${whenText}.${joinLine}${noteLine}`;

    const thread = await ensureThreadForApplication(app);
    if (thread) {
      await Message.create({
        thread: thread._id,
        senderRole: "system",
        type: "system",
        text: preview,
      });
      await MessageThread.updateOne(
        { _id: thread._id },
        {
          $set: {
            status: "Interview Scheduled",
            lastMessageText: `Interview scheduled for ${whenText}`,
            lastMessageAt: new Date(),
          },
          $inc: { studentUnread: 1 },
        }
      );
    }

    await notifyStudent({
      studentId: app.student?._id,
      type: "Applications",
      title: "Interview scheduled",
      description: `Interview for ${app.job?.title || "your application"} is scheduled on ${whenText}.`,
      icon: "shortlisted",
      actions: [
        ...(type === "Online" && String(link || "").trim() ? ["Join Meeting"] : []),
        "View Application",
      ],
      meta: {
        applicationId: String(app._id),
        jobId: app.job?._id ? String(app.job._id) : "",
        conversationId: thread ? String(thread._id) : "",
        interviewId: String(interview._id),
        scheduledAt: dt.toISOString(),
        url: type === "Online" ? String(link || "").trim() : "",
      },
    });

    res.json({
      ok: true,
      interviewId: interview._id,
      status: "Interview Scheduled",
    });
  } catch (err) {
    next(err);
  }
};
