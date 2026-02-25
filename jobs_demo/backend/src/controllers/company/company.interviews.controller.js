import mongoose from "mongoose";
import Interview from "../../models/Interview.js";
import Application from "../../models/Application.js";
import StudentNotification from "../../models/StudentNotification.js";

const STATUS_ALLOWED = ["Scheduled", "Completed", "Rescheduled", "Cancelled", "Pending Confirmation"];
const MODE_ALLOWED = ["Online", "Onsite"];
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

function mapInterview(x) {
  const d = new Date(x.scheduledAt);
  return {
    id: x._id,
    applicationId: x.application || "",
    jobId: x.job ? String(x.job) : "",
    candidate: x.candidateName,
    email: x.student?.email || "",
    job: x.jobTitle,
    stage: x.stage,
    date: toDateOnly(d),
    time: toTime12h(d),
    duration: `${x.durationMins} mins`,
    mode: x.mode,
    interviewer: x.interviewer || "Assigned Interviewer",
    status: x.status,
    meetingLink: x.meetingLink || "",
    location: x.location || "",
    notes: Array.isArray(x.notes) ? x.notes : [],
    createdAt: x.createdAt,
  };
}

async function notifyInterview(studentId, interview, title, description) {
  if (!studentId) return;
  const joinUrl = String(interview?.meetingLink || "").trim();
  await StudentNotification.create({
    studentId,
    type: "Applications",
    title,
    description,
    icon: "shortlisted",
    actions: [
      ...(joinUrl ? ["Join Meeting"] : []),
      "View Application",
    ],
    meta: {
      applicationId: interview.application ? String(interview.application) : "",
      jobId: interview.job ? String(interview.job) : "",
      interviewId: String(interview._id),
      scheduledAt: interview.scheduledAt ? new Date(interview.scheduledAt).toISOString() : "",
      url: joinUrl,
    },
    read: false,
  });
}

async function syncApplicationFromInterview(interviewDoc, interviewStatus, stage) {
  if (!interviewDoc?.application) return;

  const appId = interviewDoc.application;
  const existingApp = await Application.findOne({ _id: appId, company: interviewDoc.company }).lean();
  if (!existingApp) return;
  const existingMeta = existingApp.meta || {};
  const stageLabelMap = { HR: "HR Round", Technical: "Technical Round", Final: "Final Round" };
  const normalizedStage = stageLabelMap[stage || interviewDoc.stage] || "HR Round";
  const baseMeta = {
    ...existingMeta,
    stage: normalizedStage,
    interview: {
      interviewId: interviewDoc._id,
      mode: interviewDoc.mode,
      link: interviewDoc.meetingLink || "",
      location: interviewDoc.location || "",
      scheduledAt: interviewDoc.scheduledAt,
      status: interviewStatus,
    },
  };

  if (interviewStatus === "Completed") {
    await Application.updateOne(
      { _id: appId, company: interviewDoc.company },
      { $set: { meta: { ...baseMeta, pipelineStatus: "Interview Completed" } } }
    );
    return;
  }

  if (interviewStatus === "Cancelled") {
    await Application.updateOne(
      { _id: appId, company: interviewDoc.company },
      { $set: { status: "Shortlisted", meta: { ...baseMeta, pipelineStatus: "Shortlisted" } } }
    );
    return;
  }

  await Application.updateOne(
    { _id: appId, company: interviewDoc.company },
    { $set: { status: "Interview Scheduled", meta: { ...baseMeta, pipelineStatus: "Interview Scheduled" } } }
  );
}

// GET /api/company/interviews
export async function listCompanyInterviews(req, res, next) {
  try {
    const companyId = req.user?._id;
    if (!companyId) return res.status(401).json({ message: "Unauthorized" });

    const { job, jobId, stage, mode, status, from, to } = req.query;

    const filter = { company: companyId };

    if (job) filter.jobTitle = { $regex: String(job), $options: "i" };
    if (jobId && mongoose.isValidObjectId(jobId)) filter.job = jobId;
    if (stage && STAGE_ALLOWED.includes(stage)) filter.stage = stage;
    if (mode && MODE_ALLOWED.includes(mode)) filter.mode = mode;
    if (status && STATUS_ALLOWED.includes(status)) filter.status = status;

    if (from || to) {
      filter.scheduledAt = {};
      if (from) filter.scheduledAt.$gte = new Date(`${from}T00:00:00.000Z`);
      if (to) filter.scheduledAt.$lte = new Date(`${to}T23:59:59.999Z`);
    }

    const items = await Interview.find(filter)
      .sort({ scheduledAt: -1 })
      .populate("student", "name email")
      .lean();
    res.json({ items: items.map(mapInterview), total: items.length });
  } catch (err) {
    next(err);
  }
}

