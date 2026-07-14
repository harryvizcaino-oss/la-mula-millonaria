import { cn } from '@/lib/utils';
import type { ButtonHTMLAttributes, ReactNode } from 'react';

interface PrimaryButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: 'primary' | 'outline' | 'ghost' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
  icon?: ReactNode;
  fullWidth?: boolean;
  className?: string;
}

export default function PrimaryButton({
  children,
  variant = 'primary',
  size = 'lg',
  icon,
  fullWidth = true,
  className,
  ...props
}: PrimaryButtonProps) {
  const variants = {
    primary: cn(
      'bg-gradient-to-r from-[#F59E0B] to-[#FBBF24] text-white',
      'shadow-glow-primary hover:shadow-glow-primary-lg',
      'active:scale-[0.97]'
    ),
    outline: cn(
      'bg-transparent border-2 border-[#F59E0B] text-[#F59E0B]',
      'hover:bg-[#F59E0B]/10 active:scale-[0.97]'
    ),
    ghost: cn(
      'bg-transparent text-[#F59E0B]',
      'hover:bg-[#F59E0B]/10 active:scale-[0.97]'
    ),
    secondary: cn(
      'bg-gradient-to-r from-[#3B82F6] to-[#60A5FA] text-white',
      'shadow-[0_4px_16px_rgba(59,130,246,0.35)]',
      'active:scale-[0.97]'
    ),
  };

  const sizes = {
    sm: 'h-10 px-4 text-sm',
    md: 'h-12 px-6 text-sm',
    lg: 'h-14 px-8 text-base',
  };

  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-2xl',
        'font-inter font-bold uppercase tracking-wider',
        'transition-all duration-150 select-none',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        'touch-manipulation',
        variants[variant],
        sizes[size],
        fullWidth && 'w-full',
        className
      )}
      {...props}
    >
      {icon && <span className="flex-shrink-0">{icon}</span>}
      <span>{children}</span>
    </button>
  );
}
