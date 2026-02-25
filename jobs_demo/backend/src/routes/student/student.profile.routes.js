import { Router } from "express";
import studentOnly from "../../middleware/studentOnly.js";
import {
  getStudentMe,
  updateStudentMe,
  listMyApplications,
  getMyResume,
  saveMyResume,
  downloadResumePDF,
} from "../../controllers/student/student.profile.controller.js";

const router = Router();

router.get("/me", studentOnly, getStudentMe);
router.put("/me", studentOnly, updateStudentMe);

router.get("/me/applications", studentOnly, listMyApplications);

// Resume builder endpoints
router.get("/me/resume", studentOnly, getMyResume);
router.put("/me/resume", studentOnly, saveMyResume);
router.get("/me/resume/pdf", studentOnly, downloadResumePDF);

export default router;