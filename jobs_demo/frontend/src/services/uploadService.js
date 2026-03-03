import api from "./api.js";

/**
 * Upload Resume
 * POST /api/upload/resume
 */
export const uploadResume = async (file) => {
  const formData = new FormData();
  formData.append("file", file);

  return api.post("/upload/resume", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

export const uploadMessageAttachment = async (file) => {
  const formData = new FormData();
  formData.append("file", file);

  return api.post("/upload/message-attachment", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

export const uploadContentImage = async (file) => {
  const formData = new FormData();
  formData.append("file", file);

  return api.post("/upload/content-image", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

const uploadService = {
  uploadResume,
  uploadMessageAttachment,
  uploadContentImage,
};

export default uploadService;
