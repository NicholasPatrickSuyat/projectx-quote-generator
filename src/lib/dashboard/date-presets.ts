import { addDays, startOfDay, toIsoDate } from "@/lib/format";

export const DATE_PRESETS = [
  { id: "today", label: "Today" },
  { id: "last-7", label: "Last 7 Days" },
  { id: "last-30", label: "Last 30 Days" },
  { id: "this-month", label: "This Month" },
] as const;

export type DatePresetId = (typeof DATE_PRESETS)[number]["id"];

export const DEFAULT_DATE_PRESET: DatePresetId = "last-30";

export type DateRange = {
  start: string;
  end: string;
};

export function getDatePresetLabel(preset: DatePresetId): string {
  const match = DATE_PRESETS.find((item) => item.id === preset);
  return match?.label ?? preset;
}

export function getDateRange(
  preset: DatePresetId,
  today: Date = new Date(),
): DateRange {
  const end = startOfDay(today);

  switch (preset) {
    case "today":
      return { start: toIsoDate(end), end: toIsoDate(end) };
    case "last-7":
      return { start: toIsoDate(addDays(end, -6)), end: toIsoDate(end) };
    case "last-30":
      return { start: toIsoDate(addDays(end, -29)), end: toIsoDate(end) };
    case "this-month":
      return {
        start: toIsoDate(new Date(end.getFullYear(), end.getMonth(), 1)),
        end: toIsoDate(end),
      };
  }
}

export function isDateInRange(
  isoDate: string | undefined,
  range: DateRange,
): boolean {
  if (!isoDate) return false;
  return isoDate >= range.start && isoDate <= range.end;
}
