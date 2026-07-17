import { cn } from '@/lib/utils';
import type { FleetVehicle } from '@/data/fleetVehicles';
import { getTruckAsset } from '@/data/truckAssets';

interface FleetVehicleCardProps {
  vehicle: FleetVehicle;
  owned: boolean;
  selected: boolean;
  cost: number; // costo en golden tickets (con descuento aplicado)
  canAfford: boolean;
  onBuy: (id: string, el: HTMLElement) => void;
  onSelect: (id: string) => void;
}

/**
 * Tarjeta de vehículo de flota (SECTION B):
 * la flota es un MULTIPLICADOR (×) del CPS y se compra con Golden Tickets 🎟️.
 */
export function FleetVehicleCard({
  vehicle,
  owned,
  selected,
  cost,
  canAfford,
  onBuy,
  onSelect,
}: FleetVehicleCardProps) {
  return (
    <div
      className={cn(
        'brand-card building-card-v2 relative w-full rounded-2xl p-3 overflow-hidden',
        !owned && canAfford && 'affordable-glow'
      )}
      style={{ borderLeft: `4px solid ${vehicle.color}` }}
    >
      {selected && (
        <div className="absolute top-2 right-2 z-10 bg-[#EF4444] text-white text-[9px] font-black px-2 py-0.5 rounded-full border border-white shadow-sm">
          TOP
        </div>
      )}

      <div className="flex items-center gap-3">
        <div
          className={cn(
            'w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 border-2 shadow-inner transition-colors duration-500',
            selected && 'border-white/70'
          )}
          style={{ backgroundColor: `${vehicle.color}25`, borderColor: `${vehicle.color}70` }}
        >
          <img
            src={getTruckAsset(vehicle.id)}
            alt={`${vehicle.brand} ${vehicle.model}`}
            className="w-12 h-12 object-contain"
            draggable={false}
          />
        </div>

        <div className="flex-1 min-w-0">
          <h3
            className="text-white truncate leading-tight"
            style={{ fontSize: 18, fontWeight: 900 }}
          >
            {vehicle.brand}
          </h3>
          <p className="text-slate-300 text-xs truncate">
            {vehicle.model} · {vehicle.country}
          </p>
          {!owned && (
            <div className="inline-flex items-center gap-1.5 mt-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-[#FDE047] to-[#F59E0B] text-[#78350F] border border-[#B45309] shadow-sm">
              <span className="text-sm">🎟️</span>
              <span className="font-fredoka font-black text-sm">
                {cost.toLocaleString('es-CO')}
              </span>
            </div>
          )}
          {owned && !selected && (
            <p className="text-slate-400 text-[11px] mt-1">En tu flota · tócalo para conducirlo</p>
          )}
        </div>

        <div className="flex flex-col items-center justify-center flex-shrink-0 w-12">
          <span className="font-fredoka font-black text-lg leading-none text-[#4ADE80]">
            x{vehicle.multiplier}
          </span>
        </div>
      </div>

      {selected ? (
        <div className="mt-2.5 w-full py-2.5 rounded-xl font-black text-sm tracking-wide text-center bg-white/10 text-white border border-white/20">
          ✓ CONDUCIENDO
        </div>
      ) : owned ? (
        <button
          onClick={() => onSelect(vehicle.id)}
          className="buy-btn-glossy mt-2.5 w-full py-2.5 rounded-xl font-black text-sm tracking-wide"
        >
          CONDUCIR
        </button>
      ) : (
        <button
          onClick={(e) => onBuy(vehicle.id, e.currentTarget as HTMLElement)}
          disabled={!canAfford}
          className={cn(
            'buy-btn-glossy mt-2.5 w-full py-2.5 rounded-xl font-black text-sm tracking-wide',
            !canAfford && 'buy-btn-glossy--disabled'
          )}
        >
          COMPRAR · 🎟️ {cost.toLocaleString('es-CO')}
        </button>
      )}
    </div>
  );
}
