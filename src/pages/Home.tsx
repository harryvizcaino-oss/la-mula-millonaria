import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { motion, useInView } from 'framer-motion';
import {
  HelpCircle,
  ShoppingBag,
  ChevronDown,
  Infinity as InfinityIcon,
  Timer,
  Target,
  Users,
  Trophy,
  Route,
  Shield,
  Coins,
  ArrowRight,
  Star,
  TrendingUp,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Footer from '@/components/Footer';
import { useMillas } from '@/providers/MillasProvider';
import { useClickerStore, calculateClickPower } from '@/store/clickerStore';
import { GameTutorial } from '@/components/GameTutorial';
import { getTruckAsset } from '@/data/truckAssets';
import { FLEET_VEHICLES } from '@/data/fleetVehicles';

/* ─────────────────────── Animation Variants ─────────────────────── */

const staggerContainer = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.1 },
  },
};

const staggerItem = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] },
  },
};

/* ─────────────────────── Animated Counter ─────────────────────── */

function useAnimatedCounter(target: number, duration: number = 1000, start: boolean = false) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!start) return;
    let startTime: number | null = null;
    let raf: number;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(target * eased));
      if (progress < 1) {
        raf = requestAnimationFrame(animate);
      }
    };

    raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
  }, [target, duration, start]);

  return count;
}

function formatNumber(n: number): string {
  if (n < 1000) return Math.floor(n).toLocaleString('es-CO');
  if (n < 1_000_000) return `${(n / 1000).toFixed(n < 10_000 ? 1 : 0)}K`;
  if (n < 1_000_000_000) return `${(n / 1_000_000).toFixed(n < 10_000_000 ? 2 : 1)}M`;
  return `${(n / 1_000_000_000).toFixed(2)}B`;
}

/* ─────────────────────── Section Components ─────────────────────── */

