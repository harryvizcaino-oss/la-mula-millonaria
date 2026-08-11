import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Copy, Share2, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import PrimaryButton from '@/components/PrimaryButton';

export type RedeemReceiptKind = 'cash' | 'rpv' | 'product';

export interface RedeemReceiptProps {
  isOpen: boolean;
  onClose: () => void;
  kind: RedeemReceiptKind;
  /** Código de gift card generado */
  code: string;
  /** Valor mostrado (ej. "$10.000 COP", "Gift Card $25", nombre del producto) */
  valueLabel: string;
  /** Nombre opcional del producto (redención de catálogo) */
  productName?: string;
}

function buildShareText(kind: RedeemReceiptKind, valueLabel: string, code: string, productName?: string): string {
  if (kind === 'cash') {
    return `Gané ${valueLabel} en RedPostventa jugando La Mula Millonaria. Código: ${code}`;
  }
  if (kind === 'rpv') {
    return `Gané ${valueLabel} en RedPostventa jugando La Mula Millonaria. Código: ${code}`;
  }
  const item = productName || valueLabel;
  return `Gané Gift Card en RedPostventa jugando La Mula Millonaria por ${item}. Código: ${code}`;
}

/**
 * Comprobante visual compartible tras un canje (efectivo, Gift Card CPS o producto).
 */
export function RedeemReceipt({
  isOpen,
  onClose,
  kind,
  code,
  valueLabel,
  productName,
}: RedeemReceiptProps) {
  const [copied, setCopied] = useState(false);
  const [shared, setShared] = useState(false);

  const shareText = buildShareText(kind, valueLabel, code, productName);

  const copyText = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      try {
        const ta = document.createElement('textarea');
        ta.value = text;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        return true;
      } catch {
        return false;
      }
    }
  }, []);

  const handleCopyCode = useCallback(async () => {
    const ok = await copyText(code);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [code, copyText]);

  const handleShare = useCallback(async () => {
    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      try {
        await navigator.share({
          title: 'La Mula Millonaria — Canje RedPostventa',
          text: shareText,
        });
        setShared(true);
        setTimeout(() => setShared(false), 2000);
        return;
      } catch {
        // Usuario canceló o falló — cae a copiar
      }
    }
    const ok = await copyText(shareText);
    if (ok) {
      setShared(true);
      setTimeout(() => setShared(false), 2000);
    }
  }, [shareText, copyText]);

  const headline =
    kind === 'cash'
      ? `Gané ${valueLabel}`
      : kind === 'rpv'
        ? `Gané ${valueLabel}`
        : 'Gané Gift Card en RedPostventa';

  const subline =
    kind === 'product' && productName
      ? productName
      : 'jugando La Mula Millonaria';

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-md flex items-center justify-center px-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 16 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 8 }}
            transition={{ type: 'spring', stiffness: 320, damping: 28 }}
            className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-fredoka font-black text-xl text-slate-900">Comprobante</h3>
              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-full hover:bg-slate-100"
                aria-label="Cerrar"
              >
                <X size={18} className="text-slate-500" />
              </button>
            </div>

            <p className="text-slate-500 text-sm mb-4">
              Guarda tu código y úsalo en{' '}
              <span className="font-bold text-slate-900">redpostventa.com</span>.
              {kind === 'rpv' && (
                <> Redimir CPS <span className="font-bold">no afecta tu ranking</span>.</>
              )}
            </p>

            {/* Shareable card */}
            <div className="bg-gradient-to-br from-[#0D0E14] to-[#232433] rounded-2xl p-5 border-2 border-dashed border-[#ff3131]/60 text-center mb-4">
              <p className="text-[#ff4c4c] text-[10px] uppercase tracking-widest font-bold mb-2">
                RedPostventa × La Mula
              </p>
              <p className="font-fredoka font-black text-lg text-white leading-snug">{headline}</p>
              <p className="text-slate-400 text-xs mt-1 mb-4">{subline}</p>

              <p className="text-slate-500 text-[10px] uppercase tracking-widest mb-2">Código</p>
              <div className="flex items-center justify-center gap-2">
                <code className="font-mono font-bold text-lg sm:text-xl text-white tracking-wider break-all">
                  {code}
                </code>
                <button
                  type="button"
                  onClick={() => void handleCopyCode()}
                  className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 flex-shrink-0"
                  aria-label="Copiar código"
                >
                  {copied ? (
                    <Check size={16} className="text-[#ff4c4c]" />
                  ) : (
                    <Copy size={16} className="text-white" />
                  )}
                </button>
              </div>
              <p className="text-[#ff3131] font-fredoka font-bold text-xl mt-3">{valueLabel}</p>
            </div>

            <div className="flex gap-2 mb-3">
              <button
                type="button"
                onClick={() => void handleCopyCode()}
                className={cn(
                  'flex-1 h-11 rounded-xl border border-slate-200 text-sm font-bold flex items-center justify-center gap-1.5',
                  copied ? 'text-[#10B981] bg-emerald-50' : 'text-slate-900 bg-white hover:bg-slate-50'
                )}
              >
                {copied ? <Check size={16} /> : <Copy size={16} />}
                {copied ? 'Copiado' : 'Copiar'}
              </button>
              <button
                type="button"
                onClick={() => void handleShare()}
                className={cn(
                  'flex-1 h-11 rounded-xl border border-[#ff3131]/30 text-sm font-bold flex items-center justify-center gap-1.5',
                  shared ? 'text-[#ff3131] bg-[#ff3131]/10' : 'text-[#ff3131] bg-[#ff3131]/5 hover:bg-[#ff3131]/10'
                )}
              >
                <Share2 size={16} />
                {shared ? 'Listo' : 'Compartir'}
              </button>
            </div>

            <PrimaryButton variant="primary" onClick={onClose}>
              Entendido
            </PrimaryButton>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/** Card embebible (sin overlay) para pantallas de éxito como Redemption. */
