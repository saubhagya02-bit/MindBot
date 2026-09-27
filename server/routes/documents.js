import express from "express";
import multer from "multer";
import { protect } from "../middleware/auth.js";
import {
  processUpload,
  listDocuments,
  deleteDocument,
} from "../services/document.service.js";
import { AppError, ERROR_CODES } from "../utils/AppError.js";
import { MAX_FILE_SIZE_MB, ALLOWED_MIME_TYPES } from "../config/rag.config.js";

const router = express.Router();
router.use(protect);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE_MB * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      return cb(
        new AppError(
          `Unsupported file type: ${file.mimetype}. Upload a PDF, DOCX or TXT file.`,
          400,
          ERROR_CODES.VALIDATION_ERROR,
        ),
      );
    }
    cb(null, true);
  },
});

// POST /api/documents/upload
router.post("/upload", (req, res, next) => {
  upload.single("file")(req, res, async (err) => {
    if (err) {
      if (err instanceof multer.MulterError && err.code === "LIMIT_FILE_SIZE") {
        return next(
          new AppError(
            `File too large. Max size is ${MAX_FILE_SIZE_MB}MB.`,
            400,
            ERROR_CODES.VALIDATION_ERROR,
          ),
        );
      }
      return next(err);
    }

    try {
      if (!req.file) {
        throw new AppError(
          "No file uploaded.",
          400,
          ERROR_CODES.VALIDATION_ERROR,
        );
      }
      const doc = await processUpload({ userId: req.user._id, file: req.file });
      res.status(201).json({ success: true, data: doc });
    } catch (e) {
      next(e);
    }
  });
});

// GET /api/documents
router.get("/", async (req, res, next) => {
  try {
    res.json({ success: true, data: await listDocuments(req.user._id) });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/documents/:id
router.delete("/:id", async (req, res, next) => {
  try {
    await deleteDocument(req.params.id, req.user._id);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

export default router;
