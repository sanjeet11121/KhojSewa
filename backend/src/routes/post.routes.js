import express from "express";
import {
  createClaim,
  createFoundPost,
  createLostPost,
  deletePost,
  getPostById,
  getAllLostPosts,
  getMyPosts,
  getMyLostPosts,
  getMyFoundPosts,
  updatePost,
  findPostsNearLocation,
  getPostsForMap
} from "../controllers/post.controllers.js";
import { authenticate } from "../middlewares/auth.middleware.js";
import upload from "../middlewares/multer.middleware.js"; // not destructured
import { getRecommendationsForFound, getRecommendationsForLost } from "../controllers/recommend.controllers.js";

const postRouter = express.Router();

// Public routes (no auth required)
postRouter.get("/lost", getAllLostPosts);

// Require authentication for all other post routes
postRouter.use(authenticate);

// Get all posts for the authenticated user
postRouter.get("/my", getMyPosts);
// Get only lost posts for the authenticated user
postRouter.get("/my/lost", getMyLostPosts);
// Get only found posts for the authenticated user
postRouter.get("/my/found", getMyFoundPosts);

// Create lost/found post with image upload
postRouter.post("/found", upload.array("images", 3), createFoundPost);
postRouter.post("/lost", upload.array("images", 3), createLostPost);

// Update lost/found post
postRouter.put("/:type/:postId", (req, res, next) => {
  // Use correct multer middleware based on type
  if (req.params.type === "found") {
    upload.single("image")(req, res, next);
  } else {
    upload.array("images", 3)(req, res, next);
  }
}, updatePost);

// Get single post by type and ID
postRouter.get("/:type/:postId", getPostById);

// Delete post
postRouter.delete("/:type/:postId", deletePost);

//recommendations
postRouter.get('/user/recommendations/lost/:postId', authenticate, getRecommendationsForLost);
postRouter.get('/user/recommendations/found/:postId', authenticate, getRecommendationsForFound);

//location-based post retrieval
postRouter.get('/nearby', findPostsNearLocation);
postRouter.get('/map', getPostsForMap);

export default postRouter;