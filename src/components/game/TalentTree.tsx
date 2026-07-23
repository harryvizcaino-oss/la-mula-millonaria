import { motion } from 'framer-motion';
import { Star, Lock, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useClickerStore } from '@/store/clickerStore';
import {
  useTalentStore,
  TALENTS,
  TALENT_BRANCHES,
  type TalentDef,
} from '@/store/talentStore';

interface TalentTreeProps {
  onBuy: (talent: TalentDef, result: { success: boolean; reason?: string }) => void;
}

/** Árbol de talentos del camionero: 4 ramas × 3 niveles, se compra con ⭐ de prestigio. */
export function TalentTree({ onBuy }: TalentTreeProps) {
  const stars = useClickerStore((s) => s.stars);
  const levels = useTalentStore((s) => s.levels);
  const buy = useTalentStore((s) => s.buy);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between px-1">
        <p className="text-slate-500 text-[11px]">
          Talentos permanentes comprados con <span className="font-black text-slate-700">estrellas de prestigio</span>.
        </p>
        <span className="flex items-center gap-1 text-[#F59E0B] font-fredoka font-black text-sm flex-shrink-0">
          <Star size={14} className="fill-[#F59E0B]" /> {stars}
        </span>
      </div>

      <div className="grid grid-cols-4 gap-2">
        {TALENT_BRANCHES.map((branch) => {
          const branchTalents = TALENTS.filter((t) => t.branch === branch.id).sort(
            (a, b) => b.level - a.level // el nivel 3 arriba, como un árbol
          );
          return (
            <div key={branch.id} className="flex flex-col items-center">
              <p className="text-[10px] font-black uppercase tracking-wider mb-2" style={{ color: branch.color }}>
                {branch.emoji} {branch.name}
              </p>
              <div className="flex flex-col items-center gap-0">
                {branchTalents.map((talent, i) => {
                  const owned = (levels[talent.id] ?? 0) > 0;
                  const prevOwned =
                    talent.level === 1 || (levels[`${talent.branch}-${talent.level - 1}`] ?? 0) > 0;
                  const locked = !prevOwned;
                  const affordable = stars >= talent.cost;
                  const canBuy = !owned && !locked && affordable;
                  return (
                    <div key={talent.id} className="flex flex-col items-center">
                      {/* Conector vertical entre nodos */}
                      {i > 0 && (
                        <div
                          className="w-0.5 h-4"
                          style={{
                            backgroundColor:
                              (levels[`${talent.branch}-${talent.level - 1}`] ?? 0) > 0
                                ? branch.color
                                : 'rgba(100,116,139,0.3)',
                          }}
                        />
                      )}
                      <motion.button
                        whileTap={{ scale: canBuy ? 0.92 : 1 }}
                        onClick={() => canBuy && onBuy(talent, buy(talent.id))}
                        disabled={!canBuy}
                        title={`${talent.name}: ${talent.description} · ${talent.cost} ⭐`}
                        className={cn(
                          'relative w-14 h-14 rounded-2xl border-2 flex flex-col items-center justify-center transition-all',
                          owned
                            ? 'shadow-lg'
                            : locked
                              ? 'bg-slate-100 border-slate-200 opacity-60'
                              : canBuy
                                ? 'bg-white shadow-md'
                                : 'bg-slate-100 border-slate-200'
                        )}
                        style={
                          owned
                            ? {
                                background: `linear-gradient(135deg, ${branch.color}, ${branch.color}CC)`,
                                borderColor: branch.color,
                              }
                            : canBuy
                              ? { borderColor: branch.color }
                              : undefined
                        }
                      >
                        {owned ? (
                          <Check size={20} className="text-white" strokeWidth={3} />
                        ) : locked ? (
                          <Lock size={16} className="text-slate-400" />
                        ) : (
                          <span className="text-xl">{talent.emoji}</span>
                        )}
                        <span
                          className={cn(
                            'text-[8px] font-black mt-0.5',
                            owned ? 'text-white/90' : 'text-slate-500'
                          )}
                        >
                          Nv {talent.level}
                        </span>
                      </motion.button>
                      <p className="text-[9px] font-bold text-slate-600 mt-1 text-center leading-tight">
                        {talent.name}
                      </p>
                      {!owned && (
                        <p
                          className={cn(
                            'text-[9px] font-black flex items-center gap-0.5',
                            affordable && !locked ? 'text-[#F59E0B]' : 'text-slate-400'
                          )}
                        >
                          <Star size={8} className="fill-current" /> {talent.cost}
                        </p>
                      )}
                      <p className="text-[8px] text-slate-400 text-center leading-tight mt-0.5 px-0.5">
                        {talent.description}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
