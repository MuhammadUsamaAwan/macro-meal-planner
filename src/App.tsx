import { useEffect, useState } from "react";
import { Trash2, Plus } from "lucide-react";

export function calculateMacros(weightKg: number, totalCalories: number) {
  const proteinPerKg = 1.8;
  const fatPercent = 25;

  const proteinGrams = weightKg * proteinPerKg;
  const proteinCalories = proteinGrams * 4;

  const fatCalories = (totalCalories * fatPercent) / 100;
  const fatGrams = fatCalories / 9;

  const remainingCalories = totalCalories - (proteinCalories + fatCalories);
  const carbGrams = remainingCalories / 4;

  return {
    proteinGrams: Math.round(proteinGrams),
    fatGrams: Math.round(fatGrams),
    carbGrams: Math.round(carbGrams),
  };
}

export function calculateMaintenanceCalories({ gender, age, height, weight, activityLevel }: { gender: string; age: number; height: number; weight: number; activityLevel: string }): number {
  let bmr: number;
  if (gender === 'Male') {
    bmr = 10 * weight + 6.25 * height - 5 * age + 5;
  } else {
    bmr = 10 * weight + 6.25 * height - 5 * age - 161;
  }
  const activityFactors: Record<string, number> = {
    Sedentary: 1.2,
    Light: 1.375,
    Moderate: 1.55,
    Active: 1.725,
    'Very Active': 1.9,
  };

  return Math.round(bmr * activityFactors[activityLevel]);
}

type Meal = {
  id: string;
  name: string;
  baseUnit: number;
  kcal: number;
  protein: number;
  carbs: number;
  fats: number;
  unitName: string;
};

type PlanMeal = {
  id: string;
  mealId: string;
  mealName: string;
  quantity: number;
  unitName: string;
  mealType: string;
};

type MacroTotals = {
  kcal: number;
  protein: number;
  carbs: number;
  fats: number;
};

