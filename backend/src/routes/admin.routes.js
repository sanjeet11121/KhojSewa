import express from 'express';
import {
    getAllUsers,
    deleteUserById,
    updateUserRole,
    manuallyVerifyUser,
    toggleUserStatus,
    getUserStats,
    getAdminStats,
    isUserOnline,
    getOnlineUsers,
    getUserActivityAnalytics
} from '../controllers/admin.controllers.js';
import { authenticate, requireAdmin } from '../middlewares/auth.middleware.js';
import { updateLastActive } from '../middlewares/updateLastActive.middleware.js';

const adminRouter = express.Router();

// All routes below require authentication and admin role
adminRouter.use(authenticate, requireAdmin, updateLastActive);

// ===== USER MANAGEMENT ROUTES =====
adminRouter.get("/users", getAllUsers);
adminRouter.patch("/users/:userId/role", updateUserRole);
adminRouter.patch("/users/:userId/verify", manuallyVerifyUser);
adminRouter.patch("/users/:userId/status", toggleUserStatus);
adminRouter.delete("/users/:userId", deleteUserById);

// ===== USER ANALYTICS ROUTES =====
adminRouter.get("/users/:userId/online-status", isUserOnline);
adminRouter.get("/users/online/current", getOnlineUsers); // More specific

// ===== DASHBOARD & STATISTICS ROUTES =====
adminRouter.get("/stats/overview", getAdminStats); // Main dashboard
adminRouter.get("/stats/users", getUserStats); // User-specific stats
adminRouter.get("/stats/activity", getUserActivityAnalytics); // Activity analytics

export default adminRouter;