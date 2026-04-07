/**
 * DirectionPlannerAgent
 *
 * Responsibility: Generate distinct design directions based on brief and references
 * Input: DesignSpec + References
 * Output: Design directions tailored to the specific jewelry type
 */

import { Agent } from './Agent.interface';
import { DesignSpec, Direction } from './types';
import { Reference } from './ReferenceRetrieverAgent';

export interface DirectionPlannerInput {
  designSpec: DesignSpec;
  references: Reference[];
}

export class DirectionPlannerAgent extends Agent<DirectionPlannerInput, Direction[]> {
  getName(): string {
    return 'DirectionPlannerAgent';
  }

  getDescription(): string {
    return 'Plans distinct design directions for exploration';
  }

  async run(input: DirectionPlannerInput): Promise<Direction[]> {
    const { type, metal, gemstones, style } = input.designSpec;
    const gemLabel = gemstones.length > 0 ? gemstones.join(' and ') : 'plain metal';
    const metalLabel = metal.replace('-', ' ');

    this.logger.log(`Planning directions for ${type} in ${metalLabel} with ${gemLabel}...`);

    await this.simulateDelay(1000);

    const directions: Direction[] = [
      {
        id: 'dir-1',
        conceptName: 'Timeless Elegance',
        description: `A ${style} ${type} in ${metalLabel} featuring ${gemLabel}, with classic proportions and refined symmetry`,
        designIntent: `Evoke sophistication through a timeless ${type} design`,
      },
      {
        id: 'dir-2',
        conceptName: 'Architectural Bold',
        description: `A bold geometric ${type} in ${metalLabel} with ${gemLabel}, emphasizing structural drama and clean lines`,
        designIntent: `Create visual impact through a bold ${type} with strong compositional choices`,
      },
      {
        id: 'dir-3',
        conceptName: 'Nature-Inspired',
        description: `An organic ${type} in ${metalLabel} with ${gemLabel}, featuring flowing curves inspired by natural forms`,
        designIntent: `Bring living beauty into a ${type} crafted from ${metalLabel}`,
      },
      {
        id: 'dir-4',
        conceptName: 'Contemporary Minimalist',
        description: `A minimalist ${type} in ${metalLabel} with ${gemLabel}, focusing on essential elements and maximum impact`,
        designIntent: `Express luxury through restraint in a sleek ${type} design`,
      },
      {
        id: 'dir-5',
        conceptName: 'Heritage Fusion',
        description: `A ${type} in ${metalLabel} with ${gemLabel}, blending traditional craftsmanship with modern ${style} aesthetics`,
        designIntent: `Honor jewelry heritage with a contemporary ${type}`,
      },
    ];

    this.logger.log(`Generated ${directions.length} design directions for ${type}`);
    return directions;
  }
}

export const directionPlannerAgent = new DirectionPlannerAgent();
