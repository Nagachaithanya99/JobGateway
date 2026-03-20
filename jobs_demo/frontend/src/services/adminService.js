// frontend/src/services/adminService.js
import api from "./api.js";

/**
 * Admin Dashboard
 * GET /api/admin/dashboard
 */
export async function adminGetDashboard() {
  const { data } = await api.get("/admin/dashboard");
  return data;
}

/**
 * Plan Requests (Approve / Reject)
 * POST /api/admin/plan-requests/:id/approve
 * POST /api/admin/plan-requests/:id/reject
 */
export async function adminApprovePlanRequest(id) {
  const { data } = await api.post(`/admin/plan-requests/${id}/approve`);
  return data;
}

export async function adminRejectPlanRequest(id) {
  const { data } = await api.post(`/admin/plan-requests/${id}/reject`);
  return data;
}

/* =========================
   ✅ Step 2: Companies APIs
   ========================= */

export async function adminListCompanies(params = {}) {
  const { data } = await api.get("/admin/companies", { params });
  return data?.rows || [];
}

export async function adminCreateCompany(payload) {
  const { data } = await api.post("/admin/companies", payload);
  return data;
}

export async function adminGetCompanyDetails(companyId) {
  const { data } = await api.get(`/admin/companies/${companyId}`);
  return data;
}

export async function adminToggleCompanyStatus(companyId, nextStatus) {
  const { data } = await api.patch(`/admin/companies/${companyId}/status`, { status: nextStatus });
  return data;
}

/* =========================
   ✅ Step 3: Jobs APIs (REAL)
   ========================= */

/**
 * GET /api/admin/jobs
 * params supported by backend:
 * q, status, company, stream, category, location, minApplications, postedAfter, page, limit
 *
 * Backend returns: { rows, page, limit, total }
 * This function returns: rows[]
 */
export async function adminListJobs(params = {}, options = {}) {
  const { data } = await api.get("/admin/jobs", { params });
  if (options?.withMeta) {
    return data || { rows: [], page: 1, limit: 0, total: 0 };
  }
  return data?.rows || [];
}

export async function adminCreateJob(payload) {
  const { data } = await api.post("/admin/jobs", payload);
  return data;
}

/**
 * GET /api/admin/jobs/:id
 * returns: { job, raw? }
 */
export async function adminGetJobDetails(jobId) {
  const { data } = await api.get(`/admin/jobs/${jobId}`);
  return data;
}

/**
 * PATCH /api/admin/jobs/:id/status
 * body: { status: "active" | "disabled" | "closed" }
 */
export async function adminToggleJobStatus(jobId, nextStatus) {
  const { data } = await api.patch(`/admin/jobs/${jobId}/status`, { status: nextStatus });
  return data; // { ok, job }
}

/**
 * DELETE /api/admin/jobs/:id
 */
export async function adminDeleteJob(jobId) {
  const { data } = await api.delete(`/admin/jobs/${jobId}`);
  return data; // { ok, id }
}

/* =========================================================
   The below API functions are placeholders for next steps
   ========================================================= */

/** Applicants */
export async function adminListApplicants(params = {}, options = {}) {
  const { data } = await api.get("/admin/applications", { params });
  if (options?.withMeta) return data || { rows: [], page: 1, limit: 0, total: 0 };
  return data?.rows || [];
}

export async function adminGetApplicant(id) {
  const { data } = await api.get(`/admin/applications/${id}`);
  return data;
}

export async function adminUpdateApplicantStatus(applicantId, nextStatus) {
  const { data } = await api.patch(`/admin/applications/${applicantId}/status`, { status: nextStatus });
  return data;
}

export async function adminDeleteApplicant(applicantId) {
  const { data } = await api.delete(`/admin/applications/${applicantId}`);
  return data;
}

/** Students */
export async function adminListStudents(params = {}, options = {}) {
  const { data } = await api.get("/admin/students", { params });
  if (options?.withMeta) return data || { rows: [], page: 1, limit: 0, total: 0 };
  return data?.rows || [];
}

export async function adminGetStudent(id) {
  const { data } = await api.get(`/admin/students/${id}`);
  return data;
}

export async function adminToggleStudentStatus(studentId, nextStatus) {
  const { data } = await api.patch(`/admin/students/${studentId}/status`, { status: nextStatus });
  return data; // { ok, student }
}

export async function adminDeleteStudent(studentId) {
  const { data } = await api.delete(`/admin/students/${studentId}`);
  return data; // { ok, id }
}

/** Pricing / Plans */
export async function adminListPlans() {
  const { data } = await api.get("/admin/plans");
  return data?.rows || [];
}

export async function adminSavePlan(plan) {
  const { data } = await api.post("/admin/plans", plan);
  return data;
}

export async function adminDeletePlan(planId) {
  const { data } = await api.delete(`/admin/plans/${planId}`);
  return data;
}

export async function adminListPlanRequests() {
  const { data } = await api.get("/admin/plan-requests");
  return data?.rows || [];
}

export async function adminUpdatePlanRequest(requestId, nextStatus) {
  const { data } = await api.patch(`/admin/plan-requests/${requestId}`, {
    status: nextStatus,
  });
  return data;
}

/** Content */
export async function adminGetContent() {
  const { data } = await api.get("/admin/content");
  return data || {
    homeSlides: [],
    publicPages: [],
    blogs: [],
    announcements: [],
    featuredCompanies: [],
    banners: [],
    testimonials: [],
    placed: [],
    internship: [],
    interviewQuestions: [],
    mockTests: [],
    featuredCompanies: [],
    announcements: [],
    governmentQuick: [],
  };
}

