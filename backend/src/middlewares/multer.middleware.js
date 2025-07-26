import multer from "multer";

// Use memory storage so files are not saved to disk
const storage = multer.memoryStorage();

// File filter (optional)
const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
        cb(null, true);
    } else {
        cb(new Error("Only image files are allowed!"), false);
    }
};

const upload = multer({ storage, fileFilter });

export default upload;