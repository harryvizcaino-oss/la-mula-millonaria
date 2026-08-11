import { cn } from '@/lib/utils';

/**
 * Pill de estado del catálogo RedPostventa: "Catálogo vivo" o "Demo".
 */
export function CatalogStatusBadge({
  catalogOk,
  loading,
  className,
}: {
  catalogOk: boolean;
  loading?: boolean;
  className?: string;
}) {
  if (loading) return null;

  return (
    <span
      className={cn(
        'inline-flex items-center h-7 px-2.5 rounded-full text-[10px] font-black uppercase tracking-wider whitespace-nowrap border',
        catalogOk
          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
          : 'bg-slate-100 text-slate-500 border-slate-200',
        className
      )}
    >
      {catalogOk ? 'Catálogo vivo' : 'Demo'}
    </span>
  );
}
