import { BM25 } from '../utils/bm25Similarity.js';
import textProcessor from '../utils/textProcessor.js';
import { Post } from '../models/post.model.js';
import { ApiError } from '../utils/ApiError.js';

class MatchingEngineService {
    constructor() {
        this.titleBM25 = new BM25();
        this.descriptionBM25 = new BM25();
        this.isTrained = false;
        this.posts = [];
    }

    async initialize() {
        try {
            // CRITICAL: Added 'user' to the select list so we can exclude the owner's posts later
            const posts = await Post.find({})
                .select('title description category location type date createdAt user')
                .lean();

            this.train(posts);
            return { success: true, message: `Matching engine initialized with ${posts.length} posts` };
        } catch (error) {
            throw new ApiError(500, `Failed to initialize matching engine: ${error.message}`);
        }
    }

    train(posts) {
        if (!posts || !Array.isArray(posts)) {
            throw new ApiError(400, "Invalid posts data for training");
        }

        this.posts = posts;
        
        const titleDocs = posts.map(post => ({
            id: post._id,
            tokens: textProcessor.preprocessText(post.title).split(' ').filter(t => t.length > 0),
            original: post
        }));

        const descriptionDocs = posts.map(post => ({
            id: post._id,
            tokens: textProcessor.preprocessText(post.description).split(' ').filter(t => t.length > 0),
            original: post
        }));

        this.titleBM25.buildCorpus(titleDocs);
        this.descriptionBM25.buildCorpus(descriptionDocs);
        this.isTrained = true;
    }

    calculateLocationSimilarity(locA, locB) {
        if (!locA || !locB) return 0.3;
        
        const locAStr = locA.toString().toLowerCase().trim();
        const locBStr = locB.toString().toLowerCase().trim();
        
        if (locAStr === locBStr) return 1.0;
        
        if (locAStr.includes(locBStr) || locBStr.includes(locAStr)) return 0.7;
        
        const commonWords = ['park', 'mall', 'center', 'street', 'avenue', 'road', 'kathmandu', 'pokhara'];
        const hasCommonWord = commonWords.some(word => 
            locAStr.includes(word) && locBStr.includes(word)
        );
        
        return hasCommonWord ? 0.4 : 0.1;
    }

    calculateDateProximity(dateA, dateB) {
        try {
            const timeDiff = Math.abs(new Date(dateA) - new Date(dateB));
            const daysDiff = timeDiff / (1000 * 60 * 60 * 24);
            
            if (daysDiff <= 1) return 1.0;
            if (daysDiff <= 3) return 0.8;
            if (daysDiff <= 7) return 0.6;
            if (daysDiff <= 14) return 0.4;
            if (daysDiff <= 30) return 0.2;
            return 0.1;
        } catch (error) {
            return 0.1;
        }
    }

    findMatches(queryPost, options = {}) {
        if (!this.isTrained) {
            throw new ApiError(500, "Matching engine not trained. Please initialize first.");
        }

        const {
            topK = 10,
            weights = {
                title: 0.25,
                description: 0.35,
                category: 0.20,
                location: 0.15,
                date: 0.05
            },
            minScore = 0.1,
            // Destructure the user ID to exclude
            excludeUserId
        } = options;

        const processedTitle = textProcessor.preprocessText(queryPost.title);
        const processedDescription = textProcessor.preprocessText(queryPost.description);

        const titleMatches = this.titleBM25.findSimilar(processedTitle, topK * 3);
        const descriptionMatches = this.descriptionBM25.findSimilar(processedDescription, topK * 3);

        const candidatePosts = new Map();

        titleMatches.forEach(match => {
            const post = match.document.original;
            
            // Check 1: Exclude the query post itself
            const isSelfMatch = post._id.toString() === queryPost._id.toString();
            
            // Check 2: Exclude posts owned by the same user (if excludeUserId is provided)
            const isOwnerPost = excludeUserId && post.user.toString() === excludeUserId.toString();
            
            if (!isSelfMatch && !isOwnerPost) {
                candidatePosts.set(post._id.toString(), {
                    post,
                    titleScore: match.score,
                    descriptionScore: 0
                });
            }
        });

        descriptionMatches.forEach(match => {
            const post = match.document.original;
            
            // Check 1: Exclude the query post itself
            const isSelfMatch = post._id.toString() === queryPost._id.toString();

            // Check 2: Exclude posts owned by the same user (if excludeUserId is provided)
            const isOwnerPost = excludeUserId && post.user.toString() === excludeUserId.toString();
            
            if (!isSelfMatch && !isOwnerPost) {
                const existing = candidatePosts.get(post._id.toString());
                if (existing) {
                    existing.descriptionScore = match.score;
                } else {
                    candidatePosts.set(post._id.toString(), {
                        post,
                        titleScore: 0,
                        descriptionScore: match.score
                    });
                }
            }
        });

        const scoredMatches = Array.from(candidatePosts.values()).map(candidate => {
            const categoryScore = candidate.post.category === queryPost.category ? 1 : 0;
            const locationScore = this.calculateLocationSimilarity(candidate.post.location, queryPost.location);
            const dateScore = this.calculateDateProximity(candidate.post.date, queryPost.date);

            const finalScore = 
                (Math.min(candidate.titleScore, 1) * weights.title) +
                (Math.min(candidate.descriptionScore, 1) * weights.description) +
                (categoryScore * weights.category) +
                (locationScore * weights.location) +
                (dateScore * weights.date);

            return {
                post: candidate.post,
                score: parseFloat(finalScore.toFixed(3)),
                breakdown: {
                    title: parseFloat(candidate.titleScore.toFixed(3)),
                    description: parseFloat(candidate.descriptionScore.toFixed(3)),
                    category: categoryScore,
                    location: parseFloat(locationScore.toFixed(3)),
                    date: parseFloat(dateScore.toFixed(3))
                }
            };
        });

        return scoredMatches
            .sort((a, b) => b.score - a.score)
            .slice(0, topK)
            .filter(match => match.score >= minScore);
    }

    findCrossTypeMatches(post, options = {}) {
        const oppositeType = post.type === 'lost' ? 'found' : 'lost';
        // Filter the full list of posts to get only the opposite type
        const oppositeTypePosts = this.posts.filter(p => p.type === oppositeType);
        
        if (oppositeTypePosts.length === 0) {
            return [];
        }

        // We re-train the temporary engine ONLY with the opposite type posts
        const tempEngine = new MatchingEngineService();
        tempEngine.train(oppositeTypePosts);
        
        // Then we call findMatches on the temporary engine, passing the options (which contains excludeUserId)
        return tempEngine.findMatches(post, options);
    }

    async refreshTraining() {
        await this.initialize();
    }
}

export default new MatchingEngineService();
