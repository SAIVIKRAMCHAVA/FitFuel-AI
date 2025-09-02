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
      <div className="rounded-2xl border p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div>
            <div className="text-sm text-muted-foreground">Week start</div>
            <div className="font-medium">
              {new Date(plan.weekStart).toDateString()}
            </div>
          </div>
          {plan.modelUsed && (
            <div>
              <div className="text-sm text-muted-foreground">Model</div>
              <div className="font-medium">{plan.modelUsed}</div>
            </div>
          )}
        </div>
        {plan.notes && (
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            {plan.notes}
          </p>
        )}
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {plan.days.map((d, i) => (
          <div key={i} className="rounded-2xl border p-4">
            <div className="mb-2 flex items-center justify-between">
              <div className="font-semibold">
                {new Date(d.date).toDateString()}
              </div>
              <div className="text-sm text-muted-foreground">
                Target: {Math.round(d.targetCalories)} kcal
              </div>
            </div>
            <div className="space-y-3">
              {d.meals.map((m, j) => (
                <div key={j} className="rounded-lg bg-muted/40 p-3">
                  <div className="flex justify-between">
                    <div className="font-medium">{m.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {Math.round(m.calories)} kcal • P {m.protein} • C{" "}
                      {m.carbs} • F {m.fat}
                    </div>
                  </div>
                  {m.items && m.items.length > 0 && (
                    <ul className="mt-1 list-disc pl-5 text-sm">
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
