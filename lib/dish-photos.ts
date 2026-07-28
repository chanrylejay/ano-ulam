// ═══════════════════════════════════════════════════════════
// Dish photos — the slot, ready before the photos are
// ═══════════════════════════════════════════════════════════
// "Jam" sent an unsolicited app-style mockup in Jun 2026 built around a hero
// dish photo. Chan liked it and worried images would slow the site down. That
// worry is settled: Next.js on Vercel serves AVIF/WebP, resizes per device,
// lazy-loads and caches at the edge. A handful of images is not the problem.
//
// The real blocker is that 47 photos do not exist yet. So the layout ships
// first and the photos arrive later, one at a time, with no further code work.
//
// TO ADD A PHOTO:
//   1. drop the file in  public/dishes/<recipe-id>.png
//      (recipe ids are in lib/recipes.ts — e.g. "pinakbet", "pritong-tilapia")
//   2. add one line to DISH_PHOTOS below
//
// PNG, not JPG. The plate floats free on the orange gradient with no frame
// around it, so the file needs a real alpha channel — a JPG would arrive as a
// white square. Check with: colour type 6 in the PNG header means RGBA.
//
// House style, so 47 of them look like one set rather than 47 photoshoots:
// square, plate centred and filling ~85% of the frame, camera locked at 90
// degrees overhead, plain white matte plate, soft light from upper left,
// transparent background, nothing else in the frame. The full generation
// prompt lives with Chan; the template is what keeps them consistent.
//
// The explicit map exists so a missing file can never 404. Deriving the path
// from the id would make every photo-less dish request an image that is not
// there, on every page load, for all 47 of them.

export interface DishPhoto {
  /** Path under /public. */
  src: string;
  /** Who took it. Shown as a small credit; required if it is not Chan's own. */
  credit?: string;
}

export const DISH_PHOTOS: Record<string, DishPhoto> = {
  "ginataang-kalabasa": { src: "/dishes/ginataang-kalabasa.png" },
};

export function dishPhoto(recipeId: string): DishPhoto | undefined {
  return DISH_PHOTOS[recipeId];
}

/** How many of the 47 have a photo. Used to decide whether to nudge for more. */
export function dishPhotoCount(): number {
  return Object.keys(DISH_PHOTOS).length;
}
