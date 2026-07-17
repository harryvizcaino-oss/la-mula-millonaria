import { useEffect } from 'react';

interface FloatingNumberProps {
  value: string;
  x: number;
  y: number;
  onComplete: () => void;
}

/**
 * Número flotante "+N CPS" en el punto exacto del click.
 * La animación vive en `.floating-number` (ui-fixes.css) y dura 1s;
 * al terminar llama onComplete para que el padre lo desmonte.
 */
export function FloatingNumber({ value, x, y, onComplete }: FloatingNumberProps) {
  useEffect(() => {
    const t = setTimeout(onComplete, 1000);
    return () => clearTimeout(t);
  }, [onComplete]);

  return (
    <div className="floating-number" style={{ left: x, top: y }}>
      {value}
    </div>
  );
}
