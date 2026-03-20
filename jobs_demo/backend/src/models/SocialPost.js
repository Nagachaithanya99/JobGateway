import mongoose from "mongoose";

const socialCommentSchema = new mongoose.Schema(
  {
    authorUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    authorRole: {
      type: String,
      enum: ["student", "company"],
      required: true,
    },
    authorName: { type: String, default: "", trim: true },
    authorHeadline: { type: String, default: "", trim: true },
    authorAvatarUrl: { type: String, default: "", trim: true },
    text: { type: String, required: true, trim: true, maxlength: 800 },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const socialPostSchema = new mongoose.Schema(
  {
    authorUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    authorRole: {
      type: String,
      enum: ["student", "company"],
      required: true,
      index: true,
    },
    authorName: { type: String, default: "", trim: true },
    authorHeadline: { type: String, default: "", trim: true },
    authorAvatarUrl: { type: String, default: "", trim: true },

    type: {
      type: String,
      enum: ["text", "image", "banner", "video", "reel", "document"],
      default: "text",
      index: true,
    },
    headline: { type: String, default: "", trim: true, maxlength: 140 },
    content: { type: String, default: "", trim: true, maxlength: 2200 },

    mediaUrl: { type: String, default: "", trim: true },
    mediaPublicId: { type: String, default: "", trim: true },
    mediaResourceType: { type: String, default: "", trim: true },
    mimeType: { type: String, default: "", trim: true },

    visibility: {
      type: String,
      enum: ["everyone", "followers"],
      default: "everyone",
    },

    tags: { type: [String], default: [] },
    likedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    comments: { type: [socialCommentSchema], default: [] },

    shareCount: { type: Number, default: 0 },
    impressions: { type: Number, default: 0 },
  },
  { timestamps: true }
);

socialPostSchema.index({ createdAt: -1 });
socialPostSchema.index({ tags: 1 });

export default mongoose.model("SocialPost", socialPostSchema);
