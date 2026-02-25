// backend/src/controllers/company/company.billing.controller.js
import Subscription from "../../models/Subscription.js";
import Plan from "../../models/Plan.js";

const DAYS_30 = 30 * 24 * 60 * 60 * 1000;
const DAYS_365 = 365 * 24 * 60 * 60 * 1000;
const UNLIMITED_THRESHOLD = 999999;

function toSafeLimit(v, fallback = 0) {
  if (typeof v === "string" && v.toLowerCase() === "unlimited") return UNLIMITED_THRESHOLD;
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function mapPlanForCompanyUi(planDoc) {
  const monthlyPrice = Number(planDoc.price || 0);
  const yearlyPrice = Math.round(monthlyPrice * 10);
  const monthlyJobs = toSafeLimit(planDoc.jobsLimit, 1);
  const monthlyApps = toSafeLimit(planDoc.appsLimit, 100);
  const prettyJobs = monthlyJobs >= UNLIMITED_THRESHOLD ? "Unlimited" : monthlyJobs;
  const prettyApps = monthlyApps >= UNLIMITED_THRESHOLD ? "Unlimited" : monthlyApps;

  return {
    id: String(planDoc._id),
    name: planDoc.name,
    tagline: planDoc.description || "Company hiring plan",
    features: [
      `${prettyJobs} jobs / month`,
      `${prettyApps} applications / month`,
      "Admin synced plan",
    ],
    monthlyPrice,
    yearlyPrice,
    monthly: {
      jobsLimit: monthlyJobs,
      appsLimit: monthlyApps,
    },
    yearly: {
      jobsLimit: monthlyJobs >= UNLIMITED_THRESHOLD ? UNLIMITED_THRESHOLD : monthlyJobs * 12,
      appsLimit: monthlyApps >= UNLIMITED_THRESHOLD ? UNLIMITED_THRESHOLD : monthlyApps * 12,
    },
  };
}

async function ensureSubscription(userId) {
  let sub = await Subscription.findOne({ company: userId });
  if (!sub) {
    sub = await Subscription.create({
      company: userId,
      planName: "Starter",
      billingCycle: "monthly",
      price: 0,
      start: null,
      end: null,
      status: "inactive",
      jobsLimit: 1,
      jobsUsed: 0,
      appsLimit: 100,
      appsUsed: 0,
    });
  }
  return sub;
}

function activeNow(sub) {
  if (!sub) return false;
  if (sub.status !== "active") return false;
  if (!sub.start || !sub.end) return false;
  const now = Date.now();
  return now >= new Date(sub.start).getTime() && now <= new Date(sub.end).getTime();
}

function toISODate(d) {
  return d ? new Date(d).toISOString().slice(0, 10) : "";
}

export async function listPlans(req, res, next) {
  try {
    const rows = await Plan.find({ active: true }).sort({ price: 1, name: 1 }).lean();
    const items = rows.map(mapPlanForCompanyUi);
    return res.json({ items });
  } catch (e) {
    next(e);
  }
}

export async function getMyBilling(req, res, next) {
  try {
    const userId = req.user._id;
    const sub = await ensureSubscription(userId);

    if (sub.status === "active" && sub.end && Date.now() > new Date(sub.end).getTime()) {
      sub.status = "inactive";
      await sub.save();
    }

    const isActive = activeNow(sub);

    return res.json({
      subscription: {
        planName: sub.planName,
        billingCycle: sub.billingCycle || "monthly",
        price: Number(sub.price || 0),
        status: isActive ? "active" : "inactive",
        startDate: toISODate(sub.start),
        endDate: toISODate(sub.end),
        jobsLimit: sub.jobsLimit,
        jobsUsed: sub.jobsUsed,
        applicationsLimit: sub.appsLimit,
        applicationsUsed: sub.appsUsed,
      },
    });
  } catch (e) {
    next(e);
  }
}

export async function subscribePlan(req, res, next) {
  try {
    const userId = req.user._id;
    const { planId, cycle } = req.body;

    const planDoc = await Plan.findOne({ _id: planId, active: true }).lean();
    const plan = planDoc ? mapPlanForCompanyUi(planDoc) : null;
    if (!plan) return res.status(400).json({ message: "Invalid planId" });

    const billingCycle = cycle === "yearly" ? "yearly" : "monthly";
    const duration = billingCycle === "yearly" ? DAYS_365 : DAYS_30;

    const limits = billingCycle === "yearly" ? plan.yearly : plan.monthly;
    const price = billingCycle === "yearly" ? plan.yearlyPrice : plan.monthlyPrice;

    const sub = await ensureSubscription(userId);

    sub.planName = plan.name;
    sub.billingCycle = billingCycle;
    sub.price = price;

    sub.status = "active";
    sub.start = new Date();
    sub.end = new Date(Date.now() + duration);

    sub.jobsLimit = limits.jobsLimit;
    sub.appsLimit = limits.appsLimit;

    sub.jobsUsed = 0;
    sub.appsUsed = 0;

    await sub.save();

    return res.json({
      message: `Subscribed to ${plan.name} (${billingCycle})`,
      subscription: {
        planName: sub.planName,
        billingCycle: sub.billingCycle,
        price: Number(sub.price || 0),
        status: "active",
        startDate: toISODate(sub.start),
        endDate: toISODate(sub.end),
        jobsLimit: sub.jobsLimit,
        jobsUsed: sub.jobsUsed,
        applicationsLimit: sub.appsLimit,
        applicationsUsed: sub.appsUsed,
      },
    });
  } catch (e) {
    next(e);
  }
}

export async function cancelSubscription(req, res, next) {
  try {
    const userId = req.user._id;
    const sub = await ensureSubscription(userId);

    sub.status = "inactive";
    await sub.save();

    return res.json({ message: "Subscription cancelled", ok: true });
  } catch (e) {
    next(e);
  }
}
