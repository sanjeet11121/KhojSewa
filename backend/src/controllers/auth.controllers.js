import crypto from "crypto";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { sendMail } from "../utils/email.js";
import { generateAccessToken, generateRefreshToken } from "../utils/jwt.utils.js";

// Helper to generate email verification token
const generateEmailToken = () => crypto.randomBytes(20).toString('hex');

// Helper to generate OTP
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

// SignUp Controller
const signUp = asyncHandler(async(req, res) => {
    const { fullName, email, password, phoneNumber } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
        throw new ApiError(409, "User with this email already exists");
    }

    // Generate OTP for email verification
    const emailVerificationOtp = generateOTP();
    const emailVerificationOtpExpires = Date.now() + 10 * 60 * 1000; // 10 minutes

    // Create user
    const user = await User.create({
        fullName,
        email,
        password,
        phoneNumber,
        emailVerificationOtp,
        emailVerificationOtpExpires,
        isVerified: false
    });

    // Send verification email with OTP
    await sendMail(
        email,
        "Verify Your Email - KhojSewa",
        `Your email verification OTP is: <strong>${emailVerificationOtp}</strong><br><br>
        This OTP will expire in 10 minutes.<br>
        If you didn't create an account with KhojSewa, please ignore this email.`
    );

    // Return response without sensitive info
    const createdUser = await User.findById(user._id).select("-password -refreshToken -emailVerificationOtp -emailVerificationOtpExpires");

    return res.status(201).json(
        new ApiResponse(201, { user: createdUser, email }, "User registered successfully. Please check your email for OTP verification.")
    );
});

// Verify Email Controller
const verifyEmail = asyncHandler(async(req, res) => {
    const { email, otp } = req.body;

    if (!email || !otp) {
        throw new ApiError(400, "Email and OTP are required");
    }

    // Find user by email and OTP
    const user = await User.findOne({
        email,
        emailVerificationOtp: otp,
        emailVerificationOtpExpires: { $gt: Date.now() }
    });

    if (!user) {
        throw new ApiError(400, "Invalid or expired OTP");
    }

    // Mark as verified
    user.isVerified = true;
    user.emailVerificationOtp = undefined;
    user.emailVerificationOtpExpires = undefined;
    await user.save();

    return res.status(200).json(
        new ApiResponse(200, null, "Email verified successfully. You can now login.")
    );
});

// Resend Email Verification OTP Controller
const resendEmailVerificationOtp = asyncHandler(async(req, res) => {
    const { email } = req.body;

    if (!email) {
        throw new ApiError(400, "Email is required");
    }

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
        throw new ApiError(404, "User not found");
    }

    if (user.isVerified) {
        throw new ApiError(400, "Email is already verified");
    }

    // Generate new OTP
    const emailVerificationOtp = generateOTP();
    const emailVerificationOtpExpires = Date.now() + 10 * 60 * 1000; // 10 minutes

    // Update user with new OTP
    user.emailVerificationOtp = emailVerificationOtp;
    user.emailVerificationOtpExpires = emailVerificationOtpExpires;
    await user.save();

    // Send new OTP via email
    await sendMail(
        email,
        "Verify Your Email - KhojSewa",
        `Your new email verification OTP is: <strong>${emailVerificationOtp}</strong><br><br>
        This OTP will expire in 10 minutes.<br>
        If you didn't request this OTP, please ignore this email.`
    );

    return res.status(200).json(
        new ApiResponse(200, { email }, "New OTP sent to your email")
    );
});

// SignIn Controller
const signIn = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select("+password");
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const isPasswordValid = await user.isPasswordCorrect(password);
  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid credentials");
  }

  if (!user.isVerified) {
    throw new ApiError(403, "Please verify your email first");
  }

  // Generate tokens
  console.log('Generating tokens for user ID:', user._id);
  const accessToken = generateAccessToken({ _id: user._id });
  const refreshToken = generateRefreshToken({ _id: user._id });
  
  console.log('Generated access token:', accessToken);
  console.log('Generated refresh token:', refreshToken.substring(0, 10) + '...');

  user.refreshToken = refreshToken;
  await user.save({ validateBeforeSave: false });

  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax", // Changed from strict to lax for better cross-site compatibility
    path: '/'
  };
  
  console.log('Cookie options:', cookieOptions);

  console.log('Setting cookies and sending response');
  
  // Prepare response data
  const responseData = {
    user: {
      _id: user._id,
      fullName: user.fullName,
      email: user.email,
      phoneNumber: user.phoneNumber,
      role: user.role
    },
    accessToken
  };
  
  console.log('Response data:', responseData);
  
  return res
    .status(200)
    .cookie("accessToken", accessToken, { ...cookieOptions, maxAge: 24 * 60 * 60 * 1000 })
    .cookie("refreshToken", refreshToken, { ...cookieOptions, maxAge: 10 * 24 * 60 * 60 * 1000 })
    .json(new ApiResponse(200, responseData, "User logged in successfully"));
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

 const requestPasswordReset = asyncHandler(async(req, res) => {
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

 const verifyPasswordResetOtp = asyncHandler(async(req, res) => {
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

 const resetPassword = asyncHandler(async(req, res) => {
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

// In-memory store for OTP and user data (for demo; use Redis in production)
const signupOtpStore = {};

// Send OTP for signup (does not create user yet)
const sendSignupOtp = asyncHandler(async (req, res) => {
    const { fullName, email, password, phoneNumber } = req.body;
    if (!fullName || !email || !password || !phoneNumber) {
        throw new ApiError(400, "All fields are required");
    }
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
        throw new ApiError(409, "User with this email already exists");
    }
    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    // Store OTP and user data in memory (expires in 10 min)
    signupOtpStore[email] = {
        otp,
        expires: Date.now() + 10 * 60 * 1000,
        userData: { fullName, email, password, phoneNumber }
    };
    // Send OTP email
    await sendMail(
        email,
        "Your KhojSewa Signup OTP",
        `<p>Your OTP for KhojSewa signup is <strong>${otp}</strong>. It is valid for 10 minutes.</p>`
    );
    return res.status(200).json(new ApiResponse(200, { email }, "OTP sent to your email"));
});

// Verify OTP and create user
const verifySignupOtp = asyncHandler(async (req, res) => {
    const { email, otp } = req.body;
    if (!email || !otp) {
        throw new ApiError(400, "Email and OTP are required");
    }
    const record = signupOtpStore[email];
    if (!record || record.otp !== otp || record.expires < Date.now()) {
        throw new ApiError(400, "Invalid or expired OTP");
    }
    // Create user with random avatar
    const { fullName, password, phoneNumber } = record.userData;
    const avatar = `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(email)}`;
    const user = await User.create({
        fullName,
        email,
        password,
        phoneNumber,
        avatar,
        isVerified: true
    });
    // Clean up
    delete signupOtpStore[email];
    return res.status(201).json(new ApiResponse(201, { user: { _id: user._id, fullName, email, phoneNumber, avatar } }, "Signup successful! You can now sign in."));
});


export { signIn, signOut, signUp, verifyEmail, resendEmailVerificationOtp, requestPasswordReset, verifyPasswordResetOtp, resetPassword, sendSignupOtp, verifySignupOtp };