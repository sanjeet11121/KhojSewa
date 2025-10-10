import { CosineSimilarity } from '../utils/ml/cosineSimilarity.js';
import textProcessor from '../utils/ml/textProcessor.js';
import { FoundPost } from '../models/foundPost.model.js';
import { LostPost } from '../models/lostPost.model.js';
import { ApiError } from '../utils/ApiError.js';

class CosineMatchingEngine {
    constructor() {
        this.cosineSimilarity = new CosineSimilarity();
        this.isTrained = false;
        this.foundPosts = [];
        this.lostPosts = [];
        this.allPosts = [];
        this.idf = {};
    }

    async initialize() {
        try {
            // Fetch both found and lost posts
            const [foundPosts, lostPosts] = await Promise.all([
                FoundPost.find({ isReturned: false })
                    .select('title description category locationFound foundDate itemName user createdAt')
                    .populate('user', 'fullName email')
                    .lean(),
                LostPost.find({ isFound: false })
                    .select('title description category locationLost lostDate itemName user createdAt')
                    .populate('user', 'fullName email')
                    .lean()
            ]);

            this.foundPosts = foundPosts;
            this.lostPosts = lostPosts;

            await this.train();
            return { 
                success: true, 
                message: `Cosine matching engine initialized with ${foundPosts.length} found posts and ${lostPosts.length} lost posts` 
            };
        } catch (error) {
            throw new ApiError(500, `Failed to initialize cosine matching engine: ${error.message}`);
        }
    }

    async train() {
        // Extract features from all posts
        this.allPosts = [
            ...this.foundPosts.map(post => ({
                ...textProcessor.extractFeatures(post, 'found'),
                original: post,
                _id: post._id
            })),
            ...this.lostPosts.map(post => ({
                ...textProcessor.extractFeatures(post, 'lost'),
                original: post,
                _id: post._id
            }))
        ];

        // Calculate IDF for the entire corpus
        const documents = this.allPosts.map(post => ({
            tokens: post.tokens
        }));

        this.idf = this.cosineSimilarity.calculateIDF(documents);
        this.isTrained = true;
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

    calculateTextSimilarity(postA, postB) {
        try {
            // Create TF-IDF vectors
            const vectorA = this.cosineSimilarity.createTFIDFVector(postA.tokens, this.idf);
            const vectorB = this.cosineSimilarity.createTFIDFVector(postB.tokens, this.idf);

            // Calculate cosine similarity
            return this.cosineSimilarity.calculate(vectorA, vectorB);
        } catch (error) {
            console.error('Error calculating text similarity:', error);
            return 0;
        }
    }

    findMatches(queryPost, postType, options = {}) {
        if (!this.isTrained) {
            throw new ApiError(500, "Cosine matching engine not trained. Please initialize first.");
        }

        const {
            topK = 10,
            weights = {
                text: 0.6,      // Combined text similarity
                category: 0.2,
                location: 0.15,
                date: 0.05
            },
            minScore = 0.1
        } = options;

        const queryFeatures = textProcessor.extractFeatures(queryPost, postType);
        const oppositeType = postType === 'lost' ? 'found' : 'lost';

        const candidatePosts = this.allPosts
            .filter(post => post.type === oppositeType && post._id.toString() !== queryPost._id.toString())
            .map(candidate => {
                // Calculate text similarity using cosine
                const textSimilarity = this.calculateTextSimilarity(queryFeatures, candidate);

                // Calculate other feature similarities
                const categorySimilarity = queryFeatures.category === candidate.category ? 1 : 0;
                const locationSimilarity = this.calculateLocationSimilarity(
                    queryPost.locationFound || queryPost.locationLost,
                    candidate.original.locationFound || candidate.original.locationLost
                );
                const dateSimilarity = this.calculateDateProximity(
                    queryPost.foundDate || queryPost.lostDate,
                    candidate.original.foundDate || candidate.original.lostDate
                );

                // Calculate weighted final score
                const finalScore = 
                    (textSimilarity * weights.text) +
                    (categorySimilarity * weights.category) +
                    (locationSimilarity * weights.location) +
                    (dateSimilarity * weights.date);

                return {
                    post: candidate.original,
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

        return candidatePosts
            .sort((a, b) => b.score - a.score)
            .slice(0, topK)
            .filter(match => match.score >= minScore);
    }

    getConfidenceLevel(score) {
        if (score >= 0.7) return 'high';
        if (score >= 0.4) return 'medium';
        return 'low';
    }

    async findMatchesForLostPost(lostPostId, options = {}) {
        const lostPost = await LostPost.findById(lostPostId)
            .populate('user', 'fullName email')
            .lean();
            
        if (!lostPost) {
            throw new ApiError(404, "Lost post not found");
        }

        return this.findMatches(lostPost, 'lost', options);
    }

    async findMatchesForFoundPost(foundPostId, options = {}) {
        const foundPost = await FoundPost.findById(foundPostId)
            .populate('user', 'fullName email')
            .lean();
            
        if (!foundPost) {
            throw new ApiError(404, "Found post not found");
        }

        return this.findMatches(foundPost, 'found', options);
    }

    async refreshTraining() {
        await this.initialize();
    }

    getStats() {
        return {
            isTrained: this.isTrained,
            foundPosts: this.foundPosts.length,
            lostPosts: this.lostPosts.length,
            totalPosts: this.allPosts.length
        };
    }
}

export default new CosineMatchingEngine();