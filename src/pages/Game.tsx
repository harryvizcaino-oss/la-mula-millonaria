import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Truck,
  Coins,
  Star,
  Zap,
  TrendingUp,
  MapPin,
  Sparkles,
  MousePointerClick,
  HelpCircle,
  Gem,
  Crown,
  Building2,
  Ticket,
  Clock,
  Bell,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useMillas } from '@/providers/MillasProvider';
import { useClickerStore, calculateClickPower } from '@/store/clickerStore';
import { CLICKER_BUILDINGS, getBuildingTicketCost } from '@/data/clickerBuildings';
import { CLICKER_UPGRADES } from '@/data/clickerUpgrades';
import { mockPlayers } from '@/data/mockLeaderboard';
import { POWER_LINES, getPowerCost, isPowerUnlocked, MAX_POWER_LEVEL } from '@/data/clickerPowers';
import { pickRandomEvent, type ClickerGameEvent } from '@/data/clickerEvents';
import { GameTutorial, TutorialButton } from '@/components/GameTutorial';

import { useTruckHorn } from '@/hooks/useTruckHorn';

interface FloatingNumber {
  id: number;
  x: number;
  y: number;
  text: string;
  color: string;
  arcX: number;
}

interface Particle {
  id: number;
  x: number;
  y: number;
  emoji: string;
  vx: number;
  vy: number;
  rotate: number;
}

interface FlyItem {
  id: number;
  emoji: string;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
}

interface FloatingCollectible {
  id: number;
  emoji: string;
  x: number; // % 0-100 within arena
  y: number; // % 0-100 within arena
  vx: number; // % per second
  vy: number; // % per second
  reward: number;
  expiresAt: number;
}

function formatNumber(n: number): string {
  if (n < 1000) return n.toLocaleString('es-CO', { maximumFractionDigits: 2 });
  if (n < 1_000_000) return `${(n / 1000).toFixed(n < 10_000 ? 1 : 0)}K`;
  if (n < 1_000_000_000) return `${(n / 1_000_000).toFixed(n < 10_000_000 ? 2 : 1)}M`;
  if (n < 1_000_000_000_000) return `${(n / 1_000_000_000).toFixed(2)}B`;
  return `${(n / 1_000_000_000_000).toFixed(2)}T`;
}

function formatFull(n: number): string {
  return Math.floor(n).toLocaleString('es-CO');
}

function getRarity(index: number) {
  if (index < 3) return 'common';
  if (index < 6) return 'rare';
  if (index < 8) return 'epic';
  return 'legendary';
}

const RARITY_STYLES = {
  common: {
    bg: 'bg-gradient-to-br from-[#94A3B8] to-[#64748B]',
    border: 'border-[#CBD5E1]',
    text: 'text-[#E2E8F0]',
    cost: 'bg-[#22C55E]',
  },
  rare: {
    bg: 'bg-gradient-to-br from-[#3B82F6] to-[#1D4ED8]',
    border: 'border-[#60A5FA]',
    text: 'text-[#BFDBFE]',
    cost: 'bg-[#3B82F6]',
  },
  epic: {
    bg: 'bg-gradient-to-br from-[#A855F7] to-[#7E22CE]',
    border: 'border-[#C084FC]',
    text: 'text-[#E9D5FF]',
    cost: 'bg-[#A855F7]',
  },
  legendary: {
    bg: 'bg-gradient-to-br from-[#F59E0B] to-[#B45309]',
    border: 'border-[#FBBF24]',
    text: 'text-[#FEF3C7]',
    cost: 'bg-[#F59E0B]',
  },
};

