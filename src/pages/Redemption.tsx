import { useState, useEffect, useCallback, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Lock,
  Check,
  X,
  Copy,
  ExternalLink,
  Share2,
  ShoppingBag,
  Truck as TruckIcon,
  Loader2,
  AlertCircle,
  RotateCcw,
  MessageCircle,
  ChevronRight,
  Sparkles,
  Zap,
  ShieldCheck,
  Package,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import PrimaryButton from '@/components/PrimaryButton';
import { getGradientClass } from '@/data/mockProducts';
import type { Product } from '@/data/mockProducts';
import { useAuth } from '@/hooks/useAuth';
import { useMillas } from '@/providers/MillasProvider';
import { trpc } from '@/providers/trpc';
import confetti from 'canvas-confetti';

/* ═══════════════════════════════════════════════════════════════════
   Types & Helpers
   ═══════════════════════════════════════════════════════════════════ */

type RedemptionStep = 'review' | 'processing' | 'success' | 'error';

interface ProcessingStep {
  label: string;
  icon: React.ReactNode;
}

const processingSteps: ProcessingStep[] = [
  { label: 'Verificando saldo...', icon: <ShieldCheck size={20} /> },
  { label: 'Generando Gift Card...', icon: <Sparkles size={20} /> },
  { label: 'Confirmando con VTEX...', icon: <Zap size={20} /> },
];

function formatMillas(n: number): string {
  return n.toLocaleString('es-CO');
}

function generateGiftCardCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const segments = [];
  for (let s = 0; s < 3; s++) {
    let seg = '';
    for (let i = 0; i < 4; i++) {
      seg += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    segments.push(seg);
  }
  return `TS-${segments.join('-')}`;
}

function getCategoryIconComponent() {
  return Package;
}

/* ═══════════════════════════════════════════════════════════════════
   CountUp/CountDown Animation
   ═══════════════════════════════════════════════════════════════════ */

function AnimatedNumber({ value, duration = 1500, className }: { value: number; duration?: number; className?: string }) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const start = display;
    const end = value;
    const diff = end - start;
    if (diff === 0) return;

    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(start + diff * eased));
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return <span className={className}>{formatMillas(display)}</span>;
}

/* ═══════════════════════════════════════════════════════════════════
   Barcode Component
   ═══════════════════════════════════════════════════════════════════ */

