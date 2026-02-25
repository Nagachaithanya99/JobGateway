import mongoose from "mongoose";
import Plan from "../../models/Plan.js";
import PlanRequest from "../../models/PlanRequest.js";
import Subscription from "../../models/Subscription.js";
import User from "../../models/User.js";

function toId(x) {
  return String(x?._id || x?.id || x || "");
}

function formatDate(d) {
  if (!d) return "";
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return "";
  return dt.toISOString().slice(0, 10);
}

function addDays(dateLike, days) {
  const d = new Date(dateLike || Date.now());
  d.setDate(d.getDate() + Number(days || 0));
  return d;
}

function normalizePlan(plan) {
  return {
    id: toId(plan),
    name: plan.name || "",
    price: Number(plan.price || 0),
    jobsLimit: plan.jobsLimit ?? 1,
    appsLimit: plan.appsLimit ?? 100,
    durationDays: Number(plan.durationDays || 30),
    description: plan.description || "",
    active: Boolean(plan.active),
    highlight: Boolean(plan.highlight),
  };
}

function extractAdmin(req) {
  if (req.user && String(req.user.role || "").toLowerCase() === "admin") return req.user;
  return null;
}

export async function adminListPlans(req, res, next) {
  try {
    if (!extractAdmin(req)) return res.status(403).json({ message: "Forbidden" });

    const plans = await Plan.find({}).sort({ createdAt: -1 }).lean();
    return res.json({ rows: plans.map(normalizePlan) });
  } catch (e) {
    next(e);
  }
}

export async function adminSavePlan(req, res, next) {
  try {
    if (!extractAdmin(req)) return res.status(403).json({ message: "Forbidden" });

    const body = req.body || {};
    const id = body.id || body._id;
    const payload = {
      name: String(body.name || "").trim(),
      price: Number(body.price || 0),
      jobsLimit: body.jobsLimit ?? 1,
      appsLimit: body.appsLimit ?? 100,
      durationDays: Number(body.durationDays || 30),
      description: String(body.description || ""),
      active: body.active !== false,
      highlight: Boolean(body.highlight),
    };

    if (!payload.name) return res.status(400).json({ message: "Plan name is required" });

    let plan;
    if (id && mongoose.isValidObjectId(id)) {
      plan = await Plan.findByIdAndUpdate(id, { $set: payload }, { returnDocument: "after" }).lean();
      if (!plan) return res.status(404).json({ message: "Plan not found" });
    } else {
      try {
        plan = await Plan.create(payload);
        plan = plan.toObject();
      } catch (e) {
        if (e?.code === 11000) {
          const existing = await Plan.findOne({ name: payload.name });
          if (!existing) throw e;
          plan = await Plan.findByIdAndUpdate(
            existing._id,
            { $set: payload },
            { returnDocument: "after" },
          ).lean();
        } else {
          throw e;
        }
      }
    }

    return res.json({ ok: true, plan: normalizePlan(plan) });
  } catch (e) {
    next(e);
  }
}

export async function adminDeletePlan(req, res, next) {
  try {
    if (!extractAdmin(req)) return res.status(403).json({ message: "Forbidden" });
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) return res.status(400).json({ message: "Invalid plan id" });
    const deleted = await Plan.findByIdAndDelete(id).lean();
    if (!deleted) return res.status(404).json({ message: "Plan not found" });
    return res.json({ ok: true, id: toId(deleted) });
  } catch (e) {
    next(e);
  }
}

