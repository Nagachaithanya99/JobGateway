// backend/src/controllers/student/student.jobs.controller.js
import mongoose from "mongoose";
import Job from "../../models/Job.js";
import User from "../../models/User.js";
import Application from "../../models/Application.js";

/**
 * Helpers
 */
function toInt(v, d) {
  const n = parseInt(v, 10);
  return Number.isFinite(n) ? n : d;
}

function toNum(v, d) {
  const n = Number(v);
  return Number.isFinite(n) ? n : d;
}

function safeRegex(q) {
  // escape basic regex characters to avoid regex injection
  const s = String(q || "").trim();
  if (!s) return null;
  const esc = s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(esc, "i");
}

function mapJob(jobDoc) {
  // Keep rich info for JobDetails too (you can reuse same endpoint later)
  return {
    _id: jobDoc._id,
    title: jobDoc.title || "Job",
    stream: jobDoc.stream || "",
    category: jobDoc.category || "",
    subCategory: jobDoc.subCategory || "",
    jobType: jobDoc.jobType || "",
    workMode: jobDoc.workMode || jobDoc.mode || "",
    mode: jobDoc.mode || "",
    location: jobDoc.location || jobDoc.city || "",
    city: jobDoc.city || "",
    state: jobDoc.state || "",

    experience: jobDoc.experience || jobDoc.experienceText || "",
    experienceText: jobDoc.experienceText || "",

    salaryMin: jobDoc.salaryMin || 0,
    salaryMax: jobDoc.salaryMax || 0,
    salaryText: jobDoc.salaryText || "",
    overview: jobDoc.overview || "",
    description: jobDoc.description || jobDoc.overview || "",
    responsibilities: jobDoc.responsibilities || "",
    requirements: jobDoc.requirements || "",
    skills: Array.isArray(jobDoc.skills)
      ? jobDoc.skills
      : String(jobDoc.skills || "")
          .split(",")
          .map((x) => x.trim())
          .filter(Boolean),

    boostActive: Boolean(jobDoc.boostActive),
    status: jobDoc.status,

    company: jobDoc.company?._id || jobDoc.company,
    companyName: jobDoc.company?.name || jobDoc.companyName || "Company",
    companyEmail: jobDoc.company?.email || "",
    companyPhone: jobDoc.company?.phone || "",
    companyWebsite: jobDoc.company?.website || "",
    companyAddress: jobDoc.company?.location || "",

    createdAt: jobDoc.createdAt,
    updatedAt: jobDoc.updatedAt,
  };
}

/**
 * GET /api/student/jobs
 */
