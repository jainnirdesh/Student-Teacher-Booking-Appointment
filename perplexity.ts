// perplexity.ts

export const API_KEY = "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";

// Utility to calculate perplexity for a sequence of probabilities

/**
 * Calculates perplexity for a sequence of probabilities.
 * @param probabilities Array of probabilities (each between 0 and 1, not 0)
 * @returns Perplexity value
 */
export function calculatePerplexity(probabilities: number[]): number {
    if (!probabilities.length) return NaN;
    // Avoid log(0) by filtering out zeros
    const filtered = probabilities.filter(p => p > 0);
    if (!filtered.length) return Infinity;
    const logSum = filtered.reduce((sum, p) => sum + Math.log2(p), 0);
    const avgLog = logSum / filtered.length;
    return Math.pow(2, -avgLog);
}

// Example usage:
// const probs = [0.1, 0.2, 0.3, 0.4];
// const perplexity = calculatePerplexity(probs);
// console.log('Perplexity:', perplexity);
