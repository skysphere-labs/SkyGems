/**
 * Prompt Optimizer Service
 * 
 * This service enhances prompts with quality boosters, material-specific
 * details, and rendering guidelines to ensure better image generation quality.
 * 
 * Optimization includes:
 * - Quality enhancements
 * - Material-specific realism
 * - Gemstone sparkle details
 * - Clean output specifications
 * - Rendering style guidelines
 */

interface OptimizationConfig {
  includeQualityBoost: boolean;
  includeMaterialRealism: boolean;
  includeGemstoneRealism: boolean;
  includeRenderingStyle: boolean;
  includeCleanOutput: boolean;
}

const DEFAULT_CONFIG: OptimizationConfig = {
  includeQualityBoost: true,
  includeMaterialRealism: true,
  includeGemstoneRealism: true,
  includeRenderingStyle: true,
  includeCleanOutput: true,
};

/**
 * Quality boost section
 * Emphasizes professional rendering standards
 */
function getQualityBoost(): string {
  return 'High detail, high resolution, professional jewellery rendering, clean design sheet, precise craftsmanship, polished finish.';
}

/**
 * Metal-specific realism details
 */
function getMaterialRealism(metal: string): string {
  const metalDetails: Record<string, string> = {
    gold: 'Realistic gold reflections, warm metallic highlights, lustrous surface, authentic gold patina',
    silver: 'Realistic silver reflections, cool metallic highlights, mirror-like finish, pristine silver appearance',
    platinum: 'Realistic platinum reflections, cool bright highlights, premium metallic sheen, sophisticated platinum finish',
    'rose-gold': 'Realistic rose-gold reflections, warm pinkish metallic highlights, romantic glow, sophisticated finish',
    default: 'Realistic metal reflections, authentic metallic highlights, professional finish',
  };

  return metalDetails[metal.toLowerCase()] || metalDetails.default;
}

/**
 * Gemstone-specific realism details
 */
function getGemstoneRealism(gemstones: string[]): string {
  if (gemstones.length === 0) {
    return 'Elegant metalwork, architectural focus, sculptural design.';
  }

  const gemDetails: Record<string, string> = {
    diamond: 'Realistic diamond sparkle, light refraction, brilliant fire, perfectly cut facets',
    ruby: 'Deep red brilliance, authentic ruby sparkle, light refraction, precious gem glow',
    emerald: 'Rich green transparency, authentic emerald sparkle, light refraction, precious gem appearance',
    sapphire: 'Deep blue brilliance, authentic sapphire sparkle, light refraction, precious gem glow',
    pearl: 'Lustrous pearl surface, authentic mother-of-pearl sheen, gentle highlights, iridescent quality',
  };

  const details = gemstones
    .map((gem) => gemDetails[gem.toLowerCase()] || 'Realistic gemstone sparkle, light refraction')
    .join(', ');

  return details;
}

/**
 * Rendering style guidelines
 */
function getRenderingStyle(): string {
  return 'Hand-sketched concept art, fine pencil outlines with soft shading, light color rendering, minimal shadows, clean professional jewellery design sheet presentation.';
}

/**
 * Clean output specifications
 */
function getCleanOutput(): string {
  return 'White background, no clutter, no text, no watermark, professional product photography style, isolated design, clear visibility of details.';
}

/**
 * Apply all optimizations to a prompt
 */
function applyOptimizations(
  basePrompt: string,
  metal: string,
  gemstones: string[],
  config: OptimizationConfig = DEFAULT_CONFIG
): string {
  const sections: string[] = [basePrompt];

  if (config.includeQualityBoost) {
    sections.push(`Quality Requirements: ${getQualityBoost()}`);
  }

  if (config.includeMaterialRealism) {
    sections.push(`Material Realism: ${getMaterialRealism(metal)}`);
  }

  if (config.includeGemstoneRealism) {
    sections.push(`Gemstone Details: ${getGemstoneRealism(gemstones)}`);
  }

  if (config.includeRenderingStyle) {
    sections.push(`Rendering Style: ${getRenderingStyle()}`);
  }

  if (config.includeCleanOutput) {
    sections.push(`Output Specifications: ${getCleanOutput()}`);
  }

  return sections.join('\n\n');
}

/**
 * Add duplicate prevention instruction
 */
function addDuplicatePrevention(): string {
  return 'Each design must be significantly different in structure, silhouette, and gemstone placement. Avoid repeating common or standard jewellery styles. Create unique variations.';
}

/**
 * Add inspiration/guidance
 */
