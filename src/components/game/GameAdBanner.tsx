import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useIapStore } from '@/store/iapStore';
import { ADSENSE_CLIENT, houseAd } from '@/lib/adsConfig';

/**
 * Banner 50px fijo sobre el navbar, solo en `/game`.
 * Si el jugador tiene IAP sin anuncios, no se renderiza.
 */
export function GameAdBanner() {
  const isAdFree = useIapStore((s) => s.isAdFree());

  useEffect(() => {
    if (isAdFree) return;
    document.body.classList.add('game-has-ad-banner');
    return () => {
      document.body.classList.remove('game-has-ad-banner');
    };
  }, [isAdFree]);

  if (isAdFree) return null;

  return (
    <div className="game-ad-banner" role="complementary" aria-label="Publicidad">
      {ADSENSE_CLIENT ? (
        <div className="h-full w-full" data-ad data-ad-client={ADSENSE_CLIENT} />
      ) : (
        <Link
          to={houseAd.href}
          className="flex h-full w-full items-center justify-center px-3 text-sm font-bold tracking-wide"
          style={{ color: '#ff3131' }}
        >
          {houseAd.label}
        </Link>
      )}
    </div>
  );
}
