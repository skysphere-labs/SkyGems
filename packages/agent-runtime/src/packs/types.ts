import type {
  Gemstone,
  JewelryType,
  Metal,
  PromptPreviewProvider,
  Style,
} from "@skygems/shared";

export interface PromptPackProviderDirectives {
  sketch: string;
  render: string;
}

export interface ViewDefinition {
  id: string;
  label: string;
  instruction: string;
}

export interface ViewPlan {
  jewelryType: JewelryType;
  compositionPrompt: string;
  views: ViewDefinition[];
}

export interface PromptPackContent {
  typeCompositionPrompts: Record<JewelryType, string>;
  metalDescriptions: Record<Metal, string>;
  gemstoneDescriptions: Record<Gemstone, string>;
  styleDescriptions: Record<Style, string>;
  defaultNegativePrompt: string;
  providerDirectives: Record<PromptPreviewProvider, PromptPackProviderDirectives>;
  sketchRenderingStyle: string;
  renderRenderingStyle: string;
  wholePieceConstraint: string;
}

export interface PromptPackRelease {
  packId: "prompt-pack";
  version: string;
  content: PromptPackContent;
}

export interface ViewPackContent {
  plans: Record<JewelryType, ViewPlan>;
}

export interface ViewPackRelease {
  packId: "view-pack";
  version: string;
  content: ViewPackContent;
}
