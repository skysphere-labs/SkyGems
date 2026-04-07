/**
 * Jewelry Prompt Builder — constructs 4 variation prompts from analyzed attributes
 *
 * Variation axes:
 * 1. material_swap — swap metals and stones to contrasting alternatives
 * 2. era_transposition — shift style era to a contrasting period
 * 3. finish_contrast — invert the surface finish
 * 4. scale_shift — change piece type and scale
 */

import type { JewelryAttributes } from './jewelryAnalysis';

export interface VariationPrompt {
  axis: string;
  label: string;
  description: string;
  prompt: string;
}

// ── Contrast mappings ──

const MATERIAL_SWAPS: Record<string, string> = {
  'yellow gold': 'oxidized sterling silver',
  'gold': 'oxidized sterling silver',
  '18k gold': 'blackened platinum',
  'white gold': 'warm rose gold',
  'rose gold': 'cool white gold',
  'silver': 'rich 22k yellow gold',
  'sterling silver': 'polished yellow gold',
  'platinum': 'brushed rose gold',
  'copper': 'polished platinum',
};

const GEMSTONE_SWAPS: Record<string, string> = {
  'diamond': 'deep red garnet',
  'ruby': 'icy blue aquamarine',
  'emerald': 'vivid orange fire opal',
  'sapphire': 'warm golden citrine',
  'pearl': 'faceted black onyx',
  'amethyst': 'peridot',
  'topaz': 'tanzanite',
  'opal': 'black diamond',
  'garnet': 'moonstone',
};

const ERA_SWAPS: Record<string, string> = {
  'art deco': 'Mughal-inspired',
  'art nouveau': 'Brutalist modern',
  'victorian': 'contemporary minimalist',
  'minimalist': 'ornate Victorian',
  'modern': 'Renaissance revival',
  'contemporary': 'Art Nouveau organic',
  'vintage': 'futuristic avant-garde',
  'baroque': 'Scandinavian minimalist',
  'edwardian': 'Japanese wabi-sabi',
  'retro': 'ancient Egyptian',
  'traditional': 'deconstructed modern',
  'classical': 'cyberpunk futuristic',
};

const FINISH_SWAPS: Record<string, string> = {
  'high polish': 'hammered matte',
  'polished': 'hammered matte',
  'mirror polish': 'raw textured',
  'matte': 'mirror-polished high shine',
  'brushed': 'granulated texture',
  'hammered': 'sleek high polish',
  'textured': 'smooth mirror finish',
  'satin': 'heavily hammered',
  'sandblasted': 'liquid mirror polish',
  'granulated': 'smooth polished',
  'oxidized': 'bright polished',
  'florentine': 'sleek contemporary polish',
};

const SCALE_SWAPS: Record<string, string> = {
  'ring': 'statement pendant necklace',
  'pendant': 'bold cocktail ring',
  'necklace': 'dramatic chandelier earrings',
  'earrings': 'wide cuff bracelet',
  'bracelet': 'brooch',
  'brooch': 'delicate stacking ring',
  'bangle': 'pendant choker',
  'cuff': 'drop earrings',
  'chain': 'charm bracelet',
  'choker': 'long pendant necklace',
};

function findSwap(value: string, mapping: Record<string, string>): string {
  const lower = value.toLowerCase();
  // Exact match
  if (mapping[lower]) return mapping[lower];
  // Partial match
  for (const [key, swap] of Object.entries(mapping)) {
    if (lower.includes(key) || key.includes(lower)) return swap;
  }
  // Fallback
  const values = Object.values(mapping);
  return values[Math.floor(Math.random() * values.length)];
}

function swapAll(items: string[], mapping: Record<string, string>): string[] {
  if (items.length === 0) return [Object.values(mapping)[0]];
  return items.map((item) => findSwap(item, mapping));
}

function buildPrompt(attrs: {
  piece_type: string;
  style_era: string;
  silhouette_form: string;
  materials: string;
  gemstones: string;
  finish_texture: string;
  motifs: string;
  mood: string;
}): string {
  return `${attrs.piece_type}, ${attrs.style_era} design, ${attrs.silhouette_form} form, crafted in ${attrs.materials}, set with ${attrs.gemstones}, ${attrs.finish_texture} surface, ${attrs.motifs} motifs, ${attrs.mood} aesthetic, jewelry product photography, studio lighting, white gradient background, macro detail, 8k, photorealistic`;
}

/**
 * Build 4 variation prompts from analyzed jewelry attributes.
 */
export function buildVariationPrompts(attrs: JewelryAttributes): VariationPrompt[] {
  const materialsStr = attrs.materials.join(' and ') || 'gold';
  const gemstonesStr = attrs.gemstones.join(' and ') || 'no gemstones';
  const finishStr = attrs.finish_texture.join(' and ') || 'polished';
  const motifsStr = attrs.motifs.join(' and ') || 'minimal';

  // 1. Material Swap
  const swappedMaterials = swapAll(attrs.materials, MATERIAL_SWAPS).join(' and ');
  const swappedGemstones = swapAll(attrs.gemstones, GEMSTONE_SWAPS).join(' and ');

  // 2. Era Transposition
  const swappedEra = findSwap(attrs.style_era, ERA_SWAPS);

  // 3. Finish Contrast
  const swappedFinish = swapAll(attrs.finish_texture, FINISH_SWAPS).join(' and ');

  // 4. Scale Shift
  const swappedPiece = findSwap(attrs.piece_type, SCALE_SWAPS);

  return [
    {
      axis: 'material_swap',
      label: 'Material Swap',
      description: `${materialsStr} → ${swappedMaterials}, ${gemstonesStr} → ${swappedGemstones}`,
      prompt: buildPrompt({
        piece_type: attrs.piece_type,
        style_era: attrs.style_era,
        silhouette_form: attrs.silhouette_form,
        materials: swappedMaterials,
        gemstones: swappedGemstones,
        finish_texture: finishStr,
        motifs: motifsStr,
        mood: attrs.mood,
      }),
    },
    {
      axis: 'era_transposition',
      label: 'Era Transposition',
      description: `${attrs.style_era} → ${swappedEra}`,
      prompt: buildPrompt({
        piece_type: attrs.piece_type,
        style_era: swappedEra,
        silhouette_form: attrs.silhouette_form,
        materials: materialsStr,
        gemstones: gemstonesStr,
        finish_texture: finishStr,
        motifs: motifsStr,
        mood: attrs.mood,
      }),
    },
    {
      axis: 'finish_contrast',
      label: 'Finish Contrast',
      description: `${finishStr} → ${swappedFinish}`,
      prompt: buildPrompt({
        piece_type: attrs.piece_type,
        style_era: attrs.style_era,
        silhouette_form: attrs.silhouette_form,
        materials: materialsStr,
        gemstones: gemstonesStr,
        finish_texture: swappedFinish,
        motifs: motifsStr,
        mood: attrs.mood,
      }),
    },
    {
      axis: 'scale_shift',
      label: 'Scale Shift',
      description: `${attrs.piece_type} → ${swappedPiece}`,
      prompt: buildPrompt({
        piece_type: swappedPiece,
        style_era: attrs.style_era,
        silhouette_form: attrs.silhouette_form,
        materials: materialsStr,
        gemstones: gemstonesStr,
        finish_texture: finishStr,
        motifs: motifsStr,
        mood: attrs.mood,
      }),
    },
  ];
}
