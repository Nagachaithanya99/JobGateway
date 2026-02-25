// backend/src/controllers/admin/admin.applicants.controller.js
import mongoose from "mongoose";
import Application from "../../models/Application.js";

/**
 * Small helper: ensure caller is admin (works even if you don't have req.user yet)
 * - If your project already sets req.user.role, it will use it.
 * - Else it tries Clerk session claims.
 */
function assertAdmin(req) {
  const roleFromReqUser = req.user?.role;
  const claims = req.auth()?.sessionClaims || {};
  const roleFromClerk =
    claims?.publicMetadata?.role ||
    claims?.metadata?.role ||
    claims?.role;

  const role = roleFromReqUser || roleFromClerk;

  if (String(role || "").toLowerCase() !== "admin") {
    const err = new Error("Forbidden: Admin only");
    err.status = 403;
    throw err;
  }
}

/** Convert DB enum -> UI label (lowercase for filters/buttons) */
function dbToUiStatus(dbStatus) {
  const s = String(dbStatus || "").toLowerCase();
  if (s === "applied") return "applied";
  if (s === "shortlisted") return "shortlisted";
  if (s === "hold") return "hold";
  if (s === "rejected") return "rejected";
  if (s === "interview scheduled") return "interview scheduled";
  return s || "applied";
}

/** Convert UI -> DB enum (Application schema enum uses Title Case) */
function uiToDbStatus(uiStatus) {
  const s = String(uiStatus || "").trim().toLowerCase();

  if (s === "applied") return "Applied";
  if (s === "shortlisted") return "Shortlisted";
  if (s === "hold") return "Hold";
  if (s === "rejected") return "Rejected";
  if (s === "interview scheduled" || s === "interview_scheduled") return "Interview Scheduled";

  // Allow sending DB exact value too
  if (uiStatus === "Applied" || uiStatus === "Shortlisted" || uiStatus === "Hold" || uiStatus === "Rejected" || uiStatus === "Interview Scheduled") {
    return uiStatus;
  }

  return null;
}

function safeDateOnly(d) {
  if (!d) return "";
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return "";
  return dt.toISOString().slice(0, 10);
}

function buildCompanyName(companyUser) {
  // adapt to whatever your User schema has
  return (
    companyUser?.companyName ||
    companyUser?.name ||
    companyUser?.email ||
    "Company"
  );
}

function mapApplicationRow(appDoc) {
  const job = appDoc.job || {};
  const companyUser = job.company || appDoc.company || {};
  const student = appDoc.student || {};

  return {
    id: String(appDoc._id),
    status: dbToUiStatus(appDoc.status),
    statusRaw: appDoc.status,
    appliedAt: safeDateOnly(appDoc.createdAt),
    createdAt: appDoc.createdAt,
    updatedAt: appDoc.updatedAt,

    // student info (whatever exists)
    student: {
      id: student._id ? String(student._id) : undefined,
      name: student.name || student.fullName || "",
      email: student.email || "",
      phone: student.phone || "",
      location: student.location || "",
      education: student.education || student.degree || "",
      experience: student.experience || student.experienceText || "",
      skills: Array.isArray(student.skills) ? student.skills : [],
      resumeUrl: student.resumeUrl || student.resume || "",
      profileCompletion: student.profileCompletion ?? 0,
      avatar: student.avatar || "",
    },

    // job info
    job: {
      id: job._id ? String(job._id) : undefined,
      title: job.title || "",
      stream: job.stream || "",
      category: job.category || "",
      subCategory: job.subCategory || "",
      location: job.location || `${job.city || ""}${job.state ? ", " + job.state : ""}`.trim(),
      experience: job.experience || job.experienceText || "",
      salary:
        job.salaryText ||
        (job.salaryMin || job.salaryMax
          ? `₹${job.salaryMin || 0} - ₹${job.salaryMax || 0}`
          : ""),
      companyName: buildCompanyName(companyUser),
      companyId: companyUser?._id ? String(companyUser._id) : (appDoc.company?._id ? String(appDoc.company._id) : undefined),
    },
  };
}

/**
 * GET /api/admin/applications
 * Query params:
 *  q, status, company, stream, jobId, fromDate, toDate, page, limit
 */
