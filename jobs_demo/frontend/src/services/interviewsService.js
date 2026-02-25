// src/services/interviewsService.js
import api from "./api.js";

export async function getCompanyInterviews(params = {}) {
  const { data } = await api.get("/company/interviews", { params });
  return data; // { items, total }
}

export async function createCompanyInterview(payload) {
  const { data } = await api.post("/company/interviews", payload);
  return data; // { message, interview }
}

export async function updateCompanyInterview(id, payload) {
  const { data } = await api.patch(`/company/interviews/${id}`, payload);
  return data; // { ok, interview }
}

export async function updateCompanyInterviewStatus(id, status) {
  const { data } = await api.patch(`/company/interviews/${id}/status`, { status });
  return data; // { ok, interview }
}

export async function addCompanyInterviewNote(id, text) {
  const { data } = await api.post(`/company/interviews/${id}/notes`, { text });
  return data; // { ok, interview }
}

export async function deleteCompanyInterview(id) {
  const { data } = await api.delete(`/company/interviews/${id}`);
  return data; // { ok }
}

