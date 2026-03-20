// frontend/src/services/companyService.js
import api from "./api.js";

export async function getCompanyDashboard() {
  const { data } = await api.get("/company/dashboard");
  return data;
}

export async function getCompanyApplications(params = {}) {
  const { data } = await api.get("/company/applications", { params });
  return data;
}

export async function updateApplicationStatus(applicationId, status) {
  const { data } = await api.patch(`/company/applications/${applicationId}/status`, { status });
  return data;
}

export async function bulkUpdateApplicationStatus(ids = [], status) {
  const { data } = await api.patch(`/company/applications/bulk/status`, { ids, status });
  return data;
}

export async function deleteCompanyApplication(applicationId) {
  const { data } = await api.delete(`/company/applications/${applicationId}`);
  return data;
}

export async function scheduleInterview(applicationId, payload) {
  const { data } = await api.post(`/company/applications/${applicationId}/schedule-interview`, payload);
  return data;
}

export async function createCompanyJob(payload) {
  const { data } = await api.post("/company/jobs", payload);
  return data;
}

export async function listCompanyJobs(params = {}) {
  const { data } = await api.get("/company/jobs", { params });
  return data;
}

export async function getCompanyJob(jobId) {
  const { data } = await api.get(`/company/jobs/${jobId}`);
  return data;
}

export async function updateCompanyJob(jobId, payload) {
  const { data } = await api.patch(`/company/jobs/${jobId}`, payload);
  return data;
}

export async function deleteCompanyJob(jobId) {
  const { data } = await api.delete(`/company/jobs/${jobId}`);
  return data;
}

export async function duplicateCompanyJob(jobId) {
  const { data } = await api.post(`/company/jobs/${jobId}/duplicate`);
  return data;
}

export async function closeJob(jobId) {
  const { data } = await api.patch(`/company/jobs/${jobId}/close`);
  return data;
}

export async function getCompanyHeaderCounts() {
  const { data } = await api.get("/company/header-counts");
  return data;
}

export async function getAIScoringForJob(jobId) {
  const { data } = await api.get(`/company/ai/${jobId}`);
  return data;
}

export async function updateJobAIWeights(jobId, payload) {
  const { data } = await api.patch(`/company/ai/${jobId}/weights`, payload);
  return data;
}

export async function rerunAIForJob(jobId) {
  const { data } = await api.post(`/company/ai/${jobId}/rerun`);
  return data;
}

export async function getCompanyShortlisted(params = {}) {
  const { data } = await api.get("/company/shortlisted", { params });
  return data;
}

export async function updateShortlistedStatus(appId, status) {
  const { data } = await api.patch(`/company/shortlisted/${appId}/status`, { status });
  return data;
}

export async function updateShortlistedStage(appId, stage) {
  const { data } = await api.patch(`/company/shortlisted/${appId}/stage`, { stage });
  return data;
}

export async function sendOffer(appId, payload) {
  const { data } = await api.post(`/company/shortlisted/${appId}/offer`, payload);
  return data;
}

export async function scheduleShortlistedInterview(appId, payload) {
  const { data } = await api.post(`/company/shortlisted/${appId}/schedule-interview`, payload);
  return data;
}

export async function listCompanyNotifications(params = {}) {
  const { data } = await api.get("/company/notifications", { params });
  return data;
}

export async function markCompanyNotificationRead(id, read = true) {
  const { data } = await api.patch(`/company/notifications/${id}/read`, { read });
  return data;
}

export async function markAllCompanyNotificationsRead() {
  const { data } = await api.patch("/company/notifications/read-all");
  return data;
}

export async function seedCompanyNotifications() {
  const { data } = await api.post("/company/notifications/seed");
  return data;
}

export async function getCompanyPlans() {
  const { data } = await api.get("/company/billing/plans");
  return data;
}

export async function getCompanyBillingMe() {
  const { data } = await api.get("/company/billing/me");
  return data;
}

export async function subscribeCompanyPlan(planId, cycle = "monthly") {
  const { data } = await api.post("/company/billing/subscribe", { planId, cycle });
  return data;
}

export async function createCompanySubscriptionOrder(planId, cycle = "monthly") {
  const { data } = await api.post("/company/billing/create-order", { planId, cycle });
  return data;
}

export async function verifyCompanySubscriptionPayment(payload = {}) {
  const { data } = await api.post("/company/billing/verify-payment", payload);
  return data;
}

export async function cancelCompanyPlan() {
  const { data } = await api.post("/company/billing/cancel");
  return data;
}

export async function getBoostPlans() {
  const { data } = await api.get("/company/boost/plans");
  return data;
}

export async function listCompanyBoosts() {
  const { data } = await api.get("/company/boosts");
  return data;
}

export async function boostCompanyJob(jobId, payload) {
  const { data } = await api.post(`/company/jobs/${jobId}/boost`, payload);
  return data;
}

export async function cancelCompanyBoost(boostId) {
  const { data } = await api.patch(`/company/boosts/${boostId}/cancel`);
  return data;
}

export async function extendCompanyBoost(boostId, extraDays = 7) {
  const { data } = await api.patch(`/company/boosts/${boostId}/extend`, { extraDays });
  return data;
}

export async function getCompanySettingsMe() {
  const { data } = await api.get("/company/settings/me");
  return data;
}

export async function getCompanyProfileMe() {
  const { data } = await api.get("/company/profile/me");
  return data;
}

export async function updateCompanyProfile(payload) {
  const { data } = await api.patch("/company/settings/profile", payload);
  return data;
}

export async function updateCompanyPreferences(payload) {
  const { data } = await api.patch("/company/settings/preferences", payload);
  return data;
}

export async function updateCompanyNotifications(payload) {
  const { data } = await api.patch("/company/settings/notifications", payload);
  return data;
}

export async function updateCompanyBilling(payload) {
  const { data } = await api.patch("/company/settings/billing", payload);
  return data;
}

export async function updateCompanyPrivacy(payload) {
  const { data } = await api.patch("/company/settings/privacy", payload);
  return data;
}

export async function inviteCompanyTeamMember(payload) {
  const { data } = await api.post("/company/settings/team/invite", payload);
  return data;
}

export async function removeCompanyTeamMember(memberId) {
  const { data } = await api.delete(`/company/settings/team/${memberId}`);
  return data;
}

export async function updateCompanyTeamMemberRole(memberId, role) {
  const { data } = await api.patch(`/company/settings/team/${memberId}`, { role });
  return data;
}

export async function exportCompanyData() {
  const { data } = await api.get("/company/settings/export");
  return data;
}

export async function deleteCompanyAccount(confirm = "DELETE") {
  const { data } = await api.post("/company/settings/account/delete", { confirm });
  return data;
}

export async function sendCompanySecurityOtp(purpose = "verify_email") {
  const { data } = await api.post("/company/settings/security/send-otp", { purpose });
  return data;
}

export async function verifyCompanySecurityOtp(otp, purpose = "verify_email") {
  const { data } = await api.post("/company/settings/security/verify-otp", { otp, purpose });
  return data;
}

export async function updateCompanySecurity(payload) {
  const { data } = await api.patch("/company/settings/security", payload);
  return data;
}