export default function Game() {
  const navigate = useNavigate();
  const { millas, addMillas } = useMillas();
  const store = useClickerStore();

  const [activeTab, setActiveTab] = useState<'buildings' | 'upgrades' | 'prestige'>('upgrades');
  const [floatingNumbers, setFloatingNumbers] = useState<FloatingNumber[]>([]);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [truckBump, setTruckBump] = useState(false);
  const [truckHappy, setTruckHappy] = useState(false);
  const [shake, setShake] = useState(false);
  const [event, setEvent] = useState<ClickerGameEvent | null>(null);
  const [eventTimeLeft, setEventTimeLeft] = useState(0);
  const [prestigeResult, setPrestigeResult] = useState<{ success: boolean; starsGained: number } | null>(null);
  const [showTutorial, setShowTutorial] = useState(false);
  const [toasts, setToasts] = useState<{ id: number; text: string; color: string }[]>([]);
  const [flyItems, setFlyItems] = useState<FlyItem[]>([]);
  const [collectibles, setCollectibles] = useState<FloatingCollectible[]>([]);
  const [clickMultiplierLevel, setClickMultiplierLevel] = useState(1);
  const [cycleClicks, setCycleClicks] = useState(0);
  const [ticketBurst, setTicketBurst] = useState(false);
  const [autoclickRemaining, setAutoclickRemaining] = useState(0);
  const [truckTilt, setTruckTilt] = useState({ rotateX: 0, rotateY: 0 });
  const [shockwaves, setShockwaves] = useState<{ id: number; x: number; y: number }[]>([]);
  const [exhaustPuffs, setExhaustPuffs] = useState<{ id: number; x: number; y: number; scale: number; opacity: number }[]>([]);

  const floatingIdRef = useRef(0);
  const particleIdRef = useRef(0);
  const toastIdRef = useRef(0);
  const flyIdRef = useRef(0);
  const collectibleIdRef = useRef(0);
  const cycleClicksRef = useRef(0);
  const clicksSinceTicketRef = useRef(0);
  const clickAreaRef = useRef<HTMLDivElement>(null);
  const playHorn = useTruckHorn();
  const eventTimerRef = useRef<NodeJS.Timeout | null>(null);
  const collectibleTimerRef = useRef<NodeJS.Timeout | null>(null);
  const productionMultiplierRef = useRef(1);
  const clickMultiplierRef = useRef(1);
  const discountMultiplierRef = useRef(1);
  const shockwaveIdRef = useRef(0);
  const exhaustIdRef = useRef(0);

  const clickPower = useMemo(() => calculateClickPower(store), [store.upgrades, store.stars, store.buildings, store.powerLevels]);

  // Click multiplier: every 5s window, +1 level per 40 clicks; -1 level if under 40
  const CPS_CYCLE_MS = 5000;
  const CPS_THRESHOLD = 40;
  const activeClickMultiplier = Math.max(clickMultiplierRef.current, clickMultiplierLevel);

  useEffect(() => {
    const interval = setInterval(() => {
      const count = cycleClicksRef.current;
      setClickMultiplierLevel((prev) => {
        const levelsGained = Math.floor(count / CPS_THRESHOLD);
        if (levelsGained > 0) return prev + levelsGained;
        return Math.max(1, prev - 1);
      });
      cycleClicksRef.current = 0;
      setCycleClicks(0);
    }, CPS_CYCLE_MS);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const scheduleNext = () => {
      const delay = 30000 + Math.random() * 60000;
      eventTimerRef.current = setTimeout(() => {
        if (event) return;
        const next = pickRandomEvent();
        setEvent(next);
        setEventTimeLeft(next.duration);

        if (next.type === 'clickBoost') clickMultiplierRef.current = next.multiplier;
        if (next.type === 'productionBoost') productionMultiplierRef.current = next.multiplier;
        if (next.type === 'discount') discountMultiplierRef.current = next.multiplier;

        if (next.type === 'instantProduction') {
          const instant = clickPower * 15 * 60;
          addMillas(Math.floor(instant));
          store.tick(0);
          setTimeout(() => setEvent(null), 3000);
        }
      }, delay);
    };

    scheduleNext();
    return () => {
      if (eventTimerRef.current) clearTimeout(eventTimerRef.current);
    };
  }, [event, clickPower, addMillas, store]);

  useEffect(() => {
    if (!event || event.duration <= 0) return;
    const interval = setInterval(() => {
      setEventTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          clickMultiplierRef.current = 1;
          productionMultiplierRef.current = 1;
          discountMultiplierRef.current = 1;
          setEvent(null);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [event]);

  // Floating collectibles (golden tickets) - chance grows with clicks
  const spawnCollectible = () => {
    const id = ++collectibleIdRef.current;
    const newItem: FloatingCollectible = {
      id,
      emoji: '🎟️',
      x: 45 + (Math.random() - 0.5) * 20,
      y: 8,
      vx: (Math.random() - 0.5) * 12,
      vy: 8 + Math.random() * 8,
      reward: 1,
      expiresAt: Date.now() + 10000 + Math.random() * 5000,
    };
    setCollectibles((prev) => [...prev, newItem]);
  };

  useEffect(() => {
    return () => {
      if (collectibleTimerRef.current) clearTimeout(collectibleTimerRef.current);
    };
  }, []);

  // Move collectibles and expire them
  useEffect(() => {
    let raf: number;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.1);
      last = now;
      setCollectibles((prev) => {
        const nowMs = Date.now();
        return prev
          .filter((c) => c.expiresAt > nowMs)
          .map((c) => {
            let nx = c.x + c.vx * dt;
            let ny = c.y + c.vy * dt;
            let nvx = c.vx;
            let nvy = c.vy;
            if (nx <= 5 || nx >= 95) nvx *= -1;
            if (ny >= 92) nvy *= -0.7;
            return { ...c, x: Math.max(5, Math.min(95, nx)), y: Math.min(92, ny), vx: nvx, vy: nvy };
          });
      });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  const handleCollect = (id: number) => {
    cycleClicksRef.current += 1;
    setCycleClicks((prev) => prev + 1);
    setCollectibles((prev) => {
      const item = prev.find((c) => c.id === id);
      if (!item) return prev;
      store.addGoldenTickets(1);
      showToast('+1 Golden Ticket', '#FACC15');
      spawnParticlesPercent(item.x, item.y);
      setTicketBurst(true);
      setTimeout(() => setTicketBurst(false), 700);
      return prev.filter((c) => c.id !== id);
    });
  };

  const showToast = (text: string, color = '#22C55E') => {
    const id = ++toastIdRef.current;
    setToasts((prev) => [...prev, { id, text, color }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 2000);
  };

  const spawnFlyItem = (emoji: string, startEl: HTMLElement) => {
    const arena = clickAreaRef.current?.getBoundingClientRect();
    if (!arena) return;
    const start = startEl.getBoundingClientRect();
    const newItem: FlyItem = {
      id: ++flyIdRef.current,
      emoji,
      startX: start.left + start.width / 2,
      startY: start.top + start.height / 2,
      endX: arena.left + arena.width / 2,
      endY: arena.top + arena.height / 2,
    };
    setFlyItems((prev) => [...prev, newItem]);
    setTimeout(() => {
      setFlyItems((prev) => prev.filter((i) => i.id !== newItem.id));
    }, 700);
  };

  const spawnParticles = (x: number, y: number) => {
    const emojis = ['✨', '🪙', '⭐', '💥', '🔥'];
    const newParticles: Particle[] = [];
    for (let i = 0; i < 14; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 80 + Math.random() * 140;
      newParticles.push({
        id: ++particleIdRef.current,
        x,
        y,
        emoji: emojis[Math.floor(Math.random() * emojis.length)],
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 60,
        rotate: Math.random() * 360,
      });
    }
    setParticles((prev) => [...prev, ...newParticles]);
    setTimeout(() => {
      setParticles((prev) => prev.filter((p) => !newParticles.find((np) => np.id === p.id)));
    }, 900);
  };

  const spawnParticlesPercent = (pctX: number, pctY: number) => {
    const arena = clickAreaRef.current;
    if (!arena) return;
    const rect = arena.getBoundingClientRect();
    spawnParticles((pctX / 100) * rect.width, (pctY / 100) * rect.height);
  };

  const spawnShockwave = (x: number, y: number) => {
    const id = ++shockwaveIdRef.current;
    setShockwaves((prev) => [...prev, { id, x, y }]);
    setTimeout(() => {
      setShockwaves((prev) => prev.filter((s) => s.id !== id));
    }, 700);
  };

  const spawnExhaustPuff = (x: number, y: number) => {
    const id = ++exhaustIdRef.current;
    setExhaustPuffs((prev) => [...prev, { id, x, y, scale: 0.4, opacity: 0.7 }]);
  };

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    const arena = clickAreaRef.current?.getBoundingClientRect();
    if (!arena) return;
    const centerX = arena.left + arena.width / 2;
    const centerY = arena.top + arena.height / 2;
    const percentX = (e.clientX - centerX) / (arena.width / 2);
    const percentY = (e.clientY - centerY) / (arena.height / 2);
    setTruckTilt({
      rotateX: -percentY * 14,
      rotateY: percentX * 14,
    });
  }, []);

  const handlePointerLeave = useCallback(() => {
    setTruckTilt({ rotateX: 0, rotateY: 0 });
  }, []);

  const handleTruckClick = useCallback(
    (e: React.PointerEvent) => {
      e.stopPropagation();
      const arena = clickAreaRef.current?.getBoundingClientRect();
      const x = e.clientX;
      const y = e.clientY;
      const relX = arena ? x - arena.left : x;
      const relY = arena ? y - arena.top : y;

      cycleClicksRef.current += 1;
      setCycleClicks((prev) => prev + 1);
      clicksSinceTicketRef.current += 1;
      const chance = Math.min(0.25, clicksSinceTicketRef.current * 0.0075);
      if (Math.random() < chance) {
        spawnCollectible();
        clicksSinceTicketRef.current = 0;
      }

      const multiplier = activeClickMultiplier;
      const amount = clickPower * multiplier;
      playHorn();
      const result = store.click();
      addMillas(Math.floor(result.millas * multiplier));

      // 3D punch + shockwave
      setTruckTilt({ rotateX: 6, rotateY: 0 });
      setTimeout(() => setTruckTilt({ rotateX: 0, rotateY: 0 }), 120);
      spawnShockwave(relX, relY);
      spawnExhaustPuff(relX + 60, relY + 50);

      setTruckBump(true);
      setTruckHappy(true);
      setShake(true);
      setTimeout(() => setTruckBump(false), 150);
      setTimeout(() => setTruckHappy(false), 400);
      setTimeout(() => setShake(false), 200);

      const id = ++floatingIdRef.current;
      setFloatingNumbers((prev) => [
        ...prev,
        { id, x: relX + (Math.random() - 0.5) * 30, y: relY, text: `+${formatNumber(amount)}`, color: multiplier > 1 ? '#FACC15' : '#FBBF24', arcX: (Math.random() - 0.5) * 80 },
      ]);
      setTimeout(() => {
        setFloatingNumbers((prev) => prev.filter((n) => n.id !== id));
      }, 1000);

      spawnParticles(relX, relY);
    },
    [clickPower, store, addMillas, activeClickMultiplier]
  );

  // Keep latest click handler accessible to autoclick loop without restarting it
  const handleTruckClickRef = useRef(handleTruckClick);
  useEffect(() => {
    handleTruckClickRef.current = handleTruckClick;
  }, [handleTruckClick]);

  // Autoclick superpower loop
  const autoclickActiveRef = useRef(false);
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const remaining = Math.max(0, store.autoclickUntil - now);
      setAutoclickRemaining(remaining);
      const isActive = remaining > 0;
      const wasActive = autoclickActiveRef.current;
      autoclickActiveRef.current = isActive;
      if (remaining <= 0) {
        if (wasActive) showToast('Autoclick finalizado', '#A855F7');
        return;
      }
      const arena = clickAreaRef.current;
      if (!arena) return;
      const rect = arena.getBoundingClientRect();
      const x = rect.left + rect.width / 2 + (Math.random() - 0.5) * 80;
      const y = rect.top + rect.height / 2 + (Math.random() - 0.5) * 80;
      // trigger click as if user tapped the center
      const fakeEvent = { clientX: x, clientY: y, stopPropagation: () => {} } as React.PointerEvent;
      handleTruckClickRef.current(fakeEvent);
    }, 250);
    return () => clearInterval(interval);
  }, [store.autoclickUntil]);

  const handleBuyBuilding = (id: string, el: HTMLElement) => {
    const result = store.buyBuilding(id);
    if (result.success) {
      const building = CLICKER_BUILDINGS.find((b) => b.id === id);
      if (building) spawnFlyItem(building.emoji, el);
      showToast(`+1 ${building?.name ?? 'vehiculo'}`, '#3B82F6');
    }
  };

  const handleBuyPower = (id: string, el: HTMLElement) => {
    const result = store.buyPower(id, millas);
    if (result.success) {
      addMillas(-result.cost);
      const power = POWER_LINES.find((p) => p.id === id);
      if (power) spawnFlyItem(power.emoji, el);
    }
  };

  const handleBuyAutoclick = () => {
    const result = store.buyAutoclick(millas);
    if (result.success) {
      addMillas(-result.cost);
      showToast('¡Autoclick activado!', '#A855F7');
      setAutoclickRemaining(result.duration);
    }
  };

  const handlePrestige = () => {
    const result = store.prestige();
    setPrestigeResult(result);
    if (result.success) {
      showToast(`¡Ascendiste! +${result.starsGained} ⭐`, '#FACC15');
      setTimeout(() => setPrestigeResult(null), 3000);
    }
  };

  const potentialStars = useMemo(() => {
    const threshold = 1_000_000;
    return Math.max(0, Math.floor(Math.sqrt(store.totalEarned / threshold)) - store.stars);
  }, [store.totalEarned, store.stars]);

  const buildingsSorted = useMemo(() => {
    return CLICKER_BUILDINGS.map((b, i) => ({
      ...b,
      owned: store.buildings[b.id] || 0,
      cost: getBuildingTicketCost(b, store.buildings[b.id] || 0),
      rarity: getRarity(i),
    }));
  }, [store.buildings]);

  const powersAvailable = useMemo(() => {
    return POWER_LINES.filter((p) => isPowerUnlocked(store.powerLevels, p)).map((p) => {
      const currentLevel = store.powerLevels[p.id] || 0;
      const cost = getPowerCost(p, currentLevel);
      return {
        ...p,
        currentLevel,
        cost,
        canAfford: millas >= cost,
        isMaxed: currentLevel >= MAX_POWER_LEVEL,
      };
    });
  }, [store.powerLevels, store.totalEarned, millas]);

  const activeVehicleId = useMemo(() => {
    for (let i = CLICKER_BUILDINGS.length - 1; i >= 0; i--) {
      if ((store.buildings[CLICKER_BUILDINGS[i].id] || 0) > 0) {
        return CLICKER_BUILDINGS[i].id;
      }
    }
    return 'motoneta';
  }, [store.buildings]);

  const fleetTotal = useMemo(
    () => Object.values(store.buildings).reduce((a, b) => a + b, 0),
    [store.buildings]
  );

  const autoclickCost = useMemo(
    () => Math.floor(5000 * Math.pow(4, store.autoclickLevel)),
    [store.autoclickLevel]
  );
  const canAffordAutoclick = millas >= autoclickCost;

  const effectiveClickPower = clickPower * activeClickMultiplier;
  const level = Math.max(1, Math.floor(Math.log10(Math.max(1, store.totalEarned)) / 2 + 1));

  const rankPosition = useMemo(() => {
    const userScore = effectiveClickPower;
    const allScores = [...mockPlayers.map((p) => p.score), userScore].sort((a, b) => b - a);
    return allScores.indexOf(userScore) + 1;
  }, [effectiveClickPower]);

  return (
    <div className="relative min-h-[100dvh] bg-white text-slate-900 pb-28 overflow-x-hidden">
      {/* Floating Header */}
      <div className="absolute top-0 left-0 right-0 z-50 py-2 bg-white/30 backdrop-blur-sm">
        <div className="px-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 pl-3 pr-4 py-1.5 rounded-full bg-gradient-to-r from-[#FDE047] via-[#FACC15] to-[#F59E0B] border-2 border-[#B45309] shadow-[0_0_16px_rgba(245,158,11,0.45)] relative overflow-visible">
                <span className="text-lg drop-shadow-sm">🎟️</span>
                <span className="font-fredoka font-black text-[#78350F]">{store.goldenTickets}</span>
                <AnimatePresence>
                  {ticketBurst && (
                    <>
                      {Array.from({ length: 8 }).map((_, i) => (
                        <motion.span
                          key={i}
                          initial={{ opacity: 1, scale: 0.5, x: 0, y: 0 }}
                          animate={{
                            opacity: 0,
                            scale: 1.5,
                            x: Math.cos((i / 8) * Math.PI * 2) * 40,
                            y: Math.sin((i / 8) * Math.PI * 2) * 40,
                          }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.7, ease: 'easeOut' }}
                          className="absolute left-1/2 top-1/2 text-lg pointer-events-none"
                          style={{ marginLeft: -8, marginTop: -8 }}
                        >
                          ✨
                        </motion.span>
                      ))}
                    </>
                  )}
                </AnimatePresence>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#22C55E] text-slate-900 shadow-sm border-2 border-white">
                <TrendingUp size={14} className="fill-white" />
                <span className="font-fredoka font-black text-sm">+{formatFull(clickPower * activeClickMultiplier)}/click</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#3B82F6] text-white shadow-sm border-2 border-white">
                <Truck size={14} />
                <span className="font-fredoka font-black text-sm">{fleetTotal}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-slate-100 border border-[#FACC15]/40">
                <Crown size={14} className="text-[#F59E0B]" />
                <span className="font-fredoka font-bold text-[#F59E0B]">#{rankPosition}</span>
              </div>
              <button
                onClick={() => showToast('Notificaciones próximamente', '#F59E0B')}
                className="relative p-2 rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors border border-slate-200"
              >
                <Bell size={16} />
                <span className="absolute top-1 right-1 w-2 h-2 bg-[#F59E0B] rounded-full" />
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* Arena Click Area */}
      <div className="w-full">
        <div className="relative">
          <motion.div
            animate={shake ? { x: [-4, 4, -4, 4, 0] } : { x: 0 }}
            transition={{ duration: 0.2 }}
            className="relative aspect-[3/4] max-h-[85vh] rounded-b-[2rem] overflow-hidden shadow-[0_12px_40px_rgba(0,0,0,0.2)] select-none"
            style={{ touchAction: 'none' }}
          >
          {/* Sky */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#38BDF8] to-[#BAE6FD]" />

          {/* Sun */}
          <motion.div
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute top-36 left-1/2 -translate-x-1/2 w-16 h-16 rounded-full bg-[#FDE047] shadow-[0_0_24px_rgba(253,224,71,0.6)]"
          />

          {/* Money counter */}
          <div className="absolute top-44 left-0 right-0 z-20 flex justify-center pointer-events-none">
            <motion.span
              animate={{ scale: [1, 1.02, 1] }}
              transition={{ duration: 1.2, repeat: Infinity }}
              className="font-fredoka font-black text-5xl text-white"
              style={{ textShadow: '0 3px 12px rgba(0,0,0,0.5), 0 0 24px rgba(0,0,0,0.3)' }}
            >
              {formatFull(millas)}
            </motion.span>
          </div>

          {/* Clouds */}
          <motion.div
            animate={{ x: [-20, 20, -20] }}
            transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute top-44 left-6 w-20 h-7 bg-white/80 rounded-full blur-[1px]"
          />
          <motion.div
            animate={{ x: [20, -20, 20] }}
            transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute top-52 right-16 w-24 h-8 bg-white/70 rounded-full blur-[1px]"
          />

          {/* Ground / Arena */}
          <div className="absolute bottom-0 inset-x-0 h-28 bg-gradient-to-b from-[#84CC16] to-[#4D7C0F]">
            <div className="absolute inset-x-0 top-0 h-3 bg-[#A3E635] opacity-60" />
          </div>

          {/* Road with moving dashed lines */}
          <div className="absolute bottom-6 inset-x-4 h-14 bg-[#57534E] rounded-full shadow-inner overflow-hidden">
            <div className="absolute inset-0 flex items-center">
              <motion.div
                className="flex gap-6"
                animate={{ x: ['0%', '-50%'] }}
                transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
              >
                {Array.from({ length: 16 }).map((_, i) => (
                  <div key={i} className="w-8 h-1.5 bg-white/30 rounded-full flex-shrink-0" />
                ))}
              </motion.div>
            </div>
            <div className="absolute inset-x-4 top-1/2 -translate-y-1/2 h-4 bg-black/40 rounded-full overflow-hidden border border-white/10">
              <motion.div
                className="h-full bg-gradient-to-r from-[#EF4444] to-[#DC2626]"
                initial={{ width: '0%' }}
                animate={{ width: `${Math.min(100, (cycleClicks / CPS_THRESHOLD) * 100)}%` }}
                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              />
            </div>
          </div>

          {/* Multiplicador label — centered to screen, not to road */}
          {cycleClicks >= 30 && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: [1, 0.35, 1], y: 0 }}
              transition={{ duration: 0.9, repeat: Infinity }}
              className="absolute bottom-[5.25rem] left-1/2 -translate-x-1/2 text-white font-fredoka font-black text-2xl drop-shadow-[0_2px_10px_rgba(0,0,0,0.7)] pointer-events-none whitespace-nowrap"
            >
              Multiplicador
            </motion.div>
          )}

          {/* Click target with 3D perspective */}
          <div
            ref={clickAreaRef}
            className="absolute inset-0 flex items-center justify-center"
            style={{ perspective: 900 }}
            onPointerMove={handlePointerMove}
            onPointerLeave={handlePointerLeave}
          >
            <motion.div
              animate={{ scale: [1, 1.08, 1], opacity: [0.25, 0.45, 0.25] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="absolute w-56 h-56 rounded-full bg-white/10 border-4 border-white/20 pointer-events-none"
              style={{ transformStyle: 'preserve-3d' }}
            />

            {/* Shockwaves */}
            <AnimatePresence>
              {shockwaves.map((s) => (
                <motion.div
                  key={s.id}
                  initial={{ opacity: 0.8, scale: 0.2 }}
                  animate={{ opacity: 0, scale: 2.2 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.7, ease: 'easeOut' }}
                  className="absolute w-32 h-32 rounded-full border-4 border-white/60 pointer-events-none z-0"
                  style={{ left: s.x - 64, top: s.y - 64 }}
                />
              ))}
            </AnimatePresence>

            {/* Exhaust smoke puffs */}
            <AnimatePresence>
              {exhaustPuffs.map((p) => (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0.7, scale: 0.4, y: 0, x: 0 }}
                  animate={{ opacity: 0, scale: 1.4, y: -40, x: -30 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.9, ease: 'easeOut' }}
                  className="absolute w-8 h-8 rounded-full bg-white/40 blur-sm pointer-events-none z-0"
                  style={{ left: p.x, top: p.y }}
                />
              ))}
            </AnimatePresence>

            <motion.div
              animate={{
                scale: truckBump ? [1, 0.9, 1.06, 1] : 1,
                y: truckHappy ? [0, -8, 0] : 0,
                rotateX: truckTilt.rotateX,
                rotateY: truckTilt.rotateY,
              }}
              transition={{ type: 'spring', stiffness: 320, damping: 18 }}
              className="relative z-10 cursor-pointer select-none mt-12"
              style={{ transformStyle: 'preserve-3d' }}
              onPointerDown={handleTruckClick}
            >
              {/* Truck shadow */}
              <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-32 h-8 bg-black/25 rounded-full blur-md" />
              <span className="text-[9rem] leading-none drop-shadow-[0_18px_32px_rgba(0,0,0,0.5)] filter block" style={{ transform: 'translateZ(24px)' }}>
                {CLICKER_BUILDINGS.find((b) => b.id === activeVehicleId)?.emoji ?? '🚛'}
              </span>
            </motion.div>

            {store.totalClicks < 5 && (
              <motion.div
                animate={{ y: [0, -8, 0], scale: [1, 1.05, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
                className="absolute top-40 left-1/2 -translate-x-1/2 bg-[#F59E0B] text-[#0D0E14] px-4 py-1.5 rounded-full text-sm font-black shadow-lg border-2 border-white pointer-events-none"
              >
                ¡Toca para ganar dinero!
              </motion.div>
            )}

            {/* Click multiplier badge */}
            <AnimatePresence>
              {clickMultiplierLevel > 1 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0 }}
                  className="absolute top-40 right-4 z-20 bg-gradient-to-r from-[#EF4444] to-[#DC2626] text-white px-5 py-2.5 rounded-full font-fredoka font-black text-xl shadow-lg border-2 border-white animate-pulse"
                >
                  x{clickMultiplierLevel}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Autoclick active indicator */}
            <AnimatePresence>
              {autoclickRemaining > 0 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0 }}
                  className="absolute top-40 left-4 z-20 bg-gradient-to-r from-[#A855F7] to-[#7E22CE] text-white px-3 py-1.5 rounded-full font-fredoka font-black text-sm shadow-lg border-2 border-white flex items-center gap-1.5"
                >
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white" />
                  </span>
                  AUTO {Math.ceil(autoclickRemaining / 1000)}s
                </motion.div>
              )}
            </AnimatePresence>

          </div>

          {/* Particles */}
          <AnimatePresence>
            {particles.map((p) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 1, x: p.x, y: p.y, scale: 0.6, rotate: p.rotate }}
                animate={{ opacity: 0, x: p.x + p.vx, y: p.y + p.vy, scale: 1.2, rotate: p.rotate + 180 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.7, ease: 'easeOut' }}
                className="absolute pointer-events-none text-2xl"
                style={{ left: 0, top: 0 }}
              >
                {p.emoji}
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Floating numbers with arc trajectory */}
          <AnimatePresence>
            {floatingNumbers.map((n) => (
              <motion.div
                key={n.id}
                initial={{ opacity: 1, y: 0, scale: 0.6, x: 0 }}
                animate={{
                  opacity: 0,
                  y: -120,
                  scale: 1.3,
                  x: n.arcX,
                }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1, ease: [0.25, 0.46, 0.45, 0.94] }}
                className="absolute pointer-events-none font-fredoka font-black text-3xl flex items-center gap-1"
                style={{ left: n.x - 30, top: n.y - 40, color: n.color, textShadow: '0 3px 10px rgba(0,0,0,0.6)' }}
              >
                <Coins size={22} className="fill-current" />
                {n.text}
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Floating collectibles (golden tickets) */}
          <AnimatePresence>
            {collectibles.map((c) => (
              <motion.button
                key={c.id}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0 }}
                whileHover={{ scale: 1.2 }}
                onPointerDown={(e) => {
                  e.stopPropagation();
                  handleCollect(c.id);
                }}
                className="absolute z-20 text-4xl cursor-pointer drop-shadow-lg"
                style={{ left: `${c.x}%`, top: `${c.y}%`, transform: 'translate(-50%, -50%)' }}
                title={`Golden Ticket: +${formatNumber(c.reward)}`}
              >
                {c.emoji}
              </motion.button>
            ))}
          </AnimatePresence>
        </motion.div>

        {/* Floating Superpoder Autoclick */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute top-[50px] left-0 right-0 z-40 rounded-b-2xl px-4 py-2 bg-white/90 backdrop-blur-sm border-2 border-t-0 border-slate-200/80 shadow-sm flex items-center gap-3"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#A855F7] to-[#7E22CE] flex items-center justify-center text-xl shadow-lg flex-shrink-0 animate-pulse">
            <MousePointerClick size={20} className="text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">Superpoder Especial</p>
            <p className="font-fredoka font-bold text-xl text-slate-900">Autoclick</p>
          </div>
          <motion.button
            whileHover={{ scale: canAffordAutoclick || autoclickRemaining > 0 ? 1.03 : 1 }}
            whileTap={{ scale: canAffordAutoclick || autoclickRemaining > 0 ? 0.97 : 1 }}
            onClick={handleBuyAutoclick}
            disabled={!canAffordAutoclick && autoclickRemaining <= 0}
            className={cn(
              'flex-shrink-0 h-10 px-4 rounded-xl font-bold text-xs tracking-wider shadow-md transition-colors flex items-center gap-1.5',
              autoclickRemaining > 0
                ? 'bg-gradient-to-r from-[#22C55E] to-[#16A34A] text-white'
                : canAffordAutoclick
                  ? 'bg-gradient-to-r from-[#A855F7] to-[#7E22CE] text-white'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            )}
          >
            {autoclickRemaining > 0 ? (
              <>
                <Clock size={14} />
                <span>{Math.ceil(autoclickRemaining / 1000)}s</span>
              </>
            ) : (
              <>
                <Coins size={14} />
                <span>{canAffordAutoclick ? `Comprar ${formatNumber(autoclickCost)}` : formatNumber(autoclickCost)}</span>
              </>
            )}
          </motion.button>
        </motion.div>
      </div>
      </div>

      {/* Event Banner */}
      <AnimatePresence>
        {event && event.duration > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="max-w-3xl mx-auto px-4 mt-3"
          >
            <div
              className="rounded-2xl p-3 flex items-center justify-between border-2"
              style={{ backgroundColor: `${event.color}10`, borderColor: `${event.color}40` }}
            >
              <div className="flex items-center gap-3">
                <span className="text-3xl animate-bounce">{event.emoji}</span>
                <div>
                  <p className="font-black text-sm" style={{ color: event.color }}>{event.name}</p>
                  <p className="text-slate-600 text-xs">{event.description}</p>
                </div>
              </div>
              <div className="text-right bg-white/60 px-3 py-1 rounded-xl border border-white">
                <p className="font-fredoka font-black text-slate-900 text-lg">{eventTimeLeft}s</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tabs */}
      <div className="max-w-3xl mx-auto px-4 mt-5">
        <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-2xl border-2 border-slate-200">
          {[
            { id: 'upgrades', label: 'Poderes', icon: Zap },
            { id: 'buildings', label: 'Flota', icon: Truck },
            { id: 'prestige', label: 'Prestigio', icon: Star },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={cn(
                'flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-black transition-all border-b-4',
                activeTab === tab.id
                  ? 'bg-gradient-to-b from-[#F59E0B] to-[#D97706] text-slate-900 border-[#92400E] shadow-[0_4px_16px_rgba(245,158,11,0.35)] translate-y-[-2px]'
                  : 'bg-white text-slate-500 border-transparent hover:text-slate-800 shadow-sm'
              )}
            >
              <tab.icon size={18} />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-4 mt-4 space-y-3">
        {activeTab === 'buildings' && (
          <>
            {buildingsSorted.map((b) => {
              const canAfford = store.goldenTickets >= b.cost * discountMultiplierRef.current;
              const discountCost = Math.ceil(b.cost * discountMultiplierRef.current);
              const rarity = RARITY_STYLES[b.rarity as keyof typeof RARITY_STYLES];
              const isTop = activeVehicleId === b.id;
              return (
                <motion.button
                  key={b.id}
                  whileTap={{ scale: 0.96, rotate: -1 }}
                  onClick={(e) => handleBuyBuilding(b.id, e.currentTarget as HTMLElement)}
                  disabled={!canAfford}
                  className={cn(
                    'w-full flex items-center gap-3 p-3 rounded-2xl border-[3px] transition-all text-left relative overflow-hidden',
                    canAfford
                      ? 'opacity-100 shadow-[0_6px_20px_rgba(0,0,0,0.35)]'
                      : 'opacity-55 grayscale-[0.3]'
                  )}
                  style={{ backgroundColor: '#ffffff', borderColor: isTop ? '#EF4444' : canAfford ? '#22C55E' : '#e2e8f0' }}
                >
                  {isTop && (
                    <div className="absolute top-2 right-2 z-10 bg-[#EF4444] text-white text-[9px] font-black px-2 py-0.5 rounded-full border border-white shadow-sm">
                      TOP
                    </div>
                  )}
                  <div className={cn('absolute left-0 top-0 bottom-0 w-1.5', rarity.bg)} />
                  <div className={cn('w-14 h-14 rounded-xl flex items-center justify-center text-3xl flex-shrink-0 border-2 shadow-inner', isTop ? 'bg-[#EF4444] border-[#EF4444]' : rarity.bg, isTop ? 'border-[#EF4444]' : rarity.border)}>
                    {b.emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-black text-sm text-slate-900 truncate">{b.name}</h3>
                    <p className="text-slate-500 text-xs line-clamp-2">{b.description}</p>
                    <div className="inline-flex items-center gap-1.5 mt-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-[#FDE047] to-[#F59E0B] text-[#78350F] border border-[#B45309] shadow-sm">
                      <span className="text-base">🎫</span>
                      <span className="font-fredoka font-black text-sm">{Math.floor(discountCost).toLocaleString('es-CO')}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <div className="w-10 h-10 rounded-full flex flex-col items-center justify-center border-2 border-white/30 shadow-lg bg-[#22C55E]">
                      <span className="text-[8px] font-bold text-white leading-none">+</span>
                      <span className="font-fredoka font-black text-slate-900 text-[10px]">{formatFull(Math.max(1, b.baseClickBonus * b.owned))}/click</span>
                    </div>
                    <div className={cn('w-10 h-10 rounded-full flex flex-col items-center justify-center border-2 border-white/30 shadow-lg', isTop ? 'bg-[#EF4444]' : rarity.cost)}>
                      <span className="text-[8px] font-bold text-white leading-none">Nv</span>
                      <span className="font-fredoka font-black text-white text-[10px]">{b.owned}</span>
                    </div>
                  </div>
                </motion.button>
              );
            })}
          </>
        )}

        {activeTab === 'upgrades' && (
          <>
            {powersAvailable.length === 0 && (
              <div className="text-center py-10 text-slate-500">
                <Zap size={48} className="mx-auto mb-3 opacity-50" />
                <p className="text-sm font-bold">Sigue generando dinero</p>
                <p className="text-xs">Las autopartes se desbloquean al acumular dinero total.</p>
              </div>
            )}
            {powersAvailable.map((p) => {
              const nextContribution = p.baseClickBonus * (p.currentLevel + 1);
              const tierColor =
                p.order === 0 ? '#94A3B8' :
                p.order === 1 ? '#3B82F6' :
                p.order === 2 ? '#A855F7' :
                p.order === 3 ? '#F59E0B' : '#EF4444';
              return (
                <motion.button
                  key={p.id}
                  whileTap={{ scale: 0.96, rotate: 1 }}
                  onClick={(e) => handleBuyPower(p.id, e.currentTarget as HTMLElement)}
                  disabled={!p.canAfford || p.isMaxed}
                  className={cn(
                    'w-full flex items-center gap-3 p-3 rounded-2xl border-[3px] transition-all text-left relative overflow-hidden',
                    p.canAfford && !p.isMaxed
                      ? 'opacity-100 shadow-[0_6px_20px_rgba(0,0,0,0.35)]'
                      : 'opacity-55 grayscale-[0.3]'
                  )}
                  style={{ backgroundColor: '#ffffff', borderColor: p.canAfford && !p.isMaxed ? '#22C55E' : '#e2e8f0' }}
                >
                  <div className="absolute left-0 top-0 bottom-0 w-1.5" style={{ backgroundColor: tierColor }} />
                  <div className="w-14 h-14 rounded-xl flex items-center justify-center text-3xl flex-shrink-0 border-2 shadow-inner" style={{ backgroundColor: `${tierColor}20`, borderColor: `${tierColor}40` }}>
                    {p.emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-black text-sm text-slate-900 truncate">{p.name}</h3>
                    <p className="text-slate-500 text-xs line-clamp-2">{p.description}</p>
                    <div className="inline-flex items-center gap-1.5 mt-1.5 px-3 py-1.5 rounded-full bg-slate-100 text-slate-900">
                      <span className="text-base">💵</span>
                      <span className="font-fredoka font-black text-sm">{Math.floor(p.cost).toLocaleString('es-CO')}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <div className="w-10 h-10 rounded-full flex flex-col items-center justify-center border-2 border-white/30 shadow-lg bg-[#22C55E]">
                      <span className="text-[8px] font-bold text-white leading-none">+</span>
                      <span className="font-fredoka font-black text-slate-900 text-[10px]">{formatFull(Math.max(1, nextContribution))}/click</span>
                    </div>
                    <div className="w-10 h-10 rounded-full flex flex-col items-center justify-center border-2 border-white/30 shadow-lg" style={{ backgroundColor: tierColor }}>
                      <span className="text-[8px] font-bold text-white leading-none">Nv</span>
                      <span className="font-fredoka font-black text-white text-[10px]">{p.isMaxed ? 'MAX' : p.currentLevel}</span>
                    </div>
                  </div>
                </motion.button>
              );
            })}
          </>
        )}

        {activeTab === 'prestige' && (
          <div className="relative rounded-[2rem] p-6 border-[4px] border-[#FACC15] text-center overflow-hidden bg-gradient-to-br from-[#451a03] via-[#78350F] to-[#451a03] shadow-[0_8px_32px_rgba(245,158,11,0.25)]">
            <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle, #FACC15 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
            <div className="relative">
              <motion.div
                animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.1, 1] }}
                transition={{ duration: 3, repeat: Infinity }}
                className="w-20 h-20 rounded-full bg-[#FACC15]/20 flex items-center justify-center mx-auto mb-3 border-2 border-[#FACC15]"
              >
                <Star size={40} className="text-[#FACC15] fill-[#FACC15]" />
              </motion.div>
              <h3 className="font-fredoka font-black text-2xl text-slate-900 mb-2">¡Ascender!</h3>
              <p className="text-[#FDE68A] text-sm mb-5">
                Reinicia tu flota a cambio de Estrellas de Carretera permanentes. Cada estrella da +1% de produccion.
              </p>

              <div className="grid grid-cols-2 gap-3 mb-5">
                <div className="bg-slate-100/80 rounded-2xl p-3 border border-[#FACC15]/20">
                  <p className="text-[#FDE68A] text-xs">Estrellas actuales</p>
                  <p className="font-fredoka font-black text-2xl text-[#FACC15]">{store.stars}</p>
                </div>
                <div className="bg-slate-100/80 rounded-2xl p-3 border border-[#FACC15]/20">
                  <p className="text-[#FDE68A] text-xs">Disponibles</p>
                  <p className="font-fredoka font-black text-2xl text-[#22C55E]">{potentialStars}</p>
                </div>
              </div>

              <button
                onClick={handlePrestige}
                disabled={potentialStars <= 0}
                className={cn(
                  'w-full py-4 rounded-2xl font-black text-base transition-all flex items-center justify-center gap-2 border-b-4',
                  potentialStars > 0
                    ? 'bg-gradient-to-b from-[#FACC15] to-[#D97706] text-[#451a03] border-[#92400E] shadow-[0_6px_20px_rgba(245,158,11,0.4)] active:translate-y-1 active:border-b-0'
                    : 'bg-slate-100 text-slate-500 border-transparent cursor-not-allowed'
                )}
              >
                <Sparkles size={20} />
                {potentialStars > 0 ? `Ascender y ganar ${potentialStars} ⭐` : 'Necesitas mas dinero total'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Purchase / event toasts */}
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="fixed bottom-28 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-full font-black shadow-lg text-sm flex items-center gap-2 border-2 border-white/20"
            style={{ backgroundColor: t.color, color: '#0D0E14' }}
          >
            {t.text}
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Prestige Result Toast */}
      <AnimatePresence>
        {prestigeResult?.success && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-28 left-1/2 -translate-x-1/2 z-50 bg-[#FACC15] text-[#0D0E14] px-6 py-3 rounded-full font-black shadow-lg flex items-center gap-2 border-2 border-white"
          >
            <Sparkles size={18} />
            ¡Ascendiste! +{prestigeResult.starsGained} estrellas
          </motion.div>
        )}
      </AnimatePresence>

      {/* Flying purchase items to truck */}
      <AnimatePresence>
        {flyItems.map((item) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 1, x: item.startX, y: item.startY, scale: 1 }}
            animate={{ opacity: 0, x: item.endX, y: item.endY, scale: 0.4 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.7, ease: 'easeInOut' }}
            className="fixed top-0 left-0 z-[55] pointer-events-none text-4xl"
            style={{ marginLeft: -16, marginTop: -16 }}
          >
            {item.emoji}
          </motion.div>
        ))}
      </AnimatePresence>

      <GameTutorial forceOpen={showTutorial} onClose={() => setShowTutorial(false)} />
    </div>
  );
}


