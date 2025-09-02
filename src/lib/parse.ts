// path: src/lib/parse.ts
export type ParsedItem = { name: string; qty: number; unit: "g" | "piece" };

/** Parses strings like: "2 chapati, dal 150g, curd 100g" */
export function parseItemsFromText(text: string): ParsedItem[] {
  const parts = text
    .replace(/\n/g, " ")
    .split(/[,;]+/)
    .map((s) => s.trim())
    .filter(Boolean);
  const items: ParsedItem[] = [];
  for (const p of parts) {
    // "2 chapati" or "150g dal"
    let m = p.match(/^(\d+)\s*([a-zA-Z]*)\s*(.*)$/);
    if (m) {
      const qty = parseInt(m[1], 10);
      const maybeUnit = (m[2] || "").toLowerCase();
      const unit: "g" | "piece" = maybeUnit.includes("g") ? "g" : "piece";
      const name = (m[3] || p).trim() || p;
      items.push({ name, qty, unit });
      continue;
    }
    // "dal 150g"
    m = p.match(/^(.*?)[\s:]+(\d+)\s*g$/i);
    if (m) {
      items.push({ name: m[1].trim(), qty: parseInt(m[2], 10), unit: "g" });
      continue;
    }
    // default
    items.push({ name: p, qty: 1, unit: "piece" });
  }
  return items;
}
