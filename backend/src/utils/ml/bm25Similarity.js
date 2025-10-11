import { ApiError } from './ApiError.js';

class BM25 {
    constructor(k1 = 1.5, b = 0.75) {
        this.k1 = k1;
        this.b = b;
        this.documents = [];
        this.avgDocLength = 0;
        this.docFreq = {};
        this.idf = {};
        this.docLengths = [];
    }

    buildCorpus(documents) {
        if (!documents || !Array.isArray(documents)) {
            throw new ApiError(400, "Invalid documents provided for BM25 corpus");
        }

        this.documents = documents;
        this.docLengths = documents.map(doc => doc.tokens ? doc.tokens.length : 0);
        this.avgDocLength = this.docLengths.reduce((a, b) => a + b, 0) / this.docLengths.length;
        
        this.calculateDocumentFrequency();
        this.calculateIDF();
    }

    calculateDocumentFrequency() {
        this.docFreq = {};
        
        this.documents.forEach((doc) => {
            if (!doc.tokens) return;
            
            const uniqueTokens = new Set(doc.tokens);
            uniqueTokens.forEach(token => {
                this.docFreq[token] = (this.docFreq[token] || 0) + 1;
            });
        });
    }

    calculateIDF() {
        this.idf = {};
        const totalDocs = this.documents.length;
        
        Object.keys(this.docFreq).forEach(token => {
            this.idf[token] = Math.log(1 + (totalDocs - this.docFreq[token] + 0.5) / (this.docFreq[token] + 0.5));
        });
    }

    calculateScore(queryTokens, docIndex) {
        const doc = this.documents[docIndex];
        if (!doc || !doc.tokens) return 0;

        const docLength = this.docLengths[docIndex];
        let score = 0;

        queryTokens.forEach(token => {
            if (!this.idf[token]) return;

            const termFreq = doc.tokens.filter(t => t === token).length;
            const numerator = termFreq * (this.k1 + 1);
            const denominator = termFreq + this.k1 * (1 - this.b + this.b * (docLength / this.avgDocLength));
            
            score += this.idf[token] * (numerator / denominator);
        });

        return score;
    }

    findSimilar(query, topK = 10) {
        if (!query || typeof query !== 'string') {
            return [];
        }

        const queryTokens = query.split(' ').filter(token => token.length > 0);
        const scores = this.documents.map((_, index) => ({
            index,
            score: this.calculateScore(queryTokens, index),
            document: this.documents[index]
        }));

        return scores
            .sort((a, b) => b.score - a.score)
            .slice(0, topK)
            .filter(item => item.score > 0);
    }
}

export { BM25 };