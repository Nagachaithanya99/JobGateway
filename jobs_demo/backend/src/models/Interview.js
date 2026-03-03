import mongoose from "mongoose";

const interviewSchema = new mongoose.Schema(
  {
    company: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    // optional linkage (future)
    application: { type: mongoose.Schema.Types.ObjectId, ref: "Application" },
    job: { type: mongoose.Schema.Types.ObjectId, ref: "Job" },
    student: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

    candidateName: { type: String, required: true },
    jobTitle: { type: String, required: true },

    stage: { type: String, enum: ["HR", "Technical", "Final"], default: "HR" },

    scheduledAt: { type: Date, required: true },
    durationMins: { type: Number, default: 30 },

    mode: { type: String, enum: ["Online", "Onsite"], default: "Online" },
    meetingLink: { type: String, default: "" },
    interviewLinks: [{ type: String }],
    location: { type: String, default: "" },

    interviewer: { type: String, default: "" },

    status: {
      type: String,
      enum: ["Scheduled", "Completed", "Rescheduled", "Cancelled", "Pending Confirmation"],
      default: "Scheduled",
    },

    notes: [{ type: String }],
    messageToCandidate: { type: String, default: "" },
    interviewQuestions: [{ type: String }],
    documentsRequired: [{ type: String }],
    verificationDetails: { type: String, default: "" },
    additionalDetails: { type: String, default: "" },
    verificationStatus: {
      type: String,
      enum: ["Pending", "Submitted", "Verified", "Rejected"],
      default: "Pending",
    },
  },
  { timestamps: true }
);

interviewSchema.index({ company: 1, scheduledAt: -1, status: 1 });

export default mongoose.model("Interview", interviewSchema);
