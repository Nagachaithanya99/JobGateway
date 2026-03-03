import api from "./api.js";

const authConfig = (token, extra = {}) => ({
  ...extra,
  ...(token ? { headers: { ...(extra.headers || {}), Authorization: `Bearer ${token}` } } : {}),
});

export const studentHome = async () => api.get("/student/home");

export const studentSearchJobs = async (params = {}) =>
  api.get("/student/jobs", { params });

export const studentApplyJob = async (jobOrPayload = {}) => {
  const id =
    typeof jobOrPayload === "string"
      ? jobOrPayload
      : jobOrPayload?.id || jobOrPayload?._id;

  if (!id) {
    throw new Error("Job id is required to apply");
  }

  return api.post(`/student/jobs/${id}/apply`);
};

export const studentGetSavedJobs = async () =>
  api.get("/student/me/saved-jobs");

export const studentListSavedJobs = async (params = {}) =>
  api.get("/student/me/saved-jobs", {
    params: {
      ...params,
      withMeta: 1,
    },
  });

export const studentToggleSaveJob = async (jobId) => {
  if (!jobId) {
    throw new Error("Job id is required");
  }
  return api.post(`/student/jobs/${jobId}/save`);
};

export const studentMe = async (token) =>
  api.get("/student/me", authConfig(token));

export const studentUpdateProfile = async (payload = {}, token) =>
  api.put("/student/me", payload, authConfig(token));

export const studentMyApplications = async (params = {}) =>
  api.get("/student/me/applications", { params });

export const studentGetResume = async () =>
  api.get("/student/me/resume");

export const studentSaveResume = async (payload = {}) =>
  api.put("/student/me/resume", payload);

export const studentDownloadResumePDF = async () =>
  api.get("/student/me/resume/pdf", { responseType: "blob" });

export const studentGetSettings = async () =>
  api.get("/student/settings");

export const studentSaveSettings = async (payload = {}) =>
  api.put("/student/settings", payload);

export const studentDeleteAccount = async () =>
  api.delete("/student/settings");

export const studentListGovernmentJobs = async (params = {}) =>
  api.get("/student/government", { params });

export const studentGetGovernmentJobDetails = async (id) => {
  if (!id) {
    throw new Error("Government job id is required");
  }
  return api.get(`/student/government/${id}`);
};

export const studentListConversations = async () =>
  api.get("/student/conversations");

export const studentGetConversationMessages = async (conversationId) => {
  if (!conversationId) {
    throw new Error("Conversation id is required");
  }
  return api.get(`/student/conversations/${conversationId}/messages`);
};

export const studentSendConversationMessage = async (conversationId, payload = {}) => {
  if (!conversationId) {
    throw new Error("Conversation id is required");
  }
  return api.post(`/student/conversations/${conversationId}/messages`, payload);
};

export const studentReportConversationSpam = async (conversationId, payload = {}) => {
  if (!conversationId) {
    throw new Error("Conversation id is required");
  }
  return api.post(`/student/conversations/${conversationId}/spam-report`, payload);
};

export const studentListNotifications = async (params = {}) =>
  api.get("/student/notifications", { params });

export const studentMarkAllNotificationsRead = async () =>
  api.post("/student/notifications/mark-all-read");

export const studentToggleNotificationRead = async (notificationId) => {
  if (!notificationId) {
    throw new Error("Notification id is required");
  }
  return api.patch(`/student/notifications/${notificationId}/toggle`);
};

export const studentGetNotificationPrefs = async () =>
  api.get("/student/notifications/preferences");

export const studentSaveNotificationPrefs = async (payload = {}) =>
  api.put("/student/notifications/preferences", payload);

export const studentListInterviews = async (params = {}) =>
  api.get("/student/interviews", { params });
