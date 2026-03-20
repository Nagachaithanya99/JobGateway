import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useLocation, useNavigate } from "react-router-dom";
import {
  FiArrowUpRight,
  FiClock,
  FiCompass,
  FiFileText,
  FiHash,
  FiImage,
  FiLoader,
  FiMapPin,
  FiMessageSquare,
  FiPlayCircle,
  FiPlus,
  FiSend,
  FiShare2,
  FiThumbsUp,
  FiTrendingUp,
  FiUsers,
  FiVideo,
  FiX,
} from "react-icons/fi";
import Modal from "../../components/common/Modal.jsx";
import Toast from "../../components/common/Toast.jsx";
import {
  addCareerPulseComment,
  createCareerPulsePost,
  getCareerPulseFeed,
  shareCareerPulsePost,
  startCareerPulseMessage,
  toggleCareerPulseFollow,
  toggleCareerPulseLike,
} from "../../services/socialService.js";
import { uploadSocialMedia } from "../../services/uploadService.js";
import { toAbsoluteMediaUrl } from "../../utils/media.js";

const postTypeOptions = [
  { value: "text", label: "Text Update", helper: "Quick career notes or wins", icon: <FiMessageSquare /> },
  { value: "banner", label: "Banner", helper: "Share a poster or spotlight", icon: <FiImage /> },
  { value: "image", label: "Image", helper: "Post screenshots and photos", icon: <FiImage /> },
  { value: "video", label: "Video", helper: "Upload landscape video stories", icon: <FiVideo /> },
  { value: "reel", label: "Reel", helper: "Post short vertical clips", icon: <FiPlayCircle /> },
  { value: "document", label: "Document", helper: "Attach PDFs and decks", icon: <FiFileText /> },
];

function defaultComposer() {
  return { type: "text", headline: "", content: "", visibility: "everyone", file: null };
}

