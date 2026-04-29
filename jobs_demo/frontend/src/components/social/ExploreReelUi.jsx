import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  FiBookmark,
  FiCopy,
  FiFlag,
  FiFileText,
  FiHeart,
  FiLoader,
  FiMessageSquare,
  FiMoreHorizontal,
  FiPause,
  FiPlay,
  FiSend,
  FiVolume2,
  FiVolumeX,
  FiX,
} from "react-icons/fi";
import { toAbsoluteMediaUrl } from "../../utils/media.js";

function initials(name = "") {
  return String(name || "")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function formatCount(value = 0) {
  const total = Number(value || 0);
  if (total >= 1000000) return `${(total / 1000000).toFixed(total >= 10000000 ? 0 : 1)}M`;
  if (total >= 1000) return `${(total / 1000).toFixed(total >= 10000 ? 0 : 1)}K`;
  return `${total}`;
}

function excerpt(text = "", max = 120) {
  const value = String(text || "").trim();
  if (value.length <= max) return value;
  return `${value.slice(0, max).trim()}...`;
}

function isVideoPost(post) {
  const type = String(post?.type || "").toLowerCase();
  const mime = String(post?.media?.mimeType || "").toLowerCase();
  const resourceType = String(post?.media?.resourceType || "").toLowerCase();
  return type === "video" || type === "reel" || mime.startsWith("video/") || resourceType === "video";
}

function isSafetyHidden(post) {
  return String(post?.moderation?.status || "").toLowerCase() === "hidden";
}

export function Avatar({ name, avatarUrl, small = false }) {
  const size = small ? "h-10 w-10 text-sm" : "h-12 w-12 text-sm";
  const mediaUrl = toAbsoluteMediaUrl(avatarUrl);
  if (mediaUrl) {
    return <img src={mediaUrl} alt={name || "Avatar"} className={`${size} rounded-full object-cover shadow-sm`} />;
  }
  return (
    <span className={`inline-flex ${size} items-center justify-center rounded-full bg-[linear-gradient(135deg,#18181b_0%,#4338ca_60%,#fb7185_100%)] font-black text-white shadow-sm`}>
      {initials(name || "User")}
    </span>
  );
}

export function MobileHeaderButton({ icon, onClick, label }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-black/10 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50"
    >
      {icon}
    </button>
  );
}

export function DockButton({ icon, label, onClick, active = false }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      className={`inline-flex h-12 w-12 items-center justify-center rounded-full border text-lg transition ${
        active ? "border-[#111111] bg-[#111111] text-white" : "border-black/10 bg-white text-slate-700 hover:bg-slate-50"
      }`}
    >
      {icon}
    </button>
  );
}

export function NavBubble({ icon, label, onClick, disabled = false }) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="pointer-events-auto inline-flex h-16 w-16 items-center justify-center rounded-full border border-black/5 bg-white/90 text-2xl text-slate-700 shadow-[0_18px_44px_rgba(15,23,42,0.12)] backdrop-blur transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-40"
    >
      {icon}
    </button>
  );
}

export function SidePanelCard({ children, className = "" }) {
  return (
    <section className={`rounded-[30px] border border-black/5 bg-white/80 p-5 shadow-[0_20px_70px_rgba(15,23,42,0.08)] backdrop-blur ${className}`}>
      {children}
    </section>
  );
}

export function MetricBlock({ label, value, dark = false }) {
  return (
    <div className={`rounded-[20px] px-3 py-3 text-center ${dark ? "bg-white/8 text-white" : "border border-black/5 bg-slate-50 text-slate-900"}`}>
      <p className="text-lg font-black">{formatCount(value)}</p>
      <p className={`mt-1 text-[10px] font-black uppercase tracking-[0.18em] ${dark ? "text-white/45" : "text-slate-400"}`}>{label}</p>
    </div>
  );
}

export function InlineActionButton({ icon, label, onClick, disabled = false }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
    >
      {icon}
      {label}
    </button>
  );
}

