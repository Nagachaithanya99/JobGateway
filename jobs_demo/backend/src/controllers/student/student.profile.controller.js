import generateResumePDF from "../../utils/pdfGenerator.js";
import Application from "../../models/Application.js";
import MessageThread from "../../models/MessageThread.js";
import User from "../../models/User.js";

function safeStr(x) {
  return typeof x === "string" ? x : "";
}
function safeObj(x) {
  return x && typeof x === "object" ? x : {};
}
function safeArr(x) {
  return Array.isArray(x) ? x : [];
}
function toStringArray(value) {
  if (Array.isArray(value)) {
    return value
      .flatMap((v) => String(v ?? "").split(/[\n,;/|]+/g))
      .map((v) => v.trim())
      .filter(Boolean);
  }
  if (typeof value === "string") {
    return value
      .split(/[\n,;/|]+/g)
      .map((v) => v.trim())
      .filter(Boolean);
  }
  return [];
}

function normalizeSkillCount(skills = []) {
  return safeArr(skills)
    .flatMap((s) =>
      String(typeof s === "string" ? s : s?.name || s?.skill || "").split(",")
    )
    .map((s) => s.trim())
    .filter(Boolean).length;
}

function hasValidEducation(education = []) {
  return safeArr(education).some((e) => e?.degree && e?.college && e?.year);
}

// Same logic as frontend completion
function calcProfileCompletion(studentProfile, resumeUrl, resumeDoc = {}) {
  const p = safeObj(studentProfile);

  const personal = safeObj(p.personal);
  const education = safeArr(p.education);
  const skills = safeArr(p.skills);
  const experience = safeArr(p.experience);
  const preferred = safeObj(p.preferred);

  const resume = safeObj(resumeDoc);
  const resumeSectionsFilled =
    Boolean(safeObj(resume.personal).name || safeObj(resume.personal).email) ||
    safeArr(resume.education).length > 0 ||
    safeArr(resume.skills).length > 0 ||
    safeArr(resume.experience).length > 0;

  const checks = {
    personal: !!(personal.fullName && personal.phone && personal.city && personal.state),
    education: hasValidEducation(education),
    skills: normalizeSkillCount(skills) >= 2,
    experience: p.fresher === true || experience.some((e) => e.company && e.role),
    resume: !!(p.resumeMeta?.fileName || p.resumeMeta?.updatedAt || resumeUrl || resumeSectionsFilled),
    preferred:
      !!safeStr(preferred.stream).trim() &&
      !!safeStr(preferred.category).trim() &&
      toStringArray(preferred.locations).length > 0,
  };

  const total = Object.keys(checks).length;
  const done = Object.values(checks).filter(Boolean).length;
  return Math.round((done / total) * 100);
}

/**
 * GET /api/student/me
 */
