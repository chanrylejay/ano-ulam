"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowUpDown, Calendar, Home, ShoppingCart, TrendingDown, TrendingUp } from "lucide-react";
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

export default function PricesPage() {
  const [prices, setPrices] = useState<PriceWithCommodity[]>([]);
  const [filteredPrices, setFilteredPrices] = useState<PriceWithCommodity[]>([]);
  const [category, setCategory] = useState("all");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [date, setDate] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchPrices();
  }, []);

  useEffect(() => {
    filterAndSort();
  }, [prices, category, sortOrder]);

  async function fetchPrices() {
    try {
      setIsLoading(true);
      const response = await fetch("/api/prices");

      // Check if response is OK and has valid JSON
      if (!response.ok) {
        // Silently fail and show empty state
        setPrices([]);
        return;
      }

      let data;
      try {
        data = await response.json();
      } catch {
        // Invalid JSON - show empty state
        setPrices([]);
        return;
      }

      setPrices(data.prices || []);
      setDate(data.date || "");
    } catch {
      // Any error - show empty state instead of error
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

  return (
    <div className="min-h-screen pb-20">
      {/* Header */}
      <header className="bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 text-white py-10 px-4 shadow-lg">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <Button
              variant="ghost"
              className="text-white hover:bg-white/20"
              onClick={() => (window.location.href = "/")}
            >
              <Home className="w-4 h-4 mr-2" />
              Back
            </Button>
          </div>

          <div className="flex items-center gap-3 mb-2">
            <ShoppingCart className="w-8 h-8" />
            <h1 className="text-3xl md:text-4xl font-bold">Price Dashboard</h1>
          </div>

          <p className="text-green-100 text-sm md:text-base">
            <Calendar className="w-4 h-4 inline mr-1" />
            {date ? `Data as of ${format(new Date(date), "MMMM d, yyyy")}` : "Loading..."}
          </p>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200">
            <CardContent className="p-4">
              <p className="text-xs text-blue-600 font-medium">Total Items</p>
              <p className="text-2xl font-bold text-blue-800">{prices.length}</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
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

          <Card className="bg-gradient-to-br from-orange-50 to-red-50 border-orange-200">
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

          <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
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
            <div className="flex flex-wrap gap-3 items-center justify-between">
              <div className="flex flex-wrap gap-3 items-center">
                <div className="w-64">
                  <Select value={category} onValueChange={setCategory}>
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

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                  className="gap-1"
                >
                  <ArrowUpDown className="w-4 h-4" />
                  {sortOrder === "asc" ? "Low to High" : "High to Low"}
                </Button>
              </div>

              <div className="text-sm text-gray-600">Showing {filteredPrices.length} items</div>
            </div>
          </CardContent>
        </Card>

        {/* Error - removed, now showing friendly empty state */}

        {/* Loading */}
        {isLoading && (
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-100 animate-pulse mb-4">
              <ShoppingCart className="w-6 h-6 text-green-600" />
            </div>
            <p className="text-green-700">Loading prices...</p>
          </div>
        )}

        {/* Price Table - Desktop */}
        {!isLoading && filteredPrices.length > 0 && (
          <>
            <div className="hidden md:block">
              <Card className="overflow-hidden border-amber-200">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-amber-100 border-b border-amber-200">
                        <th className="text-left p-4 font-semibold text-amber-900">Commodity</th>
                        <th className="text-left p-4 font-semibold text-amber-900">Category</th>
                        <th className="text-left p-4 font-semibold text-amber-900">
                          Specification
                        </th>
                        <th className="text-right p-4 font-semibold text-amber-900">
                          Price (₱/kg)
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredPrices.map((price, i) => (
                        <tr
                          key={price.id}
                          className={`border-b border-gray-100 hover:bg-amber-50 transition-colors ${
                            i % 2 === 0 ? "bg-white" : "bg-gray-50/50"
                          }`}
                        >
                          <td className="p-4 font-medium text-gray-800">
                            {price.commodities?.name || "Unknown"}
                          </td>
                          <td className="p-4">
                            <Badge variant="outline" className="capitalize text-xs">
                              {price.commodities?.category?.replace("-", " ") || "other"}
                            </Badge>
                          </td>
                          <td className="p-4 text-gray-600 text-sm">
                            {price.commodities?.specification || "-"}
                          </td>
                          <td className="p-4 text-right">
                            <span className="font-bold text-lg text-green-700">
                              ₱{price.price_prevailing?.toFixed(2) || "N/A"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>

            {/* Price Cards - Mobile */}
            <div className="md:hidden grid grid-cols-1 gap-3">
              {filteredPrices.map((price) => (
                <Card key={price.id} className="overflow-hidden border-amber-200 bg-white">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-semibold text-gray-800">
                          {price.commodities?.name || "Unknown"}
                        </h3>
                        {price.commodities?.specification && (
                          <p className="text-xs text-gray-500">{price.commodities.specification}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold text-green-700">
                          ₱{price.price_prevailing?.toFixed(2) || "N/A"}
                        </p>
                        <p className="text-xs text-gray-500">per kg</p>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-xs capitalize">
                      {price.commodities?.category?.replace("-", " ") || "other"}
                    </Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}

        {/* No Results */}
        {!isLoading && prices.length === 0 && (
          <Card className="border-amber-300 bg-gradient-to-br from-amber-50 to-orange-50">
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

        {!isLoading && prices.length > 0 && filteredPrices.length === 0 && (
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="text-center p-8">
              <ShoppingCart className="w-12 h-12 text-blue-400 mx-auto mb-4" />
              <p className="text-blue-800 font-medium">No prices found in this category</p>
              <p className="text-sm text-blue-600 mt-1">Try selecting a different category</p>
            </CardContent>
          </Card>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-amber-200 bg-white/80 backdrop-blur-sm mt-16">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <p className="text-center text-sm text-amber-700">
            Data mula sa{" "}
            <a
              href="https://www.da.gov.ph/price-monitoring/"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold hover:underline"
            >
              Department of Agriculture Bantay Presyo
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}
