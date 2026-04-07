import type { RefinePreserve } from "@skygems/shared";

export interface EditingToolPreset {
  id: string;
  label: string;
  icon: string;
  description: string;
  refineInstruction: string;
  preserve: RefinePreserve[];
}

export const editingToolPresets: EditingToolPreset[] = [
  {
    id: "swap_material",
    label: "Swap Material",
    icon: "Repeat",
    description: "Replace the primary metal or material while keeping the overall design intact.",
    refineInstruction:
      "Swap the primary metal/material of this design to a different option while preserving the silhouette and gemstone placement.",
    preserve: ["gemstones", "style", "silhouette"],
  },
  {
    id: "swap_gemstone",
    label: "Swap Gemstone",
    icon: "Gem",
    description: "Replace the primary gemstone with a different stone type.",
    refineInstruction:
      "Replace the primary gemstone with a different stone while preserving the metal, silhouette, and overall style.",
    preserve: ["metal", "style", "silhouette"],
  },
  {
    id: "change_angle",
    label: "Change Angle",
    icon: "RotateCcw",
    description: "Re-render from a different viewing angle or perspective.",
    refineInstruction:
      "Generate this design from a different viewing angle while keeping every design detail identical.",
    preserve: ["metal", "gemstones", "style", "silhouette"],
  },
  {
    id: "change_background",
    label: "Change Background",
    icon: "Image",
    description: "Place the design on a different background or scene.",
    refineInstruction:
      "Change the background/scene for this design while keeping the jewelry itself completely unchanged.",
    preserve: ["metal", "gemstones", "style", "silhouette"],
  },
  {
    id: "adjust_scale",
    label: "Adjust Scale",
    icon: "Maximize2",
    description: "Resize proportions or adjust the overall scale of the piece.",
    refineInstruction:
      "Adjust the overall scale and proportions of this design, making it slightly larger or more prominent while preserving the style.",
    preserve: ["metal", "gemstones", "style"],
  },
  {
    id: "add_inscription",
    label: "Add Inscription",
    icon: "Type",
    description: "Add engraved text or monogram details to the piece.",
    refineInstruction:
      "Add an elegant inscription or engraved text detail to this design without altering the existing form.",
    preserve: ["metal", "gemstones", "style", "silhouette"],
  },
  {
    id: "erase_oddities",
    label: "Erase Oddities",
    icon: "Eraser",
    description: "Clean up artifacts, extra fingers, or AI rendering glitches.",
    refineInstruction:
      "Clean up any visual artifacts, oddities, or AI-generated inconsistencies in this design while keeping the intended design exactly the same.",
    preserve: ["metal", "gemstones", "style", "silhouette"],
  },
  {
    id: "swap_findings",
    label: "Swap Findings",
    icon: "Link",
    description: "Replace clasps, prongs, bezels, or other hardware components.",
    refineInstruction:
      "Replace the findings (clasps, prongs, bezels, or hardware) with a different style while preserving the overall design.",
    preserve: ["metal", "gemstones", "style"],
  },
  {
    id: "pair_gems",
    label: "Pair Gems",
    icon: "Combine",
    description: "Combine or pair multiple gemstones in the design.",
    refineInstruction:
      "Add complementary accent gemstones paired with the primary stone to create a richer gemstone arrangement.",
    preserve: ["metal", "style", "silhouette"],
  },
  {
    id: "upscale",
    label: "Upscale",
    icon: "ZoomIn",
    description: "Increase the resolution and detail level of the render.",
    refineInstruction:
      "Upscale this design render to a higher resolution with sharper details while keeping the design perfectly faithful.",
    preserve: ["metal", "gemstones", "style", "silhouette"],
  },
  {
    id: "relight",
    label: "Relight",
    icon: "Sun",
    description: "Change the lighting setup for a different mood or emphasis.",
    refineInstruction:
      "Re-light this design with different lighting conditions to better showcase the materials and gemstones.",
    preserve: ["metal", "gemstones", "style", "silhouette"],
  },
  {
    id: "add_texture",
    label: "Add Texture",
    icon: "Layers",
    description: "Apply surface textures like hammered, brushed, or engraved finishes.",
    refineInstruction:
      "Add surface texture detail (hammered, brushed, or engraved finish) to the metal surfaces while preserving the form.",
    preserve: ["gemstones", "style", "silhouette"],
  },
  {
    id: "simplify",
    label: "Simplify",
    icon: "Minus",
    description: "Strip away complexity for a cleaner, more minimal design.",
    refineInstruction:
      "Simplify this design by removing ornamental complexity and refining it toward a cleaner, more minimal aesthetic.",
    preserve: ["metal", "gemstones"],
  },
  {
    id: "make_luxurious",
    label: "Make Luxurious",
    icon: "Crown",
    description: "Elevate the design with richer materials and premium detailing.",
    refineInstruction:
      "Elevate this design toward a more luxurious expression with richer detailing, premium finishes, and a more opulent feel.",
    preserve: ["silhouette"],
  },
  {
    id: "tighten_silhouette",
    label: "Tighten Silhouette",
    icon: "Shrink",
    description: "Refine the outer profile for a more precise, controlled form.",
    refineInstruction:
      "Tighten the silhouette of this design, refining the outer profile for a more precise and controlled form without losing key features.",
    preserve: ["metal", "gemstones", "style"],
  },
  {
    id: "push_gemstone_hierarchy",
    label: "Push Gem Hierarchy",
    icon: "ArrowUpCircle",
    description: "Rebalance gemstone prominence so the hero stone dominates.",
    refineInstruction:
      "Rebalance the gemstone hierarchy so the primary hero stone is more visually dominant relative to accent stones.",
    preserve: ["metal", "style", "silhouette"],
  },
];
