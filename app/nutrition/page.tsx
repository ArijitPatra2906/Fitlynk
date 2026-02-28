"use client";

import { useState, useEffect } from "react";
import { Icon } from "@/components/ui/icon";
import { ProgressRing } from "@/components/ui/progress-ring";
import { MacroPill } from "@/components/ui/macro-pill";
import { FoodSearchModal } from "@/components/nutrition/food-search-modal";
import { getAuthToken } from "@/lib/auth/auth-token";
import { apiClient } from "@/lib/api/client";
import { toast } from "sonner";

interface MealItem {
  _id: string;
  food_id: {
    _id: string;
    name: string;
    brand?: string;
  };
  serving_size: number;
  serving_unit: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
}

interface DailyNutrition {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

interface Goals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

type MealType = "breakfast" | "lunch" | "dinner" | "snack";

const mealConfig = [
  { type: "breakfast", label: "Breakfast", color: "#F59E0B" },
  { type: "lunch", label: "Lunch", color: "#10B981" },
  { type: "snack", label: "Snacks", color: "#818CF8" },
  { type: "dinner", label: "Dinner", color: "#3B82F6" },
] as const;

export default function NutritionPage() {
  const [loading, setLoading] = useState(true);
  const [mealItems, setMealItems] = useState<{ [key in MealType]: MealItem[] }>({
    breakfast: [],
    lunch: [],
    snack: [],
    dinner: [],
  });
  const [nutrition, setNutrition] = useState<DailyNutrition>({
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
  });
  const [goals, setGoals] = useState<Goals>({
    calories: 2400,
    protein: 180,
    carbs: 280,
    fat: 80,
  });
  const [showFoodModal, setShowFoodModal] = useState(false);
  const [selectedMealType, setSelectedMealType] = useState<MealType>("breakfast");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = await getAuthToken();
      if (!token) return;

      const today = new Date().toISOString().split("T")[0];

      // Fetch today's meals
      const mealsRes = await apiClient.get(`/api/nutrition/meals?date=${today}`, token);

      if (mealsRes.success) {
        const meals = mealsRes.data || [];

        // Group meals by type
        const grouped: { [key in MealType]: MealItem[] } = {
          breakfast: [],
          lunch: [],
          snack: [],
          dinner: [],
        };

        meals.forEach((meal: any) => {
          if (grouped[meal.meal_type as MealType]) {
            grouped[meal.meal_type as MealType].push(meal);
          }
        });

        setMealItems(grouped);

        // Calculate totals
        const totals = meals.reduce(
          (acc: DailyNutrition, meal: any) => ({
            calories: acc.calories + (meal.calories || 0),
            protein: acc.protein + (meal.protein_g || 0),
            carbs: acc.carbs + (meal.carbs_g || 0),
            fat: acc.fat + (meal.fat_g || 0),
          }),
          { calories: 0, protein: 0, carbs: 0, fat: 0 }
        );

        setNutrition(totals);
      }

      // Fetch goals
      const goalsRes = await apiClient.get("/api/metrics/goals/current", token);
      if (goalsRes.success && goalsRes.data) {
        setGoals({
          calories: goalsRes.data.calorie_target || 2400,
          protein: goalsRes.data.protein_g || 180,
          carbs: goalsRes.data.carbs_g || 280,
          fat: goalsRes.data.fat_g || 80,
        });
      }
    } catch (error) {
      console.error("Error fetching nutrition data:", error);
      toast.error("Failed to load nutrition data");
    } finally {
      setLoading(false);
    }
  };

  const handleAddFood = (mealType: MealType) => {
    setSelectedMealType(mealType);
    setShowFoodModal(true);
  };

  const handleFoodSelected = async (food: any, servingSize: number, servingUnit: string) => {
    try {
      const token = await getAuthToken();
      if (!token) return;

      // Calculate nutrition based on serving size
      const multiplier = servingUnit === "g" ? servingSize / 100 : servingSize;

      const mealData: any = {
        date: new Date().toISOString().split("T")[0],
        meal_type: selectedMealType,
        food_id: food._id,
        serving_size: servingSize,
        serving_unit: servingUnit,
        calories: Math.round(food.calories_per_100g * multiplier),
        protein_g: Math.round(food.protein_per_100g * multiplier),
        carbs_g: Math.round(food.carbs_per_100g * multiplier),
        fat_g: Math.round(food.fat_per_100g * multiplier),
      };

      // If this is an API food (not saved locally), include food data
      if (food._id.startsWith('api-')) {
        mealData.food_data = {
          name: food.name,
          brand: food.brand,
          barcode: food.barcode,
          calories_per_100g: food.calories_per_100g,
          protein_per_100g: food.protein_per_100g,
          carbs_per_100g: food.carbs_per_100g,
          fat_per_100g: food.fat_per_100g,
          source: food.source,
        };
      }

      const res = await apiClient.post("/api/nutrition/meals", mealData, token);

      if (res.success) {
        toast.success("Food added successfully!");
        setShowFoodModal(false);
        fetchData(); // Refresh data
      }
    } catch (error) {
      console.error("Error adding food:", error);
      toast.error("Failed to add food");
    }
  };

  const handleDeleteMealItem = async (itemId: string) => {
    try {
      const token = await getAuthToken();
      if (!token) return;

      const res = await apiClient.delete(`/api/nutrition/meals/${itemId}`, token);

      if (res.success) {
        toast.success("Item removed");
        fetchData(); // Refresh data
      }
    } catch (error) {
      console.error("Error deleting meal item:", error);
      toast.error("Failed to remove item");
    }
  };

  const getMealCalories = (mealType: MealType): number => {
    return mealItems[mealType].reduce((sum, item) => sum + item.calories, 0);
  };

  if (loading) {
    return (
      <div className="px-6 pt-4 pb-4 flex items-center justify-center min-h-[200px]">
        <div className="text-gray-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="px-6 pt-4 pb-4">
      {/* Macro Summary */}
      <div className="bg-[#131520] border border-white/5 rounded-[22px] p-[18px] mb-4 flex items-center gap-4">
        <ProgressRing
          percent={goals.calories > 0 ? Math.round((nutrition.calories / goals.calories) * 100) : 0}
          size={72}
          stroke={6}
          color="#3B82F6"
          label={Math.round(nutrition.calories).toString()}
          sublabel="kcal"
        />
        <div className="flex-1 flex gap-3">
          <MacroPill
            label="Protein"
            current={Math.round(nutrition.protein)}
            target={goals.protein}
            color="#10B981"
          />
          <MacroPill
            label="Carbs"
            current={Math.round(nutrition.carbs)}
            target={goals.carbs}
            color="#F59E0B"
          />
          <MacroPill
            label="Fat"
            current={Math.round(nutrition.fat)}
            target={goals.fat}
            color="#EF4444"
          />
        </div>
      </div>

      {/* Meals */}
      {mealConfig.map((meal) => {
        const items = mealItems[meal.type];
        const totalCal = getMealCalories(meal.type);

        return (
          <div
            key={meal.type}
            className="bg-[#131520] border border-white/5 rounded-2xl mb-2.5 overflow-hidden"
          >
            <div className="flex items-center justify-between px-4 py-3.5">
              <div className="flex items-center gap-2.5">
                <div className="w-2.5 h-2.5 rounded" style={{ backgroundColor: meal.color }} />
                <span className="text-[14px] font-bold text-white">{meal.label}</span>
                {totalCal > 0 && (
                  <span className="text-[12px] text-gray-400">{totalCal} kcal</span>
                )}
              </div>
              <button
                onClick={() => handleAddFood(meal.type)}
                className="w-7 h-7 rounded-lg bg-blue-500/15 flex items-center justify-center"
              >
                <Icon name="plus" size={14} color="#3B82F6" strokeWidth={2.5} />
              </button>
            </div>
            {items.map((item) => (
              <div
                key={item._id}
                className="px-4 py-2.5 border-t border-white/5 flex items-center justify-between group"
              >
                <div className="flex-1">
                  <div className="text-[13px] text-gray-300">
                    {item.food_id.name}
                    {item.food_id.brand && (
                      <span className="text-gray-500 ml-1">({item.food_id.brand})</span>
                    )}
                  </div>
                  <div className="text-[11px] text-gray-500">
                    {item.serving_size}
                    {item.serving_unit} · {item.calories} kcal · P: {Math.round(item.protein_g)}g
                    C: {Math.round(item.carbs_g)}g F: {Math.round(item.fat_g)}g
                  </div>
                </div>
                <button
                  onClick={() => handleDeleteMealItem(item._id)}
                  className="w-7 h-7 rounded-lg bg-red-500/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Icon name="trash" size={14} color="#EF4444" />
                </button>
              </div>
            ))}
            {items.length === 0 && (
              <div className="px-4 py-3.5 border-t border-white/5 text-center text-[12px] text-gray-600">
                No items yet · tap + to add
              </div>
            )}
          </div>
        );
      })}

      {/* Food Search Modal */}
      <FoodSearchModal
        isOpen={showFoodModal}
        onClose={() => setShowFoodModal(false)}
        onSelectFood={handleFoodSelected}
        mealType={selectedMealType}
      />
    </div>
  );
}
