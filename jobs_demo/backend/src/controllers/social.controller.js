import mongoose from "mongoose";
import Company from "../models/Company.js";
import Message from "../models/Message.js";
import MessageThread from "../models/MessageThread.js";
import SocialFollow from "../models/SocialFollow.js";
import SocialPost from "../models/SocialPost.js";
import User from "../models/User.js";

function safeStr(value) {
  return typeof value === "string" ? value.trim() : "";
}

function toTextArray(value) {
  if (Array.isArray(value)) {
    return value
      .flatMap((item) => String(item ?? "").split(/[\n,;/|]+/g))
      .map((item) => item.trim())
      .filter(Boolean);
  }

  if (typeof value === "string") {
    return value
      .split(/[\n,;/|]+/g)
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
}

function uniqueStrings(items = []) {
  return [...new Set(items.map((item) => safeStr(item)).filter(Boolean))];
}

function capitalize(label = "") {
  const value = safeStr(label);
  return value ? `${value.charAt(0).toUpperCase()}${value.slice(1)}` : "";
}

function extractTags(content = "", extra = []) {
  const matches = [];
  const regex = /#([\w-]+)/g;
  let match = regex.exec(String(content || ""));
  while (match) {
    matches.push(match[1]);
    match = regex.exec(String(content || ""));
  }
  return uniqueStrings([...matches, ...toTextArray(extra)]).slice(0, 8);
}

function buildStudentHeadline(user) {
  const personal = user?.studentProfile?.personal || {};
  const preferred = user?.studentProfile?.preferred || {};
  const skills = toTextArray(user?.studentProfile?.skills)
    .slice(0, 3)
    .map((item) => item.replace(/^./, (char) => char.toUpperCase()));

  const parts = [
    safeStr(preferred.stream),
    safeStr(preferred.category),
    skills.length ? skills.join(" • ") : "",
  ].filter(Boolean);

  return (
    parts.join(" • ") ||
    safeStr(personal.location) ||
    safeStr(user?.location) ||
    "Student building skills and sharing career wins"
  );
}

function buildCompanyHeadline(company, user) {
  const parts = [
    safeStr(company?.industry),
    safeStr(company?.category),
    safeStr(company?.location),
  ].filter(Boolean);

  return (
    parts.join(" • ") ||
    safeStr(company?.about) ||
    safeStr(user?.location) ||
    "Hiring team sharing roles, culture, and career updates"
  );
}

function computeProfileStrength(user, company) {
  if (user?.role === "company") {
    const checks = [
      safeStr(company?.name),
      safeStr(company?.industry),
      safeStr(company?.location),
      safeStr(company?.about),
      safeStr(company?.website),
    ];
    return Math.round((checks.filter(Boolean).length / checks.length) * 100);
  }

  const personal = user?.studentProfile?.personal || {};
  const preferred = user?.studentProfile?.preferred || {};
  const checks = [
    safeStr(user?.name) || safeStr(personal.fullName),
    safeStr(user?.location) || safeStr(personal.location) || safeStr(personal.city),
    safeStr(preferred.stream),
    safeStr(preferred.category),
    toTextArray(user?.studentProfile?.skills).length ? "skills" : "",
  ];
  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
}

function buildActorProfile(user, company) {
  const isCompany = String(user?.role || "") === "company";
  const name =
    safeStr(isCompany ? company?.name : user?.name) ||
    safeStr(user?.name) ||
    (isCompany ? "Company" : "Student");
  const location =
    safeStr(isCompany ? company?.location : user?.location) ||
    safeStr(user?.location) ||
    "India";
  const headline = isCompany
    ? buildCompanyHeadline(company, user)
    : buildStudentHeadline(user);
  const focusTags = isCompany
    ? uniqueStrings([company?.industry, company?.category, company?.location]).slice(0, 3)
    : uniqueStrings([
        user?.studentProfile?.preferred?.stream,
        user?.studentProfile?.preferred?.category,
        ...toTextArray(user?.studentProfile?.skills).slice(0, 2),
      ]).slice(0, 4);

  return {
    id: String(user?._id || ""),
    role: String(user?.role || "student"),
    badge: isCompany ? "Company" : "Student",
    name,
    headline,
    location,
    avatarUrl: safeStr(isCompany ? company?.logoUrl : ""),
    profileStrength: computeProfileStrength(user, company),
    focusTags,
    intro: isCompany
      ? safeStr(company?.about) || "Sharing hiring updates, culture, and work highlights."
      : "Posting wins, projects, reels, and career updates from campus life.",
    website: safeStr(isCompany ? company?.website : user?.portfolio),
  };
}

function mapComment(comment, viewerId) {
  return {
    id: String(comment?._id || ""),
    author: {
      id: String(comment?.authorUser || ""),
      role: comment?.authorRole || "student",
      name: comment?.authorName || "User",
      headline: comment?.authorHeadline || "",
      avatarUrl: comment?.authorAvatarUrl || "",
    },
    text: comment?.text || "",
    createdAt: comment?.createdAt || null,
    canEdit: String(comment?.authorUser || "") === String(viewerId || ""),
  };
}

function mapPost(post, viewerId, followSet, followerMap) {
  const authorId = String(post?.authorUser || "");
  const likedByViewer = (post?.likedBy || []).some(
    (item) => String(item) === String(viewerId || "")
  );

  return {
    id: String(post?._id || ""),
    type: post?.type || "text",
    headline: post?.headline || "",
    content: post?.content || "",
    createdAt: post?.createdAt || null,
    visibility: post?.visibility || "everyone",
    media: {
      url: post?.mediaUrl || "",
      publicId: post?.mediaPublicId || "",
      resourceType: post?.mediaResourceType || "",
      mimeType: post?.mimeType || "",
    },
    tags: Array.isArray(post?.tags) ? post.tags : [],
    metrics: {
      likes: Array.isArray(post?.likedBy) ? post.likedBy.length : 0,
      comments: Array.isArray(post?.comments) ? post.comments.length : 0,
      shares: Number(post?.shareCount || 0),
      impressions: Number(post?.impressions || 0),
    },
    author: {
      id: authorId,
      role: post?.authorRole || "student",
      badge: capitalize(post?.authorRole || "student"),
      name: post?.authorName || "User",
      headline: post?.authorHeadline || "",
      avatarUrl: post?.authorAvatarUrl || "",
      followers: Number(followerMap.get(authorId) || 0),
      isFollowed: followSet.has(authorId),
      canFollow: authorId && authorId !== String(viewerId || ""),
      canMessage:
        authorId &&
        authorId !== String(viewerId || "") &&
        String(post?.authorRole || "") !== String(post?.viewerRole || ""),
    },
    viewerState: {
      liked: likedByViewer,
      canLike: authorId !== String(viewerId || ""),
      canComment: true,
    },
    comments: (post?.comments || [])
      .slice(-4)
      .map((comment) => mapComment(comment, viewerId)),
  };
}

async function getCompanyMap(userIds = []) {
  const objectIds = userIds
    .filter(Boolean)
    .map((id) => new mongoose.Types.ObjectId(id));

  if (!objectIds.length) return new Map();

  const companies = await Company.find({ ownerUserId: { $in: objectIds } }).lean();
  return new Map(companies.map((company) => [String(company.ownerUserId), company]));
}

async function getFollowerMap(userIds = []) {
  const objectIds = userIds
    .filter(Boolean)
    .map((id) => new mongoose.Types.ObjectId(id));

  if (!objectIds.length) return new Map();

  const rows = await SocialFollow.aggregate([
    { $match: { following: { $in: objectIds } } },
    { $group: { _id: "$following", count: { $sum: 1 } } },
  ]);

  return new Map(rows.map((row) => [String(row._id), Number(row.count || 0)]));
}

async function getPostCountMap(userIds = []) {
  const objectIds = userIds
    .filter(Boolean)
    .map((id) => new mongoose.Types.ObjectId(id));

  if (!objectIds.length) return new Map();

  const rows = await SocialPost.aggregate([
    { $match: { authorUser: { $in: objectIds } } },
    { $group: { _id: "$authorUser", count: { $sum: 1 } } },
  ]);

  return new Map(rows.map((row) => [String(row._id), Number(row.count || 0)]));
}

async function resolveViewerContext(user) {
  const company =
    String(user?.role || "") === "company"
      ? await Company.findOne({ ownerUserId: user._id }).lean()
      : null;
  return buildActorProfile(user, company);
}

async function buildSuggestionCards(viewer, followedSet) {
  const users = await User.find({
    _id: { $ne: viewer._id },
    role: { $in: ["student", "company"] },
    isActive: true,
  })
    .sort({ updatedAt: -1 })
    .limit(16)
    .lean();

  const ids = users.map((item) => String(item._id));
  const [companyMap, followerMap, postCountMap] = await Promise.all([
    getCompanyMap(ids),
    getFollowerMap(ids),
    getPostCountMap(ids),
  ]);

  return users
    .map((user) => {
      const actor = buildActorProfile(user, companyMap.get(String(user._id)));
      return {
        ...actor,
        followers: Number(followerMap.get(String(user._id)) || 0),
        posts: Number(postCountMap.get(String(user._id)) || 0),
        isFollowing: followedSet.has(String(user._id)),
        canMessage: actor.role !== String(viewer?.role || ""),
        reason:
          actor.role === "company"
            ? "Sharing hiring updates and opportunities"
            : "Posting projects, campus wins, and career learning",
      };
    })
    .sort((a, b) => {
      const aRoleScore = a.role !== viewer.role ? 0 : 1;
      const bRoleScore = b.role !== viewer.role ? 0 : 1;
      if (aRoleScore !== bRoleScore) return aRoleScore - bRoleScore;
      if (a.isFollowing !== b.isFollowing) return Number(a.isFollowing) - Number(b.isFollowing);
      return (b.followers || 0) - (a.followers || 0);
    })
    .slice(0, 5);
}

function buildTrendingTags(posts = []) {
  const tagCount = new Map();
  posts.forEach((post) => {
    (post?.tags || []).forEach((tag) => {
      const key = safeStr(tag).replace(/^#/, "");
      if (!key) return;
      tagCount.set(key, Number(tagCount.get(key) || 0) + 1);
    });
  });

  const entries = [...tagCount.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([tag, count]) => ({
      tag: `#${tag}`,
      count,
    }));

  if (entries.length) return entries;

  return [
    { tag: "#CampusWins", count: 0 },
    { tag: "#HiringNow", count: 0 },
    { tag: "#PortfolioDrop", count: 0 },
    { tag: "#CareerPulse", count: 0 },
  ];
}

export async function getCareerPulseFeed(req, res, next) {
  try {
    const viewer = req.user;
    const limit = Math.max(6, Math.min(24, Number(req.query?.limit || 12)));

    const followedRows = await SocialFollow.find({ follower: viewer._id })
      .select("following")
      .lean();
    const followedIds = new Set(followedRows.map((row) => String(row.following)));

    const visibleAuthorIds = [
      new mongoose.Types.ObjectId(viewer._id),
      ...[...followedIds].map((id) => new mongoose.Types.ObjectId(id)),
    ];

    const [viewerProfile, posts, suggestions, viewerFollowerCount, viewerFollowingCount, viewerPostCount] =
      await Promise.all([
        resolveViewerContext(viewer),
        SocialPost.find({
          $or: [
            { visibility: "everyone" },
            { authorUser: viewer._id },
            { visibility: "followers", authorUser: { $in: visibleAuthorIds } },
          ],
        })
          .sort({ createdAt: -1 })
          .limit(limit)
          .lean(),
        buildSuggestionCards(viewer, followedIds),
        SocialFollow.countDocuments({ following: viewer._id }),
        SocialFollow.countDocuments({ follower: viewer._id }),
        SocialPost.countDocuments({ authorUser: viewer._id }),
      ]);

    const postAuthorIds = uniqueStrings(posts.map((post) => String(post.authorUser)));
    const followerMap = await getFollowerMap(postAuthorIds);

    const mappedPosts = posts.map((post) =>
      mapPost(
        {
          ...post,
          viewerRole: viewer.role,
        },
        viewer._id,
        followedIds,
        followerMap
      )
    );

    return res.json({
      viewer: {
        ...viewerProfile,
        followers: viewerFollowerCount,
        following: viewerFollowingCount,
        posts: viewerPostCount,
      },
      insights: {
        title: "Career Pulse",
        subtitle:
          "A professional social space for student creators and hiring teams to post, follow, interact, and connect.",
      },
      suggestions,
      trending: buildTrendingTags(posts),
      posts: mappedPosts,
    });
  } catch (error) {
    next(error);
  }
}

export async function createCareerPulsePost(req, res, next) {
  try {
    const viewer = req.user;
    const type = safeStr(req.body?.type || "text").toLowerCase();
    const headline = safeStr(req.body?.headline);
    const content = safeStr(req.body?.content);
    const mediaUrl = safeStr(req.body?.mediaUrl);

    if (!content && !mediaUrl) {
      return res.status(400).json({ message: "Write something or attach media before posting." });
    }

    const allowedTypes = new Set(["text", "image", "banner", "video", "reel", "document"]);
    if (!allowedTypes.has(type)) {
      return res.status(400).json({ message: "Invalid post type." });
    }

    if (type !== "text" && !mediaUrl) {
      return res.status(400).json({ message: "This post type requires media." });
    }

    const actor = await resolveViewerContext(viewer);
    const post = await SocialPost.create({
      authorUser: viewer._id,
      authorRole: viewer.role,
      authorName: actor.name,
      authorHeadline: actor.headline,
      authorAvatarUrl: actor.avatarUrl,
      type,
      headline,
      content,
      mediaUrl,
      mediaPublicId: safeStr(req.body?.mediaPublicId),
      mediaResourceType: safeStr(req.body?.mediaResourceType),
      mimeType: safeStr(req.body?.mimeType),
      visibility: safeStr(req.body?.visibility || "everyone") === "followers" ? "followers" : "everyone",
      tags: extractTags(content, req.body?.tags),
    });

    const followerMap = await getFollowerMap([String(viewer._id)]);

    return res.status(201).json({
      message: "Post published to Career Pulse.",
      post: mapPost(
        { ...post.toObject(), viewerRole: viewer.role },
        viewer._id,
        new Set(),
        followerMap
      ),
    });
  } catch (error) {
    next(error);
  }
}

export async function toggleCareerPulseLike(req, res, next) {
  try {
    const viewer = req.user;
    const { postId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(postId)) {
      return res.status(400).json({ message: "Invalid post id." });
    }

    const post = await SocialPost.findById(postId);
    if (!post) return res.status(404).json({ message: "Post not found." });

    const index = (post.likedBy || []).findIndex(
      (item) => String(item) === String(viewer._id)
    );

    let liked = false;
    if (index >= 0) {
      post.likedBy.splice(index, 1);
    } else {
      post.likedBy.push(viewer._id);
      liked = true;
    }

    await post.save();

    return res.json({
      liked,
      likes: post.likedBy.length,
    });
  } catch (error) {
    next(error);
  }
}

export async function addCareerPulseComment(req, res, next) {
  try {
    const viewer = req.user;
    const { postId } = req.params;
    const text = safeStr(req.body?.text);

    if (!mongoose.Types.ObjectId.isValid(postId)) {
      return res.status(400).json({ message: "Invalid post id." });
    }
    if (!text) {
      return res.status(400).json({ message: "Comment text is required." });
    }

    const [actor, post] = await Promise.all([
      resolveViewerContext(viewer),
      SocialPost.findById(postId),
    ]);

    if (!post) return res.status(404).json({ message: "Post not found." });

    post.comments.push({
      authorUser: viewer._id,
      authorRole: viewer.role,
      authorName: actor.name,
      authorHeadline: actor.headline,
      authorAvatarUrl: actor.avatarUrl,
      text,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await post.save();
    const comment = post.comments[post.comments.length - 1];

    return res.status(201).json({
      message: "Comment added.",
      comment: mapComment(comment, viewer._id),
      comments: post.comments.length,
    });
  } catch (error) {
    next(error);
  }
}

export async function toggleCareerPulseFollow(req, res, next) {
  try {
    const viewer = req.user;
    const { targetId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(targetId)) {
      return res.status(400).json({ message: "Invalid account id." });
    }
    if (String(targetId) === String(viewer._id)) {
      return res.status(400).json({ message: "You cannot follow your own profile." });
    }

    const target = await User.findById(targetId).lean();
    if (!target || !target.isActive || !["student", "company"].includes(String(target.role || ""))) {
      return res.status(404).json({ message: "Profile not found." });
    }

    const existing = await SocialFollow.findOne({
      follower: viewer._id,
      following: target._id,
    });

    let following = false;
    if (existing) {
      await existing.deleteOne();
    } else {
      await SocialFollow.create({
        follower: viewer._id,
        following: target._id,
      });
      following = true;
    }

    const followers = await SocialFollow.countDocuments({ following: target._id });

    return res.json({
      following,
      followers,
      targetId: String(target._id),
    });
  } catch (error) {
    next(error);
  }
}

export async function shareCareerPulsePost(req, res, next) {
  try {
    const { postId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(postId)) {
      return res.status(400).json({ message: "Invalid post id." });
    }

    const post = await SocialPost.findByIdAndUpdate(
      postId,
      { $inc: { shareCount: 1 } },
      { returnDocument: "after" }
    ).lean();

    if (!post) return res.status(404).json({ message: "Post not found." });

    return res.json({
      shares: Number(post.shareCount || 0),
    });
  } catch (error) {
    next(error);
  }
}

export async function startCareerPulseMessage(req, res, next) {
  try {
    const viewer = req.user;
    const recipientId = req.body?.recipientId;

    if (!mongoose.Types.ObjectId.isValid(recipientId)) {
      return res.status(400).json({ message: "Invalid recipient id." });
    }
    if (String(recipientId) === String(viewer._id)) {
      return res.status(400).json({ message: "You cannot message your own profile." });
    }

    const recipient = await User.findById(recipientId).lean();
    if (!recipient || !recipient.isActive) {
      return res.status(404).json({ message: "Recipient not found." });
    }

    const viewerRole = String(viewer.role || "");
    const recipientRole = String(recipient.role || "");

    if (!["student", "company"].includes(viewerRole) || !["student", "company"].includes(recipientRole)) {
      return res.status(403).json({ message: "Messaging is only available for student and company accounts." });
    }

    if (viewerRole === recipientRole) {
      return res.status(400).json({
        message: "Direct messaging is available between students and companies in this release.",
      });
    }

    const studentId = viewerRole === "student" ? viewer._id : recipient._id;
    const companyId = viewerRole === "company" ? viewer._id : recipient._id;

    let thread = await MessageThread.findOne({
      student: studentId,
      company: companyId,
    }).sort({ updatedAt: -1 });

    let created = false;
    if (!thread) {
      thread = await MessageThread.create({
        student: studentId,
        company: companyId,
        source: "social",
        subject: "Career Pulse connection",
        status: "Connected",
        lastMessageText: "Conversation started from Career Pulse.",
        lastMessageAt: new Date(),
        studentUnread: 0,
        companyUnread: 0,
      });

      await Message.create({
        thread: thread._id,
        senderRole: "system",
        type: "system",
        text: "Career Pulse connection started.",
      });

      created = true;
    }

    return res.json({
      created,
      threadId: String(thread._id),
      route:
        viewerRole === "student"
          ? `/student/messages?thread=${thread._id}`
          : `/company/messages?thread=${thread._id}`,
    });
  } catch (error) {
    next(error);
  }
}
