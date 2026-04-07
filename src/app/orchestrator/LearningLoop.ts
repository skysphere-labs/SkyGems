/**
 * User Taste Learning Loop
 * 
 * Tracks user preferences and personalizes future design generations
 * Updates based on likes, skips, and interaction patterns
 */

export interface UserProfile {
  userId: string;
  preferredStyles: Record<string, number>; // style → weight (0-1)
  preferredMetals: Record<string, number>; // metal → weight
  preferredGemstones: Record<string, number>; // gemstone → weight
  complexityPreference: {
    simple: number;
    moderate: number;
    complex: number;
  };
  designPatterns: {
    geometric: number;
    organic: number;
    symmetrical: number;
    asymmetrical: number;
  };
  likedDesignCount: number;
  skippedDesignCount: number;
  lastUpdated: string;
}

export interface DesignFeatures {
  shape: 'geometric' | 'organic';
  bandStyle: string;
  gemstoneCount: number;
  gemstoneType: string;
  symmetry: 'symmetrical' | 'asymmetrical';
  detailDensity: 'sparse' | 'moderate' | 'dense';
}

export interface UserInteraction {
  designId: string;
  action: 'like' | 'skip' | 'view' | 'export';
  timestamp: string;
  timeSpent: number; // ms
  features?: DesignFeatures;
}

/**
 * Initialize a new user profile
 */
export function createUserProfile(userId: string): UserProfile {
  return {
    userId,
    preferredStyles: {},
    preferredMetals: {},
    preferredGemstones: {},
    complexityPreference: {
      simple: 0.33,
      moderate: 0.33,
      complex: 0.34,
    },
    designPatterns: {
      geometric: 0.5,
      organic: 0.5,
      symmetrical: 0.5,
      asymmetrical: 0.5,
    },
    likedDesignCount: 0,
    skippedDesignCount: 0,
    lastUpdated: new Date().toISOString(),
  };
}

/**
 * Load user profile from localStorage
 */
export function loadUserProfile(userId: string): UserProfile {
  try {
    const stored = localStorage.getItem(`userProfile:${userId}`);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Error loading user profile:', error);
  }
  return createUserProfile(userId);
}

/**
 * Save user profile to localStorage
 */
export function saveUserProfile(profile: UserProfile): void {
  try {
    localStorage.setItem(`userProfile:${profile.userId}`, JSON.stringify(profile));
  } catch (error) {
    console.error('Error saving user profile:', error);
  }
}

/**
 * Update user profile based on interaction
 */
export function updateUserProfile(
  profile: UserProfile,
  interaction: UserInteraction,
  metadata: {
    style?: string;
    metal?: string;
    gemstones?: string[];
    complexity?: 'simple' | 'moderate' | 'complex';
  } = {}
): UserProfile {
  const updated = { ...profile };

  if (interaction.action === 'like') {
    updated.likedDesignCount += 1;

    // Update style preference
    if (metadata.style) {
      updated.preferredStyles[metadata.style] = (updated.preferredStyles[metadata.style] || 0) + 0.1;
    }

    // Update metal preference
    if (metadata.metal) {
      updated.preferredMetals[metadata.metal] = (updated.preferredMetals[metadata.metal] || 0) + 0.1;
    }

    // Update gemstone preferences
    if (metadata.gemstones) {
      metadata.gemstones.forEach((gem) => {
        updated.preferredGemstones[gem] = (updated.preferredGemstones[gem] || 0) + 0.05;
      });
    }

    // Update complexity preference
    if (metadata.complexity) {
      updated.complexityPreference[metadata.complexity] += 0.05;
    }

    // Update design patterns if features provided
    if (interaction.features) {
      updated.designPatterns[interaction.features.shape] += 0.1;
      updated.designPatterns[interaction.features.symmetry] += 0.05;
    }
  } else if (interaction.action === 'skip') {
    updated.skippedDesignCount += 1;
    // Subtle negative weight (don't heavily penalize)
    if (metadata.style) {
      updated.preferredStyles[metadata.style] = Math.max(
        0,
        (updated.preferredStyles[metadata.style] || 0) - 0.02
      );
    }
  }

  // Normalize weights to 0-1 range
  normalizeProfileWeights(updated);

  updated.lastUpdated = new Date().toISOString();
  return updated;
}

