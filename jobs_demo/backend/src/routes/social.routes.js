import { Router } from "express";
import socialActorOnly from "../middleware/socialActorOnly.js";
import {
  addCareerPulseComment,
  createCareerPulsePost,
  getCareerPulseFeed,
  shareCareerPulsePost,
  startCareerPulseMessage,
  toggleCareerPulseFollow,
  toggleCareerPulseLike,
} from "../controllers/social.controller.js";

const router = Router();

router.use(socialActorOnly);

router.get("/feed", getCareerPulseFeed);
router.post("/posts", createCareerPulsePost);
router.post("/posts/:postId/like", toggleCareerPulseLike);
router.post("/posts/:postId/comments", addCareerPulseComment);
router.post("/posts/:postId/share", shareCareerPulsePost);
router.post("/follow/:targetId", toggleCareerPulseFollow);
router.post("/message", startCareerPulseMessage);

export default router;
