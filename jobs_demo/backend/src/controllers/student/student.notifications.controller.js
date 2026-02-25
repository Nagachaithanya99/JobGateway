// backend/src/controllers/student/student.notifications.controller.js
import StudentNotification from "../../models/StudentNotification.js";
import User from "../../models/User.js";
import Interview from "../../models/Interview.js";

/**
 * small helper to group as Today / Yesterday / Earlier
 */
function groupByDate(createdAt) {
  const d = new Date(createdAt);
  const now = new Date();

  // local midnight
  const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startYesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);

  if (d >= startToday) return "Today";
  if (d >= startYesterday) return "Yesterday";
  return "Earlier";
}

function timeAgo(createdAt) {
  const diffMs = Date.now() - new Date(createdAt).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "Now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function formatDateTime(dt) {
  const d = new Date(dt);
  const dateStr = d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  const timeStr = d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
  return `${dateStr} at ${timeStr}`;
}

async function ensureInterviewReminderNotifications(studentId) {
  const now = Date.now();
  const upcoming = await Interview.find({
    student: studentId,
    status: { $in: ["Scheduled", "Rescheduled", "Pending Confirmation"] },
    scheduledAt: { $gte: new Date(now - 5 * 60 * 1000), $lte: new Date(now + 30 * 60 * 1000) },
  })
    .select("application job jobTitle scheduledAt meetingLink mode")
    .lean();

  for (const it of upcoming) {
    const when = new Date(it.scheduledAt).getTime();
    const minsLeft = Math.round((when - now) / 60000);
    const inWindowThirty = minsLeft <= 30 && minsLeft > 0;
    const inWindowNow = minsLeft <= 0 && minsLeft >= -5;

    const reminderKey = inWindowThirty
      ? `interview_30_${String(it._id)}`
      : inWindowNow
      ? `interview_now_${String(it._id)}`
      : "";
    if (!reminderKey) continue;

    const existing = await StudentNotification.findOne({
      studentId,
      "meta.reminderKey": reminderKey,
    })
      .select("_id")
      .lean();
    if (existing) continue;

    const joinUrl = String(it.meetingLink || "").trim();
    const title = inWindowThirty ? "Interview reminder (30 min left)" : "Interview is starting now";
    const description = `Your interview for ${it.jobTitle || "your application"} is at ${formatDateTime(it.scheduledAt)}.`;

    await StudentNotification.create({
      studentId,
      type: "System",
      title,
      description,
      icon: "system",
      actions: [
        ...(joinUrl ? ["Join Meeting"] : []),
        "View Application",
      ],
      meta: {
        reminderKey,
        interviewId: String(it._id),
        scheduledAt: new Date(it.scheduledAt).toISOString(),
        applicationId: it.application ? String(it.application) : "",
        jobId: it.job ? String(it.job) : "",
        url: joinUrl,
      },
      read: false,
    });
  }
}

/**
 * GET /api/student/notifications
 * Supports query:
 *  - type=Applications|Jobs|Messages|System|All
 *  - status=Read|Unread|All
 *  - q=search
 */
export const listStudentNotifications = async (req, res, next) => {
  try {
    const studentId = req.user._id;
    await ensureInterviewReminderNotifications(studentId);

    const { type = "All", status = "All", q = "" } = req.query;

    const query = { studentId };

    if (type && type !== "All") query.type = type;
    if (status && status !== "All") query.read = status === "Read";

    if (q && String(q).trim()) {
      const s = String(q).trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const rx = new RegExp(s, "i");
      query.$or = [{ title: rx }, { description: rx }];
    }

    const docs = await StudentNotification.find(query)
      .sort({ createdAt: -1 })
      .limit(200)
      .lean();

    const items = docs.map((n) => ({
      id: String(n._id),
      type: n.type || "System",
      status: n.read ? "Read" : "Unread",
      group: groupByDate(n.createdAt),
      title: n.title,
      description: n.description,
      time: timeAgo(n.createdAt),
      icon: n.icon || "system",
      actions: Array.isArray(n.actions) ? n.actions : [],
      meta: n.meta || {},
      createdAt: n.createdAt,
    }));

    const unreadCount = items.filter((x) => x.status === "Unread").length;

    return res.json({ items, unreadCount });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/student/notifications/mark-all-read
 */
export const markAllRead = async (req, res, next) => {
  try {
    const studentId = req.user._id;
    await StudentNotification.updateMany({ studentId, read: false }, { $set: { read: true } });
    return res.json({ ok: true });
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /api/student/notifications/:id/toggle
 */
export const toggleRead = async (req, res, next) => {
  try {
    const studentId = req.user._id;
    const { id } = req.params;

    const doc = await StudentNotification.findOne({ _id: id, studentId });
    if (!doc) return res.status(404).json({ message: "Notification not found" });

    doc.read = !doc.read;
    await doc.save();

    return res.json({ ok: true, status: doc.read ? "Read" : "Unread" });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/student/notifications/preferences
 * Stored inside User doc as "notificationPrefs"
 */
export const getNotificationPrefs = async (req, res, next) => {
  try {
    const me = await User.findById(req.user._id).lean();
    const prefs = me?.notificationPrefs || {
      appStatus: true,
      employerMessages: true,
      jobRecs: true,
      govUpdates: true,
      internshipAlerts: true,
      announcements: true,
      emailStatus: true,
      emailJobs: true,
      emailMessages: true,
      weeklyDigest: false,
      whatsapp: false,
      sms: false,
      frequency: "Instant",
    };
    return res.json(prefs);
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /api/student/notifications/preferences
 */
export const saveNotificationPrefs = async (req, res, next) => {
  try {
    const payload = req.body || {};
    const updated = await User.findByIdAndUpdate(
      req.user._id,
      { $set: { notificationPrefs: payload } },
      { returnDocument: "after" }
    ).lean();

    return res.json(updated?.notificationPrefs || payload);
  } catch (err) {
    next(err);
  }
};

/**
 * ✅ OPTIONAL SEED (for testing)
 * POST /api/student/notifications/seed
 */
export const seedNotifications = async (req, res, next) => {
  try {
    const studentId = req.user._id;

    const demo = [
      {
        studentId,
        type: "Applications",
        title: "Application submitted successfully",
        description: "Your application for Software Developer at Tech Solutions Inc. was submitted.",
        icon: "application",
        actions: ["View Application"],
        read: false,
      },
      {
        studentId,
        type: "Messages",
        title: "Employer replied to your message",
        description: "Tech Solutions requested your updated resume and portfolio.",
        icon: "message",
        actions: ["Reply"],
        read: false,
      },
      {
        studentId,
        type: "Jobs",
        title: "New job alert matching your skills",
        description: "3 new React Developer jobs were posted in Bangalore.",
        icon: "job",
        actions: ["View Job", "Save Job"],
        read: true,
      },
    ];

    await StudentNotification.insertMany(demo);
    return res.json({ ok: true });
  } catch (err) {
    next(err);
  }
};
