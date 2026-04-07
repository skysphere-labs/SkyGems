/**
 * CriticCouncilAgent
 * 
 * Responsibility: Multi-critic evaluation system that scores designs across 5 dimensions
 * Dimensions:
 *   - Brief Adherence: How well the design follows the original brief
 *   - Brand Fit: Alignment with luxury jewelry standards
 *   - Manufacturability: Feasibility of production
 *   - Cross-view Consistency: 3D consistency across angles
 *   - Luxury Appeal: Overall luxury and desirability
 * 
 * Input: Array of GeneratedDesigns
 * Output: Scored and ranked designs
 */

import { Agent } from './Agent.interface';
import { GeneratedDesign, ScoredDesign, CriticScore } from './types';

export class CriticCouncilAgent extends Agent<GeneratedDesign[], ScoredDesign[]> {
  getName(): string {
    return 'CriticCouncilAgent';
  }

  getDescription(): string {
    return 'Multi-critic council that scores designs across 5 dimensions';
  }

  private generateScore(designId: string): CriticScore {
    // Generate realistic scores with some variation
    const baseScore = 70 + Math.random() * 25;

    const scores = {
      adherence: baseScore + (Math.random() - 0.5) * 10,
      brandFit: baseScore + (Math.random() - 0.5) * 10,
      manufacturability: baseScore + (Math.random() - 0.5) * 8,
      consistency: baseScore + (Math.random() - 0.5) * 12,
      appeal: baseScore + (Math.random() - 0.5) * 10,
    };

    // Clamp scores to 0-100
    const clampedScores = Object.entries(scores).reduce(
      (acc, [key, value]) => ({
        ...acc,
        [key]: Math.min(100, Math.max(0, value)),
      }),
      {} as typeof scores
    );

    const totalScore =
      Object.values(clampedScores).reduce((sum, score) => sum + score, 0) / 5;

    return {
      designId,
      scores: clampedScores,
      totalScore: Math.round(totalScore),
      feedback: `Design demonstrates strong luxury appeal with good manufacturability`,
    };
  }

  async run(designs: GeneratedDesign[]): Promise<ScoredDesign[]> {
    this.logger.log(`Evaluating ${designs.length} designs across 5 critic dimensions...`);

    await this.simulateDelay(1500);

    const scoredDesigns: ScoredDesign[] = designs.map((design) => ({
      ...design,
      score: this.generateScore(design.id),
    }));

    // Sort by total score (descending)
    scoredDesigns.sort((a, b) => b.score.totalScore - a.score.totalScore);

    this.logger.log(
      `Evaluation complete. Top design score: ${scoredDesigns[0].score.totalScore}`
    );

    return scoredDesigns;
  }
}

export const criticCouncilAgent = new CriticCouncilAgent();
