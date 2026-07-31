"use client";

// ═══════════════════════════════════════════════════════════
// "Para sa ilan?" — the servings band picker
// ═══════════════════════════════════════════════════════════
// Chan asked whether this should be a dropdown. It should not.
//
//   · The page already speaks in pill rows (the protein tabs), so a dropdown
//     would be the only control of its kind on the site.
//   · A dropdown costs two taps. This costs one.
//   · A dropdown HIDES its options. Half the point of the feature is that
//     somebody cooking for nine finds out the app can do that, and they only
//     find out if the number is sitting there in front of them.
//
// It is deliberately quieter than the protein tabs underneath it: smaller
// pills, a label beside them. It is a setting you touch once, not a filter you
// browse with, and two equally loud pill rows stacked would read as one
// confusing eight-item control.

import { useCallback, useEffect, useState } from "react";
import {
  BASE_BAND,
  SERVING_BANDS,
  SERVINGS_STORAGE_KEY,
  bandByKey,
  type ServingBand,
} from "@/lib/servings";

/**
 * The chosen band, remembered on the phone.
 *
 * Shared by the homepage and /ulam so the two cannot disagree about how many
 * people you are cooking for.
 */
export function useServingBand(): [ServingBand, (band: ServingBand) => void] {
  const [band, setBand] = useState<ServingBand>(BASE_BAND);

  // Read AFTER mount, never during render. localStorage does not exist on the
  // server, so reading it while rendering makes the server HTML and the first
  // client render disagree and React throws the whole tree away.
  useEffect(() => {
    try {
      setBand(bandByKey(window.localStorage.getItem(SERVINGS_STORAGE_KEY)));
    } catch {
      // Private mode or storage disabled. Base band is a perfectly good default.
    }
  }, []);

  const choose = useCallback((next: ServingBand) => {
    setBand(next);
    try {
      window.localStorage.setItem(SERVINGS_STORAGE_KEY, next.key);
    } catch {
      // Not being able to remember it is not a reason to not apply it.
    }
  }, []);

  return [band, choose];
}

interface ServingsPickerProps {
  value: ServingBand;
  onChange: (band: ServingBand) => void;
}

export function ServingsPicker({ value, onChange }: ServingsPickerProps) {
  return (
    <div className="mb-3">
      <div
        className="scrollbar-hide -mx-4 flex items-center gap-2 overflow-x-auto px-4 pb-1"
        role="radiogroup"
        aria-label="Para sa ilang katao"
      >
        <span className="shrink-0 pr-0.5 text-xs font-semibold text-gray-500">
          Para sa ilan?
        </span>
        {SERVING_BANDS.map((band) => {
          const isActive = band.key === value.key;
          return (
            <button
              key={band.key}
              type="button"
              role="radio"
              aria-checked={isActive}
              onClick={() => onChange(band)}
              className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition-all ${
                isActive
                  ? "bg-gray-900 text-white shadow-sm"
                  : "border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              {band.people}
            </button>
          );
        })}
      </div>
      {/*
        Only shown once the choice actually changes something. At the base band
        this line would just be noise on every visit, and the price on the cards
        already says what it says.
      */}
      {value.multiplier > 1 && (
        <p className="mt-1.5 px-0.5 text-xs text-gray-500">
          Presyo at sangkap para sa{" "}
          <span className="font-semibold text-gray-700">{value.label}</span>.
        </p>
      )}
    </div>
  );
}
