const APP_TIME_ZONE_OFFSET = "+05:30";

export function parseDateTimeLocal(
  value: FormDataEntryValue | string | null | undefined,
  fallback = new Date(),
) {
  const raw = String(value ?? "").trim();
  if (!raw) return fallback;

  if (/[zZ]|[+-]\d{2}:?\d{2}$/.test(raw)) {
    const parsed = new Date(raw);
    return Number.isNaN(parsed.getTime()) ? fallback : parsed;
  }

  const withSeconds = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(raw)
    ? `${raw}:00`
    : raw;
  const parsed = new Date(`${withSeconds}${APP_TIME_ZONE_OFFSET}`);

  return Number.isNaN(parsed.getTime()) ? fallback : parsed;
}

export function formatDateTimeIST(date: Date) {
  return date.toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Kolkata",
  });
}