export function ReelSlide({
  post,
  isActive,
  isMuted,
  pinned,
  nextPost,
  expanded,
  busy,
  timeAgo,
  onToggleMute,
  onTogglePin,
  onToggleCaption,
  onLike,
  onSave,
  onShare,
  onComment,
  onFollow,
  onMessage,
  onReport,
  onMediaRef,
}) {
  const videoRef = useRef(null);
  const holdRef = useRef(false);
  const watchTimerRef = useRef(null);
  const mediaUrl = toAbsoluteMediaUrl(post?.media?.url);
  const hasCaption = Boolean(String(post?.content || "").trim());
  const caption = expanded ? post.content : excerpt(post.content, 110);
  const isVideo = isVideoPost(post);
  const safetyHidden = isSafetyHidden(post);
  const [paused, setPaused] = useState(false);
  const [lastTap, setLastTap] = useState(0);
  const [showHeart, setShowHeart] = useState(false);
  const [views] = useState(Number(post?.metrics?.impressions || 0));
  const [watchTime, setWatchTime] = useState(0);

  useEffect(() => {
    if (!isVideo) return undefined;
    const node = videoRef.current;
    if (!node) return undefined;
    if (onMediaRef) onMediaRef(node);
    return () => {
      if (onMediaRef) onMediaRef(null);
    };
  }, [isVideo, onMediaRef, post?.id]);

  useEffect(() => {
    if (!isVideo) return;
    const node = videoRef.current;
    if (!node) return;
    node.muted = isMuted;
    node.volume = isMuted ? 0 : 1;
    if (isActive && !paused && !safetyHidden) {
      const promise = node.play();
      if (promise?.catch) promise.catch(() => {});
    } else {
      node.pause();
    }
  }, [isActive, isMuted, isVideo, paused, safetyHidden]);

  useEffect(() => {
    if (!isActive || paused) return undefined;
    const timer = window.setInterval(() => {
      setWatchTime((value) => value + 1);
    }, 1000);
    watchTimerRef.current = timer;
    return () => window.clearInterval(timer);
  }, [isActive, paused]);

  useEffect(() => {
    const nextMediaUrl = toAbsoluteMediaUrl(nextPost?.media?.url);
    if (!nextMediaUrl) return;
    if (isVideoPost(nextPost)) {
      const node = document.createElement("video");
      node.preload = "metadata";
      node.src = nextMediaUrl;
      return;
    }
    const img = new Image();
    img.src = nextMediaUrl;
  }, [nextPost]);

  const handleHoldStart = () => {
    if (!isActive || safetyHidden) return;
    holdRef.current = true;
    setPaused(true);
    videoRef.current?.pause();
  };

  const handleHoldEnd = () => {
    if (!holdRef.current) return;
    holdRef.current = false;
    setPaused(false);
    if (isActive && !safetyHidden) {
      const promise = videoRef.current?.play?.();
      if (promise?.catch) promise.catch(() => {});
    }
  };

  const handleMediaTap = () => {
    const now = Date.now();
    if (now - lastTap < 300 && !safetyHidden) {
      onLike?.();
      setShowHeart(true);
      window.setTimeout(() => setShowHeart(false), 800);
    }
    setLastTap(now);
  };

  return (
    <div className="flex min-h-full items-center justify-center px-1 py-1 md:px-6">
      <motion.article
        initial={false}
        animate={{ opacity: isActive ? 1 : 0.62, scale: isActive ? 1 : 0.97 }}
        transition={{ duration: 0.22 }}
        className="relative flex w-full items-center justify-center gap-5"
      >
        <div className="relative aspect-[9/16] w-full max-w-[430px] overflow-hidden rounded-[34px] border border-white/10 bg-[#050505] text-white shadow-[0_42px_120px_rgba(0,0,0,0.34)] md:w-[430px] md:shrink-0">
          {safetyHidden ? (
            <SafetyRemovedPanel />
          ) : (
            <div
              className="absolute inset-0"
              onClick={handleMediaTap}
              onMouseDown={handleHoldStart}
              onMouseUp={handleHoldEnd}
              onMouseLeave={handleHoldEnd}
              onTouchStart={handleHoldStart}
              onTouchEnd={handleHoldEnd}
            >
              <ReelMedia post={post} mediaUrl={mediaUrl} isMuted={isMuted} onToggleMute={onToggleMute} onMediaRef={(node) => {
                videoRef.current = node;
                onMediaRef?.(node);
              }} />
              <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-black/80 via-black/28 to-transparent" />
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-72 bg-gradient-to-t from-black via-black/78 to-transparent" />
              {showHeart ? (
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                  <motion.div
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1.45, opacity: 1 }}
                    transition={{ duration: 0.42 }}
                    className="text-[5rem] text-[#ef4444]"
                  >
                    ❤
                  </motion.div>
                </div>
              ) : null}
              {paused ? (
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                  <div className="rounded-full border border-white/10 bg-black/45 px-4 py-2 text-sm font-black text-white backdrop-blur">
                    Paused
                  </div>
                </div>
              ) : null}
            </div>
          )}

          <div className="absolute left-4 top-4 flex flex-wrap items-center gap-2 text-[11px] font-black uppercase tracking-[0.18em]">
            <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1">Explore</span>
            <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1">{safetyHidden ? "Safety" : post.type}</span>
            <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1">{timeAgo(post.createdAt)}</span>
          </div>

          <div className="absolute bottom-5 right-4 flex md:hidden">
            <ReelActionRail post={post} busy={busy} onLike={onLike} onComment={onComment} onSave={onSave} onShare={onShare} onMessage={onMessage} onReport={onReport} compact isVideo={isVideo} isMuted={isMuted} onToggleMute={onToggleMute} />
          </div>

          <div className="absolute bottom-0 left-0 right-0 px-5 pb-5 pt-16">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Avatar name={post.author?.name} avatarUrl={post.author?.avatarUrl} />
                {post.author?.isOnline ? <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-green-500" /> : null}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate text-base font-black">{post.author?.name}</p>
                  <span className="rounded-full border border-white/15 bg-white/10 px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.16em] text-white/75">
                    {post.author?.badge || "Member"}
                  </span>
                </div>
                <p className="mt-1 truncate text-sm text-white/65">{post.author?.headline}</p>
              </div>
              {!safetyHidden && post.author?.canFollow ? (
                <button
                  type="button"
                  disabled={busy[`follow-${post.author?.id}`]}
                  onClick={onFollow}
                  className={`rounded-full px-4 py-2 text-sm font-extrabold transition ${
                    post.author?.isFollowed ? "border border-white/15 bg-white/10 text-white" : "bg-white text-[#111111]"
                  }`}
                >
                  {busy[`follow-${post.author?.id}`] ? "..." : post.author?.isFollowed ? "Following" : "Follow"}
                </button>
              ) : null}
            </div>

            {post.headline ? <h3 className="mt-4 text-xl font-black leading-tight">{post.headline}</h3> : null}
            {safetyHidden ? (
              <p className="mt-3 text-sm leading-7 text-white/80">
                This reel was removed from Explore after safety reports or moderation checks. The original media is hidden.
              </p>
            ) : hasCaption ? (
              <p className="mt-3 text-sm leading-7 text-white/80">
                {caption}{" "}
                {post.content?.length > 110 ? (
                  <button type="button" onClick={onToggleCaption} className="font-black text-white">
                    {expanded ? "less" : "more"}
                  </button>
                ) : null}
              </p>
            ) : null}

            {!safetyHidden && (post.tags || []).length ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {post.tags.map((tag) => (
                  <span key={`${post.id}-${tag}`} className="rounded-full border border-white/12 bg-white/8 px-3 py-1 text-xs font-bold text-white/80">
                    #{String(tag).replace(/^#/, "")}
                  </span>
                ))}
              </div>
            ) : null}

            <div className="mt-4 flex items-center justify-between gap-3 text-xs font-semibold text-white/55">
              <div>
                <span>{formatCount(post.metrics?.likes || 0)} likes / {formatCount(post.metrics?.comments || 0)} comments</span>
                <div className="mt-1 text-[11px] text-white/60">
                  👁 {formatCount(views)} • ⏱ {watchTime}s {pinned ? "• Pinned" : ""}
                </div>
              </div>
              <div className="inline-flex items-center gap-2">
                {paused ? <FiPause /> : <FiPlay />}
                {formatCount(post.metrics?.saves || 0)} saved
              </div>
            </div>
          </div>
        </div>

        <div className="hidden md:flex">
          <ReelActionRail post={post} busy={busy} pinned={pinned} onLike={onLike} onComment={onComment} onSave={onSave} onShare={onShare} onMessage={onMessage} onReport={onReport} onTogglePin={onTogglePin} isVideo={isVideo && !safetyHidden} isMuted={isMuted} onToggleMute={onToggleMute} />
        </div>
      </motion.article>
    </div>
  );
}

