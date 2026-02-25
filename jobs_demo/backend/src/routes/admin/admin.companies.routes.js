// backend/src/routes/admin/admin.companies.routes.js
import { Router } from "express";
import {
  adminGetCompanyDetails,
  adminListCompanies,
  adminUpdateCompanyStatus,
} from "../../controllers/admin/admin.companies.controller.js";

const router = Router();

router.get("/companies", adminListCompanies);
router.get("/companies/:id", adminGetCompanyDetails);
router.patch("/companies/:id/status", adminUpdateCompanyStatus);

export default router;