import { User } from '../models/user.model.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
// import { FoundPost } from "../models/foundPost.model.js";

// 1. Get all users (with pagination)
export const getAllUsers = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const users = await User.find({})
        .select("-password -refreshToken")
        .skip(skip)
        .limit(parseInt(limit));

    const totalUsers = await User.countDocuments();

    return res.status(200).json(new ApiResponse(200, {
        users,
        totalUsers,
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalUsers / limit)
    }, "All users fetched successfully"));
});

// 2. Delete a user by ID
export const deleteUserById = asyncHandler(async (req, res) => {
    const { userId } = req.params;

    const user = await User.findByIdAndDelete(userId);
    if (!user) {
        throw new ApiError(404, "User not found");
    }

    return res.status(200).json(new ApiResponse(200, null, "User deleted successfully"));
});

// 3. Update user role (e.g., from "user" to "admin")
export const updateUserRole = asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const { role } = req.body;

    const validRoles = ["user", "admin", "moderator"];
    if (!validRoles.includes(role)) {
        throw new ApiError(400, "Invalid role");
    }

    const user = await User.findByIdAndUpdate(userId, { role }, { new: true });
    if (!user) {
        throw new ApiError(404, "User not found");
    }

    return res.status(200).json(new ApiResponse(200, user, "User role updated successfully"));
});

// 4. Manually verify user
export const manuallyVerifyUser = asyncHandler(async (req, res) => {
    const { userId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
        throw new ApiError(404, "User not found");
    }

    user.isVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save();

    return res.status(200).json(new ApiResponse(200, user, "User verified successfully"));
});

// 5. Disable or Enable user account
export const toggleUserStatus = asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const { isActive } = req.body;

    const user = await User.findByIdAndUpdate(userId, { isActive }, { new: true });
    if (!user) {
        throw new ApiError(404, "User not found");
    }

    return res.status(200).json(new ApiResponse(200, user, `User ${isActive ? "enabled" : "disabled"} successfully`));
});

// 6. Get basic stats
export const getUserStats = asyncHandler(async (req, res) => {
    const totalUsers = await User.countDocuments();
    const verifiedUsers = await User.countDocuments({ isVerified: true });
    const unverifiedUsers = await User.countDocuments({ isVerified: false });

    return res.status(200).json(new ApiResponse(200, {
        totalUsers,
        verifiedUsers,
        unverifiedUsers
    }, "User statistics fetched"));
});



// Admin Dashboard Stats
export const getAdminStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();

    // Fallback: users active in last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const activeUsers = await User.countDocuments({ updatedAt: { $gte: thirtyDaysAgo } });

    const totalInquiries = await Inquiry.countDocuments();

    const totalLostPosts = await Post.countDocuments({ type: 'lost' });
    const totalFoundPosts = await Post.countDocuments({ type: 'found' });

    const lostFoundRatio = totalLostPosts + totalFoundPosts === 0
      ? 0
      : (totalFoundPosts / (totalLostPosts + totalFoundPosts)).toFixed(2);

    return res.status(200).json({
      success: true,
      message: "Stats retrieved successfully",
      data: {
        totalUsers,
        activeUsers,
        totalInquiries,
        totalLostPosts,
        totalFoundPosts,
        lostFoundRatio
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch stats",
      error: error.message
    });
  }
};


// //=====================Posts haru fetch garne methodsss================
// export const getPostStatsByUser = asyncHandler(async (req, res) => {
//     const stats = await Post.aggregate([
//         {
//             $group: {
//                 _id: {
//                     user: "$user",
//                     type: "$type",
//                     status: "$status"
//                 },
//                 count: { $sum: 1 }
//             }
//         },
//         {
//             $group: {
//                 _id: "$_id.user",
//                 posts: {
//                     $push: {
//                         type: "$_id.type",
//                         status: "$_id.status",
//                         count: "$count"
//                     }
//                 }
//             }
//         },
//         {
//             $lookup: {
//                 from: "users", // match the collection name
//                 localField: "_id",
//                 foreignField: "_id",
//                 as: "user"
//             }
//         },
//         {
//             $unwind: "$user"
//         },
//         {
//             $project: {
//                 userId: "$user._id",
//                 fullName: "$user.fullName",
//                 email: "$user.email",
//                 postStats: "$posts"
//             }
//         }
//     ]);

//     return res.status(200).json(
//         new ApiResponse(200, stats, "Post stats fetched successfully")
//     );
// });

