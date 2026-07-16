import { useEffect, useMemo } from 'react';
import { useUnlockStore, type PendingCinematic } from '@/store/unlockStore';

const DURATIONS: Record<PendingCinematic['type'], number> = {
  small: 3000,
  medium: 5000,
  large: 8000,
  epic: 12000,
};

const CONFETTI_COLORS = ['#FDE047', '#F59E0B', '#EF4444', '#3B82F6', '#22C55E', '#A855F7'];

function useConfetti(count: number, active: boolean) {
  return useMemo(
    () =>
      active
        ? Array.from({ length: count }, (_, i) => ({
            id: i,
            left: `${(i * 37.9) % 100}%`,
            color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
            dur: `${2 + ((i * 13) % 10) / 5}s`,
            delay: `${((i * 7) % 16) / 10}s`,
          }))
        : [],
    [count, active]
  );
}

function Letters({ text, startDelay = 0 }: { text: string; startDelay?: number }) {
  return (
    <span aria-label={text}>
      {text.split('').map((ch, i) => (
        <span
          key={i}
          className="unlock-letter"
          style={{ animationDelay: `${startDelay + i * 90}ms` }}
        >
          {ch === ' ' ? ' ' : ch}
        </span>
      ))}
    </span>
  );
}

export function UnlockCinematic() {
  const pendingCinematic = useUnlockStore((s) => s.pendingCinematic);
  const clearCinematic = useUnlockStore((s) => s.clearCinematic);

  useEffect(() => {
    if (!pendingCinematic) return;
    const t = setTimeout(() => clearCinematic(), DURATIONS[pendingCinematic.type]);
    return () => clearTimeout(t);
  }, [pendingCinematic, clearCinematic]);

  const confetti = useConfetti(30, !!pendingCinematic);
  const stars = useMemo(
    () =>
      pendingCinematic?.type === 'epic'
        ? Array.from({ length: 40 }, (_, i) => ({
            id: i,
            left: `${(i * 37.7) % 100}%`,
            top: `${(i * 53.3) % 100}%`,
            dur: `${1.6 + ((i * 7) % 10) / 4}s`,
          }))
        : [],
    [pendingCinematic]
  );
  const goldParticles = useMemo(
    () =>
      pendingCinematic?.type === 'epic'
        ? Array.from({ length: 24 }, (_, i) => ({
            id: i,
            left: `${8 + ((i * 39.1) % 84)}%`,
            top: `${55 + ((i * 17) % 35)}%`,
            dur: `${2 + ((i * 5) % 10) / 4}s`,
            delay: `${3200 + ((i * 13) % 20) * 100}ms`,
          }))
        : [],
    [pendingCinematic]
  );

  if (!pendingCinematic) return null;
  const { type, title, reward } = pendingCinematic;

  return (
    <div className="cinematic-overlay" onClick={clearCinematic}>
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

      {/* PEQUEÑA: modal con borde dorado + trofeo girando */}
      {type === 'small' && (
        <div className="relative mx-6 max-w-sm w-full rounded-3xl border-4 border-[#FACC15] bg-gradient-to-b from-[#1c1917] to-[#0c0a09] p-6 text-center shadow-[0_0_40px_rgba(250,204,21,0.4)]">
          <span className="unlock-trophy-spin text-6xl">🏆</span>
          <h3 className="font-baloo font-extrabold text-[32px] text-[#FDE047] mt-3">
            ¡DESBLOQUEADO!
          </h3>
          <p className="text-white font-bold mt-1">{title}</p>
          <p className="text-[#FDE68A] text-sm mt-1">{reward}</p>
        </div>
      )}

      {/* MEDIANA: item aparece al centro con glow y rotación lenta */}
      {type === 'medium' && (
        <div className="relative flex flex-col items-center text-center px-6">
          <span className="unlock-glow-item text-[7rem] leading-none drop-shadow-[0_0_30px_rgba(250,204,21,0.9)]">
            🛣️
          </span>
          <h3 className="font-baloo font-extrabold text-3xl text-[#FDE047] mt-4">
            ¡DESBLOQUEADO!
          </h3>
          <p className="text-white font-bold mt-1">{title}</p>
          <p className="text-[#FDE68A] text-sm mt-1">{reward}</p>
        </div>
      )}

      {/* GRANDE: spotlight + descenso + rayos + título letra por letra */}
      {type === 'large' && (
        <div className="absolute inset-0">
          <div className="unlock-spotlight" />
          <div className="unlock-rays" />
          <div className="relative z-10 flex flex-col items-center justify-center h-full gap-4 px-6 text-center">
            <div className="unlock-descend flex flex-col items-center">
              <span className="text-4xl">🪂</span>
              <span className="text-[7rem] leading-none drop-shadow-[0_0_36px_rgba(250,204,21,0.95)]">
                🚛
              </span>
            </div>
            <h3 className="font-baloo font-extrabold text-4xl text-[#FDE047]">
              <Letters text="LOGRO ÉPICO" startDelay={1800} />
            </h3>
            <p className="text-white font-bold">{title}</p>
            <p className="text-[#FDE68A] text-sm">{reward}</p>
          </div>
        </div>
      )}

      {/* ÉPICA: estrellas → portal dorado → item legendario → LEYENDA 3D */}
      {type === 'epic' && (
        <div className="absolute inset-0 bg-black">
          <div className="starfield">
            {stars.map((s) => (
              <span
                key={s.id}
                className="starfield-star"
                style={{ left: s.left, top: s.top, animationDuration: s.dur }}
              />
            ))}
          </div>
          <div className="unlock-portal" />
          {goldParticles.map((p) => (
            <span
              key={p.id}
              className="gold-particle"
              style={{
                left: p.left,
                top: p.top,
                animationDuration: p.dur,
                animationDelay: p.delay,
              }}
            />
          ))}
          <div className="relative z-10 flex flex-col items-center justify-center h-full gap-4 px-6 text-center">
            <span
              className="unlock-glow-item text-[8rem] leading-none drop-shadow-[0_0_50px_rgba(250,204,21,1)]"
              style={{ animationDelay: '2.4s' }}
            >
              👑
            </span>
            <h3 className="legend-text">
              <Letters text="LEYENDA" startDelay={3600} />
            </h3>
            <p className="text-white font-bold">{title}</p>
            <p className="text-[#FDE68A] text-sm">{reward}</p>
          </div>
        </div>
      )}

      <button className="cinematic-skip" onClick={clearCinematic}>
        Tocar para saltar
      </button>
    </div>
  );
}
