import express from "express";
import {
  createClaim,
  createFoundPost,
  createLostPost,
  deletePost,
  getPostById,
  getAllLostPosts
} from "../controllers/post.controllers.js";
import { authenticate } from "../middlewares/auth.middleware.js";
import upload from "../middlewares/multer.middleware.js"; // not destructured

const postRouter = express.Router();

// Public routes (no auth required)
postRouter.get("/lost", getAllLostPosts);

// Require authentication for all other post routes
postRouter.use(authenticate);

// Create lost/found post with image upload
postRouter.post("/found", upload.single("image"), createFoundPost);
postRouter.post("/lost", upload.array("images", 3), createLostPost);

// Get single post by type and ID
postRouter.get("/:type/:postId", getPostById);

// Delete post
postRouter.delete("/:type/:postId", deletePost);

// Claim post
postRouter.post("/:type/:postId/claims", createClaim);

export default postRouter;