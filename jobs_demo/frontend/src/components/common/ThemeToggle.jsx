import { useMemo, useState } from "react";
import { IoBulb, IoBulbOutline } from "react-icons/io5";
import { useTheme } from "../../context/ThemeContext.jsx";

export default function ThemeToggle({ className = "" }) {
  const { hasProvider, isDark, toggleTheme } = useTheme();
  const [fallbackDark, setFallbackDark] = useState(() =>
    typeof document !== "undefined" ? document.documentElement.classList.contains("dark") : false
  );

  const effectiveIsDark = useMemo(
    () => (hasProvider ? isDark : fallbackDark),
    [fallbackDark, hasProvider, isDark]
  );

  const handleToggle = () => {
    if (hasProvider) {
      toggleTheme();
      return;
    }

    const nextIsDark = !fallbackDark;
    const nextTheme = nextIsDark ? "dark" : "light";
    document.documentElement.classList.toggle("dark", nextIsDark);
    document.documentElement.setAttribute("data-theme", nextTheme);
    window.localStorage.setItem("jobgateway-theme", nextTheme);
    setFallbackDark(nextIsDark);
  };

  return (
    <button
      type="button"
      onClick={handleToggle}
      data-no-theme-invert="true"
      aria-label={`Switch to ${effectiveIsDark ? "light" : "dark"} mode`}
      title={`Switch to ${effectiveIsDark ? "light" : "dark"} mode`}
      className={`inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-900 dark:text-yellow-300 dark:hover:bg-slate-800 ${className}`}
    >
      {effectiveIsDark ? <IoBulb className="h-6 w-6" /> : <IoBulbOutline className="h-6 w-6" />}
    </button>
  );
}
