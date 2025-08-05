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


export const getUserLostPosts = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id)
    .select('-password -refreshToken')
    .populate('lostPosts');

  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  res.status(200).json(new ApiResponse(200, user.lostPosts, 'Lost posts fetched successfully'));
});

export const updateUserLostPosts = asyncHandler(async (req, res) => {
  const { postId } = req.body;

  const user = await User.findById(req.user._id);
  if (!user) {  
    throw new ApiError(404, 'User not found');
  }
  const post = user.lostPosts.id(postId);
  if (!post) {
    throw new ApiError(404, 'Post not found');
  }
  post.remove();
  await user.save();
  res.status(200).json(new ApiResponse(200, null, 'Lost post removed successfully'));
}
);

export const deleteUserLostPosts = asyncHandler(async (req, res) => {
  const { postId } = req.body;

  const user = await User.findById(req.user._id);
  if (!user) {
    throw new ApiError(404, 'User not found');
  }
  const post = user.lostPosts.id(postId);
  if (!post) {
    throw new ApiError(404, 'Post not found');
  }
  post.remove();
  await user.save();
  res.status(200).json(new ApiResponse(200, null, 'Lost post deleted successfully'));
}
);


export const getUserFoundPosts = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id)
    .select('-password -refreshToken')  
    .populate('foundPosts');
  if (!user) {
    throw new ApiError(404, 'User not found');
  } 
  res.status(200).json(new ApiResponse(200, user.foundPosts, 'Found posts fetched successfully'));
}
);  

export const updateUserFoundPosts = asyncHandler(async (req, res) => {
  const { postId } = req.body;

  const user = await User.findById(req.user._id);
  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  const post = user.foundPosts.id(postId);
  if (!post) {
    throw new ApiError(404, 'Post not found');
  }

  post.remove();
  await user.save();

  res.status(200).json(new ApiResponse(200, null, 'Found post removed successfully'));
});

 export const deleteUserFoundPosts = asyncHandler(async (req, res) => {
  const { postId } = req.body;

  const user = await User.findById(req.user._id);
  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  const post = user.foundPosts.id(postId);
  if (!post) {
    throw new ApiError(404, 'Post not found');
  }

  post.remove();
  await user.save();

  res.status(200).json(new ApiResponse(200, null, 'Found post deleted successfully'));
});

export const checkUserActiveStatus = asyncHandler(async (req, res) => {
  // Ensure user is authenticated
  if (!req.user || !req.user._id) {
    throw new ApiError(401, 'Unauthorized: User not authenticated');
  }

  // Find the user
  const user = await User.findById(req.user._id).select('isActive').lean();

  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  // Respond with active/inactive status
  res.status(200).json(
    new ApiResponse(
      200,
      {
        isActive: user.isActive,
        status: user.isActive ? 'Active' : 'Inactive'
      },
      'User status fetched successfully'
    )
  );
});