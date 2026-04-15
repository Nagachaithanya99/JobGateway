// backend/src/controllers/student/student.profile.controller.js
//
// ✅ Place this file at:
//    backend/src/controllers/student/student.profile.controller.js
//
// Uses req.auth().userId — Clerk v5+ syntax (req.auth is now a function).
// Adjust the two import paths below if your project uses different filenames.

import fs         from "fs";
import cloudinary from "../../config/cloudinary.js";  // ← adjust if your file is named differently
import User       from "../../models/User.js";         // ← adjust if your model file is named differently

// ── util: safely delete multer temp file ──────────────────────────────────────
const deleteTmp = (p) => {
  try { if (p && fs.existsSync(p)) fs.unlinkSync(p); } catch (_) {}
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/student/me
// ─────────────────────────────────────────────────────────────────────────────
export const getMe = async (req, res) => {
  try {
    const clerkId = req.auth()?.userId;
    if (!clerkId) return res.status(401).json({ success: false, message: "Unauthorized" });

    let user = await User.findOne({ clerkId }).lean();
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    // NOTE: /me is always the owner — do NOT increment profileViews here.
    // Views are only counted when other users visit via GET /profile/:userId

    return res.json({ success: true, data: user });
  } catch (err) {
    console.error("[getMe]", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/student/me
// body: { name, phone, location, linkedin, portfolio, studentProfile }
// ─────────────────────────────────────────────────────────────────────────────
export const updateMe = async (req, res) => {
  try {
    const clerkId = req.auth()?.userId;
    if (!clerkId) return res.status(401).json({ success: false, message: "Unauthorized" });

    const { name, phone, location, linkedin, portfolio, studentProfile } = req.body;

    const user = await User.findOneAndUpdate(
      { clerkId },
      {
        $set: {
          name,
          phone,
          location,
          linkedin,
          portfolio,
          studentProfile,
          updatedAt: new Date(),
        },
      },
      { new: true, runValidators: true, lean: true }
    );

    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    return res.json({ success: true, data: user });
  } catch (err) {
    console.error("[updateMe]", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/student/upload-resume
// multipart/form-data, field name: "file"
// ─────────────────────────────────────────────────────────────────────────────
export const uploadResumeHandler = async (req, res) => {
  try {
    const clerkId = req.auth()?.userId;
    if (!clerkId)  return res.status(401).json({ success: false, message: "Unauthorized" });
    if (!req.file) return res.status(400).json({ success: false, message: "No file provided" });

    // Upload to Cloudinary as "raw" — this keeps the PDF URL directly accessible
    const result = await cloudinary.uploader.upload(req.file.path, {
      resource_type: "raw",
      folder:        "resumes",
      public_id:     `resume_${clerkId}_${Date.now()}`,
      overwrite:     false,
    });

    deleteTmp(req.file.path);

    const resumeMeta = {
      fileName:     req.file.originalname,
      size:         `${Math.max(1, Math.round(req.file.size / 1024))} KB`,
      updatedAt:    new Date().toISOString(),
      cloudinaryId: result.public_id,
    };

    await User.findOneAndUpdate(
      { clerkId },
      {
        $set: {
          resumeUrl:                    result.secure_url,
          "studentProfile.resumeMeta":  resumeMeta,
        },
      }
    );

    return res.json({
      success: true,
      data: {
        resumeUrl:  result.secure_url,
        resumeMeta,
      },
    });
  } catch (err) {
    deleteTmp(req.file?.path);
    console.error("[uploadResumeHandler]", err);
    return res.status(500).json({ success: false, message: "Resume upload failed" });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/student/upload-avatar
// multipart/form-data, field name: "file"
// ─────────────────────────────────────────────────────────────────────────────
export const uploadAvatarHandler = async (req, res) => {
  try {
    const clerkId = req.auth()?.userId;
    if (!clerkId)  return res.status(401).json({ success: false, message: "Unauthorized" });
    if (!req.file) return res.status(400).json({ success: false, message: "No file provided" });

    const result = await cloudinary.uploader.upload(req.file.path, {
      resource_type: "image",
      folder:        "avatars",
      public_id:     `avatar_${clerkId}`,
      overwrite:     true,
      transformation: [{ width: 400, height: 400, crop: "fill", gravity: "face" }],
    });

    deleteTmp(req.file.path);

    await User.findOneAndUpdate(
      { clerkId },
      { $set: { "studentProfile.personal.avatarUrl": result.secure_url } }
    );

    return res.json({ success: true, data: { avatarUrl: result.secure_url } });
  } catch (err) {
    deleteTmp(req.file?.path);
    console.error("[uploadAvatarHandler]", err);
    return res.status(500).json({ success: false, message: "Avatar upload failed" });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/student/follow-suggestions
// Returns up to 5 real DB users ranked by shared skills / designation / city
// ─────────────────────────────────────────────────────────────────────────────
export const getFollowSuggestionsHandler = async (req, res) => {
  try {
    const clerkId = req.auth()?.userId;
    if (!clerkId) return res.status(401).json({ success: false, message: "Unauthorized" });

    const me = await User.findOne({ clerkId }).lean();
    if (!me) return res.status(404).json({ success: false, message: "User not found" });

    // Exclude self + already-followed users
    const excludeIds = [me._id.toString(), ...(me.following || []).map(String)];

    // My signals for scoring relevance
    const mySkills = (me.studentProfile?.skills || [])
      .map(s => (typeof s === "string" ? s : s?.name || "").toLowerCase())
      .filter(Boolean);
    const myDesig = (me.studentProfile?.personal?.designation || "").toLowerCase();
    const myCity  = (me.studentProfile?.personal?.city        || "").toLowerCase();

    const candidates = await User.find({
      _id:  { $nin: excludeIds },
      role: "student",
    })
      .select(
        "name email followers following profileViews " +
        "studentProfile.personal.designation " +
        "studentProfile.personal.avatarUrl " +
        "studentProfile.personal.city " +
        "studentProfile.skills"
      )
      .limit(30)
      .lean();

    const scored = candidates.map(u => {
      let score = 0;

      const uSkills = (u.studentProfile?.skills || [])
        .map(s => (typeof s === "string" ? s : s?.name || "").toLowerCase())
        .filter(Boolean);
      const uDesig = (u.studentProfile?.personal?.designation || "").toLowerCase();
      const uCity  = (u.studentProfile?.personal?.city        || "").toLowerCase();

      // Exact designation match → strong signal
      if (myDesig && uDesig && myDesig === uDesig)                                          score += 10;
      // Both developers (different exact titles)
      if (myDesig && uDesig && myDesig.includes("developer") && uDesig.includes("developer")) score += 5;
      // Each shared skill
      const sharedSkills = uSkills.filter(s => mySkills.includes(s));
      score += sharedSkills.length * 3;
      // Same city
      if (myCity && uCity && myCity === uCity) score += 4;
      // Mutual followers
      const mutualCount = (u.followers || []).filter(f => (me.followers || []).map(String).includes(String(f))).length;
      score += mutualCount * 2;

      return {
        _id:               u._id,
        name:              u.name || u.email?.split("@")[0] || "Student",
        email:             u.email,
        designation:       u.studentProfile?.personal?.designation || "Student",
        avatarUrl:         u.studentProfile?.personal?.avatarUrl   || "",
        city:              u.studentProfile?.personal?.city        || "",
        mutualConnections: mutualCount,
        sharedSkills:      sharedSkills.length,
        followersCount:    (u.followers || []).length,
        score,
      };
    });

    scored.sort((a, b) => b.score - a.score);

    return res.json({ success: true, data: scored.slice(0, 5) });
  } catch (err) {
    console.error("[getFollowSuggestionsHandler]", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/student/follow/:targetUserId  — toggles follow/unfollow
// ─────────────────────────────────────────────────────────────────────────────
export const followUserHandler = async (req, res) => {
  try {
    const clerkId = req.auth()?.userId;
    if (!clerkId) return res.status(401).json({ success: false, message: "Unauthorized" });

    const { targetUserId } = req.params;

    const [me, target] = await Promise.all([
      User.findOne({ clerkId }),
      User.findById(targetUserId),
    ]);

    if (!me)     return res.status(404).json({ success: false, message: "User not found" });
    if (!target) return res.status(404).json({ success: false, message: "Target user not found" });

    const isFollowing = (me.following || []).map(String).includes(String(targetUserId));

    if (isFollowing) {
      await Promise.all([
        User.findByIdAndUpdate(me._id,       { $pull:     { following: targetUserId          } }),
        User.findByIdAndUpdate(targetUserId,  { $pull:     { followers: me._id.toString()    } }),
      ]);
      return res.json({ success: true, action: "unfollowed" });
    } else {
      await Promise.all([
        User.findByIdAndUpdate(me._id,       { $addToSet: { following: targetUserId          } }),
        User.findByIdAndUpdate(targetUserId,  { $addToSet: { followers: me._id.toString()    } }),
      ]);
      return res.json({ success: true, action: "followed" });
    }
  } catch (err) {
    console.error("[followUserHandler]", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/student/applied-jobs
// ─────────────────────────────────────────────────────────────────────────────
export const getAppliedJobsHandler = async (req, res) => {
  try {
    const clerkId = req.auth()?.userId;
    if (!clerkId) return res.status(401).json({ success: false, message: "Unauthorized" });

    const me = await User.findOne({ clerkId })
      .populate({
        path:   "appliedJobs.job",
        select: "title company companyLogo location salary jobType",
        populate: { path: "company", select: "name logo about website" },
      })
      .lean();

    if (!me) return res.status(404).json({ success: false, message: "User not found" });

    const jobs = (me.appliedJobs || []).map(app => ({
      applicationId:   app._id,
      jobId:           app.job?._id,
      title:           app.job?.title                              || "Unknown Role",
      company:         app.job?.company?.name || app.job?.company  || "Unknown Company",
      companyLogo:     app.job?.company?.logo  || app.job?.companyLogo || "",
      companyAbout:    app.job?.company?.about                     || "No description available.",
      companyWebsite:  app.job?.company?.website                   || "",
      location:        app.job?.location  || "",
      salary:          app.job?.salary    || "",
      jobType:         app.job?.jobType   || "Full-time",
      appliedAt:       app.appliedAt      || app.createdAt,
      status:          app.status         || "Applied",
    }));

    return res.json({ success: true, data: jobs });
  } catch (err) {
    console.error("[getAppliedJobsHandler]", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/student/applied-jobs/:applicationId
// ─────────────────────────────────────────────────────────────────────────────
export const withdrawApplicationHandler = async (req, res) => {
  try {
    const clerkId          = req.auth()?.userId;
    const { applicationId } = req.params;
    if (!clerkId) return res.status(401).json({ success: false, message: "Unauthorized" });

    const me = await User.findOne({ clerkId });
    if (!me) return res.status(404).json({ success: false, message: "User not found" });

    const idx = (me.appliedJobs || []).findIndex(
      a => a._id.toString() === applicationId
    );
    if (idx === -1) return res.status(404).json({ success: false, message: "Application not found" });

    me.appliedJobs.splice(idx, 1);
    await me.save();

    return res.json({ success: true, message: "Application withdrawn" });
  } catch (err) {
    console.error("[withdrawApplicationHandler]", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};


// ─────────────────────────────────────────────────────────────────────────────
// GET /api/student/profile/:userId  — PUBLIC profile view (increments view count)
// Called when ANOTHER user visits someone's profile via search/suggestions
// ─────────────────────────────────────────────────────────────────────────────
export const getPublicProfile = async (req, res) => {
  try {
    const viewerClerkId = req.auth()?.userId;
    const { userId }    = req.params;

    const profile = await User.findById(userId)
      .select("name email studentProfile followers following profileViews projectViews resumeUrl")
      .lean();

    if (!profile) return res.status(404).json({ success: false, message: "User not found" });

    // Only increment if the viewer is NOT the profile owner
    const owner = await User.findOne({ clerkId: viewerClerkId }).lean();
    if (!owner || owner._id.toString() !== userId) {
      await User.findByIdAndUpdate(userId, { $inc: { profileViews: 1 } });
      profile.profileViews = (profile.profileViews || 0) + 1;
    }

    return res.json({ success: true, data: profile });
  } catch (err) {
    console.error("[getPublicProfile]", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};