function HeroSection({ onOpenTutorial }: { onOpenTutorial: () => void }) {
  const navigate = useNavigate();
  const { millas } = useMillas();
  const clicker = useClickerStore();
  const clickPower = calculateClickPower(clicker);
  const { user, isAuthenticated, isLoading, logout } = useAuth();

  // Nubes orgánicas (float 40-60s, delays negativos para distribuirlas)
  const clouds = [
    { top: '10%', width: 150, height: 46, dur: 48, delay: -14 },
    { top: '20%', width: 110, height: 36, dur: 60, delay: -38 },
    { top: '6%', width: 190, height: 54, dur: 55, delay: -50 },
    { top: '28%', width: 120, height: 38, dur: 42, delay: -6 },
    { top: '16%', width: 90, height: 30, dur: 44, delay: -26 },
  ];

  // Partículas doradas flotando hacia arriba (deterministas)
  const particles = useMemo(
    () =>
      Array.from({ length: 16 }, (_, i) => ({
        left: (i * 61 + 7) % 96,
        delay: -((i * 1.37) % 10),
        dur: 8 + (i % 5) * 1.7,
        size: 3 + (i % 3) * 2,
      })),
    []
  );

  const initials =
    user?.name
      ?.split(' ')
      .map((n) => n[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() || 'TU';

  return (
    <section className="home-hero relative min-h-[100dvh] flex flex-col items-center px-6 overflow-hidden">
      {/* Sol dorado con glow pulse (top-right, 60px) */}
      <div className="home-sun" />

      {/* Nubes orgánicas blancas */}
      {clouds.map((c, i) => (
        <div
          key={i}
          className="home-cloud"
          style={{
            top: c.top,
            left: 0,
            width: c.width,
            height: c.height,
            animationDuration: `${c.dur}s`,
            animationDelay: `${c.delay}s`,
          }}
        />
      ))}

      {/* Partículas doradas */}
      {particles.map((p, i) => (
        <span
          key={i}
          className="home-particle"
          style={{
            left: `${p.left}%`,
            width: p.size,
            height: p.size,
            animationDuration: `${p.dur}s`,
            animationDelay: `${p.delay}s`,
          }}
        />
      ))}

      {/* Top counters */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="absolute top-14 left-0 right-0 z-10 px-6"
      >
        <div className="flex items-center justify-center gap-3">
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-[#F59E0B] to-[#F97316] shadow-lg">
            <Coins size={16} className="text-slate-900" />
            <div className="cps-counter-display">
              <span className="cps-counter-number-static font-fredoka font-bold text-slate-900">
                {millas.toLocaleString('es-CO')}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/25 backdrop-blur-md shadow-sm">
            <TrendingUp size={16} className="text-[#4ADE80]" />
            <span className="font-fredoka font-bold text-white">+{formatNumber(clickPower)}/click</span>
          </div>
        </div>
      </motion.div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center text-center w-full max-w-sm flex-1 justify-center py-10 mt-10">
        {/* Contador CPS grande arriba del camión (28-44px gold glow) */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.35, duration: 0.4 }}
          className="cps-counter-overlay"
        >
          <span className="cps-counter-value">{formatNumber(clicker.cpsBalance)}</span>
          <span className="cps-counter-label">CPS</span>
        </motion.div>

        {/* Camión PNG centrado (180px) con idle bounce */}
        <motion.div
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', stiffness: 260, damping: 20, delay: 0.2 }}
        >
          <img
            src={getTruckAsset(clicker.selectedFleet)}
            alt="Tractomula"
            className="home-truck"
            draggable={false}
          />
        </motion.div>

        {/* Título 3D gold metallic */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.5, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
          className="home-title-3d font-fredoka font-black uppercase text-[clamp(38px,11vw,60px)] leading-[0.95] tracking-wide mt-4 mb-3"
        >
          La Mula
          <br />
          Millonaria
        </motion.h1>

        {/* Subtítulo */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.3 }}
          className="text-white/85 text-base font-inter mb-7 max-w-[280px]"
          style={{ textShadow: '0 1px 3px rgba(0,0,0,0.5)' }}
        >
          Toca la tractomula, arma tu flota
        </motion.p>

        {/* Botón JUGAR 280x64 gold glossy con pulse */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.0, duration: 0.4, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
          className="mb-5"
        >
          <button className="home-play-btn" onClick={() => navigate('/game')}>
            JUGAR
          </button>
        </motion.div>

        {/* Links secundarios gold */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2, duration: 0.3 }}
          className="flex items-center gap-5"
        >
          <button
            onClick={onOpenTutorial}
            className="home-link-gold flex items-center gap-1.5 text-sm"
          >
            <HelpCircle size={16} />
            <span>Como Jugar?</span>
          </button>
          <button
            onClick={() => navigate('/marketplace')}
            className="home-link-gold flex items-center gap-1.5 text-sm"
          >
            <ShoppingBag size={16} />
            <span>Ver Tienda</span>
          </button>
        </motion.div>

        {/* Auth actions (compactas, glass) */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.4, duration: 0.3 }}
          className="mt-5 w-full max-w-[280px] flex gap-2.5"
        >
          {!isLoading && isAuthenticated ? (
            <>
              <button
                type="button"
                onClick={() => navigate('/profile')}
                className="home-section-card flex-1 h-10 rounded-xl text-white font-fredoka font-bold text-xs hover:bg-white/10 transition-colors"
              >
                Mi perfil
              </button>
              <button
                type="button"
                onClick={() => logout()}
                className="flex-1 h-10 rounded-xl bg-black/25 border border-white/15 text-white/70 font-fredoka font-bold text-xs hover:bg-black/35 transition-colors"
              >
                Cerrar sesión
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  navigate('/login');
                }}
                className="flex-1 h-10 rounded-xl bg-gradient-to-r from-[#F59E0B] to-[#F97316] text-white font-fredoka font-black text-xs shadow-md hover:opacity-90 transition-opacity"
              >
                Iniciar sesión
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  navigate('/register');
                }}
                className="home-section-card flex-1 h-10 rounded-xl text-white font-fredoka font-black text-xs hover:bg-white/10 transition-colors"
              >
                Crear cuenta
              </button>
            </>
          )}
        </motion.div>
      </div>

      {/* Stats panel glassmorphism: avatar, nombre, CPS total, camiones */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.5, duration: 0.45, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
        className="home-stats-panel relative z-10 w-full max-w-sm mb-16 px-4 py-3 flex items-center gap-3"
      >
        <div className="w-11 h-11 rounded-full bg-gradient-to-br from-[#FFD700] to-[#F59E0B] flex items-center justify-center text-[#4A3000] font-fredoka font-black text-sm flex-shrink-0 border-2 border-white/50 shadow-lg">
          {initials}
        </div>
        <div className="flex-1 min-w-0 text-left">
          <p className="text-white text-sm font-bold truncate">{user?.name || 'Invitado'}</p>
          <p className="text-white/60 text-[11px] truncate">Conductor de la flota</p>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="font-fredoka font-black text-[#FFD700] text-base leading-tight">
            {formatNumber(clicker.cpsTotal)}
          </p>
          <p className="text-white/60 text-[9px] uppercase tracking-wider">CPS Total</p>
        </div>
        <div className="w-px h-8 bg-white/20 flex-shrink-0" />
        <div className="text-right flex-shrink-0">
          <p className="font-fredoka font-black text-[#FFD700] text-base leading-tight">
            {clicker.fleetOwned.length}/{FLEET_VEHICLES.length}
          </p>
          <p className="text-white/60 text-[9px] uppercase tracking-wider">Camiones</p>
        </div>
      </motion.div>

      {/* Scroll Indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.7, duration: 0.5 }}
        className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10"
      >
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
        >
          <ChevronDown size={24} className="text-white/70" />
        </motion.div>
      </motion.div>
    </section>
  );
}

function MillasStrip() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });
  const navigate = useNavigate();
  const { millas } = useMillas();
  const animatedMillas = useAnimatedCounter(millas, 1500, isInView);

  return (
    <section
      ref={ref}
      className="sticky top-0 z-30 bg-[#121C26]/90 backdrop-blur-md border-y border-white/10"
    >
      <div className="flex items-center justify-between h-14 px-4">
        <div className="flex items-center gap-2">
          <motion.div
            animate={isInView ? { rotateY: [0, 360] } : {}}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
            className="w-7 h-7 flex items-center justify-center"
            style={{ perspective: '100px' }}
          >
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center font-fredoka font-bold text-xs text-slate-900"
              style={{ background: 'linear-gradient(135deg, #F59E0B 0%, #F97316 100%)' }}
            >
              M
            </div>
          </motion.div>
          <div>
            <span className="font-fredoka font-bold text-lg text-white">
              {animatedMillas.toLocaleString('es-CO')}
            </span>
            <p className="text-[10px] text-slate-400 -mt-0.5">TicaMillas</p>
          </div>
        </div>
        <button
          onClick={() => navigate('/marketplace')}
          className="px-4 py-1.5 rounded-full bg-[#F59E0B] text-white text-xs font-bold hover:bg-[#D97706] transition-colors"
        >
          Redimir →
        </button>
      </div>
    </section>
  );
}

function GameModesSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-20%' });
  const navigate = useNavigate();

  const modes = [
    {
      title: 'Clicker',
      desc: 'Toca la tractomula sin parar y haz crecer tu flota.',
      icon: InfinityIcon,
      color: '#F59E0B',
      borderColor: 'rgba(245,158,11,0.35)',
      gradient: 'linear-gradient(135deg, rgba(245,158,11,0.16) 0%, rgba(245,158,11,0.06) 100%)',
    },
    {
      title: 'Eventos',
      desc: 'Bonus aleatorios que multiplican tus ganancias.',
      icon: Timer,
      color: '#EF4444',
      borderColor: 'rgba(239,68,68,0.35)',
      gradient: 'linear-gradient(135deg, rgba(239,68,68,0.16) 0%, rgba(239,68,68,0.06) 100%)',
    },
    {
      title: 'Prestigio',
      desc: 'Reinicia tu flota para ganar Estrellas de Carretera permanentes.',
      icon: Target,
      color: '#3B82F6',
      borderColor: 'rgba(59,130,246,0.35)',
      gradient: 'linear-gradient(135deg, rgba(59,130,246,0.16) 0%, rgba(59,130,246,0.06) 100%)',
    },
    {
      title: 'Vs Amigos',
      desc: 'Compite por quien genera mas TicaMillas. Proximamente!',
      icon: Users,
      color: '#10B981',
      borderColor: 'rgba(16,185,129,0.35)',
      gradient: 'linear-gradient(135deg, rgba(16,185,129,0.16) 0%, rgba(16,185,129,0.06) 100%)',
      badge: 'PRONTO',
      disabled: true,
    },
  ];

  return (
    <section ref={ref} className="py-6 px-4">
      <motion.h2
        initial={{ opacity: 0, y: 20 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
        className="font-fredoka font-bold text-xl text-white mb-4"
      >
        Modos de Juego
      </motion.h2>

      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate={isInView ? 'visible' : 'hidden'}
        className="grid grid-cols-2 gap-3"
      >
        {modes.map((mode) => (
          <motion.div
            key={mode.title}
            variants={staggerItem}
            onClick={() => !mode.disabled && navigate('/game')}
            className={cn(
              'relative rounded-2xl p-4 cursor-pointer transition-all duration-200',
              'border active:scale-[0.98] backdrop-blur-sm',
              mode.disabled && 'opacity-60 cursor-not-allowed'
            )}
            style={{
              background: mode.gradient,
              borderColor: mode.borderColor,
            }}
          >
            {mode.badge && (
              <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-white/90 text-[9px] font-bold text-slate-700 shadow-sm">
                {mode.badge}
              </span>
            )}
            <mode.icon size={32} color={mode.color} strokeWidth={2} className="mb-2" />
            <h3 className="font-inter font-semibold text-white text-sm mb-1">{mode.title}</h3>
            <p className="text-slate-300 text-[11px] leading-tight">{mode.desc}</p>
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}

function QuickStatsSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-20%' });
  const navigate = useNavigate();
  const { totalClicks, cpsTotal, stars } = useClickerStore();
  const clickCount = useAnimatedCounter(totalClicks, 1000, isInView);
  const cpsCount = useAnimatedCounter(Math.floor(cpsTotal), 1000, isInView);
  const starCount = useAnimatedCounter(stars, 1000, isInView);

  const stats = [
    { icon: Trophy, color: '#F59E0B', value: `#42`, label: 'Tu Rank', path: '/leaderboard' },
    { icon: Route, color: '#3B82F6', value: `${cpsCount.toLocaleString('es-CO')} CPS`, label: 'CPS Totales', path: '/dashboard' },
    { icon: Target, color: '#10B981', value: clickCount.toLocaleString('es-CO'), label: 'Clicks', path: '/dashboard' },
    { icon: Star, color: '#FACC15', value: starCount.toLocaleString('es-CO'), label: 'Estrellas', path: '/dashboard' },
  ];

  return (
    <section ref={ref} className="px-4 py-2">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
        className="home-section-card rounded-2xl p-4"
      >
        <div className="flex items-center justify-around">
          {stats.map((stat) => (
            <button
              key={stat.label}
              onClick={() => navigate(stat.path)}
              className="flex flex-col items-center gap-1 p-2 rounded-xl hover:bg-white/5 transition-colors"
            >
              <stat.icon size={22} color={stat.color} strokeWidth={2} />
              <span className="font-fredoka font-bold text-white text-base">{stat.value}</span>
              <span className="text-[10px] text-slate-400">{stat.label}</span>
            </button>
          ))}
        </div>
      </motion.div>
    </section>
  );
}

function MarketplacePreviewSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-20%' });
  const navigate = useNavigate();

  const products = [
    { name: 'Audifonos Bluetooth', millas: 8500, image: '/product-audifonos.jpg' },
    { name: 'Mochila Transporte', millas: 12000, image: '/product-mochila.jpg' },
    { name: 'Botella Termica', millas: 4200, image: '/product-botella.jpg' },
    { name: 'Gift Card $20,000', millas: 20000, image: '/product-giftcard.jpg' },
  ];

  return (
    <section ref={ref} className="py-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={isInView ? { opacity: 1 } : {}}
        transition={{ duration: 0.5 }}
        className="flex items-center justify-between px-4 mb-4"
      >
        <h2 className="font-fredoka font-bold text-xl text-white">Redime tus TicaMillas</h2>
        <button
          onClick={() => navigate('/marketplace')}
          className="text-[#F59E0B] text-sm font-medium flex items-center gap-0.5 hover:opacity-80"
        >
          Ver Todo
          <ArrowRight size={14} />
        </button>
      </motion.div>

      {/* Product Carousel */}
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate={isInView ? 'visible' : 'hidden'}
        className="flex gap-3 overflow-x-auto snap-x snap-mandatory px-4 pb-2 custom-scrollbar"
      >
        {products.map((product) => (
          <motion.div
            key={product.name}
            variants={staggerItem}
            onClick={() => navigate('/marketplace')}
            className="flex-shrink-0 w-40 cursor-pointer active:scale-95 transition-transform"
          >
            <div className="home-section-card relative rounded-2xl overflow-hidden">
              <div className="relative">
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full aspect-square object-cover"
                  loading="lazy"
                />
                {/* Millas Badge */}
                <div
                  className="absolute top-2 right-2 px-2 py-0.5 rounded-full text-[10px] font-bold text-slate-900"
                  style={{ background: 'linear-gradient(135deg, #F59E0B 0%, #F97316 100%)' }}
                >
                  {product.millas.toLocaleString('es-CO')} M
                </div>
              </div>
              <div className="p-3">
                <h3 className="font-inter font-semibold text-white text-sm leading-tight line-clamp-2">
                  {product.name}
                </h3>
                <p className="text-[#F59E0B] text-xs font-bold mt-1">
                  {product.millas.toLocaleString('es-CO')} TicaMillas
                </p>
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}

function BrandPartnersSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  const brands = [
    { name: 'Transportes del Norte', logo: '/brand-logo-norte.png' },
    { name: 'Carga Express', logo: '/brand-logo-express.png' },
    { name: 'Logistica Andina', logo: '/brand-logo-andina.png' },
    { name: 'EcoTransporte', logo: '/brand-logo-eco.png' },
    { name: 'Transporte Veloz', logo: '/brand-logo-veloz.png' },
    { name: 'El Camion', logo: '/brand-logo-camion.png' },
  ];

  // Duplicate for seamless loop
  const allBrands = [...brands, ...brands];

  return (
    <section ref={ref} className="bg-black/20 py-5 overflow-hidden">
      <motion.p
        initial={{ opacity: 0 }}
        animate={isInView ? { opacity: 1 } : {}}
        transition={{ duration: 0.5 }}
        className="text-center text-[10px] uppercase tracking-widest text-slate-400 mb-3 px-4"
      >
        Patrocinadores Oficiales
      </motion.p>

      <motion.div
        initial={{ opacity: 0 }}
        animate={isInView ? { opacity: 1 } : {}}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="relative overflow-hidden"
      >
        <div className="flex animate-marquee">
          {allBrands.map((brand, i) => (
            <div
              key={`${brand.name}-${i}`}
              className="flex-shrink-0 mx-4 opacity-70 hover:opacity-100 transition-opacity"
            >
              <img
                src={brand.logo}
                alt={brand.name}
                className="h-8 w-auto object-contain"
                loading="lazy"
              />
            </div>
          ))}
        </div>
      </motion.div>
    </section>
  );
}

function DailyChallengesSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-20%' });
  const navigate = useNavigate();
  const { totalClicks, cpsTotal, fleetOwned } = useClickerStore();

  const challenges = [
    {
      title: 'Haz 200 clicks',
      icon: Shield,
      color: '#F59E0B',
      progress: Math.min(totalClicks, 200),
      total: 200,
      reward: '+500',
    },
    {
      title: 'Compra 10 vehiculos',
      icon: Coins,
      color: '#10B981',
      progress: Math.min(fleetOwned.length, 10),
      total: 10,
      reward: '+300',
    },
    {
      title: 'Acumula 1.000 CPS totales',
      icon: Route,
      color: '#3B82F6',
      progress: Math.min(Math.floor(cpsTotal), 1000),
      total: 1000,
      reward: '+1,000',
      unit: ' CPS',
    },
  ];

  return (
    <section ref={ref} className="py-6 px-4">
      <motion.h2
        initial={{ opacity: 0, y: 20 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
        className="font-fredoka font-bold text-xl text-white mb-4"
      >
        Desafios de Hoy
      </motion.h2>

      <div className="space-y-3">
        {challenges.map((challenge, index) => (
          <motion.div
            key={challenge.title}
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: index * 0.1, duration: 0.5, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
            onClick={() => navigate('/game')}
            className="home-section-card rounded-2xl p-4 cursor-pointer active:scale-[0.98] transition-transform"
          >
            <div className="flex items-center gap-3 mb-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: `${challenge.color}15` }}
              >
                <challenge.icon size={20} color={challenge.color} strokeWidth={2} />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-inter font-semibold text-white text-sm">{challenge.title}</h3>
              </div>
              <span
                className="px-2 py-0.5 rounded-full text-[10px] font-bold text-slate-900 flex-shrink-0"
                style={{ background: 'linear-gradient(135deg, #F59E0B 0%, #F97316 100%)' }}
              >
                {challenge.reward} TicaMillas
              </span>
            </div>

            {/* Progress Bar */}
            <div className="relative">
              <div className="progress-bar-v2">
                <motion.div
                  initial={{ width: 0 }}
                  animate={isInView ? { width: `${(challenge.progress / challenge.total) * 100}%` } : {}}
                  transition={{ delay: index * 0.1 + 0.3, duration: 0.8, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
                  className={cn(
                    'progress-fill-v2',
                    challenge.progress >= challenge.total && 'complete'
                  )}
                />
              </div>
              <p className={cn(
                'text-[10px] text-slate-400 mt-1 text-right progress-label-v2',
                challenge.progress >= challenge.total && 'complete'
              )}>
                {challenge.progress}{challenge.unit || ''} / {challenge.total}{challenge.unit || ''}
              </p>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

function LeaderboardSneakPeekSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-20%' });
  const navigate = useNavigate();

  const topPlayers = [
    { rank: 2, name: 'AnaR23', score: 38940, avatar: '/badge-silver.png', borderColor: '#C0C0C0', size: 'sm' },
    { rank: 1, name: 'CarlosM', score: 45230, avatar: '/badge-gold.png', borderColor: '#FFD700', size: 'lg' },
    { rank: 3, name: 'TruckKing', score: 31200, avatar: '/badge-bronze.png', borderColor: '#CD7F32', size: 'sm' },
  ];

  return (
    <section
      ref={ref}
      className="bg-black/20 rounded-t-3xl pt-6 pb-8 px-4"
    >
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
        className="mb-6"
      >
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-fredoka font-bold text-xl text-white">Tabla de Lideres</h2>
            <p className="text-slate-400 text-xs mt-0.5">
              Los mejores conductores esta semana
            </p>
          </div>
          <button
            onClick={() => navigate('/leaderboard')}
            className="text-[#F59E0B] text-sm font-medium flex items-center gap-0.5 hover:opacity-80"
          >
            Ver Completa
            <ArrowRight size={14} />
          </button>
        </div>
      </motion.div>

      {/* Podium */}
      <div className="flex items-end justify-center gap-4">
        {[topPlayers[0], topPlayers[1], topPlayers[2]].map((player, index) => (
          <motion.div
            key={player.rank}
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{
              delay: index * 0.15,
              duration: 0.5,
              ease: [0.16, 1, 0.3, 1] as [number, number, number, number],
            }}
            className={cn(
              'flex flex-col items-center',
              player.size === 'lg' && '-mb-2 -mt-4 z-10'
            )}
            style={{ order: index }}
          >
            {/* Avatar */}
            <div className="relative mb-2">
              <div
                className={cn(
                  'rounded-full overflow-hidden flex items-center justify-center bg-white/90',
                  player.size === 'lg' ? 'w-16 h-16 border-[3px]' : 'w-12 h-12 border-2'
                )}
                style={{ borderColor: player.borderColor }}
              >
                <img
                  src={player.avatar}
                  alt={`Rank ${player.rank}`}
                  className="w-3/4 h-3/4 object-contain"
                />
              </div>
            </div>

            {/* Name */}
            <p className={cn('font-bold text-white', player.size === 'lg' ? 'text-sm' : 'text-xs')}>
              {player.name}
            </p>

            {/* Score */}
            <p className={cn('font-fredoka font-bold text-[#F59E0B]', player.size === 'lg' ? 'text-lg' : 'text-sm')}>
              {player.score.toLocaleString('es-CO')}
            </p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

/* ─────────────────────── Main Home Page ─────────────────────── */

export default function Home() {
  const [showTutorial, setShowTutorial] = useState(false);
  return (
    <div className="min-h-[100dvh]" style={{ background: 'linear-gradient(180deg, #27AE60 0%, #1E6A45 4%, #16202B 14%, #101820 100%)' }}>
      <HeroSection onOpenTutorial={() => setShowTutorial(true)} />
      <MillasStrip />
      <GameModesSection />
      <QuickStatsSection />
      <MarketplacePreviewSection />
      <BrandPartnersSection />
      <DailyChallengesSection />
      <LeaderboardSneakPeekSection />
      <Footer />
      <GameTutorial forceOpen={showTutorial} onClose={() => setShowTutorial(false)} />
    </div>
  );
}
