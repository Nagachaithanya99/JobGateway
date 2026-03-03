import { Router } from "express";
import studentOnly from "../../middleware/studentOnly.js";
import { listStudentInterviews } from "../../controllers/student/student.interviews.controller.js";

const router = Router();

router.get("/interviews", studentOnly, listStudentInterviews);

export default router;

