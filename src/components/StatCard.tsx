// path: src/components/StatCard.tsx
import { ReactNode } from "react";

export default function StatCard({
  title,
  value,
  footer,
}: {
  title: string;
  value: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="p-4 rounded border">
      <div className="text-sm text-gray-600">{title}</div>
      <div className="text-2xl font-semibold mt-1">{value}</div>
      {footer ? (
        <div className="text-xs text-gray-500 mt-1">{footer}</div>
      ) : null}
    </div>
  );
}
