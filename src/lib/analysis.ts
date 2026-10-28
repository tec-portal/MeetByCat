import type { BlockInfo, DayClassInfo, PartnerInfo, SettingsInfo } from "./types";
import {
  DAY_KANJI,
  DAY_NAMES,
  DAY_SHORT,
  clamp,
  dur,
  fmt,
  intersectLists,
  mergeIntervals,
  overlaps,
  pairsWord,
  plural,
  subtract,
  toMin,
  toMinOr,
} from "./time";

export type DayStatus = "great" | "good" | "ok" | "risky" | "none" | "empty";

export type SegKind =
  | "class"
  | "break"
  | "call"
  | "other"
  | "travel"
  | "meeting"
  | "waiting";

export interface Segment {
  start: number;
  end: number;
  kind: SegKind;
  label?: string;
}

export interface MeetingPlan {
  start: number;
  end: number;
  duration: number;
  recommended: number;
  place: string;
  hisArrival: number;
  herArrival: number;
  waitMinutes: number;
  whoWaits: "me" | "her" | "nobody";
  hisHomeBy: number;
  herHomeBy: number;
}

export interface BudgetRow {
  label: string;
  minutes: number;
  hint: string;
  tone: "pink" | "violet" | "gold" | "grey";
}

export interface Idea {
  title: string;
  text: string;
  icon: string;
}

export interface CallWindow {
  start: number;
  end: number;
  duration: number;
  label: string;
}

export interface BreakCall {
  start: number;
  end: number;
  owner: "me" | "her";
  label: string;
  note: string;
  tone: "good" | "bad";
}

export interface DayAnalysis {
  day: number;
  name: string;
  short: string;
  kanji: string;
  status: DayStatus;
  score: number;
  headline: string;
  summary: string;
  reasons: string[];
  facts: { label: string; value: string }[];
  meeting: MeetingPlan | null;
  morning: CallWindow | null;
  callWindows: CallWindow[];
  breakCalls: BreakCall[];
  budget: BudgetRow[];
  ideas: Idea[];
  energy: { his: number; her: number; label: string; tired: boolean };
  hisSegments: Segment[];
  herSegments: Segment[];
  hisFree: { start: number; end: number }[];
  herFree: { start: number; end: number }[];
  hisPairs: number;
  herPairs: number;
  hasData: boolean;
  kitsune: string;
}

export interface WeekTotals {
  meetingMinutes: number;
  meetingDays: number;
  callMinutes: number;
  pairsTotal: number;
  bestDay: number | null;
  hardestDay: number | null;
  hopelessDays: number;
}

export interface WeekAnalysis {
  days: DayAnalysis[];
  totals: WeekTotals;
  verdict: { title: string; text: string; score: number; emoji: string };
  rangeFrom: number;
  rangeTo: number;
}

export interface AnalysisInput {
  settings: SettingsInfo;
  partners: PartnerInfo[];
  dayClasses: DayClassInfo[];
  timeBlocks: BlockInfo[];
  /** Есть ли вообще хоть какие-то данные по партнёру (скрины или введённое вручную) */
  uploadsKnown?: (key: "me" | "her") => boolean;
}

interface IdeaRule {
  title: string;
  text: string;
  icon: string;
  min: number;
  max: number;
  calm?: boolean;
  late?: boolean;
}

const IDEA_BANK: IdeaRule[] = [
  {
    title: "Рамен на двоих",
    text: "Горячая лапшичная рядом с техникумом: дёшево, тепло и ровно столько, сколько нужно после пар.",
    icon: "🍜",
    min: 45,
    max: 120,
    late: true,
  },
  {
    title: "Кофе и болтовня",
    text: "Один стаканчик, одна скамейка, все новости недели вслух. Идеально, когда сил уже нет.",
    icon: "🌸",
    min: 30,
    max: 90,
    calm: true,
    late: true,
  },
  {
    title: "Прогулка до заката",
    text: "Круг по парку или набережной в её темпе — ты как раз согрелся после дороги.",
    icon: "🏮",
    min: 60,
    max: 180,
  },
  {
    title: "Домашка вдвоём",
    text: "Сядьте в библиотеке или кафе: ты закрываешь свой долг по учёбе, она — свой. Время не сгорает зря.",
    icon: "📚",
    min: 90,
    max: 240,
    calm: true,
  },
  {
    title: "Магазинчики и мелочи",
    text: "Канцелярия, книжный, сто-иен-лавки: смотреть, смеяться, ничего не покупать.",
    icon: "🎐",
    min: 60,
    max: 150,
  },
  {
    title: "Кино или аниме-сеанс",
    text: "Полноценный вечер: два часа экрана + дорога. Ставь, когда окно больше трёх часов.",
    icon: "🎬",
    min: 170,
    max: 420,
    calm: true,
  },
  {
    title: "Фотосессия на телефон",
    text: "Свет после пар мягкий, людей мало — будет пара хороших кадров на память.",
    icon: "📷",
    min: 45,
    max: 150,
  },
  {
    title: "Ужин дома у кого-то",
    text: "Долгий спокойный вечер: еда, чай, разговоры без спешки. Проверь, успеваешь ли на последний транспорт.",
    icon: "🍡",
    min: 150,
    max: 420,
    calm: true,
    late: true,
  },
  {
    title: "Онигири на бегу",
    text: "Встретились, перекусили, обнялись — и каждый домой. Лучше, чем не встретиться вообще.",
    icon: "🍙",
    min: 20,
    max: 60,
    late: true,
  },
  {
    title: "Планирование недели",
    text: "15 минут с этим сайтом: отметьте, в какие дни видитесь, и перестаньте спорить об этом в переписке.",
    icon: "🦊",
    min: 20,
    max: 120,
    calm: true,
  },
];