export async function adminListPlanRequests(req, res, next) {
  try {
    if (!extractAdmin(req)) return res.status(403).json({ message: "Forbidden" });
    const { status = "all", q = "" } = req.query;

    const filter = {};
    if (status !== "all") filter.status = String(status).toLowerCase();

    const requests = await PlanRequest.find(filter)
      .sort({ createdAt: -1 })
      .populate("company", "name email")
      .populate("planId", "name price durationDays")
      .lean();

    const companyIds = [...new Set(requests.map((r) => toId(r.company)).filter(Boolean))]
      .filter((id) => mongoose.isValidObjectId(id))
      .map((id) => new mongoose.Types.ObjectId(id));

    const subscriptions = companyIds.length
      ? await Subscription.find({ company: { $in: companyIds } }).sort({ createdAt: -1 }).lean()
      : [];

    const subMap = new Map();
    for (const s of subscriptions) {
      const key = toId(s.company);
      if (!subMap.has(key)) subMap.set(key, s);
    }

    const search = String(q || "").trim().toLowerCase();
    const rows = requests
      .map((r) => {
        const companyId = toId(r.company);
        const sub = subMap.get(companyId);
        const planName = r.planName || r.planId?.name || "";
        return {
          id: toId(r),
          companyId,
          companyName: r.company?.name || "Company",
          planId: toId(r.planId) || "",
          planName,
          amount: r.amount || (r.planId?.price ? `₹${r.planId.price}` : ""),
          utr: r.utr || "",
          transactionId: r.utr || "",
          paymentMethod: "Manual",
          createdAt: formatDate(r.requestedAt || r.createdAt),
          status: r.status || "pending",
          activationDate: sub && sub.status === "active" ? formatDate(sub.start) : "",
          expiryDate: sub && sub.status === "active" ? formatDate(sub.end) : "",
        };
      })
      .filter((row) => {
        if (!search) return true;
        return `${row.companyName} ${row.planName} ${row.transactionId}`.toLowerCase().includes(search);
      });

    return res.json({ rows });
  } catch (e) {
    next(e);
  }
}

export async function adminUpdatePlanRequest(req, res, next) {
  try {
    const me = extractAdmin(req);
    if (!me) return res.status(403).json({ message: "Forbidden" });

    const { id } = req.params;
    const { status } = req.body || {};
    const nextStatus = String(status || "").toLowerCase();

    if (!mongoose.isValidObjectId(id)) return res.status(400).json({ message: "Invalid request id" });
    if (!["approved", "rejected", "pending"].includes(nextStatus)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    let pr = await PlanRequest.findById(id).populate("planId", "name price durationDays").lean();
    if (!pr) return res.status(404).json({ message: "Plan request not found" });

    pr = await PlanRequest.findByIdAndUpdate(
      id,
      {
        $set: {
          status: nextStatus,
          decidedAt: new Date(),
          decidedBy: me._id,
        },
      },
      { returnDocument: "after" },
    )
      .populate("company", "name email")
      .populate("planId", "name price durationDays")
      .lean();

    let activationDate = "";
    let expiryDate = "";

    if (nextStatus === "approved") {
      const plan = pr.planId || (pr.planName ? await Plan.findOne({ name: pr.planName }).lean() : null);
      const durationDays = Number(plan?.durationDays || 30);
      const start = new Date();
      const end = addDays(start, durationDays);
      activationDate = formatDate(start);
      expiryDate = formatDate(end);

      await Subscription.findOneAndUpdate(
        { company: pr.company },
        {
          $set: {
            planName: pr.planName || plan?.name || "Plan",
            billingCycle: "monthly",
            price: Number(plan?.price || 0),
            start,
            end,
            status: "active",
            jobsLimit: Number(plan?.jobsLimit ?? 1),
            appsLimit: Number(plan?.appsLimit ?? 100),
          },
          $setOnInsert: {
            jobsUsed: 0,
            appsUsed: 0,
          },
        },
        { upsert: true, returnDocument: "after" },
      );
    }

    const row = {
      id: toId(pr),
      companyId: toId(pr.company),
      companyName: pr.company?.name || "Company",
      planId: toId(pr.planId) || "",
      planName: pr.planName || pr.planId?.name || "",
      amount: pr.amount || (pr.planId?.price ? `₹${pr.planId.price}` : ""),
      utr: pr.utr || "",
      transactionId: pr.utr || "",
      paymentMethod: "Manual",
      createdAt: formatDate(pr.requestedAt || pr.createdAt),
      status: pr.status || "pending",
      activationDate,
      expiryDate,
    };

    return res.json({ ok: true, request: row });
  } catch (e) {
    next(e);
  }
}
