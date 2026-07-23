import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy } from 'lucide-react';
import type { AchievementDef } from '@/store/achievementStore';

interface AchievementToastProps {
  achievement: AchievementDef | null;
  onDone: () => void;
}

/** Toast dorado que anuncia un logro recién desbloqueado (auto-cierra en 4s). */
export function AchievementToast({ achievement, onDone }: AchievementToastProps) {
  useEffect(() => {
    if (!achievement) return;
    const t = setTimeout(onDone, 4000);
    return () => clearTimeout(t);
  }, [achievement, onDone]);

  return (
    <AnimatePresence>
      {achievement && (
        <motion.div
          key={achievement.id}
          initial={{ opacity: 0, y: -60, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -30, scale: 0.9 }}
          transition={{ type: 'spring', stiffness: 320, damping: 24 }}
          className="fixed top-14 left-1/2 -translate-x-1/2 z-[60] w-[92vw] max-w-sm"
          onClick={onDone}
        >
          <div className="rounded-2xl border-2 border-[#F59E0B] bg-gradient-to-r from-[#1A1B26] to-[#0D0E14] shadow-[0_8px_32px_rgba(245,158,11,0.35)] px-4 py-3 flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-[#F59E0B]/20 border border-[#F59E0B]/50 flex items-center justify-center text-2xl flex-shrink-0">
              {achievement.emoji}
            </div>
            <div className="flex-1 min-w-0">
              <p className="flex items-center gap-1 text-[#F59E0B] text-[10px] font-black uppercase tracking-wider">
                <Trophy size={10} /> Logro desbloqueado
              </p>
              <p className="text-white font-fredoka font-bold text-sm truncate">{achievement.title}</p>
              <p className="text-slate-400 text-[11px] truncate">{achievement.description}</p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