function ReelActionRail({ post, busy, pinned = false, onLike, onComment, onSave, onShare, onMessage, onReport, onTogglePin, compact = false, isVideo = false, isMuted = true, onToggleMute }) {
  const railClass = compact ? "flex-col gap-3" : "flex-col gap-4";
  const buttonSize = compact ? "h-12 w-12 text-lg" : "h-14 w-14 text-xl";
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const safetyHidden = isSafetyHidden(post);

  useEffect(() => {
    if (!menuOpen) return undefined;
    const handlePointerDown = (event) => {
      if (menuRef.current?.contains(event.target)) return;
      setMenuOpen(false);
    };
    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [menuOpen]);

  return (
    <div className={`flex ${railClass}`}>
      <ReelActionButton icon={<FiHeart />} label={formatCount(post.metrics?.likes || 0)} onClick={onLike} busy={busy[`like-${post.id}`]} active={post.viewerState?.liked} disabled={safetyHidden} buttonSize={buttonSize} tone="like" />
      <ReelActionButton icon={<FiMessageSquare />} label={formatCount(post.metrics?.comments || 0)} onClick={onComment} disabled={safetyHidden} buttonSize={buttonSize} />
      <div ref={menuRef} className="relative">
        <ReelActionButton icon={<FiMoreHorizontal />} label="More" onClick={() => setMenuOpen((prev) => !prev)} active={menuOpen} buttonSize={buttonSize} />
        {menuOpen ? (
          <div className={`absolute z-20 min-w-[150px] rounded-[22px] border border-black/10 bg-white p-2 shadow-[0_18px_44px_rgba(15,23,42,0.16)] ${compact ? "right-14 top-1/2 -translate-y-1/2" : "left-1/2 top-full mt-3 -translate-x-1/2"}`}>
            {!safetyHidden ? (
              <button
                type="button"
                onClick={async () => {
                  setMenuOpen(false);
                  if (!onShare) return;
                  await onShare();
                }}
                className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left text-sm font-bold text-slate-700 transition hover:bg-slate-50"
              >
                <FiSend />
                Share reel
              </button>
            ) : null}
            {!safetyHidden ? (
              <button
                type="button"
                onClick={async () => {
                  setMenuOpen(false);
                  await onSave?.();
                }}
                className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left text-sm font-bold text-slate-700 transition hover:bg-slate-50"
              >
                <FiBookmark />
                Save to collection
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => {
                setMenuOpen(false);
                onTogglePin?.();
              }}
              className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left text-sm font-bold text-slate-700 transition hover:bg-slate-50"
            >
              <FiCopy />
              {pinned ? "Unpin reel" : "Pin reel"}
            </button>
            {!safetyHidden && post.author?.canMessage && onMessage ? (
              <button
                type="button"
                onClick={async () => {
                  setMenuOpen(false);
                  await onMessage();
                }}
                className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left text-sm font-bold text-slate-700 transition hover:bg-slate-50"
              >
                <FiMessageSquare />
                Message creator
              </button>
            ) : null}
            {post.viewerState?.canReport ? (
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  onReport?.();
                }}
                className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left text-sm font-bold text-rose-600 transition hover:bg-rose-50"
              >
                <FiFlag />
                Report reel
              </button>
            ) : null}
          </div>
        ) : null}
      </div>
      <ReelActionButton icon={<FiBookmark />} label={formatCount(post.metrics?.saves || 0)} onClick={onSave} busy={busy[`save-${post.id}`]} active={post.viewerState?.saved} disabled={safetyHidden} buttonSize={buttonSize} />
      {isVideo ? (
        <ReelActionButton icon={isMuted ? <FiVolumeX /> : <FiVolume2 />} label="Audio" onClick={onToggleMute} active={!isMuted} buttonSize={buttonSize} tone="audio" />
      ) : null}
    </div>
  );
}

