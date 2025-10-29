import { User } from '../models/user.model.js';

export const updateLastActive = async (req, res, next) => {
  try {
    if (req.user && req.user._id) {
      // Update lastActive without waiting for the operation to complete (non-blocking)
      User.findByIdAndUpdate(
        req.user._id, 
        { lastActive: new Date() },
        { new: true }
      ).catch(error => {
        console.error('Error updating lastActive:', error);
      });
    }
    next();
  } catch (error) {
    console.error('Error in updateLastActive middleware:', error);
    next();
  }
};