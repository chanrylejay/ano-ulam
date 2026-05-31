"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { format } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowUpDown, Calendar, Home, ShoppingCart } from "lucide-react";
import { Footer } from "@/components/Footer";
import type { Price, Commodity } from "@/lib/db";

type PriceWithCommodity = Price & { commodities: Commodity };

const categories = [
  { value: "all", label: "All Categories", icon: "🛒" },
  { value: "rice", label: "Rice", icon: "🍚" },
  { value: "fish", label: "Fish", icon: "🐟" },
  { value: "beef", label: "Beef", icon: "🥩" },
  { value: "pork", label: "Pork", icon: "🥓" },
  { value: "poultry", label: "Poultry", icon: "🍗" },
  { value: "eggs", label: "Eggs", icon: "🥚" },
  { value: "lowland-vegetables", label: "Vegetables (Lowland)", icon: "🥬" },
  { value: "highland-vegetables", label: "Vegetables (Highland)", icon: "🥗" },
  { value: "fruits", label: "Fruits", icon: "🍎" },
  { value: "spices", label: "Spices", icon: "🌶️" },
  { value: "corn", label: "Corn", icon: "🌽" },
];

function getCategoryEmoji(category: string | undefined): string {
  const map: Record<string, string> = {
    rice: "🍚",
    fish: "🐟",
    beef: "🥩",
    pork: "🐷",
    poultry: "🍗",
    eggs: "🥚",
    "lowland-vegetables": "🥬",
    "highland-vegetables": "🥗",
    fruits: "🍎",
    spices: "🌶️",
    corn: "🌽",
  };
  return map[category || ""] || "🧂";
}

function shouldShowSpecification(spec: string | null | undefined): boolean {
  if (!spec) return false;
  const lower = spec.toLowerCase();
  if (lower === "imported" || lower === "other" || lower === "" || lower === "n/a") return false;
  return true;
}

function getPriceColor(price: number): string {
  if (price <= 150) return "text-green-700";
  if (price <= 300) return "text-amber-700";
  return "text-red-600";
}

