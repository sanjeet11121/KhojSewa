// import { ApiError } from '../ApiError.js';

class CosineSimilarity {
    constructor() {
        this.cache = new Map();
    }

    // Calculate dot product of two vectors
    dotProduct(vectorA, vectorB) {
        let product = 0;
        for (let key in vectorA) {
            if (vectorB[key]) {
                product += vectorA[key] * vectorB[key];
            }
        }
        return product;
    }

    // Calculate magnitude of a vector
    magnitude(vector) {
        let sum = 0;
        for (let key in vector) {
            sum += vector[key] * vector[key];
        }
        return Math.sqrt(sum);
    }

    // Calculate cosine similarity between two vectors
    calculate(vectorA, vectorB) {
        if (Object.keys(vectorA).length === 0 || Object.keys(vectorB).length === 0) {
            return 0;
        }

        const dotProd = this.dotProduct(vectorA, vectorB);
        const magnitudeA = this.magnitude(vectorA);
        const magnitudeB = this.magnitude(vectorB);

        if (magnitudeA === 0 || magnitudeB === 0) {
            return 0;
        }

        return dotProd / (magnitudeA * magnitudeB);
    }

    // Create TF-IDF vector from text
    createTFIDFVector(tokens, idf) {
        const tf = {};
        
        // Calculate term frequency
        tokens.forEach(token => {
            tf[token] = (tf[token] || 0) + 1;
        });

        // Normalize TF and apply IDF
        const vector = {};
        const tokenCount = tokens.length;
        
        Object.keys(tf).forEach(token => {
            const tfValue = tf[token] / tokenCount;
            const idfValue = idf[token] || 1;
            vector[token] = tfValue * idfValue;
        });

        return vector;
    }

    // Calculate IDF for corpus
    calculateIDF(documents) {
        const idf = {};
        const totalDocs = documents.length;

        documents.forEach(doc => {
            const uniqueTokens = new Set(doc.tokens);
            uniqueTokens.forEach(token => {
                idf[token] = (idf[token] || 0) + 1;
            });
        });

        // Convert to actual IDF values
        Object.keys(idf).forEach(token => {
            idf[token] = Math.log(totalDocs / idf[token]);
        });

        return idf;
    }
}

export { CosineSimilarity };