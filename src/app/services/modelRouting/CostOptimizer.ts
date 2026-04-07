/**
 * Cost Optimizer
 * 
 * Determines which models to use based on budget constraints
 * Balances cost vs quality
 */

import { Provider } from './ProviderAbstraction';
import { PromptClassification } from './PromptClassifier';

export type BudgetTier = 'low' | 'medium' | 'high';

export interface BudgetConfig {
  tier: BudgetTier;
  maxCost: number; // USD
  maxLatency: number; // ms
}

export const budgetTiers: Record<BudgetTier, BudgetConfig> = {
  low: { tier: 'low', maxCost: 0.01, maxLatency: 3000 },
  medium: { tier: 'medium', maxCost: 0.05, maxLatency: 5000 },
  high: { tier: 'high', maxCost: 0.20, maxLatency: 10000 },
};

/**
 * Model characteristics
 */
const modelCosts: Record<Provider, number> = {
  openai: 0.04, // DALL-E 3
  stability: 0.03, // Stable Diffusion XL
  flux: 0.05, // Flux (when available)
  ideogram: 0.02, // Ideogram (when available)
};

const modelQuality: Record<Provider, number> = {
  openai: 0.95, // Highest quality
  stability: 0.85, // Good quality
  flux: 0.9, // Very good quality
  ideogram: 0.8, // Good quality
};

const modelSpeed: Record<Provider, number> = {
  openai: 0.7, // Slower
  stability: 0.9, // Faster
  flux: 0.8, // Medium speed
  ideogram: 0.95, // Very fast
};

/**
 * Select models based on classification and budget
 */
export function selectModels(
  classification: PromptClassification,
  budget: BudgetTier = 'medium'
): Provider[] {
  const selectedModels: Provider[] = [];

  switch (classification.type) {
    case 'sketch':
      // Sketches benefit from multiple perspectives
      selectedModels.push('openai', 'stability');
      break;

    case 'realistic':
      // Realistic renders need high quality
      selectedModels.push('openai');
      break;

    case 'technical':
      // Technical drawings need precision
      selectedModels.push('stability');
      break;

    case 'editorial':
      // Editorial work benefits from creativity
      selectedModels.push('openai', 'stability');
      break;

    default:
      selectedModels.push('openai');
  }

  // Apply budget optimization
  return optimizeCost(selectedModels, budget);
}

/**
 * Optimize model selection based on budget
 */
export function optimizeCost(models: Provider[], budget: BudgetTier): Provider[] {
  const budgetConfig = budgetTiers[budget];

  if (budget === 'low') {
    // Low budget: use fastest/cheapest
    return ['stability'];
  }

  if (budget === 'medium') {
    // Medium budget: keep selection as-is
    return models;
  }

  if (budget === 'high') {
    // High budget: use all models for best quality
    return ['openai', 'stability'];
  }

  return models;
}

/**
 * Calculate total estimated cost
 */
export function estimateTotalCost(models: Provider[], variants: number = 1): number {
  return models.reduce((sum, model) => sum + (modelCosts[model] || 0) * variants, 0);
}

/**
 * Check if cost is within budget
 */
export function isCostWithinBudget(models: Provider[], variants: number, budget: BudgetTier): boolean {
  const totalCost = estimateTotalCost(models, variants);
  const maxCost = budgetTiers[budget].maxCost;
  return totalCost <= maxCost;
}

/**
 * Get model recommendations for prompt
 */
export function getModelRecommendations(
  classification: PromptClassification,
  budget: BudgetTier = 'medium'
): {
  primary: Provider;
  secondary: Provider | null;
  reason: string;
} {
  const models = selectModels(classification, budget);

  return {
    primary: models[0] || 'openai',
    secondary: models[1] || null,
    reason: `Selected for ${classification.type} content with ${classification.complexity} complexity under ${budget} budget`,
  };
}

/**
 * Calculate quality score for model selection
 */
export function scoreModelSelection(models: Provider[]): number {
  if (models.length === 0) return 0;

  const avgQuality = models.reduce((sum, model) => sum + (modelQuality[model] || 0), 0) / models.length;
  const avgSpeed = models.reduce((sum, model) => sum + (modelSpeed[model] || 0), 0) / models.length;

  // Quality-speed balance (60% quality, 40% speed)
  return avgQuality * 0.6 + avgSpeed * 0.4;
}
