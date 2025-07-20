// middleware/auth.middleware.js
import { User } from '../models/user.model.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { verifyAccessToken } from '../utils/jwt.utils.js';

export const authenticate = asyncHandler(async(req, res, next) => {
    try {
        // Get token from cookies or Authorization header
        let token = null;

        if (req.cookies && req.cookies.accessToken) {
            token = req.cookies.accessToken;
        } else if (req.headers && req.headers.authorization) {
            const authHeader = req.headers.authorization;
            if (authHeader.startsWith('Bearer ')) {
                token = authHeader.substring(7);
            }
        }

        if (!token) {
            throw new ApiError(401, 'Authentication token missing');
        }

        // Verify token
        const decoded = verifyAccessToken(token);

        // Find user
        const user = await User.findById(decoded._id).select('-password -refreshToken');
        if (!user) {
            throw new ApiError(401, 'User not found');
        }

        // Attach user to request
        req.user = user;
        next();
    } catch (error) {
        let message = 'Invalid token';
        if (error.name === 'TokenExpiredError') {
            message = 'Token expired';
        } else if (error.name === 'JsonWebTokenError') {
            message = 'Invalid token';
        }
        throw new ApiError(401, message);
    }
});