// POST /api/company/interviews
export async function createCompanyInterview(req, res, next) {
  try {
    const companyId = req.user?._id;
    if (!companyId) return res.status(401).json({ message: "Unauthorized" });

    const {
      candidateName,
      jobTitle,
      stage = "HR",
      date,
      time, // "HH:mm"
      durationMins = 30,
      mode = "Online",
      meetingLink = "",
      location = "",
      messageToCandidate = "",
      interviewer = "",
      status = "Scheduled",
      applicationId = "",
    } = req.body || {};

    let resolvedCandidateName = String(candidateName || "").trim();
    let resolvedJobTitle = String(jobTitle || "").trim();
    let linkedApplication = null;

    if (applicationId) {
      if (!mongoose.isValidObjectId(applicationId)) {
        return res.status(400).json({ message: "Invalid applicationId" });
      }
      linkedApplication = await Application.findOne({ _id: applicationId, company: companyId })
        .populate("student", "name email")
        .populate("job", "title")
        .lean();
      if (!linkedApplication) return res.status(404).json({ message: "Application not found" });
      if (!resolvedCandidateName) resolvedCandidateName = linkedApplication.student?.name || "Candidate";
      if (!resolvedJobTitle) resolvedJobTitle = linkedApplication.job?.title || "-";
    }

    if (!resolvedCandidateName) return res.status(400).json({ message: "candidateName is required" });
    if (!resolvedJobTitle) return res.status(400).json({ message: "jobTitle is required" });
    if (!date) return res.status(400).json({ message: "date is required" });
    if (!time) return res.status(400).json({ message: "time is required" });

    if (!STAGE_ALLOWED.includes(stage)) return res.status(400).json({ message: "Invalid stage" });
    if (!MODE_ALLOWED.includes(mode)) return res.status(400).json({ message: "Invalid mode" });
    if (!STATUS_ALLOWED.includes(status)) return res.status(400).json({ message: "Invalid status" });

    const [hh, mm] = String(time).split(":").map((v) => parseInt(v, 10));
    const dt = new Date(date);
    dt.setHours(Number.isFinite(hh) ? hh : 0, Number.isFinite(mm) ? mm : 0, 0, 0);

    const interview = await Interview.create({
      company: companyId,
      application: linkedApplication?._id,
      job: linkedApplication?.job?._id,
      student: linkedApplication?.student?._id,
      candidateName: resolvedCandidateName,
      jobTitle: resolvedJobTitle,
      stage,
      scheduledAt: dt,
      durationMins: Number(durationMins) || 30,
      mode,
      meetingLink: String(meetingLink || "").trim(),
      location: String(location || "").trim(),
      messageToCandidate: String(messageToCandidate || "").trim(),
      interviewer: String(interviewer || "").trim(),
      status,
      notes: [],
    });

    await syncApplicationFromInterview(interview, status, stage);

    if (interview.student) {
      await notifyInterview(
        interview.student,
        interview,
        "Interview scheduled",
        `Your ${stage} interview is scheduled on ${toDateOnly(dt)} at ${toTime12h(dt)}.`,
      );
    }

    res.status(201).json({ message: "Interview scheduled", interview: mapInterview(interview) });
  } catch (err) {
    next(err);
  }
}

