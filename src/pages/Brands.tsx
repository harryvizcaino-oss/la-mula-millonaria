import { useState, useEffect, useRef, memo } from 'react';
import { motion } from 'framer-motion';
import {
  Eye,
  Users,
  BarChart3,
  Truck,
  Zap,
  Image,
  ShoppingBag,
  Check,
  Mail,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { brandPartners, pricingPackages, valuePropositions, inGameFeatures } from '@/data/mockBrands';
import type { BrandPartner, PricingPackage } from '@/data/mockBrands';

/* ------------------------------------------------------------------ */
/*  Tier badge color helper                                            */
/* ------------------------------------------------------------------ */
const tierStyles = {
  Oro: { bg: 'bg-[#FFD700]/15', text: 'text-[#FFD700]', border: 'border-[#FFD700]/30', label: 'Patrocinador Gold' },
  Plata: { bg: 'bg-[#C0C0C0]/15', text: 'text-[#C0C0C0]', border: 'border-[#C0C0C0]/30', label: 'Patrocinador Silver' },
  Bronce: { bg: 'bg-[#CD7F32]/15', text: 'text-[#CD7F32]', border: 'border-[#CD7F32]/30', label: 'Patrocinador Bronze' },
};

/* ------------------------------------------------------------------ */
/*  Icon map                                                           */
/* ------------------------------------------------------------------ */
const iconMap: Record<string, React.ElementType> = {
  Eye,
  Users,
  BarChart3,
  Truck,
  Zap,
  Image,
  ShoppingBag,
};

/* ------------------------------------------------------------------ */
/*  Animated counter                                                   */
/* ------------------------------------------------------------------ */
function useCountUp(end: number, duration = 1000, start = 0) {
  const [count, setCount] = useState(start);
  const ref = useRef<HTMLDivElement>(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true;
          const startTime = performance.now();
          const animate = (now: number) => {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setCount(Math.floor(start + (end - start) * eased));
            if (progress < 1) requestAnimationFrame(animate);
          };
          requestAnimationFrame(animate);
        }
      },
      { threshold: 0.3 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [end, duration, start]);

  return { count, ref };
}

function StatCounter({ value, label, suffix = '' }: { value: number; label: string; suffix?: string }) {
  const { count, ref } = useCountUp(value, 1200);
  return (
    <div ref={ref} className="flex flex-col items-center">
      <span className="font-fredoka font-bold text-xl text-slate-900">{count.toLocaleString()}{suffix}</span>
      <span className="text-[10px] text-slate-500 uppercase tracking-wide">{label}</span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Value Proposition Card                                             */
/* ------------------------------------------------------------------ */
function ValueCard({
  vp,
  index,
}: {
  vp: (typeof valuePropositions)[0];
  index: number;
}) {
  const Icon = iconMap[vp.icon] || Eye;
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ delay: index * 0.1, duration: 0.4 }}
      className="bg-white rounded-2xl p-5 border border-slate-200"
    >
      <div
        className="w-12 h-12 rounded-xl flex items-center justify-center mb-3"
        style={{ backgroundColor: `${vp.iconColor}15` }}
      >
        <Icon size={24} style={{ color: vp.iconColor }} />
      </div>
      <h3 className="font-inter font-semibold text-base text-slate-900 mb-2">{vp.title}</h3>
      <p className="text-sm text-slate-500 leading-relaxed mb-3">{vp.description}</p>
      <p className="text-sm font-bold" style={{ color: vp.iconColor }}>{vp.stat}</p>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  Brand Card                                                         */
/* ------------------------------------------------------------------ */
function BrandCard({ brand, index }: { brand: BrandPartner; index: number }) {
  const tier = tierStyles[brand.tier];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true, margin: '-30px' }}
      transition={{ delay: index * 0.06, duration: 0.35 }}
      whileHover={{ scale: 1.03, y: -4 }}
      className="bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-card transition-shadow duration-200 hover:shadow-[0_8px_24px_rgba(0,0,0,0.3)] cursor-pointer group"
    >
      {/* Top half - brand color area */}
      <div
        className="h-[100px] flex items-center justify-center relative overflow-hidden"
        style={{ background: `linear-gradient(135deg, ${brand.color}22, ${brand.color}44)` }}
      >
        {/* Dot pattern overlay */}
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage: `radial-gradient(circle, ${brand.color} 1px, transparent 1px)`,
            backgroundSize: '12px 12px',
          }}
        />
        <motion.img
          src={brand.logo}
          alt={brand.name}
          className="max-w-[70%] max-h-[60%] object-contain relative z-10 group-hover:scale-105 transition-transform duration-300"
        />
      </div>

      {/* Bottom half - info */}
      <div className="p-3">
        <div className="flex items-start justify-between gap-2 mb-1.5">
          <h3 className="text-sm font-bold text-slate-900 truncate">{brand.name}</h3>
          <span
            className={cn(
              'text-[9px] font-bold px-2 py-0.5 rounded-full border flex-shrink-0',
              tier.bg,
              tier.text,
              tier.border
            )}
          >
            {brand.tier}
          </span>
        </div>
        <p className="text-[10px] text-slate-500 mb-2">{brand.category}</p>
        <p className="text-[10px] text-[#F59E0B] font-medium mb-2">
          {brand.trucks} camion{brand.trucks > 1 ? 'es' : ''} en el juego
        </p>
        {/* Mini stats */}
        <div className="flex gap-3 text-[10px] text-slate-500">
          <span><strong className="text-slate-900">{brand.impressions}</strong> imp.</span>
          <span><strong className="text-slate-900">{brand.clicks}</strong> clicks</span>
          <span><strong className="text-slate-900">{brand.engagement}</strong> eng.</span>
        </div>
      </div>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  Animated Truck (isolated, memoized perpetual animation)           */
