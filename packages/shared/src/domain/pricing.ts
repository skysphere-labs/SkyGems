/**
 * Metal and gemstone pricing data for BOM calculation.
 * Prices are realistic industry wholesale figures (USD).
 */

import type {
  BomLineItem,
  SpecAgentOutput,
} from "../contracts/agents.ts";
import type { DesignDna } from "../contracts/primitives.ts";
import type { Gemstone, Metal } from "../contracts/enums.ts";

// ── Metal pricing per gram (USD) ──

export const metalPricePerGram: Record<Metal, number> = {
  gold: 65, // 18K gold
  "rose-gold": 62, // 18K rose gold
  platinum: 32,
  silver: 0.8,
};

export const metalPurityLabels: Record<Metal, string> = {
  gold: "18K (75% Au)",
  "rose-gold": "18K (75% Au, Cu blend)",
  platinum: "950 Platinum",
  silver: "925 Sterling",
};

// ── Gemstone pricing per carat (USD, mid-quality wholesale) ──

export interface GemstonePriceRange {
  low: number;
  mid: number;
  high: number;
}

export const gemstonePricePerCarat: Record<Gemstone, GemstonePriceRange> = {
  diamond: { low: 5000, mid: 8500, high: 15000 },
  ruby: { low: 2000, mid: 5000, high: 12000 },
  emerald: { low: 1500, mid: 4000, high: 10000 },
  sapphire: { low: 1800, mid: 4500, high: 11000 },
  pearl: { low: 50, mid: 200, high: 800 },
};

// ── Default weights by jewelry type (grams of metal) ──

const defaultMetalWeightG: Record<string, number> = {
  ring: 6,
  necklace: 18,
  bracelet: 22,
  earrings: 4,
  pendant: 8,
};

// ── Default carat weights for primary and accent stones ──

const defaultPrimaryCaratWeight: Record<Gemstone, number> = {
  diamond: 1.0,
  ruby: 1.2,
  emerald: 1.5,
  sapphire: 1.2,
  pearl: 3.0, // in carat equivalent for pearl
};

const defaultAccentCaratWeight = 0.15;

// ── Retail markup multipliers ──

const RETAIL_MARKUP_LOW = 2.0;
const RETAIL_MARKUP_MID = 2.8;
const RETAIL_MARKUP_HIGH = 3.5;

// ── BOM calculator ──

export function calculateBom(
  designDna: DesignDna,
  specOutput: SpecAgentOutput,
): { items: BomLineItem[]; estimatedRetailPrice: { low: number; mid: number; high: number; currency: string } } {
  const items: BomLineItem[] = [];

  // Metal cost
  const metalWeight = defaultMetalWeightG[designDna.jewelryType] ?? 8;
  const metalUnitCost = metalPricePerGram[designDna.metal] ?? metalPricePerGram.gold;
  const metalTotalCost = round(metalWeight * metalUnitCost);

  items.push({
    item: `${metalPurityLabels[designDna.metal]} ${designDna.metal}`,
    quantity: metalWeight,
    unitCost: metalUnitCost,
    totalCost: metalTotalCost,
    source: "Market spot + alloy markup",
  });

  // Gemstone costs
  const gemstonesFromSpec = specOutput.materials.gemstones;
  for (const gemstone of gemstonesFromSpec) {
    const stoneKey = gemstone.stoneType as Gemstone;
    const priceRange = gemstonePricePerCarat[stoneKey];
    if (!priceRange) continue;

    const caratWeight =
      gemstone.role === "primary"
        ? (defaultPrimaryCaratWeight[stoneKey] ?? 1.0)
        : defaultAccentCaratWeight;
    const quantity = gemstone.quantity ?? (gemstone.role === "primary" ? 1 : 2);
    const unitCost = priceRange.mid;
    const totalCost = round(caratWeight * unitCost * quantity);

    items.push({
      item: `${gemstone.stoneType} (${gemstone.role}) ${caratWeight}ct`,
      quantity,
      unitCost: round(caratWeight * unitCost),
      totalCost,
      source: "Wholesale gem market (mid-quality)",
    });
  }

  // Manufacturing / labor cost
  const complexityFactor = 1 + (designDna.complexity / 100);
  const laborBase = designDna.jewelryType === "ring" ? 120 : designDna.jewelryType === "earrings" ? 100 : 180;
  const laborCost = round(laborBase * complexityFactor);

  items.push({
    item: "Manufacturing labor",
    quantity: 1,
    unitCost: laborCost,
    totalCost: laborCost,
    source: "Estimated bench labor",
  });

  // Setting labor for stones
  const totalStones = gemstonesFromSpec.reduce(
    (sum, g) => sum + (g.quantity ?? 1),
    0,
  );
  if (totalStones > 0) {
    const settingCostPerStone = 45;
    const settingTotal = round(totalStones * settingCostPerStone);
    items.push({
      item: "Stone setting labor",
      quantity: totalStones,
      unitCost: settingCostPerStone,
      totalCost: settingTotal,
      source: "Estimated setting labor",
    });
  }

  // Finishing
  const finishCost = specOutput.materials.finish?.includes("polish") ? 35 : 50;
  items.push({
    item: `Finishing (${specOutput.materials.finish ?? "standard"})`,
    quantity: 1,
    unitCost: finishCost,
    totalCost: finishCost,
    source: "Finishing estimate",
  });

  // Calculate retail price
  const totalMaterialsCost = items.reduce((s, i) => s + i.totalCost, 0);
  const estimatedRetailPrice = {
    low: round(totalMaterialsCost * RETAIL_MARKUP_LOW),
    mid: round(totalMaterialsCost * RETAIL_MARKUP_MID),
    high: round(totalMaterialsCost * RETAIL_MARKUP_HIGH),
    currency: "USD",
  };

  return { items, estimatedRetailPrice };
}

function round(n: number): number {
  return Math.round(n * 100) / 100;
}
