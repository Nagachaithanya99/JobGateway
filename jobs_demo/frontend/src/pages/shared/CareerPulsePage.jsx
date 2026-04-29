import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useLocation, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import {
  FiBookmark,
  FiBell,
  FiChevronDown,
  FiChevronRight,
  FiChevronUp,
  FiClock,
  FiCopy,
  FiFlag,
  FiFileText,
  FiImage,
  FiHome,
  FiLoader,
  FiMail,
  FiMessageSquare,
  FiMusic,
  FiPause,
  FiPlay,
  FiPlayCircle,
  FiPlus,
  FiSearch,
  FiRefreshCw,
  FiSend,
  FiShare2,
  FiUser,
  FiVideo,
  FiX,
} from "react-icons/fi";
import { FaFacebookF, FaWhatsapp } from "react-icons/fa";
import Modal from "../../components/common/Modal.jsx";
import CareerPulseCommentsModal from "../../components/social/CareerPulseCommentsModal.jsx";
import ExploreStoryViewer from "../../components/social/ExploreStoryViewer.jsx";
import {
  Avatar,
  InlineActionButton,
  MetricBlock,
  NavBubble,
  ReelSlide,
  SidePanelCard,
} from "../../components/social/ExploreReelUi.jsx";
import {
  ExploreNotificationsList,
  ExploreHomeRail,
  HomeFeedPostCard,
  SavedPostsGrid,
  StoryStrip,
  SuggestedList,
} from "../../components/social/ExploreHomeUi.jsx";
import { analyzeMediaFileSafety } from "../../utils/mediaModeration.js";
import { scanUnsafeText } from "../../utils/textModeration.js";
import {
  acceptCareerPulseMessageRequest,
  addCareerPulseComment,
  createCareerPulsePost,
  createCareerPulseStory,
  deleteCareerPulseMessages,
  deleteCareerPulseMessageThread,
  deleteCareerPulseStory,
  getCareerPulseMessageThread,
  getCareerPulseMessageThreads,
  getCareerPulseComments,
  getCareerPulseFeed,
  getCareerPulseMusicTracks,
  getCareerPulseNotifications,
  getCareerPulseStoryInsights,
  getCareerPulseStories,
  markCareerPulseMessageThreadRead,
  markCareerPulseNotificationsRead,
  toggleCareerPulseStoryLike,
  markCareerPulseStoryViewed,
  openCareerPulseMessageThread,
  reportCareerPulseMessage,
  reportCareerPulseStory,
  reportCareerPulsePost,
  sendCareerPulseMessage,
  shareCareerPulsePost,
  toggleCareerPulseMessageReaction,
  toggleCareerPulseStoryAuthorMute,
  toggleCareerPulseFollow,
  toggleCareerPulseLike,
  toggleCareerPulseSave,
} from "../../services/socialService.js";
import { uploadSocialMedia } from "../../services/uploadService.js";
import ExploreMessagesUi from "../../components/social/ExploreMessagesUi.jsx";

const postTypeOptions = [
  { value: "reel", label: "Reel", helper: "Short vertical clips for the main feed", icon: <FiPlayCircle /> },
  { value: "video", label: "Video", helper: "Longer video stories and updates", icon: <FiVideo /> },
  { value: "image", label: "Image", helper: "Photos, posters, and screenshots", icon: <FiImage /> },
  { value: "banner", label: "Banner", helper: "Promotions, events, and hiring creative", icon: <FiImage /> },
  { value: "text", label: "Text", helper: "Fast status updates and wins", icon: <FiMessageSquare /> },
  { value: "document", label: "Document", helper: "PDFs, decks, and case studies", icon: <FiFileText /> },
];

const reelReportReasonOptions = [
  "Abusive Language",
  "Hate Speech",
  "Sexual Content",
  "Violence or Threat",
  "Illegal Activity",
  "Spam or Misleading",
  "Other",
];

function defaultComposer() {
  return { type: "reel", headline: "", content: "", visibility: "everyone", file: null, mediaModeration: null };
}

function defaultCommentsPanel() {
  return { open: false, postId: "", snapshot: null, comments: [], total: 0, loading: false, loadingMore: false, hasMore: false, nextOffset: null };
}

function defaultStoriesState() {
  return { groups: [], ttlHours: 24 };
}

function defaultStoryComposer() {
  return {
    caption: "",
    file: null,
    mediaModeration: null,
    expiryMode: "24h",
    customExpiresAt: "",
    music: null,
  };
}

function defaultStoryViewer() {
  return { open: false, groupIndex: 0, storyIndex: 0 };
}

function defaultShareSheet() {
  return { open: false, kind: "", story: null, post: null };
}

function defaultFeed() {
  return { viewer: null, insights: { title: "Explore", subtitle: "" }, suggestions: [], trending: [], posts: [], hasMore: false, nextOffset: null };
}

function defaultSavedFeed() {
  return { posts: [], hasMore: false, nextOffset: null };
}

function defaultReportDialog() {
  return { open: false, postId: "", reason: "Abusive Language", details: "" };
}

function defaultNotificationsState() {
  return { items: [], unreadCount: 0, loading: false };
}

function loadPinnedReels() {
  try {
    const raw = window.localStorage.getItem("explore-pinned-reels-v1");
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.map((item) => String(item || "")).filter(Boolean) : [];
  } catch {
    return [];
  }
}

function defaultMessagesState() {
  return {
    threads: [],
    requests: 0,
    activeThread: null,
    messages: [],
    draft: "",
    attachmentPreview: "",
    attachmentName: "",
    attachmentMimeType: "",
    attachmentFileSize: "",
    attachmentUploading: false,
    replyTarget: null,
    selectedMessageIds: [],
    loadingList: false,
    loadingThread: false,
    sending: false,
    deleting: false,
  };
}

function defaultStoryReplyState() {
  return { draft: "", sending: false };
}

function defaultStoryInsightsState() {
  return { open: false, loading: false, storyId: "", metrics: { views: 0, likes: 0 }, viewers: [], likes: [], activeTab: "views" };
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
  if (days < 7) return `${days}d`;
  return then.toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
}

function excerpt(text = "", max = 120) {
  const value = String(text || "").trim();
  if (value.length <= max) return value;
  return `${value.slice(0, max).trim()}...`;
}

function mediaAcceptForType(type) {
  if (type === "document") return ".pdf,.ppt,.pptx,.doc,.docx";
  if (type === "video" || type === "reel") return "video/*";
  if (type === "banner" || type === "image") return "image/*";
  return "image/*,video/*,.pdf,.ppt,.pptx,.doc,.docx";
}

function toDatetimeLocalInputValue(dateValue) {
  const date = new Date(dateValue);
  if (!Number.isFinite(date.getTime())) return "";
  const pad = (value) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function durationLabel(seconds) {
  const total = Math.max(0, Math.floor(Number(seconds || 0)));
  const mins = Math.floor(total / 60);
  const secs = total % 60;
  return `${mins}:${String(secs).padStart(2, "0")}`;
}

function clampNumber(value, min, max) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return min;
  return Math.min(max, Math.max(min, numeric));
}

function normalizeStoryMusicTrack(track = {}) {
  const durationSeconds = Math.max(3, Math.floor(Number(track?.durationSeconds || 0) || 15));
  const clipDurationSeconds = Math.min(15, durationSeconds);
  return {
    trackId: String(track?.trackId || track?.id || ""),
    title: String(track?.title || track?.name || "Untitled"),
    artist: String(track?.artist || "Unknown artist"),
    album: String(track?.album || ""),
    coverUrl: String(track?.coverUrl || ""),
    audioUrl: String(track?.audioUrl || ""),
    durationSeconds,
    startSeconds: 0,
    clipDurationSeconds: Math.max(3, clipDurationSeconds),
    provider: String(track?.provider || "jamendo"),
  };
}

const STORY_MUSIC_LIBRARY_KEY = "career_pulse_story_music_library_v1";

function isReelEligible(post) {
  const type = String(post?.type || "").toLowerCase();
  return Boolean(post?.media?.url) && ["image", "banner", "video", "reel"].includes(type);
}

function updatePost(posts, postId, updater) {
  return posts.map((post) => (post.id === postId ? updater(post) : post));
}

function uniqComments(items = []) {
  const seen = new Set();
  return items.filter((item) => {
    const id = String(item?.id || "");
    if (!id || seen.has(id)) return false;
    seen.add(id);
    return true;
  });
}

function sanitizeExplorePosts(items = []) {
  return (Array.isArray(items) ? items : []).filter(
    (item) =>
      item &&
      typeof item === "object" &&
      item.author &&
      typeof item.author === "object" &&
      String(item.id || "").trim(),
  );
}

function sanitizeExploreStoryGroups(items = []) {
  return (Array.isArray(items) ? items : [])
    .filter((group) => group && typeof group === "object" && group.author && typeof group.author === "object")
    .map((group) => ({
      ...group,
      items: (Array.isArray(group.items) ? group.items : []).filter(
        (item) =>
          item &&
          typeof item === "object" &&
          item.author &&
          typeof item.author === "object" &&
          String(item.id || "").trim(),
      ),
    }))
    .filter((group) => (group.items || []).length > 0);
}

function uniqPosts(items = []) {
  const seen = new Set();
  return sanitizeExplorePosts(items).filter((item) => {
    const id = String(item?.id || "");
    if (!id || seen.has(id)) return false;
    seen.add(id);
    return true;
  });
}

function removePostById(items = [], postId) {
  return items.filter((post) => post.id !== postId);
}

