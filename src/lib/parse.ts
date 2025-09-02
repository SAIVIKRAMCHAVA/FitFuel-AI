// path: src/lib/parse.ts
export type ParsedItem = {
  name: string;
  qty: number;
  unit: "g" | "piece";
};

/**
 * Parse free-text food lines into {name, qty, unit}.
 * Examples:
 *  - "2 chapati"
 *  - "dal 150g"
 *  - "curd 100 g"
 *  - "rice, dal 150g; curd 1 cup" => ["rice", "dal 150g", "curd 1 cup"]
 * For unknown units we treat a leading number as "piece".
 */
export function parseItemsFromText(text: string): ParsedItem[] {
  const parts = text
    .split(/[,;]+/)
    .map((s) => s.trim())
    .filter(Boolean);

  return parts.map((p) => {
    // Handles "150g dal", "150 g dal", "dal 150g", "dal 150 g", or "2 chapati"
    const gramsAtStart = p.match(/^(\d+)\s*g(?:r|ram|rams)?\s*(.+)$/i);
    if (gramsAtStart) {
      const qty = parseInt(gramsAtStart[1], 10);
      const name = gramsAtStart[2].trim();
      return { name, qty, unit: "g" as const };
    }

    const gramsAtEnd = p.match(/^(.+?)\s+(\d+)\s*g(?:r|ram|rams)?$/i);
    if (gramsAtEnd) {
      const name = gramsAtEnd[1].trim();
      const qty = parseInt(gramsAtEnd[2], 10);
      return { name, qty, unit: "g" as const };
    }

    const countLeading = p.match(/^(\d+)\s+(.+)$/);
    if (countLeading) {
      const qty = parseInt(countLeading[1], 10);
      const name = countLeading[2].trim();
      return { name, qty, unit: "piece" as const };
    }

    return { name: p, qty: 1, unit: "piece" as const };
  });
}
