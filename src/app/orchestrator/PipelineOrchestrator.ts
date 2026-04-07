/**
 * PipelineOrchestrator
 * 
 * Central orchestrator that coordinates all 10 agents through 9 pipeline stages
 * 
 * Pipeline Stages:
 * 1. Input: BriefNormalizerAgent - Parse UI input
 * 2. Research: ReferenceRetrieverAgent - Find references
 * 3. Ideation: DirectionPlannerAgent - Plan 5 directions
 * 4. Generation: GeneratorWorkerAgent - Generate variants (PARALLEL)
 * 5. Evaluation: CriticCouncilAgent - Score designs
 * 6. Refinement: RepairAgent - Improve top designs
 * 7. Presentation: SceneAgent + InspirationWriterAgent - Scenes & narrative
 * 8. Output: TechnicalPackAgent - Technical documentation
 * 9. Learning: DataCuratorAgent - Store metadata
 */

import { briefNormalizerAgent } from '../agents/BriefNormalizerAgent';
import { referenceRetrieverAgent } from '../agents/ReferenceRetrieverAgent';
import { directionPlannerAgent } from '../agents/DirectionPlannerAgent';
import { generatorWorkerAgent } from '../agents/GeneratorWorkerAgent';
import { criticCouncilAgent } from '../agents/CriticCouncilAgent';
import { repairAgent } from '../agents/RepairAgent';
import { sceneAgent } from '../agents/SceneAgent';
import { inspirationWriterAgent } from '../agents/InspirationWriterAgent';
import { technicalPackAgent } from '../agents/TechnicalPackAgent';
import { dataCuratorAgent } from '../agents/DataCuratorAgent';

import {
  PipelineInput,
  PipelineResult,
  AgentExecutionUpdate,
  DesignSpec,
  Direction,
} from '../agents/types';

import { getTopDesigns, rankDesigns } from './ScoringEngine';
import { UserProfile, loadUserProfile, saveUserProfile, updateUserProfile, generatePersonalizationPrompt } from './LearningLoop';

export interface StepCallback {
  (update: AgentExecutionUpdate): void;
}

export class PipelineOrchestrator {
  private stepCallbacks: StepCallback[] = [];
  private userProfile: UserProfile | null = null;
  private userId: string = 'default-user';

  constructor(userId: string = 'default-user') {
    this.userId = userId;
    this.userProfile = loadUserProfile(userId);
  }

  setUserProfile(profile: UserProfile): void {
    this.userProfile = profile;
  }

  getUserProfile(): UserProfile | null {
    return this.userProfile;
  }

  registerStepCallback(callback: StepCallback): void {
    this.stepCallbacks.push(callback);
  }

  private async notifyStep(update: AgentExecutionUpdate): Promise<void> {
    this.stepCallbacks.forEach((cb) => cb(update));
  }

