import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { useI18n } from "../../context/I18nContext.jsx";
import { SUPPORTED_LANGUAGE_CODES } from "../../context/i18nLanguages.js";
import { translateTexts } from "../../services/i18nService.js";

const ORIGINAL_TEXT = new WeakMap();
const ORIGINAL_ATTRS = new WeakMap();
const TEXT_CACHE = new Map();
const LAST_SIGNATURE = new Map();
const IN_FLIGHT_BATCHES = new Map();
const PAGE_TRANSLATION_CACHE = new Map();
const ATTRS = ["placeholder", "title", "aria-label"];
const LOCAL_CACHE_PREFIX = "i18n_text_cache_";
const PAGE_CACHE_LIMIT = 60;

function isTranslatablePath(pathname = "") {
  return typeof pathname === "string" && pathname.startsWith("/");
}

function isSkippableElement(el) {
  if (!el || el.nodeType !== 1) return true;
  if (el.closest("[data-no-translate='true']")) return true;
  const tag = el.tagName;
  return tag === "SCRIPT" || tag === "STYLE" || tag === "NOSCRIPT";
}

function shouldTranslateText(value) {
  const text = String(value || "").trim();
  if (!text) return false;
  if (!/[A-Za-z]/.test(text)) return false;
  if (/^[\d\s.,:%/+-]+$/.test(text)) return false;
  return true;
}

function shouldHandleTextNode(node, text) {
  if (ORIGINAL_TEXT.has(node)) return true;
  return shouldTranslateText(text);
}

function shouldHandleAttr(el, attr, value) {
  if (typeof ORIGINAL_ATTRS.get(el)?.[attr] === "string") return true;
  return shouldTranslateText(value);
}

function rememberAttrOriginal(el, attr, value) {
  const existing = ORIGINAL_ATTRS.get(el) || {};
  if (!Object.prototype.hasOwnProperty.call(existing, attr)) {
    existing[attr] = value;
    ORIGINAL_ATTRS.set(el, existing);
  }
}

function collectTargets(root) {
  const textNodes = [];
  const attrTargets = [];
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);

  while (walker.nextNode()) {
    const node = walker.currentNode;
    const parent = node.parentElement;
    if (!parent || isSkippableElement(parent)) continue;
    const text = node.nodeValue || "";
    if (!shouldHandleTextNode(node, text)) continue;
    if (!ORIGINAL_TEXT.has(node)) ORIGINAL_TEXT.set(node, text);
    textNodes.push(node);
  }

  const elements = root.querySelectorAll("*");
  elements.forEach((el) => {
    if (isSkippableElement(el)) return;
    ATTRS.forEach((attr) => {
      const value = el.getAttribute(attr);
      if (!shouldHandleAttr(el, attr, value)) return;
      rememberAttrOriginal(el, attr, value);
      attrTargets.push({ el, attr, value });
    });
    if (el.tagName === "INPUT") {
      const type = String(el.getAttribute("type") || "").toLowerCase();
      if (type === "button" || type === "submit") {
        const value = el.getAttribute("value");
        if (shouldHandleAttr(el, "value", value)) {
          rememberAttrOriginal(el, "value", value);
          attrTargets.push({ el, attr: "value", value });
        }
      }
    }
  });

  return { textNodes, attrTargets };
}

function restoreOriginal(root) {
  const { textNodes, attrTargets } = collectTargets(root);
  textNodes.forEach((node) => {
    const original = ORIGINAL_TEXT.get(node);
    if (typeof original === "string") node.nodeValue = original;
  });
  attrTargets.forEach(({ el, attr }) => {
    const original = ORIGINAL_ATTRS.get(el)?.[attr];
    if (typeof original === "string") el.setAttribute(attr, original);
  });
}

function chunk(arr, size) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

