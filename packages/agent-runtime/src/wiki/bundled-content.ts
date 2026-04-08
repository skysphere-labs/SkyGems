/**
 * Bundled wiki content — embedded at build time for Cloudflare Workers compatibility.
 * Workers don't have filesystem access, so wiki content is bundled as static strings.
 *
 * Source: knowledge/raw/*.md
 * To update: edit the source files and re-run the bundler or update this file.
 */

export const WIKI_FILES: Record<string, string> = {
  "prompt-engineering-for-jewelry.md": `# Prompt Engineering for AI Jewelry Design Images

## Composition Rules (CRITICAL — These Prevent Bad Crops)
1. ALWAYS describe framing and view angle FIRST before any materials or details.
2. Specify number of views and their arrangement: "showing TWO views side by side: a FRONT VIEW and a TOP VIEW."
3. State the jewelry type emphatically: "This is a RING" — models need reinforcement to not crop or distort.
4. Specify background: "on white paper" for sketches, "on dark velvet" for renders, "studio environment" for product shots.
5. State "The full piece is visible, nothing cropped" to prevent the most common failure.

## Sketch Prompts — What Works
- "A jewelry design sheet" — triggers technical illustration mode.
- "Hand-drawn views" — produces pencil/ink technical drawing aesthetic.
- "Fine pencil lines with subtle color washes" — beautiful watercolor-sketch hybrid.
- "On white paper" — clean background for design presentation.
- "Clearly labeled by position" — encourages labeled views.
- "Both views drawn side by side with space between them" — prevents overlapping.
- Anti-patterns to avoid: "photorealistic sketch" (contradictory), "3D rendering sketch" (confusing).

## Render Prompts — What Works
- "Luxury studio photography" — triggers high-end product photography mode.
- "Macro lens, shallow depth of field" — creates professional jewelry photography.
- "Ray-traced reflections" — realistic metal rendering.
- "Accurate gemstone refraction and dispersion" — proper stone rendering.
- "On dark velvet surface" — classic jewelry photography backdrop.
- "Soft box lighting with rim light" — professional lighting setup.
- "8K detail" — triggers maximum quality.
- Anti-patterns to avoid: "artistic interpretation" (too loose), "stylized" (distorts accuracy).

## Product Shot Prompts — What Works
- "Professional product photograph for e-commerce" — clean, sellable image.
- "White or gradient background" — clean isolation.
- "Even lighting, no harsh shadows" — consistent exposure.
- "Multiple angles in one image" — product catalog style.
- "Life-size proportions on model hand/neck" — contextual sizing.

## Metal Description Patterns
- Gold: "warm buttery yellow gold with rich reflections and deep luster"
- White gold: "bright rhodium-plated white gold with mirror reflections"
- Rose gold: "blush pink rose gold with warm copper undertones"
- Platinum: "cool silvery-white platinum with subtle blue undertone"
- Silver: "bright polished sterling silver with high reflectivity"

## Gemstone Description Patterns
- Diamond: "brilliant-cut diamond with intense fire, rainbow dispersion, and white light flashes"
- Ruby: "deep pigeon-blood red ruby with warm inner glow"
- Emerald: "rich verdant green emerald with natural jardine character"
- Sapphire: "deep velvet blue sapphire with royal saturation"
- Pearl: "luminous white pearl with mirror-like nacre luster and pink overtones"

## Complexity Scaling
- 0-25%: "clean, minimal, essential lines only, uncluttered"
- 25-50%: "moderate detail, balanced ornament, refined but not busy"
- 50-75%: "intricate detail, filigree textures, layered ornamental elements"
- 75-100%: "highly elaborate, dense ornamentation, maximum decorative complexity"

## Negative Prompts That Work
- Always include: "No text, no labels, no watermarks, no signatures"
- For jewelry: "No extra fingers, no deformed hands, no blurry gemstones"
- For sketches: "No photorealistic rendering, no 3D, no digital art"
- For renders: "No cartoon, no illustration, no sketch lines"

## Common Failures and How to Fix
1. **Cropped jewelry**: Add "full piece visible, nothing cropped, centered in frame"
2. **Wrong jewelry type**: Repeat type 3 times: "This is a RING. Show the complete RING. The RING should be..."
3. **Flat metal**: Add "reflective metallic surface, accurate metal sheen, light interaction"
4. **Dead gemstones**: Add "refractive gemstone with visible brilliance, light entering and exiting the stone"
5. **Wrong proportions**: Add specific dimensions: "band width 3mm, stone diameter 6mm"
6. **Muddy composition**: Add "clean separation between elements, clear silhouette, readable design"
`,

  "jewelry-types-guide.md": `# Jewelry Types — Design & Composition Guide

## Ring
Primary composition: band + head (setting) + stone(s). Key dimensions: band width (1.5-8mm), band thickness (1.2-2.5mm), ring size (US 3-16). Views for design: FRONT (face-on showing setting), TOP (band from above showing profile), SIDE (cross-section showing depth). Band profiles: comfort-fit (domed interior), flat, knife-edge, half-round, euro-shank (squared bottom). Design elements: shank (band body), shoulder (transition to head), gallery (open area under stone), prongs/bezel (stone holding). Critical: show full circle of band, visible finger hole, accurate proportions. Prompt keywords: "ring design, circular band, setting visible, finger-scale proportions, showing front and top views."

## Necklace
Primary composition: chain + pendant/focal element + clasp. Key dimensions: length (choker 14-16", princess 17-19", matinee 20-24", opera 28-36", rope 40+"), pendant size relative to chain, chain link size. Views: FRONT (complete U-shape drape), DETAIL (pendant close-up). Chain types: cable, curb, figaro, box, rope, snake, wheat, Singapore. Design elements: bail (pendant connector), chain links, clasp (lobster, spring ring, toggle, magnetic). Critical: show natural drape, correct length category, pendant proportion. Prompt keywords: "necklace design, natural drape, chain and pendant, U-shape composition, showing full length and pendant detail."

## Earrings
Primary composition: decorative element + post/hook/clip mechanism. Types: stud (sits on earlobe), drop/dangle (hangs below), hoop (circular), huggie (small hoop), chandelier (elaborate drop), climber (follows ear curve), cuff (wraps cartilage). Key dimensions: stud face 4-10mm, drop length 20-80mm, hoop diameter 15-60mm. Views: FRONT (face-on), SIDE (depth/construction). Always design as PAIR — mirror symmetry. Critical: show earring from front with post visible, indicate scale relative to ear. Prompt keywords: "earring design, paired set, showing front view and depth, post mechanism visible, ear-scale proportions."

## Bracelet
Primary composition: links/segments + clasp. Types: chain, bangle (rigid circle), cuff (open rigid), tennis (continuous line of stones), charm (chain with dangling elements), wrap, mesh. Key dimensions: inner diameter 60-70mm (bangle), length 165-210mm (chain), width 3-25mm. Views: TOP (closed oval shape), SIDE (width and profile). Design elements: links, hinges, clasp mechanism, safety chain. Critical: show as closed oval from above, indicate flexibility vs rigidity. Prompt keywords: "bracelet design, showing closed oval shape and side profile, wrist-scale proportions, clasp detail."

## Pendant
Primary composition: decorative element + bail (for chain attachment). Distinguished from necklace: pendant is the focal piece, sold separately from chain. Types: solitaire, cluster, locket (opens), medallion, cross/religious, initial/monogram. Key dimensions: 10-40mm height, proportional to chain weight. Views: FRONT (face-on showing full design), SIDE (depth and bail attachment). Design elements: bail design (fixed, hinged, hidden), back finish (polished, engraved, open). Critical: show bail clearly, indicate how it hangs. Prompt keywords: "pendant design, showing front face and bail attachment, chain-hanging orientation, front and side views."

## Brooch
Primary composition: decorative element + pin mechanism. Types: bar, circle, cluster, figural (animal/plant), cameo, scatter pin. Pin mechanism: simple pin + catch, trombone catch, safety clasp. Key dimensions: 25-80mm. Worn on fabric — must not be too heavy. Often features elaborate openwork. Visual: full front face, pin mechanism visible from back. Prompt keywords: "brooch design, decorative front with pin back, fabric-wearable weight, showing face detail."

## Anklet
Similar to bracelet but longer. Length: 230-270mm. Thinner, more delicate than bracelets. Often features charms or stations. Summer/casual association. Chain types: cable, figaro, satellite (beaded stations). Visual: delicate chain around ankle silhouette. Prompt keywords: "anklet design, delicate chain, ankle proportions, casual elegance."

## Cuff
Open-ended rigid bracelet. Fits over wrist without clasp. Types: plain (smooth metal surface), statement (wide, ornamental), wire (thin, stackable). Width: 5-50mm. Material usually heavier gauge. Can be engraved, textured, stone-set. Visual: C-shaped rigid form, visible opening. Prompt keywords: "cuff bracelet, open rigid form, C-shape silhouette, bold wrist piece."

## Tiara/Crown
Ceremonial headpiece. Graduated height (tallest at center). Sits atop head secured with combs/pins. Types: tiara (open back), crown (full circle), headband (follows hairline). Elaborate metalwork and stone work. Visual: front-facing arc with graduated peaks. Prompt keywords: "tiara design, graduated peak arc, ceremonial headpiece, elaborate gemstone work, front-facing composition."
`,

  "metals-guide.md": `# Precious Metals for Jewelry — Comprehensive Guide

## Yellow Gold (18K)
75% pure gold, 25% alloy (silver, copper, zinc). Warm, rich yellow color. Classic luxury association. Soft enough for intricate work. Does not tarnish. Density: 15.5 g/cm3. Melting point: ~900°C. Best for: traditional designs, vintage styles, warm-toned gemstones (ruby, citrine). Visual: warm buttery glow, rich reflections, deep yellow luster. Prompt keywords: "18K yellow gold, warm golden luster, rich buttery reflections, deep warm tone, luxury finish."

## Yellow Gold (14K)
58.3% pure gold. Harder than 18K. More affordable. Slightly less saturated yellow. Better scratch resistance. American standard. Best for: everyday wear, engagement rings, men's bands. Visual: bright gold, slightly lighter than 18K. Prompt keywords: "14K yellow gold, bright gold color, durable golden finish."

## White Gold
Gold alloyed with palladium, nickel, or silver. Usually rhodium-plated for bright white finish. Rhodium wears off over time — needs replating every 1-2 years. Slightly warmer than platinum underneath. Modern, versatile neutral tone. Best for: diamond solitaires, contemporary designs, cool-toned stones. Visual: bright silvery-white with cool reflections, mirror-like when freshly plated. Prompt keywords: "white gold, bright silvery surface, rhodium-plated mirror finish, cool neutral reflections."

## Rose Gold (18K)
Gold alloyed with copper. Romantic pink-warm tone. Increasingly popular for contemporary and vintage revival. Copper content affects color intensity — more copper = deeper rose. Does not need plating. Complements warm and cool skin tones. Best for: romantic designs, vintage, bohemian, stacking. Visual: warm blush-pink metallic, sunset glow, romantic warmth. Prompt keywords: "rose gold, blush pink metal, warm copper undertone, romantic sunset glow, soft warm reflections."

## Platinum (950)
95% pure platinum. Densest precious metal (21.45 g/cm3). Naturally white — no plating needed. Develops distinguished patina over time. Strongest prong security. Hypoallergenic. Most expensive. Melting point: 1768°C. Best for: engagement rings, high-security settings, tension settings, luxury pieces. Visual: cool blue-silver, understated luxury, weighty. Prompt keywords: "platinum, cool silvery-white, subtle blue undertone, dense luxury weight, natural patina, understated elegance."

## Palladium
Platinum group metal. Lighter than platinum (12.0 g/cm3). Naturally white. Hypoallergenic. More affordable than platinum. Similar appearance but less dense. Best for: men's rings, lightweight luxury, alternative to white gold. Visual: bright silver-white, lightweight luxury. Prompt keywords: "palladium, bright white metal, lightweight luxury, hypoallergenic shine."

## Sterling Silver (925)
92.5% pure silver. Brightest white of all metals. Most affordable precious metal. Tarnishes (oxidizes) — requires maintenance. Softer than gold alloys. Best for: fashion jewelry, bohemian designs, statement pieces, earrings. Visual: brilliant bright white, cool reflections, high polish brilliance. Prompt keywords: "sterling silver, brilliant white metal, high-polish mirror shine, brightest reflections."

## Titanium
Aerospace metal. Extremely lightweight. Dark grey color. Scratch-resistant. Cannot be easily resized. Hypoallergenic. Can be anodized for colors. Best for: men's wedding bands, modern industrial designs. Visual: dark gunmetal grey, industrial modern aesthetic. Prompt keywords: "titanium, dark grey metal, industrial modern, lightweight, matte gunmetal finish."

## Vermeil
Sterling silver with thick gold plating (2.5+ microns of gold). Bridge between silver affordability and gold appearance. Must be labeled as vermeil (FTC). Best for: fashion-forward gold looks at silver price. Visual: gold appearance with silver weight. Prompt keywords: "gold vermeil, warm golden surface, lightweight luxury."

## Mixed Metals
Two or more metals in one piece. Contemporary trend. Creates visual contrast and interest. Common: rose gold + white gold, yellow gold + platinum. Best for: modern stacking, two-tone designs, contemporary art jewelry. Visual: contrasting metallic tones, dynamic interplay, modern sophistication. Prompt keywords: "two-tone metal, mixed metals, contrasting gold and silver, modern metallic interplay."
`,

  "gemstones-guide.md": `# Gemstones — Comprehensive Design Guide

## Diamond
Hardness: 10 (Mohs). Refractive index: 2.42 (highest natural gem). Dispersion: 0.044 (creates "fire" — rainbow flashes). Colors: colorless (D-Z scale), fancy colors (yellow, pink, blue, green, black). The 4Cs: Cut, Clarity, Color, Carat. Brilliance comes from total internal reflection. Best cuts: round brilliant (maximum fire), princess, cushion, emerald. Setting compatibility: all settings. Visual: intense white light return, rainbow fire, scintillation. Prompt keywords: "brilliant diamond, intense fire, rainbow sparkle, crystalline clarity, white light flashes, precious stone."

## Ruby
Hardness: 9. Corundum family. Color: red (chromium). "Pigeon blood" red most prized. Strong fluorescence under UV. Silk inclusions create star effect (star ruby). Historically valued above diamond. Best cuts: oval, cushion, round. Setting: prong (show color), bezel (protect). Visual: deep saturated red, inner glow, warm fire. Prompt keywords: "ruby, deep pigeon-blood red, warm inner glow, saturated crimson, precious red corundum."

## Emerald
Hardness: 7.5-8. Beryl family. Color: green (chromium, vanadium). "Jardin" (garden) — characteristic inclusions are expected and add character. Oiled to improve appearance (industry standard). Fragile — needs protective settings. Best cuts: emerald-cut (invented for this stone), cushion, oval. Visual: rich verdant green, lush garden color, velvety depth. Prompt keywords: "emerald, rich verdant green, lush garden depth, velvety green, precious beryl, natural inclusions."

## Sapphire
Hardness: 9. Corundum family (same as ruby, different color). Classic blue, but exists in every color except red (those are rubies). Padparadscha (pink-orange) extremely rare. Kashmir blue most prized. Excellent durability for daily wear. Best cuts: oval, cushion, round, cabochon (star sapphire). Visual: deep velvet blue, cornflower blue, royal intensity. Prompt keywords: "sapphire, deep velvet blue, cornflower blue, royal intensity, precious corundum, rich blue saturation."

## Pearl
Hardness: 2.5-4. Organic gem (mollusk). Types: Akoya (classic white, 6-8mm), South Sea (white/golden, 8-20mm), Tahitian (dark, 8-16mm), freshwater (various, 2-15mm). Luster (orient) is key quality factor. Nacre thickness matters. Damaged by chemicals, perfume, sweat. Best settings: cup/post, bezel, tension. Visual: soft luminous glow, mirror-like surface luster, iridescent overtones. Prompt keywords: "pearl, luminous nacre glow, mirror-like luster, soft iridescent overtones, organic warmth."

## Opal
Hardness: 5.5-6.5. Hydrated silica. Play-of-color from microscopic silica spheres diffracting light. Types: white opal, black opal (most valuable), boulder opal, fire opal (Mexican, orange). Water content 3-21% — can crack if dehydrated. Best cuts: cabochon (essential), freeform. Visual: kaleidoscopic color flashes, rainbow play, shifting patterns. Prompt keywords: "opal, play-of-color, kaleidoscopic rainbow, shifting color patches, iridescent fire, mysterious depth."

## Tanzanite
Hardness: 6-7. Zoisite mineral. Color: violet-blue with trichroism (blue, violet, burgundy from different angles). Found only in Tanzania. Heat-treated for deeper blue. Relatively soft for rings. Best cuts: oval, cushion, round, trillion. Visual: vibrant violet-blue, color-shifting, electric saturation. Prompt keywords: "tanzanite, vivid violet-blue, trichroic color shift, electric blue saturation, East African gem."

## Aquamarine
Hardness: 7.5-8. Beryl family (same as emerald). Color: pale to medium blue, some greenish. Remarkably clean — few inclusions. Named "water of the sea." Cool, calming aesthetic. Best cuts: emerald-cut, oval, round. Visual: clear pale blue, ocean transparency, serene clarity. Prompt keywords: "aquamarine, serene ocean blue, transparent clarity, cool water tone, clean beryl."

## Amethyst
Hardness: 7. Quartz family. Color: purple (light lavender to deep royal). Historically precious — now abundant. Heat treatment can produce citrine. February birthstone. Best cuts: all shapes work well. Visual: regal purple, grape-like saturation, royal depth. Prompt keywords: "amethyst, regal purple, grape saturation, royal violet, transparent quartz."

## Morganite
Hardness: 7.5-8. Beryl family. Color: pink to peach-pink (manganese). Romantic, feminine aesthetic. Growing engagement ring trend. Pairs beautifully with rose gold. Best cuts: cushion, oval, round. Visual: soft blush pink, peach warmth, romantic glow. Prompt keywords: "morganite, blush pink beryl, soft peach warmth, romantic pink glow, feminine sparkle."

## Tourmaline
Hardness: 7-7.5. Color: every color possible. Paraiba (neon blue-green) most valuable. Watermelon tourmaline (pink center, green rim). Strong pleochroism. Crystal growth creates natural bi-color. Best cuts: emerald-cut, oval, custom. Visual: vivid saturated color, neon intensity (Paraiba), natural color gradients. Prompt keywords: "tourmaline, vivid saturated color, neon intensity, natural color gradient, bi-color crystal."

## Alexandrite
Hardness: 8.5. Chrysoberyl. Color-change: green in daylight, red/purple in incandescent light. Extremely rare. "Emerald by day, ruby by night." Russian origin (1830). Best cuts: cushion, round, oval. Visual: dramatic color-change, green to red shift. Prompt keywords: "alexandrite, color-change gem, green to red shift, daylight emerald, candlelight ruby, extremely rare."
`,

  "design-styles-guide.md": `# Jewelry Design Styles — Comprehensive Guide

## Art Deco (1920s-1930s)
Geometric precision. Bold symmetry. Clean lines and sharp angles. Stepped forms. Contrasting colors (onyx+diamond, sapphire+diamond). Platinum era. Milgrain edging. Calibre-cut colored stones. Architectural influence. Egyptian and Aztec motifs. Machine-age elegance. Visual signature: symmetric geometry, stepped profiles, contrasting dark/light elements. Prompt keywords: "art deco jewelry, geometric symmetry, stepped design, milgrain edges, platinum and diamond, 1920s elegance, bold contrasting colors, architectural precision."

## Art Nouveau (1890s-1910s)
Flowing organic curves. Nature-inspired: flowers, vines, insects, women's forms. Whiplash curves. Enamel work (plique-a-jour). Subdued, ethereal color palettes. Asymmetric compositions. Moonstone, opal, pearl prominently featured. Visual signature: sinuous curves, nature motifs, dreamlike quality. Prompt keywords: "art nouveau jewelry, flowing organic curves, nature-inspired, sinuous lines, enamel work, dreamy ethereal quality, floral and vine motifs."

## Victorian (1837-1901)
Sentimental symbolism. Mourning jewelry (jet, onyx, hair). Romantic motifs: hearts, flowers, bows, snakes (eternity symbol). Three periods: Romantic (colorful, nature), Grand (dark, somber), Aesthetic (eclectic, Japanese influence). Heavy use of gold. Seed pearls. Visual signature: ornate, sentimental, symbolic. Prompt keywords: "Victorian jewelry, ornate gold, sentimental symbolism, romantic motifs, seed pearls, historical elegance, elaborate detail."

## Edwardian (1901-1915)
Platinum's debut. Delicate, lacy metalwork. Filigree and milgrain. "Garland style" — wreaths, bows, swags. White-on-white palette (platinum+diamond+pearl). Feminine, aristocratic elegance. Influenced by French haute couture. Visual signature: delicate lacework in platinum, airy and refined. Prompt keywords: "Edwardian jewelry, platinum filigree, delicate lacework, garland style, bow and swag motifs, refined aristocratic elegance, white-on-white palette."

## Minimalist
Stripped to essential form. Clean geometry. Negative space is a design element. Thin bands, simple shapes. Focus on quality of line and proportion rather than ornament. Modern, everyday elegance. Visual signature: clean, unadorned, geometric purity. Prompt keywords: "minimalist jewelry, clean lines, essential form, negative space, thin elegant profile, geometric purity, modern simplicity."

## Contemporary/Modern
Current design language. Mixing traditional and innovative. Asymmetry accepted. Unconventional materials occasionally. Geometric and organic blend. Statement-making but wearable. Visual signature: fresh, innovative, current trends. Prompt keywords: "contemporary jewelry design, modern aesthetic, innovative form, clean but bold, current design language."

## Bohemian
Free-spirited, nature-connected aesthetic. Mixed materials (leather, beads, metals). Layered and stacked wearing style. Turquoise, amber, moonstone featured. Handcrafted quality. Organic shapes. Cultural influences. Visual signature: eclectic layering, natural materials, earthy warmth. Prompt keywords: "bohemian jewelry, layered natural materials, free-spirited design, turquoise and amber, handcrafted organic form."

## Vintage Revival
Reproduction of historical styles with modern construction. Cherry-picks iconic elements from different eras. Milgrain, filigree, colored center stones. Romantic, nostalgic aesthetic. Visual signature: historical inspiration with modern precision. Prompt keywords: "vintage-inspired jewelry, antique revival, milgrain detailing, romantic nostalgia, historical motifs with modern construction."

## Brutalist
Raw, unfinished aesthetic. Visible tool marks. Rough textures. Asymmetric, sculptural forms. Bold, confrontational scale. Oxidized/blackened metals. Anti-precious aesthetic. Visual signature: raw, unpolished, sculptural, bold. Prompt keywords: "brutalist jewelry, raw textured metal, sculptural form, oxidized finish, bold asymmetric design, visible hammer marks."

## Temple/Indian
Intricate traditional motifs. Kundan, polki, meenakari techniques. Heavy gold work. Rubies, emeralds, uncut diamonds. Deity and nature symbolism. Temple architecture influence. Jhumka (bell-shaped earring). Elaborate necklace sets. Visual signature: ornate gold, rich color, religious/cultural symbolism. Prompt keywords: "temple jewelry, Indian traditional design, kundan work, heavy gold, rubies and emeralds, intricate cultural motifs, ornate traditional craftsmanship."

## Geometric
Shape-driven design language. Circles, triangles, hexagons as primary motifs. Mathematical precision. Pattern repetition. Can be minimalist or maximalist. Influenced by architecture and mathematics. Visual signature: precise shapes, pattern repetition, mathematical beauty. Prompt keywords: "geometric jewelry, precise shapes, mathematical patterns, circle and triangle motifs, architectural precision, pattern-driven design."

## Nature/Organic
Direct inspiration from natural forms. Leaves, branches, flowers, animals, water, coral. Can be realistic or abstracted. Textured surfaces mimicking natural materials. Visual signature: flowing natural forms, organic textures, botanical accuracy. Prompt keywords: "nature-inspired jewelry, organic flowing forms, leaf and branch motifs, botanical detail, textured natural surfaces, floral design."

## Celestial
Stars, moons, suns, planets as motifs. Cosmic symbolism. Mixed metals for star effects. Scattered diamond "stars." Crescent moon profiles. Popular in contemporary fashion. Visual signature: cosmic motifs, scattered sparkle, ethereal heavenly quality. Prompt keywords: "celestial jewelry, star and moon motifs, cosmic design, scattered diamonds, ethereal heavenly quality, night sky inspiration."
`,

  "gemstone-settings-guide.md": `# Gemstone Settings — Comprehensive Guide

## Prong Setting (Claw Setting)
Metal claws grip the stone's girdle. Most common setting type. Maximizes light entry and stone visibility. Standard 4-prong for round stones, 6-prong for extra security. Thin prongs in platinum, thicker in gold. Risk: prongs catch on fabric. Best for: solitaire engagement rings, pendants. Compatible shapes: round, oval, cushion, pear, marquise, heart. Complexity: low-medium. Cost impact: baseline.

## Bezel Setting
Continuous metal rim encircles the stone's girdle entirely. Maximum stone security. Sleek, modern aesthetic. Reduces snagging. Adds visual weight around stone. Requires precise stone-seat cutting — wall thickness minimum 0.5mm. Best for: active-wear jewelry, contemporary designs, emerald cuts. Compatible shapes: round, oval, cushion, emerald-cut, baguette. Complexity: medium. Cost impact: +15-25% labor vs prong.

## Channel Setting
Stones sit in a metal channel between two parallel walls. No metal between stones — creates continuous sparkle line. Common for wedding bands and eternity rings. Requires uniform stone sizes. Best for: bands, accent rows, half-eternity designs. Compatible shapes: round, princess, baguette. Complexity: medium-high. Cost impact: +20-30% (precision alignment required).

## Pave Setting
Tiny stones set close together with minimal metal visible, held by small beads of metal. Creates a "paved" surface of brilliance. French pave uses V-shaped grooves. Micro-pave uses stones under 1mm. Best for: halos, accent bands, luxury surfaces. Compatible shapes: round only (for traditional pave). Complexity: high. Cost impact: +40-60% (labor intensive, many stones).

## Tension Setting
Stone held by pressure of the metal band itself — appears to float. Modern, minimalist aesthetic. Requires very hard metals (platinum, titanium). Limited to specific stone sizes and hardness. Dramatic visual impact. Best for: contemporary engagement rings, statement pieces. Compatible shapes: round, princess, emerald-cut. Complexity: very high. Cost impact: +50-80% (engineering precision required).

## Flush Setting (Gypsy Setting)
Stone sits level with metal surface. Clean, smooth profile. Very secure. Masculine aesthetic common in men's rings. Stone appears embedded in the metal. Best for: wedding bands, men's jewelry, industrial designs. Compatible shapes: round primarily. Complexity: medium. Cost impact: +10-20%.

## Halo Setting
Central stone surrounded by a border of smaller accent stones. Makes center stone appear larger. Adds brilliance and visual weight. Classic or modern depending on halo shape. Double halo for extra drama. Best for: engagement rings, pendants, earrings. Compatible shapes: round, cushion, oval, emerald-cut, pear. Complexity: high. Cost impact: +30-50% (accent stones + labor).

## Cathedral Setting
Arching metal supports rise from the band to hold the stone, resembling cathedral arches. Elevates stone above the band. Elegant, traditional aesthetic. Adds structural support. Best for: engagement rings, statement solitaires. Compatible shapes: round, oval, cushion. Complexity: medium. Cost impact: +15-25%.

## Cluster Setting
Multiple smaller stones arranged to create the illusion of a single larger stone. Cost-effective alternative to large solitaires. Creates interesting visual patterns. Best for: cocktail rings, vintage designs, brooches. Compatible shapes: round, marquise (for flower clusters). Complexity: high. Cost impact: moderate (smaller stones, more labor).

## Bar Setting
Metal bars between each stone instead of continuous channel. Shows more of each stone's profile than channel setting. Modern alternative to channel. Best for: wedding bands, tennis bracelets. Compatible shapes: round, baguette, princess. Complexity: medium. Cost impact: +15-25%.

## Invisible Setting (Mystery Setting)
Stones set with no visible metal — appear to float together in a seamless surface. Patented by Van Cleef & Arpels. Grooves cut into stone pavilions slide onto thin metal rails. Extremely labor intensive. Best for: luxury statement pieces, high jewelry. Compatible shapes: princess, baguette (square/rectangular). Complexity: extreme. Cost impact: +100-200%.

## Burnish Setting
Stone pressed into a drilled hole in metal, then metal edges pushed over the stone. Similar to flush but with visible metal lip. Very durable. Best for: scattered accent stones, textured surfaces. Compatible shapes: round. Complexity: low-medium. Cost impact: baseline.

## Collet Setting
Open-back tube or cup of metal holds the stone. Historical setting type. Allows light through back of stone. Vintage aesthetic. Best for: antique reproductions, period jewelry, colored stones. Compatible shapes: round, oval. Complexity: low. Cost impact: baseline.

## Illusion Setting
Metal plate beneath diamond cut and polished to look like a larger stone. Small diamond appears much bigger. Budget-friendly sparkle. Best for: affordable engagement rings, stud earrings. Compatible shapes: round primarily. Complexity: medium. Cost impact: -20-40% (smaller stone needed).

## Beaded Setting
Similar to pave but with more visible metal beads holding stones. Decorative metal work becomes part of the design. Traditional European technique. Best for: vintage designs, art deco pieces. Compatible shapes: round. Complexity: high. Cost impact: +30-50%.

## Trellis Setting
Open metalwork pattern holds the stone, visible from the side. Lighter, more airy feel than solid settings. Decorative side profile. Best for: engagement rings where profile matters. Compatible shapes: round, oval, cushion. Complexity: medium. Cost impact: +10-20%.
`,

  "gemstone-shapes-guide.md": `# Gemstone Shapes & Cuts — Comprehensive Guide

## Round Brilliant
58 facets. Maximum light return and fire. Most popular diamond shape (75% of diamonds sold). Symmetrical circular outline. Ideal for: solitaires, halos, pave accents. Grading: cut quality critical (Excellent/Ideal). Visual: intense sparkle, rainbow fire, white light flashes. Prompt keywords: "brilliant-cut round diamond, rainbow fire, maximum sparkle, 58 facets."

## Princess Cut
Square outline with pointed corners. 50-58 facets. Second most popular. Modern, geometric aesthetic. Shows more rough weight than round — typically 10-15% cheaper per carat. Corner vulnerability — needs protective setting (V-prong or bezel corners). Ideal for: contemporary engagement rings, channel-set bands. Visual: crisp geometric sparkle, sharp lines. Prompt keywords: "princess-cut diamond, square brilliant, sharp geometric facets, modern fire."

## Emerald Cut
Rectangular with truncated corners. Step-cut facets (parallel lines). 50-58 facets. Hall-of-mirrors effect rather than sparkle. Showcases clarity — flaws more visible. Art Deco signature shape. Elongates the finger. Ideal for: three-stone rings, vintage designs, solitaires. Visual: long, elegant flashes of light, mirror-like reflections, architectural feel. Prompt keywords: "emerald-cut, step facets, hall of mirrors, elongated rectangular, art deco elegance."

## Cushion Cut
Square/rectangular with rounded corners. Pillow-like shape. Larger facets produce broad light patterns ("chunky fire"). Antique/old mine cut origin. Soft, romantic aesthetic. Ideal for: vintage settings, halos, colored gemstones. Visual: large, soft fire patterns, warm glow. Prompt keywords: "cushion-cut, pillow shape, broad facets, soft fire, vintage warmth."

## Oval Cut
Elongated round brilliant. 56-58 facets. Creates illusion of larger size. Elongates finger. Bow-tie effect (dark area across center) — minimize with good cut. Ideal for: solitaires, three-stone, east-west settings. Visual: elongated brilliance, elegant proportion. Prompt keywords: "oval brilliant, elongated sparkle, symmetrical curves, finger-flattering proportion."

## Marquise Cut
Elongated with pointed ends. "Navette" shape. Football-like outline. Maximizes perceived carat weight. French origin (Marquise de Pompadour). Vulnerable points need V-prong protection. Ideal for: solitaires, vintage, cluster centers. Visual: dramatic, royal, elongated. Prompt keywords: "marquise cut, pointed ends, navette shape, dramatic elongation, regal proportion."

## Pear Cut (Teardrop)
One pointed end, one rounded end. Combination of round and marquise. Versatile orientation (point up or down). Elongates finger when worn point-out. Common in pendants and earrings. Ideal for: pendants, drop earrings, solitaire rings. Visual: elegant teardrop, asymmetric beauty. Prompt keywords: "pear-cut, teardrop shape, flowing lines, asymmetric elegance."

## Radiant Cut
Rectangular/square with cropped corners. Brilliant-style facets on a step-cut outline. Combines emerald-cut outline with round-brilliant fire. 70 facets. Ideal for: colorful gemstones, contemporary settings. Visual: intense sparkle in rectangular frame. Prompt keywords: "radiant cut, brilliant fire in rectangular form, cropped corners, intense sparkle."

## Asscher Cut
Square step-cut with deeply truncated corners (nearly octagonal). High crown, deep pavilion. Art Deco signature (1902, Royal Asscher Diamond Company). "X" pattern visible from above. Ideal for: vintage, art deco, solitaires. Visual: hypnotic concentric squares, windmill pattern. Prompt keywords: "asscher cut, octagonal step-cut, concentric facets, art deco geometry."

## Heart Cut
Heart-shaped outline. Modified brilliant cut. 56-58 facets. Romantic symbol. Requires excellent symmetry — both lobes must match. Best above 0.50ct for shape visibility. Ideal for: romantic gifts, pendants, novelty. Visual: unmistakable heart silhouette with fire. Prompt keywords: "heart-shaped diamond, romantic brilliance, symmetric lobes, sentimental sparkle."

## Trillion (Trilliant) Cut
Triangular outline. Modified brilliant cut. 31-50 facets. Bold, contemporary shape. Often used as side stones flanking a center stone. Ideal for: accent stones, contemporary solitaires, earrings. Visual: geometric, modern, eye-catching triangle. Prompt keywords: "trillion cut, triangular brilliance, bold geometry, modern accent."

## Baguette Cut
Long, rectangular step-cut. 14 facets. Clean, architectural lines. Minimal fire — prized for clarity and geometry. Classic art deco accent. Usually small (accent role). Ideal for: accent stones, channel settings, art deco bands. Visual: clean lines, transparent steps, architectural precision. Prompt keywords: "baguette cut, step-cut rectangle, art deco lines, transparent clarity."

## Rose Cut
Flat bottom, domed top with triangular facets. Historical cut (16th century). 3-24 facets. Subtle, romantic glow rather than intense sparkle. Vintage/antique aesthetic. Ideal for: vintage reproductions, bohemian designs, stacking rings. Visual: soft dome, gentle shimmer, antique character. Prompt keywords: "rose-cut, domed facets, vintage shimmer, antique glow, historical romance."

## Old European Cut (OEC)
Predecessor to modern round brilliant. High crown, small table, large culet (visible). 58 facets but less precision than modern cuts. Produces broad, warm flashes ("old-world fire"). Ideal for: antique reproductions, vintage engagement rings. Visual: warm chunky fire, visible culet, character and charm. Prompt keywords: "old European cut, antique brilliant, warm fire, high crown, vintage character."

## Cabochon Cut
Polished dome with no facets. Smooth, rounded surface. Showcases color and optical phenomena (star effect, cat's eye, adularescence). Essential for: star sapphires, cat's eye chrysoberyl, opals, moonstone, turquoise. Not used for transparent stones where brilliance matters. Visual: smooth dome, rich color saturation, potential light effects. Prompt keywords: "cabochon, polished dome, smooth surface, rich color, no facets."
`,

  "manufacturing-techniques-guide.md": `# Jewelry Manufacturing Techniques

## Lost Wax Casting
Most common production method. Process: carve wax model → create plaster mold → burn out wax → pour molten metal. Produces: complex 3D shapes, undercuts, hollow forms. Surface: requires finishing (filing, sanding, polishing). Minimum wall thickness: 0.8mm. Best for: rings, pendants, complex forms. Modern variant: 3D print resin model instead of hand-carved wax. Prompt keywords: "cast jewelry, smooth flowing metal forms, organic casting shapes."

## Fabrication (Hand-Built)
Metal sheet and wire formed by hand using tools. Processes: sawing, filing, soldering, bending, forming, raising. Produces: clean geometric forms, precise angles, architectural quality. Higher labor cost but distinctive character. Best for: geometric designs, one-of-a-kind pieces, contemporary art jewelry. Prompt keywords: "fabricated jewelry, precise metalwork, geometric construction, clean solder joints."

## Filigree
Fine twisted wire soldered into delicate patterns. Ancient technique (3000+ years). Creates lace-like openwork. Wire diameter: 0.3-1mm. Extremely labor intensive. Cultural associations: Portuguese, Mediterranean, Indian. Best for: vintage designs, delicate pendants, ornamental frames. Prompt keywords: "filigree metalwork, delicate twisted wire, lace-like openwork, intricate fine detail, historical craftsmanship."

## Granulation
Tiny metal spheres (granules) fused to a metal surface. Ancient Etruscan technique. Creates textured surfaces and decorative patterns. Granule sizes: 0.3-2mm. Fusion bonding (no solder visible). Best for: ethnic designs, textured surfaces, historical reproductions. Prompt keywords: "granulation texture, tiny metal spheres, Etruscan technique, beaded surface pattern."

## Mokume-gane
Japanese metalworking technique. Layers of different metals forged, twisted, carved to reveal wood-grain pattern. Common metals: gold + silver, copper + silver, gold + platinum. Each piece unique. Best for: wedding bands, statement rings, contemporary art jewelry. Prompt keywords: "mokume-gane, wood-grain metal pattern, layered metal fusion, organic flowing lines, Japanese metalwork."

## Electroforming
Electrolytic metal deposition onto a mold. Creates hollow, lightweight forms. Allows very large, bold designs without excessive weight. Used for: large earrings, statement pieces, theatrical jewelry. Shell thickness: 0.5-2mm. Prompt keywords: "electroformed jewelry, lightweight hollow form, bold scale, dramatic lightweight construction."

## 3D Printing (Additive Manufacturing)
Direct metal printing (DMLS) or resin-to-casting. Enables: impossible geometries, lattice structures, mathematically generated forms. Growing in bespoke/custom work. Materials: stainless steel, titanium, gold (direct), castable resin (indirect). Best for: custom designs, Voronoi patterns, parametric jewelry. Prompt keywords: "3D printed jewelry, parametric design, lattice structure, computational geometry, modern manufacturing."

## Engraving
Cutting patterns/text into metal surface. Hand engraving (burin/graver tool) vs machine engraving vs laser engraving. Creates: monograms, patterns, textures, personalization. Depth: shallow (decorative) to deep (relief). Best for: personalization, pattern work, signet rings. Prompt keywords: "engraved jewelry, carved metal surface, detailed line work, personalized inscription."

## Enameling
Glass powder fused to metal surface at high temperature. Types: cloisonne (wire borders), champleve (carved recesses), plique-a-jour (translucent, no backing), painted enamel. Adds vibrant permanent color to metal. Historical importance (Byzantine, Art Nouveau). Best for: colorful designs, art nouveau, cultural jewelry. Prompt keywords: "enameled jewelry, vibrant glass-on-metal color, cloisonne borders, translucent plique-a-jour, permanent color."

## Stone Setting
Specialized skill of securing gemstones in metal. Techniques match setting types (prong, bezel, pave, channel, etc.). Requires: precision measuring, metal manipulation, stone knowledge. Tools: burnisher, beading tool, prong pusher, graver. The setter's skill directly affects: stone security, visual alignment, light performance. Critical manufacturing step — errors can damage stones. Prompt keywords: "precision stone setting, secure gemstone mounting, aligned prong work, professional gem setting."

## Polishing & Finishing
Final surface treatment. Steps: filing → sanding (progressive grits) → pre-polish (tripoli compound) → final polish (rouge compound). Finishes: high polish (mirror), matte (sandblast/chemical), satin (directional brush), hammered (textured), oxidized (chemically darkened). Each finish dramatically changes character. Prompt keywords: "high polish mirror finish, satin brushed metal, hammered texture, oxidized dark patina."
`,
};
