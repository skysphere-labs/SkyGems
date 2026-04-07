/**
 * RepairAgent
 * 
 * Responsibility: Refine and improve top-ranked designs
 * - Fix structural issues
 * - Enhance details
 * - Optimize proportions
 * 
 * Input: Top scored designs
 * Output: Refined designs with improvements
 */

import { Agent } from './Agent.interface';
import { ScoredDesign, RefiningResult } from './types';

export class RepairAgent extends Agent<ScoredDesign[], RefiningResult[]> {
  getName(): string {
    return 'RepairAgent';
  }

  getDescription(): string {
    return 'Refines and improves top-ranked designs';
  }

  private generateImprovements(): string[] {
    const improvements = [
      'Enhanced gemstone setting symmetry',
      'Optimized metal thickness for durability',
      'Refined proportions for wearability',
      'Improved surface finish and polish',
      'Strengthened attachment points',
    ];

    return improvements.slice(0, 2 + Math.floor(Math.random() * 3));
  }

  async run(designs: ScoredDesign[]): Promise<RefiningResult[]> {
    this.logger.log(`Refining top ${Math.min(5, designs.length)} designs...`);

    // Take only top 5 designs
    const topDesigns = designs.slice(0, 5);

    await this.simulateDelay(1200);

    const refinedDesigns: RefiningResult[] = topDesigns.map((design, index) => ({
      id: `refined-${design.id}`,
      originalDesignId: design.id,
      refinedImageUrl: design.imageUrl.replace(
        'placeholder',
        `placeholder&bg=${index % 2 === 0 ? 'FF69B4' : '00CED1'}`
      ),
      improvements: this.generateImprovements(),
    }));

    this.logger.log(`Refinement complete: ${refinedDesigns.length} designs improved`);
    return refinedDesigns;
  }
}

export const repairAgent = new RepairAgent();
