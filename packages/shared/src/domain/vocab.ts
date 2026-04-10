import type { ArtifactKind, Gemstone, JewelryType, Metal, Style } from "../contracts/enums.ts";

export const jewelryTypeOptions = [
  { id: "ring", label: "Ring" },
  { id: "necklace", label: "Necklace" },
  { id: "earrings", label: "Earrings" },
  { id: "bracelet", label: "Bracelet" },
  { id: "pendant", label: "Pendant" },
  { id: "anklet", label: "Anklet" },
  { id: "brooch", label: "Brooch" },
  { id: "tiara", label: "Tiara" },
  { id: "body-chain", label: "Body Chain" },
  { id: "hair-jewelry", label: "Hair Jewelry" },
  { id: "cufflinks", label: "Cufflinks" },
  { id: "nose-ring", label: "Nose Ring" },
  { id: "toe-ring", label: "Toe Ring" },
] as const satisfies ReadonlyArray<{ id: JewelryType; label: string }>;

export const metalOptions = [
  { id: "gold", label: "Gold" },
  { id: "white-gold", label: "White Gold" },
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
  { id: "amethyst", label: "Amethyst" },
  { id: "topaz", label: "Topaz" },
  { id: "garnet", label: "Garnet" },
  { id: "aquamarine", label: "Aquamarine" },
  { id: "tourmaline", label: "Tourmaline" },
  { id: "peridot", label: "Peridot" },
  { id: "citrine", label: "Citrine" },
  { id: "tanzanite", label: "Tanzanite" },
  { id: "coral", label: "Coral" },
  { id: "turquoise", label: "Turquoise" },
  { id: "lapis-lazuli", label: "Lapis Lazuli" },
  { id: "opal", label: "Opal" },
  { id: "onyx", label: "Onyx" },
  { id: "moonstone", label: "Moonstone" },
  { id: "labradorite", label: "Labradorite" },
  { id: "moissanite", label: "Moissanite" },
  { id: "cubic-zirconia", label: "Cubic Zirconia" },
  { id: "lab-diamond", label: "Lab Diamond" },
  { id: "none", label: "No Stones" },
] as const satisfies ReadonlyArray<{ id: Gemstone; label: string }>;

export const styleOptions = [
  { id: "temple", label: "Temple" },
  { id: "vintage", label: "Vintage" },
  { id: "floral", label: "Floral" },
  { id: "geometric", label: "Geometric" },
  { id: "contemporary", label: "Contemporary" },
  { id: "minimalist", label: "Minimalist" },
  { id: "fine", label: "Fine Jewelry" },
  { id: "art-deco", label: "Art Deco" },
  { id: "art-nouveau", label: "Art Nouveau" },
  { id: "futuristic", label: "Futuristic" },
  { id: "kundan", label: "Kundan" },
  { id: "middle-eastern", label: "Middle Eastern" },
  { id: "east-asian", label: "East Asian" },
  { id: "african-tribal", label: "African Tribal" },
  { id: "bohemian", label: "Bohemian" },
  { id: "gothic", label: "Gothic" },
  { id: "punk", label: "Punk" },
  { id: "streetwear", label: "Streetwear" },
  { id: "steampunk", label: "Steampunk" },
  { id: "cyberpunk", label: "Cyberpunk" },
  { id: "cottagecore", label: "Cottagecore" },
  { id: "spiritual", label: "Spiritual" },
] as const satisfies ReadonlyArray<{ id: Style; label: string }>;

// ── View Catalog ──
// Each jewelry type has a set of canonical camera views. When generating
// multiple concepts the agent distributes different views across concepts
// so the designer sees every important angle in a single batch.

export interface ViewDefinition {
  /** Stable identifier used in variationOverrides.viewId */
  id: string;
  /** Human-readable label shown in the UI */
  label: string;
  /** Full composition/framing prompt injected into the image-generation prompt */
  compositionPrompt: string;
}

