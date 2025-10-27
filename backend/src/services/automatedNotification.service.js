// services/automatedNotificationService.js
// import { sendMail } from '../utils/email.js';
// import { User } from '../models/user.model.js';
// import { Claim } from '../models/claim.model.js';
import { FoundPost } from '../models/foundPost.model.js';
import { LostPost } from '../models/lostPost.model.js';
import { Match } from '../models/match.model.js';
import RealTimeCosineMatching from './realTimeCosineMatching.service.js';
import NotificationService from './notifications.service.js';

class AutomatedNotificationService {
    constructor() {
        this.isMonitoring = false;
        this.checkInterval = 5 * 60 * 1000; // 5 minutes
        this.intervalId = null;
        this.processedPosts = new Set(); // Track processed posts
    }

    /**
     * Start automatic monitoring of new posts
     */
    startMonitoring() {
        if (this.isMonitoring) {
            console.log('Monitoring already started');
            return;
        }

        this.isMonitoring = true;
        console.log('🚀 Starting automatic post monitoring...');

        // Initial check
        this.checkNewPosts();

        // Set up interval for continuous monitoring
        this.intervalId = setInterval(() => {
            this.checkNewPosts();
        }, this.checkInterval);

        console.log(`✅ Automatic monitoring started. Checking every ${this.checkInterval / 60000} minutes`);
    }

    /**
     * Stop automatic monitoring
     */
    stopMonitoring() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
        this.isMonitoring = false;
        console.log('🛑 Automatic monitoring stopped');
    }

    /**
     * Check for new posts and find matches
     */
    async checkNewPosts() {
        try {
            console.log('🔍 Checking for new posts...');
            
            // Find recent active posts that haven't been processed
            const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
            
            const newLostPosts = await LostPost.find({
                isFound: false,
                status: 'active',
                createdAt: { $gte: fiveMinutesAgo },
                _id: { $nin: Array.from(this.processedPosts) }
            }).populate('user');

            const newFoundPosts = await FoundPost.find({
                isReturned: false,
                status: 'active',
                createdAt: { $gte: fiveMinutesAgo },
                _id: { $nin: Array.from(this.processedPosts) }
            }).populate('user');

            const allNewPosts = [...newLostPosts, ...newFoundPosts];
            
            console.log(`📝 Found ${allNewPosts.length} new posts to process`);

            // Process each new post
            for (const post of allNewPosts) {
                await this.processNewPost(post);
            }

        } catch (error) {
            console.error('Error checking new posts:', error);
        }
    }

    /**
     * Process a single new post and find matches
     */
    async processNewPost(post) {
        try {
            console.log(`🔄 Processing post: ${post.title} (${post.type})`);
            
            let matches = [];
            
            // Use ML matching engine to find matches
            if (post.type === 'lost') {
                matches = await RealTimeCosineMatching.findMatchesForLostPost(post._id);
            } else {
                matches = await RealTimeCosineMatching.findMatchesForFoundPost(post._id);
            }

            console.log(`🎯 Found ${matches.length} matches for post: ${post.title}`);

            // Store matches in database
            await this.storeMatchesInDatabase(post, matches);

            // Send notification if good matches found
            if (matches.length > 0) {
                await NotificationService.triggerNewMatchesNotification(
                    post._id,
                    post.type,
                    matches
                );
            }

            // Mark post as processed
            this.processedPosts.add(post._id.toString());

            console.log(`✅ Completed processing post: ${post.title}`);

        } catch (error) {
            console.error(`Error processing post ${post._id}:`, error);
        }
    }

    /**
     * Store matches in database for tracking
     */
    async storeMatchesInDatabase(originalPost, matches) {
        try {
            const matchPromises = matches.map(async (match) => {
                // Determine which post is lost and which is found
                let lostPost, foundPost;
                
                if (originalPost.type === 'lost') {
                    lostPost = originalPost._id;
                    foundPost = match.post._id;
                } else {
                    lostPost = match.post._id;
                    foundPost = originalPost._id;
                }

                // Check if match already exists
                const existingMatch = await Match.findOne({
                    lostPost,
                    foundPost
                });

                if (!existingMatch) {
                    // Create new match record
                    await Match.create({
                        lostPost,
                        foundPost,
                        score: match.score,
                        confidence: match.confidence,
                        breakdown: match.breakdown,
                        matchReasons: match.matchReasons || [],
                        isNotified: true,
                        algorithmVersion: '1.0'
                    });
                }
            });

            await Promise.all(matchPromises);
            console.log(`💾 Stored ${matches.length} matches in database`);

        } catch (error) {
            console.error('Error storing matches in database:', error);
        }
    }

    /**
     * Process all existing posts (for initial setup)
     */
    async processAllExistingPosts() {
        try {
            console.log('🔄 Processing all existing posts...');
            
            const lostPosts = await LostPost.find({
                isFound: false,
                status: 'active'
            }).populate('user');

            const foundPosts = await FoundPost.find({
                isReturned: false,
                status: 'active'
            }).populate('user');

            const allPosts = [...lostPosts, ...foundPosts];
            
            console.log(`📝 Processing ${allPosts.length} existing posts`);

            let totalMatches = 0;
            
            for (const post of allPosts) {
                const matches = await this.processNewPost(post);
                totalMatches += matches ? matches.length : 0;
            }

            console.log(`✅ Processed ${allPosts.length} posts, found ${totalMatches} total matches`);
            
        } catch (error) {
            console.error('Error processing all existing posts:', error);
        }
    }

    /**
     * Find matches for a specific post on demand
     */
    async findMatchesForPost(postId) {
        try {
            const post = await Post.findById(postId);
            if (!post) {
                throw new Error('Post not found');
            }

            let matches = [];
            if (post.type === 'lost') {
                matches = await RealTimeCosineMatching.findMatchesForLostPost(postId);
            } else {
                matches = await RealTimeCosineMatching.findMatchesForFoundPost(postId);
            }

            // Store matches
            await this.storeMatchesInDatabase(post, matches);

            return matches;

        } catch (error) {
            console.error('Error finding matches for post:', error);
            throw error;
        }
    }

    /**
     * Get monitoring status
     */
    getStatus() {
        return {
            isMonitoring: this.isMonitoring,
            processedPosts: this.processedPosts.size,
            checkInterval: this.checkInterval,
            lastCheck: new Date()
        };
    }

    /**
     * Clear processed posts cache (useful for testing)
     */
    clearCache() {
        this.processedPosts.clear();
        console.log('🧹 Cleared processed posts cache');
    }
}

export default new AutomatedNotificationService();