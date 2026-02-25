// backend/src/routes/student/student.notifications.routes.js
import { Router } from "express";
import studentOnly from "../../middleware/studentOnly.js";
import {
  listStudentNotifications,
  markAllRead,
  toggleRead,
  getNotificationPrefs,
  saveNotificationPrefs,
  seedNotifications,
} from "../../controllers/student/student.notifications.controller.js";

const router = Router();

// list
router.get("/notifications", studentOnly, listStudentNotifications);

// mark all read
router.post("/notifications/mark-all-read", studentOnly, markAllRead);

// toggle read/unread
router.patch("/notifications/:id/toggle", studentOnly, toggleRead);

// preferences
router.get("/notifications/preferences", studentOnly, getNotificationPrefs);
router.put("/notifications/preferences", studentOnly, saveNotificationPrefs);

// optional seed
router.post("/notifications/seed", studentOnly, seedNotifications);

export default router;
