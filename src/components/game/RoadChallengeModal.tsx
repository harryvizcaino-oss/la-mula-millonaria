import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mountain, X } from 'lucide-react';
import confetti from 'canvas-confetti';
import { cn } from '@/lib/utils';
import {
  FREE_ROAD_CHALLENGES_PER_DAY,
  ROAD_CHALLENGES,
  ROAD_TICKET_COST,
  getRoadChallenge,
  getRoadSegment,
  type RoadChallengeKind,
} from '@/data/roadChallenges';
import { getRouteCity } from '@/data/routes';
import { getTruckAsset } from '@/data/truckAssets';
import { calculateClickPower, useClickerStore } from '@/store/clickerStore';
import { usePowerupStore, POWERUP_IDS } from '@/store/powerupStore';
import { useCollectibleStore, type CollectibleDrop } from '@/store/collectibleStore';
import { useMillas } from '@/providers/MillasProvider';
import {
  useRoadChallengeStore,
  type RoadChallengeReward,
  type RoadTier,
} from '@/store/roadChallengeStore';

type View = 'play' | 'result';

export interface RoadChallengeOpen {
  /** Tramo del mapa (gratis si canPlayFree). */
  segmentId?: string;
  /** Forzar mecánica (menú 🎮). */
  kind?: RoadChallengeKind;
  /** true = gasta 1 🎟️. */
  paid?: boolean;
}

interface Props {
  open: RoadChallengeOpen | null;
  onClose: () => void;
}

const formatNumber = (n: number) => Math.floor(n).toLocaleString('es-CO');

function randomPowerup(): (typeof POWERUP_IDS)[number] {
  return POWERUP_IDS[Math.floor(Math.random() * POWERUP_IDS.length)];
}