export const listStudentJobs = async (req, res, next) => {
  try {
    const {
      q,
      stream,
      category,
      subCategory,
      location,
      jobType,
      workMode,
      experience,
      salaryMin,
      salaryMax,
    } = req.query;

    const page = Math.max(1, toInt(req.query.page, 1));
    const limit = Math.min(50, Math.max(1, toInt(req.query.limit, 12)));
    const skip = (page - 1) * limit;

    const query = { status: "Active" };

    // text-ish search
    const rx = safeRegex(q);
    if (rx) {
      query.$or = [
        { title: rx },
        { stream: rx },
        { category: rx },
        { subCategory: rx },
        { location: rx },
        { city: rx },
        { state: rx },
        { skills: rx },
      ];
    }

    // exact-ish filters (case-insensitive)
    if (stream) query.stream = new RegExp(`^${String(stream).trim()}$`, "i");
    if (category) query.category = new RegExp(`^${String(category).trim()}$`, "i");
    if (subCategory) query.subCategory = new RegExp(`^${String(subCategory).trim()}$`, "i");
    if (jobType) query.jobType = new RegExp(`^${String(jobType).trim()}$`, "i");

    if (workMode) {
      // prefer strict matching on workMode/mode
      query.$and = [
        ...(query.$and || []),
        {
          $or: [
            { workMode: new RegExp(`^${String(workMode).trim()}$`, "i") },
            { mode: new RegExp(`^${String(workMode).trim()}$`, "i") },
          ],
        },
      ];
    }

    if (location) {
      const lrx = safeRegex(location);
      if (lrx) {
        query.$and = [
          ...(query.$and || []),
          { $or: [{ location: lrx }, { city: lrx }, { state: lrx }] },
        ];
      }
    }

    // Experience
    if (experience) {
      const erx = safeRegex(experience);
      if (erx) {
        query.$and = [
          ...(query.$and || []),
          { $or: [{ experience: erx }, { experienceText: erx }] },
        ];
      }
    }

    // Salary filter (LPA)
    const sMin = salaryMin !== undefined && salaryMin !== "" ? toNum(salaryMin, null) : null;
    const sMax = salaryMax !== undefined && salaryMax !== "" ? toNum(salaryMax, null) : null;

    if (sMin !== null) query.salaryMin = { ...(query.salaryMin || {}), $gte: sMin };
    if (sMax !== null) query.salaryMax = { ...(query.salaryMax || {}), $lte: sMax };

    const [total, docs] = await Promise.all([
      Job.countDocuments(query),
      Job.find(query)
        .populate("company", "name email phone website location")
        .sort({ boostActive: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
    ]);

    const items = docs.map(mapJob);

    return res.json({
      items,
      total,
      page,
      limit,
      pages: Math.max(1, Math.ceil(total / limit)),
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/student/jobs/:id
 */
export const getStudentJobById = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({ message: "Job not found" });
    }

    const doc = await Job.findOne({ _id: id, status: "Active" })
      .populate("company", "name email phone website location")
      .lean();

    if (!doc) return res.status(404).json({ message: "Job not found" });
    return res.json(mapJob(doc));
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/student/jobs/:id/apply
 */
export const applyStudentJob = async (req, res, next) => {
  try {
    const studentId = req.user._id;
    const { id } = req.params;

    const job = await Job.findOne({ _id: id, status: "Active" }).lean();
    if (!job) return res.status(404).json({ message: "Job not found" });

    const existing = await Application.findOne({ student: studentId, job: job._id }).lean();
    if (existing) {
      return res.status(200).json({
        ok: true,
        alreadyApplied: true,
        message: "Already applied for this job",
        applicationId: existing._id,
      });
    }

    const created = await Application.create({
      company: job.company,
      job: job._id,
      student: studentId,
      status: "Applied",
      experienceText: job.experience || job.experienceText || "",
    });

    return res.status(201).json({
      ok: true,
      alreadyApplied: false,
      message: "Application submitted",
      applicationId: created._id,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/student/me/saved-jobs
 */
export const listSavedJobs = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const {
      q = "",
      location = "",
      jobType = "",
      workMode = "",
      page = 1,
      limit = 12,
      withMeta = "",
    } = req.query || {};

    const user = await User.findById(userId)
      .populate({
        path: "savedJobs",
        populate: { path: "company", select: "name email" },
      })
      .lean();

    const items = (user?.savedJobs || []).map((job) => ({
      _id: job._id,
      id: String(job._id),
      title: job.title,
      company: job.company?._id,
      companyName: job.company?.name || "Company",
      location: job.location || job.city || "",
      experience: job.experience || job.experienceText || "",
      salary: job.salaryText || `${job.salaryMin}-${job.salaryMax} LPA`,
      jobType: job.jobType,
      workMode: job.workMode || job.mode,
      tags: [],
    }));

    const needsMeta = String(withMeta).trim() === "1";

    if (!needsMeta) {
      return res.json(items);
    }

    const qLower = String(q || "").trim().toLowerCase();
    const locationLower = String(location || "").trim().toLowerCase();
    const jobTypeLower = String(jobType || "").trim().toLowerCase();
    const workModeLower = String(workMode || "").trim().toLowerCase();

    const filtered = items.filter((item) => {
      if (qLower) {
        const text = `${item.title || ""} ${item.companyName || ""}`.toLowerCase();
        if (!text.includes(qLower)) return false;
      }
      if (locationLower && !String(item.location || "").toLowerCase().includes(locationLower)) return false;
      if (jobTypeLower && String(item.jobType || "").toLowerCase() !== jobTypeLower) return false;
      if (workModeLower && String(item.workMode || "").toLowerCase() !== workModeLower) return false;
      return true;
    });

    const pageNum = Math.max(1, Number(page) || 1);
    const limitNum = Math.max(1, Math.min(100, Number(limit) || 12));
    const total = filtered.length;
    const pages = Math.max(1, Math.ceil(total / limitNum));
    const start = (pageNum - 1) * limitNum;
    const rows = filtered.slice(start, start + limitNum);

    return res.json({
      rows,
      total,
      page: pageNum,
      limit: limitNum,
      pages,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/student/jobs/:id/save
 */
export const toggleSaveJob = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const alreadySaved = user.savedJobs.some((jobId) => jobId.toString() === id);

    if (alreadySaved) {
      user.savedJobs = user.savedJobs.filter((jobId) => jobId.toString() !== id);
      await user.save();
      return res.json({ saved: false });
    } else {
      user.savedJobs.push(id);
      await user.save();
      return res.json({ saved: true });
    }
  } catch (err) {
    next(err);
  }
};
