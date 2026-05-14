import type { SocialWrap } from "./components/SocialWrapCard";

export type SocialStats = {
  total: number;
  topMonth: { month: string; count: number } | null;
  topPlace: { place: string; count: number } | null;
  topItems: { name: string; count: number }[];
};

export function buildSocialStats(wrap: SocialWrap): SocialStats {
  const byMonth: Record<string, number> = {};
  const byPlace: Record<string, number> = {};
  const byName: Record<string, number> = {};

  for (const item of wrap.items) {
    const month = new Date(item.date).toISOString().slice(0, 7);
    byMonth[month] = (byMonth[month] || 0) + 1;
    byName[item.name] = (byName[item.name] || 0) + 1;
    if (item.notes) byPlace[item.notes] = (byPlace[item.notes] || 0) + 1;
  }

  return {
    total: wrap.items.length,
    topMonth: topMonthEntry(byMonth),
    topPlace: topPlaceEntry(byPlace),
    topItems: Object.entries(byName)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
      .slice(0, 3),
  };
}

function topMonthEntry(record: Record<string, number>) {
  const entry = topEntry(record);
  return entry ? { month: entry.value, count: entry.count } : null;
}

function topPlaceEntry(record: Record<string, number>) {
  const entry = topEntry(record);
  return entry ? { place: entry.value, count: entry.count } : null;
}

function topEntry(record: Record<string, number>) {
  const [value, count] = Object.entries(record).sort((a, b) => b[1] - a[1])[0] ?? [];
  return value ? { value, count } : null;
}
