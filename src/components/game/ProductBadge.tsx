import { cn } from '@/lib/utils';

// Spritesheet de badges de producto. El archivo real mide 1536×1024
// (5 columnas × 2 filas → celda de 307.2×512), no 1280×512 como se
// asumía; además los badges NO están centrados verticalmente en su
// celda. Centros de contenido medidos sobre el PNG real (canvas,
// alpha > 10): fila 1 ≈ y 358, fila 2 ≈ y 660. Se recorta una ventana
// cuadrada de 307.2px centrada en cada badge para no distorsionarlo.
const SHEET_W = 1536;
const SHEET_H = 1024;
const COLS = 5;
const CELL_W = SHEET_W / COLS; // 307.2 (ventana cuadrada por badge)
const ROW_CENTER_Y = [358, 660]; // centro vertical real de cada fila

interface ProductBadgeProps {
  /** 1..10 según el orden de SPONSOR_POWERS (fila 1: 1-5, fila 2: 6-10). */
  index: number;
  size?: number;
  className?: string;
}

/** Badge único de producto recortado del spritesheet por background-position. */
export function ProductBadge({ index, size = 48, className }: ProductBadgeProps) {
  const i = Math.min(Math.max(Math.round(index) - 1, 0), 9);
  const col = i % COLS;
  const row = Math.floor(i / COLS);
  const k = size / CELL_W;
  const x0 = col * CELL_W;
  const y0 = ROW_CENTER_Y[row] - CELL_W / 2;

  return (
    <div
      role="img"
      aria-hidden
      className={cn('product-badge', className)}
      style={{
        width: size,
        height: size,
        backgroundImage: "url('/assets/assets_10_badges_productos.png')",
        backgroundRepeat: 'no-repeat',
        backgroundSize: `${(SHEET_W * k).toFixed(2)}px ${(SHEET_H * k).toFixed(2)}px`,
        backgroundPosition: `-${(x0 * k).toFixed(2)}px -${(y0 * k).toFixed(2)}px`,
      }}
    />
  );
}
