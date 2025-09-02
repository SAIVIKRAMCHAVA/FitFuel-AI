// path: src/lib/bmi.ts
export function bmi(weightKg: number, heightCm?: number | null) {
  if (!heightCm || heightCm <= 0) return null;
  const h = heightCm / 100;
  const v = weightKg / (h * h);
  return Math.round(v * 10) / 10; // 1 decimal
}

export function bmiCategory(v: number | null) {
  if (v == null) return "—";
  if (v < 18.5) return "Underweight";
  if (v < 25) return "Normal";
  if (v < 30) return "Overweight";
  return "Obese";
}
