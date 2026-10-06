import { cn } from '@/lib/utils';

function Skeleton({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="skeleton"
      className={cn(
        'relative overflow-hidden rounded-2xl bg-slate-200/70',
        'after:absolute after:inset-0 after:animate-shimmer',
        'after:bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.6),transparent)]',
        'after:bg-[length:200%_100%]',
        className
      )}
      {...props}
    />
  );
}

export { Skeleton };
