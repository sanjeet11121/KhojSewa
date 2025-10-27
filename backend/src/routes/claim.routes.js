// routes/claim.routes.js
import express from "express";
import { 
  createClaim, 
  getPostClaims, 
  updateClaimStatus, 
  getUserClaims,
  getClaimDetails,
  addMessage,
  getClaimStats
} from "../controllers/claim.controllers.js";
import { authenticate } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.use(authenticate);

// Claim creation and listing
router.post("/", createClaim);
router.get("/my-claims", getUserClaims);
router.get("/stats", getClaimStats);

// Post-specific claims
router.get("/post/:postId", getPostClaims);

// Individual claim operations
router.get("/:claimId", getClaimDetails);
router.patch("/:claimId/status", updateClaimStatus);
router.post("/:claimId/messages", addMessage);

export default router;