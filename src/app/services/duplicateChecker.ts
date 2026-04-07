/**
 * Duplicate Detection Service
 * 
 * This service detects duplicate designs using image hashing and
 * similarity comparison. It prevents the same design from being
 * generated multiple times.
 * 
 * How it works:
 * - Computes perceptual hash (pHash) of images
 * - Compares hashes using Hamming distance
 * - If similarity exceeds threshold, considers it a duplicate
 */

/**
 * Perceptual Hash computation using a simplified algorithm
 * Real implementation would use pHash or dHash libraries
 */

interface ImageHash {
  hash: string;
  designId: string;
  timestamp: number;
}

interface DuplicateCheckResult {
  isDuplicate: boolean;
  matchedDesignId?: string;
  similarity?: number;
  threshold: number;
}

/**
 * Simple hash computation for image similarity detection
 * In production, use: `npm install phash` or `npm install sharp` + custom pHash
 * 
 * This is a placeholder using string-based hashing
 * For real image hashing, integrate with image processing library
 */
function computeImageHash(imageData: Uint8Array | string): string {
  // Placeholder: In production, implement actual pHash/dHash
  // This would process actual image data
  
  if (typeof imageData === 'string') {
    // URL-based hash
    let hash = 0;
    for (let i = 0; i < imageData.length; i++) {
      const char = imageData.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(16);
  }
  
  // Uint8Array-based hash
  let hash = 0;
  for (let i = 0; i < Math.min(imageData.length, 1000); i++) {
    hash = ((hash << 5) - hash) + imageData[i];
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16);
}

/**
 * Calculate Hamming distance between two hashes
 * Lower distance = more similar
 */
function hammingDistance(hash1: string, hash2: string): number {
  // Pad hashes to same length
  const maxLen = Math.max(hash1.length, hash2.length);
  const h1 = hash1.padStart(maxLen, '0');
  const h2 = hash2.padStart(maxLen, '0');
  
  let distance = 0;
  for (let i = 0; i < h1.length; i++) {
    if (h1[i] !== h2[i]) {
      distance++;
    }
  }
  return distance;
}

/**
 * Convert Hamming distance to similarity percentage (0-100)
 */
function hashSimilarity(hash1: string, hash2: string): number {
  const distance = hammingDistance(hash1, hash2);
  const maxDistance = Math.max(hash1.length, hash2.length);
  return Math.max(0, 100 - (distance / maxDistance) * 100);
}

/**
 * Store of design hashes for duplicate detection
 * In production, this would be a database
 */
class DuplicateDetector {
  private hashes: ImageHash[] = [];
  private similarityThreshold: number = 85; // 85% similarity = duplicate

  /**
   * Add a new design hash to the store
   */
  addHash(designId: string, imageData: Uint8Array | string): string {
    const hash = computeImageHash(imageData);
    this.hashes.push({
      hash,
      designId,
      timestamp: Date.now(),
    });
    return hash;
  }

  /**
   * Check if image is duplicate
   * Returns match info if found
   */
  checkDuplicate(imageData: Uint8Array | string): DuplicateCheckResult {
    const newHash = computeImageHash(imageData);

    for (const existing of this.hashes) {
      const similarity = hashSimilarity(newHash, existing.hash);

      if (similarity >= this.similarityThreshold) {
        return {
          isDuplicate: true,
          matchedDesignId: existing.designId,
          similarity,
          threshold: this.similarityThreshold,
        };
      }
    }

    return {
      isDuplicate: false,
      threshold: this.similarityThreshold,
    };
  }

  /**
   * Get similar designs above a certain threshold
   */
  findSimilar(imageData: Uint8Array | string, threshold: number = 70): Array<{
    designId: string;
    similarity: number;
  }> {
    const newHash = computeImageHash(imageData);
    const similar: Array<{ designId: string; similarity: number }> = [];

    for (const existing of this.hashes) {
      const similarity = hashSimilarity(newHash, existing.hash);
      if (similarity >= threshold) {
        similar.push({
          designId: existing.designId,
          similarity,
        });
      }
    }

    return similar.sort((a, b) => b.similarity - a.similarity);
  }

  /**
   * Remove design from duplicate detection store
   */
  removeHash(designId: string): boolean {
    const initialLength = this.hashes.length;
    this.hashes = this.hashes.filter((h) => h.designId !== designId);
    return this.hashes.length < initialLength;
  }

  /**
   * Set custom similarity threshold
   * Higher = stricter duplicate detection
   */
  setThreshold(threshold: number): void {
    if (threshold < 0 || threshold > 100) {
      throw new Error('Threshold must be between 0 and 100');
    }
    this.similarityThreshold = threshold;
  }

  /**
   * Get current threshold
   */
  getThreshold(): number {
    return this.similarityThreshold;
  }

  /**
   * Clear all hashes
   */
  clear(): void {
    this.hashes = [];
  }

  /**
   * Get statistics
   */
  getStats(): {
    totalDesigns: number;
    threshold: number;
  } {
    return {
      totalDesigns: this.hashes.length,
      threshold: this.similarityThreshold,
    };
  }

  /**
   * Export hashes for persistence
   */
  exportHashes(): ImageHash[] {
    return JSON.parse(JSON.stringify(this.hashes));
  }

  /**
   * Import hashes from storage
   */
  importHashes(hashes: ImageHash[]): void {
    this.hashes = hashes;
  }
}

// Singleton instance
let detectorInstance: DuplicateDetector | null = null;

/**
 * Get or create duplicate detector instance
 */
export function getDuplicateDetector(): DuplicateDetector {
  if (!detectorInstance) {
    detectorInstance = new DuplicateDetector();
  }
  return detectorInstance;
}

/**
 * Reset detector (useful for testing)
 */
export function resetDetector(): void {
  detectorInstance = null;
}

/**
 * Public API for duplicate checking
 */
export function checkForDuplicate(imageData: Uint8Array | string): DuplicateCheckResult {
  return getDuplicateDetector().checkDuplicate(imageData);
}

/**
 * Register design hash
 */
export function registerDesignHash(designId: string, imageData: Uint8Array | string): string {
  return getDuplicateDetector().addHash(designId, imageData);
}

/**
 * Find similar designs
 */
export function findSimilarDesigns(
  imageData: Uint8Array | string,
  threshold?: number
): Array<{ designId: string; similarity: number }> {
  return getDuplicateDetector().findSimilar(imageData, threshold);
}

/**
 * Remove design from detection
 */
export function removeDesignFromDetection(designId: string): boolean {
  return getDuplicateDetector().removeHash(designId);
}

/**
 * Set global similarity threshold
 */
export function setSimilarityThreshold(threshold: number): void {
  getDuplicateDetector().setThreshold(threshold);
}

/**
 * Get current threshold
 */
export function getSimilarityThreshold(): number {
  return getDuplicateDetector().getThreshold();
}

/**
 * Get detector statistics
 */
export function getDetectorStats(): { totalDesigns: number; threshold: number } {
  return getDuplicateDetector().getStats();
}

/**
 * Export for persistence
 */
export function exportDetectorState(): ImageHash[] {
  return getDuplicateDetector().exportHashes();
}

/**
 * Import persisted state
 */
export function importDetectorState(hashes: ImageHash[]): void {
  getDuplicateDetector().importHashes(hashes);
}

/**
 * Clear all detection data
 */
export function clearDetector(): void {
  getDuplicateDetector().clear();
}
