import { Router } from "express";
import multer from "multer";
import syncUser from "../middleware/syncUser.js";
import { uploadResume } from "../controllers/upload.controller.js";

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

router.post(
  "/resume",
  syncUser("student"),
  (req, res, next) => {
    upload.single("file")(req, res, (err) => {
      if (!err) return next();

      if (err instanceof multer.MulterError) {
        if (err.code === "LIMIT_FILE_SIZE") {
          return res.status(400).json({ message: "File size must be 5MB or less" });
        }
        return res.status(400).json({ message: err.message || "Invalid file upload" });
      }

      return next(err);
    });
  },
  uploadResume
);

export default router;