export default function PricesPage() {
  const [prices, setPrices] = useState<PriceWithCommodity[]>([]);
  const [filteredPrices, setFilteredPrices] = useState<PriceWithCommodity[]>([]);
  const [category, setCategory] = useState("all");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [date, setDate] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const pathname = usePathname();

  useEffect(() => {
    fetchPrices();
  }, []);

  useEffect(() => {
    filterAndSort();
  }, [prices, category, sortOrder]);

  async function fetchPrices() {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch("/api/prices");

      if (!response.ok) {
        setPrices([]);
        return;
      }

      let data;
      try {
        data = await response.json();
      } catch {
        setPrices([]);
        return;
      }

      setPrices(data.prices || []);
      setDate(data.date || "");
    } catch {
      setError("Hindi maka-connect sa server. Subukan muli.");
      setPrices([]);
    } finally {
      setIsLoading(false);
    }
  }

  function filterAndSort() {
    let filtered = [...prices];

    if (category !== "all") {
      filtered = filtered.filter((p) => p.commodities?.category === category);
    }

    filtered.sort((a, b) => {
      const priceA = a.price_prevailing || 0;
      const priceB = b.price_prevailing || 0;
      return sortOrder === "asc" ? priceA - priceB : priceB - priceA;
    });

    setFilteredPrices(filtered);
  }

  const categoryStats = prices.reduce(
    (acc, p) => {
      const cat = p.commodities?.category || "other";
      if (!acc[cat]) {
        acc[cat] = { count: 0, min: Infinity, max: 0 };
      }
      const price = p.price_prevailing || 0;
      acc[cat].count++;
      acc[cat].min = Math.min(acc[cat].min, price);
      acc[cat].max = Math.max(acc[cat].max, price);
      return acc;
    },
    {} as Record<string, { count: number; min: number; max: number }>,
  );

  // Error state
  if (error && prices.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-amber-50 to-orange-50 px-4">
        <div className="text-center space-y-4 max-w-sm">
          <div className="text-5xl">😕</div>
          <p className="text-amber-900 font-bold text-xl">{error}</p>
          <button
            onClick={() => {
              setError(null);
              fetchPrices();
            }}
            className="inline-flex items-center gap-2 bg-amber-600 text-white font-semibold px-6 py-3 rounded-xl hover:bg-amber-700 transition-colors"
          >
            Subukan Muli
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20 bg-gradient-to-b from-amber-50 to-orange-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 text-white py-10 px-4 shadow-lg">
        <div className="max-w-2xl mx-auto">
          <Button
            variant="ghost"
            className="text-white hover:bg-white/20 mb-4 -ml-2"
            onClick={() => (window.location.href = "/")}
          >
            <Home className="w-4 h-4 mr-2" />
            Back
          </Button>

          <div className="flex items-center gap-3 mb-2">
            <ShoppingCart className="w-8 h-8" />
            <h1 className="text-3xl font-bold">Price Dashboard</h1>
          </div>

          <p className="text-amber-100 text-sm">
            <Calendar className="w-4 h-4 inline mr-1" />
            {date ? `Data as of ${format(new Date(date), "MMMM d, yyyy")}` : "Loading..."}
          </p>
        </div>
      </header>

      <main
        id="main-content"
        className="max-w-2xl mx-auto px-4 py-6"
        aria-live="polite"
        aria-atomic="false"
      >
        {/* Stats Cards — unified subtle borders */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 border-amber-200">
            <CardContent className="p-4">
              <p className="text-xs text-blue-600 font-medium">Total Items</p>
              <p className="text-2xl font-bold text-blue-800">{prices.length}</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-amber-200">
            <CardContent className="p-4">
              <p className="text-xs text-green-600 font-medium">Cheapest</p>
              <p className="text-2xl font-bold text-green-800">
                ₱
                {prices.length > 0 && prices[0]?.price_prevailing
                  ? Math.min(...prices.map((p) => p.price_prevailing || Infinity)).toFixed(2)
                  : "0"}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-50 to-amber-50 border-amber-200">
            <CardContent className="p-4">
              <p className="text-xs text-orange-600 font-medium">Most Expensive</p>
              <p className="text-2xl font-bold text-orange-800">
                ₱
                {prices.length > 0 && prices[0]?.price_prevailing
                  ? Math.max(...prices.map((p) => p.price_prevailing || 0)).toFixed(2)
                  : "0"}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-amber-200">
            <CardContent className="p-4">
              <p className="text-xs text-purple-600 font-medium">Categories</p>
              <p className="text-2xl font-bold text-purple-800">
                {Object.keys(categoryStats).length}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6 border-amber-200 bg-white/90">
          <CardContent className="p-4">
            <div className="flex flex-col gap-3">
              <div className="w-full">
                <label id="category-label" className="sr-only">
                  Filter by category
                </label>
                <Select
                  value={category}
                  onValueChange={setCategory}
                  aria-labelledby="category-label"
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.icon} {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                  aria-pressed={sortOrder === "asc"}
                  aria-label={`Sort prices ${sortOrder === "asc" ? "high to low" : "low to high"}`}
                  className="gap-1"
                >
                  <ArrowUpDown className="w-4 h-4" />
                  {sortOrder === "asc" ? "Low to High" : "High to Low"}
                </Button>

                <div className="text-sm text-gray-600">Showing {filteredPrices.length} items</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Loading — skeleton */}
        {isLoading && (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="bg-white rounded-xl border border-amber-100 p-4 animate-pulse"
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="space-y-2">
                    <div className="h-5 w-44 bg-amber-100 rounded" />
                    <div className="h-3 w-24 bg-amber-50 rounded" />
                  </div>
                  <div className="space-y-1 text-right">
                    <div className="h-6 w-20 bg-amber-100 rounded ml-auto" />
                    <div className="h-3 w-12 bg-amber-50 rounded ml-auto" />
                  </div>
                </div>
                <div className="h-5 w-24 bg-amber-50 rounded-full" />
              </div>
            ))}
          </div>
        )}

        {/* Price Cards */}
        {!isLoading && filteredPrices.length > 0 && (
          <ul className="space-y-3" aria-label="Commodity prices">
            {filteredPrices.map((price) => (
              <li key={price.id}>
                <article
                  aria-label={`${price.commodities?.name}: ₱${price.price_prevailing?.toFixed(2)} per kilogram`}
                >
                  <Card className="overflow-hidden border-amber-100 bg-white shadow-sm hover:shadow-md transition-shadow duration-200">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h2 className="font-semibold text-gray-800">
                            {price.commodities?.name || "Unknown"}
                          </h2>
                          {shouldShowSpecification(price.commodities?.specification) && (
                            <p className="text-xs text-gray-500">
                              {price.commodities!.specification}
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <p
                            className={`text-xl font-bold ${getPriceColor(price.price_prevailing || 0)}`}
                          >
                            ₱{price.price_prevailing?.toFixed(2) || "N/A"}
                          </p>
                          <p className="text-xs text-gray-500">per kg</p>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-xs capitalize border-amber-200">
                        {getCategoryEmoji(price.commodities?.category)}{" "}
                        {price.commodities?.category?.replace("-", " ") || "other"}
                      </Badge>
                    </CardContent>
                  </Card>
                </article>
              </li>
            ))}
          </ul>
        )}

        {/* No Results */}
        {!isLoading && prices.length === 0 && (
          <Card className="border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50">
            <CardContent className="text-center p-12">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-100 mb-4">
                <ShoppingCart className="w-8 h-8 text-amber-600" />
              </div>
              <p className="text-amber-900 font-bold text-xl mb-2">Wala pang presyo ngayon.</p>
              <p className="text-amber-700 text-lg mb-1">Check back mamaya! 🛒</p>
              <p className="text-sm text-amber-600 mt-4">
                Babalik kame ng bagong presyo sa susunod na update.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Filter Empty */}
        {!isLoading && prices.length > 0 && filteredPrices.length === 0 && (
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="text-center p-8">
              <ShoppingCart className="w-12 h-12 text-blue-400 mx-auto mb-4" />
              <p className="text-blue-800 font-medium">No prices found in this category</p>
              <p className="text-sm text-blue-600 mt-1">Try selecting a different category</p>
            </CardContent>
          </Card>
        )}

        {/* Home nav button */}
        {pathname !== "/" && prices.length > 0 && (
          <div className="pt-6">
            <a
              href="/"
              className="flex items-center justify-center gap-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold py-4 rounded-xl shadow-sm hover:shadow-md transition-all text-lg"
            >
              🏠 Bumalik sa Ulam
            </a>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
