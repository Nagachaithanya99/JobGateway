import { Link } from "react-router-dom";
import {
  FiAlertCircle,
  FiArrowUpRight,
  FiCheckCircle,
  FiClock,
  FiFileText,
} from "react-icons/fi";
import Modal from "./Modal.jsx";

const VARIANTS = {
  success: {
    icon: FiCheckCircle,
    iconClass: "bg-emerald-100 text-emerald-700 shadow-[0_12px_30px_rgba(16,185,129,0.22)]",
    badgeClass: "border-emerald-200 bg-emerald-50 text-emerald-700",
    panelClass: "from-emerald-50 via-white to-[#ecfdf5]",
    glowClass: "bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.22),transparent_45%)]",
    primaryClass: "bg-emerald-600 hover:bg-emerald-700 shadow-[0_12px_30px_rgba(16,185,129,0.25)]",
  },
  warning: {
    icon: FiAlertCircle,
    iconClass: "bg-orange-100 text-[#c45500] shadow-[0_12px_30px_rgba(249,115,22,0.22)]",
    badgeClass: "border-orange-200 bg-orange-50 text-[#c45500]",
    panelClass: "from-orange-50 via-white to-[#fff1e6]",
    glowClass: "bg-[radial-gradient(circle_at_top_left,rgba(249,115,22,0.22),transparent_45%)]",
    primaryClass: "bg-[#ff7a00] hover:bg-[#f26a00] shadow-[0_12px_30px_rgba(255,122,0,0.28)]",
  },
  info: {
    icon: FiClock,
    iconClass: "bg-blue-100 text-[#2563EB] shadow-[0_12px_30px_rgba(37,99,235,0.2)]",
    badgeClass: "border-blue-200 bg-blue-50 text-blue-700",
    panelClass: "from-blue-50 via-white to-[#eef4ff]",
    glowClass: "bg-[radial-gradient(circle_at_top_left,rgba(37,99,235,0.18),transparent_45%)]",
    primaryClass: "bg-[#2563EB] hover:bg-blue-700 shadow-[0_12px_30px_rgba(37,99,235,0.24)]",
  },
  external: {
    icon: FiArrowUpRight,
    iconClass: "bg-violet-100 text-violet-700 shadow-[0_12px_30px_rgba(139,92,246,0.18)]",
    badgeClass: "border-violet-200 bg-violet-50 text-violet-700",
    panelClass: "from-violet-50 via-white to-[#f6efff]",
    glowClass: "bg-[radial-gradient(circle_at_top_left,rgba(139,92,246,0.18),transparent_45%)]",
    primaryClass: "bg-[#111827] hover:bg-slate-900 shadow-[0_12px_30px_rgba(15,23,42,0.2)]",
  },
};

export default function StatusPopup({
  open,
  onClose,
  variant = "info",
  title,
  message,
  badge = "Status",
  details = [],
  primaryLabel = "Done",
  onPrimary,
  primaryHref = "",
  secondaryLabel = "",
  onSecondary,
  secondaryHref = "",
}) {
  const config = VARIANTS[variant] || VARIANTS.info;
  const Icon = config.icon || FiFileText;
  const sharedPrimaryClass = `rounded-[16px] px-5 py-3 text-sm font-extrabold text-white transition ${config.primaryClass}`;
  const sharedSecondaryClass =
    "rounded-[16px] border border-slate-200 bg-white/85 px-5 py-3 text-sm font-bold text-slate-700 transition hover:bg-white";

  return (
    <Modal
      open={open}
      onClose={onClose}
      title=""
      widthClass="max-w-xl"
      footer={
        <>
          {secondaryHref ? (
            <Link
              to={secondaryHref}
              className={sharedSecondaryClass}
            >
              {secondaryLabel}
            </Link>
          ) : secondaryLabel ? (
            <button
              type="button"
              onClick={onSecondary || onClose}
              className={sharedSecondaryClass}
            >
              {secondaryLabel}
            </button>
          ) : null}

          {primaryHref ? (
            <Link
              to={primaryHref}
              className={sharedPrimaryClass}
            >
              {primaryLabel}
            </Link>
          ) : (
            <button
              type="button"
              onClick={onPrimary || onClose}
              className={sharedPrimaryClass}
            >
              {primaryLabel}
            </button>
          )}
        </>
      }
    >
      <div className="relative overflow-hidden rounded-[30px] border border-white/80 bg-white/90 shadow-[0_24px_70px_rgba(15,23,42,0.08)]">
        <div className={`absolute inset-0 bg-gradient-to-br ${config.panelClass}`} />
        <div className={`absolute inset-0 ${config.glowClass}`} />
        <div className="absolute -right-10 -top-10 h-36 w-36 rounded-full bg-white/55 blur-2xl" />
        <div className="absolute bottom-0 left-0 h-24 w-full bg-[linear-gradient(90deg,rgba(255,255,255,0.6),transparent_70%)]" />

        <div className="relative border-b border-white/70 px-6 py-4">
          <div className="flex items-center justify-between gap-3">
            <div
              className={`inline-flex rounded-full border px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] ${config.badgeClass}`}
            >
              {badge}
            </div>
            <div className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-400">
              Student Portal
            </div>
          </div>
        </div>

        <div className="relative px-6 py-6">
          <div className="flex items-start gap-4">
          <div
            className={`inline-flex h-16 w-16 shrink-0 items-center justify-center rounded-[22px] ${config.iconClass}`}
          >
            <Icon className="h-8 w-8" />
          </div>

          <div className="min-w-0 flex-1">
            <h3 className="text-[30px] font-black leading-none tracking-[-0.03em] text-slate-900">
              {title}
            </h3>
            <p className="mt-3 max-w-[34rem] text-[15px] leading-7 text-slate-600">{message}</p>

            {details.length ? (
              <div className="mt-5 grid gap-3">
                {details.map((detail) => (
                  <div
                    key={detail}
                    className="rounded-[20px] border border-white/80 bg-white/80 px-4 py-3 text-sm font-bold text-slate-700 shadow-[0_8px_24px_rgba(15,23,42,0.05)]"
                  >
                    {detail}
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      </div>
      </div>
    </Modal>
  );
}
