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

export const uploadAdMedia = async (file) => {
  const formData = new FormData();
  formData.append("file", file);

  return api.post("/upload/ad-media", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

export const uploadAdMediaFromUrl = async (url) => {
  return api.post("/upload/ad-media/link", { url });
};

export const uploadSocialMedia = async (file) => {
  const formData = new FormData();
  formData.append("file", file);

  return api.post("/upload/social-media", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

const uploadService = {
  uploadResume,
  uploadMessageAttachment,
  uploadContentImage,
  uploadAdMedia,
  uploadAdMediaFromUrl,
  uploadSocialMedia,
};

export default uploadService;