export async function adminSaveContentItem(payload) {
  const { data } = await api.post("/admin/content/item", payload);
  return data;
}

export async function adminDeleteContentItem(id) {
  const { data } = await api.delete(`/admin/content/item/${id}`);
  return data;
}

export async function adminUpdateContentStatus(id, status) {
  const { data } = await api.patch(`/admin/content/item/${id}/status`, { status });
  return data;
}

export async function adminBulkContentAction(ids = [], action = "publish") {
  const { data } = await api.post("/admin/content/bulk", { ids, action });
  return data;
}
/** Government updates */
export async function adminListGovUpdates(params = {}, options = {}) {
  const { data } = await api.get("/admin/government-updates", { params });
  if (options?.withMeta) return data || { rows: [] };
  return data?.rows || [];
}

export async function adminSaveGovUpdate(update) {
  const { data } = await api.post("/admin/government-updates", update);
  return data;
}

export async function adminUpdateGovStatus(id, status) {
  const { data } = await api.patch(`/admin/government-updates/${id}/status`, { status });
  return data;
}

export async function adminDeleteGovUpdate(id) {
  const { data } = await api.delete(`/admin/government-updates/${id}`);
  return data;
}

export async function adminBulkGovUpdates(ids = [], action = "publish") {
  const { data } = await api.post("/admin/government-updates/bulk", { ids, action });
  return data;
}
/** Roles & Permissions */
export async function adminGetRolesPermissions() {
  const { data } = await api.get("/admin/roles-permissions");
  return data || { roles: [], users: [], selectedRoleId: "" };
}

export async function adminSaveRole(role) {
  const { data } = await api.post("/admin/roles", role);
  return data;
}

export async function adminDeleteRole(roleId) {
  const { data } = await api.delete(`/admin/roles/${roleId}`);
  return data;
}

export async function adminSaveRolePermissions(roleId, permissions) {
  const { data } = await api.patch(`/admin/roles/${roleId}/permissions`, { permissions });
  return data;
}

export async function adminSaveAdminUser(payload) {
  const { data } = await api.post("/admin/admin-users", payload);
  return data;
}

export async function adminToggleAdminUserStatus(userId, status) {
  const { data } = await api.patch(`/admin/admin-users/${userId}/status`, { status });
  return data;
}

export async function adminDeleteAdminUser(userId) {
  const { data } = await api.delete(`/admin/admin-users/${userId}`);
  return data;
}
/** Notifications */
export async function adminGetNotificationsCenter() {
  const { data } = await api.get("/admin/notifications-center");
  return data || { notifications: [], settings: {}, templates: [] };
}

export async function adminUpdateNotificationStatus(id, status) {
  const { data } = await api.patch(`/admin/notifications/${id}/status`, { status });
  return data;
}

export async function adminDeleteNotification(id) {
  const { data } = await api.delete(`/admin/notifications/${id}`);
  return data;
}

export async function adminSaveNotificationTemplate(payload) {
  const { data } = await api.post("/admin/notification-templates", payload);
  return data;
}

export async function adminToggleNotificationTemplateStatus(id, status) {
  const { data } = await api.patch(`/admin/notification-templates/${id}/status`, { status });
  return data;
}

export async function adminDeleteNotificationTemplate(id) {
  const { data } = await api.delete(`/admin/notification-templates/${id}`);
  return data;
}

export async function adminUpdateNotificationSetting(key, payload) {
  const { data } = await api.patch(`/admin/notification-settings/${key}`, payload);
  return data;
}

export async function adminSendBroadcastNotification(payload) {
  const { data } = await api.post("/admin/notifications/broadcast", payload);
  return data;
}
export async function adminListSpamReports(params = {}, options = {}) {
  const { data } = await api.get("/admin/spam-reports", { params });
  if (options?.withMeta) return data || { rows: [], total: 0, page: 1, limit: 20 };
  return data?.rows || [];
}
export async function adminReviewSpamReport(id, payload = {}) {
  const { data } = await api.patch(`/admin/spam-reports/${id}/review`, payload);
  return data;
}
/** Profile */
export async function adminGetProfile() {
  const { data } = await api.get("/admin/profile");
  return data || {};
}

export async function adminSaveProfile(payload) {
  const { data } = await api.put("/admin/profile", payload);
  return data;
}
/** Settings */
export async function adminGetSettings() {
  const { data } = await api.get("/admin/settings");
  return data || {};
}

export async function adminSaveSettings(updated) {
  const { data } = await api.put("/admin/settings", updated);
  return data;
}

export async function adminGetAdsCenter() {
  const { data } = await api.get("/admin/ads-center");
  return data || { requests: [], ads: [] };
}

export async function adminUpdateAdsPlanRequest(id, status) {
  const { data } = await api.patch(`/admin/ads/plan-requests/${id}`, { status });
  return data;
}

export async function adminUpdateAdStatus(id, payload = {}) {
  const { data } = await api.patch(`/admin/ads/${id}/status`, payload);
  return data;
}

export async function adminSaveAdPlan(plan) {
  const { data } = await api.post("/admin/ads/plans", plan);
  return data;
}

export async function adminDeleteAdPlan(id) {
  const { data } = await api.delete(`/admin/ads/plans/${id}`);
  return data;
}


