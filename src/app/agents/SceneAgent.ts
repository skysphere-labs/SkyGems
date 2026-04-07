/**
 * SceneAgent
 * 
 * Responsibility: Generate lifestyle/editorial renders showing designs in context
 * - Renders on hands
 * - Jewelry on display
 * - Styled photography
 * 
 * Input: Refined designs
 * Output: Scene renders with context
 */

import { Agent } from './Agent.interface';
import { RefiningResult, SceneRender } from './types';

export class SceneAgent extends Agent<RefiningResult[], SceneRender[]> {
  getName(): string {
    return 'SceneAgent';
  }

  getDescription(): string {
    return 'Generates lifestyle and editorial renders';
  }

  private getSceneContexts(): string[] {
    return [
      "Woman's hand, elegant pose",
      'Luxury jewelry display case',
      'Close-up detail shot with natural lighting',
      'Lifestyle editorial setting',
      'Professional studio photography',
    ];
  }

  async run(designs: RefiningResult[]): Promise<SceneRender[]> {
    this.logger.log(`Creating lifestyle scenes for ${designs.length} designs...`);

    await this.simulateDelay(1300);

    const scenes: SceneRender[] = [];
    const contexts = this.getSceneContexts();

    designs.forEach((design, index) => {
      contexts.forEach((context, contextIndex) => {
        scenes.push({
          id: `scene-${design.id}-${contextIndex}`,
          designId: design.id,
          imageUrl: design.refinedImageUrl.replace(
            'placeholder',
            `placeholder&text=Scene+${index + 1}`
          ),
          context,
        });
      });
    });

    this.logger.log(`Generated ${scenes.length} lifestyle scenes`);
    return scenes;
  }
}

export const sceneAgent = new SceneAgent();
