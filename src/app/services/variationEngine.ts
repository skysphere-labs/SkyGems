/**
 * Variation Engine Service
 *
 * This service injects structured randomness into jewelry design prompts
 * to ensure unique and diverse design generations. It manages multiple
 * variation categories and provides random combinations for each design.
 *
 * Why this exists:
 * - Prevents the same boring designs from being generated
 * - Ensures structural diversity across generations
 * - Allows future expansion with new variation types
 */

import { distributeViews } from '@skygems/shared';

export interface VariationConfig {
  bandStyle: string[];
  settingType: string[];
  stonePosition: string[];
  profile: string[];
  motif: string[];
}

export interface SelectedVariations {
  bandStyle: string;
  settingType: string;
  stonePosition: string;
  profile: string;
  motif: string;
  viewId?: string;
}

/**
 * Default variation configuration for jewelry designs
 * These can be extended or customized per jewelry type
 */
const DEFAULT_VARIATION_CONFIG: VariationConfig = {
  bandStyle: [
    'split band',
    'twisted band',
    'bypass ring',
    'tapered band',
    'braided band',
    'hammered band',
    'sculptural band',
    'asymmetric band',
  ],
  settingType: [
    'prong setting',
    'bezel setting',
    'tension setting',
    'flush setting',
    'halo setting',
    'cathedral setting',
    'three-stone setting',
    'solitaire setting',
  ],
  stonePosition: [
    'centered',
    'offset to left',
    'offset to right',
    'diagonal',
    'clustered',
    'scattered',
    'graduated',
    'asymmetric placement',
  ],
  profile: [
    'low profile',
    'raised setting',
    'vintage profile',
    'modern flat profile',
    'curved profile',
    'angular profile',
    'minimalist profile',
    'statement profile',
  ],
  motif: [
    'wave pattern',
    'geometric precision',
    'organic flow',
    'minimalist lines',
    'nature-inspired details',
    'art deco influence',
    'modern abstraction',
    'floral elements',
  ],
};

/**
 * Type-specific variation configurations
 * Customize variations based on jewelry type
 */
const TYPE_SPECIFIC_CONFIGS: Record<string, Partial<VariationConfig>> = {
  ring: {
    bandStyle: [
      'split band',
      'twisted band',
      'bypass ring',
      'tapered band',
      'braided band',
      'hammered band',
      'sculptural band',
      'asymmetric band',
    ],
  },
  necklace: {
    bandStyle: [
      'chain link',
      'pendant drop',
      'collar style',
      'lariat style',
      'Y-necklace',
      'layered strands',
      'geometric chain',
      'sculptural pendant',
    ],
  },
  earrings: {
    bandStyle: [
      'stud earring',
      'drop earring',
      'hoop earring',
      'chandelier earring',
      'huggie earring',
      'threader earring',
      'asymmetric pair',
      'sculptural earring',
    ],
  },
  bracelet: {
    bandStyle: [
      'bangle style',
      'tennis bracelet',
      'charm bracelet',
      'cuff bracelet',
      'wrap bracelet',
      'link bracelet',
      'beaded bracelet',
      'sculptural bracelet',
    ],
  },
  pendant: {
    bandStyle: [
      'geometric pendant',
      'organic pendant',
      'minimalist pendant',
      'statement pendant',
      'sculptural pendant',
      'vintage-inspired pendant',
      'abstract pendant',
      'nature-inspired pendant',
    ],
  },
};

/**
 * Get random element from array
 */
function getRandomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

/**
 * Get variation configuration for a specific jewelry type
 * Merges type-specific overrides with defaults
 */
function getConfigForType(jewelryType: string): VariationConfig {
  const typeConfig = TYPE_SPECIFIC_CONFIGS[jewelryType.toLowerCase()] || {};
  return {
    ...DEFAULT_VARIATION_CONFIG,
    ...typeConfig,
  };
}

/**
 * Generate random variations for a jewelry design
 * Each call produces a unique combination
 */
export function generateVariations(jewelryType: string): SelectedVariations {
  const config = getConfigForType(jewelryType);

  return {
    bandStyle: getRandomElement(config.bandStyle),
    settingType: getRandomElement(config.settingType),
    stonePosition: getRandomElement(config.stonePosition),
    profile: getRandomElement(config.profile),
    motif: getRandomElement(config.motif),
  };
}

/**
 * Generate multiple unique variation sets with distributed views.
 * Each concept in a batch gets a different camera angle from the
 * VIEW_CATALOG so the designer sees every important perspective.
 */
export function generateMultipleVariations(
  jewelryType: string,
  count: number
): SelectedVariations[] {
  const views = distributeViews(jewelryType, count);
  return Array.from({ length: count }, (_, i) => ({
    ...generateVariations(jewelryType),
    viewId: views[i]?.id,
  }));
}

/**
 * Format variations into human-readable bullet points
 * Used in prompt generation
 */
export function formatVariationsForPrompt(variations: SelectedVariations): string[] {
  return [
    `${variations.bandStyle} design`,
    `${variations.settingType} for secure hold`,
    `${variations.stonePosition} stone positioning`,
    `${variations.profile} aesthetic`,
    `${variations.motif} throughout design`,
  ];
}

/**
 * Get all available variation options for a type
 * Useful for documentation or UI display
 */
export function getAvailableVariations(jewelryType: string): VariationConfig {
  return getConfigForType(jewelryType);
}

/**
 * Check if a variation value is valid
 */
export function isValidVariation(
  jewelryType: string,
  category: keyof VariationConfig,
  value: string
): boolean {
  const config = getConfigForType(jewelryType);
  return config[category].includes(value);
}

/**
 * Merge custom variations with generated ones
 * Allows user to override specific aspects
 */
export function mergeVariations(
  generated: SelectedVariations,
  overrides: Partial<SelectedVariations>
): SelectedVariations {
  return {
    ...generated,
    ...overrides,
  };
}
