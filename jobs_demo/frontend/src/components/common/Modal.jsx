import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { FiX } from "react-icons/fi";

export default function Modal({
  open,
  title,
  children,
  footer,
  onClose,
  widthClass = "max-w-md",
  zIndexClass = "z-[90]",
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {open ? (
        <motion.div
          className={`fixed inset-0 ${zIndexClass} flex items-center justify-center overflow-y-auto px-4 py-6`}
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
            className={`relative my-auto w-full ${widthClass} card flex max-h-[92vh] flex-col overflow-hidden rounded-[28px] border border-white/70 bg-white p-0 shadow-[0_30px_80px_rgba(15,23,42,0.24)]`}
          >
            <div className="flex items-center justify-between border-b border-slate-100 bg-[linear-gradient(135deg,#eff6ff_0%,#ffffff_55%,#fff7ed_100%)] px-6 py-4">
              <div className="text-lg font-extrabold text-slate-900">{title}</div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Cancel"
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white/90 text-slate-600 transition hover:bg-white"
              >
                <FiX />
              </button>
            </div>

            <div className="overflow-y-auto px-6 py-5">{children}</div>

            {footer ? (
              <div className="flex justify-end gap-2 border-t border-slate-100 bg-slate-50 px-6 py-4">
                {footer}
              </div>
            ) : null}
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}
