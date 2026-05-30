import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

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
