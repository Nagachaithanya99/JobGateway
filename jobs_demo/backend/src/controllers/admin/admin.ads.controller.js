import Advertisement from "../../models/Advertisement.js";
import AdPlan from "../../models/AdPlan.js";
import AdPlanRequest from "../../models/AdPlanRequest.js";
import AdminNotification from "../../models/AdminNotification.js";
import Payment from "../../models/Payment.js";
import StudentNotification from "../../models/StudentNotification.js";
import User from "../../models/User.js";
import mongoose from "mongoose";

function toId(value) {
  return String(value?._id || value?.id || value || "");
}

function isoDate(value) {
  if (!value) return "";
  const dt = new Date(value);
  if (Number.isNaN(dt.getTime())) return "";
  return dt.toISOString();
}

function addDays(dateLike, days) {
  const dt = new Date(dateLike || Date.now());
  dt.setDate(dt.getDate() + Number(days || 0));
  return dt;
}

function mapPlanRequest(row) {
  const rawStatus = String(row.status || "pending").toLowerCase();
  return {
    id: toId(row),
    userId: toId(row.user),
    userName: row.user?.name || "Student",
    email: row.user?.email || "",
    planName: row.planName || "Ads Starter Plan",
    amount: typeof row.amount === "number" ? `Rs ${row.amount}` : row.amount || "",
    note: row.note || "",
    status: rawStatus === "paid" ? "approved" : rawStatus,
    paymentStatus: rawStatus,
    orderId: row.razorpayOrderId || "",
    paymentId: row.razorpayPaymentId || "",
    requestedAt: isoDate(row.requestedAt || row.createdAt || row.paidAt),
    decidedAt: isoDate(row.decidedAt || row.paidAt),
    approvedAt: isoDate(row.user?.adAccess?.approvedAt),
    expiresAt: isoDate(row.user?.adAccess?.expiresAt),
  };
}

function mapAdPlan(row) {
  return {
    id: toId(row),
    name: row.name || "Ads Starter Plan",
    price: Number(row.price || 0),
    durationDays: Number(row.durationDays || 30),
    description: row.description || "",
    placements: Array.isArray(row.placements) ? row.placements : ["student-home"],
    mediaTypes: Array.isArray(row.mediaTypes) ? row.mediaTypes : ["banner", "video", "pamphlet", "other"],
    active: Boolean(row.active),
    highlight: Boolean(row.highlight),
  };
}

function mapAd(row) {
  return {
    id: toId(row),
    userId: toId(row.user),
    userName: row.user?.name || "Student",
    email: row.user?.email || "",
    title: row.title || "",
    description: row.description || "",
    mediaType: row.mediaType || "banner",
    mediaUrl: row.mediaUrl || "",
    mediaResourceType: row.mediaResourceType || "",
    ctaLabel: row.ctaLabel || "Learn More",
    targetUrl: row.targetUrl || "",
    contactLabel: row.contactLabel || "",
    audience: row.audience || "",
    status: row.status || "active",
    rejectedReason: row.rejectedReason || "",
    createdAt: isoDate(row.createdAt),
    approvedAt: isoDate(row.approvedAt),
  };
}

export async function adminGetAdsCenter(req, res, next) {
  try {
    const [requests, payments, ads, plans] = await Promise.all([
      AdPlanRequest.find({})
        .sort({ createdAt: -1 })
        .populate("user", "name email adAccess")
        .lean(),
      Payment.find({ purpose: "student_ad_plan" })
        .sort({ createdAt: -1 })
        .populate("user", "name email adAccess")
        .lean(),
      Advertisement.find({})
        .sort({ createdAt: -1 })
        .populate("user", "name email")
        .lean(),
      AdPlan.find({}).sort({ createdAt: -1 }).lean(),
    ]);

    return res.json({
      requests: [...payments, ...requests]
        .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
        .map(mapPlanRequest),
      ads: ads.map(mapAd),
      plans: plans.map(mapAdPlan),
    });
  } catch (err) {
    next(err);
  }
}

export async function adminSaveAdPlan(req, res, next) {
  try {
    const body = req.body || {};
    const id = body.id || body._id;
    const payload = {
      name: String(body.name || "").trim(),
      price: Number(body.price || 0),
      durationDays: Number(body.durationDays || 30),
      description: String(body.description || "").trim(),
      placements: Array.isArray(body.placements) ? body.placements.filter(Boolean) : ["student-home"],
      mediaTypes: Array.isArray(body.mediaTypes) ? body.mediaTypes.filter(Boolean) : ["banner", "video", "pamphlet", "other"],
      active: body.active !== false,
      highlight: Boolean(body.highlight),
    };

    if (!payload.name) return res.status(400).json({ message: "Ad plan name is required." });

    let plan;
    if (id && mongoose.isValidObjectId(id)) {
      plan = await AdPlan.findByIdAndUpdate(id, { $set: payload }, { returnDocument: "after" }).lean();
      if (!plan) return res.status(404).json({ message: "Ad plan not found." });
    } else {
      try {
        plan = await AdPlan.create(payload);
        plan = plan.toObject();
      } catch (err) {
        if (err?.code !== 11000) throw err;
        const existing = await AdPlan.findOne({ name: payload.name });
        if (!existing) throw err;
        plan = await AdPlan.findByIdAndUpdate(existing._id, { $set: payload }, { returnDocument: "after" }).lean();
      }
    }

    return res.json({ ok: true, plan: mapAdPlan(plan) });
  } catch (err) {
    next(err);
  }
}

