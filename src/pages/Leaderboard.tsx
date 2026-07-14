import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Crown,
  ChevronUp,
  ChevronDown,
  Minus,
  Users,
  Share2,
  Award,
  Medal,
  Sparkles,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { mockPlayers, mockCurrentUser, mockFriends, weeklyPrizes } from '@/data/mockLeaderboard';
import type { Player } from '@/data/mockLeaderboard';

type TimeFilter = 'Semanal' | 'Mensual' | 'Global';
type CategoryFilter = 'Puntaje' | 'TicaMillas' | 'Distancia';
type ScopeFilter = 'Global' | 'Amigos';

const timeFilters: TimeFilter[] = ['Semanal', 'Mensual', 'Global'];
const categoryFilters: CategoryFilter[] = ['Puntaje', 'TicaMillas', 'Distancia'];

const getCategoryValue = (player: Player, category: CategoryFilter): number => {
  switch (category) {
    case 'Puntaje': return player.score;
    case 'TicaMillas': return player.millas;
    case 'Distancia': return player.distance;
    default: return player.score;
  }
};

const formatNumber = (num: number): string => {
  return num.toLocaleString('es-CO');
};

/* ------------------------------------------------------------------ */
/*  Animated Sparkle (isolated, memoized)                              */
/* ------------------------------------------------------------------ */
const Sparkle = ({ delay = 0 }: { delay?: number }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0 }}
    animate={{
      opacity: [0, 1, 0],
      scale: [0, 1, 0],
      y: [0, -20, -40],
      x: [0, Math.random() * 20 - 10, Math.random() * 30 - 15],
    }}
    transition={{
      duration: 2,
      repeat: Infinity,
      delay,
      ease: 'easeInOut',
    }}
    className="absolute"
  >
    <Sparkles size={12} className="text-[#FBBF24]" />
  </motion.div>
);

