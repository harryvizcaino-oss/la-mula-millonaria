import { z } from "zod";
import { eq, and, desc, sql } from "drizzle-orm";
import { createRouter, publicQuery, authedQuery } from "../../middleware";
import { getDb } from "../../queries/connection";
import {
  userPoints,
  gameRuns,
  leaderboard,
  pointTransactions,
  redemptions,
  dailyChallenges,
  userChallenges,
} from "@db/schema";

// ─── Helpers ─────────────────────────────────────────────────────────

function getWeekKey(d: Date = new Date()): string {
  const year = d.getFullYear();
  const start = new Date(year, 0, 1);
  const days = Math.floor((d.getTime() - start.getTime()) / 86_400_000);
  const week = Math.ceil((days + start.getDay() + 1) / 7);
  return `${year}-W${String(week).padStart(2, "0")}`;
}

function getDateKey(d: Date = new Date()): string {
  return d.toISOString().slice(0, 10);
}

// ─── Game sub-router ─────────────────────────────────────────────────

const gameCoreRouter = createRouter({
  // Submit a game run, update points, add to leaderboard
  submitRun: authedQuery
    .input(
      z.object({
        score: z.number().int().min(0),
        distance: z.number().int().min(0),
        millasEarned: z.number().int().min(0),
        duration: z.number().int().min(0),
        maxSpeed: z.number().int().min(0).default(0),
        trucksDodged: z.number().int().min(0).default(0),
        powerUpsUsed: z.number().int().min(0).default(0),
        displayName: z.string().max(100).optional(),
        avatarUrl: z.string().max(500).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const userId = ctx.user.unionId;
      const now = new Date();

      // 1. Insert game run
      const [run] = await db.insert(gameRuns).values({
        userId,
        score: input.score,
        distance: input.distance,
        millasEarned: input.millasEarned,
        duration: input.duration,
        maxSpeed: input.maxSpeed,
        trucksDodged: input.trucksDodged,
        powerUpsUsed: input.powerUpsUsed,
      });
      const runId = Number(run.insertId);

      // 2. Upsert user points — handle streaks
      const existing = await db
        .select()
        .from(userPoints)
        .where(eq(userPoints.userId, userId))
        .limit(1);

      let pointsRow = existing[0];

      if (pointsRow) {
        // Calculate streak
        let newStreak = 1;
        if (pointsRow.lastPlayedAt) {
          const lastDate = new Date(pointsRow.lastPlayedAt);
          const lastDateKey = getDateKey(lastDate);
          const todayKey = getDateKey(now);
          const yesterday = new Date(now);
          yesterday.setDate(yesterday.getDate() - 1);
          const yesterdayKey = getDateKey(yesterday);

          if (lastDateKey === todayKey) {
            newStreak = pointsRow.currentStreak; // Already played today
          } else if (lastDateKey === yesterdayKey) {
            newStreak = pointsRow.currentStreak + 1; // Continuing streak
          } else {
            newStreak = 1; // Streak broken
          }
        }

        const newTotal = pointsRow.totalMillas + input.millasEarned;
        const newLifetime = pointsRow.lifetimeMillas + input.millasEarned;
        const newLongest = Math.max(pointsRow.longestStreak, newStreak);

        await db
          .update(userPoints)
          .set({
            totalMillas: newTotal,
            lifetimeMillas: newLifetime,
            currentStreak: newStreak,
            longestStreak: newLongest,
            lastPlayedAt: now,
            updatedAt: now,
          })
          .where(eq(userPoints.userId, userId));

        // Refresh row
        const [updated] = await db
          .select()
          .from(userPoints)
          .where(eq(userPoints.userId, userId))
          .limit(1);
        pointsRow = updated;
      } else {
        // First time player
        await db.insert(userPoints).values({
          userId,
          totalMillas: input.millasEarned,
          lifetimeMillas: input.millasEarned,
          currentStreak: 1,
          longestStreak: 1,
          lastPlayedAt: now,
        });

        const [created] = await db
          .select()
          .from(userPoints)
          .where(eq(userPoints.userId, userId))
          .limit(1);
        pointsRow = created;
      }

      // 3. Log point transaction
      await db.insert(pointTransactions).values({
        userId,
        type: "earned_game",
        amount: input.millasEarned,
        description: `Earned ${input.millasEarned} millas from game run`,
        referenceId: String(runId),
        balanceAfter: pointsRow.totalMillas,
      });

      // 4. Upsert leaderboard (best score this week)
      const weekKey = getWeekKey(now);
      const existingEntry = await db
        .select()
        .from(leaderboard)
        .where(
          and(
            eq(leaderboard.userId, userId),
            eq(leaderboard.weekKey, weekKey),
            eq(leaderboard.isGlobal, true),
          ),
        )
        .limit(1);

      if (existingEntry[0]) {
        // Update only if new score is better
        if (input.score > existingEntry[0].score) {
          await db
            .update(leaderboard)
            .set({
              score: input.score,
              distance: input.distance,
              millasEarned: input.millasEarned,
              displayName: input.displayName ?? ctx.user.name ?? "Player",
              avatarUrl: input.avatarUrl ?? ctx.user.avatar ?? null,
            })
            .where(eq(leaderboard.id, existingEntry[0].id));
        }
      } else {
        await db.insert(leaderboard).values({
          userId,
          displayName: input.displayName ?? ctx.user.name ?? "Player",
          avatarUrl: input.avatarUrl ?? ctx.user.avatar ?? null,
          score: input.score,
          distance: input.distance,
          millasEarned: input.millasEarned,
          weekKey,
          isGlobal: true,
        });
      }

      return {
        runId,
        totalMillas: pointsRow.totalMillas,
        currentStreak: pointsRow.currentStreak,
        longestStreak: pointsRow.longestStreak,
      };
    }),

  // Get weekly/global leaderboard
  getLeaderboard: publicQuery
    .input(
      z
        .object({
          weekKey: z.string().max(10).optional(),
          limit: z.number().int().min(1).max(100).default(50),
          offset: z.number().int().min(0).default(0),
        })
        .optional(),
    )
    .query(async ({ input }) => {
      const weekKey = input?.weekKey ?? getWeekKey();
      const limit = input?.limit ?? 50;
      const offset = input?.offset ?? 0;

      const entries = await getDb()
        .select()
        .from(leaderboard)
        .where(
          and(eq(leaderboard.weekKey, weekKey), eq(leaderboard.isGlobal, true)),
        )
        .orderBy(desc(leaderboard.score))
        .limit(limit)
        .offset(offset);

      const countResult = await getDb()
        .select({ count: sql<number>`count(*)` })
        .from(leaderboard)
        .where(
          and(eq(leaderboard.weekKey, weekKey), eq(leaderboard.isGlobal, true)),
        );

      return {
        weekKey,
        entries,
        total: countResult[0]?.count ?? 0,
      };
    }),

  // Get user's stats
  getUserStats: authedQuery.query(async ({ ctx }) => {
    const userId = ctx.user.unionId;
    const db = getDb();

    const points = await db
      .select()
      .from(userPoints)
      .where(eq(userPoints.userId, userId))
      .limit(1);

    const stats = await db
      .select({
        bestScore: sql<number>`COALESCE(MAX(${gameRuns.score}), 0)`,
        totalDistance: sql<number>`COALESCE(SUM(${gameRuns.distance}), 0)`,
        totalRuns: sql<number>`COALESCE(COUNT(*), 0)`,
        totalTrucksDodged: sql<number>`COALESCE(SUM(${gameRuns.trucksDodged}), 0)`,
        totalPowerUps: sql<number>`COALESCE(SUM(${gameRuns.powerUpsUsed}), 0)`,
        bestDistance: sql<number>`COALESCE(MAX(${gameRuns.distance}), 0)`,
        totalDuration: sql<number>`COALESCE(SUM(${gameRuns.duration}), 0)`,
      })
      .from(gameRuns)
      .where(eq(gameRuns.userId, userId));

    return {
      points: points[0] ?? null,
      stats: stats[0] ?? {
        bestScore: 0,
        totalDistance: 0,
        totalRuns: 0,
        totalTrucksDodged: 0,
        totalPowerUps: 0,
        bestDistance: 0,
        totalDuration: 0,
      },
    };
  }),

  // Get user's recent game runs
  getRecentRuns: authedQuery
    .input(
      z
        .object({
          limit: z.number().int().min(1).max(100).default(20),
          offset: z.number().int().min(0).default(0),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      const userId = ctx.user.unionId;
      const limit = input?.limit ?? 20;
      const offset = input?.offset ?? 0;

      const runs = await getDb()
        .select()
        .from(gameRuns)
        .where(eq(gameRuns.userId, userId))
        .orderBy(desc(gameRuns.createdAt))
        .limit(limit)
        .offset(offset);

      return { runs };
    }),
});

// ─── Points sub-router ───────────────────────────────────────────────

const pointsRouter = createRouter({
  // Get user's current millas balance
  getBalance: authedQuery.query(async ({ ctx }) => {
    const userId = ctx.user.unionId;
    const rows = await getDb()
      .select()
      .from(userPoints)
      .where(eq(userPoints.userId, userId))
      .limit(1);

    return {
      balance: rows[0]?.totalMillas ?? 0,
      lifetime: rows[0]?.lifetimeMillas ?? 0,
      currentStreak: rows[0]?.currentStreak ?? 0,
      longestStreak: rows[0]?.longestStreak ?? 0,
      lastPlayedAt: rows[0]?.lastPlayedAt ?? null,
    };
  }),

  // Sync local millas balance to backend
  syncBalance: authedQuery
    .input(z.object({ totalMillas: z.number().int().min(0) }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user.unionId;
      const db = getDb();
      const now = new Date();

      const existing = await db
        .select()
        .from(userPoints)
        .where(eq(userPoints.userId, userId))
        .limit(1);

      let pointsRow = existing[0];
      const diff = input.totalMillas - (pointsRow?.totalMillas ?? 0);

      if (pointsRow) {
        await db
          .update(userPoints)
          .set({
            totalMillas: input.totalMillas,
            lifetimeMillas: Math.max(pointsRow.lifetimeMillas, pointsRow.lifetimeMillas + Math.max(0, diff)),
            updatedAt: now,
          })
          .where(eq(userPoints.userId, userId));
      } else {
        await db.insert(userPoints).values({
          userId,
          totalMillas: input.totalMillas,
          lifetimeMillas: input.totalMillas,
          currentStreak: 1,
          longestStreak: 1,
          lastPlayedAt: now,
        });
      }

      if (diff !== 0) {
        await db.insert(pointTransactions).values({
          userId,
          type: diff > 0 ? "earned_game" : "redeemed_product",
          amount: diff,
          description: `Sync ${diff > 0 ? "earned" : "spent"} ${Math.abs(diff)} millas from game`,
          balanceAfter: input.totalMillas,
        });
      }

      const [updated] = await db
        .select()
        .from(userPoints)
        .where(eq(userPoints.userId, userId))
        .limit(1);

      return {
        balance: updated?.totalMillas ?? input.totalMillas,
        lifetime: updated?.lifetimeMillas ?? input.totalMillas,
      };
    }),

  // Get transaction history with pagination
  getTransactions: authedQuery
    .input(
      z
        .object({
          limit: z.number().int().min(1).max(100).default(20),
          offset: z.number().int().min(0).default(0),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      const userId = ctx.user.unionId;
      const limit = input?.limit ?? 20;
      const offset = input?.offset ?? 0;

      const transactions = await getDb()
        .select()
        .from(pointTransactions)
        .where(eq(pointTransactions.userId, userId))
        .orderBy(desc(pointTransactions.createdAt))
        .limit(limit)
        .offset(offset);

      const countResult = await getDb()
        .select({ count: sql<number>`count(*)` })
        .from(pointTransactions)
        .where(eq(pointTransactions.userId, userId));

      return {
        transactions,
        total: countResult[0]?.count ?? 0,
      };
    }),

  // Create a redemption request (deducts points, creates gift card placeholder)
  redeemProduct: authedQuery
    .input(
      z.object({
        productName: z.string().min(1).max(255),
        productImage: z.string().max(500).optional(),
        millasCost: z.number().int().positive(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user.unionId;
      const db = getDb();
      const now = new Date();

      // Check balance
      const points = await db
        .select()
        .from(userPoints)
        .where(eq(userPoints.userId, userId))
        .limit(1);

      if (!points[0] || points[0].totalMillas < input.millasCost) {
        throw new Error("Insufficient millas balance");
      }

      const newBalance = points[0].totalMillas - input.millasCost;

      // Deduct points
      await db
        .update(userPoints)
        .set({
          totalMillas: newBalance,
          updatedAt: now,
        })
        .where(eq(userPoints.userId, userId));

      // Create redemption record
      const [redemption] = await db.insert(redemptions).values({
        userId,
        productName: input.productName,
        productImage: input.productImage ?? null,
        millasCost: input.millasCost,
        status: "pending",
      });

      // Log transaction
      await db.insert(pointTransactions).values({
        userId,
        type: "redeemed_product",
        amount: -input.millasCost,
        description: `Redeemed "${input.productName}" for ${input.millasCost} millas`,
        referenceId: String(redemption.insertId),
        balanceAfter: newBalance,
      });

      return {
        redemptionId: Number(redemption.insertId),
        newBalance,
        status: "pending" as const,
      };
    }),

  // Get user's redemption history
  getRedemptions: authedQuery
    .input(
      z
        .object({
          limit: z.number().int().min(1).max(100).default(20),
          offset: z.number().int().min(0).default(0),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      const userId = ctx.user.unionId;
      const limit = input?.limit ?? 20;
      const offset = input?.offset ?? 0;

      const items = await getDb()
        .select()
        .from(redemptions)
        .where(eq(redemptions.userId, userId))
        .orderBy(desc(redemptions.createdAt))
        .limit(limit)
        .offset(offset);

      const countResult = await getDb()
        .select({ count: sql<number>`count(*)` })
        .from(redemptions)
        .where(eq(redemptions.userId, userId));

      return {
        redemptions: items,
        total: countResult[0]?.count ?? 0,
      };
    }),
});

// ─── Challenges sub-router ───────────────────────────────────────────

const challengesRouter = createRouter({
  // Get today's challenges with user progress
  getDaily: authedQuery.query(async ({ ctx }) => {
    const userId = ctx.user.unionId;
    const todayKey = getDateKey();
    const db = getDb();

    // Get or create today's challenges
    let challenges = await db
      .select()
      .from(dailyChallenges)
      .where(eq(dailyChallenges.dateKey, todayKey));

    // If no challenges exist for today, seed some defaults
    if (challenges.length === 0) {
      const defaults = [
        {
          title: "Morning Commute",
          description: `Run ${1000} meters in a single game`,
          type: "distance" as const,
          target: 1000,
          rewardMillas: 50,
          dateKey: todayKey,
        },
        {
          title: "Score Hunter",
          description: `Score ${5000} points in a single run`,
          type: "score" as const,
          target: 5000,
          rewardMillas: 75,
          dateKey: todayKey,
        },
        {
          title: "Dodge Master",
          description: `Dodge ${20} trucks in a single run`,
          type: "trucks" as const,
          target: 20,
          rewardMillas: 60,
          dateKey: todayKey,
        },
      ];
      await db.insert(dailyChallenges).values(defaults);

      challenges = await db
        .select()
        .from(dailyChallenges)
        .where(eq(dailyChallenges.dateKey, todayKey));
    }

    // Get user progress for each challenge
    const challengeIds = challenges.map((c) => c.id);
    const progress = await db
      .select()
      .from(userChallenges)
      .where(
        and(
          eq(userChallenges.userId, userId),
          sql`${userChallenges.challengeId} IN (${challengeIds.join(",")})`,
        ),
      );

    const progressMap = new Map(progress.map((p) => [p.challengeId, p]));

    return {
      dateKey: todayKey,
      challenges: challenges.map((challenge) => ({
        ...challenge,
        userProgress: progressMap.get(challenge.id) ?? {
          progress: 0,
          completed: false,
          completedAt: null,
        },
      })),
    };
  }),

  // Mark a challenge as complete and award points
  complete: authedQuery
    .input(
      z.object({
        challengeId: z.number().int().positive(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user.unionId;
      const db = getDb();
      const now = new Date();

      // Verify challenge exists
      const [challenge] = await db
        .select()
        .from(dailyChallenges)
        .where(eq(dailyChallenges.id, input.challengeId))
        .limit(1);

      if (!challenge) {
        throw new Error("Challenge not found");
      }

      // Check if already completed
      const [existing] = await db
        .select()
        .from(userChallenges)
        .where(
          and(
            eq(userChallenges.userId, userId),
            eq(userChallenges.challengeId, input.challengeId),
          ),
        )
        .limit(1);

      if (existing?.completed) {
        throw new Error("Challenge already completed");
      }

      // Upsert completion
      if (existing) {
        await db
          .update(userChallenges)
          .set({
            completed: true,
            completedAt: now,
            progress: challenge.target,
          })
          .where(eq(userChallenges.id, existing.id));
      } else {
        await db.insert(userChallenges).values({
          userId,
          challengeId: input.challengeId,
          progress: challenge.target,
          completed: true,
          completedAt: now,
        });
      }

      // Award points
      const points = await db
        .select()
        .from(userPoints)
        .where(eq(userPoints.userId, userId))
        .limit(1);

      let newBalance: number;
      if (points[0]) {
        newBalance = points[0].totalMillas + challenge.rewardMillas;
        await db
          .update(userPoints)
          .set({
            totalMillas: newBalance,
            lifetimeMillas: points[0].lifetimeMillas + challenge.rewardMillas,
            updatedAt: now,
          })
          .where(eq(userPoints.userId, userId));
      } else {
        newBalance = challenge.rewardMillas;
        await db.insert(userPoints).values({
          userId,
          totalMillas: newBalance,
          lifetimeMillas: newBalance,
          currentStreak: 1,
          longestStreak: 1,
          lastPlayedAt: now,
        });
      }

      // Log transaction
      await db.insert(pointTransactions).values({
        userId,
        type: "earned_challenge",
        amount: challenge.rewardMillas,
        description: `Completed challenge: ${challenge.title}`,
        referenceId: String(challenge.id),
        balanceAfter: newBalance,
      });

      return {
        success: true,
        rewardMillas: challenge.rewardMillas,
        newBalance,
      };
    }),
});

// ─── Main game router ────────────────────────────────────────────────

export const gameRouter = createRouter({
  game: gameCoreRouter,
  points: pointsRouter,
  challenges: challengesRouter,
});