export const VIEW_CATALOG: Record<JewelryType, ViewDefinition[]> = {
  ring: [
    {
      id: "ring-front",
      label: "Front View",
      compositionPrompt:
        "A single hero shot of the ring on a pure white background. The ring is shown FRONT VIEW face-on, slightly tilted toward the camera so the setting, head, and shank are all visible. The complete ring is visible with nothing cropped. Studio lighting with soft key light.",
    },
    {
      id: "ring-three-quarter",
      label: "Three-Quarter View",
      compositionPrompt:
        "A single hero shot of the ring on a pure white background. The ring is shown at a THREE-QUARTER ANGLE (approximately 45 degrees) revealing both the front face of the setting and the side profile of the shank simultaneously. The complete ring is visible with nothing cropped. Professional studio lighting.",
    },
    {
      id: "ring-top",
      label: "Top-Down View",
      compositionPrompt:
        "A single hero shot of the ring on a pure white background. The ring is shown TOP-DOWN from directly above, the band forming a perfect circle with the crown and head in the center. The complete ring is visible with nothing cropped. Even studio lighting.",
    },
    {
      id: "ring-side-profile",
      label: "Side Profile",
      compositionPrompt:
        "A single hero shot of the ring on a pure white background. The ring is shown in clean SIDE PROFILE, revealing the height of the setting, the curve of the shank, and the gallery details. The complete ring is visible with nothing cropped. Rim-lit studio setup.",
    },
  ],
  necklace: [
    {
      id: "necklace-front-crescent",
      label: "Full Front Crescent",
      compositionPrompt:
        "A single hero shot on a pure white background. The complete necklace is laid flat in a gentle U-shaped CRESCENT from clasp to clasp, pendant centered at the lowest point. The entire chain, all links, and the pendant are fully visible with nothing cropped. Overhead studio lighting.",
    },
    {
      id: "necklace-pendant-detail",
      label: "Pendant Detail",
      compositionPrompt:
        "A close-up DETAIL VIEW of the necklace pendant on a pure white background. The pendant is shown face-on with the bail at top, filling most of the frame. Show gemstone facets, metal texture, and setting construction clearly. Nothing cropped. Macro studio lighting.",
    },
    {
      id: "necklace-clasp-detail",
      label: "Clasp & Chain Detail",
      compositionPrompt:
        "A DETAIL VIEW showing the clasp mechanism and a section of the chain on a pure white background. Reveal the chain link style, clasp type, and jump ring connections. Sharp focus on metalwork details. Nothing cropped. Studio lighting.",
    },
    {
      id: "necklace-draped",
      label: "Draped Display",
      compositionPrompt:
        "The necklace displayed in a natural DRAPED position on a pure white background, as if hanging on an invisible bust. The chain forms a gentle arc and the pendant hangs naturally at center. The complete necklace is visible with nothing cropped. Soft studio lighting.",
    },
  ],
  earrings: [
    {
      id: "earrings-front-pair",
      label: "Front Pair View",
      compositionPrompt:
        "A single hero shot on a pure white background. Both earrings of the matching pair are shown FRONT VIEW side by side with even spacing, each displayed face-on from ear wire to lowest point. The complete earrings are visible with nothing cropped. Balanced studio lighting.",
    },
    {
      id: "earrings-single-detail",
      label: "Single Earring Detail",
      compositionPrompt:
        "A close-up DETAIL VIEW of one earring on a pure white background. The earring is shown face-on, filling the frame to reveal gemstone settings, metalwork texture, and construction details. Nothing cropped. Macro studio lighting.",
    },
    {
      id: "earrings-side-profile",
      label: "Side Profile",
      compositionPrompt:
        "A SIDE PROFILE VIEW of one earring on a pure white background, showing the depth, curvature, and construction from ear wire through the body to the lowest point. The complete earring is visible with nothing cropped. Rim-lit studio lighting.",
    },
    {
      id: "earrings-angled",
      label: "Three-Quarter Angle",
      compositionPrompt:
        "Both earrings shown at a THREE-QUARTER ANGLE on a pure white background, revealing depth and dimension while keeping the front decorative face visible. The complete pair is visible with nothing cropped. Professional studio lighting.",
    },
  ],
  bracelet: [
    {
      id: "bracelet-top-oval",
      label: "Top-Down Oval",
      compositionPrompt:
        "A single hero shot on a pure white background. The bracelet is shown TOP-DOWN from directly above, laid flat as a closed oval. The clasp, all links or segments, and decorative elements are fully visible. Nothing cropped. Even overhead studio lighting.",
    },
    {
      id: "bracelet-side-profile",
      label: "Side Profile",
      compositionPrompt:
        "A SIDE PROFILE VIEW of the bracelet on a pure white background, shown edge-on to reveal the width, thickness, and cross-section of the design. The complete bracelet is visible with nothing cropped. Rim-lit studio setup.",
    },
    {
      id: "bracelet-clasp-detail",
      label: "Clasp Detail",
      compositionPrompt:
        "A close-up DETAIL VIEW of the bracelet clasp mechanism and adjacent links on a pure white background. Show the clasp type, hinge, safety catch, and connection details. Sharp focus. Nothing cropped. Macro studio lighting.",
    },
    {
      id: "bracelet-three-quarter",
      label: "Three-Quarter View",
      compositionPrompt:
        "The bracelet shown at a THREE-QUARTER ANGLE on a pure white background, partially open, revealing the interior finish, the exterior design, and the clasp. The complete bracelet is visible with nothing cropped. Professional studio lighting.",
    },
  ],
  pendant: [
    {
      id: "pendant-front",
      label: "Front View",
      compositionPrompt:
        "A single hero shot on a pure white background. The pendant is shown FRONT VIEW face-on with the bail at top. The complete pendant shape, gemstone settings, and decorative details are fully visible. Nothing cropped. Studio lighting.",
    },
    {
      id: "pendant-side-profile",
      label: "Side Profile",
      compositionPrompt:
        "A SIDE PROFILE VIEW of the pendant on a pure white background, revealing depth, gallery construction, and the bail attachment. The complete pendant is visible with nothing cropped. Rim-lit studio lighting.",
    },
    {
      id: "pendant-back",
      label: "Back View",
      compositionPrompt:
        "A BACK VIEW of the pendant on a pure white background, showing the reverse construction, bail attachment point, and any hallmarks or finishing details. The complete pendant is visible with nothing cropped. Even studio lighting.",
    },
    {
      id: "pendant-three-quarter",
      label: "Three-Quarter View",
      compositionPrompt:
        "The pendant shown at a THREE-QUARTER ANGLE on a pure white background, revealing both front decorative face and side depth simultaneously. The complete pendant is visible with nothing cropped. Professional studio lighting.",
    },
  ],
  anklet: [
    {
      id: "anklet-full-layout",
      label: "Full Layout",
      compositionPrompt:
        "A single hero shot on a pure white background. The anklet is laid flat in a gentle oval from clasp to clasp, all charms and decorative elements visible. Nothing cropped. Overhead studio lighting.",
    },
    {
      id: "anklet-charm-detail",
      label: "Charm Detail",
      compositionPrompt:
        "A close-up DETAIL VIEW of the anklet's decorative charms and chain links on a pure white background. Sharp focus on metalwork and charm details. Nothing cropped. Macro studio lighting.",
    },
    {
      id: "anklet-clasp-detail",
      label: "Clasp Detail",
      compositionPrompt:
        "A DETAIL VIEW of the anklet clasp and extender chain on a pure white background. Show clasp mechanism and chain style clearly. Nothing cropped. Studio lighting.",
    },
    {
      id: "anklet-draped",
      label: "Draped Display",
      compositionPrompt:
        "The anklet displayed in a natural DRAPED circle on a pure white background, as if resting on an invisible ankle. Natural fall showing chain weight and charm movement. Nothing cropped. Soft studio lighting.",
    },
  ],
  brooch: [
    {
      id: "brooch-front",
      label: "Front View",
      compositionPrompt:
        "A single hero shot on a pure white background. The brooch is shown FRONT VIEW face-on, all decorative elements, gemstones, and surface details fully visible. Nothing cropped. Studio lighting.",
    },
    {
      id: "brooch-back",
      label: "Back & Pin View",
      compositionPrompt:
        "A BACK VIEW of the brooch on a pure white background, showing the pin mechanism, hinge, clasp, and reverse construction. Nothing cropped. Even studio lighting.",
    },
    {
      id: "brooch-three-quarter",
      label: "Three-Quarter View",
      compositionPrompt:
        "The brooch at a THREE-QUARTER ANGLE on a pure white background, showing both the front decorative surface and the side depth. Nothing cropped. Professional studio lighting.",
    },
    {
      id: "brooch-detail",
      label: "Surface Detail",
      compositionPrompt:
        "A macro DETAIL VIEW of the brooch surface on a pure white background, revealing gemstone settings, enamel work, or metalwork texture at close range. Nothing cropped. Macro studio lighting.",
    },
  ],
  tiara: [
    {
      id: "tiara-front",
      label: "Front View",
      compositionPrompt:
        "A single hero shot on a pure white background. The tiara is shown FRONT VIEW face-on, the full arc visible from end to end with all decorative peaks and gemstones. Nothing cropped. Studio lighting.",
    },
    {
      id: "tiara-side",
      label: "Side Profile",
      compositionPrompt:
        "A SIDE PROFILE of the tiara on a pure white background, showing the height of the peaks, the curve of the band, and the depth of the decorative elements. Nothing cropped. Rim-lit studio lighting.",
    },
    {
      id: "tiara-three-quarter",
      label: "Three-Quarter View",
      compositionPrompt:
        "The tiara at a THREE-QUARTER ANGLE on a pure white background, showing the front face and the side curve simultaneously. Nothing cropped. Professional studio lighting.",
    },
    {
      id: "tiara-top",
      label: "Top-Down View",
      compositionPrompt:
        "A TOP-DOWN VIEW of the tiara on a pure white background, showing the arc shape, spacing of decorative elements, and overall symmetry. Nothing cropped. Overhead studio lighting.",
    },
  ],
  "body-chain": [
    {
      id: "body-chain-full-layout",
      label: "Full Layout",
      compositionPrompt:
        "A single hero shot on a pure white background. The body chain is laid flat showing the complete layout — all chains, connecting points, and the central decorative element. Nothing cropped. Overhead studio lighting.",
    },
    {
      id: "body-chain-center-detail",
      label: "Center Detail",
      compositionPrompt:
        "A close-up DETAIL VIEW of the body chain's central decorative element on a pure white background. Show gemstones, metalwork, and connection points. Nothing cropped. Macro studio lighting.",
    },
    {
      id: "body-chain-connector-detail",
      label: "Connector Detail",
      compositionPrompt:
        "A DETAIL VIEW of the body chain connectors and chain style on a pure white background. Reveal link patterns and adjustment mechanisms. Nothing cropped. Studio lighting.",
    },
    {
      id: "body-chain-draped",
      label: "Draped Display",
      compositionPrompt:
        "The body chain displayed as if draped on an invisible form on a pure white background, showing the natural drape and how chains layer. Nothing cropped. Soft studio lighting.",
    },
  ],
  "hair-jewelry": [
    {
      id: "hair-jewelry-front",
      label: "Front View",
      compositionPrompt:
        "A single hero shot on a pure white background. The hair jewelry is shown FRONT VIEW face-on, all decorative elements visible. Nothing cropped. Studio lighting.",
    },
    {
      id: "hair-jewelry-side",
      label: "Side View",
      compositionPrompt:
        "A SIDE VIEW of the hair jewelry on a pure white background, showing how it curves and attaches. Nothing cropped. Rim-lit studio lighting.",
    },
    {
      id: "hair-jewelry-detail",
      label: "Detail View",
      compositionPrompt:
        "A close-up DETAIL VIEW of the hair jewelry decorative elements on a pure white background. Sharp focus on gemstones and metalwork. Nothing cropped. Macro studio lighting.",
    },
    {
      id: "hair-jewelry-back",
      label: "Back & Attachment",
      compositionPrompt:
        "A BACK VIEW of the hair jewelry on a pure white background, showing teeth, clips, or pins used for attachment. Nothing cropped. Even studio lighting.",
    },
  ],
  cufflinks: [
    {
      id: "cufflinks-front-pair",
      label: "Front Pair View",
      compositionPrompt:
        "A single hero shot on a pure white background. Both cufflinks shown FRONT VIEW side by side, decorative faces visible. Nothing cropped. Balanced studio lighting.",
    },
    {
      id: "cufflinks-side",
      label: "Side Profile",
      compositionPrompt:
        "A SIDE PROFILE of one cufflink on a pure white background, showing the toggle mechanism, depth, and connection. Nothing cropped. Rim-lit studio lighting.",
    },
    {
      id: "cufflinks-detail",
      label: "Face Detail",
      compositionPrompt:
        "A macro DETAIL VIEW of one cufflink face on a pure white background, showing engraving, gemstones, or textured surface. Nothing cropped. Macro studio lighting.",
    },
    {
      id: "cufflinks-back",
      label: "Toggle Detail",
      compositionPrompt:
        "A BACK VIEW of one cufflink on a pure white background, showing the toggle bar, hinge, and fastening mechanism. Nothing cropped. Even studio lighting.",
    },
  ],
  "nose-ring": [
    {
      id: "nose-ring-front",
      label: "Front View",
      compositionPrompt:
        "A single hero shot on a pure white background. The nose ring is shown FRONT VIEW face-on, decorative elements and gem settings visible. Nothing cropped. Studio lighting.",
    },
    {
      id: "nose-ring-side",
      label: "Side Profile",
      compositionPrompt:
        "A SIDE PROFILE of the nose ring on a pure white background, showing the curve, gauge, and closure mechanism. Nothing cropped. Rim-lit studio lighting.",
    },
    {
      id: "nose-ring-detail",
      label: "Detail View",
      compositionPrompt:
        "A macro DETAIL VIEW of the nose ring's decorative element on a pure white background. Sharp focus on gem setting and metalwork. Nothing cropped. Macro studio lighting.",
    },
    {
      id: "nose-ring-three-quarter",
      label: "Three-Quarter View",
      compositionPrompt:
        "The nose ring at a THREE-QUARTER ANGLE on a pure white background, showing both the front decoration and the curve of the ring simultaneously. Nothing cropped. Professional studio lighting.",
    },
  ],
  "toe-ring": [
    {
      id: "toe-ring-front",
      label: "Front View",
      compositionPrompt:
        "A single hero shot on a pure white background. The toe ring is shown FRONT VIEW face-on with decorative elements visible. Nothing cropped. Studio lighting.",
    },
    {
      id: "toe-ring-top",
      label: "Top-Down View",
      compositionPrompt:
        "A TOP-DOWN VIEW of the toe ring on a pure white background, showing the band as a circle with any decorative elements at center. Nothing cropped. Overhead studio lighting.",
    },
    {
      id: "toe-ring-side",
      label: "Side Profile",
      compositionPrompt:
        "A SIDE PROFILE of the toe ring on a pure white background, showing band width, any setting height, and adjustable opening. Nothing cropped. Rim-lit studio lighting.",
    },
    {
      id: "toe-ring-detail",
      label: "Detail View",
      compositionPrompt:
        "A macro DETAIL VIEW of the toe ring's decorative element on a pure white background. Sharp focus on surface detail and metalwork. Nothing cropped. Macro studio lighting.",
    },
  ],
};

