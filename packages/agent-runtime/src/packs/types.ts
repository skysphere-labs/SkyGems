import type { Gemstone, JewelryType, Metal, Style } from "@skygems/shared";

export interface PromptPackContent {
  typeCompositionPrompts: Record<JewelryType, string>;
  metalDescriptions: Record<Metal, string>;
  gemstoneDescriptions: Record<Gemstone, string>;
  styleDescriptions: Record<Style, string>;
  defaultNegativePrompt: string;
}

export interface PromptPackRelease {
  packId: "prompt-pack";
  version: string;
  content: PromptPackContent;
}
