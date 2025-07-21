import express from "express";
import { signIn, signOut, signUp, verifyEmail } from "../controllers/auth.controllers.js";
import { requestPasswordReset, resetPassword, verifyPasswordResetOtp } from "../controllers/auth.controllers.js";

const authRouter = express.Router();

authRouter.post("/signup", signUp);
authRouter.get("/verify-email/:token", verifyEmail);
authRouter.post("/signin", signIn);
authRouter.post("/signout", signOut);
authRouter.post("/forgot-password", requestPasswordReset);
authRouter.post("/verify-reset-otp", verifyPasswordResetOtp);
authRouter.post("/reset-password", resetPassword);

export default authRouter;