/* ------------------------------------------------------------------ */
/*  Podium Component                                                   */
/* ------------------------------------------------------------------ */
function Podium({ players }: { players: Player[] }) {
  const top3 = players.slice(0, 3);
  const [second, first, third] = [top3[1], top3[0], top3[2]];

  const positions = [
    { player: second, rank: 2, height: 'h-[100px]', width: 'w-20', avatarSize: 'w-12 h-12', borderColor: 'border-[#C0C0C0]', badge: '/badge-silver.png', offset: 'translate-y-0' },
    { player: first, rank: 1, height: 'h-[130px]', width: 'w-24', avatarSize: 'w-16 h-16', borderColor: 'border-[#FFD700]', badge: '/badge-gold.png', offset: '-translate-y-5' },
    { player: third, rank: 3, height: 'h-[80px]', width: 'w-20', avatarSize: 'w-12 h-12', borderColor: 'border-[#CD7F32]', badge: '/badge-bronze.png', offset: 'translate-y-5' },
  ];

  return (
    <div className="flex items-end justify-center gap-3 pt-6 pb-4 px-4">
      {positions.map((pos, i) => (
        <motion.div
          key={pos.rank}
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            delay: i * 0.15,
            duration: 0.5,
            type: 'spring',
            stiffness: 200,
            damping: 15,
          }}
          className={cn('flex flex-col items-center', pos.offset)}
        >
          {/* Avatar */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: i * 0.15 + 0.2, type: 'spring', stiffness: 200 }}
            className="relative mb-2"
          >
            {pos.rank === 1 && (
              <motion.div
                animate={{ y: [0, -3, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute -top-5 left-1/2 -translate-x-1/2 z-10"
              >
                <Crown size={16} className="text-[#F59E0B] fill-[#F59E0B]" />
              </motion.div>
            )}
            <div className={cn('rounded-full border-[3px] overflow-hidden relative', pos.avatarSize, pos.borderColor)}>
              <img src={pos.player.avatar} alt={pos.player.name} className="w-full h-full object-cover" />
              <img
                src={pos.badge}
                alt={`Rank ${pos.rank}`}
                className={cn(
                  'absolute -bottom-1 -right-1',
                  pos.rank === 1 ? 'w-8 h-8' : 'w-7 h-7'
                )}
              />
            </div>
            {/* Sparkles on gold */}
            {pos.rank === 1 && (
              <>
                <div className="absolute -top-2 -left-3"><Sparkle delay={0} /></div>
                <div className="absolute -top-1 -right-3"><Sparkle delay={0.6} /></div>
                <div className="absolute top-2 -left-4"><Sparkle delay={1.2} /></div>
              </>
            )}
          </motion.div>

          {/* Name */}
          <span className="text-xs font-bold text-slate-900 truncate max-w-[72px] text-center">
            {pos.player.name}
          </span>

          {/* Score */}
          <span className={cn(
            'font-bold',
            pos.rank === 1 ? 'text-sm text-[#F59E0B]' : 'text-xs text-slate-500'
          )}>
            {formatNumber(getCategoryValue(pos.player, 'Puntaje'))}
          </span>

          {/* Platform */}
          <motion.div
            initial={{ scaleY: 0 }}
            animate={{ scaleY: 1 }}
            transition={{ delay: i * 0.15 + 0.1, duration: 0.4, type: 'spring' }}
            style={{ originY: 1 }}
            className={cn(
              'mt-2 rounded-t-xl flex items-end justify-center pb-2',
              pos.height,
              pos.width,
              pos.rank === 1
                ? 'bg-gradient-to-t from-[#D97706] to-[#F59E0B] shadow-[0_0_20px_rgba(245,158,11,0.3)]'
                : 'bg-white'
            )}
          >
            <span className="font-fredoka font-bold text-2xl text-slate-900/20">
              {pos.rank}
            </span>
          </motion.div>
        </motion.div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Your Rank Card                                                     */
/* ------------------------------------------------------------------ */
function YourRankCard({ category }: { category: CategoryFilter }) {
  const progressPercent = 65;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.5 }}
      className={cn(
        'mx-4 p-4 rounded-2xl border-2 border-[#F59E0B]/30',
        'bg-gradient-to-r from-[#1A1B26] via-[#1e1f2d] to-[#1A1B26]'
      )}
    >
      <div className="flex items-center gap-3">
        {/* Rank */}
        <div className="flex flex-col items-center min-w-[60px]">
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="font-fredoka font-bold text-2xl text-[#F59E0B]"
          >
            #{mockCurrentUser.rank}
          </motion.span>
          <span className="text-[10px] text-slate-500">de 12,847</span>
        </div>

        {/* Avatar */}
        <div className="w-11 h-11 rounded-full border-2 border-[#F59E0B] overflow-hidden flex-shrink-0">
          <img src={mockCurrentUser.avatar} alt="Tu" className="w-full h-full object-cover" />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-slate-900">Tu</p>
          <p className="text-xs text-slate-500">
            {formatNumber(getCategoryValue(mockCurrentUser, category))} {category.toLowerCase()}
          </p>
        </div>

        {/* Trend */}
        <div className="flex flex-col items-end">
          {mockCurrentUser.trend === 'up' ? (
            <div className="flex items-center gap-0.5 text-[#10B981]">
              <ChevronUp size={14} />
              <span className="text-xs font-bold">+{mockCurrentUser.trendValue}</span>
            </div>
          ) : mockCurrentUser.trend === 'down' ? (
            <div className="flex items-center gap-0.5 text-[#EF4444]">
              <ChevronDown size={14} />
              <span className="text-xs font-bold">-{mockCurrentUser.trendValue}</span>
            </div>
          ) : (
            <div className="flex items-center gap-0.5 text-slate-500">
              <Minus size={14} />
              <span className="text-xs font-bold">0</span>
            </div>
          )}
        </div>
      </div>

      {/* Progress bar */}
      <div className="mt-3">
        <div className="flex justify-between text-[10px] text-slate-500 mb-1">
          <span>2,100 pts para #{mockCurrentUser.rank - 1}</span>
          <span>{progressPercent}%</span>
        </div>
        <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="h-full bg-gradient-to-r from-[#F59E0B] to-[#FBBF24] rounded-full"
          />
        </div>
      </div>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  Rank Row                                                           */
/* ------------------------------------------------------------------ */
function RankRow({
  player,
  rank,
  category,
  isCurrentUser,
}: {
  player: Player;
  rank: number;
  category: CategoryFilter;
  isCurrentUser?: boolean;
}) {
  const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: rank < 10 ? rank * 0.04 : 0.02 * (rank - 10) }}
      className={cn(
        'flex items-center gap-3 px-4 py-3 border-b border-slate-200',
        isCurrentUser && 'bg-[#F59E0B]/8 border-l-[3px] border-l-[#F59E0B] rounded-lg border-b-0 mx-2 my-1'
      )}
    >
      {/* Rank */}
      <div className="w-8 text-center flex-shrink-0">
        {medal ? (
          <span className="text-lg">{medal}</span>
        ) : (
          <span className="text-sm font-bold text-slate-500">#{rank}</span>
        )}
      </div>

      {/* Avatar */}
      <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 bg-slate-100">
        <img src={player.avatar} alt={player.name} className="w-full h-full object-cover" />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className={cn('text-sm font-bold truncate', isCurrentUser ? 'text-[#F59E0B]' : 'text-slate-900')}>
          {player.name}
        </p>
        <p className="text-xs text-slate-500">Nivel {player.level}</p>
      </div>

      {/* Score */}
      <div className="text-right flex-shrink-0">
        <p className="text-sm font-bold text-slate-900">
          {formatNumber(getCategoryValue(player, category))}
        </p>
        <div className="flex items-center justify-end gap-0.5">
          {player.trend === 'up' ? (
            <TrendingUp size={10} className="text-[#10B981]" />
          ) : player.trend === 'down' ? (
            <TrendingDown size={10} className="text-[#EF4444]" />
          ) : null}
          <span className={cn(
            'text-[10px] font-medium',
            player.trend === 'up' ? 'text-[#10B981]' : player.trend === 'down' ? 'text-[#EF4444]' : 'text-slate-500'
          )}>
            {player.trend === 'same' ? '-' : `${player.trend === 'up' ? '+' : '-'}${player.trendValue}`}
          </span>
        </div>
      </div>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  Friends Section                                                    */
/* ------------------------------------------------------------------ */
function FriendsSection({ category }: { category: CategoryFilter }) {
  const [activeSubTab, setActiveSubTab] = useState<'Ranking' | 'Lista'>('Ranking');
  const sortedFriends = useMemo(() => {
    return [...mockFriends].sort((a, b) => getCategoryValue(b, category) - getCategoryValue(a, category));
  }, [category]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.6 }}
      className="mt-6 mx-4 bg-white rounded-t-2xl rounded-b-2xl p-4"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-fredoka font-bold text-xl text-slate-900">Amigos</h2>
        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[#F59E0B] text-[#F59E0B] text-xs font-bold hover:bg-[#F59E0B]/10 transition-colors">
          <Share2 size={12} />
          Invitar
        </button>
      </div>

      {/* Sub tabs */}
      <div className="flex gap-2 mb-4">
        {(['Ranking', 'Lista'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveSubTab(tab)}
            className={cn(
              'px-4 py-1.5 rounded-full text-xs font-bold transition-all duration-200',
              activeSubTab === tab
                ? 'bg-[#F59E0B] text-white'
                : 'bg-slate-100 text-slate-500 hover:text-slate-900'
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {activeSubTab === 'Ranking' ? (
          <motion.div
            key="ranking"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {sortedFriends.map((friend, i) => (
              <RankRow
                key={friend.id}
                player={friend}
                rank={i + 1}
                category={category}
                isCurrentUser={friend.id === 999}
              />
            ))}
          </motion.div>
        ) : (
          <motion.div
            key="lista"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="space-y-2"
          >
            {sortedFriends.map((friend) => (
              <div
                key={friend.id}
                className="flex items-center gap-3 p-3 bg-slate-100 rounded-xl"
              >
                <div className="relative">
                  <div className="w-12 h-12 rounded-full overflow-hidden bg-white">
                    <img src={friend.avatar} alt={friend.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="absolute bottom-0 right-0 w-3 h-3 bg-[#10B981] rounded-full border-2 border-[#232433]" />
                </div>
                <div className="flex-1">
                  <p className={cn('text-sm font-bold', friend.id === 999 ? 'text-[#F59E0B]' : 'text-slate-900')}>
                    {friend.name}
                  </p>
                  <p className="text-xs text-slate-500">Online</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-slate-900">
                    {formatNumber(getCategoryValue(friend, category))}
                  </p>
                  <p className="text-[10px] text-slate-500">pts</p>
                </div>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Invite Card */}
      <div className="mt-4 p-4 border-2 border-dashed border-[#F59E0B]/50 rounded-xl text-center">
        <Users size={28} className="mx-auto text-[#F59E0B] mb-2" />
        <p className="text-sm text-slate-500 mb-3">
          Invita amigos y gana <span className="text-[#F59E0B] font-bold">500 TicaMillas</span> por cada uno que se una!
        </p>
        <button className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#F59E0B] to-[#FBBF24] text-white text-sm font-bold hover:shadow-lg hover:shadow-[#F59E0B]/20 transition-shadow">
          Compartir enlace
        </button>
        <p className="mt-2 text-[10px] font-mono text-[#F59E0B]">
          Tu codigo: TS-ANA23
        </p>
      </div>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  Prize Cards                                                        */
/* ------------------------------------------------------------------ */
function PrizeCards() {
  const icons = [
    <Crown key="c" size={28} className="text-slate-900" />,
    <Medal key="m" size={28} className="text-slate-900" />,
    <Award key="a" size={28} className="text-slate-900" />,
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.7 }}
      className="mt-6 px-4 pb-8"
    >
      <h2 className="font-fredoka font-bold text-xl text-slate-900 mb-4">Premios esta semana</h2>
      <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 snap-x snap-mandatory">
        {weeklyPrizes.map((prize, i) => (
          <motion.div
            key={prize.rank}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.8 + i * 0.1, duration: 0.4 }}
            className={cn(
              'flex-shrink-0 w-[180px] rounded-2xl p-4 snap-start',
              'bg-gradient-to-br',
              prize.color
            )}
          >
            <div className="mb-2">{icons[i]}</div>
            <p className="font-fredoka font-bold text-lg text-slate-900 mb-1">
              {prize.rank}{prize.rank === 1 ? 'er' : prize.rank === 2 ? 'do' : 'er'} Lugar
            </p>
            <p className="text-xs text-slate-800 leading-relaxed">{prize.prize}</p>
          </motion.div>
        ))}
        {/* Top 10 card */}
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 1.1, duration: 0.4 }}
          className="flex-shrink-0 w-[160px] rounded-2xl p-4 bg-white border border-slate-200 snap-start"
        >
          <TrendingUp size={24} className="text-[#F59E0B] mb-2" />
          <p className="font-fredoka font-bold text-base text-slate-900 mb-1">Top 10</p>
          <p className="text-xs text-slate-500">500 TicaMillas bonus</p>
        </motion.div>
      </div>
    </motion.div>
  );
}

/* ================================================================== */
/*  MAIN LEADERBOARD PAGE                                             */
/* ================================================================== */
export default function Leaderboard() {
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('Semanal');
  const [category, setCategory] = useState<CategoryFilter>('Puntaje');
  const [scope, setScope] = useState<ScopeFilter>('Global');

  const sortedPlayers = useMemo(() => {
    return [...mockPlayers].sort((a, b) => getCategoryValue(b, category) - getCategoryValue(a, category));
  }, [category]);

  const displayedPlayers = scope === 'Global' ? sortedPlayers : mockFriends;

  return (
    <div className="min-h-[100dvh] bg-white pt-14 pb-4">
      {/* Time Filter Tabs */}
      <div className="flex justify-center px-4 py-4">
        <div className="flex bg-white rounded-full p-1">
          {timeFilters.map((filter) => (
            <button
              key={filter}
              onClick={() => setTimeFilter(filter)}
              className={cn(
                'relative px-5 py-2 rounded-full text-xs font-bold transition-colors duration-200',
                timeFilter === filter ? 'text-slate-900' : 'text-slate-500 hover:text-slate-600'
              )}
            >
              {timeFilter === filter && (
                <motion.div
                  layoutId="time-filter-pill"
                  className="absolute inset-0 bg-gradient-to-r from-[#F59E0B] to-[#FBBF24] rounded-full"
                  transition={{ type: 'spring', duration: 0.4, stiffness: 300, damping: 25 }}
                />
              )}
              <span className="relative z-10">{filter}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Top 3 Podium */}
      <Podium players={sortedPlayers} />

      {/* Category Tabs */}
      <div className="flex gap-2 px-4 py-3 overflow-x-auto">
        {categoryFilters.map((cat) => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            className={cn(
              'px-4 py-2 rounded-full text-xs font-bold transition-all duration-200 whitespace-nowrap',
              category === cat
                ? 'bg-[#F59E0B] text-white'
                : 'bg-white text-slate-500 hover:text-slate-900'
            )}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Scope Toggle */}
      <div className="flex justify-center gap-2 px-4 py-2">
        {(['Global', 'Amigos'] as ScopeFilter[]).map((s) => (
          <button
            key={s}
            onClick={() => setScope(s)}
            className={cn(
              'px-4 py-1.5 rounded-full text-xs font-bold transition-all duration-200',
              scope === s
                ? 'bg-slate-100 text-[#F59E0B]'
                : 'text-slate-500 hover:text-slate-900'
            )}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Your Rank Card */}
      <div className="mt-4">
        <YourRankCard category={category} />
      </div>

      {/* Rankings List */}
      <div className="mt-4">
        <div className="px-4 mb-2">
          <h2 className="font-fredoka font-bold text-lg text-slate-900">
            {scope === 'Global' ? 'Clasificacion Global' : 'Clasificacion Amigos'}
          </h2>
        </div>
        <AnimatePresence mode="wait">
          <motion.div
            key={`${category}-${scope}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {displayedPlayers.map((player, i) => (
              <RankRow
                key={player.id}
                player={player}
                rank={i + 1}
                category={category}
                isCurrentUser={player.id === 999}
              />
            ))}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Friends Section (only in Global scope) */}
      {scope === 'Global' && <FriendsSection category={category} />}

      {/* Weekly Prizes */}
      <PrizeCards />
    </div>
  );
}
