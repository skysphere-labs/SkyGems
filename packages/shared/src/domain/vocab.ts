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
  amethyst: "faceted purple amethyst with violet hues",
  topaz: "faceted blue topaz with crisp brilliance",
  garnet: "faceted deep red garnet with wine-dark tones",
  aquamarine: "emerald-cut pale blue aquamarine with ocean clarity",
  tourmaline: "faceted pink-green tourmaline with vivid saturation",
  peridot: "faceted lime-green peridot with golden undertones",
  citrine: "faceted warm golden citrine with amber glow",
  tanzanite: "cushion-cut violet-blue tanzanite with trichroic flash",
  coral: "polished natural red coral with organic warmth",
  turquoise: "cabochon-cut robin-egg blue turquoise with matrix veining",
  "lapis-lazuli": "polished deep blue lapis lazuli with golden pyrite flecks",
  opal: "cabochon-cut white opal with play-of-color fire",
  onyx: "polished jet-black onyx with mirror finish",
  moonstone: "cabochon-cut rainbow moonstone with adularescent glow",
  labradorite: "cabochon-cut labradorite with iridescent spectral flash",
  moissanite: "brilliant-cut moissanite with exceptional fire and brilliance",
  "cubic-zirconia": "brilliant-cut cubic zirconia with diamond-like sparkle",
  "lab-diamond": "brilliant-cut lab-grown diamond with identical fire to natural",
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
