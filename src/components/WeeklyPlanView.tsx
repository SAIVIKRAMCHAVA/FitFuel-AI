// path: src/components/WeeklyPlanView.tsx
type Meal = {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  items?: string[];
};
type Day = { date: string; targetCalories: number; meals: Meal[] };
type Plan = {
  weekStart: string;
  modelUsed?: string;
  notes?: string;
  days: Day[];
};

export default function WeeklyPlanView({ plan }: { plan: Plan }) {
  return (
    <div className="space-y-4">
      <div className="p-4 border rounded">
        <h2 className="text-xl font-semibold">
          Week starting {plan.weekStart}
        </h2>
        <p className="text-sm text-gray-600">
          Model: {plan.modelUsed ?? "unknown"}
          {plan.notes ? ` — ${plan.notes}` : ""}
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {plan.days.map((d) => (
          <div key={d.date} className="p-4 border rounded">
            <h3 className="font-semibold mb-2">
              {new Date(d.date).toDateString()}
            </h3>
            <p className="text-sm text-gray-600 mb-2">
              Target: {d.targetCalories} kcal
            </p>
            <div className="space-y-3">
              {d.meals.map((m, i) => (
                <div key={i} className="p-3 rounded border">
                  <div className="font-medium">{m.name}</div>
                  <div className="text-sm">
                    Calories {m.calories} • P {m.protein} • C {m.carbs} • F{" "}
                    {m.fat}
                  </div>
                  {m.items && m.items.length > 0 && (
                    <ul className="list-disc list-inside text-sm text-gray-700">
                      {m.items.map((it, idx) => (
                        <li key={idx}>{it}</li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
