import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import {
  Search,
  SlidersHorizontal,
  ChevronDown,
  X,
  ShoppingCart,
  Heart,
  Share2,
  Star,
  Package,
  Zap,
  Truck as TruckIcon,
  Check,
  Copy,
  Loader2,
  Grid3x3,
  Monitor,
  Home,
  Dumbbell,
  Shirt,
  Watch,
  Gift,
  ExternalLink,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import PrimaryButton from '@/components/PrimaryButton';
import { mockProducts, categories, getGradientClass } from '@/data/mockProducts';
import type { Product } from '@/data/mockProducts';
import { fetchVtexProducts, fetchVtexCategories } from '@/lib/vtexCatalog';
import type { VtexProduct } from '@/lib/vtexCatalog';
import { useAuth } from '@/hooks/useAuth';
import { useMillas } from '@/providers/MillasProvider';
import { useClickerStore } from '@/store/clickerStore';
import { useSeasonStore } from '@/store/seasonStore';

/* ═══════════════════════════════════════════════════════════════════
   Constants & Helpers
   ═══════════════════════════════════════════════════════════════════ */

const fadeInUp = {
  hidden: { opacity: 0, y: 15 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, duration: 0.35, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] },
  }),
};

const sortOptions = [
  { value: 'popular', label: 'Mas Popular' },
  { value: 'price-asc', label: 'Precio: Menor a Mayor' },
  { value: 'price-desc', label: 'Precio: Mayor a Menor' },
  { value: 'newest', label: 'Nuevos' },
];

function getCategoryIconComponent(iconName: string) {
  const iconMap: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
    Grid3x3, Monitor, Home, Dumbbell, Shirt, Watch, Gift,
  };
  return iconMap[iconName] || Package;
}

function formatMillas(n: number): string {
  return n.toLocaleString('es-CO');
}

/* Formato compacto es-CO para las pills de balance (1,2 M, 350 mil, etc.) */
function formatCompact(n: number): string {
  return new Intl.NumberFormat('es-CO', { notation: 'compact', maximumFractionDigits: 1 }).format(n);
}

/* ── Catálogo VTEX real (redpostventa.com) ──
   Si la Edge Function responde, el grid usa productos reales; si no,
   cae a mockProducts sin ruido. El costo en TicaMillas se deriva del
   precio COP a la tasa de redención de efectivo (100M millas = $10.000
   COP → 1 COP = 10.000 millas): los productos reales son objetivos
   aspiracionales de muy largo plazo, NO canjes rápidos. */
const MILLAS_PER_COP = 10_000;

function mapVtexProduct(p: VtexProduct): Product {
  const millasCost = p.price != null ? Math.round(p.price * MILLAS_PER_COP) : 0;
  return {
    id: p.id,
    name: p.name,
    brand: p.brand || 'redpostventa.com',
    category: p.category || 'Catalogo',
    image: 'gradient-red',
    imageUrl: p.image ?? undefined,
    priceCOP: p.price ?? 0,
    millasCost,
    description: `${p.name} de ${p.brand || 'redpostventa.com'}. Producto del catalogo real de redpostventa.com.`,
    redeemable: p.price != null,
    link: p.link,
    skuId: p.skuId ?? undefined,
    sellerId: p.sellerId ?? undefined,
  };
}

function getProductCategoryIcon(category: string) {
  return getCategoryIconComponent(
    category === 'Electronica' ? 'Headphones'
      : category === 'Hogar' ? 'Home'
        : category === 'Deportes' ? 'Dumbbell'
          : category === 'Moda' ? 'Shirt'
            : category === 'Accesorios' ? 'Briefcase'
              : category === 'Gift Cards' ? 'Gift'
                : 'Package'
  );
}

/* ───────────────── Cash Redemption Helpers ───────────────── */

const MILLAS_PER_COP_BLOCK = 100_000_000;
const COP_PER_BLOCK = 10_000;
const TICKET_TO_MILLAS = 1_000;

/* ── VTEX Gift Cards (se redimen con CPS; NO afectan el ranking) ── */
const VTEX_GIFT_CARDS = [
  { usd: 10, cps: 100_000 },
  { usd: 25, cps: 250_000 },
  { usd: 50, cps: 500_000 },
  { usd: 100, cps: 1_000_000 },
  { usd: 250, cps: 2_500_000 },
];

function totalMillasValue(millas: number, tickets: number): number {
  return millas + tickets * TICKET_TO_MILLAS;
}

function convertToCop(millas: number, tickets: number): number {
  const total = totalMillasValue(millas, tickets);
  return Math.floor(total / MILLAS_PER_COP_BLOCK) * COP_PER_BLOCK;
}

/* ═══════════════════════════════════════════════════════════════════
   Product Placeholder Image Component
   ═══════════════════════════════════════════════════════════════════ */

function ProductPlaceholder({ gradient, icon: Icon }: { gradient: string; icon: React.ComponentType<{ size?: number; className?: string }> }) {
  return (
    <div className={cn('w-full aspect-square bg-gradient-to-br flex items-center justify-center', gradient)}>
      <Icon size={48} className="text-slate-400" />
    </div>
  );
}

/* ═════════════════ Cash Redemption Modal ═════════════════ */

