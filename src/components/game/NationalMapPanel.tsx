import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Lock, MapPin, Radio, Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRouteStore } from '@/store/routeStore';
import { computeRouteBonus, ROUTE_CITIES } from '@/data/routes';
import { useEventStore } from '@/store/eventStore';
import { liveCommunity, useGlobalChallengeStore } from '@/store/globalChallengeStore';

function formatNumber(n: number): string {
  if (n < 1000) return n.toLocaleString('es-CO', { maximumFractionDigits: 0 });
  if (n < 1_000_000) return `${(n / 1000).toFixed(n < 10_000 ? 1 : 0)}K`;
  if (n < 1_000_000_000) return `${(n / 1_000_000).toFixed(n < 10_000_000 ? 2 : 1)}M`;
  if (n < 1_000_000_000_000) return `${(n / 1_000_000_000).toFixed(2)}B`;
  return `${(n / 1_000_000_000_000).toFixed(2)}T`;
}

function formatCompactPct(n: number): string {
  return `${Math.min(100, Math.max(0, n)).toFixed(0)}%`;
}

/**
 * Mapa Nacional vivo (MVP): ciudades (routes + routeStore) + banner de evento
 * activo (eventStore) y progreso semanal (globalChallengeStore).
 *
 * Drop-in: RouteMap reexporta esta vista con la misma prop `cpsTotal`.
 * Game.tsx sigue montando `<RouteMap cpsTotal={store.cpsTotal} />` en tab "Ruta".
 */
