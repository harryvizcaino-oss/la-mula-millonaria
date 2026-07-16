import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useEventStore } from '@/store/eventStore';

function formatCountdown(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

const MILESTONE_PCTS = [25, 50, 75, 100];

export function GlobalEventBanner() {
  const activeEvent = useEventStore((s) => s.activeEvent);
  const lastResult = useEventStore((s) => s.lastResult);
  const clearResult = useEventStore((s) => s.clearResult);

  const [expanded, setExpanded] = useState(true);
  const [now, setNow] = useState(Date.now());

  // Countdown
  useEffect(() => {
    if (!activeEvent) return;
    const iv = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(iv);
  }, [activeEvent]);

  // Anuncio grande 5s, luego minimiza a pill
  useEffect(() => {
    if (!activeEvent) return;
    setExpanded(true);
    const t = setTimeout(() => setExpanded(false), 5000);
    return () => clearTimeout(t);
  }, [activeEvent?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Resultado: se muestra 5s
  useEffect(() => {
    if (!lastResult) return;
    const t = setTimeout(() => clearResult(), 5000);
    return () => clearTimeout(t);
  }, [lastResult, clearResult]);

  const progressPct = activeEvent
    ? Math.min(100, (activeEvent.progress / activeEvent.goal) * 100)
    : 0;

  const confetti = useMemo(
    () =>
      lastResult?.success
        ? Array.from({ length: 30 }, (_, i) => ({
            id: i,
            left: `${(i * 37.3) % 100}%`,
            color: ['#FDE047', '#F59E0B', '#EF4444', '#3B82F6', '#22C55E'][i % 5],
            dur: `${2.5 + ((i * 7) % 10) / 5}s`,
            delay: `${((i * 11) % 14) / 10}s`,
          }))
        : [],
    [lastResult]
  );

  return (
    <>
      {/* Banner expandido */}
      <AnimatePresence>
        {activeEvent && expanded && (
          <motion.div
            key={`banner-${activeEvent.id}`}
            exit={{ opacity: 0, y: -40 }}
            className="event-banner fixed top-16 inset-x-3 z-40 rounded-2xl border-b-4 p-4 cursor-pointer backdrop-blur-md"
            style={{
              backgroundColor: 'rgba(13,14,20,0.88)',
              borderColor: activeEvent.color,
            }}
            onClick={() => setExpanded(false)}
          >
            <div className="flex items-center gap-3">
              <span className="text-[40px] leading-none">{activeEvent.emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p
                    className="font-baloo font-extrabold text-2xl leading-tight truncate"
                    style={{ color: activeEvent.color }}
                  >
                    {activeEvent.name}
                  </p>
                  <span className="flex items-center gap-1 text-[10px] font-black text-white bg-black/40 rounded-full px-2 py-0.5">
                    <span className="live-dot" /> EN VIVO
                  </span>
                </div>
                <p className="text-white text-sm">{activeEvent.description}</p>
              </div>
              <span className="font-mono text-[#EF4444] font-bold text-lg">
                {formatCountdown(activeEvent.endsAt - now)}
              </span>
            </div>

            {/* Progreso comunitario segmentado */}
            <div className="mt-3">
              <div className="global-progress-track">
                <div className="global-progress-fill" style={{ width: `${progressPct}%` }} />
                {MILESTONE_PCTS.map((pct) => (
                  <span
                    key={pct}
                    className={
                      progressPct >= pct
                        ? 'progress-milestone progress-milestone--hit'
                        : 'progress-milestone'
                    }
                    style={{ left: `${pct}%` }}
                  >
                    🎁
                  </span>
                ))}
              </div>
              <p className="text-white/70 text-[11px] mt-1 text-right">
                Progreso comunitario: {Math.floor(activeEvent.progress).toLocaleString('es-CO')} /{' '}
                {activeEvent.goal.toLocaleString('es-CO')}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pill minimizado */}
      <AnimatePresence>
        {activeEvent && !expanded && (
          <motion.button
            key={`pill-${activeEvent.id}`}
            exit={{ opacity: 0, scale: 0.5 }}
            className="event-pill fixed top-16 right-3 z-40 h-10 rounded-full flex items-center gap-2 px-3 border-2 backdrop-blur-md"
            style={{
              background: `linear-gradient(90deg, ${activeEvent.color}CC, ${activeEvent.color}88)`,
              borderColor: 'rgba(255,255,255,0.7)',
            }}
            onClick={() => setExpanded(true)}
          >
            <span className="live-dot" />
            <span className="text-lg leading-none">{activeEvent.emoji}</span>
            <span className="font-mono text-white font-bold text-sm">
              {formatCountdown(activeEvent.endsAt - now)}
            </span>
            <span className="w-14 h-1.5 rounded-full bg-black/40 overflow-hidden">
              <span
                className="block h-full rounded-full bg-white transition-all duration-500"
                style={{ width: `${progressPct}%` }}
              />
            </span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Resultado del evento */}
      <AnimatePresence>
        {lastResult && (
          <motion.div
            key={`result-${lastResult.id}`}
            initial={{ opacity: 0, scale: 0.8, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, y: -30 }}
            className="fixed top-16 inset-x-6 z-40 rounded-2xl p-4 text-center border-2 backdrop-blur-md"
            style={{
              backgroundColor: lastResult.success ? 'rgba(120,53,15,0.92)' : 'rgba(30,41,59,0.92)',
              borderColor: lastResult.success ? '#FDE047' : '#64748B',
            }}
          >
            {lastResult.success &&
              confetti.map((c) => (
                <span
                  key={c.id}
                  className="confetti-piece"
                  style={{
                    left: c.left,
                    backgroundColor: c.color,
                    animationDuration: c.dur,
                    animationDelay: c.delay,
                    position: 'fixed',
                  }}
                />
              ))}
            <p
              className="font-baloo font-extrabold text-2xl"
              style={{ color: lastResult.success ? '#FDE047' : '#CBD5E1' }}
            >
              {lastResult.success ? '¡EVENTO COMPLETADO!' : 'Evento Finalizado'}
            </p>
            <p className="text-white/80 text-sm mt-1">
              {lastResult.name} — +{lastResult.rewardMillas.toLocaleString('es-CO')} km
              {lastResult.rewardTickets > 0 ? ` +${lastResult.rewardTickets} 🎟️` : ''}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
