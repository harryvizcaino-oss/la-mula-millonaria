import { useMemo } from 'react';
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { TransactionRow } from '@/lib/transactions';

interface CpsHistoryChartProps {
  transactions: TransactionRow[];
  currentCps: number;
}

interface DayPoint {
  label: string;
  cps: number;
}

function formatCompact(n: number): string {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return `${Math.floor(n)}`;
}

/**
 * Gráfica de área del CPS total (histórico) derivado de las transacciones.
 * Acumula `earn`/`reward` (+) y `spend` (-) por día, y ancla el valor final
 * al CPS total actual para que la punta coincida con la realidad.
 * Si no hay datos, muestra un placeholder vacío (sin inventar puntos).
 */
export function CpsHistoryChart({ transactions, currentCps }: CpsHistoryChartProps) {
  const data = useMemo<DayPoint[]>(() => {
    const byDay = new Map<string, number>();
    for (const tx of transactions) {
      const date = new Date(tx.created_at);
      const key = date.toISOString().slice(0, 10);
      const delta =
        tx.type === 'spend' ? -Math.abs(tx.amount) : Math.abs(tx.amount);
      byDay.set(key, (byDay.get(key) ?? 0) + delta);
    }

    const sorted = [...byDay.entries()].sort((a, b) => a[0].localeCompare(b[0]));
    let running = 0;
    const points: DayPoint[] = sorted.map(([key, delta]) => {
      running += delta;
      const [, month, day] = key.split('-');
      return { label: `${day}/${month}`, cps: Math.max(0, running) };
    });

    // Ancla al CPS total actual (la serie de transacciones puede estar
    // incompleta o ser best-effort).
    if (points.length > 0) {
      points[points.length - 1] = {
        ...points[points.length - 1],
        cps: Math.max(points[points.length - 1].cps, Math.floor(currentCps)),
      };
    }
    return points;
  }, [transactions, currentCps]);

  if (data.length < 2) {
    return (
      <div className="h-40 flex items-center justify-center text-slate-400 text-xs">
        Juega más para ver tu historial de CPS
      </div>
    );
  }

  return (
    <div className="h-40 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 4, left: 4, bottom: 0 }}>
          <defs>
            <linearGradient id="cpsFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#F59E0B" stopOpacity={0.45} />
              <stop offset="100%" stopColor="#F59E0B" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="label"
            tick={{ fontSize: 10, fill: '#94A3B8' }}
            tickLine={false}
            axisLine={false}
            interval="preserveStartEnd"
            minTickGap={24}
          />
          <YAxis
            tick={{ fontSize: 10, fill: '#94A3B8' }}
            tickLine={false}
            axisLine={false}
            width={44}
            tickFormatter={formatCompact}
          />
          <Tooltip
            contentStyle={{
              background: '#0D0E14',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 12,
              fontSize: 12,
            }}
            labelStyle={{ color: '#94A3B8' }}
            formatter={(value) => [formatCompact(Number(value)), 'CPS']}
          />
          <Area
            type="monotone"
            dataKey="cps"
            stroke="#F59E0B"
            strokeWidth={2.5}
            fill="url(#cpsFill)"
            isAnimationActive
            animationDuration={700}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