/* ------------------------------------------------------------------ */
const AnimatedTruck = memo(function AnimatedTruck() {
  return (
    <div className="relative h-[160px] bg-gradient-to-b from-[#1E3A5F] via-[#87CEEB] to-[#D4A574] rounded-2xl overflow-hidden">
      {/* Sky / City silhouette */}
      <div className="absolute bottom-[40%] left-0 right-0 h-12 flex items-end justify-around opacity-30">
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="bg-white rounded-t-sm"
            style={{
              width: `${20 + Math.random() * 30}px`,
              height: `${20 + Math.random() * 30}px`,
            }}
          />
        ))}
      </div>

      {/* Highway */}
      <div className="absolute bottom-0 left-0 right-0 h-[45%] bg-[#2D3748]">
        {/* Lane lines */}
        <div className="absolute top-1/2 left-0 right-0 h-0.5 flex">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="flex-1 mx-2 h-full bg-[#F7FAFC]/60 rounded-full" />
          ))}
        </div>
      </div>

      {/* Animated truck */}
      <motion.div
        animate={{ x: ['-30%', '130%'] }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: 'linear',
        }}
        className="absolute bottom-[12%] left-0 z-10"
      >
        <div className="relative">
          {/* Truck body */}
          <div className="flex items-end">
            {/* Trailer */}
            <div className="w-16 h-8 bg-[#1E40AF] rounded-sm border border-white/10 flex items-center justify-center">
              <span className="text-[6px] text-slate-700 font-bold">NORTE</span>
            </div>
            {/* Cab */}
            <div className="w-7 h-6 bg-[#1E40AF] rounded-r-sm border border-white/10 -ml-0.5" />
          </div>
          {/* Wheels */}
          <div className="flex gap-6 mt-0.5 ml-1">
            <div className="w-3 h-3 bg-white rounded-full border border-[#94A3B8]" />
            <div className="w-3 h-3 bg-white rounded-full border border-[#94A3B8]" />
          </div>
        </div>
      </motion.div>

      {/* Second truck (opposite direction, slower) */}
      <motion.div
        animate={{ x: ['130%', '-40%'] }}
        transition={{
          duration: 9,
          repeat: Infinity,
          ease: 'linear',
          delay: 2,
        }}
        className="absolute bottom-[20%] left-0 z-10"
      >
        <div className="relative opacity-70">
          <div className="flex items-end">
            <div className="w-12 h-6 bg-[#DC2626] rounded-sm border border-white/10 flex items-center justify-center">
              <span className="text-[5px] text-slate-700 font-bold">EXPRESS</span>
            </div>
            <div className="w-5 h-5 bg-[#DC2626] rounded-r-sm border border-white/10 -ml-0.5" />
          </div>
          <div className="flex gap-4 mt-0.5 ml-1">
            <div className="w-2.5 h-2.5 bg-white rounded-full border border-[#94A3B8]" />
            <div className="w-2.5 h-2.5 bg-white rounded-full border border-[#94A3B8]" />
          </div>
        </div>
      </motion.div>

      {/* Hotspot markers */}
      {[
        { bottom: '35%', left: '20%', label: 'Truck branding' },
        { bottom: '28%', left: '60%', label: 'Billboard' },
        { bottom: '45%', left: '80%', label: 'Background ad' },
      ].map((spot, i) => (
        <div key={i} className="absolute" style={{ bottom: spot.bottom, left: spot.left }}>
          <motion.div
            animate={{ scale: [1, 1.5, 1], opacity: [0.8, 0.3, 0.8] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut', delay: i * 0.5 }}
            className="w-5 h-5 rounded-full border-2 border-[#F59E0B] bg-[#F59E0B]/20"
          />
          <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-white/90 px-2 py-0.5 rounded text-[8px] text-slate-900 whitespace-nowrap opacity-0 hover:opacity-100 transition-opacity pointer-events-none">
            {spot.label}
          </div>
        </div>
      ))}
    </div>
  );
});

