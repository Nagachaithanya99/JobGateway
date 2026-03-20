import api from "./api.js";

export async function getCareerPulseFeed(params = {}) {
  const { data } = await api.get("/social/feed", { params });
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

export async function addCareerPulseComment(postId, payload = {}) {
  const { data } = await api.post(`/social/posts/${postId}/comments`, payload);
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

export async function startCareerPulseMessage(recipientId) {
  const { data } = await api.post("/social/message", { recipientId });
  return data;
}
