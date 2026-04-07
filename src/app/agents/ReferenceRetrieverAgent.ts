/**
 * ReferenceRetrieverAgent
 * 
 * Responsibility: Find and retrieve similar designs, motifs, and style examples
 * Input: DesignSpec
 * Output: Array of reference designs
 */

import { Agent } from './Agent.interface';
import { DesignSpec } from './types';

export interface Reference {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  category: string;
}

export class ReferenceRetrieverAgent extends Agent<DesignSpec, Reference[]> {
  getName(): string {
    return 'ReferenceRetrieverAgent';
  }

  getDescription(): string {
    return 'Retrieves reference designs and inspiration materials';
  }

  async run(input: DesignSpec): Promise<Reference[]> {
    this.logger.log(`Retrieving references for ${input.type} in ${input.style} style...`);

    await this.simulateDelay(1200);

    // Mock references based on design spec
    const mockReferences: Reference[] = [
      {
        id: 'ref-1',
        title: 'Classic Diamond Setting',
        description: 'Traditional solitaire with modern twist',
        imageUrl: 'https://via.placeholder.com/300?text=Ref1',
        category: 'Settings',
      },
      {
        id: 'ref-2',
        title: 'Gemstone Cluster',
        description: 'Multi-gem composition with balanced proportions',
        imageUrl: 'https://via.placeholder.com/300?text=Ref2',
        category: 'Compositions',
      },
      {
        id: 'ref-3',
        title: 'Contemporary Metal Work',
        description: `Modern ${input.metal} work with geometric patterns`,
        imageUrl: 'https://via.placeholder.com/300?text=Ref3',
        category: 'Metalwork',
      },
      {
        id: 'ref-4',
        title: 'Luxury Brand Heritage',
        description: 'High-end design principles and execution',
        imageUrl: 'https://via.placeholder.com/300?text=Ref4',
        category: 'Heritage',
      },
      {
        id: 'ref-5',
        title: `${input.style} Aesthetic`,
        description: `Designs embodying ${input.style} style`,
        imageUrl: 'https://via.placeholder.com/300?text=Ref5',
        category: 'Style',
      },
    ];

    this.logger.log(`Retrieved ${mockReferences.length} references`);
    return mockReferences;
  }
}

export const referenceRetrieverAgent = new ReferenceRetrieverAgent();
