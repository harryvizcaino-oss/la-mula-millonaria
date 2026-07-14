import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Coins, Lock, Check, Wrench } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useMillas } from '@/providers/MillasProvider';
import { useVehicles } from '@/hooks/useVehicles';
import { VEHICLES, type VehicleConfig } from '@/data/vehicles';

function formatMillas(n: number): string {
  return n.toLocaleString('es-CO');
}

function VehiclePreview({ vehicle }: { vehicle: VehicleConfig }) {
  const v = vehicle;
  return (
    <svg viewBox="0 0 200 240" className="w-full h-full drop-shadow-2xl">
      <defs>
        <linearGradient id={`bodyGrad-${v.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={v.bodyColor} />
          <stop offset="100%" stopColor={v.bodyDarkColor} />
        </linearGradient>
        <linearGradient id={`windowGrad-${v.id}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={v.windowColor} />
          <stop offset="100%" stopColor="#1E3A8A" />
        </linearGradient>
      </defs>

      {/* Shadow */}
      <ellipse cx="100" cy="215" rx="75" ry="12" fill="rgba(0,0,0,0.45)" />

      {v.shape === 'tractor' && (
        <>
          {/* Trailer */}
          <rect x="75" y="55" width="110" height="130" rx="8" fill={`url(#bodyGrad-${v.id})`} />
          <rect x="85" y="95" width="90" height="18" rx="2" fill={v.stripeColor} />
          {/* Cabin */}
          <rect x="25" y="115" width="70" height="70" rx="6" fill={v.cabinColor} />
          <rect x="35" y="125" width="45" height="35" rx="4" fill={`url(#windowGrad-${v.id})`} />
          <rect x="85" y="145" width="18" height="14" rx="2" fill="#4B5563" />
          {/* Headlights */}
          <ellipse cx="32" cy="175" rx="7" ry="5" fill={v.lightColor} />
          <ellipse cx="72" cy="175" rx="7" ry="5" fill={v.lightColor} />
          {/* Wheels */}
          <circle cx="55" cy="200" r="16" fill={v.wheelColor} />
          <circle cx="55" cy="200" r="9" fill={v.rimColor} />
          <circle cx="140" cy="200" r="16" fill={v.wheelColor} />
          <circle cx="140" cy="200" r="9" fill={v.rimColor} />
          <circle cx="170" cy="200" r="13" fill={v.wheelColor} />
          <circle cx="170" cy="200" r="7" fill={v.rimColor} />
          {/* Taillights */}
          <rect x="155" y="60" width="20" height="10" rx="2" fill="#EF4444" />
          <rect x="85" y="60" width="20" height="10" rx="2" fill="#EF4444" />
        </>
      )}

      {v.shape === 'van' && (
        <>
          <rect x="30" y="55" width="140" height="140" rx="10" fill={`url(#bodyGrad-${v.id})`} />
          <rect x="30" y="95" width="140" height="14" rx="2" fill={v.stripeColor} />
          <rect x="30" y="150" width="140" height="14" rx="2" fill={v.stripeColor} />
          <rect x="45" y="65" width="110" height="35" rx="4" fill={`url(#windowGrad-${v.id})`} />
          <rect x="115" y="120" width="35" height="35" rx="4" fill={`url(#windowGrad-${v.id})`} />
          <ellipse cx="45" cy="180" rx="7" ry="5" fill={v.lightColor} />
          <ellipse cx="155" cy="180" rx="7" ry="5" fill={v.lightColor} />
          <circle cx="60" cy="200" r="16" fill={v.wheelColor} />
          <circle cx="60" cy="200" r="9" fill={v.rimColor} />
          <circle cx="140" cy="200" r="16" fill={v.wheelColor} />
          <circle cx="140" cy="200" r="9" fill={v.rimColor} />
          <rect x="35" y="60" width="18" height="10" rx="2" fill="#EF4444" />
          <rect x="147" y="60" width="18" height="10" rx="2" fill="#EF4444" />
        </>
      )}

      {v.shape === 'tanker' && (
        <>
          <rect x="25" y="110" width="75" height="75" rx="6" fill={v.cabinColor} />
          <rect x="35" y="120" width="50" height="35" rx="4" fill={`url(#windowGrad-${v.id})`} />
          <rect x="90" y="45" width="100" height="140" rx="55" fill={`url(#bodyGrad-${v.id})`} />
          <rect x="95" y="95" width="90" height="8" rx="2" fill={v.stripeColor} />
          <rect x="95" y="145" width="90" height="8" rx="2" fill={v.stripeColor} />
          <ellipse cx="35" cy="175" rx="7" ry="5" fill={v.lightColor} />
          <circle cx="55" cy="200" r="15" fill={v.wheelColor} />
          <circle cx="55" cy="200" r="8" fill={v.rimColor} />
          <circle cx="145" cy="200" r="15" fill={v.wheelColor} />
          <circle cx="145" cy="200" r="8" fill={v.rimColor} />
          <circle cx="115" cy="200" r="12" fill={v.wheelColor} />
          <circle cx="115" cy="200" r="7" fill={v.rimColor} />
          <rect x="135" y="55" width="18" height="10" rx="2" fill="#EF4444" />
          <rect x="165" y="55" width="18" height="10" rx="2" fill="#EF4444" />
        </>
      )}

      {v.shape === 'bus' && (
        <>
          <rect x="20" y="50" width="160" height="150" rx="10" fill={`url(#bodyGrad-${v.id})`} />
          <rect x="20" y="125" width="160" height="18" rx="2" fill={v.stripeColor} />
          <rect x="30" y="65" width="140" height="40" rx="4" fill={`url(#windowGrad-${v.id})`} />
          <rect x="30" y="100" width="30" height="30" rx="3" fill={`url(#windowGrad-${v.id})`} />
          <rect x="70" y="100" width="30" height="30" rx="3" fill={`url(#windowGrad-${v.id})`} />
          <rect x="110" y="100" width="30" height="30" rx="3" fill={`url(#windowGrad-${v.id})`} />
          <rect x="150" y="100" width="20" height="30" rx="3" fill={`url(#windowGrad-${v.id})`} />
          <ellipse cx="35" cy="185" rx="8" ry="6" fill={v.lightColor} />
          <ellipse cx="165" cy="185" rx="8" ry="6" fill={v.lightColor} />
          <circle cx="55" cy="205" r="16" fill={v.wheelColor} />
          <circle cx="55" cy="205" r="9" fill={v.rimColor} />
          <circle cx="145" cy="205" r="16" fill={v.wheelColor} />
          <circle cx="145" cy="205" r="9" fill={v.rimColor} />
          <circle cx="100" cy="205" r="14" fill={v.wheelColor} />
          <circle cx="100" cy="205" r="8" fill={v.rimColor} />
          <rect x="25" y="55" width="18" height="10" rx="2" fill="#EF4444" />
          <rect x="155" y="55" width="18" height="10" rx="2" fill="#EF4444" />
        </>
      )}

      {v.shape === 'suv' && (
        <>
          <rect x="35" y="120" width="130" height="75" rx="8" fill={`url(#bodyGrad-${v.id})`} />
          <rect x="55" y="65" width="100" height="65" rx="6" fill={v.cabinColor} />
          <rect x="40" y="110" width="45" height="35" rx="4" fill={`url(#windowGrad-${v.id})`} />
          <rect x="95" y="110" width="45" height="35" rx="4" fill={`url(#windowGrad-${v.id})`} />
          <rect x="25" y="180" width="25" height="12" rx="3" fill="#374151" />
          <rect x="150" y="180" width="25" height="12" rx="3" fill="#374151" />
          <ellipse cx="45" cy="170" rx="8" ry="6" fill={v.lightColor} />
          <ellipse cx="155" cy="170" rx="8" ry="6" fill={v.lightColor} />
          <circle cx="60" cy="200" r="18" fill={v.wheelColor} />
          <circle cx="60" cy="200" r="10" fill={v.rimColor} />
          <circle cx="140" cy="200" r="18" fill={v.wheelColor} />
          <circle cx="140" cy="200" r="10" fill={v.rimColor} />
          <rect x="35" y="125" width="14" height="10" rx="2" fill="#EF4444" />
          <rect x="151" y="125" width="14" height="10" rx="2" fill="#EF4444" />
        </>
      )}

      {v.shape === 'motorcycle' && (
        <>
          <rect x="70" y="110" width="60" height="40" rx="6" fill={`url(#bodyGrad-${v.id})`} />
          <rect x="85" y="95" width="40" height="18" rx="4" fill="#1F2937" />
          <path d="M125 105 L155 75 L140 75 Z" fill={v.windowColor} />
          <line x1="125" y1="105" x2="155" y2="80" stroke="#4B5563" strokeWidth="4" strokeLinecap="round" />
          <ellipse cx="135" cy="115" rx="6" ry="5" fill={v.lightColor} />
          <circle cx="60" cy="190" r="22" fill={v.wheelColor} />
          <circle cx="60" cy="190" r="12" fill={v.rimColor} />
          <circle cx="140" cy="190" r="22" fill={v.wheelColor} />
          <circle cx="140" cy="190" r="12" fill={v.rimColor} />
          <circle cx="100" cy="75" r="18" fill="#1F2937" />
          <circle cx="105" cy="75" r="10" fill={v.windowColor} />
        </>
      )}
    </svg>
  );
}

export default function Garage() {
  const navigate = useNavigate();
  const { millas, addMillas } = useMillas();
  const { selectedVehicle, unlockedIds, selectVehicle, unlockVehicle } = useVehicles(millas);

  const handleBuy = (vehicle: VehicleConfig) => {
    if (millas < vehicle.price) return;
    addMillas(-vehicle.price);
    unlockVehicle(vehicle.id);
    selectVehicle(vehicle.id);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-slate-900 pb-24 relative overflow-hidden">
      {/* Workshop background */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0f] via-[#11121c] to-[#0a0a0f]" />
        {/* Neon light strips */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#F59E0B] to-transparent opacity-60" />
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#3B82F6] to-transparent opacity-60" />
        <div className="absolute top-1/4 left-0 w-1 h-64 bg-gradient-to-b from-transparent via-[#EF4444] to-transparent opacity-40" />
        <div className="absolute top-1/3 right-0 w-1 h-80 bg-gradient-to-b from-transparent via-[#22C55E] to-transparent opacity-40" />
        {/* Floor grid glow */}
        <div
          className="absolute bottom-0 left-0 right-0 h-1/3 opacity-10"
          style={{
            backgroundImage:
              'linear-gradient(0deg, transparent 24%, rgba(245,158,11,0.3) 25%, rgba(245,158,11,0.3) 26%, transparent 27%, transparent 74%, rgba(245,158,11,0.3) 75%, rgba(245,158,11,0.3) 76%, transparent 77%), linear-gradient(90deg, transparent 24%, rgba(245,158,11,0.3) 25%, rgba(245,158,11,0.3) 26%, transparent 27%, transparent 74%, rgba(245,158,11,0.3) 75%, rgba(245,158,11,0.3) 76%, transparent 77%)',
            backgroundSize: '60px 60px',
          }}
        />
      </div>

      {/* Header */}
      <div className="sticky top-0 z-30 bg-[#0a0a0f]/80 backdrop-blur-md border-b border-white/10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft size={20} />
            <span className="text-sm font-medium">Volver</span>
          </button>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/50 border border-[#F59E0B]/30">
              <Wrench size={14} className="text-slate-500" />
              <span className="text-slate-500 text-xs">Taller</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-black/60 border border-[#F59E0B]/30">
              <Coins size={16} className="text-[#F59E0B]" />
              <span className="font-bold text-[#F59E0B]">{formatMillas(millas)}</span>
              <span className="text-slate-500 text-xs">TicaMillas</span>
            </div>
          </div>
        </div>
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 pt-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <h1 className="font-fredoka text-4xl sm:text-5xl font-bold text-slate-900 mb-2">
            Garaje de Automotores
          </h1>
          <p className="text-slate-500 max-w-md mx-auto">
            Gasta tus TicaMillas en desbloquear el vehículo que mejor se adapte a tu ruta.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {VEHICLES.map((vehicle, index) => {
            const isUnlocked = unlockedIds.includes(vehicle.id);
            const isSelected = selectedVehicle.id === vehicle.id;
            const canBuy = millas >= vehicle.price;
            const missing = Math.max(0, vehicle.price - millas);

            return (
              <motion.div
                key={vehicle.id}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.08 }}
                className={cn(
                  'relative rounded-2xl border bg-[#13141f]/90 overflow-hidden transition-all backdrop-blur-sm',
                  isSelected ? 'border-[#F59E0B] shadow-[0_0_24px_rgba(245,158,11,0.25)]' : 'border-white/10 hover:border-white/20'
                )}
              >
                {isSelected && (
                  <div className="absolute top-3 left-3 z-10 flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#F59E0B] text-[#0a0a0f] text-[10px] font-bold shadow-lg">
                    <Check size={10} />
                    EN USO
                  </div>
                )}

                <div className="h-52 p-5 bg-gradient-to-b from-[#1E293B]/60 to-[#0F172A]/60 flex items-center justify-center">
                  <div className="h-44 w-44">
                    <VehiclePreview vehicle={vehicle} />
                  </div>
                </div>

                <div className="p-5">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-fredoka text-xl font-bold text-slate-900 leading-tight">
                      {vehicle.emoji} {vehicle.name}
                    </h3>
                  </div>
                  <p className="text-slate-500 text-sm mt-2 min-h-[2.5rem]">{vehicle.description}</p>

                  <div className="mt-4 flex items-center gap-2 text-[#F59E0B]">
                    <Coins size={16} />
                    <span className="font-bold text-lg">
                      {vehicle.price === 0 ? 'GRATIS' : formatMillas(vehicle.price)}
                    </span>
                  </div>

                  <button
                    onClick={() => {
                      if (isUnlocked) {
                        selectVehicle(vehicle.id);
                      } else {
                        handleBuy(vehicle);
                      }
                    }}
                    disabled={isSelected || (!isUnlocked && !canBuy)}
                    className={cn(
                      'mt-4 w-full py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2',
                      isSelected
                        ? 'bg-slate-100 text-slate-500 cursor-default'
                        : isUnlocked
                        ? 'bg-[#F59E0B] text-[#0a0a0f] hover:bg-[#FBBF24] active:scale-95 shadow-lg shadow-[#F59E0B]/20'
                        : canBuy
                        ? 'bg-[#22C55E] text-slate-900 hover:bg-[#16A34A] active:scale-95 shadow-lg shadow-[#22C55E]/20'
                        : 'bg-[#334155] text-slate-500 cursor-not-allowed'
                    )}
                  >
                    {isSelected ? (
                      'EN USO'
                    ) : isUnlocked ? (
                      <>
                        <Check size={16} />
                        USAR
                      </>
                    ) : canBuy ? (
                      'COMPRAR'
                    ) : (
                      <>
                        <Lock size={14} />
                        FALTAN {formatMillas(missing)}
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
