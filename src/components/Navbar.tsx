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
  const [, setActiveTab] = useState('/');

  return (
    <nav
      className={cn(
        'sticky bottom-0 left-0 right-0 z-50',
        'backdrop-blur-xl bg-white/95 border-t border-slate-200',
        'h-16 pb-[env(safe-area-inset-bottom)]',
        'flex items-center justify-around'
      )}
    >
      {navItems.map((item, index) => {
        const isCenter = index === 2; // Marketplace is center
        const Icon = item.icon;

        if (isCenter) {
          return (
            <div key={item.path} className="relative -mt-6">
              <NavLink
                to="/game"
                onClick={() => setActiveTab('/game')}
                className={cn(
                  'flex items-center justify-center',
                  'w-14 h-14 rounded-full',
                  'bg-gradient-to-r from-[#F59E0B] to-[#FBBF24]',
                  'shadow-glow-primary',
                  'transition-transform duration-200 active:scale-95'
                )}
              >
                <Gamepad2 size={24} className="text-slate-900" strokeWidth={2.5} />
              </NavLink>
              <span className="absolute -bottom-4 left-1/2 -translate-x-1/2 text-[10px] font-medium text-slate-500">
                Jugar
              </span>
            </div>
          );
        }

        return (
          <NavLink
            key={item.path}
            to={item.path}
            onClick={() => setActiveTab(item.path)}
            className={({ isActive }) =>
              cn(
                'flex flex-col items-center justify-center gap-0.5',
                'w-16 h-full relative',
                'transition-colors duration-200',
                isActive ? 'text-[#F59E0B]' : 'text-slate-500 hover:text-slate-800'
              )
            }
          >
            {({ isActive }) => (
              <>
                <motion.div
                  animate={isActive ? { scale: [0.8, 1.1, 1] } : { scale: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <Icon
                    size={22}
                    strokeWidth={isActive ? 2.5 : 1.5}
                  />
                </motion.div>
                <span className="text-[10px] font-medium">{item.label}</span>
                {isActive && (
                  <motion.div
                    layoutId="nav-indicator"
                    className="absolute -bottom-0.5 w-1 h-1 rounded-full bg-[#F59E0B]"
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
