import api from "./api.js";

export async function listCompanyThreads(params = {}) {
  const { data } = await api.get("/company/messages/threads", { params });
  return data; // { items, total }
}

export async function getCompanyThread(threadId) {
  const { data } = await api.get(`/company/messages/threads/${threadId}`);
  return data; // { thread, messages }
}

export async function createCompanyThread(payload) {
  const { data } = await api.post("/company/messages/threads", payload);
  return data; // { message, thread }
}

export async function sendCompanyMessage(threadId, payload) {
  const { data } = await api.post(`/company/messages/threads/${threadId}/send`, payload);
  return data; // { ok, message }
}

export async function markCompanyThreadRead(threadId) {
  const { data } = await api.patch(`/company/messages/threads/${threadId}/read`);
  return data;
}

export async function updateCompanyThreadMeta(threadId, payload) {
  const { data } = await api.patch(`/company/messages/threads/${threadId}/meta`, payload);
  return data;
}

export async function reportCompanyThreadSpam(threadId, payload) {
  const { data } = await api.post(`/company/messages/threads/${threadId}/spam-report`, payload);
  return data;
}