/** Look up a specific view from the catalog. Returns the first view as fallback. */
export function resolveView(jewelryType: JewelryType, viewId: string | undefined): ViewDefinition {
  const views = VIEW_CATALOG[jewelryType];
  if (viewId) {
    const match = views.find((v) => v.id === viewId);
    if (match) return match;
  }
  return views[0];
}

/** Get N views for a jewelry type, cycling through the catalog. */
export function distributeViews(jewelryType: JewelryType, count: number): ViewDefinition[] {
  const views = VIEW_CATALOG[jewelryType];
  return Array.from({ length: count }, (_, i) => views[i % views.length]);
}

// Legacy two-view composition prompts (used by sketch prompt in prompt-compile)
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
  anklet:
    "A jewelry design sheet showing TWO hand-drawn views of the same anklet on white paper: a TOP VIEW of the complete anklet as a closed oval from above with clasp visible and a DETAIL VIEW showing the chain links and any charms or decorative elements. Both views are side by side with nothing cropped.",
  brooch:
    "A jewelry design sheet showing TWO hand-drawn views of the same brooch on white paper: a FRONT VIEW showing the brooch face-on with all decorative elements visible and a BACK VIEW showing the pin mechanism and construction. Both views are side by side with nothing cropped.",
  tiara:
    "A jewelry design sheet showing TWO hand-drawn views of the same tiara on white paper: a FRONT VIEW showing the tiara face-on with its full arc and decorative elements and a SIDE PROFILE VIEW showing the height and curve. Both views are side by side with nothing cropped.",
  "body-chain":
    "A jewelry design sheet showing TWO hand-drawn views of the same body chain on white paper: a FRONT VIEW showing the full chain layout with all connecting points and a DETAIL VIEW of the central decorative element. Both views are clearly separated with nothing cropped.",
  "hair-jewelry":
    "A jewelry design sheet showing TWO hand-drawn views of the same hair jewelry on white paper: a FRONT VIEW showing the piece face-on with all decorative elements and a SIDE VIEW showing how it attaches and sits. Both views are side by side with nothing cropped.",
  cufflinks:
    "A jewelry design sheet showing TWO hand-drawn views of the same cufflink on white paper: a FRONT VIEW showing the decorative face and a SIDE PROFILE VIEW showing the toggle mechanism and depth. Show both cufflinks of the pair. All views are clearly separated with nothing cropped.",
  "nose-ring":
    "A jewelry design sheet showing TWO hand-drawn views of the same nose ring on white paper: a FRONT VIEW showing the ring face-on with any decorative elements and a SIDE PROFILE VIEW showing the curve and closure mechanism. Both views are side by side with nothing cropped.",
  "toe-ring":
    "A jewelry design sheet showing TWO hand-drawn views of the same toe ring on white paper: a FRONT VIEW showing the ring face-on with any decorative elements and a TOP VIEW from directly above showing the band shape. Both views are side by side with nothing cropped.",
};

