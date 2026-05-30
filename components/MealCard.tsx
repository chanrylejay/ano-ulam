'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Utensils, Clock, DollarSign } from 'lucide-react';
import type { MealSuggestion } from '@/lib/db';

interface MealCardProps {
  meal: MealSuggestion;
}

export function MealCard({ meal }: MealCardProps) {
  return (
    <Card className="overflow-hidden hover:shadow-xl transition-all duration-300 border-amber-200 bg-white/90 backdrop-blur-sm">
      <CardHeader className="pb-3 bg-gradient-to-r from-amber-100 to-orange-100">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-xl font-bold text-amber-900">{meal.name}</CardTitle>
          <Badge className="bg-green-600 text-white shrink-0 flex items-center gap-1">
            <DollarSign className="w-3 h-3" />
            ₱{meal.estimated_cost}
          </Badge>
        </div>
        <CardDescription className="text-amber-700 text-sm">{meal.description}</CardDescription>
        <p className="text-xs text-amber-600 flex items-center gap-1">
          <Utensils className="w-3 h-3" /> Good for 4 servings
        </p>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="space-y-4">
          <div>
            <h4 className="font-semibold text-sm text-amber-900 mb-2 flex items-center gap-1">
              Key Ingredients:
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {meal.ingredients.slice(0, 5).map((ing, i) => (
                <Badge key={i} variant="outline" className="text-xs bg-amber-50 border-amber-300 text-amber-800">
                  {ing.name} <span className="text-amber-600 ml-1">₱{ing.current_price}</span>
                </Badge>
              ))}
              {meal.ingredients.length > 5 && (
                <Badge variant="outline" className="text-xs bg-orange-50 border-orange-300 text-orange-700">
                  +{meal.ingredients.length - 5} more
                </Badge>
              )}
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-sm text-amber-900 mb-2 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" /> Instructions:
            </h4>
            <ol className="text-sm text-gray-700 space-y-1.5">
              {meal.steps.map((step, i) => (
                <li key={i} className="flex gap-2">
                  <span className="text-amber-600 font-semibold shrink-0">{i + 1}.</span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
