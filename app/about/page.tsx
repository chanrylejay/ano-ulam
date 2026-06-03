"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Heart,
  ExternalLink,
  Database,
  Bot,
  Clock,
  Home,
  Code,
  Github,
  Globe,
} from "lucide-react";
import { Footer } from "@/components/Footer";

export default function AboutPage() {
  return (
    <div className="min-h-screen pb-20 bg-gradient-to-b from-amber-50 to-orange-50">
      <header className="bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 text-white py-10 px-4 shadow-lg">
        <div className="max-w-2xl mx-auto">
          <Button
            variant="ghost"
            className="text-white hover:bg-white/20 mb-6 -ml-2"
            onClick={() => (window.location.href = "/")}
          >
            <Home className="w-4 h-4 mr-2" />
            Back to Home
          </Button>

          <p className="text-lg font-medium text-white/80 mb-1">About</p>
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight leading-tight mb-2">
            ma, Ano Ulam?
          </h1>

          <p className="text-amber-100 text-sm">
            Free, open-source meal planning for Filipino families
          </p>
        </div>
      </header>

      <main id="main-content" className="max-w-2xl mx-auto px-4 py-8">
        {/* Mission Statement */}
        <Card className="mb-6 border-gray-200 bg-gradient-to-br from-amber-50 to-orange-50">
          <CardContent className="p-8">
            <div className="flex items-center gap-3 mb-4">
              <Heart className="w-6 h-6 text-red-500" aria-hidden="true" />
              <h2 className="text-2xl font-bold text-amber-900">Our Mission</h2>
            </div>
            <p className="text-gray-700 leading-relaxed mb-4">
              <strong>Ano Ulam?</strong> is a free and open-source web application built to help
              Filipino families plan meals on a budget. We understand that meal planning can be
              challenging, especially when trying to balance nutrition, taste, and cost.
            </p>
            <p className="text-gray-700 leading-relaxed">
              By combining real government price data with a database of 47 authentic Filipino
              recipes, we calculate the cheapest meals your family can cook today — with full
              ingredient cost breakdowns and daily price trends.
            </p>
          </CardContent>
        </Card>

        {/* Data Source */}
        <Card className="mb-6 border-gray-200 bg-white">
          <CardContent className="p-8">
            <div className="flex items-center gap-3 mb-4">
              <Database className="w-6 h-6 text-green-600" aria-hidden="true" />
              <h2 className="text-2xl font-bold text-green-900">Data Source</h2>
            </div>
            <p className="text-gray-700 leading-relaxed mb-4">
              All market price data is sourced from the{" "}
              <a
                href="https://www.da.gov.ph/price-monitoring/"
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-green-700 hover:underline inline-flex items-center gap-1"
                aria-label="Department of Agriculture Bantay Presyo Daily Price Index (opens in new tab)"
              >
                Department of Agriculture Bantay Presyo Daily Price Index
                <ExternalLink className="w-4 h-4" aria-hidden="true" />
              </a>
            </p>
            <p className="text-gray-700 leading-relaxed mb-4">
              The Department of Agriculture monitors and publishes daily commodity prices from
              various markets across the Philippines. This data helps consumers make informed
              decisions about their purchases and promotes transparency in market pricing.
            </p>
            <Badge variant="outline" className="bg-green-50 border-green-300 text-green-700">
              Data updated daily at 8:00 AM Manila time
            </Badge>
          </CardContent>
        </Card>

        {/* How It Works */}
        <Card className="mb-6 border-gray-200 bg-white">
          <CardContent className="p-8">
            <div className="flex items-center gap-3 mb-4">
              <Bot className="w-6 h-6 text-blue-600" aria-hidden="true" />
              <h2 className="text-2xl font-bold text-blue-900">How It Works</h2>
            </div>
            <div className="space-y-4">
              <div className="flex gap-4">
                <div
                  className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center font-bold text-blue-700"
                  aria-hidden="true"
                >
                  1
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800">Daily Data Collection</h3>
                  <p className="text-gray-600 text-sm">
                    Every morning, our system fetches the latest Daily Price Index PDF from the DA
                    website and extracts commodity prices using AI.
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <div
                  className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center font-bold text-blue-700"
                  aria-hidden="true"
                >
                  2
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800">Smart Cost Calculation</h3>
                  <p className="text-gray-600 text-sm">
                    Our recipe engine calculates the real cost of 47 Filipino dishes using
                    today's market prices, then picks the cheapest meals with protein variety.
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <div
                  className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center font-bold text-blue-700"
                  aria-hidden="true"
                >
                  3
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800">Meal Suggestions</h3>
                  <p className="text-gray-600 text-sm">
                    Each dish shows a full ingredient cost breakdown with per-item prices, and AI
                    explains why it was chosen based on today's price trends.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tech Stack */}
        <Card className="mb-6 border-gray-200 bg-white">
          <CardContent className="p-8">
            <div className="flex items-center gap-3 mb-4">
              <Code className="w-6 h-6 text-purple-600" aria-hidden="true" />
              <h2 className="text-2xl font-bold text-purple-900">Built With</h2>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Badge
                variant="outline"
                className="justify-center py-2 border-purple-200 bg-purple-50 text-purple-700"
              >
                Next.js 14
              </Badge>
              <Badge
                variant="outline"
                className="justify-center py-2 border-blue-200 bg-blue-50 text-blue-700"
              >
                TypeScript
              </Badge>
              <Badge
                variant="outline"
                className="justify-center py-2 border-cyan-200 bg-cyan-50 text-cyan-700"
              >
                Tailwind CSS
              </Badge>
              <Badge
                variant="outline"
                className="justify-center py-2 border-green-200 bg-green-50 text-green-700"
              >
                Neon PostgreSQL
              </Badge>
              <Badge
                variant="outline"
                className="justify-center py-2 border-orange-200 bg-orange-50 text-orange-700"
              >
                DeepSeek AI
              </Badge>
              <Badge
                variant="outline"
                className="justify-center py-2 border-pink-200 bg-pink-50 text-pink-700"
              >
                Vercel
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Creator */}
        <Card className="mb-6 border-gray-200 bg-gradient-to-br from-yellow-50 to-amber-50">
          <CardContent className="p-8">
            <div className="flex items-center gap-3 mb-4">
              <Heart className="w-6 h-6 text-amber-600" aria-hidden="true" />
              <h2 className="text-2xl font-bold text-amber-900">Created By</h2>
            </div>
            <p className="text-gray-700 leading-relaxed mb-4">
              Built by <strong>Chanryle Jay Cagara</strong> — a Filipino developer passionate about
              creating tools that make everyday life easier for Filipino families.
            </p>
            <div className="flex flex-wrap gap-3">
              <a
                href="https://github.com/chanrylejay/ano-ulam"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg px-4 py-2 hover:bg-gray-50 transition-colors"
              >
                <Github className="w-4 h-4" />
                github.com/chanrylejay/ano-ulam
              </a>
              <a
                href="https://chanryle-cagara.vercel.app"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm font-medium text-amber-700 bg-white border border-gray-200 rounded-lg px-4 py-2 hover:bg-amber-50 transition-colors"
              >
                <Globe className="w-4 h-4" />
                chanryle-cagara.vercel.app
              </a>
            </div>
          </CardContent>
        </Card>

        {/* Important Notes */}
        <Card className="mb-6 border-gray-200 bg-gray-50">
          <CardContent className="p-6">
            <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <Clock className="w-5 h-5 text-gray-600" aria-hidden="true" />
              Important Notes
            </h3>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex gap-2">
                <span className="text-gray-500" aria-hidden="true">
                  •
                </span>
                <span>Prices are updated daily and may vary by location and market</span>
              </li>
              <li className="flex gap-2">
                <span className="text-gray-500" aria-hidden="true">
                  •
                </span>
                <span>Meal suggestions assume basic pantry staples are available</span>
              </li>
              <li className="flex gap-2">
                <span className="text-gray-500" aria-hidden="true">
                  •
                </span>
                <span>
                  AI-generated suggestions are for inspiration — adjust to your taste!
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-gray-500" aria-hidden="true">
                  •
                </span>
                <span>Always verify prices at your local market before purchasing</span>
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* Bottom Back to Home */}
        <div className="pt-2">
          <a
            href="/"
            className="flex items-center justify-center gap-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold py-3.5 rounded-xl shadow-sm hover:shadow-md transition-all text-lg"
          >
            🏠 Back to Home
          </a>
        </div>
      </main>

      <Footer />
    </div>
  );
}