/* ------------------------------------------------------------------ */
/*  Pricing Card                                                       */
/* ------------------------------------------------------------------ */
function PricingCard({ pkg, index }: { pkg: PricingPackage; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 30 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ delay: index * 0.1, duration: 0.4 }}
      className={cn(
        'relative flex-shrink-0 w-[260px] rounded-2xl p-5 snap-start',
        'bg-white border-t-[3px]',
        pkg.recommended && 'shadow-[0_8px_32px_rgba(192,192,192,0.15)]'
      )}
      style={{ borderTopColor: pkg.borderColor }}
    >
      {/* Recommended badge */}
      {pkg.recommended && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-gradient-to-r from-[#F59E0B] to-[#FBBF24] text-[10px] font-bold text-white">
          RECOMENDADO
        </div>
      )}

      {/* Floating animation for recommended */}
      <motion.div
        animate={pkg.recommended ? { y: [0, -4, 0] } : {}}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      >
        <h3 className="font-fredoka font-bold text-2xl mt-2" style={{ color: pkg.color }}>
          {pkg.name}
        </h3>
        <p className="text-xl font-bold text-slate-900 mt-1 mb-4">{pkg.price}</p>

        {/* Features */}
        <ul className="space-y-2.5 mb-5">
          {pkg.features.map((feature, i) => (
            <li key={i} className="flex items-start gap-2">
              <Check size={14} className="text-[#10B981] mt-0.5 flex-shrink-0" />
              <span className="text-xs text-slate-500 leading-relaxed">{feature}</span>
            </li>
          ))}
        </ul>

        {/* CTA */}
        <button
          className={cn(
            'w-full py-3 rounded-xl text-sm font-bold transition-all duration-200',
            pkg.recommended
              ? 'bg-gradient-to-r from-[#F59E0B] to-[#FBBF24] text-white hover:shadow-lg hover:shadow-[#F59E0B]/20'
              : 'border-2 text-slate-900 hover:bg-slate-100'
          )}
          style={!pkg.recommended ? { borderColor: pkg.color, color: pkg.color } : {}}
        >
          Contactar
        </button>
      </motion.div>
    </motion.div>
  );
}

