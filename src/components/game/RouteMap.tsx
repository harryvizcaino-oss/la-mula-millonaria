import { motion } from 'framer-motion';
import { Lock, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRouteStore } from '@/store/routeStore';
import { computeRouteBonus, ROUTE_CITIES } from '@/data/routes';

function formatNumber(n: number): string {
  if (n < 1000) return n.toLocaleString('es-CO', { maximumFractionDigits: 0 });
  if (n < 1_000_000) return `${(n / 1000).toFixed(n < 10_000 ? 1 : 0)}K`;
  if (n < 1_000_000_000) return `${(n / 1_000_000).toFixed(n < 10_000_000 ? 2 : 1)}M`;
  if (n < 1_000_000_000_000) return `${(n / 1_000_000_000).toFixed(2)}B`;
  return `${(n / 1_000_000_000_000).toFixed(2)}T`;
}

/**
 * Mapa de rutas (F7): línea vertical de ciudades colombianas. Las ciudades
 * se desbloquean con CPS total histórico y otorgan un bonus permanente al
 * CPS por click. El camión (🚛) marca la ciudad actual del viaje.
 */
export function RouteMap({ cpsTotal }: { cpsTotal: number }) {
  const currentCityId = useRouteStore((s) => s.currentCityId);
  const unlockedCityIds = useRouteStore((s) => s.unlockedCityIds);
  const setCurrentCity = useRouteStore((s) => s.setCurrentCity);

  const totalBonusPct = Math.round((computeRouteBonus(unlockedCityIds) - 1) * 100);

  return (
    <div className="rounded-2xl bg-white border-2 border-slate-200 shadow-sm p-4">
      <div className="flex items-center justify-between mb-1">
        <h3 className="font-fredoka font-black text-lg text-slate-900 flex items-center gap-1.5">
          <MapPin size={18} className="text-[#ff3131]" />
          Ruta Nacional
        </h3>
        <span className="text-[11px] font-black text-[#16A34A] bg-[#16A34A]/10 px-2 py-1 rounded-full">
          Bonus activo: +{totalBonusPct}%
        </span>
      </div>
      <p className="text-slate-500 text-[11px] mb-4">
        Desbloquea ciudades con tu <span className="font-black text-slate-700">CPS total histórico</span>.
        Cada ciudad suma un bonus permanente al CPS por click.
      </p>

      <div className="relative">
        {ROUTE_CITIES.map((city, idx) => {
          const unlocked = unlockedCityIds.includes(city.id);
          const isCurrent = currentCityId === city.id;
          const isLast = idx === ROUTE_CITIES.length - 1;
          // Progreso parcial hacia esta ciudad (para la ciudad siguiente bloqueada)
          const prev = ROUTE_CITIES[idx - 1];
          const progress =
            !unlocked && prev && cpsTotal >= prev.requiredCpsTotal
              ? Math.min(1, cpsTotal / city.requiredCpsTotal)
              : unlocked
                ? 1
                : 0;

          return (
            <div key={city.id} className="relative flex gap-3">
              {/* Conector vertical */}
              {!isLast && (
                <div className="absolute left-[21px] top-11 bottom-0 w-1 rounded-full bg-slate-200 overflow-hidden">
                  <div
                    className="w-full bg-gradient-to-b from-[#16A34A] to-[#4ADE80] transition-all duration-500"
                    style={{ height: `${(unlocked ? 1 : progress) * 100}%` }}
                  />
                </div>
              )}

              {/* Nodo ciudad */}
              <div
                className={cn(
                  'relative z-10 w-11 h-11 rounded-full flex items-center justify-center text-xl flex-shrink-0 border-2 transition-all',
                  isCurrent
                    ? 'bg-gradient-to-br from-[#F59E0B] to-[#F97316] border-[#FBBF24] shadow-[0_0_16px_rgba(245,158,11,0.5)]'
                    : unlocked
                      ? 'bg-white border-[#16A34A]'
                      : 'bg-slate-100 border-slate-300 grayscale'
                )}
              >
                {unlocked ? city.emoji : <Lock size={16} className="text-slate-400" />}
                {isCurrent && (
                  <motion.span
                    animate={{ x: [0, 4, 0] }}
                    transition={{ duration: 1.2, repeat: Infinity }}
                    className="absolute -right-2 -top-2 text-base"
                  >
                    🚛
                  </motion.span>
                )}
              </div>

              {/* Info ciudad */}
              <div className={cn('flex-1 min-w-0 pb-4', isLast && 'pb-0')}>
                <div className="flex items-center justify-between gap-2">
                  <p
                    className={cn(
                      'font-fredoka font-black text-sm',
                      unlocked ? 'text-slate-900' : 'text-slate-400'
                    )}
                  >
                    {city.name}
                    <span className="ml-1.5 text-[10px] font-black text-[#16A34A]">
                      +{city.bonusPct}%
                    </span>
                  </p>
                  {unlocked && !isCurrent && (
                    <button
                      onClick={() => setCurrentCity(city.id)}
                      className="text-[10px] font-black text-[#3B82F6] bg-[#3B82F6]/10 px-2 py-1 rounded-full hover:bg-[#3B82F6]/20 transition-colors"
                    >
                      VIAJAR
                    </button>
                  )}
                  {isCurrent && (
                    <span className="text-[10px] font-black text-[#B45309] bg-[#F59E0B]/15 px-2 py-1 rounded-full">
                      AQUÍ
                    </span>
                  )}
                </div>
                <p className={cn('text-[11px]', unlocked ? 'text-slate-500' : 'text-slate-400')}>
                  {city.description}
                </p>
                {!unlocked && (
                  <div className="mt-1.5">
                    <div className="flex justify-between text-[9px] font-bold text-slate-400 mb-0.5">
                      <span>{formatNumber(cpsTotal)}</span>
                      <span>{formatNumber(city.requiredCpsTotal)}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-slate-200 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-[#F59E0B] to-[#FBBF24] transition-all duration-500"
                        style={{ width: `${progress * 100}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
