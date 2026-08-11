import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ExternalLink, Loader2, Sparkles, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { fetchCatalogProducts, type CatalogProduct } from '@/lib/redpostventaCatalog';
import {
  suggestStoreProducts,
  type StoreAgentContext,
  type StoreAgentSuggestion,
} from '@/lib/storeAgent';

function formatMillas(n: number): string {
  return Math.max(0, Math.floor(n)).toLocaleString('es-CO');
}

function kindLabel(kind: StoreAgentSuggestion['kind']): string {
  if (kind === 'affordable') return 'Redimible';
  if (kind === 'almost') return 'Casi';
  return 'Cercano';
}

function kindTone(kind: StoreAgentSuggestion['kind']): string {
  if (kind === 'affordable') return 'bg-[#16A34A]/15 text-[#15803D]';
  if (kind === 'almost') return 'bg-[#ff3131]/10 text-[#b91c1c]';
  return 'bg-slate-200 text-slate-700';
}

interface StoreAgentPanelProps {
  open: boolean;
  onClose: () => void;
  millas: number;
  cpsBalance: number;
  fleetId?: string;
  /** Catálogo ya cargado en Marketplace (opcional; si falta se hace fetch). */
  catalog?: CatalogProduct[];
  onSelectProduct?: (product: CatalogProduct) => void;
}

/**
 * Asesor de Tienda MVP: input corto + sugerencias determinísticas del feed.
 * TODO(agent-omni): sustituir `suggestStoreProducts` por llamada Omni real.
 */
export function StoreAgentPanel({
  open,
  onClose,
  millas,
  cpsBalance,
  fleetId,
  catalog,
  onSelectProduct,
}: StoreAgentPanelProps) {
  const [query, setQuery] = useState('');
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<CatalogProduct[]>(catalog ?? []);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (catalog && catalog.length > 0) setProducts(catalog);
  }, [catalog]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;

    async function load() {
      if (catalog && catalog.length > 0 && !query.trim()) {
        setProducts(catalog);
        setError(null);
        return;
      }
      setLoading(true);
      setError(null);
      const res = await fetchCatalogProducts({
        query: query.trim() || undefined,
        limit: 48,
      });
      if (cancelled) return;
      setLoading(false);
      if (!res) {
        if (catalog && catalog.length > 0) {
          setProducts(catalog);
          setError(null);
        } else {
          setProducts([]);
          setError('No pude cargar el catálogo. Intenta de nuevo.');
        }
        return;
      }
      setProducts(res.products);
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [open, query, catalog]);

  const ctx: StoreAgentContext = { millas, cpsBalance, fleetId, query };
  const result = suggestStoreProducts(ctx, products);
  const list = result.suggestions.slice(0, 8);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.button
            type="button"
            aria-label="Cerrar asesor"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-black/50"
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Asesor de Tienda"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            className="fixed bottom-0 left-0 right-0 z-[70] mx-auto max-w-lg rounded-t-3xl bg-white border-t-2 border-slate-200 shadow-[0_-8px_40px_rgba(0,0,0,0.25)]"
            style={{ maxHeight: 'min(88dvh, 640px)' }}
          >
            <div className="flex items-center justify-between px-4 pt-4 pb-2">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-[#ff3131] flex items-center justify-center shrink-0">
                  <Sparkles size={16} className="text-white" />
                </div>
                <div className="min-w-0">
                  <p className="font-fredoka font-black text-base text-slate-900 leading-tight">
                    Asesor de Tienda
                  </p>
                  <p className="text-[10px] text-slate-500 truncate">
                    {formatMillas(millas)} M · reglas locales + feed
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-600"
              >
                <X size={18} />
              </button>
            </div>

            <form
              className="px-4 pb-3"
              onSubmit={(e) => {
                e.preventDefault();
                setQuery(draft.trim());
              }}
            >
              <div className="flex gap-2">
                <input
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder="¿Qué buscas? ej. filtro, llanta…"
                  className="flex-1 h-10 rounded-xl border-2 border-slate-200 px-3 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#ff3131]"
                />
                <button
                  type="submit"
                  className="h-10 px-4 rounded-xl bg-[#ff3131] text-white text-xs font-black uppercase tracking-wide active:scale-95 transition-transform"
                >
                  Ver
                </button>
              </div>
            </form>

            <div
              className="overflow-y-auto px-4 pb-6 space-y-2"
              style={{ maxHeight: 'calc(min(88dvh, 640px) - 140px)' }}
            >
              {loading && (
                <div className="flex items-center justify-center gap-2 py-8 text-slate-500 text-sm">
                  <Loader2 size={16} className="animate-spin" />
                  Buscando en el catálogo…
                </div>
              )}

              {!loading && error && (
                <p className="text-center text-sm text-[#b91c1c] py-6">{error}</p>
              )}

              {!loading && !error && list.length === 0 && (
                <p className="text-center text-sm text-slate-500 py-6">
                  Sin sugerencias con tu saldo o búsqueda. Sigue jugando o prueba otra palabra.
                </p>
              )}

              {!loading &&
                list.map((s) => (
                  <div
                    key={`${s.kind}-${s.product.id}`}
                    className="flex gap-3 p-3 rounded-2xl border-2 border-slate-200 bg-slate-50"
                  >
                    <div className="w-14 h-14 rounded-xl bg-white border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center">
                      {s.product.image ? (
                        <img
                          src={s.product.image}
                          alt=""
                          className="w-full h-full object-contain"
                          loading="lazy"
                        />
                      ) : (
                        <span className="text-lg">📦</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span
                          className={cn(
                            'text-[9px] font-black uppercase px-1.5 py-0.5 rounded-full',
                            kindTone(s.kind)
                          )}
                        >
                          {kindLabel(s.kind)}
                        </span>
                        {s.product.brand && (
                          <span className="text-[9px] font-bold text-slate-400 truncate">
                            {s.product.brand}
                          </span>
                        )}
                      </div>
                      <p className="text-sm font-bold text-slate-900 line-clamp-2 leading-snug">
                        {s.product.name}
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-2">{s.reason}</p>
                      <p className="text-[12px] font-fredoka font-black text-[#ff3131] mt-1">
                        {formatMillas(s.millasCost)} M
                        {s.product.price != null && (
                          <span className="ml-1.5 text-[10px] font-bold text-slate-400 line-through">
                            ${s.product.price.toLocaleString('es-CO')}
                          </span>
                        )}
                      </p>
                      <div className="flex gap-2 mt-2">
                        {onSelectProduct && (
                          <button
                            type="button"
                            onClick={() => onSelectProduct(s.product)}
                            className="text-[10px] font-black uppercase tracking-wide px-2.5 py-1.5 rounded-full bg-[#0D0E14] text-white active:scale-95"
                          >
                            Ver en tienda
                          </button>
                        )}
                        {s.product.link && (
                          <a
                            href={s.product.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wide px-2.5 py-1.5 rounded-full bg-white border border-slate-200 text-slate-700"
                          >
                            PDP <ExternalLink size={10} />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

              <p className="text-[9px] text-slate-400 text-center pt-2">
                {/* TODO(agent-omni): cablear agent-omni RPV */}
                MVP local — sin Omni agent todavía
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
