"use client";

// ═══════════════════════════════════════════════════════════
// "Rekomendasyon Ngayon" — the headline answer, in the header
// ═══════════════════════════════════════════════════════════
// The idea comes from "Jam"'s Jun 2026 mockup, but NOT the execution.
//
// Chan, Jul 28 2026: "i actually dont like the whole design of jam... it looks
// really busy, i think we should improve it instead of copy it, i just like
// the big picture of the dish on the side it looks good."
//
// He is right about the busyness. The mockup stacks four separate panels
// inside one orange header (date chip, title block, a cream recommendation
// card, a ticker pill) and then repeats the same dish name and the same price
// again in the meal card directly below it.
//
// So: NO cream panel. The recommendation sits directly on the gradient as
// type, which removes a whole surface and lets the header breathe. The one
// thing kept from the mockup is the big dish photo beside the text.
//
// The photos do not exist yet (see lib/dish-photos.ts). Until one does, this
// centres as a single column, because a half-empty two-column header looks
// broken rather than spacious. The side layout switches on by itself the day a
// photo lands.

import Image from "next/image";
import { dishPhoto } from "@/lib/dish-photos";

interface RecommendationCardProps {
  name: string;
  cost: number;
  servings: string;
  /** Recipe id, used to look up a photo. Undefined means no photo, ever. */
  recipeId?: string;
  /** Category emoji, the stand-in while no photo exists. */
  emoji: string;
}

function formatPeso(amount: number): string {
  return `₱${Math.round(amount)}`;
}

export function RecommendationCard({
  name,
  cost,
  servings,
  recipeId,
  emoji,
}: RecommendationCardProps) {
  const photo = recipeId ? dishPhoto(recipeId) : undefined;

  return (
    <div
      className={`flex w-full items-center gap-4 ${photo ? "text-left" : "justify-center text-center"}`}
    >
      <div className={photo ? "min-w-0 flex-1" : "min-w-0"}>
        <p className="mb-1 text-[11px] font-bold uppercase tracking-[0.14em] text-white/70">
          Rekomendasyon ngayon
        </p>

        <h2
          className={`flex items-baseline gap-2 font-bold leading-tight text-white sm:text-3xl ${
            photo ? "text-xl" : "justify-center text-2xl"
          }`}
        >
          {!photo && (
            <span className="shrink-0" aria-hidden="true">
              {emoji}
            </span>
          )}
          <span className="min-w-0">{name}</span>
        </h2>

        <p
          className={`mt-1.5 flex items-center gap-2 text-sm text-white/80 ${
            photo ? "" : "justify-center"
          }`}
        >
          <span className="font-black text-white">{formatPeso(cost)}</span>
          <span aria-hidden="true">·</span>
          <span>{servings || "1-3 katao"}</span>
        </p>
      </div>

      {photo && (
        /*
          Floating free, Chan's call. No frame, no ring, no rounded crop: the
          plate is a cut-out PNG sitting straight on the gradient, the way it
          does in the mockup. That means object-CONTAIN, not cover — cover
          would crop the circle into a square and undo the whole effect.

          The generated files already carry their own soft shadow under the
          plate, so no drop-shadow is added here. Doubling it looks muddy.
        */
        <div className="-mr-7 flex shrink-0 flex-col items-center sm:-mr-10">
          <div className="relative h-40 w-40 sm:h-56 sm:w-56">
            <Image
              src={photo.src}
              alt={name}
              fill
              sizes="(max-width: 640px) 160px, 224px"
              className="object-contain"
              priority
            />
          </div>
          {/*
            Attribution is an obligation, not decoration. If a photo comes from
            someone in the FB group, their name ships with it.
          */}
          {photo.credit && (
            <span className="mt-1 text-[10px] text-white/70">📷 {photo.credit}</span>
          )}
        </div>
      )}
    </div>
  );
}
