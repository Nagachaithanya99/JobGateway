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