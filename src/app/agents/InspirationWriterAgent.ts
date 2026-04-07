/**
 * InspirationWriterAgent
 * 
 * Responsibility: Generate grounded, compelling design explanation text
 * - Storytelling
 * - Design philosophy
 * - Key features highlight
 * 
 * Input: DesignSpec + References
 * Output: Inspiration content (narrative + key features)
 */

import { Agent } from './Agent.interface';
import { DesignSpec, InspirationContent } from './types';
import { Reference } from './ReferenceRetrieverAgent';

export interface InspirationWriterInput {
  designSpec: DesignSpec;
  references: Reference[];
}

export class InspirationWriterAgent extends Agent<
  InspirationWriterInput,
  InspirationContent
> {
  getName(): string {
    return 'InspirationWriterAgent';
  }

  getDescription(): string {
    return 'Writes compelling design narratives and descriptions';
  }

  async run(input: InspirationWriterInput): Promise<InspirationContent> {
    this.logger.log('Crafting design inspiration narrative...');

    await this.simulateDelay(900);

    const { designSpec } = input;

    const content: InspirationContent = {
      title: `${designSpec.style} ${designSpec.type} Design Collection`,
      description: `A masterfully crafted ${designSpec.type} that embodies ${designSpec.style} aesthetics with meticulous attention to detail. This piece combines the timeless appeal of ${designSpec.metal} with the brilliance of carefully selected ${designSpec.gemstones.join(' and ')} gemstones, creating a design that transcends seasons and trends.`,
      keyFeatures: [
        `Premium ${designSpec.metal} setting`,
        `Expertly selected ${designSpec.gemstones.join(' and ')} gemstones`,
        `${designSpec.complexity} craftsmanship`,
        `${designSpec.style} aesthetic`,
        'Comfortable for everyday wear',
        'Heirloom quality construction',
      ],
      designPhilosophy: `This collection represents our commitment to merging contemporary design sensibilities with time-honored jewelry craftsmanship. Each piece tells a story of elegance, precision, and the pursuit of beauty. We believe that luxury jewelry should be both visually stunning and deeply personal—a reflection of the wearer's unique identity and refined taste.`,
    };

    this.logger.log('Inspiration narrative complete');
    return content;
  }
}

export const inspirationWriterAgent = new InspirationWriterAgent();
