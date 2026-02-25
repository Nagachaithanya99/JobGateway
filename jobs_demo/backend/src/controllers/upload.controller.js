// backend/src/controllers/upload.controller.js
import fs from "fs";
import path from "path";
import crypto from "crypto";
import User from "../models/User.js";

// ---------- helpers ----------
function safeObj(x) {
  return x && typeof x === "object" ? x : {};
}
function safeArr(x) {
  return Array.isArray(x) ? x : [];
}

// ✅ Fix 1: normalizeSkillCount supports more separators
function normalizeSkillCount(skills = []) {
  return safeArr(skills)
    .flatMap((s) =>
      String(typeof s === "string" ? s : s?.name || s?.skill || "").split(
        /[\n,;/|]+/g,
      ),
    )
    .map((s) => s.trim())
    .filter(Boolean).length;
}

function hasValidEducation(education = []) {
  return safeArr(education).some((e) => e?.degree && e?.college && e?.year);
}

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
    resume: !!(
      p.resumeMeta?.fileName ||
      p.resumeMeta?.updatedAt ||
      resumeUrl ||
      resumeSectionsFilled
    ),
    preferred: !!(preferred.stream && preferred.category && preferred.locations),
  };

  const total = Object.keys(checks).length;
  const done = Object.values(checks).filter(Boolean).length;
  return Math.round((done / total) * 100);
}

// ---------- controller ----------
export const uploadResume = async (req, res, next) => {
  try {
    const file = req.file;
    if (!file) return res.status(400).json({ message: "File is required" });

    const ext = (path.extname(file.originalname || "") || "").toLowerCase();
    const allowed = [".pdf", ".doc", ".docx"];
    if (!allowed.includes(ext)) {
      return res.status(400).json({ message: "Only PDF, DOC, DOCX allowed" });
    }

    // Ensure upload dir exists
    const baseDir = path.join(process.cwd(), "uploads", "resumes");
    fs.mkdirSync(baseDir, { recursive: true });

    // unique file name
    const rand = crypto.randomBytes(8).toString("hex");
    const filename = `resume_${req.user._id}_${Date.now()}_${rand}${ext}`;
    const absPath = path.join(baseDir, filename);

    // write file
    fs.writeFileSync(absPath, file.buffer);

    // public url (served by express static)
    const resumeUrl = `/uploads/resumes/${filename}`;

    const resumeMeta = {
      fileName: file.originalname,
      size: `${Math.max(1, Math.round(file.size / 1024))} KB`,
      updatedAt: new Date().toISOString(),
    };

    const existing = await User.findById(req.user._id).lean();
    if (!existing) return res.status(404).json({ message: "Student not found" });

    const oldSp = safeObj(existing.studentProfile);

    const patch = {
      resumeUrl,
      studentProfile: {
        ...oldSp,
        resumeMeta: {
          ...safeObj(oldSp.resumeMeta),
          ...resumeMeta,
        },
      },
    };

    const updated = await User.findByIdAndUpdate(
      req.user._id,
      { $set: patch },
      { returnDocument: "after" },
    ).lean();

    // ✅ Fix 2: ensure updated exists
    if (!updated) return res.status(500).json({ message: "Failed to update resume" });

    const profileCompletion = calcProfileCompletion(
      updated.studentProfile,
      updated.resumeUrl,
      updated.resume,
    );

    return res.json({
      ok: true,
      resumeUrl: updated.resumeUrl,
      resumeMeta: updated.studentProfile?.resumeMeta || resumeMeta,
      profileCompletion,
    });
  } catch (err) {
    next(err);
  }
};