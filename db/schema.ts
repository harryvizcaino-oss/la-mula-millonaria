import {
  mysqlTable,
  mysqlEnum,
  serial,
  varchar,
  text,
  timestamp,
  bigint,
  int,
  boolean,
  decimal,
} from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: serial("id").primaryKey(),
  unionId: varchar("unionId", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 255 }),
  email: varchar("email", { length: 320 }),
  avatar: text("avatar"),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
  lastSignInAt: timestamp("lastSignInAt").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ─── Truck Surfers Game Tables ───────────────────────────────────────

// User points/millas balance
export const userPoints = mysqlTable("user_points", {
  id: bigint("id", { mode: "number" }).primaryKey().autoincrement(),
  userId: varchar("user_id", { length: 255 }).notNull().unique(),
  totalMillas: bigint("total_millas", { mode: "number" }).notNull().default(0),
  lifetimeMillas: bigint("lifetime_millas", { mode: "number" }).notNull().default(0),
  currentStreak: int("current_streak").notNull().default(0),
  longestStreak: int("longest_streak").notNull().default(0),
  lastPlayedAt: timestamp("last_played_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type UserPoints = typeof userPoints.$inferSelect;
export type InsertUserPoints = typeof userPoints.$inferInsert;

// Game scores / runs
export const gameRuns = mysqlTable("game_runs", {
  id: bigint("id", { mode: "number" }).primaryKey().autoincrement(),
  userId: varchar("user_id", { length: 255 }).notNull(),
  score: int("score").notNull(),
  distance: int("distance").notNull(), // in meters
  millasEarned: int("millas_earned").notNull(),
  duration: int("duration").notNull(), // in seconds
  maxSpeed: int("max_speed").notNull().default(0),
  trucksDodged: int("trucks_dodged").notNull().default(0),
  powerUpsUsed: int("power_ups_used").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export type GameRun = typeof gameRuns.$inferSelect;
export type InsertGameRun = typeof gameRuns.$inferInsert;

// Leaderboard entries
export const leaderboard = mysqlTable("leaderboard", {
  id: bigint("id", { mode: "number" }).primaryKey().autoincrement(),
  userId: varchar("user_id", { length: 255 }).notNull(),
  displayName: varchar("display_name", { length: 100 }).notNull(),
  avatarUrl: varchar("avatar_url", { length: 500 }),
  score: int("score").notNull(),
  distance: int("distance").notNull(),
  millasEarned: int("millas_earned").notNull(),
  weekKey: varchar("week_key", { length: 10 }).notNull(), // YYYY-WW format
  isGlobal: boolean("is_global").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export type LeaderboardEntry = typeof leaderboard.$inferSelect;
export type InsertLeaderboardEntry = typeof leaderboard.$inferInsert;

// Point transactions (audit log)
export const pointTransactions = mysqlTable("point_transactions", {
  id: bigint("id", { mode: "number" }).primaryKey().autoincrement(),
  userId: varchar("user_id", { length: 255 }).notNull(),
  type: mysqlEnum("type", ["earned_game", "earned_daily", "earned_streak", "earned_challenge", "redeemed_product", "redeemed_giftcard", "bonus"]).notNull(),
  amount: int("amount").notNull(), // positive for earned, negative for redeemed
  description: varchar("description", { length: 255 }).notNull(),
  referenceId: varchar("reference_id", { length: 255 }), // game run id, redemption id, etc.
  balanceAfter: bigint("balance_after", { mode: "number" }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export type PointTransaction = typeof pointTransactions.$inferSelect;
export type InsertPointTransaction = typeof pointTransactions.$inferInsert;

// Redemptions (VTEX gift cards)
export const redemptions = mysqlTable("redemptions", {
  id: bigint("id", { mode: "number" }).primaryKey().autoincrement(),
  userId: varchar("user_id", { length: 255 }).notNull(),
  productName: varchar("product_name", { length: 255 }).notNull(),
  productImage: varchar("product_image", { length: 500 }),
  millasCost: int("millas_cost").notNull(),
  giftCardCode: varchar("gift_card_code", { length: 255 }),
  giftCardValue: decimal("gift_card_value", { precision: 10, scale: 2 }),
  currency: varchar("currency", { length: 10 }).default("COP"),
  status: mysqlEnum("status", ["pending", "processing", "completed", "failed", "cancelled"]).notNull().default("pending"),
  vtexOrderId: varchar("vtex_order_id", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type Redemption = typeof redemptions.$inferSelect;
export type InsertRedemption = typeof redemptions.$inferInsert;

// Daily challenges
export const dailyChallenges = mysqlTable("daily_challenges", {
  id: bigint("id", { mode: "number" }).primaryKey().autoincrement(),
  title: varchar("title", { length: 255 }).notNull(),
  description: varchar("description", { length: 500 }).notNull(),
  type: mysqlEnum("type", ["distance", "score", "trucks", "powerups", "streak"]).notNull(),
  target: int("target").notNull(),
  rewardMillas: int("reward_millas").notNull(),
  dateKey: varchar("date_key", { length: 10 }).notNull(), // YYYY-MM-DD
  createdAt: timestamp("created_at").defaultNow(),
});

export type DailyChallenge = typeof dailyChallenges.$inferSelect;
export type InsertDailyChallenge = typeof dailyChallenges.$inferInsert;

// User challenge completions
export const userChallenges = mysqlTable("user_challenges", {
  id: bigint("id", { mode: "number" }).primaryKey().autoincrement(),
  userId: varchar("user_id", { length: 255 }).notNull(),
  challengeId: bigint("challenge_id", { mode: "number" }).notNull(),
  progress: int("progress").notNull().default(0),
  completed: boolean("completed").notNull().default(false),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export type UserChallenge = typeof userChallenges.$inferSelect;
export type InsertUserChallenge = typeof userChallenges.$inferInsert;
