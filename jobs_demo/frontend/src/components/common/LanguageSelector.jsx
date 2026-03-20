import { useEffect, useMemo, useRef, useState } from "react";
import { FiCheck, FiChevronDown, FiGlobe } from "react-icons/fi";
import { useI18n } from "../../context/I18nContext.jsx";

export default function LanguageSelector({ compact = false }) {
  const { language, languages, setLanguage, busy, translating, t } = useI18n();
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);

  const activeLabel = useMemo(
    () => languages.find((x) => x.code === language)?.label || "English",
    [language, languages]
  );

  useEffect(() => {
    const onDocClick = (event) => {
      if (!wrapRef.current) return;
      if (!wrapRef.current.contains(event.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  return (
    <div
      ref={wrapRef}
      data-no-translate="true"
      className="relative"
      title={t("lang.label")}
    >
      <button
        type="button"
        disabled={translating}
        onClick={() => setOpen((v) => !v)}
        aria-label={t("lang.label")}
        className={`inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white ${
          compact ? "px-2 py-1.5" : "px-2.5 py-1.5"
        } ${translating ? "cursor-not-allowed opacity-70" : ""}`}
      >
        <FiGlobe className="text-slate-500" />
        <span className="max-w-[150px] truncate text-xs font-semibold text-slate-700">
          {activeLabel}
        </span>
        <FiChevronDown className={`text-slate-500 transition ${open ? "rotate-180" : ""}`} />
      </button>

      {open ? (
        <div className="absolute right-0 top-[calc(100%+8px)] z-[80] max-h-72 w-64 overflow-y-auto rounded-xl border border-slate-200 bg-white p-1 shadow-xl">
          {languages.map((lang) => {
            const active = lang.code === language;
            return (
              <button
                key={lang.code}
                type="button"
                onClick={() => {
                  setLanguage(lang.code);
                  setOpen(false);
                }}
                className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-xs font-semibold transition ${
                  active
                    ? "bg-blue-50 text-[#2563EB]"
                    : "text-slate-700 hover:bg-slate-50"
                }`}
              >
                <span className="truncate">{lang.label}</span>
                {active ? <FiCheck className="shrink-0" /> : null}
              </button>
            );
          })}
          {translating ? <div className="px-3 py-2 text-[10px] font-semibold text-slate-400">Translating...</div> : null}
          {!translating && busy ? <div className="px-3 py-2 text-[10px] font-semibold text-slate-400">Saving...</div> : null}
        </div>
      ) : null}
    </div>
  );
}
