// ─────────────────────────────────────────────────────────────────────────────
// DESAFÍOS SEMANALES GLOBALES (F15)
// 3 desafíos de comunidad por semana (lunes 00:00 local), generados de forma
// determinística con la semana como seed. El progreso global es simulado:
// progreso pasivo (la "comunidad") + lo que aporta el jugador multiplicado.
// Milestones de recompensa al 25/50/75/100% (se aplican en la capa UI).
// ─────────────────────────────────────────────────────────────────────────────

export type ChallengeType = 'clicks' | 'cps' | 'tickets';

export interface ChallengeRewardSet {
  millas?: number;
  cps?: number;
  tickets?: number;
  /** true = un power-up aleatorio. */
  randomPowerup?: boolean;
  /** true = un coleccionable aleatorio del álbum (F14). */
  collectible?: boolean;
}

export interface ChallengeMilestone {
  pct: 25 | 50 | 75 | 100;
  rewards: ChallengeRewardSet;
}

export interface GlobalChallengeDef {
  id: string;
  type: ChallengeType;
  emoji: string;
  title: string;
  goal: number;
  /** Progreso pasivo simulado de la comunidad por segundo. */
  passivePerSecond: number;
}

/** Cada unidad aportada por el jugador suma ×1000 al progreso "comunitario". */
export const COMMUNITY_MULTIPLIER = 1000;

/** La comunidad sola completaría el desafío en ~4 días (con jitter por seed). */
const PASSIVE_DAYS_TO_COMPLETE = 4;

export const CHALLENGE_MILESTONES: ChallengeMilestone[] = [
  { pct: 25, rewards: { millas: 10_000, cps: 100_000 } },
  { pct: 50, rewards: { millas: 25_000, cps: 500_000, tickets: 5 } },
  { pct: 75, rewards: { millas: 50_000, cps: 2_000_000, tickets: 10, randomPowerup: true } },
  {
    pct: 100,
    rewards: { millas: 100_000, cps: 10_000_000, tickets: 25, randomPowerup: true, collectible: true },
  },
];

function hashSeed(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

/** PRNG determinístico: todos los clientes ven los mismos desafíos de la semana. */
function seededRandom(seed: number): () => number {
  let s = seed || 1;
  return () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };
}

interface ChallengeTemplate {
  type: ChallengeType;
  emoji: string;
  title: (goal: string) => string;
  minGoal: number;
  maxGoal: number;
  /** Redondeo "bonito" del objetivo. */
  step: number;
}

const TEMPLATES: ChallengeTemplate[] = [
  {
    type: 'clicks',
    emoji: '👆',
    title: (g) => `Clicks totales de la comunidad: ${g}`,
    minGoal: 500_000_000,
    maxGoal: 2_000_000_000,
    step: 100_000_000,
  },
  {
    type: 'cps',
    emoji: '⚡',
    title: (g) => `CPS generados por la comunidad: ${g}`,
    minGoal: 50_000_000_000_000,
    maxGoal: 500_000_000_000_000,
    step: 10_000_000_000_000,
  },
  {
    type: 'tickets',
    emoji: '🎟️',
    title: (g) => `Golden Tickets recolectados: ${g}`,
    minGoal: 500_000,
    maxGoal: 2_000_000,
    step: 100_000,
  },
];

export function formatChallengeGoal(n: number): string {
  if (n < 1_000) return n.toLocaleString('es-CO');
  if (n < 1_000_000) return `${(n / 1_000).toFixed(0)}K`;
  if (n < 1_000_000_000) return `${(n / 1_000_000).toFixed(n < 10_000_000 ? 1 : 0)}M`;
  if (n < 1_000_000_000_000) return `${(n / 1_000_000_000).toFixed(n < 10_000_000_000 ? 1 : 0)}B`;
  return `${(n / 1_000_000_000_000).toFixed(n < 10_000_000_000_000 ? 1 : 0)}T`;
}

/** Genera los 3 desafíos de la semana (determinístico por `weekKey`). */
export function generateWeeklyChallenges(weekKey: string): GlobalChallengeDef[] {
  const rand = seededRandom(hashSeed(`global-${weekKey}`));
  return TEMPLATES.map((tpl, i) => {
    const raw = tpl.minGoal + rand() * (tpl.maxGoal - tpl.minGoal);
    const goal = Math.round(raw / tpl.step) * tpl.step;
    const jitter = 0.9 + rand() * 0.4; // 0.9–1.3
    return {
      id: `gc-${weekKey}-${i}`,
      type: tpl.type,
      emoji: tpl.emoji,
      title: tpl.title(formatChallengeGoal(goal)),
      goal,
      passivePerSecond: (goal * jitter) / (PASSIVE_DAYS_TO_COMPLETE * 24 * 3600),
    };
  });
}
