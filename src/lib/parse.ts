import type { BlockKind, PartnerKey } from "./types";
import { DAY_NAMES } from "./time";

/**
 * Эвристический разбор текста, полученного из скриншота расписания.
 * Работает и для «пар», и для «звонков/перемен».
 */

const DAY_ALIASES: Record<number, string[]> = {
  1: ["понедельник", "понед", "пн"],
  2: ["вторник", "втор", "вт"],
  3: ["среда", "сред", "ср"],
  4: ["четверг", "четв", "чт"],
  5: ["пятница", "пятн", "пт"],
  6: ["суббота", "субб", "сб"],
  7: ["воскресенье", "воскр", "вс"],
};

export interface ParsedRange {
  day: number | null;
  start: string;
  end: string;
  startMin: number;
  endMin: number;
  kind: "class" | "break" | "call";
  label: string | null;
}

export interface ParseResult {
  ranges: ParsedRange[];
  days: { day: number; pairCount: number; start: string; end: string }[];
  blocks: { day: number; kind: BlockKind; start: string; end: string; label: string | null }[];
  warnings: string[];
  daysFound: number;
  raw: string;
}

function normTime(raw: string): string {
  const m = raw.replace(/\./g, ":").match(/(\d{1,2}):(\d{2})/);
  if (!m) return raw;
  const h = Number(m[1]);
  const mm = Number(m[2]);
  if (h > 23 || mm > 59) return raw;
  return `${String(h).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}

export function normalizeText(text: string): string {
  return text
    .replace(/ё/gi, "е")
    .replace(/[–—−−‐]/g, "-")
    .replace(/\u00a0/g, " ")
    .replace(/[|]/g, " ")
    .replace(/(\d)\s*\.\s*(\d{2})/g, "$1:$2")
    .replace(/[ \t]+/g, " ");
}

function findDays(text: string): { index: number; day: number; len: number }[] {
  const lower = text.toLowerCase();
  const hits: { index: number; day: number; len: number }[] = [];
  for (const [dayStr, aliases] of Object.entries(DAY_ALIASES)) {
    const day = Number(dayStr);
    for (const alias of aliases) {
      let from = 0;
      for (;;) {
        const idx = lower.indexOf(alias, from);
        if (idx === -1) break;
        hits.push({ index: idx, day, len: alias.length });
        from = idx + alias.length;
      }
    }
  }
  // оставляем самое длинное совпадение для каждой позиции
  hits.sort((a, b) => a.index - b.index || b.len - a.len);
  const out: typeof hits = [];
  let lastEnd = -1;
  for (const h of hits) {
    if (h.index >= lastEnd) {
      out.push(h);
      lastEnd = h.index + h.len;
    }
  }
  return out;
}

const RANGE_RE =
  /(\d{1,2}[:.]\d{2})\s*(?:-|до|to)\s*(\d{1,2}[:.]\d{2})|(\d{1,2}[:.]\d{2})\s*-\s*(\d{1,2})\b(?!\d|[:.]\d)/g;

interface RawRange {
  index: number;
  endIndex: number;
  start: string;
  end: string;
}

function findRanges(text: string): RawRange[] {
  const out: RawRange[] = [];
  RANGE_RE.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = RANGE_RE.exec(text)) !== null) {
    const endIndex = m.index + m[0].length;
    if (m[1] && m[2]) {
      out.push({ index: m.index, endIndex, start: normTime(m[1]), end: normTime(m[2]) });
    } else if (m[3] && m[4]) {
      // "8:30-10" -> 8:30-10:00
      out.push({ index: m.index, endIndex, start: normTime(m[3]), end: normTime(`${m[4]}:00`) });
    }
    if (m.index === RANGE_RE.lastIndex) RANGE_RE.lastIndex++;
  }
  return out;
}

/**
 * Подпись берём только из узкого окна вокруг самого интервала:
 * текст между концом предыдущего интервала и началом этого + немного после.
 * Иначе слово «перемена» из соседней строки прилипало к парам.
 */
function labelFor(text: string, r: RawRange, prevEndIndex: number): string | null {
  const before = text.slice(Math.max(prevEndIndex, r.index - 28), r.index).toLowerCase();
  // сначала урок/пара: заголовок «расписание звонков» не должен перекрывать «1 урок»
  const lesson = before.match(/(\d{1,2})\s*(?:урок|пара|занятие)/);
  if (lesson) return `${lesson[1]}-я пара`;
  if (/урок|заняти/.test(before)) return "пара";
  if (/\bпар[аыу]\b/.test(before)) return "пара";
  if (/перемен/.test(before)) return "перемена";
  if (/обед/.test(before)) return "обед";
  if (/звонок|созвон|звонк/.test(before)) return "звонок";
  if (/окно/.test(before)) return "окно";
  return null;
}

const LESSON_LABEL = /пара|урок|занятие/;

export function parseScheduleText(rawText: string, kind: "classes" | "calls"): ParseResult {
  const text = normalizeText(rawText);
  const warnings: string[] = [];
  const dayHits = findDays(text);
  const ranges = findRanges(text);
  const daysFound = new Set(dayHits.map((d) => d.day)).size;

  if (ranges.length === 0) {
    warnings.push("Не удалось найти ни одного времени вида «8:30-10:00». Заполни день вручную.");
  }
  if (daysFound === 0 && ranges.length > 0) {
    warnings.push(
      kind === "calls"
        ? "Дни недели не распознаны — интервалы применены ко всем учебным дням (Пн–Сб)."
        : "Дни недели не распознаны — интервалы сохранены как общий шаблон звонков (Пн–Сб).",
    );
  }
  if (ranges.length > 0 && daysFound > 0 && ranges.length < daysFound) {
    warnings.push("Времени найдено меньше, чем дней: проверь результат вручную.");
  }

  const parsed: ParsedRange[] = [];
  let prevEnd = 0;
  let skippedLessons = 0;
  for (const r of ranges) {
    let day: number | null = null;
    for (const d of dayHits) if (d.index < r.index) day = d.day;
    const label = labelFor(text, r, prevEnd);
    prevEnd = r.endIndex;
    const startMin = toMinSafe(r.start);
    const endMin = toMinSafe(r.end);
    const minutes = endMin - startMin;
    if (minutes <= 0 || minutes > 12 * 60) continue;

    let rangeKind: ParsedRange["kind"];
    if (minutes <= 25 || label === "перемена" || label === "обед") {
      rangeKind = "break";
    } else if (kind === "calls") {
      // уроки со скрина звонков не дублируем: пары берутся из первого скриншота
      if (label && LESSON_LABEL.test(label)) {
        skippedLessons++;
        continue;
      }
      rangeKind = "call";
    } else {
      rangeKind = "class";
    }
    parsed.push({ day, start: r.start, end: r.end, startMin, endMin, kind: rangeKind, label });
  }

  if (skippedLessons > 0)
    warnings.push(
      `Пропущено интервалов уроков: ${skippedLessons} — они берутся из скриншота пар, здесь оставили только перемены и звонки.`,
    );

  const blocks: ParseResult["blocks"] = [];
  const dayMap = new Map<number, ParsedRange[]>();

  const targetDays = (d: number | null): number[] =>
    d ? [d] : [1, 2, 3, 4, 5, 6];

  for (const p of parsed) {
    for (const day of targetDays(p.day)) {
      if (p.kind === "class") {
        const arr = dayMap.get(day) ?? [];
        arr.push(p);
        dayMap.set(day, arr);
      } else {
        blocks.push({
          day,
          kind: p.kind === "break" ? "break" : "call",
          start: p.start,
          end: p.end,
          label: p.label ?? (p.kind === "break" ? "перемена" : "звонок"),
        });
      }
    }
  }

  // если скрин «звонков» дал только длинные интервалы — считаем их звонками
  if (kind === "calls" && blocks.length === 0) {
    for (const p of parsed) {
      for (const day of targetDays(p.day)) {
        blocks.push({
          day,
          kind: p.kind === "break" ? "break" : "call",
          start: p.start,
          end: p.end,
          label: p.label ?? "звонок",
        });
      }
    }
  }

  const days: ParseResult["days"] = [];
  for (const [day, arr] of [...dayMap.entries()].sort((a, b) => a[0] - b[0])) {
    const sorted = [...arr].sort((a, b) => a.startMin - b.startMin);
    days.push({
      day,
      pairCount: sorted.length,
      start: sorted[0].start,
      end: sorted[sorted.length - 1].end,
    });
  }

  // дедупликация блоков
  const seen = new Set<string>();
  const uniqueBlocks = blocks.filter((b) => {
    const k = `${b.day}|${b.kind}|${b.start}|${b.end}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });

  return { ranges: parsed, days, blocks: uniqueBlocks, warnings, daysFound, raw: text };
}

