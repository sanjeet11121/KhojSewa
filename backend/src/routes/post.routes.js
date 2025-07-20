import express from "express";
import {
    createClaim,
    createFoundPost,
    createLostPost,
    deletePost,
    getPostById
} from "../controllers/post.controllers.js";
import { authenticate } from "../middleware/auth.middleware.js";
import upload from "../middleware/multer.middleware.js";

const postRouter = express.Router();

// Apply authentication middleware
postRouter.use(authenticate);

// Found Post Routes
postRouter.post("/found", upload.single('image'), createFoundPost);

// Lost Post Routes
postRouter.post("/lost", upload.single('image'), createLostPost);

// Common Post Routes
postRouter.get("/:type/:postId", getPostById);
postRouter.delete("/:type/:postId", deletePost);

// Claim Routes
postRouter.post("/:type/:postId/claims", createClaim);

export default postRouter;