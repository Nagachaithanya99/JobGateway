import Advertisement from "../../models/Advertisement.js";
import AdPlanRequest from "../../models/AdPlanRequest.js";
import AdPlan from "../../models/AdPlan.js";
import AdminNotification from "../../models/AdminNotification.js";
import Payment from "../../models/Payment.js";
import StudentNotification from "../../models/StudentNotification.js";
import User from "../../models/User.js";
import mongoose from "mongoose";
import {
  createRazorpayOrder,
  getRazorpayConfig,
  makeRazorpayReceipt,
  verifyRazorpaySignature,
} from "../../services/razorpay.js";
import { activateStudentAdAccess } from "../../services/paymentActivation.js";
import { formatDateOnly, makeBillingAmounts } from "../../utils/billing.js";

function toId(value) {
  return String(value?._id || value?.id || value || "");
}

function formatDate(date) {
  if (!date) return "";
  const dt = new Date(date);
  if (Number.isNaN(dt.getTime())) return "";
  return dt.toISOString();
}

function normalizeRequest(doc) {
  if (!doc) return null;
  const rawStatus = String(doc.status || "pending").toLowerCase();
  const status = rawStatus === "paid" ? "approved" : rawStatus;
  return {
    id: toId(doc),
    planName: doc.planName || "Ads Starter Plan",
    amount: typeof doc.amount === "number" ? `Rs ${doc.amount}` : doc.amount || "",
    note: doc.note || "",
    status,
    requestedAt: formatDate(doc.requestedAt || doc.createdAt || doc.paidAt),
    decidedAt: formatDate(doc.decidedAt || doc.paidAt),
  };
}

function normalizeAdPlan(doc) {
  if (!doc) return null;
  return {
    id: toId(doc),
    name: doc.name || "Ads Starter Plan",
    price: Number(doc.price || 0),
    durationDays: Number(doc.durationDays || 30),
    description: doc.description || "",
    placements: Array.isArray(doc.placements) ? doc.placements : ["student-home"],
    mediaTypes: Array.isArray(doc.mediaTypes) ? doc.mediaTypes : ["banner", "video", "pamphlet", "other"],
    active: Boolean(doc.active),
    highlight: Boolean(doc.highlight),
  };
}

function normalizeAd(doc) {
  if (!doc) return null;
  return {
    id: toId(doc),
    title: doc.title || "",
    description: doc.description || "",
    mediaType: doc.mediaType || "banner",
    sourceType: doc.sourceType || "upload",
    mediaUrl: doc.mediaUrl || "",
    mediaPublicId: doc.mediaPublicId || "",
    mediaResourceType: doc.mediaResourceType || "",
    mimeType: doc.mimeType || "",
    ctaLabel: doc.ctaLabel || "Learn More",
    targetUrl: doc.targetUrl || "",
    contactLabel: doc.contactLabel || "",
    audience: doc.audience || "",
    placement: doc.placement || "student-home",
    status: doc.status || "active",
    rejectedReason: doc.rejectedReason || "",
    approvedAt: formatDate(doc.approvedAt),
    createdAt: formatDate(doc.createdAt),
  };
}

