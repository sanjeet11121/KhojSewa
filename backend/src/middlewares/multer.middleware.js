import multer from "multer";

// Use memory storage so files are kept in RAM
const storage = multer.memoryStorage();

// Only allow images, up to 5MB
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/webp"];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error("Invalid file type. Only JPEG, PNG, and WEBP are allowed."), false);
  },
});

export default upload;
