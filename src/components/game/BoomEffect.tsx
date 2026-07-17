import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';

export interface BoomTrigger {
  id: number;
  /** true cuando el poder cambió de marca (tier): más confetti. */
  tierUp?: boolean;
}

interface BoomEffectProps {
  trigger: BoomTrigger | null;
}

const CONFETTI_COLORS = ['#FFD700', '#F59E0B', '#EF4444', '#3B82F6', '#22C55E', '#A855F7'];

/**
 * V2-6: Efecto BOOM al comprar un nivel de poder (más intenso al cambiar de tier).
 * - Overlay con el PNG `efecto_boom_poder_activado` (scale 0.3→1.2→1→1.5,
 *   opacity 0→1→1→0 en 1.2s).
 * - Screen flash dorado.
 * - Confetti de 20-30 cuadrados pequeños de colores (canvas-confetti).
 * - El toast "Nueva marca desbloqueada" lo dispara el padre (handleTierUp).
 * No captura pointer events: el juego sigue clickeable durante el efecto.
 */
export function BoomEffect({ trigger }: BoomEffectProps) {
  const [active, setActive] = useState<BoomTrigger | null>(null);

  useEffect(() => {
    if (!trigger) return;
    setActive(trigger);

    // Confetti: 20-30 cuadrados pequeños de colores desde el centro
    confetti({
      particleCount: trigger.tierUp ? 30 : 22,
      spread: 80,
      startVelocity: 32,
      origin: { x: 0.5, y: 0.45 },
      colors: CONFETTI_COLORS,
      shapes: ['square'],
      scalar: 0.7,
      ticks: 110,
      zIndex: 88,
    });

    const t = setTimeout(() => setActive(null), 1250);
    return () => clearTimeout(t);
  }, [trigger]);

  return (
    <AnimatePresence>
      {active && (
        <motion.div key={active.id} className="boom-overlay" exit={{ opacity: 0 }}>
          {/* Screen flash dorado */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.55, 0] }}
            transition={{ duration: 0.6, times: [0, 0.15, 1], ease: 'easeOut' }}
            className="boom-flash"
          />

          {/* Explosión PNG: scale 0.3→1.2→1→1.5, opacity 0→1→1→0, 1.2s */}
          <motion.img
            src="/assets/efecto_boom_poder_activado.png"
            alt=""
            draggable={false}
            initial={{ scale: 0.3, opacity: 0 }}
            animate={{ scale: [0.3, 1.2, 1, 1.5], opacity: [0, 1, 1, 0] }}
            transition={{ duration: 1.2, times: [0, 0.35, 0.6, 1], ease: 'easeOut' }}
            className="boom-image"
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
