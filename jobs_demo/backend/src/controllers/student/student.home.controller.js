// backend/src/controllers/student/student.home.controller.js
import mongoose from "mongoose";
import Job from "../../models/Job.js";
import User from "../../models/User.js";
import Application from "../../models/Application.js";
import ContentItem from "../../models/ContentItem.js";
import GovernmentUpdate from "../../models/GovernmentUpdate.js";

function safeStr(x) {
  return typeof x === "string" ? x : "";
}

function toSalaryText(job) {
  if (safeStr(job.salaryText)) return job.salaryText;

  const min = Number(job.salaryMin || 0);
  const max = Number(job.salaryMax || 0);

  if (min || max) {
    const a = min ? `${min}` : "";
    const b = max ? `${max}` : "";
    return `Rs ${a}${min && max ? "-" : ""}${b}`;
  }

  return safeStr(job.salary) || "";
}

function toStipendText(job) {
  if (safeStr(job.stipendText)) return job.stipendText;

  const min = Number(job.stipendMin || 0);
  const max = Number(job.stipendMax || 0);

  if (min || max) {
    const a = min ? `${min}` : "";
    const b = max ? `${max}` : "";
    return `Rs ${a}${min && max ? "-" : ""}${b}/mo`;
  }

  const s = toSalaryText(job);
  return s ? `${s}${s.includes("/mo") ? "" : "/mo"}` : "";
}

function companyIdOf(jobDoc) {
  if (!jobDoc?.company) return "";
  if (typeof jobDoc.company === "string") return jobDoc.company;
  if (jobDoc.company?._id) return String(jobDoc.company._id);
  return String(jobDoc.company);
}

function mapJob(jobDoc, companyMap) {
  const cid = companyIdOf(jobDoc);
  const companyName = companyMap.get(cid) || jobDoc.companyName || "Company";

  return {
    _id: jobDoc._id,
    title: jobDoc.title || "Job",
    company: cid || jobDoc.company,
    companyName,
    experience: jobDoc.experience || jobDoc.experienceText || "",
    experienceText: jobDoc.experienceText || jobDoc.experience || "",
    salaryMin: jobDoc.salaryMin || 0,
    salaryMax: jobDoc.salaryMax || 0,
    salaryText: toSalaryText(jobDoc),
    salary: jobDoc.salaryText || "",
    location: jobDoc.location || jobDoc.city || "",
    city: jobDoc.city || "",
    state: jobDoc.state || "",
    category: jobDoc.category || "",
    stream: jobDoc.stream || "",
    subCategory: jobDoc.subCategory || "",
    jobType: jobDoc.jobType || "",
    workMode: jobDoc.workMode || jobDoc.mode || "",
    mode: jobDoc.mode || "",
    boostActive: Boolean(jobDoc.boostActive),
    createdAt: jobDoc.createdAt,
  };
}

function mapInternship(jobDoc, companyMap) {
  const cid = companyIdOf(jobDoc);
  const companyName = companyMap.get(cid) || jobDoc.companyName || "Company";

  return {
    _id: jobDoc._id,
    title: jobDoc.title || "Internship",
    company: cid || jobDoc.company,
    companyName,
    location: jobDoc.location || jobDoc.city || "",
    city: jobDoc.city || "",
    stipendMin: jobDoc.stipendMin || jobDoc.salaryMin || 0,
    stipendMax: jobDoc.stipendMax || jobDoc.salaryMax || 0,
    stipendText: toStipendText(jobDoc),
    createdAt: jobDoc.createdAt,
  };
}

async function loadCompanyMap(...lists) {
  const ids = [];
  for (const list of lists) {
    for (const item of list || []) {
      const cid = companyIdOf(item);
      if (mongoose.Types.ObjectId.isValid(cid)) ids.push(cid);
    }
  }

  const unique = Array.from(new Set(ids));
  if (!unique.length) return new Map();

  const users = await User.find({ _id: { $in: unique } })
    .select("name")
    .lean();

  const map = new Map();
  for (const u of users) map.set(String(u._id), u.name || "Company");
  return map;
}

export const getStudentHome = async (req, res, next) => {
  try {
    const [categoryItems, testimonialItems, gov, jobsDocs, internshipsDocs, liveJobs, topCompanies, studentsHired] = await Promise.all([
      ContentItem.find({ type: "CATEGORY", status: "Active" })
        .sort({ priority: -1, createdAt: -1 })
        .limit(30)
        .lean(),
      ContentItem.find({ type: "TESTIMONIAL", status: "Active" })
        .sort({ priority: -1, createdAt: -1 })
        .limit(12)
        .lean(),
      GovernmentUpdate.find({ status: "Active" })
        .sort({ priority: -1, publishedAt: -1, createdAt: -1 })
        .limit(8)
        .lean(),
      Job.find({ status: "Active" })
        .sort({ boostActive: -1, createdAt: -1 })
        .limit(12)
        .lean(),
      Job.find({
        status: "Active",
        $or: [
          { jobType: { $regex: /^internship$/i } },
          { category: { $regex: /intern/i } },
          { title: { $regex: /intern/i } },
        ],
      })
        .sort({ boostActive: -1, createdAt: -1 })
        .limit(6)
        .lean(),
      Job.countDocuments({ status: "Active" }),
      User.countDocuments({ role: "company", isActive: true }),
      Application.countDocuments({}),
    ]);

    let categories = categoryItems
      .map((c) => c?.data?.label || c?.title)
      .filter(Boolean);

    const testimonials = testimonialItems.map((t) => ({
      id: String(t._id),
      name: t?.data?.name || t?.title || "Student",
      quote: t?.data?.quote || t?.description || "",
      company: t?.data?.company || t?.subtitle || "",
      imageUrl: t?.imageUrl || "",
    }));

    const governmentLinks = gov
      .map((g) => ({
        id: String(g._id),
        title: g.title || "",
        link: g.link || "",
      }))
      .filter((g) => g.title);

    const companyMap = await loadCompanyMap(jobsDocs, internshipsDocs);
    const jobs = jobsDocs.map((j) => mapJob(j, companyMap));
    const internships = internshipsDocs.map((j) => mapInternship(j, companyMap));

    if (!categories.length) {
      const fromJobs = [];
      for (const j of jobsDocs) {
        if (j?.category) fromJobs.push(j.category);
        if (j?.stream && !fromJobs.includes(j.stream)) fromJobs.push(j.stream);
      }
      categories = Array.from(new Set(fromJobs)).slice(0, 12);
    }

    return res.json({
      categories,
      internships,
      jobs,
      stats: {
        liveJobs,
        topCompanies,
        studentsHired,
      },
      governmentLinks,
      testimonials,
    });
  } catch (err) {
    next(err);
  }
};
