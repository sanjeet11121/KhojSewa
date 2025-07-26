import express from 'express';
import {
    getAllUsers,
    deleteUserById,
    updateUserRole,
    manuallyVerifyUser,
    toggleUserStatus,
    getUserStats,
    // getPostStatsByUser
} from '../controllers/admin.controllers.js';
import { authenticate } from '../middlewares/auth.middleware.js';

const adminRouter = express.Router();

// all routes below require admin authentication
adminRouter.use(authenticate);

// Example: add a middleware to check for admin role here (optional)

adminRouter.get("/users", getAllUsers);
adminRouter.get("/stats", getUserStats);
adminRouter.patch("/user/:userId/role", updateUserRole);
adminRouter.patch("/user/:userId/verify", manuallyVerifyUser);
adminRouter.patch("/user/:userId/status", toggleUserStatus);
adminRouter.delete("/user/:userId", deleteUserById);
// adminRouter.get("/user-post-stats", getPostStatsByUser);

export default adminRouter;
