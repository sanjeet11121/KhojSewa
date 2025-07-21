import express from "express";
import {
  createClaim,
  createFoundPost,
  createLostPost,
  deletePost,
  getPostById
} from "../controllers/post.controllers.js";
import { authenticate } from "../middlewares/auth.middleware.js";
import upload from "../middlewares/multer.middleware.js";

const postRouter = express.Router();

// Apply authentication middleware
postRouter.use(authenticate);

// Found Post Routes
postRouter.post("/found", upload.single('image'), createFoundPost);

// Lost Post Routes
postRouter.post("/lost", upload.single('image'), createLostPost);

// Common Post Routes
postRouter.get("/found/:postId", getPostById);
postRouter.get("/lost/:postId", getPostById);

// Restrict :type to 'found' or 'lost'
postRouter.delete("/:type(found|lost)/:postId", deletePost);
postRouter.post("/:type(found|lost)/:postId/claims", createClaim);

export default postRouter;
