import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MousePointerClick, Truck, Zap, Star, ShoppingBag, ChevronRight, ChevronLeft, HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

const TUTORIAL_SEEN_KEY = 'truckSurfers_tutorial_seen';

const steps = [
  {
    icon: MousePointerClick,
    title: 'Toca la tractomula',
    text: 'Cada click genera TicaMillas. A mas poder de click, mas ganas por toque.',
    color: '#F59E0B',
  },
  {
    icon: Truck,
    title: 'Compra vehiculos',
    text: 'En la pestana Flota adquieres motonetas, camiones, tractomulas... Cada uno produce TicaMillas automaticamente cada segundo.',
    color: '#3B82F6',
  },
  {
    icon: Zap,
    title: 'Mejora tu flota',
    text: 'Desbloquea mejoras para multiplicar la produccion de un vehiculo, de todos, o el poder de tus clicks.',
    color: '#22C55E',
  },
  {
    icon: Star,
    title: 'Ascender (Prestigio)',
    text: 'Cuando tengas millones de TicaMillas totales, reinicia tu flota a cambio de Estrellas de Carretera. Cada estrella da +1% de produccion permanente.',
    color: '#FACC15',
  },
  {
    icon: ShoppingBag,
    title: 'Redime en la Tienda',
    text: 'Tus TicaMillas son la moneda del juego. Usalas para canjear productos reales en el Marketplace.',
    color: '#F97316',
  },
];

interface GameTutorialProps {
  forceOpen?: boolean;
  onClose?: () => void;
}

export function useTutorialSeen(): boolean {
  try {
    return localStorage.getItem(TUTORIAL_SEEN_KEY) === 'true';
  } catch {
    return false;
  }
}

export function markTutorialSeen() {
  try {
    localStorage.setItem(TUTORIAL_SEEN_KEY, 'true');
  } catch {
    // ignore
  }
}

export function GameTutorial({ forceOpen, onClose }: GameTutorialProps) {
  const [open, setOpen] = useState(forceOpen ?? !useTutorialSeen());
  const [step, setStep] = useState(0);
  const [dontShowAgain, setDontShowAgain] = useState(false);

  useEffect(() => {
    if (forceOpen) {
      setOpen(true);
      setStep(0);
    }
  }, [forceOpen]);

  if (!open) return null;

  const current = steps[step];
  const Icon = current.icon;
  const isLast = step === steps.length - 1;

  const handleClose = () => {
    if (dontShowAgain) markTutorialSeen();
    setOpen(false);
    onClose?.();
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] bg-black/85 backdrop-blur-md flex items-center justify-center p-6"
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            className="bg-white rounded-3xl p-6 max-w-sm w-full border border-white/10 relative"
          >
            <button
              onClick={handleClose}
              className="absolute top-3 right-3 p-2 rounded-full hover:bg-slate-100 text-slate-500"
            >
              <X size={18} />
            </button>

            <div className="text-center pt-2">
              <div
                className="w-20 h-20 rounded-2xl mx-auto mb-4 flex items-center justify-center"
                style={{ backgroundColor: `${current.color}15` }}
              >
                <Icon size={40} style={{ color: current.color }} />
              </div>
              <h3 className="font-fredoka font-bold text-xl text-slate-900 mb-2">{current.title}</h3>
              <p className="text-slate-500 text-sm leading-relaxed min-h-[72px]">{current.text}</p>
            </div>

            {/* Dots */}
            <div className="flex justify-center gap-2 my-5">
              {steps.map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    'w-2 h-2 rounded-full transition-colors',
                    i === step ? 'bg-[#F59E0B]' : 'bg-white/20'
                  )}
                />
              ))}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between">
              <button
                onClick={() => setStep((s) => Math.max(0, s - 1))}
                disabled={step === 0}
                className="p-2 rounded-xl text-slate-500 disabled:opacity-30 hover:bg-slate-100"
              >
                <ChevronLeft size={20} />
              </button>

              {isLast ? (
                <button
                  onClick={handleClose}
                  className="px-6 py-2.5 rounded-xl bg-[#F59E0B] text-[#0D0E14] font-bold text-sm"
                >
                  ¡A jugar!
                </button>
              ) : (
                <button
                  onClick={() => setStep((s) => Math.min(steps.length - 1, s + 1))}
                  className="flex items-center gap-1 px-5 py-2.5 rounded-xl bg-[#F59E0B] text-[#0D0E14] font-bold text-sm"
                >
                  Siguiente <ChevronRight size={16} />
                </button>
              )}
            </div>

            <label className="flex items-center gap-2 mt-4 text-slate-500 text-xs cursor-pointer select-none">
              <input
                type="checkbox"
                checked={dontShowAgain}
                onChange={(e) => setDontShowAgain(e.target.checked)}
                className="rounded border-white/20 bg-transparent text-[#F59E0B] focus:ring-[#F59E0B]"
              />
              No volver a mostrar
            </label>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function TutorialButton({ onClick, light }: { onClick?: () => void; light?: boolean }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'p-2 rounded-full transition-colors',
        light
          ? 'bg-slate-100 text-[#F59E0B] hover:bg-slate-200'
          : 'bg-slate-100 text-[#F59E0B] hover:bg-slate-100'
      )}
      aria-label="Como jugar"
    >
      <HelpCircle size={20} />
    </button>
  );
}