function ReelActionButton({ icon, label, onClick, busy = false, active = false, disabled = false, buttonSize, tone = "default" }) {
  const previousActiveRef = useRef(active);
  const [likePulseKey, setLikePulseKey] = useState(0);

  useEffect(() => {
    if (tone === "like" && active && !previousActiveRef.current) {
      setLikePulseKey((value) => value + 1);
    }
    previousActiveRef.current = active;
  }, [active, tone]);

  const activeButtonClass =
    tone === "like"
      ? "border-[#ef4444] bg-[#ef4444] text-white [&>svg]:fill-current shadow-[0_18px_44px_rgba(239,68,68,0.36)]"
      : tone === "audio"
        ? "border-[#111111] bg-[#111111] text-white"
        : "border-[#111111] bg-[#111111] text-white";

  const labelClass = tone === "like" && active ? "text-[#ef4444]" : "text-slate-600";

  return (
    <div className="flex flex-col items-center gap-1.5">
      <motion.button
        type="button"
        disabled={disabled || busy}
        onClick={onClick}
        whileTap={{ scale: 0.9 }}
        className={`inline-flex ${buttonSize} items-center justify-center rounded-full border transition ${
          disabled
            ? "cursor-not-allowed border-black/5 bg-white/50 text-slate-300"
            : active
              ? activeButtonClass
              : "border-black/10 bg-white text-slate-700 hover:bg-slate-50"
        } relative overflow-hidden`}
      >
        {tone === "like" && active && likePulseKey > 0 ? (
          <motion.span
            key={`like-ring-${likePulseKey}`}
            initial={{ scale: 0.7, opacity: 0.45 }}
            animate={{ scale: 1.7, opacity: 0 }}
            transition={{ duration: 0.42, ease: "easeOut" }}
            className="pointer-events-none absolute inset-0 rounded-full border-2 border-[#f9a8d4]"
          />
        ) : null}
        {busy ? (
          <FiLoader className="animate-spin" />
        ) : (
          <motion.span
            key={tone === "like" ? `like-icon-${active}-${likePulseKey}` : `${tone}-${String(active)}`}
            initial={false}
            animate={
              tone === "like" && active
                ? { scale: [1, 1.28, 0.96, 1], rotate: [0, -10, 8, 0] }
                : { scale: 1, rotate: 0 }
            }
            transition={{ duration: 0.38, times: [0, 0.42, 0.7, 1] }}
            className="inline-flex"
          >
            {icon}
          </motion.span>
        )}
      </motion.button>
      <span className={`text-xs font-black ${labelClass}`}>{label}</span>
    </div>
  );
}

