/**
 * Design Storage Service
 * 
 * This service manages the persistent storage of generated designs.
 * Handles:
 * - Saving generated designs with metadata
 * - Organizing designs by status (generated/liked)
 * - Managing design metadata
 * - Persisting to browser storage for now (could be backend later)
 * 
 * Storage structure:
 * /designs/
 *   /generated/   - All generated designs
 *   /liked/       - User's favorite designs
 *   metadata.json - Design metadata index
 */

export interface DesignVariation {
  bandStyle: string;
  settingType: string;
  stonePosition: string;
  profile: string;
  motif: string;
}

export interface DesignFeatures {
  type: string;
  metal: string;
  gemstones: string[];
  style: string;
  complexity: number;
  variation: DesignVariation;
}

export interface DesignMetadata {
  id: string;
  prompt: string;
  imageUrl?: string; // URL or data URI
  imagePath?: string; // Reference path
  createdByUserId?: string;
  ownedByCurrentUser?: boolean;
  features: DesignFeatures;
  hash?: string; // Image hash for duplicate detection
  liked: boolean;
  createdAt: number; // Timestamp
  updatedAt: number;
  tags?: string[];
  notes?: string;
}

export interface GalleryCacheState {
  ownerScope: 'all' | 'mine';
  lastSyncedAt: number;
  lastServerUpdatedAt?: string;
  complete: boolean;
  cachedCount: number;
}

const AUTH_SESSION_KEY = 'skygems.session.v2';
const STORAGE_KEY_PREFIX = 'jewel_designs_metadata';
const GALLERY_CACHE_KEY_PREFIX = 'jewel_gallery_cache';

function getStorageNamespace(): string {
  if (typeof window === 'undefined') {
    return 'anonymous';
  }

  try {
    const raw = window.localStorage.getItem(AUTH_SESSION_KEY) ?? window.sessionStorage.getItem(AUTH_SESSION_KEY);
    if (!raw) {
      return 'anonymous';
    }

    const parsed = JSON.parse(raw) as { userId?: string; tenantId?: string };
    const tenantId = parsed.tenantId?.trim() || 'anonymous-tenant';
    const userId = parsed.userId?.trim() || 'anonymous';
    return `${tenantId}:${userId}`;
  } catch {
    return 'anonymous';
  }
}

function getMetadataStorageKey(): string {
  return `${STORAGE_KEY_PREFIX}:${getStorageNamespace()}`;
}

function getGalleryCacheStorageKey(ownerScope: 'all' | 'mine'): string {
  return `${GALLERY_CACHE_KEY_PREFIX}:${getStorageNamespace()}:${ownerScope}`;
}

/**
 * Design Storage Manager
 * Handles all design persistence
 */
class StorageManager {
  private metadata: Map<string, DesignMetadata> = new Map();

  constructor() {
    this.loadMetadata();
  }

