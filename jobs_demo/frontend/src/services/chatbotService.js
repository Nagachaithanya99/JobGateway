import api from "./api.js";

export async function sendChatbotMessage(message, conversationId) {
  const payload = { message };
  if (conversationId) payload.conversationId = conversationId;
  const { data } = await api.post("/chatbot/message", payload);
  return data;
}
