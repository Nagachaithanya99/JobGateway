// backend/src/routes/admin/admin.jobs.routes.js
import { Router } from "express";
import {
  adminListJobs,
  adminGetJobById,
  adminUpdateJobStatus,
  adminDeleteJob,
} from "../../controllers/admin/admin.jobs.controller.js";
import requireAdminClerk from "../../middleware/requireAdminClerk.js";

const router = Router();
router.use(requireAdminClerk);

/**
 * Admin Jobs APIs
 * Base mounted in app.js: /api/admin
 */
router.get("/jobs", adminListJobs);
router.get("/jobs/:id", adminGetJobById);
router.patch("/jobs/:id/status", adminUpdateJobStatus);
router.delete("/jobs/:id", adminDeleteJob);

export default router;