/**
 * Normalize all preference weights to 0-1 range
 */
function normalizeProfileWeights(profile: UserProfile): void {
  // Normalize styles
  const styleValues = Object.values(profile.preferredStyles);
  const maxStyle = Math.max(...styleValues, 1);
  Object.keys(profile.preferredStyles).forEach((key) => {
    profile.preferredStyles[key] = Math.min(1, profile.preferredStyles[key] / maxStyle);
  });

  // Normalize metals
  const metalValues = Object.values(profile.preferredMetals);
  const maxMetal = Math.max(...metalValues, 1);
  Object.keys(profile.preferredMetals).forEach((key) => {
    profile.preferredMetals[key] = Math.min(1, profile.preferredMetals[key] / maxMetal);
  });

  // Normalize gemstones
  const gemValues = Object.values(profile.preferredGemstones);
  const maxGem = Math.max(...gemValues, 1);
  Object.keys(profile.preferredGemstones).forEach((key) => {
    profile.preferredGemstones[key] = Math.min(1, profile.preferredGemstones[key] / maxGem);
  });

  // Normalize complexity
  const complexitySum = Object.values(profile.complexityPreference).reduce((a, b) => a + b, 0);
  Object.keys(profile.complexityPreference).forEach((key) => {
    profile.complexityPreference[key as keyof typeof profile.complexityPreference] /= complexitySum;
  });

  // Normalize design patterns
  const patternSum = Object.values(profile.designPatterns).reduce((a, b) => a + b, 0);
  Object.keys(profile.designPatterns).forEach((key) => {
    profile.designPatterns[key as keyof typeof profile.designPatterns] /= patternSum;
  });
}

/**
 * Get top preferences for influence on next generation
 */
export function getTopPreferences(profile: UserProfile) {
  const topStyles = Object.entries(profile.preferredStyles)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map((e) => e[0]);

  const topMetals = Object.entries(profile.preferredMetals)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2)
    .map((e) => e[0]);

  const topGemstones = Object.entries(profile.preferredGemstones)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map((e) => e[0]);

  // Get dominant complexity
  const complexityEntries = Object.entries(profile.complexityPreference);
  const dominantComplexity = complexityEntries.sort((a, b) => b[1] - a[1])[0][0];

  // Get dominant design pattern
  const patternEntries = Object.entries(profile.designPatterns);
  const dominantPattern = patternEntries.sort((a, b) => b[1] - a[1])[0][0];

  return {
    topStyles,
    topMetals,
    topGemstones,
    dominantComplexity,
    dominantPattern,
  };
}

/**
 * Generate augmentation prompt for DirectionPlannerAgent
 */
export function generatePersonalizationPrompt(profile: UserProfile): string {
  const prefs = getTopPreferences(profile);

  if (Object.keys(profile.preferredStyles).length === 0) {
    return ''; // No preference data yet
  }

  const parts = [];

  if (prefs.topStyles.length > 0) {
    parts.push(`subtly biased toward ${prefs.topStyles.join(', ')} aesthetics`);
  }

  if (prefs.topMetals.length > 0) {
    parts.push(`favoring ${prefs.topMetals.join(' and ')} metals`);
  }

  if (prefs.topGemstones.length > 0) {
    parts.push(`emphasizing ${prefs.topGemstones.join(' and ')} gemstones`);
  }

  parts.push(`with ${prefs.dominantComplexity} complexity level`);

  return parts.length > 0
    ? `Design should be ${parts.join(', ')}. Maintain 20-30% novelty to explore new directions.`
    : '';
}

/**
 * Get learning stats for analytics
 */
export function getLearningStats(profile: UserProfile) {
  const totalInteractions = profile.likedDesignCount + profile.skippedDesignCount;
  const likeRate =
    totalInteractions > 0 ? (profile.likedDesignCount / totalInteractions) * 100 : 0;

  return {
    totalLikes: profile.likedDesignCount,
    totalSkips: profile.skippedDesignCount,
    likeRate: Math.round(likeRate),
    styleCount: Object.keys(profile.preferredStyles).length,
    metalCount: Object.keys(profile.preferredMetals).length,
    gemstoneCount: Object.keys(profile.preferredGemstones).length,
    lastUpdated: profile.lastUpdated,
  };
}
