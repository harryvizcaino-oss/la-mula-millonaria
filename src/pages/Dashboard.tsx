import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useInView } from 'framer-motion';
import {
  Gamepad2,
  Route,
  Trophy,
  Truck,
  ShoppingBag,
  Award,
  Zap,
  Shield,
  Coins,
  Flame,
  Grid3X3,
  Users,
  Crown,
  Lock,
  TrendingUp,
  ChevronRight,
  Star,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import { useMillas } from '@/providers/MillasProvider';
import { useClickerStore, calculateClickPower } from '@/store/clickerStore';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */
interface StatItem {
  label: string;
  value: number;
  suffix?: string;
  icon: React.ElementType;
  iconColor: string;
  iconBg: string;
}

interface ActivityItem {
  id: string;
  type: 'game' | 'redemption' | 'achievement';
  title: string;
  subtitle: string;
  amount: number;
  icon: React.ElementType;
  iconColor: string;
  iconBg: string;
}

interface RedemptionItem {
  id: string;
  name: string;
  millas: number;
  status: 'Entregado' | 'En camino' | 'Procesando';
  date: string;
  image: string;
}

interface Achievement {
  id: string;
  name: string;
  icon: React.ElementType;
  unlocked: boolean;
}

interface Product {
  id: string;
  name: string;
  millas: number;
  image: string;
  brand: string;
}

/* ------------------------------------------------------------------ */
/*  Mock Data                                                          */
/* ------------------------------------------------------------------ */
const ACTIVITY_DATA = [
  { day: 'L', value: 1200 },
  { day: 'M', value: 800 },
  { day: 'M', value: 2100 },
  { day: 'J', value: 1500 },
  { day: 'V', value: 900 },
  { day: 'S', value: 3200 },
  { day: 'D', value: 1800 },
];

const RECENT_ACTIVITY: ActivityItem[] = [
  { id: '1', type: 'game', title: 'Compra de Tractomula', subtitle: 'Hace 15 minutos • Nuevo vehiculo', amount: 0, icon: Truck, iconColor: 'text-[#F59E0B]', iconBg: 'bg-[#F59E0B]/10' },
  { id: '2', type: 'game', title: 'Produccion automatica', subtitle: 'Hace 2 horas • Flota trabajando', amount: 180, icon: Zap, iconColor: 'text-[#10B981]', iconBg: 'bg-[#10B981]/10' },
  { id: '3', type: 'redemption', title: 'Redimio Audifonos BT', subtitle: 'Hace 5 horas • Aprobado', amount: -8500, icon: ShoppingBag, iconColor: 'text-[#10B981]', iconBg: 'bg-[#10B981]/10' },
  { id: '4', type: 'game', title: 'Evento de bonificacion', subtitle: 'Ayer • Produccion x3', amount: 520, icon: Award, iconColor: 'text-[#F59E0B]', iconBg: 'bg-[#F59E0B]/10' },
  { id: '5', type: 'achievement', title: 'Logro: Primer Click', subtitle: 'Ayer • Haz tu primer click', amount: 100, icon: Award, iconColor: 'text-[#F59E0B]', iconBg: 'bg-[#F59E0B]/10' },
];

const RECENT_REDEMPTIONS: RedemptionItem[] = [
  { id: '1', name: 'Audifonos Bluetooth', millas: 8500, status: 'Entregado', date: '15 Ene 2026', image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=200&h=120&fit=crop' },
  { id: '2', name: 'Cargador USB-C', millas: 3200, status: 'En camino', date: '12 Ene 2026', image: 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=200&h=120&fit=crop' },
  { id: '3', name: 'Botella Termica', millas: 5600, status: 'Procesando', date: '10 Ene 2026', image: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=200&h=120&fit=crop' },
];

const ACHIEVEMENTS: Achievement[] = [
  { id: '1', name: 'Primer Click', icon: Zap, unlocked: true },
  { id: '2', name: 'Constructor', icon: Truck, unlocked: true },
  { id: '3', name: 'Millonario', icon: Coins, unlocked: true },
  { id: '4', name: 'Viajero', icon: Route, unlocked: true },
  { id: '5', name: 'Velocista', icon: Flame, unlocked: false },
  { id: '6', name: 'Coleccionista', icon: Grid3X3, unlocked: false },
  { id: '7', name: 'Social', icon: Users, unlocked: false },
  { id: '8', name: 'Comprador', icon: ShoppingBag, unlocked: false },
  { id: '9', name: 'VIP', icon: Crown, unlocked: false },
];

const RECOMMENDED_PRODUCTS: Product[] = [
  { id: '1', name: 'Audifonos Inalambricos Pro', millas: 12500, image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=200&h=200&fit=crop', brand: 'TechGear' },
  { id: '2', name: 'Mochila Camionera', millas: 8900, image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=200&h=200&fit=crop', brand: 'CamionGear' },
  { id: '3', name: 'Termo 1.5L', millas: 6400, image: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=200&h=200&fit=crop', brand: 'HydroTruck' },
];

/* ------------------------------------------------------------------ */
/*  CountUp hook                                                       */
/* ------------------------------------------------------------------ */
function useCountUp(end: number, duration = 1500, startOnMount = true) {
  const [count, setCount] = useState(0);
  const [started, setStarted] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (!isInView || (!startOnMount && !isInView)) return;
    if (started) return;
    setStarted(true);

    const startTime = Date.now();
    const isFloat = end % 1 !== 0;
    const tick = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = eased * end;
      setCount(isFloat ? parseFloat(current.toFixed(1)) : Math.floor(current));
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [isInView, end, duration, startOnMount, started]);

  return { count, ref };
}

/* ------------------------------------------------------------------ */
/*  Status badge helper                                                */
/* ------------------------------------------------------------------ */
function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    Entregado: 'bg-[#10B981]/10 text-[#10B981]',
    'En camino': 'bg-[#3B82F6]/10 text-[#3B82F6]',
    Procesando: 'bg-[#F59E0B]/10 text-[#F59E0B]',
  };
  return (
    <span className={cn('px-2 py-0.5 rounded-full text-[10px] font-semibold', colors[status] || 'bg-slate-100 text-slate-500')}>
      {status}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  Animated Counter component                                         */
/* ------------------------------------------------------------------ */
function AnimatedCounter({ value, duration = 1500, className }: { value: number; duration?: number; className?: string }) {
  const { count, ref } = useCountUp(value, duration);
  return (
    <span ref={ref} className={className}>
      {count.toLocaleString()}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  Section wrapper with animation                                     */
/* ------------------------------------------------------------------ */
function Section({ children, className, delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
      className={className}
    >
      {children}
    </motion.section>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Dashboard Component                                           */
/* ------------------------------------------------------------------ */
export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { millas: currentMillas } = useMillas();
  const clicker = useClickerStore();
  const clickPower = calculateClickPower(clicker);

  const displayName = user?.name || 'Camionero';
  const initials = displayName.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();
  const level = Math.min(50, 1 + Math.floor(clicker.totalEarned / 50_000));
  const xpCurrent = clicker.totalEarned % 50_000;
  const xpTotal = 50_000;
  const xpPercent = Math.min(100, (xpCurrent / xpTotal) * 100);
  const totalWeek = ACTIVITY_DATA.reduce((s, d) => s + d.value, 0);
  const currentDay = 5; // Saturday highlight

  const dashboardStats: StatItem[] = [
    { label: 'Clicks', value: clicker.totalClicks, icon: Gamepad2, iconColor: 'text-[#F59E0B]', iconBg: 'bg-[#F59E0B]/10' },
    { label: 'CPS Totales', value: Math.floor(clicker.cpsTotal), suffix: '', icon: Route, iconColor: 'text-[#3B82F6]', iconBg: 'bg-[#3B82F6]/10' },
    { label: 'Poder Click', value: Math.floor(clickPower), suffix: '/click', icon: Zap, iconColor: 'text-[#10B981]', iconBg: 'bg-[#10B981]/10' },
    { label: 'Estrellas', value: clicker.stars, icon: Star, iconColor: 'text-[#FACC15]', iconBg: 'bg-[#FACC15]/10' },
  ];

  return (
    <div className="min-h-[100dvh] bg-white pb-6">
      {/* ============ Section 1: Profile Hero ============ */}
      <Section className="relative overflow-hidden rounded-b-3xl px-4 pt-6 pb-8 bg-white" delay={0}>
        {/* Subtle gradient bg */}
        <div className="absolute inset-0 bg-gradient-to-b from-white via-slate-50 to-white rounded-b-3xl" />
        {/* Floating particles */}
        <div className="absolute inset-0 overflow-hidden rounded-b-3xl pointer-events-none">
          {Array.from({ length: 12 }).map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 rounded-full bg-[#F59E0B]/20"
              style={{
                left: `${8 + (i * 7.5) % 84}%`,
                top: `${10 + (i * 13) % 70}%`,
              }}
              animate={{
                y: [0, -12, 0],
                opacity: [0.2, 0.5, 0.2],
              }}
              transition={{
                duration: 3 + (i % 3),
                repeat: Infinity,
                delay: i * 0.2,
                ease: 'easeInOut',
              }}
            />
          ))}
        </div>

        <div className="relative flex flex-col items-center text-center">
          {/* Avatar */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 260, damping: 20, delay: 0.1 }}
            className="relative mb-3"
          >
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#F59E0B] to-[#F97316] flex items-center justify-center text-slate-900 font-fredoka font-bold text-2xl border-[3px] border-[#F59E0B] shadow-lg">
              {initials}
            </div>
          </motion.div>

          {/* Name */}
          <motion.h2
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="font-fredoka font-bold text-2xl text-slate-900"
          >
            {displayName}
          </motion.h2>

          {/* Level */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-slate-500 text-sm mt-0.5"
          >
            Nivel {level}
          </motion.p>

          {/* XP Progress */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="w-full max-w-[280px] mt-3"
          >
            <div className="h-2 rounded-full bg-slate-100 overflow-hidden border border-slate-100">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-[#F59E0B] to-[#FBBF24]"
                initial={{ width: 0 }}
                animate={{ width: `${xpPercent}%` }}
                transition={{ duration: 1, delay: 0.5, ease: 'easeOut' }}
              />
            </div>
            <p className="text-slate-500 text-xs mt-1">
              {xpCurrent.toLocaleString()} / {xpTotal.toLocaleString()} XP para Nivel {level + 1}
            </p>
          </motion.div>
        </div>
      </Section>

      {/* ============ Section 2: Millas Balance Card ============ */}
      <Section className="px-4 -mt-2" delay={0.15}>
        <motion.div
          className="relative rounded-2xl p-6 overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #F59E0B 0%, #F97316 100%)' }}
          whileHover={{ scale: 1.01 }}
          transition={{ duration: 0.2 }}
        >
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 20% 80%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)', backgroundSize: '30px 30px' }} />
          <div className="relative">
            <p className="text-slate-700 text-xs uppercase tracking-wider font-medium">Tus TicaMillas</p>
            <div className="flex items-center gap-2 mt-2">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
              >
                <Coins size={32} className="text-slate-900" />
              </motion.div>
              <span className="font-fredoka font-bold text-5xl text-slate-900 tracking-tight">
                <AnimatedCounter value={currentMillas} duration={1500} />
              </span>
            </div>
            <p className="text-slate-600 text-sm mt-1">≈ ${currentMillas.toLocaleString()} COP en productos</p>

            {/* Action buttons */}
            <div className="flex gap-3 mt-4">
              <motion.button
                onClick={() => navigate('/marketplace')}
                whileTap={{ scale: 0.95 }}
                className="flex-1 flex items-center justify-center gap-2 h-11 bg-white rounded-xl text-[#F59E0B] font-semibold text-sm"
              >
                <ShoppingBag size={18} />
                Redimir
              </motion.button>
              <motion.button
                onClick={() => navigate('/game')}
                whileTap={{ scale: 0.95 }}
                className="flex-1 flex items-center justify-center gap-2 h-11 bg-slate-100 rounded-xl text-slate-900 font-semibold text-sm"
              >
                <Gamepad2 size={18} />
                Ganar Mas
              </motion.button>
            </div>
          </div>
        </motion.div>
      </Section>

      {/* ============ Section 3: Stats Grid ============ */}
      <Section className="px-4 mt-5" delay={0.25}>
        <div className="grid grid-cols-2 gap-3">
          {dashboardStats.map((stat, i) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + i * 0.08, duration: 0.5, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
                whileHover={{ scale: 1.02, boxShadow: '0 8px 24px rgba(0,0,0,0.08)' }}
                className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm transition-all duration-200"
              >
                <div className={cn('w-11 h-11 rounded-xl flex items-center justify-center mb-3', stat.iconBg)}>
                  <Icon size={24} className={stat.iconColor} />
                </div>
                <p className="font-fredoka font-bold text-2xl text-slate-900">
                  <AnimatedCounter value={stat.value} duration={1200} />
                  {stat.suffix}
                </p>
                <p className="text-slate-500 text-xs mt-0.5">{stat.label}</p>
              </motion.div>
            );
          })}
        </div>
      </Section>

      {/* ============ Section 4: 7-Day Activity Chart ============ */}
      <Section className="px-4 mt-6" delay={0.35}>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-fredoka font-bold text-xl text-slate-900">TicaMillas esta semana</h2>
          <div className="flex items-center gap-1 text-[#F59E0B]">
            <TrendingUp size={16} />
            <span className="text-sm font-semibold">+{totalWeek.toLocaleString()}</span>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
          <div className="flex items-end justify-between h-[140px] gap-2">
            {ACTIVITY_DATA.map((d, i) => {
              const maxVal = Math.max(...ACTIVITY_DATA.map((a) => a.value));
              const heightPercent = (d.value / maxVal) * 100;
              const isToday = i === currentDay;
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
                  <span className="text-[10px] text-slate-500 font-medium">{d.value >= 1000 ? `${(d.value / 1000).toFixed(1)}k` : d.value}</span>
                  <div className="w-full flex justify-center items-end h-[100px]">
                    <motion.div
                      className={cn(
                        'rounded-t-md bg-gradient-to-t from-[#F59E0B] to-[#FBBF24]',
                        isToday ? 'w-9 shadow-[0_0_12px_rgba(245,158,11,0.4)]' : 'w-7'
                      )}
                      initial={{ height: 0 }}
                      animate={{ height: `${heightPercent}%` }}
                      transition={{ delay: 0.5 + i * 0.08, duration: 0.6, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
                    />
                  </div>
                  <span className={cn('text-[10px] font-medium', isToday ? 'text-[#F59E0B]' : 'text-slate-500')}>{d.day}</span>
                </div>
              );
            })}
          </div>
        </div>
      </Section>

      {/* ============ Section 5: Recent Activity ============ */}
      <Section className="px-4 mt-6" delay={0.45}>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-fredoka font-bold text-xl text-slate-900">Actividad Reciente</h2>
          <button onClick={() => navigate('/profile')} className="text-[#F59E0B] text-sm font-medium flex items-center gap-0.5">
            Ver Todo <ChevronRight size={16} />
          </button>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {RECENT_ACTIVITY.map((item, i) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: 15 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + i * 0.06, duration: 0.4 }}
                className={cn(
                  'flex items-center gap-3 px-4 py-3',
                  i < RECENT_ACTIVITY.length - 1 && 'border-b border-slate-100'
                )}
              >
                <div className={cn('w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0', item.iconBg)}>
                  <Icon size={18} className={item.iconColor} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-slate-900 text-sm font-semibold truncate">{item.title}</p>
                  <p className="text-slate-500 text-xs">{item.subtitle}</p>
                </div>
                <span className={cn('text-sm font-semibold flex items-center gap-0.5 flex-shrink-0', item.amount >= 0 ? 'text-[#F59E0B]' : 'text-[#EF4444]')}>
                  {item.amount >= 0 ? '+' : ''}{item.amount.toLocaleString()}
                  {item.amount >= 0 && <Coins size={12} className="text-[#F59E0B]" />}
                </span>
              </motion.div>
            );
          })}
        </div>
      </Section>

      {/* ============ Section 6: Recent Redemptions ============ */}
      <Section className="px-4 mt-6" delay={0.55}>
        <h2 className="font-fredoka font-bold text-xl text-slate-900 mb-3">Ultimas Redenciones</h2>
        <div className="flex gap-3 overflow-x-auto snap-x snap-mandatory pb-2 -mx-4 px-4 scrollbar-hide">
          {RECENT_REDEMPTIONS.map((item, i) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 + i * 0.1, duration: 0.4 }}
              whileHover={{ scale: 1.02 }}
              className="snap-start flex-shrink-0 w-[200px] bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm"
            >
              <div className="aspect-[16/10] overflow-hidden">
                <img src={item.image} alt={item.name} className="w-full h-full object-cover" loading="lazy" />
              </div>
              <div className="p-3">
                <p className="text-slate-900 text-sm font-semibold truncate">{item.name}</p>
                <div className="flex items-center justify-between mt-2">
                  <StatusBadge status={item.status} />
                  <span className="text-[#F59E0B] text-xs font-semibold">{item.millas.toLocaleString()} TicaMillas</span>
                </div>
                <p className="text-slate-500 text-[10px] mt-1.5">{item.date}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </Section>

      {/* ============ Section 7: Achievements ============ */}
      <Section className="px-4 mt-6" delay={0.6}>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-fredoka font-bold text-xl text-slate-900">Logros</h2>
          <span className="text-slate-500 text-xs">4 / 24</span>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {ACHIEVEMENTS.map((ach, i) => {
            const Icon = ach.icon;
            return (
              <motion.div
                key={ach.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.65 + i * 0.04, duration: 0.3, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
                className={cn(
                  'relative flex flex-col items-center gap-2 py-4 rounded-2xl border transition-all duration-200',
                  ach.unlocked
                    ? 'bg-white border-[#F59E0B]/30 shadow-[0_0_12px_rgba(245,158,11,0.08)]'
                    : 'bg-slate-50 border-slate-200 opacity-60'
                )}
              >
                <div className={cn('w-10 h-10 rounded-full flex items-center justify-center', ach.unlocked ? 'bg-[#F59E0B]/10' : 'bg-slate-200')}>
                  <Icon size={22} className={ach.unlocked ? 'text-[#F59E0B]' : 'text-slate-400'} />
                </div>
                <p className={cn('text-xs font-medium', ach.unlocked ? 'text-slate-900' : 'text-slate-500')}>{ach.name}</p>
                {!ach.unlocked && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="bg-white/60 rounded-full p-1">
                      <Lock size={14} className="text-slate-400" />
                    </div>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      </Section>

      {/* ============ Section 8: Recommended Products ============ */}
      <Section className="px-4 mt-6 pb-8" delay={0.7}>
        <h2 className="font-fredoka font-bold text-xl text-slate-900 mb-1">Podrias redimir...</h2>
        <p className="text-slate-500 text-sm mb-3">Basado en tus {currentMillas.toLocaleString()} TicaMillas</p>
        <div className="flex gap-3 overflow-x-auto snap-x snap-mandatory pb-2 -mx-4 px-4">
          {RECOMMENDED_PRODUCTS.map((prod, i) => (
            <motion.div
              key={prod.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.75 + i * 0.1, duration: 0.4 }}
              whileHover={{ scale: 1.02 }}
              onClick={() => navigate('/marketplace')}
              className="snap-start flex-shrink-0 w-[160px] bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm cursor-pointer"
            >
              <div className="aspect-square overflow-hidden relative">
                <img src={prod.image} alt={prod.name} className="w-full h-full object-cover" loading="lazy" />
                <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-gradient-to-r from-[#F59E0B] to-[#F97316] text-[10px] font-bold text-white">
                  {prod.millas.toLocaleString()} TicaMillas
                </div>
              </div>
              <div className="p-3">
                <p className="text-slate-900 text-xs font-semibold line-clamp-2 leading-tight">{prod.name}</p>
                <p className="text-slate-500 text-[10px] mt-1">{prod.brand}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </Section>
    </div>
  );
}
