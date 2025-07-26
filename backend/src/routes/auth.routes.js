import express from "express";
import {
    signIn,
    signOut,
    signUp,
    verifyEmail,
    resendEmailVerificationOtp,
    requestPasswordReset,
    verifyPasswordResetOtp,
    resetPassword,
    sendSignupOtp,
    verifySignupOtp
} from "../controllers/auth.controllers.js";

const authRouter = express.Router();

authRouter.post("/signup", signUp); // legacy
// New OTP-based signup
authRouter.post("/send-otp", sendSignupOtp);
authRouter.post("/verify-otp", verifySignupOtp);

authRouter.post("/verify-email", verifyEmail);
authRouter.post("/resend-verification-otp", resendEmailVerificationOtp);
authRouter.post("/signin", signIn);
authRouter.post("/signout", signOut);
authRouter.post("/forgot-password", requestPasswordReset);
authRouter.post("/verify-reset-otp", verifyPasswordResetOtp);
authRouter.post("/reset-password", resetPassword);

export default authRouter;