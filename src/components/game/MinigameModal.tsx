import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Gamepad2 } from 'lucide-react';
import confetti from 'canvas-confetti';
import { cn } from '@/lib/utils';
import { useClickerStore, calculateClickPower } from '@/store/clickerStore';
import { usePowerupStore, POWERUP_IDS } from '@/store/powerupStore';
import { useCollectibleStore, type CollectibleDrop } from '@/store/collectibleStore';
import { useMillas } from '@/providers/MillasProvider';

/**
 * Wave 3 (F12) — Minijuegos: Derrape y Cambio de neumático.
 * Cada partida cuesta 1 🎟️ (spendGoldenTickets). Las recompensas se aplican
 * en la capa UI: millas vía MillasProvider, CPS/tickets vía clickerStore y
 * power-ups vía powerupStore.
 */

const TICKET_COST = 1;

interface MinigameReward {
  millas: number;
  cps: number;
  tickets: number;
  powerup: string | null;
  summary: string;
}

type View = 'menu' | 'derrape' | 'tuerca' | 'result';

const formatNumber = (n: number): string => Math.floor(n).toLocaleString('es-CO');

function randomPowerup(): string {
  return POWERUP_IDS[Math.floor(Math.random() * POWERUP_IDS.length)];
}

/* ------------------------------------------------------------------ */
/*  Derrape: barra oscilante, frena en la zona verde (3 intentos)      */
/* ------------------------------------------------------------------ */
function DerrapeGame({ onFinish }: { onFinish: (hits: number) => void }) {
  const [attempt, setAttempt] = useState(0); // 0..2
  const [hits, setHits] = useState(0);
  const [zone, setZone] = useState(() => 30 + Math.random() * 40); // centro de la zona verde (%)
  const [pos, setPos] = useState(0);
  const [stopped, setStopped] = useState<'hit' | 'miss' | null>(null);
  const posRef = useRef(0);
  const rafRef = useRef(0);

  // Oscilación continua; la velocidad sube con cada intento
  useEffect(() => {
    if (stopped) return;
    const speed = 0.0035 + attempt * 0.0012;
    const start = performance.now();
    const tick = (t: number) => {
      const p = (Math.sin((t - start) * speed) + 1) / 2;
      posRef.current = p * 100;
      setPos(posRef.current);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [attempt, stopped]);

  const handleStop = () => {
    if (stopped) return;
    const p = posRef.current;
    const isHit = Math.abs(p - zone) <= 8; // zona verde: ±8%
    const newHits = hits + (isHit ? 1 : 0);
    setStopped(isHit ? 'hit' : 'miss');
    setHits(newHits);

    setTimeout(() => {
      if (attempt >= 2) {
        onFinish(newHits);
      } else {
        setAttempt(attempt + 1);
        setZone(30 + Math.random() * 40);
        setStopped(null);
      }
    }, 700);
  };

  return (
    <div className="text-center">
      <p className="text-slate-400 text-xs mb-1">Intento {attempt + 1} de 3 · aciertos: {hits}</p>
      <h3 className="font-fredoka font-bold text-lg text-white mb-4">🏁 ¡Frena en la zona verde!</h3>

      {/* Pista */}
      <div className="relative h-12 rounded-full bg-slate-800 border border-white/10 overflow-hidden mb-5">
        {/* Zona verde */}
        <div
          className="absolute top-0 bottom-0 bg-[#22C55E]/40 border-x-2 border-[#22C55E]"
          style={{ left: `${zone - 8}%`, width: '16%' }}
        />
        {/* Marcador */}
        <div
          className={cn(
            'absolute top-1 bottom-1 w-3 rounded-full transition-colors',
            stopped === 'hit' ? 'bg-[#22C55E]' : stopped === 'miss' ? 'bg-[#EF4444]' : 'bg-[#F59E0B]'
          )}
          style={{ left: `calc(${pos}% - 6px)` }}
        />
      </div>

      {stopped && (
        <p
          className={cn(
            'font-fredoka font-black text-xl mb-3',
            stopped === 'hit' ? 'text-[#22C55E]' : 'text-[#EF4444]'
          )}
        >
          {stopped === 'hit' ? '¡DERRAPE PERFECTO!' : '¡Te pasaste!'}
        </p>
      )}

      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={handleStop}
        disabled={!!stopped}
        className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#F59E0B] to-[#FBBF24] text-[#0D0E14] font-fredoka font-black text-lg disabled:opacity-50"
      >
        🛑 ¡FRENAR!
      </motion.button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Cambio de neumático: clicks rápidos en 5 segundos                  */
/* ------------------------------------------------------------------ */
function TuercaGame({ onFinish }: { onFinish: (clicks: number) => void }) {
  const [phase, setPhase] = useState<'ready' | 'running' | 'done'>('ready');
  const [clicks, setClicks] = useState(0);
  const [timeLeft, setTimeLeft] = useState(5);
  const [spin, setSpin] = useState(0);

  useEffect(() => {
    if (phase !== 'running') return;
    const iv = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(iv);
          setPhase('done');
          setTimeout(() => onFinish(clicks), 600);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(iv);
  }, [phase, clicks, onFinish]);

  const handleTireClick = () => {
    if (phase !== 'running') return;
    setClicks((c) => c + 1);
    setSpin((s) => s + 36);
  };

  if (phase === 'ready') {
    return (
      <div className="text-center">
        <h3 className="font-fredoka font-bold text-lg text-white mb-2">🛞 Cambio de neumático</h3>
        <p className="text-slate-400 text-sm mb-5">
          Clickea el neumático lo más rápido que puedas durante 5 segundos. ¡Más clicks = más recompensa!
        </p>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => setPhase('running')}
          className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#22C55E] to-[#16A34A] text-white font-fredoka font-black text-lg"
        >
          ¡YA!
        </motion.button>
      </div>
    );
  }

  return (
    <div className="text-center">
      <div className="flex items-center justify-between mb-4">
        <span className="font-fredoka font-bold text-white text-lg">{clicks} clicks</span>
        <span
          className={cn(
            'font-fredoka font-black text-2xl',
            timeLeft <= 2 ? 'text-[#EF4444]' : 'text-[#F59E0B]'
          )}
        >
          {timeLeft}s
        </span>
      </div>
      <motion.button
        whileTap={{ scale: 0.92 }}
        onPointerDown={handleTireClick}
        disabled={phase !== 'running'}
        className="w-40 h-40 mx-auto rounded-full bg-gradient-to-br from-slate-700 to-slate-900 border-8 border-slate-600 flex items-center justify-center text-7xl select-none touch-none"
        style={{ rotate: spin }}
      >
        🛞
      </motion.button>
      <p className="text-slate-400 text-xs mt-4">¡Clickea el neumático!</p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Modal principal                                                    */
/* ------------------------------------------------------------------ */
export function MinigameModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { addMillas } = useMillas();
  const goldenTickets = useClickerStore((s) => s.goldenTickets);
  const store = useClickerStore();
  const addPowerup = usePowerupStore((s) => s.addPowerup);

  const [view, setView] = useState<View>('menu');
  const [reward, setReward] = useState<MinigameReward | null>(null);
  // Wave 4 (F14): coleccionable ganado en la partida (si cayó)
  const [drop, setDrop] = useState<CollectibleDrop | null>(null);

  useEffect(() => {
    if (open) {
      setDrop(null);
      setView('menu');
      setReward(null);
    }
  }, [open]);

  const payAndStart = (game: 'derrape' | 'tuerca') => {
    const result = store.spendGoldenTickets(TICKET_COST);
    if (!result.success) return;
    setView(game);
  };

  const applyReward = useCallback(
    (r: MinigameReward) => {
      if (r.millas > 0) addMillas(r.millas);
      if (r.cps > 0) store.addEarnings(r.cps);
      if (r.tickets > 0) store.addGoldenTickets(r.tickets);
      if (r.powerup) addPowerup(r.powerup as (typeof POWERUP_IDS)[number], 1);
      // Wave 4 (F14): los minijuegos pueden soltar coleccionables
      setDrop(useCollectibleStore.getState().rollDrop(0.35));
      if (r.tickets > 0 || r.powerup) {
        confetti({
          particleCount: 50,
          spread: 70,
          origin: { y: 0.5 },
          colors: ['#FFD700', '#F59E0B', '#22C55E'],
        });
      }
      setReward(r);
      setView('result');
    },
    [addMillas, store, addPowerup]
  );

  const handleDerrapeFinish = (hits: number) => {
    const clickPower = calculateClickPower(useClickerStore.getState());
    const r: MinigameReward = {
      millas: hits === 0 ? 100 : hits * 500,
      cps: hits === 0 ? 0 : Math.floor(clickPower * 25 * hits * (hits === 3 ? 2 : 1)),
      tickets: hits >= 2 ? (hits === 3 ? 3 : 1) : 0,
      powerup: hits === 3 ? randomPowerup() : null,
      summary:
        hits === 0
          ? 'Ningún derrape en la zona... ¡premio de consuelo!'
          : hits === 3
            ? '¡3 de 3! Derrape legendario'
            : `${hits} de 3 derrapes perfectos`,
    };
    applyReward(r);
  };

  const handleTuercaFinish = (clicks: number) => {
    const clickPower = calculateClickPower(useClickerStore.getState());
    const r: MinigameReward = {
      millas: clicks * 50,
      cps: Math.floor(clickPower * clicks * 2),
      tickets: clicks >= 45 ? 2 : clicks >= 30 ? 1 : 0,
      powerup: clicks >= 50 ? randomPowerup() : null,
      summary:
        clicks >= 45
          ? `¡${clicks} clicks! Pit stop de récord`
          : clicks >= 30
            ? `¡${clicks} clicks! Muy buen ritmo`
            : `${clicks} clicks en 5 segundos`,
    };
    applyReward(r);
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] bg-black/70 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 40 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 40 }}
            transition={{ type: 'spring', stiffness: 260, damping: 24 }}
            className="fixed inset-x-4 top-1/2 -translate-y-1/2 z-[71] max-w-sm mx-auto rounded-3xl bg-[#1A1B26] border border-white/10 p-5 shadow-2xl"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Gamepad2 size={18} className="text-[#F59E0B]" />
                <h2 className="font-fredoka font-bold text-lg text-white">Minijuegos</h2>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-full hover:bg-white/10 transition-colors"
              >
                <X size={18} className="text-slate-400" />
              </button>
            </div>

            {view === 'menu' && (
              <div className="space-y-3">
                <p className="text-slate-400 text-xs text-center">
                  Cada partida cuesta {TICKET_COST} 🎟️ · Tienes {goldenTickets} 🎟️
                </p>
                <button
                  onClick={() => payAndStart('derrape')}
                  disabled={goldenTickets < TICKET_COST}
                  className="w-full flex items-center gap-3 p-4 rounded-2xl bg-slate-800/60 border border-white/10 hover:border-[#F59E0B]/50 transition-colors disabled:opacity-40"
                >
                  <span className="text-3xl">🏁</span>
                  <div className="text-left flex-1">
                    <p className="font-fredoka font-bold text-white">Derrape</p>
                    <p className="text-slate-400 text-xs">Frena la barra en la zona verde · 3 intentos</p>
                  </div>
                  <span className="text-[#F59E0B] text-xs font-bold">1 🎟️</span>
                </button>
                <button
                  onClick={() => payAndStart('tuerca')}
                  disabled={goldenTickets < TICKET_COST}
                  className="w-full flex items-center gap-3 p-4 rounded-2xl bg-slate-800/60 border border-white/10 hover:border-[#F59E0B]/50 transition-colors disabled:opacity-40"
                >
                  <span className="text-3xl">🛞</span>
                  <div className="text-left flex-1">
                    <p className="font-fredoka font-bold text-white">Cambio de neumático</p>
                    <p className="text-slate-400 text-xs">Clicks rápidos durante 5 segundos</p>
                  </div>
                  <span className="text-[#F59E0B] text-xs font-bold">1 🎟️</span>
                </button>
                {goldenTickets < TICKET_COST && (
                  <p className="text-center text-[#EF4444] text-xs font-bold">
                    Sin tickets: recoge 🎟️ flotantes en la carretera
                  </p>
                )}
              </div>
            )}

            {view === 'derrape' && <DerrapeGame onFinish={handleDerrapeFinish} />}
            {view === 'tuerca' && <TuercaGame onFinish={handleTuercaFinish} />}

            {view === 'result' && reward && (
              <div className="text-center">
                <p className="text-4xl mb-2">🏆</p>
                <h3 className="font-fredoka font-bold text-lg text-white mb-1">{reward.summary}</h3>
                <div className="grid grid-cols-2 gap-2 my-4">
                  {reward.millas > 0 && (
                    <div className="bg-slate-800/60 rounded-xl p-2">
                      <p className="font-fredoka font-bold text-[#F59E0B]">+{formatNumber(reward.millas)}</p>
                      <p className="text-[10px] text-slate-400">Millas</p>
                    </div>
                  )}
                  {reward.cps > 0 && (
                    <div className="bg-slate-800/60 rounded-xl p-2">
                      <p className="font-fredoka font-bold text-[#22C55E]">+{formatNumber(reward.cps)}</p>
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
                      <p className="text-[10px] text-slate-400">{reward.powerup}</p>
                    </div>
                  )}
                  {drop?.isNew && (
                    <div className="bg-slate-800/60 rounded-xl p-2">
                      <p className="font-fredoka font-bold text-[#EC4899]">
                        {drop.def.emoji} {drop.def.name}
                      </p>
                      <p className="text-[10px] text-slate-400">¡Coleccionable nuevo!</p>
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setView('menu')}
                    className="flex-1 py-3 rounded-2xl bg-slate-800 text-white font-bold text-sm border border-white/10"
                  >
                    Jugar otro
                  </button>
                  <button
                    onClick={onClose}
                    className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-[#F59E0B] to-[#FBBF24] text-[#0D0E14] font-fredoka font-black text-sm"
                  >
                    ¡A rodar!
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
