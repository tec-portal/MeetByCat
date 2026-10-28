export const DAY_NAMES = [
  "Понедельник",
  "Вторник",
  "Среда",
  "Четверг",
  "Пятница",
  "Суббота",
  "Воскресенье",
];

export const DAY_SHORT = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

/** Японские подписи для декора по дням недели */
export const DAY_KANJI = ["月", "火", "水", "木", "金", "土", "日"];

export const clamp = (v: number, min: number, max: number) =>
  Math.min(max, Math.max(min, v));

/** "HH:MM" -> минуты от начала суток. Возвращает null если строка не похожа на время. */
export function toMin(value?: string | null): number | null {
  if (!value) return null;
  const m = String(value).trim().match(/^(\d{1,2})[:.\s](\d{2})$/);
  if (!m) return null;
  const h = Number(m[1]);
  const mm = Number(m[2]);
  if (h > 23 || mm > 59) return null;
  return h * 60 + mm;
}

export function toMinOr(value: string | null | undefined, fallback: number) {
  const v = toMin(value);
  return v === null ? fallback : v;
}

/** минуты -> "HH:MM" */
export function fmt(mins: number): string {
  const m = Math.round(clamp(mins, 0, 24 * 60 - 1));
  const h = Math.floor(m / 60);
  const mm = m % 60;
  return `${String(h).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}

/** минуты -> "2 ч 15 мин" */
export function dur(mins: number): string {
  const m = Math.max(0, Math.round(mins));
  const h = Math.floor(m / 60);
  const rest = m % 60;
  if (h === 0) return `${rest} мин`;
  if (rest === 0) return `${h} ч`;
  return `${h} ч ${rest} мин`;
}

/** "3 пары" / "1 пара" / "5 пар" */
export function pairsWord(n: number): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return "пара";
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return "пары";
  return "пар";
}

export interface Interval {
  start: number;
  end: number;
}

export function overlaps(a: Interval, b: Interval): number {
  return Math.max(0, Math.min(a.end, b.end) - Math.max(a.start, b.start));
}

export function intersect(a: Interval, b: Interval): Interval | null {
  const start = Math.max(a.start, b.start);
  const end = Math.min(a.end, b.end);
  return end > start ? { start, end } : null;
}

export function mergeIntervals(list: Interval[]): Interval[] {
  const sorted = [...list].filter((i) => i.end > i.start).sort((a, b) => a.start - b.start);
  const out: Interval[] = [];
  for (const cur of sorted) {
    const last = out[out.length - 1];
    if (last && cur.start <= last.end) last.end = Math.max(last.end, cur.end);
    else out.push({ ...cur });
  }
  return out;
}

/** [from,to] минус занятые интервалы */
export function subtract(from: number, to: number, busy: Interval[]): Interval[] {
  const merged = mergeIntervals(busy);
  const out: Interval[] = [];
  let cursor = from;
  for (const b of merged) {
    if (b.end <= cursor) continue;
    if (b.start >= to) break;
    if (b.start > cursor) out.push({ start: cursor, end: Math.min(b.start, to) });
    cursor = Math.max(cursor, b.end);
  }
  if (cursor < to) out.push({ start: cursor, end: to });
  return out.filter((i) => i.end > i.start);
}

/** Пересечение двух списков свободных интервалов */
export function intersectLists(a: Interval[], b: Interval[]): Interval[] {
  const out: Interval[] = [];
  for (const x of a) for (const y of b) {
    const i = intersect(x, y);
    if (i) out.push(i);
  }
  return out.sort((p, q) => p.start - q.start);
}

/** Понедельник текущей недели в формате YYYY-MM-DD (локаль пользователя) */
export function mondayOf(date = new Date()): Date {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diff = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - diff);
  return d;
}

export function isoDate(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate(),
  ).padStart(2, "0")}`;
}

export function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export function plural(n: number, one: string, few: string, many: string) {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few;
  return many;
}
