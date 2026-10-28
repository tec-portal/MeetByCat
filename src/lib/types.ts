export type PartnerKey = "me" | "her";
export type UploadKind = "classes" | "calls";
export type BlockKind = "break" | "call" | "other";

export interface PartnerInfo {
  key: PartnerKey;
  name: string;
  title: string | null;
  color: string;
}

export interface DayClassInfo {
  partnerKey: PartnerKey;
  day: number; // 1..7 (1 = понедельник)
  pairCount: number;
  startTime: string | null;
  endTime: string | null;
  note: string | null;
}

export interface BlockInfo {
  id?: number;
  partnerKey: PartnerKey;
  day: number;
  kind: BlockKind;
  startTime: string;
  endTime: string;
  label: string | null;
}

export interface SettingsInfo {
  weekLabel: string | null;
  travelMinutes: number;
  returnTravelMinutes: number;
  herReturnMinutes: number;
  pairMinutes: number;
  breakMinutes: number;
  maxWaitMinutes: number;
  maxGapPairs: number;
  fatigueSoloPairs: number;
  fatigueTotalPairs: number;
  homeworkMinutes: number;
  dayStart: string;
  herCurfew: string;
  myCurfew: string;
  minMeetingMinutes: number;
  meetPlace: string;
}

export interface UploadMeta {
  partnerKey: PartnerKey;
  kind: UploadKind;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  createdAt: string;
  ocrText: string | null;
}

export interface BootstrapData {
  partners: PartnerInfo[];
  settings: SettingsInfo;
  dayClasses: DayClassInfo[];
  timeBlocks: BlockInfo[];
  uploads: UploadMeta[];
  hasAnyData: boolean;
  /** сейчас в базе пример расписания, а не ваши данные */
  demo: boolean;
}

export interface PlanInfo {
  id: number;
  planDate: string;
  startTime: string;
  endTime: string;
  title: string;
  note: string | null;
  day: number | null;
  status: string;
}
