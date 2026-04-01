import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { FiHeart, FiLoader, FiSend, FiSmile, FiX } from "react-icons/fi";

function renderCommentText(text = "") {
  return String(text || "")
    .split(/(@[\w.]+)/g)
    .filter(Boolean)
    .map((part, index) => {
      if (/^@[\w.]+$/.test(part)) {
        return (
          <span key={`${part}-${index}`} className="font-medium text-[#8ab4ff]">
            {part}
          </span>
        );
      }
      return <span key={`${part}-${index}`}>{part}</span>;
    });
}

export default function CareerPulseCommentsModal({
  open,
  post,
  viewer,
  comments = [],
  totalComments = 0,
  loading = false,
  loadingMore = false,
  hasMore = false,
  draft = "",
  submitting = false,
  onDraftChange,
  onSubmit,
  onClose,
  onLoadMore,
  onReply,
  timeAgo,
  AvatarComponent,
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const showInitialLoader = loading && !comments.length;
  const canSend = Boolean(String(draft || "").trim());

  return createPortal(
    <AnimatePresence>
      {open && post ? (
        <motion.div
          className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 px-4 py-6 backdrop-blur-[6px]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <button type="button" aria-label="Close comments" className="absolute inset-0 cursor-default" onClick={onClose} />

          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ duration: 0.2 }}
            className="relative w-full max-w-[430px] overflow-visible rounded-[28px] border border-white/10 bg-[#111111] text-white shadow-[0_28px_80px_rgba(0,0,0,0.45)]"
          >
            <span className="pointer-events-none absolute -left-2 top-1/2 hidden h-4 w-4 -translate-y-1/2 rotate-45 border-b border-l border-white/10 bg-[#111111] md:block" />

            <div className="relative flex items-center justify-between px-5 py-5">
              <button type="button" onClick={onClose} aria-label="Close comments" className="inline-flex h-10 w-10 items-center justify-center rounded-full text-white transition hover:bg-white/10">
                <FiX className="text-[22px]" />
              </button>
              <div className="pointer-events-none absolute left-1/2 -translate-x-1/2 text-[15px] font-black text-white">Comments</div>
              <div className="w-10" />
            </div>

            <div className="border-t border-white/10" />

            <div className="max-h-[min(60vh,520px)] overflow-y-auto px-5 py-4">
              {hasMore ? (
                <button type="button" disabled={loadingMore} onClick={onLoadMore} className="mb-4 text-sm font-semibold text-white/65 transition hover:text-white disabled:opacity-60">
                  {loadingMore ? "Loading older comments..." : "View previous comments"}
                </button>
              ) : null}

              {loading && comments.length ? (
                <div className="mb-3 flex items-center gap-2 text-xs font-semibold text-white/50">
                  <FiLoader className="animate-spin text-white" />
                  Refreshing comments...
                </div>
              ) : null}

              {showInitialLoader ? (
                <div className="flex min-h-[220px] items-center justify-center text-sm font-semibold text-white/65">
                  <FiLoader className="mr-2 animate-spin text-white" />
                  Loading comments...
                </div>
              ) : comments.length ? (
                <div className="space-y-5">
                  {comments.map((comment) => (
                    <div key={comment.id} className="flex items-start gap-3">
                      <AvatarComponent name={comment.author?.name} avatarUrl={comment.author?.avatarUrl} small />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start gap-3">
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-baseline gap-2">
                              <span className="text-[15px] font-black leading-6 text-white">{comment.author?.name}</span>
                              <span className="text-sm text-white/40">{timeAgo(comment.createdAt)}</span>
                            </div>
                            <p className="mt-0.5 whitespace-pre-wrap text-[15px] leading-6 text-white/88">{renderCommentText(comment.text)}</p>
                            <div className="mt-2 flex items-center gap-4 text-[13px] font-semibold text-white/50">
                              <span>{comment.author?.headline || "Explore member"}</span>
                              <button type="button" onClick={() => onReply?.(comment)} className="transition hover:text-white">
                                Reply
                              </button>
                            </div>
                          </div>
                          <span aria-hidden="true" className="mt-0.5 inline-flex h-8 w-8 items-center justify-center text-white/30">
                            <FiHeart className="text-[19px]" />
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex min-h-[220px] flex-col items-center justify-center px-6 text-center">
                  <div className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-white/65">{totalComments || 0} comments</div>
                  <h4 className="mt-4 text-lg font-black text-white">Start the conversation</h4>
                  <p className="mt-2 text-sm leading-6 text-white/55">Drop the first comment on this post.</p>
                </div>
              )}
            </div>

            <div className="border-t border-white/10 px-4 py-4">
              <div className="flex items-center gap-3">
                <AvatarComponent name={viewer?.name} avatarUrl={viewer?.avatarUrl} small />
                <div className="relative flex-1">
                  <input
                    autoFocus={open}
                    value={draft}
                    onChange={(event) => onDraftChange?.(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" && !event.shiftKey) {
                        event.preventDefault();
                        if (canSend) onSubmit?.();
                      }
                    }}
                    placeholder="Add a comment..."
                    className="h-12 w-full rounded-full border border-white/10 bg-white/5 pl-5 pr-14 text-[15px] text-white outline-none transition focus:border-white/20 focus:bg-white/10"
                  />
                  <button
                    type="button"
                    disabled={!canSend || submitting}
                    onClick={() => {
                      if (canSend) onSubmit?.();
                    }}
                    className={`absolute right-2 top-1/2 inline-flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full transition ${
                      canSend ? "bg-white text-[#111111] shadow-[0_10px_22px_rgba(255,255,255,0.18)]" : "text-white/35"
                    } disabled:opacity-60`}
                  >
                    {submitting ? <FiLoader className="animate-spin" /> : canSend ? <FiSend /> : <FiSmile className="text-[20px]" />}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}