  /**
   * Generate unique design ID
   */
  private generateId(): string {
    return `design_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Load metadata from storage
   */
  private loadMetadata(): void {
    try {
      const stored = localStorage.getItem(getMetadataStorageKey());
      if (stored) {
        const parsed = JSON.parse(stored);
        this.metadata = new Map(parsed);
      }
    } catch (error) {
      console.error('Failed to load metadata from storage:', error);
      this.metadata = new Map();
    }
  }

  /**
   * Save metadata to storage
   */
  private saveMetadata(): void {
    try {
      const data = Array.from(this.metadata.entries());
      localStorage.setItem(getMetadataStorageKey(), JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save metadata to storage:', error);
    }
  }

  /**
   * Save a new generated design
   */
  saveDesign(
    imageUrl: string,
    prompt: string,
    features: DesignFeatures,
    hash?: string
  ): DesignMetadata {
    const id = this.generateId();
    const now = Date.now();

    const design: DesignMetadata = {
      id,
      prompt,
      imageUrl,
      features,
      hash,
      liked: false,
      createdAt: now,
      updatedAt: now,
      tags: [],
      notes: '',
    };

    this.metadata.set(id, design);
    this.saveMetadata();

    return design;
  }

  /**
   * Get design by ID
   */
  getDesign(id: string): DesignMetadata | undefined {
    return this.metadata.get(id);
  }

  /**
   * Get all generated designs
   */
  getAllDesigns(): DesignMetadata[] {
    return Array.from(this.metadata.values()).sort(
      (a, b) => b.createdAt - a.createdAt
    );
  }

  /**
   * Get all liked designs
   */
  getLikedDesigns(): DesignMetadata[] {
    return Array.from(this.metadata.values())
      .filter((d) => d.liked)
      .sort((a, b) => b.createdAt - a.createdAt);
  }

  /**
   * Get generated (non-liked) designs
   */
  getGeneratedDesigns(): DesignMetadata[] {
    return Array.from(this.metadata.values())
      .filter((d) => !d.liked)
      .sort((a, b) => b.createdAt - a.createdAt);
  }

  /**
   * Like a design (move from generated to liked)
   */
  likeDesign(id: string): DesignMetadata | undefined {
    const design = this.metadata.get(id);
    if (design) {
      design.liked = true;
      design.updatedAt = Date.now();
      this.metadata.set(id, design);
      this.saveMetadata();
      return design;
    }
    return undefined;
  }

  /**
   * Unlike a design
   */
  unlikeDesign(id: string): DesignMetadata | undefined {
    const design = this.metadata.get(id);
    if (design) {
      design.liked = false;
      design.updatedAt = Date.now();
      this.metadata.set(id, design);
      this.saveMetadata();
      return design;
    }
    return undefined;
  }

  /**
   * Update design metadata
   */
  updateDesign(id: string, updates: Partial<DesignMetadata>): DesignMetadata | undefined {
    const design = this.metadata.get(id);
    if (design) {
      const updated = {
        ...design,
        ...updates,
        id: design.id, // Don't change ID
        createdAt: design.createdAt, // Don't change creation date
        updatedAt: Date.now(),
      };
      this.metadata.set(id, updated);
      this.saveMetadata();
      return updated;
    }
    return undefined;
  }

  /**
   * Add tags to a design
   */
  addTags(id: string, tags: string[]): DesignMetadata | undefined {
    const design = this.metadata.get(id);
    if (design) {
      const existingTags = design.tags || [];
      design.tags = [...new Set([...existingTags, ...tags])];
      design.updatedAt = Date.now();
      this.metadata.set(id, design);
      this.saveMetadata();
      return design;
    }
    return undefined;
  }

  /**
   * Delete a design
   */
  deleteDesign(id: string): boolean {
    const hadDesign = this.metadata.has(id);
    if (hadDesign) {
      this.metadata.delete(id);
      this.saveMetadata();
    }
    return hadDesign;
  }

  /**
   * Search designs by tags
   */
  searchByTags(tags: string[]): DesignMetadata[] {
    return Array.from(this.metadata.values()).filter((design) => {
      const designTags = design.tags || [];
      return tags.some((tag) => designTags.includes(tag));
    });
  }

  /**
   * Search designs by features
   */
  searchByFeatures(criteria: Partial<DesignFeatures>): DesignMetadata[] {
    return Array.from(this.metadata.values()).filter((design) => {
      if (criteria.type && design.features.type !== criteria.type) return false;
      if (criteria.metal && design.features.metal !== criteria.metal) return false;
      if (criteria.style && design.features.style !== criteria.style) return false;
      if (criteria.complexity && design.features.complexity !== criteria.complexity)
        return false;
      if (
        criteria.gemstones &&
        !criteria.gemstones.every((gem) => design.features.gemstones.includes(gem))
      )
        return false;
      return true;
    });
  }

  /**
   * Get statistics
   */
  getStats(): {
    total: number;
    liked: number;
    generated: number;
    byType: Record<string, number>;
    byMetal: Record<string, number>;
    byStyle: Record<string, number>;
  } {
    const all = Array.from(this.metadata.values());
    const stats = {
      total: all.length,
      liked: all.filter((d) => d.liked).length,
      generated: all.filter((d) => !d.liked).length,
      byType: {} as Record<string, number>,
      byMetal: {} as Record<string, number>,
      byStyle: {} as Record<string, number>,
    };

    for (const design of all) {
      stats.byType[design.features.type] = (stats.byType[design.features.type] || 0) + 1;
      stats.byMetal[design.features.metal] = (stats.byMetal[design.features.metal] || 0) + 1;
      stats.byStyle[design.features.style] = (stats.byStyle[design.features.style] || 0) + 1;
    }

    return stats;
  }

  /**
   * Export all data
   */
  exportData(): DesignMetadata[] {
    return Array.from(this.metadata.values());
  }

  /**
   * Import data
   */
  importData(designs: DesignMetadata[]): void {
    this.metadata.clear();
    for (const design of designs) {
      this.metadata.set(design.id, design);
    }
    this.saveMetadata();
  }

  upsertMetadata(metadata: DesignMetadata): void {
    this.metadata.set(metadata.id, metadata);
    this.saveMetadata();
  }

  /**
   * Clear all data
   */
  clearAll(): void {
    this.metadata.clear();
    this.saveMetadata();
  }
}

// Singleton instance
let storageInstance: StorageManager | null = null;

/**
 * Get or create storage manager instance
 */
export function getStorageManager(): StorageManager {
  if (!storageInstance) {
    storageInstance = new StorageManager();
  }
  return storageInstance;
}

/**
 * Reset storage (useful for testing)
 */
export function resetStorage(): void {
  storageInstance = null;
}

/**
 * Save a generated design
 */
export function saveGeneratedDesign(
  imageUrl: string,
  prompt: string,
  features: DesignFeatures,
  hash?: string
): DesignMetadata {
  return getStorageManager().saveDesign(imageUrl, prompt, features, hash);
}

/**
 * Get design by ID
 */
export function getDesign(id: string): DesignMetadata | undefined {
  return getStorageManager().getDesign(id);
}

/**
 * Get all designs
 */
export function getAllDesigns(): DesignMetadata[] {
  return getStorageManager().getAllDesigns();
}

/**
 * Get liked designs
 */
export function getLikedDesigns(): DesignMetadata[] {
  return getStorageManager().getLikedDesigns();
}

/**
 * Get generated (unsaved) designs
 */
export function getGeneratedDesigns(): DesignMetadata[] {
  return getStorageManager().getGeneratedDesigns();
}

/**
 * Like a design
 */
export function likeDesign(id: string): DesignMetadata | undefined {
  return getStorageManager().likeDesign(id);
}

/**
 * Unlike a design
 */
export function unlikeDesign(id: string): DesignMetadata | undefined {
  return getStorageManager().unlikeDesign(id);
}

/**
 * Update design
 */
export function updateDesign(
  id: string,
  updates: Partial<DesignMetadata>
): DesignMetadata | undefined {
  return getStorageManager().updateDesign(id, updates);
}

/**
 * Add tags
 */
export function addDesignTags(id: string, tags: string[]): DesignMetadata | undefined {
  return getStorageManager().addTags(id, tags);
}

/**
 * Delete design
 */
export function deleteDesign(id: string): boolean {
  return getStorageManager().deleteDesign(id);
}

/**
 * Search by tags
 */
export function searchDesignsByTags(tags: string[]): DesignMetadata[] {
  return getStorageManager().searchByTags(tags);
}

/**
 * Search by features
 */
export function searchDesignsByFeatures(criteria: Partial<DesignFeatures>): DesignMetadata[] {
  return getStorageManager().searchByFeatures(criteria);
}

/**
 * Get storage stats
 */
export function getStorageStats(): {
  total: number;
  liked: number;
  generated: number;
  byType: Record<string, number>;
  byMetal: Record<string, number>;
  byStyle: Record<string, number>;
} {
  return getStorageManager().getStats();
}

/**
 * Export storage data
 */
export function exportStorageData(): DesignMetadata[] {
  return getStorageManager().exportData();
}

/**
 * Import storage data
 */
export function importStorageData(designs: DesignMetadata[]): void {
  getStorageManager().importData(designs);
}

/**
 * Upsert design metadata from backend sync.
 */
export function upsertDesignMetadata(metadata: DesignMetadata): void {
  getStorageManager().upsertMetadata(metadata);
}

export function getCachedDesigns(ownerScope: 'all' | 'mine' = 'all'): DesignMetadata[] {
  const allDesigns = getAllDesigns();
  if (ownerScope === 'mine') {
    return allDesigns.filter((design) => design.ownedByCurrentUser !== false);
  }
  return allDesigns;
}

export function readGalleryCacheState(
  ownerScope: 'all' | 'mine',
): GalleryCacheState | null {
  try {
    const raw = localStorage.getItem(getGalleryCacheStorageKey(ownerScope));
    if (!raw) {
      return null;
    }
    return JSON.parse(raw) as GalleryCacheState;
  } catch {
    return null;
  }
}

export function writeGalleryCacheState(
  ownerScope: 'all' | 'mine',
  state: GalleryCacheState,
): void {
  try {
    localStorage.setItem(getGalleryCacheStorageKey(ownerScope), JSON.stringify(state));
  } catch (error) {
    console.error('Failed to save gallery cache state:', error);
  }
}

export function clearGalleryCacheState(ownerScope?: 'all' | 'mine'): void {
  try {
    if (ownerScope) {
      localStorage.removeItem(getGalleryCacheStorageKey(ownerScope));
      return;
    }

    localStorage.removeItem(getGalleryCacheStorageKey('all'));
    localStorage.removeItem(getGalleryCacheStorageKey('mine'));
  } catch (error) {
    console.error('Failed to clear gallery cache state:', error);
  }
}

/**
 * Clear all storage
 */
export function clearAllDesigns(): void {
  getStorageManager().clearAll();
  clearGalleryCacheState();
}
