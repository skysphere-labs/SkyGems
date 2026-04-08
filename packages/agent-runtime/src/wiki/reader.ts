/**
 * WikiReader — Loads jewelry design knowledge from the wiki for agent context.
 *
 * Uses bundled content (static strings embedded at build time) instead of
 * filesystem access, making it compatible with Cloudflare Workers and any
 * other serverless environment without `node:fs`.
 *
 * The wiki follows Karpathy's LLM wiki pattern:
 * - Raw sources in knowledge/raw/ (immutable reference)
 * - Bundled into bundled-content.ts for runtime access
 */

import type { DesignDna } from "@skygems/shared";
import { WIKI_FILES } from "./bundled-content.ts";

function readRawFile(filename: string): string {
  return WIKI_FILES[filename] ?? "";
}

/**
 * Given a design DNA, extract the relevant sections from the wiki.
 * Returns a focused context string (~2000-3000 tokens) that the LLM
 * can use to craft an expert jewelry design prompt.
 */
export function getWikiContextForDesign(designDna: DesignDna): string {
  const sections: string[] = [];

  // 1. Get the jewelry type guide section
  const typesGuide = readRawFile("jewelry-types-guide.md");
  const typeSection = extractSection(typesGuide, designDna.jewelryType);
  if (typeSection) {
    sections.push(`## Jewelry Type: ${designDna.jewelryType}\n${typeSection}`);
  }

  // 2. Get the metal guide section
  const metalsGuide = readRawFile("metals-guide.md");
  const metalSection = extractSection(metalsGuide, designDna.metal);
  if (metalSection) {
    sections.push(`## Metal: ${designDna.metal}\n${metalSection}`);
  }

  // 3. Get gemstone sections
  const gemsGuide = readRawFile("gemstones-guide.md");
  for (const gem of designDna.gemstones) {
    const gemSection = extractSection(gemsGuide, gem);
    if (gemSection) {
      sections.push(`## Gemstone: ${gem}\n${gemSection}`);
    }
  }

  // 4. Get the style guide section
  const stylesGuide = readRawFile("design-styles-guide.md");
  const styleSection = extractSection(stylesGuide, designDna.style);
  if (styleSection) {
    sections.push(`## Style: ${designDna.style}\n${styleSection}`);
  }

  // 5. Get the setting type section
  const settingsGuide = readRawFile("gemstone-settings-guide.md");
  const settingSection = extractSection(settingsGuide, designDna.settingType);
  if (settingSection) {
    sections.push(`## Setting: ${designDna.settingType}\n${settingSection}`);
  }

  // 6. Get gemstone shape info if we can infer it from the setting/style
  const shapesGuide = readRawFile("gemstone-shapes-guide.md");
  // Try to find a relevant shape based on the design
  const shapeKeywords = inferRelevantShapes(designDna);
  for (const keyword of shapeKeywords.slice(0, 2)) {
    const shapeSection = extractSection(shapesGuide, keyword);
    if (shapeSection) {
      sections.push(`## Stone Shape: ${keyword}\n${shapeSection}`);
    }
  }

  // 7. Always include the prompt engineering guide
  const promptGuide = readRawFile("prompt-engineering-for-jewelry.md");
  if (promptGuide) {
    sections.push(`## Prompt Engineering Rules\n${promptGuide}`);
  }

  return sections.join("\n\n---\n\n");
}

/**
 * Load ALL wiki files as a single context string.
 * Used for free-text prompt enhancement where we don't have structured DNA to filter by.
 * Total content is ~10K tokens — well within LLM context limits.
 */
export function getFullWikiContext(): string {
  const files = [
    "prompt-engineering-for-jewelry.md",
    "jewelry-types-guide.md",
    "metals-guide.md",
    "gemstones-guide.md",
    "design-styles-guide.md",
    "gemstone-settings-guide.md",
    "gemstone-shapes-guide.md",
  ];
  return files.map(f => readRawFile(f)).filter(Boolean).join("\n\n---\n\n");
}

/**
 * Extract a section from a markdown document by heading keyword match.
 */
function extractSection(document: string, keyword: string): string {
  if (!document || !keyword) return "";

  const normalizedKeyword = keyword.toLowerCase().replace(/[-_]/g, " ");
  const lines = document.split("\n");
  let capturing = false;
  let captured: string[] = [];

  for (const line of lines) {
    if (line.startsWith("## ")) {
      if (capturing) break; // Hit next section
      if (line.toLowerCase().replace(/[-_]/g, " ").includes(normalizedKeyword)) {
        capturing = true;
        continue;
      }
    }
    if (capturing) {
      captured.push(line);
    }
  }

  return captured.join("\n").trim();
}

/**
 * Infer likely gemstone shapes based on design DNA.
 */
function inferRelevantShapes(designDna: DesignDna): string[] {
  const shapes: string[] = [];

  // Style-based shape inference
  if (designDna.style === "vintage" || designDna.style === "temple") {
    shapes.push("cushion", "rose cut");
  } else if (designDna.style === "contemporary" || designDna.style === "minimalist") {
    shapes.push("round brilliant", "princess");
  } else if (designDna.style === "geometric") {
    shapes.push("emerald cut", "asscher", "baguette");
  } else if (designDna.style === "floral") {
    shapes.push("oval", "pear");
  }

  // Gemstone-based shape inference
  if (designDna.gemstones.includes("emerald")) {
    shapes.push("emerald cut");
  }
  if (designDna.gemstones.includes("pearl")) {
    shapes.push("cabochon");
  }
  if (designDna.gemstones.includes("diamond")) {
    shapes.push("round brilliant");
  }

  // Deduplicate
  return [...new Set(shapes)];
}
