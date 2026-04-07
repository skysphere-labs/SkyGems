/**
 * Generation Traceability & Storage
 * 
 * Stores generation history for analytics and learning
 */

import { SmartGenerationResult } from './SmartRouter';
import { PromptClassification } from './PromptClassifier';

export interface GenerationRecord {
  id: string;
  prompt: string;
  classification: PromptClassification;
  modelsUsed: string[];
  selectedImageUrl: string;
  selectedImageScore: any;
  allImageScores: any[];
  statistics: any;
  estimatedCost: number;
  totalLatency: number;
  timestamp: string;
  userRating?: number; // 1-5 after user reviews
  feedback?: string;
}

/**
 * Store generation result in localStorage
 */
export function storeGenerationRecord(result: SmartGenerationResult): GenerationRecord {
  const record: GenerationRecord = {
    id: `gen-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    prompt: result.metadata.prompt,
    classification: result.metadata.classification,
    modelsUsed: result.metadata.modelsUsed,
    selectedImageUrl: result.bestImage.url,
    selectedImageScore: result.bestImage.score,
    allImageScores: result.topAlternatives.map((img) => ({
      provider: img.provider,
      score: img.score.overallScore,
    })),
    statistics: result.statistics,
    estimatedCost: result.metadata.totalCost,
    totalLatency: result.metadata.totalLatency,
    timestamp: result.metadata.timestamp,
  };

  try {
    // Get existing history
    const historyStr = localStorage.getItem('generationHistory') || '[]';
    const history: GenerationRecord[] = JSON.parse(historyStr);

    // Add new record
    history.push(record);

    // Keep only last 100 records
    const trimmed = history.slice(-100);

    // Save back
    localStorage.setItem('generationHistory', JSON.stringify(trimmed));

    console.log('[Storage] Generation record stored:', record.id);
  } catch (error) {
    console.error('[Storage] Failed to store generation record:', error);
  }

  return record;
}

/**
 * Retrieve generation history
 */
export function getGenerationHistory(limit: number = 20): GenerationRecord[] {
  try {
    const historyStr = localStorage.getItem('generationHistory') || '[]';
    const history: GenerationRecord[] = JSON.parse(historyStr);
    return history.slice(-limit).reverse(); // Most recent first
  } catch (error) {
    console.error('[Storage] Failed to retrieve generation history:', error);
    return [];
  }
}

/**
 * Update generation record with user feedback
 */
export function updateGenerationFeedback(
  recordId: string,
  rating: number,
  feedback?: string
): GenerationRecord | null {
  try {
    const historyStr = localStorage.getItem('generationHistory') || '[]';
    const history: GenerationRecord[] = JSON.parse(historyStr);

    const record = history.find((r) => r.id === recordId);
    if (!record) return null;

    record.userRating = Math.min(5, Math.max(1, rating));
    record.feedback = feedback;

    localStorage.setItem('generationHistory', JSON.stringify(history));
    console.log('[Storage] Feedback updated for record:', recordId);

    return record;
  } catch (error) {
    console.error('[Storage] Failed to update feedback:', error);
    return null;
  }
}

/**
 * Get analytics from generation history
 */
export function getGenerationAnalytics() {
  try {
    const history = getGenerationHistory(100);

    if (history.length === 0) {
      return null;
    }

    // Calculate stats
    const totalGenerations = history.length;
    const avgLatency = Math.round(
      history.reduce((sum, r) => sum + r.totalLatency, 0) / totalGenerations
    );
    const totalCost = Math.round(history.reduce((sum, r) => sum + r.estimatedCost, 0) * 100) / 100;

    // Model usage
    const modelUsage: Record<string, number> = {};
    history.forEach((r) => {
      r.modelsUsed.forEach((model) => {
        modelUsage[model] = (modelUsage[model] || 0) + 1;
      });
    });

    // Classification distribution
    const classificationDist: Record<string, number> = {};
    history.forEach((r) => {
      const type = r.classification.type;
      classificationDist[type] = (classificationDist[type] || 0) + 1;
    });

    // Average scores
    const avgScores = history.reduce(
      (sum, r) => ({
        clarity: sum.clarity + r.selectedImageScore.clarity,
        designQuality: sum.designQuality + r.selectedImageScore.designQuality,
        promptMatch: sum.promptMatch + r.selectedImageScore.promptMatch,
        uniqueness: sum.uniqueness + r.selectedImageScore.uniqueness,
        overall: sum.overall + r.selectedImageScore.overallScore,
      }),
      { clarity: 0, designQuality: 0, promptMatch: 0, uniqueness: 0, overall: 0 }
    );

    Object.keys(avgScores).forEach((key) => {
      avgScores[key as keyof typeof avgScores] = Math.round(
        (avgScores[key as keyof typeof avgScores] / totalGenerations) * 100
      ) / 100;
    });

    // User ratings
    const ratedGenerations = history.filter((r) => r.userRating);
    const avgRating =
      ratedGenerations.length > 0
        ? Math.round((ratedGenerations.reduce((sum, r) => sum + (r.userRating || 0), 0) / ratedGenerations.length) * 100) / 100
        : null;

    return {
      totalGenerations,
      averageLatency: avgLatency,
      totalCost,
      modelUsage,
      classificationDistribution: classificationDist,
      averageScores: avgScores,
      userRatings: {
        count: ratedGenerations.length,
        average: avgRating,
      },
    };
  } catch (error) {
    console.error('[Storage] Failed to generate analytics:', error);
    return null;
  }
}

/**
 * Clear generation history
 */
export function clearGenerationHistory(): void {
  try {
    localStorage.removeItem('generationHistory');
    console.log('[Storage] Generation history cleared');
  } catch (error) {
    console.error('[Storage] Failed to clear history:', error);
  }
}

/**
 * Export generation history as JSON
 */
export function exportGenerationHistory(): string {
  const history = getGenerationHistory(100);
  return JSON.stringify(history, null, 2);
}
