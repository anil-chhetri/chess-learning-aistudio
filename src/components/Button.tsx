import type { ButtonHTMLAttributes, ReactNode } from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'md' | 'sm';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: ReactNode;
}

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary:
    'bg-primary-700 hover:bg-primary-900 text-white border border-transparent shadow-xs',
  secondary:
    'bg-white hover:bg-neutral-100 text-neutral-900 border border-neutral-300',
  ghost:
    'bg-transparent hover:bg-neutral-100 text-neutral-500 hover:text-neutral-900 border border-transparent',
  danger:
    'bg-white hover:bg-red-50 text-error border border-neutral-300',
};

const SIZE_CLASSES: Record<ButtonSize, string> = {
  md: 'h-[40px] px-4 ds-text-label',
  sm: 'h-[32px] px-3 ds-text-label',
};

export function Button({
  variant = 'secondary',
  size = 'md',
  className = '',
  type = 'button',
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className={`inline-flex items-center justify-center gap-1.5 rounded-[10px] whitespace-nowrap shrink-0 transition-colors cursor-pointer disabled:opacity-45 disabled:pointer-events-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-700 ${VARIANT_CLASSES[variant]} ${SIZE_CLASSES[size]} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}
