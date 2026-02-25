import { AnimatePresence, motion } from "framer-motion";
import { FiEdit2, FiTrash2, FiExternalLink } from "react-icons/fi";

function TypeBadge({ type }) {
  const t = String(type || "").toLowerCase();
  const cls =
    t === "pdf"
      ? "bg-red-50 border-red-200 text-red-700"
      : t === "video"
      ? "bg-purple-50 border-purple-200 text-purple-700"
      : t === "link"
      ? "bg-blue-50 border-blue-200 text-blue-700"
      : "bg-slate-50 border-slate-200 text-slate-700";

  return <span className={`badge ${cls}`}>{type}</span>;
}

export default function GovUpdatesTable({ rows, onEdit, onDelete }) {
  return (
    <div className="card p-0 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-[11px] uppercase text-muted">
            <tr className="text-left">
              <th className="px-6 py-3">Title</th>
              <th className="px-6 py-3">Type</th>
              <th className="px-6 py-3">Description</th>
              <th className="px-6 py-3">Date</th>
              <th className="px-6 py-3 text-right">Actions</th>
            </tr>
          </thead>

          <tbody>
            <AnimatePresence initial={false}>
              {rows.map((item, idx) => (
                <motion.tr
                  key={item.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.22, delay: idx * 0.02 }}
                  className="border-t border-slate-100 hover:bg-slate-50 transition"
                >
                  <td className="px-6 py-4 font-semibold">
                    <div className="flex items-center gap-2">
                      {item.title}
                      {item.link && (
                        <a href={item.link} target="_blank" rel="noreferrer">
                          <FiExternalLink className="text-muted text-xs" />
                        </a>
                      )}
                    </div>
                  </td>

                  <td className="px-6 py-4">
                    <TypeBadge type={item.type} />
                  </td>

                  <td className="px-6 py-4 text-muted max-w-xs truncate">
                    {item.description}
                  </td>

                  <td className="px-6 py-4 text-muted">{item.createdAt}</td>

                  <td className="px-6 py-4">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => onEdit(item)}
                        className="w-9 h-9 rounded-xl border border-slate-200 hover:bg-slate-50 flex items-center justify-center"
                      >
                        <FiEdit2 />
                      </button>

                      <button
                        onClick={() => onDelete(item)}
                        className="w-9 h-9 rounded-xl border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 flex items-center justify-center"
                      >
                        <FiTrash2 />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </AnimatePresence>

            {rows.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-10 text-center text-muted">
                  No updates found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
