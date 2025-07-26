export const authorizeAdmin = (req, res, next) => {
    if (req.user?.role !== "admin") {
        throw new ApiError(403, "Only admin can perform this action");
    }
    next();
};