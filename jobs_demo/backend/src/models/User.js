// backend/src/models/User.js
import mongoose from "mongoose";

const { Schema } = mongoose;

/* -----------------------------
   Small reusable sub-schemas
------------------------------*/

// Flexible “object” fields (like resume.personal, preferred, etc.)
const Mixed = Schema.Types.Mixed;

const resumeMetaSchema = new Schema(
  {
    fileName: { type: String, default: "" },
    size: { type: String, default: "" },
    updatedAt: { type: String, default: "" },
  },
  { _id: false }
);

const studentPersonalSchema = new Schema(
  {
    fullName: { type: String, default: "" },
    phone: { type: String, default: "" },
    email: { type: String, default: "" },
    dob: { type: String, default: "" },
    gender: { type: String, default: "" },
    address: { type: String, default: "" },

    city: { type: String, default: "" },
    state: { type: String, default: "" },
    location: { type: String, default: "" },

    linkedin: { type: String, default: "" },
    portfolio: { type: String, default: "" },
    github: { type: String, default: "" },
  },
  { _id: false }
);

const studentPreferredSchema = new Schema(
  {
    stream: { type: String, default: "" },
    category: { type: String, default: "" },

    // support both spellings
    subCategory: { type: String, default: "" },
    subcategory: { type: String, default: "" },

    // ✅ should be array (your completion logic checks preferred.locations truthy)
    locations: { type: [String], default: [] },

    expectedSalary: { type: String, default: "" },
    workMode: { type: String, default: "Hybrid" },
  },
  { _id: false }
);

const studentProfileSchema = new Schema(
  {
    personal: { type: studentPersonalSchema, default: () => ({}) },

    // Keep flexible arrays (you can store objects or strings)
    education: { type: [Mixed], default: [] },
    skills: { type: [Mixed], default: [] },

    fresher: { type: Boolean, default: true },
    experience: { type: [Mixed], default: [] },

    preferred: { type: studentPreferredSchema, default: () => ({}) },

    resumeMeta: { type: resumeMetaSchema, default: () => ({}) },
  },
  { _id: false }
);

const resumeSchema = new Schema(
  {
    personal: { type: Mixed, default: {} },
    summary: { type: String, default: "" },

    education: { type: [Mixed], default: [] },
    skills: { type: [Mixed], default: [] },
    experience: { type: [Mixed], default: [] },

    projects: { type: [Mixed], default: [] },
    certs: { type: [Mixed], default: [] },
    settings: { type: Mixed, default: {} },
  },
  { _id: false }
);

const studentSettingsSchema = new Schema(
  {
    security: {
      twoFactor: { type: Boolean, default: false },
    },

    notifications: {
      appStatus: { type: Boolean, default: true },
      employerMessages: { type: Boolean, default: true },
      interviewUpdates: { type: Boolean, default: true },
      jobRecommendations: { type: Boolean, default: true },
      governmentUpdates: { type: Boolean, default: true },
      internshipAlerts: { type: Boolean, default: true },
      systemAnnouncements: { type: Boolean, default: true },

      emailStatus: { type: Boolean, default: true },
      emailMessages: { type: Boolean, default: true },
      emailJobs: { type: Boolean, default: true },
      weeklyDigest: { type: Boolean, default: false },

      whatsappAlerts: { type: Boolean, default: false },
      smsAlerts: { type: Boolean, default: false },

      frequency: { type: String, default: "Instant" },
    },

    preferences: {
      stream: { type: String, default: "" },
      category: { type: String, default: "" },
      subcategory: { type: String, default: "" },

      // ✅ array is better than string (filters + completion)
      locations: { type: [String], default: [] },

      expectedSalary: { type: String, default: "" },
      workMode: { type: String, default: "Hybrid" },

      oneClickApply: { type: Boolean, default: true },
      autoAttachResume: { type: Boolean, default: true },
      autoSaveHistory: { type: Boolean, default: true },
      simpleMode: { type: Boolean, default: false },
      voiceGuidance: { type: Boolean, default: true },
    },

    privacy: {
      profileVisibility: { type: String, default: "Visible to Employers" },
      showPhoneAfterShortlist: { type: Boolean, default: true },
      allowEmployerMessages: { type: Boolean, default: true },
    },
  },
  { _id: false }
);

const adAccessSchema = new Schema(
  {
    canPost: { type: Boolean, default: false },
    planStatus: {
      type: String,
      enum: ["none", "pending", "approved", "rejected"],
      default: "none",
    },
    planName: { type: String, default: "Ads Starter Plan" },
    requestedAt: { type: Date, default: null },
    approvedAt: { type: Date, default: null },
    expiresAt: { type: Date, default: null },
    note: { type: String, default: "" },
  },
  { _id: false }
);

const socialPreferencesSchema = new Schema(
  {
    storyMutedAuthors: [{ type: Schema.Types.ObjectId, ref: "User" }],
  },
  { _id: false }
);

/* -----------------------------
   Main User schema
------------------------------*/

const userSchema = new Schema(
  {
    clerkId: { type: String, unique: true, required: true, index: true },

    role: {
      type: String,
      enum: ["admin", "company", "student"],
      required: true,
      index: true,
    },

    email: { type: String, default: "", index: true },
    name: { type: String, default: "" },
    language: {
      type: String,
      enum: [
        "en",
        "hi",
        "es",
        "fr",
        "de",
        "pt",
        "ar",
        "zh",
        "ja",
        "ko",
        "ru",
        "it",
        "nl",
        "tr",
        "pl",
        "uk",
        "id",
        "vi",
        "th",
        "bn",
        "ta",
        "te",
        "kn",
        "ml",
        "mr",
        "gu",
        "pa",
        "ur",
      ],
      default: "en",
      index: true,
    },

    phone: { type: String, default: "" },
    location: { type: String, default: "" },
    linkedin: { type: String, default: "" },
    portfolio: { type: String, default: "" },

    isActive: { type: Boolean, default: true, index: true },
    deletedAt: { type: Date, default: null },

    savedJobs: [{ type: Schema.Types.ObjectId, ref: "Job" }],

    // Resume Builder (saved structured data)
    resume: { type: resumeSchema, default: () => ({}) },

    // Uploaded resume file path (local / cloud)
    resumeUrl: { type: String, default: "" },

    // Student profile (personal/edu/skills/experience/preferred)
    studentProfile: { type: studentProfileSchema, default: () => ({}) },

    // Student settings
    studentSettings: { type: studentSettingsSchema, default: () => ({}) },
    adAccess: { type: adAccessSchema, default: () => ({}) },
    socialPreferences: { type: socialPreferencesSchema, default: () => ({}) },

    // Admin profile
    adminProfile: {
      designation: { type: String, default: "Super Admin" },
      bio: { type: String, default: "" },
      lastPasswordChange: { type: String, default: "" },
      activeSessions: { type: Number, default: 1 },
    },

    // Admin prefs
    adminPreferences: {
      emailNotifications: { type: Boolean, default: true },
      planApprovalAlerts: { type: Boolean, default: true },
      registrationAlerts: { type: Boolean, default: true },
    },
  },
  { timestamps: true }
);

// Helpful compound index (optional)
userSchema.index({ role: 1, isActive: 1 });

export default mongoose.model("User", userSchema);
