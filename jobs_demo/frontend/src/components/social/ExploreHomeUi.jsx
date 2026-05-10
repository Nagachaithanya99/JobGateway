import { useEffect, useMemo, useRef, useState } from "react";
import {
  FiBell,
  FiBellOff,
  FiBookmark,
  FiFlag,
  FiFileText,
  FiGrid,
  FiHeart,
  FiHome,
  FiMessageCircle,
  FiMessageSquare,
  FiMoreHorizontal,
  FiPlus,
  FiPlayCircle,
  FiPlusSquare,
  FiSearch,
  FiSend,
  FiVolume2,
  FiUser,
} from "react-icons/fi";
import { Avatar } from "./ExploreReelUi.jsx";
import { toAbsoluteMediaUrl } from "../../utils/media.js";

function formatCount(value = 0) {
  const total = Number(value || 0);
  if (total >= 1000000) return `${(total / 1000000).toFixed(total >= 10000000 ? 0 : 1)}M`;
  if (total >= 1000) return `${(total / 1000).toFixed(total >= 10000 ? 0 : 1)}K`;
  return `${total}`;
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

export const exploreHomeNavItems = [
  { key: "home", label: "Home", icon: FiHome },
  { key: "reels", label: "Reels", icon: FiPlayCircle },
  { key: "messages", label: "Messages", icon: FiMessageSquare },
  { key: "search", label: "Search", icon: FiSearch },
  { key: "explore", label: "Explore", icon: FiGrid },
  { key: "notifications", label: "Notifications", icon: FiHeart },
  { key: "saved", label: "Saved", icon: FiBookmark },
  { key: "create", label: "Create", icon: FiPlusSquare },
  { key: "profile", label: "Profile", icon: FiUser },
];

export function ExploreHomeRail({ activeKey, onAction, viewer }) {
  const unreadNotifications = Number(viewer?.notificationsUnread || 0);
  const unreadMessages = Number(viewer?.messagesUnread || 0);
  return (
    <div className="sticky top-5 flex h-[calc(100vh-40px)] flex-col justify-between border-r border-black/10 bg-white px-3 py-6">
      <div>
        <div className="px-3 pb-8 text-2xl font-black tracking-tight text-[#111111]">Explore</div>
        <div className="space-y-1">
          {exploreHomeNavItems.map((item) => {
            const Icon = item.icon;
            const active = activeKey === item.key;
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => onAction(item.key)}
                className={`flex w-full items-center gap-4 rounded-2xl px-3 py-3 text-left text-lg transition ${
                  active ? "bg-[#f5f5f5] font-extrabold text-[#111111]" : "text-slate-700 hover:bg-slate-50"
                }`}
              >
                <Icon className="text-[25px]" />
                <span className="hidden xl:inline">{item.label}</span>
                {(item.key === "notifications" && unreadNotifications > 0) || (item.key === "messages" && unreadMessages > 0) ? (
                  <span className="ml-auto inline-flex min-w-[22px] items-center justify-center rounded-full bg-[#111111] px-1.5 py-0.5 text-[11px] font-black text-white">
                    {item.key === "notifications"
                      ? unreadNotifications > 9 ? "9+" : unreadNotifications
                      : unreadMessages > 9 ? "9+" : unreadMessages}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex items-center gap-3 rounded-2xl px-3 py-3">
        <Avatar name={viewer?.name} avatarUrl={viewer?.avatarUrl} small />
        <div className="hidden min-w-0 xl:block">
          <p className="truncate text-sm font-black text-slate-900">{viewer?.name || "Member"}</p>
          <p className="truncate text-xs text-slate-500">{viewer?.headline || "Explore member"}</p>
        </div>
      </div>
    </div>
  );
}

export function ExploreNotificationsList({
  items = [],
  unreadCount = 0,
  soundEnabled = true,
  timeAgo,
  onOpenNotification,
  onMarkRead,
  onMarkAllRead,
  onToggleSound,
}) {
  const [filter, setFilter] = useState("all");

  const groupedItems = useMemo(() => {
    const rows = Array.isArray(items) ? items : [];
    const groups = [];

    rows.forEach((item) => {
      const targetKey =
        item.relatedStoryId ||
        item.relatedThreadId ||
        item.relatedPostId ||
        item.actor?.id ||
        item.id;
      const groupKey = `${item.eventType || item.kind || "social"}:${targetKey}`;
      const createdAt = new Date(item.createdAt || 0).getTime();
      const lastGroup = groups[groups.length - 1];
      const lastCreatedAt = new Date(lastGroup?.createdAt || 0).getTime();

      if (
        lastGroup &&
        lastGroup.groupKey === groupKey &&
        Math.abs(lastCreatedAt - createdAt) <= 1000 * 60 * 60 * 6
      ) {
        lastGroup.count += 1;
        lastGroup.items.push(item);
        lastGroup.readAt = lastGroup.readAt && item.readAt ? lastGroup.readAt : null;
        lastGroup.createdAt = lastGroup.createdAt > item.createdAt ? lastGroup.createdAt : item.createdAt;
        return;
      }

      groups.push({
        ...item,
        groupKey,
        count: 1,
        items: [item],
      });
    });

    return groups;
  }, [items]);

  const visibleItems = useMemo(() => {
    if (filter === "unread") return groupedItems.filter((item) => !item.readAt);
    if (filter === "alerts") return groupedItems.filter((item) => item.severity !== "info");
    return groupedItems;
  }, [filter, groupedItems]);

  const renderMessage = (item) => {
    if (item.count <= 1) return item.message;
    const leadName = item.actor?.name || "Someone";
    if (item.eventType === "story_like") {
      return `${leadName} and +${item.count - 1} others liked your story.`;
    }
    if (item.eventType === "follow") {
      return `${leadName} and +${item.count - 1} others started following you.`;
    }
    if (item.eventType === "message") {
      return `${leadName} and +${item.count - 1} others sent new Explore messages.`;
    }
    return `${item.message} (+${item.count - 1} more)`;
  };

  return (
    <div className="bg-white">
      <div className="px-4 pb-4 pt-2 sm:px-6">
        <p className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-400">Explore</p>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-3xl font-black tracking-tight text-slate-900">Notifications</h2>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onToggleSound}
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-black/10 bg-white text-slate-700 transition hover:bg-slate-50"
              aria-label={soundEnabled ? "Mute notification sound" : "Enable notification sound"}
            >
              {soundEnabled ? <FiVolume2 /> : <FiBellOff />}
            </button>
            <button
              type="button"
              onClick={onMarkAllRead}
              disabled={!unreadCount}
              className="rounded-full border border-black/10 bg-white px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
            >
              Mark all read
            </button>
          </div>
        </div>
        <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-500">
          Likes, follows, story activity, system alerts, and Explore chat updates appear here.
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {[
            { key: "all", label: "All" },
            { key: "unread", label: `Unread ${unreadCount ? `(${unreadCount})` : ""}`.trim() },
            { key: "alerts", label: "Alerts" },
          ].map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => setFilter(item.key)}
              className={`rounded-full px-4 py-2 text-sm font-bold transition ${
                filter === item.key ? "bg-[#111111] text-white" : "border border-black/10 bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div className="border-t border-black/5">
        {visibleItems.length ? (
          visibleItems.map((item) => (
            <div key={item.groupKey} className="flex items-start gap-3 border-b border-black/5 px-4 py-4 sm:px-6">
              <button
                type="button"
                onClick={() => onOpenNotification?.(item)}
                className="flex min-w-0 flex-1 items-start gap-3 text-left transition hover:opacity-90"
              >
                <div className="relative">
                  <Avatar name={item.actor?.name || "Explore"} avatarUrl={item.actor?.avatarUrl} small />
                  <span
                    className={`absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-white ${
                      item.severity === "danger"
                        ? "bg-rose-500"
                        : item.severity === "warning"
                          ? "bg-amber-400"
                          : item.eventType === "message" || item.eventType === "message_request"
                            ? "bg-emerald-500"
                            : item.eventType === "follow"
                              ? "bg-violet-500"
                              : "bg-sky-500"
                    }`}
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-black text-slate-900">{item.title || "Explore update"}</p>
                    {!item.readAt ? <span className="h-2 w-2 rounded-full bg-[#111111]" /> : null}
                    {item.count > 1 ? (
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-black text-slate-600">
                        +{item.count - 1}
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-1 text-sm leading-6 text-slate-600">{renderMessage(item)}</p>
                  <div className="mt-2 flex items-center gap-2 text-xs font-semibold text-slate-400">
                    <span>{timeAgo(item.createdAt)}</span>
                    <span>{item.readAt ? "Seen" : "Unseen"}</span>
                  </div>
                </div>
              </button>
              {!item.readAt ? (
                <button
                  type="button"
                  onClick={() => onMarkRead?.((item.items || []).map((entry) => entry?.id).filter(Boolean))}
                  className="inline-flex h-10 items-center rounded-full border border-black/10 px-3 text-xs font-bold text-slate-600 transition hover:bg-slate-50"
                >
                  Mark read
                </button>
              ) : (
                <span className="inline-flex h-10 items-center rounded-full bg-slate-50 px-3 text-xs font-bold text-slate-400">
                  Seen
                </span>
              )}
            </div>
          ))
        ) : (
          <div className="px-6 py-16 text-center">
            <span className="mx-auto inline-flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-2xl text-slate-500">
              <FiHeart />
            </span>
            <h3 className="mt-5 text-2xl font-black text-slate-900">No notifications yet</h3>
            <p className="mt-3 text-sm leading-7 text-slate-500">
              Explore warnings and updates will show up here in a simple activity list.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function StoryCircleMedia({ item }) {
  const mediaUrl = toAbsoluteMediaUrl(item?.preview?.url);
  const avatarUrl = toAbsoluteMediaUrl(item?.author?.avatarUrl);
  const mimeType = String(item?.preview?.mimeType || "").toLowerCase();
  const resourceType = String(item?.preview?.resourceType || "").toLowerCase();
  const isVideo = mimeType.startsWith("video/") || resourceType === "video";

  if (mediaUrl) {
    return isVideo ? (
      <video src={mediaUrl} autoPlay loop muted playsInline className="h-full w-full object-cover" />
    ) : (
      <img src={mediaUrl} alt={item?.author?.name || "Story"} className="h-full w-full object-cover" />
    );
  }

  if (avatarUrl) {
    return <img src={avatarUrl} alt={item?.author?.name || "Story"} className="h-full w-full object-cover" />;
  }

  return (
    <div className="flex h-full w-full items-center justify-center bg-[linear-gradient(135deg,#18181b_0%,#4338ca_60%,#fb7185_100%)]">
      <span className="text-xl font-black text-white">
        {String(item?.author?.name || "U")
          .split(" ")
          .filter(Boolean)
          .slice(0, 2)
          .map((part) => part[0])
          .join("")
          .toUpperCase()}
      </span>
    </div>
  );
}

export function StoryStrip({ viewer, items = [], onOpenStory, onCreateStory }) {
  const hasOwnStory = items.some((item) => item?.author?.isSelf);
  const displayItems =
    hasOwnStory || !viewer
      ? items
      : [
          {
            id: `story-self-${viewer.id || "viewer"}`,
            author: {
              id: viewer.id || "viewer",
              name: viewer.name || "You",
              avatarUrl: viewer.avatarUrl || "",
              isSelf: true,
            },
            items: [],
            preview: null,
            viewerState: { hasUnseen: false, seen: true },
          },
          ...items,
        ];

  if (!displayItems.length) return null;

  return (
    <div className="overflow-hidden rounded-[30px] border border-black/10 bg-white px-5 py-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-400">Stories</p>
          <p className="mt-1 text-sm text-slate-500">Stories from you and people you follow disappear automatically at their expiry time.</p>
        </div>
        <button
          type="button"
          onClick={onCreateStory}
          className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white px-4 py-2 text-xs font-extrabold text-slate-700 transition hover:bg-slate-50"
        >
          <FiPlus />
          Add story
        </button>
      </div>

      <div className="flex gap-5 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {displayItems.map((item) => {
          const isSelf = Boolean(item?.author?.isSelf);
          const hasStory = Boolean(item.items?.length);
          const hasUnseen = Boolean(item.viewerState?.hasUnseen);
          const ringClass = hasStory
            ? hasUnseen
              ? "bg-[conic-gradient(from_180deg_at_50%_50%,#f9ce34_0deg,#ee2a7b_160deg,#6228d7_290deg,#f9ce34_360deg)]"
              : "bg-slate-200"
            : "bg-slate-200";

          return (
            <div key={item.id} className="relative shrink-0">
              <button
                type="button"
                onClick={() => (hasStory ? onOpenStory?.(item) : onCreateStory?.())}
                className="group w-[102px] text-center"
              >
                <span className={`relative inline-flex h-[84px] w-[84px] rounded-full p-[3px] shadow-sm transition group-hover:scale-[1.03] ${ringClass}`}>
                  <span className="inline-flex h-full w-full rounded-full bg-white p-[3px]">
                    <span className="relative block h-full w-full overflow-hidden rounded-full bg-slate-100">
                      <StoryCircleMedia item={item} />
                    </span>
                  </span>
                </span>
                <span className="mt-2 block truncate text-[13px] font-semibold text-slate-700">
                  {isSelf ? "Your story" : item?.author?.name || "Story"}
                </span>
              </button>

              {isSelf ? (
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    onCreateStory?.();
                  }}
                  className="absolute bottom-7 right-1 inline-flex h-8 w-8 items-center justify-center rounded-full border-[3px] border-white bg-[#111111] text-sm text-white shadow-md transition hover:scale-105"
                >
                  <FiPlus />
                </button>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function HomeFeedPostCard({
  post,
  timeAgo,
  busy,
  onLike,
  onComment,
  onShare,
  onSave,
  onFollow,
  onMessage,
  onReport,
  onOpenReel,
}) {
  const mediaUrl = toAbsoluteMediaUrl(post?.media?.url);
  const videoPost = isVideoPost(post);
  const safetyHidden = isSafetyHidden(post);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

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
    <article className="overflow-hidden rounded-[24px] border border-black/10 bg-white">
      <div className="flex items-center justify-between gap-3 px-4 py-4">
        <div className="flex min-w-0 items-center gap-3">
          <Avatar name={post.author?.name} avatarUrl={post.author?.avatarUrl} />
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <p className="truncate text-sm font-black text-slate-900">{post.author?.name}</p>
              <span className="text-sm text-slate-400">/</span>
              <p className="text-sm text-slate-400">{timeAgo(post.createdAt)}</p>
            </div>
            <p className="truncate text-xs text-slate-500">{post.author?.headline}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!safetyHidden && post.author?.canFollow ? (
            <button type="button" disabled={busy[`follow-${post.author?.id}`]} onClick={onFollow} className="text-sm font-extrabold text-[#2563eb]">
              {busy[`follow-${post.author?.id}`] ? "..." : post.author?.isFollowed ? "Following" : "Follow"}
            </button>
          ) : null}
          <div ref={menuRef} className="relative">
            <button type="button" onClick={() => setMenuOpen((prev) => !prev)} className="text-slate-500">
              <FiMoreHorizontal className="text-xl" />
            </button>
            {menuOpen ? (
              <div className="absolute right-0 top-full z-20 mt-2 min-w-[170px] rounded-[18px] border border-black/10 bg-white p-2 shadow-[0_18px_44px_rgba(15,23,42,0.16)]">
                {!safetyHidden ? (
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      onShare?.();
                    }}
                    className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left text-sm font-bold text-slate-700 transition hover:bg-slate-50"
                  >
                    <FiSend />
                    Share post
                  </button>
                ) : null}
                {!safetyHidden && post.author?.canMessage ? (
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      onMessage?.();
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
                    Report post
                  </button>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {safetyHidden ? (
        <div className="flex min-h-[340px] flex-col items-center justify-center bg-[radial-gradient(circle_at_top,#27272a_0%,#18181b_44%,#09090b_100%)] px-6 py-12 text-center text-white">
          <span className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-white/10 text-3xl">
            <FiFlag />
          </span>
          <p className="mt-5 text-2xl font-black">Content removed for safety</p>
          <p className="mt-3 max-w-md text-sm leading-7 text-white/70">
            This post was hidden from Explore after moderation or repeated community reports.
          </p>
        </div>
      ) : mediaUrl ? (
        <button type="button" disabled={!onOpenReel} onClick={onOpenReel} className="group relative block w-full bg-slate-100 text-left disabled:cursor-default">
          {videoPost ? (
            <video src={mediaUrl} muted playsInline controls className="max-h-[720px] w-full bg-black object-cover" />
          ) : (
            <img src={mediaUrl} alt={post.headline || post.author?.name || "Explore post"} className="max-h-[720px] w-full object-cover" />
          )}
          {onOpenReel ? (
            <span className="absolute bottom-4 right-4 rounded-full bg-black/70 px-3 py-1.5 text-xs font-black text-white opacity-0 transition group-hover:opacity-100">
              Open in Reels
            </span>
          ) : null}
        </button>
      ) : (
        <div className="bg-[linear-gradient(135deg,#0f172a_0%,#1e293b_50%,#111827_100%)] px-6 py-12 text-white">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-white/45">Text Update</p>
          {post.headline ? <h3 className="mt-3 text-2xl font-black leading-tight">{post.headline}</h3> : null}
          <p className="mt-4 text-base leading-8 text-white/75">{post.content || "Explore update"}</p>
        </div>
      )}

      <div className="px-4 pb-4 pt-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 text-[24px] text-slate-900">
            <button
              type="button"
              disabled={busy[`like-${post.id}`] || safetyHidden}
              onClick={onLike}
              className={post.viewerState?.liked ? "text-[#ef4444] [&>svg]:fill-current" : ""}
            >
              <FiHeart />
            </button>
            <button type="button" onClick={onComment} disabled={safetyHidden}>
              <FiMessageCircle />
            </button>
            <button type="button" disabled={busy[`share-${post.id}`] || safetyHidden} onClick={onShare}>
              <FiSend />
            </button>
            {!safetyHidden && post.author?.canMessage ? (
              <button type="button" disabled={busy[`message-${post.author?.id}`]} onClick={onMessage}>
                <FiMessageSquare />
              </button>
            ) : null}
          </div>
          <button type="button" disabled={busy[`save-${post.id}`] || safetyHidden} onClick={onSave} className={post.viewerState?.saved ? "text-[#111111]" : "text-slate-900"}>
            <FiBookmark className="text-[22px]" />
          </button>
        </div>

        <p className="mt-3 text-sm font-black text-slate-900">{formatCount(post.metrics?.likes || 0)} likes</p>
        {post.headline ? <p className="mt-2 text-sm font-black text-slate-900">{post.headline}</p> : null}
        {safetyHidden ? (
          <p className="mt-1 text-sm leading-6 text-slate-700">
            <span className="font-black text-slate-900">{post.author?.name}</span> This content was removed from Explore for safety.
          </p>
        ) : post.content ? (
          <p className="mt-1 text-sm leading-6 text-slate-700">
            <span className="font-black text-slate-900">{post.author?.name}</span> {post.content}
          </p>
        ) : null}
        {!safetyHidden && (post.tags || []).length ? (
          <div className="mt-2 flex flex-wrap gap-2">
            {post.tags.map((tag) => (
              <span key={`${post.id}-${tag}`} className="text-xs font-bold text-[#2563eb]">
                #{String(tag).replace(/^#/, "")}
              </span>
            ))}
          </div>
        ) : null}
        <button type="button" onClick={onComment} disabled={safetyHidden} className="mt-2 text-sm text-slate-400 disabled:opacity-50">
          View all {post.metrics?.comments || 0} comments
        </button>
      </div>
    </article>
  );
}

function SavedPostTile({ post, onOpenReel }) {
  const mediaUrl = toAbsoluteMediaUrl(post?.media?.url);
  const videoPost = isVideoPost(post);
  const mediaEligible = Boolean(mediaUrl) && ["image", "banner", "video", "reel"].includes(String(post?.type || "").toLowerCase());
  const clickable = Boolean(onOpenReel) && mediaEligible;

  return (
    <button
      type="button"
      onClick={clickable ? onOpenReel : undefined}
      disabled={!clickable}
      className={`group relative aspect-square overflow-hidden bg-slate-100 text-left ${clickable ? "cursor-pointer" : "cursor-default"}`}
    >
      {mediaUrl ? (
        videoPost ? (
          <video src={mediaUrl} muted playsInline className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]" />
        ) : (
          <img src={mediaUrl} alt={post.headline || post.author?.name || "Saved post"} className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]" />
        )
      ) : post?.type === "document" ? (
        <div className="flex h-full w-full flex-col items-center justify-center bg-[linear-gradient(135deg,#0f172a_0%,#1e293b_60%,#312e81_100%)] px-5 text-center text-white">
          <FiFileText className="text-4xl text-white/90" />
          <p className="mt-4 text-sm font-black leading-6">{post.headline || "Saved document"}</p>
          <p className="mt-2 text-xs leading-5 text-white/70">{post.author?.name}</p>
        </div>
      ) : (
        <div className="flex h-full w-full flex-col justify-end bg-[linear-gradient(135deg,#18181b_0%,#4338ca_60%,#fb7185_100%)] p-5 text-white">
          <p className="text-[11px] font-black uppercase tracking-[0.2em] text-white/60">{post.type || "Post"}</p>
          <p className="mt-3 line-clamp-4 text-sm font-black leading-6">{post.headline || post.content || "Saved post"}</p>
          <p className="mt-3 text-xs text-white/70">{post.author?.name}</p>
        </div>
      )}

      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent opacity-70" />

      <span className="absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-full bg-black/70 text-sm text-white shadow-sm">
        {videoPost ? <FiPlayCircle /> : post?.type === "document" ? <FiFileText /> : <FiBookmark />}
      </span>

      {post.headline || post.content ? (
        <div className="absolute inset-x-0 bottom-0 px-3 pb-3 pt-10">
          <p className="line-clamp-2 text-sm font-semibold text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.55)]">
            {post.headline || post.content}
          </p>
        </div>
      ) : null}
    </button>
  );
}

export function SavedPostsGrid({ posts = [], onOpenReel }) {
  return (
    <div className="overflow-hidden rounded-[28px] border border-black/10 bg-white shadow-sm">
      <div className="border-b border-black/5 px-5 py-5 sm:px-6">
        <div className="flex items-center gap-2 text-sm font-bold text-slate-500">
          <FiBookmark />
          Saved
        </div>
        <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-900">All Posts</h2>
      </div>

      {posts.length ? (
        <div className="grid grid-cols-2 gap-[1px] bg-black/5 md:grid-cols-3">
          {posts.map((post) => (
            <SavedPostTile key={post.id} post={post} onOpenReel={["image", "banner", "video", "reel"].includes(String(post?.type || "").toLowerCase()) ? () => onOpenReel?.(post.id) : undefined} />
          ))}
        </div>
      ) : (
        <div className="px-6 py-16 text-center">
          <span className="mx-auto inline-flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-2xl text-slate-500">
            <FiBookmark />
          </span>
          <h3 className="mt-5 text-2xl font-black text-slate-900">No saved posts yet</h3>
          <p className="mt-3 text-sm leading-7 text-slate-500">Save reels, videos, images, and posts from Explore and they will appear here.</p>
        </div>
      )}
    </div>
  );
}

export function SuggestedList({ viewer, items = [], busy, onFollow, onMessage }) {
  const [showAll, setShowAll] = useState(false);
  const visibleItems = showAll ? items : items.slice(0, 5);
  const canExpand = items.length > 5;

  return (
    <div className="rounded-[24px] bg-white px-5 py-5">
      <div className="flex items-center gap-3">
        <Avatar name={viewer?.name} avatarUrl={viewer?.avatarUrl} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-black text-slate-900">{viewer?.name || "Member"}</p>
          <p className="truncate text-sm text-slate-500">{viewer?.headline || "Explore member"}</p>
        </div>
      </div>

      <div className="mt-6 flex items-center justify-between">
        <p className="text-sm font-black text-slate-500">Suggested for you</p>
        <button
          type="button"
          disabled={!canExpand}
          onClick={() => canExpand && setShowAll((prev) => !prev)}
          className="text-xs font-black text-slate-900 transition hover:text-slate-600 disabled:cursor-default disabled:hover:text-slate-900"
        >
          {canExpand ? (showAll ? "Show less" : "See all") : "See all"}
        </button>
      </div>

      <div className="mt-4 space-y-4">
        {visibleItems.map((item) => (
          <div key={item.id} className="flex items-center gap-3">
            <Avatar name={item.name} avatarUrl={item.avatarUrl} small />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-black text-slate-900">{item.name}</p>
              <p className="truncate text-xs text-slate-500">{item.headline}</p>
            </div>
            <div className="flex items-center gap-2">
              {item.canMessage ? (
                <button type="button" disabled={busy[`message-${item.id}`]} onClick={() => onMessage(item.id)} className="text-xs font-black text-slate-500">
                  Msg
                </button>
              ) : null}
              <button type="button" disabled={busy[`follow-${item.id}`]} onClick={() => onFollow(item.id)} className="text-sm font-black text-[#2563eb]">
                {busy[`follow-${item.id}`] ? "..." : item.isFollowing || item.isFollowed ? "Following" : "Follow"}
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 space-y-1 text-[11px] leading-5 text-slate-400">
        <p>About / Help / Press / API / Jobs / Privacy / Terms</p>
        <p>Locations / Language / Explore</p>
        <p className="pt-3 font-semibold">Copyright 2026 Explore</p>
      </div>
    </div>
  );
}
