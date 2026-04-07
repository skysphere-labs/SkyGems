/**
 * BriefNormalizerAgent
 * 
 * Responsibility: Parse UI selections, sketches, and text input into a structured DesignSpec
 * Input: Raw UI data + optional sketch + text brief
 * Output: Normalized DesignSpec for downstream agents
 */

import { Agent } from './Agent.interface';
import { DesignSpec, PipelineInput } from './types';

export class BriefNormalizerAgent extends Agent<PipelineInput, DesignSpec> {
  getName(): string {
    return 'BriefNormalizerAgent';
  }

  getDescription(): string {
    return 'Normalizes raw UI input into structured design specification';
  }

  async run(input: PipelineInput): Promise<DesignSpec> {
    this.logger.log('Starting to normalize design brief...');

    // Simulate processing time
    await this.simulateDelay(800);

    // Extract and validate input
    const designSpec: DesignSpec = {
      type: input.designSpec.type || 'ring',
      metal: input.designSpec.metal || 'gold',
      gemstones: input.designSpec.gemstones || [],
      style: input.designSpec.style || 'contemporary',
      complexity: input.designSpec.complexity || 'moderate',
      constraints: input.designSpec.constraints || [],
      inspirationHints: input.designSpec.inspirationHints || [],
    };

    // Process additional notes if provided
    if (input.additionalNotes) {
      if (!designSpec.inspirationHints) {
        designSpec.inspirationHints = [];
      }
      designSpec.inspirationHints.push(input.additionalNotes);
    }

    this.logger.log(
      `Brief normalized: ${designSpec.type} in ${designSpec.metal} with ${designSpec.gemstones.join(
        ', '
      )}`
    );

    return designSpec;
  }
}

export const briefNormalizerAgent = new BriefNormalizerAgent();
