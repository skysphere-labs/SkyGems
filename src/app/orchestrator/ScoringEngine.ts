/**
 * Scoring & Ranking Engine
 * 
 * Scores designs across multiple dimensions and ranks them
 * Supports weighted scoring with customizable weights
 */

import { ScoredDesign, CriticScore } from '../agents/types';

export interface DesignRanking {
  rank: number;
  designId: string;
  totalScore: number;
  breakdown: Record<string, number>;
  diversity: number; // 0-1: how different from top-ranked
}

/**
 * Scoring weights for different dimensions
 * Weights sum to 1.0
 */
export const SCORE_WEIGHTS = {
  adherence: 0.25, // How well it follows the brief
  brandFit: 0.20, // Luxury brand standards
  manufacturability: 0.20, // Can be produced
  consistency: 0.15, // Multi-view consistency
  appeal: 0.20, // Overall luxury appeal
};

/**
 * Compute weighted total score from individual dimension scores
 */
export function computeWeightedScore(scores: Record<string, number>): number {
  let total = 0;
  let weightSum = 0;

  Object.entries(SCORE_WEIGHTS).forEach(([dimension, weight]) => {
    const score = scores[dimension] || 0;
    total += score * weight;
    weightSum += weight;
  });

  return weightSum > 0 ? total / weightSum : 0;
}

/**
 * Calculate diversity score between designs
 * Returns 0-1: 1 = completely different, 0 = identical
 */
function calculateDiversity(design1: ScoredDesign, design2: ScoredDesign): number {
  // Simple heuristic: compare scores across dimensions
  const differences = Object.keys(SCORE_WEIGHTS).map((key) => {
    const val1 = design1.score.scores[key as keyof typeof design1.score.scores] || 0;
    const val2 = design2.score.scores[key as keyof typeof design2.score.scores] || 0;
    return Math.abs(val1 - val2) / 100; // Normalize to 0-1
  });

  const avgDifference = differences.reduce((a, b) => a + b, 0) / differences.length;
  return Math.min(1, avgDifference);
}

/**
 * Rank designs with optional diversity boost
 */
export function rankDesigns(
  designs: ScoredDesign[],
  options: {
    topN?: number; // Select top N designs
    boostDiversity?: boolean; // Boost scores based on diversity from top designs
    diversityFactor?: number; // How much to boost (0-1)
    randomnessFactor?: number; // Add randomness ±% to scores
  } = {}
): DesignRanking[] {
  const {
    topN = Math.min(5, designs.length),
    boostDiversity = true,
    diversityFactor = 0.1,
    randomnessFactor = 0.05,
  } = options;

  // Step 1: Compute weighted scores
  const rankedDesigns = designs.map((design) => {
    const baseScore = computeWeightedScore(design.score.scores);

    // Step 2: Add randomness for exploration
    const randomBoost = (Math.random() - 0.5) * 2 * randomnessFactor * 100;
    let finalScore = Math.max(0, Math.min(100, baseScore + randomBoost));

    return {
      design,
      baseScore,
      finalScore,
    };
  });

  // Step 3: Sort by base score
  rankedDesigns.sort((a, b) => b.baseScore - a.baseScore);

  // Step 4: Apply diversity boost to lower-ranked designs
  if (boostDiversity && topN < rankedDesigns.length) {
    const topDesigns = rankedDesigns.slice(0, topN);

    rankedDesigns.forEach((item, index) => {
      if (index >= topN) {
        // Calculate average diversity from top N
        const diversities = topDesigns.map((top) =>
          calculateDiversity(item.design, top.design)
        );
        const avgDiversity = diversities.reduce((a, b) => a + b, 0) / diversities.length;

        // Boost score based on diversity
        item.finalScore += avgDiversity * diversityFactor * 100;
      }
    });
  }

  // Step 5: Resort by final score
  rankedDesigns.sort((a, b) => b.finalScore - a.finalScore);

  // Step 6: Return top N with ranking
  return rankedDesigns.slice(0, topN).map((item, index) => ({
    rank: index + 1,
    designId: item.design.id,
    totalScore: Math.round(item.finalScore),
    breakdown: item.design.score.scores,
    diversity: index === 0 ? 1 : calculateDiversity(item.design, rankedDesigns[0].design),
  }));
}

/**
 * Get top designs after ranking
 */
export function getTopDesigns(
  designs: ScoredDesign[],
  topN: number = 5
): ScoredDesign[] {
  const rankings = rankDesigns(designs, { topN });
  const topIds = new Set(rankings.map((r) => r.designId));

  return designs.filter((d) => topIds.has(d.id)).sort((a, b) => {
    const rankingA = rankings.find((r) => r.designId === a.id)?.rank || Infinity;
    const rankingB = rankings.find((r) => r.designId === b.id)?.rank || Infinity;
    return rankingA - rankingB;
  });
}

/**
 * Export ranking statistics for analytics
 */
export function getRankingStatistics(designs: ScoredDesign[]) {
  const rankings = rankDesigns(designs);

  return {
    totalDesigns: designs.length,
    topScore: rankings[0]?.totalScore || 0,
    avgScore: Math.round(rankings.reduce((sum, r) => sum + r.totalScore, 0) / rankings.length),
    scoreRange: {
      min: rankings[rankings.length - 1]?.totalScore || 0,
      max: rankings[0]?.totalScore || 0,
    },
    diversityMetric: rankings.reduce((sum, r) => sum + r.diversity, 0) / rankings.length,
  };
}
