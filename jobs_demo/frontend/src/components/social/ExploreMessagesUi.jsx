import {
  FiBell,
  FiBellOff,
  FiCheck,
  FiChevronDown,
  FiEdit3,
  FiFlag,
  FiImage,
  FiInfo,
  FiLoader,
  FiMessageCircle,
  FiMic,
  FiMoreHorizontal,
  FiBookmark,
  FiSearch,
  FiSend,
  FiSmile,
  FiTrash2,
  FiX,
  FiCornerUpLeft,
  FiSquare,
} from "react-icons/fi";
import { useEffect, useMemo, useRef, useState } from "react";
import { Avatar } from "./ExploreReelUi.jsx";

const STORAGE_KEY = "explore-message-ui-prefs-v1";
const CLEAN_QUICK_EMOJIS = ["😀", "😂", "😍", "🔥", "👏", "👍", "🙏", "🎉", "❤️", "😎", "😭", "💯"];
const HEART_REACTION = "❤️";
const DOUBLE_TICK = "✓✓";
const QUICK_EMOJIS = ["😀", "😂", "😍", "🔥", "👏", "👍", "🙏", "🎉", "❤️", "😎", "😭", "💯"];

const REACTION_EMOJIS = [
  "\u{1F600}",
  "\u{1F602}",
  "\u{1F60D}",
  "\u{1F525}",
  "\u{1F44F}",
  "\u{1F44D}",
  "\u{1F64F}",
  "\u{1F389}",
  "\u2764\uFE0F",
  "\u{1F60E}",
  "\u{1F62D}",
  "\u{1F4AF}",
];
const SAFE_HEART_REACTION = "\u2764\uFE0F";
const SAFE_DOUBLE_TICK = "\u2713\u2713";

function scrollConversationToBottom(node, behavior = "auto") {
  if (!node) return;
  node.scrollTo({ top: node.scrollHeight, behavior });
}

function ReactionPicker({ onPick }) {
  return (
    <div className="absolute bottom-10 left-0 z-20 flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2 py-1.5 shadow-[0_18px_48px_rgba(15,23,42,0.16)]">
      {REACTION_EMOJIS.slice(0, 6).map((emoji) => (
        <button
          key={emoji}
          type="button"
          onClick={() => onPick?.(emoji)}
          className="inline-flex h-8 w-8 items-center justify-center rounded-full text-base transition hover:bg-slate-100"
        >
          {emoji}
        </button>
      ))}
    </div>
  );
}

function bubbleTime(value, timeAgo) {
  return value ? timeAgo(value) : "Now";
}

function activeLabel(value, timeAgo) {
  const text = bubbleTime(value, timeAgo);
  return text === "Now" ? "Active now" : `Active ${text} ago`;
}

function formatDateDivider(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString(undefined, {
    weekday: "short",
    hour: "numeric",
    minute: "2-digit",
  });
}

function shouldShowDivider(current, previous) {
  if (!current?.createdAt) return false;
  if (!previous?.createdAt) return true;
  const currentDate = new Date(current.createdAt);
  const previousDate = new Date(previous.createdAt);
  if (Number.isNaN(currentDate.getTime()) || Number.isNaN(previousDate.getTime())) return false;
  return currentDate.toDateString() !== previousDate.toDateString() || currentDate - previousDate > 1000 * 60 * 45;
}

function loadPrefs() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    return {
      pinnedThreadIds: Array.isArray(parsed?.pinnedThreadIds) ? parsed.pinnedThreadIds : [],
      mutedThreadIds: Array.isArray(parsed?.mutedThreadIds) ? parsed.mutedThreadIds : [],
      hiddenThreadIds: Array.isArray(parsed?.hiddenThreadIds) ? parsed.hiddenThreadIds : [],
      unreadThreadIds: Array.isArray(parsed?.unreadThreadIds) ? parsed.unreadThreadIds : [],
    };
  } catch {
    return { pinnedThreadIds: [], mutedThreadIds: [], hiddenThreadIds: [], unreadThreadIds: [] };
  }
}

function savePrefs(nextPrefs) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextPrefs));
  } catch {
    // ignore
  }
}

function MessageMenu({
  message,
  selected,
  onClose,
  onReply,
  onDelete,
  onReport,
  onToggleSelect,
  onEnterSelectionMode,
}) {
  return (
    <div className="absolute bottom-12 left-0 z-20 min-w-[210px] rounded-[22px] border border-slate-200 bg-white py-2 shadow-[0_18px_48px_rgba(15,23,42,0.16)]">
      <div className="border-b border-slate-100 px-5 py-3 text-sm font-semibold text-slate-400">
        {formatDateDivider(message.createdAt) || "Message"}
      </div>
      {!message.deleted ? (
        <button type="button" onClick={() => { onReply?.(message); onClose?.(); }} className="flex w-full items-center justify-between px-5 py-3 text-left text-[15px] font-medium text-slate-800 hover:bg-slate-50">
          <span>Reply</span>
          <FiCornerUpLeft />
        </button>
      ) : null}
      <button
        type="button"
        onClick={() => {
          onEnterSelectionMode?.();
          onToggleSelect?.(message.id);
          onClose?.();
        }}
        className="flex w-full items-center justify-between px-5 py-3 text-left text-[15px] font-medium text-slate-800 hover:bg-slate-50"
      >
        <span>{selected ? "Unselect" : "Select"}</span>
        <FiCheck />
      </button>
      {message.canDelete ? (
        <button type="button" onClick={() => { onDelete?.(message); onClose?.(); }} className="flex w-full items-center justify-between px-5 py-3 text-left text-[15px] font-medium text-rose-500 hover:bg-rose-50">
          <span>Unsend</span>
          <FiTrash2 />
        </button>
      ) : null}
      {message.canReport ? (
        <button type="button" onClick={() => { onReport?.(message); onClose?.(); }} className="flex w-full items-center justify-between px-5 py-3 text-left text-[15px] font-medium text-[#d97706] hover:bg-amber-50">
          <span>Report</span>
          <FiFlag />
        </button>
      ) : null}
    </div>
  );
}

