import { useEffect, useMemo, useState } from 'react';
import { useDailyStore, DAILY_REWARDS } from '@/store/dailyStore';
import { cn } from '@/lib/utils';

function dayKey(d: Date = new Date()): string {
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

interface DailyStreakProps {
  onClaim?: (reward: number, day: number) => void;
}

export function DailyStreak({ onClaim }: DailyStreakProps) {
  const currentStreak = useDailyStore((s) => s.currentStreak);
  const lastLoginDate = useDailyStore((s) => s.lastLoginDate);
  const claimedDays = useDailyStore((s) => s.claimedDays);
  const brokeAt = useDailyStore((s) => s.brokeAt);
  const claimToday = useDailyStore((s) => s.claimToday);
  const checkStreak = useDailyStore((s) => s.checkStreak);
  const clearBreakFlag = useDailyStore((s) => s.clearBreakFlag);

  const [claiming, setClaiming] = useState(false);
  const [claimFx, setClaimFx] = useState<{ day: number; reward: number } | null>(null);

  useEffect(() => {
    checkStreak();
  }, [checkStreak]);

  // Mensaje de racha perdida: visible 4s
  useEffect(() => {
    if (!brokeAt) return;
    const t = setTimeout(() => clearBreakFlag(), 4000);
    return () => clearTimeout(t);
  }, [brokeAt, clearBreakFlag]);

  const claimedToday = lastLoginDate === dayKey();
  const lastClaimedDay = claimedDays.length ? claimedDays[claimedDays.length - 1] : 0;
  const todayDay = claimedToday ? lastClaimedDay : (lastClaimedDay % 7) + 1;

  const burst = useMemo(
    () =>
      claimFx
        ? Array.from({ length: 14 }, (_, i) => {
            const angle = (i / 14) * Math.PI * 2;
            const dist = 34 + Math.random() * 40;
            return { id: i, dx: Math.cos(angle) * dist, dy: Math.sin(angle) * dist };
          })
        : [],
    [claimFx]
  );

  const handleClaim = () => {
    if (claimedToday || claiming) return;
    setClaiming(true);
    const result = claimToday();
    if (result.success) {
      setClaimFx({ day: result.day, reward: result.reward });
      onClaim?.(result.reward, result.day);
      setTimeout(() => {
        setClaimFx(null);
        setClaiming(false);
      }, 1400);
    } else {
      setClaiming(false);
    }
  };

  return (
    <div
      className={cn(
        'rounded-2xl bg-white border-2 border-slate-200 shadow-sm p-4',
        claimFx && 'streak-calendar-bounce'
      )}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className={brokeAt ? 'streak-flame streak-flame--out text-2xl' : 'streak-flame text-2xl'}>
            🔥
          </span>
          <span
            key={currentStreak}
            className="streak-count-flip font-baloo font-extrabold text-xl bg-gradient-to-r from-[#F97316] to-[#EA580C] bg-clip-text text-transparent"
          >
            {currentStreak} {currentStreak === 1 ? 'día' : 'días'}
          </span>
        </div>
        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
          Racha diaria
        </span>
      </div>

      {brokeAt && (
        <p className="text-slate-500 text-xs font-bold mb-2">Racha perdida... ¡vuelve a empezar!</p>
      )}

      <div className="flex items-center relative">
        {[1, 2, 3, 4, 5, 6, 7].map((day, idx) => {
          const isClaimed = claimedDays.includes(day);
          const isToday = day === todayDay && !claimedToday;
          const isGold = day === 7;
          const isClaimFx = claimFx?.day === day;
          return (
            <div key={day} className="flex items-center flex-1 last:flex-none">
              {idx > 0 && (
                <div className={cn('streak-connector', day <= lastClaimedDay && 'streak-connector--done')} />
              )}
              <button
                onClick={isToday ? handleClaim : undefined}
                disabled={!isToday}
                className={cn(
                  'streak-day',
                  isClaimed && 'streak-day--claimed',
                  isGold && 'streak-day--gold',
                  !isClaimed && !isToday && 'streak-day--future',
                  isToday && 'streak-day--today cursor-pointer'
                )}
              >
                {isToday && (
                  <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[9px] font-black text-[#B45309] whitespace-nowrap">
                    ¡HOY!
                  </span>
                )}
                {isClaimFx && <span className="streak-claim-sweep" />}
                {isClaimed || isClaimFx ? (
                  <svg className="streak-check" width="18" height="18" viewBox="0 0 18 18" fill="none">
                    <path
                      d="M3 9.5L7 13L15 4.5"
                      stroke="#fff"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                ) : (
                  <>
                    <span className="text-sm leading-none">{isGold ? '👑' : '🎁'}</span>
                    <span className="text-[8px] font-black mt-0.5">{DAILY_REWARDS[day - 1]}</span>
                  </>
                )}
                {isClaimFx &&
                  burst.map((b) => (
                    <span
                      key={b.id}
                      className="combo-burst-particle"
                      style={{ '--dx': `${b.dx}px`, '--dy': `${b.dy}px` } as React.CSSProperties}
                    />
                  ))}
              </button>
            </div>
          );
        })}
      </div>

      <div className="flex justify-between mt-2 text-[9px] font-bold text-slate-400">
        <span>Día 5: + caja especial 🎟️</span>
        <span>Día 7: + item legendario 👑</span>
      </div>

      {claimFx && (
        <p className="text-center font-baloo font-extrabold text-[#16A34A] text-lg mt-2">
          +{claimFx.reward.toLocaleString('es-CO')}
        </p>
      )}
    </div>
  );
}
