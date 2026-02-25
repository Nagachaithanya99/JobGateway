import { Router } from "express";
import studentOnly from "../../middleware/studentOnly.js";
import {
  listGovernmentJobs,
  getGovernmentJobById,
} from "../../controllers/student/student.government.controller.js";

const router = Router();

router.get("/government", studentOnly, listGovernmentJobs);
router.get("/government/:id", studentOnly, getGovernmentJobById);

export default router;
