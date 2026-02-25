// backend/src/models/StudentNotification.js
import mongoose from "mongoose";

const studentNotificationSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // student is also User in your app
      required: true,
      index: true,
    },

    // Applications | Jobs | Messages | System
    type: { type: String, default: "System", index: true },

    title: { type: String, required: true },
    description: { type: String, default: "" },

    // UI helpers
    icon: {
      type: String,
      enum: ["application", "shortlisted", "hold", "rejected", "job", "message", "system"],
      default: "system",
    },

    actions: { type: [String], default: [] }, // ["View Application", "Reply", "View Job", ...]
    meta: { type: Object, default: {} }, // { jobId, applicationId, conversationId, url ... }

    read: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

studentNotificationSchema.index({ studentId: 1, createdAt: -1 });

export default mongoose.model("StudentNotification", studentNotificationSchema);