const KITSUNE: Record<DayStatus, string[]> = {
  great: [
    "Девять хвостов шепчут: сегодня ваш день. Не упусти 🦊",
    "Сакура бы осыпалась от зависти — столько свободного времени вдвоём.",
    "Кицунэ довольно кивает: окна хватает и на встречу, и на сон.",
  ],
  good: [
    "Хвостов шесть из девяти — встреча будет, но без лишней спешки.",
    "Кицунэ советует выйти на 10 минут раньше: дорога любит запас.",
    "Хороший день. Только не сидите в телефонах рядом друг с другом.",
  ],
  ok: [
    "Окно узкое, но настоящее. Кицунэ говорит: короткая встреча лучше длинной переписки.",
    "Три хвоста из девяти. Успеем на рамен — и домой.",
  ],
  risky: [
    "Кицунэ хмурится: кто-то из вас будет ждать слишком долго.",
    "Хвосты путаются. Встреча на грани — подумай о созвоне.",
  ],
  none: [
    "Сегодня лиса машет хвостом: не надо себя ломать, отдохните.",
    "Расписание закрыто. Кицунэ предлагает перенести нежность на звонок.",
  ],
  empty: [
    "Кицунэ не видит этот день: загрузи скрин расписания, и я посчитаю.",
    "Пусто. Даже лиса не угадает, когда у вас пары.",
  ],
};

function pick<T>(arr: T[], seed: number): T {
  return arr[Math.abs(seed) % arr.length];
}

function classSpan(
  info: DayClassInfo | undefined,
  s: SettingsInfo,
): { start: number; end: number } | null {
  if (!info || info.pairCount <= 0) return null;
  const full =
    info.pairCount * s.pairMinutes + Math.max(0, info.pairCount - 1) * s.breakMinutes;
  let start = toMin(info.startTime);
  let end = toMin(info.endTime);
  if (start === null && end === null) {
    start = 8 * 60 + 30;
    end = start + full;
  } else if (start !== null && end === null) {
    end = start + full;
  } else if (start === null && end !== null) {
    start = end - full;
  }
  if (end === null || start === null) return null;
  if (end <= start) end = start + s.pairMinutes;
  return { start, end };
}

function energyFor(pairs: number, endMin: number | null): number {
  let e = 100;
  e -= Math.max(0, pairs - 2) * 13;
  if (endMin !== null) e -= Math.max(0, (endMin - 14 * 60) / 30) * 5;
  return Math.round(clamp(e, 12, 100));
}

function energyLabel(avg: number): string {
  if (avg >= 78) return "свежие, как утренняя сакура";
  if (avg >= 58) return "в норме";
  if (avg >= 38) return "подустали";
  return "выжаты до последнего хвоста";
}