export const adminListApplications = async (req, res, next) => {
  try {
    assertAdmin(req);

    const {
      q = "",
      status = "all",
      company = "all",      // companyId or company name text
      stream = "all",
      jobId = "",
      fromDate = "",
      toDate = "",
      page = 1,
      limit = 20,
    } = req.query;

    const pageNum = Math.max(1, Number(page) || 1);
    const limitNum = Math.min(100, Math.max(1, Number(limit) || 20));
    const skip = (pageNum - 1) * limitNum;

    const filter = {};

    // status filter
    if (status && status !== "all") {
      const dbStatus = uiToDbStatus(status);
      if (dbStatus) filter.status = dbStatus;
    }

    // job filter
    if (jobId && mongoose.Types.ObjectId.isValid(jobId)) {
      filter.job = new mongoose.Types.ObjectId(jobId);
    }

    // date filter
    const from = fromDate ? new Date(fromDate) : null;
    const to = toDate ? new Date(toDate) : null;

    if (from && !Number.isNaN(from.getTime())) {
      filter.createdAt = { ...(filter.createdAt || {}), $gte: from };
    }
    if (to && !Number.isNaN(to.getTime())) {
      // include end-of-day
      const end = new Date(to);
      end.setHours(23, 59, 59, 999);
      filter.createdAt = { ...(filter.createdAt || {}), $lte: end };
    }

    // We will do text search after populate (q/company/stream)
    const docs = await Application.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .populate({ path: "student", select: "name fullName email phone location education degree experience experienceText skills resumeUrl resume profileCompletion avatar" })
      .populate({
        path: "job",
        select: "title stream category subCategory location city state experience experienceText salaryText salaryMin salaryMax company",
        populate: { path: "company", select: "name companyName email" },
      })
      .populate({ path: "company", select: "name companyName email" })
      .lean();

    // Map + apply extra filters (q/company/stream) safely
    const mapped = docs.map(mapApplicationRow);

    const qText = String(q || "").trim().toLowerCase();
    const companyText = String(company || "").trim().toLowerCase();

    const filtered = mapped.filter((row) => {
      // stream filter
      const matchStream = stream === "all" || String(row.job?.stream || "") === String(stream);

      // company filter (supports "all", companyId, or company name)
      let matchCompany = true;
      if (company !== "all" && company) {
        if (mongoose.Types.ObjectId.isValid(company)) {
          matchCompany = String(row.job?.companyId || "") === String(company);
        } else {
          matchCompany = String(row.job?.companyName || "").toLowerCase().includes(companyText);
        }
      }

      // q filter
      const matchQ =
        !qText ||
        `${row.student?.name} ${row.student?.email} ${row.job?.title} ${row.job?.companyName}`
          .toLowerCase()
          .includes(qText);

      return matchStream && matchCompany && matchQ;
    });

    // For correct pagination after filters, return meta based on filtered list
    const total = filtered.length;
    const rows = filtered.slice(0, limitNum); // already skip+limit from DB; still okay for now

    res.json({
      rows,
      page: pageNum,
      limit: limitNum,
      total,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/admin/applications/:id
 */
export const adminGetApplicationById = async (req, res, next) => {
  try {
    assertAdmin(req);

    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid id" });
    }

    const doc = await Application.findById(id)
      .populate({ path: "student", select: "name fullName email phone location education degree experience experienceText skills resumeUrl resume profileCompletion avatar" })
      .populate({
        path: "job",
        select: "title stream category subCategory location city state experience experienceText salaryText salaryMin salaryMax company",
        populate: { path: "company", select: "name companyName email" },
      })
      .populate({ path: "company", select: "name companyName email" })
      .lean();

    if (!doc) return res.status(404).json({ message: "Application not found" });

    res.json(mapApplicationRow(doc));
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /api/admin/applications/:id/status
 * body: { status: "shortlisted" | "hold" | "rejected" | "applied" | "interview scheduled" }
 */
export const adminUpdateApplicationStatus = async (req, res, next) => {
  try {
    assertAdmin(req);

    const { id } = req.params;
    const { status } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid id" });
    }

    const dbStatus = uiToDbStatus(status);
    if (!dbStatus) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const updated = await Application.findByIdAndUpdate(
      id,
      { status: dbStatus },
      { returnDocument: "after" }
    )
      .populate({ path: "student", select: "name fullName email phone location education degree experience experienceText skills resumeUrl resume profileCompletion avatar" })
      .populate({
        path: "job",
        select: "title stream category subCategory location city state experience experienceText salaryText salaryMin salaryMax company",
        populate: { path: "company", select: "name companyName email" },
      })
      .populate({ path: "company", select: "name companyName email" })
      .lean();

    if (!updated) return res.status(404).json({ message: "Application not found" });

    res.json({ ok: true, application: mapApplicationRow(updated) });
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/admin/applications/:id
 */
export const adminDeleteApplication = async (req, res, next) => {
  try {
    assertAdmin(req);

    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid id" });
    }

    const deleted = await Application.findByIdAndDelete(id).lean();
    if (!deleted) return res.status(404).json({ message: "Application not found" });

    res.json({ ok: true, id });
  } catch (err) {
    next(err);
  }
};
