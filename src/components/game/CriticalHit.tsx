import { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export interface CritState {
  id: number;
  x: number;
  y: number;
}

interface CriticalHitProps {
  crit: CritState | null;
}

const PARTICLE_TYPES = ['coin', 'spark', 'flame'] as const;

export function CriticalHit({ crit }: CriticalHitProps) {
  // 30 partículas en patrón starburst: monedas doradas, sparks rojos, llamas naranjas
  const particles = useMemo(() => {
    if (!crit) return [];
    return Array.from({ length: 30 }, (_, i) => {
      const angle = (i / 30) * Math.PI * 2 + Math.random() * 0.4;
      const dist = 90 + Math.random() * 130;
      const type = PARTICLE_TYPES[i % PARTICLE_TYPES.length];
      return {
        id: `${crit.id}-${i}`,
        dx: Math.cos(angle) * dist,
        dy: Math.sin(angle) * dist,
        type,
        size: type === 'spark' ? 6 + Math.random() * 4 : 16 + Math.random() * 10,
      };
    });
  }, [crit]);

  return (
    <AnimatePresence>
      {crit && (
        <>
          {/* Vignette rojo-naranja a pantalla completa */}
          <motion.div key={`vignette-${crit.id}`} className="crit-vignette" exit={{ opacity: 0 }} />

          {/* Anillos expansivos */}
          {[0, 120].map((delay) => (
            <span
              key={`ring-${crit.id}-${delay}`}
              className="crit-ring"
              style={{ left: crit.x, top: crit.y, animationDelay: `${delay}ms` }}
            />
          ))}

          {/* Partículas starburst */}
          {particles.map((p) => (
            <span
              key={p.id}
              className="crit-particle"
              style={
                {
                  left: crit.x,
                  top: crit.y,
                  '--dx': `${p.dx}px`,
                  '--dy': `${p.dy}px`,
                  fontSize: p.type === 'spark' ? undefined : p.size,
                  width: p.type === 'spark' ? p.size : undefined,
                  height: p.type === 'spark' ? p.size : undefined,
                  borderRadius: p.type === 'spark' ? 999 : undefined,
                  background:
                    p.type === 'spark'
                      ? 'radial-gradient(circle, #FCA5A5, #DC2626)'
                      : undefined,
                  boxShadow: p.type === 'spark' ? '0 0 8px rgba(239,68,68,0.9)' : undefined,
                } as React.CSSProperties
              }
            >
              {p.type === 'coin' ? '🪙' : p.type === 'flame' ? '🔥' : ''}
            </span>
          ))}

          {/* Texto CRÍTICO! — aparece tras el "freeze" de 50ms */}
          <motion.span
            key={`text-${crit.id}`}
            className="crit-text"
            style={{ left: crit.x, top: crit.y, animationDelay: '50ms' }}
            exit={{ opacity: 0 }}
          >
            ¡CRÍTICO!
          </motion.span>
        </>
      )}
    </AnimatePresence>
  );
}