function CashRedemptionModal({
  isOpen,
  onClose,
  code,
  cop,
}: {
  isOpen: boolean;
  onClose: () => void;
  code: string;
  cop: number;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {
      const ta = document.createElement('textarea');
      ta.value = code;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [code]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-md flex items-center justify-center px-4"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-fredoka font-black text-xl text-slate-900">Gift Card Generada</h3>
              <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100">
                <X size={18} className="text-slate-500" />
              </button>
            </div>
            <p className="text-slate-500 text-sm mb-4">
              Usa este codigo en nuestro marketplace para obtener ${cop.toLocaleString('es-CO')} COP.
            </p>
            <div className="bg-gradient-to-br from-[#1A1B26] to-[#232433] rounded-2xl p-5 border-2 border-dashed border-[#ff3131]/60 text-center mb-4">
              <p className="text-slate-500 text-[10px] uppercase tracking-widest mb-2">Codigo</p>
              <div className="flex items-center justify-center gap-2">
                <code className="font-mono font-bold text-2xl text-white tracking-wider">{code}</code>
                <button onClick={handleCopy} className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20">
                  {copied ? <Check size={16} className="text-[#ff4c4c]" /> : <Copy size={16} className="text-white" />}
                </button>
              </div>
              <p className="text-[#ff3131] font-fredoka font-bold text-xl mt-2">${cop.toLocaleString('es-CO')} COP</p>
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

/* ═════════════════ VTEX Gift Card Modal (CPS) ═════════════════ */

function VtexGiftCardModal({
  isOpen,
  onClose,
  code,
  usd,
}: {
  isOpen: boolean;
  onClose: () => void;
  code: string;
  usd: number;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {
      const ta = document.createElement('textarea');
      ta.value = code;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [code]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-md flex items-center justify-center px-4"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-fredoka font-black text-xl text-slate-900">Gift Card VTEX</h3>
              <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100">
                <X size={18} className="text-slate-500" />
              </button>
            </div>
            <p className="text-slate-500 text-sm mb-4">
              Usa este codigo en <span className="font-bold text-slate-900">redpostventa.com</span> para obtener ${usd} USD.
              Redimir CPS <span className="font-bold">no afecta tu ranking</span>.
            </p>
            <div className="bg-gradient-to-br from-[#1A1B26] to-[#232433] rounded-2xl p-5 border-2 border-dashed border-[#ff3131]/60 text-center mb-4">
              <p className="text-slate-500 text-[10px] uppercase tracking-widest mb-2">Codigo VTEX</p>
              <div className="flex items-center justify-center gap-2">
                <code className="font-mono font-bold text-lg text-white tracking-wider">{code}</code>
                <button onClick={handleCopy} className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20">
                  {copied ? <Check size={16} className="text-[#ff4c4c]" /> : <Copy size={16} className="text-white" />}
                </button>
              </div>
              <p className="text-[#ff3131] font-fredoka font-bold text-xl mt-2">${usd} USD</p>
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

/* ═══════════════════════════════════════════════════════════════════
   Star Rating Component
   ═══════════════════════════════════════════════════════════════════ */

function StarRating({ rating, count }: { rating: number; count?: number }) {
  return (
    <div className="flex items-center gap-1">
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            size={10}
            className={cn(
              star <= Math.floor(rating)
                ? 'text-[#ff3131] fill-[#ff3131]'
                : star <= rating
                  ? 'text-[#ff3131] fill-[#ff3131]/50'
                  : 'text-[#232433]'
            )}
          />
        ))}
      </div>
      {count !== undefined && (
        <span className="text-slate-500 text-[10px]">({count})</span>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   Millas Badge Overlay
   ═══════════════════════════════════════════════════════════════════ */

function MillasBadgeOverlay({ millas }: { millas: number }) {
  return (
    <div className="absolute top-2 right-2 z-10">
      <div className="bg-gradient-to-r from-[#ff3131] to-[#ff4c4c] rounded-full px-2.5 py-1 flex items-center gap-1 shadow-[0_2px_8px_rgba(255,49,49,0.3)]">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" className="text-slate-900">
          <circle cx="12" cy="12" r="10" fill="currentColor" opacity="0.2" />
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
          <text x="12" y="16" textAnchor="middle" fill="currentColor" fontSize="10" fontWeight="bold" fontFamily="Fredoka, sans-serif">M</text>
        </svg>
        <span className="text-slate-900 font-fredoka font-bold text-[11px]">{formatMillas(millas)}</span>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   Product Card Component
   ═══════════════════════════════════════════════════════════════════ */

function ProductCard({ product, index, userMillas, onSelect }: {
  product: Product;
  index: number;
  userMillas: number;
  onSelect: (p: Product) => void;
}) {
  const canAfford = product.redeemable !== false && userMillas >= product.millasCost;
  const CategoryIcon = getProductCategoryIcon(product.category);
  const progress = product.redeemable !== false && product.millasCost > 0
    ? Math.min(100, (userMillas / product.millasCost) * 100)
    : 0;

  return (
    <motion.div
      custom={index}
      variants={fadeInUp}
      initial="hidden"
      animate="visible"
      className="relative bg-white rounded-2xl border border-slate-200 shadow-card overflow-hidden cursor-pointer transition-all duration-200 hover:border-[#ff3131]/30 hover:shadow-lg active:scale-[0.99]"
      onClick={() => onSelect(product)}
    >
      <div className="flex items-center gap-3 p-3">
        {/* Imagen 68px */}
        <div className="relative w-[68px] h-[68px] rounded-xl overflow-hidden flex-shrink-0">
          {product.imageUrl ? (
            <img
              src={product.imageUrl}
              alt={product.name}
              loading="lazy"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className={cn('w-full h-full bg-gradient-to-br flex items-center justify-center', getGradientClass(product.image))}>
              <CategoryIcon size={24} className="text-slate-400" />
            </div>
          )}
          {product.featured && (
            <div className="absolute top-1 left-1 bg-[#ff3131] text-white text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full">
              Destacado
            </div>
          )}
        </div>

        {/* Info central */}
        <div className="flex-1 min-w-0">
          <h3 className="text-slate-900 text-sm font-semibold line-clamp-2 leading-tight">
            {product.name}
          </h3>
          <p className="text-slate-500 text-[11px] mt-0.5">{product.brand}</p>
          <div className="flex items-center gap-2 mt-1">
            {product.redeemable !== false ? (
              <>
                <span className="text-slate-400 text-[11px] line-through">${formatMillas(product.priceCOP)}</span>
                <span className="text-[#ff3131] font-fredoka font-bold text-sm">{formatMillas(product.millasCost)} M</span>
              </>
            ) : (
              <span className="text-slate-500 text-[11px] font-bold">Solo en redpostventa.com</span>
            )}
          </div>
        </div>

        {/* Asequibilidad compacta */}
        {product.redeemable !== false && (
          <div className="flex-shrink-0 text-right max-w-[90px]">
            {canAfford ? (
              <span className="inline-flex items-center gap-1 text-[#ff4c4c] text-[10px] font-bold">
                <Check size={12} className="flex-shrink-0" />
                Puedes redimirlo!
              </span>
            ) : (
              <span className="text-[#ff3131] text-[10px] font-bold leading-tight">
                Te faltan {formatCompact(product.millasCost - userMillas)}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Barra fina de progreso al pie */}
      {product.redeemable !== false && !canAfford && (
        <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-slate-100">
          <div
            className="h-full bg-gradient-to-r from-[#ff3131] to-[#ff4c4c] transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   Product Detail Bottom Sheet
   ═══════════════════════════════════════════════════════════════════ */

function ProductDetailSheet({ product, products, userMillas, isOpen, onClose, onRedeem }: {
  product: Product | null;
  products: Product[];
  userMillas: number;
  isOpen: boolean;
  onClose: () => void;
  onRedeem: (p: Product) => void;
}) {
  if (!product) return null;

  const canAfford = product.redeemable !== false && userMillas >= product.millasCost;
  const CategoryIcon = getProductCategoryIcon(product.category);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-50 bg-slate-100 rounded-t-3xl max-h-[85vh] overflow-y-auto"
            style={{ maxWidth: '32rem', margin: '0 auto' }}
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1 sticky top-0 bg-slate-100 z-10">
              <div className="w-10 h-1 rounded-full bg-white/20" />
            </div>

            {/* Share button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-full bg-slate-100/80 text-slate-900 z-10 hover:bg-black/60 transition-colors"
            >
              <Share2 size={18} />
            </button>

            {/* Product Image */}
            <div className="relative mx-4 rounded-2xl overflow-hidden">
              {product.imageUrl ? (
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  className="w-full aspect-square object-cover"
                />
              ) : (
                <ProductPlaceholder gradient={getGradientClass(product.image)} icon={CategoryIcon} />
              )}
              {product.redeemable !== false && <MillasBadgeOverlay millas={product.millasCost} />}
            </div>

            {/* Product Info */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="px-4 pt-4 pb-6 space-y-4"
            >
              <div>
                <h2 className="font-fredoka font-bold text-2xl text-slate-900 leading-tight">{product.name}</h2>
                <p className="text-slate-500 text-sm mt-1">{product.brand}</p>
                {product.rating && <StarRating rating={product.rating} count={product.reviewCount} />}
              </div>

              <p className="text-slate-500 text-sm leading-relaxed">{product.description}</p>

              {/* Millas display (o precio COP de referencia si no es redimible) */}
              {product.redeemable !== false ? (
                <div className="bg-white rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 text-sm">Costo en TicaMillas</span>
                  <div className="flex items-center gap-2">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-[#ff3131]">
                      <circle cx="12" cy="12" r="10" fill="currentColor" opacity="0.2" />
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                      <text x="12" y="16" textAnchor="middle" fill="currentColor" fontSize="10" fontWeight="bold" fontFamily="Fredoka, sans-serif">M</text>
                    </svg>
                    <span className="text-[#ff3131] font-fredoka font-bold text-2xl">{formatMillas(product.millasCost)}</span>
                  </div>
                </div>
                <div className="text-right text-slate-500 text-xs">
                  = ${formatMillas(product.priceCOP)} COP
                </div>

                {/* Progress bar */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">Tienes {formatMillas(userMillas)} / {formatMillas(product.millasCost)} TicaMillas</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(100, (userMillas / product.millasCost) * 100)}%` }}
                      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
                      className={cn(
                        'h-full rounded-full',
                        canAfford ? 'bg-gradient-to-r from-[#ff4c4c] to-[#ff4c4c]' : 'bg-gradient-to-r from-[#ff3131] to-[#ff4c4c]'
                      )}
                    />
                  </div>
                  {canAfford ? (
                    <p className="text-[#ff4c4c] text-xs flex items-center gap-1">
                      <Check size={12} /> Puedes redimir este producto!
                    </p>
                  ) : (
                    <p className="text-[#ff3131] text-xs">Te faltan {formatMillas(product.millasCost - userMillas)} TicaMillas. Sigue jugando!</p>
                  )}
                </div>
                </div>
              ) : (
                <div className="bg-white rounded-2xl p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 text-sm">Precio en redpostventa.com</span>
                    <span className="text-slate-900 font-fredoka font-bold text-2xl">${formatMillas(product.priceCOP)}</span>
                  </div>
                </div>
              )}

              {/* Related products row */}
              <div>
                <h4 className="text-slate-900 font-semibold text-sm mb-2">Productos similares</h4>
                <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4">
                  {products
                    .filter(p => p.category === product.category && p.id !== product.id)
                    .slice(0, 4)
                    .map((rp) => (
                      <button
                        key={rp.id}
                        onClick={() => {/* could navigate to related */}}
                        className="flex-shrink-0 w-28 bg-white rounded-xl overflow-hidden border border-slate-200 text-left"
                      >
                        {rp.imageUrl ? (
                          <img src={rp.imageUrl} alt={rp.name} loading="lazy" className="h-20 w-full object-cover" />
                        ) : (
                          <div className={cn('h-20 bg-gradient-to-br flex items-center justify-center', getGradientClass(rp.image))}>
                            <Package size={20} className="text-slate-400" />
                          </div>
                        )}
                        <div className="p-2">
                          <p className="text-slate-900 text-[10px] font-medium line-clamp-2 leading-tight">{rp.name}</p>
                          {rp.redeemable !== false && (
                            <p className="text-[#ff3131] text-[10px] font-bold mt-0.5">{formatMillas(rp.millasCost)} M</p>
                          )}
                        </div>
                      </button>
                    ))}
                </div>
              </div>

              {/* Action buttons */}
              <div className="space-y-2 pt-2">
                {product.redeemable !== false ? (
                  <PrimaryButton
                    variant={canAfford ? 'primary' : 'secondary'}
                    icon={canAfford ? <Zap size={18} /> : <TruckIcon size={18} />}
                    disabled={!canAfford}
                    onClick={() => onRedeem(product)}
                  >
                    {canAfford ? 'REDIMIR AHORA' : 'JUEGA PARA GANAR TicaMillas'}
                  </PrimaryButton>
                ) : (
                  <a
                    href={product.link || 'https://www.redpostventa.com'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full h-14 rounded-2xl font-bold uppercase tracking-wider text-base bg-slate-200 text-slate-500"
                  >
                    <ExternalLink size={18} />
                    Solo en redpostventa.com
                  </a>
                )}
                <PrimaryButton variant="outline" icon={<Heart size={18} />}>
                  AGREGAR A DESEADOS
                </PrimaryButton>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   Featured Banner Component
   ═══════════════════════════════════════════════════════════════════ */

function FeaturedBanner() {
  const [activeSlide, setActiveSlide] = useState(0);
  const banners = [
    {
      title: 'Nuevos Productos',
      subtitle: 'Descubre lo nuevo esta semana!',
      cta: 'Explorar',
      gradient: 'from-[#ff3131] via-[#b91c1c] to-[#0D0E14]',
    },
    {
      title: '50% OFF en TicaMillas',
      subtitle: 'Redime con la mitad de TicaMillas en seleccionados',
      cta: 'Ver Ofertas',
      gradient: 'from-[#ff3131] via-[#ff4c4c] to-[#EF4444]',
    },
    {
      title: 'Gift Cards',
      subtitle: 'Disponibles desde 5,000 TicaMillas',
      cta: 'Comprar',
      gradient: 'from-[#0D0E14] via-[#b91c1c] to-[#ff3131]',
    },
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % banners.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [banners.length]);

  return (
    <div className="mx-4 rounded-2xl overflow-hidden relative h-40">
      <AnimatePresence mode="wait">
        <motion.div
          key={activeSlide}
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -50 }}
          transition={{ duration: 0.4 }}
          className={cn(
            'absolute inset-0 bg-gradient-to-r flex flex-col justify-center px-5',
            banners[activeSlide].gradient
          )}
        >
          <h3 className="font-fredoka font-bold text-xl text-slate-900 drop-shadow-lg">
            {banners[activeSlide].title}
          </h3>
          <p className="text-slate-800 text-sm mt-1 max-w-[70%]">
            {banners[activeSlide].subtitle}
          </p>
          <button className="mt-3 bg-slate-100/80 backdrop-blur-sm text-slate-900 text-xs font-bold px-4 py-2 rounded-full w-fit hover:bg-slate-100 transition-colors">
            {banners[activeSlide].cta}
          </button>
        </motion.div>
      </AnimatePresence>

      {/* Pagination dots */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
        {banners.map((_, i) => (
          <button
            key={i}
            onClick={() => setActiveSlide(i)}
            className={cn(
              'w-2 h-2 rounded-full transition-all duration-300',
              i === activeSlide ? 'bg-white w-5' : 'bg-white/50'
            )}
          />
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   Sort Bottom Sheet
   ═══════════════════════════════════════════════════════════════════ */

function SortSheet({ isOpen, onClose, selected, onSelect }: {
  isOpen: boolean;
  onClose: () => void;
  selected: string;
  onSelect: (v: string) => void;
}) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-50 bg-slate-100 rounded-t-3xl p-5"
            style={{ maxWidth: '32rem', margin: '0 auto' }}
          >
            <div className="flex justify-center pb-3">
              <div className="w-10 h-1 rounded-full bg-white/20" />
            </div>
            <h3 className="font-fredoka font-bold text-lg text-slate-900 mb-4">Ordenar por</h3>
            <div className="space-y-2">
              {sortOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => { onSelect(opt.value); onClose(); }}
                  className={cn(
                    'w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-all',
                    selected === opt.value
                      ? 'bg-[#ff3131]/20 text-[#ff3131] border border-[#ff3131]/30'
                      : 'bg-white text-slate-900 hover:bg-white/80'
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   Main Marketplace Page
   ═══════════════════════════════════════════════════════════════════ */

export default function Marketplace() {
  const navigate = useNavigate();
  const { isLoading: authLoading } = useAuth();
  const { millas, addMillas } = useMillas();
  const clicker = useClickerStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [sortBy, setSortBy] = useState('popular');
  const [sortOpen, setSortOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [displayCount, setDisplayCount] = useState(8);
  const [redemptionCart] = useState<Product[]>([]);
  const [ticketToasts, setTicketToasts] = useState<{ id: number; text: string; color: string }[]>([]);
  const [cashMillasAmount, setCashMillasAmount] = useState(0);
  const [cashTicketAmount, setCashTicketAmount] = useState(0);
  const [redeemTab, setRedeemTab] = useState<'cash' | 'cps'>('cash');
  const [cashModalOpen, setCashModalOpen] = useState(false);
  const [cashGiftCard, setCashGiftCard] = useState<{ code: string; cop: number } | null>(null);
  const [vtexGiftCard, setVtexGiftCard] = useState<{ code: string; usd: number } | null>(null);
  const toastIdRef = useRef(0);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(loadMoreRef, { margin: '200px' });
  const searchInputRef = useRef<HTMLInputElement>(null);

  /* ── Catálogo VTEX real (fallback silencioso a mocks) ── */
  const [catalogOk, setCatalogOk] = useState(false);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [vtexProducts, setVtexProducts] = useState<Product[]>([]);
  const [vtexTabs, setVtexTabs] = useState<{ id: string; label: string; icon: string }[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    void fetchVtexCategories().then((tree) => {
      if (cancelled || !tree || tree.length === 0) return;
      setVtexTabs([
        { id: 'all', label: 'Todos', icon: 'Grid3x3' },
        ...tree.map((c) => ({ id: String(c.id), label: c.name, icon: 'Package' })),
      ]);
    });
    return () => { cancelled = true; };
  }, []);

  // Buscador (ft=) y categoría (fq=C:/id/) server-side, debounce 400ms.
  // Si la función no responde → catalogOk=false y se usan mocks como hoy.
  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(() => {
      setCatalogLoading(true);
      const isVtexTab = activeCategory !== 'all' && !!vtexTabs?.some((t) => t.id === activeCategory);
      void fetchVtexProducts({
        query: searchQuery.trim() || undefined,
        categoryId: isVtexTab ? activeCategory : undefined,
        from: 0,
        to: 49,
      }).then((res) => {
        if (cancelled) return;
        if (res) {
          setVtexProducts(res.products.map(mapVtexProduct));
          setCatalogOk(true);
        } else {
          setCatalogOk(false);
        }
        setCatalogLoading(false);
      });
    }, 400);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [searchQuery, activeCategory, vtexTabs]);

  // Tabs: árbol VTEX nivel 1; si el árbol falla pero el catálogo responde,
  // solo "Todos"; con mocks, las tabs de siempre.
  const tabs: ReadonlyArray<{ id: string; label: string; icon: string }> =
    vtexTabs ?? (catalogOk ? [{ id: 'all', label: 'Todos', icon: 'Grid3x3' }] : categories);

  /* ── Infinite scroll ── */
  useEffect(() => {
    if (isInView) {
      setDisplayCount((prev) => Math.min(prev + 6, filteredProducts.length));
    }
  }, [isInView]);

  /* ── Filter & sort products ── */
  const filteredProducts = useMemo(() => {
    // Con catálogo VTEX activo el filtrado por texto/categoría ya lo hizo
    // el servidor (ft= / categoryId); con mocks se filtra local como hoy.
    let products = catalogOk ? [...vtexProducts] : [...mockProducts];

    if (!catalogOk) {
      if (activeCategory !== 'all') {
        products = products.filter((p) => p.category === activeCategory);
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        products = products.filter(
          (p) =>
            p.name.toLowerCase().includes(q) ||
            p.brand.toLowerCase().includes(q) ||
            p.category.toLowerCase().includes(q)
        );
      }
    }

    switch (sortBy) {
      case 'price-asc':
        products.sort((a, b) => a.millasCost - b.millasCost);
        break;
      case 'price-desc':
        products.sort((a, b) => b.millasCost - a.millasCost);
        break;
      case 'newest':
        products.sort((a, b) => parseInt(b.id) - parseInt(a.id));
        break;
      default:
        products.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;
    }

    return products;
  }, [catalogOk, vtexProducts, activeCategory, searchQuery, sortBy]);

  const visibleProducts = filteredProducts.slice(0, displayCount);
  const hasMore = displayCount < filteredProducts.length;

  /* ── Handlers ── */
  const handleSelectProduct = useCallback((product: Product) => {
    setSelectedProduct(product);
    setDetailOpen(true);
  }, []);

  const handleRedeem = useCallback((product: Product) => {
    setDetailOpen(false);
    // Navigate to redemption page with product data
    navigate('/redemption', { state: { product, userMillas: millas } });
  }, [navigate, millas]);

  const handleCashRedemption = () => {
    const cop = convertToCop(cashMillasAmount, cashTicketAmount);
    if (cop <= 0) return;
    if (cashMillasAmount > millas || cashTicketAmount > clicker.goldenTickets) return;

    addMillas(-cashMillasAmount);
    clicker.redeemGoldenTickets(cashTicketAmount);
    useSeasonStore.getState().addXp(50); // F6: XP del pase por redención

    const code = `TC-${Math.random().toString(36).substring(2, 6).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    setCashGiftCard({ code, cop });
    setCashModalOpen(true);
    setCashMillasAmount(0);
    setCashTicketAmount(0);
  };

  const showTicketToast = (text: string, color = '#ff4c4c') => {
    const id = ++toastIdRef.current;
    setTicketToasts((prev) => [...prev, { id, text, color }]);
    setTimeout(() => setTicketToasts((prev) => prev.filter((t) => t.id !== id)), 2000);
  };

  // Redime CPS por Gift Card VTEX: solo baja cpsBalance; cpsTotal (ranking) intacto
  const handleRedeemVtex = (usd: number, cps: number) => {
    const result = clicker.redeemCps(cps);
    if (!result.success) return;
    useSeasonStore.getState().addXp(50); // F6: XP del pase por redención
    const code = `VTEX-${usd}-${Math.random().toString(36).substring(2, 6).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    setVtexGiftCard({ code, usd });
    showTicketToast(`Gift Card VTEX $${usd} generada`, '#ff4c4c');
  };

  const cartTotalMillas = redemptionCart.reduce((sum, p) => sum + p.millasCost, 0);

  if (authLoading) {
    return (
      <div className="min-h-[100dvh] bg-white flex items-center justify-center">
        <Loader2 size={32} className="text-[#ff3131] animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-white pt-14 pb-4">
      {/* ─── Balances: pill row compacta bajo el título "Tienda" ─── */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-4 mt-3 flex items-center gap-1.5 overflow-x-auto scrollbar-hide"
      >
        <span className="flex items-center gap-1 h-9 px-3 rounded-full bg-[#ff3131]/10 border border-[#ff3131]/30 whitespace-nowrap flex-shrink-0">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" className="text-[#ff3131]">
            <circle cx="12" cy="12" r="10" fill="currentColor" opacity="0.2" />
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
            <text x="12" y="16" textAnchor="middle" fill="currentColor" fontSize="10" fontWeight="bold" fontFamily="Fredoka, sans-serif">M</text>
          </svg>
          <span className="text-[#ff3131] font-fredoka font-bold text-xs">{formatCompact(millas)}</span>
        </span>
        <span className="flex items-center gap-1 h-9 px-3 rounded-full bg-slate-100 border border-slate-200 whitespace-nowrap flex-shrink-0">
          <span className="text-xs">🎟️</span>
          <span className="text-slate-900 font-fredoka font-bold text-xs">{formatCompact(clicker.goldenTickets)}</span>
        </span>
        <span className="flex items-center gap-1 h-9 px-3 rounded-full bg-slate-100 border border-slate-200 whitespace-nowrap flex-shrink-0">
          <span className="text-xs">⚡</span>
          <span className="text-slate-900 font-fredoka font-bold text-xs">{formatCompact(Math.floor(clicker.cpsBalance))}</span>
        </span>
        <span className="flex items-center gap-1 h-9 px-3 rounded-full bg-[#0D0E14] border border-[#232433] whitespace-nowrap flex-shrink-0">
          <span className="text-[#ff4c4c] font-fredoka font-bold text-xs">$</span>
          <span className="text-white font-fredoka font-bold text-xs">{formatCompact(convertToCop(millas, clicker.goldenTickets))} COP</span>
        </span>
      </motion.div>

      {/* ─── Redime: card única con tabs Efectivo / Gift Cards CPS ─── */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-4 mt-3 bg-white rounded-2xl border border-slate-200 p-3 shadow-sm"
      >
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#ff4c4c] to-[#ff3131] flex items-center justify-center text-white shadow-sm">
            <Gift size={16} />
          </div>
          <div>
            <p className="text-slate-900 font-black text-sm">Redime</p>
            <p className="text-slate-500 text-[10px] font-bold">
              {redeemTab === 'cash'
                ? 'Cada 100.000.000 M = $10.000 COP'
                : 'redpostventa.com · Redime con CPS · No afecta tu ranking'}
            </p>
          </div>
        </div>

        {/* Tabs pill (activo rojo sólido, inactivo gris) */}
        <div className="flex gap-1 p-1 mb-3 rounded-full bg-slate-100">
          <button
            onClick={() => setRedeemTab('cash')}
            className={cn(
              'flex-1 py-1.5 rounded-full text-[11px] font-black uppercase tracking-wider transition-all',
              redeemTab === 'cash'
                ? 'bg-[#ff3131] text-white shadow-[0_2px_8px_rgba(255,49,49,0.35)]'
                : 'text-slate-500'
            )}
          >
            Efectivo
          </button>
          <button
            onClick={() => setRedeemTab('cps')}
            className={cn(
              'flex-1 py-1.5 rounded-full text-[11px] font-black uppercase tracking-wider transition-all',
              redeemTab === 'cps'
                ? 'bg-[#ff3131] text-white shadow-[0_2px_8px_rgba(255,49,49,0.35)]'
                : 'text-slate-500'
            )}
          >
            Gift Cards CPS
          </button>
        </div>

        {redeemTab === 'cash' ? (
        <>
        <div className="space-y-2 mb-3">
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-slate-100 rounded-xl px-3 py-2">
              <p className="text-[10px] text-slate-500 font-bold uppercase">TicaMillas</p>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={0}
                  max={millas}
                  value={cashMillasAmount}
                  onChange={(e) => setCashMillasAmount(Math.max(0, Math.min(millas, parseInt(e.target.value) || 0)))}
                  className="w-full bg-transparent text-sm font-black text-[#b91c1c] outline-none"
                />
                <button
                  onClick={() => setCashMillasAmount(Math.floor(millas / MILLAS_PER_COP_BLOCK) * MILLAS_PER_COP_BLOCK)}
                  className="text-[10px] font-bold text-[#ff3131] hover:underline"
                >
                  Max
                </button>
              </div>
            </div>
            <div className="flex-1 bg-slate-100 rounded-xl px-3 py-2">
              <p className="text-[10px] text-slate-500 font-bold uppercase">Golden Tickets</p>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={0}
                  max={clicker.goldenTickets}
                  value={cashTicketAmount}
                  onChange={(e) => setCashTicketAmount(Math.max(0, Math.min(clicker.goldenTickets, parseInt(e.target.value) || 0)))}
                  className="w-full bg-transparent text-sm font-black text-[#b91c1c] outline-none"
                />
                <button
                  onClick={() => setCashTicketAmount(clicker.goldenTickets)}
                  className="text-[10px] font-bold text-[#ff3131] hover:underline"
                >
                  Max
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between bg-[#ff3131]/10 rounded-xl px-3 py-2">
            <p className="text-[#b91c1c] text-xs font-bold">Total en pesos</p>
            <p className="text-[#b91c1c] font-fredoka font-black text-lg">
              ${formatMillas(convertToCop(cashMillasAmount, cashTicketAmount))} COP
            </p>
          </div>
        </div>

        <button
          onClick={handleCashRedemption}
          disabled={convertToCop(cashMillasAmount, cashTicketAmount) <= 0}
          className={cn(
            'w-full h-10 rounded-xl text-xs font-black uppercase tracking-wider transition-all border-2',
            convertToCop(cashMillasAmount, cashTicketAmount) > 0
              ? 'bg-gradient-to-r from-[#ff3131] to-[#ff4c4c] text-white border-transparent shadow-[0_4px_16px_rgba(255,49,49,0.35)] active:scale-95'
              : 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
          )}
        >
          Generar Gift Card
        </button>
        </>
        ) : (
        <>
        <div className="grid grid-cols-2 gap-2">
          {VTEX_GIFT_CARDS.map((gc, i) => {
            const canAfford = clicker.cpsBalance >= gc.cps;
            return (
              <div
                key={gc.usd}
                className={cn(
                  'rounded-xl border-2 p-3 flex flex-col items-center text-center transition-colors',
                  i === VTEX_GIFT_CARDS.length - 1 && 'col-span-2',
                  canAfford ? 'border-[#ff3131] bg-[#ff3131]/5' : 'border-slate-200 bg-slate-50'
                )}
              >
                <p className="font-fredoka font-black text-xl text-slate-900">${gc.usd}</p>
                <p className="text-slate-500 text-[10px] font-bold mb-2">
                  {formatMillas(gc.cps)} CPS
                </p>
                <button
                  onClick={() => handleRedeemVtex(gc.usd, gc.cps)}
                  disabled={!canAfford}
                  className={cn(
                    'w-full py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all',
                    canAfford
                      ? 'bg-gradient-to-r from-[#ff3131] to-[#ff4c4c] text-white shadow-[0_2px_10px_rgba(255,49,49,0.35)] active:scale-95'
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  )}
                >
                  {canAfford ? 'REDIMIR' : `FALTAN ${formatMillas(gc.cps - Math.floor(clicker.cpsBalance))}`}
                </button>
              </div>
            );
          })}
        </div>
        </>
        )}
      </motion.div>

      {/* ─── Search Bar (sticky) ─── */}
      <div className="sticky top-14 z-30 bg-white/95 backdrop-blur-sm px-4 py-2.5 border-b border-slate-200 mt-3">
        <div className="flex items-center gap-2">
          <div className="flex-1 relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
              }}
              placeholder="Buscar productos..."
              className="w-full h-10 bg-white rounded-full pl-10 pr-10 text-sm text-slate-900 placeholder:text-slate-500 border border-slate-200 focus:border-[#ff3131]/40 focus:outline-none transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => { setSearchQuery(''); searchInputRef.current?.focus(); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-900"
              >
                <X size={16} />
              </button>
            )}
          </div>
          <button
            onClick={() => setSortOpen(true)}
            className="flex items-center gap-1 h-10 px-3 bg-white rounded-full border border-slate-200 text-slate-500 text-xs hover:text-slate-900 transition-colors"
          >
            <ChevronDown size={14} />
          </button>
          <button className="flex items-center gap-1 h-10 px-3 bg-white rounded-full border border-slate-200 text-slate-500 text-xs hover:text-slate-900 transition-colors relative">
            <SlidersHorizontal size={14} />
            <span className="sr-only">Filtros</span>
          </button>
        </div>
      </div>

      {/* ─── Category Tabs ─── */}
      <div className="mt-3 px-4">
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 snap-x snap-mandatory scrollbar-hide">
          {tabs.map((cat) => {
            const Icon = getCategoryIconComponent(cat.icon);
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => { setActiveCategory(cat.id); setDisplayCount(8); }}
                className={cn(
                  'flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-medium whitespace-nowrap snap-start transition-all duration-200 flex-shrink-0',
                  isActive
                    ? 'bg-[#ff3131] text-white shadow-[0_2px_8px_rgba(255,49,49,0.3)] scale-105'
                    : 'bg-white text-slate-500 hover:text-slate-900'
                )}
              >
                <Icon size={14} />
                {cat.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ─── Product Grid ─── */}
      <div className="px-4 mt-4">
        {catalogLoading ? (
          /* ─── Loading State ─── */
          <div className="flex justify-center py-16">
            <Loader2 size={24} className="text-[#ff3131] animate-spin" />
          </div>
        ) : visibleProducts.length > 0 ? (
          <>
            <div className="flex items-center justify-between mb-3">
              <p className="text-slate-500 text-xs">
                {filteredProducts.length} producto{filteredProducts.length !== 1 ? 's' : ''}
              </p>
              <p className="text-slate-500 text-xs">
                Orden: {sortOptions.find(s => s.value === sortBy)?.label}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {visibleProducts.map((product, index) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  index={index}
                  userMillas={millas}
                  onSelect={handleSelectProduct}
                />
              ))}
            </div>

            {/* Load more trigger */}
            {hasMore && (
              <div ref={loadMoreRef} className="py-4 flex justify-center">
                <Loader2 size={24} className="text-[#ff3131] animate-spin" />
              </div>
            )}

            {!hasMore && filteredProducts.length > 8 && (
              <p className="text-center text-slate-500 text-xs py-4">No hay mas productos</p>
            )}
          </>
        ) : (
          /* ─── Empty State ─── */
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center py-16 text-center"
          >
            <div className="w-32 h-32 bg-gradient-to-br from-[#1A1B26] to-[#232433] rounded-full flex items-center justify-center mb-4">
              <Package size={48} className="text-slate-500/40" />
            </div>
            <h3 className="font-fredoka font-bold text-lg text-slate-900 mb-1">No hay productos</h3>
            <p className="text-slate-500 text-sm max-w-[250px]">
              No encontramos productos que coincidan con tu busqueda. Intenta con otros terminos.
            </p>
            <button
              onClick={() => { setSearchQuery(''); setActiveCategory('all'); }}
              className="mt-4 text-[#ff3131] text-sm font-medium hover:underline"
            >
              Ver todos los productos
            </button>
          </motion.div>
        )}
      </div>

      {/* ─── Featured Banner (después del grid, solo en 'all') ─── */}
      <AnimatePresence>
        {activeCategory === 'all' && !searchQuery && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4"
          >
            <FeaturedBanner />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Product Detail Bottom Sheet ─── */}
      <ProductDetailSheet
        product={selectedProduct}
        products={filteredProducts}
        userMillas={millas}
        isOpen={detailOpen}
        onClose={() => setDetailOpen(false)}
        onRedeem={handleRedeem}
      />

      {/* ─── Sort Bottom Sheet ─── */}
      <SortSheet
        isOpen={sortOpen}
        onClose={() => setSortOpen(false)}
        selected={sortBy}
        onSelect={setSortBy}
      />

      {/* ─── Ticket Toasts ─── */}
      <AnimatePresence>
        {ticketToasts.map((t) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-24 left-0 right-0 z-50 flex justify-center px-4 pointer-events-none"
            style={{ maxWidth: '32rem', margin: '0 auto' }}
          >
            <div
              className="px-4 py-2 rounded-full text-slate-900 text-sm font-bold shadow-lg border-2 border-white"
              style={{ backgroundColor: t.color }}
            >
              {t.text}
            </div>
          </motion.div>
        ))}
      </AnimatePresence>

      {/* ─── Cash Redemption Modal ─── */}
      <CashRedemptionModal
        isOpen={cashModalOpen}
        onClose={() => setCashModalOpen(false)}
        code={cashGiftCard?.code || ''}
        cop={cashGiftCard?.cop || 0}
      />

      {/* ─── VTEX Gift Card Modal ─── */}
      <VtexGiftCardModal
        isOpen={vtexGiftCard !== null}
        onClose={() => setVtexGiftCard(null)}
        code={vtexGiftCard?.code || ''}
        usd={vtexGiftCard?.usd || 0}
      />

      {/* ─── Floating Cart FAB ─── */}
      <AnimatePresence>
        {redemptionCart.length > 0 && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            className="fixed bottom-20 left-0 right-0 z-40 px-4"
            style={{ maxWidth: '32rem', margin: '0 auto' }}
          >
            <div className="bg-slate-100 rounded-2xl p-4 shadow-[0_-4px_20px_rgba(0,0,0,0.3)] border border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-gradient-to-r from-[#ff3131] to-[#ff4c4c] rounded-full flex items-center justify-center">
                  <ShoppingCart size={18} className="text-slate-900" />
                </div>
                <div>
                  <p className="text-slate-900 text-sm font-semibold">{redemptionCart.length} producto{redemptionCart.length !== 1 ? 's' : ''}</p>
                  <p className="text-[#ff3131] text-xs font-fredoka font-bold">{formatMillas(cartTotalMillas)} TicaMillas</p>
                </div>
              </div>
              <button
                onClick={() => {
                  navigate('/redemption', { state: { cart: redemptionCart, userMillas: millas } });
                }}
                className="bg-gradient-to-r from-[#ff3131] to-[#ff4c4c] text-white px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider shadow-[0_4px_20px_rgba(255,49,49,0.4)] active:scale-95 transition-transform"
              >
                Redimir
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
