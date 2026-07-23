import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Ticket } from 'lucide-react';
import confetti from 'canvas-confetti';
import { cn } from '@/lib/utils';
import { useMillas } from '@/providers/MillasProvider';
import { useClickerStore } from '@/store/clickerStore';
import { usePowerupStore, POWERUP_DEFS } from '@/store/powerupStore';
import {
  useLootBoxStore,
  LOOTBOX_TICKET_COST,
  RARE_SKINS,
  type LootResult,
} from '@/store/lootBoxStore';

function prizeInfo(result: LootResult): { emoji: string; name: string; description: string; rare: boolean } {
  switch (result.kind) {
    case 'powerup': {
      const def = POWERUP_DEFS[result.powerup];
      return { emoji: def.icon, name: def.name, description: def.description, rare: false };
    }
    case 'tickets':
      return { emoji: '🎟️', name: `+${result.amount} Golden Ticket`, description: 'Para tu próxima compra de flota', rare: false };
    case 'millas':
      return { emoji: '💵', name: `+${result.amount.toLocaleString('es-CO')} Millas`, description: 'TicaMillas para la Tienda', rare: false };
    case 'cps':
      return { emoji: '⚡', name: `+${result.amount.toLocaleString('es-CO')} CPS`, description: 'Directo a tu balance', rare: false };
    case 'skin': {
      const skin = RARE_SKINS.find((s) => s.id === result.skinId);
      return { emoji: skin?.emoji ?? '✨', name: skin?.name ?? 'Skin rara', description: '¡Skin legendaria para tu colección!', rare: true };
    }
  }
}

interface LootBoxModalProps {
  open: boolean;
  onClose: () => void;
}

/** Caja sorpresa: cuesta 1 🎟️, animación de apertura y revelación de premio. */
export function LootBoxModal({ open, onClose }: LootBoxModalProps) {
  const { addMillas } = useMillas();
  const goldenTickets = useClickerStore((s) => s.goldenTickets);
  const totalOpened = useLootBoxStore((s) => s.totalOpened);
  const skins = useLootBoxStore((s) => s.skins);
  const [phase, setPhase] = useState<'idle' | 'opening' | 'revealed'>('idle');
  const [result, setResult] = useState<LootResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Reset del estado interno al cerrar el modal
  const handleClose = () => {
    if (phase === 'opening') return;
    setPhase('idle');
    setResult(null);
    setError(null);
    onClose();
  };

  const applyReward = (r: LootResult) => {
    const clicker = useClickerStore.getState();
    if (r.kind === 'powerup') usePowerupStore.getState().addPowerup(r.powerup);
    if (r.kind === 'tickets') clicker.addGoldenTickets(r.amount);
    if (r.kind === 'millas') addMillas(r.amount);
    if (r.kind === 'cps') clicker.addEarnings(r.amount);
  };

  const handleOpen = () => {
    setError(null);
    const r = useLootBoxStore.getState().openBox();
    if (!r) {
      setError('Necesitas 1 Golden Ticket 🎟️');
      return;
    }
    setResult(r);
    setPhase('opening');
    setTimeout(() => {
      applyReward(r);
      setPhase('revealed');
      const info = prizeInfo(r);
      confetti({
        particleCount: info.rare ? 120 : 50,
        spread: 80,
        startVelocity: 30,
        origin: { x: 0.5, y: 0.6 },
        colors: info.rare ? ['#FFD700', '#A855F7', '#FFFFFF'] : ['#FFD700', '#F59E0B', '#FFF7CC'],
        ticks: 120,
      });
    }, 1200);
  };

  const prize = result ? prizeInfo(result) : null;

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
            onClick={handleClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 40 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 40 }}
            transition={{ type: 'spring', stiffness: 300, damping: 26 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[90vw] max-w-sm bg-[#0D0E14] rounded-3xl border-2 border-[#A855F7]/50 shadow-[0_0_60px_rgba(168,85,247,0.25)] p-6"
          >
            <button
              onClick={handleClose}
              disabled={phase === 'opening'}
              className="absolute top-3 right-3 p-1 rounded-full hover:bg-white/10 transition-colors disabled:opacity-30"
            >
              <X size={18} className="text-slate-400" />
            </button>

            <h3 className="font-fredoka font-bold text-lg text-white text-center">🎁 Caja Sorpresa</h3>
            <p className="text-slate-400 text-xs text-center mt-1">
              {totalOpened} abiertas · {skins.length}/{RARE_SKINS.length} skins raras
            </p>

            {/* Caja / Premio */}
            <div className="flex justify-center my-6 h-32 items-center">
              {phase !== 'revealed' ? (
                <motion.div
                  animate={
                    phase === 'opening'
                      ? { rotate: [0, -8, 8, -8, 8, 0], scale: [1, 1.1, 1.15, 1.2] }
                      : { y: [0, -8, 0] }
                  }
                  transition={
                    phase === 'opening'
                      ? { duration: 1.2, ease: 'easeInOut' }
                      : { duration: 1.6, repeat: Infinity }
                  }
                  className="text-7xl select-none"
                >
                  🎁
                </motion.div>
              ) : (
                prize && (
                  <motion.div
                    initial={{ scale: 0, rotate: -20 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: 'spring', stiffness: 260, damping: 14 }}
                    className={cn(
                      'flex flex-col items-center text-center rounded-2xl px-6 py-4 border-2',
                      prize.rare
                        ? 'border-[#A855F7] bg-[#A855F7]/10 shadow-[0_0_30px_rgba(168,85,247,0.4)]'
                        : 'border-[#F59E0B]/60 bg-[#F59E0B]/10'
                    )}
                  >
                    <span className="text-5xl">{prize.emoji}</span>
                    <p className="font-fredoka font-black text-white text-lg mt-2">{prize.name}</p>
                    <p className="text-slate-400 text-xs mt-0.5">{prize.description}</p>
                    {prize.rare && (
                      <p className="text-[#A855F7] text-[10px] font-black uppercase tracking-widest mt-1">
                        ¡Ultra rara!
                      </p>
                    )}
                  </motion.div>
                )
              )}
            </div>

            {error && <p className="text-[#EF4444] text-xs font-bold text-center mb-3">{error}</p>}

            {phase === 'revealed' ? (
              <div className="flex gap-2">
                <button
                  onClick={handleOpen}
                  className="flex-1 h-11 rounded-xl bg-white/10 border border-white/15 text-white font-bold text-sm flex items-center justify-center gap-1.5"
                >
                  <Ticket size={15} /> Otra ({LOOTBOX_TICKET_COST} 🎟️)
                </button>
                <button
                  onClick={handleClose}
                  className="flex-1 h-11 rounded-xl bg-gradient-to-r from-[#F59E0B] to-[#FBBF24] text-[#0D0E14] font-black text-sm"
                >
                  Cobrar
                </button>
              </div>
            ) : (
              <button
                onClick={handleOpen}
                disabled={phase === 'opening'}
                className={cn(
                  'w-full h-12 rounded-xl font-black text-sm flex items-center justify-center gap-2 transition-all',
                  phase === 'opening'
                    ? 'bg-white/10 text-slate-400'
                    : goldenTickets >= LOOTBOX_TICKET_COST
                      ? 'bg-gradient-to-r from-[#A855F7] to-[#7E22CE] text-white shadow-lg'
                      : 'bg-white/10 text-slate-400'
                )}
              >
                {phase === 'opening' ? (
                  'Abriendo...'
                ) : (
                  <>
                    <Ticket size={16} /> Abrir por {LOOTBOX_TICKET_COST} 🎟️ (tienes {goldenTickets})
                  </>
                )}
              </button>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
