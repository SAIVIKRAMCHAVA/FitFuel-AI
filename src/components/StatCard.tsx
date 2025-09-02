// path: src/components/StatCard.tsx
import { ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm text-muted-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="text-2xl font-semibold">{value}</div>
        {footer ? (
          <div className="text-xs text-muted-foreground mt-1">{footer}</div>
        ) : null}
      </CardContent>
    </Card>
  );
}