export const metalDescriptions: Record<Metal, string> = {
  gold: "18K yellow gold (750 fineness) with warm honey-amber mirror polish, rich specular highlights, and deep golden reflections that shift to warm bronze in shadow areas",
  "white-gold": "18K white gold with bright rhodium-plated silvery surface, cool mirror reflections, and crisp neutral highlights around gemstone facets",
  silver: "sterling silver (925) with bright cool-white reflections, crisp specular highlights, and a luminous platinum-like sheen when freshly polished",
  platinum: "950 platinum with dense cool-white metallic luster, subtle blue-grey undertone in reflections, and naturally tarnish-resistant mirror finish",
  "rose-gold": "14K rose gold with warm pink-copper tones, romantic blush reflections, and a soft sunset-amber glow where light catches the surface",
};

export const gemstoneDescriptions: Record<Gemstone, string> = {
  diamond: "round brilliant-cut diamond (57 facets) with exceptional white body color, strong rainbow fire dispersion, and pin-point scintillation flashes under directional light",
  ruby: "faceted oval-cut ruby with deep pigeon-blood red saturation, warm inner fluorescent glow, and rich crimson reflections visible through the crown facets",
  emerald: "emerald-cut emerald with vivid green saturation, characteristic jardine inclusions, step-cut facets creating a hall-of-mirrors depth effect",
  sapphire: "cushion-cut blue sapphire with deep cornflower saturation, excellent light transmission, velvety body color, and soft blue glow under studio lighting",
  pearl: "round white Akoya pearl (7-8mm) with high overtone lustre, subtle pink-rose orient, mirror-like nacre surface reflecting ambient light as a soft halo",
  amethyst: "faceted oval-cut amethyst with deep regal purple saturation, transparent quartz body, subtle violet-to-grape color zoning visible through crown facets, and cool lavender flash under studio lighting",
  topaz: "faceted emerald-cut Swiss blue topaz with vivid sky-blue saturation, exceptional clarity and transparency, crisp step-cut reflections, and bright white scintillation highlights across the table facet",
  garnet: "faceted round-cut pyrope garnet with deep wine-red saturation, warm inner glow from high refractive index (1.74), rich burgundy reflections through the pavilion, and subtle almandine undertones",
  aquamarine: "emerald-cut aquamarine (50 facets) with serene pale blue-to-ocean-blue saturation, remarkable eye-clean transparency, cool water-tone reflections in step-cut facets, and gentle blue luminescence",
  tourmaline: "faceted oval-cut Paraiba-type tourmaline with electric neon blue-green saturation, strong pleochroism shifting blue-to-green across crystal axes, vivid copper-bearing fluorescence, and intense light dispersion",
  peridot: "faceted cushion-cut peridot with vivid chartreuse-green saturation and warm golden undertones, characteristic double-refraction creating a soft doubling of back facets, and oily vitreous luster",
  citrine: "faceted oval-cut natural citrine with warm Madeira-amber saturation, golden honey transparency, subtle internal warmth like candlelight, and bright yellow fire under directional studio light",
  tanzanite: "cushion-cut tanzanite (58 facets) with deep violet-blue saturation shifting to burgundy-purple under warm light, strong trichroic pleochroism visible across crystal axes, velvety body color, and blue fluorescent glow",
  coral: "polished cabochon natural Mediterranean coral with deep ox-blood red saturation, smooth organic surface showing subtle growth texture, warm matte finish with soft waxy luster",
  turquoise: "cabochon-cut Persian turquoise with intense robin-egg blue saturation, fine brown-black spiderweb matrix veining across the dome, smooth waxy polish, and opaque sky-blue body color",
  "lapis-lazuli": "polished cabochon lapis lazuli with deep royal-blue saturation, scattered golden pyrite flecks catching light like embedded stars, smooth vitreous surface, and subtle sodalite color variation",
  opal: "cabochon-cut Australian black opal with vivid play-of-color fire — shifting patches of red, green, blue, and violet dancing across the dome as viewing angle changes, dark body tone amplifying spectral flash",
  onyx: "polished cabochon jet-black onyx with mirror-like surface, deep opaque body color absorbing all ambient light except crisp specular highlights, smooth chalcedony finish with no visible banding",
  moonstone: "cabochon-cut rainbow moonstone with ethereal blue-white adularescent glow floating beneath the surface, semi-transparent milky body, and soft billowing light effect that shifts with viewing angle",
  labradorite: "cabochon-cut spectrolite-grade labradorite with vivid iridescent labradorescence — electric blue, gold, and green spectral flash erupting across the polished surface as light angle shifts",
  moissanite: "brilliant-cut moissanite (57 facets) with exceptional rainbow fire dispersion (0.104, nearly 2.5x diamond), strong double refraction creating visible facet doubling, and intense white-light scintillation",
  "cubic-zirconia": "brilliant-cut cubic zirconia with bright diamond-like sparkle, high dispersion creating colorful fire flashes, flawless clarity with no inclusions, and crisp light return under studio conditions",
  "lab-diamond": "brilliant-cut CVD lab-grown diamond (57 facets) with identical optical properties to natural — strong rainbow fire, pin-point scintillation, exceptional white body color, and crystalline depth",
  none: "",
};

