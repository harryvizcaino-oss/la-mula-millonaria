import { useEffect, useMemo, useRef, useState } from 'react';

type Phase = 'countdown' | 'launch' | 'space' | 'land' | 'fade';

interface AscensionCinematicProps {
  ascension: number; // número de ascensión que se está completando (1-based)
  onAscend: () => void; // se llama al entrar en la fase espacial (aplica el reset)
  onComplete: () => void; // se llama al terminar (cierra el overlay)
}

const CONFETTI_COLORS = ['#FDE047', '#F59E0B', '#EF4444', '#3B82F6', '#22C55E', '#A855F7'];

export function AscensionCinematic({ ascension, onAscend, onComplete }: AscensionCinematicProps) {
  const [phase, setPhase] = useState<Phase>('countdown');
  const [count, setCount] = useState(3);
  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const ascendFiredRef = useRef(false);

  const fireAscend = () => {
    if (!ascendFiredRef.current) {
      ascendFiredRef.current = true;
      onAscend();
    }
  };

  useEffect(() => {
    const t = timeoutsRef.current;
    const schedule = (fn: () => void, ms: number) => {
      t.push(setTimeout(fn, ms));
    };

    // Cuenta regresiva 3-2-1
    schedule(() => setCount(2), 1000);
    schedule(() => setCount(1), 2000);
    // Lanzamiento
    schedule(() => setPhase('launch'), 2900);
    // Espacio: camión dorado desciende + aplica ascensión
    schedule(() => {
      setPhase('space');
      fireAscend();
    }, 4100);
    // Aterrizaje + celebración
    schedule(() => setPhase('land'), 6600);
    // Vuelta a la normalidad
    schedule(() => setPhase('fade'), 10100);
    schedule(() => onComplete(), 10600);

    return () => {
      t.forEach(clearTimeout);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const skip = () => {
    timeoutsRef.current.forEach(clearTimeout);
    fireAscend();
    onComplete();
  };

  const stars = useMemo(
    () =>
      Array.from({ length: 40 }, (_, i) => ({
        id: i,
        left: `${(i * 37.7) % 100}%`,
        top: `${(i * 53.3) % 100}%`,
        dur: `${1.6 + ((i * 7) % 10) / 4}s`,
        delay: `${((i * 13) % 20) / 10}s`,
        scale: i % 5 === 0 ? 1.8 : 1,
      })),
    []
  );

  const confetti = useMemo(
    () =>
      Array.from({ length: 30 }, (_, i) => ({
        id: i,
        left: `${(i * 41.3) % 100}%`,
        color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
        dur: `${2.2 + ((i * 11) % 10) / 6}s`,
        delay: `${((i * 7) % 12) / 10}s`,
      })),
    []
  );

  const showSpace = phase === 'space' || phase === 'land' || phase === 'fade';

  return (
    <div
      className={phase === 'launch' ? 'ascend-overlay ascend-shake' : 'ascend-overlay'}
      style={phase === 'fade' ? { opacity: 0, transition: 'opacity 500ms' } : undefined}
      onClick={skip}
    >
      {showSpace && (
        <div className="starfield">
          {stars.map((s) => (
            <span
              key={s.id}
              className="starfield-star"
              style={{
                left: s.left,
                top: s.top,
                animationDuration: s.dur,
                animationDelay: s.delay,
                transform: `scale(${s.scale})`,
              }}
            />
          ))}
        </div>
      )}

      {phase === 'countdown' && (
        <div className="relative z-10 flex items-center justify-center">
          <span key={count} className="ascend-count">
            {count}
          </span>
        </div>
      )}

      {phase === 'launch' && (
        <div className="relative z-10 flex items-center justify-center h-full">
          <div className="ascend-truck-launch relative">
            <span className="text-[8rem] leading-none">🚛</span>
            <div className="ascend-fire-trail" />
          </div>
        </div>
      )}

      {phase === 'space' && (
        <div className="relative z-10 flex flex-col items-center justify-center h-full">
          <div className="golden-truck-descend flex flex-col items-center">
            <span className="text-5xl">🪂</span>
            <span className="golden-truck text-[8rem] leading-none">🚛</span>
          </div>
        </div>
      )}

      {(phase === 'land' || phase === 'fade') && (
        <div className="relative z-10 flex flex-col items-center justify-center h-full gap-3">
          {confetti.map((c) => (
            <span
              key={c.id}
              className="confetti-piece"
              style={{
                left: c.left,
                backgroundColor: c.color,
                animationDuration: c.dur,
                animationDelay: c.delay,
              }}
            />
          ))}
          <span className="golden-truck text-[7rem] leading-none">🚛</span>
          <h2 className="font-baloo font-extrabold text-4xl text-[#FDE047] drop-shadow-[0_0_18px_rgba(250,204,21,0.8)] text-center px-6">
            ¡ASCENSIÓN COMPLETA!
          </h2>
          <div className="ascension-badge text-lg">⭐ x{ascension}</div>
          <p className="text-[#FDE68A] font-bold">Producción +10%</p>
        </div>
      )}

      <button className="cinematic-skip" onClick={skip}>
        Tocar para saltar
      </button>
    </div>
  );
}
