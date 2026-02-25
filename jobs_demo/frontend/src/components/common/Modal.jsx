import { AnimatePresence, motion } from "framer-motion";
import { FiX } from "react-icons/fi";

export default function Modal({
  open,
  title,
  children,
  footer,
  onClose,
  widthClass = "max-w-md",
}) {
  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-[60] overflow-y-auto px-4 py-6 sm:flex sm:items-center sm:justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* backdrop */}
          <div
            className="absolute inset-0 bg-slate-900/40"
            onClick={onClose}
          />

          {/* panel */}
          <motion.div
            initial={{ opacity: 0, y: 14, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 14, scale: 0.98 }}
            transition={{ duration: 0.2 }}
            className={`relative my-auto w-full ${widthClass} card flex max-h-[92vh] flex-col overflow-hidden p-0`}
          >
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <div className="font-extrabold text-lg">{title}</div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Cancel"
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:bg-slate-50"
              >
                <FiX />
              </button>
            </div>

            <div className="overflow-y-auto px-6 py-5">{children}</div>

            {footer ? (
              <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-2">
                {footer}
              </div>
            ) : null}
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
