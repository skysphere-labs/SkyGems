/**
 * GeneratorWorkerAgent
 *
 * Responsibility: Generate image variants for a given design direction
 * Input: Single Direction
 * Output: GeneratedDesign images per direction
 *
 * Uses xAI (Grok) API for real image generation when configured,
 * falls back to placeholders otherwise.
 */

import { Agent } from './Agent.interface';
import { Direction, GeneratedDesign } from './types';
import { generateImage, isXaiConfigured } from '../services/xaiImageService';

export class GeneratorWorkerAgent extends Agent<Direction, GeneratedDesign[]> {
  getName(): string {
    return 'GeneratorWorkerAgent';
  }

  getDescription(): string {
    return 'Generates image variants per design direction';
  }

  private buildImagePrompt(direction: Direction): string {
    // Keep it short — AI image models work best with concise prompts
    // The jewelry type is embedded in direction.description from DirectionPlannerAgent
    return `A jewelry design sheet with front view and top view of: ${direction.description}. ${direction.designIntent}. Show the COMPLETE piece in both views with nothing cropped. Conceptual hand-drawn art style — fine pencil outlines, soft graphite shading, light color washes for metal and gemstone tones, realistic metal reflections with careful hatching. Master jeweler's sketchbook aesthetic. White paper background. No text, no body parts.`;
  }

  async run(direction: Direction): Promise<GeneratedDesign[]> {
    const useXai = isXaiConfigured();
    const variants: GeneratedDesign[] = [];

    if (useXai) {
      // When using real API, generate 1 image per direction to be efficient
      // (5 directions run in parallel = 5 total images, top 4 displayed)
      this.logger.log(`Generating via xAI for: ${direction.conceptName}`);

      const prompt = this.buildImagePrompt(direction);

      try {
        const imageUrl = await generateImage(prompt);
        variants.push({
          id: `gen-${direction.id}-1`,
          directionId: direction.id,
          variantNumber: 1,
          imageUrl,
          prompt,
          metadata: {
            generatedAt: new Date().toISOString(),
            model: 'grok-imagine-image-pro',
          },
        });
        this.logger.log(`Generated image for ${direction.conceptName}`);
      } catch (error) {
        this.logger.log(`xAI failed for ${direction.conceptName}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        // Push placeholder on failure
        variants.push({
          id: `gen-${direction.id}-1`,
          directionId: direction.id,
          variantNumber: 1,
          imageUrl: `https://via.placeholder.com/400x400/1A1A1A/D4AF37?text=${encodeURIComponent(direction.conceptName)}`,
          prompt,
          metadata: {
            generatedAt: new Date().toISOString(),
            model: 'placeholder',
          },
        });
      }
    } else {
      this.logger.log(`Using placeholders for: ${direction.conceptName}`);

      // Fallback: placeholder images with simulated delay
      for (let i = 1; i <= 5; i++) {
        await this.simulateDelay(500);

        variants.push({
          id: `gen-${direction.id}-${i}`,
          directionId: direction.id,
          variantNumber: i,
          imageUrl: `https://via.placeholder.com/400x400/1A1A1A/D4AF37?text=${encodeURIComponent(direction.conceptName)}+V${i}`,
          prompt: `${direction.description} - Variant ${i}`,
          metadata: {
            generatedAt: new Date().toISOString(),
            model: 'placeholder',
          },
        });
      }
    }

    return variants;
  }
}

export const generatorWorkerAgent = new GeneratorWorkerAgent();
