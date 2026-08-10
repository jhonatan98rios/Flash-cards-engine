// Spaced-repetition scheduling. Dates are compared as YYYY-MM-DD strings
// (lexicographic order == chronological order, no timezone math).

export function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function todayISO(): string {
  return toISODate(new Date());
}

export function addDays(iso: string, days: number): string {
  const d = new Date(`${iso}T00:00:00`);
  d.setDate(d.getDate() + days);
  return toISODate(d);
}

const MAX_INTERVAL = 90;

// Leitner-style gaps: again resets to 1 day, good doubles, easy quadruples.
export function nextInterval(current: number, rating: "again" | "good" | "easy"): number {
  switch (rating) {
    case "again":
      return 1;
    case "good":
      return Math.min(MAX_INTERVAL, Math.max(1, Math.round(current * 2)));
    case "easy":
      return Math.min(MAX_INTERVAL, Math.max(4, Math.round(current * 4)));
  }
}

/** New items start with interval 0 and are due immediately (today). */
export function newItemVisualizationDate(): string {
  return todayISO();
}

/** Due = its visualization date has arrived. */
export function isDue(visualizationDate: string, now?: string): boolean {
  return visualizationDate <= (now ?? todayISO());
}
