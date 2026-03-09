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

export async function getCompanyInterviewWorkspace(id) {
  const { data } = await api.get(`/company/interviews/${id}/workspace`);
  return data;
}

export async function startCompanyInterview(id) {
  const { data } = await api.post(`/company/interviews/${id}/start`);
  return data;
}

export async function admitCompanyCandidate(id) {
  const { data } = await api.post(`/company/interviews/${id}/admit`);
  return data;
}

export async function endCompanyInterviewRound(id, payload = {}) {
  const { data } = await api.post(`/company/interviews/${id}/end-round`, payload);
  return data;
}

export async function endCompanyInterview(id, payload = {}) {
  const { data } = await api.post(`/company/interviews/${id}/end`, payload);
  return data;
}

export async function companyInterviewChat(id, text) {
  const { data } = await api.post(`/company/interviews/${id}/chat`, { text });
  return data;
}

export async function companyInterviewQuestion(id, text) {
  const { data } = await api.post(`/company/interviews/${id}/questions`, { text });
  return data;
}

export async function companyInterviewQuestionDraft(id, text) {
  const { data } = await api.patch(`/company/interviews/${id}/questions/draft`, { text });
  return data;
}

export async function companyInterviewCode(id, payload = {}) {
  const { data } = await api.patch(`/company/interviews/${id}/code`, payload);
  return data;
}

export async function companyRunInterviewCode(id) {
  const { data } = await api.post(`/company/interviews/${id}/code/run`);
  return data;
}

export async function companyInterviewScreenShare(id, active) {
  const { data } = await api.patch(`/company/interviews/${id}/screen-share`, { active });
  return data;
}

export async function companyInterviewWebrtcOffer(id, payload = {}) {
  const { data } = await api.post(`/company/interviews/${id}/webrtc/offer`, payload);
  return data;
}

export async function companyInterviewWebrtcCandidate(id, payload = {}) {
  const { data } = await api.post(`/company/interviews/${id}/webrtc/candidate`, payload);
  return data;
}

export async function getStudentInterviews(params = {}) {
  const { data } = await api.get("/student/interviews", { params });
  return data;
}

export async function studentCompletePreJoin(id, payload = {}) {
  const { data } = await api.post(`/student/interviews/${id}/prejoin`, payload);
  return data;
}

export async function studentEnterWaitingRoom(id) {
  const { data } = await api.post(`/student/interviews/${id}/waiting-room`);
  return data;
}

export async function getStudentInterviewWorkspace(id) {
  const { data } = await api.get(`/student/interviews/${id}/workspace`);
  return data;
}

export async function studentCancelInterview(id) {
  const { data } = await api.post(`/student/interviews/${id}/cancel`);
  return data;
}

export async function studentInterviewChat(id, text) {
  const { data } = await api.post(`/student/interviews/${id}/chat`, { text });
  return data;
}

export async function studentInterviewQuestion(id, text) {
  const { data } = await api.post(`/student/interviews/${id}/questions`, { text });
  return data;
}

export async function studentInterviewQuestionDraft(id, text) {
  const { data } = await api.patch(`/student/interviews/${id}/questions/draft`, { text });
  return data;
}

export async function studentInterviewCode(id, payload = {}) {
  const { data } = await api.patch(`/student/interviews/${id}/code`, payload);
  return data;
}

export async function studentInterviewScreenShare(id, active) {
  const { data } = await api.patch(`/student/interviews/${id}/screen-share`, { active });
  return data;
}

export async function studentInterviewWebrtcAnswer(id, payload = {}) {
  const { data } = await api.post(`/student/interviews/${id}/webrtc/answer`, payload);
  return data;
}

export async function studentInterviewWebrtcCandidate(id, payload = {}) {
  const { data } = await api.post(`/student/interviews/${id}/webrtc/candidate`, payload);
  return data;
}

export async function adminListInterviews(params = {}) {
  const { data } = await api.get("/admin/interviews", { params });
  return data;
}

export async function adminInterviewWorkspace(id) {
  const { data } = await api.get(`/admin/interviews/${id}/workspace`);
  return data;
}

export async function adminStartInterview(id) {
  const { data } = await api.post(`/admin/interviews/${id}/start`);
  return data;
}

export async function adminEndInterview(id, payload = {}) {
  const { data } = await api.post(`/admin/interviews/${id}/end`, payload);
  return data;
}

