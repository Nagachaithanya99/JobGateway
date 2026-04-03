import { useEffect, useRef } from "react";
import { showSweetToast } from "../../utils/sweetAlert.js";

export default function Toast({
  show,
  message = "",
  onClose,
  duration = 1400,
  tone = "dark", // "dark" | "success" | "error" | "warning"
}) {
  const lastKeyRef = useRef("");

  useEffect(() => {
    if (!show) return;
    const toneName = tone === "dark" ? "info" : tone;
    const nextKey = `${show}_${toneName}_${message}`;
    if (lastKeyRef.current === nextKey) return;
    lastKeyRef.current = nextKey;
    void showSweetToast(message, toneName, { timer: duration }).finally(() => onClose?.());
  }, [show, message, tone, duration, onClose]);

  useEffect(() => {
    if (show) return;
    lastKeyRef.current = "";
  }, [show]);

  return null;
}
