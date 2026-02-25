import api from "./api.js";

/* =========================================
   Jobs Service (Backend-ready)
   + Backward compatible aliases (old UI)
========================================= */

/**
 * GET /student/jobs
 */
export const jobsList = (params = {}) => api.get("/student/jobs", { params });

/**
 * GET /student/jobs/:id
 */
export const jobGet = (id) => api.get(`/student/jobs/${id}`);

/**
 * POST /student/jobs/:id/apply
 */
export const jobApply = (id) => api.post(`/student/jobs/${id}/apply`);

/* =========================================
   BACKWARD COMPATIBLE EXPORTS (Old UI names)
========================================= */

/**
 * OLD: jobsGetById(id)
 * NEW: jobGet(id)
 * Returns: job object (not axios response)
 */
export async function jobsGetById(id) {
  const res = await jobGet(id);
  return res.data;
}

/**
 * OLD UI used jobsList(filters) returning array directly.
 * Now return array directly for compatibility.
 */
export async function jobsListPlain(filters = {}) {
  const res = await jobsList(filters);
  return res.data;
}
