import { relations } from "drizzle-orm";
import {
  users,
  userPoints,
  gameRuns,
  leaderboard,
  pointTransactions,
  redemptions,
  dailyChallenges,
  userChallenges,
} from "./schema";

export const usersRelations = relations(users, ({ one }) => ({
  points: one(userPoints, {
    fields: [users.unionId],
    references: [userPoints.userId],
  }),
}));

export const userPointsRelations = relations(userPoints, ({ many }) => ({
  runs: many(gameRuns),
}));

export const gameRunsRelations = relations(gameRuns, ({ one }) => ({
  user: one(userPoints, {
    fields: [gameRuns.userId],
    references: [userPoints.userId],
  }),
}));

export const leaderboardRelations = relations(leaderboard, ({ one }) => ({
  user: one(users, {
    fields: [leaderboard.userId],
    references: [users.unionId],
  }),
}));

export const pointTransactionsRelations = relations(pointTransactions, ({ one }) => ({
  user: one(users, {
    fields: [pointTransactions.userId],
    references: [users.unionId],
  }),
}));

export const redemptionsRelations = relations(redemptions, ({ one }) => ({
  user: one(users, {
    fields: [redemptions.userId],
    references: [users.unionId],
  }),
}));

export const dailyChallengesRelations = relations(dailyChallenges, ({ many }) => ({
  completions: many(userChallenges),
}));

export const userChallengesRelations = relations(userChallenges, ({ one }) => ({
  challenge: one(dailyChallenges, {
    fields: [userChallenges.challengeId],
    references: [dailyChallenges.id],
  }),
}));
