import { forwardRef, ButtonHTMLAttributes } from 'react';
import { LucideIcon } from 'lucide-react';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'ghost' | 'danger' | 'subtle';
  size?: 'sm' | 'md' | 'lg';
  icon?: LucideIcon;
  iconPosition?: 'left' | 'right';
  isLoading?: boolean;
  fullWidth?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      icon: Icon,
      iconPosition = 'left',
      isLoading = false,
      fullWidth = false,
      className = '',
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const baseStyles = `
      group inline-flex items-center justify-center gap-2
      font-medium rounded-xl
      transition-[background-color,border-color,box-shadow] duration-200 ease-[var(--ease-out)]
      focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent-mint
      disabled:opacity-50 disabled:cursor-not-allowed
    `;

    const variantStyles = {
      primary: `
        bg-accent-mint text-on-mint
        hover:opacity-90
        shadow-lg shadow-accent-mint/30
        hover:shadow-xl hover:shadow-accent-mint/40
      `,
      ghost: `
        bg-transparent
        text-accent-mint
        border border-accent-mint
        hover:bg-accent-mint-dim
        hover:border-transparent
      `,
      danger: `
        bg-danger/15
        border border-danger/30
        text-danger
        hover:bg-danger/25
        hover:border-danger/40
        hover:shadow-lg hover:shadow-danger/20
        focus:ring-danger
      `,
      subtle: `
        bg-bg-tertiary
        border border-border-subtle
        text-text-primary/70
        hover:border-border-strong
        hover:bg-bg-tertiary
      `,
    };

    const sizeStyles = {
      sm: 'px-3 py-1.5 text-sm gap-1.5',
      md: 'px-4 py-2 text-base gap-2',
      lg: 'px-6 py-3 text-lg gap-3',
    };

    const widthStyles = fullWidth ? 'w-full' : '';

    return (
      <button
        ref={ref}
        className={`
          ${baseStyles}
          ${variantStyles[variant]}
          ${sizeStyles[size]}
          ${widthStyles}
          ${className}
        `}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading && (
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
              fill="none"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}

        {!isLoading && Icon && iconPosition === 'left' && (
          <Icon className="w-5 h-5 transition-transform duration-200 ease-[var(--ease-out)] group-hover:translate-x-0.5" strokeWidth={1.5} aria-hidden="true" />
        )}

        {children}

        {!isLoading && Icon && iconPosition === 'right' && (
          <Icon className="w-5 h-5 transition-transform duration-200 ease-[var(--ease-out)] group-hover:translate-x-0.5" strokeWidth={1.5} aria-hidden="true" />
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';