import api from "./api.js";

export async function getStudentHomeContent() {
  const { data } = await api.get("/content/student-home");
  return data || { banners: [], announcements: [], featuredCompanies: [] };
}

export async function getPublicContent() {
  const { data } = await api.get("/content/public");
  return data || { banners: [], announcements: [], publicPages: [], blogs: [] };
}
