import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap } from 'lucide-react';
import { usePowerupStore, POWERUP_DEFS, POWERUP_IDS, type PowerupId } from '@/store/powerupStore';
import { cn } from '@/lib/utils';

interface PowerupMenuProps {
  onActivate: (id: PowerupId) => void;
}

// Posiciones del menú radial (arco sobre el FAB)
const RADIAL_POSITIONS = [
  { x: 8, y: -92 },
  { x: 64, y: -72 },
  { x: 96, y: -24 },
  { x: 100, y: 32 },
];

export function PowerupMenu({ onActivate }: PowerupMenuProps) {
  const inventory = usePowerupStore((s) => s.inventory);
  const activeEffects = usePowerupStore((s) => s.activeEffects);
  const activatePowerup = usePowerupStore((s) => s.activatePowerup);

  const [open, setOpen] = useState(false);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (!open) return;
    const iv = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(iv);
  }, [open]);

  const handleActivate = (id: PowerupId) => {
    const ok = activatePowerup(id);
    if (!ok) return;
    setOpen(false);
    onActivate(id);
  };

  return (
    <div className="fixed left-3 z-40 bottom-[calc(300px+env(safe-area-inset-bottom,0px))]">
      {/* Chips de efectos activos */}
      <div className="flex flex-col gap-1 mb-2">
        {POWERUP_IDS.map((id) => {
          const end = activeEffects[id] ?? 0;
          if (end <= now) return null;
          return (
            <span
              key={id}
              className="event-pill flex items-center gap-1.5 h-8 px-3 rounded-full text-white text-xs font-black border-2 border-white/70 shadow-lg"
              style={{ background: 'linear-gradient(90deg,#A855F7,#7E22CE)' }}
            >
              {POWERUP_DEFS[id].icon} {Math.ceil((end - now) / 1000)}s
            </span>
          );
        })}
      </div>

      <div className="relative">
        {/* Menú radial */}
        <AnimatePresence>
          {open &&
            POWERUP_IDS.map((id, i) => {
              const def = POWERUP_DEFS[id];
              const count = inventory[id] ?? 0;
              const active = (activeEffects[id] ?? 0) > now;
              const pos = RADIAL_POSITIONS[i];
              return (
                <motion.button
                  key={id}
                  initial={{ opacity: 0, scale: 0, x: 0, y: 0 }}
                  animate={{ opacity: 1, scale: 1, x: pos.x, y: pos.y }}
                  exit={{ opacity: 0, scale: 0, x: 0, y: 0 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 24, delay: i * 0.04 }}
                  disabled={count <= 0 || active}
                  onClick={() => handleActivate(id)}
                  title={`${def.name}: ${def.description}`}
                  className={cn(
                    'absolute left-0 bottom-0 w-14 h-14 rounded-full flex flex-col items-center justify-center border-2 shadow-xl',
                    count > 0 && !active
                      ? 'bg-gradient-to-b from-[#FDE047] to-[#F59E0B] border-white cursor-pointer'
                      : 'bg-slate-300 border-slate-200 opacity-60 cursor-not-allowed'
                  )}
                >
                  <span className="text-xl leading-none">{def.icon}</span>
                  <span className="text-[9px] font-black text-[#78350F] bg-white/80 rounded-full px-1.5 mt-0.5">
                    x{count}
                  </span>
                </motion.button>
              );
            })}
        </AnimatePresence>

        {/* FAB */}
        <motion.button
          whileTap={{ scale: 0.85 }}
          onClick={() => setOpen((v) => !v)}
          className="powerup-fab relative"
          aria-label="Power-ups"
        >
          <Zap size={26} className="text-white fill-white" />
        </motion.button>
      </div>
    </div>
  );
}
