import crypto from "crypto";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { generateAccessToken, generateRefreshToken } from "../utils/jwt.utils.js";
import { sendMail } from "../utils/mailer.js";

// Helper to generate email verification token
const generateEmailToken = () => crypto.randomBytes(20).toString('hex');

// SignUp Controller
const signUp = asyncHandler(async(req, res) => {
    const { fullName, email, password, phoneNumber } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
        throw new ApiError(409, "User with this email already exists");
    }

    // Generate email verification token
    const emailVerificationToken = generateEmailToken();
    const emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours

    // Create user
    const user = await User.create({
        fullName,
        email,
        password,
        phoneNumber,
        emailVerificationToken,
        emailVerificationExpires,
        isVerified: false
    });

    // Send verification email
    const verificationUrl = `${req.protocol}://${req.get('host')}/api/v1/auth/verify-email/${emailVerificationToken}`;

    await sendMail(
        email,
        "Verify Your Email",
        `Please click this link to verify your email: ${verificationUrl}`
    );

    // Return response without sensitive info
    const createdUser = await User.findById(user._id).select("-password -refreshToken -emailVerificationToken -emailVerificationExpires");

    return res.status(201).json(
        new ApiResponse(201, createdUser, "User registered successfully. Please check your email for verification instructions.")
    );
});

// Verify Email Controller
const verifyEmail = asyncHandler(async(req, res) => {
    const { token } = req.params;

    // Find user by token
    const user = await User.findOne({
        emailVerificationToken: token,
        emailVerificationExpires: { $gt: Date.now() }
    });

    if (!user) {
        throw new ApiError(400, "Invalid or expired verification token");
    }

    // Mark as verified
    user.isVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save();

    return res.status(200).json(
        new ApiResponse(200, null, "Email verified successfully. You can now login.")
    );
});

// SignIn Controller
const signIn = asyncHandler(async(req, res) => {
    const { email, password } = req.body;

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
        throw new ApiError(404, "User not found");
    }

    // Check if password is correct
    const isPasswordValid = await user.isPasswordCorrect(password);
    if (!isPasswordValid) {
        throw new ApiError(401, "Invalid credentials");
    }

    // Check if email is verified
    if (!user.isVerified) {
        throw new ApiError(403, "Please verify your email first");
    }

    // Generate tokens
    const accessToken = generateAccessToken({ _id: user._id });
    const refreshToken = generateRefreshToken({ _id: user._id });

    // Save refresh token to database
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    // Create cookie options
    const cookieOptions = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict"
    };

    // Set cookies and send response
    return res
        .status(200)
        .cookie("accessToken", accessToken, {...cookieOptions, maxAge: 24 * 60 * 60 * 1000 }) // 1 day
        .cookie("refreshToken", refreshToken, {...cookieOptions, maxAge: 10 * 24 * 60 * 60 * 1000 }) // 10 days
        .json(
            new ApiResponse(200, {
                user: {
                    _id: user._id,
                    fullName: user.fullName,
                    email: user.email,
                    phoneNumber: user.phoneNumber
                },
                accessToken
            }, "User logged in successfully")
        );
});

// SignOut Controller
const signOut = asyncHandler(async(req, res) => {
    // Clear refresh token from database
    await User.findByIdAndUpdate(
        req.user._id, {
            $unset: { refreshToken: 1 }
        }, { new: true }
    );

    // Clear cookies
    const cookieOptions = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict"
    };

    return res
        .status(200)
        .clearCookie("accessToken", cookieOptions)
        .clearCookie("refreshToken", cookieOptions)
        .json(new ApiResponse(200, null, "User logged out successfully"));
});

export const requestPasswordReset = asyncHandler(async(req, res) => {
    const { email } = req.body;

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
        throw new ApiError(404, "User not found");
    }

    // Generate 4-digit OTP
    const otp = Math.floor(1000 + Math.random() * 9000).toString();

    // Save OTP to user with expiration (5 minutes)
    user.resetPasswordOtp = otp;
    user.resetPasswordOtpExpires = Date.now() + 5 * 60 * 1000; // 5 minutes
    await user.save();

    // Send OTP via email
    await sendMail(
        email,
        "Password Reset OTP",
        `Your password reset OTP is: <strong>${otp}</strong>. It will expire in 5 minutes.`
    );

    return res.status(200).json(
        new ApiResponse(200, { email }, "OTP sent to your email")
    );
});

export const verifyPasswordResetOtp = asyncHandler(async(req, res) => {
    const { email, otp } = req.body;

    // Find user and validate OTP
    const user = await User.findOne({
        email,
        resetPasswordOtp: otp,
        resetPasswordOtpExpires: { $gt: Date.now() }
    });

    if (!user) {
        throw new ApiError(400, "Invalid or expired OTP");
    }

    // Mark OTP as verified (for additional security)
    user.isOtpVerified = true;
    user.resetPasswordOtp = undefined;
    user.resetPasswordOtpExpires = undefined;
    await user.save();

    return res.status(200).json(
        new ApiResponse(200, { email }, "OTP verified successfully")
    );
});

export const resetPassword = asyncHandler(async(req, res) => {
    const { email, newPassword } = req.body;

    // Find user and check if OTP was previously verified
    const user = await User.findOne({ email, isOtpVerified: true });
    if (!user) {
        throw new ApiError(400, "Invalid request or OTP not verified");
    }

    // Update password
    user.password = newPassword;
    user.isOtpVerified = false;
    await user.save();

    // Invalidate all existing sessions (optional)
    user.refreshToken = undefined;
    await user.save({ validateBeforeSave: false });

    return res.status(200).json(
        new ApiResponse(200, null, "Password reset successfully")
    );
});
export { signIn, signOut, signUp, verifyEmail };