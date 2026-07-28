import { neon } from '@neondatabase/serverless';

// The Neon HTTP driver runs every query through global `fetch`, and Next.js
// patches fetch with its Data Cache. Without opting out, a query result can be
// replayed from that cache long after the underlying rows changed.
//
// Caught live on 28 Jul 2026, minutes after the outage fix deployed: the daily
// pipeline had just written 158 fresh prices, /api/suggestions showed the new
// day correctly, and /api/prices kept serving the previous day's 15 rows. Same
// deployment, same database, x-vercel-cache MISS on both. The difference was
// that /api/suggestions sets `revalidate = 0` and /api/prices never did.
//
// Fixing it here covers every route at once instead of relying on each one to
// remember. This is the project's "Vercel serves stale data" scar, one layer
// deeper than the CDN version already in the do-not-reintroduce list.
const sql = neon(process.env.DATABASE_URL!, {
  fetchOptions: { cache: 'no-store' },
});

export { sql };

export type Commodity = {
  id: string;
  name: string;
  category: string;
  specification: string | null;
  created_at: string;
};

export type Price = {
  id: string;
  commodity_id: string;
  price_date: string;
  price_prevailing: number | null;
  created_at: string;
};

export type PriceWithCommodity = Price & {
  name: string;
  category: string;
  specification: string | null;
};

export type MealSuggestion = {
  name: string;
  description: string;
  estimated_cost: number;
  ingredients: Array<{
    name: string;
    amount: string;
    current_price: number;
  }>;
  steps: string[];
};

export type DailySuggestion = {
  id: string;
  suggestion_date: string;
  meals: MealSuggestion[];
  cheapest_ingredients: Array<{
    name: string;
    category: string;
    price: number;
    specification?: string;
  }>;
  created_at: string;
};
