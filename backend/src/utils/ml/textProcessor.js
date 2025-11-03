import natural from 'natural';
import { stemmer } from 'stemmer';

class EnhancedTextProcessor {
    constructor() {
        this.stopWords = new Set([
            'a', 'an', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 
            'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'this', 'that',
            'it', 'its', 'it\'s', 'have', 'has', 'had', 'do', 'does', 'did'
        ]);
        
        this.synonymMap = {
            'iphone': ['smartphone', 'mobile', 'cellphone', 'apple phone'],
            'samsung': ['galaxy'],
            'lost': ['missing', 'misplaced'],
            'found': ['discovered', 'picked'],
            'wallet': ['purse', 'pocketbook'],
            'keys': ['keychain'],
            'glasses': ['spectacles', 'eyeglasses'],
            'bag': ['backpack', 'purse', 'handbag'],
            'book': ['notebook', 'textbook'],
            'card': ['id', 'license', 'credit card', 'debit card'],
            'laptop': ['notebook', 'macbook'],
            'charger': ['adapter', 'power adapter'],
            'water': ['bottle', 'water bottle'],
            'umbrella': ['raincoat'],
            'bottle': ['container'],
            'phone': ['mobile', 'cellphone', 'smartphone'],
            'headphone': ['earphone', 'earpiece'],
            'watch': ['wristwatch', 'timepiece'],
            'money': ['cash', 'currency']
        };

        this.categoryMapping = {
            'electronics': ['Electronics'],
            'stationeries': ['Stationeries'],
            'clothing': ['Clothing'],
            'food': ['Food'],
            'toys': ['Toys'],
            'other': ['Other']
        };
    }

    preprocessText(text) {
        if (!text || typeof text !== 'string') return '';

        try {
            // 1. Lowercase and clean
            let processed = text.toLowerCase()
                .replace(/[^\w\s]/g, ' ')
                .replace(/\s+/g, ' ')
                .trim();

            // 2. Tokenize
            let tokens = processed.split(' ').filter(token => token.length > 1);

            // 3. Remove stop words and stem
            tokens = tokens
                .filter(token => !this.stopWords.has(token))
                .map(token => stemmer(token));

            // 4. Synonym expansion
            const expandedTokens = [];
            tokens.forEach(token => {
                expandedTokens.push(token);
                if (this.synonymMap[token]) {
                    expandedTokens.push(...this.synonymMap[token]);
                }
            });

            // 5. Generate bigrams
            const bigrams = [];
            for (let i = 0; i < tokens.length - 1; i++) {
                bigrams.push(`${tokens[i]}_${tokens[i + 1]}`);
            }

            return [...new Set([...expandedTokens, ...bigrams])];

        } catch (error) {
            console.error('Text preprocessing error:', error);
            return text.toLowerCase().replace(/[^\w\s]/g, ' ').split(' ').filter(t => t.length > 1);
        }
    }

    normalizeCategory(category) {
        // Handle null, undefined, or empty values
        if (!category) return 'other';
        
        // Convert to string if it's not already (handles objects, numbers, etc.)
        let categoryStr;
        if (typeof category === 'string') {
            categoryStr = category;
        } else if (typeof category === 'object' && category !== null) {
            // If it's an object, try to get a string representation
            categoryStr = category.toString();
        } else {
            // For numbers, booleans, etc., convert to string
            categoryStr = String(category);
        }
        
        // Trim and lowercase
        const lowerCategory = categoryStr.trim().toLowerCase();
        
        // Check if empty after trimming
        if (!lowerCategory) return 'other';
        
        // Match against category mapping
        for (const [key, values] of Object.entries(this.categoryMapping)) {
            if (values.map(v => v.toLowerCase()).includes(lowerCategory)) {
                return key;
            }
        }
        return 'other';
    }

    extractFeatures(post, type) {
        const titleTokens = this.preprocessText(post.title);
        const descriptionTokens = this.preprocessText(post.description);
        const itemNameTokens = post.itemName ? this.preprocessText(post.itemName) : [];

        const allTokens = [...titleTokens, ...descriptionTokens, ...itemNameTokens];

        const baseFeatures = {
            tokens: allTokens,
            titleTokens: titleTokens,
            descriptionTokens: descriptionTokens,
            category: this.normalizeCategory(post.category),
            itemName: post.itemName || '',
            type: type
        };

        if (type === 'found') {
            return {
                ...baseFeatures,
                location: post.locationFound,
                date: post.foundDate
            };
        } else {
            return {
                ...baseFeatures,
                location: post.locationLost,
                date: post.lostDate
            };
        }
    }
}

export default new EnhancedTextProcessor();