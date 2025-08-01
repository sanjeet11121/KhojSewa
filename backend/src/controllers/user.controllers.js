import { User } from '../models/user.model.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { uploadOnCloudinary } from '../utils/cloudinary.js';
import bcrypt from 'bcrypt';

/**
 * @desc Get user profile with lost and found posts
 */
export const getCurrentUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id)
    .select('-password -refreshToken')
    .populate('lostPosts')
    .populate('foundPosts');

  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  res.status(200).json(new ApiResponse(200, user, 'Profile fetched successfully'));
});

/**
 * @desc Update profile (fullName, phoneNumber)
 */
export const updateProfile = asyncHandler(async (req, res) => {
  const { fullName, phoneNumber } = req.body;

  const user = await User.findById(req.user._id);
  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  if (fullName) user.fullName = fullName;
  if (phoneNumber) user.phoneNumber = phoneNumber;

  await user.save();

  res.status(200).json(new ApiResponse(200, user, 'Profile updated successfully'));
});

/**
 * @desc Change password
 */
export const changePassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;

  const user = await User.findById(req.user._id).select('+password');

  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  const isMatch = await bcrypt.compare(oldPassword, user.password);
  if (!isMatch) {
    throw new ApiError(401, 'Old password is incorrect');
  }

  user.password = newPassword;
  await user.save();

  res.status(200).json(new ApiResponse(200, null, 'Password changed successfully'));
});

/**
 * @desc Upload user avatar (image)
 */
export const uploadAvatar = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new ApiError(400, 'No file uploaded');
  }

  const result = await uploadOnCloudinary(req.file.path);
  if (!result || !result.secure_url) {
    throw new ApiError(500, 'Cloudinary upload failed');
  }

  const user = await User.findByIdAndUpdate(
    req.user._id,
    { avatar: result.secure_url },
    { new: true }
  ).select('-password -refreshToken');

  res.status(200).json(new ApiResponse(200, user, 'Avatar uploaded successfully'));
});
