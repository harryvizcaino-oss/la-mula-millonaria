import { cn } from '@/lib/utils';
import type { ReactNode, HTMLAttributes } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  className?: string;
  hoverable?: boolean;
}

export default function Card({ children, className, hoverable = false, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'bg-white rounded-2xl border border-slate-200',
        'shadow-card p-4 transition-all duration-200',
        hoverable && 'hover:scale-[1.02] hover:border-[#F59E0B]/20 cursor-pointer active:scale-[0.98]',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardImage({ src, alt, className }: { src: string; alt: string; className?: string }) {
  return (
    <div className={cn('relative overflow-hidden rounded-xl mb-3', className)}>
      <img
        src={src}
        alt={alt}
        className="w-full aspect-square object-cover"
        loading="lazy"
      />
    </div>
  );
}

export function CardContent({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('card-content', className)}>{children}</div>;
}

export function CardTitle({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <h3 className={cn('card-title font-inter font-semibold text-slate-900 text-sm leading-tight', className)}>
      {children}
    </h3>
  );
}
