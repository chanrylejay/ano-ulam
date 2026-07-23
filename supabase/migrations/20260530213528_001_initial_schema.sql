/*
  # Initial Schema for Ano Ulam

  1. New Tables
    - `commodities`: Master table for all commodities tracked by DA
      - `id` (uuid, primary key)
      - `name` (text, commodity name)
      - `category` (text, commodity category)
      - `specification` (text, size/grade specification)
      - `created_at` (timestamp)
    
    - `prices`: Daily price records
      - `id` (uuid, primary key)
      - `commodity_id` (uuid, foreign key to commodities)
      - `price_date` (date, date of price)
      - `price_prevailing` (numeric, prevailing price in pesos/kg)
      - `created_at` (timestamp)
    
    - `daily_suggestions`: AI-generated meal suggestions
      - `id` (uuid, primary key)
      - `suggestion_date` (date, date of suggestion)
      - `meals` (jsonb, array of meal objects)
      - `cheapest_ingredients` (jsonb, array of cheapest ingredients)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Public read access for all tables (data is public)
    - No write access from frontend (only server-side operations)

  3. Indexes
    - Index on `prices.price_date` for efficient date queries
    - Index on `prices.commodity_id` for joins
    - Index on `commodities.category` for filtering
    - Index on `daily_suggestions.suggestion_date` for date lookup

  4. Notes
    - Commodities are unique by name + specification using unique index
    - Prices are unique by commodity_id + price_date
    - One suggestion per day maximum
*/

-- Create commodities table
CREATE TABLE IF NOT EXISTS commodities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category text NOT NULL,
  specification text DEFAULT ''::text,
  created_at timestamptz DEFAULT now()
);

-- Create unique index for name + specification combination
CREATE UNIQUE INDEX IF NOT EXISTS idx_commodities_unique ON commodities(name, specification);

-- Create prices table
CREATE TABLE IF NOT EXISTS prices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  commodity_id uuid NOT NULL REFERENCES commodities(id) ON DELETE CASCADE,
  price_date date NOT NULL,
  price_prevailing numeric,
  created_at timestamptz DEFAULT now()
);

-- Create unique constraint for commodity + date
CREATE UNIQUE INDEX IF NOT EXISTS idx_prices_unique ON prices(commodity_id, price_date);

-- Create daily_suggestions table
CREATE TABLE IF NOT EXISTS daily_suggestions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  suggestion_date date NOT NULL,
  meals jsonb NOT NULL DEFAULT '[]'::jsonb,
  cheapest_ingredients jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- Create unique constraint for suggestion date
CREATE UNIQUE INDEX IF NOT EXISTS idx_daily_suggestions_unique ON daily_suggestions(suggestion_date);

-- Enable RLS on all tables
ALTER TABLE commodities ENABLE ROW LEVEL SECURITY;
ALTER TABLE prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_suggestions ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access (data is publicly available)
CREATE POLICY "Public can read commodities"
  ON commodities FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Public can read prices"
  ON prices FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Public can read suggestions"
  ON daily_suggestions FOR SELECT
  TO public
  USING (true);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_prices_price_date ON prices(price_date);
CREATE INDEX IF NOT EXISTS idx_prices_commodity_id ON prices(commodity_id);
CREATE INDEX IF NOT EXISTS idx_commodities_category ON commodities(category);