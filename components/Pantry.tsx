"use client";

// ═══════════════════════════════════════════════════════════
// Pantry state, shared by every page that shows a price
// ═══════════════════════════════════════════════════════════
// Same shape as useServingBand: one hook, localStorage, read after mount.
// Both settings belong to the person rather than to a page, so the homepage,
// /ulam and /pantry all read the same value and can never disagree.

import { useCallback, useEffect, useMemo, useState } from "react";
import { PANTRY_STORAGE_KEY, recipesAffected } from "@/lib/pantry";

const EMPTY: ReadonlySet<string> = new Set<string>();

export interface PantryState {
  owned: ReadonlySet<string>;
  toggle: (name: string) => void;
  addMany: (names: string[]) => void;
  clear: () => void;
  /** False until localStorage has been read, so the UI can avoid a checked/unchecked flash. */
  ready: boolean;
}

function read(): ReadonlySet<string> {
  try {
    const raw = window.localStorage.getItem(PANTRY_STORAGE_KEY);
    if (!raw) return EMPTY;
    const parsed: unknown = JSON.parse(raw);
    // Anything could be in storage: an older format, a hand-edited value, junk
    // from another app on the same origin. Only strings survive.
    if (!Array.isArray(parsed)) return EMPTY;
    return new Set(parsed.filter((v): v is string => typeof v === "string"));
  } catch {
    return EMPTY;
  }
}

function write(owned: ReadonlySet<string>): void {
  try {
    // Array.from, not a spread: tsconfig targets es5 and spreading a Set is the
    // TS2802 trap this project's platform notes call out by name.
    window.localStorage.setItem(PANTRY_STORAGE_KEY, JSON.stringify(Array.from(owned)));
  } catch {
    // Private mode. Not being able to remember it is not a reason to not apply it.
  }
}

export function useOwnedIngredients(): PantryState {
  const [owned, setOwned] = useState<ReadonlySet<string>>(EMPTY);
  const [ready, setReady] = useState(false);

  // After mount, never during render: localStorage does not exist on the server
  // and reading it while rendering throws the hydrated tree away.
  useEffect(() => {
    setOwned(read());
    setReady(true);
  }, []);

  const commit = useCallback((next: ReadonlySet<string>) => {
    setOwned(next);
    write(next);
  }, []);

  const toggle = useCallback(
    (name: string) => {
      setOwned((current) => {
        const next = new Set(current);
        if (next.has(name)) next.delete(name);
        else next.add(name);
        write(next);
        return next;
      });
    },
    [],
  );

  const addMany = useCallback(
    (names: string[]) => {
      setOwned((current) => {
        const next = new Set(current);
        for (const n of names) next.add(n);
        write(next);
        return next;
      });
    },
    [],
  );

  const clear = useCallback(() => commit(EMPTY), [commit]);

  return useMemo(
    () => ({ owned, toggle, addMany, clear, ready }),
    [owned, toggle, addMany, clear, ready],
  );
}

/**
 * The way back to the pantry, and the proof that it is switched on.
 *
 * Shown on the homepage and /ulam. When nothing is owned it is an invitation;
 * when something is, it reports exactly what it is doing to the prices, because
 * a setting that silently changes every number on the page has to announce
 * itself or it reads as a bug.
 */
export function PantryLink({ owned }: { owned: ReadonlySet<string> }) {
  const affected = recipesAffected(owned);
  const has = owned.size > 0;

  return (
    <a
      href="/pantry"
      className={`mb-3 flex items-center gap-2.5 rounded-xl border px-3.5 py-2.5 transition-colors ${
        has
          ? "border-emerald-200 bg-emerald-50 hover:bg-emerald-100/70"
          : "border-gray-200 bg-white hover:bg-gray-50"
      }`}
    >
      <span aria-hidden="true" className="text-base leading-none">
        🧺
      </span>
      <span className="min-w-0 flex-1 text-sm">
        {has ? (
          <>
            <span className="font-semibold text-emerald-900">
              {owned.size} sangkap sa bahay mo
            </span>
            <span className="text-emerald-700">
              {" "}
              · mas mura ang {affected} ulam
            </span>
          </>
        ) : (
          <>
            <span className="font-semibold text-gray-800">Anong meron ka sa bahay?</span>
            <span className="text-gray-500"> · para bumaba ang presyo</span>
          </>
        )}
      </span>
      <span aria-hidden="true" className={has ? "text-emerald-600" : "text-gray-400"}>
        →
      </span>
    </a>
  );
}

/**
 * The homepage version: a headline, not a link.
 *
 * Chan asked for this on 30 Jul 2026, the same day oil and pepper stopped being
 * free: *"i am actually thinking of showing this to the main page like a big
 * headline -- ang mahal na ng mga bilihin (emoji) - pababain muna natin, tick
 * your pantry items here to reduce total price"*.
 *
 * It earns the space. Ticking mantika alone takes P10 off 38 of the 47 dishes,
 * and paminta another P2 off 39, so this is the largest single lever a visitor
 * has over the numbers on the page. PantryLink stays the compact form for /ulam,
 * where the person has already seen this once.
 *
 * The empty and owned states say different things on purpose. Empty, it names
 * the problem the whole app is about. Owned, it stops complaining about prices
 * and reports what it took off, because a banner that keeps saying "things are
 * expensive" after you have acted on it is just noise.
 */
export function PantryBanner({ owned }: { owned: ReadonlySet<string> }) {
  const affected = recipesAffected(owned);
  const has = owned.size > 0;

  if (has) {
    return (
      <a
        href="/pantry"
        className="mb-4 flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3.5 transition-colors hover:bg-emerald-100/70"
      >
        <span aria-hidden="true" className="text-2xl leading-none">
          🧺
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-base font-bold leading-snug text-emerald-900">
            {owned.size} sangkap na nasa bahay mo
          </span>
          <span className="mt-0.5 block text-sm text-emerald-700">
            Mas mura na ang {affected} ulam. I-dagdag pa para mas bumaba.
          </span>
        </span>
        <span aria-hidden="true" className="shrink-0 text-xl text-emerald-600">
          →
        </span>
      </a>
    );
  }

  return (
    <a
      href="/pantry"
      className="mb-4 flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3.5 transition-colors hover:bg-amber-100/70"
    >
      <span aria-hidden="true" className="text-2xl leading-none">
        😩
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-base font-bold leading-snug text-gray-900">
          Ang mahal na ng mga bilihin!
        </span>
        <span className="mt-0.5 block text-sm text-gray-600">
          Pababain muna natin. I-tick ang nasa bahay mo na para bumaba ang total.
        </span>
      </span>
      <span aria-hidden="true" className="shrink-0 text-xl text-amber-600">
        →
      </span>
    </a>
  );
}
