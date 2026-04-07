/**
 * Multi-Model Image Generation Router
 * 
 * Orchestrates the complete pipeline:
 * 1. Classify prompt
 * 2. Select models
 * 3. Optimize cost
 * 4. Generate images in parallel
 * 5. Score and rank results
 * 6. Return best image + alternatives
 */

import { generateImageMock, NormalizedResponse, Provider } from './ProviderAbstraction';
import { classifyPrompt, getClassificationSummary, PromptClassification, extractDesignElements } from './PromptClassifier';
import { selectModels, optimizeCost, estimateTotalCost, BudgetTier } from './CostOptimizer';
import { pickBestImage, getTopImages, getScoringStatistics, ScoredImage } from './VotingSystem';

export interface SmartGenerationInput {
  prompt: string;
  budget?: BudgetTier;
  variants?: number;
  quality?: 'low' | 'medium' | 'high';
  seed?: number;
}

export interface SmartGenerationResult {
  bestImage: ScoredImage;
  topAlternatives: ScoredImage[];
  allResults: NormalizedResponse[];
  statistics: any;
  metadata: {
    prompt: string;
    classification: PromptClassification;
    modelsUsed: Provider[];
    totalCost: number;
    totalLatency: number;
    timestamp: string;
    designElements: string[];
  };
}

/**
 * Main smart generation pipeline
 */
export async function runSmartGeneration(
  input: SmartGenerationInput
): Promise<SmartGenerationResult> {
  const startTime = Date.now();
  const budget = input.budget || 'medium';
  const variants = input.variants || 2;
  const quality = input.quality || 'medium';

  console.log('[SmartGeneration] Starting pipeline...');
  console.log(`[SmartGeneration] Prompt: "${input.prompt}"`);
  console.log(`[SmartGeneration] Budget: ${budget} | Variants: ${variants} | Quality: ${quality}`);

  try {
    // Step 1: Classify prompt
    console.log('[SmartGeneration] Step 1: Classifying prompt...');
    const classification = classifyPrompt(input.prompt);
    console.log(`[SmartGeneration] Classification: ${getClassificationSummary(classification)}`);

    // Step 2: Select models
    console.log('[SmartGeneration] Step 2: Selecting models...');
    let models = selectModels(classification, budget);
    console.log(`[SmartGeneration] Initial model selection: ${models.join(', ')}`);

    // Step 3: Optimize cost
    console.log('[SmartGeneration] Step 3: Optimizing cost...');
    models = optimizeCost(models, budget);
    const estimatedCost = estimateTotalCost(models, variants);
    console.log(`[SmartGeneration] Final model selection: ${models.join(', ')}`);
    console.log(`[SmartGeneration] Estimated cost: $${estimatedCost.toFixed(4)}`);

    // Step 4: Generate with multiple models in parallel
    console.log('[SmartGeneration] Step 4: Generating images in parallel...');
    const generationPromises = models.map((provider) =>
      generateImageMock({
        prompt: input.prompt,
        provider,
        variants,
        quality,
        seed: input.seed,
      }).catch((error) => {
        console.error(`[SmartGeneration] Generation failed for ${provider}:`, error);
        // Return empty result on failure
        return {
          provider,
          images: [],
          latency: 0,
          costEstimate: 0,
          metadata: { model: 'failed', timestamp: new Date().toISOString() },
        };
      })
    );

    const allResults = await Promise.all(generationPromises);
    const totalLatency = Date.now() - startTime;

    console.log(`[SmartGeneration] Generated ${allResults.reduce((sum, r) => sum + r.images.length, 0)} total images`);
    console.log(`[SmartGeneration] Total latency: ${totalLatency}ms`);

    // Step 5: Score and rank
    console.log('[SmartGeneration] Step 5: Scoring and ranking images...');
    const bestImage = pickBestImage(allResults, input.prompt);
    const topAlternatives = getTopImages(allResults, 2, input.prompt);
    const statistics = getScoringStatistics(allResults, input.prompt);

    console.log('[SmartGeneration] Scoring complete');
    console.log(`[SmartGeneration] Best image score: ${bestImage.score.overallScore}`);

    // Step 6: Extract design elements
    const designElements = extractDesignElements(input.prompt);

    // Step 7: Prepare result
    const result: SmartGenerationResult = {
      bestImage,
      topAlternatives,
      allResults,
      statistics,
      metadata: {
        prompt: input.prompt,
        classification,
        modelsUsed: models,
        totalCost: estimatedCost,
        totalLatency,
        timestamp: new Date().toISOString(),
        designElements,
      },
    };

    console.log('[SmartGeneration] Pipeline complete ✓');
    return result;
  } catch (error) {
    console.error('[SmartGeneration] Pipeline failed:', error);
    throw error;
  }
}

/**
 * Alternative: Generate with specific provider (direct call)
 */
export async function generateWithProvider(
  prompt: string,
  provider: Provider,
  variants: number = 1
): Promise<NormalizedResponse> {
  return generateImageMock({
    prompt,
    provider,
    variants,
  });
}

/**
 * Get generation status/progress
 */
export interface GenerationProgress {
  stage: 'classifying' | 'selecting' | 'optimizing' | 'generating' | 'scoring' | 'complete';
  progress: number; // 0-100
  message: string;
}

export function getProgressUpdates(): GenerationProgress[] {
  return [
    { stage: 'classifying', progress: 10, message: 'Analyzing prompt...' },
    { stage: 'selecting', progress: 20, message: 'Selecting optimal models...' },
    { stage: 'optimizing', progress: 30, message: 'Optimizing cost and quality...' },
    { stage: 'generating', progress: 60, message: 'Generating images with multiple models...' },
    { stage: 'scoring', progress: 90, message: 'Evaluating and ranking results...' },
    { stage: 'complete', progress: 100, message: 'Complete!' },
  ];
}
