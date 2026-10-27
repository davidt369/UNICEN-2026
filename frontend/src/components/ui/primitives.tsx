import * as React from 'react';
import { cn } from '@/lib/utils';
import { Button, type ButtonProps } from '@/components/ui/button';
import { Badge, type BadgeProps } from '@/components/ui/badge';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card';
import { Input as ShadcnInput } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export {
  Button,
  type ButtonProps,
  Badge,
  type BadgeProps,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  Label,
};

export const Input = React.forwardRef<
  HTMLInputElement,
  React.ComponentProps<'input'> & { label?: string }
>(({ label, className, id, ...props }, ref) => {
  const generatedId = React.useId();
  const inputId = id || generatedId;
  return (
    <div className="space-y-1.5">
      {label && (
        <Label
          htmlFor={inputId}
          className="text-xs font-semibold text-slate-700"
        >
          {label}
        </Label>
      )}
      <ShadcnInput ref={ref} id={inputId} className={className} {...props} />
    </div>
  );
});
Input.displayName = 'Input';

export const Select = React.forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement> & { label?: string }
>(({ label, className, children, id, ...props }, ref) => {
  const generatedId = React.useId();
  const selectId = id || generatedId;
  return (
    <div className="space-y-1.5">
      {label && (
        <Label
          htmlFor={selectId}
          className="text-xs font-semibold text-slate-700"
        >
          {label}
        </Label>
      )}
      <select
        ref={ref}
        id={selectId}
        className={cn(
          'flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50',
          className,
        )}
        {...props}
      >
        {children}
      </select>
    </div>
  );
});
Select.displayName = 'Select';