function pickIdeas(
  duration: number,
  tired: boolean,
  late: boolean,
  seed: number,
): Idea[] {
  const filtered = IDEA_BANK.filter((i) => {
    if (duration < i.min || duration > i.max) return false;
    if (tired && !i.calm && i.max - i.min > 120) return false;
    return true;
  });
  const scored = filtered
    .map((i, idx) => {
      let score = 0;
      if (tired && i.calm) score += 3;
      if (late && i.late) score += 2;
      if (!late && i.late === true && i.calm !== true) score -= 1;
      const fit = 1 - Math.abs(duration - (i.min + i.max) / 2) / 400;
      score += fit;
      score += ((idx + seed) % 3) * 0.11;
      return { i, score };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map(({ i }) => ({ title: i.title, text: i.text, icon: i.icon }));
  if (scored.length === 0) {
    scored.push({
      title: "Созвон вместо встречи",
      text: "Сегодня личная встреча не складывается. Заложите 30 минут вечером на видеозвонок — это тоже свидание.",
      icon: "📞",
    });
  }
  return scored;
}

interface PartnerDay {
  pairs: number;
  span: { start: number; end: number } | null;
  breaks: { start: number; end: number; label: string | null }[];
  calls: { start: number; end: number; label: string | null }[];
  other: { start: number; end: number; label: string | null }[];
  busy: { start: number; end: number }[];
  /** занято, но перемены вырезаны — чтобы общую перемену не считать конфликтом */
  busyNoBreaks: { start: number; end: number }[];
  free: { start: number; end: number }[];
}

function buildPartnerDay(
  key: "me" | "her",
  day: number,
  s: SettingsInfo,
  dayClasses: DayClassInfo[],
  timeBlocks: BlockInfo[],
  dayStart: number,
  dayEnd: number,
): PartnerDay {
  const cls = dayClasses.find((c) => c.partnerKey === key && c.day === day);
  const span = classSpan(cls, s);
  const blocks = timeBlocks.filter((b) => b.partnerKey === key && b.day === day);
  const mk = (kind: BlockInfo["kind"]) =>
    blocks
      .filter((b) => b.kind === kind)
      .map((b) => ({
        start: toMinOr(b.startTime, 0),
        end: toMinOr(b.endTime, 0),
        label: b.label,
      }))
      .filter((b) => b.end > b.start);

  const breaks = mk("break");
  const calls = mk("call");
  const other = mk("other");

  const busyRaw: { start: number; end: number }[] = [...calls, ...other];
  if (span) busyRaw.push(span);
  const busy = mergeIntervals(busyRaw.map((b) => ({ start: b.start, end: b.end })));
  const busyNoBreaks = busy.flatMap((b) => subtract(b.start, b.end, breaks));
  const free = subtract(dayStart, dayEnd, busy);

  return { pairs: cls?.pairCount ?? 0, span, breaks, calls, other, busy, busyNoBreaks, free };
}

export function analyzeWeek(input: AnalysisInput): WeekAnalysis {
  const s = input.settings;
  const dayStart = toMinOr(s.dayStart, 7 * 60 + 30);
  const herCurfew = toMinOr(s.herCurfew, 21 * 60 + 30);
  const myCurfew = toMinOr(s.myCurfew, 22 * 60 + 30);
  const dayEnd = Math.max(myCurfew + s.returnTravelMinutes, herCurfew + 60, 23 * 60);

  const known = (key: "me" | "her") =>
    input.dayClasses.some((c) => c.partnerKey === key) ||
    input.uploadsKnown?.(key) === true ||
    input.timeBlocks.some((b) => b.partnerKey === key);

  const days: DayAnalysis[] = [];

  for (let day = 1; day <= 7; day++) {
    const me = buildPartnerDay("me", day, s, input.dayClasses, input.timeBlocks, dayStart, dayEnd);
    const her = buildPartnerDay("her", day, s, input.dayClasses, input.timeBlocks, dayStart, dayEnd);

    const hasData = known("me") && known("her");
    const hisEnd = me.span?.end ?? null;
    const herEnd = her.span?.end ?? null;
    const hisStart = me.span?.start ?? null;
    const herStart = her.span?.start ?? null;

    const energyHis = energyFor(me.pairs, hisEnd);
    const energyHer = energyFor(her.pairs, herEnd);
    const energyAvg = Math.round((energyHis + energyHer) / 2);
    const totalPairs = me.pairs + her.pairs;
    const soloTired = me.pairs >= s.fatigueSoloPairs || her.pairs >= s.fatigueSoloPairs;
    const tired = totalPairs >= s.fatigueTotalPairs || soloTired;

    // ---- основная встреча вечером ----
    const dayOff = hisEnd === null && herEnd === null && hasData;
    const earliestStart = dayStart + s.travelMinutes;
    let hisArrival = (hisEnd ?? dayStart) + s.travelMinutes;
    let herArrival = herEnd ?? dayStart;
    let meetStart: number;
    if (dayOff) {
      // оба свободны: не встречаемся в 8 утра, старт не раньше 11:00
      meetStart = Math.max(earliestStart, 11 * 60);
      hisArrival = meetStart;
      herArrival = meetStart;
    } else if (herEnd === null) {
      // у неё нет пар — она выйдет к твоему приезду, ждать не придётся
      meetStart = Math.max(hisArrival, earliestStart);
      hisArrival = meetStart;
      herArrival = meetStart;
    } else if (hisEnd === null) {
      // у тебя нет пар — ты выезжаешь так, чтобы подъехать ровно к её концу
      meetStart = Math.max(herArrival, earliestStart);
      hisArrival = meetStart;
    } else {
      meetStart = Math.max(hisArrival, herArrival);
    }
    const latestEnd = Math.min(myCurfew - s.returnTravelMinutes, herCurfew - s.herReturnMinutes);
    const rawDurationAll = latestEnd - meetStart;
    // в полностью свободный день не обещаем 13 часов подряд
    const rawDuration = dayOff ? Math.min(rawDurationAll, 300) : rawDurationAll;

    const gapMinutes = hisEnd !== null && herEnd !== null ? Math.abs(hisEnd - herEnd) : 0;
    const gapPairs = gapMinutes > 0 ? Math.max(1, Math.round(gapMinutes / s.pairMinutes)) : 0;

    let waitMinutes = 0;
    let whoWaits: MeetingPlan["whoWaits"] = "nobody";
    if (hisArrival < herArrival) {
      waitMinutes = herArrival - hisArrival;
      whoWaits = "me";
    } else if (herArrival < hisArrival) {
      waitMinutes = hisArrival - herArrival;
      whoWaits = "her";
    }

    const reasons: string[] = [];
    let status: DayStatus = "great";
    let headline = "";
    let meeting: MeetingPlan | null = null;

    const needsHomework = Math.max(me.pairs, her.pairs) >= 3 ? s.homeworkMinutes : 0;
    const fatigueCut = tired ? 30 : 0;

    if (!hasData) {
      status = "empty";
      headline = "Данных нет";
      reasons.push("Кицунэ не видит расписание: загрузите по два скрина на каждого.");
    } else if (rawDuration <= 0) {
      status = "none";
      headline = "Встреча не складывается";
      reasons.push(
        `Пары + дорога съедают вечер: свободное окно начинается в ${fmt(meetStart)}, а разъехаться нужно к ${fmt(latestEnd)}.`,
      );
      if (hisEnd) reasons.push(`Твои пары заканчиваются в ${fmt(hisEnd)}, в пути ещё ${s.travelMinutes} мин.`);
      if (herEnd) reasons.push(`У неё пары до ${fmt(herEnd)}, а дома нужно быть к ${fmt(herCurfew)}.`);
    } else if (gapPairs > s.maxGapPairs) {
      status = "none";
      headline = `Разрыв в ${gapPairs} ${pairsWord(gapPairs)} — слишком тяжело`;
      reasons.push(
        `${whoWaits === "me" ? "Ты" : "Она"} ждёшь ${dur(waitMinutes)} после пар — это больше допустимого разрыва (${s.maxGapPairs} ${pairsWord(s.maxGapPairs)}).`,
      );
      reasons.push(
        whoWaits === "me"
          ? "Проще созвониться и лечь спать вовремя, чем сидеть у техникума полтора часа."
          : "Ей не стоит ждать тебя одной вечером — перенеси встречу на более ровный день.",
      );
    } else {
      // усталость и домашка урезают встречу, но не больше чем на 40% окна;
      // и не обещаем больше пяти часов подряд — иначе это уже не свидание, а марафон
      const cut = Math.min(needsHomework + fatigueCut, Math.floor(rawDuration * 0.4));
      const recommended = clamp(rawDuration - cut, 0, 300);
      meeting = {
        start: meetStart,
        end: Math.min(latestEnd, meetStart + Math.max(rawDuration, 0)),
        duration: rawDuration,
        recommended,
        place: s.meetPlace,
        hisArrival,
        herArrival,
        waitMinutes,
        whoWaits,
        hisHomeBy: meetStart + rawDuration + s.returnTravelMinutes,
        herHomeBy: meetStart + rawDuration + s.herReturnMinutes,
      };

      if (waitMinutes > s.maxWaitMinutes) {
        status = "risky";
        headline = `Встреча под вопросом: ждать ${dur(waitMinutes)}`;
        reasons.push(
          `${whoWaits === "me" ? "Тебе" : "Ей"} придётся ждать ${dur(waitMinutes)} (лимит ${s.maxWaitMinutes} мин).`,
        );
        if (whoWaits === "me")
          reasons.push("Потрать ожидание на домашку или кофе — тогда время не сгорит зря.");
        else reasons.push("Девушке ждать вечером у техникума некомфортно и небезопасно.");
      }

      if (rawDuration < s.minMeetingMinutes) {
        status = "risky";
        headline = `Окно всего ${dur(rawDuration)}`;
        reasons.push(
          `Минимально комфортная встреча — ${s.minMeetingMinutes} мин, а получается ${dur(rawDuration)}.`,
        );
        reasons.push("Либо сдвинь место встречи ближе к себе, либо замени на созвон.");
      } else if (status !== "risky") {
        // в заголовке — честное рекомендованное время, а не «окно до комендантского часа»
        if (recommended >= 170) {
          status = "great";
          headline = `Целых ${dur(recommended)} вдвоём`;
        } else if (recommended >= 105) {
          status = "good";
          headline = `${dur(recommended)} на встречу`;
        } else {
          status = "ok";
          headline = `${dur(Math.max(recommended, 15))} — коротко, но реально`;
        }
        reasons.push(
          `Ты освобождаешься ${hisEnd ? `в ${fmt(hisEnd)}` : "— пар нет"}, у неё — ${herEnd ? `в ${fmt(herEnd)}` : "пар нет"}.`,
        );
        reasons.push(
          `Дорога ${s.travelMinutes} мин → встреча с ${fmt(meetStart)} до ${fmt(meeting.end)}.`,
        );
        if (waitMinutes > 0 && waitMinutes <= s.maxWaitMinutes)
          reasons.push(
            `${whoWaits === "me" ? "Ты подъезжаешь" : "Она приходит"} раньше на ${dur(waitMinutes)} — это в пределах нормы.`,
          );
      }

      if (dayOff && meeting) {
        reasons.push(
          "Пар нет ни у кого: день свободен целиком, поэтому старт взяли на 11:00 и ограничились пятью часами вместе.",
        );
      }
      if (tired && meeting) {
        reasons.push(
          `Суммарно ${totalPairs} ${pairsWord(totalPairs)} за день: усталость высокая, лучше закончить на 30 мин раньше.`,
        );
      }
      if (needsHomework > 0 && meeting) {
        reasons.push(
          `Заложи ${needsHomework} мин на домашку — иначе встреча съест сон.`,
        );
      }
      if (meeting && meeting.start >= 20 * 60) {
        reasons.push("Начало после 20:00 — вечер короткий, выбирай спокойный формат.");
      }
    }

    // ---- утреннее окно ----
    let morning: CallWindow | null = null;
    if (hisStart !== null && herStart !== null) {
      const mStart = dayStart + s.travelMinutes;
      const mEnd = Math.min(hisStart - s.travelMinutes, herStart);
      if (mEnd - mStart >= 45) {
        morning = {
          start: mStart,
          end: mEnd,
          duration: mEnd - mStart,
          label: "Утреннее окно до пар",
        };
        reasons.push(
          `Есть утреннее окно ${fmt(mStart)}–${fmt(mEnd)} (${dur(mEnd - mStart)}), если пары начинаются поздно.`,
        );
      }
    }

    // ---- общие окна для созвонов ----
    // созвон возможен только пока оба ещё не «дома по комендантскому часу»
    const callCurfew = Math.min(herCurfew, myCurfew);
    const commonFree = intersectLists(me.free, her.free)
      .map((i) => ({ start: Math.max(i.start, dayStart), end: Math.min(i.end, callCurfew) }))
      .filter((i) => i.end - i.start >= 20);
    const meetingBusy =
      meeting && meeting.duration > 0 ? [{ start: meeting.start, end: meeting.end }] : [];
    const callWindows: CallWindow[] = commonFree
      .flatMap((i) => subtract(i.start, i.end, meetingBusy))
      .filter((i) => i.end - i.start >= 20)
      .map((i) => ({
        start: i.start,
        end: i.end,
        duration: i.end - i.start,
        label:
          i.start < 12 * 60
            ? "Утренний созвон"
            : i.start >= 20 * 60
              ? "Поздний созвон перед сном"
              : "Дневной созвон",
      }));

    // ---- перемены: короткий звонок ----
    const breakCalls: BreakCall[] = [];
    const pushBreaks = (
      own: PartnerDay,
      otherDay: PartnerDay,
      owner: "me" | "her",
    ) => {
      for (const b of own.breaks) {
        const otherBusy = otherDay.busyNoBreaks.some((o) => overlaps(b, o) > 2);
        if (otherBusy) {
          breakCalls.push({
            start: b.start,
            end: b.end,
            owner,
            label: `Перемена ${fmt(b.start)}–${fmt(b.end)}`,
            note:
              owner === "me"
                ? "У неё в это время пара — лучше напиши сообщение, не звони."
                : "У тебя в это время пара — просто напиши ей.",
            tone: "bad",
          });
        } else {
          const otherBreak = otherDay.breaks.find((x) => overlaps(b, x) >= 5);
          breakCalls.push({
            start: b.start,
            end: b.end,
            owner,
            label: otherBreak
              ? `Общая перемена ${fmt(b.start)}–${fmt(b.end)}`
              : `Перемена ${fmt(b.start)}–${fmt(b.end)}`,
            note: otherBreak
              ? "Вы оба на перемене — идеальный момент для быстрого звонка."
              : "Второй свободен: можно набрать на 5–10 минут.",
            tone: "good",
          });
        }
      }
    };
    pushBreaks(me, her, "me");
    pushBreaks(her, me, "her");
    breakCalls.sort((a, b) => a.start - b.start);

    // ---- бюджет времени ----
    const budget: BudgetRow[] = [];
    if (meeting) {
      budget.push({
        label: "Дорога до неё",
        minutes: s.travelMinutes,
        hint: "Плейлист или пара сообщений, пока едешь",
        tone: "violet",
      });
      if (meeting.waitMinutes > 0)
        budget.push({
          label: `Ожидание (${meeting.whoWaits === "me" ? "ты" : "она"})`,
          minutes: meeting.waitMinutes,
          hint:
            meeting.whoWaits === "me"
              ? "Кофе + домашка: время окупится"
              : "Подожди в тёплом месте, не на улице",
          tone: "grey",
        });
      budget.push({
        label: "Сама встреча",
        minutes: meeting.recommended > 0 ? meeting.recommended : meeting.duration,
        hint: "Основное время друг для друга",
        tone: "pink",
      });
      budget.push({
        label: "Дорога домой",
        minutes: s.returnTravelMinutes,
        hint: `Дома к ${fmt(meeting.hisHomeBy)}`,
        tone: "violet",
      });
      if (needsHomework > 0)
        budget.push({
          label: "Запас на учёбу",
          minutes: needsHomework,
          hint: "Чтобы встреча не стоила тебе сна",
          tone: "gold",
        });
      const rest = Math.max(
        0,
        Math.min(myCurfew, 24 * 60) - (meeting.end + s.returnTravelMinutes),
      );
      budget.push({
        label: "Личный остаток",
        minutes: rest,
        hint: rest >= 40 ? "Можно ещё поиграть/посмотреть серию" : "Почти ничего — ложись вовремя",
        tone: "grey",
      });
    } else if (hasData) {
      const totalFreeMe = me.free.reduce((a, b) => a + (b.end - b.start), 0);
      const totalFreeHer = her.free.reduce((a, b) => a + (b.end - b.start), 0);
      budget.push({
        label: "Твоё свободное время",
        minutes: totalFreeMe,
        hint: "Потрать на отдых и учёбу",
        tone: "violet",
      });
      budget.push({
        label: "Её свободное время",
        minutes: totalFreeHer,
        hint: "Не совпадает с твоим — вот почему встречи нет",
        tone: "pink",
      });
      const callMinutes = callWindows.reduce((a, b) => a + Math.min(b.duration, 90), 0);
      budget.push({
        label: "Время на созвон",
        minutes: callMinutes,
        hint: callMinutes > 0 ? "Вместо встречи — голос" : "Даже на звонок внахлёст",
        tone: "gold",
      });
    }

    const score = computeScore({
      status,
      meeting,
      waitMinutes,
      tired,
      soloTired,
      gapPairs,
      morning,
      callWindows,
    });

    days.push({
      day,
      name: DAY_NAMES[day - 1],
      short: DAY_SHORT[day - 1],
      kanji: DAY_KANJI[day - 1],
      status,
      score,
      headline,
      summary: buildSummary(status, meeting, me.pairs, her.pairs, callWindows, tired),
      reasons,
      facts: [
        { label: "Пары у тебя", value: me.pairs ? `${me.pairs} ${pairsWord(me.pairs)}` : "—" },
        { label: "Пары у неё", value: her.pairs ? `${her.pairs} ${pairsWord(her.pairs)}` : "—" },
        {
          label: "Ты свободен с",
          value: hisEnd ? fmt(hisEnd) : me.pairs === 0 && hasData ? "весь день" : "—",
        },
        {
          label: "Она свободна с",
          value: herEnd ? fmt(herEnd) : her.pairs === 0 && hasData ? "весь день" : "—",
        },
        { label: "Разрыв", value: gapPairs ? `${gapPairs} ${pairsWord(gapPairs)}` : "синхронно" },
        { label: "Энергия", value: `${energyAvg}% · ${energyLabel(energyAvg)}` },
      ],
      meeting,
      morning,
      callWindows,
      breakCalls,
      budget,
      ideas: pickIdeas(
        meeting ? (meeting.recommended || meeting.duration) : 30,
        tired,
        meeting ? meeting.start >= 19 * 60 + 30 : true,
        day,
      ),
      energy: { his: energyHis, her: energyHer, label: energyLabel(energyAvg), tired },
      hisSegments: buildSegments(me, meeting, s, "me"),
      herSegments: buildSegments(her, meeting, s, "her"),
      hisFree: me.free,
      herFree: her.free,
      hisPairs: me.pairs,
      herPairs: her.pairs,
      hasData,
      kitsune: pick(KITSUNE[status], day * 7 + me.pairs * 3 + her.pairs),
    });
  }

  const totals = computeTotals(days);
  const verdict = buildVerdict(days, totals, input.partners);
  return { days, totals, verdict, rangeFrom: dayStart - 30, rangeTo: dayEnd };
}

function buildSegments(
  p: PartnerDay,
  meeting: MeetingPlan | null,
  s: SettingsInfo,
  who: "me" | "her",
): Segment[] {
  const segs: Segment[] = [];
  if (p.span) segs.push({ start: p.span.start, end: p.span.end, kind: "class", label: "пары" });
  for (const b of p.breaks)
    segs.push({ start: b.start, end: b.end, kind: "break", label: b.label ?? "перемена" });
  for (const c of p.calls)
    segs.push({ start: c.start, end: c.end, kind: "call", label: c.label ?? "звонок" });
  for (const o of p.other)
    segs.push({ start: o.start, end: o.end, kind: "other", label: o.label ?? "свои дела" });
  if (meeting) {
    const travelBack = who === "me" ? s.returnTravelMinutes : s.herReturnMinutes;
    if (who === "me") {
      const ready = meeting.hisArrival - s.travelMinutes;
      segs.push({
        start: ready,
        end: meeting.hisArrival,
        kind: "travel",
        label: `дорога ${s.travelMinutes} мин`,
      });
      if (meeting.waitMinutes > 0 && meeting.whoWaits === "me")
        segs.push({
          start: meeting.hisArrival,
          end: meeting.start,
          kind: "waiting",
          label: "ожидание",
        });
    } else if (meeting.waitMinutes > 0 && meeting.whoWaits === "her") {
      segs.push({
        start: meeting.herArrival,
        end: meeting.start,
        kind: "waiting",
        label: "ожидание",
      });
    }
    segs.push({ start: meeting.start, end: meeting.end, kind: "meeting", label: "встреча" });
    segs.push({
      start: meeting.end,
      end: meeting.end + travelBack,
      kind: "travel",
      label: "домой",
    });
  }
  return segs.sort((a, b) => a.start - b.start);
}

function computeScore(args: {
  status: DayStatus;
  meeting: MeetingPlan | null;
  waitMinutes: number;
  tired: boolean;
  soloTired: boolean;
  gapPairs: number;
  morning: CallWindow | null;
  callWindows: CallWindow[];
}): number {
  const { status, meeting, waitMinutes, tired, soloTired, gapPairs, morning, callWindows } = args;
  if (status === "empty") return 0;
  let score = 0;
  if (meeting) {
    score += (Math.min(meeting.duration, 210) / 210) * 72;
    score -= (Math.min(waitMinutes, 120) / 120) * 18;
    if (meeting.whoWaits === "her") score -= 6;
  }
  if (gapPairs === 0 && meeting) score += 6;
  if (tired) score -= 10;
  if (soloTired) score -= 4;
  if (morning) score += 4;
  if (callWindows.length > 0) score += 5;
  if (status === "none") score = Math.min(score, 18);
  if (status === "risky") score = clamp(score, 15, 52);
  if (status === "ok") score = clamp(score, 24, 62);
  if (status === "good") score = clamp(score, 45, 84);
  if (status === "great") score = clamp(score, 62, 100);
  return Math.round(clamp(score, 0, 100));
}

function buildSummary(
  status: DayStatus,
  meeting: MeetingPlan | null,
  hisPairs: number,
  herPairs: number,
  calls: CallWindow[],
  tired: boolean,
): string {
  const callMinutes = calls.reduce((a, b) => a + Math.min(b.duration, 90), 0);
  if (status === "empty") return "Загрузи скриншоты — и день посчитается автоматически.";
  if (meeting && meeting.duration > 0) {
    const shown = meeting.recommended > 0 ? meeting.recommended : meeting.duration;
    const base = `Встреча ${fmt(meeting.start)}–${fmt(meeting.end)} (${dur(shown)}), ${
      meeting.waitMinutes > 0
        ? `${meeting.whoWaits === "me" ? "ты ждёшь" : "она ждёт"} ${dur(meeting.waitMinutes)}`
        : "без ожидания"
    }.`;
    return `${base} Пар: ${hisPairs} у тебя, ${herPairs} у неё.${tired ? " День тяжёлый — формат спокойный." : ""}${
      callMinutes > 0 ? ` Ещё ${dur(callMinutes)} на созвон.` : ""
    }`;
  }
  return `Личная встреча не складывается (пар: ${hisPairs} / ${herPairs}).${
    callMinutes > 0 ? ` Но есть ${dur(callMinutes)} на созвон.` : " Созвон тоже внахлёст — напиши ей."
  }`;
}

function computeTotals(days: DayAnalysis[]): WeekTotals {
  const ok = days.filter((d) => d.meeting && d.meeting.duration >= 20 && d.status !== "none");
  const meetingMinutes = ok.reduce(
    (a, d) => a + (d.meeting!.recommended > 0 ? d.meeting!.recommended : d.meeting!.duration),
    0,
  );
  // считаем по реальному разговору: не больше 90 минут с окна
  const callMinutes = days.reduce(
    (a, d) => a + d.callWindows.reduce((x, y) => x + Math.min(y.duration, 90), 0),
    0,
  );
  const pairsTotal = days.reduce((a, d) => a + d.hisPairs + d.herPairs, 0);
  let bestDay: number | null = null;
  let hardestDay: number | null = null;
  let bestScore = -1;
  let hardestPairs = -1;
  for (const d of days) {
    if (d.status !== "empty" && d.score > bestScore) {
      bestScore = d.score;
      bestDay = d.day;
    }
    const p = d.hisPairs + d.herPairs;
    if (p > hardestPairs) {
      hardestPairs = p;
      hardestDay = p > 0 ? d.day : null;
    }
  }
  return {
    meetingMinutes,
    meetingDays: ok.length,
    callMinutes,
    pairsTotal,
    bestDay,
    hardestDay,
    hopelessDays: days.filter((d) => d.status === "none").length,
  };
}

function buildVerdict(days: DayAnalysis[], totals: WeekTotals, partners: PartnerInfo[]): {
  title: string;
  text: string;
  score: number;
  emoji: string;
} {
  const me = partners.find((p) => p.key === "me")?.name ?? "Я";
  const her = partners.find((p) => p.key === "her")?.name ?? "Она";
  const scored = days.filter((d) => d.status !== "empty");
  const avg = scored.length
    ? Math.round(scored.reduce((a, d) => a + d.score, 0) / scored.length)
    : 0;

  if (scored.length === 0)
    return {
      title: "Кицунэ ждёт скриншоты",
      text: `Загрузите по два изображения — пары и звонки/перемены — для ${me} и ${her}. После этого появится подробный разбор недели.`,
      score: 0,
      emoji: "🦊",
    };

  if (totals.meetingDays === 0)
    return {
      title: "На этой неделе личные встречи не складываются",
      text: `Расписания почти не пересекаются: суммарно ${totals.pairsTotal} ${pairsWord(totals.pairsTotal)} и ${dur(totals.callMinutes)} на созвоны. Кицунэ советует выбрать один день и сдвинуть встречу ближе к кому-то из вас.`,
      score: avg,
      emoji: "🌧️",
    };

  const best = days.find((d) => d.day === totals.bestDay);
  return {
    title: `${dur(totals.meetingMinutes)} вдвоём за неделю`,
    text: `Лучший день — ${best ? best.name.toLowerCase() : "не определён"} (${
      best ? best.headline.toLowerCase() : ""
    }). Встреч: ${totals.meetingDays} ${plural(totals.meetingDays, "день", "дня", "дней")}, ещё ${dur(
      totals.callMinutes,
    )} на звонки. Самая тяжёлая нагрузка — ${
      days.find((d) => d.day === totals.hardestDay)?.name.toLowerCase() ?? "—"
    }.`,
    score: avg,
    emoji: avg >= 65 ? "🌸" : avg >= 40 ? "🏮" : "🦊",
  };
}
