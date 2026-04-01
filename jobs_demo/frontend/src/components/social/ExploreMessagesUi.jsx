import {
  FiArrowLeft,
  FiCheck,
  FiChevronRight,
  FiClock,
  FiLoader,
  FiMessageCircle,
  FiPlus,
  FiRefreshCw,
  FiSend,
} from "react-icons/fi";
import { Avatar } from "./ExploreReelUi.jsx";

function bubbleTime(value, timeAgo) {
  return value ? timeAgo(value) : "Now";
}

function ThreadRow({ thread, active, onClick, timeAgo }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-[24px] px-4 py-3 text-left transition ${
        active
          ? "bg-[linear-gradient(135deg,#134e4a_0%,#0f766e_100%)] text-white shadow-[0_18px_40px_rgba(15,118,110,0.24)]"
          : "bg-white text-slate-800 hover:bg-[#f4f7f5]"
      }`}
    >
      <div className="relative shrink-0">
        <Avatar name={thread.participant?.name} avatarUrl={thread.participant?.avatarUrl} />
        {thread.unread ? (
          <span className="absolute -right-1 -top-1 inline-flex min-w-[22px] items-center justify-center rounded-full bg-[#f97316] px-1.5 py-0.5 text-[11px] font-black text-white">
            {thread.unread > 9 ? "9+" : thread.unread}
          </span>
        ) : null}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className={`truncate text-sm font-black ${active ? "text-white" : "text-slate-900"}`}>
            {thread.participant?.name || "Explore member"}
          </p>
          <span className={`text-[11px] font-bold ${active ? "text-white/65" : "text-slate-400"}`}>
            {bubbleTime(thread.updatedAt, timeAgo)}
          </span>
        </div>
        <p className={`mt-1 truncate text-xs ${active ? "text-white/75" : "text-slate-500"}`}>
          {thread.type === "request_received"
            ? "Wants to message you"
            : thread.type === "request_sent"
              ? "Request sent"
              : thread.participant?.headline || "Explore chat"}
        </p>
        <p className={`mt-1 truncate text-sm ${active ? "text-white/90" : "text-slate-600"}`}>
          {thread.preview || "Open chat"}
        </p>
      </div>
      <FiChevronRight className={active ? "text-white/70" : "text-slate-300"} />
    </button>
  );
}

function MessageBubble({ message, timeAgo }) {
  if (message.sender === "system") {
    return (
      <div className="py-2 text-center">
        <span className="inline-flex rounded-full bg-[#ecfdf5] px-4 py-2 text-xs font-bold text-[#0f766e]">
          {message.text}
        </span>
      </div>
    );
  }

  const self = message.sender === "self";
  return (
    <div className={`flex ${self ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[78%] rounded-[26px] px-4 py-3 shadow-sm ${
          self
            ? "rounded-br-[10px] bg-[linear-gradient(135deg,#0f766e_0%,#14b8a6_100%)] text-white"
            : "rounded-bl-[10px] border border-[#d7efe8] bg-white text-slate-800"
        }`}
      >
        <p className="whitespace-pre-wrap text-sm leading-7">{message.text}</p>
        <p className={`mt-2 text-[11px] font-bold ${self ? "text-white/70" : "text-slate-400"}`}>
          {bubbleTime(message.createdAt, timeAgo)}
        </p>
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
  loadingList = false,
  loadingThread = false,
  sending = false,
  onSelectThread,
  onDraftChange,
  onSend,
  onAccept,
  onRefresh,
  timeAgo,
  requests = 0,
}) {
  return (
    <div className="overflow-hidden rounded-[34px] border border-[#d8e7df] bg-[linear-gradient(180deg,#f6fbf8_0%,#eef7f2_100%)] shadow-[0_28px_80px_rgba(15,23,42,0.08)]">
      <div className="grid min-h-[740px] lg:grid-cols-[340px_minmax(0,1fr)]">
        <aside className="border-r border-[#d8e7df] bg-[linear-gradient(180deg,#f9fdfb_0%,#f1f8f4_100%)]">
          <div className="border-b border-[#d8e7df] px-5 py-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#0f766e]">Explore DMs</p>
                <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-900">Messages</h2>
                <p className="mt-2 text-sm text-slate-500">
                  Followers can chat directly. Others first send a request.
                </p>
              </div>
              <button
                type="button"
                onClick={onRefresh}
                className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[#cce4d9] bg-white text-[#0f766e] transition hover:bg-[#f0faf5]"
              >
                <FiRefreshCw />
              </button>
            </div>

            <div className="mt-4 flex items-center gap-3 rounded-[22px] bg-white px-4 py-3 shadow-sm">
              <Avatar name={viewer?.name} avatarUrl={viewer?.avatarUrl} small />
              <div className="min-w-0">
                <p className="truncate text-sm font-black text-slate-900">{viewer?.name || "You"}</p>
                <p className="truncate text-xs text-slate-500">
                  {requests ? `${requests} pending requests` : "No pending requests"}
                </p>
              </div>
            </div>
          </div>

          <div className="max-h-[640px] space-y-3 overflow-y-auto px-4 py-4">
            {loadingList ? (
              <div className="rounded-[24px] bg-white px-4 py-10 text-center text-sm font-bold text-slate-500">
                <FiLoader className="mx-auto mb-3 animate-spin text-lg text-[#0f766e]" />
                Loading Explore chats...
              </div>
            ) : threads.length ? (
              threads.map((thread) => (
                <ThreadRow
                  key={thread.id}
                  thread={thread}
                  active={thread.id === activeThread?.id}
                  onClick={() => onSelectThread?.(thread.id)}
                  timeAgo={timeAgo}
                />
              ))
            ) : (
              <div className="rounded-[24px] bg-white px-5 py-12 text-center shadow-sm">
                <span className="mx-auto inline-flex h-16 w-16 items-center justify-center rounded-full bg-[#ecfdf5] text-2xl text-[#0f766e]">
                  <FiMessageCircle />
                </span>
                <h3 className="mt-5 text-xl font-black text-slate-900">No Explore chats yet</h3>
                <p className="mt-3 text-sm leading-7 text-slate-500">
                  Open a profile from Explore and start a direct chat or send a message request.
                </p>
              </div>
            )}
          </div>
        </aside>

        <section className="flex min-h-[740px] flex-col bg-[linear-gradient(180deg,#fdfefd_0%,#f6fbf8_100%)]">
          {activeThread ? (
            <>
              <div className="border-b border-[#d8e7df] px-5 py-5">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex min-w-0 items-center gap-3">
                    <Avatar name={activeThread.participant?.name} avatarUrl={activeThread.participant?.avatarUrl} />
                    <div className="min-w-0">
                      <p className="truncate text-lg font-black text-slate-900">
                        {activeThread.participant?.name || "Explore member"}
                      </p>
                      <p className="truncate text-sm text-slate-500">
                        {activeThread.type === "request_received"
                          ? "Message request"
                          : activeThread.type === "request_sent"
                            ? "Waiting for acceptance"
                            : activeThread.participant?.headline || "Explore conversation"}
                      </p>
                    </div>
                  </div>

                  {activeThread.canAccept ? (
                    <button
                      type="button"
                      onClick={onAccept}
                      className="inline-flex items-center gap-2 rounded-full bg-[linear-gradient(135deg,#ea580c_0%,#f97316_100%)] px-5 py-3 text-sm font-extrabold text-white shadow-[0_18px_40px_rgba(249,115,22,0.3)]"
                    >
                      <FiCheck />
                      Accept request
                    </button>
                  ) : (
                    <div className="inline-flex items-center gap-2 rounded-full border border-[#d7e9df] bg-white px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-[#0f766e]">
                      {activeThread.type === "request_sent" ? <FiClock /> : <FiPlus />}
                      {activeThread.type === "request_sent" ? "Pending" : "Connected"}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex-1 space-y-4 overflow-y-auto px-5 py-6">
                {loadingThread ? (
                  <div className="flex h-full items-center justify-center text-sm font-bold text-slate-500">
                    <FiLoader className="mr-2 animate-spin text-[#0f766e]" />
                    Loading conversation...
                  </div>
                ) : messages.length ? (
                  messages.map((message) => (
                    <MessageBubble key={message.id} message={message} timeAgo={timeAgo} />
                  ))
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <div className="max-w-md rounded-[30px] border border-[#d8e7df] bg-white px-6 py-8 text-center shadow-sm">
                      <span className="mx-auto inline-flex h-16 w-16 items-center justify-center rounded-full bg-[#fff7ed] text-2xl text-[#ea580c]">
                        <FiSend />
                      </span>
                      <h3 className="mt-4 text-xl font-black text-slate-900">Start the Explore conversation</h3>
                      <p className="mt-3 text-sm leading-7 text-slate-500">
                        Accepted chats show here. Message requests need approval before replies start.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div className="border-t border-[#d8e7df] bg-white/80 px-5 py-4">
                {activeThread.type === "request_sent" ? (
                  <div className="rounded-[24px] border border-[#fde3cf] bg-[#fff7ed] px-4 py-4 text-sm font-semibold text-[#c2410c]">
                    Your request is waiting for approval. You can send messages once the other user accepts it.
                  </div>
                ) : activeThread.type === "request_received" ? (
                  <div className="rounded-[24px] border border-[#d7efe8] bg-[#ecfdf5] px-4 py-4 text-sm font-semibold text-[#0f766e]">
                    Accept this request to start chatting inside Explore.
                  </div>
                ) : (
                  <div className="flex items-end gap-3 rounded-[28px] border border-[#d8e7df] bg-[#f9fdfb] p-3">
                    <button
                      type="button"
                      className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-[#fff7ed] text-[#ea580c]"
                    >
                      <FiArrowLeft />
                    </button>
                    <textarea
                      value={draft}
                      onChange={(event) => onDraftChange?.(event.target.value)}
                      rows={1}
                      placeholder="Write a message for Explore..."
                      className="min-h-[52px] flex-1 resize-none rounded-[22px] border border-transparent bg-white px-4 py-3 text-sm leading-7 outline-none transition focus:border-[#9ad3c5]"
                    />
                    <button
                      type="button"
                      disabled={sending || !String(draft || "").trim()}
                      onClick={onSend}
                      className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-[linear-gradient(135deg,#0f766e_0%,#14b8a6_100%)] text-white shadow-[0_18px_36px_rgba(20,184,166,0.28)] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {sending ? <FiLoader className="animate-spin" /> : <FiSend />}
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex h-full items-center justify-center px-6">
              <div className="max-w-xl text-center">
                <span className="mx-auto inline-flex h-20 w-20 items-center justify-center rounded-[28px] bg-[linear-gradient(135deg,#0f766e_0%,#14b8a6_100%)] text-3xl text-white shadow-[0_24px_48px_rgba(20,184,166,0.26)]">
                  <FiMessageCircle />
                </span>
                <h3 className="mt-6 text-3xl font-black text-slate-900">Explore messages stay separate</h3>
                <p className="mt-4 text-base leading-8 text-slate-500">
                  This inbox is only for Explore chats, requests, and follower conversations. Job messages stay in the
                  jobs module.
                </p>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
