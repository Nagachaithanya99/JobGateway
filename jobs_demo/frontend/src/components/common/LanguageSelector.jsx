import { FiGlobe } from "react-icons/fi";
import { useI18n } from "../../context/I18nContext.jsx";

export default function LanguageSelector({ compact = false }) {
  const { language, languages, setLanguage, busy, t } = useI18n();

  return (
    <label
      data-no-translate="true"
      className={`inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white ${
        compact ? "px-2 py-1.5" : "px-2.5 py-1.5"
      }`}
      title={t("lang.label")}
    >
      <FiGlobe className="text-slate-500" />
      <select
        value={language}
        onChange={(e) => setLanguage(e.target.value)}
        disabled={busy}
        className="bg-transparent text-xs font-semibold text-slate-700 outline-none"
        aria-label={t("lang.label")}
      >
        {languages.map((lang) => (
          <option key={lang.code} value={lang.code}>
            {lang.label}
          </option>
        ))}
      </select>
    </label>
  );
}
