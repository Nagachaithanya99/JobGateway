import api from "./api.js";

export async function getCareerPulseFeed(params = {}) {
  const { data } = await api.get("/social/feed", { params });
  return data;
}

export async function getCareerPulseMessageThreads(params = {}) {
  const { data } = await api.get("/social/messages/threads", { params });
  return data;
}

export async function openCareerPulseMessageThread(payload = {}) {
  const { data } = await api.post("/social/messages/open", payload);
  return data;
}

export async function getCareerPulseMessageThread(threadId) {
  const { data } = await api.get(`/social/messages/threads/${threadId}`);
  return data;
}

export async function sendCareerPulseMessage(threadId, payload = {}) {
  const { data } = await api.post(`/social/messages/threads/${threadId}/send`, payload);
  return data;
}

export async function acceptCareerPulseMessageRequest(threadId) {
  const { data } = await api.post(`/social/messages/threads/${threadId}/accept`);
  return data;
}

export async function markCareerPulseMessageThreadRead(threadId) {
  const { data } = await api.patch(`/social/messages/threads/${threadId}/read`);
  return data;
}

export async function getCareerPulseNotifications(params = {}) {
  const { data } = await api.get("/social/notifications", { params });
  return data;
}

export async function markCareerPulseNotificationsRead(notificationId = "") {
  const path = notificationId
    ? `/social/notifications/${notificationId}/read`
    : "/social/notifications/read";
  const { data } = await api.post(path);
  return data;
}

export async function getCareerPulseStories(params = {}) {
  const { data } = await api.get("/social/stories", { params });
  return data;
}

export async function createCareerPulseStory(payload = {}) {
  const { data } = await api.post("/social/stories", payload);
  return data;
}

export async function getCareerPulseMusicTracks(params = {}) {
  const { data } = await api.get("/social/music/tracks", { params });
  return data;
}

export async function markCareerPulseStoryViewed(storyId) {
  const { data } = await api.post(`/social/stories/${storyId}/view`);
  return data;
}

export async function createCareerPulsePost(payload = {}) {
  const { data } = await api.post("/social/posts", payload);
  return data;
}

export async function toggleCareerPulseLike(postId) {
  const { data } = await api.post(`/social/posts/${postId}/like`);
  return data;
}

export async function toggleCareerPulseSave(postId) {
  const { data } = await api.post(`/social/posts/${postId}/save`);
  return data;
}

export async function addCareerPulseComment(postId, payload = {}) {
  const { data } = await api.post(`/social/posts/${postId}/comments`, payload);
  return data;
}

export async function getCareerPulseComments(postId, params = {}) {
  const { data } = await api.get(`/social/posts/${postId}/comments`, { params });
  return data;
}

export async function toggleCareerPulseFollow(targetId) {
  const { data } = await api.post(`/social/follow/${targetId}`);
  return data;
}

export async function shareCareerPulsePost(postId) {
  const { data } = await api.post(`/social/posts/${postId}/share`);
  return data;
}

export async function reportCareerPulsePost(postId, payload = {}) {
  const { data } = await api.post(`/social/posts/${postId}/report`, payload);
  return data;
}

export async function startCareerPulseMessage(recipientId) {
  const { data } = await api.post("/social/message", { recipientId });
  return data;
}
