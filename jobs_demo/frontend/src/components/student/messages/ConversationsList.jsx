import { FiSearch } from "react-icons/fi";

function initials(name = "") {
  return name
    .split(" ")
    .filter(Boolean)
    .map((x) => x[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function Avatar({ name, logoUrl }) {
  if (logoUrl) {
    return (
      <img
        src={logoUrl}
        alt={name || "Company"}
        className="h-10 w-10 rounded-xl object-cover ring-1 ring-black/5"
      />
    );
  }
  return (
    <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-slate-200 to-slate-100 text-xs font-extrabold text-slate-600 ring-1 ring-black/5">
      {initials(name)}
    </div>
  );
}

export default function ConversationsList({ query, setQuery, list, activeId, openConversation }) {
  return (
    <aside className="rounded-2xl bg-white shadow-[0_10px_30px_rgba(15,23,42,0.06)] ring-1 ring-black/5">
      <div className="p-4">
        <div className="relative">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search messages..."
            className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-sm outline-none focus:border-orange-200 focus:ring-2 focus:ring-orange-100"
          />
        </div>

        <div className="mt-3 flex items-center gap-2 text-xs font-semibold text-slate-500">
          <button className="rounded-full bg-slate-100 px-3 py-1 text-slate-700">All Chats</button>
          <span className="ml-auto text-[11px] text-slate-400">{list?.length || 0}</span>
        </div>
      </div>

      <div className="max-h-[560px] overflow-auto pb-2">
        {(list || []).map((c) => {
          const active = c.id === activeId;
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => openConversation(c.id)}
              className={`w-full px-4 py-3 text-left transition ${
                active ? "bg-orange-50" : "hover:bg-slate-50"
              }`}
            >
              <div className="flex items-start gap-3">
                <Avatar name={c.company} logoUrl={c.companyLogo || c.logoUrl} />

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-extrabold text-slate-900">{c.company || ""}</p>
                    {Number(c.unread) > 0 ? (
                      <span className="ml-auto inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-orange-500 px-1.5 text-[11px] font-extrabold text-white">
                        {c.unread}
                      </span>
                    ) : (
                      <span className="ml-auto text-[11px] font-semibold text-slate-400">
                        {c.lastTime || ""}
                      </span>
                    )}
                  </div>

                  <p className="truncate text-xs font-semibold text-slate-500">{c.hrName || ""}</p>

                  <p className="mt-1 truncate text-xs text-slate-400">
                    {c.lastMessage || ""}
                  </p>
                </div>
              </div>
            </button>
          );
        })}

        {!list?.length ? (
          <div className="px-4 pb-6 pt-2 text-sm text-slate-500">No conversations found.</div>
        ) : null}
      </div>
    </aside>
  );
}