export const styleDescriptions: Record<Style, string> = {
  contemporary: "modern contemporary design with clean architectural lines, deliberate asymmetry, mixed-finish contrasts, and restrained proportions that emphasize negative space",
  minimalist: "ultra-minimal design where every element is essential, with thin wire-gauge forms, unadorned surfaces, a single focal point, and geometric purity",
  vintage: "vintage-inspired design with delicate milgrain edging along every border, hand-worked filigree scrollwork, split-shank detailing, and warm antique patina finishes",
  temple: "traditional Indian temple jewelry with dense gold surface coverage, kundan and polki stone settings, peacock or lotus or paisley motifs in repousse relief, and ornate granulation borders",
  floral: "organic botanical forms with hand-sculpted petal clusters, twisting vine tendrils wrapping the band, textured leaf veining, and naturalistic bud-to-bloom progression",
  geometric: "geometric and architectural design with precise mathematical forms, hexagonal bezels, triangular faceted surfaces, parallel linear channels, and sharp clean angles with structured symmetry",
  fine: "classic fine jewelry with refined proportions and timeless elegance",
  "art-deco": "bold Art Deco geometry with stepped forms, fan motifs, and symmetrical patterns",
  "art-nouveau": "flowing Art Nouveau curves with organic natural forms and whiplash lines",
  futuristic: "sleek futuristic design with sharp angles, fluid metal forms, and sci-fi aesthetic",
  kundan: "traditional Kundan jewelry with gold foil setting and uncut polki stones",
  "middle-eastern": "Middle Eastern jewelry with arabesque patterns, filigree, and ornate detailing",
  "east-asian": "East Asian inspired with jade motifs, dragon and phoenix elements, and lacquer accents",
  "african-tribal": "African tribal jewelry with bold geometric patterns, beadwork, and organic shapes",
  bohemian: "free-spirited bohemian with layered elements, mixed materials, and earthy tones",
  gothic: "dark gothic aesthetic with ornate filigree, crosses, and dramatic forms",
  punk: "edgy punk style with spikes, chains, studs, and raw industrial elements",
  streetwear: "streetwear-inspired with bold graphics, chunky forms, and urban aesthetic",
  steampunk: "steampunk aesthetic with Victorian-era gears, cogs, and brass mechanical elements",
  cyberpunk: "cyberpunk style with neon accents, circuit patterns, and high-tech materials",
  cottagecore: "soft cottagecore aesthetic with wildflower motifs, pastoral charm, and delicate details",
  spiritual: "spiritual jewelry with sacred geometry, chakra symbols, and meditative elements",
};

