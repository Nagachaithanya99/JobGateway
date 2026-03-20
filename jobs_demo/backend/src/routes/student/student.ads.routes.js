import { Router } from "express";
import studentOnly from "../../middleware/studentOnly.js";
import {
  createAdPlanOrder,
  createAdPlanRequest,
  createStudentAd,
  getStudentAdsStatus,
  verifyAdPlanPayment,
} from "../../controllers/student/student.ads.controller.js";

const router = Router();

router.get("/ads/status", studentOnly, getStudentAdsStatus);
router.post("/ads/plans/create-order", studentOnly, createAdPlanOrder);
router.post("/ads/plans/verify-payment", studentOnly, verifyAdPlanPayment);
router.post("/ads/plan-request", studentOnly, createAdPlanRequest);
router.post("/ads", studentOnly, createStudentAd);

export default router;