function BarcodeSVG() {
  const bars = Array.from({ length: 40 }, (_, i) => {
    const width = Math.random() > 0.5 ? 2 : 3;
    const gap = Math.random() > 0.7 ? 4 : 2;
    return { width, gap, id: i };
  });

  let x = 0;
  return (
    <svg width="100%" height="40" viewBox="0 0 200 40" className="opacity-70">
      {bars.map((bar) => {
        const pos = x;
        x += bar.width + bar.gap;
        return (
          <rect
            key={bar.id}
            x={pos}
            y={0}
            width={bar.width}
            height={40}
            fill="currentColor"
          />
        );
      })}
    </svg>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   Product Placeholder
   ═══════════════════════════════════════════════════════════════════ */

function ProductPlaceholder({ gradient }: { gradient: string }) {
  const Icon = getCategoryIconComponent();
  return (
    <div className={cn('w-full h-full bg-gradient-to-br flex items-center justify-center rounded-xl', gradient)}>
      <Icon size={32} className="text-slate-400" />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   Review Screen
   ═══════════════════════════════════════════════════════════════════ */

function ReviewScreen({
  product,
  userMillas,
  onConfirm,
  onCancel,
}: {
  product: Product;
  userMillas: number;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const [termsAccepted, setTermsAccepted] = useState(false);
  const remaining = userMillas - product.millasCost;
  const canAfford = remaining >= 0;

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
      className="min-h-[100dvh] bg-white px-4 pb-8"
    >
      {/* Header */}
      <div className="flex items-center gap-3 pt-16 pb-4">
        <button
          onClick={onCancel}
          className="p-2 -ml-2 rounded-full hover:bg-slate-100 transition-colors"
        >
          <ArrowLeft size={22} className="text-slate-900" />
        </button>
        <h1 className="font-fredoka font-bold text-lg text-slate-900">Confirmar Redencion</h1>
      </div>

      {/* Product Summary Card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="bg-white rounded-2xl p-5 border border-slate-200"
      >
        <div className="flex gap-4">
          <div className="w-20 h-20 flex-shrink-0">
            <ProductPlaceholder gradient={getGradientClass(product.image)} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-slate-900 font-semibold text-sm leading-tight line-clamp-2">{product.name}</h3>
            <p className="text-slate-500 text-xs mt-0.5">{product.brand}</p>
            <div className="flex items-center gap-1.5 mt-2">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-[#F59E0B]">
                <circle cx="12" cy="12" r="10" fill="currentColor" opacity="0.2" />
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                <text x="12" y="16" textAnchor="middle" fill="currentColor" fontSize="10" fontWeight="bold" fontFamily="Fredoka, sans-serif">M</text>
              </svg>
              <span className="text-[#F59E0B] font-fredoka font-bold text-lg">{formatMillas(product.millasCost)}</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Millas Balance Flow */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mt-4 bg-white rounded-2xl p-5 border border-slate-200"
      >
        <div className="flex items-center justify-between">
          <div className="text-center">
            <p className="text-slate-500 text-[10px] uppercase tracking-wider">Tus TicaMillas</p>
            <p className="text-slate-900 font-bold text-lg"><AnimatedNumber value={userMillas} /></p>
          </div>
          <div className="flex items-center">
            <ChevronRight size={18} className="text-slate-500" />
          </div>
          <div className="text-center">
            <p className="text-slate-500 text-[10px] uppercase tracking-wider">TicaMillas restantes</p>
            <p className={cn('font-bold text-lg', canAfford ? 'text-[#10B981]' : 'text-[#EF4444]')}>
              <AnimatedNumber value={Math.max(0, remaining)} />
            </p>
          </div>
        </div>

        {/* Warning */}
        {!canAfford && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mt-3 p-3 bg-[#EF4444]/10 border border-[#EF4444]/20 rounded-xl flex items-center gap-2"
          >
            <AlertCircle size={16} className="text-[#EF4444] flex-shrink-0" />
            <p className="text-[#EF4444] text-xs">
              Te faltan {formatMillas(Math.abs(remaining))} TicaMillas. Sigue jugando para acumular mas!
            </p>
          </motion.div>
        )}
      </motion.div>

      {/* Breakdown Table */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="mt-4 bg-slate-100 rounded-2xl p-4 space-y-2.5"
      >
        {[
          { label: 'Costo en TicaMillas', value: `${formatMillas(product.millasCost)} M` },
          { label: 'Equivalente', value: `$${formatMillas(product.priceCOP)} COP` },
          { label: 'Impuestos', value: 'Incluidos' },
          { label: 'Envio', value: 'Gratis' },
        ].map((item) => (
          <div key={item.label} className="flex justify-between text-sm">
            <span className="text-slate-500">{item.label}</span>
            <span className="text-slate-900 font-medium">{item.value}</span>
          </div>
        ))}
        <div className="border-t border-white/[0.06] pt-2.5 flex justify-between">
          <span className="text-[#F59E0B] font-bold">Total</span>
          <span className="text-[#F59E0B] font-fredoka font-bold">{formatMillas(product.millasCost)} TicaMillas</span>
        </div>
      </motion.div>

      {/* Delivery info */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mt-4 flex items-center gap-3 px-1"
      >
        <TruckIcon size={20} className="text-[#3B82F6]" />
        <div>
          <p className="text-slate-900 text-sm">Entrega estimada: 3-5 dias habiles</p>
          <p className="text-slate-500 text-[11px]">Via VTEX + Transportes del Norte</p>
        </div>
      </motion.div>

      {/* Terms checkbox */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="mt-6 flex items-start gap-2.5"
      >
        <button
          onClick={() => setTermsAccepted(!termsAccepted)}
          className={cn(
            'w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors',
            termsAccepted
              ? 'bg-[#F59E0B] border-[#F59E0B]'
              : 'border-[#94A3B8]/40'
          )}
        >
          {termsAccepted && <Check size={12} className="text-slate-900" />}
        </button>
        <p className="text-slate-500 text-xs leading-relaxed">
          Acepto los terminos de redencion.{' '}
          <span className="text-[#F59E0B] cursor-pointer hover:underline">Ver terminos</span>
        </p>
      </motion.div>

      {/* Action buttons */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mt-6 space-y-2"
      >
        <PrimaryButton
          variant="primary"
          icon={<Lock size={16} />}
          disabled={!canAfford || !termsAccepted}
          onClick={onConfirm}
        >
          CONFIRMAR REDENCION
        </PrimaryButton>
        <PrimaryButton variant="ghost" onClick={onCancel}>
          Cancelar
        </PrimaryButton>
      </motion.div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   Processing Screen
   ═══════════════════════════════════════════════════════════════════ */

function ProcessingScreen({ onCancel }: { onCancel: () => void }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const truckRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const totalDuration = 4500;
    const stepDuration = totalDuration / processingSteps.length;

    const stepTimer = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev >= processingSteps.length - 1) {
          clearInterval(stepTimer);
          return prev;
        }
        return prev + 1;
      });
    }, stepDuration);

    const progressTimer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progressTimer);
          return 100;
        }
        return prev + 2;
      });
    }, 90);

    return () => {
      clearInterval(stepTimer);
      clearInterval(progressTimer);
    };
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-white/95 flex flex-col items-center justify-center px-8"
    >
      {/* Spinning coin + orbiting truck */}
      <div className="relative w-24 h-24 mb-8">
        <motion.div
          animate={{ rotateY: 360 }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
          className="absolute inset-0 flex items-center justify-center"
          style={{ perspective: 200 }}
        >
          <svg width="64" height="64" viewBox="0 0 64 64" fill="none" className="text-[#F59E0B]">
            <circle cx="32" cy="32" r="28" fill="url(#coinGrad)" />
            <circle cx="32" cy="32" r="28" stroke="#FBBF24" strokeWidth="2" />
            <text x="32" y="40" textAnchor="middle" fill="white" fontSize="20" fontWeight="bold" fontFamily="Fredoka, sans-serif">M</text>
            <defs>
              <linearGradient id="coinGrad" x1="0" y1="0" x2="64" y2="64">
                <stop offset="0%" stopColor="#F59E0B" />
                <stop offset="100%" stopColor="#F97316" />
              </linearGradient>
            </defs>
          </svg>
        </motion.div>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
          className="absolute inset-0"
        >
          <div className="absolute -top-2 left-1/2 -translate-x-1/2">
            <TruckIcon size={16} className="text-[#FBBF24]" />
          </div>
        </motion.div>
      </div>

      {/* Status text */}
      <AnimatePresence mode="wait">
        <motion.h2
          key={currentStep}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="font-fredoka font-bold text-2xl text-slate-900 mb-2 text-center"
        >
          {processingSteps[currentStep]?.label || 'Listo!'}
        </motion.h2>
      </AnimatePresence>

      <p className="text-slate-500 text-sm mb-8 text-center">Procesando tu redencion...</p>

      {/* Progress bar with animated truck */}
      <div className="w-64 h-1 bg-white rounded-full overflow-hidden relative">
        <motion.div
          className="h-full bg-gradient-to-r from-[#F59E0B] to-[#FBBF24] rounded-full"
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.3 }}
        />
        <motion.div
          ref={truckRef}
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2"
          animate={{ left: `${progress}%` }}
          transition={{ duration: 0.3 }}
        >
          <TruckIcon size={14} className="text-[#FBBF24]" />
        </motion.div>
      </div>

      {/* Step indicators */}
      <div className="flex items-center gap-4 mt-6">
        {processingSteps.map((step, i) => (
          <motion.div
            key={i}
            initial={false}
            animate={{
              scale: i === currentStep ? 1.2 : i < currentStep ? 1 : 0.9,
              opacity: i <= currentStep ? 1 : 0.4,
            }}
            className={cn(
              'w-8 h-8 rounded-full flex items-center justify-center transition-colors',
              i < currentStep
                ? 'bg-[#10B981] text-slate-900'
                : i === currentStep
                  ? 'bg-[#F59E0B] text-white'
                  : 'bg-slate-100 text-slate-500'
            )}
          >
            {i < currentStep ? <Check size={14} /> : step.icon}
          </motion.div>
        ))}
      </div>

      {/* Cancel */}
      <button
        onClick={onCancel}
        className="mt-10 text-slate-500 text-sm hover:text-slate-900 transition-colors"
      >
        Cancelar
      </button>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   Success Screen
   ═══════════════════════════════════════════════════════════════════ */

