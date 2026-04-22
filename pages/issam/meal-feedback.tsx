"use client";

import React, { useEffect, useState } from "react";
import Layout from "../containers/Layout";
import {
  Star,
  TrendingUp,
  Users,
  MessageSquare,
  Calendar,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Award,
  AlertCircle,
  UtensilsCrossed,
  Download,
} from "lucide-react";
import toast from "react-hot-toast";
import api from "../../lib/api";

type MealRating = {
  ratingId: number;
  rating: number;
  comment: string | null;
  createdAt: string;
};

type FoodSupply = {
  supplyId: number;
  foodItem: string;
  vendorName: string;
  quantitySupplied: number;
  quantityDistributed: number;
  quantityRemaining: number;
  supplyDate: string;
  notes: string | null;
};

type SupplyTotals = {
  totalSupplied: number;
  totalDistributed: number;
  totalRemaining: number;
  distributionRate: number;
};

type MealStatistics = {
  mealSessionId: number;
  mealSessionTitle: string;
  mealDate: string;
  foodItems: string[];
  vendors: string[];
  totalRatings: number;
  averageRating: number;
  ratingDistribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
  ratings: MealRating[];
  foodSupplies: FoodSupply[];
  supplyTotals: SupplyTotals;
};

type ApiResponse = {
  success: boolean;
  message: string;
  data: {
    meals: MealStatistics[];
  };
};

function StarRating({ rating, size = "md" }: { rating: number; size?: "sm" | "md" | "lg" }) {
  const sizeClasses = {
    sm: "w-3 h-3",
    md: "w-4 h-4",
    lg: "w-5 h-5",
  };

  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`${sizeClasses[size]} ${
            star <= Math.round(rating)
              ? "fill-yellow-400 text-yellow-400"
              : "text-gray-300 dark:text-gray-600"
          }`}
        />
      ))}
    </div>
  );
}

function RatingDistributionBar({
  stars,
  count,
  total,
}: {
  stars: number;
  count: number;
  total: number;
}) {
  const percentage = total > 0 ? (count / total) * 100 : 0;

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-1 w-16">
        <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
          {stars}
        </span>
        <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
      </div>
      <div className="flex-1 h-3 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-yellow-400 to-amber-500 transition-all duration-500"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <div className="w-16 text-right">
        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
          {count}
        </span>
      </div>
    </div>
  );
}

