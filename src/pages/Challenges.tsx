import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Check, Globe2, Users } from 'lucide-react';
import confetti from 'canvas-confetti';
import { cn } from '@/lib/utils';
import {
  CHALLENGE_MILESTONES,
  formatChallengeGoal,
  type ChallengeRewardSet,
} from '@/data/globalChallenges';
import {
  liveCommunity,
  useGlobalChallengeStore,
  type ActiveChallenge,
} from '@/store/globalChallengeStore';
import { useClickerStore } from '@/store/clickerStore';
import { useCollectibleStore } from '@/store/collectibleStore';
import { randomPowerupId, usePowerupStore } from '@/store/powerupStore';
import { useMillas } from '@/providers/MillasProvider';

/** Próximo lunes 00:00 local (fin de la semana de desafíos). */
function nextMondayMs(): number {
  const d = new Date();
  const day = (d.getDay() + 6) % 7; // lunes = 0
  const next = new Date(d.getFullYear(), d.getMonth(), d.getDate() + (7 - day));
  return next.getTime();
}

function formatCountdown(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const days = Math.floor(total / 86_400);
  const hours = Math.floor((total % 86_400) / 3600);
  const mins = Math.floor((total % 3600) / 60);
  return days > 0 ? `${days}d ${hours}h` : `${hours}h ${mins}m`;
}

function formatReward(r: ChallengeRewardSet): string {
  const parts: string[] = [];
  if (r.cps) parts.push(`+${formatChallengeGoal(r.cps)} ⚡`);
  if (r.tickets) parts.push(`+${r.tickets} 🎟️`);
  if (r.millas) parts.push(`+${r.millas.toLocaleString('es-CO')} M`);
  if (r.randomPowerup) parts.push('+power-up');
  if (r.collectible) parts.push('+coleccionable');
  return parts.join(' ');
}

export default function Challenges() {
  const navigate = useNavigate();
  const challenges = useGlobalChallengeStore((s) => s.challenges);
  const lastPassiveAt = useGlobalChallengeStore((s) => s.lastPassiveAt);
  const ensureChallenges = useGlobalChallengeStore((s) => s.ensureChallenges);
  const syncPassive = useGlobalChallengeStore((s) => s.syncPassive);
  const claimMilestone = useGlobalChallengeStore((s) => s.claimMilestone);
  const { addMillas } = useMillas();

  const [nowState, setNow] = useState(0);
  // Antes del primer tick se usa lastPassiveAt (valor estable del store)
  const now = nowState || lastPassiveAt;

  useEffect(() => {
    ensureChallenges();
    syncPassive();
    const id = setInterval(() => setNow(Date.now()), 5000);
    return () => clearInterval(id);
  }, [ensureChallenges, syncPassive]);

  const applyRewards = (rewards: ChallengeRewardSet) => {
    const clicker = useClickerStore.getState();
    if (rewards.cps) clicker.addEarnings(rewards.cps);
    if (rewards.tickets) clicker.addGoldenTickets(rewards.tickets);
    if (rewards.millas) addMillas(rewards.millas);
    if (rewards.randomPowerup) {
      usePowerupStore.getState().addPowerup(randomPowerupId(), 1);
    }
    if (rewards.collectible) useCollectibleStore.getState().grantRandom();
    confetti({
      particleCount: 60,
      spread: 75,
      origin: { y: 0.4 },
      colors: ['#FFD700', '#F59E0B', '#22C55E'],
    });
  };

  const handleClaim = (challengeId: string, pct: number) => {
    const rewards = claimMilestone(challengeId, pct);
    if (rewards) applyRewards(rewards);
  };

  const renderCard = (ch: ActiveChallenge) => {
    const community = liveCommunity(ch, lastPassiveAt, now);
    const pct = Math.min(100, (community / ch.goal) * 100);
    return (
      <div
        key={ch.id}
        className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_2px_12px_rgba(0,0,0,0.08)]"
      >
        <div className="flex items-center gap-3 mb-2">
          <span className="text-3xl flex-shrink-0">{ch.emoji}</span>
          <div className="flex-1 min-w-0">
            <p className="font-fredoka font-bold text-slate-900 text-sm leading-tight">
              {ch.title}
            </p>
            <p className="text-slate-500 text-[11px] flex items-center gap-1">
              <Users size={11} /> Tu aporte: {formatChallengeGoal(Math.floor(ch.personal))}
            </p>
          </div>
          <span className="font-fredoka font-black text-[#F59E0B] text-lg flex-shrink-0">
            {pct.toFixed(1)}%
          </span>
        </div>

        <div className="h-3 rounded-full bg-slate-100 overflow-hidden border border-slate-200 mb-1.5">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-[#F59E0B] to-[#FDE047]"
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.6 }}
          />
        </div>
        <p className="text-slate-500 text-[10px] font-mono mb-3">
          {formatChallengeGoal(Math.floor(community))} / {formatChallengeGoal(ch.goal)}
        </p>

        <div className="grid grid-cols-4 gap-1.5">
          {CHALLENGE_MILESTONES.map((m) => {
            const isClaimed = ch.claimed.includes(m.pct);
            const reached = pct >= m.pct;
            return (
              <button
                key={m.pct}
                onClick={() => reached && !isClaimed && handleClaim(ch.id, m.pct)}
                disabled={!reached || isClaimed}
                title={formatReward(m.rewards)}
                className={cn(
                  'rounded-xl px-1 py-1.5 text-center transition-all',
                  isClaimed
                    ? 'bg-emerald-50 border border-emerald-200'
                    : reached
                      ? 'bg-gradient-to-b from-[#FACC15] to-[#D97706] border-b-2 border-[#92400E] active:translate-y-0.5 active:border-b-0'
                      : 'bg-slate-100 border border-slate-200 cursor-not-allowed'
                )}
              >
                <span
                  className={cn(
                    'block text-[10px] font-black',
                    isClaimed ? 'text-emerald-600' : reached ? 'text-[#451a03]' : 'text-slate-400'
                  )}
                >
                  {isClaimed ? <Check size={11} className="inline" /> : `${m.pct}%`}
                </span>
                <span
                  className={cn(
                    'block text-[8px] font-semibold leading-tight mt-0.5 truncate',
                    isClaimed ? 'text-emerald-500' : reached ? 'text-[#78350F]' : 'text-slate-400'
                  )}
                >
                  {formatReward(m.rewards)}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-[100dvh] bg-white pb-24">
      {/* Header */}
      <div className="relative overflow-hidden rounded-b-3xl px-4 pt-6 pb-6">
        <div className="absolute inset-0 bg-gradient-to-b from-[#0D0E14] via-[#1A1B26] to-[#0D0E14] rounded-b-3xl" />
        <div className="relative">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="p-2 -ml-2 rounded-full hover:bg-white/10 transition-colors"
            >
              <ArrowLeft size={22} className="text-white" />
            </button>
            <div className="flex-1">
              <h1 className="font-fredoka font-black text-2xl text-white">Desafíos Globales</h1>
              <p className="text-slate-400 text-xs flex items-center gap-1">
                <Globe2 size={12} /> Termina en {formatCountdown(nextMondayMs() - now)}
              </p>
            </div>
          </div>
          <p className="text-slate-400 text-[11px] mt-3">
            La comunidad entera suma progreso. Tu aporte personal cuenta ×1000 y las
            recompensas se desbloquean al 25%, 50%, 75% y 100% de cada meta.
          </p>
        </div>
      </div>

      <div className="px-4 mt-5 space-y-4">{challenges.map(renderCard)}</div>
    </div>
  );
}