function addCreativeGuidance(style: string): string {
  const styleGuidance: Record<string, string> = {
    contemporary:
      'Modern, forward-thinking design with artistic flair. Break traditional rules while maintaining elegance.',
    minimalist:
      'Focus on essential elements only. Every line and curve must have purpose. Clean and refined.',
    vintage:
      'Nostalgic elegance with period-appropriate details. Ornate but not overwhelming. Classic charm.',
    temple:
      'Traditional motifs and patterns with cultural significance. Intricate details honoring heritage.',
    floral: 'Natural forms and organic curves. Botanical inspiration throughout. Living, breathing design.',
    geometric:
      'Mathematical precision and symmetry. Clean angles and structured forms. Modern precision.',
  };

  return styleGuidance[style.toLowerCase()] || 'Create a unique and compelling design.';
}

/**
 * Build optimized prompt with all enhancements
 */
export function buildOptimizedPrompt(
  basePrompt: string,
  metal: string,
  gemstones: string[],
  style: string,
  config?: Partial<OptimizationConfig>
): string {
  const mergedConfig = { ...DEFAULT_CONFIG, ...config };

  // Start with base prompt
  let optimized = applyOptimizations(basePrompt, metal, gemstones, mergedConfig);

  // Add duplicate prevention
  optimized += `\n\nDuplicate Prevention: ${addDuplicatePrevention()}`;

  // Add creative guidance
  optimized += `\n\nCreative Guidance: ${addCreativeGuidance(style)}`;

  return optimized;
}

/**
 * Get specific material boost
 */
export function getMaterialBoost(metal: string): string {
  return getMaterialRealism(metal);
}

/**
 * Get specific gemstone boost
 */
export function getGemstoneBoost(gemstones: string[]): string {
  return getGemstoneRealism(gemstones);
}

/**
 * Get quality recommendations
 */
export function getQualityRecommendations(): string {
  return getQualityBoost();
}

/**
 * Get rendering instructions
 */
export function getRenderingInstructions(): string {
  return getRenderingStyle();
}

/**
 * Get output cleanup instructions
 */
export function getOutputCleanup(): string {
  return getCleanOutput();
}

/**
 * Create a full enhancement section to append to prompts
 */
export function createEnhancementSection(
  metal: string,
  gemstones: string[],
  style: string
): string {
  return `
---QUALITY & RENDERING ENHANCEMENTS---

Quality: ${getQualityBoost()}

Materials: ${getMaterialRealism(metal)}

Gemstones: ${getGemstoneRealism(gemstones)}

Style: ${getRenderingStyle()}

Output: ${getCleanOutput()}

Uniqueness: ${addDuplicatePrevention()}

Inspiration: ${addCreativeGuidance(style)}
`;
}

/**
 * Validate and sanitize prompts
 */
export function sanitizePrompt(prompt: string): string {
  return prompt
    .trim()
    .replace(/\s+/g, ' ') // Remove extra whitespace
    .replace(/["']/g, '"'); // Normalize quotes
}

/**
 * Get estimated generation quality score
 * Based on prompt completeness
 */
export function getPromptQualityScore(prompt: string): {
  score: number;
  level: 'poor' | 'fair' | 'good' | 'excellent';
  feedback: string[];
} {
  const feedback: string[] = [];
  let score = 50; // Base score

  const checks = [
    {
      keyword: ['sketch', 'design', 'concept'],
      score: 10,
      msg: 'Good: Includes design/concept keywords',
    },
    {
      keyword: ['professional', 'quality', 'high resolution'],
      score: 10,
      msg: 'Good: Includes quality requirements',
    },
    {
      keyword: ['realistic', 'reflection', 'sparkle'],
      score: 10,
      msg: 'Good: Includes realism details',
    },
    {
      keyword: ['white background', 'clean'],
      score: 10,
      msg: 'Good: Includes output specifications',
    },
    {
      keyword: ['unique', 'different', 'variations'],
      score: 10,
      msg: 'Good: Emphasizes uniqueness',
    },
  ];

  const lowerPrompt = prompt.toLowerCase();
  for (const check of checks) {
    if (check.keyword.some((kw) => lowerPrompt.includes(kw))) {
      score += check.score;
      feedback.push(check.msg);
    }
  }

  // Check for potential issues
  if (prompt.length < 100) {
    score -= 10;
    feedback.push('Improvement: Prompt could be more detailed');
  }
  if (prompt.length > 2000) {
    score -= 5;
    feedback.push('Improvement: Prompt might be too long');
  }
  if (lowerPrompt.includes('no') && lowerPrompt.includes('not')) {
    score -= 5;
    feedback.push('Improvement: Reduce negative instructions, focus on what you want');
  }

  score = Math.min(100, Math.max(0, score));

  let level: 'poor' | 'fair' | 'good' | 'excellent';
  if (score < 40) level = 'poor';
  else if (score < 60) level = 'fair';
  else if (score < 80) level = 'good';
  else level = 'excellent';

  return { score, level, feedback };
}