/* ================================================================== */
/*  MAIN BRANDS PAGE                                                   */
/* ================================================================== */
export default function Brands() {
  return (
    <div className="min-h-[100dvh] bg-white pt-14 pb-4">
      {/* ========== HERO SECTION ========== */}
      <section className="relative h-[300px] flex flex-col justify-end overflow-hidden">
        {/* Background */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: 'url(/hero-bg.jpg)' }}
        />
        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0D0E14] via-[#0D0E14]/60 to-[#0D0E14]/30" />

        {/* Content */}
        <div className="relative z-10 px-4 pb-0">
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-[10px] font-bold text-[#F59E0B] uppercase tracking-[0.15em] mb-2"
          >
            Patrocinadores Oficiales
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.4 }}
            className="font-fredoka font-bold text-2xl text-slate-900 leading-tight max-w-[280px] mb-2"
          >
            Las marcas que hacen posibles tus recompensas
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-xs text-slate-500 max-w-[280px] leading-relaxed mb-4"
          >
            Cada camion que esquivas lleva el logo de una empresa real. Su publicidad se convierte en tus TicaMillas.
          </motion.p>
        </div>
      </section>

      {/* Stats Row */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="mx-4 -mt-4 relative z-10"
      >
        <div className="bg-black/50 backdrop-blur-xl rounded-xl px-6 py-3 flex items-center justify-around border border-white/[0.06]">
          <StatCounter value={50} suffix="K+" label="Jugadores" />
          <div className="w-px h-8 bg-white/[0.08]" />
          <StatCounter value={1} suffix="M+" label="Impresiones" />
          <div className="w-px h-8 bg-white/[0.08]" />
          <StatCounter value={6} suffix="+" label="Marcas" />
        </div>
      </motion.div>

      {/* ========== VALUE PROPOSITION ========== */}
      <section className="px-4 py-8">
        <motion.h2
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="font-fredoka font-bold text-xl text-slate-900 text-center mb-5"
        >
          Por que anunciarse?
        </motion.h2>
        <div className="space-y-3">
          {valuePropositions.map((vp, i) => (
            <ValueCard key={vp.id} vp={vp} index={i} />
          ))}
        </div>
      </section>

      {/* ========== BRAND PARTNER GRID ========== */}
      <section className="px-4 pb-8">
        <motion.h2
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="font-fredoka font-bold text-xl text-slate-900 mb-4"
        >
          Nuestros Partners
        </motion.h2>
        <div className="grid grid-cols-2 gap-3">
          {brandPartners.map((brand, i) => (
            <BrandCard key={brand.id} brand={brand} index={i} />
          ))}
        </div>
      </section>

      {/* ========== IN-GAME PREVIEW ========== */}
      <section className="bg-white rounded-t-3xl px-4 pt-8 pb-8">
        <motion.h2
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="font-fredoka font-bold text-xl text-slate-900 text-center mb-5"
        >
          Como se ve en el juego?
        </motion.h2>

        {/* Animated preview */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="mb-6"
        >
          <AnimatedTruck />
        </motion.div>

        {/* Feature list */}
        <div className="space-y-3">
          {inGameFeatures.map((feature, i) => {
            const Icon = iconMap[feature.icon] || Truck;
            return (
              <motion.div
                key={feature.id}
                initial={{ opacity: 0, x: -10 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="flex items-center gap-3"
              >
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: `${feature.color}15` }}
                >
                  <Icon size={16} style={{ color: feature.color }} />
                </div>
                <p className="text-sm text-slate-500">{feature.text}</p>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* ========== PRICING PACKAGES ========== */}
      <section className="px-4 py-8">
        <motion.h2
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="font-fredoka font-bold text-xl text-slate-900 text-center mb-5"
        >
          Paquetes de Publicidad
        </motion.h2>
        <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4 snap-x snap-mandatory">
          {pricingPackages.map((pkg, i) => (
            <PricingCard key={pkg.id} pkg={pkg} index={i} />
          ))}
        </div>
      </section>

      {/* ========== CONTACT CTA ========== */}
      <motion.section
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="mx-4 rounded-2xl bg-gradient-to-r from-[#F59E0B] to-[#FBBF24] p-6 text-center"
      >
        <h2 className="font-fredoka font-bold text-xl text-slate-900 mb-2">
          Quieres que tu marca aparezca en La Mula Millonaria?
        </h2>
        <p className="text-sm text-slate-800 mb-5 leading-relaxed">
          Contactanos y te mostramos como llegar a miles de jugadores comprometidos.
        </p>

        {/* Contact button with pulse */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="w-full py-3.5 rounded-xl bg-white text-[#F59E0B] font-bold text-sm flex items-center justify-center gap-2 hover:shadow-lg transition-shadow"
        >
          <Mail size={18} />
          CONTACTAR AHORA
        </motion.button>

        <p className="mt-3 text-xs text-slate-600">
          o escribenos a:{' '}
          <a href="mailto:partners@trucksurfers.com" className="underline hover:text-slate-900 transition-colors">
            partners@trucksurfers.com
          </a>
        </p>

        {/* Trust badges */}
        <div className="flex items-center justify-center gap-2 mt-4 flex-wrap">
          {['VTEX Partner', '+12K Jugadores', '4.8 Estrellas'].map((badge) => (
            <span
              key={badge}
              className="px-2.5 py-1 rounded-full bg-slate-100 text-[10px] text-slate-900 font-medium"
            >
              {badge}
            </span>
          ))}
        </div>
      </motion.section>
    </div>
  );
}
