import { useEffect, useMemo, useRef, useState } from "react";
import {
  FiChevronLeft,
  FiChevronRight,
  FiClock,
  FiTrash2,
  FiFlag,
  FiHeart,
  FiMoreHorizontal,
  FiMusic,
  FiEye,
  FiPlus,
  FiSend,
  FiVolume2,
  FiVolumeX,
  FiX,
} from "react-icons/fi";
import { Avatar } from "./ExploreReelUi.jsx";
import { toAbsoluteMediaUrl } from "../../utils/media.js";

function isVideoStory(story) {
  const mimeType = String(story?.media?.mimeType || "").toLowerCase();
  const resourceType = String(story?.media?.resourceType || "").toLowerCase();
  return mimeType.startsWith("video/") || resourceType === "video";
}

function remainingTimeLabel(expiresAt) {
  const diff = Math.max(0, new Date(expiresAt || 0).getTime() - Date.now());
  const hours = Math.floor(diff / (60 * 60 * 1000));
  const mins = Math.floor((diff % (60 * 60 * 1000)) / 60000);
  if (hours > 0) return `${hours}h ${mins}m left`;
  if (mins > 0) return `${mins}m left`;
  return "Expires soon";
}

function clampNumber(value, min, max, fallback = min) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return fallback;
  return Math.min(max, Math.max(min, numeric));
}

function durationLabel(seconds) {
  const total = Math.max(0, Math.floor(Number(seconds || 0)));
  const mins = Math.floor(total / 60);
  const secs = total % 60;
  return `${mins}:${String(secs).padStart(2, "0")}`;
}