function SuccessScreen({
  product,
  giftCardCode,
  onGoToMarketplace,
}: {
  product: Product;
  giftCardCode: string;
  onGoToMarketplace: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const confettiRef = useRef(false);

  useEffect(() => {
    if (confettiRef.current) return;
    confettiRef.current = true;

    // Multi-burst confetti
    const duration = 2000;
    const end = Date.now() + duration;

    const colors = ['#F59E0B', '#FBBF24', '#F97316', '#10B981', '#3B82F6', '#ffffff'];

    const frame = () => {
      confetti({
        particleCount: 4,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.7 },
        colors,
      });
      confetti({
        particleCount: 4,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.7 },
        colors,
      });
      confetti({
        particleCount: 6,
        spread: 100,
        origin: { x: 0.5, y: 0.5 },
        colors,
        gravity: 0.8,
        scalar: 1.2,
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };

    const timer = setTimeout(frame, 300);
    return () => clearTimeout(timer);
  }, []);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(giftCardCode).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {
      // Fallback
      const ta = document.createElement('textarea');
      ta.value = giftCardCode;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [giftCardCode]);

  const handleShare = useCallback(() => {
    const text = `Acabo de redimir ${formatMillas(product.millasCost)} TicaMillas en La Mula Millonaria por un ${product.name}! Toca la tractomula y gana tus TicaMillas.`;
    if (navigator.share) {
      navigator.share({ title: 'La Mula Millonaria - Redencion', text }).catch(() => {});
    } else {
      navigator.clipboard.writeText(text).catch(() => {});
    }
  }, [product]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-[100dvh] bg-white flex flex-col items-center px-6 pt-16 pb-8"
    >
      {/* Checkmark */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', damping: 12, stiffness: 200, delay: 0.2 }}
        className="w-20 h-20 bg-[#10B981] rounded-full flex items-center justify-center mb-5 shadow-[0_0_40px_rgba(16,185,129,0.3)]"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', damping: 10, stiffness: 200, delay: 0.5 }}
        >
          <Check size={40} className="text-slate-900" strokeWidth={3} />
        </motion.div>
      </motion.div>

      {/* Title */}
      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="font-fredoka font-bold text-3xl text-[#10B981] mb-2 text-center"
      >
        Redencion Exitosa!
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="text-slate-500 text-sm text-center max-w-[300px] mb-6"
      >
        Tu Gift Card ha sido generada exitosamente. Usa el codigo en nuestro marketplace VTEX para obtener tu producto.
      </motion.p>

      {/* Product image */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.6 }}
        className="w-24 h-24 rounded-xl overflow-hidden mb-5"
      >
        <ProductPlaceholder gradient={getGradientClass(product.image)} />
      </motion.div>

      {/* Gift Card Display */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', damping: 20, stiffness: 200, delay: 0.7 }}
        className="w-full bg-gradient-to-br from-[#1A1B26] to-[#232433] rounded-2xl p-5 border-2 border-dashed border-[#F59E0B]/60 relative overflow-hidden mb-6"
        style={{ maxWidth: '380px' }}
      >
        {/* Subtle gold tint overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#F59E0B]/5 to-transparent pointer-events-none" />

        <div className="relative z-10 text-center space-y-3">
          <p className="text-slate-500 text-[10px] uppercase tracking-widest">Tu Gift Card</p>

          <div className="flex items-center justify-center gap-2">
            <code className="font-mono font-bold text-2xl text-slate-900 tracking-wider">
              {giftCardCode}
            </code>
            <button
              onClick={handleCopy}
              className="p-1.5 rounded-lg bg-slate-100 hover:bg-white/20 transition-colors"
            >
              {copied ? <Check size={16} className="text-[#10B981]" /> : <Copy size={16} className="text-slate-500" />}
            </button>
          </div>

          {/* Barcode */}
          <div className="text-slate-500 px-4">
            <BarcodeSVG />
          </div>

          <p className="text-[#F59E0B] font-fredoka font-bold text-xl">${formatMillas(product.priceCOP)} COP</p>
          <p className="text-slate-500 text-[10px]">Valido por 30 dias</p>
        </div>
      </motion.div>

      {/* Action buttons */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9 }}
        className="w-full space-y-2.5"
        style={{ maxWidth: '380px' }}
      >
        <PrimaryButton
          variant="secondary"
          icon={<ExternalLink size={16} />}
          onClick={() => {
            // TODO: VTEX - Open VTEX checkout with gift card pre-applied
            window.open('https://example.vtex.com/checkout', '_blank');
          }}
        >
          IR AL MARKETPLACE VTEX
        </PrimaryButton>

        <PrimaryButton
          variant="outline"
          icon={copied ? <Check size={16} /> : <Copy size={16} />}
          onClick={handleCopy}
        >
          {copied ? 'CODIGO COPIADO!' : 'COPIAR CODIGO'}
        </PrimaryButton>

        <button
          onClick={handleShare}
          className="w-full flex items-center justify-center gap-2 py-3 text-slate-500 text-sm font-medium hover:text-slate-900 transition-colors"
        >
          <Share2 size={16} />
          Compartir
        </button>

        <PrimaryButton variant="ghost" onClick={onGoToMarketplace}>
          VOLVER AL MARKETPLACE
        </PrimaryButton>
      </motion.div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   Error Screen
   ═══════════════════════════════════════════════════════════════════ */

function ErrorScreen({ onRetry, onCancel }: { onRetry: () => void; onCancel: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-[100dvh] bg-white flex flex-col items-center justify-center px-8"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', damping: 12, stiffness: 200 }}
        className="w-20 h-20 bg-[#EF4444]/20 rounded-full flex items-center justify-center mb-5"
      >
        <motion.div
          animate={{ x: [0, -4, 4, -4, 0] }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <X size={40} className="text-[#EF4444]" strokeWidth={3} />
        </motion.div>
      </motion.div>

      <motion.h2
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="font-fredoka font-bold text-2xl text-[#EF4444] mb-2 text-center"
      >
        Error en la Redencion
      </motion.h2>

      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="text-slate-500 text-sm text-center max-w-[280px] mb-8"
      >
        Hubo un error al procesar tu redencion. Intentelo de nuevo o contacta a soporte.
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="w-full space-y-2.5"
        style={{ maxWidth: '320px' }}
      >
        <PrimaryButton variant="primary" icon={<RotateCcw size={16} />} onClick={onRetry}>
          REINTENTAR
        </PrimaryButton>
        <PrimaryButton variant="ghost" onClick={onCancel}>
          Cancelar
        </PrimaryButton>
        <button
          onClick={() => {
            // TODO: Open support chat/link
            window.open('mailto:soporte@trucksurfers.com', '_blank');
          }}
          className="w-full flex items-center justify-center gap-2 py-3 text-slate-500 text-sm hover:text-slate-900 transition-colors"
        >
          <MessageCircle size={16} />
          Contactar soporte
        </button>
      </motion.div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   Multi-product Review (Cart Mode)
   ═══════════════════════════════════════════════════════════════════ */

function CartReviewScreen({
  cart,
  userMillas,
  onConfirm,
  onCancel,
}: {
  cart: Product[];
  userMillas: number;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const [termsAccepted, setTermsAccepted] = useState(false);
  const totalCost = cart.reduce((sum, p) => sum + p.millasCost, 0);
  const remaining = userMillas - totalCost;
  const canAfford = remaining >= 0;

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
      className="min-h-[100dvh] bg-white px-4 pb-8"
    >
      <div className="flex items-center gap-3 pt-16 pb-4">
        <button onClick={onCancel} className="p-2 -ml-2 rounded-full hover:bg-slate-100 transition-colors">
          <ArrowLeft size={22} className="text-slate-900" />
        </button>
        <h1 className="font-fredoka font-bold text-lg text-slate-900">Confirmar Redencion</h1>
      </div>

      {/* Cart items */}
      <div className="space-y-3 mb-4">
        {cart.map((product, i) => (
          <motion.div
            key={product.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="bg-white rounded-2xl p-4 border border-slate-200 flex gap-3"
          >
            <div className="w-16 h-16 flex-shrink-0 rounded-xl overflow-hidden">
              <ProductPlaceholder gradient={getGradientClass(product.image)} />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-slate-900 text-sm font-semibold line-clamp-2">{product.name}</h3>
              <p className="text-slate-500 text-[11px]">{product.brand}</p>
              <p className="text-[#F59E0B] font-fredoka font-bold text-sm mt-1">{formatMillas(product.millasCost)} M</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Summary */}
      <div className="bg-slate-100 rounded-2xl p-4 space-y-2 mb-4">
        <div className="flex justify-between text-sm">
          <span className="text-slate-500">Total en TicaMillas</span>
          <span className="text-[#F59E0B] font-fredoka font-bold">{formatMillas(totalCost)} M</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-slate-500">Tus TicaMillas</span>
          <span className="text-slate-900 font-medium">{formatMillas(userMillas)} M</span>
        </div>
        <div className="border-t border-white/[0.06] pt-2 flex justify-between">
          <span className="text-slate-500">Restantes</span>
          <span className={cn('font-bold', canAfford ? 'text-[#10B981]' : 'text-[#EF4444]')}>
            {formatMillas(Math.max(0, remaining))} M
          </span>
        </div>
        {!canAfford && (
          <div className="p-2.5 bg-[#EF4444]/10 border border-[#EF4444]/20 rounded-xl flex items-center gap-2 mt-2">
            <AlertCircle size={14} className="text-[#EF4444]" />
            <p className="text-[#EF4444] text-xs">Te faltan {formatMillas(Math.abs(remaining))} TicaMillas</p>
          </div>
        )}
      </div>

      {/* Terms */}
      <div className="flex items-start gap-2.5 mb-5">
        <button
          onClick={() => setTermsAccepted(!termsAccepted)}
          className={cn(
            'w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors',
            termsAccepted ? 'bg-[#F59E0B] border-[#F59E0B]' : 'border-[#94A3B8]/40'
          )}
        >
          {termsAccepted && <Check size={12} className="text-slate-900" />}
        </button>
        <p className="text-slate-500 text-xs">Acepto los terminos de redencion</p>
      </div>

      <PrimaryButton
        variant="primary"
        icon={<Lock size={16} />}
        disabled={!canAfford || !termsAccepted}
        onClick={onConfirm}
      >
        CONFIRMAR REDENCION
      </PrimaryButton>
      <PrimaryButton variant="ghost" onClick={onCancel}>
        Cancelar
      </PrimaryButton>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   Main Redemption Page
   ═══════════════════════════════════════════════════════════════════ */

export default function Redemption() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isLoading: authLoading } = useAuth();
  const { setMillas } = useMillas();

  const [step, setStep] = useState<RedemptionStep>('review');
  const [giftCardCode, setGiftCardCode] = useState('');
  const [, setErrorMessage] = useState('');

  // Get product(s) from navigation state
  const product = location.state?.product as Product | undefined;
  const cart = location.state?.cart as Product[] | undefined;
  const userMillas = (location.state?.userMillas as number) || 0;

  const redeemMutation = trpc.game.points.redeemProduct.useMutation({
    onSuccess: (data) => {
      setMillas(data.newBalance);
      setGiftCardCode(generateGiftCardCode());
      setStep('success');
    },
    onError: (err) => {
      console.error('[Redemption] Failed:', err);
      setErrorMessage(err.message || 'Error en la redencion');
      setStep('error');
    },
  });

  const handleConfirm = useCallback(() => {
    if (!product && (!cart || cart.length === 0)) return;

    setStep('processing');

    if (product) {
      redeemMutation.mutate({
        productName: product.name,
        productImage: product.image,
        millasCost: product.millasCost,
      });
    } else if (cart && cart.length > 0) {
      // Redeem first product only for now; cart multi-redemption not supported yet
      const first = cart[0];
      redeemMutation.mutate({
        productName: `${first.name} (+${cart.length - 1} mas)`,
        productImage: first.image,
        millasCost: cart.reduce((sum, p) => sum + p.millasCost, 0),
      });
    }
  }, [product, cart, redeemMutation]);

  const handleRetry = useCallback(() => {
    setStep('review');
    setErrorMessage('');
  }, []);

  const handleCancel = useCallback(() => {
    navigate('/marketplace');
  }, [navigate]);

  const handleGoToMarketplace = useCallback(() => {
    navigate('/marketplace');
  }, [navigate]);

  // Redirect if no product data
  if (!authLoading && (!product && (!cart || cart.length === 0))) {
    return (
      <div className="min-h-[100dvh] bg-white flex flex-col items-center justify-center px-8">
        <ShoppingBag size={48} className="text-slate-500/40 mb-4" />
        <h2 className="font-fredoka font-bold text-xl text-slate-900 mb-2">No hay producto seleccionado</h2>
        <p className="text-slate-500 text-sm text-center mb-6">Selecciona un producto del marketplace para redimirlo.</p>
        <PrimaryButton onClick={() => navigate('/marketplace')}>
          IR AL MARKETPLACE
        </PrimaryButton>
      </div>
    );
  }

  if (authLoading) {
    return (
      <div className="min-h-[100dvh] bg-white flex items-center justify-center">
        <Loader2 size={32} className="text-[#F59E0B] animate-spin" />
      </div>
    );
  }

  return (
    <AnimatePresence mode="wait">
      {step === 'review' && product && (
        <ReviewScreen
          key="review"
          product={product}
          userMillas={userMillas}
          onConfirm={handleConfirm}
          onCancel={handleCancel}
        />
      )}
      {step === 'review' && cart && cart.length > 0 && !product && (
        <CartReviewScreen
          key="cart-review"
          cart={cart}
          userMillas={userMillas}
          onConfirm={handleConfirm}
          onCancel={handleCancel}
        />
      )}
      {step === 'processing' && (
        <ProcessingScreen key="processing" onCancel={handleCancel} />
      )}
      {step === 'success' && product && (
        <SuccessScreen
          key="success"
          product={product}
          giftCardCode={giftCardCode}
          onGoToMarketplace={handleGoToMarketplace}
        />
      )}
      {step === 'error' && (
        <ErrorScreen key="error" onRetry={handleRetry} onCancel={handleCancel} />
      )}
    </AnimatePresence>
  );
}