function ThreadMenu({ muted, pinned, unread, onToggleUnread, onTogglePin, onToggleMute, onHide }) {
  return (
    <div className="absolute right-0 top-10 z-20 min-w-[220px] rounded-[22px] border border-slate-200 bg-white py-2 shadow-[0_18px_48px_rgba(15,23,42,0.16)]">
      <button type="button" onClick={onToggleUnread} className="flex w-full items-center justify-between px-5 py-3 text-left text-[15px] font-medium text-slate-800 hover:bg-slate-50">
        <span>{unread ? "Mark as read" : "Mark as unread"}</span>
        <FiBell />
      </button>
      <button type="button" onClick={onTogglePin} className="flex w-full items-center justify-between px-5 py-3 text-left text-[15px] font-medium text-slate-800 hover:bg-slate-50">
        <span>{pinned ? "Unpin" : "Pin"}</span>
        <FiBookmark />
      </button>
      <button type="button" onClick={onToggleMute} className="flex w-full items-center justify-between px-5 py-3 text-left text-[15px] font-medium text-slate-800 hover:bg-slate-50">
        <span>{muted ? "Unmute" : "Mute"}</span>
        <FiBellOff />
      </button>
      <button type="button" onClick={onHide} className="flex w-full items-center justify-between px-5 py-3 text-left text-[15px] font-medium text-rose-500 hover:bg-rose-50">
        <span>Delete chat</span>
        <FiTrash2 />
      </button>
    </div>
  );
}

function HeaderMenu({
  canReport,
  muted,
  onSendAccount,
  onReport,
  onToggleMute,
  onOpenDetails,
  onSelectMessages,
  onDeleteChat,
}) {
  return (
    <div className="absolute right-0 top-12 z-20 min-w-[240px] rounded-[22px] border border-slate-200 bg-white py-2 shadow-[0_18px_48px_rgba(15,23,42,0.16)]">
      <button
        type="button"
        onClick={onSendAccount}
        className="flex w-full items-center justify-between px-5 py-3 text-left text-[15px] font-medium text-slate-800 hover:bg-slate-50"
      >
        <span>Send account</span>
        <FiSend />
      </button>
      <button
        type="button"
        onClick={onSelectMessages}
        className="flex w-full items-center justify-between px-5 py-3 text-left text-[15px] font-medium text-slate-800 hover:bg-slate-50"
      >
        <span>Select messages</span>
        <FiCheck />
      </button>
      <button
        type="button"
        onClick={onToggleMute}
        className="flex w-full items-center justify-between px-5 py-3 text-left text-[15px] font-medium text-slate-800 hover:bg-slate-50"
      >
        <span>{muted ? "Unmute messages" : "Mute messages"}</span>
        {muted ? <FiBellOff /> : <FiBell />}
      </button>
      <button
        type="button"
        onClick={onOpenDetails}
        className="flex w-full items-center justify-between px-5 py-3 text-left text-[15px] font-medium text-slate-800 hover:bg-slate-50"
      >
        <span>View profile details</span>
        <FiInfo />
      </button>
      {canReport ? (
        <button
          type="button"
          onClick={onReport}
          className="flex w-full items-center justify-between px-5 py-3 text-left text-[15px] font-medium text-[#d97706] hover:bg-amber-50"
        >
          <span>Report</span>
          <FiFlag />
        </button>
      ) : null}
      <button
        type="button"
        onClick={onDeleteChat}
        className="flex w-full items-center justify-between px-5 py-3 text-left text-[15px] font-medium text-rose-500 hover:bg-rose-50"
      >
        <span>Delete chat</span>
        <FiTrash2 />
      </button>
    </div>
  );
}

function ThreadRow({ thread, active, timeAgo, muted, pinned, unread, onClick, onToggleUnread, onTogglePin, onToggleMute, onHide }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [reactionPickerOpen, setReactionPickerOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!menuOpen && !reactionPickerOpen) return undefined;
    const handlePointerDown = (event) => {
      if (!menuRef.current?.contains(event.target)) {
        setMenuOpen(false);
        setReactionPickerOpen(false);
      }
    };
    window.addEventListener("pointerdown", handlePointerDown);
    return () => window.removeEventListener("pointerdown", handlePointerDown);
  }, [menuOpen, reactionPickerOpen]);

  return (
    <div className={`group relative flex items-center gap-3 px-6 py-3 transition ${active ? "bg-[#f4f6f8]" : "hover:bg-[#fafafa]"}`}>
      <button type="button" onClick={onClick} className="flex min-w-0 flex-1 items-center gap-4 text-left">
        <div className="relative shrink-0">
          <Avatar name={thread.participant?.name} avatarUrl={thread.participant?.avatarUrl} />
          {thread.unread || unread ? <span className="absolute -right-0.5 bottom-1 h-3 w-3 rounded-full bg-[#4f46e5]" /> : null}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate text-[16px] font-semibold text-slate-900">{thread.participant?.name || "Explore member"}</p>
            {pinned ? <FiBookmark className="text-[12px] text-[#0f766e]" /> : null}
            {muted ? <FiBellOff className="text-[12px] text-slate-400" /> : null}
          </div>
          <p className="mt-1 truncate text-[14px] text-slate-600">
            {thread.preview || thread.participant?.headline || "Explore chat"} <span className="text-slate-400">{"\u00B7"} {bubbleTime(thread.updatedAt, timeAgo)}</span>
          </p>
        </div>
      </button>
      <div ref={menuRef} className="relative">
        <button type="button" onClick={() => setMenuOpen((prev) => !prev)} className={`inline-flex h-9 w-9 items-center justify-center rounded-full text-slate-500 ${active || menuOpen ? "bg-white shadow-sm" : "opacity-0 group-hover:opacity-100"}`}>
          <FiMoreHorizontal />
        </button>
        {menuOpen ? (
          <ThreadMenu
            muted={muted}
            pinned={pinned}
            unread={unread}
            onToggleUnread={() => { onToggleUnread?.(); setMenuOpen(false); }}
            onTogglePin={() => { onTogglePin?.(); setMenuOpen(false); }}
            onToggleMute={() => { onToggleMute?.(); setMenuOpen(false); }}
            onHide={() => { onHide?.(); setMenuOpen(false); }}
          />
        ) : null}
      </div>
    </div>
  );
}