function ReelMedia({ post, mediaUrl, isMuted, onToggleMute, onMediaRef }) {
  if (isVideoPost(post) && mediaUrl) {
    return (
      <>
        <video ref={onMediaRef} src={mediaUrl} loop playsInline muted={isMuted} controls={false} className="absolute inset-0 h-full w-full object-cover" />
        <button
          type="button"
          onClick={onToggleMute}
          className="absolute bottom-5 left-5 inline-flex items-center gap-2 rounded-full bg-black/45 px-4 py-2.5 text-xs font-extrabold uppercase tracking-[0.18em] text-white shadow-lg backdrop-blur transition hover:bg-black/55"
        >
          {isMuted ? <FiVolumeX /> : <FiVolume2 />}
          <span>{isMuted ? "Audio Off" : "Audio On"}</span>
        </button>
      </>
    );
  }

  if (post?.type === "document") {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-[radial-gradient(circle_at_top,#312e81_0%,#111827_45%,#020617_100%)] px-8">
        <div className="w-full max-w-[280px] rounded-[28px] border border-white/10 bg-white/8 p-6 text-center backdrop-blur">
          <span className="mx-auto inline-flex h-16 w-16 items-center justify-center rounded-full bg-white/10 text-3xl text-white">
            <FiFileText />
          </span>
          <p className="mt-4 text-lg font-black text-white">Attached document</p>
          <p className="mt-2 text-sm leading-7 text-white/65">This post includes a document attachment ready for viewers in Explore.</p>
        </div>
      </div>
    );
  }

  if (mediaUrl) {
    return <img src={mediaUrl} alt={post?.headline || post?.author?.name || "Explore media"} className="absolute inset-0 h-full w-full object-cover" />;
  }

  return (
    <div className="absolute inset-0 flex items-center justify-center bg-[radial-gradient(circle_at_top,#1f2937_0%,#111111_48%,#050505_100%)] px-8 text-center">
      <div>
        <p className="text-[11px] font-black uppercase tracking-[0.22em] text-white/45">Text Post</p>
        <h3 className="mt-4 text-3xl font-black leading-tight text-white">{post?.headline || "Fresh update from Explore"}</h3>
        <p className="mt-4 text-base leading-8 text-white/70">{excerpt(post?.content || "Share wins, launches, hiring updates, and portfolio moments in the reel feed.", 220)}</p>
      </div>
    </div>
  );
}

function SafetyRemovedPanel() {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-[radial-gradient(circle_at_top,#3f3f46_0%,#18181b_44%,#09090b_100%)] px-8 text-center">
      <div className="w-full max-w-[290px] rounded-[28px] border border-white/10 bg-white/8 p-6 backdrop-blur">
        <span className="mx-auto inline-flex h-16 w-16 items-center justify-center rounded-full bg-white/10 text-3xl text-white">
          <FiFlag />
        </span>
        <p className="mt-4 text-lg font-black text-white">Content removed for safety</p>
        <p className="mt-2 text-sm leading-7 text-white/70">
          This reel is no longer shown in Explore because it was flagged by moderation or community reports.
        </p>
      </div>
    </div>
  );
}
