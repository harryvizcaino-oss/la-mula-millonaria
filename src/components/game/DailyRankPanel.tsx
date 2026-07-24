import { motion, AnimatePresence } from 'framer-motion';
import { X, Crown, Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useDailyRank } from '@/hooks/useDailyRank';
import { useAuth } from '@/hooks/useAuth';
import { useClickerStore } from '@/store/clickerStore';

function formatNumber(n: number): string {
  if (n < 1000) return n.toLocaleString('es-CO', { maximumFractionDigits: 2 });
  if (n < 1_000_000) return `${(n / 1000).toFixed(n < 10_000 ? 1 : 0)}K`;
  if (n < 1_000_000_000) return `${(n / 1_000_000).toFixed(n < 10_000_000 ? 2 : 1)}M`;
  if (n < 1_000_000_000_000) return `${(n / 1_000_000_000).toFixed(2)}B`;
  return `${(n / 1_000_000_000_000).toFixed(2)}T`;
}

function RankRow({
  entry,
  rank,
  isCurrentUser,
}: {
  entry: { user_id: string; username: string | null; avatar_url: string | null; cps_day: number };
  rank: number;
  isCurrentUser: boolean;
}) {
  const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : null;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: rank * 0.05 }}
      className={cn(
        'flex items-center gap-3 px-4 py-3 rounded-2xl border',
        isCurrentUser
          ? 'bg-[#F59E0B]/15 border-[#F59E0B]/50 shadow-[0_0_20px_rgba(245,158,11,0.15)]'
          : 'bg-white/5 border-white/10'
      )}
    >
      <div className="w-8 text-center flex-shrink-0">
        {medal ? (
          <span className="text-xl">{medal}</span>
        ) : (
          <span className={cn('text-sm font-black', isCurrentUser ? 'text-[#F59E0B]' : 'text-slate-400')}>
            #{rank}
          </span>
        )}
      </div>
      <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 bg-white/10 border-2 border-white/20">
        <img
          src={entry.avatar_url ?? `https://api.dicebear.com/7.x/avataaars/svg?seed=${entry.user_id}`}
          alt={entry.username ?? 'Jugador'}
          className="w-full h-full object-cover"
        />
      </div>
      <div className="flex-1 min-w-0">
        <p className={cn('text-sm font-bold truncate', isCurrentUser ? 'text-[#F59E0B]' : 'text-white')}>
          {isCurrentUser ? 'Tú' : (entry.username ?? 'Jugador')}
        </p>
        <p className="text-[10px] text-slate-500">CPS hoy</p>
      </div>
      <p className={cn('text-sm font-black flex-shrink-0', isCurrentUser ? 'text-[#F59E0B]' : 'text-white')}>
        {formatNumber(entry.cps_day)}
      </p>
    </motion.div>
  );
}

interface DailyRankPanelProps {
  open: boolean;
  onClose: () => void;
}

export function DailyRankPanel({ open, onClose }: DailyRankPanelProps) {
  const { user } = useAuth();
  const { top, myRank, totalPlayers, loading } = useDailyRank(user?.id);
  const cpsTotal = useClickerStore((s) => s.cpsTotal);

  // Mezclar mi posición si no estoy en el top 10
  const entries = [...top];
  const meInTop = user && entries.some((e) => e.user_id === user.id);
  if (user && !meInTop && myRank !== null) {
    // Mostrar al usuario después del top 10 si no está incluido
    entries.push({
      user_id: user.id,
      username: user.name ?? 'Tú',
      avatar_url: user.avatar,
      cps_day: cpsTotal, // fallback local si aún no hay sync
    });
  }

  return (
    <AnimatePresence>
      {open && (
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
            transition={{ type: 'tween', duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="fixed bottom-0 left-0 right-0 z-50 bg-[#0D0E14] rounded-t-3xl max-h-[75vh] overflow-y-auto border-t-2 border-[#F59E0B]/40"
          >
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-white/20" />
            </div>

            <div className="flex items-center justify-between px-5 py-3">
              <div className="flex items-center gap-2">
                <Trophy size={20} className="text-[#F59E0B]" />
                <h3 className="font-fredoka font-bold text-lg text-white">Ranking Diario Mundial</h3>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
                  </span>
                  <span className="text-[10px] font-black text-red-400 uppercase tracking-wider">Live</span>
                </div>
                <button
                  onClick={onClose}
                  className="p-1 rounded-full hover:bg-white/10 transition-colors"
                >
                  <X size={20} className="text-slate-400" />
                </button>
              </div>
            </div>

            {/* Tu posición destacada */}
            <div className="mx-5 mb-4 rounded-2xl bg-gradient-to-r from-[#1A1B26] to-[#0D0E14] border-2 border-[#F59E0B]/30 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full border-2 border-[#F59E0B] overflow-hidden bg-white/10">
                    <img
                      src={user?.avatar ?? `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.id ?? 'guest'}`}
                      alt="Tú"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <p className="text-white text-sm font-bold">Tu posición</p>
                    <p className="text-slate-500 text-[10px]">
                      {totalPlayers > 0 ? `de ${totalPlayers.toLocaleString('es-CO')} jugadores` : 'Sé el primero hoy'}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-fredoka font-black text-2xl text-[#F59E0B]">
                    {myRank !== null ? `#${myRank}` : '—'}
                  </p>
                  <p className="text-[10px] text-slate-500">
                    {formatNumber(cpsTotal)} CPS hoy
                  </p>
                </div>
              </div>
            </div>

            <div className="px-5 pb-8 space-y-2">
              {loading ? (
                <div className="py-8 text-center text-slate-500 text-sm">
                  Cargando ranking mundial...
                </div>
              ) : entries.length === 0 ? (
                <div className="py-8 text-center">
                  <Crown size={32} className="mx-auto text-[#F59E0B] mb-2" />
                  <p className="text-slate-500 text-sm">Aún no hay jugadores hoy.</p>
                  <p className="text-slate-600 text-xs">¡Sé el primero en ganar CPS!</p>
                </div>
              ) : (
                entries.map((entry, i) => (
                  <RankRow
                    key={entry.user_id}
                    entry={entry}
                    rank={i + 1}
                    isCurrentUser={entry.user_id === user?.id}
                  />
                ))
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