export const getStudentMe = async (req, res, next) => {
  try {
    const me = await User.findById(req.user._id).lean();
    if (!me) return res.status(404).json({ message: "Student not found" });

    const profileCompletion = calcProfileCompletion(me.studentProfile, me.resumeUrl, me.resume);
    return res.json({ ...me, profileCompletion });
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /api/student/me
 */
export const updateStudentMe = async (req, res, next) => {
  try {
    const body = req.body || {};

    const existing = await User.findById(req.user._id).lean();
    if (!existing) return res.status(404).json({ message: "Student not found" });

    const patch = {};
    if (typeof body.name === "string") patch.name = body.name;
    if (typeof body.phone === "string") patch.phone = body.phone;
    if (typeof body.location === "string") patch.location = body.location;
    if (typeof body.linkedin === "string") patch.linkedin = body.linkedin;
    if (typeof body.portfolio === "string") patch.portfolio = body.portfolio;

    if (body.studentProfile && typeof body.studentProfile === "object") {
      const existingProfile = safeObj(existing.studentProfile);
      const incomingProfile = safeObj(body.studentProfile);
      const incomingPersonal = safeObj(incomingProfile.personal);
      const incomingPreferred = safeObj(incomingProfile.preferred);

      const mergedPreferred = {
        ...safeObj(existingProfile.preferred),
        ...incomingPreferred,
      };

      if (!mergedPreferred.subCategory && mergedPreferred.subcategory) {
        mergedPreferred.subCategory = mergedPreferred.subcategory;
      }
      if (!mergedPreferred.subcategory && mergedPreferred.subCategory) {
        mergedPreferred.subcategory = mergedPreferred.subCategory;
      }
      if (incomingPreferred.locations !== undefined) {
        mergedPreferred.locations = toStringArray(incomingPreferred.locations);
      } else {
        mergedPreferred.locations = toStringArray(mergedPreferred.locations);
      }

      // ✅ allow skills in any format (array OR string)
      let mergedSkills = incomingProfile.skills;
      if (typeof mergedSkills === "string") {
        mergedSkills = mergedSkills
          .split(/[\n,;/|]+/g)
          .map((s) => s.trim())
          .filter(Boolean);
      }

      patch.studentProfile = {
        ...existingProfile,
        personal: {
          ...safeObj(existingProfile.personal),
          ...incomingPersonal,
        },
        education:
          incomingProfile.education !== undefined
            ? safeArr(incomingProfile.education)
            : safeArr(existingProfile.education),
        skills:
          incomingProfile.skills !== undefined
            ? safeArr(mergedSkills)
            : safeArr(existingProfile.skills),
        fresher:
          incomingProfile.fresher !== undefined
            ? !!incomingProfile.fresher
            : existingProfile.fresher !== undefined
            ? !!existingProfile.fresher
            : true,
        experience:
          incomingProfile.experience !== undefined
            ? safeArr(incomingProfile.experience)
            : safeArr(existingProfile.experience),
        preferred: mergedPreferred,
        resumeMeta: {
          ...safeObj(existingProfile.resumeMeta),
          ...safeObj(incomingProfile.resumeMeta),
        },
      };

      // Sync some fields to top-level
      if (!patch.name && typeof incomingPersonal.fullName === "string") {
        patch.name = incomingPersonal.fullName;
      }
      if (!patch.phone && typeof incomingPersonal.phone === "string") {
        patch.phone = incomingPersonal.phone;
      }
      if (!patch.location) {
        if (typeof incomingPersonal.location === "string" && incomingPersonal.location) {
          patch.location = incomingPersonal.location;
        } else if (typeof incomingPersonal.city === "string" && incomingPersonal.city) {
          patch.location = incomingPersonal.city;
        }
      }
      if (!patch.linkedin && typeof incomingPersonal.linkedin === "string") {
        patch.linkedin = incomingPersonal.linkedin;
      }
      if (!patch.portfolio && typeof incomingPersonal.portfolio === "string") {
        patch.portfolio = incomingPersonal.portfolio;
      }
    }

    // ✅ IMPORTANT: mongoose v8+ use returnDocument:'after'
    const updated = await User.findOneAndUpdate(
      { _id: req.user._id },
      { $set: patch },
      { returnDocument: "after" }
    ).lean();

    const profileCompletion = calcProfileCompletion(updated.studentProfile, updated.resumeUrl, updated.resume);
    return res.json({ ...updated, profileCompletion });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/student/me/applications
 */
export const listMyApplications = async (req, res, next) => {
  try {
    const studentId = req.user._id;
    const { status = "", company = "", dateApplied = "", page = 1, limit = 10 } = req.query || {};

    const apps = await Application.find({ student: studentId })
      .populate({
        path: "job",
        select:
          "title location city state stream category subCategory jobType workMode mode experience experienceText salary salaryText salaryMin salaryMax company",
        populate: { path: "company", select: "name email phone phoneNumber contactNumber" },
      })
      .sort({ createdAt: -1 })
      .lean();

    const appIds = apps.map((a) => a._id).filter(Boolean);
    const threads = await MessageThread.find({
      application: { $in: appIds },
      student: studentId,
    })
      .select("application _id")
      .lean();

    const threadMap = new Map(threads.map((t) => [String(t.application), String(t._id)]));

    const mapped = apps.map((a) => {
      const job = a.job || {};
      const companyDoc = job.company || {};
      const st = a.status || "Applied";

      let response = "";
      let hasResponse = false;

      if (st !== "Applied") {
        hasResponse = true;
        if (st === "Shortlisted") response = "You have been shortlisted. Employer may contact you soon.";
        else if (st === "Hold") response = "Your application is on hold. Please wait for the next update.";
        else if (st === "Rejected") response = "Application not selected for this role.";
        else if (st === "Interview Scheduled") response = "Interview scheduled. Check notifications/messages.";
        else response = "Status updated by employer.";
      }

      const toSalaryText = () => {
        if (safeStr(job?.salaryText)) return job.salaryText;
        const min = Number(job?.salaryMin || 0);
        const max = Number(job?.salaryMax || 0);
        if (min || max) return `${min}-${max} LPA`;
        return safeStr(job?.salary) || "";
      };

      const phone =
        safeStr(companyDoc?.phone) ||
        safeStr(companyDoc?.phoneNumber) ||
        safeStr(companyDoc?.contactNumber) ||
        "";

      return {
        id: String(a._id),
        applicationId: String(a._id),
        conversationId: threadMap.get(String(a._id)) || "",
        jobId: job?._id ? String(job._id) : "",
        title: job?.title || "Job",
        company: companyDoc?.name || "Company",
        location: job?.location || job?.city || "",
        stream: job?.stream || "",
        category: job?.category || "",
        subCategory: job?.subCategory || "",
        jobType: job?.jobType || "",
        workMode: job?.workMode || job?.mode || "",
        experience: job?.experienceText || job?.experience || a.experienceText || "",
        salary: toSalaryText(),
        appliedOn: a.createdAt,
        status: st,
        phone,
        email: safeStr(companyDoc?.email),
        hasResponse,
        response,
      };
    });

    const statusFilter = String(status || "").trim().toLowerCase();
    const companyFilter = String(company || "").trim().toLowerCase();
    const dateFilter = String(dateApplied || "").trim();

    const filtered = mapped.filter((item) => {
      if (statusFilter && statusFilter !== "all" && String(item.status || "").toLowerCase() !== statusFilter) return false;
      if (companyFilter && !String(item.company || "").toLowerCase().includes(companyFilter)) return false;
      if (dateFilter) {
        const applied = item.appliedOn ? String(item.appliedOn).slice(0, 10) : "";
        if (applied !== dateFilter) return false;
      }
      return true;
    });

    const pageNum = Math.max(1, Number(page) || 1);
    const limitNum = Math.max(1, Math.min(100, Number(limit) || 10));
    const total = filtered.length;
    const pages = Math.max(1, Math.ceil(total / limitNum));
    const start = (pageNum - 1) * limitNum;
    const rows = filtered.slice(start, start + limitNum);

    return res.json({ rows, total, page: pageNum, limit: limitNum, pages });
  } catch (err) {
    next(err);
  }
};

// Resume endpoints (unchanged logic)
export const getMyResume = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).lean();
    if (!user) return res.status(404).json({ message: "Student not found" });

    const resume = user.resume || {};
    const sp = user.studentProfile || {};
    const personal = sp.personal || {};

    const merged = {
      ...resume,
      personal: {
        ...(resume.personal || {}),
        name: resume?.personal?.name || user.name || personal.fullName || "",
        email: resume?.personal?.email || user.email || "",
        phone: resume?.personal?.phone || user.phone || personal.phone || "",
        location: resume?.personal?.location || user.location || "",
        linkedin: resume?.personal?.linkedin || user.linkedin || "",
        portfolio: resume?.personal?.portfolio || user.portfolio || "",
      },
      education:
        Array.isArray(resume.education) && resume.education.length
          ? resume.education
          : Array.isArray(sp.education)
          ? sp.education
          : [],
      skills:
        Array.isArray(resume.skills) && resume.skills.length
          ? resume.skills
          : Array.isArray(sp.skills)
          ? sp.skills
          : [],
      experience:
        Array.isArray(resume.experience) && resume.experience.length
          ? resume.experience
          : Array.isArray(sp.experience)
          ? sp.experience
          : [],
    };

    return res.json(merged);
  } catch (err) {
    next(err);
  }
};

export const saveMyResume = async (req, res, next) => {
  try {
    const resumeData = req.body || {};
    const existing = await User.findById(req.user._id).lean();
    if (!existing) return res.status(404).json({ message: "Student not found" });

    const personal = safeObj(resumeData.personal);
    const resumeSkills = safeArr(resumeData.skills).map((x) => String(x || "").trim()).filter(Boolean);
    const resumeEducation = safeArr(resumeData.education);
    const resumeExperience = safeArr(resumeData.experience);

    const oldSp = safeObj(existing.studentProfile);
    const oldPersonal = safeObj(oldSp.personal);

    const patch = {
      resume: resumeData,
      name: safeStr(personal.name) || safeStr(existing.name),
      phone: safeStr(personal.phone) || safeStr(existing.phone),
      location: safeStr(personal.location) || safeStr(existing.location),
      linkedin: safeStr(personal.linkedin) || safeStr(existing.linkedin),
      portfolio: safeStr(personal.portfolio) || safeStr(existing.portfolio),
      studentProfile: {
        ...oldSp,
        personal: {
          ...oldPersonal,
          fullName: safeStr(personal.name) || safeStr(oldPersonal.fullName),
          phone: safeStr(personal.phone) || safeStr(oldPersonal.phone),
          city: safeStr(personal.location) || safeStr(oldPersonal.city),
          linkedin: safeStr(personal.linkedin) || safeStr(oldPersonal.linkedin),
          portfolio: safeStr(personal.portfolio) || safeStr(oldPersonal.portfolio),
          github: safeStr(personal.github) || safeStr(oldPersonal.github),
        },
        education: resumeEducation.length ? resumeEducation : safeArr(oldSp.education),
        skills: resumeSkills.length ? resumeSkills : safeArr(oldSp.skills),
        fresher: resumeExperience.length === 0 ? true : false,
        experience: resumeExperience.length ? resumeExperience : safeArr(oldSp.experience),
      },
    };

    await User.findOneAndUpdate(
      { _id: req.user._id },
      { $set: patch },
      { returnDocument: "after" }
    ).lean();

    return res.json(resumeData);
  } catch (err) {
    next(err);
  }
};

export const downloadResumePDF = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).lean();
    if (!user || !user.resume) return res.status(404).json({ message: "Resume not found" });

    const filePath = await generateResumePDF(user.resume, user.name);
    res.download(filePath, "resume.pdf");
  } catch (err) {
    next(err);
  }
};
