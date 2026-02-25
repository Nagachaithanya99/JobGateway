import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { useI18n } from "../../context/I18nContext.jsx";
import { translateTexts } from "../../services/i18nService.js";

const ORIGINAL_TEXT = new WeakMap();
const ORIGINAL_ATTRS = new WeakMap();
const TEXT_CACHE = new Map();
const LAST_SIGNATURE = new Map();
const ATTRS = ["placeholder", "title", "aria-label"];
const LOCAL_CACHE_PREFIX = "i18n_text_cache_";

function isStudentPath(pathname = "") {
  return pathname.startsWith("/student");
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
    if (!shouldTranslateText(text)) continue;
    if (!ORIGINAL_TEXT.has(node)) ORIGINAL_TEXT.set(node, text);
    textNodes.push(node);
  }

  const elements = root.querySelectorAll("*");
  elements.forEach((el) => {
    if (isSkippableElement(el)) return;
    ATTRS.forEach((attr) => {
      const value = el.getAttribute(attr);
      if (!shouldTranslateText(value)) return;
      rememberAttrOriginal(el, attr, value);
      attrTargets.push({ el, attr, value });
    });
    if (el.tagName === "INPUT") {
      const type = String(el.getAttribute("type") || "").toLowerCase();
      if (type === "button" || type === "submit") {
        const value = el.getAttribute("value");
        if (shouldTranslateText(value)) {
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
    const orig = ORIGINAL_ATTRS.get(el)?.[attr];
    if (typeof orig === "string") el.setAttribute(attr, orig);
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
    ["hi", "te", "ta", "kn"].forEach((lang) => {
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
    if (keys.length > 2000) {
      const sliced = keys.slice(keys.length - 2000);
      const trimmed = {};
      sliced.forEach((k) => {
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

async function batchTranslate(language, texts) {
  loadLocalCache();
  const result = new Map();
  const pending = texts.filter((t) => !TEXT_CACHE.has(`${language}:${t}`));

  for (const part of chunk(pending, 50)) {
    try {
      const res = await translateTexts(language, part);
      const translated = Array.isArray(res?.translations) ? res.translations : [];
      const cacheEntries = [];
      part.forEach((src, idx) => {
        const next = String(translated[idx] || src);
        TEXT_CACHE.set(`${language}:${src}`, next);
        cacheEntries.push([src, next]);
      });
      if (cacheEntries.length) saveLocalCache(language, cacheEntries);
    } catch {
      part.forEach((src) => {
        TEXT_CACHE.set(`${language}:${src}`, src);
      });
    }
  }

  texts.forEach((src) => {
    const key = `${language}:${src}`;
    result.set(src, TEXT_CACHE.get(key) || src);
  });

  return result;
}

async function applyTranslation(language, root) {
  const { textNodes, attrTargets } = collectTargets(root);
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
  const signature = `${language}::${sourceList.join("||")}`;
  if (LAST_SIGNATURE.get(language) === signature) return;
  LAST_SIGNATURE.set(language, signature);

  const map = await batchTranslate(language, sourceList);

  textNodes.forEach((node) => {
    const original = ORIGINAL_TEXT.get(node) || node.nodeValue || "";
    if (!shouldTranslateText(original)) return;
    node.nodeValue = map.get(original) || original;
  });

  attrTargets.forEach(({ el, attr, value }) => {
    const original = ORIGINAL_ATTRS.get(el)?.[attr] || value;
    if (!shouldTranslateText(original)) return;
    el.setAttribute(attr, map.get(original) || original);
  });
}

export default function StudentAutoTranslator() {
  const { language } = useI18n();
  const location = useLocation();
  const busyRef = useRef(false);
  const timerRef = useRef(null);

  useEffect(() => {
    if (!isStudentPath(location.pathname)) return undefined;
    const root = document.getElementById("root");
    if (!root) return undefined;

    let cancelled = false;

    const run = async () => {
      if (cancelled || busyRef.current) return;
      busyRef.current = true;
      if (language === "en") {
        restoreOriginal(root);
        busyRef.current = false;
        return;
      }
      try {
        await applyTranslation(language, root);
      } finally {
        busyRef.current = false;
      }
    };

    const observer = new MutationObserver(() => {
      if (busyRef.current) return;
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(run, 90);
    });

    run();
    observer.observe(root, {
      childList: true,
      subtree: true,
    });

    return () => {
      cancelled = true;
      if (timerRef.current) clearTimeout(timerRef.current);
      observer.disconnect();
    };
  }, [language, location.pathname]);

  return null;
}
