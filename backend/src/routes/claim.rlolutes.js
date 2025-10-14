import express from "express";
import { 
  createClaim, 
  getPostClaims, 
  updateClaimStatus,
  getUserClaims 
} from "../controllers/claim.controllers.js";
import { authenticate } from "../middlewares/auth.middleware.js";

const claimRouter = express.Router();

// All routes require authentication
claimRouter.use(authenticate);

// Create a new claim
claimRouter.post("/", createClaim);

// Get claims for a specific post
claimRouter.get("/post/:postId", getPostClaims);

// Update claim status (approve/reject)
claimRouter.patch("/:claimId/status", updateClaimStatus);

// Get claims made by the current user
claimRouter.get("/my-claims", getUserClaims);

export default claimRouter;