export async function getStudentAdsStatus(req, res, next) {
  try {
    const userId = req.user._id;
    const [user, latestRequest, ads, plans, payments] = await Promise.all([
      User.findById(userId).select("adAccess name email").lean(),
      Payment.findOne({ user: userId, purpose: "student_ad_plan" }).sort({ createdAt: -1 }).lean(),
      Advertisement.find({ user: userId }).sort({ createdAt: -1 }).limit(12).lean(),
      AdPlan.find({ active: true }).sort({ price: 1, createdAt: -1 }).lean(),
      Payment.find({ user: userId, purpose: "student_ad_plan" }).sort({ createdAt: -1 }).lean(),
    ]);

    const invoices = payments.map((payment) => {
      const amounts = makeBillingAmounts(payment.amount);
      return {
        id: toId(payment),
        invoiceId: `INV-ADS-${String(payment._id).slice(-6).toUpperCase()}`,
        planName: payment.planName || "Ads Starter Plan",
        paymentMethod: "Razorpay",
        transactionId: payment.razorpayPaymentId || payment.razorpayOrderId || "",
        paidAt: formatDateOnly(payment.paidAt || payment.createdAt),
        status: payment.status === "paid" ? "paid" : payment.status,
        ...amounts,
      };
    });
    const latestInvoice = invoices[0] || null;

    return res.json({
      access: user?.adAccess || {
        canPost: false,
        planStatus: "none",
        planName: "Ads Starter Plan",
      },
      latestRequest: normalizeRequest(latestRequest),
      ads: ads.map(normalizeAd).filter(Boolean),
      plans: plans.map(normalizeAdPlan).filter(Boolean),
      invoices,
      billingProfile: {
        customerName: user?.name || "Student",
        email: user?.email || "",
        gstNumber: "",
      },
      summary: latestInvoice
        ? {
            subtotal: latestInvoice.subtotal,
            gst: latestInvoice.gst,
            total: latestInvoice.total,
            paymentMethod: latestInvoice.paymentMethod,
            transactionId: latestInvoice.transactionId,
            paidAt: latestInvoice.paidAt,
            planName: latestInvoice.planName,
          }
        : null,
      payment: {
        provider: "razorpay",
        enabled: Boolean(getRazorpayConfig().keyId),
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function createAdPlanRequest(req, res, next) {
  try {
    const userId = req.user._id;
    const body = req.body || {};
    const existingPending = await AdPlanRequest.findOne({ user: userId, status: "pending" }).lean();
    if (existingPending) {
      return res.status(400).json({ message: "Your ad plan request is already pending admin approval." });
    }

    const request = await AdPlanRequest.create({
      user: userId,
      planName: String(body.planName || "Ads Starter Plan").trim() || "Ads Starter Plan",
      amount: String(body.amount || "Contact admin").trim(),
      note: String(body.note || "").trim(),
      requestedAt: new Date(),
    });

    await User.findByIdAndUpdate(userId, {
      $set: {
        adAccess: {
          canPost: false,
          planStatus: "pending",
          planName: request.planName,
          requestedAt: new Date(),
          approvedAt: null,
          expiresAt: null,
          note: request.note || "",
        },
      },
    });

    await Promise.all([
      AdminNotification.create({
        title: "New ad plan purchase request",
        type: "Ads",
        target: "Admin",
        triggeredBy: req.user?.name || "Student",
        message: `${req.user?.name || "A student"} requested ad posting access.`,
        date: new Date().toISOString().slice(0, 10),
        audience: "Admins",
        status: "sent",
        mode: "immediate",
        createdBy: userId,
      }),
      StudentNotification.create({
        studentId: userId,
        type: "System",
        title: "Ad plan request submitted",
        description: "Your request has been sent to admin. You will be notified after approval.",
        icon: "system",
        actions: ["View Notifications"],
        meta: { category: "ads-plan-request", requestId: toId(request) },
        read: false,
      }),
    ]);

    return res.json({
      ok: true,
      message: "Plan request sent to admin successfully.",
      request: normalizeRequest(request),
    });
  } catch (err) {
    next(err);
  }
}

export async function createAdPlanOrder(req, res, next) {
  try {
    const userId = req.user._id;
    const { planId, planName } = req.body || {};
    const cleanedPlanId = String(planId || "").trim();
    const cleanedPlanName = String(planName || "").trim();

    let plan = null;
    if (mongoose.isValidObjectId(cleanedPlanId)) {
      plan = await AdPlan.findOne({ _id: cleanedPlanId, active: true }).lean();
    }
    if (!plan && cleanedPlanName) {
      plan = await AdPlan.findOne({
        name: { $regex: `^${cleanedPlanName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, $options: "i" },
        active: true,
      }).lean();
    }
    if (!plan) {
      return res.status(400).json({ message: "Selected ad plan was not found or is inactive." });
    }

    const amountPaise = Math.round(Number(plan.price || 0) * 100);
    if (amountPaise <= 0) {
      return res.status(400).json({ message: "Ad plan amount must be greater than zero." });
    }

    const receipt = makeRazorpayReceipt("ads", userId, plan._id, Date.now());
    const order = await createRazorpayOrder({
      amount: amountPaise,
      receipt,
      notes: {
        purpose: "student_ad_plan",
        planId: String(plan._id),
        userId: String(userId),
      },
    });

    const payment = await Payment.create({
      user: userId,
      role: "student",
      purpose: "student_ad_plan",
      status: "created",
      planModel: "AdPlan",
      planId: plan._id,
      planName: plan.name,
      billingCycle: "one_time",
      amount: Number(plan.price || 0),
      currency: "INR",
      receipt,
      razorpayOrderId: order.id,
      notes: order.notes || {},
    });

    return res.json({
      ok: true,
      keyId: getRazorpayConfig().keyId,
      order: {
        id: order.id,
        amount: order.amount,
        currency: order.currency,
        receipt: order.receipt,
      },
      payment: {
        id: toId(payment),
        planName: plan.name,
        amount: Number(plan.price || 0),
      },
      user: {
        name: req.user?.name || "Student",
        email: req.user?.email || "",
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function verifyAdPlanPayment(req, res, next) {
  try {
    const userId = String(req.user._id);
    const {
      paymentId,
      razorpay_order_id: orderId,
      razorpay_payment_id: razorpayPaymentId,
      razorpay_signature: signature,
    } = req.body || {};

    if (!orderId || !razorpayPaymentId || !signature) {
      return res.status(400).json({ message: "Missing Razorpay payment verification fields." });
    }

    const isValid = verifyRazorpaySignature({
      orderId,
      paymentId: razorpayPaymentId,
      signature,
    });
    if (!isValid) return res.status(400).json({ message: "Invalid Razorpay signature." });

    const payment = await Payment.findOne({
      _id: String(paymentId || ""),
      user: userId,
      purpose: "student_ad_plan",
      razorpayOrderId: String(orderId),
    });
    if (!payment) return res.status(404).json({ message: "Payment record not found." });

    const adPlan = await AdPlan.findById(payment.planId).lean();
    if (!adPlan) return res.status(404).json({ message: "Ad plan not found." });

    const accessWindow = await activateStudentAdAccess({
      userId,
      adPlan,
      note: adPlan.description || "",
    });

    payment.status = "paid";
    payment.razorpayPaymentId = String(razorpayPaymentId);
    payment.razorpaySignature = String(signature);
    payment.paidAt = new Date();
    await payment.save();

    await Promise.all([
      StudentNotification.create({
        studentId: userId,
        type: "System",
        title: "Ad plan activated",
        description: "Your ad plan payment is verified. You can post ads now.",
        icon: "system",
        actions: ["Post Ad"],
        meta: { category: "ads-plan-payment", paymentId: toId(payment) },
        read: false,
      }),
      AdminNotification.create({
        title: "New ad plan payment",
        type: "Ads",
        target: "Admin",
        triggeredBy: req.user?.name || "Student",
        message: `${req.user?.name || "A student"} completed an ad plan payment.`,
        date: new Date().toISOString().slice(0, 10),
        audience: "Admins",
        status: "sent",
        mode: "immediate",
        createdBy: req.user._id,
      }),
    ]);

    return res.json({
      ok: true,
      message: "Payment verified and ad plan activated.",
      access: {
        canPost: true,
        planStatus: "approved",
        planName: adPlan.name,
        approvedAt: formatDate(accessWindow.approvedAt),
        expiresAt: formatDate(accessWindow.expiresAt),
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function createStudentAd(req, res, next) {
  try {
    const user = await User.findById(req.user._id).select("adAccess").lean();
    if (!user?.adAccess?.canPost || String(user?.adAccess?.planStatus || "") !== "approved") {
      return res.status(403).json({ message: "Buy and get approval for an ad plan before posting ads." });
    }

    const body = req.body || {};
    const title = String(body.title || "").trim();
    const mediaUrl = String(body.mediaUrl || "").trim();
    const mediaType = String(body.mediaType || "banner").trim().toLowerCase();

    if (!title) return res.status(400).json({ message: "Ad title is required." });
    if (!mediaUrl) return res.status(400).json({ message: "Media upload is required." });
    if (!["video", "banner", "pamphlet", "other"].includes(mediaType)) {
      return res.status(400).json({ message: "Invalid ad media type." });
    }

    const ad = await Advertisement.create({
      user: req.user._id,
      title,
      description: String(body.description || "").trim(),
      mediaType,
      sourceType: String(body.sourceType || "upload").trim().toLowerCase() === "link" ? "link" : "upload",
      mediaUrl,
      mediaPublicId: String(body.mediaPublicId || "").trim(),
      mediaResourceType: String(body.mediaResourceType || "image").trim(),
      mimeType: String(body.mimeType || "").trim(),
      ctaLabel: String(body.ctaLabel || "Learn More").trim() || "Learn More",
      targetUrl: String(body.targetUrl || "").trim(),
      contactLabel: String(body.contactLabel || "").trim(),
      audience: String(body.audience || "").trim(),
      placement: "student-home",
      status: "active",
      approvedAt: new Date(),
    });

    await StudentNotification.create({
      studentId: req.user._id,
      type: "System",
      title: "Ad posted successfully",
      description: "Your ad is now live on the student home page.",
      icon: "system",
      actions: ["View Home"],
      meta: { category: "ad-posted", adId: toId(ad) },
      read: false,
    });

    return res.json({
      ok: true,
      message: "Ad posted successfully.",
      ad: normalizeAd(ad),
    });
  } catch (err) {
    next(err);
  }
}
