// ─────────────────────────────────────────────────────────────────────────────
// RECOMPENSAS POR TIEMPO DE SESIÓN (F13)
// Milestones de tiempo activo en la app. Cada milestone se reclama una vez por
// sesión; la sesión se reinicia tras 10 minutos de inactividad.
// Las millas se aplican en la capa UI (MillasProvider); CPS/tickets/power-ups
// los aplica la página que reclama.
// ─────────────────────────────────────────────────────────────────────────────

export interface SessionRewardSet {
  millas?: number;
  cps?: number;
  tickets?: number;
  /** true = un power-up aleatorio del inventario. */
  randomPowerup?: boolean;
}

export interface SessionMilestone {
  id: string;
  seconds: number;
  label: string;
  rewards: SessionRewardSet;
}

/** Inactividad que reinicia la sesión (10 minutos). */
export const SESSION_INACTIVITY_RESET_MS = 10 * 60 * 1000;

export const SESSION_MILESTONES: SessionMilestone[] = [
  { id: 's-1m', seconds: 60, label: '1 min', rewards: { millas: 500, cps: 1_000 } },
  { id: 's-3m', seconds: 180, label: '3 min', rewards: { millas: 1_500, cps: 5_000 } },
  { id: 's-5m', seconds: 300, label: '5 min', rewards: { millas: 3_000, cps: 15_000, tickets: 1 } },
  { id: 's-10m', seconds: 600, label: '10 min', rewards: { millas: 7_500, cps: 50_000, tickets: 2 } },
  {
    id: 's-15m',
    seconds: 900,
    label: '15 min',
    rewards: { millas: 15_000, cps: 150_000, tickets: 3, randomPowerup: true },
  },
  {
    id: 's-30m',
    seconds: 1800,
    label: '30 min',
    rewards: { millas: 40_000, cps: 500_000, tickets: 6, randomPowerup: true },
  },
  {
    id: 's-60m',
    seconds: 3600,
    label: '60 min',
    rewards: { millas: 100_000, cps: 2_000_000, tickets: 15, randomPowerup: true },
  },
];

export function getSessionMilestone(id: string): SessionMilestone | undefined {
  return SESSION_MILESTONES.find((m) => m.id === id);
}

/** Formato mm:ss (o h:mm:ss) del tiempo activo de sesión. */
export function formatSessionTime(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const mm = String(m).padStart(2, '0');
  const ss = String(s).padStart(2, '0');
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}
