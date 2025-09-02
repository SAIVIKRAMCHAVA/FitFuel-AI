// path: src/components/WeightChart.tsx
"use client";

type Point = { x: number; y: number };
export default function WeightChart({
  weights,
}: {
  weights: { at: string; kg: number }[];
}) {
  if (!weights.length) return null;

  // normalize to 0..1 for both axes
  const min = Math.min(...weights.map((w) => w.kg));
  const max = Math.max(...weights.map((w) => w.kg));
  const range = Math.max(1, max - min);
  const pts: Point[] = weights.map((w, i) => ({
    x: i / Math.max(1, weights.length - 1),
    y: (w.kg - min) / range,
  }));

  const d = pts
    .map((p, i) => {
      const X = Math.round(p.x * 300);
      const Y = Math.round((1 - p.y) * 60);
      return `${i === 0 ? "M" : "L"} ${X} ${Y}`;
    })
    .join(" ");

  return (
    <svg viewBox="0 0 300 60" width="100%" height="70">
      <polyline
        points={`0,60 300,60`}
        stroke="currentColor"
        strokeOpacity="0.2"
        fill="none"
      />
      <path d={d} fill="none" stroke="currentColor" strokeWidth="2" />
      <text x="0" y="12" fontSize="10">
        {min.toFixed(1)} kg
      </text>
      <text x="240" y="12" fontSize="10">
        {max.toFixed(1)} kg
      </text>
    </svg>
  );
}