function MessageBubble({
  message,
  previousMessage,
  timeAgo,
  selectionMode,
  selected,
  onReply,
  onDelete,
  onReport,
  onToggleSelect,
  onToggleReaction,
  onEnterSelectionMode,
}) {
  const self = message.sender === "self";
  const [menuOpen, setMenuOpen] = useState(false);
  const [reactionPickerOpen, setReactionPickerOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!menuOpen && !reactionPickerOpen) return undefined;
    const handlePointerDown = (event) => {
      if (!menuRef.current?.contains(event.target)) {
        setMenuOpen(false);
        setReactionPickerOpen(false);
      }
    };
    window.addEventListener("pointerdown", handlePointerDown);
    return () => window.removeEventListener("pointerdown", handlePointerDown);
  }, [menuOpen, reactionPickerOpen]);

  if (message.sender === "system") {
    return <div className="py-3 text-center"><span className="inline-flex rounded-full bg-[#ecfdf5] px-4 py-2 text-xs font-semibold text-[#0f766e]">{message.text}</span></div>;
  }

  return (
    <div className="space-y-3">
      {shouldShowDivider(message, previousMessage) ? <p className="text-center text-[14px] text-slate-400">{formatDateDivider(message.createdAt)}</p> : null}
      <div className={`group flex ${self ? "justify-end" : "justify-start"}`}>
        <div className={`flex max-w-[82%] items-end gap-3 ${self ? "flex-row-reverse" : "flex-row"}`}>
          {selectionMode ? (
            <button
              type="button"
              onClick={() => onToggleSelect?.(message.id)}
              className={`inline-flex h-8 w-8 items-center justify-center rounded-lg border-2 shadow-sm ${
                selected
                  ? "border-[#0f766e] bg-[#0f766e] text-white"
                  : "border-[#cbd5e1] bg-white text-slate-300"
              }`}
            >
              <FiCheck />
            </button>
          ) : null}
          <div
            className="relative"
            ref={menuRef}
            onTouchStart={() => {
              if (!selectionMode) setMenuOpen(true);
            }}
          >
            <div className={`rounded-[22px] px-4 py-3 ${self ? "rounded-br-[10px] bg-[linear-gradient(135deg,#0f172a_0%,#111827_100%)] text-white" : "rounded-bl-[10px] bg-[#f3f5f7] text-slate-900"}`}>
              {message.replyTo?.id ? (
                <div className={`mb-3 rounded-2xl px-3 py-2 text-xs ${self ? "bg-white/10 text-white/75" : "bg-white text-slate-500"}`}>
                  <p className="font-semibold">{message.replyTo.sender === "self" ? "You" : "Reply"}</p>
                  <p className="truncate">{message.replyTo.text || "Message"}</p>
                </div>
              ) : null}
              <p className={`whitespace-pre-wrap text-[15px] leading-7 ${message.deleted ? "italic opacity-70" : ""}`}>{message.text}</p>
              {message.fileUrl && String(message.mimeType || "").startsWith("image/") ? (
                <img src={message.fileUrl} alt={message.fileName || "Attachment"} className="mt-3 max-w-[250px] rounded-2xl object-cover" />
              ) : null}
              {message.fileUrl && String(message.mimeType || "").startsWith("video/") ? (
                <video controls className="mt-3 max-w-[250px] rounded-2xl">
                  <source src={message.fileUrl} type={message.mimeType || "video/mp4"} />
                </video>
              ) : null}
              {message.fileUrl && String(message.mimeType || "").startsWith("audio/") ? (
                <audio controls className="mt-3 w-full max-w-[250px]">
                  <source src={message.fileUrl} type={message.mimeType || "audio/webm"} />
                </audio>
              ) : null}
              {message.reactions?.length ? (
                <div className="mt-2 flex flex-wrap gap-1">
                  {message.reactions.map((reaction, index) => (
                    <span key={`${reaction}-${index}`} className={`rounded-full px-2 py-0.5 text-xs shadow-sm ${self ? "bg-white/15 text-white" : "bg-white text-slate-700"}`}>
                      {reaction}
                    </span>
                  ))}
                </div>
              ) : null}
              {self ? (
                <div className="mt-1 text-right text-[10px] text-gray-300">
                  {message.seenByOther ? `${SAFE_DOUBLE_TICK} Seen` : `${SAFE_DOUBLE_TICK} Delivered`}
                </div>
              ) : null}
            </div>
            {!selectionMode ? (
              <div className={`mt-2 flex items-center gap-3 px-2 text-slate-500 opacity-0 transition group-hover:opacity-100 ${self ? "justify-end" : "justify-start"}`}>
                <button
                  type="button"
                  onClick={() => onToggleReaction?.(message.id, SAFE_HEART_REACTION)}
                  className="text-[18px] transition hover:scale-110"
                >
                  {SAFE_HEART_REACTION}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    setReactionPickerOpen((prev) => !prev);
                  }}
                  className="text-[19px] transition hover:scale-110"
                >
                  <FiSmile />
                </button>
                <button type="button" onClick={() => onReply?.(message)} className="text-[19px]"><FiCornerUpLeft /></button>
                <button
                  type="button"
                  onClick={() => {
                    setReactionPickerOpen(false);
                    setMenuOpen((prev) => !prev);
                  }}
                  className="text-[19px]"
                >
                  <FiMoreHorizontal />
                </button>
                {reactionPickerOpen ? (
                  <ReactionPicker
                    onPick={(emoji) => {
                      onToggleReaction?.(message.id, emoji);
                      setReactionPickerOpen(false);
                    }}
                  />
                ) : null}
                {menuOpen ? (
                  <MessageMenu
                    message={message}
                    selected={selected}
                    onClose={() => setMenuOpen(false)}
                    onReply={onReply}
                    onDelete={onDelete}
                    onReport={onReport}
                    onToggleSelect={onToggleSelect}
                    onEnterSelectionMode={onEnterSelectionMode}
                  />
                ) : null}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ExploreMessagesUi({
  viewer,
  threads = [],
  activeThread,
  messages = [],
  draft = "",
  attachmentPreview = "",
  attachmentName = "",
  attachmentMimeType = "",
  attachmentUploading = false,
  replyTarget = null,
  selectedMessageIds = [],
  loadingList = false,
  loadingThread = false,
  sending = false,
  deleting = false,
  onSelectThread,
  onDraftChange,
  onSend,
  onAccept,
  onReplyMessage,
  onDeleteMessage,
  onDeleteSelected,
  onDeleteChat,
  onReportMessage,
  onSendAccount,
  onToggleReaction,
  onToggleMessageSelection,
  onClearSelection,
  onAttachmentSelect,
  onAttachmentClear,
  onCancelReply,
  onRefresh,
  timeAgo,
  requests = 0,
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectionMode, setSelectionMode] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [headerMenuOpen, setHeaderMenuOpen] = useState(false);
  const [typingUser, setTypingUser] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState({});
  const [recording, setRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [prefs, setPrefs] = useState(() => loadPrefs());
  const messagesEndRef = useRef(null);
  const conversationScrollRef = useRef(null);
  const fileInputRef = useRef(null);
  const typingTimerRef = useRef(null);
  const headerMenuRef = useRef(null);
  const recorderRef = useRef(null);
  const recorderChunksRef = useRef([]);
  const recordStreamRef = useRef(null);
  const recordTimerRef = useRef(null);
  const discardRecordingRef = useRef(false);
  const shouldStickToBottomRef = useRef(true);
  const previousThreadIdRef = useRef("");
  const previousMessageSnapshotRef = useRef({ length: 0, lastId: "" });
  const pendingInitialThreadScrollRef = useRef(false);
  const sendRecordingAfterStopRef = useRef(false);
  const pendingVoiceSendRef = useRef(false);

  useEffect(() => {
    savePrefs(prefs);
  }, [prefs]);

  useEffect(() => {
    setSelectionMode(false);
  }, [activeThread?.id]);

  useEffect(() => {
    if (!selectedMessageIds.length) setSelectionMode(false);
  }, [selectedMessageIds.length]);

  useEffect(() => {
    setEmojiOpen(false);
    setHeaderMenuOpen(false);
  }, [activeThread?.id]);

  useEffect(() => {
    const node = conversationScrollRef.current;
    if (!node) return undefined;

    const handleScroll = () => {
      const distanceFromBottom = node.scrollHeight - node.scrollTop - node.clientHeight;
      shouldStickToBottomRef.current = distanceFromBottom < 48;
    };

    handleScroll();
    node.addEventListener("scroll", handleScroll);
    return () => node.removeEventListener("scroll", handleScroll);
  }, [activeThread?.id, loadingThread]);

  useEffect(() => {
    const nextThreadId = String(activeThread?.id || "");
    const lastMessageId = String(messages[messages.length - 1]?.id || "");
    const previousSnapshot = previousMessageSnapshotRef.current;

    if (previousThreadIdRef.current !== nextThreadId) {
      previousThreadIdRef.current = nextThreadId;
      shouldStickToBottomRef.current = true;
      previousMessageSnapshotRef.current = { length: messages.length, lastId: lastMessageId };
      pendingInitialThreadScrollRef.current = true;
      window.requestAnimationFrame(() => {
        scrollConversationToBottom(conversationScrollRef.current, "auto");
      });
      return;
    }

    const appendedNewMessage =
      messages.length > previousSnapshot.length &&
      lastMessageId &&
      lastMessageId !== previousSnapshot.lastId;

    previousMessageSnapshotRef.current = { length: messages.length, lastId: lastMessageId };

    if (pendingInitialThreadScrollRef.current) {
      pendingInitialThreadScrollRef.current = false;
      window.requestAnimationFrame(() => {
        scrollConversationToBottom(conversationScrollRef.current, "auto");
      });
      return;
    }

    if (!appendedNewMessage) return;
    if (!shouldStickToBottomRef.current) return;
    window.requestAnimationFrame(() => {
      scrollConversationToBottom(conversationScrollRef.current, "smooth");
    });
  }, [activeThread?.id, messages]);

  useEffect(
    () => () => {
      if (typingTimerRef.current) window.clearTimeout(typingTimerRef.current);
      if (recordTimerRef.current) window.clearInterval(recordTimerRef.current);
      if (recorderRef.current && recorderRef.current.state !== "inactive") {
        recorderRef.current.stop();
      } else {
        stopRecordingStream();
      }
    },
    []
  );

  useEffect(() => {
    if (!headerMenuOpen) return undefined;
    const handlePointerDown = (event) => {
      if (!headerMenuRef.current?.contains(event.target)) {
        setHeaderMenuOpen(false);
      }
    };
    window.addEventListener("pointerdown", handlePointerDown);
    return () => window.removeEventListener("pointerdown", handlePointerDown);
  }, [headerMenuOpen]);

  useEffect(() => {
    if (!activeThread?.id) return;
    setOnlineUsers((prev) => ({ ...prev, [activeThread.id]: true }));
  }, [activeThread?.id]);

  useEffect(() => {
    if (
      pendingVoiceSendRef.current &&
      !attachmentUploading &&
      attachmentPreview &&
      String(attachmentMimeType || "").startsWith("audio/")
    ) {
      pendingVoiceSendRef.current = false;
      onSend?.();
    }
  }, [attachmentMimeType, attachmentPreview, attachmentUploading, onSend]);

  const visibleThreads = useMemo(() => {
    const query = String(searchQuery || "").trim().toLowerCase();
    return threads
      .filter((thread) => !prefs.hiddenThreadIds.includes(thread.id))
      .filter((thread) => {
        if (!query) return true;
        return `${thread.participant?.name || ""} ${thread.participant?.headline || ""} ${thread.preview || ""}`.toLowerCase().includes(query);
      })
      .sort((left, right) => {
        const leftPinned = prefs.pinnedThreadIds.includes(left.id);
        const rightPinned = prefs.pinnedThreadIds.includes(right.id);
        if (leftPinned !== rightPinned) return Number(rightPinned) - Number(leftPinned);
        return new Date(right.updatedAt || 0) - new Date(left.updatedAt || 0);
      });
  }, [prefs.hiddenThreadIds, prefs.pinnedThreadIds, searchQuery, threads]);

  const latestIncomingMessage = useMemo(() => [...messages].reverse().find((message) => message.canReport && !message.deleted && message.sender !== "system") || null, [messages]);
  const latestOwnMessage = useMemo(() => [...messages].reverse().find((message) => message.canDelete && !message.deleted && message.sender === "self") || null, [messages]);
  const threadMuted = activeThread ? prefs.mutedThreadIds.includes(activeThread.id) : false;

  const updatePrefs = (updater) => setPrefs((prev) => updater(prev));
  const togglePrefId = (key, id) => updatePrefs((prev) => ({ ...prev, [key]: prev[key].includes(id) ? prev[key].filter((item) => item !== id) : [...prev[key], id] }));
  const appendEmoji = (emoji) => {
    onDraftChange?.(`${String(draft || "")}${emoji}`);
    setEmojiOpen(false);
  };
  const startSelectionMode = () => setSelectionMode(true);
  const formatRecordingTime = (value) => {
    const total = Math.max(0, Number(value || 0));
    const mins = Math.floor(total / 60);
    const secs = total % 60;
    return `${mins}:${String(secs).padStart(2, "0")}`;
  };

  const stopRecordingStream = () => {
    if (recordStreamRef.current) {
      recordStreamRef.current.getTracks().forEach((track) => track.stop());
      recordStreamRef.current = null;
    }
  };

  const startVoiceRecording = async () => {
    if (recording) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = MediaRecorder.isTypeSupported("audio/webm")
        ? "audio/webm"
        : "";
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      recorderChunksRef.current = [];
      recordStreamRef.current = stream;
      recorderRef.current = recorder;
      discardRecordingRef.current = false;
      sendRecordingAfterStopRef.current = false;
      setRecordingSeconds(0);
      if (recordTimerRef.current) window.clearInterval(recordTimerRef.current);
      recordTimerRef.current = window.setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);

      recorder.addEventListener("dataavailable", (event) => {
        if (event.data && event.data.size > 0) {
          recorderChunksRef.current.push(event.data);
        }
      });

      recorder.addEventListener("stop", () => {
        if (recordTimerRef.current) {
          window.clearInterval(recordTimerRef.current);
          recordTimerRef.current = null;
        }
        const blob = new Blob(recorderChunksRef.current, {
          type: recorder.mimeType || "audio/webm",
        });
        if (!discardRecordingRef.current && blob.size > 0) {
          const extension = blob.type.includes("ogg") ? "ogg" : "webm";
          const file = new File([blob], `voice-message-${Date.now()}.${extension}`, {
            type: blob.type || "audio/webm",
          });
          onAttachmentSelect?.({
            file,
            preview: URL.createObjectURL(blob),
          });
        }
        stopRecordingStream();
        recorderRef.current = null;
        recorderChunksRef.current = [];
        setRecordingSeconds(0);
        const shouldSendAfterStop = sendRecordingAfterStopRef.current;
        discardRecordingRef.current = false;
        sendRecordingAfterStopRef.current = false;
        if (shouldSendAfterStop) {
          pendingVoiceSendRef.current = true;
        }
      });

      recorder.start();
      setRecording(true);
    } catch {
      setRecording(false);
    }
  };

  const stopVoiceRecording = ({ discard = false, sendAfterStop = false } = {}) => {
    discardRecordingRef.current = discard;
    sendRecordingAfterStopRef.current = sendAfterStop;
    if (discard) {
      pendingVoiceSendRef.current = false;
    }
    if (recorderRef.current && recorderRef.current.state !== "inactive") {
      recorderRef.current.stop();
    } else {
      stopRecordingStream();
    }
    if (recordTimerRef.current) {
      window.clearInterval(recordTimerRef.current);
      recordTimerRef.current = null;
    }
    setRecording(false);
  };

  return (
    <div className="h-[calc(100vh-130px)] min-h-[640px] w-full overflow-hidden rounded-[24px] border border-[#dfe5ec] bg-white shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
      <div className={`grid h-full ${detailsOpen ? "xl:grid-cols-[330px_minmax(0,1fr)_300px]" : "xl:grid-cols-[330px_minmax(0,1fr)]"}`}>
        <aside className="w-full border-r border-[#e8edf2] bg-white xl:w-[330px]">
          <div className="border-b border-[#eef2f6] px-6 py-6">
            <div className="flex items-center justify-between">
              <button type="button" className="inline-flex items-center gap-2 text-[18px] font-bold text-slate-900">
                <span>{viewer?.name || "Explore"}</span>
                <FiChevronDown className="text-[18px] text-slate-500" />
              </button>
              <button type="button" onClick={onRefresh} className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[#e6ebf1] text-slate-700 hover:bg-slate-50">
                {loadingList ? <FiLoader className="animate-spin" /> : <FiEdit3 />}
              </button>
            </div>
            <div className="relative mt-5">
              <FiSearch className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[18px] text-slate-400" />
              <input value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Search" className="h-12 w-full rounded-full bg-[#f4f6f8] pl-12 pr-4 text-[15px] text-slate-800 outline-none placeholder:text-slate-400" />
            </div>
          </div>
          <div className="flex items-center justify-between px-6 py-4">
            <h3 className="text-[28px] font-bold tracking-tight text-slate-900">Messages</h3>
            <span className="text-[14px] font-medium text-slate-500">{requests ? `${requests} Requests` : "Requests"}</span>
          </div>
          <div className="max-h-[590px] space-y-1 overflow-y-auto pb-4">
            {loadingList ? (
              <div className="px-6 py-12 text-center text-sm font-medium text-slate-500"><FiLoader className="mx-auto mb-3 animate-spin text-[20px]" />Loading messages...</div>
            ) : visibleThreads.length ? (
              visibleThreads.map((thread) => (
                <ThreadRow
                  key={thread.id}
                  thread={thread}
                  active={thread.id === activeThread?.id}
                  timeAgo={timeAgo}
                  muted={prefs.mutedThreadIds.includes(thread.id)}
                  pinned={prefs.pinnedThreadIds.includes(thread.id)}
                  unread={prefs.unreadThreadIds.includes(thread.id)}
                  onClick={() => onSelectThread?.(thread)}
                  onToggleUnread={() => togglePrefId("unreadThreadIds", thread.id)}
                  onTogglePin={() => togglePrefId("pinnedThreadIds", thread.id)}
                  onToggleMute={() => togglePrefId("mutedThreadIds", thread.id)}
                  onHide={() => updatePrefs((prev) => ({ ...prev, hiddenThreadIds: [...prev.hiddenThreadIds, thread.id] }))}
                />
              ))
            ) : <div className="px-6 py-14 text-center text-sm text-slate-500">No Explore chats found.</div>}
          </div>
        </aside>
        <section className="flex min-h-[760px] flex-col bg-white">
          {activeThread ? (
            <>
              <div className="flex items-center justify-between border-b border-[#eef2f6] px-6 py-5">
                <button
                  type="button"
                  onClick={() => setDetailsOpen(true)}
                  className="flex min-w-0 items-center gap-3 text-left"
                >
                  <div className="relative">
                    <Avatar name={activeThread.participant?.name} avatarUrl={activeThread.participant?.avatarUrl} />
                    {onlineUsers[activeThread?.id] ? <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-green-500" /> : null}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-[22px] font-semibold text-slate-900">{activeThread.participant?.name || "Explore member"}</p>
                    <p className="truncate text-[15px] text-slate-500">
                      {activeThread.type === "request_received"
                        ? "Sent you a message request"
                        : activeThread.type === "request_sent"
                          ? "Waiting for acceptance"
                          : activeLabel(activeThread.updatedAt, timeAgo)}
                    </p>
                    <p className="truncate text-[13px] text-slate-400">
                      {activeThread.participant?.headline || "Explore profile"}
                    </p>
                  </div>
                </button>
                <div className="flex items-center gap-3 text-slate-900">
                  <button type="button" onClick={() => setDetailsOpen((prev) => !prev)} className="text-[28px]" aria-label="Details"><FiInfo /></button>
                  <div ref={headerMenuRef} className="relative">
                    <button
                      type="button"
                      onClick={() => setHeaderMenuOpen((prev) => !prev)}
                      className="inline-flex h-10 w-10 items-center justify-center rounded-full text-[24px] text-slate-700 transition hover:bg-slate-100"
                      aria-label="More options"
                    >
                      <FiMoreHorizontal />
                    </button>
                    {headerMenuOpen ? (
                      <HeaderMenu
                        canReport={Boolean(latestIncomingMessage)}
                        muted={threadMuted}
                        onSendAccount={() => {
                          onSendAccount?.();
                          setHeaderMenuOpen(false);
                        }}
                        onReport={() => {
                          if (latestIncomingMessage) onReportMessage?.(latestIncomingMessage);
                          setHeaderMenuOpen(false);
                        }}
                        onToggleMute={() => {
                          if (activeThread) togglePrefId("mutedThreadIds", activeThread.id);
                          setHeaderMenuOpen(false);
                        }}
                        onOpenDetails={() => {
                          setDetailsOpen(true);
                          setHeaderMenuOpen(false);
                        }}
                        onSelectMessages={() => {
                          startSelectionMode();
                          setHeaderMenuOpen(false);
                        }}
                        onDeleteChat={() => {
                          onDeleteChat?.();
                          setHeaderMenuOpen(false);
                        }}
                      />
                    ) : null}
                  </div>
                </div>
              </div>
              <div ref={conversationScrollRef} className="flex-1 overflow-y-auto px-6 py-6">
                {loadingThread ? (
                  <div className="flex h-full items-center justify-center text-sm font-medium text-slate-500"><FiLoader className="mr-2 animate-spin text-[18px]" />Loading conversation...</div>
                ) : messages.length ? (
                  <div className="space-y-2">
                    {messages.map((message, index) => (
                      <MessageBubble
                        key={message.id}
                        message={message}
                        previousMessage={messages[index - 1]}
                        timeAgo={timeAgo}
                        selectionMode={selectionMode}
                        selected={selectedMessageIds.includes(message.id)}
                        onReply={onReplyMessage}
                        onDelete={onDeleteMessage}
                        onReport={onReportMessage}
                        onToggleSelect={onToggleMessageSelection}
                        onToggleReaction={onToggleReaction}
                        onEnterSelectionMode={startSelectionMode}
                      />
                    ))}
                    <div ref={messagesEndRef}></div>
                  </div>
                ) : activeThread.type === "request_sent" || activeThread.type === "request_received" ? (
                  <div className="flex h-full items-center justify-center text-center">
                    <div>
                      <FiMessageCircle className="mx-auto text-[56px] text-slate-300" />
                      <p className="mt-4 text-[22px] font-semibold text-slate-900">
                        {activeThread.type === "request_sent" ? "Request pending" : "Request received"}
                      </p>
                      <p className="mt-2 text-[15px] text-slate-500">
                        {activeThread.type === "request_sent"
                          ? "Wait until the user accepts your request."
                          : "Accept the request to start messaging."}
                      </p>
                      <div ref={messagesEndRef}></div>
                    </div>
                  </div>
                ) : (
                  <div className="flex h-full items-center justify-center text-center">
                    <div>
                      <FiMessageCircle className="mx-auto text-[56px] text-slate-300" />
                      <p className="mt-4 text-[22px] font-semibold text-slate-900">No messages yet</p>
                      <p className="mt-2 text-[15px] text-slate-500">Start the Explore conversation here.</p>
                      <div ref={messagesEndRef}></div>
                    </div>
                  </div>
                )}
              </div>
              <div className="border-t border-[#eef2f6] px-6 py-5">
                {activeThread.canAccept ? (
                  <div className="flex items-center justify-between rounded-[22px] bg-[#eff6ff] px-5 py-4">
                    <p className="text-[15px] font-medium text-slate-700">This user sent you a message request. Accept to start chatting.</p>
                    <button type="button" onClick={onAccept} className="rounded-full bg-[linear-gradient(135deg,#0f766e_0%,#14b8a6_100%)] px-5 py-2.5 text-sm font-semibold text-white">Accept request</button>
                  </div>
                ) : activeThread.type === "request_sent" ? (
                  <div className="rounded-[22px] bg-[#fff7ed] px-5 py-4 text-[15px] font-medium text-[#c2410c]">Your request is waiting for approval. You can message once the other user accepts it.</div>
                ) : (
                  <div className="space-y-3">
                    {typingUser ? <div className="px-2 pb-1 text-sm text-slate-500 animate-pulse">typing...</div> : null}
                    {selectionMode ? (
                      <div className="flex items-center justify-between rounded-[22px] bg-[#f7f8fa] px-5 py-3">
                        <p className="text-[14px] font-medium text-slate-700">{selectedMessageIds.length} selected</p>
                        <div className="flex items-center gap-3">
                          <button type="button" onClick={() => { setSelectionMode(false); onClearSelection?.(); }} className="text-[14px] font-medium text-slate-500">Cancel</button>
                          <button type="button" disabled={!selectedMessageIds.length || deleting} onClick={onDeleteSelected} className="inline-flex items-center gap-2 rounded-full bg-[#111827] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
                            {deleting ? <FiLoader className="animate-spin" /> : <FiTrash2 />}Delete
                          </button>
                        </div>
                      </div>
                    ) : null}
                    {replyTarget?.id ? (
                      <div className="flex items-center justify-between rounded-[22px] bg-[#f8fafc] px-5 py-3">
                        <div className="min-w-0">
                          <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-[#0f766e]">Replying</p>
                          <p className="truncate text-[14px] text-slate-700">{replyTarget.text}</p>
                        </div>
                        <button type="button" onClick={onCancelReply} className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white text-slate-500 shadow-sm"><FiX /></button>
                      </div>
                    ) : null}
                    {attachmentPreview ? (
                      <div className="rounded-[22px] bg-[#f8fafc] p-3">
                        <div className="mb-2 flex items-center justify-between">
                          <p className="truncate text-sm font-medium text-slate-700">{attachmentName || "Attachment preview"}</p>
                          <button type="button" onClick={onAttachmentClear} className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white text-slate-500 shadow-sm">
                            <FiX />
                          </button>
                        </div>
                        {attachmentUploading ? (
                          <div className="flex items-center gap-2 text-sm text-slate-500">
                            <FiLoader className="animate-spin" />
                            Uploading attachment...
                          </div>
                        ) : String(attachmentMimeType || "").startsWith("video/") ? (
                          <video controls className="w-40 rounded-xl">
                            <source src={attachmentPreview} type={attachmentMimeType || "video/mp4"} />
                          </video>
                        ) : String(attachmentMimeType || "").startsWith("audio/") ? (
                          <audio controls className="w-full max-w-[260px]">
                            <source src={attachmentPreview} type={attachmentMimeType || "audio/webm"} />
                          </audio>
                        ) : (
                          <img src={attachmentPreview} alt="Preview" className="w-32 rounded-xl object-cover" />
                        )}
                      </div>
                    ) : null}
                    {recording ? (
                      <div className="flex items-center gap-3 rounded-full bg-[linear-gradient(90deg,#3b82f6_0%,#4f46e5_100%)] px-3 py-2 text-white shadow-[0_16px_40px_rgba(59,130,246,0.22)]">
                        <button
                          type="button"
                          onClick={() => stopVoiceRecording({ discard: true })}
                          className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-white/15 text-white transition hover:bg-white/20"
                          aria-label="Cancel recording"
                        >
                          <FiX className="text-[22px]" />
                        </button>
                        <button
                          type="button"
                          onClick={() => stopVoiceRecording()}
                          className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-white text-indigo-600 transition hover:bg-white/90"
                          aria-label="Stop recording"
                        >
                          <FiSquare className="text-[18px] fill-current" />
                        </button>
                        <div className="flex-1 px-2 text-center text-lg font-semibold tracking-wide">
                          {formatRecordingTime(recordingSeconds)}
                        </div>
                        <button
                          type="button"
                          onClick={() => stopVoiceRecording({ sendAfterStop: true })}
                          className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-white text-indigo-600 transition hover:bg-white/90"
                          aria-label="Send voice message"
                        >
                          <FiSend className="text-[20px]" />
                        </button>
                      </div>
                    ) : (
                      <div className="relative flex items-center gap-3 rounded-full border border-[#d9e1e8] px-4 py-3">
                        <button
                          type="button"
                          onClick={() => setEmojiOpen((prev) => !prev)}
                          className="text-[28px] text-slate-700"
                          aria-label="Emoji"
                        >
                          <FiSmile />
                        </button>
                        {emojiOpen ? (
                          <div className="absolute bottom-[calc(100%+12px)] left-0 z-20 w-[280px] rounded-[24px] border border-slate-200 bg-white p-4 shadow-[0_18px_48px_rgba(15,23,42,0.16)]">
                            <p className="mb-3 text-sm font-semibold text-slate-500">Choose an emoji</p>
                            <div className="grid grid-cols-6 gap-2">
                              {REACTION_EMOJIS.map((emoji) => (
                                <button
                                  key={emoji}
                                  type="button"
                                  onClick={() => appendEmoji(emoji)}
                                  className="inline-flex h-10 w-10 items-center justify-center rounded-2xl text-xl transition hover:bg-slate-100"
                                >
                                  {emoji}
                                </button>
                              ))}
                            </div>
                          </div>
                        ) : null}
                        <input
                          value={draft}
                          onChange={(event) => {
                            onDraftChange?.(event.target.value);
                            setTypingUser(true);
                            if (typingTimerRef.current) window.clearTimeout(typingTimerRef.current);
                            typingTimerRef.current = window.setTimeout(() => setTypingUser(false), 1500);
                          }}
                          onKeyDown={(event) => {
                            if (event.key === "Enter" && !event.shiftKey) {
                              event.preventDefault();
                              onSend?.();
                            }
                          }}
                          placeholder="Message..."
                          className="min-w-0 flex-1 bg-transparent text-[16px] text-slate-900 outline-none placeholder:text-slate-400"
                        />
                        <input
                          ref={fileInputRef}
                          type="file"
                          hidden
                          accept="image/*,video/*"
                          onChange={(event) => {
                            const file = event.target.files?.[0];
                            if (!file) return;
                            onAttachmentSelect?.({
                              file,
                              preview: URL.createObjectURL(file),
                            });
                            event.target.value = "";
                          }}
                        />
                        <button type="button" onClick={() => fileInputRef.current?.click()} className="text-[28px] text-slate-700" aria-label="Image"><FiImage /></button>
                        <button
                          type="button"
                          onClick={() => {
                            void startVoiceRecording();
                          }}
                          className={`text-[28px] ${recording ? "text-red-500" : "text-slate-700"}`}
                          aria-label="Microphone"
                        >
                          <FiMic />
                        </button>
                        <button type="button" disabled={(!(String(draft || "").trim() || attachmentPreview) || attachmentUploading) || sending} onClick={onSend} className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-[linear-gradient(135deg,#0f766e_0%,#14b8a6_100%)] text-white disabled:opacity-50" aria-label="Send">
                          {sending ? <FiLoader className="animate-spin" /> : <FiSend />}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex h-full items-center justify-center px-6 text-center">
              <div>
                <FiMessageCircle className="mx-auto text-[56px] text-slate-300" />
                <p className="mt-4 text-[22px] font-semibold text-slate-900">Select an Explore chat</p>
                <p className="mt-2 text-[15px] text-slate-500">Pick a conversation from the left to start messaging.</p>
              </div>
            </div>
          )}
        </section>
        {detailsOpen ? (
          <aside className="hidden border-l border-[#eef2f6] bg-white xl:flex xl:flex-col">
            <div className="border-b border-[#eef2f6] px-6 py-6"><h3 className="text-[20px] font-semibold text-slate-900">Details</h3></div>
            <div className="flex-1 overflow-y-auto px-6 py-6">
              <div className="flex items-center justify-between rounded-[22px] border border-[#edf1f5] px-5 py-4">
                <div className="flex items-center gap-3">
                  {threadMuted ? <FiBellOff className="text-[20px] text-slate-600" /> : <FiBell className="text-[20px] text-slate-600" />}
                  <span className="text-[16px] font-medium text-slate-900">Mute messages</span>
                </div>
                <button type="button" onClick={() => activeThread && togglePrefId("mutedThreadIds", activeThread.id)} className={`relative inline-flex h-8 w-14 rounded-full ${threadMuted ? "bg-[#0f766e]" : "bg-slate-300"}`}>
                  <span className={`absolute top-1 h-6 w-6 rounded-full bg-white transition ${threadMuted ? "left-7" : "left-1"}`} />
                </button>
              </div>
              <div className="mt-8">
                <p className="text-[14px] font-semibold text-slate-900">Members</p>
                <div className="mt-4 flex items-center gap-4">
                  <Avatar name={activeThread?.participant?.name} avatarUrl={activeThread?.participant?.avatarUrl} />
                  <div>
                    <p className="text-[18px] font-semibold text-slate-900">{activeThread?.participant?.name || "Explore member"}</p>
                    <p className="text-[15px] text-slate-500">{activeThread?.participant?.headline || "Explore member"}</p>
                  </div>
                </div>
              </div>
              <div className="mt-10 space-y-5 border-t border-[#eef2f6] pt-8">
                <button type="button" onClick={() => latestIncomingMessage && onReportMessage?.(latestIncomingMessage)} disabled={!latestIncomingMessage} className="text-left text-[18px] font-medium text-rose-500 disabled:opacity-40">Report</button>
                <button type="button" onClick={() => onDeleteChat?.()} className="text-left text-[18px] font-medium text-rose-500">Delete chat</button>
                <button type="button" onClick={() => setSelectionMode(true)} className="text-left text-[18px] font-medium text-slate-700">Select messages</button>
              </div>
            </div>
          </aside>
        ) : null}
      </div>
    </div>
  );
}

