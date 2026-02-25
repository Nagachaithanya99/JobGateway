// backend/src/controllers/admin/admin.jobs.controller.js
import mongoose from "mongoose";
import Job from "../../models/Job.js";

function safeInt(v, fallback) {
  const n = parseInt(v, 10);
  return Number.isFinite(n) ? n : fallback;
}

function normalizeStatusIn(value = "all") {
  const v = String(value || "all").toLowerCase();
  if (v === "all") return "all";
  if (v === "active") return "Active";
  if (v === "closed") return "Closed";
  if (v === "draft") return "Draft";
  if (v === "disabled") return "Disabled";
  return "all";
}

function normalizeStatusOut(value = "") {
  const v = String(value || "").toLowerCase();
  if (v === "active") return "Active";
  if (v === "closed") return "Closed";
  if (v === "draft") return "Draft";
  if (v === "disabled") return "Disabled";
  return value || "Active";
}

function normalizeRow(jobDoc) {
  const companyName =
    jobDoc?.company?.name ||
    jobDoc?.companyName ||
    jobDoc?.company?.companyName ||
    "-";

  const applications =
    jobDoc?.applicationsCount ??
    jobDoc?.applications ??
    jobDoc?.stats?.applications ??
    0;

  return {
    id: String(jobDoc._id),
    title: jobDoc.title || "-",
    companyName,
    stream: jobDoc.stream || jobDoc.mainStream || "-",
    category: jobDoc.category || "-",
    location: jobDoc.location || "-",
    salary: jobDoc.salary || "-",
    experience: jobDoc.experience || "-",
    applications,
    status: normalizeStatusOut(jobDoc.status),
    createdAt: jobDoc.createdAt
      ? new Date(jobDoc.createdAt).toISOString().slice(0, 10)
      : "-",
  };
}

export const adminListJobs = async (req, res, next) => {
  try {
    const {
      q = "",
      status = "all",
      company = "all",
      stream = "all",
      category = "all",
      location = "all",
      minApplications = "",
      postedAfter = "",
      page = "1",
      limit = "50",
    } = req.query;

    const pg = Math.max(1, safeInt(page, 1));
    const lim = Math.min(200, Math.max(1, safeInt(limit, 50)));
    const skip = (pg - 1) * lim;

    const filter = {};

    const normStatus = normalizeStatusIn(status);
    if (normStatus !== "all") filter.status = normStatus;

    if (stream && stream !== "all") filter.stream = stream;
    if (category && category !== "all") filter.category = category;
    if (location && location !== "all") filter.location = location;

    if (postedAfter) {
      const dt = new Date(postedAfter);
      if (!Number.isNaN(dt.getTime())) filter.createdAt = { $gte: dt };
    }

    if (company && company !== "all") {
      if (mongoose.Types.ObjectId.isValid(company)) {
        filter.company = company;
      } else {
        filter.companyName = company;
      }
    }

    const queryText = String(q || "").trim();
    if (queryText) {
      filter.$or = [
        { title: { $regex: queryText, $options: "i" } },
        { category: { $regex: queryText, $options: "i" } },
        { stream: { $regex: queryText, $options: "i" } },
        { location: { $regex: queryText, $options: "i" } },
        { salary: { $regex: queryText, $options: "i" } },
        { experience: { $regex: queryText, $options: "i" } },
        { companyName: { $regex: queryText, $options: "i" } },
      ];
    }

    const minApps = safeInt(minApplications, 0);
    if (minApps > 0) {
      filter.$and = filter.$and || [];
      filter.$and.push({
        $or: [
          { applicationsCount: { $gte: minApps } },
          { applications: { $gte: minApps } },
          { "stats.applications": { $gte: minApps } },
        ],
      });
    }

    const [total, jobs] = await Promise.all([
      Job.countDocuments(filter),
      Job.find(filter)
        .populate("company", "name companyName")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(lim)
        .lean(),
    ]);

    const rows = (jobs || []).map(normalizeRow);

    return res.json({
      rows,
      page: pg,
      limit: lim,
      total,
    });
  } catch (err) {
    next(err);
  }
};

export const adminGetJobById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const job = await Job.findById(id)
      .populate("company", "name companyName email phone website")
      .lean();

    if (!job) return res.status(404).json({ message: "Job not found" });

    return res.json({ job: normalizeRow(job), raw: job });
  } catch (err) {
    next(err);
  }
};

export const adminUpdateJobStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const nextStatus = normalizeStatusIn(req.body?.status || "");
    const allowed = ["Active", "Disabled", "Closed", "Draft"];

    if (!allowed.includes(nextStatus)) {
      return res.status(400).json({
        message: `Invalid status. Allowed: ${allowed.join(", ")}`,
      });
    }

    const job = await Job.findByIdAndUpdate(
      id,
      { $set: { status: nextStatus } },
      { returnDocument: "after" }
    )
      .populate("company", "name companyName")
      .lean();

    if (!job) return res.status(404).json({ message: "Job not found" });

    return res.json({
      ok: true,
      job: normalizeRow(job),
    });
  } catch (err) {
    next(err);
  }
};

export const adminDeleteJob = async (req, res, next) => {
  try {
    const { id } = req.params;

    const deleted = await Job.findByIdAndDelete(id).lean();
    if (!deleted) return res.status(404).json({ message: "Job not found" });

    return res.json({ ok: true, id });
  } catch (err) {
    next(err);
  }
};
