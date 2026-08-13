import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { showRewardedAd, REWARDED_AD_DURATION_MS } from '@/lib/rewardedAd';
import { houseAd } from '@/lib/adsConfig';

interface InterstitialAdProps {
  open: boolean;
  /** Siempre cierra. `watched` es `true` solo si pasaron los 5s. */
  onClose: (watched: boolean) => void;
}

/**
 * Overlay a pantalla completa (house ad). El skip se habilita a los 5s,
 * igual que AdRewardModal. El padre no debe abrirlo si el jugador es ad-free.
 */
export function InterstitialAd({ open, onClose }: InterstitialAdProps) {
  const [secondsLeft, setSecondsLeft] = useState(REWARDED_AD_DURATION_MS / 1000);
  const [finished, setFinished] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!open) return;
    const totalSec = REWARDED_AD_DURATION_MS / 1000;
    setSecondsLeft(totalSec);
    setFinished(false);

    const controller = new AbortController();
    abortRef.current = controller;

    void showRewardedAd({ signal: controller.signal }).then((watched) => {
      if (watched) setFinished(true);
    });

    const startedAt = Date.now();
    const iv = setInterval(() => {
      const elapsed = Date.now() - startedAt;
      setSecondsLeft(Math.max(0, Math.ceil((REWARDED_AD_DURATION_MS - elapsed) / 1000)));
    }, 200);

    return () => {
      clearInterval(iv);
      controller.abort();
      abortRef.current = null;
    };
  }, [open]);

  const handleClose = () => {
    if (!finished) {
      abortRef.current?.abort();
      onClose(false);
      return;
    }
    onClose(true);
  };

  const progress = finished
    ? 100
    : ((REWARDED_AD_DURATION_MS / 1000 - secondsLeft) / (REWARDED_AD_DURATION_MS / 1000)) * 100;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[80] bg-[#0D0E14] flex flex-col items-center justify-center px-6"
        >
          <span className="absolute top-4 left-4 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
            Publicidad
          </span>
          <button
            type="button"
            onClick={handleClose}
            disabled={!finished}
            className={cn(
              'absolute top-3 right-3 p-2 rounded-full transition-colors',
              finished ? 'text-white hover:bg-white/10' : 'text-slate-600 cursor-not-allowed'
            )}
            title={finished ? 'Cerrar' : `Saltar en ${secondsLeft}s`}
          >
            <X size={18} />
          </button>

          <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-3">
            {finished ? 'Puedes continuar' : `Saltar en ${secondsLeft}s`}
          </p>

          <Link
            to={houseAd.href}
            onClick={() => onClose(finished)}
            className="w-full max-w-sm rounded-2xl border border-white/10 bg-[#1A1B26] px-5 py-8 text-center"
          >
            <p className="text-lg font-black tracking-wide" style={{ color: '#ff3131' }}>
              {houseAd.label}
            </p>
            <p className="mt-2 text-sm font-bold text-slate-300">Ver Tienda</p>
          </Link>

          <div className="mt-6 h-1.5 w-full max-w-sm rounded-full bg-white/10 overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{ background: '#ff3131' }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.2 }}
            />
          </div>

          <button
            type="button"
            onClick={handleClose}
            disabled={!finished}
            className={cn(
              'mt-6 w-full max-w-sm py-3 rounded-2xl font-black text-sm tracking-wide transition-all',
              finished
                ? 'bg-[#ff3131] text-white active:translate-y-0.5'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed'
            )}
          >
            {finished ? 'Continuar' : `Saltar (${secondsLeft}s)`}
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