function MealStatisticsCard({
  meal,
  expanded,
  onToggle,
}: {
  meal: MealStatistics;
  expanded: boolean;
  onToggle: () => void;
}) {
  const getRatingLabel = (rating: number) => {
    if (rating >= 4.5) return { text: "Excellent", color: "text-green-600" };
    if (rating >= 3.5) return { text: "Very Good", color: "text-blue-600" };
    if (rating >= 2.5) return { text: "Good", color: "text-yellow-600" };
    if (rating >= 1.5) return { text: "Fair", color: "text-orange-600" };
    return { text: "Needs Improvement", color: "text-red-600" };
  };

  const ratingLabel = getRatingLabel(meal.averageRating);
  const commentsCount = meal.ratings.filter((r) => r.comment).length;

  return (
    <div className="rounded-3xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-lg overflow-hidden">
      {/* Header */}
      <div className="p-5 sm:p-6 bg-gradient-to-br from-gray-50 to-white dark:from-gray-800 dark:to-gray-900">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-2">
              {meal.mealSessionTitle}
            </h3>
            <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <Calendar className="w-4 h-4" />
              <span>{new Date(meal.mealDate).toLocaleDateString("en-GB")}</span>
              <span className="text-gray-300 dark:text-gray-600">•</span>
              <span>{meal.vendors?.join(", ") || "N/A"}</span>
            </div>
            
            {/* Food Items from foodSupplies if available, otherwise from foodItems */}
            {meal.foodSupplies && meal.foodSupplies.length > 0 ? (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {meal.foodSupplies.map((supply) => (
                  <span
                    key={supply.supplyId}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 text-xs font-medium text-blue-700 dark:text-blue-300"
                  >
                    <UtensilsCrossed className="w-3 h-3" />
                    {supply.foodItem}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
                {meal.foodItems?.join(", ") || "N/A"}
              </p>
            )}
          </div>

          <button
            onClick={onToggle}
            className="shrink-0 w-10 h-10 rounded-xl bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
          >
            {expanded ? (
              <ChevronUp className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            )}
          </button>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="rounded-2xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                Average
              </span>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {meal.averageRating.toFixed(1)}
            </p>
            <p className={`text-xs font-semibold mt-1 ${ratingLabel.color}`}>
              {ratingLabel.text}
            </p>
          </div>

          <div className="rounded-2xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-4 h-4 text-blue-600" />
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                Ratings
              </span>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {meal.totalRatings}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
              Responses
            </p>
          </div>

          <div className="rounded-2xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 p-4">
            <div className="flex items-center gap-2 mb-2">
              <MessageSquare className="w-4 h-4 text-purple-600" />
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                Comments
              </span>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {commentsCount}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
              Written feedback
            </p>
          </div>

          <div className="rounded-2xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-green-600" />
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                Top Rating
              </span>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {meal.ratingDistribution[5]}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
              5-star ratings
            </p>
          </div>
        </div>
      </div>

      {/* Expanded Details */}
      {expanded && (
        <div className="p-5 sm:p-6 border-t border-gray-100 dark:border-gray-700">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Rating Distribution */}
            <div>
              <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-4 uppercase tracking-wide">
                Rating Distribution
              </h4>
              <div className="space-y-3">
                {[5, 4, 3, 2, 1].map((stars) => (
                  <RatingDistributionBar
                    key={stars}
                    stars={stars}
                    count={meal.ratingDistribution[stars as keyof typeof meal.ratingDistribution]}
                    total={meal.totalRatings}
                  />
                ))}
              </div>
            </div>

            {/* Recent Comments */}
            <div>
              <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-4 uppercase tracking-wide">
                Recent Comments
              </h4>
              {commentsCount === 0 ? (
                <div className="text-center py-8">
                  <MessageSquare className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    No comments yet
                  </p>
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {meal.ratings
                    .filter((r) => r.comment)
                    .slice(0, 10)
                    .map((rating) => (
                      <div
                        key={rating.ratingId}
                        className="rounded-2xl border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 p-4"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <StarRating rating={rating.rating} size="sm" />
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {new Date(rating.createdAt).toLocaleDateString("en-GB")}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                          {rating.comment}
                        </p>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>

          {/* Food Supply Information */}
          {meal.foodSupplies && meal.foodSupplies.length > 0 && (
            <div className="mt-6 pt-6 border-t border-gray-100 dark:border-gray-700">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                <h4 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wide">
                  Food Supply & Distribution
                </h4>
                {meal.supplyTotals && (
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800">
                    <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                      Distribution Rate:
                    </span>
                    <span className="text-sm font-bold text-emerald-700 dark:text-emerald-300">
                      {meal.supplyTotals.distributionRate.toFixed(1)}%
                    </span>
                  </div>
                )}
              </div>

              {/* Supply Totals Cards */}
              {meal.supplyTotals && (
                <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-4">
                  <div className="rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 p-3">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-blue-600 dark:text-blue-400 mb-1">
                      Supplied
                    </p>
                    <p className="text-lg sm:text-xl font-bold text-blue-700 dark:text-blue-300">
                      {meal.supplyTotals.totalSupplied.toLocaleString()}
                    </p>
                  </div>

                  <div className="rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800 p-3">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-emerald-600 dark:text-emerald-400 mb-1">
                      Distributed
                    </p>
                    <p className="text-lg sm:text-xl font-bold text-emerald-700 dark:text-emerald-300">
                      {meal.supplyTotals.totalDistributed.toLocaleString()}
                    </p>
                  </div>

                  <div className="rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800 p-3">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-amber-600 dark:text-amber-400 mb-1">
                      Remaining
                    </p>
                    <p className="text-lg sm:text-xl font-bold text-amber-700 dark:text-amber-300">
                      {meal.supplyTotals.totalRemaining.toLocaleString()}
                    </p>
                  </div>
                </div>
              )}

              {/* Mobile View - Supply Cards */}
              <div className="block lg:hidden space-y-3">
                {meal.foodSupplies.map((supply) => {
                  const rate = supply.quantitySupplied > 0
                    ? (supply.quantityDistributed / supply.quantitySupplied) * 100
                    : 0;
                  
                  return (
                    <div
                      key={supply.supplyId}
                      className="rounded-2xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 p-4"
                    >
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div>
                          <h5 className="font-bold text-gray-900 dark:text-white mb-1">
                            {supply.foodItem}
                          </h5>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {supply.vendorName}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Rate
                          </p>
                          <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                            {rate.toFixed(0)}%
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-2">
                        <div className="rounded-lg bg-blue-50 dark:bg-blue-900/20 p-2">
                          <p className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 mb-0.5">
                            SUPPLIED
                          </p>
                          <p className="text-sm font-bold text-blue-700 dark:text-blue-300">
                            {supply.quantitySupplied.toLocaleString()}
                          </p>
                        </div>

                        <div className="rounded-lg bg-emerald-50 dark:bg-emerald-900/20 p-2">
                          <p className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 mb-0.5">
                            DISTRIBUTED
                          </p>
                          <p className="text-sm font-bold text-emerald-700 dark:text-emerald-300">
                            {supply.quantityDistributed.toLocaleString()}
                          </p>
                        </div>

                        <div className="rounded-lg bg-amber-50 dark:bg-amber-900/20 p-2">
                          <p className="text-[10px] font-semibold text-amber-600 dark:text-amber-400 mb-0.5">
                            REMAINING
                          </p>
                          <p className="text-sm font-bold text-amber-700 dark:text-amber-300">
                            {supply.quantityRemaining.toLocaleString()}
                          </p>
                        </div>
                      </div>

                      {supply.notes && (
                        <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            <span className="font-semibold">Notes:</span> {supply.notes}
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Desktop View - Supply Table */}
              <div className="hidden lg:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="text-left py-3 px-2 text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                        Food Item
                      </th>
                      <th className="text-left py-3 px-2 text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                        Vendor
                      </th>
                      <th className="text-right py-3 px-2 text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                        Supplied
                      </th>
                      <th className="text-right py-3 px-2 text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                        Distributed
                      </th>
                      <th className="text-right py-3 px-2 text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                        Remaining
                      </th>
                      <th className="text-left py-3 px-2 text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                        Notes
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {meal.foodSupplies.map((supply) => {
                      const rate = supply.quantitySupplied > 0
                        ? (supply.quantityDistributed / supply.quantitySupplied) * 100
                        : 0;
                      
                      return (
                        <tr
                          key={supply.supplyId}
                          className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                        >
                          <td className="py-3 px-2 font-semibold text-gray-900 dark:text-white">
                            {supply.foodItem}
                          </td>
                          <td className="py-3 px-2 text-gray-600 dark:text-gray-400">
                            {supply.vendorName}
                          </td>
                          <td className="py-3 px-2 text-right font-semibold text-blue-600 dark:text-blue-400">
                            {supply.quantitySupplied.toLocaleString()}
                          </td>
                          <td className="py-3 px-2 text-right">
                            <div className="flex flex-col items-end">
                              <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                                {supply.quantityDistributed.toLocaleString()}
                              </span>
                              <span className="text-xs text-gray-500">
                                {rate.toFixed(0)}%
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-2 text-right font-semibold text-amber-600 dark:text-amber-400">
                            {supply.quantityRemaining.toLocaleString()}
                          </td>
                          <td className="py-3 px-2 text-gray-600 dark:text-gray-400 text-xs max-w-xs truncate">
                            {supply.notes || "—"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function MealFeedbackResultsPage() {
  const [meals, setMeals] = useState<MealStatistics[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedMealIds, setExpandedMealIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    loadFeedbackResults();
  }, []);

  async function loadFeedbackResults() {
    try {
      setLoading(true);
      const { data } = await api.get<ApiResponse>("/meals/ratings/statistics");
      setMeals(data.data.meals || []);
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || "Failed to load feedback results"
      );
    } finally {
      setLoading(false);
    }
  }

  function toggleExpanded(mealId: number) {
    setExpandedMealIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(mealId)) {
        newSet.delete(mealId);
      } else {
        newSet.add(mealId);
      }
      return newSet;
    });
  }

  const overallStats = meals.reduce(
    (acc, meal) => ({
      totalRatings: acc.totalRatings + meal.totalRatings,
      totalAverage: acc.totalAverage + meal.averageRating * meal.totalRatings,
      totalMeals: acc.totalMeals + 1,
    }),
    { totalRatings: 0, totalAverage: 0, totalMeals: 0 }
  );

  const overallAverage =
    overallStats.totalRatings > 0
      ? overallStats.totalAverage / overallStats.totalRatings
      : 0;

  if (loading) {
    return (
      <Layout>
        <div className="py-24 text-center text-sm text-gray-400 dark:text-gray-500">
          Loading meal feedback analytics…
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="rounded-3xl bg-gradient-to-r from-green-900 via-green-800 to-green-700 text-white shadow-xl p-6 sm:p-8 mb-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 text-[10px] font-semibold uppercase tracking-widest mb-3">
              <UtensilsCrossed className="w-3 h-3" /> Meal Feedback
            </span>
            <h1 className="text-2xl sm:text-3xl font-bold leading-tight">
              Meal Feedback Results
            </h1>
            <p className="mt-1.5 text-sm text-white/70 max-w-xl leading-relaxed">
              View ratings, comments, and statistics for all meal sessions based on{" "}
              {overallStats.totalRatings} participant rating
              {overallStats.totalRatings !== 1 ? "s" : ""}.
            </p>
          </div>

          <button
            type="button"
            onClick={loadFeedbackResults}
            className="inline-flex items-center gap-2 rounded-2xl bg-white/10 hover:bg-white/20 text-white text-sm font-semibold px-4 py-2.5 transition"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </div>

      {/* Overall Statistics Banner */}
      {meals.length > 0 && (
        <div className="grid grid-cols-2 xl:grid-cols-3 gap-4 mb-8">
          <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-sm p-5">
            <div className="absolute top-0 left-0 w-1 h-full rounded-l-2xl bg-amber-500" />
            <div className="flex items-start justify-between gap-3 pl-2">
              <div>
                <p className="text-xs uppercase tracking-widest font-medium text-gray-400 dark:text-gray-500 mb-1.5">
                  Average Rating
                </p>
                <div className="flex items-center gap-2">
                  <p className="text-3xl font-bold text-gray-900 dark:text-white leading-none">
                    {overallAverage.toFixed(1)}
                  </p>
                  <div className="flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-4 h-4 ${
                          star <= Math.round(overallAverage)
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-gray-300 dark:text-gray-600"
                        }`}
                      />
                    ))}
                  </div>
                </div>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1.5">
                  Across all meals
                </p>
              </div>
              <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 bg-amber-500/10">
                <Star className="w-5 h-5 text-amber-500" />
              </div>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-sm p-5">
            <div className="absolute top-0 left-0 w-1 h-full rounded-l-2xl bg-emerald-500" />
            <div className="flex items-start justify-between gap-3 pl-2">
              <div>
                <p className="text-xs uppercase tracking-widest font-medium text-gray-400 dark:text-gray-500 mb-1.5">
                  Total Ratings
                </p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white leading-none">
                  {overallStats.totalRatings}
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1.5">
                  Participant responses
                </p>
              </div>
              <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 bg-emerald-500/10">
                <Users className="w-5 h-5 text-emerald-500" />
              </div>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-sm p-5">
            <div className="absolute top-0 left-0 w-1 h-full rounded-l-2xl bg-blue-500" />
            <div className="flex items-start justify-between gap-3 pl-2">
              <div>
                <p className="text-xs uppercase tracking-widest font-medium text-gray-400 dark:text-gray-500 mb-1.5">
                  Meals Rated
                </p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white leading-none">
                  {overallStats.totalMeals}
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1.5">
                  Meal sessions
                </p>
              </div>
              <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 bg-blue-500/10">
                <UtensilsCrossed className="w-5 h-5 text-blue-500" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Meals List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <RefreshCw className="w-12 h-12 animate-spin text-green-600 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">
              Loading feedback results...
            </p>
          </div>
        </div>
      ) : meals.length === 0 ? (
        <div className="py-16 text-center rounded-3xl border border-dashed border-gray-200 dark:border-gray-700">
          <AlertCircle className="w-10 h-10 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
            No Feedback Data Available
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md mx-auto">
            There are no meal ratings to display yet. Ratings will appear here
            once participants start submitting feedback.
          </p>
        </div>
      ) : (
        <div className="space-y-5 mb-10">
          {meals.map((meal) => (
            <MealStatisticsCard
              key={meal.mealSessionId}
              meal={meal}
              expanded={expandedMealIds.has(meal.mealSessionId)}
              onToggle={() => toggleExpanded(meal.mealSessionId)}
            />
          ))}
        </div>
      )}

      <div className="pb-20" />
    </Layout>
  );
}