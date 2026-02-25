import api from "./api.js";

export async function getMyLanguagePreference() {
  const { data } = await api.get("/preferences/language");
  return data || {};
}

export async function saveMyLanguagePreference(language) {
  const { data } = await api.put("/preferences/language", { language });
  return data || {};
}

export async function translateTexts(language, texts = []) {
  const { data } = await api.post("/preferences/translate", { language, texts });
  return data || { language, translations: [] };
}