export async function adminDeleteAdPlan(req, res, next) {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) return res.status(400).json({ message: "Invalid ad plan id." });
    const deleted = await AdPlan.findByIdAndDelete(id).lean();
    if (!deleted) return res.status(404).json({ message: "Ad plan not found." });
    return res.json({ ok: true, id: toId(deleted) });
  } catch (err) {
    next(err);
  }
}

export async function adminUpdateAdPlanRequest(req, res, next) {
  try {
    const id = String(req.params.id || "");
    const status = String(req.body?.status || "").toLowerCase();
    if (!["approved", "rejected", "pending"].includes(status)) {
      return res.status(400).json({ message: "Invalid status." });
    }

    const request = await AdPlanRequest.findById(id).populate("user", "name email").lean();
    if (!request) return res.status(404).json({ message: "Ad plan request not found." });

    const decidedAt = new Date();
    const approvedAt = status === "approved" ? new Date() : null;
    const expiresAt = status === "approved" ? addDays(approvedAt, 30) : null;

    await AdPlanRequest.findByIdAndUpdate(id, {
      $set: {
        status,
        decidedAt,
        decidedBy: req.user._id,
      },
    });

    await User.findByIdAndUpdate(request.user?._id || request.user, {
      $set: {
        adAccess: {
          canPost: status === "approved",
          planStatus: status,
          planName: request.planName || "Ads Starter Plan",
          requestedAt: request.requestedAt || request.createdAt || new Date(),
          approvedAt,
          expiresAt,
          note: request.note || "",
        },
      },
    });

    const noteTitle =
      status === "approved"
        ? "Admin approved your ad plan"
        : status === "rejected"
        ? "Admin rejected your ad plan"
        : "Ad plan status updated";
    const noteDescription =
      status === "approved"
        ? "Admin had approve now you can post it."
        : status === "rejected"
        ? "Your ad plan request was rejected. Contact admin for the next step."
        : "Your ad plan request is pending review.";

    await Promise.all([
      StudentNotification.create({
        studentId: request.user?._id || request.user,
        type: "System",
        title: noteTitle,
        description: noteDescription,
        icon: "system",
        actions: status === "approved" ? ["Post Ad"] : ["View Notifications"],
        meta: {
          category: "ads-plan-status",
          requestId: id,
          status,
        },
        read: false,
      }),
      AdminNotification.create({
        title: `Ad plan ${status}`,
        type: "Ads",
        target: "Student",
        triggeredBy: req.user?.name || "Admin",
        message: `${request.user?.name || "Student"} ad plan request marked as ${status}.`,
        date: new Date().toISOString().slice(0, 10),
        audience: "Admins",
        status: "sent",
        mode: "immediate",
        createdBy: req.user._id,
      }),
    ]);

    const refreshed = await AdPlanRequest.findById(id)
      .populate("user", "name email adAccess")
      .lean();

    return res.json({
      ok: true,
      request: mapPlanRequest(refreshed),
    });
  } catch (err) {
    next(err);
  }
}

export async function adminUpdateAdStatus(req, res, next) {
  try {
    const id = String(req.params.id || "");
    const status = String(req.body?.status || "").toLowerCase();
    const rejectedReason = String(req.body?.rejectedReason || "").trim();

    if (!["active", "rejected", "archived"].includes(status)) {
      return res.status(400).json({ message: "Invalid ad status." });
    }

    const ad = await Advertisement.findById(id).populate("user", "name email").lean();
    if (!ad) return res.status(404).json({ message: "Advertisement not found." });

    await Advertisement.findByIdAndUpdate(id, {
      $set: {
        status,
        approvedAt: status === "active" ? new Date() : ad.approvedAt || null,
        approvedBy: status === "active" ? req.user._id : ad.approvedBy || null,
        rejectedReason: status === "rejected" ? rejectedReason : "",
      },
    });

    await StudentNotification.create({
      studentId: ad.user?._id || ad.user,
      type: "System",
      title: status === "active" ? "Your ad is live" : `Your ad was ${status}`,
      description:
        status === "active"
          ? "Admin marked your ad as active on the student home page."
          : rejectedReason || `Admin marked your ad as ${status}.`,
      icon: "system",
      actions: ["View Notifications"],
      meta: { category: "ad-status", adId: id, status },
      read: false,
    });

    const refreshed = await Advertisement.findById(id).populate("user", "name email").lean();
    return res.json({
      ok: true,
      ad: mapAd(refreshed),
    });
  } catch (err) {
    next(err);
  }
}
