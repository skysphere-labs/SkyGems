# Prompt Engineering for AI Jewelry Design Images

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