export function RedeemReceiptCard({
  kind,
  code,
  valueLabel,
  productName,
  className,
}: Omit<RedeemReceiptProps, 'isOpen' | 'onClose'> & { className?: string }) {
  const [copied, setCopied] = useState(false);
  const [shared, setShared] = useState(false);
  const shareText = buildShareText(kind, valueLabel, code, productName);

  const copyText = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      try {
        const ta = document.createElement('textarea');
        ta.value = text;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        return true;
      } catch {
        return false;
      }
    }
  }, []);

  const handleCopyCode = useCallback(async () => {
    const ok = await copyText(code);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [code, copyText]);

  const handleShare = useCallback(async () => {
    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      try {
        await navigator.share({
          title: 'La Mula Millonaria — Canje RedPostventa',
          text: shareText,
        });
        setShared(true);
        setTimeout(() => setShared(false), 2000);
        return;
      } catch {
        // cancel / fail → copy
      }
    }
    const ok = await copyText(shareText);
    if (ok) {
      setShared(true);
      setTimeout(() => setShared(false), 2000);
    }
  }, [shareText, copyText]);

  const headline =
    kind === 'cash'
      ? `Gané ${valueLabel}`
      : kind === 'rpv'
        ? `Gané ${valueLabel}`
        : 'Gané Gift Card en RedPostventa';

  return (
    <div className={cn('w-full', className)}>
      <div className="bg-gradient-to-br from-[#0D0E14] to-[#232433] rounded-2xl p-5 border-2 border-dashed border-[#ff3131]/60 text-center">
        <p className="text-[#ff4c4c] text-[10px] uppercase tracking-widest font-bold mb-2">
          RedPostventa × La Mula
        </p>
        <p className="font-fredoka font-black text-lg text-white leading-snug">{headline}</p>
        {productName && <p className="text-slate-400 text-xs mt-1">{productName}</p>}
        <p className="text-slate-500 text-[10px] uppercase tracking-widest mt-4 mb-2">Código</p>
        <div className="flex items-center justify-center gap-2">
          <code className="font-mono font-bold text-lg text-white tracking-wider break-all">{code}</code>
          <button
            type="button"
            onClick={() => void handleCopyCode()}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 flex-shrink-0"
            aria-label="Copiar código"
          >
            {copied ? <Check size={16} className="text-[#ff4c4c]" /> : <Copy size={16} className="text-white" />}
          </button>
        </div>
        <p className="text-[#ff3131] font-fredoka font-bold text-xl mt-3">{valueLabel}</p>
      </div>
      <div className="flex gap-2 mt-3">
        <button
          type="button"
          onClick={() => void handleCopyCode()}
          className={cn(
            'flex-1 h-11 rounded-xl border border-slate-200 text-sm font-bold flex items-center justify-center gap-1.5',
            copied ? 'text-[#10B981] bg-emerald-50' : 'text-slate-900 bg-white'
          )}
        >
          {copied ? <Check size={16} /> : <Copy size={16} />}
          {copied ? 'Copiado' : 'Copiar'}
        </button>
        <button
          type="button"
          onClick={() => void handleShare()}
          className="flex-1 h-11 rounded-xl border border-[#ff3131]/30 text-[#ff3131] bg-[#ff3131]/5 text-sm font-bold flex items-center justify-center gap-1.5"
        >
          <Share2 size={16} />
          {shared ? 'Listo' : 'Compartir'}
        </button>
      </div>
    </div>
  );
}
