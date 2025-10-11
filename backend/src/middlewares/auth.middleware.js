import { User } from '../models/user.model.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { verifyAccessToken } from '../utils/jwt.utils.js';

export const authenticate = asyncHandler(async (req, res, next) => {
    try {
        let token = null;

        console.log('Auth headers:', req.headers);
        console.log('Authorization header:', req.headers.authorization);
        console.log('Cookies:', req.cookies);

        // Prefer Authorization header
        if (req.headers && req.headers.authorization) {
            let authHeader = req.headers.authorization;
            console.log('Auth header found:', authHeader);
            if (authHeader.startsWith('Bearer ')) {
                token = authHeader.substring(7);
                // Remove extra 'Bearer ' if present
                if (token.startsWith('Bearer ')) {
                    token = token.substring(7);
                }
                console.log('Token extracted from header:', token);
            } else {
                console.log('Malformed auth header:', authHeader);
                return next(new ApiError(401, 'Malformed Authorization header'));
            }
        } else if (req.cookies && req.cookies.accessToken) {
            token = req.cookies.accessToken;
            console.log('Token extracted from cookie:', token);
        }

        if (!token) {
            console.log('No token found in request');
            return next(new ApiError(401, 'Authentication token missing'));
        }

        let decoded;
        try {
            console.log('Attempting to verify token:', token);
            decoded = verifyAccessToken(token);
            console.log('Token verified successfully, decoded:', decoded);
        } catch (error) {
            console.error('Token verification error:', error);
            if (error.name === 'TokenExpiredError') {
                // Send a specific response for frontend auto-logout
                return res.status(401).json({ message: 'Token expired', code: 'TOKEN_EXPIRED' });
            }
            let message = 'Invalid token';
            if (error.name === 'JsonWebTokenError') {
                message = 'Invalid token';
            }
            return next(new ApiError(401, message));
        }

        console.log('Looking up user with ID:', decoded._id);
        const user = await User.findById(decoded._id).select('-password -refreshToken');
        if (!user) {
            console.log('User not found for ID:', decoded._id);
            return next(new ApiError(401, 'User not found'));
        }

        console.log('User authenticated successfully:', user._id);
        req.user = user;
        next();
    } catch (error) {
        console.error('Authentication error:', error);
        return next(new ApiError(500, 'Internal server error in authentication'));
    }
});
