# 🍳 ma, Ano Ulam?

**Daily Filipino meal suggestions based on real market prices.**

Every morning, Ano Ulam? checks today's palengke prices from the Department of Agriculture, runs a 47-recipe cost engine, and shows you the cheapest ulam options for your family — with per-ingredient cost breakdowns and trend arrows.

🔗 **Live:** [ma-anoulam.vercel.app](https://ma-anoulam.vercel.app)

---

## 📸 Screenshots

| Homepage | Price Dashboard |
|----------|----------------|
| ![Homepage](docs/screenshots/homepage.png) | ![Prices](docs/screenshots/prices.png) |

| Meal Card Detail | Mobile View |
|------------------|-------------|
| ![MealCard](docs/screenshots/mealcard.png) | ![Mobile](docs/screenshots/mobile.png) |

> 💡 *Screenshots show actual production data from DA Bantay Presyo NCR prices.*

---

## 🤔 What Is This?

**"Ma, ano ulam?"** — every Filipino has asked this question.

Ano Ulam? answers it with math, not guesswork. Instead of AI-generating random recipes (which gets ingredients wrong), it uses a **hardcoded database of 47 verified Filipino recipes** combined with **real daily market prices** from the Department of Agriculture.

The result: accurate meal suggestions with accurate costs, every single day, automatically.

---

## ✨ Features

- 🍲 **47 hardcoded Filipino recipes** — verified ingredients, real palengke quantities
- 📊 **Real DA Bantay Presyo prices** — scraped daily from the Department of Agriculture PDF
- 💰 **Per-ingredient cost breakdown** — see exactly what each ingredient costs today
- 📈 **Trend arrows** — ↑ price went up, ↓ price went down, → unchanged since yesterday
- 🏪 **Receipt-style price dashboard** — browse all ~55-60 commodity prices with search and filters
- 🤖 **Auto-daily via Vercel Cron** — new prices and suggestions every morning at 8 AM Manila time
- 🇵🇭 **Filipino naming** — meat cuts in English, veggies/fish in Filipino (Kamatis, Galunggong, Talong)
- 📱 **Mobile-friendly** — responsive design, works great on phones
- ⚡ **Zero AI calls per visit** — everything is pre-computed and cached. Instant load.
- 💸 **Costs ~₱0.50/day** — approximately $0.005-0.01/day in DeepSeek API costs

---

## 🔧 How It Works

Every day, two automated jobs run back-to-back:

```
8:00 AM Manila — PRICE INGESTION
    DA Bantay Presyo website
    → Find today's Daily Price Index PDF
    → Download and extract text (pdf-parse)
    → Send to DeepSeek for CSV extraction
    → Parse and upsert into Neon PostgreSQL
    → ~98 commodity prices updated

8:05 AM Manila — MEAL SUGGESTION
    Pull today's prices from database
    → Run 47 recipes through cost engine
    → Apply palengke rate overrides (bawang, sibuyas, luya)
    → Balanced selection: max 2 fish, 2 chicken, 2 pork, 1 beef, 1 egg, 1 veggie
    → Avoid duplicate main ingredients
    → Send 8 cheapest meals to DeepSeek for "Bakit?" reasoning
    → Cache results in database

When you visit the site:
    → Read from cache (zero AI calls)
    → Render meal cards with cost breakdowns
    → Done. Fast. Free.
```

---

## 🧠 Why Hardcoded Recipes Beat AI Generation

Early versions used DeepSeek to generate recipes on the fly. The results were **6-7/10 accuracy** — wrong ingredients for Filipino dishes, English names instead of local ones, bad cost estimates, and occasionally invented recipes that don't exist.

**The fix:** Hardcode all 47 recipes with verified ingredients and quantities (from actual palengke shopping experience), then use pure math for cost calculation.

Result: **10/10 accuracy.** AI is now used only for natural language reasoning ("Bakit ito ang mura ngayon?"), not for recipe data.

> **Lesson:** For domain-specific structured data (recipes, formulas, calculations), hardcoded databases + math engines outperform AI generation 10:1. Use AI for natural language tasks only.

---

## 🏗️ Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Database | Neon PostgreSQL (Singapore region) |
| AI | DeepSeek API (`deepseek-chat`) |
| Hosting | Vercel (Hobby plan) |
| PDF Parsing | pdf-parse v2 |
| Scheduling | Vercel Cron Jobs |
| Data Source | DA Bantay Presyo — Daily Price Index NCR |
| Analytics | Vercel Web Analytics |

---

## 📄 Pages

### `/` — Homepage
The main experience. Ticker-style hero showing 6 key commodity prices with 🟢🔴 indicators. Eight meal cards with per-ingredient cost breakdowns, trend arrows, green (required) and rose (optional) ingredient badges. ₱0 optional ingredients are automatically hidden.

### `/prices` — Presyo Ngayon
Receipt-style single-column price list. Each row shows an emoji, commodity name, and today's price. Color-coded: green (≤₱100), amber (≤₱250), red (₱251+). Includes search bar, 6 category filter pills, and sort toggle.

### `/about` — About
Mission, data source, how the engine works (3 steps), tech stack, and creator information.

---

## 💰 Cost Breakdown

| Service | Monthly Cost |
|---------|-------------|
| Vercel Hosting | $0 (Hobby plan) |
| Neon PostgreSQL | $0 (Free tier) |
| DeepSeek API | ~$0.15–0.30 |
| Domain | $0 (using .vercel.app) |
| **Total** | **~$0.15–0.30/month** |

---

## 📊 Data Source

All commodity prices come from the **Department of Agriculture — Bantay Presyo** program.

The system scrapes the [DA Daily Price Monitoring page](https://da.gov.ph) every morning for the latest **Daily Price Index** PDF covering the **National Capital Region (NCR)**.

Prices reflect prevailing rates at major Metro Manila wet markets and supermarkets.

---

## 🚀 Local Development

```bash
# Clone the repository
git clone https://github.com/chanrylejay/ano-ulam.git
cd ano-ulam

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Fill in:
#   DATABASE_URL=your_neon_connection_string
#   DEEPSEEK_API_KEY=your_deepseek_api_key
#   CRON_SECRET=your_cron_secret

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

To manually trigger the daily pipeline:
```bash
# Ingest today's prices
curl -X POST "http://localhost:3000/api/cron/ingest" -H "x-cron-secret: your_cron_secret"

# Generate meal suggestions
curl -X POST "http://localhost:3000/api/cron/suggest" -H "x-cron-secret: your_cron_secret"
```

---

## 📁 Project Structure

```
app/
  page.tsx                    # Homepage
  prices/page.tsx             # Price dashboard
  about/page.tsx              # About page
  layout.tsx                  # Root layout + Analytics
  api/
    cron/
      ingest/route.ts         # DA PDF scraping + price ingestion
      suggest/route.ts        # Meal suggestion generation
    prices/route.ts           # Prices API endpoint
    suggestions/route.ts      # Suggestions API endpoint
lib/
  db.ts                       # Neon PostgreSQL connection
  deepseek.ts                 # DeepSeek API client
  commodity-names.ts          # Smart commodity name mapping (V3)
  recipes.ts                  # 47-recipe database + cost engine (V3)
components/
  MealCard.tsx                # Meal card with cost breakdown (V2)
  Footer.tsx                  # Contact + DA attribution + credits
vercel.json                   # Cron job configuration
```

---

## 👨‍💻 Created By

**Chanryle Jay Cagara**
AI Automation & Technical Operations Specialist

- 🌐 [Portfolio](https://chanryle-cagara.vercel.app)
- 💼 [LinkedIn](https://linkedin.com/in/chanrylejay)
- 🐙 [GitHub](https://github.com/chanrylejay)
- 📧 chanrylecagara@gmail.com

---

## 📜 License

This project is licensed under the [MIT License](LICENSE).

---

> *"Ma, ano ulam?" — answered by math, not guesswork.*
