import express from "express";
import {
  createClaim,
  createFoundPost,
  createLostPost,
  deletePost,
  getPostById,
  getAllLostPosts,
  getAllFoundPosts, // Added this import
  getMyPosts,
  getMyLostPosts,
  getMyFoundPosts,
  updatePost,
  findPostsNearLocation,
  getPostsForMap,
  // Post statistics functions (for admin routes)
  getUserPostStats,
  getTopContributors,
  getPostStatistics,
  getUserPostingActivity
} from "../controllers/post.controllers.js";
import { authenticate } from "../middlewares/auth.middleware.js";
import { requireAdmin } from "../middlewares/auth.middleware.js"; // Add admin middleware
import upload from "../middlewares/multer.middleware.js";
import { getRecommendationsForFound, getRecommendationsForLost } from "../controllers/recommend.controllers.js";

const postRouter = express.Router();

// Public routes (no auth required)
postRouter.get("/lost", getAllLostPosts);
postRouter.get("/found", getAllFoundPosts); // Added public found posts route

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

// Claim management
postRouter.post("/:type/:postId/claim", createClaim);

// Recommendations
postRouter.get('/user/recommendations/lost/:postId', getRecommendationsForLost);
postRouter.get('/user/recommendations/found/:postId', getRecommendationsForFound);

// Location-based post retrieval
postRouter.get('/nearby', findPostsNearLocation);
postRouter.get('/map', getPostsForMap);

// ADMIN POST STATISTICS ROUTES
// These routes require admin authentication
postRouter.get("/admin/stats/user/:userId/posts", authenticate, requireAdmin, getUserPostStats);
postRouter.get("/admin/stats/contributors", authenticate, requireAdmin, getTopContributors);
postRouter.get("/admin/stats/posts", authenticate, requireAdmin, getPostStatistics);
postRouter.get("/admin/stats/posting-activity", authenticate, requireAdmin, getUserPostingActivity);

export default postRouter;