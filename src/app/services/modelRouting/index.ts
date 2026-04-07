/**
 * Multi-Model Image Generation System
 * 
 * Public API for the intelligent multi-model routing system
 */

// Core Provider
export { generateImage, generateImageMock } from './ProviderAbstraction';
export type { Provider, GenerateImageInput, NormalizedResponse } from './ProviderAbstraction';

// Prompt Classification
export { classifyPrompt, extractDesignElements, getClassificationSummary } from './PromptClassifier';
export type { PromptClassification, PromptType, Complexity, Creativity } from './PromptClassifier';

// Cost Optimization
export {
  selectModels,
  optimizeCost,
  estimateTotalCost,
  isCostWithinBudget,
  getModelRecommendations,
  scoreModelSelection,
} from './CostOptimizer';
export type { BudgetTier, BudgetConfig } from './CostOptimizer';

// Voting & Scoring
export {
  scoreImage,
  scoreAllImages,
  pickBestImage,
  getTopImages,
  getScoringStatistics,
  computeWeightedScore,
} from './VotingSystem';
export type { ImageScore, ScoredImage } from './VotingSystem';

// Smart Router
export { runSmartGeneration, generateWithProvider, getProgressUpdates } from './SmartRouter';
export type { SmartGenerationInput, SmartGenerationResult, GenerationProgress } from './SmartRouter';

// Storage & Analytics
export {
  storeGenerationRecord,
  getGenerationHistory,
  updateGenerationFeedback,
  getGenerationAnalytics,
  clearGenerationHistory,
  exportGenerationHistory,
} from './Storage';
export type { GenerationRecord } from './Storage';
