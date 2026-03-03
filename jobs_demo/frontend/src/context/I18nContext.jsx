import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useAuth } from "./AuthContext.jsx";
import { getMyLanguagePreference, saveMyLanguagePreference } from "../services/i18nService.js";

const GUEST_STORAGE_KEY = "i18n_lang_guest";
const USER_STORAGE_PREFIX = "i18n_lang_user_";
const DEFAULT_LANGUAGE = "en";
const SUPPORTED = ["en", "hi", "te", "ta", "kn"];

const messages = {
  en: {
    "nav.home": "Home",
    "nav.jobs": "Jobs",
    "nav.internships": "Internships",
    "nav.governmentJobs": "Government Jobs",
    "nav.myJobs": "My Jobs",
    "nav.interviews": "Interviews",
    "nav.saved": "Saved",
    "nav.resumeBuilder": "Resume Builder",
    "nav.messages": "Messages",
    "nav.notifications": "Notifications",
    "nav.myProfile": "My Profile",
    "nav.settings": "Settings",
    "nav.logout": "Logout",
    "lang.label": "Language",
    "lang.english": "English",
    "lang.hindi": "Hindi",
    "lang.telugu": "Telugu",
    "lang.tamil": "Tamil",
    "lang.kannada": "Kannada",
    "search.anything": "Search anything...",
    "search.student.quick": "Quick Search",
  },
  hi: {
    "lang.english": "English",
    "lang.hindi": "Hindi",
    "lang.telugu": "Telugu",
    "lang.tamil": "Tamil",
    "lang.kannada": "Kannada",
  },
  te: {
    "lang.english": "English",
    "lang.hindi": "Hindi",
    "lang.telugu": "Telugu",
    "lang.tamil": "Tamil",
    "lang.kannada": "Kannada",
  },
  ta: {
    "lang.english": "English",
    "lang.hindi": "Hindi",
    "lang.telugu": "Telugu",
    "lang.tamil": "Tamil",
    "lang.kannada": "Kannada",
  },
  kn: {
    "lang.english": "English",
    "lang.hindi": "Hindi",
    "lang.telugu": "Telugu",
    "lang.tamil": "Tamil",
    "lang.kannada": "Kannada",
  },
};

function normalizeLanguage(value) {
  const next = String(value || "").trim().toLowerCase();
  return SUPPORTED.includes(next) ? next : DEFAULT_LANGUAGE;
}

function userStorageKey(userId) {
  return `${USER_STORAGE_PREFIX}${userId}`;
}

function readLocalLanguage(userId) {
  try {
    const key = userId ? userStorageKey(userId) : GUEST_STORAGE_KEY;
    return normalizeLanguage(localStorage.getItem(key));
  } catch {
    return DEFAULT_LANGUAGE;
  }
}

function writeLocalLanguage(language, userId) {
  try {
    const key = userId ? userStorageKey(userId) : GUEST_STORAGE_KEY;
    localStorage.setItem(key, normalizeLanguage(language));
  } catch {
    // ignore storage errors
  }
}

const I18nContext = createContext(null);

export function I18nProvider({ children }) {
  const { user, isAuthed } = useAuth();
  const userId = user?.id || "";
  const [language, setLanguageState] = useState(() => readLocalLanguage(""));
  const [busy, setBusy] = useState(false);

  const setLanguage = useCallback(
    async (nextLanguage, options = {}) => {
      const next = normalizeLanguage(nextLanguage);
      const shouldPersist = options.persist !== false;

      setLanguageState(next);
      writeLocalLanguage(next, isAuthed ? userId : "");

      if (!shouldPersist || !isAuthed) return next;

      try {
        setBusy(true);
        const res = await saveMyLanguagePreference(next);
        const confirmed = normalizeLanguage(res?.language || next);
        setLanguageState(confirmed);
        writeLocalLanguage(confirmed, userId);
        return confirmed;
      } catch {
        return next;
      } finally {
        setBusy(false);
      }
    },
    [isAuthed, userId],
  );

  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.lang = language;
    }
  }, [language]);

  useEffect(() => {
    let active = true;

    const hydrate = async () => {
      const localLang = readLocalLanguage(isAuthed ? userId : "");
      setLanguageState(localLang);
      if (!isAuthed) return;

      try {
        setBusy(true);
        const res = await getMyLanguagePreference();
        if (!active) return;
        const remoteLang = normalizeLanguage(res?.language || localLang);
        setLanguageState(remoteLang);
        writeLocalLanguage(remoteLang, userId);
      } catch {
        if (active) setLanguageState(localLang);
      } finally {
        if (active) setBusy(false);
      }
    };

    hydrate();
    return () => {
      active = false;
    };
  }, [isAuthed, userId]);

  const t = useCallback(
    (key, fallback = "") => {
      const pack = messages[language] || {};
      if (Object.prototype.hasOwnProperty.call(pack, key)) return pack[key];
      if (Object.prototype.hasOwnProperty.call(messages.en, key)) return messages.en[key];
      return fallback || key;
    },
    [language],
  );

  const languages = useMemo(
    () => [
      { code: "en", label: t("lang.english") },
      { code: "hi", label: t("lang.hindi") },
      { code: "te", label: t("lang.telugu") },
      { code: "ta", label: t("lang.tamil") },
      { code: "kn", label: t("lang.kannada") },
    ],
    [t],
  );

  const value = useMemo(
    () => ({ language, languages, busy, setLanguage, t }),
    [language, languages, busy, setLanguage, t],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (ctx) return ctx;
  return {
    language: DEFAULT_LANGUAGE,
    languages: [
      { code: "en", label: "English" },
      { code: "hi", label: "Hindi" },
      { code: "te", label: "Telugu" },
      { code: "ta", label: "Tamil" },
      { code: "kn", label: "Kannada" },
    ],
    busy: false,
    setLanguage: async () => DEFAULT_LANGUAGE,
    t: (key, fallback = "") => fallback || key,
  };
}