let localCacheLoaded = false;
function loadLocalCache() {
  if (localCacheLoaded) return;
  localCacheLoaded = true;
  try {
    SUPPORTED_LANGUAGE_CODES.forEach((lang) => {
      const raw = localStorage.getItem(`${LOCAL_CACHE_PREFIX}${lang}`);
      if (!raw) return;
      const obj = JSON.parse(raw);
      Object.entries(obj || {}).forEach(([k, v]) => {
        TEXT_CACHE.set(`${lang}:${k}`, String(v || k));
      });
    });
  } catch {
    // ignore
  }
}

function saveLocalCache(language, entries) {
  try {
    const key = `${LOCAL_CACHE_PREFIX}${language}`;
    const raw = localStorage.getItem(key);
    const existing = raw ? JSON.parse(raw) : {};
    entries.forEach(([src, translated]) => {
      existing[src] = translated;
    });
    const keys = Object.keys(existing);
    if (keys.length > 4000) {
      const trimmed = {};
      keys.slice(keys.length - 4000).forEach((k) => {
        trimmed[k] = existing[k];
      });
      localStorage.setItem(key, JSON.stringify(trimmed));
      return;
    }
    localStorage.setItem(key, JSON.stringify(existing));
  } catch {
    // ignore
  }
}

function getCachedTranslations(language, texts) {
  loadLocalCache();
  const translated = new Map();
  const missing = [];
  texts.forEach((src) => {
    const cached = TEXT_CACHE.get(`${language}:${src}`);
    if (typeof cached === "string") {
      translated.set(src, cached);
      return;
    }
    missing.push(src);
  });
  return { translated, missing };
}

async function fetchMissingTranslations(language, texts) {
  const result = new Map();
  const parts = chunk(texts, 200);
  await Promise.all(parts.map(async (part) => {
    const batchKey = `${language}::${part.join("||")}`;
    let promise = IN_FLIGHT_BATCHES.get(batchKey);
    if (!promise) {
      promise = translateTexts(language, part)
        .then((res) => {
          const translated = Array.isArray(res?.translations) ? res.translations : [];
          const cacheEntries = [];
          part.forEach((src, idx) => {
            const next = String(translated[idx] || src);
            TEXT_CACHE.set(`${language}:${src}`, next);
            result.set(src, next);
            cacheEntries.push([src, next]);
          });
          if (cacheEntries.length) saveLocalCache(language, cacheEntries);
        })
        .catch(() => {
          part.forEach((src) => {
            TEXT_CACHE.set(`${language}:${src}`, src);
            result.set(src, src);
          });
        })
        .finally(() => {
          IN_FLIGHT_BATCHES.delete(batchKey);
        });
      IN_FLIGHT_BATCHES.set(batchKey, promise);
    }

    await promise;
    part.forEach((src) => {
      result.set(src, TEXT_CACHE.get(`${language}:${src}`) || src);
    });
  }));

  return result;
}

function applyResolvedTranslations(root, resolvedMap) {
  const targets = collectTargets(root);
  const { textNodes, attrTargets } = targets;
  textNodes.forEach((node) => {
    const original = ORIGINAL_TEXT.get(node) || node.nodeValue || "";
    if (!shouldTranslateText(original)) return;
    node.nodeValue = resolvedMap.get(original) || original;
  });

  attrTargets.forEach(({ el, attr, value }) => {
    const original = ORIGINAL_ATTRS.get(el)?.[attr] || value;
    if (!shouldTranslateText(original)) return;
    el.setAttribute(attr, resolvedMap.get(original) || original);
  });
}

function rememberResolvedPageTranslation(signature, resolvedMap) {
  PAGE_TRANSLATION_CACHE.set(signature, resolvedMap);
  if (PAGE_TRANSLATION_CACHE.size <= PAGE_CACHE_LIMIT) return;
  const firstKey = PAGE_TRANSLATION_CACHE.keys().next().value;
  if (firstKey) PAGE_TRANSLATION_CACHE.delete(firstKey);
}

