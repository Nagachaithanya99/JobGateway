import api from "./api.js";

export async function loginLocalAdmin(payload) {
  const { data } = await api.post("/admin/auth/login", payload);
  return data;
}