export default function App() {
  const [activeTab, setActiveTab] = useState<'profile' | 'meals' | 'plan'>('profile');
  const [gender, setGender] = useState<string>('Male');
  const [age, setAge] = useState<string>('');
  const [height, setHeight] = useState<string>('');
  const [weight, setWeight] = useState<string>('');
  const [activityLevel, setActivityLevel] = useState<string>('Moderate');
  const [kcal, setKcal] = useState<number | null>(null);
  const [calorieDeficit, setCalorieDeficit] = useState<number>(0);
  const [macros, setMacros] = useState<{ proteinGrams: number; fatGrams: number; carbGrams: number } | null>(null);
  
  const [meals, setMeals] = useState<Meal[]>([]);
  const [mealForm, setMealForm] = useState<Meal>({ id: '', name: '', baseUnit: 100, kcal: 0, protein: 0, carbs: 0, fats: 0, unitName: 'g' });
  
  const [planMeals, setPlanMeals] = useState<PlanMeal[]>([]);
  const [selectedMealType, setSelectedMealType] = useState<string>('Breakfast');
  const [planForm, setPlanForm] = useState<{ mealId: string; quantity: number }>({ mealId: '', quantity: 0 });

  const mealTypes = ['Breakfast', 'Snack', 'Lunch', 'Post-Workout', 'Dinner',];

  useEffect(() => {
    try {
      const savedData = JSON.parse(localStorage.getItem("cronos") || '{}');
      if (savedData.gender) {
        setGender(savedData.gender);
        setAge(savedData.age);
        setHeight(savedData.height);
        setWeight(savedData.weight);
        setActivityLevel(savedData.activityLevel);
        setKcal(savedData.kcal);
        setCalorieDeficit(savedData.calorieDeficit || 0);
        setMacros(savedData.macros);
      }
      if (savedData.meals) setMeals(savedData.meals);
      if (savedData.planMeals) setPlanMeals(savedData.planMeals);
    } catch (err) {
      console.error('Error loading data:', err);
    }
  }, []);

  const saveToStorage = (updatedData: Record<string, unknown>): void => {
    try {
      const currentData = JSON.parse(localStorage.getItem("cronos") || '{}');
      localStorage.setItem("cronos", JSON.stringify({ ...currentData, ...updatedData }));
    } catch (err) {
      console.error('Error saving data:', err);
    }
  };

  const handleProfileSubmit = (e: React.FormEvent): void => {
    e.preventDefault();
    const maintenanceCalories = calculateMaintenanceCalories({ 
      gender, 
      age: Number(age), 
      height: Number(height), 
      weight: Number(weight), 
      activityLevel 
    });
    const calculatedMacros = calculateMacros(Number(weight), maintenanceCalories - calorieDeficit);
    setKcal(maintenanceCalories);
    setMacros(calculatedMacros);
    saveToStorage({ gender, age, height, weight, activityLevel, kcal: maintenanceCalories, calorieDeficit, macros: calculatedMacros });
  };

  const handleAddMeal = (e: React.FormEvent): void => {
    e.preventDefault();
    if (!mealForm.name || !mealForm.unitName) return;
    const newMeal: Meal = { 
      id: Date.now().toString(),
      name: mealForm.name, 
      baseUnit: Number(mealForm.baseUnit),
      kcal: Number(mealForm.kcal), 
      protein: Number(mealForm.protein), 
      carbs: Number(mealForm.carbs), 
      fats: Number(mealForm.fats),
      unitName: mealForm.unitName
    };
    const updatedMeals = [...meals, newMeal];
    setMeals(updatedMeals);
    saveToStorage({ meals: updatedMeals });
    setMealForm({ id: '', name: '', baseUnit: 100, kcal: 0, protein: 0, carbs: 0, fats: 0, unitName: 'g' });
  };

  const handleDeleteMeal = (id: string): void => {
    const updatedMeals = meals.filter(m => m.id !== id);
    setMeals(updatedMeals);
    saveToStorage({ meals: updatedMeals });
  };

  const handleAddPlanMeal = (e: React.FormEvent): void => {
    e.preventDefault();
    if (!planForm.mealId || planForm.quantity === 0) return;
    
    const meal = meals.find(m => m.id === planForm.mealId);
    if (!meal) return;

    const newPlanMeal: PlanMeal = {
      id: Date.now().toString(),
      mealId: planForm.mealId,
      mealName: meal.name,
      quantity: Number(planForm.quantity),
      unitName: meal.unitName,
      mealType: selectedMealType,
    };
    
    const updatedPlanMeals = [...planMeals, newPlanMeal];
    setPlanMeals(updatedPlanMeals);
    saveToStorage({ planMeals: updatedPlanMeals });
    setPlanForm({ mealId: '', quantity: 0 });
  };

  const handleDeletePlanMeal = (id: string): void => {
    const updatedPlanMeals = planMeals.filter(m => m.id !== id);
    setPlanMeals(updatedPlanMeals);
    saveToStorage({ planMeals: updatedPlanMeals });
  };

  const calculateMealMacros = (mealId: string, quantity: number): MacroTotals => {
    const meal = meals.find(m => m.id === mealId);
    if (!meal) return { kcal: 0, protein: 0, carbs: 0, fats: 0 };
    
    const multiplier = quantity / meal.baseUnit;
    return {
      kcal: Math.round(meal.kcal * multiplier),
      protein: Math.round(meal.protein * multiplier * 10) / 10,
      carbs: Math.round(meal.carbs * multiplier * 10) / 10,
      fats: Math.round(meal.fats * multiplier * 10) / 10,
    };
  };

  const getMealTypeTotals = (mealType: string): MacroTotals => {
    const typeMeals = planMeals.filter(m => m.mealType === mealType);
    return typeMeals.reduce((acc, meal) => {
      const macros = calculateMealMacros(meal.mealId, meal.quantity);
      return {
        kcal: acc.kcal + macros.kcal,
        protein: acc.protein + macros.protein,
        carbs: acc.carbs + macros.carbs,
        fats: acc.fats + macros.fats,
      };
    }, { kcal: 0, protein: 0, carbs: 0, fats: 0 });
  };

  const getPlanTotals = (): MacroTotals => {
    return planMeals.reduce((acc, meal) => {
      const macros = calculateMealMacros(meal.mealId, meal.quantity);
      return {
        kcal: acc.kcal + macros.kcal,
        protein: acc.protein + macros.protein,
        carbs: acc.carbs + macros.carbs,
        fats: acc.fats + macros.fats,
      };
    }, { kcal: 0, protein: 0, carbs: 0, fats: 0 });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-800 mb-8">💪 Macro Meal Planner</h1>

        <div className="flex gap-2 mb-6 border-b-2 border-gray-300 overflow-x-auto">
          {(['profile', 'meals', 'plan'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-3 font-semibold rounded-t-lg transition-all whitespace-nowrap ${
                activeTab === tab 
                  ? 'bg-blue-600 text-white shadow-lg' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {activeTab === 'profile' && (
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Profile Settings</h2>
            <div className="max-w-md">
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Gender</label>
                  <select 
                    value={gender} 
                    onChange={(e) => setGender(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Age</label>
                  <input type="number" placeholder="Age" value={age} onChange={(e) => setAge(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Height (cm)</label>
                  <input type="number" placeholder="Height" value={height} onChange={(e) => setHeight(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Weight (kg)</label>
                  <input type="number" placeholder="Weight" value={weight} onChange={(e) => setWeight(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Activity Level</label>
                  <select value={activityLevel} onChange={(e) => setActivityLevel(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" required>
                    <option value="Sedentary">Sedentary (little exercise)</option>
                    <option value="Light">Light (1-3 days/week)</option>
                    <option value="Moderate">Moderate (3-5 days/week)</option>
                    <option value="Active">Active (6-7 days/week)</option>
                    <option value="Very Active">Very Active (intense exercise)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Calorie Deficit (optional)</label>
                  <input type="number" placeholder="0" value={calorieDeficit} onChange={(e) => setCalorieDeficit(Number(e.target.value) || 0)} step="50" min="0" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
                  <p className="text-xs text-gray-500 mt-1">Leave at 0 for maintenance, or enter deficit amount (e.g., 500 for 500 cal deficit)</p>
                </div>
              </div>
              <button onClick={handleProfileSubmit} className="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors">
                Calculate Macros
              </button>
            </div>

            {kcal && macros && (
              <div className="mt-8 p-6 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-lg border-l-4 border-blue-600">
                <h3 className="text-xl font-bold text-gray-800 mb-4">Your Daily Targets</h3>
                <div className="mb-4">
                  <p className="text-gray-700 text-sm mb-2"><span className="font-semibold">Maintenance Calories:</span> {kcal} kcal</p>
                  {calorieDeficit > 0 && <p className="text-gray-700 text-sm"><span className="font-semibold">Calorie Deficit:</span> -{calorieDeficit} kcal → Target: {kcal - calorieDeficit} kcal</p>}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white p-4 rounded-lg">
                    <p className="text-gray-600 text-sm">Target Calories</p>
                    <p className="text-2xl font-bold text-blue-600">{kcal - calorieDeficit}</p>
                  </div>
                  <div className="bg-white p-4 rounded-lg">
                    <p className="text-gray-600 text-sm">Protein</p>
                    <p className="text-2xl font-bold text-green-600">{macros.proteinGrams}g</p>
                  </div>
                  <div className="bg-white p-4 rounded-lg">
                    <p className="text-gray-600 text-sm">Carbs</p>
                    <p className="text-2xl font-bold text-yellow-600">{macros.carbGrams}g</p>
                  </div>
                  <div className="bg-white p-4 rounded-lg">
                    <p className="text-gray-600 text-sm">Fats</p>
                    <p className="text-2xl font-bold text-red-600">{macros.fatGrams}g</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'meals' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white rounded-lg shadow-lg p-8">
              <h3 className="text-2xl font-bold text-gray-800 mb-6">Add New Meal</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Meal Name</label>
                  <input placeholder="e.g., Oats" value={mealForm.name} onChange={(e) => setMealForm({ ...mealForm, name: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" required />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Base Unit</label>
                    <input type="number" placeholder="100" value={mealForm.baseUnit} onChange={(e) => setMealForm({ ...mealForm, baseUnit: Number(e.target.value) || 1 })} step="1" min="1" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Unit Name</label>
                    <input placeholder="g, ml, piece, etc" value={mealForm.unitName} onChange={(e) => setMealForm({ ...mealForm, unitName: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" required />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">kcal per {mealForm.baseUnit} {mealForm.unitName}</label>
                  <input type="number" placeholder="0" value={mealForm.kcal} onChange={(e) => setMealForm({ ...mealForm, kcal: Number(e.target.value) })} step="0.1" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Protein (g) per {mealForm.baseUnit} {mealForm.unitName}</label>
                  <input type="number" placeholder="0" value={mealForm.protein} onChange={(e) => setMealForm({ ...mealForm, protein: Number(e.target.value) })} step="0.1" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Carbs (g) per {mealForm.baseUnit} {mealForm.unitName}</label>
                  <input type="number" placeholder="0" value={mealForm.carbs} onChange={(e) => setMealForm({ ...mealForm, carbs: Number(e.target.value) })} step="0.1" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fats (g) per {mealForm.baseUnit} {mealForm.unitName}</label>
                  <input type="number" placeholder="0" value={mealForm.fats} onChange={(e) => setMealForm({ ...mealForm, fats: Number(e.target.value) })} step="0.1" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" required />
                </div>
                <button onClick={handleAddMeal} className="w-full bg-green-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-green-700 transition-colors">
                  Add Meal
                </button>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-lg p-8">
              <h3 className="text-2xl font-bold text-gray-800 mb-6">Saved Meals ({meals.length})</h3>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {meals.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No meals added yet</p>
                ) : (
                  meals.map(meal => (
                    <div key={meal.id} className="p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg border-l-4 border-blue-600">
                      <div className="flex justify-between items-start mb-2">
                        <strong className="text-gray-800">{meal.name}</strong>
                        <button onClick={() => handleDeleteMeal(meal.id)} className="bg-red-500 text-white p-1 rounded hover:bg-red-600 transition-colors">
                          <Trash2 size={16} />
                        </button>
                      </div>
                      <p className="text-xs text-gray-600">
                        {meal.kcal} kcal | P: {meal.protein}g | C: {meal.carbs}g | F: {meal.fats}g <span className="font-semibold">(per {meal.baseUnit} {meal.unitName})</span>
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'plan' && (
          <div>
            {meals.length === 0 ? (
              <div className="bg-red-100 border-l-4 border-red-600 p-6 rounded-lg">
                <p className="text-red-800 font-semibold">⚠️ Please add meals to your database first in the "Meals" tab</p>
              </div>
            ) : (
              <>
                <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
                  <h3 className="text-xl font-bold text-gray-800 mb-4">Add Meal to Plan</h3>
                  <div className="flex flex-wrap gap-4 items-end">
                    <div className="flex-1 min-w-40">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Meal Type</label>
                      <select value={selectedMealType} onChange={(e) => setSelectedMealType(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                        {mealTypes.map(type => (
                          <option key={type} value={type}>{type}</option>
                        ))}
                      </select>
                    </div>
                    <div className="flex-1 min-w-40">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Meal</label>
                      <select value={planForm.mealId} onChange={(e) => setPlanForm({ ...planForm, mealId: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" required>
                        <option value="">Select Meal</option>
                        {meals.map(meal => (
                          <option key={meal.id} value={meal.id}>{meal.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="flex-1 min-w-32">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                      <input type="number" placeholder="0" value={planForm.quantity} onChange={(e) => setPlanForm({ ...planForm, quantity: Number(e.target.value) })} step="1" min="0" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" required />
                    </div>
                    <button onClick={handleAddPlanMeal} className="bg-blue-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2">
                      <Plus size={20} /> Add
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                  {mealTypes.map(type => {
                    const typeMeals = planMeals.filter(m => m.mealType === type);
                    const typeTotals = getMealTypeTotals(type);
                    
                    return (
                      <div key={type} className="bg-white rounded-lg shadow-lg overflow-hidden">
                        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4">
                          <h4 className="text-lg font-bold">{type}</h4>
                        </div>
                        
                        <div className="p-4">
                          {typeMeals.length === 0 ? (
                            <p className="text-gray-500 text-center py-6">No meals planned</p>
                          ) : (
                            <div className="space-y-3 mb-4 max-h-48 overflow-y-auto">
                              {typeMeals.map(planMeal => {
                                const macros = calculateMealMacros(planMeal.mealId, planMeal.quantity);
                                return (
                                  <div key={planMeal.id} className="p-3 bg-green-50 rounded-lg border-l-4 border-green-600">
                                    <div className="flex justify-between items-start mb-1">
                                      <strong className="text-gray-800">{planMeal.mealName}</strong>
                                      <button onClick={() => handleDeletePlanMeal(planMeal.id)} className="bg-red-500 text-white p-1 rounded hover:bg-red-600 transition-colors">
                                        <Trash2 size={14} />
                                      </button>
                                    </div>
                                    <p className="text-xs text-gray-600 mb-2">× {planMeal.quantity} {planMeal.unitName}</p>
                                    <p className="text-xs font-semibold text-gray-700">
                                      {macros.kcal} kcal | P: {macros.protein}g | C: {macros.carbs}g | F: {macros.fats}g
                                    </p>
                                  </div>
                                );
                              })}
                            </div>
                          )}

                          <div className="border-t-2 border-gray-200 pt-3 bg-blue-50 p-3 rounded-lg">
                            <p className="text-xs font-bold text-gray-700 mb-2">{type} Totals</p>
                            <p className="text-sm font-bold text-blue-600">
                              {typeTotals.kcal} kcal
                            </p>
                            <p className="text-xs text-gray-600">
                              P: {typeTotals.protein}g | C: {typeTotals.carbs}g | F: {typeTotals.fats}g
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {planMeals.length > 0 && (
                  <div className="bg-white rounded-lg shadow-lg p-6">
                    <h3 className="text-xl font-bold text-gray-800 mb-4">Plan Totals</h3>
                    {(() => {
                      const totals = getPlanTotals();
                      return (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-600">
                            <p className="text-gray-600 text-sm">Total Calories</p>
                            <p className="text-2xl font-bold text-blue-600">{totals.kcal}</p>
                            {kcal && <p className="text-xs text-gray-500 mt-1">Target: {kcal - calorieDeficit}</p>}
                          </div>
                          <div className="bg-green-50 p-4 rounded-lg border-l-4 border-green-600">
                            <p className="text-gray-600 text-sm">Total Protein</p>
                            <p className="text-2xl font-bold text-green-600">{totals.protein}g</p>
                            {macros && <p className="text-xs text-gray-500 mt-1">Target: {macros.proteinGrams}g</p>}
                          </div>
                          <div className="bg-yellow-50 p-4 rounded-lg border-l-4 border-yellow-600">
                            <p className="text-gray-600 text-sm">Total Carbs</p>
                            <p className="text-2xl font-bold text-yellow-600">{totals.carbs}g</p>
                            {macros && <p className="text-xs text-gray-500 mt-1">Target: {macros.carbGrams}g</p>}
                          </div>
                          <div className="bg-red-50 p-4 rounded-lg border-l-4 border-red-600">
                            <p className="text-gray-600 text-sm">Total Fats</p>
                            <p className="text-2xl font-bold text-red-600">{totals.fats}g</p>
                            {macros && <p className="text-xs text-gray-500 mt-1">Target: {macros.fatGrams}g</p>}
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}