function uniqMusicTracks(items = []) {
  const seen = new Set();
  return items.filter((item) => {
    const key = String(item?.trackId || item?.id || item?.audioUrl || "").trim();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function sortExploreThreadsByRecent(items = []) {
  return [...items].sort((left, right) => {
    const rightTime = new Date(right?.updatedAt || 0).getTime();
    const leftTime = new Date(left?.updatedAt || 0).getTime();
    return rightTime - leftTime;
  });
}

function markStorySeenGroups(groups = [], storyId) {
  return groups.map((group) => {
    let changed = false;
    const items = (group.items || []).map((item) => {
      if (item.id !== storyId || item.viewerState?.seen) return item;
      changed = true;
      return {
        ...item,
        viewerState: { ...item.viewerState, seen: true },
      };
    });

    if (!changed) return group;

    const hasUnseen = items.some((item) => !item.viewerState?.seen);
    return {
      ...group,
      items,
      viewerState: {
        hasUnseen,
        seen: !hasUnseen,
      },
    };
  });
}

function patchStoryGroups(groups = [], storyId, updater) {
  return groups.map((group) => ({
    ...group,
    items: (group.items || []).map((item) => (item.id === storyId ? updater(item, group) : item)),
  }));
}

function removeStoryFromGroups(groups = [], storyId) {
  return groups
    .map((group) => ({
      ...group,
      items: (group.items || []).filter((item) => item.id !== storyId),
    }))
    .filter((group) => (group.items || []).length > 0);
}

function resolveStoryAuthor(story, group = null) {
  return group?.author || story?.author || null;
}

function isOwnStory(story, group = null) {
  return Boolean(resolveStoryAuthor(story, group)?.isSelf);
}

function findStoryGroupByStoryId(groups = [], storyId) {
  return groups.find((group) => (group.items || []).some((item) => String(item?.id || "") === String(storyId || ""))) || null;
}

export default function CareerPulsePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const isCompanyView = location.pathname.startsWith("/company");
  const basePath = isCompanyView ? "/company" : "/student";
  const pageShellClass = isCompanyView ? "-m-5 lg:-m-7" : "";

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [feed, setFeed] = useState(defaultFeed());
  const [savedFeed, setSavedFeed] = useState(defaultSavedFeed());
  const [savedLoading, setSavedLoading] = useState(false);
  const [savedRefreshing, setSavedRefreshing] = useState(false);
  const [savedLoadingMore, setSavedLoadingMore] = useState(false);
  const [stories, setStories] = useState(defaultStoriesState());
  const [viewMode, setViewMode] = useState("home");
  const [homeMode, setHomeMode] = useState("home");
  const [reelSource, setReelSource] = useState("all");
  const [activeIndex, setActiveIndex] = useState(0);
  const [searchValue, setSearchValue] = useState("");
  const [pendingReelStartId, setPendingReelStartId] = useState("");
  const [storyComposerOpen, setStoryComposerOpen] = useState(false);
  const [storyComposer, setStoryComposer] = useState(defaultStoryComposer());
  const [storyPreview, setStoryPreview] = useState("");
  const [storyDragActive, setStoryDragActive] = useState(false);
  const [storyMusicPickerOpen, setStoryMusicPickerOpen] = useState(false);
  const [storyMusicQuery, setStoryMusicQuery] = useState("");
  const [storyMusicTab, setStoryMusicTab] = useState("for-you");
  const [storyMusicLoading, setStoryMusicLoading] = useState(false);
  const [storyMusicLoadingMore, setStoryMusicLoadingMore] = useState(false);
  const [storyMusicError, setStoryMusicError] = useState("");
  const [storyMusicResults, setStoryMusicResults] = useState([]);
  const [storyMusicOffset, setStoryMusicOffset] = useState(0);
  const [storyMusicHasMore, setStoryMusicHasMore] = useState(false);
  const [storyMusicPreviewing, setStoryMusicPreviewing] = useState(false);
  const [savedStoryMusicTracks, setSavedStoryMusicTracks] = useState(() => {
    if (typeof window === "undefined") return [];
    try {
      const raw = window.localStorage.getItem(STORY_MUSIC_LIBRARY_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed.map((item) => normalizeStoryMusicTrack(item)).filter((item) => item.audioUrl) : [];
    } catch {
      return [];
    }
  });
  const [mutedStoryAuthors, setMutedStoryAuthors] = useState({});
  const [hiddenStoryIds, setHiddenStoryIds] = useState({});
  const [storyViewer, setStoryViewer] = useState(defaultStoryViewer());
  const [storyReply, setStoryReply] = useState(defaultStoryReplyState());
  const [storyInsights, setStoryInsights] = useState(defaultStoryInsightsState());
  const [shareSheet, setShareSheet] = useState(defaultShareSheet());
  const [composerOpen, setComposerOpen] = useState(false);
  const [composer, setComposer] = useState(defaultComposer());
  const [composerPreview, setComposerPreview] = useState("");
  const [commentDrafts, setCommentDrafts] = useState({});
  const [commentsPanel, setCommentsPanel] = useState(defaultCommentsPanel());
  const [reportDialog, setReportDialog] = useState(defaultReportDialog());
  const [notifications, setNotifications] = useState(defaultNotificationsState());
  const [exploreNotificationPopup, setExploreNotificationPopup] = useState(null);
  const [exploreNotificationSound, setExploreNotificationSound] = useState(true);
  const [messagesPanel, setMessagesPanel] = useState(defaultMessagesState());
  const [selectedMessageThreadId, setSelectedMessageThreadId] = useState("");
  const [busy, setBusy] = useState({});
  const [reelAudioMuted, setReelAudioMuted] = useState(true);
  const [pinnedReelIds, setPinnedReelIds] = useState(() => loadPinnedReels());
  const [expandedCaptions, setExpandedCaptions] = useState({});
  const reelViewportRef = useRef(null);
  const reelRefs = useRef([]);
  const reelInteractionLockRef = useRef(false);
  const videoRefs = useRef({});
  const storyFileInputRef = useRef(null);
  const storyMusicPreviewRef = useRef(null);
  const storyMusicPreviewTimerRef = useRef(null);
  const viewedStoriesRef = useRef(new Set());
  const searchInputRef = useRef(null);
  const hasHandledInitialMode = useRef(false);
  const notificationUnreadRef = useRef(0);
  const notificationLatestIdRef = useRef("");
  const notificationPopupTimerRef = useRef(null);
  const messageUnreadRef = useRef(0);
  const messagesPanelRef = useRef(defaultMessagesState());
  const selectedMessageThreadIdRef = useRef("");

  const homePosts = useMemo(() => {
    const query = String(searchValue || "").trim().toLowerCase();
    if (!query) return feed.posts;
    return feed.posts.filter((post) => {
      const haystack = [
        post.author?.name,
        post.author?.headline,
        post.headline,
        post.content,
        ...(post.tags || []),
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(query);
    });
  }, [feed.posts, searchValue]);

  const savedPosts = useMemo(() => {
    const query = String(searchValue || "").trim().toLowerCase();
    if (!query) return savedFeed.posts;
    return savedFeed.posts.filter((post) => {
      const haystack = [
        post.author?.name,
        post.author?.headline,
        post.headline,
        post.content,
        ...(post.tags || []),
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(query);
    });
  }, [savedFeed.posts, searchValue]);
  const filteredNotifications = useMemo(() => {
      const query = String(searchValue || "").trim().toLowerCase();
      const cutoff = Date.now() - 1000 * 60 * 60 * 24 * 30;
      const items = (Array.isArray(notifications.items) ? notifications.items : []).filter(
        (item) => new Date(item?.createdAt || 0).getTime() >= cutoff
      );
      if (!query) return items;
      return items.filter((item) =>
        `${item.title} ${item.message} ${item.actor?.name || ""} ${item.eventType || ""}`.toLowerCase().includes(query)
      );
    }, [notifications.items, searchValue]);
  const filteredMessageThreads = useMemo(() => {
    const query = String(searchValue || "").trim().toLowerCase();
    const items = Array.isArray(messagesPanel.threads) ? messagesPanel.threads : [];
    if (!query) return items;
    return items.filter((thread) =>
      `${thread.participant?.name || ""} ${thread.participant?.headline || ""} ${thread.preview || ""}`
        .toLowerCase()
        .includes(query)
    );
  }, [messagesPanel.threads, searchValue]);
  const selectedMessageThread = useMemo(() => {
    const activeThreadId = String(selectedMessageThreadId || messagesPanel.activeThread?.id || "");
    if (!activeThreadId) return messagesPanel.activeThread || null;
    return (
      messagesPanel.threads.find((thread) => String(thread?.id || "") === activeThreadId) ||
      (String(messagesPanel.activeThread?.id || "") === activeThreadId ? messagesPanel.activeThread : null) ||
      null
    );
  }, [messagesPanel.threads, messagesPanel.activeThread, selectedMessageThreadId]);

  useEffect(() => {
    if (!selectedMessageThread) return;
    setMessagesPanel((prev) => {
      const selectedId = String(selectedMessageThread.id || "");
      if (!selectedId) return prev;
      const activeId = String(prev.activeThread?.id || "");
      const sameParticipant =
        String(prev.activeThread?.participant?.id || "") === String(selectedMessageThread.participant?.id || "") &&
        String(prev.activeThread?.participant?.name || "") === String(selectedMessageThread.participant?.name || "") &&
        String(prev.activeThread?.participant?.headline || "") === String(selectedMessageThread.participant?.headline || "") &&
        String(prev.activeThread?.participant?.avatarUrl || "") === String(selectedMessageThread.participant?.avatarUrl || "");

      if (activeId === selectedId && sameParticipant) {
        return prev;
      }

      return {
        ...prev,
        activeThread:
          activeId === selectedId && prev.activeThread
            ? {
                ...prev.activeThread,
                ...selectedMessageThread,
                participant: selectedMessageThread.participant,
              }
            : selectedMessageThread,
      };
    });
  }, [selectedMessageThread]);

  const regularReelPosts = useMemo(() => feed.posts.filter((post) => isReelEligible(post)), [feed.posts]);
  const savedReelPosts = useMemo(() => savedFeed.posts.filter((post) => isReelEligible(post)), [savedFeed.posts]);
  const reelPosts = useMemo(() => {
    const list = reelSource === "saved-first" ? [...savedReelPosts, ...regularReelPosts] : regularReelPosts;
    return uniqPosts(list);
  }, [reelSource, savedReelPosts, regularReelPosts]);
  const activePost = useMemo(() => reelPosts[activeIndex] || reelPosts[0] || null, [reelPosts, activeIndex]);
  const activeCommentsPost = useMemo(
    () =>
      feed.posts.find((post) => post.id === commentsPanel.postId) ||
      savedFeed.posts.find((post) => post.id === commentsPanel.postId) ||
      commentsPanel.snapshot ||
      null,
    [feed.posts, savedFeed.posts, commentsPanel.postId, commentsPanel.snapshot],
  );
  const activeReportPost = useMemo(
    () =>
      feed.posts.find((post) => post.id === reportDialog.postId) ||
      savedFeed.posts.find((post) => post.id === reportDialog.postId) ||
      null,
    [feed.posts, savedFeed.posts, reportDialog.postId],
  );
  const storyGroups = useMemo(
    () =>
      (Array.isArray(stories.groups) ? stories.groups : [])
        .filter(Boolean)
        .map((group) => ({
          ...group,
          items: (group.items || []).filter((item) => item && !hiddenStoryIds[item.id]),
        }))
        .filter(
          (group) =>
            (group.author?.isSelf || !mutedStoryAuthors[group.author?.id]) &&
            (group.items || []).length > 0,
        ),
    [stories.groups, hiddenStoryIds, mutedStoryAuthors],
  );
  const activeStoryGroup = useMemo(
    () => storyGroups[storyViewer.groupIndex] || null,
    [storyGroups, storyViewer.groupIndex],
  );
  const activeStory = useMemo(
    () => activeStoryGroup?.items?.[storyViewer.storyIndex] || null,
    [activeStoryGroup, storyViewer.storyIndex],
  );
  const activeStoryAuthor = useMemo(
    () => resolveStoryAuthor(activeStory, activeStoryGroup),
    [activeStory, activeStoryGroup],
  );
  const activeStoryLiked = Boolean(activeStory?.viewerState?.liked);
  const hasExploreRightSidebar = viewMode === "reels" || homeMode === "home";
  const activeShareUrl = shareSheet.story?.id
    ? `${window.location.origin}${location.pathname}#story-${shareSheet.story.id}`
    : shareSheet.post?.id
      ? `${window.location.origin}${location.pathname}#post-${shareSheet.post.id}`
      : "";
  const storyExpiryInputMin = toDatetimeLocalInputValue(Date.now() + 60 * 1000);
  const setToast = ({ show = true, tone = "info", message = "" } = {}) => {
    if (!show || !String(message || "").trim()) return;

    const iconMap = {
      success: "success",
      error: "error",
      warning: "warning",
      dark: "info",
      info: "info",
    };

    void Swal.fire({
      toast: true,
      position: "top-end",
      icon: iconMap[tone] || "info",
      title: String(message || "").trim(),
      showConfirmButton: false,
      timer: tone === "error" ? 3200 : 2400,
      timerProgressBar: true,
    });
  };

  const playExploreNotificationSound = () => {
    if (!exploreNotificationSound || typeof window === "undefined") return;
    const AudioCtor = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtor) return;
    try {
      const audioContext = new AudioCtor();
      const oscillator = audioContext.createOscillator();
      const gain = audioContext.createGain();
      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(880, audioContext.currentTime);
      gain.gain.setValueAtTime(0.001, audioContext.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.05, audioContext.currentTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.22);
      oscillator.connect(gain);
      gain.connect(audioContext.destination);
      oscillator.start();
      oscillator.stop(audioContext.currentTime + 0.24);
      window.setTimeout(() => {
        void audioContext.close().catch(() => {});
      }, 300);
    } catch {
      // ignore audio failures
    }
  };

  const showExploreNotificationPopup = (notification) => {
    if (!notification?.id) return;
    if (notificationPopupTimerRef.current) {
      window.clearTimeout(notificationPopupTimerRef.current);
    }
    setExploreNotificationPopup(notification);
    notificationPopupTimerRef.current = window.setTimeout(() => {
      setExploreNotificationPopup(null);
    }, 3600);
  };
  const canAttachStoryMusic = Boolean(storyComposer.file && String(storyComposer.file?.type || "").startsWith("image/"));
  const selectedStoryMusic = storyComposer.music && storyComposer.music.audioUrl ? storyComposer.music : null;
  const selectedStoryMusicDuration = Math.max(3, Math.floor(Number(selectedStoryMusic?.durationSeconds || 0) || 15));
  const storyMusicMaxStart = Math.max(0, selectedStoryMusicDuration - 3);
  const storyMusicCurrentStart = clampNumber(selectedStoryMusic?.startSeconds || 0, 0, storyMusicMaxStart);
  const storyMusicMaxClip = Math.max(3, selectedStoryMusicDuration - storyMusicCurrentStart);
  const storyMusicCurrentClip = clampNumber(
    selectedStoryMusic?.clipDurationSeconds || Math.min(15, storyMusicMaxClip),
    3,
    storyMusicMaxClip,
  );
  const filteredSavedStoryMusicTracks = useMemo(() => {
    const query = String(storyMusicQuery || "").trim().toLowerCase();
    if (!query) return savedStoryMusicTracks;
    return savedStoryMusicTracks.filter((track) => {
      const haystack = `${track.title} ${track.artist} ${track.album}`.toLowerCase();
      return haystack.includes(query);
    });
  }, [savedStoryMusicTracks, storyMusicQuery]);
  const storyMusicTracks = storyMusicTab === "saved" ? filteredSavedStoryMusicTracks : storyMusicResults;

  const setBusyFlag = (key, value) => setBusy((prev) => ({ ...prev, [key]: value }));

  useEffect(() => {
    messagesPanelRef.current = messagesPanel;
    const nextSelectedThreadId = String(selectedMessageThreadIdRef.current || selectedMessageThreadId || messagesPanel.activeThread?.id || "");
    selectedMessageThreadIdRef.current = nextSelectedThreadId;
    if (nextSelectedThreadId && nextSelectedThreadId !== selectedMessageThreadId) {
      setSelectedMessageThreadId(nextSelectedThreadId);
    }
  }, [messagesPanel, selectedMessageThreadId]);

  useEffect(
    () => () => {
      if (notificationPopupTimerRef.current) {
        window.clearTimeout(notificationPopupTimerRef.current);
      }
    },
    []
  );

  useEffect(() => {
    try {
      window.localStorage.setItem("explore-pinned-reels-v1", JSON.stringify(pinnedReelIds));
    } catch {
      // ignore
    }
  }, [pinnedReelIds]);
  const patchPostAcrossCollections = (postId, updater) => {
    setFeed((prev) => ({
      ...prev,
      posts: updatePost(prev.posts, postId, updater),
    }));
    setSavedFeed((prev) => ({
      ...prev,
      posts: updatePost(prev.posts, postId, updater),
    }));
  };
  const removePostAcrossCollections = (postId) => {
    setFeed((prev) => ({
      ...prev,
      posts: removePostById(prev.posts, postId),
    }));
    setSavedFeed((prev) => ({
      ...prev,
      posts: removePostById(prev.posts, postId),
    }));
  };
  const scrollToPost = (index) => {
    if (index < 0 || index >= reelPosts.length) return;
    const target = reelRefs.current[index];
    if (!target) return;
    target.scrollIntoView({ behavior: "smooth", block: "center" });
    setActiveIndex(index);
  };

  const moveReelBy = (step = 1) => {
    if (!reelPosts.length || reelInteractionLockRef.current) return;

    if (
      step > 0 &&
      viewMode === "reels" &&
      reelSource === "saved-first" &&
      savedReelPosts.length &&
      activeIndex === savedReelPosts.length - 1 &&
      savedFeed.hasMore &&
      !savedLoading &&
      !savedRefreshing &&
      !savedLoadingMore
    ) {
      void loadSavedFeed({
        offset: Number(savedFeed.nextOffset || savedFeed.posts.length),
        reset: false,
        silent: true,
      });
      return;
    }

    const nextIndex = Math.max(0, Math.min(reelPosts.length - 1, activeIndex + step));
    if (nextIndex === activeIndex) {
      if (step > 0 && viewMode === "reels" && feed.hasMore && !loadingMore && !refreshing) {
        void loadFeed({ offset: Number(feed.nextOffset || feed.posts.length), reset: false, mediaOnly: true });
      }
      return;
    }

    reelInteractionLockRef.current = true;
    scrollToPost(nextIndex);
    window.setTimeout(() => {
      reelInteractionLockRef.current = false;
    }, 380);
  };

  const openComposer = (type = "reel") => {
    setComposer({ ...defaultComposer(), type });
    setComposerOpen(true);
  };

  const closeComposer = () => {
    setComposer(defaultComposer());
    if (composerPreview) URL.revokeObjectURL(composerPreview);
    setComposerPreview("");
    setComposerOpen(false);
  };

  const openStoryComposer = () => {
    setStoryViewer(defaultStoryViewer());
    setStoryComposerOpen(true);
  };

  const stopStoryMusicPreview = () => {
    if (storyMusicPreviewTimerRef.current) {
      window.clearTimeout(storyMusicPreviewTimerRef.current);
      storyMusicPreviewTimerRef.current = null;
    }
    const node = storyMusicPreviewRef.current;
    if (node) {
      node.pause();
    }
    setStoryMusicPreviewing(false);
  };

  const closeStoryComposer = () => {
    stopStoryMusicPreview();
    setStoryComposer(defaultStoryComposer());
    if (storyPreview) URL.revokeObjectURL(storyPreview);
    setStoryPreview("");
    setStoryDragActive(false);
    setStoryMusicPickerOpen(false);
    setStoryMusicQuery("");
    setStoryMusicTab("for-you");
    setStoryMusicResults([]);
    setStoryMusicOffset(0);
    setStoryMusicHasMore(false);
    setStoryMusicLoading(false);
    setStoryMusicLoadingMore(false);
    setStoryMusicError("");
    if (storyFileInputRef.current) storyFileInputRef.current.value = "";
    setStoryComposerOpen(false);
  };

  const loadStoryMusicTracks = async ({ query = "", section = "for-you", offset = 0, append = false } = {}) => {
    try {
      if (append) {
        setStoryMusicLoadingMore(true);
      } else {
        setStoryMusicLoading(true);
        setStoryMusicError("");
      }
      const data = await getCareerPulseMusicTracks({
        q: query,
        section: section === "trending" ? "trending" : "for-you",
        source: "auto",
        limit: 30,
        offset,
      });
      const tracks = Array.isArray(data?.tracks)
        ? data.tracks.map((item) => normalizeStoryMusicTrack(item)).filter((item) => item.audioUrl)
        : [];
      if (!tracks.length && data?.message && !append) {
        setStoryMusicError(String(data.message));
      }
      setStoryMusicResults((prev) => (append ? uniqMusicTracks([...(prev || []), ...tracks]) : tracks));
      setStoryMusicHasMore(Boolean(data?.hasMore));
      setStoryMusicOffset(Number(data?.nextOffset || offset + tracks.length));
    } catch (error) {
      setStoryMusicError(error?.response?.data?.message || "Could not load songs right now.");
    } finally {
      setStoryMusicLoading(false);
      setStoryMusicLoadingMore(false);
    }
  };

  const openStoryMusicPicker = () => {
    if (!canAttachStoryMusic) {
      setToast({ show: true, tone: "error", message: "Story music can be added to image stories only." });
      return;
    }
    setStoryMusicPickerOpen(true);
    setStoryMusicError("");
  };

  const closeStoryMusicPicker = () => {
    setStoryMusicPickerOpen(false);
  };

  const selectStoryMusicTrack = (track) => {
    const normalized = normalizeStoryMusicTrack(track);
    if (!normalized.audioUrl) {
      setToast({ show: true, tone: "error", message: "This track preview is not available." });
      return;
    }
    setStoryComposer((prev) => ({
      ...prev,
      music: {
        ...normalized,
        startSeconds: 0,
        clipDurationSeconds: Math.max(3, Math.min(15, normalized.durationSeconds)),
      },
    }));
    setStoryMusicPickerOpen(false);
  };

  const toggleSaveStoryMusicTrack = (track) => {
    const normalized = normalizeStoryMusicTrack(track);
    setSavedStoryMusicTracks((prev) => {
      const exists = prev.some((item) => item.trackId === normalized.trackId);
      if (exists) return prev.filter((item) => item.trackId !== normalized.trackId);
      return [normalized, ...prev].slice(0, 100);
    });
  };

  const previewSelectedStoryMusic = () => {
    if (!selectedStoryMusic?.audioUrl || !storyMusicPreviewRef.current) return;
    if (storyMusicPreviewing) {
      stopStoryMusicPreview();
      return;
    }

    const node = storyMusicPreviewRef.current;
    const start = clampNumber(selectedStoryMusic.startSeconds || 0, 0, storyMusicMaxStart);
    const clipSeconds = clampNumber(selectedStoryMusic.clipDurationSeconds || 15, 3, storyMusicMaxClip);

    stopStoryMusicPreview();
    node.currentTime = start;
    node.muted = false;
    node.volume = 1;

    const playPromise = node.play();
    if (playPromise?.catch) {
      playPromise.catch(() => {
        setToast({ show: true, tone: "error", message: "Unable to preview this song on your device." });
      });
    }

    setStoryMusicPreviewing(true);
    storyMusicPreviewTimerRef.current = window.setTimeout(() => {
      stopStoryMusicPreview();
      if (storyMusicPreviewRef.current) storyMusicPreviewRef.current.currentTime = start;
    }, clipSeconds * 1000);
  };

  const handleComposerFile = async (file) => {
    if (composerPreview) URL.revokeObjectURL(composerPreview);
    if (!file) {
      setComposer((prev) => ({ ...prev, file: null, mediaModeration: null }));
      setComposerPreview("");
      return;
    }
    if (String(file.type || "").startsWith("image/") || String(file.type || "").startsWith("video/")) {
      try {
        setBusyFlag("media-scan", true);
        const moderation = await analyzeMediaFileSafety(file);
        if (moderation?.blocked) {
          setComposer((prev) => ({ ...prev, file: null, mediaModeration: moderation }));
          setComposerPreview("");
          setToast({
            show: true,
            tone: "warning",
            message: moderation?.reasons?.[0] || "This media may contain unsafe visual content and cannot be uploaded.",
          });
          return;
        }
        setComposer((prev) => ({ ...prev, file, mediaModeration: moderation }));
      } finally {
        setBusyFlag("media-scan", false);
      }
      setComposerPreview(URL.createObjectURL(file));
      return;
    }
    setComposer((prev) => ({ ...prev, file, mediaModeration: null }));
    if (String(file.type || "").startsWith("image/") || String(file.type || "").startsWith("video/")) {
      setComposerPreview(URL.createObjectURL(file));
      return;
    }
    setComposerPreview("");
  };

  const handleStoryFile = async (file) => {
    if (storyPreview) URL.revokeObjectURL(storyPreview);
    setStoryDragActive(false);
    stopStoryMusicPreview();

    if (file && !String(file.type || "").match(/^(image|video)\//)) {
      setStoryComposer((prev) => ({ ...prev, file: null, mediaModeration: null, music: null }));
      setStoryPreview("");
      setToast({ show: true, tone: "error", message: "Stories support image and video files only." });
      return;
    }

    const isImage = Boolean(file && String(file.type || "").startsWith("image/"));
    if (!file) {
      setStoryComposer((prev) => ({ ...prev, file: null, mediaModeration: null, music: null }));
      if (storyFileInputRef.current) storyFileInputRef.current.value = "";
      setStoryPreview("");
      return;
    }
    try {
      setBusyFlag("story-media-scan", true);
      const moderation = await analyzeMediaFileSafety(file);
      if (moderation?.blocked) {
        setStoryComposer((prev) => ({ ...prev, file: null, mediaModeration: moderation, music: null }));
        if (storyFileInputRef.current) storyFileInputRef.current.value = "";
        setStoryPreview("");
        setToast({
          show: true,
          tone: "warning",
          message: moderation?.reasons?.[0] || "This story media may contain unsafe visual content and cannot be uploaded.",
        });
        return;
      }
      setStoryComposer((prev) => ({
        ...prev,
        file,
        mediaModeration: moderation,
        music: isImage ? prev.music : null,
      }));
    } finally {
      setBusyFlag("story-media-scan", false);
    }
    if (String(file.type || "").startsWith("image/") || String(file.type || "").startsWith("video/")) {
      setStoryPreview(URL.createObjectURL(file));
      return;
    }
    setStoryPreview("");
  };

  const openStoryFilePicker = () => {
    if (!storyFileInputRef.current) return;
    storyFileInputRef.current.value = "";
    storyFileInputRef.current.click();
  };

  const handleStoryDrop = (event) => {
    event.preventDefault();
    event.stopPropagation();
    setStoryDragActive(false);
    handleStoryFile(event.dataTransfer?.files?.[0] || null);
  };

  const loadStories = async ({ silent = false } = {}) => {
    try {
      const data = await getCareerPulseStories();
      const mutedAuthorMap = Object.fromEntries(
        (Array.isArray(data?.viewerPreferences?.mutedAuthorIds) ? data.viewerPreferences.mutedAuthorIds : [])
          .filter(Boolean)
          .map((id) => [String(id), true]),
      );
      const safeGroups = sanitizeExploreStoryGroups(data?.groups);
      setStories({
        groups: safeGroups,
        ttlHours: Number(data?.ttlHours || 24),
      });
      setMutedStoryAuthors(mutedAuthorMap);
      return { ...(data || {}), groups: safeGroups };
    } catch (error) {
      if (!silent) {
        setToast({
          show: true,
          tone: "error",
          message: error?.response?.data?.message || "Could not load stories right now.",
        });
      }
      return null;
    }
  };

  const loadFeed = async ({ offset = 0, reset = false, mediaOnly = false, focusPostId = "" } = {}) => {
    try {
      if (reset) {
        feed.posts.length ? setRefreshing(true) : setLoading(true);
      } else {
        setLoadingMore(true);
      }

      const data = await getCareerPulseFeed({ limit: 6, offset, mediaOnly, focusPostId });
      const incomingPosts = sanitizeExplorePosts(data?.posts);

      setFeed((prev) => ({
        viewer: data?.viewer || prev.viewer,
        insights: data?.insights || prev.insights,
        suggestions: Array.isArray(data?.suggestions) ? data.suggestions.filter(Boolean) : prev.suggestions,
        trending: Array.isArray(data?.trending) ? data.trending : prev.trending,
        posts: reset ? incomingPosts : uniqPosts([...(prev.posts || []), ...incomingPosts]),
        hasMore: Boolean(data?.hasMore),
        nextOffset: data?.nextOffset ?? null,
      }));

      if (reset) {
        const nextIndex = focusPostId ? incomingPosts.findIndex((post) => post.id === focusPostId) : 0;
        setActiveIndex(nextIndex >= 0 ? nextIndex : 0);
        reelViewportRef.current?.scrollTo({ top: 0 });
      }
    } catch (error) {
      setToast({
        show: true,
        tone: "error",
        message: error?.response?.data?.message || "Could not load Explore right now.",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  };

  const loadSavedFeed = async ({ offset = 0, reset = false, silent = false } = {}) => {
    try {
      if (reset) {
        savedFeed.posts.length ? setSavedRefreshing(true) : setSavedLoading(true);
      } else {
        setSavedLoadingMore(true);
      }

      const data = await getCareerPulseFeed({ limit: 12, offset, savedOnly: true });
      const incomingPosts = sanitizeExplorePosts(data?.posts);

      setSavedFeed((prev) => ({
        posts: reset ? incomingPosts : uniqPosts([...(prev.posts || []), ...incomingPosts]),
        hasMore: Boolean(data?.hasMore),
        nextOffset: data?.nextOffset ?? null,
      }));

      if (data?.viewer) {
        setFeed((prev) => ({ ...prev, viewer: data.viewer }));
      }
    } catch (error) {
      if (!silent) {
        setToast({
          show: true,
          tone: "error",
          message: error?.response?.data?.message || "Could not load saved posts right now.",
        });
      }
    } finally {
      setSavedLoading(false);
      setSavedRefreshing(false);
      setSavedLoadingMore(false);
    }
  };

  const loadNotifications = async ({ silent = false, markRead = false } = {}) => {
      try {
        setNotifications((prev) => ({
          ...prev,
          loading: silent ? prev.loading && !(prev.items || []).length : true,
        }));
        const data = await getCareerPulseNotifications({ limit: 40 });
        const nextItems = Array.isArray(data?.notifications) ? data.notifications : [];
        const nextUnreadCount = Number(data?.unreadCount || 0);
        const latestNotification = nextItems[0] || null;
        setNotifications({
          items: nextItems,
          unreadCount: nextUnreadCount,
          loading: false,
        });
        if (
          silent &&
          nextUnreadCount > notificationUnreadRef.current &&
          homeMode !== "notifications" &&
          latestNotification?.id &&
          latestNotification.id !== notificationLatestIdRef.current
        ) {
          showExploreNotificationPopup(latestNotification);
          playExploreNotificationSound();
        }
        notificationUnreadRef.current = nextUnreadCount;
        notificationLatestIdRef.current = String(latestNotification?.id || notificationLatestIdRef.current || "");
        setFeed((prev) => ({
          ...prev,
          viewer: prev.viewer
            ? { ...prev.viewer, notificationsUnread: nextUnreadCount }
            : prev.viewer,
        }));

        if (markRead && nextUnreadCount > 0) {
          const readResult = await markCareerPulseNotificationsRead();
          setNotifications((prev) => ({
            ...prev,
            unreadCount: Number(readResult?.unreadCount || 0),
            items: prev.items.map((item) => ({ ...item, readAt: item.readAt || new Date().toISOString() })),
        }));
        setFeed((prev) => ({
          ...prev,
          viewer: prev.viewer
            ? { ...prev.viewer, notificationsUnread: Number(readResult?.unreadCount || 0) }
            : prev.viewer,
        }));
        notificationUnreadRef.current = Number(readResult?.unreadCount || 0);
      }
    } catch (error) {
      if (!silent) {
        setToast({
          show: true,
          tone: "error",
          message: error?.response?.data?.message || "Could not load Explore notifications right now.",
        });
      }
      setNotifications((prev) => ({ ...prev, loading: false }));
    }
  };

  const loadMessageThreads = async ({ silent = false } = {}) => {
      try {
        setMessagesPanel((prev) => ({
          ...prev,
          loadingList: silent ? prev.loadingList && !(prev.threads || []).length : true,
        }));
        const data = await getCareerPulseMessageThreads();
      const nextThreads = Array.isArray(data?.threads) ? data.threads : [];
      const nextUnreadCount = Number(data?.unreadCount || 0);
      if (silent && nextUnreadCount > messageUnreadRef.current && homeMode !== "messages") {
        setToast({
          show: true,
          tone: "info",
          message: Number(data?.requests || 0) > 0 ? "You have a new Explore message request." : "You have a new Explore message.",
        });
      }
      messageUnreadRef.current = nextUnreadCount;
      setFeed((prev) => ({
        ...prev,
        viewer: prev.viewer ? { ...prev.viewer, messagesUnread: nextUnreadCount } : prev.viewer,
      }));
      setMessagesPanel((prev) => {
        const activeThreadId = String(selectedMessageThreadIdRef.current || selectedMessageThreadId || prev.activeThread?.id || "");
        const sortedThreads = sortExploreThreadsByRecent(nextThreads);
        const matchedActive =
          sortedThreads.find((thread) => thread.id === activeThreadId) ||
          (String(prev.activeThread?.id || "") === activeThreadId ? prev.activeThread : null) ||
          (!activeThreadId ? sortedThreads[0] : null) ||
          null;
        selectedMessageThreadIdRef.current = String(matchedActive?.id || "");
        setSelectedMessageThreadId(String(matchedActive?.id || ""));
        return {
          ...prev,
          threads: sortedThreads,
          requests: Number(data?.requests || 0),
          activeThread: matchedActive,
          messages: matchedActive?.id === activeThreadId ? prev.messages : [],
          loadingList: false,
        };
      });
    } catch (error) {
      if (!silent) {
        setToast({
          show: true,
          tone: "error",
          message: error?.response?.data?.message || "Could not load Explore messages right now.",
        });
      }
      setMessagesPanel((prev) => ({ ...prev, loadingList: false }));
    }
  };

  const openMessageThreadById = async (threadOrId, { silent = false, setSelected = true } = {}) => {
    const threadId =
      typeof threadOrId === "string"
        ? threadOrId
        : String(threadOrId?.id || "");
    if (!threadId) return;
      if (!setSelected) {
        const selectedThreadId = String(selectedMessageThreadIdRef.current || "");
        if (selectedThreadId && selectedThreadId !== threadId) {
          return;
        }
      }
      if (setSelected) {
        selectedMessageThreadIdRef.current = threadId;
        setSelectedMessageThreadId(threadId);
      }
      try {
        const selectedThread =
          (typeof threadOrId === "object" && threadOrId) ||
          messagesPanelRef.current.threads.find((thread) => thread.id === threadId) ||
          null;
        const isSameActiveThread = String(messagesPanelRef.current.activeThread?.id || "") === threadId;
        const unreadReduction =
          Number(selectedThread?.unread || 0) +
          (selectedThread?.type === "request_received" ? 1 : 0);
        setMessagesPanel((prev) => ({
          ...prev,
          activeThread: selectedThread || prev.threads.find((thread) => thread.id === threadId) || prev.activeThread,
          loadingThread:
            silent
              ? prev.loadingThread && !prev.messages.length && String(prev.activeThread?.id || "") !== threadId
              : true,
          replyTarget: isSameActiveThread ? prev.replyTarget : null,
          attachmentPreview: isSameActiveThread ? prev.attachmentPreview : "",
          attachmentName: isSameActiveThread ? prev.attachmentName : "",
          attachmentMimeType: isSameActiveThread ? prev.attachmentMimeType : "",
          attachmentFileSize: isSameActiveThread ? prev.attachmentFileSize : "",
          attachmentUploading: isSameActiveThread ? prev.attachmentUploading : false,
          selectedMessageIds: [],
          messages: isSameActiveThread ? prev.messages : [],
        }));
      const data = await getCareerPulseMessageThread(threadId);
      setMessagesPanel((prev) => {
        if (String(selectedMessageThreadIdRef.current || "") !== threadId) {
          return prev;
        }

        return {
          ...prev,
          activeThread: data?.thread || prev.activeThread,
          messages: Array.isArray(data?.messages) ? data.messages : [],
          loadingThread: false,
        };
      });
      setMessagesPanel((prev) => ({
        ...prev,
        threads: sortExploreThreadsByRecent(
          prev.threads.map((thread) =>
            thread.id === threadId ? { ...thread, unread: 0, ...(data?.thread || {}) } : thread
          )
        ),
        activeThread:
          String(prev.activeThread?.id || "") === threadId
            ? { ...prev.activeThread, ...(data?.thread || {}) }
            : prev.activeThread,
      }));
      await markCareerPulseMessageThreadRead(threadId);
      setFeed((prev) => ({
        ...prev,
        viewer: prev.viewer
          ? {
              ...prev.viewer,
              messagesUnread: Math.max(0, Number(prev.viewer.messagesUnread || 0) - unreadReduction),
            }
          : prev.viewer,
      }));
      messageUnreadRef.current = Math.max(0, messageUnreadRef.current - unreadReduction);
    } catch (error) {
      if (!silent) {
        setToast({
          show: true,
          tone: "error",
          message: error?.response?.data?.message || "Could not open this Explore conversation.",
        });
      }
      setMessagesPanel((prev) => ({ ...prev, loadingThread: false }));
    }
  };

  useEffect(() => {
    void loadFeed({ reset: true, mediaOnly: false });
    void loadStories({ silent: true });
  }, []);

  useEffect(() => {
    if (homeMode !== "saved") return;
    if (savedFeed.posts.length || savedLoading || savedRefreshing) return;
    void loadSavedFeed({ reset: true, silent: true });
  }, [homeMode, savedFeed.posts.length, savedLoading, savedRefreshing]);

  useEffect(() => {
    if (homeMode !== "notifications") return;
    void loadNotifications({ silent: false, markRead: false });
  }, [homeMode]);

  useEffect(() => {
    if (homeMode !== "messages") return;
    void loadMessageThreads({ silent: false });
  }, [homeMode]);

  useEffect(() => {
    if (homeMode !== "messages") return;
    if (messagesPanel.loadingList || messagesPanel.loadingThread) return;
    if (!messagesPanel.activeThread?.id) {
      if (!messagesPanel.threads.length) return;
      void openMessageThreadById(messagesPanel.threads[0].id, { silent: true, setSelected: true });
      return;
    }
    if (
      messagesPanel.activeThread?.type === "request_sent" ||
      messagesPanel.activeThread?.type === "request_received"
    ) {
      return;
    }
    if (messagesPanel.messages.length) return;
    void openMessageThreadById(messagesPanel.activeThread.id, { silent: true, setSelected: false });
  }, [
    homeMode,
    messagesPanel.activeThread?.id,
    messagesPanel.activeThread?.type,
    messagesPanel.loadingList,
    messagesPanel.loadingThread,
    messagesPanel.messages.length,
    messagesPanel.threads,
  ]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      void loadStories({ silent: true });
      void loadNotifications({ silent: true, markRead: false });
      void loadMessageThreads({ silent: true });
    }, 10000);

    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (homeMode !== "messages") return undefined;
    const activeThreadId = String(messagesPanel.activeThread?.id || "");
    if (!activeThreadId) return undefined;

    const timer = window.setInterval(() => {
      void loadMessageThreads({ silent: true });
      void openMessageThreadById(activeThreadId, { silent: true, setSelected: false });
    }, 3500);

    return () => window.clearInterval(timer);
  }, [homeMode, messagesPanel.activeThread?.id]);

  useEffect(() => {
    if (!hasHandledInitialMode.current) {
      hasHandledInitialMode.current = true;
      return;
    }
    void loadFeed({
      reset: true,
      mediaOnly: viewMode === "reels",
      focusPostId: viewMode === "reels" ? pendingReelStartId : "",
    });
    if (viewMode === "home") setPendingReelStartId("");
  }, [viewMode]);

  useEffect(() => {
    if (viewMode !== "reels" || !pendingReelStartId) return;
    const index = reelPosts.findIndex((post) => post.id === pendingReelStartId);
    if (index < 0) return;
    const target = reelRefs.current[index];
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "center" });
    }
    setActiveIndex(index);
    setPendingReelStartId("");
  }, [viewMode, pendingReelStartId, reelPosts]);

  useEffect(
    () => () => {
      if (composerPreview) URL.revokeObjectURL(composerPreview);
    },
    [composerPreview],
  );

  useEffect(
    () => () => {
      if (storyPreview) URL.revokeObjectURL(storyPreview);
    },
    [storyPreview],
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(STORY_MUSIC_LIBRARY_KEY, JSON.stringify(savedStoryMusicTracks));
    } catch {
      // Ignore local storage write failures.
    }
  }, [savedStoryMusicTracks]);

  useEffect(() => {
    if (!storyMusicPickerOpen) return;
    if (storyMusicTab === "saved" || storyMusicTab === "original-audio") {
      setStoryMusicHasMore(false);
      setStoryMusicOffset(0);
      return;
    }

    const timer = window.setTimeout(() => {
      void loadStoryMusicTracks({ query: storyMusicQuery, section: storyMusicTab, offset: 0, append: false });
    }, 260);

    return () => window.clearTimeout(timer);
  }, [storyMusicPickerOpen, storyMusicTab, storyMusicQuery]);

  useEffect(() => {
    if (selectedStoryMusic?.audioUrl) return;
    if (storyMusicPreviewTimerRef.current) {
      window.clearTimeout(storyMusicPreviewTimerRef.current);
      storyMusicPreviewTimerRef.current = null;
    }
    if (storyMusicPreviewRef.current) {
      storyMusicPreviewRef.current.pause();
    }
    if (storyMusicPreviewing) setStoryMusicPreviewing(false);
  }, [selectedStoryMusic?.audioUrl, storyMusicPreviewing]);

  useEffect(
    () => () => {
      if (storyMusicPreviewTimerRef.current) {
        window.clearTimeout(storyMusicPreviewTimerRef.current);
      }
      if (storyMusicPreviewRef.current) {
        storyMusicPreviewRef.current.pause();
      }
    },
    [],
  );

  useEffect(() => {
    reelRefs.current = reelRefs.current.slice(0, reelPosts.length);
  }, [reelPosts.length]);

  useEffect(() => {
    if (!reelPosts.length) {
      if (activeIndex !== 0) setActiveIndex(0);
      return;
    }
    if (activeIndex > reelPosts.length - 1) setActiveIndex(reelPosts.length - 1);
  }, [activeIndex, reelPosts.length]);

  useEffect(() => {
    if (viewMode !== "reels") return undefined;
    const root = reelViewportRef.current;
    const items = reelRefs.current.filter(Boolean);
    if (!root || !items.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);

        if (!visible.length) return;
        const nextIndex = Number(visible[0].target.getAttribute("data-index"));
        if (!Number.isNaN(nextIndex)) setActiveIndex(nextIndex);
      },
      { root, threshold: [0.35, 0.5, 0.7, 0.9] },
    );

    items.forEach((item) => observer.observe(item));
    return () => observer.disconnect();
  }, [reelPosts.length, viewMode]);

  useEffect(() => {
    if (viewMode !== "reels") return;
    if (loading || refreshing || loadingMore || !feed.hasMore || !reelPosts.length || activeIndex < reelPosts.length - 2) return;
    if (reelSource === "saved-first" && savedFeed.hasMore && activeIndex < savedReelPosts.length) return;
    void loadFeed({ offset: Number(feed.nextOffset || feed.posts.length), reset: false, mediaOnly: true });
  }, [activeIndex, feed.hasMore, feed.nextOffset, feed.posts.length, reelPosts.length, loading, refreshing, loadingMore, viewMode, reelSource, savedFeed.hasMore, savedReelPosts.length]);

  useEffect(() => {
    if (viewMode !== "reels" || reelSource !== "saved-first") return;
    if (!savedFeed.hasMore || savedLoading || savedRefreshing || savedLoadingMore || !savedReelPosts.length) return;
    if (activeIndex < Math.max(0, savedReelPosts.length - 2)) return;
    void loadSavedFeed({
      offset: Number(savedFeed.nextOffset || savedFeed.posts.length),
      reset: false,
      silent: true,
    });
  }, [
    viewMode,
    reelSource,
    activeIndex,
    savedFeed.hasMore,
    savedFeed.nextOffset,
    savedFeed.posts.length,
    savedLoading,
    savedRefreshing,
    savedLoadingMore,
    savedReelPosts.length,
  ]);

  useEffect(() => {
    if (viewMode !== "reels") return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [viewMode]);

  useEffect(() => {
    if (viewMode !== "reels") return undefined;

    const handleKeyDown = (event) => {
      if (commentsPanel.open || composerOpen || storyComposerOpen || storyViewer.open) return;

      if (event.key === "ArrowDown" || event.key === "PageDown") {
        event.preventDefault();
        moveReelBy(1);
        return;
      }

      if (event.key === "ArrowUp" || event.key === "PageUp") {
        event.preventDefault();
        moveReelBy(-1);
        return;
      }

      if (event.key === "Escape") {
        event.preventDefault();
        setViewMode("home");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [viewMode, commentsPanel.open, composerOpen, storyComposerOpen, storyViewer.open, moveReelBy]);

  useEffect(() => {
    if (viewMode !== "reels") return undefined;

    const handleWheel = (event) => {
      if (commentsPanel.open || composerOpen || storyComposerOpen || storyViewer.open) return;
      if (Math.abs(event.deltaY) < 20) return;
      event.preventDefault();
      moveReelBy(event.deltaY > 0 ? 1 : -1);
    };

    window.addEventListener("wheel", handleWheel, { passive: false });
    return () => window.removeEventListener("wheel", handleWheel);
  }, [viewMode, commentsPanel.open, composerOpen, storyComposerOpen, storyViewer.open, moveReelBy]);

  useEffect(() => {
    if (!storyViewer.open) return;
    if (!storyGroups.length) {
      setStoryViewer(defaultStoryViewer());
      return;
    }

    const nextGroupIndex = Math.min(storyViewer.groupIndex, storyGroups.length - 1);
    const nextStoryCount = Number(storyGroups[nextGroupIndex]?.items?.length || 0);
    const nextStoryIndex = Math.min(storyViewer.storyIndex, Math.max(0, nextStoryCount - 1));

    if (nextGroupIndex !== storyViewer.groupIndex || nextStoryIndex !== storyViewer.storyIndex) {
      setStoryViewer((prev) => ({ ...prev, groupIndex: nextGroupIndex, storyIndex: nextStoryIndex }));
    }
  }, [storyViewer.open, storyViewer.groupIndex, storyViewer.storyIndex, storyGroups]);

  useEffect(() => {
    if (!storyViewer.open || !activeStory?.id) return;
    if (activeStory.viewerState?.seen || viewedStoriesRef.current.has(activeStory.id)) return;

    viewedStoriesRef.current.add(activeStory.id);
    setStories((prev) => ({
      ...prev,
      groups: markStorySeenGroups(prev.groups, activeStory.id),
    }));

    void markCareerPulseStoryViewed(activeStory.id).catch(() => {
      viewedStoriesRef.current.delete(activeStory.id);
    });
  }, [storyViewer.open, activeStory?.id, activeStory?.viewerState?.seen]);

  useEffect(() => {
    Object.entries(videoRefs.current).forEach(([postId, node]) => {
      if (!node) return;
      node.muted = reelAudioMuted;
      node.volume = node.muted ? 0 : 1;
      if (commentsPanel.open || composerOpen || activePost?.id !== postId) {
        node.pause();
        return;
      }
      const promise = node.play();
      if (promise?.catch) promise.catch(() => {});
    });
  }, [activePost?.id, commentsPanel.open, composerOpen, reelAudioMuted]);

  const refreshFeed = async () => {
    const tasks = [
      loadFeed({
        offset: 0,
        reset: true,
        mediaOnly: viewMode === "reels",
        focusPostId: viewMode === "reels" ? activePost?.id || pendingReelStartId : "",
      }),
      loadStories({ silent: true }),
    ];

    if (homeMode === "notifications") {
      tasks.push(loadNotifications({ silent: true, markRead: false }));
    }
    if (homeMode === "messages") {
      tasks.push(loadMessageThreads({ silent: true }));
    }

    if (homeMode === "saved" || reelSource === "saved-first") {
      tasks.push(loadSavedFeed({ offset: 0, reset: true, silent: true }));
    }

    await Promise.all(tasks);
  };

  const openStoryGroup = (group) => {
    const nextGroupIndex = storyGroups.findIndex((item) => item.id === group?.id);
    if (nextGroupIndex < 0) {
      if (group?.author?.isSelf) openStoryComposer();
      return;
    }
    setStoryViewer({ open: true, groupIndex: nextGroupIndex, storyIndex: 0 });
  };

  const closeStoryViewer = () => {
    setStoryViewer(defaultStoryViewer());
    setStoryReply(defaultStoryReplyState());
    setStoryInsights(defaultStoryInsightsState());
  };

  const navigateStoryViewer = (groupIndex, storyIndex) => {
    setStoryViewer({ open: true, groupIndex, storyIndex });
  };

  const handleStoryMessage = async (author) => {
    const targetId = String(author?.id || "");
    const text = String(storyReply.draft || "").trim();
    if (!targetId || !text) return;

    try {
      setStoryReply((prev) => ({ ...prev, sending: true }));
      const result = await openCareerPulseMessageThread({ recipientId: targetId, text });
      setStoryReply(defaultStoryReplyState());
      void loadMessageThreads({ silent: true });
      setToast({
        show: true,
        tone: "success",
        message:
          result?.thread?.type === "request_sent"
            ? "Message request sent from story."
            : "Message sent from story.",
      });
    } catch (error) {
      setToast({
        show: true,
        tone: "error",
        message: error?.response?.data?.message || "Could not send the story message.",
      });
      setStoryReply((prev) => ({ ...prev, sending: false }));
    }
  };

  const handleStoryLike = async (story) => {
    const storyId = String(story?.id || "");
    const storyGroup = findStoryGroupByStoryId(storyGroups, storyId);
    if (!storyId || isOwnStory(story, storyGroup)) return;

    try {
      setBusyFlag(`story-like-${storyId}`, true);
      const result = await toggleCareerPulseStoryLike(storyId);
      setStories((prev) => ({
        ...prev,
        groups: patchStoryGroups(prev.groups, storyId, (item) => ({
          ...item,
          metrics: { ...item.metrics, likes: Number(result?.likes || 0) },
          viewerState: { ...item.viewerState, liked: Boolean(result?.liked) },
        })),
      }));
    } catch (error) {
      setToast({
        show: true,
        tone: "error",
        message: error?.response?.data?.message || "Could not update story like right now.",
      });
    } finally {
      setBusyFlag(`story-like-${storyId}`, false);
    }
  };

  const handleStoryShare = async (story) => {
    const storyId = String(story?.id || "");
    if (!storyId) return;
    setShareSheet({ open: true, kind: "story", story, post: null });
  };

  const closeShareSheet = () => setShareSheet(defaultShareSheet());

  const handleShareOption = async (channel) => {
    const story = shareSheet.story;
    const post = shareSheet.post;
    const shareUrl = story?.id
      ? `${window.location.origin}${location.pathname}#story-${story.id}`
      : post?.id
        ? `${window.location.origin}${location.pathname}#post-${post.id}`
        : "";
    if (!shareUrl) return;

    const shareText = story
      ? `${story?.author?.name || "Explore user"} shared a story on Explore`
      : `${post?.author?.name || "Explore user"} shared a post on Explore`;
    const encodedUrl = encodeURIComponent(shareUrl);
    const encodedText = encodeURIComponent(shareText);

    if (channel === "copy") {
      try {
        await navigator.clipboard.writeText(shareUrl);
        setToast({ show: true, tone: "success", message: "Story link copied." });
      } catch {
        setToast({ show: true, tone: "error", message: "Unable to copy the story link right now." });
      }
      return;
    }

    if (channel === "post") {
      closeShareSheet();
      setComposer((prev) => ({
        ...prev,
        type: "text",
        content: `${shareText}\n${shareUrl}`,
      }));
      setComposerOpen(true);
      return;
    }

    const targets = {
      whatsapp: `https://wa.me/?text=${encodedText}%20${encodedUrl}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      x: `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`,
      email: `mailto:?subject=${encodeURIComponent("Explore story")}&body=${encodedText}%0A%0A${encodedUrl}`,
      embed: shareUrl,
      more: shareUrl,
    };

    if ((channel === "more" || channel === "embed") && navigator.share) {
      try {
        await navigator.share({ title: "Explore story", text: shareText, url: shareUrl });
        return;
      } catch {
        // Fall back to copy below.
      }
    }

    if (channel === "embed") {
      try {
        await navigator.clipboard.writeText(`<a href="${shareUrl}">View Explore story</a>`);
        setToast({ show: true, tone: "success", message: "Embed code copied." });
      } catch {
        setToast({ show: true, tone: "error", message: "Unable to copy embed code right now." });
      }
      return;
    }

    if (targets[channel]) {
      window.open(targets[channel], "_blank", "noopener,noreferrer");
    }
  };

  const handleStoryReport = async (story) => {
    const storyId = String(story?.id || "");
    if (!storyId) return;

    if (isOwnStory(story, findStoryGroupByStoryId(storyGroups, storyId))) {
      void Swal.fire({
        icon: "info",
        title: "You can't report this story",
        text: "Your own story cannot be reported from this account.",
        confirmButtonColor: "#111111",
      });
      return;
    }

    const { isConfirmed } = await Swal.fire({
      icon: "warning",
      title: "Report this story?",
      text: "This story will be hidden from your Explore stories right away.",
      showCancelButton: true,
      confirmButtonText: "Report story",
      confirmButtonColor: "#111111",
      cancelButtonColor: "#cbd5e1",
    });

    if (!isConfirmed) return;

    try {
      setBusyFlag(`story-report-${storyId}`, true);
      const result = await reportCareerPulseStory(storyId, { reason: "Spam or Misleading" });
      setHiddenStoryIds((prev) => ({ ...prev, [storyId]: true }));
      closeStoryViewer();
      void loadStories({ silent: true });
      setToast({
        show: true,
        tone: "success",
        message: result?.message || "Story reported and hidden from your view.",
      });
    } catch (error) {
      setToast({
        show: true,
        tone: "error",
        message: error?.response?.data?.message || "Could not report this story right now.",
      });
    } finally {
      setBusyFlag(`story-report-${storyId}`, false);
    }
  };

  const handleStoryMuteAuthor = async (author, story) => {
    const authorId = String(author?.id || "");
    if (!authorId) return;

    try {
      setBusyFlag(`story-mute-${authorId}`, true);
      const result = await toggleCareerPulseStoryAuthorMute(authorId);
      const nextMuted = Boolean(result?.muted);
      setMutedStoryAuthors((prev) => ({ ...prev, [authorId]: nextMuted }));
      if (nextMuted && story?.id) {
        setHiddenStoryIds((prev) => ({ ...prev, [String(story.id)]: true }));
        closeStoryViewer();
      }
      setToast({
        show: true,
        tone: "success",
        message: nextMuted ? "Story updates from this author are muted." : "Story updates from this author are visible again.",
      });
      void loadStories({ silent: true });
    } catch (error) {
      setToast({
        show: true,
        tone: "error",
        message: error?.response?.data?.message || "Could not update story author mute right now.",
      });
    } finally {
      setBusyFlag(`story-mute-${authorId}`, false);
    }
  };

  const handleStoryHide = (story, author) => {
    const storyId = String(story?.id || "");
    if (!storyId) return;
    setHiddenStoryIds((prev) => ({ ...prev, [storyId]: true }));
    closeStoryViewer();
    setToast({
      show: true,
      tone: "success",
      message: `Story from ${author?.name || "this user"} hidden from your Explore stories.`,
    });
  };

  const handleStorySendAccount = async (author, story) => {
    const targetId = String(author?.id || "");
    if (!targetId) return;

    const accountText = [
      `Explore account: ${author?.name || "Explore member"}`,
      author?.headline ? `About: ${author.headline}` : "",
      story?.caption ? `Story: ${story.caption}` : "",
    ]
      .filter(Boolean)
      .join("\n");

    try {
      const result = await openCareerPulseMessageThread({ recipientId: targetId, text: accountText });
      void loadMessageThreads({ silent: true });
      setToast({
        show: true,
        tone: "success",
        message: result?.thread?.type === "request_sent" ? "Account sent as a message request." : "Account sent in Explore messages.",
      });
    } catch (error) {
      setToast({
        show: true,
        tone: "error",
        message: error?.response?.data?.message || "Could not send this account right now.",
      });
    }
  };

  const openStoryInsights = async (story, options = {}) => {
    const { silent = false } = options;
    const storyId = String(story?.id || "");
    if (!storyId) return;
    setStoryInsights((prev) => ({
      ...prev,
      open: true,
      loading: silent ? prev.loading && prev.storyId !== storyId : true,
      storyId,
      metrics: {
        views: Number(story?.metrics?.views || 0),
        likes: Number(story?.metrics?.likes || 0),
      },
    }));
    try {
      const data = await getCareerPulseStoryInsights(storyId);
      setStoryInsights((prev) => ({
        ...prev,
        open: true,
        loading: false,
        storyId,
        metrics: {
          views: Number(data?.metrics?.views || 0),
          likes: Number(data?.metrics?.likes || 0),
        },
        viewers: Array.isArray(data?.viewers) ? data.viewers : [],
        likes: Array.isArray(data?.likes) ? data.likes : [],
      }));
    } catch (error) {
      setStoryInsights((prev) => ({ ...prev, loading: false }));
      if (!silent) {
        setToast({
          show: true,
          tone: "error",
          message: error?.response?.data?.message || "Could not load story viewers right now.",
        });
      }
    }
  };

  const closeStoryInsights = () => {
    setStoryInsights((prev) => ({ ...prev, open: false }));
  };

  const handleMarkExploreNotificationRead = async (notificationIds = "") => {
    const targetIds = Array.isArray(notificationIds)
      ? notificationIds.map((item) => String(item || "")).filter(Boolean)
      : [String(notificationIds || "")].filter(Boolean);
    const markAll = targetIds.length === 0;
    try {
      let result = null;
      if (markAll) {
        result = await markCareerPulseNotificationsRead();
      } else {
        const results = [];
        for (const targetId of targetIds) {
          results.push(await markCareerPulseNotificationsRead(targetId));
        }
        result = results[results.length - 1] || null;
      }
      setNotifications((prev) => ({
        ...prev,
        unreadCount: Number(result?.unreadCount || 0),
        items: prev.items.map((item) =>
          markAll || targetIds.includes(String(item.id || ""))
            ? { ...item, readAt: item.readAt || new Date().toISOString() }
            : item
        ),
      }));
      setFeed((prev) => ({
        ...prev,
        viewer: prev.viewer
          ? { ...prev.viewer, notificationsUnread: Number(result?.unreadCount || 0) }
          : prev.viewer,
      }));
      notificationUnreadRef.current = Number(result?.unreadCount || 0);
    } catch (error) {
      setToast({
        show: true,
        tone: "error",
        message: error?.response?.data?.message || "Could not update this Explore notification.",
      });
    }
  };

  const handleOpenExploreNotification = async (notification) => {
    if (!notification?.id) return;
    const groupedNotificationIds = Array.isArray(notification.items)
      ? notification.items.map((item) => String(item?.id || "")).filter(Boolean)
      : [String(notification.id || "")].filter(Boolean);
    if (!notification.readAt) {
      void handleMarkExploreNotificationRead(groupedNotificationIds);
    }

    const relatedThreadId = String(notification.relatedThreadId || "");
    const relatedStoryId = String(notification.relatedStoryId || "");
    const relatedPostId = String(notification.relatedPostId || "");

    if (relatedThreadId) {
      setHomeMode("messages");
      setViewMode("home");
      await loadMessageThreads({ silent: true });
      await openMessageThreadById(relatedThreadId, { silent: true, setSelected: true });
      return;
    }

    if (relatedStoryId) {
      const match = storyGroups.reduce((found, group, groupIndex) => {
        if (found) return found;
        const nextStoryIndex = (group.items || []).findIndex((item) => String(item.id || "") === relatedStoryId);
        return nextStoryIndex >= 0 ? { groupIndex, storyIndex: nextStoryIndex } : null;
      }, null);

      if (match) {
        setStoryViewer({ open: true, groupIndex: match.groupIndex, storyIndex: match.storyIndex });
        return;
      }

      const data = await loadStories({ silent: true });
      const groups = Array.isArray(data?.groups) ? data.groups : [];
      const refreshedMatch = groups.reduce((found, group, groupIndex) => {
        if (found) return found;
        const nextStoryIndex = (group.items || []).findIndex((item) => String(item.id || "") === relatedStoryId);
        return nextStoryIndex >= 0 ? { groupIndex, storyIndex: nextStoryIndex } : null;
      }, null);
      if (refreshedMatch) {
        setStoryViewer({ open: true, groupIndex: refreshedMatch.groupIndex, storyIndex: refreshedMatch.storyIndex });
        return;
      }
    }

    if (relatedPostId) {
      enterReels(relatedPostId);
    }
  };

  const handleStoryDelete = async (story) => {
    const storyId = String(story?.id || "");
    if (!storyId) return;

    const { isConfirmed } = await Swal.fire({
      icon: "warning",
      title: "Delete this story?",
      text: "This story will be removed immediately.",
      showCancelButton: true,
      confirmButtonText: "Delete story",
      confirmButtonColor: "#111111",
      cancelButtonColor: "#cbd5e1",
    });

    if (!isConfirmed) return;

    try {
      setBusyFlag(`story-delete-${storyId}`, true);
      const result = await deleteCareerPulseStory(storyId);
      setStories((prev) => ({
        ...prev,
        groups: removeStoryFromGroups(prev.groups, storyId),
      }));
      closeStoryViewer();
      setToast({
        show: true,
        tone: "success",
        message: result?.message || "Story deleted.",
      });
    } catch (error) {
      setToast({
        show: true,
        tone: "error",
        message: error?.response?.data?.message || "Could not delete this story right now.",
      });
    } finally {
      setBusyFlag(`story-delete-${storyId}`, false);
    }
  };

  const enterReels = (postId = "", { source = "" } = {}) => {
    const nextSource = source || (homeMode === "saved" ? "saved-first" : "all");
    setReelSource(nextSource);
    setPendingReelStartId(postId);

    if (nextSource === "saved-first" && !savedFeed.posts.length) {
      void loadSavedFeed({ reset: true, silent: true });
    }

    if (viewMode === "reels") {
      const candidateReels = uniqPosts(
        nextSource === "saved-first" ? [...savedReelPosts, ...regularReelPosts] : regularReelPosts,
      );
      const nextIndex = postId ? candidateReels.findIndex((post) => post.id === postId) : 0;
      if (nextIndex >= 0) {
        scrollToPost(nextIndex);
        return;
      }
      void loadFeed({ offset: 0, reset: true, mediaOnly: true, focusPostId: postId });
      return;
    }
    setViewMode("reels");
  };

  const loadMorePosts = async () => {
    if (homeMode === "saved") {
      if (!savedFeed.hasMore || savedLoadingMore) return;
      await loadSavedFeed({ offset: Number(savedFeed.nextOffset || savedFeed.posts.length), reset: false });
      return;
    }
    if (!feed.hasMore || loadingMore) return;
    await loadFeed({ offset: Number(feed.nextOffset || feed.posts.length), reset: false, mediaOnly: viewMode === "reels" });
  };

  const handleRailAction = (key) => {
    if (key === "home" || key === "explore") {
      setHomeMode("home");
      setViewMode("home");
      return;
    }
    if (key === "saved") {
      setHomeMode("saved");
      setViewMode("home");
      if (!savedFeed.posts.length && !savedLoading) {
        void loadSavedFeed({ reset: true, silent: true });
      }
      return;
    }
    if (key === "reels") {
      enterReels("", { source: homeMode === "saved" ? "saved-first" : "all" });
      return;
    }
    if (key === "messages") {
      setHomeMode("messages");
      setViewMode("home");
      return;
    }
    if (key === "notifications") {
      setHomeMode("notifications");
      setViewMode("home");
      return;
    }
    if (key === "create") {
      openComposer(viewMode === "reels" ? "reel" : "image");
      return;
    }
    if (key === "profile") {
      navigate(`${basePath}/profile`);
      return;
    }
    if (key === "search") {
      setHomeMode("home");
      setViewMode("home");
      window.setTimeout(() => searchInputRef.current?.focus(), 0);
    }
  };

  const publishPost = async () => {
    const content = String(composer.content || "").trim();
    const headline = String(composer.headline || "").trim();
    const textModeration = scanUnsafeText([headline, content]);
    if (!content && !composer.file) {
      setToast({ show: true, tone: "error", message: "Add a caption or upload media before publishing." });
      return;
    }
    if (textModeration.blocked) {
      void Swal.fire({
        icon: "warning",
        title: "Unsafe text detected",
        text: "This post contains abusive, sexual, illegal, or unsafe language. Please edit it and try again.",
        confirmButtonColor: "#111111",
      });
      return;
    }

    try {
      setBusyFlag("publish", true);
      let uploadPayload = null;
      let mediaModeration = composer.mediaModeration;
      if (composer.file && !mediaModeration && String(composer.file.type || "").match(/^(image|video)\//)) {
        mediaModeration = await analyzeMediaFileSafety(composer.file);
        if (mediaModeration?.blocked) {
          setToast({
            show: true,
            tone: "warning",
            message: mediaModeration?.reasons?.[0] || "This media may contain unsafe visual content and cannot be uploaded.",
          });
          return;
        }
      }
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
        mediaModeration,
      });

      setFeed((prev) => ({
        ...prev,
        viewer: prev.viewer ? { ...prev.viewer, posts: Number(prev.viewer.posts || 0) + 1 } : prev.viewer,
        posts:
          created?.post && (viewMode !== "reels" || isReelEligible(created.post))
            ? uniqPosts([created.post, ...prev.posts])
            : prev.posts,
      }));

      closeComposer();
      scrollToPost(0);
      setToast({ show: true, tone: "success", message: created?.message || "Published to Explore." });
    } catch (error) {
      setToast({ show: true, tone: "error", message: error?.response?.data?.message || "Failed to publish your post." });
    } finally {
      setBusyFlag("publish", false);
    }
  };

  const publishStory = async () => {
    const storyTextModeration = scanUnsafeText([storyComposer.caption]);
    if (!storyComposer.file) {
      setToast({ show: true, tone: "error", message: "Choose an image or video before sharing your story." });
      return;
    }
    if (storyTextModeration.blocked) {
      void Swal.fire({
        icon: "warning",
        title: "Unsafe text detected",
        text: "This story caption contains abusive, sexual, illegal, or unsafe language. Please edit it and try again.",
        confirmButtonColor: "#111111",
      });
      return;
    }
    const isImageStory = String(storyComposer.file?.type || "").startsWith("image/");

    let expiresAtPayload = "";
    if (storyComposer.expiryMode === "custom") {
      const customValue = String(storyComposer.customExpiresAt || "").trim();
      if (!customValue) {
        setToast({ show: true, tone: "error", message: "Choose a custom expiry date and time for this story." });
        return;
      }
      const parsedDate = new Date(customValue);
      if (!Number.isFinite(parsedDate.getTime())) {
        setToast({ show: true, tone: "error", message: "The custom expiry date is invalid." });
        return;
      }
      if (parsedDate.getTime() <= Date.now() + 60 * 1000) {
        setToast({ show: true, tone: "error", message: "Custom expiry must be at least 1 minute in the future." });
        return;
      }
      expiresAtPayload = parsedDate.toISOString();
    }

    try {
      setBusyFlag("story-publish", true);
      let mediaModeration = storyComposer.mediaModeration;
      if (storyComposer.file && !mediaModeration && String(storyComposer.file.type || "").match(/^(image|video)\//)) {
        mediaModeration = await analyzeMediaFileSafety(storyComposer.file);
        if (mediaModeration?.blocked) {
          setToast({
            show: true,
            tone: "warning",
            message: mediaModeration?.reasons?.[0] || "This story media may contain unsafe visual content and cannot be uploaded.",
          });
          return;
        }
      }
      const uploadRes = await uploadSocialMedia(storyComposer.file);
      const uploadPayload = uploadRes?.data || null;
      const payload = {
        caption: String(storyComposer.caption || "").trim(),
        mediaUrl: uploadPayload?.mediaUrl || "",
        mediaPublicId: uploadPayload?.publicId || "",
        mediaResourceType: uploadPayload?.resourceType || "",
        mimeType: uploadPayload?.mimeType || storyComposer.file?.type || "",
        mediaModeration,
        expiresAt: expiresAtPayload,
      };

      if (isImageStory && selectedStoryMusic?.audioUrl) {
        payload.music = {
          trackId: selectedStoryMusic.trackId,
          title: selectedStoryMusic.title,
          artist: selectedStoryMusic.artist,
          album: selectedStoryMusic.album,
          coverUrl: selectedStoryMusic.coverUrl,
          audioUrl: selectedStoryMusic.audioUrl,
          durationSeconds: selectedStoryMusicDuration,
          startSeconds: storyMusicCurrentStart,
          clipDurationSeconds: storyMusicCurrentClip,
          provider: selectedStoryMusic.provider || "jamendo",
        };
      }

      await createCareerPulseStory(payload);

      closeStoryComposer();
      const data = await loadStories({ silent: true });
      const ownGroup = (data?.groups || []).find((group) => group.author?.isSelf);
      if (ownGroup) {
        const nextGroupIndex = (data?.groups || []).findIndex((group) => group.id === ownGroup.id);
        setStoryViewer({ open: true, groupIndex: Math.max(0, nextGroupIndex), storyIndex: 0 });
      }
      setToast({
        show: true,
        tone: "success",
        message:
          storyComposer.expiryMode === "custom"
            ? "Story shared with your custom expiry."
            : "Story shared for the next 24 hours.",
      });
    } catch (error) {
      setToast({ show: true, tone: "error", message: error?.response?.data?.message || "Failed to publish your story." });
    } finally {
      setBusyFlag("story-publish", false);
    }
  };

  const applyFollowState = (targetId, following, followers) => {
    const targetKey = String(targetId || "");
    const nextFollowingCountDelta = following ? 1 : -1;

    setFeed((prev) => ({
      ...prev,
      viewer: prev.viewer
        ? {
            ...prev.viewer,
            following: Math.max(0, Number(prev.viewer.following || 0) + nextFollowingCountDelta),
          }
        : prev.viewer,
      posts: prev.posts.map((post) =>
        String(post.author?.id || "") === targetKey
          ? {
              ...post,
              author: {
                ...post.author,
                isFollowed: following,
                isFollowing: following,
                followers,
              },
            }
          : post
      ),
      suggestions: prev.suggestions.map((item) =>
        String(item.id || "") === targetKey
          ? { ...item, isFollowing: following, isFollowed: following, followers }
          : item
      ),
    }));
    setSavedFeed((prev) => ({
      ...prev,
      posts: prev.posts.map((post) =>
        String(post.author?.id || "") === targetKey
          ? {
              ...post,
              author: {
                ...post.author,
                isFollowed: following,
                isFollowing: following,
                followers,
              },
            }
          : post
      ),
    }));
    setStories((prev) => ({
      ...prev,
      groups: (prev.groups || []).map((group) =>
        String(group.author?.id || "") === targetKey
          ? {
              ...group,
              author: {
                ...group.author,
                isFollowed: following,
                isFollowing: following,
                followers,
              },
            }
          : group
      ),
    }));
    setMessagesPanel((prev) => ({
      ...prev,
      threads: (prev.threads || []).map((thread) =>
        String(thread.participant?.id || "") === targetKey
          ? {
              ...thread,
              participant: {
                ...thread.participant,
                isFollowed: following,
                isFollowing: following,
                followers,
              },
            }
          : thread
      ),
      activeThread:
        String(prev.activeThread?.participant?.id || "") === targetKey
          ? {
              ...prev.activeThread,
              participant: {
                ...prev.activeThread.participant,
                isFollowed: following,
                isFollowing: following,
                followers,
              },
            }
          : prev.activeThread,
    }));
  };

  const handleFollow = async (targetId) => {
    try {
      setBusyFlag(`follow-${targetId}`, true);
      const result = await toggleCareerPulseFollow(targetId);
      applyFollowState(targetId, Boolean(result?.following), Number(result?.followers || 0));
      void loadStories({ silent: true });
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
      patchPostAcrossCollections(postId, (post) => ({
        ...post,
        viewerState: { ...post.viewerState, liked: Boolean(result?.liked) },
        metrics: { ...post.metrics, likes: Number(result?.likes || 0) },
      }));
    } catch (error) {
      setToast({ show: true, tone: "error", message: error?.response?.data?.message || "Could not update the like right now." });
    } finally {
      setBusyFlag(`like-${postId}`, false);
    }
  };

  const handleSave = async (postId) => {
    try {
      setBusyFlag(`save-${postId}`, true);
      const result = await toggleCareerPulseSave(postId);
      const saved = Boolean(result?.saved);
      const saves = Number(result?.saves || 0);
      const sourcePost =
        feed.posts.find((post) => post.id === postId) ||
        savedFeed.posts.find((post) => post.id === postId) ||
        null;

      setFeed((prev) => ({
        ...prev,
        posts: updatePost(prev.posts, postId, (post) => ({
          ...post,
          viewerState: { ...post.viewerState, saved },
          metrics: { ...post.metrics, saves },
        })),
      }));
      setSavedFeed((prev) => {
        const patched = updatePost(prev.posts, postId, (post) => ({
          ...post,
          viewerState: { ...post.viewerState, saved },
          metrics: { ...post.metrics, saves },
        }));

        if (!saved) {
          return {
            ...prev,
            posts: patched.filter((post) => post.id !== postId),
          };
        }

        if (patched.some((post) => post.id === postId)) {
          return { ...prev, posts: patched };
        }

        if (sourcePost) {
          return {
            ...prev,
            posts: uniqPosts([
              {
                ...sourcePost,
                viewerState: { ...sourcePost.viewerState, saved: true },
                metrics: { ...sourcePost.metrics, saves },
              },
              ...patched,
            ]),
          };
        }

        return { ...prev, posts: patched };
      });

      setToast({ show: true, tone: "success", message: saved ? "Saved to your collection." : "Removed from your saved items." });
    } catch (error) {
      setToast({ show: true, tone: "error", message: error?.response?.data?.message || "Could not update saved items." });
    } finally {
      setBusyFlag(`save-${postId}`, false);
    }
  };

  const loadComments = async (postId, { offset = 0, reset = false } = {}) => {
    try {
      setCommentsPanel((prev) => (prev.postId !== postId ? prev : { ...prev, loading: reset, loadingMore: !reset }));
      const data = await getCareerPulseComments(postId, { limit: 40, offset });
      setCommentsPanel((prev) => {
        if (prev.postId !== postId) return prev;
        const nextComments = reset ? (Array.isArray(data?.comments) ? data.comments : []) : uniqComments([...(data?.comments || []), ...(prev.comments || [])]);
        return {
          ...prev,
          comments: nextComments,
          total: Number(data?.total || 0),
          hasMore: Boolean(data?.hasMore),
          nextOffset: data?.nextOffset ?? null,
          loading: false,
          loadingMore: false,
        };
      });
    } catch (error) {
      setCommentsPanel((prev) => (prev.postId !== postId ? prev : { ...prev, loading: false, loadingMore: false }));
      setToast({ show: true, tone: "error", message: error?.response?.data?.message || "Could not load comments right now." });
    }
  };

  const openComments = (post) => {
    const preview = Array.isArray(post?.comments) ? post.comments : [];
    const total = Number(post?.metrics?.comments || preview.length || 0);
    setCommentsPanel({
      open: true,
      postId: post.id,
      snapshot: post,
      comments: preview,
      total,
      loading: preview.length === 0,
      loadingMore: false,
      hasMore: total > preview.length,
      nextOffset: null,
    });
    void loadComments(post.id, { offset: 0, reset: true });
  };

  const closeComments = () => setCommentsPanel(defaultCommentsPanel());

  const handleComment = async (postId) => {
    const text = String(commentDrafts[postId] || "").trim();
    if (!text) return;
    try {
      setBusyFlag(`comment-${postId}`, true);
      const result = await addCareerPulseComment(postId, { text });
      patchPostAcrossCollections(postId, (post) => ({
        ...post,
        comments: result?.comment ? uniqComments([...(post.comments || []), result.comment]).slice(-4) : post.comments || [],
        metrics: { ...post.metrics, comments: Number(result?.comments || Number(post.metrics?.comments || 0) + 1) },
      }));
      setCommentDrafts((prev) => ({ ...prev, [postId]: "" }));
      setCommentsPanel((prev) =>
        prev.postId !== postId || !result?.comment
          ? prev
          : {
              ...prev,
              comments: uniqComments([...(prev.comments || []), result.comment]),
              total: Number(result?.comments || prev.total || 0) || prev.comments.length + 1,
              nextOffset: prev.nextOffset === null ? null : prev.nextOffset + 1,
            },
      );
    } catch (error) {
      setToast({ show: true, tone: "error", message: error?.response?.data?.message || "Failed to add the comment." });
    } finally {
      setBusyFlag(`comment-${postId}`, false);
    }
  };

  const openReportDialog = (post) => {
    if (!post?.id) return;
    if (!post?.viewerState?.canReport) {
      void Swal.fire({
        icon: "info",
        title: "You can't report this reel",
        text: "Your own content cannot be reported from this account.",
        confirmButtonColor: "#111111",
      });
      return;
    }
    setReportDialog({
      open: true,
      postId: post.id,
      reason: "Abusive Language",
      details: "",
    });
  };

  const closeReportDialog = () => setReportDialog(defaultReportDialog());

  const handleSubmitReport = async () => {
    if (!reportDialog.postId) return;
    try {
      setBusyFlag(`report-${reportDialog.postId}`, true);
      const result = await reportCareerPulsePost(reportDialog.postId, {
        reason: reportDialog.reason,
        details: reportDialog.details,
      });

      removePostAcrossCollections(reportDialog.postId);

      closeReportDialog();
      void Swal.fire({
        icon: "success",
        title: result?.autoDeleted ? "Reel deleted" : "Report submitted",
        text: result?.message || "Your report was submitted.",
        confirmButtonColor: "#111111",
      });
    } catch (error) {
      void Swal.fire({
        icon: "error",
        title: "Report failed",
        text: error?.response?.data?.message || "Could not submit your report right now.",
        confirmButtonColor: "#111111",
      });
    } finally {
      setBusyFlag(`report-${reportDialog.postId}`, false);
    }
  };

  const handleShare = async (postId) => {
    try {
      setBusyFlag(`share-${postId}`, true);
      const result = await shareCareerPulsePost(postId);
      const sourcePost =
        feed.posts.find((post) => post.id === postId) ||
        savedFeed.posts.find((post) => post.id === postId) ||
        null;
      patchPostAcrossCollections(postId, (post) => ({
        ...post,
        metrics: { ...post.metrics, shares: Number(result?.shares || 0) },
      }));
      if (sourcePost) {
        setShareSheet({ open: true, kind: "post", story: null, post: sourcePost });
      } else {
        setToast({ show: true, tone: "success", message: "Share options are ready." });
      }
    } catch (error) {
      setToast({ show: true, tone: "error", message: error?.response?.data?.message || "Unable to share this post right now." });
    } finally {
      setBusyFlag(`share-${postId}`, false);
    }
  };

  const handleMessage = async (targetId) => {
    try {
      setBusyFlag(`message-${targetId}`, true);
      const result = await openCareerPulseMessageThread({ recipientId: targetId });
      setHomeMode("messages");
      setViewMode("home");
      setMessagesPanel((prev) => ({
        ...prev,
        activeThread: result?.thread || prev.activeThread,
        draft: "",
      }));
      setSelectedMessageThreadId(String(result?.thread?.id || ""));
      await loadMessageThreads({ silent: true });
      if (result?.thread?.id) {
        await openMessageThreadById(result.thread.id, { silent: true, setSelected: true });
      }
      if (result?.thread?.type === "request_sent") {
        setToast({ show: true, tone: "success", message: "Message request sent from Explore." });
      }
    } catch (error) {
      if (Number(error?.response?.status || 0) === 409) {
        try {
          const threadData = await getCareerPulseMessageThreads();
          const threads = Array.isArray(threadData?.threads) ? threadData.threads : [];
          const existingThread = threads.find((thread) => String(thread?.participant?.id || "") === String(targetId || ""));

          if (existingThread?.id) {
            setHomeMode("messages");
            setViewMode("home");
            setMessagesPanel((prev) => ({
              ...prev,
              threads,
              requests: Number(threadData?.requests || 0),
              activeThread: existingThread,
              draft: "",
            }));
            await openMessageThreadById(existingThread.id, { silent: true, setSelected: true });
            return;
          }
        } catch {
          // Fallback to the standard error toast below if the recovery lookup fails.
        }
      }

      setToast({ show: true, tone: "error", message: error?.response?.data?.message || "Could not open the message thread." });
    } finally {
      setBusyFlag(`message-${targetId}`, false);
    }
  };

  const handleSendExploreMessage = async () => {
    const threadId = messagesPanel.activeThread?.id;
    const text = String(messagesPanel.draft || "").trim();
    const hasAttachment = Boolean(messagesPanel.attachmentPreview);
    if (!threadId || (!text && !hasAttachment)) return;
    if (messagesPanel.attachmentUploading) return;

    try {
      setMessagesPanel((prev) => ({ ...prev, sending: true }));
      const result = await sendCareerPulseMessage(threadId, {
        text,
        replyToMessageId: messagesPanel.replyTarget?.id || "",
        fileUrl: messagesPanel.attachmentPreview || "",
        fileName: messagesPanel.attachmentName || "",
        mimeType: messagesPanel.attachmentMimeType || "",
        fileSize: messagesPanel.attachmentFileSize || "",
      });
      setMessagesPanel((prev) => ({
        ...prev,
        draft: "",
        attachmentPreview: "",
        attachmentName: "",
        attachmentMimeType: "",
        attachmentFileSize: "",
        attachmentUploading: false,
        replyTarget: null,
        sending: false,
        messages: [...prev.messages, result?.message].filter(Boolean),
        threads: sortExploreThreadsByRecent(
          prev.threads.map((thread) =>
            thread.id === threadId
              ? {
                  ...thread,
                  preview:
                    text ||
                    (String(messagesPanel.attachmentMimeType || "").startsWith("video/")
                      ? "Sent a video"
                      : "Sent an image"),
                  updatedAt: new Date().toISOString(),
                  unread: 0,
                }
              : thread
          )
        ),
      }));
    } catch (error) {
      setMessagesPanel((prev) => ({ ...prev, sending: false }));
      setToast({
        show: true,
        tone: "error",
        message: error?.response?.data?.message || "Could not send this Explore message.",
      });
    }
  };

  const handleReplyToExploreMessage = (message) => {
    if (!message?.id || message?.deleted || message?.sender === "system") return;
    setMessagesPanel((prev) => ({
      ...prev,
      replyTarget: {
        id: message.id,
        text: message.text,
        sender: message.sender,
      },
      selectedMessageIds: [],
    }));
  };

  const handleToggleExploreMessageSelection = (messageId) => {
    const id = String(messageId || "");
    if (!id) return;
    setMessagesPanel((prev) => ({
      ...prev,
      selectedMessageIds: prev.selectedMessageIds.includes(id)
        ? prev.selectedMessageIds.filter((item) => item !== id)
        : [...prev.selectedMessageIds, id],
    }));
  };

  const handleClearExploreSelection = () => {
    setMessagesPanel((prev) => ({ ...prev, selectedMessageIds: [] }));
  };

  const handleSelectExploreAttachment = async (payload = {}) => {
    const file = payload?.file;
    if (!(file instanceof File)) return;

    const localPreview = String(payload.preview || "");
    setMessagesPanel((prev) => ({
      ...prev,
      attachmentUploading: true,
      attachmentPreview: localPreview,
      attachmentName: String(file.name || ""),
      attachmentMimeType: String(file.type || ""),
      attachmentFileSize: `${Math.max(1, Math.round(Number(file.size || 0) / 1024))} KB`,
    }));

    try {
      const uploadRes = await uploadSocialMedia(file);
      const uploadPayload = uploadRes?.data || uploadRes || {};
      setMessagesPanel((prev) => ({
        ...prev,
        attachmentUploading: false,
        attachmentPreview: String(uploadPayload.mediaUrl || localPreview || ""),
        attachmentName: String(uploadPayload.fileName || file.name || ""),
        attachmentMimeType: String(uploadPayload.mimeType || file.type || ""),
        attachmentFileSize: `${Math.max(
          1,
          Math.round(Number(uploadPayload.bytes || file.size || 0) / 1024)
        )} KB`,
      }));
    } catch (error) {
      setMessagesPanel((prev) => ({
        ...prev,
        attachmentUploading: false,
        attachmentPreview: "",
        attachmentName: "",
        attachmentMimeType: "",
        attachmentFileSize: "",
      }));
      setToast({
        show: true,
        tone: "error",
        message: error?.response?.data?.message || "Could not upload this attachment.",
      });
    }
  };

  const handleClearExploreAttachment = () => {
    setMessagesPanel((prev) => ({
      ...prev,
      attachmentPreview: "",
      attachmentName: "",
      attachmentMimeType: "",
      attachmentFileSize: "",
      attachmentUploading: false,
    }));
  };

  const handleToggleExploreMessageReaction = async (messageId, emoji) => {
    const threadId = messagesPanel.activeThread?.id;
    if (!threadId || !messageId || !emoji) return;

    try {
      const result = await toggleCareerPulseMessageReaction(threadId, messageId, { emoji });
      setMessagesPanel((prev) => ({
        ...prev,
        messages: prev.messages.map((message) =>
          String(message.id || "") === String(messageId || "") ? { ...message, ...(result?.message || {}) } : message
        ),
      }));
    } catch (error) {
      setToast({
        show: true,
        tone: "error",
        message: error?.response?.data?.message || "Could not update the reaction.",
      });
    }
  };

  const handleDeleteExploreMessages = async (messageIds = []) => {
    const threadId = messagesPanel.activeThread?.id;
    const ids = messageIds.map((item) => String(item || "")).filter(Boolean);
    if (!threadId || !ids.length) return;

    const { isConfirmed } = await Swal.fire({
      icon: "warning",
      title: ids.length > 1 ? "Delete selected messages?" : "Delete this message?",
      text: "Deleted Explore messages cannot be restored.",
      showCancelButton: true,
      confirmButtonText: "Delete",
      confirmButtonColor: "#111111",
      cancelButtonColor: "#cbd5e1",
    });

    if (!isConfirmed) return;

    try {
      setMessagesPanel((prev) => ({ ...prev, deleting: true }));
      await deleteCareerPulseMessages(threadId, { messageIds: ids });
      setMessagesPanel((prev) => ({
        ...prev,
        deleting: false,
        selectedMessageIds: prev.selectedMessageIds.filter((id) => !ids.includes(id)),
        replyTarget: ids.includes(String(prev.replyTarget?.id || "")) ? null : prev.replyTarget,
        messages: prev.messages.map((message) =>
          ids.includes(String(message.id || ""))
            ? {
                ...message,
                text: "This message was deleted.",
                deleted: true,
                canDelete: false,
                canReport: false,
              }
            : message
        ),
      }));
      await loadMessageThreads({ silent: true });
      setToast({
        show: true,
        tone: "success",
        message: ids.length > 1 ? "Selected messages deleted." : "Message deleted.",
      });
    } catch (error) {
      setMessagesPanel((prev) => ({ ...prev, deleting: false }));
      setToast({
        show: true,
        tone: "error",
        message: error?.response?.data?.message || "Could not delete the selected messages.",
      });
    }
  };

  const handleDeleteExploreChat = async () => {
    const threadId = messagesPanel.activeThread?.id;
    if (!threadId) return;

    const { isConfirmed } = await Swal.fire({
      icon: "warning",
      title: "Delete this chat?",
      text: "This will permanently remove the full Explore conversation.",
      showCancelButton: true,
      confirmButtonText: "Delete chat",
      confirmButtonColor: "#111111",
      cancelButtonColor: "#cbd5e1",
    });

    if (!isConfirmed) return;

    try {
      await deleteCareerPulseMessageThread(threadId);
      setMessagesPanel((prev) => {
        const remainingThreads = prev.threads.filter((thread) => thread.id !== threadId);
        return {
          ...prev,
          threads: remainingThreads,
          activeThread: remainingThreads[0] || null,
          messages: [],
          draft: "",
          replyTarget: null,
          selectedMessageIds: [],
          attachmentPreview: "",
          attachmentName: "",
          attachmentMimeType: "",
          attachmentFileSize: "",
          attachmentUploading: false,
        };
      });
      await loadMessageThreads({ silent: true });
      setToast({
        show: true,
        tone: "success",
        message: "Explore chat deleted.",
      });
    } catch (error) {
      setToast({
        show: true,
        tone: "error",
        message: error?.response?.data?.message || "Could not delete this Explore chat.",
      });
    }
  };

  const handleReportExploreMessage = async (message) => {
    const threadId = messagesPanel.activeThread?.id;
    if (!threadId || !message?.id || !message?.canReport) return;

    const { value: details, isConfirmed } = await Swal.fire({
      title: "Report this message",
      text: "This will report the Explore message for review.",
      input: "text",
      inputPlaceholder: "Optional reason or details",
      showCancelButton: true,
      confirmButtonText: "Report",
      confirmButtonColor: "#111111",
      cancelButtonColor: "#cbd5e1",
    });

    if (!isConfirmed) return;

    try {
      const result = await reportCareerPulseMessage(threadId, message.id, {
        reason: "Other",
        details: String(details || "").trim(),
      });
      setToast({
        show: true,
        tone: "success",
        message: result?.message || "Message reported successfully.",
      });
    } catch (error) {
      setToast({
        show: true,
        tone: "error",
        message: error?.response?.data?.message || "Could not report this message.",
      });
    }
  };

  const handleSendExploreAccount = async () => {
    const threadId = messagesPanel.activeThread?.id;
    const participant = messagesPanel.activeThread?.participant;
    if (!threadId || !participant?.name) return;

    const accountText = [
      `Explore account`,
      `Name: ${participant.name}`,
      participant.headline ? `About: ${participant.headline}` : "",
    ]
      .filter(Boolean)
      .join("\n");

    try {
      setMessagesPanel((prev) => ({ ...prev, sending: true }));
      const result = await sendCareerPulseMessage(threadId, {
        text: accountText,
      });
      setMessagesPanel((prev) => ({
        ...prev,
        sending: false,
        messages: [...prev.messages, result?.message].filter(Boolean),
        threads: sortExploreThreadsByRecent(
          prev.threads.map((thread) =>
            thread.id === threadId
              ? {
                  ...thread,
                  preview: "Sent an account card",
                  updatedAt: new Date().toISOString(),
                  unread: 0,
                }
              : thread
          )
        ),
      }));
      setToast({
        show: true,
        tone: "success",
        message: "Account sent in Explore chat.",
      });
    } catch (error) {
      setMessagesPanel((prev) => ({ ...prev, sending: false }));
      setToast({
        show: true,
        tone: "error",
        message: error?.response?.data?.message || "Could not send this account.",
      });
    }
  };

  const handleAcceptExploreRequest = async () => {
    const threadId = messagesPanel.activeThread?.id;
    if (!threadId) return;

    try {
      setBusyFlag(`accept-${threadId}`, true);
      const result = await acceptCareerPulseMessageRequest(threadId);
      setMessagesPanel((prev) => ({
        ...prev,
        activeThread: result?.thread || prev.activeThread,
      }));
      await loadMessageThreads({ silent: true });
      await openMessageThreadById(threadId, { silent: true, setSelected: false });
      setToast({ show: true, tone: "success", message: "Message request accepted." });
    } catch (error) {
      setToast({
        show: true,
        tone: "error",
        message: error?.response?.data?.message || "Could not accept this message request.",
      });
    } finally {
      setBusyFlag(`accept-${threadId}`, false);
    }
  };

  useEffect(() => {
    if (!storyViewer.open || !activeStory?.id) {
      setStoryReply(defaultStoryReplyState());
      return;
    }

    setStoryReply(defaultStoryReplyState());
  }, [storyViewer.open, activeStory?.id]);

  useEffect(() => {
    if (!storyViewer.open || !activeStory?.id || !activeStoryAuthor?.isSelf || !storyInsights.open) return undefined;
    const timer = window.setInterval(() => {
      void openStoryInsights(activeStory, { silent: true });
    }, 5000);
    return () => window.clearInterval(timer);
  }, [storyViewer.open, activeStory?.id, activeStoryAuthor?.isSelf, storyInsights.open]);

  const viewer = feed.viewer;
  const previewComments = Array.isArray(activePost?.comments) ? activePost.comments.slice(-3) : [];
  const activeNavKey =
    viewMode === "reels"
      ? "reels"
      : homeMode === "messages"
        ? "messages"
      : homeMode === "saved"
        ? "saved"
        : homeMode === "notifications"
          ? "notifications"
          : "home";

  if (loading) {
    return (
      <div className={`${pageShellClass} min-h-screen bg-[#f4f2ed]`}>
        <div className="mx-auto flex min-h-screen max-w-6xl items-center justify-center px-4">
          <div className="flex items-center gap-3 rounded-full border border-black/10 bg-white/80 px-6 py-3 text-sm font-semibold text-slate-700 shadow-[0_18px_50px_rgba(15,23,42,0.12)] backdrop-blur">
            <FiLoader className="animate-spin text-[#111111]" />
            Loading Explore...
          </div>
        </div>
      </div>
    );
  }

  const reelsOverlay =
    viewMode === "reels" && typeof document !== "undefined"
      ? createPortal(
          <div className="fixed inset-0 z-[89] bg-[radial-gradient(circle_at_top,#ffffff_0%,#f7f4ee_42%,#efe7db_100%)] text-slate-900">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.72),rgba(245,240,232,0.96))]" />

            <div className="relative grid h-[100dvh] xl:grid-cols-[96px_minmax(0,1fr)_360px]">
              <aside className="hidden border-r border-black/5 bg-white/78 backdrop-blur xl:flex xl:flex-col xl:items-center xl:justify-between xl:px-3 xl:py-6">
                <div className="flex flex-col items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setViewMode("home")}
                    className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-black/10 bg-white text-slate-700 transition hover:bg-slate-50"
                  >
                    <FiX />
                  </button>
                  <button
                    type="button"
                    onClick={refreshFeed}
                    className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-black/10 bg-white text-slate-700 transition hover:bg-slate-50"
                  >
                    <FiRefreshCw className={refreshing || savedRefreshing ? "animate-spin" : ""} />
                  </button>
                  <button
                    type="button"
                    onClick={() => openComposer("reel")}
                    className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-[#111111] text-white transition hover:-translate-y-0.5"
                  >
                    <FiPlus />
                  </button>
                </div>

                <div className="flex flex-col items-center gap-3">
                  <Avatar name={viewer?.name} avatarUrl={viewer?.avatarUrl} small />
                  <p className="max-w-[62px] text-center text-[11px] font-bold leading-4 text-slate-500">{viewer?.name || "Member"}</p>
                </div>
              </aside>

              <section className="relative min-h-0">
                <div className="absolute inset-x-0 top-0 z-10 flex items-center justify-between px-4 py-4 sm:px-6">
                  <div className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white/90 px-4 py-2 text-xs font-extrabold uppercase tracking-[0.22em] text-slate-500 shadow-sm backdrop-blur">
                    Reels
                  </div>
                  <div className="hidden items-center gap-2 rounded-full border border-black/10 bg-white/90 px-4 py-2 text-xs font-bold text-slate-500 shadow-sm backdrop-blur sm:inline-flex">
                    Scroll or use keyboard arrows
                  </div>
                  <div className="flex items-center gap-2 xl:hidden">
                    <button
                      type="button"
                      onClick={() => setViewMode("home")}
                      className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-black/10 bg-white text-slate-700 shadow-sm"
                    >
                      <FiX />
                    </button>
                  </div>
                </div>

                <div
                  ref={reelViewportRef}
                  tabIndex={-1}
                  className="h-[100dvh] snap-y snap-mandatory overflow-y-auto scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                >
                  {reelPosts.length ? (
                    reelPosts.map((post, index) => (
                      <div
                        key={post.id}
                        id={`post-${post.id}`}
                        ref={(node) => {
                          reelRefs.current[index] = node;
                        }}
                        data-index={index}
                        className="flex h-[100dvh] snap-center items-center justify-center px-3 py-6 sm:px-6"
                      >
                        <ReelSlide
                          post={post}
                          isActive={activePost?.id === post.id}
                          isMuted={reelAudioMuted}
                          pinned={pinnedReelIds.includes(post.id)}
                          nextPost={reelPosts[index + 1] || null}
                          expanded={Boolean(expandedCaptions[post.id])}
                          busy={busy}
                          timeAgo={timeAgo}
                          onToggleMute={() => setReelAudioMuted((prev) => !prev)}
                          onTogglePin={() =>
                            setPinnedReelIds((prev) =>
                              prev.includes(post.id) ? prev.filter((item) => item !== post.id) : [post.id, ...prev]
                            )
                          }
                          onToggleCaption={() => setExpandedCaptions((prev) => ({ ...prev, [post.id]: !prev[post.id] }))}
                          onLike={() => handleLike(post.id)}
                          onSave={() => handleSave(post.id)}
                          onShare={() => handleShare(post.id)}
                          onComment={() => openComments(post)}
                          onFollow={() => post.author?.id && handleFollow(post.author.id)}
                          onMessage={() => post.author?.id && handleMessage(post.author.id)}
                          onReport={() => openReportDialog(post)}
                          onMediaRef={(node) => {
                            videoRefs.current[post.id] = node;
                          }}
                        />
                      </div>
                    ))
                  ) : (
                    <div className="flex h-[100dvh] items-center justify-center px-4 py-8">
                      <div className="w-full max-w-[440px] overflow-hidden rounded-[34px] border border-white/10 bg-[#0b0b0c] px-6 py-14 text-center text-white shadow-[0_42px_120px_rgba(0,0,0,0.35)]">
                        <span className="mx-auto inline-flex h-16 w-16 items-center justify-center rounded-full bg-white/10 text-2xl">
                          <FiPlayCircle />
                        </span>
                        <h2 className="mt-5 text-2xl font-black">Your reel feed is ready for the first media post</h2>
                        <p className="mt-3 text-sm leading-7 text-white/70">
                          Publish a reel, video, banner, or image and it will appear here in the full-screen reel viewer.
                        </p>
                        <button
                          type="button"
                          onClick={() => openComposer("reel")}
                          className="mt-6 inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-extrabold text-[#111111]"
                        >
                          <FiPlus />
                          Create the first reel
                        </button>
                      </div>
                    </div>
                  )}

                  {loadingMore ? (
                    <div className="fixed bottom-5 left-1/2 z-10 -translate-x-1/2">
                      <div className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white px-4 py-2 text-xs font-bold text-slate-600 shadow-sm">
                        <FiLoader className="animate-spin" />
                        Loading more reels
                      </div>
                    </div>
                  ) : null}
                </div>

                {reelPosts.length > 1 ? (
                  <div className="pointer-events-none absolute right-3 top-1/2 hidden -translate-y-1/2 md:flex md:flex-col md:gap-4 xl:right-6">
                    <NavBubble icon={<FiChevronUp />} label="Previous" disabled={activeIndex <= 0} onClick={() => moveReelBy(-1)} />
                    <NavBubble icon={<FiChevronDown />} label="Next" disabled={activeIndex >= reelPosts.length - 1 && !feed.hasMore} onClick={() => moveReelBy(1)} />
                  </div>
                ) : null}
              </section>

              <aside className="hidden border-l border-black/5 bg-white/78 backdrop-blur xl:block">
                <div className="h-[100dvh] overflow-y-auto px-5 py-6">
                  <div className="space-y-5">
                    <SidePanelCard>
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-400">Now Showing</p>
                          <h3 className="mt-2 text-lg font-black text-slate-900">Active reel</h3>
                        </div>
                        <button
                          type="button"
                          onClick={() => setViewMode("home")}
                          className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white px-3 py-2 text-xs font-extrabold text-slate-700"
                        >
                          <FiHome />
                          Home
                        </button>
                      </div>
                      {activePost ? (
                        <>
                          <div className="mt-4 flex items-start gap-3">
                            <Avatar name={activePost.author?.name} avatarUrl={activePost.author?.avatarUrl} />
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <p className="truncate text-base font-black text-slate-900">{activePost.author?.name}</p>
                                <span className="rounded-full border border-black/10 bg-slate-50 px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">
                                  {activePost.author?.badge || "Member"}
                                </span>
                              </div>
                              <p className="mt-1 text-sm font-medium text-slate-500">{activePost.author?.headline}</p>
                              <div className="mt-2 flex items-center gap-2 text-xs font-bold text-slate-400">
                                <FiClock />
                                {timeAgo(activePost.createdAt)}
                              </div>
                            </div>
                          </div>
                          {activePost.headline ? <h3 className="mt-5 text-xl font-black text-slate-900">{activePost.headline}</h3> : null}
                          {activePost.content ? (
                            <p className="mt-3 text-sm leading-7 text-slate-600">{expandedCaptions[activePost.id] ? activePost.content : excerpt(activePost.content, 180)}</p>
                          ) : null}
                          <div className="mt-5 grid grid-cols-2 gap-3">
                            <MetricBlock label="Likes" value={activePost.metrics?.likes || 0} />
                            <MetricBlock label="Comments" value={activePost.metrics?.comments || 0} />
                            <MetricBlock label="Shares" value={activePost.metrics?.shares || 0} />
                            <MetricBlock label="Saves" value={activePost.metrics?.saves || 0} />
                          </div>
                          <div className="mt-5 flex flex-wrap gap-2">
                            <InlineActionButton icon={<FiMessageSquare />} label="Comments" onClick={() => openComments(activePost)} />
                            <InlineActionButton icon={<FiSend />} label="Message" onClick={() => activePost.author?.id && handleMessage(activePost.author.id)} disabled={!activePost.author?.canMessage || !activePost.author?.id} />
                            <InlineActionButton icon={<FiShare2 />} label="Share" onClick={() => handleShare(activePost.id)} />
                          </div>
                          {previewComments.length ? (
                            <div className="mt-5 space-y-3">
                              <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">Recent Comments</p>
                              {previewComments.map((comment) => (
                                <button
                                  key={comment.id}
                                  type="button"
                                  onClick={() => openComments(activePost)}
                                  className="block w-full rounded-[22px] bg-slate-50 px-4 py-3 text-left transition hover:bg-slate-100"
                                >
                                  <p className="text-sm leading-6 text-slate-700">
                                    <span className="font-black text-slate-900">{comment.author?.name}</span> {excerpt(comment.text, 72)}
                                  </p>
                                  <p className="mt-1 text-[11px] font-semibold text-slate-400">{timeAgo(comment.createdAt)}</p>
                                </button>
                              ))}
                            </div>
                          ) : null}
                        </>
                      ) : (
                        <p className="mt-3 text-sm text-slate-500">Use the mouse wheel or keyboard arrows to move through reels.</p>
                      )}
                    </SidePanelCard>

                    <SidePanelCard>
                      <p className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-400">Controls</p>
                      <div className="mt-4 space-y-3 text-sm text-slate-600">
                        <p>Mouse wheel: move to the next or previous reel.</p>
                        <p>Keyboard: use the up and down arrow keys.</p>
                        <p>Escape: close reels and return to Explore.</p>
                      </div>
                    </SidePanelCard>
                  </div>
                </div>
              </aside>
            </div>
          </div>,
          document.body,
        )
      : null;

  return (
    <div className={`${pageShellClass} relative min-h-screen overflow-hidden bg-[#f7f4ee] text-slate-900`}>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,#ffffff_0%,#faf7f2_42%,#f1eee6_100%)]" />
      <div className="absolute left-[5%] top-8 h-72 w-72 rounded-full bg-[#ffd8c7]/35 blur-3xl" />
      <div className="absolute right-[10%] top-16 h-72 w-72 rounded-full bg-[#dce6ff]/45 blur-3xl" />

      <div className="relative mx-auto max-w-[1700px] px-0 pb-8 pt-3 sm:px-4 lg:px-6">
        <div className="mb-4 rounded-[28px] border border-black/10 bg-white/85 p-4 shadow-[0_24px_70px_rgba(15,23,42,0.08)] backdrop-blur xl:hidden">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-400">
                {viewMode === "reels" ? "Reels" : homeMode === "saved" ? "Saved" : "Explore Home"}
              </p>
              <h1 className="mt-2 text-2xl font-black tracking-tight text-[#101010]">{feed.insights?.title || "Explore"}</h1>
              <p className="mt-2 max-w-xl text-sm text-slate-500">
                {viewMode === "reels"
                  ? "Posted videos and images open here in a vertical reel viewer."
                  : homeMode === "saved"
                    ? "All posts you saved are available here, and opening one starts a saved-first reel sequence."
                    : feed.insights?.subtitle || "Scroll the feed, open stories, and jump into reels from any media post."}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleRailAction("notifications")}
                className="relative inline-flex h-11 w-11 items-center justify-center rounded-full border border-black/10 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50"
              >
                <FiBell />
                {Number(viewer?.notificationsUnread || 0) > 0 ? (
                  <span className="absolute -right-1 -top-1 inline-flex min-w-[18px] items-center justify-center rounded-full bg-[#f97316] px-1 py-0.5 text-[10px] font-black text-white">
                    {Number(viewer?.notificationsUnread || 0) > 9 ? "9+" : Number(viewer?.notificationsUnread || 0)}
                  </span>
                ) : null}
              </button>
              <button
                type="button"
                onClick={refreshFeed}
                className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-black/10 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50"
              >
                <FiRefreshCw className={refreshing || savedRefreshing ? "animate-spin" : ""} />
              </button>
              <button
                type="button"
                onClick={() => openComposer(viewMode === "reels" ? "reel" : "image")}
                className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-[#111111] text-white shadow-sm transition hover:-translate-y-0.5"
              >
                <FiPlus />
              </button>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-3 rounded-full bg-[#f3f4f6] p-1">
            <button
              type="button"
              onClick={() => {
                setHomeMode("home");
                setViewMode("home");
              }}
              className={`flex-1 rounded-full px-4 py-2.5 text-sm font-extrabold transition ${
                viewMode === "home" && homeMode === "home" ? "bg-white text-[#111111] shadow-sm" : "text-slate-500"
              }`}
            >
              Home
            </button>
            <button
              type="button"
              onClick={() => enterReels("", { source: homeMode === "saved" ? "saved-first" : "all" })}
              className={`flex-1 rounded-full px-4 py-2.5 text-sm font-extrabold transition ${
                viewMode === "reels" ? "bg-white text-[#111111] shadow-sm" : "text-slate-500"
              }`}
            >
              Reels
            </button>
            <button
              type="button"
              onClick={() => {
                setHomeMode("saved");
                setViewMode("home");
                if (!savedFeed.posts.length && !savedLoading) {
                  void loadSavedFeed({ reset: true, silent: true });
                }
              }}
              className={`flex-1 rounded-full px-4 py-2.5 text-sm font-extrabold transition ${
                viewMode === "home" && homeMode === "saved" ? "bg-white text-[#111111] shadow-sm" : "text-slate-500"
              }`}
            >
              Saved
            </button>
          </div>

          {viewMode === "home" ? (
                <div className="mt-4 flex items-center gap-3 rounded-full border border-black/10 bg-white px-4 py-3 shadow-sm">
                  <FiSearch className="text-slate-400" />
                  <input
                    ref={searchInputRef}
                    value={searchValue}
                    onChange={(event) => setSearchValue(event.target.value)}
                      placeholder={
                        homeMode === "saved"
                          ? "Search saved posts"
                          : homeMode === "notifications"
                            ? "Search Explore notifications"
                            : homeMode === "messages"
                              ? "Search Explore messages"
                            : "Search people, captions, or tags"
                      }
                      className="w-full bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
                    />
              {searchValue ? (
                <button type="button" onClick={() => setSearchValue("")} className="text-slate-400 transition hover:text-slate-700">
                  <FiX />
                </button>
              ) : null}
            </div>
          ) : (
            <p className="mt-4 text-sm text-slate-500">Swipe or scroll through reel posts the way users move through an Instagram-style viewer.</p>
          )}
        </div>

        <div
          className={`grid gap-0 overflow-hidden xl:rounded-[36px] xl:border xl:border-black/10 xl:bg-white xl:shadow-[0_30px_90px_rgba(15,23,42,0.08)] ${
            hasExploreRightSidebar
              ? "xl:grid-cols-[244px_minmax(0,1fr)_360px]"
              : "xl:grid-cols-[244px_minmax(0,1fr)]"
          }`}
        >
          <aside className="hidden xl:block">
            <ExploreHomeRail activeKey={activeNavKey} onAction={handleRailAction} viewer={viewer} />
          </aside>

          <main className="min-w-0 bg-[#fafafa]">
            {viewMode === "home" ? (
              <div
                className={`flex flex-col gap-5 pb-10 ${
                  homeMode === "home" ? "mx-auto max-w-[760px]" : "w-full max-w-none"
                }`}
              >
                <div className="sticky top-0 z-10 border-b border-black/5 bg-[#fafafa]/95 px-4 pb-4 pt-5 backdrop-blur sm:px-6">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <p className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-400">
                        {homeMode === "saved" ? "Saved" : homeMode === "messages" ? "Explore Messages" : "Explore Home"}
                      </p>
                      <h1 className="mt-2 text-3xl font-black tracking-tight text-[#101010]">
                        {homeMode === "saved" ? "Saved Posts" : homeMode === "messages" ? "Messages" : feed.insights?.title || "Explore"}
                      </h1>
                      <p className="mt-2 max-w-2xl text-sm text-slate-500">
                        {homeMode === "saved"
                          ? "Everything you bookmarked lives here. Open any saved media to play in reels, then keep scrolling into the regular reel feed."
                          : homeMode === "messages"
                            ? "Explore messages are separate from job chats. Followers can chat directly, and other users first send a request."
                          : feed.insights?.subtitle || "A shared social feed for students and companies to publish updates, discover people, and jump into reels."}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setHomeMode("messages");
                          setViewMode("home");
                        }}
                        className="relative inline-flex items-center gap-2 rounded-full border border-black/10 bg-white px-4 py-3 text-sm font-extrabold text-slate-700 transition hover:bg-slate-50"
                      >
                        <FiMessageSquare />
                        Messages
                        {Number(viewer?.messagesUnread || 0) > 0 ? (
                          <span className="absolute -right-1 -top-1 inline-flex min-w-[18px] items-center justify-center rounded-full bg-[#111111] px-1 py-0.5 text-[10px] font-black text-white">
                            {Number(viewer?.messagesUnread || 0) > 9 ? "9+" : Number(viewer?.messagesUnread || 0)}
                          </span>
                        ) : null}
                      </button>
                      <button
                        type="button"
                        onClick={() => enterReels("", { source: homeMode === "saved" ? "saved-first" : "all" })}
                        className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white px-4 py-3 text-sm font-extrabold text-slate-700 transition hover:bg-slate-50"
                      >
                        <FiPlayCircle />
                        Reels
                      </button>
                      <button
                        type="button"
                        onClick={() => openComposer("image")}
                        className="inline-flex items-center gap-2 rounded-full bg-[#111111] px-5 py-3 text-sm font-extrabold text-white transition hover:-translate-y-0.5"
                      >
                        <FiPlus />
                        Create Post
                      </button>
                      <button
                        type="button"
                        onClick={refreshFeed}
                        className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white px-4 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
                      >
                        <FiRefreshCw className={refreshing || savedRefreshing ? "animate-spin" : ""} />
                        Refresh
                      </button>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center gap-3 rounded-full border border-black/10 bg-white px-4 py-3 shadow-sm">
                    <FiSearch className="text-slate-400" />
                    <input
                      ref={searchInputRef}
                      value={searchValue}
                      onChange={(event) => setSearchValue(event.target.value)}
                      placeholder={
                        homeMode === "saved"
                          ? "Search saved posts"
                          : homeMode === "notifications"
                            ? "Search Explore notifications"
                            : homeMode === "messages"
                              ? "Search Explore messages"
                              : "Search people, captions, or tags"
                      }
                      className="w-full bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
                    />
                    {searchValue ? (
                      <button type="button" onClick={() => setSearchValue("")} className="text-slate-400 transition hover:text-slate-700">
                        <FiX />
                      </button>
                    ) : null}
                  </div>
                </div>

                {homeMode === "home" ? (
                  <div className="px-4 sm:px-6">
                    <StoryStrip
                      viewer={viewer}
                      items={storyGroups}
                      onOpenStory={openStoryGroup}
                      onCreateStory={openStoryComposer}
                    />
                  </div>
                ) : null}

                <div className="space-y-5 px-4 sm:px-6">
                  {homeMode === "saved" ? (
                    <SavedPostsGrid
                      posts={savedPosts}
                      onOpenReel={(postId) => enterReels(postId, { source: "saved-first" })}
                    />
                    ) : homeMode === "notifications" ? (
                      <ExploreNotificationsList
                        items={filteredNotifications}
                        unreadCount={notifications.unreadCount}
                        soundEnabled={exploreNotificationSound}
                        timeAgo={timeAgo}
                        onOpenNotification={(item) => {
                          void handleOpenExploreNotification(item);
                        }}
                        onMarkRead={(notificationIds) => {
                          void handleMarkExploreNotificationRead(notificationIds);
                        }}
                        onMarkAllRead={() => {
                          void handleMarkExploreNotificationRead();
                        }}
                        onToggleSound={() => setExploreNotificationSound((prev) => !prev)}
                      />
                  ) : homeMode === "messages" ? (
                   <ExploreMessagesUi
  viewer={feed.viewer}
  threads={filteredMessageThreads}
  activeThread={selectedMessageThread}
   selectedThreadId={selectedMessageThreadId}
  messages={messagesPanel.messages}
  draft={messagesPanel.draft}
  attachmentPreview={messagesPanel.attachmentPreview}
  attachmentName={messagesPanel.attachmentName}
  attachmentMimeType={messagesPanel.attachmentMimeType}
  attachmentUploading={messagesPanel.attachmentUploading}
  replyTarget={messagesPanel.replyTarget}
  selectedMessageIds={messagesPanel.selectedMessageIds}
  loadingList={messagesPanel.loadingList}
  loadingThread={messagesPanel.loadingThread}
  sending={messagesPanel.sending}
  deleting={messagesPanel.deleting}
  requests={messagesPanel.requests}

  // ✅🔥 MAIN FIX
  onSelectThread={(thread) => {
    messagesPanelRef.current = {
      ...messagesPanelRef.current,
      activeThread: thread || messagesPanelRef.current.activeThread,
    };
    selectedMessageThreadIdRef.current = String(thread?.id || "");
    setSelectedMessageThreadId(String(thread?.id || ""));
    setMessagesPanel((prev) => ({
      ...prev,
      activeThread: thread || prev.activeThread,
      loadingThread: true,
      replyTarget: String(prev.activeThread?.id || "") === String(thread?.id || "") ? prev.replyTarget : null,
      attachmentPreview: String(prev.activeThread?.id || "") === String(thread?.id || "") ? prev.attachmentPreview : "",
      attachmentName: String(prev.activeThread?.id || "") === String(thread?.id || "") ? prev.attachmentName : "",
      attachmentMimeType: String(prev.activeThread?.id || "") === String(thread?.id || "") ? prev.attachmentMimeType : "",
      attachmentFileSize: String(prev.activeThread?.id || "") === String(thread?.id || "") ? prev.attachmentFileSize : "",
      attachmentUploading: String(prev.activeThread?.id || "") === String(thread?.id || "") ? prev.attachmentUploading : false,
      selectedMessageIds: [],
      messages: String(prev.activeThread?.id || "") === String(thread?.id || "") ? prev.messages : [],
    }));
    void openMessageThreadById(thread, { setSelected: true });
  }}

  onDraftChange={(value) =>
    setMessagesPanel((prev) => ({ ...prev, draft: value }))
  }

  onSend={handleSendExploreMessage}

  onReplyMessage={(msg) =>
    setMessagesPanel((prev) => ({ ...prev, replyTarget: msg }))
  }

  onDeleteMessage={(msg) => {
    void handleDeleteExploreMessages([msg?.id]);
  }}

  onDeleteSelected={() => {
    void handleDeleteExploreMessages(messagesPanel.selectedMessageIds);
  }}

  onDeleteChat={() => {
    void handleDeleteExploreChat();
  }}

  onReportMessage={(msg) => {
    void handleReportExploreMessage(msg);
  }}

  onSendAccount={() => {
    void handleSendExploreAccount();
  }}

  onToggleReaction={(messageId, reaction) => {
    void handleToggleExploreMessageReaction(messageId, reaction);
  }}

  onToggleMessageSelection={(id) => {
    setMessagesPanel((prev) => {
      const exists = prev.selectedMessageIds.includes(id);
      return {
        ...prev,
        selectedMessageIds: exists
          ? prev.selectedMessageIds.filter((i) => i !== id)
          : [...prev.selectedMessageIds, id],
      };
    });
  }}

  onClearSelection={() =>
    setMessagesPanel((prev) => ({
      ...prev,
      selectedMessageIds: [],
    }))
  }

  onAttachmentSelect={(file) => {
    console.log(file);
  }}

  onAttachmentClear={() => {
    console.log("clear attachment");
  }}

  onCancelReply={() =>
    setMessagesPanel((prev) => ({
      ...prev,
      replyTarget: null,
    }))
  }

  onRefresh={() => loadMessageThreads()}

  timeAgo={timeAgo}
/>
                  ) : (
                    <>
                      {homePosts.length ? (
                        homePosts.map((post) => (
                          <HomeFeedPostCard
                            key={post.id}
                            post={post}
                            timeAgo={timeAgo}
                            busy={busy}
                            onLike={() => handleLike(post.id)}
                            onComment={() => openComments(post)}
                            onShare={() => handleShare(post.id)}
                            onSave={() => handleSave(post.id)}
                            onFollow={() => post.author?.id && handleFollow(post.author.id)}
                            onMessage={() => post.author?.id && handleMessage(post.author.id)}
                            onReport={() => openReportDialog(post)}
                            onOpenReel={isReelEligible(post) ? () => enterReels(post.id) : undefined}
                          />
                        ))
                      ) : (
                        <div className="overflow-hidden rounded-[28px] border border-black/10 bg-white px-6 py-14 text-center shadow-sm">
                          <span className="mx-auto inline-flex h-16 w-16 items-center justify-center rounded-full bg-[#f3f4f6] text-2xl text-slate-500">
                            {searchValue ? <FiSearch /> : <FiPlayCircle />}
                          </span>
                          <h2 className="mt-5 text-2xl font-black text-slate-900">{searchValue ? "No posts match that search" : "Your Explore feed is ready"}</h2>
                          <p className="mt-3 text-sm leading-7 text-slate-500">
                            {searchValue
                              ? "Try a different person, caption, or tag and we will filter the feed again."
                              : "Create the first video, image, or career update and it will show up here like a social home timeline."}
                          </p>
                          <button
                            type="button"
                            onClick={searchValue ? () => setSearchValue("") : () => openComposer("reel")}
                            className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#111111] px-5 py-3 text-sm font-extrabold text-white"
                          >
                            {searchValue ? "Clear search" : "Create your first post"}
                          </button>
                        </div>
                      )}
                    </>
                  )}

                  {(homeMode === "saved" ? savedFeed.hasMore : homeMode === "notifications" || homeMode === "messages" ? false : feed.hasMore) ? (
                    <div className="flex justify-center pt-2">
                      <button
                        type="button"
                        onClick={loadMorePosts}
                        disabled={homeMode === "saved" ? savedLoadingMore : loadingMore}
                        className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white px-5 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {homeMode === "saved" ? (savedLoadingMore ? <FiLoader className="animate-spin" /> : null) : loadingMore ? <FiLoader className="animate-spin" /> : null}
                        {homeMode === "saved"
                          ? savedLoadingMore
                            ? "Loading more saved posts"
                            : "Load more saved posts"
                          : loadingMore
                            ? "Loading more posts"
                            : "Load more posts"}
                      </button>
                    </div>
                  ) : null}
                </div>
              </div>
            ) : null}
          </main>

          <aside className={`${hasExploreRightSidebar ? "hidden xl:block" : "hidden"} bg-white`}>
            <div className="sticky top-0 space-y-5 px-5 py-6">
              {viewMode === "home" ? (
                homeMode === "home" ? (
                  <>
                    <SuggestedList viewer={viewer} items={feed.suggestions || []} busy={busy} onFollow={handleFollow} onMessage={handleMessage} />

                    <SidePanelCard>
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-400">Trending</p>
                          <h3 className="mt-2 text-lg font-black text-slate-900">Tags and topics moving now</h3>
                        </div>
                        <button
                          type="button"
                          onClick={() => enterReels()}
                          className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white px-3 py-2 text-xs font-extrabold text-slate-700"
                        >
                          <FiPlayCircle />
                          Open Reels
                        </button>
                      </div>
                      <div className="mt-4 flex flex-wrap gap-2">
                        {(feed.trending || []).map((item) => (
                          <span key={item.tag} className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-700">
                            {item.tag}
                            <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-black text-slate-500">{item.count || 0}</span>
                          </span>
                        ))}
                      </div>
                    </SidePanelCard>

                    <SidePanelCard className="bg-[#111111] text-white">
                      <p className="text-[11px] font-black uppercase tracking-[0.22em] text-white/50">Your Profile</p>
                      <div className="mt-4 flex items-center gap-3">
                        <Avatar name={viewer?.name} avatarUrl={viewer?.avatarUrl} />
                        <div>
                          <p className="text-base font-black">{viewer?.name || "Member"}</p>
                          <p className="text-sm text-white/60">{viewer?.headline || "Explore member"}</p>
                        </div>
                      </div>
                      <div className="mt-5 grid grid-cols-2 gap-3">
                        <MetricBlock dark label="Following" value={viewer?.following || 0} />
                        <MetricBlock dark label="Posts" value={viewer?.posts || 0} />
                      </div>
                      <div className="mt-5 grid gap-3">
                        <button
                          type="button"
                          onClick={() => navigate(`${basePath}/profile`)}
                          className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-4 py-3 text-sm font-extrabold text-[#111111]"
                        >
                          <FiUser />
                          View Profile
                        </button>
                        <button
                          type="button"
                          onClick={() => navigate(`${basePath}/messages`)}
                          className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-4 py-3 text-sm font-extrabold text-[#111111]"
                        >
                          <FiSend />
                          Open Messages
                        </button>
                      </div>
                    </SidePanelCard>
                  </>
                ) : null
              ) : (
                <>
                  <SidePanelCard>
                    <p className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-400">Now Showing</p>
                    {activePost ? (
                      <>
                        <div className="mt-4 flex items-start gap-3">
                          <Avatar name={activePost.author?.name} avatarUrl={activePost.author?.avatarUrl} />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <p className="truncate text-base font-black text-slate-900">{activePost.author?.name}</p>
                              <span className="rounded-full border border-black/10 bg-slate-50 px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">
                                {activePost.author?.badge || "Member"}
                              </span>
                            </div>
                            <p className="mt-1 text-sm font-medium text-slate-500">{activePost.author?.headline}</p>
                            <div className="mt-2 flex items-center gap-2 text-xs font-bold text-slate-400">
                              <FiClock />
                              {timeAgo(activePost.createdAt)}
                            </div>
                          </div>
                        </div>
                        {activePost.headline ? <h3 className="mt-5 text-xl font-black text-slate-900">{activePost.headline}</h3> : null}
                        {activePost.content ? (
                          <p className="mt-3 text-sm leading-7 text-slate-600">{expandedCaptions[activePost.id] ? activePost.content : excerpt(activePost.content, 180)}</p>
                        ) : null}
                        <div className="mt-5 grid grid-cols-2 gap-3">
                          <MetricBlock label="Likes" value={activePost.metrics?.likes || 0} />
                          <MetricBlock label="Comments" value={activePost.metrics?.comments || 0} />
                          <MetricBlock label="Shares" value={activePost.metrics?.shares || 0} />
                          <MetricBlock label="Saves" value={activePost.metrics?.saves || 0} />
                        </div>
                        <div className="mt-5 flex flex-wrap gap-2">
                          <InlineActionButton icon={<FiMessageSquare />} label="Comments" onClick={() => openComments(activePost)} />
                          <InlineActionButton icon={<FiSend />} label="Message" onClick={() => activePost.author?.id && handleMessage(activePost.author.id)} disabled={!activePost.author?.canMessage || !activePost.author?.id} />
                          <InlineActionButton icon={<FiShare2 />} label="Share" onClick={() => handleShare(activePost.id)} />
                        </div>
                        {previewComments.length ? (
                          <div className="mt-5 space-y-3">
                            <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">Recent Comments</p>
                            {previewComments.map((comment) => (
                              <button
                                key={comment.id}
                                type="button"
                                onClick={() => openComments(activePost)}
                                className="block w-full rounded-[22px] bg-slate-50 px-4 py-3 text-left transition hover:bg-slate-100"
                              >
                                <p className="text-sm leading-6 text-slate-700">
                                  <span className="font-black text-slate-900">{comment.author?.name}</span> {excerpt(comment.text, 72)}
                                </p>
                                <p className="mt-1 text-[11px] font-semibold text-slate-400">{timeAgo(comment.createdAt)}</p>
                              </button>
                            ))}
                          </div>
                        ) : null}
                      </>
                    ) : (
                      <p className="mt-3 text-sm text-slate-500">Open a media post or scroll the reel viewer to see the active post details here.</p>
                    )}
                  </SidePanelCard>

                  <SuggestedList viewer={viewer} items={feed.suggestions || []} busy={busy} onFollow={handleFollow} onMessage={handleMessage} />

                  <SidePanelCard>
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-400">Trending</p>
                        <h3 className="mt-2 text-lg font-black text-slate-900">Jump back into discovery</h3>
                      </div>
                      <button
                        type="button"
                        onClick={() => setViewMode("home")}
                        className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white px-3 py-2 text-xs font-extrabold text-slate-700"
                      >
                        <FiHome />
                        Home
                      </button>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {(feed.trending || []).map((item) => (
                        <span key={item.tag} className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-700">
                          {item.tag}
                          <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-black text-slate-500">{item.count || 0}</span>
                        </span>
                      ))}
                    </div>
                  </SidePanelCard>
                </>
              )}
            </div>
          </aside>
        </div>
      </div>

      {reelsOverlay}

      <ExploreStoryViewer
        open={storyViewer.open}
        groups={storyGroups}
        groupIndex={storyViewer.groupIndex}
        storyIndex={storyViewer.storyIndex}
        onClose={closeStoryViewer}
        onNavigate={navigateStoryViewer}
        onCreateStory={openStoryComposer}
        onMessage={handleStoryMessage}
        onLike={handleStoryLike}
        onReport={handleStoryReport}
        onShare={handleStoryShare}
        onDelete={handleStoryDelete}
        onMuteAuthor={handleStoryMuteAuthor}
        onHideStory={handleStoryHide}
        onSendAccount={handleStorySendAccount}
        storyInsights={storyInsights}
        onOpenInsights={openStoryInsights}
        onCloseInsights={closeStoryInsights}
        onStoryInsightsTabChange={(tab) => setStoryInsights((prev) => ({ ...prev, activeTab: tab }))}
        messageDraft={storyReply.draft}
        onMessageDraftChange={(value) => setStoryReply((prev) => ({ ...prev, draft: value }))}
        onMessageSend={handleStoryMessage}
        liked={activeStoryLiked}
        messageBusy={storyReply.sending || Boolean(busy[`message-${activeStoryAuthor?.id}`])}
        likeBusy={Boolean(busy[`story-like-${activeStory?.id}`])}
        deleteBusy={Boolean(busy[`story-delete-${activeStory?.id}`])}
        timeAgo={timeAgo}
      />

      <Modal
        open={shareSheet.open}
        onClose={closeShareSheet}
        title="Share in a post"
        widthClass="max-w-[620px]"
        zIndexClass="z-[140]"
      >
        <div className="space-y-6">
          <div className="flex flex-col items-center justify-center gap-3 text-center">
            <button
              type="button"
              onClick={() => void handleShareOption("post")}
              className="rounded-full bg-slate-950 px-7 py-3 text-base font-black text-white transition hover:bg-slate-800"
            >
              Create post
            </button>
            <p className="text-sm text-slate-500">
              {shareSheet.kind === "story"
                ? "Share this story to your Explore feed or send it outside the app."
                : "Share this post to your Explore feed or send it outside the app."}
            </p>
          </div>

          <div className="border-t border-slate-200 pt-5">
            <p className="mb-5 text-[1.65rem] font-black text-slate-900">Share</p>
            <div className="flex flex-wrap gap-5">
              {[
                { key: "embed", label: "Embed", icon: <span className="text-xl font-black">&lt;/&gt;</span>, className: "bg-slate-100 text-slate-700" },
                { key: "whatsapp", label: "WhatsApp", icon: <FaWhatsapp className="text-[1.7rem]" />, className: "bg-[#25D366] text-white" },
                { key: "facebook", label: "Facebook", icon: <FaFacebookF className="text-[1.55rem]" />, className: "bg-[#4267B2] text-white" },
                { key: "x", label: "X", icon: <span className="text-[1.6rem] font-black">X</span>, className: "bg-black text-white" },
                { key: "email", label: "Email", icon: <FiMail className="text-[1.55rem]" />, className: "bg-slate-400 text-white" },
                { key: "more", label: "More", icon: <FiChevronRight className="text-[1.7rem]" />, className: "bg-orange-500 text-white" },
              ].map((option) => (
                <button
                  key={option.key}
                  type="button"
                  onClick={() => void handleShareOption(option.key)}
                  className="flex w-[88px] flex-col items-center gap-3 text-center"
                >
                  <span className={`flex h-16 w-16 items-center justify-center rounded-full ${option.className}`}>
                    {option.icon}
                  </span>
                  <span className="text-sm font-medium text-slate-700">{option.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-[22px] border border-slate-200 bg-slate-50 p-3">
            <div className="flex items-center gap-3">
              <div className="min-w-0 flex-1 rounded-[18px] bg-white px-4 py-3 text-sm text-slate-700 shadow-inner">
                <p className="truncate">{activeShareUrl}</p>
              </div>
              <button
                type="button"
                onClick={() => void handleShareOption("copy")}
                className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-5 py-3 text-sm font-black text-white transition hover:bg-blue-700"
              >
                <FiCopy />
                <span>Copy</span>
              </button>
            </div>
          </div>
        </div>
      </Modal>

      <Modal
        open={storyComposerOpen}
        onClose={closeStoryComposer}
        title="Create story"
        widthClass="max-w-xl"
        footer={
          storyComposer.file ? (
            <>
              <button type="button" onClick={closeStoryComposer} className="rounded-full border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-700">
                Cancel
              </button>
              <button
                type="button"
                disabled={busy["story-publish"] || busy["story-media-scan"]}
                onClick={publishStory}
                className="inline-flex items-center gap-2 rounded-full bg-[#111111] px-5 py-2.5 text-sm font-extrabold text-white disabled:opacity-60"
              >
                {busy["story-publish"] ? <FiLoader className="animate-spin" /> : null}
                {busy["story-publish"] ? "Sharing..." : "Share story"}
              </button>
            </>
          ) : null
        }
      >
        <div className="space-y-5">
          {busy["story-media-scan"] ? (
            <div className="rounded-[20px] border border-amber-200 bg-amber-50 px-4 py-3">
              <div className="flex items-center gap-2 text-sm font-bold text-amber-700">
                <FiLoader className="animate-spin" />
                Checking story media for unsafe visual content...
              </div>
            </div>
          ) : null}
          {busy["story-publish"] ? (
            <div className="rounded-[20px] border border-[#111111]/10 bg-[#f8fafc] px-4 py-3">
              <div className="flex items-center gap-2 text-sm font-bold text-slate-700">
                <FiLoader className="animate-spin" />
                Uploading story media and publishing...
              </div>
            </div>
          ) : null}

          <input
            ref={storyFileInputRef}
            type="file"
            accept="image/*,video/*"
            disabled={busy["story-publish"]}
            className="hidden"
            onChange={(event) => handleStoryFile(event.target.files?.[0] || null)}
          />

          {!storyComposer.file ? (
            <div
              onDragOver={(event) => {
                event.preventDefault();
                setStoryDragActive(true);
              }}
              onDragEnter={(event) => {
                event.preventDefault();
                setStoryDragActive(true);
              }}
              onDragLeave={(event) => {
                event.preventDefault();
                if (event.currentTarget.contains(event.relatedTarget)) return;
                setStoryDragActive(false);
              }}
              onDrop={handleStoryDrop}
              className={`flex min-h-[470px] flex-col items-center justify-center rounded-[30px] border px-8 py-10 text-center transition ${
                storyDragActive
                  ? "border-[#4f46e5] bg-[#eef2ff] shadow-[0_0_0_4px_rgba(99,102,241,0.08)]"
                  : "border-slate-200 bg-white"
              }`}
            >
              <div className="relative">
                <span className="inline-flex h-20 w-20 items-center justify-center rounded-[28px] border-2 border-slate-900/85 bg-white text-[34px] text-slate-900">
                  <FiImage />
                </span>
                <span className="absolute -bottom-2 -right-3 inline-flex h-16 w-16 items-center justify-center rounded-[24px] border-2 border-slate-900/85 bg-white text-[28px] text-slate-900 shadow-sm">
                  <FiPlayCircle />
                </span>
              </div>

              <h3 className="mt-10 text-[34px] font-medium tracking-tight text-[#111111]">Drag photos and videos here</h3>
              <p className="mt-3 max-w-md text-sm leading-7 text-slate-500">
                You can share with default 24-hour auto-delete, or set a custom expiry date and time.
              </p>

              <button
                type="button"
                onClick={openStoryFilePicker}
                disabled={busy["story-publish"]}
                className="mt-8 inline-flex items-center justify-center rounded-xl bg-[#4f46e5] px-6 py-3 text-base font-extrabold text-white transition hover:bg-[#4338ca] disabled:cursor-not-allowed disabled:opacity-65"
              >
                Select from computer
              </button>
            </div>
          ) : (
            <div className="space-y-5">
              <div className="rounded-[26px] border border-slate-200 bg-slate-950 px-5 py-6">
                <p className="mb-4 text-center text-xs font-black uppercase tracking-[0.18em] text-slate-400">Story frame preview</p>
                <div className="mx-auto aspect-[9/16] w-full max-w-[320px] overflow-hidden rounded-[28px] border border-white/10 bg-[radial-gradient(circle_at_top,#262626_0%,#111111_48%,#050505_100%)] p-3 shadow-[0_26px_80px_rgba(15,23,42,0.24)]">
                  <div className="flex h-full w-full items-center justify-center overflow-hidden rounded-[22px]">
                    {String(storyComposer.file?.type || "").startsWith("video/") ? (
                      <video src={storyPreview} autoPlay loop muted playsInline disablePictureInPicture controlsList="nofullscreen nodownload noremoteplayback" className="max-h-full max-w-full object-contain" />
                    ) : (
                      <img src={storyPreview} alt="Story preview" className="max-h-full max-w-full object-contain" />
                    )}
                  </div>
                </div>
              </div>
              {selectedStoryMusic?.audioUrl ? (
                <audio
                  ref={storyMusicPreviewRef}
                  src={selectedStoryMusic.audioUrl}
                  preload="metadata"
                  onEnded={() => setStoryMusicPreviewing(false)}
                />
              ) : null}

              <div className="flex flex-wrap items-center justify-between gap-3 rounded-[24px] border border-slate-200 bg-slate-50 px-4 py-4">
                <div>
                  <p className="text-sm font-black text-slate-900">{storyComposer.file?.name || "Selected file"}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {storyComposer.expiryMode === "custom" && storyComposer.customExpiresAt
                      ? `Images and videos only. This story expires on ${new Date(storyComposer.customExpiresAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}.`
                      : "Images and videos only. This story will disappear after 24 hours."}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={openStoryFilePicker}
                    disabled={busy["story-publish"]}
                    className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
                  >
                    Change media
                  </button>
                  <button
                    type="button"
                    onClick={() => handleStoryFile(null)}
                    disabled={busy["story-publish"]}
                    className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
                  >
                    Remove
                  </button>
                </div>
              </div>

              <div className="rounded-[24px] border border-slate-200 bg-white px-4 py-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">Story music</p>
                    <p className="mt-1 text-sm text-slate-600">
                      {canAttachStoryMusic
                        ? "Search songs from Jamendo and attach a track to your image story."
                        : "Music overlay is available only for image stories."}
                    </p>
                  </div>
                  {canAttachStoryMusic ? (
                    <button
                      type="button"
                      onClick={openStoryMusicPicker}
                      disabled={busy["story-publish"]}
                      className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <FiMusic />
                      {selectedStoryMusic ? "Change music" : "Add music"}
                    </button>
                  ) : null}
                </div>

                {selectedStoryMusic ? (
                  <div className="mt-4 rounded-[20px] border border-slate-200 bg-slate-50 p-4">
                    <div className="flex items-start gap-3">
                      <div className="h-14 w-14 overflow-hidden rounded-xl bg-slate-200">
                        {selectedStoryMusic.coverUrl ? (
                          <img src={selectedStoryMusic.coverUrl} alt={selectedStoryMusic.title} className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-slate-500">
                            <FiMusic />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-black text-slate-900">{selectedStoryMusic.title}</p>
                        <p className="truncate text-xs text-slate-500">{selectedStoryMusic.artist}</p>
                        <p className="mt-1 text-xs font-semibold text-slate-400">
                          {durationLabel(selectedStoryMusicDuration)} total
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setStoryComposer((prev) => ({ ...prev, music: null }))}
                        disabled={busy["story-publish"]}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <FiX />
                      </button>
                    </div>

                    <div className="mt-4 space-y-3">
                      <div>
                        <div className="mb-1 flex items-center justify-between text-xs font-semibold text-slate-500">
                          <span>Start point</span>
                          <span>{durationLabel(storyMusicCurrentStart)}</span>
                        </div>
                        <input
                          type="range"
                          min={0}
                          max={storyMusicMaxStart}
                          value={storyMusicCurrentStart}
                          onChange={(event) => {
                            const nextStart = clampNumber(event.target.value, 0, storyMusicMaxStart);
                            setStoryComposer((prev) => {
                              if (!prev.music) return prev;
                              const total = Math.max(3, Math.floor(Number(prev.music.durationSeconds || 0) || 15));
                              const maxStart = Math.max(0, total - 3);
                              const start = clampNumber(nextStart, 0, maxStart);
                              const maxClip = Math.max(3, total - start);
                              const clip = clampNumber(prev.music.clipDurationSeconds || 15, 3, maxClip);
                              return { ...prev, music: { ...prev.music, startSeconds: start, clipDurationSeconds: clip } };
                            });
                          }}
                          className="w-full accent-[#111111]"
                        />
                      </div>
                      <div>
                        <div className="mb-1 flex items-center justify-between text-xs font-semibold text-slate-500">
                          <span>Clip length</span>
                          <span>{durationLabel(storyMusicCurrentClip)}</span>
                        </div>
                        <input
                          type="range"
                          min={3}
                          max={storyMusicMaxClip}
                          value={storyMusicCurrentClip}
                          onChange={(event) => {
                            const nextClip = clampNumber(event.target.value, 3, storyMusicMaxClip);
                            setStoryComposer((prev) => (prev.music ? { ...prev, music: { ...prev.music, clipDurationSeconds: nextClip } } : prev));
                          }}
                          className="w-full accent-[#111111]"
                        />
                      </div>
                    </div>

                    <div className="mt-4 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={previewSelectedStoryMusic}
                        disabled={busy["story-publish"]}
                        className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {storyMusicPreviewing ? <FiPause /> : <FiPlay />}
                        {storyMusicPreviewing ? "Stop preview" : "Preview clip"}
                      </button>
                      <span className="text-xs text-slate-500">
                        Plays from {durationLabel(storyMusicCurrentStart)} for {durationLabel(storyMusicCurrentClip)}
                      </span>
                    </div>
                  </div>
                ) : null}
              </div>

              <div className="rounded-[24px] border border-slate-200 bg-white px-4 py-4">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">Story expiry</p>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => setStoryComposer((prev) => ({ ...prev, expiryMode: "24h", customExpiresAt: "" }))}
                    className={`rounded-2xl border px-4 py-3 text-left text-sm font-bold transition ${
                      storyComposer.expiryMode === "24h"
                        ? "border-[#111111] bg-[#111111] text-white"
                        : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    Auto delete in 24 hours
                  </button>
                  <button
                    type="button"
                    onClick={() => setStoryComposer((prev) => ({ ...prev, expiryMode: "custom" }))}
                    className={`rounded-2xl border px-4 py-3 text-left text-sm font-bold transition ${
                      storyComposer.expiryMode === "custom"
                        ? "border-[#111111] bg-[#111111] text-white"
                        : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    Set custom date and time
                  </button>
                </div>

                {storyComposer.expiryMode === "custom" ? (
                  <label className="mt-3 block">
                    <span className="mb-2 block text-xs font-black uppercase tracking-[0.18em] text-slate-400">Custom expiry date and time</span>
                    <input
                      type="datetime-local"
                      value={storyComposer.customExpiresAt}
                      min={storyExpiryInputMin}
                      onChange={(event) => setStoryComposer((prev) => ({ ...prev, customExpiresAt: event.target.value }))}
                      className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none transition focus:border-slate-900 focus:bg-white"
                    />
                  </label>
                ) : null}

                <p className="mt-3 text-xs text-slate-500">
                  After expiry, stories are hidden immediately and then automatically cleaned up.
                </p>
              </div>

              <label className="block">
                <span className="mb-2 block text-xs font-black uppercase tracking-[0.18em] text-slate-400">Caption</span>
                <textarea
                  value={storyComposer.caption}
                  onChange={(event) => setStoryComposer((prev) => ({ ...prev, caption: event.target.value }))}
                  rows={4}
                  placeholder="Add a short caption for your story"
                  className="w-full rounded-[24px] border border-slate-200 bg-slate-50 px-4 py-4 text-sm leading-7 outline-none transition focus:border-slate-900 focus:bg-white"
                />
              </label>
            </div>
          )}
        </div>
      </Modal>

      <Modal
        open={storyMusicPickerOpen}
        onClose={closeStoryMusicPicker}
        title="Add Music"
        widthClass="max-w-3xl"
      >
        <div className="space-y-4">
          <div className="rounded-[18px] border border-slate-200 bg-slate-50 px-4 py-3">
            <div className="flex items-center gap-3">
              <FiSearch className="text-slate-400" />
              <input
                value={storyMusicQuery}
                onChange={(event) => setStoryMusicQuery(event.target.value)}
                placeholder="Search songs, artists, or albums"
                className="w-full bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {[
              { key: "for-you", label: "For you" },
              { key: "trending", label: "Trending" },
              { key: "saved", label: "Saved" },
              { key: "original-audio", label: "Original audio" },
            ].map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => {
                  if (tab.key === "original-audio") {
                    setStoryComposer((prev) => ({ ...prev, music: null }));
                    setStoryMusicPickerOpen(false);
                    return;
                  }
                  if (tab.key === "saved") {
                    setStoryMusicHasMore(false);
                    setStoryMusicOffset(0);
                  }
                  setStoryMusicTab(tab.key);
                }}
                className={`rounded-full px-4 py-2 text-sm font-extrabold transition ${
                  storyMusicTab === tab.key
                    ? "bg-[#111111] text-white"
                    : "border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {storyMusicLoading ? (
            <div className="rounded-[18px] border border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm font-semibold text-slate-600">
              <FiLoader className="mx-auto mb-3 animate-spin text-lg" />
              Loading songs...
            </div>
          ) : storyMusicError ? (
            <div className="rounded-[18px] border border-rose-200 bg-rose-50 px-4 py-4 text-sm font-semibold text-rose-600">
              {storyMusicError}
            </div>
          ) : (
            <div className="max-h-[420px] space-y-2 overflow-y-auto pr-1">
              {storyMusicTracks.length ? (
                storyMusicTracks.map((track) => {
                  const trackId = String(track.trackId || track.id || "");
                  const trackSaved = savedStoryMusicTracks.some((item) => item.trackId === trackId);
                  return (
                    <div key={trackId} className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-3">
                      <div className="h-14 w-14 overflow-hidden rounded-xl bg-slate-100">
                        {track.coverUrl ? (
                          <img src={track.coverUrl} alt={track.title} className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-slate-500">
                            <FiMusic />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-black text-slate-900">{track.title}</p>
                        <p className="truncate text-xs text-slate-500">{track.artist}</p>
                        <p className="truncate text-[11px] text-slate-400">
                          {track.album ? `${track.album} • ` : ""}
                          {durationLabel(track.durationSeconds)}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => toggleSaveStoryMusicTrack(track)}
                        className={`inline-flex h-10 w-10 items-center justify-center rounded-xl border transition ${
                          trackSaved
                            ? "border-[#111111] bg-[#111111] text-white"
                            : "border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100"
                        }`}
                        title={trackSaved ? "Remove from saved songs" : "Save song"}
                      >
                        <FiBookmark />
                      </button>
                      <button
                        type="button"
                        onClick={() => selectStoryMusicTrack(track)}
                        className="rounded-full bg-[#111111] px-4 py-2 text-sm font-extrabold text-white"
                      >
                        Select
                      </button>
                    </div>
                  );
                })
              ) : (
                <div className="rounded-[18px] border border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm font-semibold text-slate-600">
                  No songs found. Try a different search.
                </div>
              )}

              {storyMusicTab !== "saved" && storyMusicHasMore ? (
                <div className="pt-2 text-center">
                  <button
                    type="button"
                    onClick={() => {
                      void loadStoryMusicTracks({
                        query: storyMusicQuery,
                        section: storyMusicTab,
                        offset: storyMusicOffset,
                        append: true,
                      });
                    }}
                    disabled={storyMusicLoadingMore}
                    className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {storyMusicLoadingMore ? <FiLoader className="animate-spin" /> : null}
                    {storyMusicLoadingMore ? "Loading more songs..." : "Load more songs"}
                  </button>
                </div>
              ) : null}
            </div>
          )}
        </div>
      </Modal>

      <Modal
        open={composerOpen}
        onClose={closeComposer}
        title="Create Explore Post"
        widthClass="max-w-3xl"
        footer={
          <>
            <button type="button" onClick={closeComposer} className="rounded-full border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-700">
              Cancel
            </button>
            <button
              type="button"
              disabled={busy.publish || busy["media-scan"]}
              onClick={publishPost}
              className="inline-flex items-center gap-2 rounded-full bg-[#111111] px-5 py-2.5 text-sm font-extrabold text-white disabled:opacity-60"
            >
              {busy.publish ? <FiLoader className="animate-spin" /> : null}
              {busy.publish ? "Publishing..." : "Publish Post"}
            </button>
          </>
        }
      >
        <div className="space-y-5">
          {busy["media-scan"] ? (
            <div className="rounded-[20px] border border-amber-200 bg-amber-50 px-4 py-3">
              <div className="flex items-center gap-2 text-sm font-bold text-amber-700">
                <FiLoader className="animate-spin" />
                Checking media for unsafe visual content...
              </div>
            </div>
          ) : null}
          {busy.publish ? (
            <div className="rounded-[20px] border border-[#111111]/10 bg-[#f8fafc] px-4 py-3">
              <div className="flex items-center gap-2 text-sm font-bold text-slate-700">
                <FiLoader className="animate-spin" />
                Uploading media and publishing post...
              </div>
            </div>
          ) : null}

          <div className="rounded-[26px] bg-[linear-gradient(135deg,#0f172a_0%,#171717_55%,#312e81_100%)] px-5 py-5 text-white">
            <p className="text-[11px] font-black uppercase tracking-[0.22em] text-white/50">Reel Studio</p>
            <h3 className="mt-2 text-2xl font-black">Build a post for the new Explore feed</h3>
            <p className="mt-2 text-sm leading-7 text-white/70">Upload reels, images, banners, videos, or documents and they will flow straight into the reel-style experience.</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {postTypeOptions.map((option) => (
              <button key={option.value} type="button" onClick={() => setComposer((prev) => ({ ...prev, type: option.value }))} className={`rounded-[24px] border p-4 text-left transition ${composer.type === option.value ? "border-[#111111] bg-slate-900 text-white shadow-sm" : "border-slate-200 bg-white hover:bg-slate-50"}`}>
                <div className="flex items-center gap-3">
                  <span className={`inline-flex h-11 w-11 items-center justify-center rounded-2xl ${composer.type === option.value ? "bg-white/10 text-white" : "bg-slate-100 text-slate-700"}`}>{option.icon}</span>
                  <div>
                    <p className="text-sm font-extrabold">{option.label}</p>
                    <p className={`text-xs ${composer.type === option.value ? "text-white/60" : "text-slate-500"}`}>{option.helper}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-2 block text-xs font-black uppercase tracking-[0.18em] text-slate-400">Headline</span>
              <input value={composer.headline} onChange={(event) => setComposer((prev) => ({ ...prev, headline: event.target.value }))} placeholder="Give this post a strong hook" className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none transition focus:border-slate-900 focus:bg-white" />
            </label>
            <label className="block">
              <span className="mb-2 block text-xs font-black uppercase tracking-[0.18em] text-slate-400">Visibility</span>
              <select value={composer.visibility} onChange={(event) => setComposer((prev) => ({ ...prev, visibility: event.target.value }))} className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none transition focus:border-slate-900 focus:bg-white">
                <option value="everyone">Everyone</option>
                <option value="followers">Followers</option>
              </select>
            </label>
          </div>
          <label className="block">
            <span className="mb-2 block text-xs font-black uppercase tracking-[0.18em] text-slate-400">Caption</span>
            <textarea value={composer.content} onChange={(event) => setComposer((prev) => ({ ...prev, content: event.target.value }))} rows={5} placeholder="Write the caption, hook, story, or hiring update that should appear over the reel." className="w-full rounded-[24px] border border-slate-200 bg-slate-50 px-4 py-4 text-sm leading-7 outline-none transition focus:border-slate-900 focus:bg-white" />
          </label>
          <label className="block rounded-[24px] border border-dashed border-slate-300 bg-slate-50 p-5">
            <span className="mb-2 block text-xs font-black uppercase tracking-[0.18em] text-slate-400">Attach media</span>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-base font-black text-slate-900">{composer.file?.name || "Choose a file from your device"}</p>
                <p className="mt-1 text-sm text-slate-500">Supports reels, videos, images, banners, and documents based on the selected format.</p>
              </div>
              <span className="inline-flex items-center gap-2 rounded-full bg-[#111111] px-4 py-2 text-sm font-extrabold text-white">
                {busy.publish ? <FiLoader className="animate-spin" /> : null}
                {busy.publish ? "Uploading..." : "Upload"}
              </span>
            </div>
            <input
              type="file"
              accept={mediaAcceptForType(composer.type)}
              disabled={busy.publish}
              className="mt-4 block w-full text-sm text-slate-600"
              onChange={(event) => handleComposerFile(event.target.files?.[0] || null)}
            />
          </label>
          {composerPreview ? (
            <div className="overflow-hidden rounded-[26px] border border-slate-200 bg-slate-950">
              {String(composer.file?.type || "").startsWith("video/") ? <video src={composerPreview} controls className="max-h-[460px] w-full object-contain" /> : <img src={composerPreview} alt="Preview" className="max-h-[460px] w-full object-contain" />}
            </div>
          ) : composer.file ? (
            <div className="flex items-center justify-between rounded-[24px] border border-slate-200 bg-slate-50 px-4 py-3">
              <div className="flex items-center gap-3">
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-slate-700 shadow-sm">
                  <FiFileText />
                </span>
                <div>
                  <p className="text-sm font-extrabold text-slate-900">{composer.file.name}</p>
                  <p className="text-xs text-slate-500">{Math.max(1, Math.round((composer.file.size || 0) / 1024))} KB</p>
                </div>
              </div>
              <button type="button" onClick={() => handleComposerFile(null)} className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-500">
                <FiX />
              </button>
            </div>
          ) : null}
        </div>
      </Modal>

      <Modal
        open={reportDialog.open}
        onClose={closeReportDialog}
        title="Report Reel"
        widthClass="max-w-lg"
        footer={
          <>
            <button
              type="button"
              onClick={closeReportDialog}
              className="rounded-full border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-700"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={busy[`report-${reportDialog.postId}`]}
              onClick={handleSubmitReport}
              className="inline-flex items-center gap-2 rounded-full bg-[#111111] px-5 py-2.5 text-sm font-extrabold text-white disabled:opacity-60"
            >
              {busy[`report-${reportDialog.postId}`] ? <FiLoader className="animate-spin" /> : <FiFlag />}
              {busy[`report-${reportDialog.postId}`] ? "Submitting..." : "Submit report"}
            </button>
          </>
        }
      >
        <div className="space-y-5">
          <div className="rounded-[20px] border border-rose-100 bg-rose-50 px-4 py-4">
            <p className="text-sm font-bold text-rose-700">
              Report reels that contain abusive language, illegal activity, sexual content, threats, or other unsafe material.
            </p>
            {activeReportPost ? (
              <p className="mt-2 text-xs font-semibold text-rose-600">
                Reporting: {activeReportPost.author?.name || "Member"} {activeReportPost.headline ? `- ${activeReportPost.headline}` : ""}
              </p>
            ) : null}
          </div>

          <label className="block">
            <span className="mb-2 block text-xs font-black uppercase tracking-[0.18em] text-slate-400">Reason</span>
            <select
              value={reportDialog.reason}
              onChange={(event) => setReportDialog((prev) => ({ ...prev, reason: event.target.value }))}
              className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none transition focus:border-slate-900 focus:bg-white"
            >
              {reelReportReasonOptions.map((reason) => (
                <option key={reason} value={reason}>
                  {reason}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-2 block text-xs font-black uppercase tracking-[0.18em] text-slate-400">
              {reportDialog.reason === "Other" ? "Tell us more" : "Extra details"}
            </span>
            <textarea
              value={reportDialog.details}
              onChange={(event) => setReportDialog((prev) => ({ ...prev, details: event.target.value }))}
              rows={5}
              placeholder={
                reportDialog.reason === "Other"
                  ? "Write why this reel should be reviewed."
                  : "Optional: add a short explanation to help review this reel."
              }
              className="w-full rounded-[24px] border border-slate-200 bg-slate-50 px-4 py-4 text-sm leading-7 outline-none transition focus:border-slate-900 focus:bg-white"
            />
          </label>

          <p className="text-xs font-semibold text-slate-500">
            Reels that receive repeated or severe reports are automatically hidden from Explore.
          </p>
        </div>
      </Modal>

      <CareerPulseCommentsModal
        open={commentsPanel.open}
        post={activeCommentsPost}
        viewer={feed.viewer}
        comments={commentsPanel.comments}
        totalComments={commentsPanel.total}
        loading={commentsPanel.loading}
        loadingMore={commentsPanel.loadingMore}
        hasMore={commentsPanel.hasMore}
        draft={commentDrafts[commentsPanel.postId] || ""}
        submitting={busy[`comment-${commentsPanel.postId}`]}
        onDraftChange={(value) => setCommentDrafts((prev) => ({ ...prev, [commentsPanel.postId]: value }))}
        onSubmit={() => handleComment(commentsPanel.postId)}
        onClose={closeComments}
        onLoadMore={() => commentsPanel.postId && commentsPanel.hasMore && !commentsPanel.loadingMore ? loadComments(commentsPanel.postId, { offset: Number(commentsPanel.nextOffset || commentsPanel.comments.length || 0), reset: false }) : null}
        onReply={(comment) => setCommentDrafts((prev) => ({ ...prev, [commentsPanel.postId]: `@${String(comment?.author?.name || "").trim().replace(/\s+/g, "_")} ` }))}
        timeAgo={timeAgo}
        AvatarComponent={Avatar}
      />

      {exploreNotificationPopup ? (
        <button
          type="button"
          onClick={() => {
            const nextItem = exploreNotificationPopup;
            setExploreNotificationPopup(null);
            void handleOpenExploreNotification(nextItem);
          }}
          className="fixed right-5 top-5 z-[130] w-full max-w-[360px] rounded-[24px] border border-black/10 bg-white/95 px-4 py-4 text-left shadow-[0_24px_70px_rgba(15,23,42,0.18)] backdrop-blur"
        >
          <div className="flex items-start gap-3">
            <Avatar
              name={exploreNotificationPopup.actor?.name || "Explore"}
              avatarUrl={exploreNotificationPopup.actor?.avatarUrl}
              small
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="truncate text-sm font-black text-slate-900">
                  {exploreNotificationPopup.title || "Explore notification"}
                </p>
                {!exploreNotificationPopup.readAt ? <span className="h-2 w-2 rounded-full bg-[#111111]" /> : null}
              </div>
              <p className="mt-1 line-clamp-2 text-sm leading-6 text-slate-600">
                {exploreNotificationPopup.message}
              </p>
              <p className="mt-2 text-xs font-semibold text-slate-400">
                {timeAgo(exploreNotificationPopup.createdAt)}
              </p>
            </div>
            <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">
              Explore
            </span>
          </div>
        </button>
      ) : null}

    </div>
  );
}
