import { forwardRef, HTMLAttributes } from 'react';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'white' | 'gray-light' | 'gray-dark' | 'mint';
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  hoverable?: boolean;
  elevation?: 'low' | 'mid' | 'high';
}

const elevationShadows = {
  low: 'shadow-[0_1px_2px_rgba(0,0,0,0.15)]',
  mid: 'shadow-[0_4px_12px_rgba(0,0,0,0.2)]',
  high: 'shadow-[0_8px_24px_rgba(0,0,0,0.25)]',
};

export const Card = forwardRef<HTMLDivElement, CardProps>(
  (
    {
      variant = 'gray-dark',
      padding = 'lg',
      hoverable = false,
      elevation = 'low',
      className = '',
      children,
      ...props
    },
    ref
  ) => {
    const baseStyles = 'relative rounded-2xl';

    const variantStyles = {
      white: `
        bg-bg-card-white
        border-2 border-[rgba(0,0,0,0.08)]
        text-[var(--color-text-primary)]
        [&_*]:text-[var(--color-text-primary)]
      `,
      'gray-light': `
        bg-bg-card-gray-light
        border-2 border-[rgba(0,0,0,0.1)]
        text-[var(--color-text-primary)]
        [&_*]:text-[var(--color-text-primary)]
      `,
      'gray-dark': `
        bg-bg-card-gray-dark
        border-2 border-border-subtle
      `,
      mint: `
        bg-bg-card-mint
        text-text-on-mint
        [&_*]:text-text-on-mint
      `,
    };

    const paddingStyles = {
      none: '',
      sm: 'p-3',
      md: 'p-4',
      lg: 'p-6',
      xl: 'p-8',
    };

    const hoverStyles = hoverable && variant !== 'mint'
      ? 'hover:shadow-[0_8px_24px_rgba(33,241,168,0.08)] cursor-pointer'
      : '';

    return (
      <div
        ref={ref}
        className={`
          ${baseStyles}
          ${variantStyles[variant]}
          ${paddingStyles[padding]}
          ${elevationShadows[elevation]}
          ${hoverStyles}
          ${className}
        `}
        {...props}
      >
        <div className="relative z-10 h-full flex flex-col">
          {children}
        </div>
      </div>
    );
  }
);

Card.displayName = 'Card';