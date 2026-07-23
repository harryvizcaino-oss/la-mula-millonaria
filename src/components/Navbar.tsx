import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, ShoppingCart, Trophy, User, Gamepad2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { path: '/', label: 'Inicio', icon: Home },
  { path: '/leaderboard', label: 'Ranking', icon: Trophy },
  { path: '/game', label: 'Jugar', icon: Gamepad2 },
  { path: '/marketplace', label: 'Tienda', icon: ShoppingCart },
  { path: '/profile', label: 'Perfil', icon: User },
];

export default function Navbar() {
  const [tappedItem, setTappedItem] = useState<string | null>(null);

  const handleTap = (path: string) => {
    setTappedItem(path);
    setTimeout(() => setTappedItem(null), 200);
  };

  return (
    <nav
      className={cn(
        'sticky bottom-0 left-0 right-0 z-50',
        'backdrop-blur-xl bg-[#0D0E14]/85 border-t border-white/10',
        'h-16 pb-[env(safe-area-inset-bottom)]',
        'flex items-center justify-around'
      )}
    >
      {navItems.map((item, index) => {
        const isCenter = index === 2;
        const Icon = item.icon;

        if (isCenter) {
          return (
            <div key={item.path} className="relative -mt-6">
              <NavLink
                to="/game"
                onClick={() => handleTap('/game')}
                className={cn(
                  'nav-center-btn flex items-center justify-center',
                  'w-14 h-14 rounded-full',
                  'bg-gradient-to-r from-[#F59E0B] to-[#FBBF24]',
                  'shadow-glow-primary',
                  'transition-transform duration-200'
                )}
              >
                <Gamepad2 size={24} className="text-slate-900" strokeWidth={2.5} />
              </NavLink>
              <span className="absolute -bottom-4 left-1/2 -translate-x-1/2 text-[10px] font-medium text-slate-400">
                Jugar
              </span>
            </div>
          );
        }

        return (
          <NavLink
            key={item.path}
            to={item.path}
            onClick={() => handleTap(item.path)}
            className={({ isActive }) =>
              cn(
                'nav-item flex flex-col items-center justify-center gap-0.5',
                'w-16 h-full relative',
                'transition-colors duration-200',
                isActive ? 'nav-item-active' : 'nav-item-inactive hover:text-slate-200'
              )
            }
          >
            {({ isActive }) => (
              <>
                <div className={cn('nav-icon', tappedItem === item.path && 'nav-item-tap')}>
                  <Icon
                    size={22}
                    strokeWidth={isActive ? 2.5 : 1.5}
                  />
                </div>
                <span className="nav-label text-[10px] font-medium">{item.label}</span>
                {isActive && (
                  <motion.div
                    layoutId="nav-indicator"
                    className="nav-dot"
                    transition={{ type: 'spring', duration: 0.3 }}
                  />
                )}
              </>
            )}
          </NavLink>
        );
      })}
    </nav>
  );
}
