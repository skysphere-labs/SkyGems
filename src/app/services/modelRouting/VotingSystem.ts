/**
 * Image Scoring & Voting System
 * 
 * Evaluates and ranks generated images to select the best design
 */

import { Provider, NormalizedResponse } from './ProviderAbstraction';

export interface ImageScore {
  clarity: number; // 0-100: how clear/sharp
  designQuality: number; // 0-100: jewelry design quality
  promptMatch: number; // 0-100: how well it matches prompt
  uniqueness: number; // 0-100: how unique/novel
  overallScore: number; // weighted score
}

export interface ScoredImage {
  url: string;
  provider: Provider;
  score: ImageScore;
}

/**
 * Weighted scoring model
 */
const scoreWeights = {
  clarity: 0.25, // Sharpness and visual quality
  designQuality: 0.3, // Jewelry-specific quality
  promptMatch: 0.25, // Adherence to prompt
  uniqueness: 0.2, // Novelty and distinctiveness
};

/**
 * Score image clarity (simulated - would use ML in production)
 */
export function scoreClarity(imageUrl: string): number {
  // In production, this would use image analysis
  // For now, return high score for all (actual implementation would use ML)
  return 75 + Math.random() * 25; // 75-100
}

/**
 * Score design quality for jewelry
 */
export function scoreDesignQuality(imageUrl: string): number {
  // Heuristics for jewelry design quality
  // In production, would use specialized ML model
  return 70 + Math.random() * 25; // 70-95
}

/**
 * Score how well image matches the prompt
 */
export function scorePromptMatch(imageUrl: string, prompt?: string): number {
  // Would use image-text similarity model in production
  // For now, return baseline score
  return 65 + Math.random() * 30; // 65-95
}

/**
 * Score uniqueness compared to other images
 */
export function scoreUniqueness(
  imageUrl: string,
  otherImages: string[] = []
): number {
  // Would use perceptual hashing or embeddings in production
  // For now, return baseline score that varies
  const baseScore = 60 + Math.random() * 40; // 60-100
  
  // Slightly reduce score if we have many similar images
  const penalty = Math.min(10, otherImages.length * 2);
  return Math.max(40, baseScore - penalty);
}

/**
 * Compute final weighted score from dimension scores
 */
export function computeWeightedScore(scores: Omit<ImageScore, 'overallScore'>): number {
  let totalScore = 0;
  let weightSum = 0;

  Object.entries(scoreWeights).forEach(([dimension, weight]) => {
    const score = scores[dimension as keyof typeof scores] || 0;
    totalScore += score * weight;
    weightSum += weight;
  });

  return Math.round((totalScore / weightSum) * 100) / 100; // Round to 2 decimals
}

/**
 * Score a single image
 */
export function scoreImage(
  imageUrl: string,
  prompt?: string,
  otherImages: string[] = []
): ImageScore {
  const clarity = scoreClarity(imageUrl);
  const designQuality = scoreDesignQuality(imageUrl);
  const promptMatch = scorePromptMatch(imageUrl, prompt);
  const uniqueness = scoreUniqueness(imageUrl, otherImages);

  return {
    clarity: Math.round(clarity),
    designQuality: Math.round(designQuality),
    promptMatch: Math.round(promptMatch),
    uniqueness: Math.round(uniqueness),
    overallScore: computeWeightedScore({
      clarity,
      designQuality,
      promptMatch,
      uniqueness,
    }),
  };
}

/**
 * Score all images from multi-model generation
 */
export function scoreAllImages(
  results: NormalizedResponse[],
  prompt?: string
): ScoredImage[] {
  const allImages: ScoredImage[] = [];
  const allImageUrls: string[] = [];

  // First pass: collect all images
  results.forEach((result) => {
    result.images.forEach((imageUrl) => {
      allImageUrls.push(imageUrl);
    });
  });

  // Second pass: score with full context
  results.forEach((result) => {
    result.images.forEach((imageUrl) => {
      const score = scoreImage(imageUrl, prompt, allImageUrls);
      allImages.push({
        url: imageUrl,
        provider: result.provider,
        score,
      });
    });
  });

  return allImages;
}

/**
 * Pick the best image from all results
 */
export function pickBestImage(results: NormalizedResponse[], prompt?: string): ScoredImage {
  const scoredImages = scoreAllImages(results, prompt);

  if (scoredImages.length === 0) {
    throw new Error('No images generated');
  }

  // Sort by overall score descending
  scoredImages.sort((a, b) => b.score.overallScore - a.score.overallScore);

  const bestImage = scoredImages[0];

  console.log(`[VotingSystem] Selected best image from ${scoredImages.length} candidates`);
  console.log(`[VotingSystem] Provider: ${bestImage.provider}`);
  console.log(`[VotingSystem] Overall Score: ${bestImage.score.overallScore}`);
  console.log(`[VotingSystem] Scores:`, bestImage.score);

  return bestImage;
}

/**
 * Get top N images ranked by score
 */
export function getTopImages(
  results: NormalizedResponse[],
  topN: number = 3,
  prompt?: string
): ScoredImage[] {
  const scoredImages = scoreAllImages(results, prompt);
  scoredImages.sort((a, b) => b.score.overallScore - a.score.overallScore);
  return scoredImages.slice(0, topN);
}

/**
 * Get scoring statistics
 */
export function getScoringStatistics(results: NormalizedResponse[], prompt?: string) {
  const scoredImages = scoreAllImages(results, prompt);

  if (scoredImages.length === 0) {
    return null;
  }

  const scores = scoredImages.map((img) => img.score.overallScore);
  const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
  const maxScore = Math.max(...scores);
  const minScore = Math.min(...scores);

  // Group by provider
  const byProvider: Record<string, number[]> = {};
  scoredImages.forEach((img) => {
    if (!byProvider[img.provider]) {
      byProvider[img.provider] = [];
    }
    byProvider[img.provider].push(img.score.overallScore);
  });

  const providerStats: Record<string, { avg: number; max: number; count: number }> = {};
  Object.entries(byProvider).forEach(([provider, scores]) => {
    providerStats[provider] = {
      avg: Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 100) / 100,
      max: Math.max(...scores),
      count: scores.length,
    };
  });

  return {
    totalImages: scoredImages.length,
    averageScore: Math.round(avgScore * 100) / 100,
    maxScore,
    minScore,
    scoreRange: maxScore - minScore,
    byProvider: providerStats,
  };
}
