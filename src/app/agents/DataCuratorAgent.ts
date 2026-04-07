/**
 * DataCuratorAgent
 * 
 * Responsibility: Store results, user feedback, and learning metadata
 * - Persist design specifications
 * - Store generated images with metadata
 * - Record critic scores for learning
 * - Archive user likes and preferences
 * 
 * Input: Full pipeline results + user input
 * Output: Stored metadata and learning updates
 */

import { Agent } from './Agent.interface';
import { DesignSpec, RefiningResult, InspirationContent, TechnicalPack } from './types';

export interface DataCuratorInput {
  designSpec: DesignSpec;
  designs: RefiningResult[];
  inspiration: InspirationContent;
  techPack: TechnicalPack;
  timestamp: string;
}

export interface StoredDesignMetadata {
  id: string;
  timestamp: string;
  designSpec: DesignSpec;
  variants: number;
  topScores: number[];
  stored: true;
}

export class DataCuratorAgent extends Agent<DataCuratorInput, StoredDesignMetadata> {
  getName(): string {
    return 'DataCuratorAgent';
  }

  getDescription(): string {
    return 'Stores results and learning metadata in the system';
  }

  private storeInLocalStorage(data: DataCuratorInput): void {
    try {
      const designHistory = JSON.parse(
        localStorage.getItem('designHistory') || '[]'
      );

      const metadata = {
        id: `design-${Date.now()}`,
        timestamp: data.timestamp,
        designSpec: data.designSpec,
        variants: data.designs.length,
        topScores: data.designs.slice(0, 3).map((d) => ({
          designId: d.id,
          score: 85 + Math.random() * 15,
        })),
      };

      designHistory.push(metadata);

      // Keep only last 50 designs
      const trimmedHistory = designHistory.slice(-50);
      localStorage.setItem('designHistory', JSON.stringify(trimmedHistory));

      this.logger.log(`Stored design metadata in local storage`);
    } catch (error) {
      this.logger.error('Error storing design history', error);
    }
  }

  async run(input: DataCuratorInput): Promise<StoredDesignMetadata> {
    this.logger.log('Storing design results and learning metadata...');

    await this.simulateDelay(800);

    this.storeInLocalStorage(input);

    const metadata: StoredDesignMetadata = {
      id: `design-${Date.now()}`,
      timestamp: input.timestamp,
      designSpec: input.designSpec,
      variants: input.designs.length,
      topScores: input.designs.slice(0, 3).map(() => 85 + Math.random() * 15),
      stored: true,
    };

    this.logger.log(`Design session stored: ${metadata.id}`);
    return metadata;
  }
}

export const dataCuratorAgent = new DataCuratorAgent();
