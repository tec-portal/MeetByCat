import type { DayStatus, SegKind } from "./analysis";

export const STATUS_META: Record<
  DayStatus,
  {
    label: string;
    jp: string;
    dot: string;
    chip: string;
    ring: string;
    bar: string;
    mood: "happy" | "calm" | "sad";
  }
> = {
  great: {
    label: "Отличный день",
    jp: "最高",
    dot: "#4fae7a",
    chip: "border-matcha/40 bg-matcha/10 text-[#3f8b62]",
    ring: "#7fae8b",
    bar: "linear-gradient(90deg,#7fae8b,#4fae7a)",
    mood: "happy",
  },
  good: {
    label: "Хороший день",
    jp: "良い",
    dot: "#d94d88",
    chip: "border-sakura-400/50 bg-sakura-100 text-sakura-800",
    ring: "#f26fa4",
    bar: "linear-gradient(90deg,#ff94bc,#d94d88)",
    mood: "happy",
  },
  ok: {
    label: "Короткое окно",
    jp: "少し",
    dot: "#7c6bd6",
    chip: "border-violet/40 bg-violet/10 text-[#5b4bb0]",
    ring: "#9d8ff0",
    bar: "linear-gradient(90deg,#b9aef2,#7c6bd6)",
    mood: "calm",
  },
  risky: {
    label: "Под вопросом",
    jp: "微妙",
    dot: "#d9a441",
    chip: "border-gold/50 bg-gold/10 text-[#a3761f]",
    ring: "#e6bd6d",
    bar: "linear-gradient(90deg,#f0d79b,#d9a441)",
    mood: "calm",
  },
  none: {
    label: "Не получится",
    jp: "無理",
    dot: "#e4572e",
    chip: "border-vermilion/40 bg-vermilion/10 text-vermilion",
    ring: "#f0a08a",
    bar: "linear-gradient(90deg,#f3b39f,#e4572e)",
    mood: "sad",
  },
  empty: {
    label: "Нет данных",
    jp: "空",
    dot: "#c9b3c1",
    chip: "border-sakura-200 bg-sakura-50 text-ink-faint",
    ring: "#e2d2db",
    bar: "linear-gradient(90deg,#eadde5,#d8c6d1)",
    mood: "sad",
  },
};

export const SEG_STYLE: Record<SegKind, { bg: string; title: string; text?: string }> = {
  class: { bg: "linear-gradient(180deg,#ffb8d3,#f26fa4)", title: "пары" },
  break: {
    bg: "repeating-linear-gradient(135deg,#ffe9f2,#ffe9f2 4px,#ffd7e7 4px,#ffd7e7 8px)",
    title: "перемена",
  },
  call: { bg: "linear-gradient(180deg,#b9aef2,#7c6bd6)", title: "звонок" },
  other: { bg: "linear-gradient(180deg,#e6d9e2,#c9b3c1)", title: "свои дела" },
  travel: {
    bg: "repeating-linear-gradient(115deg,#f0d79b,#f0d79b 5px,#d9a441 5px,#d9a441 10px)",
    title: "дорога",
  },
  waiting: {
    bg: "repeating-linear-gradient(90deg,#eadde5,#eadde5 4px,#ffffff 4px,#ffffff 8px)",
    title: "ожидание",
  },
  meeting: { bg: "linear-gradient(180deg,#ff94bc,#d94d88 60%,#b23a6d)", title: "встреча" },
};
