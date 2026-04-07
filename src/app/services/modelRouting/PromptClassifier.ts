/**
 * Prompt Classification Engine
 * 
 * Analyzes prompts and classifies them into intent categories
 * Used to determine optimal model selection
 */

export type PromptType = 'sketch' | 'realistic' | 'editorial' | 'technical';
export type Complexity = 'low' | 'medium' | 'high';
export type Creativity = 'low' | 'medium' | 'high';

export interface PromptClassification {
  type: PromptType;
  complexity: Complexity;
  creativity: Creativity;
  needsPrecision: boolean;
  confidence: number; // 0-1
}

/**
 * Keyword matching for classification
 */
const keywordMap = {
  sketch: ['hand-drawn', 'sketch', 'pencil', 'drawing', 'line art', 'outline'],
  realistic: [
    'photorealistic',
    'macro',
    'luxury',
    'professional',
    'high-end',
    'detailed',
    'precise',
  ],
  editorial: ['editorial', 'fashion', 'magazine', 'style', 'aesthetic', 'artistic'],
  technical: ['technical', 'cad', 'blueprint', 'schematic', 'engineering', 'dimension'],
  high_complexity: [
    'intricate',
    'elaborate',
    'complex',
    'ornate',
    'detailed',
    'filigree',
    'layered',
  ],
  high_creativity: [
    'creative',
    'artistic',
    'imaginative',
    'surreal',
    'abstract',
    'experimental',
    'unique',
  ],
  precision: [
    'precision',
    'accurate',
    'exact',
    'precise',
    'technical',
    'blueprint',
    'specification',
  ],
};

/**
 * Classify a prompt into intent categories
 */
export function classifyPrompt(prompt: string): PromptClassification {
  const lowerPrompt = prompt.toLowerCase();

  // Determine type
  let type: PromptType = 'realistic'; // default
  let typeConfidence = 0;

  if (keywordMap.sketch.some((kw) => lowerPrompt.includes(kw))) {
    type = 'sketch';
    typeConfidence = 0.9;
  } else if (keywordMap.technical.some((kw) => lowerPrompt.includes(kw))) {
    type = 'technical';
    typeConfidence = 0.9;
  } else if (keywordMap.editorial.some((kw) => lowerPrompt.includes(kw))) {
    type = 'editorial';
    typeConfidence = 0.85;
  } else if (keywordMap.realistic.some((kw) => lowerPrompt.includes(kw))) {
    type = 'realistic';
    typeConfidence = 0.8;
  } else {
    typeConfidence = 0.5; // Low confidence default
  }

  // Determine complexity
  let complexity: Complexity = 'medium'; // default
  if (keywordMap.high_complexity.some((kw) => lowerPrompt.includes(kw))) {
    complexity = 'high';
  } else if (
    prompt.length > 200 ||
    (prompt.match(/,/g) || []).length > 5
  ) {
    complexity = 'high';
  } else if (prompt.length < 50) {
    complexity = 'low';
  }

  // Determine creativity
  let creativity: Creativity = 'medium'; // default
  if (keywordMap.high_creativity.some((kw) => lowerPrompt.includes(kw))) {
    creativity = 'high';
  } else if (lowerPrompt.includes('simple') || lowerPrompt.includes('basic')) {
    creativity = 'low';
  }

  // Determine if precision is needed
  const needsPrecision =
    type === 'technical' ||
    type === 'realistic' ||
    keywordMap.precision.some((kw) => lowerPrompt.includes(kw));

  return {
    type,
    complexity,
    creativity,
    needsPrecision,
    confidence: Math.max(typeConfidence, 0.5),
  };
}

/**
 * Extract key design elements from prompt
 */
export function extractDesignElements(prompt: string): string[] {
  const elements: string[] = [];

  // Look for common jewelry design terms
  const jewelryTerms = [
    'ring',
    'necklace',
    'earrings',
    'bracelet',
    'pendant',
    'brooch',
    'diamond',
    'emerald',
    'ruby',
    'sapphire',
    'pearl',
    'gold',
    'silver',
    'platinum',
    'rose gold',
  ];

  jewelryTerms.forEach((term) => {
    if (prompt.toLowerCase().includes(term)) {
      elements.push(term);
    }
  });

  return elements;
}

/**
 * Get classification summary for logging
 */
export function getClassificationSummary(classification: PromptClassification): string {
  return `Type: ${classification.type} | Complexity: ${classification.complexity} | Creativity: ${classification.creativity} | Precision: ${classification.needsPrecision} | Confidence: ${Math.round(classification.confidence * 100)}%`;
}