function initials(name = "") {
  return String(name || "")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function timeAgo(value) {
  if (!value) return "Now";
  const then = new Date(value);
  const diff = Date.now() - then.getTime();
  const mins = Math.max(0, Math.floor(diff / 60000));
  if (mins < 1) return "Now";
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d`;
  return then.toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
}

function isVideoPost(post) {
  const type = String(post?.type || "").toLowerCase();
  const mime = String(post?.media?.mimeType || "").toLowerCase();
  const resourceType = String(post?.media?.resourceType || "").toLowerCase();
  return type === "video" || type === "reel" || mime.startsWith("video/") || resourceType === "video";
}

function mediaAcceptForType(type) {
  if (type === "document") return ".pdf,.ppt,.pptx,.doc,.docx";
  if (type === "video" || type === "reel") return "video/*";
  if (type === "banner" || type === "image") return "image/*";
  return "image/*,video/*,.pdf,.ppt,.pptx,.doc,.docx";
}

function gradientForRole(role) {
  return role === "company"
    ? "from-[#0a66c2] via-[#0f4b85] to-[#0f172a]"
    : "from-[#0a66c2] via-[#2c7dd1] to-[#f4f8ff]";
}

function updatePost(posts, postId, updater) {
  return posts.map((post) => (post.id === postId ? updater(post) : post));
}

export default function CareerPulsePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const isCompanyView = location.pathname.startsWith("/company");
  const basePath = isCompanyView ? "/company" : "/student";

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [feed, setFeed] = useState({
    viewer: null,
    insights: { title: "Career Pulse", subtitle: "" },
    suggestions: [],
    trending: [],
    posts: [],
  });
  const [composerOpen, setComposerOpen] = useState(false);
  const [composer, setComposer] = useState(defaultComposer());
  const [composerPreview, setComposerPreview] = useState("");
  const [commentDrafts, setCommentDrafts] = useState({});
  const [expandedComments, setExpandedComments] = useState({});
  const [busy, setBusy] = useState({});
  const [toast, setToast] = useState({ show: false, message: "", tone: "dark" });

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        setLoading(true);
        const data = await getCareerPulseFeed();
        if (!active) return;
        setFeed({
          viewer: data?.viewer || null,
          insights: data?.insights || { title: "Career Pulse", subtitle: "" },
          suggestions: Array.isArray(data?.suggestions) ? data.suggestions : [],
          trending: Array.isArray(data?.trending) ? data.trending : [],
          posts: Array.isArray(data?.posts) ? data.posts : [],
        });
      } catch (error) {
        setToast({
          show: true,
          tone: "error",
          message: error?.response?.data?.message || "Failed to load Career Pulse.",
        });
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  useEffect(
    () => () => {
      if (composerPreview) URL.revokeObjectURL(composerPreview);
    },
    [composerPreview]
  );

  const quickActions = useMemo(
    () => [
      { label: "Student Stories", value: "reel", icon: <FiPlayCircle /> },
      { label: "Event Banner", value: "banner", icon: <FiImage /> },
      { label: "Video Update", value: "video", icon: <FiVideo /> },
    ],
    []
  );

  const setBusyFlag = (key, value) => setBusy((prev) => ({ ...prev, [key]: value }));

  const openComposer = (type = "text") => {
    setComposer((prev) => ({ ...prev, type }));
    setComposerOpen(true);
  };

  const closeComposer = () => {
    setComposer(defaultComposer());
    if (composerPreview) URL.revokeObjectURL(composerPreview);
    setComposerPreview("");
    setComposerOpen(false);
  };

  const handleComposerFile = (file) => {
    if (composerPreview) URL.revokeObjectURL(composerPreview);
    setComposer((prev) => ({ ...prev, file: file || null }));
    if (!file) return setComposerPreview("");
    if (String(file.type || "").startsWith("image/") || String(file.type || "").startsWith("video/")) {
      setComposerPreview(URL.createObjectURL(file));
      return;
    }
    setComposerPreview("");
  };

  const refreshFeed = async () => {
    try {
      setRefreshing(true);
      const data = await getCareerPulseFeed();
      setFeed({
        viewer: data?.viewer || null,
        insights: data?.insights || feed.insights,
        suggestions: Array.isArray(data?.suggestions) ? data.suggestions : [],
        trending: Array.isArray(data?.trending) ? data.trending : [],
        posts: Array.isArray(data?.posts) ? data.posts : [],
      });
    } catch (error) {
      setToast({ show: true, tone: "error", message: error?.response?.data?.message || "Could not refresh the feed." });
    } finally {
      setRefreshing(false);
    }
  };

  const publishPost = async () => {
    const content = String(composer.content || "").trim();
    const headline = String(composer.headline || "").trim();
    if (!content && !composer.file) {
      setToast({ show: true, tone: "error", message: "Add some content or upload media before posting." });
      return;
    }

    try {
      setBusyFlag("publish", true);
      let uploadPayload = null;
      if (composer.file) {
        const uploadRes = await uploadSocialMedia(composer.file);
        uploadPayload = uploadRes?.data || null;
      }

      const created = await createCareerPulsePost({
        type: composer.type,
        headline,
        content,
        visibility: composer.visibility,
        mediaUrl: uploadPayload?.mediaUrl || "",
        mediaPublicId: uploadPayload?.publicId || "",
        mediaResourceType: uploadPayload?.resourceType || "",
        mimeType: uploadPayload?.mimeType || composer.file?.type || "",
      });

      setFeed((prev) => ({
        ...prev,
        viewer: prev.viewer ? { ...prev.viewer, posts: Number(prev.viewer.posts || 0) + 1 } : prev.viewer,
        posts: created?.post ? [created.post, ...prev.posts] : prev.posts,
      }));
      closeComposer();
      setToast({ show: true, tone: "success", message: created?.message || "Posted to Career Pulse." });
    } catch (error) {
      setToast({ show: true, tone: "error", message: error?.response?.data?.message || "Failed to publish your post." });
    } finally {
      setBusyFlag("publish", false);
    }
  };

  const applyFollowState = (targetId, following, followers) => {
    setFeed((prev) => ({
      ...prev,
      posts: prev.posts.map((post) =>
        post.author.id === targetId ? { ...post, author: { ...post.author, isFollowed: following, followers } } : post
      ),
      suggestions: prev.suggestions.map((item) => (item.id === targetId ? { ...item, isFollowing: following, followers } : item)),
    }));
  };

  const handleFollow = async (targetId) => {
    try {
      setBusyFlag(`follow-${targetId}`, true);
      const result = await toggleCareerPulseFollow(targetId);
      applyFollowState(targetId, Boolean(result?.following), Number(result?.followers || 0));
    } catch (error) {
      setToast({ show: true, tone: "error", message: error?.response?.data?.message || "Follow action failed." });
    } finally {
      setBusyFlag(`follow-${targetId}`, false);
    }
  };

  const handleLike = async (postId) => {
    try {
      setBusyFlag(`like-${postId}`, true);
      const result = await toggleCareerPulseLike(postId);
      setFeed((prev) => ({
        ...prev,
        posts: updatePost(prev.posts, postId, (post) => ({
          ...post,
          viewerState: { ...post.viewerState, liked: Boolean(result?.liked) },
          metrics: { ...post.metrics, likes: Number(result?.likes || 0) },
        })),
      }));
    } catch (error) {
      setToast({ show: true, tone: "error", message: error?.response?.data?.message || "Could not update the reaction." });
    } finally {
      setBusyFlag(`like-${postId}`, false);
    }
  };

  const handleComment = async (postId) => {
    const text = String(commentDrafts[postId] || "").trim();
    if (!text) return;
    try {
      setBusyFlag(`comment-${postId}`, true);
      const result = await addCareerPulseComment(postId, { text });
      setFeed((prev) => ({
        ...prev,
        posts: updatePost(prev.posts, postId, (post) => ({
          ...post,
          comments: [...(post.comments || []), result?.comment].slice(-8),
          metrics: { ...post.metrics, comments: Number(result?.comments || 0) },
        })),
      }));
      setCommentDrafts((prev) => ({ ...prev, [postId]: "" }));
      setExpandedComments((prev) => ({ ...prev, [postId]: true }));
    } catch (error) {
      setToast({ show: true, tone: "error", message: error?.response?.data?.message || "Failed to add the comment." });
    } finally {
      setBusyFlag(`comment-${postId}`, false);
    }
  };

  const handleShare = async (postId) => {
    try {
      setBusyFlag(`share-${postId}`, true);
      const result = await shareCareerPulsePost(postId);
      const shareUrl = `${window.location.origin}${location.pathname}#post-${postId}`;
      try {
        await navigator.clipboard.writeText(shareUrl);
      } catch {
        // Copy is best effort.
      }
      setFeed((prev) => ({
        ...prev,
        posts: updatePost(prev.posts, postId, (post) => ({
          ...post,
          metrics: { ...post.metrics, shares: Number(result?.shares || 0) },
        })),
      }));
      setToast({ show: true, tone: "success", message: "Post link copied. Share it anywhere." });
    } catch (error) {
      setToast({ show: true, tone: "error", message: error?.response?.data?.message || "Unable to share this post right now." });
    } finally {
      setBusyFlag(`share-${postId}`, false);
    }
  };

  const handleMessage = async (targetId) => {
    try {
      setBusyFlag(`message-${targetId}`, true);
      const result = await startCareerPulseMessage(targetId);
      navigate(result?.route || `${basePath}/messages`);
    } catch (error) {
      setToast({ show: true, tone: "error", message: error?.response?.data?.message || "Could not open the message thread." });
    } finally {
      setBusyFlag(`message-${targetId}`, false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[radial-gradient(circle_at_top,#e8f2ff_0%,#f8fbff_38%,#f5f7fb_100%)]">
        <div className="mx-auto max-w-[1440px] px-4 py-8 sm:px-6 lg:px-8">
          <div className="rounded-[32px] border border-white/80 bg-white/80 p-8 shadow-[0_24px_70px_rgba(15,23,42,0.08)] backdrop-blur">
            <div className="flex items-center gap-3 text-slate-600">
              <FiLoader className="animate-spin text-[#0a66c2]" />
              <span className="text-sm font-semibold">Loading Career Pulse...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#e8f2ff_0%,#f8fbff_38%,#f5f7fb_100%)]">
      <div className="mx-auto max-w-[1440px] px-4 py-6 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className="overflow-hidden rounded-[32px] border border-white/80 bg-white/75 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur">
          <div className={`bg-gradient-to-r ${gradientForRole(feed.viewer?.role)} px-6 py-8 text-white sm:px-8`}>
            <div className="flex flex-wrap items-end justify-between gap-5">
              <div className="max-w-3xl">
                <p className="inline-flex items-center rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[11px] font-black uppercase tracking-[0.22em]">Career Pulse</p>
                <h1 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl">{feed.insights?.title || "Career Pulse"}</h1>
                <p className="mt-3 max-w-2xl text-sm font-medium text-white/85 sm:text-base">
                  {feed.insights?.subtitle || "A social career feed for students and companies to post reels, banners, videos, follow each other, react, comment, and jump into messages."}
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <button type="button" onClick={() => openComposer("text")} className="inline-flex items-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-extrabold text-[#0a66c2] shadow-[0_16px_40px_rgba(15,23,42,0.18)] transition hover:-translate-y-0.5">
                  <FiPlus />
                  Create Post
                </button>
                <button type="button" onClick={refreshFeed} className="inline-flex items-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-5 py-3 text-sm font-bold text-white transition hover:bg-white/15">
                  {refreshing ? <FiLoader className="animate-spin" /> : <FiTrendingUp />}
                  Refresh Feed
                </button>
              </div>
            </div>
          </div>

          <div className="grid gap-6 px-4 py-6 xl:grid-cols-[290px_minmax(0,1fr)_320px] sm:px-6 lg:px-8">
            <aside className="space-y-5">
              <section className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
                <div className="bg-[linear-gradient(135deg,#0a66c2_0%,#2c7dd1_55%,#eaf4ff_100%)] px-5 pb-7 pt-6 text-white">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.18em] text-white/70">{feed.viewer?.badge || "Member"}</p>
                      <h2 className="mt-2 text-xl font-black">{feed.viewer?.name || "Career Pulse"}</h2>
                      <p className="mt-2 text-sm font-medium text-white/80">{feed.viewer?.headline || ""}</p>
                    </div>
                    <Avatar name={feed.viewer?.name} avatarUrl={feed.viewer?.avatarUrl} />
                  </div>
                </div>
                <div className="space-y-5 px-5 py-5">
                  <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-600">
                    <FiMapPin className="text-[#0a66c2]" />
                    {feed.viewer?.location || "India"}
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <MetricPill label="Followers" value={feed.viewer?.followers || 0} />
                    <MetricPill label="Following" value={feed.viewer?.following || 0} />
                    <MetricPill label="Posts" value={feed.viewer?.posts || 0} />
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
                      <span>Profile strength</span>
                      <span>{feed.viewer?.profileStrength || 0}%</span>
                    </div>
                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200">
                      <div
                        className="h-full rounded-full bg-[linear-gradient(90deg,#0a66c2_0%,#48a7ff_60%,#ffbf66_100%)]"
                        style={{ width: `${Math.max(0, Math.min(100, Number(feed.viewer?.profileStrength || 0)))}%` }}
                      />
                    </div>
                    <p className="mt-3 text-sm text-slate-600">
                      {feed.viewer?.intro || "Complete your public profile to look sharper in the social feed."}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">Focus Areas</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {(feed.viewer?.focusTags || []).length ? (
                        feed.viewer.focusTags.map((tag) => (
                          <span key={`${feed.viewer.id}-${tag}`} className="rounded-full border border-[#d5e7fb] bg-[#f3f9ff] px-3 py-1 text-xs font-bold text-[#0a66c2]">
                            {tag}
                          </span>
                        ))
                      ) : (
                        <span className="text-sm text-slate-500">Add skills or company details to show focus tags.</span>
                      )}
                    </div>
                  </div>
                </div>
              </section>

              <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">Quick Publish</p>
                    <h3 className="mt-2 text-lg font-black text-slate-900">Start with a format</h3>
                  </div>
                  <FiCompass className="text-xl text-[#0a66c2]" />
                </div>
                <div className="mt-4 space-y-3">
                  {quickActions.map((item) => (
                    <button key={item.value} type="button" onClick={() => openComposer(item.value)} className="flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-left transition hover:border-[#b7d8fb] hover:bg-[#f5faff]">
                      <div className="flex items-center gap-3">
                        <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-lg text-[#0a66c2] shadow-sm">{item.icon}</span>
                        <div>
                          <p className="text-sm font-extrabold text-slate-900">{item.label}</p>
                          <p className="text-xs text-slate-500">Open composer with this format</p>
                        </div>
                      </div>
                      <FiArrowUpRight className="text-slate-400" />
                    </button>
                  ))}
                </div>
              </section>
            </aside>

            <main className="space-y-5">
              <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-start gap-4">
                  <Avatar name={feed.viewer?.name} avatarUrl={feed.viewer?.avatarUrl} small />
                  <button type="button" onClick={() => openComposer("text")} className="flex-1 rounded-[24px] border border-slate-200 bg-[linear-gradient(135deg,#f4f9ff_0%,#ffffff_55%,#fff8ed_100%)] px-5 py-4 text-left shadow-sm transition hover:border-[#b8d9fb]">
                    <p className="text-sm font-semibold text-slate-500">Share a reel, banner, video, or career update</p>
                    <p className="mt-1 text-lg font-black text-slate-900">What is moving on your journey today?</p>
                  </button>
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  {quickActions.map((item) => (
                    <button key={`launcher-${item.value}`} type="button" onClick={() => openComposer(item.value)} className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-left transition hover:border-[#b8d9fb] hover:bg-[#f7fbff]">
                      <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-[#0a66c2] shadow-sm">{item.icon}</span>
                      <div>
                        <p className="text-sm font-extrabold text-slate-900">{item.label}</p>
                        <p className="text-xs text-slate-500">Post quickly</p>
                      </div>
                    </button>
                  ))}
                </div>
              </section>

              {(feed.posts || []).length ? (
                feed.posts.map((post, index) => {
                  const showAllComments = Boolean(expandedComments[post.id]);
                  const comments = showAllComments ? post.comments || [] : (post.comments || []).slice(-2);
                  return (
                    <motion.article key={post.id} id={`post-${post.id}`} initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.04 }} className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
                      <div className="px-5 py-5">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-start gap-3">
                            <Avatar name={post.author?.name} avatarUrl={post.author?.avatarUrl} />
                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <h3 className="text-base font-black text-slate-900">{post.author?.name}</h3>
                                <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-bold text-slate-500">{post.author?.badge || "Member"}</span>
                              </div>
                              <p className="mt-1 text-sm text-slate-600">{post.author?.headline}</p>
                              <div className="mt-2 flex flex-wrap items-center gap-3 text-xs font-semibold text-slate-400">
                                <span className="inline-flex items-center gap-1"><FiClock />{timeAgo(post.createdAt)}</span>
                                <span>{post.author?.followers || 0} followers</span>
                              </div>
                            </div>
                          </div>

                          {post.author?.canFollow ? (
                            <button type="button" disabled={busy[`follow-${post.author.id}`]} onClick={() => handleFollow(post.author.id)} className={`rounded-full px-4 py-2 text-sm font-extrabold transition ${post.author?.isFollowed ? "border border-slate-200 bg-slate-50 text-slate-700" : "bg-[#0a66c2] text-white shadow-[0_10px_30px_rgba(10,102,194,0.2)]"}`}>
                              {busy[`follow-${post.author.id}`] ? "Updating..." : post.author?.isFollowed ? "Following" : "+ Follow"}
                            </button>
                          ) : null}
                        </div>

                        {post.headline ? <h4 className="mt-4 text-xl font-black text-slate-900">{post.headline}</h4> : null}
                        {post.content ? <p className="mt-3 whitespace-pre-wrap text-[15px] leading-7 text-slate-700">{post.content}</p> : null}

                        {(post.tags || []).length ? (
                          <div className="mt-4 flex flex-wrap gap-2">
                            {post.tags.map((tag) => (
                              <span key={`${post.id}-${tag}`} className="rounded-full border border-[#d5e7fb] bg-[#f4f9ff] px-3 py-1 text-xs font-bold text-[#0a66c2]">
                                #{String(tag).replace(/^#/, "")}
                              </span>
                            ))}
                          </div>
                        ) : null}
                      </div>

                      <PostMedia post={post} />

                      <div className="border-t border-slate-100 px-5 py-4">
                        <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-slate-500">
                          <div className="flex flex-wrap gap-4">
                            <span className="font-semibold">{post.metrics?.likes || 0} likes</span>
                            <span className="font-semibold">{post.metrics?.comments || 0} comments</span>
                            <span className="font-semibold">{post.metrics?.shares || 0} shares</span>
                          </div>
                          <span className="text-xs font-semibold text-slate-400">{post.type === "reel" ? "Reel post" : post.type === "video" ? "Video post" : "Career Pulse"}</span>
                        </div>

                        <div className="mt-4 grid gap-2 sm:grid-cols-4">
                          <ActionButton active={post.viewerState?.liked} busy={busy[`like-${post.id}`]} icon={<FiThumbsUp />} label={post.viewerState?.liked ? "Liked" : "Like"} onClick={() => handleLike(post.id)} />
                          <ActionButton icon={<FiMessageSquare />} label="Comment" onClick={() => document.getElementById(`comment-box-${post.id}`)?.focus()} />
                          <ActionButton busy={busy[`share-${post.id}`]} icon={<FiShare2 />} label="Share" onClick={() => handleShare(post.id)} />
                          {post.author?.canMessage ? (
                            <ActionButton busy={busy[`message-${post.author.id}`]} icon={<FiSend />} label="Message" onClick={() => handleMessage(post.author.id)} />
                          ) : (
                            <ActionButton icon={<FiUsers />} label="In Network" disabled onClick={() => {}} />
                          )}
                        </div>

                        <div className="mt-4 space-y-3">
                          {(post.comments || []).length > 2 ? (
                            <button type="button" onClick={() => setExpandedComments((prev) => ({ ...prev, [post.id]: !prev[post.id] }))} className="text-sm font-bold text-[#0a66c2]">
                              {showAllComments ? "Hide some comments" : `View all ${post.metrics?.comments || post.comments.length} comments`}
                            </button>
                          ) : null}

                          {comments.map((comment) => (
                            <div key={comment.id} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                              <div className="flex items-start gap-3">
                                <Avatar name={comment.author?.name} avatarUrl={comment.author?.avatarUrl} small />
                                <div className="min-w-0 flex-1">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <p className="text-sm font-extrabold text-slate-900">{comment.author?.name}</p>
                                    <span className="text-xs text-slate-400">{timeAgo(comment.createdAt)}</span>
                                  </div>
                                  <p className="text-xs font-semibold text-slate-500">{comment.author?.headline}</p>
                                  <p className="mt-2 text-sm leading-6 text-slate-700">{comment.text}</p>
                                </div>
                              </div>
                            </div>
                          ))}

                          <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                            <Avatar name={feed.viewer?.name} avatarUrl={feed.viewer?.avatarUrl} small />
                            <input id={`comment-box-${post.id}`} value={commentDrafts[post.id] || ""} onChange={(event) => setCommentDrafts((prev) => ({ ...prev, [post.id]: event.target.value }))} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); handleComment(post.id); } }} placeholder="Write a thoughtful comment..." className="h-11 flex-1 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none transition focus:border-[#b8d9fb] focus:bg-white" />
                            <button type="button" disabled={busy[`comment-${post.id}`]} onClick={() => handleComment(post.id)} className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-[#0a66c2] text-white transition hover:bg-[#0858a7] disabled:opacity-60">
                              {busy[`comment-${post.id}`] ? <FiLoader className="animate-spin" /> : <FiSend />}
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.article>
                  );
                })
              ) : (
                <section className="rounded-[28px] border border-dashed border-[#b8d9fb] bg-[linear-gradient(135deg,#f4f9ff_0%,#ffffff_55%,#fff8ed_100%)] p-8 text-center shadow-sm">
                  <span className="mx-auto inline-flex h-16 w-16 items-center justify-center rounded-full bg-white text-2xl text-[#0a66c2] shadow-sm"><FiTrendingUp /></span>
                  <h3 className="mt-5 text-2xl font-black text-slate-900">The feed is waiting for the first story</h3>
                  <p className="mt-3 text-sm leading-7 text-slate-600">Start the community with a reel, banner, or quick update. Students can post project moments and companies can post hiring highlights from the same space.</p>
                  <button type="button" onClick={() => openComposer("text")} className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-[#0a66c2] px-5 py-3 text-sm font-extrabold text-white shadow-[0_18px_40px_rgba(10,102,194,0.18)]">
                    <FiPlus />
                    Create the first post
                  </button>
                </section>
              )}
            </main>

            <aside className="space-y-5">
              <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">Who to Follow</p>
                    <h3 className="mt-2 text-lg font-black text-slate-900">Fresh voices in the network</h3>
                  </div>
                  <FiUsers className="text-xl text-[#0a66c2]" />
                </div>
                <div className="mt-4 space-y-4">
                  {(feed.suggestions || []).map((item) => (
                    <div key={item.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <div className="flex items-start gap-3">
                        <Avatar name={item.name} avatarUrl={item.avatarUrl} />
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="truncate text-sm font-extrabold text-slate-900">{item.name}</p>
                            <span className="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-bold text-slate-500">{item.badge}</span>
                          </div>
                          <p className="mt-1 text-xs font-semibold text-slate-500">{item.headline}</p>
                          <p className="mt-2 text-xs text-slate-500">{item.reason}</p>
                          <div className="mt-3 flex flex-wrap items-center gap-3 text-[11px] font-bold text-slate-400">
                            <span>{item.followers || 0} followers</span>
                            <span>{item.posts || 0} posts</span>
                          </div>
                        </div>
                      </div>
                      <div className={`mt-4 grid gap-2 ${item.canMessage ? "sm:grid-cols-2" : ""}`}>
                        <button type="button" disabled={busy[`follow-${item.id}`]} onClick={() => handleFollow(item.id)} className={`rounded-2xl px-4 py-2.5 text-sm font-extrabold transition ${item.isFollowing ? "border border-slate-200 bg-white text-slate-700" : "bg-[#0a66c2] text-white"}`}>
                          {busy[`follow-${item.id}`] ? "Updating..." : item.isFollowing ? "Following" : "Follow"}
                        </button>
                        {item.canMessage ? (
                          <button type="button" disabled={busy[`message-${item.id}`]} onClick={() => handleMessage(item.id)} className="rounded-2xl border border-[#b8d9fb] bg-[#f4f9ff] px-4 py-2.5 text-sm font-extrabold text-[#0a66c2]">
                            Message
                          </button>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">Trending</p>
                    <h3 className="mt-2 text-lg font-black text-slate-900">Topics gaining traction</h3>
                  </div>
                  <FiHash className="text-xl text-[#0a66c2]" />
                </div>
                <div className="mt-4 space-y-3">
                  {(feed.trending || []).map((item) => (
                    <div key={item.tag} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-extrabold text-slate-900">{item.tag}</p>
                          <p className="mt-1 text-xs text-slate-500">{item.count ? `${item.count} recent posts` : "Ready for the first post"}</p>
                        </div>
                        <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-black text-[#0a66c2] shadow-sm">Pulse</span>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <section className="rounded-[28px] border border-slate-200 bg-[linear-gradient(135deg,#0f172a_0%,#133a66_55%,#0a66c2_100%)] p-5 text-white shadow-sm">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-white/60">Messages</p>
                <h3 className="mt-2 text-xl font-black">Keep the conversation moving</h3>
                <p className="mt-3 text-sm leading-7 text-white/80">Open your inbox to continue social introductions, shortlist conversations, and follow-ups with the people you meet on Career Pulse.</p>
                <button type="button" onClick={() => navigate(`${basePath}/messages`)} className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-extrabold text-[#0a66c2]">
                  Open Messages
                  <FiArrowUpRight />
                </button>
              </section>
            </aside>
          </div>
        </motion.div>
      </div>

      <Modal
        open={composerOpen}
        onClose={closeComposer}
        title="Create Career Pulse Post"
        widthClass="max-w-3xl"
        footer={
          <>
            <button type="button" onClick={closeComposer} className="rounded-2xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-700">Cancel</button>
            <button type="button" disabled={busy.publish} onClick={publishPost} className="rounded-2xl bg-[#0a66c2] px-5 py-2.5 text-sm font-extrabold text-white disabled:opacity-60">
              {busy.publish ? "Publishing..." : "Publish Post"}
            </button>
          </>
        }
      >
        <div className="space-y-5">
          <div className="grid gap-3 sm:grid-cols-2">
            {postTypeOptions.map((option) => (
              <button key={option.value} type="button" onClick={() => setComposer((prev) => ({ ...prev, type: option.value }))} className={`rounded-[24px] border p-4 text-left transition ${composer.type === option.value ? "border-[#9eceff] bg-[#f4f9ff] shadow-sm" : "border-slate-200 bg-white hover:bg-slate-50"}`}>
                <div className="flex items-center gap-3">
                  <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-lg text-[#0a66c2] shadow-sm">{option.icon}</span>
                  <div>
                    <p className="text-sm font-extrabold text-slate-900">{option.label}</p>
                    <p className="text-xs text-slate-500">{option.helper}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-2 block text-xs font-black uppercase tracking-[0.18em] text-slate-400">Headline</span>
              <input value={composer.headline} onChange={(event) => setComposer((prev) => ({ ...prev, headline: event.target.value }))} placeholder="Give this post a strong hook" className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none transition focus:border-[#b8d9fb] focus:bg-white" />
            </label>
            <label className="block">
              <span className="mb-2 block text-xs font-black uppercase tracking-[0.18em] text-slate-400">Visibility</span>
              <select value={composer.visibility} onChange={(event) => setComposer((prev) => ({ ...prev, visibility: event.target.value }))} className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none transition focus:border-[#b8d9fb] focus:bg-white">
                <option value="everyone">Everyone</option>
                <option value="followers">Followers</option>
              </select>
            </label>
          </div>

          <label className="block">
            <span className="mb-2 block text-xs font-black uppercase tracking-[0.18em] text-slate-400">Content</span>
            <textarea value={composer.content} onChange={(event) => setComposer((prev) => ({ ...prev, content: event.target.value }))} rows={6} placeholder="Talk about a campus win, a hiring update, a launch, a project reel, or a useful insight for the community." className="w-full rounded-[24px] border border-slate-200 bg-slate-50 px-4 py-4 text-sm leading-7 outline-none transition focus:border-[#b8d9fb] focus:bg-white" />
          </label>

          <label className="block rounded-[24px] border border-dashed border-[#b8d9fb] bg-[linear-gradient(135deg,#f4f9ff_0%,#ffffff_55%,#fff8ed_100%)] p-5">
            <span className="mb-2 block text-xs font-black uppercase tracking-[0.18em] text-slate-400">Attach media</span>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-base font-black text-slate-900">{composer.file?.name || "Choose a file from your device"}</p>
                <p className="mt-1 text-sm text-slate-500">Supports banners, images, reels, videos, and documents based on the selected format.</p>
              </div>
              <span className="rounded-2xl bg-white px-4 py-2 text-sm font-extrabold text-[#0a66c2] shadow-sm">Upload</span>
            </div>
            <input type="file" accept={mediaAcceptForType(composer.type)} className="mt-4 block w-full text-sm text-slate-600" onChange={(event) => handleComposerFile(event.target.files?.[0] || null)} />
          </label>

          {composerPreview ? (
            isVideoPost({ type: composer.type, media: { mimeType: composer.file?.type } }) ? (
              <div className="overflow-hidden rounded-[24px] border border-slate-200 bg-slate-950">
                <video src={composerPreview} controls className="max-h-[420px] w-full object-contain" />
              </div>
            ) : (
              <div className="overflow-hidden rounded-[24px] border border-slate-200 bg-slate-100">
                <img src={composerPreview} alt="Preview" className="max-h-[420px] w-full object-contain" />
              </div>
            )
          ) : composer.file ? (
            <div className="flex items-center justify-between rounded-[24px] border border-slate-200 bg-slate-50 px-4 py-3">
              <div className="flex items-center gap-3">
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-[#0a66c2] shadow-sm"><FiFileText /></span>
                <div>
                  <p className="text-sm font-extrabold text-slate-900">{composer.file.name}</p>
                  <p className="text-xs text-slate-500">{Math.max(1, Math.round((composer.file.size || 0) / 1024))} KB</p>
                </div>
              </div>
              <button type="button" onClick={() => handleComposerFile(null)} className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-500"><FiX /></button>
            </div>
          ) : null}
        </div>
      </Modal>

      <Toast show={toast.show} tone={toast.tone} message={toast.message} onClose={() => setToast((prev) => ({ ...prev, show: false }))} />
    </div>
  );
}

function Avatar({ name, avatarUrl, small = false }) {
  const size = small ? "h-10 w-10 text-sm" : "h-14 w-14 text-base";
  const mediaUrl = toAbsoluteMediaUrl(avatarUrl);
  if (mediaUrl) {
    return <img src={mediaUrl} alt={name || "Avatar"} className={`${size} rounded-2xl object-cover shadow-sm`} />;
  }
  return (
    <span className={`inline-flex ${size} items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#0a66c2_0%,#51a8ff_60%,#ffd08a_100%)] font-black text-white shadow-sm`}>
      {initials(name || "User")}
    </span>
  );
}

function MetricPill({ label, value }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-center">
      <p className="text-lg font-black text-slate-900">{value}</p>
      <p className="mt-1 text-[11px] font-bold uppercase tracking-[0.12em] text-slate-400">{label}</p>
    </div>
  );
}

function ActionButton({ icon, label, onClick, active = false, busy = false, disabled = false }) {
  return (
    <button
      type="button"
      disabled={disabled || busy}
      onClick={onClick}
      className={`flex items-center justify-center gap-2 rounded-2xl border px-4 py-3 text-sm font-extrabold transition ${
        disabled
          ? "cursor-not-allowed border-slate-200 bg-slate-50 text-slate-400"
          : active
          ? "border-[#b8d9fb] bg-[#f4f9ff] text-[#0a66c2]"
          : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
      }`}
    >
      {busy ? <FiLoader className="animate-spin" /> : icon}
      {label}
    </button>
  );
}

function PostMedia({ post }) {
  const mediaUrl = toAbsoluteMediaUrl(post?.media?.url);
  if (!mediaUrl) return null;

  if (isVideoPost(post)) {
    return (
      <div className={`bg-slate-950 ${post.type === "reel" ? "flex justify-center px-5 pb-5" : ""}`}>
        <video
          src={mediaUrl}
          controls
          className={`w-full object-cover ${post.type === "reel" ? "max-h-[560px] max-w-[420px] rounded-[28px]" : "max-h-[520px]"}`}
        />
      </div>
    );
  }

  if (post.type === "document") {
    return (
      <div className="border-y border-slate-100 bg-[linear-gradient(135deg,#f4f9ff_0%,#ffffff_55%,#fff8ed_100%)] px-5 py-5">
        <div className="flex items-center justify-between rounded-[24px] border border-slate-200 bg-white px-5 py-4 shadow-sm">
          <div className="flex items-center gap-4">
            <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-[#f4f9ff] text-2xl text-[#0a66c2]">
              <FiFileText />
            </span>
            <div>
              <p className="text-base font-black text-slate-900">Attached document</p>
              <p className="text-sm text-slate-500">Open the file in a new tab</p>
            </div>
          </div>
          <a href={mediaUrl} target="_blank" rel="noreferrer" className="rounded-2xl bg-[#0a66c2] px-4 py-2.5 text-sm font-extrabold text-white">
            Open
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden border-y border-slate-100 bg-slate-100">
      <img src={mediaUrl} alt={post.headline || post.author?.name || "Post media"} className="max-h-[520px] w-full object-cover" />
    </div>
  );
}