  private async executeStep(
    stepName: string,
    agentName: string,
    agentFn: () => Promise<any>,
    progress: number
  ): Promise<any> {
    console.log(`[PipelineOrchestrator] Starting: ${stepName} (${agentName})`);

    await this.notifyStep({
      step: stepName,
      status: 'running',
      message: `Executing ${agentName}...`,
      progress,
      timestamp: new Date().toISOString(),
    });

    try {
      const result = await agentFn();

      await this.notifyStep({
        step: stepName,
        status: 'completed',
        message: `${agentName} completed`,
        progress,
        timestamp: new Date().toISOString(),
      });

      return result;
    } catch (error) {
      console.error(`[PipelineOrchestrator] Error in ${stepName}:`, error);

      await this.notifyStep({
        step: stepName,
        status: 'error',
        message: `Error in ${agentName}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        progress,
        timestamp: new Date().toISOString(),
      });

      throw error;
    }
  }

  async runDesignPipeline(input: PipelineInput): Promise<PipelineResult> {
    console.log('[PipelineOrchestrator] Starting design pipeline...');

    try {
      // Stage 1: Input (12% progress)
      const designSpec = await this.executeStep(
        'Reading Configuration',
        'BriefNormalizerAgent',
        () => briefNormalizerAgent.run(input),
        12
      );

      // Stage 2: Research (25% progress)
      const references = await this.executeStep(
        'Retrieving References',
        'ReferenceRetrieverAgent',
        () => referenceRetrieverAgent.run(designSpec),
        25
      );

      // Stage 3: Ideation (38% progress)
      const directions = await this.executeStep(
        'Planning Directions',
        'DirectionPlannerAgent',
        () => directionPlannerAgent.run({ designSpec, references }),
        38
      );

      // Stage 4: Generation (50% progress) - PARALLEL EXECUTION
      const generated = await this.executeStep(
        'Generating Concepts',
        'GeneratorWorkerAgent (5 parallel)',
        async () => {
          // Run all 5 generators in parallel
          const allVariants = await Promise.all(
            directions.map((direction: Direction) =>
              generatorWorkerAgent.run(direction)
            )
          );
          // Flatten array of arrays
          return allVariants.flat();
        },
        50
      );

      // Stage 5: Evaluation (62% progress)
      const scored = await this.executeStep(
        'Evaluating Designs',
        'CriticCouncilAgent',
        () => criticCouncilAgent.run(generated),
        62
      );

      // Ranking Engine (65% progress) - NEW: Score and rank designs
      const rankedDesigns = await this.executeStep(
        'Ranking Designs',
        'RankingEngine',
        async () => {
          const rankings = rankDesigns(scored, {
            topN: 5,
            boostDiversity: true,
            diversityFactor: 0.1,
            randomnessFactor: 0.05,
          });
          console.log('[RankingEngine] Top rankings:', rankings);
          return rankings;
        },
        65
      );

      // Get only top designs for repair
      const topDesigns = getTopDesigns(scored, 5);

      // Stage 6: Refinement (75% progress)
      const repaired = await this.executeStep(
        'Refining Designs',
        'RepairAgent',
        () => repairAgent.run(topDesigns),
        75
      );

      // Stage 7a: Scenes (85% progress)
      const scenes = await this.executeStep(
        'Creating Scenes',
        'SceneAgent',
        () => sceneAgent.run(repaired),
        85
      );

      // Stage 7b: Inspiration (88% progress)
      const inspiration = await this.executeStep(
        'Writing Inspiration',
        'InspirationWriterAgent',
        () => inspirationWriterAgent.run({ designSpec, references }),
        88
      );

      // Stage 8: Output (93% progress)
      // Use the first refined design for technical pack
      const techPack = await this.executeStep(
        'Generating Technical Pack',
        'TechnicalPackAgent',
        () => technicalPackAgent.run(repaired[0]),
        93
      );

      // Stage 9: Learning (100% progress)
      await this.executeStep(
        'Learning from Data',
        'DataCuratorAgent',
        () =>
          dataCuratorAgent.run({
            designSpec,
            designs: repaired,
            inspiration,
            techPack,
            timestamp: new Date().toISOString(),
          }),
        100
      );

      // Final notification
      await this.notifyStep({
        step: 'Complete',
        status: 'completed',
        message: 'Pipeline execution complete',
        progress: 100,
        timestamp: new Date().toISOString(),
      });

      console.log('[PipelineOrchestrator] Pipeline completed successfully');

      return {
        designs: topDesigns,
        scenes,
        inspiration,
        techPack,
      };
    } catch (error) {
      console.error('[PipelineOrchestrator] Pipeline failed:', error);
      throw error;
    }
  }

  /**
   * Record user interaction and update profile learning
   */
  recordUserInteraction(
    designId: string,
    action: 'like' | 'skip' | 'view' | 'export',
    metadata: {
      style?: string;
      metal?: string;
      gemstones?: string[];
      complexity?: 'simple' | 'moderate' | 'complex';
    } = {}
  ): void {
    if (!this.userProfile) {
      this.userProfile = loadUserProfile(this.userId);
    }

    const interaction = {
      designId,
      action,
      timestamp: new Date().toISOString(),
      timeSpent: 0,
    };

    this.userProfile = updateUserProfile(this.userProfile, interaction, metadata);
    saveUserProfile(this.userProfile);

    console.log('[LearningLoop] User profile updated:', this.userProfile);
  }

  /**
   * Get personalization prompt for next generation
   */
  getPersonalizationHint(): string {
    if (!this.userProfile) {
      return '';
    }
    return generatePersonalizationPrompt(this.userProfile);
  }
}

export const pipelineOrchestrator = new PipelineOrchestrator();
