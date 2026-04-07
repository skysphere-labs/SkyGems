/**
 * Core data structures for the multi-agent design pipeline
 */

export interface DesignSpec {
  type: string;
  metal: string;
  gemstones: string[];
  style: string;
  complexity: 'simple' | 'moderate' | 'complex';
  constraints?: string[];
  inspirationHints?: string[];
}

export interface Direction {
  id: string;
  conceptName: string;
  description: string;
  designIntent: string;
}

export interface CriticScore {
  designId: string;
  scores: {
    adherence: number; // 0-100: How well does it follow the brief
    brandFit: number; // 0-100: Fits luxury jewelry brand standards
    manufacturability: number; // 0-100: Can be made with available techniques
    consistency: number; // 0-100: Multi-view consistency
    appeal: number; // 0-100: Overall luxury appeal
  };
  totalScore: number; // Average of all scores
  feedback?: string;
}

export interface GeneratedDesign {
  id: string;
  directionId: string;
  variantNumber: number; // 1-5
  imageUrl: string;
  prompt: string;
  metadata: {
    generatedAt: string;
    model: string;
  };
}

export interface ScoredDesign extends GeneratedDesign {
  score: CriticScore;
}

export interface RefiningResult {
  id: string;
  originalDesignId: string;
  refinedImageUrl: string;
  improvements: string[];
}

export interface SceneRender {
  id: string;
  designId: string;
  imageUrl: string;
  context: string; // e.g., "woman's hand", "luxury setting"
}

export interface InspirationContent {
  title: string;
  description: string;
  keyFeatures: string[];
  designPhilosophy: string;
}

export interface TechnicalPack {
  designId: string;
  lineArt: string;
  multiViewImages: {
    front: string;
    side: string;
    top: string;
    detail: string;
  };
  dimensions?: {
    width: number;
    height: number;
    depth: number;
  };
  specifications: string[];
}

export interface PipelineInput {
  designSpec: DesignSpec;
  userSketch?: string;
  additionalNotes?: string;
}

export interface PipelineResult {
  designs: ScoredDesign[];
  scenes: SceneRender[];
  inspiration: InspirationContent;
  techPack: TechnicalPack;
}

export interface AgentExecutionUpdate {
  step: string;
  status: 'running' | 'completed' | 'error';
  message: string;
  progress: number; // 0-100
  timestamp: string;
}