/* ─── Climb: hold/tap to fill altitude ─── */
function ClimbGame({
  truckSrc,
  onFinish,
}: {
  truckSrc: string;
  onFinish: (tier: RoadTier) => void;
}) {
  const [alt, setAlt] = useState(8);
  const altRef = useRef(8);
  const pressing = useRef(false);
  const done = useRef(false);

  useEffect(() => {
    const started = Date.now();
    const id = window.setInterval(() => {
      if (done.current) return;
      let next = altRef.current;
      if (pressing.current) next = Math.min(100, next + 2.4);
      else next = Math.max(0, next - 1.1);
      altRef.current = next;
      setAlt(next);
      if (next >= 100) {
        done.current = true;
        const elapsed = Date.now() - started;
        onFinish(elapsed < 22_000 ? 'perfect' : 'ok');
      }
    }, 50);
    const failTimer = window.setTimeout(() => {
      if (done.current) return;
      done.current = true;
      const a = altRef.current;
      onFinish(a >= 70 ? 'ok' : 'fail');
    }, 45_000);
    return () => {
      clearInterval(id);
      clearTimeout(failTimer);
    };
  }, [onFinish]);

  const bind = {
    onPointerDown: () => {
      pressing.current = true;
    },
    onPointerUp: () => {
      pressing.current = false;
    },
    onPointerLeave: () => {
      pressing.current = false;
    },
  };

  return (
    <div className="text-center">
      <p className="text-slate-400 text-xs mb-2">Mantén pulsado para subir · 45 s máx</p>
      <div className="relative h-48 rounded-2xl overflow-hidden bg-gradient-to-b from-[#1e3a5f] via-[#3d5a40] to-[#5c4033] border border-white/10 mb-4">
        <div
          className="absolute left-1/2 -translate-x-1/2 transition-all duration-75"
          style={{ bottom: `${Math.max(4, alt * 0.85)}%` }}
        >
          <img src={truckSrc} alt="Mula" className="h-16 object-contain drop-shadow-lg" draggable={false} />
        </div>
        <div className="absolute right-3 top-3 bottom-3 w-2.5 rounded-full bg-black/40 overflow-hidden">
          <div
            className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-[#F59E0B] to-[#FBBF24] transition-all duration-75"
            style={{ height: `${alt}%` }}
          />
        </div>
        <p className="absolute left-3 top-3 text-[10px] font-black text-white/80">CIMA</p>
      </div>
      <button
        type="button"
        {...bind}
        className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#F59E0B] to-[#FBBF24] text-[#0D0E14] font-fredoka font-black text-lg select-none touch-none"
      >
        ACELERAR
      </button>
      <p className="text-[10px] text-slate-500 mt-2 tabular-nums">{Math.floor(alt)}% altura</p>
    </div>
  );
}

/* ─── Descent: green zone brake (3 tries) ─── */
function DescentGame({ onFinish }: { onFinish: (tier: RoadTier) => void }) {
  const [attempt, setAttempt] = useState(0);
  const [hits, setHits] = useState(0);
  const [zone, setZone] = useState(() => 30 + Math.random() * 40);
  const [pos, setPos] = useState(0);
  const [stopped, setStopped] = useState<'hit' | 'miss' | null>(null);
  const posRef = useRef(0);
  const rafRef = useRef(0);

  useEffect(() => {
    if (stopped) return;
    const speed = 0.0035 + attempt * 0.0012;
    const start = performance.now();
    const tick = (t: number) => {
      posRef.current = ((Math.sin((t - start) * speed) + 1) / 2) * 100;
      setPos(posRef.current);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [attempt, stopped]);

  const handleStop = () => {
    if (stopped) return;
    const isHit = Math.abs(posRef.current - zone) <= 8;
    const newHits = hits + (isHit ? 1 : 0);
    setStopped(isHit ? 'hit' : 'miss');
    setHits(newHits);
    window.setTimeout(() => {
      if (attempt >= 2) {
        onFinish(newHits >= 3 ? 'perfect' : newHits >= 1 ? 'ok' : 'fail');
      } else {
        setAttempt(attempt + 1);
        setZone(30 + Math.random() * 40);
        setStopped(null);
      }
    }, 600);
  };

  return (
    <div className="text-center">
      <p className="text-slate-400 text-xs mb-1">
        Intento {attempt + 1}/3 · aciertos {hits}
      </p>
      <h3 className="font-fredoka font-bold text-white mb-4">¡Frena en la zona verde!</h3>
      <div className="relative h-12 rounded-full bg-slate-800 border border-white/10 overflow-hidden mb-5">
        <div
          className="absolute top-0 bottom-0 bg-[#22C55E]/40 border-x-2 border-[#22C55E]"
          style={{ left: `${zone - 8}%`, width: '16%' }}
        />
        <div
          className={cn(
            'absolute top-1 bottom-1 w-3 rounded-full',
            stopped === 'hit' ? 'bg-[#22C55E]' : stopped === 'miss' ? 'bg-[#EF4444]' : 'bg-[#F59E0B]',
          )}
          style={{ left: `calc(${pos}% - 6px)` }}
        />
      </div>
      <button
        type="button"
        onClick={handleStop}
        disabled={!!stopped}
        className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#F59E0B] to-[#FBBF24] text-[#0D0E14] font-fredoka font-black text-lg disabled:opacity-50"
      >
        FRENAR
      </button>
    </div>
  );
}

/* ─── Toll: ordered taps ─── */
const TOLL_STEPS = [
  { id: 'placa', label: 'PLACA', emoji: '🔢' },
  { id: 'efectivo', label: 'EFECTIVO', emoji: '💵' },
  { id: 'listo', label: 'LISTO', emoji: '✅' },
] as const;

function TollGame({ onFinish }: { onFinish: (tier: RoadTier) => void }) {
  const [step, setStep] = useState(0);
  const [wrong, setWrong] = useState(0);
  const [shuffled, setShuffled] = useState(() =>
    [...TOLL_STEPS].sort(() => Math.random() - 0.5),
  );
  const started = useRef(Date.now());
  const done = useRef(false);
  const stepRef = useRef(0);

  useEffect(() => {
    const t = window.setTimeout(() => {
      if (done.current) return;
      done.current = true;
      onFinish(stepRef.current >= 3 ? 'ok' : 'fail');
    }, 35_000);
    return () => clearTimeout(t);
  }, [onFinish]);

  const tap = (id: string) => {
    if (done.current) return;
    const expected = TOLL_STEPS[step]?.id;
    if (id === expected) {
      const next = step + 1;
      stepRef.current = next;
      setStep(next);
      setShuffled([...TOLL_STEPS].sort(() => Math.random() - 0.5));
      if (next >= 3) {
        done.current = true;
        const elapsed = Date.now() - started.current;
        onFinish(elapsed < 12_000 && wrong === 0 ? 'perfect' : 'ok');
      }
    } else {
      setWrong((w) => w + 1);
    }
  };

  return (
    <div className="text-center">
      <p className="text-slate-400 text-xs mb-2">
        Orden: Placa → Efectivo → Listo · errores {wrong}
      </p>
      <p className="font-fredoka font-bold text-white mb-4">
        Siguiente: {TOLL_STEPS[step]?.emoji} {TOLL_STEPS[step]?.label ?? '—'}
      </p>
      <div className="grid grid-cols-3 gap-2">
        {shuffled.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => tap(s.id)}
            className="py-4 rounded-2xl bg-slate-800 border border-white/10 text-white font-fredoka font-bold text-xs active:scale-95"
          >
            <span className="text-2xl block mb-1">{s.emoji}</span>
            {s.label}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ─── Storm: left/right dodge ─── */
function StormGame({ onFinish }: { onFinish: (tier: RoadTier) => void }) {
  const [lane, setLane] = useState<'L' | 'R'>('L');
  const [hazard, setHazard] = useState<'L' | 'R' | null>(null);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const scoreRef = useRef(0);
  const livesRef = useRef(3);
  const laneRef = useRef<'L' | 'R'>('L');

  useEffect(() => {
    laneRef.current = lane;
  }, [lane]);

  useEffect(() => {
    const spawn = window.setInterval(() => {
      const side: 'L' | 'R' = Math.random() < 0.5 ? 'L' : 'R';
      setHazard(side);
      window.setTimeout(() => {
        if (laneRef.current === side) {
          livesRef.current -= 1;
          setLives(livesRef.current);
          if (livesRef.current <= 0) {
            clearInterval(spawn);
            onFinish(scoreRef.current >= 8 ? 'ok' : 'fail');
          }
        } else {
          scoreRef.current += 1;
          setScore(scoreRef.current);
        }
        setHazard(null);
      }, 900);
    }, 1400);
    const end = window.setTimeout(() => {
      clearInterval(spawn);
      const s = scoreRef.current;
      onFinish(s >= 12 ? 'perfect' : s >= 6 ? 'ok' : 'fail');
    }, 40_000);
    return () => {
      clearInterval(spawn);
      clearTimeout(end);
    };
  }, [onFinish]);

  return (
    <div className="text-center">
      <p className="text-slate-400 text-xs mb-2">
        Esquiva charcos · score {score} · vidas {lives}
      </p>
      <div className="relative h-40 rounded-2xl bg-slate-800 border border-white/10 mb-4 flex">
        {(['L', 'R'] as const).map((side) => (
          <button
            key={side}
            type="button"
            onClick={() => setLane(side)}
            className={cn(
              'flex-1 relative transition-colors',
              lane === side ? 'bg-[#F59E0B]/15' : 'bg-transparent',
            )}
          >
            {hazard === side && (
              <span className="absolute inset-x-4 top-6 text-3xl animate-bounce">💧</span>
            )}
            {lane === side && (
              <span className="absolute bottom-4 left-1/2 -translate-x-1/2 text-2xl">🚛</span>
            )}
            <span className="absolute top-2 left-1/2 -translate-x-1/2 text-[10px] font-black text-slate-500">
              {side === 'L' ? 'IZQ' : 'DER'}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ─── Port: click burst 8s ─── */
function PortGame({ onFinish }: { onFinish: (tier: RoadTier) => void }) {
  const [clicks, setClicks] = useState(0);
  const [left, setLeft] = useState(8);
  const clicksRef = useRef(0);
  const finished = useRef(false);

  useEffect(() => {
    const start = Date.now();
    const tick = window.setInterval(() => {
      const sec = Math.max(0, 8 - (Date.now() - start) / 1000);
      setLeft(sec);
      if (sec <= 0 && !finished.current) {
        finished.current = true;
        const c = clicksRef.current;
        onFinish(c >= 50 ? 'perfect' : c >= 25 ? 'ok' : 'fail');
      }
    }, 100);
    return () => clearInterval(tick);
  }, [onFinish]);

  return (
    <div className="text-center">
      <p className="text-slate-400 text-xs mb-1">{left.toFixed(1)}s · {clicks} clicks</p>
      <button
        type="button"
        onClick={() => {
          clicksRef.current += 1;
          setClicks(clicksRef.current);
        }}
        className="w-full h-40 rounded-2xl bg-gradient-to-br from-[#0ea5e9]/30 to-[#0369a1]/40 border border-[#38bdf8]/40 text-white font-fredoka font-black text-xl active:scale-[0.98]"
      >
        DESCARGAR
      </button>
    </div>
  );
}

/* ─── Modal ─── */
export function RoadChallengeModal({ open, onClose }: Props) {
  const { addMillas } = useMillas();
  const selectedFleet = useClickerStore((s) => s.selectedFleet);
  const store = useClickerStore();
  const addPowerup = usePowerupStore((s) => s.addPowerup);
  const road = useRoadChallengeStore();

  const [view, setView] = useState<View>('play');
  const [reward, setReward] = useState<RoadChallengeReward | null>(null);
  const [drop, setDrop] = useState<CollectibleDrop | null>(null);
  const [paidOk, setPaidOk] = useState(false);
  const startedRef = useRef(false);
  const finishedRef = useRef(false);

  const segment = open?.segmentId ? getRoadSegment(open.segmentId) : undefined;
  const kind: RoadChallengeKind | undefined =
    open?.kind ?? segment?.challengeId;
  const def = kind ? getRoadChallenge(kind) : undefined;
  const fromName = segment ? getRouteCity(segment.fromCityId)?.name : undefined;
  const toName = segment ? getRouteCity(segment.toCityId)?.name : undefined;
  const truckSrc = getTruckAsset(selectedFleet);

  useEffect(() => {
    if (!open) {
      startedRef.current = false;
      finishedRef.current = false;
      setView('play');
      setReward(null);
      setDrop(null);
      setPaidOk(false);
      return;
    }
    road.ensureDay();
    if (open.paid && !startedRef.current) {
      const r = store.spendGoldenTickets(ROAD_TICKET_COST);
      if (!r.success) {
        onClose();
        return;
      }
      setPaidOk(true);
      startedRef.current = true;
    } else if (!open.paid && open.segmentId && !startedRef.current) {
      if (!road.canPlayFree(open.segmentId)) {
        onClose();
        return;
      }
      road.markFreePlay(open.segmentId);
      startedRef.current = true;
    } else {
      startedRef.current = true;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const finish = useCallback(
    (tier: RoadTier) => {
      if (!kind || finishedRef.current) return;
      finishedRef.current = true;
      const clickPower = calculateClickPower(useClickerStore.getState());
      let firstClear = false;
      if (segment && tier !== 'fail') {
        firstClear = road.markFirstClear(segment.id);
        if (firstClear) road.grantBuff();
      }
      const r = road.buildReward(tier, kind, firstClear, clickPower);
      if (r.millas > 0) addMillas(r.millas);
      if (r.cps > 0) store.addEarnings(r.cps);
      if (r.tickets > 0) store.addGoldenTickets(r.tickets);
      if (r.powerup) addPowerup(randomPowerup(), 1);
      setDrop(useCollectibleStore.getState().rollDrop(0.35));
      if (tier !== 'fail') {
        confetti({
          particleCount: 40,
          spread: 65,
          origin: { y: 0.55 },
          colors: ['#FFD700', '#F59E0B', '#22C55E'],
        });
      }
      setReward(r);
      setView('result');
    },
    [kind, segment, road, addMillas, store, addPowerup],
  );

  if (!open || !def || !kind) return null;

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] bg-black/75 backdrop-blur-sm"
            onClick={view === 'result' ? onClose : undefined}
          />
          <motion.div
            initial={{ opacity: 0, y: 48 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 48 }}
            transition={{ type: 'spring', stiffness: 280, damping: 26 }}
            className="fixed inset-x-3 bottom-3 top-[12%] z-[71] max-w-md mx-auto rounded-3xl bg-[#1A1B26] border border-white/10 p-5 shadow-2xl flex flex-col"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 min-w-0">
                <Mountain size={18} className="text-[#F59E0B] shrink-0" />
                <div className="min-w-0">
                  <h2 className="font-fredoka font-bold text-lg text-white truncate">
                    {def.emoji} {def.name}
                  </h2>
                  <p className="text-[10px] text-slate-400 truncate">
                    {segment
                      ? `${segment.title} · ${fromName} → ${toName}`
                      : paidOk
                        ? `Replay · ${ROAD_TICKET_COST} 🎟️`
                        : 'Reto de vía'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-full hover:bg-white/10"
              >
                <X size={18} className="text-slate-400" />
              </button>
            </div>

            {view === 'play' && (
              <div className="flex-1 overflow-y-auto">
                <p className="text-slate-400 text-xs mb-4">{def.blurb}</p>
                {kind === 'climb' && <ClimbGame truckSrc={truckSrc} onFinish={finish} />}
                {kind === 'descent' && <DescentGame onFinish={finish} />}
                {kind === 'toll' && <TollGame onFinish={finish} />}
                {kind === 'storm' && <StormGame onFinish={finish} />}
                {kind === 'port' && <PortGame onFinish={finish} />}
              </div>
            )}

            {view === 'result' && reward && (
              <div className="text-center flex-1 flex flex-col justify-center">
                <p className="text-4xl mb-2">{reward.tier === 'fail' ? '😅' : '🏆'}</p>
                <h3 className="font-fredoka font-bold text-lg text-white mb-1">{reward.summary}</h3>
                {reward.firstClearBuff && (
                  <p className="text-[11px] text-[#F59E0B] font-bold mb-2">
                    Buff +1% CPS · 10 min en la carretera
                  </p>
                )}
                <div className="grid grid-cols-2 gap-2 my-4">
                  {reward.millas > 0 && (
                    <div className="bg-slate-800/60 rounded-xl p-2">
                      <p className="font-fredoka font-bold text-[#F59E0B]">
                        +{formatNumber(reward.millas)}
                      </p>
                      <p className="text-[10px] text-slate-400">Millas</p>
                    </div>
                  )}
                  {reward.cps > 0 && (
                    <div className="bg-slate-800/60 rounded-xl p-2">
                      <p className="font-fredoka font-bold text-[#22C55E]">
                        +{formatNumber(reward.cps)}
                      </p>
                      <p className="text-[10px] text-slate-400">CPS</p>
                    </div>
                  )}
                  {reward.tickets > 0 && (
                    <div className="bg-slate-800/60 rounded-xl p-2">
                      <p className="font-fredoka font-bold text-[#EF4444]">+{reward.tickets} 🎟️</p>
                      <p className="text-[10px] text-slate-400">Tickets</p>
                    </div>
                  )}
                  {reward.powerup && (
                    <div className="bg-slate-800/60 rounded-xl p-2">
                      <p className="font-fredoka font-bold text-[#A855F7]">+1 Power-up</p>
                      <p className="text-[10px] text-slate-400">Inventario</p>
                    </div>
                  )}
                  {drop?.isNew && (
                    <div className="bg-slate-800/60 rounded-xl p-2 col-span-2">
                      <p className="font-fredoka font-bold text-[#EC4899]">
                        {drop.def.emoji} {drop.def.name}
                      </p>
                      <p className="text-[10px] text-slate-400">Coleccionable</p>
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full py-3 rounded-2xl bg-gradient-to-r from-[#F59E0B] to-[#FBBF24] text-[#0D0E14] font-fredoka font-black"
                >
                  ¡A rodar!
                </button>
                <p className="text-[10px] text-slate-500 mt-2">
                  Gratis hoy: {road.freeRemaining()}/{FREE_ROAD_CHALLENGES_PER_DAY}
                </p>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

/** Lista para el menú de minijuegos (replay de pago). */
export function RoadChallengeMenuList({
  onPick,
  tickets,
}: {
  onPick: (kind: RoadChallengeKind) => void;
  tickets: number;
}) {
  return (
    <div className="space-y-2 mt-4 pt-4 border-t border-white/10">
      <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">
        Retos de vía · {ROAD_TICKET_COST} 🎟️
      </p>
      {ROAD_CHALLENGES.map((c) => (
        <button
          key={c.id}
          type="button"
          disabled={tickets < ROAD_TICKET_COST}
          onClick={() => onPick(c.id)}
          className="w-full flex items-center gap-3 p-3 rounded-2xl bg-slate-800/60 border border-white/10 hover:border-[#F59E0B]/50 disabled:opacity-40 text-left"
        >
          <span className="text-2xl">{c.emoji}</span>
          <div className="flex-1 min-w-0">
            <p className="font-fredoka font-bold text-white text-sm">{c.name}</p>
            <p className="text-slate-400 text-[10px] truncate">{c.blurb}</p>
          </div>
          <span className="text-[#F59E0B] text-xs font-bold shrink-0">1 🎟️</span>
        </button>
      ))}
    </div>
  );
}
