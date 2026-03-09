import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "./AuthContext.jsx";
import { getMyLanguagePreference, saveMyLanguagePreference } from "../services/i18nService.js";
import {
  DEFAULT_LANGUAGE,
  LANGUAGE_CATALOG,
  normalizeLanguage,
} from "./i18nLanguages.js";

const GUEST_STORAGE_KEY = "i18n_lang_guest";
const USER_STORAGE_PREFIX = "i18n_lang_user_";

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
    "search.anything": "Search anything...",
    "search.student.quick": "Quick Search",
  },
};

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
  const persistTimerRef = useRef(null);
  const persistSeqRef = useRef(0);

  const clearPersistTimer = useCallback(() => {
    if (!persistTimerRef.current) return;
    clearTimeout(persistTimerRef.current);
    persistTimerRef.current = null;
  }, []);

  const setLanguage = useCallback(
    async (nextLanguage, options = {}) => {
      const next = normalizeLanguage(nextLanguage);
      const shouldPersist = options.persist !== false;

      setLanguageState(next);
      writeLocalLanguage(next, isAuthed ? userId : "");

      if (!shouldPersist || !isAuthed) return next;

      clearPersistTimer();
      const seq = ++persistSeqRef.current;
      persistTimerRef.current = setTimeout(async () => {
        try {
          await saveMyLanguagePreference(next);
          if (seq !== persistSeqRef.current) return;
        } catch {
          // keep optimistic local language for better responsiveness
        }
      }, 200);

      return next;
    },
    [clearPersistTimer, isAuthed, userId],
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
        // Preserve local selection for responsiveness and broader language coverage.
        // Only hydrate from server when local is still default.
        if (localLang === DEFAULT_LANGUAGE && remoteLang !== DEFAULT_LANGUAGE) {
          setLanguageState(remoteLang);
          writeLocalLanguage(remoteLang, userId);
        }
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

  useEffect(() => clearPersistTimer, [clearPersistTimer]);

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
    () =>
      [...LANGUAGE_CATALOG]
        .sort((a, b) => {
          if (a.popular !== b.popular) return a.popular ? -1 : 1;
          return a.label.localeCompare(b.label);
        })
        .map((lang) => ({
          code: lang.code,
          label: `${lang.native} (${lang.label})`,
        })),
    [],
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
    languages: LANGUAGE_CATALOG.map((x) => ({
      code: x.code,
      label: `${x.native} (${x.label})`,
    })),
    busy: false,
    setLanguage: async () => DEFAULT_LANGUAGE,
    t: (key, fallback = "") => fallback || key,
  };
}
