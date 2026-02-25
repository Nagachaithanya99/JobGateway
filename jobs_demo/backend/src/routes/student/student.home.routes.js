// backend/src/routes/student/student.home.routes.js
import { Router } from "express";
import studentOnly from "../../middleware/studentOnly.js";
import { getStudentHome } from "../../controllers/student/student.home.controller.js";

const router = Router();

/**
 * GET /api/student/home
 * Student Home feed (Phase 2 Step 1)
 */
router.get("/home", studentOnly, getStudentHome);

export default router;
