import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";

export default function ActionMenuPortal({
  open,
  anchor,
  onClose,
  width = 176,
  estimatedHeight = 132,
  className = "",
  children,
}) {
  const menuRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;

    const handlePointerDown = (event) => {
      if (menuRef.current?.contains(event.target)) return;
      onClose?.();
    };

    const handleKeyDown = (event) => {
      if (event.key === "Escape") onClose?.();
    };

    const handleViewportChange = () => {
      onClose?.();
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("touchstart", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    window.addEventListener("resize", handleViewportChange);
    window.addEventListener("scroll", handleViewportChange, true);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("resize", handleViewportChange);
      window.removeEventListener("scroll", handleViewportChange, true);
    };
  }, [open, onClose]);

  if (!open || !anchor || typeof document === "undefined") return null;

  const viewportWidth = typeof window !== "undefined" ? window.innerWidth : 1280;
  const viewportHeight = typeof window !== "undefined" ? window.innerHeight : 720;
  const left = Math.min(Math.max(12, anchor.right - width), Math.max(12, viewportWidth - width - 12));
  const fitsBelow = anchor.bottom + 8 + estimatedHeight <= viewportHeight - 12;
  const top = fitsBelow
    ? anchor.bottom + 8
    : Math.max(12, anchor.top - estimatedHeight - 8);

  return createPortal(
    <div
      ref={menuRef}
      className={`fixed z-[80] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl ${className}`.trim()}
      style={{ left, top, width }}
    >
      {children}
    </div>,
    document.body
  );
}
