import { User } from '../models/user.model.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
// import { FoundPost } from "../models/foundPost.model.js";
// import { LostPost } from "../models/lostPost.model.js";

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

// 7. Check if user is online
export const isUserOnline = asyncHandler(async (req, res) => {
    const { userId } = req.params;

    const user = await User.findById(userId).select('fullName email lastActive isActive');
    if (!user) {
        throw new ApiError(404, "User not found");
    }

    // Check if user was active in the last 5 minutes
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const isOnline = user.lastActive && user.lastActive > fiveMinutesAgo;

    return res.status(200).json(new ApiResponse(200, {
        userId: user._id,
        fullName: user.fullName,
        email: user.email,
        isOnline,
        lastActive: user.lastActive,
        isActive: user.isActive
    }, "User online status checked successfully"));
});

// 8. Get all online users
export const getOnlineUsers = asyncHandler(async (req, res) => {
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;
    
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    
    const onlineUsers = await User.find({
        lastActive: { $gte: fiveMinutesAgo },
        isActive: true
    })
    .select('fullName email lastActive avatar role')
    .sort({ lastActive: -1 })
    .skip(skip)
    .limit(parseInt(limit));

    const totalOnlineUsers = await User.countDocuments({
        lastActive: { $gte: fiveMinutesAgo },
        isActive: true
    });

    return res.status(200).json(new ApiResponse(200, {
        onlineUsers,
        totalOnlineUsers,
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalOnlineUsers / limit)
    }, "Online users fetched successfully"));
});

// 9. Get user activity analytics
export const getUserActivityAnalytics = asyncHandler(async (req, res) => {
    const now = new Date();
    const fiveMinutesAgo = new Date(now - 5 * 60 * 1000);
    const oneHourAgo = new Date(now - 60 * 60 * 1000);
    const oneDayAgo = new Date(now - 24 * 60 * 60 * 1000);
    const oneWeekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);

    const [
        onlineNow,
        activeLastHour,
        activeToday,
        activeThisWeek,
        totalUsers
    ] = await Promise.all([
        User.countDocuments({ 
            lastActive: { $gte: fiveMinutesAgo },
            isActive: true 
        }),
        User.countDocuments({ 
            lastActive: { $gte: oneHourAgo },
            isActive: true 
        }),
        User.countDocuments({ 
            lastActive: { $gte: oneDayAgo },
            isActive: true 
        }),
        User.countDocuments({ 
            lastActive: { $gte: oneWeekAgo },
            isActive: true 
        }),
        User.countDocuments({ isActive: true })
    ]);

    return res.status(200).json(new ApiResponse(200, {
        activityStats: {
            onlineNow,
            activeLastHour,
            activeToday,
            activeThisWeek,
            totalActiveUsers: totalUsers
        },
        percentages: {
            onlineRate: totalUsers > 0 ? ((onlineNow / totalUsers) * 100).toFixed(1) : 0,
            dailyActiveRate: totalUsers > 0 ? ((activeToday / totalUsers) * 100).toFixed(1) : 0,
            weeklyActiveRate: totalUsers > 0 ? ((activeThisWeek / totalUsers) * 100).toFixed(1) : 0
        }
    }, "User activity analytics fetched successfully"));
});

// Admin Dashboard Stats
export const getAdminStats = asyncHandler(async (req, res) => {
    const totalUsers = await User.countDocuments();

    // Users active in last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const activeUsers = await User.countDocuments({ 
        lastActive: { $gte: thirtyDaysAgo },
        isActive: true 
    });

    // Users online now (last 5 minutes)
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const onlineNow = await User.countDocuments({
        lastActive: { $gte: fiveMinutesAgo },
        isActive: true
    });

    // You'll need to import these models if you want to use them
    // const totalInquiries = await Inquiry.countDocuments();
    // const totalLostPosts = await Post.countDocuments({ type: 'lost' });
    // const totalFoundPosts = await Post.countDocuments({ type: 'found' });

    // For now, using placeholder values
    const totalInquiries = 0; // Replace with actual count when you have the model
    const totalLostPosts = 0; // Replace with actual count
    const totalFoundPosts = 0; // Replace with actual count

    const lostFoundRatio = totalLostPosts + totalFoundPosts === 0
        ? 0
        : (totalFoundPosts / (totalLostPosts + totalFoundPosts)).toFixed(2);

    return res.status(200).json(new ApiResponse(200, {
        totalUsers,
        activeUsers,
        onlineNow,
        totalInquiries,
        totalLostPosts,
        totalFoundPosts,
        lostFoundRatio
    }, "Admin dashboard stats retrieved successfully"));
});