export const styleLightingPresets: Record<Style, string> = {
  contemporary: "Clean diffused studio lighting: large overhead softbox at 5500K daylight, subtle fill from left at 1:3 ratio, white seamless background, controlled reflections via light tent, no harsh shadows.",
  minimalist: "Clinical precision lighting: dual softboxes at 45 degrees (5500K), zero shadows, pure white infinite background, perfectly even illumination, bounce card below for under-gallery fill.",
  vintage: "Warm golden-hour atmosphere: key light at 4000K warm white from upper-right, antique brass tray surface, soft romantic bokeh in background, gentle amber fill, heirloom nostalgic mood.",
  temple: "Rich palatial atmosphere: warm directional spotlight at 3200K from above-left, dark maroon velvet surface, amber fill light, chiaroscuro shadow play, golden ambient reflections suggesting palace interior.",
  floral: "Soft botanical garden lighting: diffused natural daylight at 5000K through sheer fabric, cream linen surface, gentle dappled light suggesting garden shadows, fresh airy mood.",
  geometric: "Precise architectural lighting: crisp 5500K key light with hard edge from upper-left, polished dark grey surface, sharp geometric shadow patterns, high contrast emphasizing form and angle.",
  fine: "Classic luxury studio: overhead softbox at 5500K with silk diffuser, dark charcoal gradient background, gentle rim light from behind for metal edge separation, bounce card below, editorial quality.",
  "art-deco": "Cool platinum-tone lighting: 6000K key light from above, polished black lacquer surface, geometric shadow patterns cast by stepped forms, crisp high-contrast, 1920s glamour atmosphere.",
  "art-nouveau": "Dreamy ethereal lighting: soft diffused 4500K from overhead, flowing shadow patterns, ivory silk surface, gentle warm fill from below, romantic Pre-Raphaelite mood, painterly atmosphere.",
  futuristic: "High-tech studio: cool 6500K key light, brushed steel surface, subtle blue-toned rim light, clean reflections, sci-fi atmosphere, razor-sharp specular highlights on metal.",
  kundan: "Traditional Indian atelier: warm 3000K directional spotlight, rich burgundy velvet surface, golden fill light suggesting temple lamp glow, intimate opulent atmosphere, warm amber reflections.",
  "middle-eastern": "Arabian luxury: warm 3500K key light, deep indigo silk surface with subtle gold thread, amber rim light, ornate shadow patterns suggesting arabesque screens, palatial warmth.",
  "east-asian": "Zen minimalism with warmth: soft 4500K diffused light, dark lacquered wood surface, subtle warm fill, clean composition with breathing space, meditative calm atmosphere.",
  "african-tribal": "Earth-toned natural lighting: warm 4000K key light, raw terracotta or woven raffia surface, warm directional fill suggesting savanna sun, organic textured shadows, grounded natural mood.",
  bohemian: "Warm eclectic atmosphere: soft 4000K natural window light from the left, weathered wood surface, gentle dappled shadows, layered textile hints in background, earthy free-spirited mood.",
  gothic: "Dramatic chiaroscuro: single hard spotlight from above-left at 5000K, polished black obsidian surface, deep noir shadows, moody atmosphere, high-contrast with dark negative space.",
  punk: "Raw industrial lighting: hard 5500K overhead light, raw concrete or brushed steel surface, gritty shadows, high contrast, urban warehouse atmosphere, no softening.",
  streetwear: "Urban editorial: bright even 5500K studio light, matte grey surface, clean modern shadows, high-contrast commercial photography aesthetic, sharp and bold.",
  steampunk: "Victorian workshop: warm 3500K directional light suggesting gas lamp, aged brass tray surface, warm amber shadows, antique mechanical atmosphere, soft vignette.",
  cyberpunk: "Neon-lit studio: cool 6500K key light with subtle purple-blue rim accent, glossy black surface with neon color reflections, futuristic high-tech atmosphere, sharp specular highlights.",
  cottagecore: "Soft pastoral daylight: gentle 5000K diffused light through curtain, aged linen surface with dried wildflower hints, warm delicate shadows, romantic countryside atmosphere.",
  spiritual: "Meditative golden hour: warm 4000K soft light, natural stone or marble surface, gentle even illumination, serene contemplative atmosphere, subtle warm halo around the piece.",
};

export const defaultNegativePrompt =
  "cropped edges, incomplete piece, extra floating elements, disconnected parts, wrong jewelry type, flat dull metal, no reflections, muddy highlights, plastic-looking surface, cloudy stones, dead fire, milky transparency, merged facets, misaligned cut, dull lifeless gems, merged prongs, floating stones, gap between stone and metal, bent prongs, noise, grain, chromatic aberration, motion blur, color fringing, double exposure, text, watermark, logo, labels, hands, fingers, body parts, mannequin, packaging, cartoonish, painted, illustration, sketch-like, digital art, low-poly, anime";

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
