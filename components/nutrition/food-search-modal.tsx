"use client";

import { useState, useEffect } from "react";
import { Icon } from "@/components/ui/icon";
import { getAuthToken } from "@/lib/auth/auth-token";
import { apiClient } from "@/lib/api/client";

interface ServingSize {
  unit: string;
  grams: number;
  label?: string;
}

interface Food {
  _id: string;
  name: string;
  brand?: string;
  calories_per_100g: number;
  protein_per_100g: number;
  carbs_per_100g: number;
  fat_per_100g: number;
  serving_sizes?: ServingSize[];
}

interface FoodSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectFood: (food: Food, servingSize: number, servingUnit: string) => void;
  mealType: string;
}

export function FoodSearchModal({
  isOpen,
  onClose,
  onSelectFood,
  mealType,
}: FoodSearchModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Food[]>([]);
  const [selectedFood, setSelectedFood] = useState<Food | null>(null);
  const [servingSize, setServingSize] = useState("100");
  const [servingUnit, setServingUnit] = useState("g");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      // Reset state when modal closes
      setSearchQuery("");
      setSearchResults([]);
      setSelectedFood(null);
      setServingSize("100");
      setServingUnit("g");
    }
  }, [isOpen]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery.length >= 2) {
        searchFoods();
      } else {
        setSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const searchFoods = async () => {
    try {
      setLoading(true);
      const token = await getAuthToken();
      if (!token) return;

      const res = await apiClient.get(
        `/api/nutrition/foods/search?query=${encodeURIComponent(searchQuery)}`,
        token
      );

      if (res.success) {
        setSearchResults(res.data || []);
      }
    } catch (error) {
      console.error("Error searching foods:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectFood = (food: Food) => {
    setSelectedFood(food);
  };

  const handleConfirm = () => {
    if (selectedFood && servingSize && parseFloat(servingSize) > 0) {
      onSelectFood(selectedFood, parseFloat(servingSize), servingUnit);
    }
  };

  const calculateNutrition = () => {
    if (!selectedFood || !servingSize) return null;

    const size = parseFloat(servingSize);
    if (isNaN(size) || size <= 0) return null;

    const multiplier = servingUnit === "g" ? size / 100 : size;

    return {
      calories: Math.round(selectedFood.calories_per_100g * multiplier),
      protein: Math.round(selectedFood.protein_per_100g * multiplier),
      carbs: Math.round(selectedFood.carbs_per_100g * multiplier),
      fat: Math.round(selectedFood.fat_per_100g * multiplier),
    };
  };

  if (!isOpen) return null;

  const nutrition = calculateNutrition();

  return (
    <div className="fixed inset-0 bg-black/60 flex items-end justify-center z-50 animate-fade-in">
      <div className="bg-[#0B0D17] w-full max-w-md rounded-t-3xl max-h-[85vh] flex flex-col animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/10">
          <div>
            <h2 className="text-lg font-bold text-white">Add Food</h2>
            <p className="text-sm text-gray-400 capitalize">{mealType}</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center"
          >
            <Icon name="x" size={18} color="#9CA3AF" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-4 border-b border-white/5">
          <div className="relative">
            <Icon
              name="search"
              size={18}
              color="#6B7280"
              className="absolute left-3 top-1/2 transform -translate-y-1/2"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for foods..."
              className="w-full pl-10 pr-4 py-3 bg-[#131520] border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50"
              autoFocus
            />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {!selectedFood ? (
            // Search Results
            <div className="p-4">
              {loading && (
                <div className="text-center py-8 text-gray-400">Searching...</div>
              )}
              {!loading && searchQuery.length < 2 && (
                <div className="text-center py-8 text-gray-400">
                  Type at least 2 characters to search
                </div>
              )}
              {!loading && searchQuery.length >= 2 && searchResults.length === 0 && (
                <div className="text-center py-8 text-gray-400">No foods found</div>
              )}
              {searchResults.map((food) => (
                <button
                  key={food._id}
                  onClick={() => handleSelectFood(food)}
                  className="w-full text-left p-4 bg-[#131520] border border-white/5 rounded-xl mb-2 hover:border-blue-500/30 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className="text-sm font-semibold text-white">{food.name}</div>
                      {food.brand && (
                        <div className="text-xs text-gray-500 mt-0.5">{food.brand}</div>
                      )}
                    </div>
                    {(food as any).source && (
                      <div className="text-[10px] px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 whitespace-nowrap">
                        {(food as any).source === 'usda' ? 'USDA' :
                         (food as any).source === 'open_food_facts' ? 'OFF' :
                         'Custom'}
                      </div>
                    )}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    {food.calories_per_100g} kcal · P: {food.protein_per_100g}g · C:{" "}
                    {food.carbs_per_100g}g · F: {food.fat_per_100g}g (per 100g)
                  </div>
                </button>
              ))}
            </div>
          ) : (
            // Food Details & Serving Size
            <div className="p-4">
              <button
                onClick={() => setSelectedFood(null)}
                className="flex items-center gap-2 text-sm text-blue-400 mb-4"
              >
                <Icon name="chevronLeft" size={16} color="#3B82F6" />
                Back to search
              </button>

              <div className="bg-[#131520] border border-white/5 rounded-xl p-4 mb-4">
                <div className="text-base font-bold text-white">{selectedFood.name}</div>
                {selectedFood.brand && (
                  <div className="text-sm text-gray-500 mt-0.5">{selectedFood.brand}</div>
                )}
              </div>

              {/* Quick Serving Options */}
              {selectedFood.serving_sizes && selectedFood.serving_sizes.length > 0 && (
                <div className="mb-4">
                  <label className="text-sm font-semibold text-white mb-2 block">
                    Quick Add
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {selectedFood.serving_sizes.map((serving, index) => (
                      <button
                        key={index}
                        onClick={() => {
                          setServingSize(serving.grams.toString());
                          setServingUnit("g");
                        }}
                        className="px-3 py-2 bg-[#131520] border border-white/10 rounded-lg text-sm text-white hover:border-blue-500/50 transition-colors text-left"
                      >
                        {serving.label || `${serving.grams}g`}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Custom Serving Size Input */}
              <div className="mb-4">
                <label className="text-sm font-semibold text-white mb-2 block">
                  Custom Amount
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={servingSize}
                    onChange={(e) => setServingSize(e.target.value)}
                    className="flex-1 px-4 py-3 bg-[#131520] border border-white/10 rounded-xl text-white focus:outline-none focus:border-blue-500/50"
                    placeholder="100"
                    min="0"
                    step="1"
                  />
                  <select
                    value={servingUnit}
                    onChange={(e) => setServingUnit(e.target.value)}
                    className="px-4 py-3 bg-[#131520] border border-white/10 rounded-xl text-white focus:outline-none focus:border-blue-500/50"
                  >
                    <option value="g">grams (g)</option>
                  </select>
                </div>
              </div>

              {/* Nutrition Preview */}
              {nutrition && (
                <div className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-xl p-4">
                  <div className="text-sm font-semibold text-white mb-3">
                    Nutrition Facts
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-black/20 rounded-lg p-3">
                      <div className="text-xs text-gray-400">Calories</div>
                      <div className="text-lg font-bold text-white">
                        {nutrition.calories}
                      </div>
                    </div>
                    <div className="bg-black/20 rounded-lg p-3">
                      <div className="text-xs text-gray-400">Protein</div>
                      <div className="text-lg font-bold text-white">
                        {nutrition.protein}g
                      </div>
                    </div>
                    <div className="bg-black/20 rounded-lg p-3">
                      <div className="text-xs text-gray-400">Carbs</div>
                      <div className="text-lg font-bold text-white">
                        {nutrition.carbs}g
                      </div>
                    </div>
                    <div className="bg-black/20 rounded-lg p-3">
                      <div className="text-xs text-gray-400">Fat</div>
                      <div className="text-lg font-bold text-white">{nutrition.fat}g</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {selectedFood && (
          <div className="p-4 border-t border-white/10">
            <button
              onClick={handleConfirm}
              disabled={!servingSize || parseFloat(servingSize) <= 0}
              className="w-full py-3.5 rounded-xl bg-blue-500 text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Add to {mealType}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