export function NationalMapPanel({ cpsTotal }: { cpsTotal: number }) {
  const currentCityId = useRouteStore((s) => s.currentCityId);
  const unlockedCityIds = useRouteStore((s) => s.unlockedCityIds);
  const setCurrentCity = useRouteStore((s) => s.setCurrentCity);

  const activeEvent = useEventStore((s) => s.activeEvent);
  const challenges = useGlobalChallengeStore((s) => s.challenges);
  const lastPassiveAt = useGlobalChallengeStore((s) => s.lastPassiveAt);
  const ensureChallenges = useGlobalChallengeStore((s) => s.ensureChallenges);

  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    ensureChallenges();
  }, [ensureChallenges]);

  useEffect(() => {
    if (!activeEvent && challenges.length === 0) return;
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [activeEvent, challenges.length]);

  const totalBonusPct = Math.round((computeRouteBonus(unlockedCityIds) - 1) * 100);

  const currentCity = ROUTE_CITIES.find((c) => c.id === currentCityId) ?? ROUTE_CITIES[0];
  const nextLocked = ROUTE_CITIES.find((c) => !unlockedCityIds.includes(c.id));

  const eventRemainingSec = activeEvent
    ? Math.max(0, Math.ceil((activeEvent.endsAt - now) / 1000))
    : 0;
  const eventPct = activeEvent
    ? Math.min(100, (activeEvent.progress / activeEvent.goal) * 100)
    : 0;

  const challengeSnapshots = useMemo(() => {
    return challenges.map((ch) => {
      const community = liveCommunity(ch, lastPassiveAt, now);
      const pct = Math.min(100, (community / ch.goal) * 100);
      return { ch, community, pct };
    });
  }, [challenges, lastPassiveAt, now]);

  const topChallenge = challengeSnapshots[0];

  return (
    <div className="rounded-2xl bg-white border-2 border-slate-200 shadow-sm p-4 space-y-4">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <h3 className="font-fredoka font-black text-lg text-slate-900 flex items-center gap-1.5">
            <MapPin size={18} className="text-[#ff3131]" />
            Mapa Nacional
          </h3>
          <span className="text-[11px] font-black text-[#16A34A] bg-[#16A34A]/10 px-2 py-1 rounded-full">
            Bonus +{totalBonusPct}%
          </span>
        </div>
        <p className="text-slate-500 text-[11px]">
          Estás en <span className="font-black text-slate-800">{currentCity.emoji} {currentCity.name}</span>
          {nextLocked ? (
            <>
              {' '}
              · Siguiente:{' '}
              <span className="font-black text-slate-700">
                {nextLocked.emoji} {nextLocked.name}
              </span>{' '}
              ({formatNumber(cpsTotal)} / {formatNumber(nextLocked.requiredCpsTotal)})
            </>
          ) : (
            <> · Ruta completa</>
          )}
        </p>
      </div>

      {/* Banner evento activo */}
      {activeEvent && eventRemainingSec > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border-2 border-[#F59E0B]/40 bg-gradient-to-r from-[#FEF3C7] to-[#FFFBEB] p-3"
        >
          <div className="flex items-start gap-2">
            <span className="text-2xl leading-none">{activeEvent.emoji}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <Radio size={12} className="text-[#B45309] shrink-0" />
                <p className="font-fredoka font-black text-sm text-[#78350F] truncate">
                  {activeEvent.name}
                </p>
                <span className="ml-auto text-[10px] font-black text-[#B45309] tabular-nums">
                  {Math.floor(eventRemainingSec / 60)}:
                  {String(eventRemainingSec % 60).padStart(2, '0')}
                </span>
              </div>
              <p className="text-[10px] text-[#92400E]/80 mt-0.5 line-clamp-1">{activeEvent.description}</p>
              <div className="mt-2 h-1.5 rounded-full bg-[#F59E0B]/20 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#F59E0B] to-[#FBBF24] transition-all"
                  style={{ width: `${eventPct}%` }}
                />
              </div>
              <p className="text-[9px] font-bold text-[#B45309] mt-1 tabular-nums">
                {Math.floor(activeEvent.progress).toLocaleString('es-CO')} /{' '}
                {activeEvent.goal.toLocaleString('es-CO')}
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Banner desafío semanal */}
      {topChallenge && (
        <div className="rounded-xl border-2 border-slate-200 bg-slate-50 p-3">
          <div className="flex items-center gap-1.5 mb-1.5">
            <Trophy size={12} className="text-[#ff3131]" />
            <p className="font-fredoka font-black text-[11px] text-slate-800 uppercase tracking-wide">
              Desafío semanal
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xl">{topChallenge.ch.emoji}</span>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-slate-800 truncate">{topChallenge.ch.title}</p>
              <div className="mt-1 h-1.5 rounded-full bg-slate-200 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#ff3131] to-[#ff4c4c] transition-all"
                  style={{ width: `${topChallenge.pct}%` }}
                />
              </div>
              <p className="text-[9px] font-bold text-slate-500 mt-0.5 tabular-nums">
                Comunidad {formatCompactPct(topChallenge.pct)} ·{' '}
                {formatNumber(topChallenge.community)} / {formatNumber(topChallenge.ch.goal)}
              </p>
            </div>
          </div>
          {challengeSnapshots.length > 1 && (
            <div className="mt-2 flex gap-1.5 flex-wrap">
              {challengeSnapshots.slice(1).map(({ ch, pct }) => (
                <span
                  key={ch.id}
                  className="text-[9px] font-bold text-slate-600 bg-white border border-slate-200 rounded-full px-2 py-0.5"
                >
                  {ch.emoji} {formatCompactPct(pct)}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Timeline ciudades */}
      <div className="relative">
        {ROUTE_CITIES.map((city, idx) => {
          const unlocked = unlockedCityIds.includes(city.id);
          const isCurrent = currentCityId === city.id;
          const isLast = idx === ROUTE_CITIES.length - 1;
          const isNext = nextLocked?.id === city.id;
          const prev = ROUTE_CITIES[idx - 1];
          const progress =
            !unlocked && prev && cpsTotal >= prev.requiredCpsTotal
              ? Math.min(1, cpsTotal / city.requiredCpsTotal)
              : unlocked
                ? 1
                : 0;

          return (
            <div key={city.id} className="relative flex gap-3">
              {!isLast && (
                <div className="absolute left-[21px] top-11 bottom-0 w-1 rounded-full bg-slate-200 overflow-hidden">
                  <div
                    className="w-full bg-gradient-to-b from-[#16A34A] to-[#4ADE80] transition-all duration-500"
                    style={{ height: `${(unlocked ? 1 : progress) * 100}%` }}
                  />
                </div>
              )}

              <div
                className={cn(
                  'relative z-10 w-11 h-11 rounded-full flex items-center justify-center text-xl flex-shrink-0 border-2 transition-all',
                  isCurrent
                    ? 'bg-gradient-to-br from-[#F59E0B] to-[#F97316] border-[#FBBF24] shadow-[0_0_16px_rgba(245,158,11,0.5)]'
                    : unlocked
                      ? 'bg-white border-[#16A34A]'
                      : isNext
                        ? 'bg-white border-[#ff3131]/50'
                        : 'bg-slate-100 border-slate-300 grayscale'
                )}
              >
                {unlocked ? city.emoji : <Lock size={16} className="text-slate-400" />}
                {isCurrent && (
                  <motion.span
                    animate={{ x: [0, 4, 0] }}
                    transition={{ duration: 1.2, repeat: Infinity }}
                    className="absolute -right-2 -top-2 text-base"
                  >
                    🚛
                  </motion.span>
                )}
              </div>

              <div className={cn('flex-1 min-w-0 pb-4', isLast && 'pb-0')}>
                <div className="flex items-center justify-between gap-2">
                  <p
                    className={cn(
                      'font-fredoka font-black text-sm',
                      unlocked ? 'text-slate-900' : 'text-slate-400'
                    )}
                  >
                    {city.name}
                    <span className="ml-1.5 text-[10px] font-black text-[#16A34A]">
                      +{city.bonusPct}%
                    </span>
                    {isNext && (
                      <span className="ml-1.5 text-[9px] font-black text-[#ff3131] uppercase">
                        Siguiente
                      </span>
                    )}
                  </p>
                  {unlocked && !isCurrent && (
                    <button
                      type="button"
                      onClick={() => setCurrentCity(city.id)}
                      className="text-[10px] font-black text-[#0D0E14] bg-[#F59E0B]/20 px-2 py-1 rounded-full hover:bg-[#F59E0B]/30 transition-colors"
                    >
                      VIAJAR
                    </button>
                  )}
                  {isCurrent && (
                    <span className="text-[10px] font-black text-[#B45309] bg-[#F59E0B]/15 px-2 py-1 rounded-full">
                      AQUÍ
                    </span>
                  )}
                </div>
                <p className={cn('text-[11px]', unlocked ? 'text-slate-500' : 'text-slate-400')}>
                  {city.description}
                </p>
                {!unlocked && (
                  <div className="mt-1.5">
                    <div className="flex justify-between text-[9px] font-bold text-slate-400 mb-0.5">
                      <span>{formatNumber(cpsTotal)}</span>
                      <span>{formatNumber(city.requiredCpsTotal)}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-slate-200 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-[#F59E0B] to-[#FBBF24] transition-all duration-500"
                        style={{ width: `${progress * 100}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
