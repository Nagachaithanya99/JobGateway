import { useEffect, useMemo, useRef, useState } from "react";
import {
  FiChevronLeft,
  FiChevronRight,
  FiClock,
  FiTrash2,
  FiFlag,
  FiHeart,
  FiMessageCircle,
  FiMoreHorizontal,
  FiMusic,
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
  onMessage,
  onLike,
  onReport,
  onShare,
  onDelete,
  liked = false,
  messageBusy = false,
  likeBusy = false,
  deleteBusy = false,
  timeAgo,
}) {
  const activeGroup = groups[groupIndex] || null;
  const activeStory = activeGroup?.items?.[storyIndex] || null;
  const mediaUrl = useMemo(() => toAbsoluteMediaUrl(activeStory?.media?.url), [activeStory?.media?.url]);
  const storyMusic = activeStory?.music?.audioUrl ? activeStory.music : null;
  const storyMusicUrl = useMemo(() => toAbsoluteMediaUrl(storyMusic?.audioUrl), [storyMusic?.audioUrl]);
  const videoRef = useRef(null);
  const imageMusicRef = useRef(null);
  const menuRef = useRef(null);
  const [progress, setProgress] = useState(0);
  const [storyMuted, setStoryMuted] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

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

  useEffect(() => {
    if (!open) return;
    setStoryMuted(false);
  }, [open]);

  useEffect(() => {
    setMenuOpen(false);
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

  const navigateRelative = (direction) => {
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
  };

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

      const startedAt = Date.now();
      const timer = window.setInterval(() => {
        const nextProgress = Math.min(100, ((Date.now() - startedAt) / imageStoryDurationMs) * 100);
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
    const startedAt = Date.now();
    const timer = window.setInterval(() => {
      const nextProgress = Math.min(100, ((Date.now() - startedAt) / durationMs) * 100);
      setProgress(nextProgress);
      if (nextProgress >= 100) {
        window.clearInterval(timer);
        navigateRelative(1);
      }
    }, 100);

    return () => window.clearInterval(timer);
  }, [open, activeStory?.id, groupIndex, storyIndex, isVideo, hasImageMusic, imageMusicStart, imageMusicClipDuration, imageStoryDurationMs, storyMuted]);

  useEffect(() => {
    if (!open) return;

    const node = isVideo ? videoRef.current : imageMusicRef.current;
    if (!node || (!isVideo && !hasImageMusic)) return;

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
  }, [open, activeStory?.id, isVideo, hasImageMusic, storyMuted]);

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
                    className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-black/35 text-white transition hover:bg-white/15"
                    aria-label="Open story actions"
                  >
                    <FiMoreHorizontal />
                  </button>

                  {menuOpen ? (
                    <div className="absolute left-0 top-12 min-w-[190px] overflow-hidden rounded-[22px] border border-white/10 bg-[#0b0f15]/96 p-2.5 text-sm shadow-[0_24px_60px_rgba(0,0,0,0.42)] backdrop-blur-xl">
                      {activeGroup.author?.isSelf ? (
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
                    </div>
                  ) : null}
                </div>
                <Avatar name={activeGroup.author?.name} avatarUrl={activeGroup.author?.avatarUrl} />
                <div className="min-w-0">
                  <p className="truncate text-sm font-black">{activeGroup.author?.name}</p>
                  <div className="mt-1 flex items-center gap-2 text-xs text-white/65">
                    <FiClock />
                    <span>{timeAgo?.(activeStory.createdAt) || ""}</span>
                    <span>/</span>
                    <span>{remainingTimeLabel(activeStory.expiresAt)}</span>
                  </div>
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-2">
                {activeGroup.author?.isSelf ? (
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

          <div className="relative flex-1 overflow-hidden bg-[radial-gradient(circle_at_top,#262626_0%,#111111_48%,#050505_100%)]">
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
                    <img src={mediaUrl} alt={activeGroup.author?.name || "Story"} className="h-full w-full rounded-[24px] object-contain shadow-[0_22px_70px_rgba(0,0,0,0.42)]" />
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
            {storyMusic?.title ? (
              <div className="mb-3 inline-flex max-w-full items-center gap-2 rounded-full border border-white/15 bg-black/45 px-3 py-2 text-xs font-semibold text-white/90 backdrop-blur">
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

            {!activeGroup.author?.isSelf ? (
              <div className="mt-4 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => onMessage?.(activeGroup.author, activeStory)}
                  disabled={messageBusy}
                  className="flex h-14 min-w-0 flex-1 items-center rounded-full border border-white/25 bg-[#090c11]/88 px-5 text-left text-[1.05rem] font-medium text-white/90 backdrop-blur transition hover:bg-[#11151d] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <span className="truncate">{messageBusy ? "Opening chat..." : "Send message"}</span>
                </button>

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
                  onClick={() => onMessage?.(activeGroup.author, activeStory)}
                  disabled={messageBusy}
                  className="inline-flex h-12 w-12 items-center justify-center text-[2rem] text-white transition hover:text-white/80 disabled:cursor-not-allowed disabled:opacity-60"
                  aria-label="Reply to story"
                >
                  <FiMessageCircle />
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
          </div>
        </div>
      </div>
    </div>
  );
}
