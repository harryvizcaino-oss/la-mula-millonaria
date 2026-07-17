import { cn } from '@/lib/utils';
import type { FleetVehicle } from '@/data/fleetVehicles';
import { getTruckAsset } from '@/data/truckAssets';
import { shadeHex } from '@/components/game/SponsorPowerCard';

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
 * Tarjeta de vehículo de flota V9 — HORIZONTAL glossy (90px), igual que las
 * power cards (SponsorPowerCard):
 * - LEFT: badge glossy circular 56px con el PNG del camión, color por marca.
 * - CENTER: marca HERO 20px 900 uppercase + modelo 11px gris.
 * - CENTER-BOTTOM: stats "xN" gold + "🎟️ costo" red.
 * - RIGHT: botón glossy circular 48px — verde "+" (comprar), gold "✓"
 *   (owned: tócalo para conducirlo), gris "🔒" (locked: no alcanza).
 * La flota es un MULTIPLICADOR (×) del CPS y se compra con Golden Tickets 🎟️.
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
  const locked = !owned && !canAfford;

  return (
    <div
      className={cn(
        'sponsor-card-v8 relative overflow-hidden',
        !owned && canAfford && 'affordable-glow',
        selected && 'fleet-card-v8--selected'
      )}
      style={{
        ['--product-color' as string]: vehicle.color,
        ['--product-color-light' as string]: shadeHex(vehicle.color, 0.45),
        ['--product-color-dark' as string]: shadeHex(vehicle.color, -0.35),
      }}
    >
      {/* 1) Badge glossy circular 56px con el camión de la marca */}
      <div className="sponsor-v8-badge">
        <img
          src={getTruckAsset(vehicle.id)}
          alt={`${vehicle.brand} ${vehicle.model}`}
          className="fleet-v8-truck"
          draggable={false}
        />
      </div>

      {/* 2-3) Marca HERO + modelo + stats */}
      <div className="sponsor-v8-center">
        <h3 className="fleet-v8-brand">{vehicle.brand}</h3>
        <p className="fleet-v8-model">
          {vehicle.model} · {vehicle.country}
        </p>
        <div className="fleet-v8-stats">
          <span className="fleet-v8-mult">x{vehicle.multiplier}</span>
          {owned ? (
            selected && <span className="fleet-v8-driving">Conduciendo</span>
          ) : (
            <span className="fleet-v8-cost">🎟️ {cost.toLocaleString('es-CO')}</span>
          )}
        </div>
      </div>

      {/* 4) Botón glossy circular 48px: verde + / gold ✓ / gris 🔒 */}
      {owned ? (
        <button
          onClick={() => onSelect(vehicle.id)}
          className="buy-btn-circle buy-btn-circle--v8 buy-btn-circle--gold"
          aria-label={selected ? `Conduciendo ${vehicle.brand}` : `Conducir ${vehicle.brand}`}
          title={selected ? 'Conduciendo' : 'Conducir'}
        >
          ✓
        </button>
      ) : (
        <button
          onClick={(e) => onBuy(vehicle.id, e.currentTarget as HTMLElement)}
          disabled={locked}
          className="buy-btn-circle buy-btn-circle--v8"
          aria-label={
            locked
              ? `${vehicle.brand} bloqueado: faltan Golden Tickets`
              : `Comprar ${vehicle.brand} por ${cost} Golden Tickets`
          }
          title={
            locked
              ? `Te faltan tickets · 🎟️ ${cost.toLocaleString('es-CO')}`
              : `Comprar · 🎟️ ${cost.toLocaleString('es-CO')}`
          }
        >
          {locked ? '🔒' : '+'}
        </button>
      )}
    </div>
  );
}
