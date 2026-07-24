import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Tv, X, Gift } from 'lucide-react';
import { cn } from '@/lib/utils';
import { showRewardedAd, REWARDED_AD_DURATION_MS } from '@/lib/rewardedAd';

interface AdRewardModalProps {
  open: boolean;
  /** Título del modal (qué se está por ganar). */
  title: string;
  /** Descripción corta de la recompensa. */
  rewardLabel: string;
  /**
   * `true` = el anuncio se vio completo y corresponde entregar la recompensa;
   * `false` = el usuario cerró antes de tiempo (no se entrega nada).
   */
  onComplete: (watched: boolean) => void;
}

/**
 * Modal de anuncio con recompensa (simulado): cuenta regresiva de 5s con
 * barra de progreso; el botón "Cerrar" queda deshabilitado hasta terminar.
 * Si se cierra antes, NO se entrega la recompensa.
 */
export function AdRewardModal({ open, title, rewardLabel, onComplete }: AdRewardModalProps) {
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
      // Cerrar antes de tiempo: aborta el anuncio, no hay recompensa.
      abortRef.current?.abort();
      onComplete(false);
      return;
    }
    onComplete(true);
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
          className="fixed inset-0 z-[70] bg-black/80 backdrop-blur-md flex items-center justify-center px-4"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-[#1A1B26] w-full max-w-sm rounded-3xl p-6 shadow-2xl border border-white/10"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#F59E0B] to-[#F97316] flex items-center justify-center">
                  <Tv size={18} className="text-[#0D0E14]" />
                </div>
                <h3 className="font-fredoka font-black text-lg text-white">{title}</h3>
              </div>
              <button
                onClick={handleClose}
                disabled={!finished}
                className={cn(
                  'p-2 rounded-full transition-colors',
                  finished ? 'hover:bg-white/10 text-white' : 'text-slate-600 cursor-not-allowed'
                )}
                title={finished ? 'Cerrar' : `Disponible en ${secondsLeft}s`}
              >
                <X size={18} />
              </button>
            </div>

            {/* "Anuncio" simulado — estilo GIF dinámico integrado al juego */}
            <div className="relative rounded-2xl border border-white/10 h-44 flex flex-col items-center justify-center overflow-hidden mb-4">
              {/* Fondo animado tipo GIF */}
              <motion.div
                className="absolute inset-0"
                animate={{
                  background: [
                    'linear-gradient(135deg, #0D0E14 0%, #1A1B26 50%, #0D0E14 100%)',
                    'linear-gradient(135deg, #1A1B26 0%, #451a03 50%, #0D0E14 100%)',
                    'linear-gradient(135deg, #0D0E14 0%, #1A1B26 50%, #0D0E14 100%)',
                  ],
                }}
                transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
              />

              {/* Scanlines de video */}
              <div
                className="absolute inset-0 opacity-10 pointer-events-none"
                style={{
                  backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.4) 2px, rgba(0,0,0,0.4) 4px)',
                }}
              />

              {/* Anillos de pulso */}
              {!finished && (
                <>
                  <motion.span
                    className="absolute w-24 h-24 rounded-full border-2 border-[#F59E0B]/30"
                    animate={{ scale: [1, 1.6], opacity: [0.6, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  />
                  <motion.span
                    className="absolute w-24 h-24 rounded-full border-2 border-[#F59E0B]/20"
                    animate={{ scale: [1, 2], opacity: [0.4, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity, delay: 0.5 }}
                  />
                </>
              )}

              {/* Icono central animado */}
              <motion.div
                className="relative z-10 flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-[#F59E0B] to-[#F97316] shadow-[0_0_32px_rgba(245,158,11,0.5)]"
                animate={finished ? { scale: [1, 1.1, 1] } : { y: [0, -4, 0], rotate: [0, 3, -3, 0] }}
                transition={{ duration: 1.2, repeat: Infinity }}
              >
                <span className="text-4xl">{finished ? '🎉' : '📺'}</span>
                {!finished && (
                  <motion.span
                    className="absolute -top-2 -right-2 bg-[#EF4444] text-white text-[10px] font-black px-1.5 py-0.5 rounded-full"
                    animate={{ scale: [1, 1.15, 1] }}
                    transition={{ duration: 0.8, repeat: Infinity }}
                  >
                    x2
                  </motion.span>
                )}
              </motion.div>

              {/* Partículas flotantes */}
              {!finished && (
                <>
                  {[...Array(5)].map((_, i) => (
                    <motion.span
                      key={i}
                      className="absolute text-lg"
                      initial={{ opacity: 0, y: 40, x: (i - 2) * 30 }}
                      animate={{
                        opacity: [0, 1, 0],
                        y: [-20, -70],
                        x: (i - 2) * 30 + (Math.random() - 0.5) * 20,
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        delay: i * 0.4,
                        ease: 'easeOut',
                      }}
                    >
                      {['✨', '🎁', '💰', '🎟️', '⭐'][i]}
                    </motion.span>
                  ))}
                </>
              )}

              <p className="relative z-10 text-white/80 text-xs mt-4 font-black uppercase tracking-wider">
                {finished ? '¡Anuncio completado!' : 'Viendo anuncio patrocinado...'}
              </p>

              {!finished && (
                <span className="absolute top-2 right-3 font-mono text-xs text-white/40">
                  {secondsLeft}s
                </span>
              )}
            </div>

            {/* Barra de progreso */}
            <div className="h-2.5 rounded-full bg-black/40 overflow-hidden border border-white/10 mb-4">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-[#F59E0B] to-[#FBBF24]"
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.2 }}
              />
            </div>

            <p className="text-center text-slate-300 text-sm font-bold mb-4 flex items-center justify-center gap-1.5">
              <Gift size={16} className="text-[#F59E0B]" />
              {rewardLabel}
            </p>

            <button
              onClick={handleClose}
              disabled={!finished}
              className={cn(
                'w-full py-3 rounded-2xl font-black text-sm tracking-wide transition-all',
                finished
                  ? 'bg-gradient-to-b from-[#FACC15] to-[#D97706] text-[#451a03] border-b-4 border-[#92400E] active:translate-y-0.5 active:border-b-0'
                  : 'bg-slate-700/50 text-slate-500 cursor-not-allowed'
              )}
            >
              {finished ? '¡RECLAMAR RECOMPENSA!' : `Cerrar (${secondsLeft}s)`}
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
