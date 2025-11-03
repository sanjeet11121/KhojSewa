import { CosineSimilarity } from '../utils/ml/cosineSimilarity.js';
import textProcessor from '../utils/ml/textProcessor.js';
import { FoundPost } from '../models/foundPost.model.js';
import { LostPost } from '../models/lostPost.model.js';
import { ApiError } from '../utils/ApiError.js';

class RealTimeCosineMatching {
    constructor() {
        this.cosineSimilarity = new CosineSimilarity();
        // No pre-training needed for real-time search
    }

    calculateLocationSimilarity(locA, locB) {
        if (!locA || !locB) return 0.3;
        
        const locAStr = locA.toString().toLowerCase().trim();
        const locBStr = locB.toString().toLowerCase().trim();
        
        if (locAStr === locBStr) return 1.0;
        
        if (locAStr.includes(locBStr) || locBStr.includes(locAStr)) return 0.7;
        
        const commonWords = ['kathmandu', 'pokhara', 'lalitpur', 'bhaktapur', 'biratnagar', 'birgunj', 'butwal', 'dharan', 'bharatpur', 'hetauda', 'janakpur', 'dhangadhi', 'itahari', 'nepalgunj', 'baglung', 'palpa', 'syangja', 'kaski', 'park', 'mall', 'center', 'street', 'avenue', 'road', 'chowk', 'tole', 'bazaar'];
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

    calculateTextSimilarity(tokensA, tokensB) {
        try {
            // Create simple TF vectors (no IDF for real-time)
            const vectorA = this.createTFVector(tokensA);
            const vectorB = this.createTFVector(tokensB);

            // Calculate cosine similarity
            return this.cosineSimilarity.calculate(vectorA, vectorB);
        } catch (error) {
            console.error('Error calculating text similarity:', error);
            return 0;
        }
    }

    createTFVector(tokens) {
        const tf = {};
        const tokenCount = tokens.length;
        
        tokens.forEach(token => {
            tf[token] = (tf[token] || 0) + 1;
        });

        // Normalize term frequency
        Object.keys(tf).forEach(token => {
            tf[token] = tf[token] / tokenCount;
        });

        return tf;
    }

    getConfidenceLevel(score) {
        if (score >= 0.7) return 'high';
        if (score >= 0.4) return 'medium';
        return 'low';
    }

    async findMatchesForLostPost(lostPostId, options = {}) {
        const {
            limit = 10,
            weights = {
                text: 0.6,
                category: 0.2,
                location: 0.15,
                date: 0.05
            },
            minScore = 0.1,
            excludeUserId
        } = options;

        // 1. Fetch the lost post from database
        const lostPost = await LostPost.findById(lostPostId)
            .populate('user', 'fullName email')
            .lean();
            
        if (!lostPost) {
            throw new ApiError(404, "Lost post not found");
        }

        // 2. Fetch all relevant found posts from database in real-time
        const query = { 
            isReturned: false,
            // Optional: Add category filter for better performance
            // category: lostPost.category 
        };
        
        // Exclude posts from the same user
        if (excludeUserId) {
            query.user = { $ne: excludeUserId };
        }
        
        const foundPosts = await FoundPost.find(query)
        .populate('user', 'fullName email')
        .lean();

        // 3. Extract features from lost post
        const lostFeatures = textProcessor.extractFeatures(lostPost, 'lost');

        // 4. Calculate similarity with each found post
        const matches = foundPosts.map(foundPost => {
            const foundFeatures = textProcessor.extractFeatures(foundPost, 'found');

            // Calculate text similarity using cosine
            const textSimilarity = this.calculateTextSimilarity(lostFeatures.tokens, foundFeatures.tokens);

            // Calculate other feature similarities
            const categorySimilarity = lostFeatures.category === foundFeatures.category ? 1 : 0;
            const locationSimilarity = this.calculateLocationSimilarity(
                lostPost.locationLost,
                foundPost.locationFound
            );
            const dateSimilarity = this.calculateDateProximity(
                lostPost.lostDate,
                foundPost.foundDate
            );

            // Calculate weighted final score
            const finalScore = 
                (textSimilarity * weights.text) +
                (categorySimilarity * weights.category) +
                (locationSimilarity * weights.location) +
                (dateSimilarity * weights.date);

            return {
                post: foundPost,
                score: parseFloat(finalScore.toFixed(3)),
                confidence: this.getConfidenceLevel(finalScore),
                breakdown: {
                    text: parseFloat(textSimilarity.toFixed(3)),
                    category: categorySimilarity,
                    location: parseFloat(locationSimilarity.toFixed(3)),
                    date: parseFloat(dateSimilarity.toFixed(3))
                }
            };
        });

        // 5. Return top matches
        return matches
            .sort((a, b) => b.score - a.score)
            .slice(0, limit)
            .filter(match => match.score >= minScore);
    }

    async findMatchesForFoundPost(foundPostId, options = {}) {
        const {
            limit = 10,
            weights = {
                text: 0.6,
                category: 0.2,
                location: 0.15,
                date: 0.05
            },
            minScore = 0.1,
            excludeUserId
        } = options;

        // 1. Fetch the found post from database
        const foundPost = await FoundPost.findById(foundPostId)
            .populate('user', 'fullName email')
            .lean();
            
        if (!foundPost) {
            throw new ApiError(404, "Found post not found");
        }

        // 2. Fetch all relevant lost posts from database in real-time
        const query = { 
            isFound: false,
            // category: foundPost.category // Optional filter
        };
        
        // Exclude posts from the same user
        if (excludeUserId) {
            query.user = { $ne: excludeUserId };
        }
        
        const lostPosts = await LostPost.find(query)
        .populate('user', 'fullName email')
        .lean();

        // 3. Extract features from found post
        const foundFeatures = textProcessor.extractFeatures(foundPost, 'found');

        // 4. Calculate similarity with each lost post
        const matches = lostPosts.map(lostPost => {
            const lostFeatures = textProcessor.extractFeatures(lostPost, 'lost');

            // Calculate text similarity using cosine
            const textSimilarity = this.calculateTextSimilarity(foundFeatures.tokens, lostFeatures.tokens);

            // Calculate other feature similarities
            const categorySimilarity = foundFeatures.category === lostFeatures.category ? 1 : 0;
            const locationSimilarity = this.calculateLocationSimilarity(
                foundPost.locationFound,
                lostPost.locationLost
            );
            const dateSimilarity = this.calculateDateProximity(
                foundPost.foundDate,
                lostPost.lostDate
            );

            // Calculate weighted final score
            const finalScore = 
                (textSimilarity * weights.text) +
                (categorySimilarity * weights.category) +
                (locationSimilarity * weights.location) +
                (dateSimilarity * weights.date);

            return {
                post: lostPost,
                score: parseFloat(finalScore.toFixed(3)),
                confidence: this.getConfidenceLevel(finalScore),
                breakdown: {
                    text: parseFloat(textSimilarity.toFixed(3)),
                    category: categorySimilarity,
                    location: parseFloat(locationSimilarity.toFixed(3)),
                    date: parseFloat(dateSimilarity.toFixed(3))
                }
            };
        });

        // 5. Return top matches
        return matches
            .sort((a, b) => b.score - a.score)
            .slice(0, limit)
            .filter(match => match.score >= minScore);
    }

    // Search for matches using text query (for search functionality)
    async searchPostsByText(query, postType = 'both', options = {}) {
        const {
            limit = 10,
            minScore = 0.1
        } = options;

        if (!query || typeof query !== 'string') {
            throw new ApiError(400, "Search query is required");
        }

        // Preprocess search query
        const queryTokens = textProcessor.preprocessText(query);

        let posts = [];

        // Fetch posts based on type
        if (postType === 'both') {
            const [foundPosts, lostPosts] = await Promise.all([
                FoundPost.find({ isReturned: false })
                    .populate('user', 'fullName email')
                    .lean(),
                LostPost.find({ isFound: false })
                    .populate('user', 'fullName email')
                    .lean()
            ]);
            posts = [...foundPosts, ...lostPosts];
        } else if (postType === 'found') {
            posts = await FoundPost.find({ isReturned: false })
                .populate('user', 'fullName email')
                .lean();
        } else if (postType === 'lost') {
            posts = await LostPost.find({ isFound: false })
                .populate('user', 'fullName email')
                .lean();
        }

        // Calculate similarity with each post
        const results = posts.map(post => {
            const postType = post.locationFound ? 'found' : 'lost';
            const postFeatures = textProcessor.extractFeatures(post, postType);

            // Calculate text similarity using cosine
            const similarity = this.calculateTextSimilarity(queryTokens, postFeatures.tokens);

            return {
                post: post,
                type: postType,
                score: parseFloat(similarity.toFixed(3)),
                confidence: this.getConfidenceLevel(similarity)
            };
        });

        // Return top results
        return results
            .sort((a, b) => b.score - a.score)
            .slice(0, limit)
            .filter(result => result.score >= minScore);
    }
}

export default new RealTimeCosineMatching();