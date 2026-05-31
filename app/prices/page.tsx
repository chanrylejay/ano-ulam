"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { format } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowUpDown, Calendar, Home, Search, ShoppingCart } from "lucide-react";
import { Footer } from "@/components/Footer";
import type { Price, Commodity } from "@/lib/db";

type PriceWithCommodity = Price & { commodities: Commodity };

const tabCategories = [
  { value: "all", label: "All" },
  { value: "meats", label: "Meats" },
  { value: "vegetables", label: "Vegetables" },
  { value: "fruits", label: "Fruits" },
  { value: "spices", label: "Spices" },
  { value: "others", label: "Others" },
];

function getSimpleCategory(category: string): string {
  const meats = ["beef", "pork", "poultry", "fish", "eggs"];
  const vegetables = ["lowland-vegetables", "highland-vegetables"];
  const fruits = ["fruits"];
  const spices = ["spices"];
  if (meats.includes(category)) return "meats";
  if (vegetables.includes(category)) return "vegetables";
  if (fruits.includes(category)) return "fruits";
  if (spices.includes(category)) return "spices";
  return "others";
}

function shouldShowSpecification(spec: string | undefined): boolean {
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
  const [selectedTab, setSelectedTab] = useState("all");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [searchQuery, setSearchQuery] = useState("");
  const [date, setDate] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const pathname = usePathname();

  useEffect(() => {
    fetchPrices();
  }, []);

  useEffect(() => {
    filterAndSort();
  }, [prices, selectedTab, sortOrder, searchQuery]);

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

    if (selectedTab !== "all") {
      filtered = filtered.filter((p) => {
        if (!p.commodities?.category) return false;
        return getSimpleCategory(p.commodities.category) === selectedTab;
      });
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter((p) =>
        (p.commodities?.name || "").toLowerCase().includes(query)
      );
    }

    filtered.sort((a, b) => {
      const priceA = a.price_prevailing || 0;
      const priceB = b.price_prevailing || 0;
      return sortOrder === "asc" ? priceA - priceB : priceB - priceA;
    });

    setFilteredPrices(filtered);
  }

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
      {/* Header — centered, back top-left */}
      <header className="bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 text-white py-10 px-4 shadow-lg relative">
        <Button
          variant="ghost"
          className="absolute top-4 left-4 text-sm text-white/80 hover:text-white hover:bg-white/20"
          onClick={() => (window.location.href = "/")}
        >
          <Home className="w-4 h-4 mr-1" />
          Back
        </Button>

        <div className="max-w-2xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-black mb-2">Presyo Ngayon</h1>
          <p className="text-base text-white font-medium">
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
        {/* Search Bar */}
        <div className="relative mb-4">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Hanapin ang presyo... (e.g., Bangus, Manok)"
            className="w-full pl-12 pr-4 py-3 text-base rounded-xl border-2 border-gray-200 bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-200 focus:outline-none transition-colors"
            aria-label="Search commodity prices"
          />
        </div>

        {/* Category Tabs — one line, compact */}
        <div className="flex flex-nowrap gap-1.5 mb-3 overflow-x-auto pb-1">
          {tabCategories.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setSelectedTab(tab.value)}
              className={`shrink-0 px-2.5 py-1 rounded-full text-xs font-semibold transition-colors whitespace-nowrap ${
                selectedTab === tab.value
                  ? "bg-amber-500 text-white shadow-sm"
                  : "bg-white text-amber-700 border border-gray-200 hover:bg-amber-50"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Sort + count — on their own line */}
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm text-gray-500">
            {filteredPrices.length} item{filteredPrices.length !== 1 ? "s" : ""} found
          </p>
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
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="space-y-1.5">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="bg-white rounded-xl border border-gray-200 p-3 animate-pulse flex justify-between items-center"
              >
                <div className="space-y-1.5">
                  <div className="h-4 w-40 bg-gray-100 rounded" />
                  <div className="h-3 w-20 bg-gray-50 rounded" />
                </div>
                <div className="h-5 w-16 bg-gray-100 rounded" />
              </div>
            ))}
          </div>
        )}

        {/* Price List — clean: name + spec | price, no emojis */}
        {!isLoading && filteredPrices.length > 0 && (
          <ul className="space-y-1.5" aria-label="Commodity prices">
            {filteredPrices.map((price) => (
              <li key={price.id}>
                <Card className="overflow-hidden border-gray-200 bg-white shadow-sm hover:shadow transition-shadow duration-150">
                  <CardContent className="p-3 flex items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <h2 className="font-medium text-gray-800 text-sm truncate">
                        {price.commodities?.name || "Unknown"}
                      </h2>
                      {shouldShowSpecification(price.commodities?.specification) && (
                        <p className="text-xs text-gray-400 truncate">
                          {price.commodities!.specification}
                        </p>
                      )}
                    </div>
                    <p
                      className={`text-base font-bold shrink-0 ${getPriceColor(price.price_prevailing || 0)}`}
                    >
                      ₱{price.price_prevailing?.toFixed(2) || "N/A"}
                    </p>
                  </CardContent>
                </Card>
              </li>
            ))}
          </ul>
        )}

        {/* No Results */}
        {!isLoading && prices.length === 0 && (
          <Card className="border-gray-200 bg-gradient-to-br from-amber-50 to-orange-50">
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
          <Card className="border-gray-200 bg-amber-50">
            <CardContent className="text-center p-8">
              <Search className="w-12 h-12 text-amber-400 mx-auto mb-4" />
              <p className="text-amber-800 font-medium">Walang nahanap na presyo</p>
              <p className="text-sm text-amber-600 mt-1">
                Subukan ang ibang kategorya o hanapin muli
              </p>
            </CardContent>
          </Card>
        )}

        {/* Bottom nav */}
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