import { useEffect, useRef, useState } from 'react';

interface RolloverNumberProps {
  /** Valor a mostrar (número entero). */
  value: number;
  /** Duración de la animación de rollover en ms. */
  duration?: number;
  className?: string;
  /** Formato aplicado al valor final (ej. toLocaleString('es-CO')). */
  format?: (n: number) => string;
}

/**
 * Contador con "rollover" (odómetro): al cambiar `value`, interpola
 * numéricamente desde el valor previo hasta el nuevo y formatea el resultado.
 * Usa requestAnimationFrame y solo toca estado con números enteros, por lo que
 * es barato y no depende de librerías.
 */
export function RolloverNumber({
  value,
  duration = 500,
  className,
  format = (n) => Math.floor(n).toLocaleString('es-CO'),
}: RolloverNumberProps) {
  const [display, setDisplay] = useState(() => Math.floor(value));
  const fromRef = useRef(display);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const from = fromRef.current;
    const to = Math.floor(value);
    if (from === to) return;

    const start = performance.now();
    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      // easeOutCubic: arranca rápido y se asienta suave.
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(from + (to - from) * eased);
      setDisplay(current);
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        fromRef.current = to;
      }
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
      fromRef.current = to;
    };
  }, [value, duration]);

  return <span className={className}>{format(display)}</span>;
}
