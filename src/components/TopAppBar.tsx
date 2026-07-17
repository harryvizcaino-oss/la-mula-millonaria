import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TopAppBarProps {
  transparent?: boolean;
  light?: boolean;
}

const pageTitles: Record<string, string> = {
  '/': '',
  '/game': 'Jugar',
  '/marketplace': 'Tienda',
  '/leaderboard': 'Clasificacion',
  '/profile': 'Perfil',
  '/dashboard': 'Panel',
  '/brands': 'Marcas',
  '/redemption': 'Redimir',
  '/auth': 'Cuenta',
};

export default function TopAppBar({ transparent = false, light = true }: TopAppBarProps) {
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  const title = pageTitles[location.pathname] || '';
  const isHome = location.pathname === '/';

  useEffect(() => {
    const handleScroll = () => {
      const currentY = window.scrollY;
      setScrolled(currentY > 100);

      if (currentY > lastScrollY && currentY > 200) {
        setIsVisible(false);
      } else {
        setIsVisible(true);
      }
      setLastScrollY(currentY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  const showBar = isVisible || scrolled;

  // V2-2: el juego es full-bleed — el fondo llega al borde superior y los
  // indicadores flotantes van a top 12px; la barra oculta evita solapes.
  // (La navegación sigue disponible en el Navbar inferior.)
  if (location.pathname === '/game') return null;

  return (
    <header
      className={cn(
        'fixed top-0 left-0 right-0 z-40 transition-all duration-300',
        'h-14 pt-[env(safe-area-inset-top)]',
        showBar ? 'translate-y-0' : '-translate-y-full',
        scrolled || !transparent
          ? light
            ? 'bg-white/95 backdrop-blur-lg border-b border-slate-200'
            : 'bg-white/95 backdrop-blur-lg border-b border-slate-200'
          : 'bg-transparent',
        isHome && !scrolled && 'pointer-events-none'
      )}
    >
      <div className="flex items-center justify-between h-full px-4">
        {/* Left */}
        <div className="flex items-center gap-3 flex-shrink-0 pointer-events-auto">
          {!isHome && (
            <button
              onClick={() => window.history.back()}
              className={cn(
                'p-2 -ml-2 rounded-full transition-colors',
                light ? 'hover:bg-slate-100 text-slate-800' : 'hover:bg-slate-100 text-slate-900'
              )}
            >
              <ArrowLeft size={22} />
            </button>
          )}
          {title && (
            <h1 className={cn('font-fredoka font-bold text-base', light ? 'text-slate-900' : 'text-slate-900')}>
              {title}
            </h1>
          )}
        </div>

        {/* Right */}
        <div className="flex items-center gap-3 pointer-events-auto" />
      </div>
    </header>
  );
}
