'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCw, ChefHat, ShoppingCart, Info } from 'lucide-react';
import { MealCard } from '@/components/MealCard';
import { CheapestIngredients } from '@/components/CheapestIngredients';
import type { MealSuggestion, DailySuggestion } from '@/lib/db';

export default function HomePage() {
  const [suggestion, setSuggestion] = useState<DailySuggestion | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isToday, setIsToday] = useState(true);

  useEffect(() => {
    fetchSuggestions();
  }, []);

  async function fetchSuggestions() {
    try {
      setIsLoading(true);
      const response = await fetch('/api/suggestions');

      // Check if response is OK and has valid JSON
      if (!response.ok) {
        // Silently fail and show empty state
        setSuggestion(null);
        setIsToday(false);
        return;
      }

      let data;
      try {
        data = await response.json();
      } catch {
        // Invalid JSON - show empty state
        setSuggestion(null);
        setIsToday(false);
        return;
      }

      setSuggestion(data.suggestion);
      setIsToday(data.isToday);
    } catch {
      // Any error - show empty state instead of error
      setSuggestion(null);
      setIsToday(false);
    } finally {
      setIsLoading(false);
    }
  }

  const today = new Date();
  const formattedDate = format(today, 'EEEE, MMMM d, yyyy');

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-100 animate-pulse">
            <ChefHat className="w-8 h-8 text-amber-600" />
          </div>
          <p className="text-amber-700 font-medium">Naghahanap ng masusustansyang ulam...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20">
      {/* Hero Section */}
      <header className="bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 text-white py-12 px-4 shadow-lg">
        <div className="max-w-6xl mx-auto text-center">
          <Badge className="bg-white/20 text-white border-white/30 mb-3">
            Filipino Meal Planner
          </Badge>

          <h1 className="text-4xl md:text-5xl font-bold mb-3 flex items-center justify-center gap-3">
            <ChefHat className="w-10 h-10 md:w-12 md:h-12" />
            Ano Ulam?
          </h1>

          <p className="text-xl md:text-2xl mb-2 font-medium">
            Ano ulam natin ngayon? 🍚
          </p>

          <p className="text-amber-100 text-sm md:text-base mb-6">
            {formattedDate}
          </p>

          <div className="flex flex-wrap justify-center gap-3">
            <Button
              variant="secondary"
              className="bg-white text-amber-700 hover:bg-amber-50"
              onClick={() => window.location.href = '/prices'}
            >
              <ShoppingCart className="w-4 h-4 mr-2" />
              View Prices
            </Button>
            <Button
              variant="outline"
              className="bg-transparent border-white text-white hover:bg-white/10"
              onClick={() => window.location.href = '/about'}
            >
              <Info className="w-4 h-4 mr-2" />
              About
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Stale Data Banner */}
        {suggestion && !isToday && (
          <Card className="mb-6 border-amber-400 bg-amber-50">
            <CardContent className="flex items-center gap-3 p-4">
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
              <div className="flex-1">
                <p className="text-sm text-amber-800 font-medium">
                  Wala pang data ngayon. Narito ang pinakabagong suhestiyon mula{' '}
                  {format(new Date(suggestion.suggestion_date), 'MMMM d, yyyy')}.
                </p>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={fetchSuggestions}
                className="shrink-0"
              >
                <RefreshCw className="w-4 h-4 mr-1" />
                Refresh
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Error Banner - removed, now showing friendly empty state */}

        {/* No Data */}
        {!suggestion && (
          <Card className="mb-6 border-amber-300 bg-gradient-to-br from-amber-50 to-orange-50">
            <CardContent className="text-center p-12">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-100 mb-4">
                <ChefHat className="w-8 h-8 text-amber-600" />
              </div>
              <p className="text-amber-900 font-bold text-xl mb-2">
                Wala pang data ngayon.
              </p>
              <p className="text-amber-700 text-lg mb-1">
                Babalik kami bukas ng 8AM! 🍳
              </p>
              <p className="text-sm text-amber-600 mt-4">
                Hanggang sa muli, kumain nang masustansya!
              </p>
            </CardContent>
          </Card>
        )}

        {/* Main Content */}
        {suggestion && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Meal Suggestions */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-2xl font-bold text-amber-900">
                  Today's Suggestions 🍽️
                </h2>
                <Badge variant="outline" className="border-amber-300 text-amber-700">
                  {suggestion.meals.length} meals
                </Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {suggestion.meals.map((meal, i) => (
                  <MealCard key={i} meal={meal} />
                ))}
              </div>
            </div>

            {/* Cheapest Ingredients Sidebar */}
            <div className="lg:col-span-1">
              <CheapestIngredients ingredients={suggestion.cheapest_ingredients || []} />
            </div>
          </div>
        )}

        {/* Helpful Tips */}
        <Card className="mt-8 border-green-300 bg-gradient-to-r from-green-50 to-emerald-50">
          <CardContent className="p-6">
            <h3 className="font-bold text-green-900 mb-3 flex items-center gap-2">
              💡 Budget Tips para sa Mag-asawa
            </h3>
            <ul className="space-y-2 text-sm text-green-800">
              <li className="flex gap-2">
                <span className="text-green-600">✓</span>
                <span>Buy ingredients early morning sa palengke para sa preskong produkto</span>
              </li>
              <li className="flex gap-2">
                <span className="text-green-600">✓</span>
                <span>Make extra servings for baon the next day</span>
              </li>
              <li className="flex gap-2">
                <span className="text-green-600">✓</span>
                <span>Use malunggay or kangkong - mura at masustansya!</span>
              </li>
              <li className="flex gap-2">
                <span className="text-green-600">✓</span>
                <span>Cook in bulk and freeze para matipid sa oras at gas</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </main>

      {/* Footer */}
      <footer className="border-t border-amber-200 bg-white/80 backdrop-blur-sm mt-16">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <p className="text-center text-sm text-amber-700">
            Data mula sa{' '}
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
