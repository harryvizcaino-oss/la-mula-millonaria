import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MousePointerClick, Truck, Zap, Star, ShoppingBag, ChevronRight, ChevronLeft, HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

const TUTORIAL_SEEN_KEY = 'truckSurfers_tutorial_seen';

const steps = [
  {
    icon: MousePointerClick,
    title: 'Toca la tractomula',
    text: 'Cada click genera CPS. A mas poder de click, mas ganas por toque.',
    color: '#F59E0B',
  },
  {
    icon: Truck,
    title: 'Compra tu flota',
    text: 'En la pestana Flota adquieres camiones reales (Chevrolet, Volvo, Scania, Tesla Semi...) con Golden Tickets. Cada uno MULTIPLICA tu CPS.',
    color: '#3B82F6',
  },
  {
    icon: Zap,
    title: 'Poderes de marca',
    text: 'Compra niveles de autopartes con CPS. Cada 10 niveles desbloqueas una nueva marca patrocinadora que multiplica su aporte.',
    color: '#22C55E',
  },
  {
    icon: Star,
    title: 'Ascender (Prestigio)',
    text: 'Cuando tengas millones de CPS totales, reinicia tu flota a cambio de Estrellas de Carretera. Cada estrella da +1% permanente.',
    color: '#FACC15',
  },
  {
    icon: ShoppingBag,
    title: 'Redime en la Tienda',
    text: 'Tus CPS se canjean por Gift Cards VTEX de redpostventa.com. Redimir no afecta tu ranking.',
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
          className="modal-overlay-v2"
        >
          <motion.div
            initial={{ scale: 0.6, y: 40, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.9, y: 20, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="modal-box-v2"
          >
            {/* Corner ornaments */}
            <span className="modal-corner tl" />
            <span className="modal-corner tr" />
            <span className="modal-corner bl" />
            <span className="modal-corner br" />

            <button
              onClick={handleClose}
              className="modal-close"
              aria-label="Cerrar"
            >
              <X size={18} />
            </button>

            <div className="text-center pt-2">
              <div
                className="w-20 h-20 rounded-2xl mx-auto mb-4 flex items-center justify-center"
                style={{ backgroundColor: `${current.color}20` }}
              >
                <Icon size={40} style={{ color: current.color }} />
              </div>
              <h3 className="modal-title-v2">{current.title}</h3>
              <p className="text-[#CBD5E1] text-sm leading-relaxed min-h-[72px]">{current.text}</p>
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
                className="game-btn-v2 p-2 rounded-xl text-[#CBD5E1] disabled:opacity-30 hover:bg-white/10"
              >
                <ChevronLeft size={20} />
              </button>

              {isLast ? (
                <button
                  onClick={handleClose}
                  className="game-btn-v2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#F59E0B] to-[#F97316] text-[#0D0E14] font-bold text-sm"
                >
                  ¡A jugar!
                </button>
              ) : (
                <button
                  onClick={() => setStep((s) => Math.min(steps.length - 1, s + 1))}
                  className="game-btn-v2 flex items-center gap-1 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#F59E0B] to-[#F97316] text-[#0D0E14] font-bold text-sm"
                >
                  Siguiente <ChevronRight size={16} />
                </button>
              )}
            </div>

            <label className="flex items-center gap-2 mt-4 text-[#94A3B8] text-xs cursor-pointer select-none">
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
        'game-btn-v2 p-2 rounded-full transition-colors',
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
