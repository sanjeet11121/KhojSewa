// utils/claimUtils.js
import { Claim } from '../models/claim.model.js';

export class ClaimUtils {
    // Validate if a user can claim a post
    static async validateClaim(userId, postId, postType) {
        // Check if post exists and user is not the owner
        const PostModel = postType === 'LostPost' ? 
            (await import('../models/lostPost.model.js')).LostPost : 
            (await import('../models/foundPost.model.js')).FoundPost;
        
        const post = await PostModel.findById(postId).populate('user');
        
        if (!post) {
            throw new Error('Post not found');
        }
        
        if (post.user._id.toString() === userId.toString()) {
            throw new Error('You cannot claim your own post');
        }
        
        // Check for existing pending claim
        const existingClaim = await Claim.findOne({
            post: postId,
            postType,
            claimedBy: userId,
            status: 'pending'
        });
        
        if (existingClaim) {
            throw new Error('You already have a pending claim for this post');
        }
        
        return post;
    }
    
    // Get claim with full details
    static async getClaimWithDetails(claimId) {
        return await Claim.findById(claimId)
            .populate('post', 'title description category images locationLost locationFound lostDate foundDate')
            .populate('claimedBy', 'fullName email avatar phoneNumber')
            .populate('postOwner', 'fullName email avatar phoneNumber')
            .populate('messages.sender', 'fullName avatar');
    }
    
    // Check claim permissions
    static checkClaimPermission(claim, userId, action) {
        const isClaimant = claim.claimedBy._id.toString() === userId.toString();
        const isPostOwner = claim.postOwner._id.toString() === userId.toString();
        const isAdmin = false; // You can add admin check here
        
        switch (action) {
            case 'view':
                return isClaimant || isPostOwner || isAdmin;
            case 'update_status':
                return isPostOwner || isAdmin;
            case 'add_message':
                return isClaimant || isPostOwner || isAdmin;
            case 'delete':
                return isAdmin || (isClaimant && claim.status === 'pending');
            default:
                return false;
        }
    }
}