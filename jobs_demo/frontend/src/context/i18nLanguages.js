export const DEFAULT_LANGUAGE = "en";

export const LANGUAGE_CATALOG = [
  { code: "en", label: "English", native: "English", popular: true },
  { code: "hi", label: "Hindi", native: "Hindi", popular: true },
  { code: "kn", label: "Kannada", native: "ಕನ್ನಡ", popular: true },
  { code: "te", label: "Telugu", native: "తెలుగు", popular: true },
  { code: "ta", label: "Tamil", native: "தமிழ்", popular: true },
];

export const SUPPORTED_LANGUAGE_CODES = LANGUAGE_CATALOG.map((language) => language.code);

export function normalizeLanguage(value) {
  const raw = String(value || "").trim().toLowerCase();
  if (!raw) return DEFAULT_LANGUAGE;
  if (SUPPORTED_LANGUAGE_CODES.includes(raw)) return raw;
  const base = raw.split("-")[0];
  if (SUPPORTED_LANGUAGE_CODES.includes(base)) return base;
  return DEFAULT_LANGUAGE;
}
