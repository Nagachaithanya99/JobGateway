import express from "express";
import requireAuth from "../../middleware/requireAuth.js";
import requireUser from "../../middleware/requireUser.js";
import requireRole from "../../middleware/requireRole.js";

import {
  listCompanyInterviews,
  createCompanyInterview,
  updateCompanyInterview,
  addInterviewNote,
  updateCompanyInterviewStatus,
  deleteCompanyInterview,
} from "../../controllers/company/company.interviews.controller.js";

const router = express.Router();

router.get("/interviews", requireAuth, requireUser, requireRole("company"), listCompanyInterviews);
router.post("/interviews", requireAuth, requireUser, requireRole("company"), createCompanyInterview);
router.patch("/interviews/:id", requireAuth, requireUser, requireRole("company"), updateCompanyInterview);
router.post("/interviews/:id/notes", requireAuth, requireUser, requireRole("company"), addInterviewNote);
router.patch("/interviews/:id/status", requireAuth, requireUser, requireRole("company"), updateCompanyInterviewStatus);
router.delete("/interviews/:id", requireAuth, requireUser, requireRole("company"), deleteCompanyInterview);

export default router;
