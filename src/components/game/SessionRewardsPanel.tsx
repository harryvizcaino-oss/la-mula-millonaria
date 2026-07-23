import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, Clock } from 'lucide-react';
import confetti from 'canvas-confetti';
import { cn } from '@/lib/utils';
import {
  SESSION_MILESTONES,
  formatSessionTime,
  type SessionRewardSet,
} from '@/data/sessionRewards';
import { useSessionRewardStore } from '@/store/sessionRewardStore';

function formatReward(r: SessionRewardSet): string {
  const parts: string[] = [];
  if (r.cps) parts.push(`+${r.cps.toLocaleString('es-CO')} ⚡`);
  if (r.tickets) parts.push(`+${r.tickets} 🎟️`);
  if (r.millas) parts.push(`+${r.millas.toLocaleString('es-CO')} M`);
  if (r.randomPowerup) parts.push('+1 power-up');
  return parts.join('  ');
}

interface SessionRewardsPanelProps {
  open: boolean;
  onClose: () => void;
  /** Aplica la recompensa a las economías (millas/CPS/tickets/power-up) desde la página. */
  onClaimReward: (reward: SessionRewardSet) => void;
}

export function SessionRewardsPanel({ open, onClose, onClaimReward }: SessionRewardsPanelProps) {
  const activeMs = useSessionRewardStore((s) => s.activeMs);
  const claimed = useSessionRewardStore((s) => s.claimed);
  const claim = useSessionRewardStore((s) => s.claim);

  const nextMilestone = SESSION_MILESTONES.find((m) => !claimed.includes(m.id));
  const sessionPct = nextMilestone
    ? Math.min(100, (activeMs / (nextMilestone.seconds * 1000)) * 100)
    : 100;

  const handleClaim = (milestoneId: string) => {
    const reward = claim(milestoneId);
    if (!reward) return;
    onClaimReward(reward);
    confetti({
      particleCount: 40,
      spread: 70,
      startVelocity: 26,
      origin: { x: 0.5, y: 0.75 },
      colors: ['#FFD700', '#F59E0B', '#FFF7CC'],
      scalar: 0.8,
      ticks: 100,
    });
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'tween', duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="fixed bottom-0 left-0 right-0 z-50 bg-[#0D0E14] rounded-t-3xl max-h-[75vh] overflow-y-auto border-t-2 border-[#F59E0B]/40"
          >
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-white/20" />
            </div>
            <div className="flex items-center justify-between px-5 py-3">
              <h3 className="font-fredoka font-bold text-lg text-white">⏱️ Recompensas de sesión</h3>
              <button
                onClick={onClose}
                className="p-1 rounded-full hover:bg-white/10 transition-colors"
              >
                <X size={20} className="text-slate-400" />
              </button>
            </div>

            <div className="px-5 pb-8 space-y-4">
              {/* Tiempo actual + progreso al siguiente milestone */}
              <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="flex items-center gap-1.5 text-slate-400 text-[11px] font-bold uppercase tracking-wider">
                    <Clock size={12} /> Tiempo en sesión
                  </span>
                  <span className="font-mono text-[#F59E0B] text-sm font-bold">
                    {formatSessionTime(activeMs)}
                  </span>
                </div>
                <div className="h-2 rounded-full bg-black/40 overflow-hidden border border-white/10">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[#F59E0B] to-[#FDE047] transition-all duration-500"
                    style={{ width: `${sessionPct}%` }}
                  />
                </div>
                <p className="text-slate-500 text-[10px] mt-1.5">
                  {nextMilestone
                    ? `Siguiente recompensa a los ${nextMilestone.label}`
                    : '¡Todas las recompensas de la sesión reclamadas!'}
                  {' '}La sesión se reinicia tras 10 min inactivo.
                </p>
              </div>

              {/* Milestones */}
              <div className="space-y-2">
                {SESSION_MILESTONES.map((m) => {
                  const isClaimed = claimed.includes(m.id);
                  const reached = activeMs >= m.seconds * 1000;
                  const pct = Math.min(100, (activeMs / (m.seconds * 1000)) * 100);
                  return (
                    <div
                      key={m.id}
                      className={cn(
                        'rounded-2xl border p-3 bg-white/5 backdrop-blur-sm',
                        isClaimed
                          ? 'border-white/5 opacity-50'
                          : reached
                            ? 'border-[#F59E0B]/60 shadow-[0_0_16px_rgba(245,158,11,0.15)]'
                            : 'border-white/10'
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl flex-shrink-0">⏱️</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-sm font-bold truncate">
                            {m.label} de juego activo
                          </p>
                          <p className="text-[#F59E0B] text-[11px] font-semibold">
                            {formatReward(m.rewards)}
                          </p>
                        </div>
                        {isClaimed ? (
                          <span className="flex items-center gap-1 text-emerald-400 text-xs font-bold flex-shrink-0">
                            <Check size={14} /> Lista
                          </span>
                        ) : (
                          <motion.button
                            whileTap={{ scale: 0.95 }}
                            onClick={() => reached && handleClaim(m.id)}
                            disabled={!reached}
                            className={cn(
                              'flex-shrink-0 h-8 px-3 rounded-xl text-xs font-black transition-colors',
                              reached
                                ? 'bg-gradient-to-r from-[#F59E0B] to-[#FBBF24] text-[#0D0E14] shadow-md'
                                : 'bg-white/10 text-slate-400 cursor-not-allowed'
                            )}
                          >
                            Reclamar
                          </motion.button>
                        )}
                      </div>
                      {!isClaimed && !reached && (
                        <div className="mt-2 flex items-center gap-2">
                          <div className="flex-1 h-2 rounded-full bg-black/40 overflow-hidden border border-white/10">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-300"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="text-slate-400 text-[10px] font-mono flex-shrink-0">
                            {formatSessionTime(activeMs)}/{m.label}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