// PATCH /api/company/interviews/:id
export async function updateCompanyInterview(req, res, next) {
  try {
    const companyId = req.user?._id;
    if (!companyId) return res.status(401).json({ message: "Unauthorized" });

    const { id } = req.params;
    const payload = req.body || {};
    const update = {};

    if (payload.stage && STAGE_ALLOWED.includes(payload.stage)) update.stage = payload.stage;
    if (payload.mode && MODE_ALLOWED.includes(payload.mode)) update.mode = payload.mode;
    if (payload.status && STATUS_ALLOWED.includes(payload.status)) update.status = payload.status;

    if (typeof payload.meetingLink === "string") update.meetingLink = payload.meetingLink.trim();
    if (typeof payload.location === "string") update.location = payload.location.trim();
    if (typeof payload.interviewer === "string") update.interviewer = payload.interviewer.trim();

    if (payload.durationMins != null) update.durationMins = Number(payload.durationMins) || 30;

    if (payload.date || payload.time) {
      const existing = await Interview.findOne({ _id: id, company: companyId }).lean();
      if (!existing) return res.status(404).json({ message: "Interview not found" });

      const d = new Date(existing.scheduledAt);
      const dateStr = payload.date || toDateOnly(d);
      const timeStr =
        payload.time ||
        `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;

      const [hh, mm] = String(timeStr).split(":").map((v) => parseInt(v, 10));
      const dt = new Date(dateStr);
      dt.setHours(Number.isFinite(hh) ? hh : 0, Number.isFinite(mm) ? mm : 0, 0, 0);

      update.scheduledAt = dt;
      if (!update.status) update.status = "Rescheduled";
    }

    const updated = await Interview.findOneAndUpdate(
      { _id: id, company: companyId },
      { $set: update },
      { returnDocument: "after" }
    );

    if (!updated) return res.status(404).json({ message: "Interview not found" });

    await syncApplicationFromInterview(updated, updated.status, updated.stage);

    if (updated.student) {
      const d = new Date(updated.scheduledAt);
      await notifyInterview(
        updated.student,
        updated,
        `Interview ${String(updated.status || "").toLowerCase() === "rescheduled" ? "rescheduled" : "updated"}`,
        `Interview is now ${updated.status} on ${toDateOnly(d)} at ${toTime12h(d)}.`,
      );
    }

    res.json({ ok: true, interview: mapInterview(updated) });
  } catch (err) {
    next(err);
  }
}

// POST /api/company/interviews/:id/notes
export async function addInterviewNote(req, res, next) {
  try {
    const companyId = req.user?._id;
    if (!companyId) return res.status(401).json({ message: "Unauthorized" });

    const { id } = req.params;
    const { text } = req.body || {};

    if (!text?.trim()) return res.status(400).json({ message: "text is required" });

    const updated = await Interview.findOneAndUpdate(
      { _id: id, company: companyId },
      { $push: { notes: text.trim() } },
      { returnDocument: "after" }
    ).lean();

    if (!updated) return res.status(404).json({ message: "Interview not found" });

    res.json({ ok: true, interview: mapInterview(updated) });
  } catch (err) {
    next(err);
  }
}

// PATCH /api/company/interviews/:id/status
export async function updateCompanyInterviewStatus(req, res, next) {
  try {
    const companyId = req.user?._id;
    if (!companyId) return res.status(401).json({ message: "Unauthorized" });

    const { id } = req.params;
    const { status } = req.body || {};
    if (!STATUS_ALLOWED.includes(status)) return res.status(400).json({ message: "Invalid status" });

    const updated = await Interview.findOneAndUpdate(
      { _id: id, company: companyId },
      { $set: { status } },
      { returnDocument: "after" }
    );

    if (!updated) return res.status(404).json({ message: "Interview not found" });

    await syncApplicationFromInterview(updated, status, updated.stage);

    if (updated.student) {
      await notifyInterview(
        updated.student,
        updated,
        `Interview status: ${status}`,
        `Your interview status has been updated to ${status}.`,
      );
    }

    res.json({ ok: true, interview: mapInterview(updated) });
  } catch (err) {
    next(err);
  }
}

// DELETE /api/company/interviews/:id
export async function deleteCompanyInterview(req, res, next) {
  try {
    const companyId = req.user?._id;
    if (!companyId) return res.status(401).json({ message: "Unauthorized" });

    const { id } = req.params;
    const deleted = await Interview.findOneAndDelete({ _id: id, company: companyId }).lean();
    if (!deleted) return res.status(404).json({ message: "Interview not found" });

    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
}
