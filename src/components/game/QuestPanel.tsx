import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CalendarDays, CalendarRange, Check } from 'lucide-react';
import confetti from 'canvas-confetti';
import { cn } from '@/lib/utils';
import { useQuestStore, type Quest, type QuestReward } from '@/store/questStore';

function formatReward(reward: QuestReward): string {
  const parts: string[] = [];
  if (reward.cps) parts.push(`+${reward.cps.toLocaleString('es-CO')} ⚡`);
  if (reward.tickets) parts.push(`+${reward.tickets} 🎟️`);
  if (reward.millas) parts.push(`+${reward.millas.toLocaleString('es-CO')} M`);
  return parts.join('  ');
}

function QuestRow({ quest, onClaim }: { quest: Quest; onClaim: (quest: Quest) => void }) {
  const pct = Math.min(100, (quest.progress / quest.target) * 100);
  const complete = quest.progress >= quest.target;
  return (
    <div
      className={cn(
        'rounded-2xl border p-3 bg-white/5 backdrop-blur-sm',
        quest.claimed
          ? 'border-white/5 opacity-50'
          : complete
            ? 'border-[#F59E0B]/60 shadow-[0_0_16px_rgba(245,158,11,0.15)]'
            : 'border-white/10'
      )}
    >
      <div className="flex items-center gap-3">
        <span className="text-2xl flex-shrink-0">{quest.emoji}</span>
        <div className="flex-1 min-w-0">
          <p className="text-white text-sm font-bold truncate">{quest.title}</p>
          <p className="text-[#F59E0B] text-[11px] font-semibold">{formatReward(quest.reward)}</p>
        </div>
        {quest.claimed ? (
          <span className="flex items-center gap-1 text-emerald-400 text-xs font-bold flex-shrink-0">
            <Check size={14} /> Lista
          </span>
        ) : (
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => complete && onClaim(quest)}
            disabled={!complete}
            className={cn(
              'flex-shrink-0 h-8 px-3 rounded-xl text-xs font-black transition-colors',
              complete
                ? 'bg-gradient-to-r from-[#F59E0B] to-[#FBBF24] text-[#0D0E14] shadow-md'
                : 'bg-white/10 text-slate-400 cursor-not-allowed'
            )}
          >
            Reclamar
          </motion.button>
        )}
      </div>
      <div className="mt-2 flex items-center gap-2">
        <div className="flex-1 h-2 rounded-full bg-black/40 overflow-hidden border border-white/10">
          <div
            className={cn(
              'h-full rounded-full transition-all duration-300',
              complete ? 'bg-gradient-to-r from-[#F59E0B] to-[#FDE047]' : 'bg-gradient-to-r from-emerald-500 to-emerald-400'
            )}
            style={{ width: `${pct}%` }}
          />
        </div>
        <span className="text-slate-400 text-[10px] font-mono flex-shrink-0">
          {Math.floor(quest.progress).toLocaleString('es-CO')}/{quest.target.toLocaleString('es-CO')}
        </span>
      </div>
    </div>
  );
}

interface QuestPanelProps {
  open: boolean;
  onClose: () => void;
  /** Aplica la recompensa a las economías (CPS/tickets/millas) desde la página. */
  onClaimReward: (reward: QuestReward) => void;
}

export function QuestPanel({ open, onClose, onClaimReward }: QuestPanelProps) {
  const quests = useQuestStore((s) => s.quests);
  const ensureQuests = useQuestStore((s) => s.ensureQuests);
  const claim = useQuestStore((s) => s.claim);

  useEffect(() => {
    if (open) ensureQuests();
  }, [open, ensureQuests]);

  const handleClaim = (quest: Quest) => {
    const reward = claim(quest.id);
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

  const daily = quests.filter((q) => q.period === 'daily');
  const weekly = quests.filter((q) => q.period === 'weekly');

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
              <h3 className="font-fredoka font-bold text-lg text-white">📋 Misiones</h3>
              <button
                onClick={onClose}
                className="p-1 rounded-full hover:bg-white/10 transition-colors"
              >
                <X size={20} className="text-slate-400" />
              </button>
            </div>

            <div className="px-5 pb-8 space-y-4">
              <div>
                <p className="flex items-center gap-1.5 text-slate-400 text-[11px] font-bold uppercase tracking-wider mb-2">
                  <CalendarDays size={12} /> Diarias (rotan cada día)
                </p>
                <div className="space-y-2">
                  {daily.map((q) => (
                    <QuestRow key={q.id} quest={q} onClaim={handleClaim} />
                  ))}
                </div>
              </div>

              <div>
                <p className="flex items-center gap-1.5 text-slate-400 text-[11px] font-bold uppercase tracking-wider mb-2">
                  <CalendarRange size={12} /> Semanal (rota cada lunes)
                </p>
                <div className="space-y-2">
                  {weekly.map((q) => (
                    <QuestRow key={q.id} quest={q} onClaim={handleClaim} />
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
