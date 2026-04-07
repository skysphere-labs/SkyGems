import type { ArtifactKind, Gemstone, JewelryType, Metal, Style } from "../contracts/enums.ts";

export const jewelryTypeOptions = [
  { id: "ring", label: "Ring" },
  { id: "necklace", label: "Necklace" },
  { id: "earrings", label: "Earrings" },
  { id: "bracelet", label: "Bracelet" },
  { id: "pendant", label: "Pendant" },
] as const satisfies ReadonlyArray<{ id: JewelryType; label: string }>;

export const metalOptions = [
  { id: "gold", label: "Gold" },
  { id: "silver", label: "Silver" },
  { id: "platinum", label: "Platinum" },
  { id: "rose-gold", label: "Rose Gold" },
] as const satisfies ReadonlyArray<{ id: Metal; label: string }>;

export const gemstoneOptions = [
  { id: "diamond", label: "Diamond" },
  { id: "ruby", label: "Ruby" },
  { id: "emerald", label: "Emerald" },
  { id: "sapphire", label: "Sapphire" },
  { id: "pearl", label: "Pearl" },
] as const satisfies ReadonlyArray<{ id: Gemstone; label: string }>;

export const styleOptions = [
  { id: "temple", label: "Temple" },
  { id: "vintage", label: "Vintage" },
  { id: "floral", label: "Floral" },
  { id: "geometric", label: "Geometric" },
  { id: "contemporary", label: "Contemporary" },
  { id: "minimalist", label: "Minimalist" },
] as const satisfies ReadonlyArray<{ id: Style; label: string }>;

export const typeCompositionPrompts: Record<JewelryType, string> = {
  ring:
    "A jewelry design sheet showing TWO hand-drawn views of the same finger ring on white paper: a FRONT VIEW showing the ring face-on with the setting visible and a TOP VIEW from directly above showing the band as a circle with the head and crown. Both views are side by side with clear spacing. The full ring is visible in each view with nothing cropped.",
  necklace:
    "A jewelry design sheet showing TWO hand-drawn views of the same necklace on white paper: a FRONT VIEW with the complete necklace laid in a U-shape from clasp to clasp and a DETAIL VIEW of the pendant from the front showing the bail and setting. Both views are side by side. The entire necklace is visible in the front view with nothing cropped.",
  earrings:
    "A jewelry design sheet showing TWO hand-drawn views of the same earring on white paper: a FRONT VIEW showing the earring face-on from ear wire to lowest point and a SIDE PROFILE VIEW showing depth and construction. Also show the matching pair. All views are clearly separated and nothing is cropped.",
  bracelet:
    "A jewelry design sheet showing TWO hand-drawn views of the same bracelet on white paper: a TOP VIEW of the complete bracelet as a closed oval from above with the clasp visible and a SIDE PROFILE VIEW showing the bracelet edge-on to reveal width and thickness. Both views are side by side and the full bracelet is visible with nothing cropped.",
  pendant:
    "A jewelry design sheet showing TWO hand-drawn views of the same pendant on white paper: a FRONT VIEW showing the pendant face-on with the bail at the top and a SIDE PROFILE VIEW showing depth and construction. Both views are side by side with nothing cropped.",
};

export const metalDescriptions: Record<Metal, string> = {
  gold: "18K polished yellow gold with warm reflections",
  silver: "sterling silver with bright cool reflections",
  platinum: "polished platinum with white metallic sheen",
  "rose-gold": "14K rose gold with warm pink-copper tones",
};

export const gemstoneDescriptions: Record<Gemstone, string> = {
  diamond: "brilliant-cut clear diamond with rainbow fire",
  ruby: "faceted deep red ruby",
  emerald: "emerald-cut green emerald",
  sapphire: "cushion-cut blue sapphire",
  pearl: "round white Akoya pearl with lustre",
};

export const styleDescriptions: Record<Style, string> = {
  contemporary: "modern minimalist with clean lines and artistic asymmetry",
  minimalist: "ultra-minimal, every element essential, no ornament",
  vintage: "vintage-inspired with milgrain edges and filigree details",
  temple: "traditional temple jewelry motifs with peacock, lotus, and paisley influence",
  floral: "organic botanical forms with petals, leaves, and flowing vines",
  geometric: "geometric and architectural with clean angles and structured symmetry",
};

export const defaultNegativePrompt =
  "cropped composition, incomplete jewelry, extra pieces, labels, captions, watermark, logo, hands, fingers, ears, neck, body parts, mannequin, packaging, low detail, blurry";

export const productRenderDirectives = {
  background:
    "Pure white or very soft light-to-white gradient background with no distracting elements.",
  lighting:
    "Professional studio lighting setup with soft key light and balanced fill light for even illumination, gentle specular highlights on metal, and controlled gemstone brilliance.",
  composition:
    "Clean, centered composition with the piece as the sole hero object. Balanced negative space around the jewelry. No lifestyle context, props, or environmental elements.",
  quality:
    "E-commerce catalog quality suitable for product listing. Sharp focus across the entire piece, accurate color reproduction, and premium material detail.",
  framing:
    "Single hero product shot. The complete piece is visible with no cropping. Slight elevation angle for depth, consistent with luxury product photography conventions.",
} as const;

export const productRenderNegativePrompt =
  "lifestyle scene, model, body parts, hands, fingers, ears, neck, mannequin, props, flowers, fabric, colored background, busy background, bokeh, artistic blur, watermark, logo, text, labels, packaging, shadows on colored surface, low resolution, noise";

export const artifactFileNames: Record<ArtifactKind, string> = {
  pair_sketch_png: "sketch.png",
  pair_render_png: "render.png",
  tech_sheet_json: "sheet.json",
  tech_sheet_pdf: "sheet.pdf",
  svg_front: "front.svg",
  svg_side: "side.svg",
  svg_top: "top.svg",
  svg_annotations_json: "annotations.json",
  cad_step: "model.step",
  cad_dxf: "model.dxf",
  cad_stl: "model.stl",
  cad_package_zip: "package.zip",
  cad_qa_report_json: "qa-report.json",
};
