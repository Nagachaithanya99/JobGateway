export const DEFAULT_LANGUAGE = "en";

export const LANGUAGE_CATALOG = [
  { code: "en", label: "English", native: "English", popular: true },
  { code: "hi", label: "Hindi", native: "Hindi", popular: true },
  { code: "es", label: "Spanish", native: "Espanol", popular: true },
  { code: "fr", label: "French", native: "Francais", popular: true },
  { code: "de", label: "German", native: "Deutsch", popular: true },
  { code: "pt", label: "Portuguese", native: "Portugues", popular: true },
  { code: "ar", label: "Arabic", native: "العربية", popular: true, rtl: true },
  { code: "zh", label: "Chinese", native: "中文", popular: true },
  { code: "ja", label: "Japanese", native: "日本語", popular: true },
  { code: "ko", label: "Korean", native: "한국어", popular: false },
  { code: "ru", label: "Russian", native: "Русский", popular: false },
  { code: "it", label: "Italian", native: "Italiano", popular: false },
  { code: "nl", label: "Dutch", native: "Nederlands", popular: false },
  { code: "tr", label: "Turkish", native: "Turkce", popular: false },
  { code: "pl", label: "Polish", native: "Polski", popular: false },
  { code: "uk", label: "Ukrainian", native: "Українська", popular: false },
  { code: "id", label: "Indonesian", native: "Bahasa Indonesia", popular: false },
  { code: "vi", label: "Vietnamese", native: "Tieng Viet", popular: false },
  { code: "th", label: "Thai", native: "ไทย", popular: false },
  { code: "bn", label: "Bengali", native: "বাংলা", popular: false },
  { code: "ta", label: "Tamil", native: "தமிழ்", popular: false },
  { code: "te", label: "Telugu", native: "తెలుగు", popular: false },
  { code: "kn", label: "Kannada", native: "ಕನ್ನಡ", popular: false },
  { code: "ml", label: "Malayalam", native: "മലയാളം", popular: false },
  { code: "mr", label: "Marathi", native: "मराठी", popular: false },
  { code: "gu", label: "Gujarati", native: "ગુજરાતી", popular: false },
  { code: "pa", label: "Punjabi", native: "ਪੰਜਾਬੀ", popular: false },
  { code: "ur", label: "Urdu", native: "اردو", popular: false, rtl: true },
];

export const SUPPORTED_LANGUAGE_CODES = LANGUAGE_CATALOG.map((x) => x.code);

export function normalizeLanguage(value) {
  const raw = String(value || "").trim().toLowerCase();
  if (!raw) return DEFAULT_LANGUAGE;
  if (SUPPORTED_LANGUAGE_CODES.includes(raw)) return raw;
  const base = raw.split("-")[0];
  if (SUPPORTED_LANGUAGE_CODES.includes(base)) return base;
  return DEFAULT_LANGUAGE;
}
