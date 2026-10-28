import type {
  BlockInfo,
  BootstrapData,
  DayClassInfo,
  PartnerInfo,
  SettingsInfo,
} from "./types";

export const DEFAULT_SETTINGS: SettingsInfo = {
  weekLabel: null,
  travelMinutes: 30,
  returnTravelMinutes: 35,
  herReturnMinutes: 15,
  pairMinutes: 80,
  breakMinutes: 10,
  maxWaitMinutes: 50,
  maxGapPairs: 1,
  fatigueSoloPairs: 4,
  fatigueTotalPairs: 6,
  homeworkMinutes: 40,
  dayStart: "07:30",
  herCurfew: "21:30",
  myCurfew: "22:30",
  minMeetingMinutes: 45,
  meetPlace: "у её техникума",
};

export const DEFAULT_PARTNERS: PartnerInfo[] = [
  { key: "me", name: "Я", title: "мои пары и звонки", color: "#7c6bd6" },
  { key: "her", name: "Она", title: "её пары и звонки", color: "#e88bab" },
];

export const DEFAULT_DAY_CLASSES: DayClassInfo[] = [];
export const DEFAULT_BLOCKS: BlockInfo[] = [];

/**
 * Пример недели, который показывается при первом запуске, чтобы сайт сразу
 * что-то считал. Заменяется реальными данными, как только загружены скриншоты.
 */
export const DEMO_DAY_CLASSES: DayClassInfo[] = [
  { partnerKey: "me", day: 1, pairCount: 3, startTime: "08:30", endTime: "12:50", note: "пример" },
  { partnerKey: "me", day: 2, pairCount: 4, startTime: "08:30", endTime: "14:00", note: "пример" },
  { partnerKey: "me", day: 3, pairCount: 3, startTime: "08:30", endTime: "12:50", note: "пример" },
  { partnerKey: "me", day: 4, pairCount: 5, startTime: "12:10", endTime: "20:00", note: "пример" },
  { partnerKey: "me", day: 5, pairCount: 2, startTime: "08:30", endTime: "10:50", note: "пример" },
  { partnerKey: "me", day: 6, pairCount: 1, startTime: "08:30", endTime: "10:05", note: "пример" },
  { partnerKey: "her", day: 1, pairCount: 3, startTime: "11:00", endTime: "15:20", note: "пример" },
  { partnerKey: "her", day: 2, pairCount: 3, startTime: "09:25", endTime: "13:45", note: "пример" },
  { partnerKey: "her", day: 3, pairCount: 4, startTime: "08:30", endTime: "14:35", note: "пример" },
  { partnerKey: "her", day: 4, pairCount: 5, startTime: "12:10", endTime: "20:00", note: "пример" },
  { partnerKey: "her", day: 5, pairCount: 2, startTime: "08:30", endTime: "10:50", note: "пример" },
];

export const DEMO_BLOCKS: BlockInfo[] = [
  { partnerKey: "me", day: 1, kind: "break", startTime: "10:50", endTime: "11:00", label: "перемена" },
  { partnerKey: "her", day: 1, kind: "break", startTime: "12:10", endTime: "12:30", label: "перемена" },
  { partnerKey: "me", day: 2, kind: "break", startTime: "11:50", endTime: "12:10", label: "перемена" },
  { partnerKey: "her", day: 2, kind: "break", startTime: "11:50", endTime: "12:10", label: "перемена" },
  { partnerKey: "me", day: 2, kind: "other", startTime: "18:00", endTime: "19:20", label: "тренировка" },
  { partnerKey: "me", day: 1, kind: "call", startTime: "21:00", endTime: "21:40", label: "вечерний созвон" },
  { partnerKey: "me", day: 3, kind: "call", startTime: "21:00", endTime: "21:40", label: "вечерний созвон" },
  { partnerKey: "me", day: 5, kind: "call", startTime: "20:30", endTime: "21:30", label: "вечерний созвон" },
  { partnerKey: "her", day: 1, kind: "call", startTime: "21:00", endTime: "21:40", label: "вечерний созвон" },
  { partnerKey: "her", day: 3, kind: "call", startTime: "21:00", endTime: "21:40", label: "вечерний созвон" },
  { partnerKey: "her", day: 5, kind: "call", startTime: "20:30", endTime: "21:30", label: "вечерний созвон" },
];

export const EMPTY_BOOTSTRAP: BootstrapData = {
  partners: DEFAULT_PARTNERS,
  settings: DEFAULT_SETTINGS,
  dayClasses: DEFAULT_DAY_CLASSES,
  timeBlocks: DEFAULT_BLOCKS,
  uploads: [],
  hasAnyData: false,
  demo: true,
};
