import { SKYGEMS_PROMPT_PACK_VERSION, type JewelryType } from "@skygems/shared";

import type { ViewPackRelease } from "./types.ts";

function buildPlan(
  jewelryType: JewelryType,
  compositionPrompt: string,
  views: Array<{ id: string; label: string; instruction: string }>,
) {
  return {
    jewelryType,
    compositionPrompt,
    views,
  };
}

export const viewPackV1: ViewPackRelease = {
  packId: "view-pack",
  version: `${SKYGEMS_PROMPT_PACK_VERSION}.views.v1`,
  content: {
    plans: {
      ring: buildPlan(
        "ring",
        "A jewelry design sheet showing TWO hand-drawn views of the same finger ring on white paper: a FRONT VIEW showing the ring face-on with the setting visible and a TOP VIEW from directly above showing the band as a circle with the head and crown. Both views are side by side with clear spacing. The full ring is visible in each view with nothing cropped.",
        [
          { id: "front", label: "Front View", instruction: "Show the ring face-on with the setting visible." },
          { id: "top", label: "Top View", instruction: "Show the band as a circle from directly above with the head and crown visible." },
        ],
      ),
      necklace: buildPlan(
        "necklace",
        "A jewelry design sheet showing TWO hand-drawn views of the same necklace on white paper: a FRONT VIEW with the complete necklace laid in a U-shape from clasp to clasp and a DETAIL VIEW of the pendant from the front showing the bail and setting. Both views are side by side. The entire necklace is visible in the front view with nothing cropped.",
        [
          { id: "front", label: "Front View", instruction: "Show the complete necklace laid in a U-shape from clasp to clasp." },
          { id: "detail", label: "Pendant Detail", instruction: "Show the pendant from the front with the bail and setting." },
        ],
      ),
      earrings: buildPlan(
        "earrings",
        "A jewelry design sheet showing TWO hand-drawn views of the same earring on white paper: a FRONT VIEW showing the earring face-on from ear wire to lowest point and a SIDE PROFILE VIEW showing depth and construction. Also show the matching pair. All views are clearly separated and nothing is cropped.",
        [
          { id: "front", label: "Front View", instruction: "Show the earring face-on from ear wire to lowest point." },
          { id: "side", label: "Side Profile", instruction: "Show depth and construction from the side." },
        ],
      ),
      bracelet: buildPlan(
        "bracelet",
        "A jewelry design sheet showing TWO hand-drawn views of the same bracelet on white paper: a TOP VIEW of the complete bracelet as a closed oval from above with the clasp visible and a SIDE PROFILE VIEW showing the bracelet edge-on to reveal width and thickness. Both views are side by side and the full bracelet is visible with nothing cropped.",
        [
          { id: "top", label: "Top View", instruction: "Show the complete bracelet as a closed oval from above with the clasp visible." },
          { id: "side", label: "Side Profile", instruction: "Show the bracelet edge-on to reveal width and thickness." },
        ],
      ),
      pendant: buildPlan(
        "pendant",
        "A jewelry design sheet showing TWO hand-drawn views of the same pendant on white paper: a FRONT VIEW showing the pendant face-on with the bail at the top and a SIDE PROFILE VIEW showing depth and construction. Both views are side by side with nothing cropped.",
        [
          { id: "front", label: "Front View", instruction: "Show the pendant face-on with the bail at the top." },
          { id: "side", label: "Side Profile", instruction: "Show the pendant depth and construction from the side." },
        ],
      ),
    },
  },
};
