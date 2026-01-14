import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "../Utils/CloudinaryConfig.js";

const feedbackStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "feedback",
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
    public_id: (req, file) => `feedback_${Date.now()}_${file.originalname}`,
  },
});

const feedbackUpload = multer({
  storage: feedbackStorage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.mimetype)) {
      return cb(new Error("Only JPG, PNG, and WebP images are allowed"));
    }
    cb(null, true);
  },
}).array("images", 3);

const uploadFeedbackImages = (req, res, next) => {
  feedbackUpload(req, res, (err) => {
    if (err) return res.status(400).json({ message: err.message });

    // Attach Cloudinary URLs to req.body so controller can use
    req.body.imageUrls = req.files ? req.files.map(file => file.path) : [];
    next();
  });
};

export { feedbackUpload, uploadFeedbackImages };
