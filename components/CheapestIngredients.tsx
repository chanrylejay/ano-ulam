'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingDown, Leaf, Fish, Beef, Egg, Apple } from 'lucide-react';

interface CheapestIngredient {
  name: string;
  category: string;
  price: number;
  specification?: string;
}

const categoryIcons: Record<string, React.ReactNode> = {
  'rice': '🍚',
  'fish': <Fish className="w-4 h-4" />,
  'beef': <Beef className="w-4 h-4" />,
  'pork': '🥩',
  'poultry': '🍗',
  'eggs': <Egg className="w-4 h-4" />,
  'lowland-vegetables': <Leaf className="w-4 h-4" />,
  'highland-vegetables': <Leaf className="w-4 h-4" />,
  'vegetables': <Leaf className="w-4 h-4" />,
  'fruits': <Apple className="w-4 h-4" />,
  'spices': '🌶️',
  'corn': '🌽',
};

const categoryColors: Record<string, string> = {
  'rice': 'border-amber-300 bg-amber-50 text-amber-800',
  'fish': 'border-blue-300 bg-blue-50 text-blue-800',
  'beef': 'border-red-300 bg-red-50 text-red-800',
  'pork': 'border-pink-300 bg-pink-50 text-pink-800',
  'poultry': 'border-orange-300 bg-orange-50 text-orange-800',
  'eggs': 'border-yellow-300 bg-yellow-50 text-yellow-800',
  'lowland-vegetables': 'border-green-300 bg-green-50 text-green-800',
  'highland-vegetables': 'border-emerald-300 bg-emerald-50 text-emerald-800',
  'vegetables': 'border-green-300 bg-green-50 text-green-800',
  'fruits': 'border-rose-300 bg-rose-50 text-rose-800',
  'spices': 'border-red-300 bg-red-50 text-red-800',
  'corn': 'border-yellow-400 bg-yellow-50 text-yellow-800',
  'other': 'border-gray-300 bg-gray-50 text-gray-800',
};

interface CheapestIngredientsProps {
  ingredients: CheapestIngredient[];
}

export function CheapestIngredients({ ingredients }: CheapestIngredientsProps) {
  return (
    <Card className="h-full border-green-300 bg-gradient-to-br from-green-50 to-emerald-50 shadow-lg">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-bold text-green-900 flex items-center gap-2">
          <TrendingDown className="w-5 h-5" />
          Cheapest Today
        </CardTitle>
        <p className="text-xs text-green-700">Top 15 most affordable ingredients</p>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
          {ingredients.map((item, i) => (
            <div
              key={i}
              className="flex items-center gap-2 p-2 rounded-lg bg-white/80 hover:bg-white transition-colors border border-green-200"
            >
              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-green-100 text-green-700 font-bold text-xs shrink-0">
                {i + 1}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1 flex-wrap">
                  <span className="font-medium text-sm text-gray-800 truncate">{item.name}</span>
                  {item.specification && (
                    <span className="text-xs text-gray-500">({item.specification})</span>
                  )}
                </div>
                <Badge
                  variant="outline"
                  className={`text-xs mt-0.5 ${
                    categoryColors[item.category] || categoryColors['other']
                  }`}
                >
                  {categoryIcons[item.category] || '🛒'}
                  <span className="ml-1 capitalize">{item.category.replace('-', ' ')}</span>
                </Badge>
              </div>
              <div className="text-right shrink-0">
                <div className="font-bold text-green-700">₱{item.price}</div>
                <div className="text-xs text-gray-500">per kg</div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
