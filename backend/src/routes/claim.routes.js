// routes/claim.routes.js
import express from "express";
import { 
    createClaim, 
    getPostClaims, 
    updateClaimStatus, 
    getUserClaims,
    getClaimStats,
    getClaimDetails,
    addClaimMessage,
    getClaimMessages,
    updateMeetingArrangements
} from "../controllers/claim.controllers.js";
import { authenticate } from "../middlewares/auth.middleware.js";

const claimRouter = express.Router();

// All routes require authentication
claimRouter.use(authenticate);

// Claim management
claimRouter.post("/", createClaim);
claimRouter.get("/stats", getClaimStats);
claimRouter.get("/my-claims", getUserClaims);
claimRouter.get("/:claimId", getClaimDetails);

// Post-specific claims
claimRouter.get("/post/:postId", getPostClaims);

// Claim status and updates
claimRouter.patch("/:claimId/status", updateClaimStatus);
claimRouter.patch("/:claimId/meeting", updateMeetingArrangements);

// Claim messaging
claimRouter.post("/:claimId/messages", addClaimMessage);
claimRouter.get("/:claimId/messages", getClaimMessages);

export default claimRouter;