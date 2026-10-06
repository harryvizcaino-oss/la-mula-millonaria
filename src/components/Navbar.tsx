import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, ShoppingCart, Zap, User, Gamepad2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const sideItems = [
  { path: '/', label: 'Inicio', icon: Home },
  { path: '/game', label: 'Powers', icon: Zap, gameTab: 'upgrades' },
  { path: '/marketplace', label: 'Tienda', icon: ShoppingCart },
  { path: '/profile', label: 'Perfil', icon: User },
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
      {/* Barra oscura glass — coherente con Home y la arena del juego */}
      <div
        className={cn(
          'absolute bottom-0 left-0 right-0 h-[86px]',
          'rounded-t-[2rem]',
          'bg-[#0D0E14]/85 backdrop-blur-xl border-t border-white/10',
          'shadow-[0_-12px_24px_rgba(0,0,0,0.35)]',
          'pointer-events-auto',
          'flex items-center justify-between px-3'
        )}
      >
        {/* Items laterales izquierda */}
        <div className="flex items-center gap-1 flex-1 pl-1">
          {sideItems.slice(0, 2).map((item) => (
            <NavItem key={item.path} item={item} tappedItem={tappedItem} onTap={handleTap} />
          ))}
        </div>

        {/* Botón central JUGAR — gradiente dorado con glow */}
        <div className="relative -mt-10 mx-1">
          <NavLink
            to="/game"
            onClick={() => handleTap('/game')}
            className={({ isActive }) =>
              cn(
                'relative flex items-center justify-center',
                'w-[84px] h-[84px] rounded-full',
                'bg-gradient-to-b from-[#F59E0B] via-[#FBBF24] to-[#F59E0B]',
                'border-2 border-[#FDE68A]/70',
                'shadow-[0_8px_28px_rgba(245,158,11,0.5),inset_0_2px_6px_rgba(255,255,255,0.4)]',
                'transition-transform duration-100 active:translate-y-1 active:scale-95',
                isActive && 'ring-4 ring-[#F59E0B]/30'
              )
            }
          >
            {({ isActive }) => (
              <>
                <motion.div
                  animate={isActive ? { rotate: [0, -8, 8, 0], scale: [1, 1.1, 1] } : {}}
                  transition={{ duration: 1.2, repeat: Infinity }}
                >
                  <Gamepad2 size={38} className="text-[#0D0E14]" strokeWidth={2.5} />
                </motion.div>
                {!isActive && (
                  <motion.span
                    className="absolute -top-1 -right-1 flex h-5 w-5"
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 1, repeat: Infinity }}
                  >
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#EF4444] opacity-75" />
                    <span className="relative inline-flex rounded-full h-5 w-5 bg-[#EF4444] border-2 border-[#0D0E14]" />
                  </motion.span>
                )}
              </>
            )}
          </NavLink>
          <span
            className={cn(
              'absolute -bottom-5 left-1/2 -translate-x-1/2 text-[11px] font-black uppercase tracking-wider whitespace-nowrap',
              isGame ? 'text-[#F59E0B]' : 'text-slate-400'
            )}
          >
            Jugar
          </span>
        </div>

        {/* Items laterales derecha */}
        <div className="flex items-center gap-1 flex-1 justify-end pr-1">
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
  item: { path: string; label: string; icon: React.ElementType; gameTab?: string };
  tappedItem: string | null;
  onTap: (path: string) => void;
}) {
  const Icon = item.icon;

  const handleClick = () => {
    if (item.gameTab) {
      sessionStorage.setItem('gameTab', item.gameTab);
    }
    onTap(item.path);
  };

  return (
    <NavLink
      to={item.path}
      onClick={handleClick}
      className={({ isActive }) =>
        cn(
          'relative flex flex-col items-center justify-center',
          'w-[64px] h-[64px] rounded-2xl',
          'transition-transform duration-100',
          'active:translate-y-0.5 active:scale-95',
          isActive ? 'nav-item-active' : 'nav-item-inactive hover:text-slate-200'
        )
      }
    >
      {({ isActive }) => (
        <>
          <motion.div
            animate={isActive ? { y: [0, -2, 0] } : {}}
            transition={{ duration: 0.6, repeat: Infinity }}
            className="nav-icon"
          >
            <Icon size={26} strokeWidth={isActive ? 2.8 : 2} />
          </motion.div>
          <span className="nav-label text-[9px] font-black uppercase tracking-wider mt-0.5">
            {item.label}
          </span>
          {isActive && <span className="nav-dot" />}
          {tappedItem === item.path && (
            <motion.span
              initial={{ scale: 0, opacity: 1 }}
              animate={{ scale: 1.5, opacity: 0 }}
              className="absolute inset-0 rounded-2xl bg-white/10"
            />
          )}
        </>
      )}
    </NavLink>
  );
}
