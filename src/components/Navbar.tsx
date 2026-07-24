import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, ShoppingCart, Trophy, User, Gamepad2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const sideItems = [
  { path: '/', label: 'Inicio', icon: Home, color: 'from-[#4ADE80] to-[#16A34A]', shadow: '#22C55E' },
  { path: '/leaderboard', label: 'Ranking', icon: Trophy, color: 'from-[#60A5FA] to-[#2563EB]', shadow: '#3B82F6' },
  { path: '/marketplace', label: 'Tienda', icon: ShoppingCart, color: 'from-[#F87171] to-[#DC2626]', shadow: '#EF4444' },
  { path: '/profile', label: 'Perfil', icon: User, color: 'from-[#A78BFA] to-[#7C3AED]', shadow: '#8B5CF6' },
];

export default function Navbar() {
  const [tappedItem, setTappedItem] = useState<string | null>(null);
  const location = useLocation();

  const handleTap = (path: string) => {
    setTappedItem(path);
    setTimeout(() => setTappedItem(null), 200);
  };

  const isGame = location.pathname === '/game';

  return (
    <nav
      className={cn(
        'sticky bottom-0 left-0 right-0 z-50',
        'h-[110px] pb-[env(safe-area-inset-bottom)]',
        'pointer-events-none'
      )}
    >
      {/* Barra de juego infantil/idle — colores, bordes gruesos, formas redondas */}
      <div
        className={cn(
          'absolute bottom-3 left-3 right-3 h-[86px]',
          'rounded-[2rem]',
          'bg-[#FFFBEB]',
          'border-[5px] border-[#FDE68A]',
          'shadow-[0_-6px_0_#F59E0B,0_-12px_24px_rgba(0,0,0,0.15)]',
          'pointer-events-auto',
          'flex items-center justify-between px-2'
        )}
      >
        {/* Decoración: puntitos de confeti */}
        <span className="absolute top-2 left-6 w-2 h-2 rounded-full bg-[#F472B6]" />
        <span className="absolute top-3 right-10 w-1.5 h-1.5 rounded-full bg-[#60A5FA]" />
        <span className="absolute bottom-2 left-1/2 w-2 h-2 rounded-full bg-[#4ADE80]" />

        {/* Items laterales izquierda */}
        <div className="flex items-center gap-2 flex-1 pl-1">
          {sideItems.slice(0, 2).map((item) => (
            <NavItem key={item.path} item={item} tappedItem={tappedItem} onTap={handleTap} />
          ))}
        </div>

        {/* Botón central JUGAR */}
        <div className="relative -mt-10 mx-1">
          <NavLink
            to="/game"
            onClick={() => handleTap('/game')}
            className={({ isActive }) =>
              cn(
                'relative flex items-center justify-center',
                'w-[84px] h-[84px] rounded-full',
                'bg-gradient-to-b from-[#FEF08A] via-[#FACC15] to-[#F59E0B]',
                'border-[6px] border-[#FDE68A]',
                'shadow-[0_6px_0_#B45309,0_0_28px_rgba(245,158,11,0.5),inset_0_4px_6px_rgba(255,255,255,0.5)]',
                'transition-transform duration-100 active:translate-y-1 active:shadow-[0_2px_0_#B45309,0_0_28px_rgba(245,158,11,0.5),inset_0_4px_6px_rgba(255,255,255,0.5)]',
                isActive && 'ring-[6px] ring-[#F59E0B]/30'
              )
            }
          >
            {({ isActive }) => (
              <>
                <motion.div
                  animate={isActive ? { rotate: [0, -8, 8, 0], scale: [1, 1.1, 1] } : {}}
                  transition={{ duration: 1.2, repeat: Infinity }}
                >
                  <Gamepad2 size={38} className="text-[#78350F]" strokeWidth={2.5} />
                </motion.div>
                {!isActive && (
                  <motion.span
                    className="absolute -top-1 -right-1 flex h-5 w-5"
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 1, repeat: Infinity }}
                  >
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#EF4444] opacity-75" />
                    <span className="relative inline-flex rounded-full h-5 w-5 bg-[#EF4444] border-2 border-white" />
                  </motion.span>
                )}
              </>
            )}
          </NavLink>
          <span
            className={cn(
              'absolute -bottom-5 left-1/2 -translate-x-1/2 text-[11px] font-black uppercase tracking-wider whitespace-nowrap',
              isGame ? 'text-[#D97706]' : 'text-slate-500'
            )}
          >
            Jugar
          </span>
        </div>

        {/* Items laterales derecha */}
        <div className="flex items-center gap-2 flex-1 justify-end pr-1">
          {sideItems.slice(2).map((item) => (
            <NavItem key={item.path} item={item} tappedItem={tappedItem} onTap={handleTap} />
          ))}
        </div>
      </div>
    </nav>
  );
}

function NavItem({
  item,
  tappedItem,
  onTap,
}: {
  item: { path: string; label: string; icon: React.ElementType; color: string; shadow: string };
  tappedItem: string | null;
  onTap: (path: string) => void;
}) {
  const Icon = item.icon;

  return (
    <NavLink
      to={item.path}
      onClick={() => onTap(item.path)}
      className={({ isActive }) =>
        cn(
          'relative flex flex-col items-center justify-center',
          'w-[64px] h-[64px] rounded-2xl',
          'transition-transform duration-100',
          'active:translate-y-1',
          isActive
            ? cn('bg-gradient-to-b', item.color, 'text-white shadow-[0_4px_0_rgba(0,0,0,0.25),0_0_16px]', 'border-b-4 border-white/30')
            : 'bg-white text-slate-500 border-b-4 border-slate-200 shadow-[0_4px_0_#E2E8F0] hover:bg-slate-50'
        )
      }
    >
      {({ isActive }) => (
        <>
          <motion.div
            animate={isActive ? { y: [0, -2, 0] } : {}}
            transition={{ duration: 0.6, repeat: Infinity }}
          >
            <Icon size={26} strokeWidth={isActive ? 2.8 : 2} />
          </motion.div>
          <span className="text-[9px] font-black uppercase tracking-wider mt-0.5">{item.label}</span>
          {tappedItem === item.path && (
            <motion.span
              initial={{ scale: 0, opacity: 1 }}
              animate={{ scale: 1.5, opacity: 0 }}
              className="absolute inset-0 rounded-2xl bg-white/40"
            />
          )}
        </>
      )}
    </NavLink>
  );
}
