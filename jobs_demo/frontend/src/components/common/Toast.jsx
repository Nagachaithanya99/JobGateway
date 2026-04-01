import { useEffect } from "react";
import { FiX } from "react-icons/fi";

export default function Toast({
  show,
  message = "",
  onClose,
  duration = 1400,
  tone = "dark", // "dark" | "success" | "error" | "warning"
}) {
  useEffect(() => {
    if (!show) return;
    const t = setTimeout(() => onClose?.(), duration);
    return () => clearTimeout(t);
  }, [show, duration, onClose]);

  if (!show) return null;

  const tones = {
    dark: "bg-[#0F172A] text-white",
    success: "bg-green-600 text-white",
    error: "bg-red-600 text-white",
    warning: "bg-amber-500 text-white",
  };

  return (
    <div className="fixed bottom-5 right-5 z-[80]">
      <div className={`flex items-center gap-3 rounded-lg px-3 py-2 text-xs font-semibold shadow-lg ${tones[tone]}`}>
        <span className="max-w-[280px]">{message}</span>
        <button
          type="button"
          onClick={onClose}
          className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-white/10 hover:bg-white/20"
        >
          <FiX />
        </button>
      </div>
    </div>
  );
}
