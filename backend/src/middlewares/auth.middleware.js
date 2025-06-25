import jwt from "jsonwebtoken";
import { User } from "../models/user.model";
import { ApiError } from "../utils/ApiError";
import { asyncHandler } from "../utils/asyncHandler";



export const verifyJWT = asyncHandler(async(req, _, next) => {
    try {
        ////optional chaining bata 
        // const token = req.cookies ? .accessToken || req.headers.("authorization") ? .replace("Bearer", "")
        let token = null;

        // Get from cookies if available
        if (req.cookies && req.cookies.accessToken) {
            token = req.cookies.accessToken;
        }

        // Get from Authorization header if not found in cookies
        if (!token && req.headers.authorization) {
            const authHeader = req.headers.authorization;
            if (authHeader.startsWith("Bearer ")) {
                token = authHeader.slice(7).trim(); // remove 'Bearer '
            }
        }

        if (!token) {
            throw new ApiError(401, "Unauthorized access");
        }
        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)

        const user = await User.findById(decodedToken && decodedToken._id).select("-password -refreshToken")
        if (!user) {
            throw new ApiError(401, "Unauthorized access")
        }

        req.user = user;
        next();
    } catch (error) {
        throw new ApiError(401, error.message || "Unauthorized access")
    }
})