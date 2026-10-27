import React from 'react';
import { cn } from '../../lib/utils';

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'orange' | 'outline' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

export const Button: React.FC<ButtonProps> = ({
  className,
  variant = 'primary',
  size = 'md',
  children,
  ...props
}) => {
  const variants = {
    primary:
      'bg-[#002B49] text-white hover:bg-[#003865] focus:ring-2 focus:ring-[#002B49]/40 shadow-sm',
    orange:
      'bg-[#E05A1B] text-white hover:bg-[#C74910] focus:ring-2 focus:ring-[#E05A1B]/40 shadow-sm',
    outline:
      'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50',
    danger:
      'bg-red-600 text-white hover:bg-red-700 focus:ring-2 focus:ring-red-500/40',
    ghost: 'text-slate-600 hover:bg-slate-100',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-xs font-semibold rounded-md',
    md: 'px-4 py-2 text-sm font-semibold rounded-lg',
    lg: 'px-5 py-2.5 text-base font-semibold rounded-lg',
  };

  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:pointer-events-none',
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
};

export const Card: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className,
  children,
  ...props
}) => (
  <div
    className={cn(
      'bg-white rounded-xl border border-slate-200 shadow-sm',
      className,
    )}
    {...props}
  >
    {children}
  </div>
);

export const Badge: React.FC<{
  children: React.ReactNode;
  variant?: 'navy' | 'orange' | 'success' | 'danger' | 'neutral';
  className?: string;
}> = ({ children, variant = 'neutral', className }) => {
  const styles = {
    navy: 'bg-[#002B49]/10 text-[#002B49] border-[#002B49]/20',
    orange: 'bg-[#E05A1B]/10 text-[#E05A1B] border-[#E05A1B]/25',
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    danger: 'bg-red-50 text-red-700 border-red-200',
    neutral: 'bg-slate-100 text-slate-700 border-slate-200',
  };
  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border',
        styles[variant],
        className,
      )}
    >
      {children}
    </span>
  );
};

export const Input: React.FC<
  React.InputHTMLAttributes<HTMLInputElement> & { label?: string }
> = ({ label, className, ...props }) => (
  <div className="space-y-1">
    {label && (
      <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
        {label}
      </label>
    )}
    <input
      className={cn(
        'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#002B49] focus:outline-none focus:ring-2 focus:ring-[#002B49]/20',
        className,
      )}
      {...props}
    />
  </div>
);

export const Select: React.FC<
  React.SelectHTMLAttributes<HTMLSelectElement> & { label?: string }
> = ({ label, className, children, ...props }) => (
  <div className="space-y-1">
    {label && (
      <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
        {label}
      </label>
    )}
    <select
      className={cn(
        'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-[#002B49] focus:outline-none focus:ring-2 focus:ring-[#002B49]/20',
        className,
      )}
      {...props}
    >
      {children}
    </select>
  </div>
);
