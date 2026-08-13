import { useCallback, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { CreditCard, Loader2, Ticket, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { LOGIN_PATH } from '@/const';
import { useAuth } from '@/hooks/useAuth';
import { IAP_SKUS, formatCop, type IapSku } from '@/data/iapSkus';
import { startIapCheckout } from '@/lib/iapCheckout';
import { useIapStore } from '@/store/iapStore';

function checkoutErrorMessage(reason?: string): string {
  const key = (reason ?? '').toLowerCase();
  if (key === 'daily_cap' || key.includes('daily') || key.includes('límite') || key.includes('limite')) {
    return 'Límite diario de compras alcanzado. Intenta de nuevo mañana.';
  }
  if (key === 'already_bought' || key.includes('starter')) {
    return 'El pack de inicio ya fue comprado.';
  }
  if (key === 'network' || key.startsWith('http_') || key === 'no_checkout_url') {
    return 'No se pudo abrir el cobro. Intenta de nuevo.';
  }
  return reason || 'No se pudo completar el pago.';
}

function successToastText(sku: IapSku): string {
  if (sku.tickets && sku.tickets > 0) {
    const loot = sku.lootBox ? ' + caja' : '';
    return `+${sku.tickets} 🎟️${loot}`;
  }
  if (sku.kind === 'ad_free') {
    return sku.adFreeDays === 'lifetime' ? 'Sin anuncios de por vida' : 'Sin anuncios 30 días';
  }
  if (sku.kind === 'season_premium') return 'Pase Ruta Nacional desbloqueado';
  return 'Compra simulada';
}

function skuDisabled(sku: IapSku, canBuyStarter: boolean): boolean {
  return sku.kind === 'starter' && !canBuyStarter;
}

export function IapRecargarPanel() {
  const { isAuthenticated } = useAuth();
  const isAdFree = useIapStore((s) => s.isAdFree());
  const canBuyStarter = useIapStore((s) => s.canBuyStarter());

  const ticketSkus = useMemo(
    () => IAP_SKUS.filter((s) => s.kind === 'tickets' || s.kind === 'starter'),
    [],
  );
  const adFreeSkus = useMemo(
    () => IAP_SKUS.filter((s) => s.kind === 'ad_free'),
    [],
  );
  const seasonSku = useMemo(
    () => IAP_SKUS.find((s) => s.kind === 'season_premium'),
    [],
  );

  const [selected, setSelected] = useState<IapSku | null>(null);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const openSku = useCallback((sku: IapSku) => {
    if (skuDisabled(sku, useIapStore.getState().canBuyStarter())) return;
    setSelected(sku);
    setError(null);
  }, []);

  const closeSheet = useCallback(() => {
    if (paying) return;
    setSelected(null);
    setError(null);
  }, [paying]);

  const handlePay = useCallback(async () => {
    if (!selected || paying) return;
    setPaying(true);
    setError(null);
    try {
      const result = await startIapCheckout(selected.id);
      if (result.checkoutUrl) {
        window.location.href = result.checkoutUrl;
        return;
      }
      if (result.ok && result.mocked) {
        setToast(successToastText(selected));
        setTimeout(() => setToast(null), 2200);
        setSelected(null);
        return;
      }
      if (!result.ok) {
        setError(checkoutErrorMessage(result.reason));
        return;
      }
      setSelected(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : undefined;
      setError(checkoutErrorMessage(message));
    } finally {
      setPaying(false);
    }
  }, [selected, paying]);

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-4 mt-3 bg-white rounded-2xl border border-slate-200 p-3 shadow-sm"
      >
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#ff4c4c] to-[#ff3131] flex items-center justify-center text-white shadow-sm">
            <Ticket size={16} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-slate-900 font-black text-sm">Recargar</p>
              {isAdFree && (
                <span className="h-5 px-2 rounded-full bg-[#ff3131]/10 border border-[#ff3131]/30 text-[#ff3131] text-[9px] font-black uppercase tracking-wider whitespace-nowrap">
                  Sin anuncios
                </span>
              )}
            </div>
            <p className="text-slate-500 text-[10px] font-bold">
              Tickets y Sin anuncios · pago real (COP)
            </p>
          </div>
        </div>

        {!isAuthenticated && (
          <Link
            to={LOGIN_PATH}
            className="mb-3 flex items-center justify-between rounded-xl bg-slate-100 border border-slate-200 px-3 py-2"
          >
            <span className="text-slate-600 text-[11px] font-bold">
              Entra para restaurar compras
            </span>
            <span className="text-[#ff3131] text-[10px] font-black uppercase tracking-wider">
              Entrar
            </span>
          </Link>
        )}

        <div className="grid grid-cols-2 gap-2">
          {ticketSkus.map((sku) => {
            const disabled = skuDisabled(sku, canBuyStarter);
            return (
              <button
                key={sku.id}
                type="button"
                disabled={disabled}
                onClick={() => openSku(sku)}
                className={cn(
                  'relative text-left rounded-xl border p-2.5 transition-all active:scale-[0.98]',
                  disabled
                    ? 'border-slate-200 bg-slate-50 opacity-55 cursor-not-allowed'
                    : 'border-slate-200 bg-white hover:border-[#ff3131]/40',
                )}
              >
                {sku.badge === 'best' && (
                  <span className="absolute -top-1.5 right-2 bg-[#ff3131] text-white text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-full">
                    Mejor valor
                  </span>
                )}
                {sku.badge === 'once' && !disabled && (
                  <span className="absolute -top-1.5 right-2 bg-slate-800 text-white text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-full">
                    Una vez
                  </span>
                )}
                <p className="text-slate-900 text-[12px] font-black leading-tight pr-1">
                  {sku.title}
                </p>
                {sku.tickets != null && sku.tickets > 0 && (
                  <p className="text-[#ff3131] font-fredoka font-bold text-sm mt-1">
                    +{sku.tickets} 🎟️
                    {sku.lootBox ? (
                      <span className="ml-1 text-[10px] text-slate-500 font-bold">+caja</span>
                    ) : null}
                  </p>
                )}
                <p className="text-slate-900 font-fredoka font-bold text-[13px] mt-0.5">
                  {formatCop(sku.priceCop)}
                </p>
                {disabled && (
                  <p className="text-slate-400 text-[9px] font-black uppercase tracking-wider mt-1">
                    Ya comprado
                  </p>
                )}
              </button>
            );
          })}
        </div>

        {adFreeSkus.length > 0 && (
          <div className="grid grid-cols-2 gap-2 mt-2">
            {adFreeSkus.map((sku) => (
              <button
                key={sku.id}
                type="button"
                onClick={() => openSku(sku)}
                className="text-left rounded-xl border border-slate-200 bg-[#0D0E14] p-2.5 transition-all hover:border-[#ff3131]/50 active:scale-[0.98]"
              >
                <p className="text-white text-[12px] font-black leading-tight">{sku.title}</p>
                <p className="text-slate-400 text-[9px] font-bold mt-0.5 line-clamp-1">
                  {sku.subtitle}
                </p>
                <p className="text-[#ff4c4c] font-fredoka font-bold text-[13px] mt-1">
                  {formatCop(sku.priceCop)}
                </p>
              </button>
            ))}
          </div>
        )}

        {seasonSku && (
          <button
            type="button"
            onClick={() => openSku(seasonSku)}
            className="mt-2 w-full flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 hover:border-[#ff3131]/40 active:scale-[0.99] transition-all"
          >
            <span className="text-slate-900 text-[12px] font-black">
              Pase Ruta Nacional {formatCop(seasonSku.priceCop)}
            </span>
            <span className="text-[#ff3131] text-[10px] font-black uppercase tracking-wider">
              Comprar
            </span>
          </button>
        )}
      </motion.div>

      <AnimatePresence>
        {selected && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
              onClick={closeSheet}
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 z-50 bg-slate-100 rounded-t-3xl overflow-y-auto"
              style={{ maxWidth: '32rem', margin: '0 auto' }}
            >
              <div className="flex justify-center pt-3 pb-1">
                <div className="w-10 h-1 rounded-full bg-slate-300" />
              </div>
              <button
                type="button"
                onClick={closeSheet}
                disabled={paying}
                className="absolute top-4 right-4 p-2 rounded-full bg-white text-slate-500 hover:bg-slate-200 transition-colors disabled:opacity-40"
              >
                <X size={18} />
              </button>

              <div className="px-4 pt-2 pb-6 space-y-4">
                <div>
                  <p className="text-slate-900 font-fredoka font-bold text-xl leading-tight">
                    {selected.title}
                  </p>
                  <p className="text-slate-500 text-sm mt-1">{selected.subtitle}</p>
                </div>

                <div className="bg-white rounded-2xl p-4 space-y-2 border border-slate-200">
                  {selected.tickets != null && selected.tickets > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 text-sm">Tickets</span>
                      <span className="text-[#ff3131] font-fredoka font-bold text-lg">
                        +{selected.tickets} 🎟️
                      </span>
                    </div>
                  )}
                  {selected.lootBox ? (
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 text-sm">Caja de loot</span>
                      <span className="text-slate-900 font-bold text-sm">×{selected.lootBox}</span>
                    </div>
                  ) : null}
                  {selected.kind === 'ad_free' && (
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 text-sm">Sin anuncios</span>
                      <span className="text-slate-900 font-bold text-sm">
                        {selected.adFreeDays === 'lifetime' ? 'De por vida' : `${selected.adFreeDays} días`}
                      </span>
                    </div>
                  )}
                  {selected.kind === 'season_premium' && (
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 text-sm">Pase</span>
                      <span className="text-slate-900 font-bold text-sm">Ruta Nacional</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                    <span className="text-slate-500 text-sm">Total</span>
                    <span className="text-slate-900 font-fredoka font-black text-xl">
                      {formatCop(selected.priceCop)}
                    </span>
                  </div>
                </div>

                {error && (
                  <p className="text-[#b91c1c] text-[12px] font-bold bg-[#ff3131]/10 border border-[#ff3131]/20 rounded-xl px-3 py-2">
                    {error}
                  </p>
                )}

                <button
                  type="button"
                  onClick={() => void handlePay()}
                  disabled={paying}
                  className="w-full h-12 rounded-full bg-gradient-to-r from-[#ff4c4c] to-[#ff3131] text-white text-[12px] font-black uppercase tracking-wider shadow-[0_4px_16px_rgba(255,49,49,0.35)] active:scale-[0.98] transition-transform disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {paying ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <CreditCard size={16} />
                  )}
                  {paying ? 'Procesando…' : 'Pagar con tarjeta / PSE (Credibanco)'}
                </button>
                <p className="text-center text-slate-400 text-[10px] font-bold">
                  En sandbox sin URL de cobro se simula el pago
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-24 left-0 right-0 z-[60] flex justify-center px-4 pointer-events-none"
            style={{ maxWidth: '32rem', margin: '0 auto' }}
          >
            <div className="px-4 py-2 rounded-full text-white text-sm font-bold shadow-lg border-2 border-white bg-[#ff3131]">
              {toast}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
