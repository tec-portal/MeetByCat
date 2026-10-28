import {
  integer,
  pgTable,
  primaryKey,
  serial,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core";

/** Одна строка = одна пара (два человека, общее расписание). */
export const couples = pgTable(
  "couples",
  {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 80 }).notNull().default("Пара"),
    joinCode: varchar("join_code", { length: 24 }).notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [uniqueIndex("couples_join_code_idx").on(t.joinCode)],
);

export const users = pgTable(
  "users",
  {
    id: serial("id").primaryKey(),
    coupleId: integer("couple_id")
      .notNull()
      .references(() => couples.id, { onDelete: "cascade" }),
    login: varchar("login", { length: 40 }).notNull(),
    displayName: varchar("display_name", { length: 40 }).notNull(),
    passwordHash: text().notNull(),
    /** какая сторона расписания: "me" или "her" */
    role: varchar("role", { length: 8 }).notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("users_login_idx").on(t.login),
    uniqueIndex("users_couple_role_idx").on(t.coupleId, t.role),
  ],
);

export const sessions = pgTable("sessions", {
  token: varchar("token", { length: 64 }).primaryKey(),
  userId: integer("user_id").notNull(),
  coupleId: integer("couple_id").notNull(),
  userAgent: text(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

/** Партнёры внутри пары: "me" (я) и "her" (она). */
export const partners = pgTable(
  "partners",
  {
    coupleId: integer("couple_id")
      .notNull()
      .references(() => couples.id, { onDelete: "cascade" }),
    key: varchar("key", { length: 8 }).notNull(),
    name: varchar("name", { length: 64 }).notNull(),
    title: varchar("title", { length: 128 }),
    color: varchar("color", { length: 16 }).notNull().default("#e88bab"),
  },
  (t) => [primaryKey({ columns: [t.coupleId, t.key] })],
);

/**
 * Скриншоты расписаний пары. Хранятся в БД (base64) и НЕ сбрасываются:
 * пользователь сам заменяет их раз в неделю.
 * kind: "classes" — скрин пар, "calls" — скрин перерывов/звонков.
 */
export const uploads = pgTable(
  "uploads",
  {
    id: serial("id").primaryKey(),
    coupleId: integer("couple_id")
      .notNull()
      .references(() => couples.id, { onDelete: "cascade" }),
    partnerKey: varchar("partner_key", { length: 8 }).notNull(),
    kind: varchar("kind", { length: 16 }).notNull(),
    fileName: text().notNull(),
    mimeType: text().notNull().default("image/png"),
    data: text().notNull(),
    sizeBytes: integer().notNull().default(0),
    ocrText: text(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [uniqueIndex("uploads_couple_partner_kind_idx").on(t.coupleId, t.partnerKey, t.kind)],
);

/** Пары по дням недели (day: 1 = понедельник ... 7 = воскресенье). */
export const dayClasses = pgTable(
  "day_classes",
  {
    id: serial("id").primaryKey(),
    coupleId: integer("couple_id")
      .notNull()
      .references(() => couples.id, { onDelete: "cascade" }),
    partnerKey: varchar("partner_key", { length: 8 }).notNull(),
    day: integer("day").notNull(),
    pairCount: integer("pair_count").notNull().default(0),
    startTime: varchar("start_time", { length: 5 }),
    endTime: varchar("end_time", { length: 5 }),
    note: text(),
  },
  (t) => [uniqueIndex("day_classes_couple_partner_day_idx").on(t.coupleId, t.partnerKey, t.day)],
);

/** Перерывы, звонки и личные дела: kind = "break" | "call" | "other". */
export const timeBlocks = pgTable("time_blocks", {
  id: serial("id").primaryKey(),
  coupleId: integer("couple_id")
    .notNull()
    .references(() => couples.id, { onDelete: "cascade" }),
  partnerKey: varchar("partner_key", { length: 8 }).notNull(),
  day: integer("day").notNull(),
  kind: varchar("kind", { length: 12 }).notNull(),
  startTime: varchar("start_time", { length: 5 }).notNull(),
  endTime: varchar("end_time", { length: 5 }).notNull(),
  label: text(),
});

/** Настройки пары (первичный ключ = id пары). */
export const settings = pgTable("settings", {
  coupleId: integer("couple_id")
    .primaryKey()
    .references(() => couples.id, { onDelete: "cascade" }),
  weekLabel: varchar("week_label", { length: 128 }),
  travelMinutes: integer("travel_minutes").notNull().default(30),
  returnTravelMinutes: integer("return_travel_minutes").notNull().default(35),
  herReturnMinutes: integer("her_return_minutes").notNull().default(15),
  pairMinutes: integer("pair_minutes").notNull().default(80),
  breakMinutes: integer("break_minutes").notNull().default(10),
  maxWaitMinutes: integer("max_wait_minutes").notNull().default(50),
  maxGapPairs: integer("max_gap_pairs").notNull().default(1),
  fatigueSoloPairs: integer("fatigue_solo_pairs").notNull().default(4),
  fatigueTotalPairs: integer("fatigue_total_pairs").notNull().default(6),
  homeworkMinutes: integer("homework_minutes").notNull().default(40),
  dayStart: varchar("day_start", { length: 5 }).notNull().default("07:30"),
  herCurfew: varchar("her_curfew", { length: 5 }).notNull().default("21:30"),
  myCurfew: varchar("my_curfew", { length: 5 }).notNull().default("22:30"),
  minMeetingMinutes: integer("min_meeting_minutes").notNull().default(45),
  meetPlace: varchar("meet_place", { length: 128 }).notNull().default("у её техникума"),
});

/** Сохранённые планы свиданий. */
export const plans = pgTable("plans", {
  id: serial("id").primaryKey(),
  coupleId: integer("couple_id")
    .notNull()
    .references(() => couples.id, { onDelete: "cascade" }),
  planDate: varchar("plan_date", { length: 10 }).notNull(),
  startTime: varchar("start_time", { length: 5 }).notNull().default("18:00"),
  endTime: varchar("end_time", { length: 5 }).notNull().default("20:00"),
  title: varchar("title", { length: 160 }).notNull(),
  note: text(),
  day: integer("day"),
  status: varchar("status", { length: 16 }).notNull().default("planned"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type CoupleRow = typeof couples.$inferSelect;
export type UserRow = typeof users.$inferSelect;
export type PartnerRow = typeof partners.$inferSelect;
export type UploadRow = typeof uploads.$inferSelect;
export type DayClassRow = typeof dayClasses.$inferSelect;
export type TimeBlockRow = typeof timeBlocks.$inferSelect;
export type SettingsRow = typeof settings.$inferSelect;
export type PlanRow = typeof plans.$inferSelect;
