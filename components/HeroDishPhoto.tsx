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
      Absolutely anchored to the right of the hero row and vertically centred,
      NOT a flex sibling of the title.

      As a flex item the plate could only ever be as tall as the text beside
      it, which left a band of empty orange above and below it — the dead space
      Chan circled. Taking it out of flow lets it fill the row's full height
      and spill past the right edge, so the header has no wasted room in it.
    */
    <div className="pointer-events-none absolute inset-y-0 right-0 -mr-8 sm:-mr-10 md:-mr-12">
      {/* Square, sized off the row's height rather than fixed pixels, so it
          grows with the header at every breakpoint instead of at three. */}
      <div className="relative h-full aspect-square">
        <Image
          src={photo.src}
          alt={name}
          fill
          sizes="(max-width: 640px) 240px, 384px"
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