function toMinSafe(t: string): number {
  const m = t.match(/(\d{1,2}):(\d{2})/);
  if (!m) return 0;
  return Number(m[1]) * 60 + Number(m[2]);
}

export function dayNameFromNumber(day: number): string {
  return DAY_NAMES[day - 1] ?? "";
}

export function applyParse(
  result: ParseResult,
  partnerKey: PartnerKey,
  current: {
    dayClasses: { partnerKey: PartnerKey; day: number; pairCount: number; startTime: string | null; endTime: string | null; note: string | null }[];
    timeBlocks: { partnerKey: PartnerKey; day: number; kind: BlockKind; startTime: string; endTime: string; label: string | null }[];
  },
) {
  const dayClasses = current.dayClasses.filter((d) => !(d.partnerKey === partnerKey && result.days.some((x) => x.day === d.day)));
  for (const d of result.days) {
    dayClasses.push({
      partnerKey,
      day: d.day,
      pairCount: d.pairCount,
      startTime: d.start,
      endTime: d.end,
      note: "из скриншота",
    });
  }

  const timeBlocks = current.timeBlocks.filter(
    (b) => !(b.partnerKey === partnerKey && result.blocks.some((x) => x.day === b.day)),
  );
  for (const b of result.blocks) {
    timeBlocks.push({
      partnerKey,
      day: b.day,
      kind: b.kind,
      startTime: b.start,
      endTime: b.end,
      label: b.label,
    });
  }

  dayClasses.sort((a, b) => a.day - b.day || a.partnerKey.localeCompare(b.partnerKey));
  timeBlocks.sort((a, b) => a.day - b.day || a.startTime.localeCompare(b.startTime));
  return { dayClasses, timeBlocks };
}
