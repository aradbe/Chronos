const multer = require("multer");

const MAX_FILE_BYTES = 5 * 1024 * 1024;
const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

// Files are held in memory, never written to disk. They only need to survive
// long enough to be streamed to Cloudinary, and keeping them out of the file
// system means no temp files to clean up and nothing left behind on a crash.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_BYTES, files: 1 },
  fileFilter: (req, file, callback) => {
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      callback(
        new multer.MulterError("LIMIT_UNEXPECTED_FILE", "That file is not an image"),
      );
      return;
    }

    callback(null, true);
  },
});

// Multer reports its own failures by throwing, which would otherwise fall
// through to the generic 500 handler. Turned into the same error shape the rest
// of the API uses.
const handleUploadErrors = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    const tooBig = error.code === "LIMIT_FILE_SIZE";

    return res.status(400).json({
      error: {
        message: tooBig
          ? `Images must be smaller than ${MAX_FILE_BYTES / (1024 * 1024)} MB`
          : "That file is not a supported image",
        code: tooBig ? "FILE_TOO_LARGE" : "UNSUPPORTED_FILE_TYPE",
      },
    });
  }

  return next(error);
};

module.exports = {
  ALLOWED_MIME_TYPES,
  MAX_FILE_BYTES,
  handleUploadErrors,
  uploadSingleImage: upload.single("file"),
};