async function applyTranslation(language, pathname, root, runTokenRef) {
  const targets = collectTargets(root);
  const { textNodes, attrTargets } = targets;
  const sourceTexts = new Set();

  textNodes.forEach((node) => {
    const original = ORIGINAL_TEXT.get(node) || node.nodeValue || "";
    if (shouldTranslateText(original)) sourceTexts.add(original);
  });
  attrTargets.forEach(({ el, attr, value }) => {
    const original = ORIGINAL_ATTRS.get(el)?.[attr] || value;
    if (shouldTranslateText(original)) sourceTexts.add(original);
  });

  const sourceList = Array.from(sourceTexts);
  const signature = `${pathname}::${language}::${sourceList.join("||")}`;
  if (LAST_SIGNATURE.get(pathname) === signature) return;

  const resolvedPageTranslation = PAGE_TRANSLATION_CACHE.get(signature);
  if (resolvedPageTranslation) {
    applyResolvedTranslations(root, resolvedPageTranslation);
    LAST_SIGNATURE.set(pathname, signature);
    return;
  }

  const tokenAtStart = runTokenRef.current;
  const { translated, missing } = getCachedTranslations(language, sourceList);

  if (translated.size) {
    applyResolvedTranslations(root, translated);
  }

  if (!missing.length) {
    rememberResolvedPageTranslation(signature, new Map(translated));
    LAST_SIGNATURE.set(pathname, signature);
    return;
  }

  const fetched = await fetchMissingTranslations(language, missing);
  if (tokenAtStart !== runTokenRef.current) return;

  const merged = new Map(translated);
  fetched.forEach((value, key) => merged.set(key, value));
  applyResolvedTranslations(root, merged);
  rememberResolvedPageTranslation(signature, merged);
  LAST_SIGNATURE.set(pathname, signature);
}

export default function AutoTranslator() {
  const { language, setTranslating } = useI18n();
  const location = useLocation();
  const busyRef = useRef(false);
  const timerRef = useRef(null);
  const runTokenRef = useRef(0);
  const prevLanguageRef = useRef("");
  const prevPathnameRef = useRef("");

  useEffect(() => {
    if (!isTranslatablePath(location.pathname)) {
      prevLanguageRef.current = language;
      prevPathnameRef.current = location.pathname;
      return undefined;
    }
    const root = document.getElementById("root");
    if (!root) return undefined;

    let cancelled = false;
    runTokenRef.current += 1;

    const run = async () => {
      if (cancelled || busyRef.current) return;
      busyRef.current = true;
      const currentToken = runTokenRef.current;
      const hasSelectionChange =
        prevLanguageRef.current !== language || prevPathnameRef.current !== location.pathname;
      const shouldLockUi = hasSelectionChange && language !== "en";

      if (shouldLockUi) {
        setTranslating(true);
      }

      try {
        if (language === "en") {
          restoreOriginal(root);
          LAST_SIGNATURE.delete(location.pathname);
          prevLanguageRef.current = language;
          prevPathnameRef.current = location.pathname;
          return;
        }

        if (hasSelectionChange) {
          restoreOriginal(root);
        }
        await applyTranslation(language, location.pathname, root, runTokenRef);
        prevLanguageRef.current = language;
        prevPathnameRef.current = location.pathname;
      } finally {
        busyRef.current = false;
        if (!cancelled && currentToken === runTokenRef.current && shouldLockUi) {
          setTranslating(false);
        }
      }
    };

    const observer = new MutationObserver(() => {
      if (busyRef.current) return;
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(run, 15);
    });

    run();
    observer.observe(root, {
      childList: true,
      subtree: true,
      characterData: true,
    });

    return () => {
      cancelled = true;
      runTokenRef.current += 1;
      setTranslating(false);
      if (timerRef.current) clearTimeout(timerRef.current);
      observer.disconnect();
    };
  }, [language, location.pathname, setTranslating]);

  return null;
}
