import type { LucideIcon } from "lucide-react";
import {
  CircleDot,
  Gem,
  Orbit,
  Sparkles,
  Waves,
  Workflow,
} from "lucide-react";

import type {
  CadFormat,
  DesignStyle,
  Gemstone,
  JewelryType,
  Metal,
} from "./types";

export interface IconOption<T extends string> {
  id: T;
  label: string;
  icon: LucideIcon;
}

export interface SwatchOption<T extends string> {
  id: T;
  label: string;
  swatch: string;
}

export const JEWELRY_TYPE_OPTIONS: IconOption<JewelryType>[] = [
  { id: "ring", label: "Ring", icon: CircleDot },
  { id: "necklace", label: "Necklace", icon: Orbit },
  { id: "earrings", label: "Earrings", icon: Sparkles },
  { id: "bracelet", label: "Bracelet", icon: Waves },
  { id: "pendant", label: "Pendant", icon: Gem },
];

export const METAL_OPTIONS: SwatchOption<Metal>[] = [
  {
    id: "gold",
    label: "Gold",
    swatch: "linear-gradient(135deg, #F7D774 0%, #D4AF37 70%, #8B6B1D 100%)",
  },
  {
    id: "silver",
    label: "Silver",
    swatch: "linear-gradient(135deg, #D6DBE4 0%, #A3B0C2 70%, #7E8A99 100%)",
  },
  {
    id: "platinum",
    label: "Platinum",
    swatch: "linear-gradient(135deg, #EDF2F8 0%, #BAC6D6 70%, #8D99AB 100%)",
  },
  {
    id: "rose-gold",
    label: "Rose Gold",
    swatch: "linear-gradient(135deg, #F4D1C8 0%, #D7A18F 70%, #9D6757 100%)",
  },
];

export const GEMSTONE_OPTIONS: Array<{ id: Gemstone; label: string }> = [
  { id: "diamond", label: "Diamond" },
  { id: "ruby", label: "Ruby" },
  { id: "emerald", label: "Emerald" },
  { id: "sapphire", label: "Sapphire" },
  { id: "pearl", label: "Pearl" },
];

export const STYLE_OPTIONS: IconOption<DesignStyle>[] = [
  { id: "contemporary", label: "Contemporary", icon: Workflow },
  { id: "minimalist", label: "Minimalist", icon: CircleDot },
  { id: "vintage", label: "Vintage", icon: Orbit },
  { id: "temple", label: "Temple", icon: Gem },
  { id: "floral", label: "Floral", icon: Sparkles },
  { id: "geometric", label: "Geometric", icon: Waves },
];

export const CAD_FORMAT_OPTIONS: Array<{
  id: CadFormat;
  label: string;
  description: string;
}> = [
  {
    id: "step",
    label: "STEP",
    description: "Primary manufacturing geometry handoff.",
  },
  {
    id: "stl",
    label: "STL",
    description: "Rapid prototyping and print verification mesh.",
  },
  {
    id: "dxf",
    label: "DXF",
    description: "2D drafting export for workshop annotations.",
  },
];