export default function ExploreStoryViewer({
  open,
  groups = [],
  groupIndex = 0,
  storyIndex = 0,
  onClose,
  onNavigate,
  onCreateStory,
  onLike,
  onReport,
  onShare,
  onDelete,
  onMuteAuthor,
  onHideStory,
  onSendAccount,
  storyInsights,
  onOpenInsights,
  onCloseInsights,
  onStoryInsightsTabChange,
  messageDraft = "",
  onMessageDraftChange,
  onMessageSend,
  liked = false,
  messageBusy = false,
  likeBusy = false,
  deleteBusy = false,
  timeAgo,
}) {
  const activeGroup = groups[groupIndex] || null;
  const activeStory = activeGroup?.items?.[storyIndex] || null;
  const activeAuthor = activeGroup?.author || activeStory?.author || null;
  const mediaUrl = useMemo(() => toAbsoluteMediaUrl(activeStory?.media?.url), [activeStory?.media?.url]);
  const storyMusic = activeStory?.music?.audioUrl ? activeStory.music : null;
  const storyMusicUrl = useMemo(() => toAbsoluteMediaUrl(storyMusic?.audioUrl), [storyMusic?.audioUrl]);
  const videoRef = useRef(null);
  const imageMusicRef = useRef(null);
  const menuRef = useRef(null);
  const messageInputRef = useRef(null);
  const typingTimerRef = useRef(null);
  const holdRef = useRef(false);
  const insightsPausedRef = useRef(false);
  const pausedRef = useRef(false);
  const [progress, setProgress] = useState(0);
  const [storyMuted, setStoryMuted] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [paused, setPaused] = useState(false);
  const [typing, setTyping] = useState(false);
  const [lastTap, setLastTap] = useState(0);
  const [screenshotNotice, setScreenshotNotice] = useState("");

  const isVideo = isVideoStory(activeStory);
  const hasImageMusic = Boolean(!isVideo && storyMusicUrl);
  const hasAudio = Boolean(isVideo || hasImageMusic);
  const hasCaption = Boolean(String(activeStory?.caption || "").trim());
  const mediaStageInsetClass = hasCaption ? "top-24 bottom-24" : "top-20 bottom-10";
  const imageMusicDuration = clampNumber(storyMusic?.durationSeconds, 3, 600, 15);
  const imageMusicStart = clampNumber(storyMusic?.startSeconds, 0, Math.max(0, imageMusicDuration - 3), 0);
  const imageMusicClipDuration = clampNumber(
    storyMusic?.clipDurationSeconds,
    3,
    Math.max(3, imageMusicDuration - imageMusicStart),
    Math.min(15, Math.max(3, imageMusicDuration - imageMusicStart)),
  );
  const imageStoryDurationMs = hasImageMusic ? imageMusicClipDuration * 1000 : 5000;

  const canGoPrev = groupIndex > 0 || storyIndex > 0;
  const canGoNext =
    groupIndex < groups.length - 1 ||
    storyIndex < Number(activeGroup?.items?.length || 0) - 1;
  const storyViews = Math.max(0, Number(activeStory?.metrics?.views || 0));
  const authorPresenceLabel = activeAuthor?.isOnline
    ? "Online"
    : activeAuthor?.lastSeenAt
      ? `Active ${timeAgo?.(activeAuthor.lastSeenAt) || "recently"} ago`
      : `Active ${timeAgo?.(activeStory?.createdAt) || "recently"} ago`;
  const messageStatusLabel = messageBusy
    ? "Sending..."
    : String(messageDraft || "").trim()
      ? "Delivered"
        : activeStory?.viewerState?.seen
          ? "Seen"
          : "Delivered";
  const ownerViewingOwnStory = Boolean(activeAuthor?.isSelf);
  const insightsMetrics = storyInsights?.storyId === activeStory?.id
    ? storyInsights.metrics || { views: storyViews, likes: Number(activeStory?.metrics?.likes || 0) }
    : { views: storyViews, likes: Number(activeStory?.metrics?.likes || 0) };
  const insightsList = storyInsights?.activeTab === "likes"
    ? Array.isArray(storyInsights?.likes) ? storyInsights.likes : []
    : Array.isArray(storyInsights?.viewers) ? storyInsights.viewers : [];

  function navigateRelative(direction) {
    if (!activeGroup) return;

    if (direction < 0) {
      if (storyIndex > 0) {
        onNavigate?.(groupIndex, storyIndex - 1);
        return;
      }
      if (groupIndex > 0) {
        const previousGroup = groups[groupIndex - 1];
        const previousLastStory = Math.max(0, Number(previousGroup?.items?.length || 1) - 1);
        onNavigate?.(groupIndex - 1, previousLastStory);
      }
      return;
    }

    if (storyIndex < Number(activeGroup?.items?.length || 0) - 1) {
      onNavigate?.(groupIndex, storyIndex + 1);
      return;
    }
    if (groupIndex < groups.length - 1) {
      onNavigate?.(groupIndex + 1, 0);
      return;
    }
    onClose?.();
  }

  useEffect(() => {
    if (!open) return;
    setStoryMuted(false);
    setPaused(false);
    pausedRef.current = false;
  }, [open]);

  useEffect(() => {
    setMenuOpen(false);
    setPaused(false);
    pausedRef.current = false;
    setTyping(false);
    setScreenshotNotice("");
    insightsPausedRef.current = false;
  }, [activeStory?.id]);

  useEffect(() => {
    if (!menuOpen) return undefined;

    const handlePointerDown = (event) => {
      if (!menuRef.current?.contains(event.target)) {
        setMenuOpen(false);
      }
    };

    window.addEventListener("pointerdown", handlePointerDown);
    return () => window.removeEventListener("pointerdown", handlePointerDown);
  }, [menuOpen]);

  useEffect(() => {
    if (!open) return undefined;
    const handleKey = (event) => {
      if (event.key === "ArrowRight") navigateRelative(1);
      if (event.key === "ArrowLeft") navigateRelative(-1);
      if (event.key === "PrintScreen") {
        setScreenshotNotice("Screenshot detected. This is a privacy reminder only.");
        window.setTimeout(() => setScreenshotNotice(""), 1800);
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, groupIndex, storyIndex]);

  useEffect(() => {
    if (!open || activeAuthor?.isSelf) return;
    messageInputRef.current?.focus();
  }, [open, activeStory?.id, activeAuthor?.isSelf]);

  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);

  useEffect(() => {
    const next = groups[groupIndex]?.items?.[storyIndex + 1];
    const nextUrl = toAbsoluteMediaUrl(next?.media?.url);
    if (!nextUrl) return;
    if (isVideoStory(next)) {
      const video = document.createElement("video");
      video.preload = "metadata";
      video.src = nextUrl;
      return;
    }
    const img = new Image();
    img.src = nextUrl;
  }, [groupIndex, storyIndex, groups]);

  useEffect(() => {
    if (!open || !activeStory) return undefined;

    setProgress(0);

    if (isVideo && videoRef.current) {
      const node = videoRef.current;

      const syncProgress = () => {
        if (!Number.isFinite(node.duration) || node.duration <= 0) return;
        setProgress(Math.min(100, (node.currentTime / node.duration) * 100));
      };

      const handleLoaded = () => {
        node.currentTime = 0;
        node.muted = storyMuted;
        node.volume = storyMuted ? 0 : 1;
        const playPromise = node.play();
        if (playPromise?.catch) playPromise.catch(() => {});
      };

      const handleEnded = () => {
        setProgress(100);
        navigateRelative(1);
      };

      node.addEventListener("loadedmetadata", handleLoaded);
      node.addEventListener("timeupdate", syncProgress);
      node.addEventListener("ended", handleEnded);
      handleLoaded();

      return () => {
        node.pause();
        node.removeEventListener("loadedmetadata", handleLoaded);
        node.removeEventListener("timeupdate", syncProgress);
        node.removeEventListener("ended", handleEnded);
      };
    }

    if (hasImageMusic && imageMusicRef.current) {
      const node = imageMusicRef.current;
      const start = imageMusicStart;
      const clip = imageMusicClipDuration;
      const stopAt = start + clip;

      const handleLoaded = () => {
        node.currentTime = start;
        node.muted = storyMuted;
        node.volume = storyMuted ? 0 : 1;
        const playPromise = node.play();
        if (playPromise?.catch) {
          playPromise.catch(() => {
            if (!storyMuted) {
              node.muted = true;
              node.volume = 0;
              setStoryMuted(true);
            }
          });
        }
      };

      const handleTimeUpdate = () => {
        if (node.currentTime >= stopAt) {
          node.pause();
        }
      };

      node.addEventListener("loadedmetadata", handleLoaded);
      node.addEventListener("timeupdate", handleTimeUpdate);
      handleLoaded();

      let elapsedMs = 0;
      let lastTick = Date.now();
      const timer = window.setInterval(() => {
        const now = Date.now();
        if (pausedRef.current) {
          lastTick = now;
          return;
        }
        elapsedMs += now - lastTick;
        lastTick = now;
        const nextProgress = Math.min(100, (elapsedMs / imageStoryDurationMs) * 100);
        setProgress(nextProgress);
        if (nextProgress >= 100) {
          window.clearInterval(timer);
          navigateRelative(1);
        }
      }, 100);

      return () => {
        window.clearInterval(timer);
        node.pause();
        node.removeEventListener("loadedmetadata", handleLoaded);
        node.removeEventListener("timeupdate", handleTimeUpdate);
      };
    }

    const durationMs = imageStoryDurationMs;
    let elapsedMs = 0;
    let lastTick = Date.now();
    const timer = window.setInterval(() => {
      const now = Date.now();
      if (pausedRef.current) {
        lastTick = now;
        return;
      }
      elapsedMs += now - lastTick;
      lastTick = now;
      const nextProgress = Math.min(100, (elapsedMs / durationMs) * 100);
      setProgress(nextProgress);
      if (nextProgress >= 100) {
        window.clearInterval(timer);
        navigateRelative(1);
      }
    }, 100);

    return () => window.clearInterval(timer);
  }, [open, activeStory?.id, groupIndex, storyIndex, isVideo, hasImageMusic, imageMusicStart, imageMusicClipDuration, imageStoryDurationMs]);

  useEffect(() => {
    if (!open) return;

    if (videoRef.current) {
      videoRef.current.muted = storyMuted;
      videoRef.current.volume = storyMuted ? 0 : 1;
      if (paused) {
        videoRef.current.pause();
      } else {
        const playPromise = videoRef.current.play();
        if (playPromise?.catch) {
          playPromise.catch(() => {
            if (!storyMuted) {
              videoRef.current.muted = true;
              videoRef.current.volume = 0;
              setStoryMuted(true);
            }
          });
        }
      }
    }

    if (imageMusicRef.current && hasImageMusic) {
      imageMusicRef.current.muted = storyMuted;
      imageMusicRef.current.volume = storyMuted ? 0 : 1;
      if (paused) {
        imageMusicRef.current.pause();
      } else {
        const playPromise = imageMusicRef.current.play();
        if (playPromise?.catch) {
          playPromise.catch(() => {
            if (!storyMuted) {
              imageMusicRef.current.muted = true;
              imageMusicRef.current.volume = 0;
              setStoryMuted(true);
            }
          });
        }
      }
    }
  }, [open, activeStory?.id, hasImageMusic, paused, storyMuted]);

  useEffect(() => () => {
    if (typingTimerRef.current) {
      window.clearTimeout(typingTimerRef.current);
    }
  }, []);

  const handleMessageKeyDown = (event) => {
    if (event.key !== "Enter" || event.shiftKey) return;
    event.preventDefault();
    onMessageSend?.(activeAuthor, activeStory);
  };

  const handleHoldStart = () => {
    holdRef.current = true;
    setPaused(true);
  };

  const handleHoldEnd = () => {
    holdRef.current = false;
    setPaused(false);
  };

  const handleMediaInteraction = () => {
    const now = Date.now();
    if (now - lastTap < 300 && !activeAuthor?.isSelf) {
      onLike?.(activeStory);
    }
    setLastTap(now);
  };

  const handleMessageChange = (value) => {
    onMessageDraftChange?.(value);
    setTyping(true);
    if (typingTimerRef.current) window.clearTimeout(typingTimerRef.current);
    typingTimerRef.current = window.setTimeout(() => setTyping(false), 1000);
  };

  const handleOpenInsights = () => {
    if (!ownerViewingOwnStory) return;
    insightsPausedRef.current = true;
    setPaused(true);
    onOpenInsights?.(activeStory);
  };

  const handleCloseInsights = () => {
    onCloseInsights?.();
    if (insightsPausedRef.current && !holdRef.current) {
      setPaused(false);
    }
    insightsPausedRef.current = false;
  };

  if (!open || !activeStory || !activeGroup) return null;

  return (
    <div className="fixed inset-0 z-[120] bg-black/95 px-3 py-3 sm:px-5 sm:py-5">
      <div className="mx-auto flex h-full max-w-6xl items-center justify-center gap-6">
        <div className="relative flex h-full max-h-[92vh] w-full max-w-[440px] flex-col overflow-hidden rounded-[34px] border border-white/10 bg-[#050505] text-white shadow-[0_42px_120px_rgba(0,0,0,0.45)]">
          <div className="absolute inset-x-0 top-0 z-10 px-4 pb-4 pt-4">
            <div className="flex gap-1.5">
              {(activeGroup.items || []).map((item, index) => {
                const width = index < storyIndex ? 100 : index === storyIndex ? progress : 0;
                return (
                  <span key={item.id} className="h-1 flex-1 overflow-hidden rounded-full bg-white/20">
                    <span className="block h-full rounded-full bg-white transition-[width] duration-100" style={{ width: `${width}%` }} />
                  </span>
                );
              })}
            </div>

            <div className="mt-4 flex items-start justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <div ref={menuRef} className="relative shrink-0">
                  <button
                    type="button"
                    onClick={() => setMenuOpen((prev) => !prev)}
                    onTouchStart={() => setMenuOpen(true)}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-black/35 text-white transition hover:bg-white/15"
                    aria-label="Open story actions"
                  >
                    <FiMoreHorizontal />
                  </button>

                  {menuOpen ? (
                    <div className="absolute left-0 top-12 min-w-[190px] overflow-hidden rounded-[22px] border border-white/10 bg-[#0b0f15]/96 p-2.5 text-sm shadow-[0_24px_60px_rgba(0,0,0,0.42)] backdrop-blur-xl">
                      {activeAuthor?.isSelf ? (
                        <button
                          type="button"
                          onClick={() => {
                            setMenuOpen(false);
                            onDelete?.(activeStory);
                          }}
                          disabled={deleteBusy}
                          className="flex w-full items-center gap-3 rounded-[18px] px-3.5 py-3 text-left font-semibold text-white/92 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          <FiTrash2 className="text-base text-rose-300" />
                          <span>{deleteBusy ? "Deleting..." : "Delete"}</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setMenuOpen(false);
                            onReport?.(activeStory);
                          }}
                          className="flex w-full items-center gap-3 rounded-[18px] px-3.5 py-3 text-left font-semibold text-white/92 transition hover:bg-white/10"
                        >
                          <FiFlag className="text-base text-rose-300" />
                          <span>Report</span>
                        </button>
                      )}
                      {hasAudio ? (
                        <button
                          type="button"
                          onClick={() => {
                            setMenuOpen(false);
                            setStoryMuted((prev) => !prev);
                          }}
                          className="mt-1 flex w-full items-center gap-3 rounded-[18px] px-3.5 py-3 text-left font-semibold text-white/92 transition hover:bg-white/10"
                        >
                          {storyMuted ? <FiVolumeX className="text-base" /> : <FiVolume2 className="text-base" />}
                          <span>{storyMuted ? "Turn Sound On" : "Mute Audio"}</span>
                        </button>
                      ) : null}
                      {!activeAuthor?.isSelf ? (
                        <>
                          <button
                            type="button"
                            onClick={() => {
                              setMenuOpen(false);
                              onSendAccount?.(activeAuthor, activeStory);
                            }}
                            className="mt-1 flex w-full items-center gap-3 rounded-[18px] px-3.5 py-3 text-left font-semibold text-white/92 transition hover:bg-white/10"
                          >
                            <FiSend className="text-base" />
                            <span>Send account</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setMenuOpen(false);
                              onMuteAuthor?.(activeAuthor, activeStory);
                            }}
                            className="mt-1 flex w-full items-center gap-3 rounded-[18px] px-3.5 py-3 text-left font-semibold text-white/92 transition hover:bg-white/10"
                          >
                            <FiVolumeX className="text-base" />
                            <span>Mute this author</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setMenuOpen(false);
                              onHideStory?.(activeStory, activeAuthor);
                            }}
                            className="mt-1 flex w-full items-center gap-3 rounded-[18px] px-3.5 py-3 text-left font-semibold text-white/92 transition hover:bg-white/10"
                          >
                            <FiX className="text-base" />
                            <span>Hide this story</span>
                          </button>
                        </>
                      ) : null}
                    </div>
                  ) : null}
                </div>
                <Avatar name={activeAuthor?.name} avatarUrl={activeAuthor?.avatarUrl} />
                <div className="min-w-0">
                  <p className="truncate text-sm font-black">{activeAuthor?.name || "Story"}</p>
                  <div className="mt-1 flex items-center gap-2 text-xs text-white/65">
                    <FiClock />
                    <span>{authorPresenceLabel}</span>
                    <span>/</span>
                    <span>{remainingTimeLabel(activeStory.expiresAt)}</span>
                  </div>
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-2">
                {activeAuthor?.isSelf ? (
                  <button
                    type="button"
                    onClick={onCreateStory}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-black/35 text-white"
                  >
                    <FiPlus />
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={onClose}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-black/35 text-white"
                >
                  <FiX />
                </button>
              </div>
            </div>
          </div>

          <div
            className="relative flex-1 overflow-hidden bg-[radial-gradient(circle_at_top,#262626_0%,#111111_48%,#050505_100%)]"
            onMouseDown={handleHoldStart}
            onMouseUp={handleHoldEnd}
            onMouseLeave={handleHoldEnd}
            onTouchStart={handleHoldStart}
            onTouchEnd={handleHoldEnd}
            onClick={handleMediaInteraction}
          >
            {mediaUrl ? (
              isVideo ? (
                <>
                  <video
                    src={mediaUrl}
                    autoPlay
                    loop
                    muted
                    playsInline
                    aria-hidden="true"
                    className="absolute inset-0 h-full w-full scale-110 object-cover opacity-45 blur-2xl"
                  />
                  <div className={`absolute inset-x-0 ${mediaStageInsetClass} flex items-center justify-center px-3 sm:px-4`}>
                    <video
                      ref={videoRef}
                      src={mediaUrl}
                      muted={storyMuted}
                      playsInline
                      preload="metadata"
                      className="h-full w-full rounded-[24px] object-contain shadow-[0_22px_70px_rgba(0,0,0,0.42)]"
                    />
                  </div>
                </>
              ) : (
                <>
                  <img
                    src={mediaUrl}
                    alt=""
                    aria-hidden="true"
                    className="absolute inset-0 h-full w-full scale-110 object-cover opacity-45 blur-2xl"
                  />
                  <div className={`absolute inset-x-0 ${mediaStageInsetClass} flex items-center justify-center px-3 sm:px-4`}>
                    <img src={mediaUrl} alt={activeAuthor?.name || "Story"} className="h-full w-full rounded-[24px] object-contain shadow-[0_22px_70px_rgba(0,0,0,0.42)]" />
                  </div>
                  {hasImageMusic ? <audio ref={imageMusicRef} src={storyMusicUrl} preload="metadata" /> : null}
                </>
              )
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-[linear-gradient(135deg,#18181b_0%,#4338ca_60%,#fb7185_100%)] px-8 text-center">
                <p className="text-lg font-black text-white">{activeStory.caption || "Story"}</p>
              </div>
            )}

            <div className="pointer-events-none absolute inset-x-0 top-0 h-36 bg-gradient-to-b from-black/80 via-black/35 to-transparent" />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-black via-black/65 to-transparent" />
            {paused ? (
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <div className="rounded-full border border-white/15 bg-black/45 px-4 py-2 text-sm font-bold text-white backdrop-blur">
                  Paused
                </div>
              </div>
            ) : null}
            {screenshotNotice ? (
              <div className="pointer-events-none absolute left-1/2 top-24 -translate-x-1/2 rounded-full border border-white/10 bg-black/45 px-4 py-2 text-xs font-semibold text-white/90 backdrop-blur">
                {screenshotNotice}
              </div>
            ) : null}

            <button
              type="button"
              onClick={() => navigateRelative(-1)}
              disabled={!canGoPrev}
              className="absolute inset-y-0 left-0 flex w-[22%] items-center justify-start pl-3 text-white/80 disabled:cursor-not-allowed disabled:opacity-0"
            >
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-black/35 backdrop-blur">
                <FiChevronLeft className="text-xl" />
              </span>
            </button>

            <button
              type="button"
              onClick={() => navigateRelative(1)}
              disabled={!canGoNext}
              className="absolute inset-y-0 right-0 flex w-[22%] items-center justify-end pr-3 text-white/80 disabled:cursor-not-allowed disabled:opacity-0"
            >
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-black/35 backdrop-blur">
                <FiChevronRight className="text-xl" />
              </span>
            </button>
          </div>

          <div className="absolute inset-x-0 bottom-0 p-5">
            {ownerViewingOwnStory ? (
              <div className="mb-3 flex justify-start">
                <button
                  type="button"
                  onClick={handleOpenInsights}
                  className="inline-flex items-center gap-2 rounded-[18px] border border-white/15 bg-black/45 px-3.5 py-2.5 text-sm font-semibold text-white/90 backdrop-blur transition hover:bg-black/60"
                >
                  <FiEye className="text-base" />
                  <span>Views</span>
                  <span>{insightsMetrics.views}</span>
                </button>
              </div>
            ) : null}
            {storyMusic?.title ? (
              <div className="mb-3 inline-flex max-w-full animate-pulse items-center gap-2 rounded-full border border-white/15 bg-black/45 px-3 py-2 text-xs font-semibold text-white/90 backdrop-blur">
                <FiMusic />
                <span className="truncate">
                  {storyMusic.title} / {storyMusic.artist || "Unknown artist"} / {durationLabel(imageMusicClipDuration)}
                </span>
              </div>
            ) : null}
            {activeStory.caption ? (
              <p className="rounded-[24px] border border-white/10 bg-black/35 px-4 py-3 text-sm leading-7 text-white/90 backdrop-blur">
                {activeStory.caption}
              </p>
            ) : null}

            {!activeAuthor?.isSelf ? (
              <div className="mt-4 flex items-center gap-3">
                <div className="flex min-w-0 flex-1 items-center gap-2 rounded-full border border-white/25 bg-[#090c11]/88 px-3 py-2.5 backdrop-blur">
                  <textarea
                    ref={messageInputRef}
                    value={messageDraft}
                    onChange={(event) => handleMessageChange(event.target.value)}
                    onKeyDown={handleMessageKeyDown}
                    rows={1}
                    placeholder="Send message"
                    className="max-h-28 min-h-[40px] flex-1 resize-none bg-transparent px-2 py-1 text-sm text-white/90 outline-none placeholder:text-white/45"
                  />
                  <button
                    type="button"
                    onClick={() => onMessageSend?.(activeAuthor, activeStory)}
                    disabled={messageBusy || !String(messageDraft || "").trim()}
                    className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-white text-black transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-55"
                    aria-label="Send story message"
                  >
                    {messageBusy ? <span className="text-xs font-black">...</span> : <FiSend />}
                  </button>
                </div>
                {typing ? <p className="px-3 text-xs text-white/60">Typing...</p> : null}
                <p className="px-3 text-[10px] text-white/50">{messageStatusLabel}</p>

                <button
                  type="button"
                  onClick={() => onLike?.(activeStory)}
                  disabled={likeBusy}
                  className={`inline-flex h-12 w-12 items-center justify-center text-[2rem] transition disabled:cursor-not-allowed disabled:opacity-70 ${
                    liked
                      ? "text-[#ff3040] [&>svg]:fill-current"
                      : "text-white hover:text-white/80"
                  }`}
                  aria-label={liked ? "Unlike story" : "Like story"}
                >
                  <FiHeart />
                </button>

                <button
                  type="button"
                  onClick={() => onShare?.(activeStory)}
                  className="inline-flex h-12 w-12 items-center justify-center text-[2rem] text-white transition hover:text-white/80"
                  aria-label="Share story"
                >
                  <FiSend />
                </button>
              </div>
            ) : null}

            {ownerViewingOwnStory && storyInsights?.open ? (
              <div className="mt-4 overflow-hidden rounded-[28px] border border-white/10 bg-[#090c11]/92 backdrop-blur">
                <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => onStoryInsightsTabChange?.("views")}
                      className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-semibold transition ${
                        storyInsights?.activeTab === "views" ? "bg-white text-black" : "text-white/70 hover:text-white"
                      }`}
                    >
                      <FiEye />
                      <span>{insightsMetrics.views}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onStoryInsightsTabChange?.("likes")}
                      className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-semibold transition ${
                        storyInsights?.activeTab === "likes" ? "bg-white text-black" : "text-white/70 hover:text-white"
                      }`}
                    >
                      <FiHeart />
                      <span>{insightsMetrics.likes}</span>
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={handleCloseInsights}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/80 transition hover:bg-white/10"
                  >
                    <FiX />
                  </button>
                </div>

                <div className="max-h-[280px] overflow-y-auto px-4 py-4">
                  {storyInsights?.loading ? (
                    <p className="text-sm text-white/65">Loading story insights...</p>
                  ) : insightsList.length ? (
                    <div className="space-y-3">
                      {insightsList.map((person) => (
                        <div key={person.id} className="flex items-center justify-between gap-3">
                          <div className="flex min-w-0 items-center gap-3">
                            <Avatar name={person.name} avatarUrl={person.avatarUrl} />
                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold text-white">{person.name}</p>
                              <p className="truncate text-xs text-white/55">{person.headline || person.role}</p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => onSendAccount?.(person, activeStory)}
                            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white transition hover:bg-white/10"
                          >
                            <FiSend />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-white/55">
                      {storyInsights?.activeTab === "likes" ? "No likes on this story yet." : "No one has viewed this story yet."}
                    </p>
                  )}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
