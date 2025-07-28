import multer from "multer";

// Use memory storage so files are not saved to disk
const storage = multer.memoryStorage();

// File filter (optional)
const fileFilter = (req, file, cb) => {
    console.log('Processing file upload:', file.originalname, file.mimetype);
    if (file.mimetype.startsWith("image/")) {
        console.log('File accepted:', file.originalname);
        cb(null, true);
    } else {
        console.log('File rejected:', file.originalname, '- not an image');
        cb(new Error("Only image files are allowed!"), false);
    }
};

const upload = multer({ 
    storage, 
    fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
    }
});

console.log('Multer middleware configured');

export default upload;