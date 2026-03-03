import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    thread: { type: mongoose.Schema.Types.ObjectId, ref: "MessageThread", required: true },

    senderRole: { type: String, enum: ["company", "student", "system"], required: true },

    type: { type: String, enum: ["text", "file", "system"], default: "text" },
    text: { type: String, default: "" },

    fileName: { type: String, default: "" },
    fileSize: { type: String, default: "" },
    fileUrl: { type: String, default: "" },
    mimeType: { type: String, default: "" },
  },
  { timestamps: true }
);

messageSchema.index({ thread: 1, createdAt: 1 });

export default mongoose.model("Message", messageSchema);
