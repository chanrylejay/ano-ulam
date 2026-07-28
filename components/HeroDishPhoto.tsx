"use client";

// ═══════════════════════════════════════════════════════════
// The hero dish photo — today's pick, floating on the gradient
// ═══════════════════════════════════════════════════════════
// This started as a "Rekomendasyon Ngayon" card carrying an eyebrow, the dish
// name, a price and a servings line. Chan killed all of that on sight:
// "the rekomendasyon ngayon section is too big i think that is not necessary
// can we just remove that?"
//
// He is right. Every word of it was repeated in the meal card immediately
// below, so the header was announcing a dish and then the page announced the
// same dish again three inches later. What survives is the one part he liked
// about Jam's mockup: the big plate.
//
// The plate is a transparent PNG with NO frame around it. It deliberately
// hangs off the right edge of its column, which is how the mockup makes a
// plate read as large without actually spending that much width — the header's
// overflow-hidden does the cutting.

import Image from "next/image";
import { dishPhoto } from "@/lib/dish-photos";

interface HeroDishPhotoProps {
  /** Recipe id. No photo mapped for it means this renders nothing at all. */
  recipeId?: string;
  /** Dish name, for alt text. */
  name: string;
}

export function HeroDishPhoto({ recipeId, name }: HeroDishPhotoProps) {
  const photo = recipeId ? dishPhoto(recipeId) : undefined;
  if (!photo) return null;

  return (
    /*
      Bottom-right of the hero row, and it must fit INSIDE that row's height.

      An earlier version made the plate taller than the row so it grew up into
      the header padding. It looked bigger, but the header's overflow-hidden
      sliced a flat edge across the top of the plate — Chan: "its touching the
      header so its really weird". A circle cropped square at the top reads as
      a rendering bug, not a bleed. So the row's min-height is now at least the
      plate's size, and the row is bottom-aligned so the wordmark's baseline
      and the plate's base sit on the same line.

      Sideways is different: bleeding off the RIGHT edge is deliberate and
      reads as intentional, because a shape leaving the frame horizontally is a
      normal thing for a hero to do.

      Why it overlaps the text at all: the source PNG is a round plate inside a
      square canvas, so roughly 8.5% of each edge is transparent. The boxes can
      overlap by that much before anything visually touches — which is what
      closes the awkward orange gap between the wordmark and the dish without
      shrinking either one.
    */
    <div className="pointer-events-none absolute bottom-0 right-0 -mr-16 sm:-mr-14 md:-mr-8">
      <div className="relative h-60 w-60 sm:h-80 sm:w-80 md:h-80 md:w-80">
        <Image
          src={photo.src}
          alt={name}
          fill
          sizes="(max-width: 640px) 240px, (max-width: 768px) 320px, 416px"
          // CONTAIN, never cover: cover would crop the round plate back into a
          // square. The file already carries its own shadow, so none is added.
          className="object-contain"
          priority
        />
      </div>
      {/*
        Attribution is an obligation, not decoration. The moment a photo comes
        from someone in the FB group rather than from Chan, their name ships
        with it.
      */}
      {photo.credit && (
        <span className="mt-1 block text-center text-[10px] text-white/70">
          📷 {photo.credit}
        </span>
      )}
    </div>
  );
}

/** Whether a dish has a photo, so the header can pick its layout. */
export function hasDishPhoto(recipeId?: string): boolean {
  return recipeId ? dishPhoto(recipeId) !== undefined : false;
}
