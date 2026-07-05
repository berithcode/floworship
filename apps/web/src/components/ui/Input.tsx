
import { forwardRef, InputHTMLAttributes, ReactNode } from 'react';
import { LucideIcon } from 'lucide-react';

function generateId(label?: string | ReactNode): string {
  if (!label) return 'input-' + Math.random().toString(36).substring(2, 9);
  if (typeof label === 'string') return label.toLowerCase().replace(/\s+/g, '-');
  return 'input-' + Math.random().toString(36).substring(2, 9);
}

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  icon?: LucideIcon;
  iconPosition?: 'left' | 'right';
  label?: string | ReactNode;
  error?: string;
  helperText?: string;
  fullWidth?: boolean;
  fieldClassName?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      icon: Icon,
      iconPosition = 'left',
      label,
      error,
      helperText,
      fullWidth = true,
      className = '',
      fieldClassName = '',
      id,
      disabled,
      ...props
    },
    ref
  ) => {
    const inputId = id || generateId(label);

    const baseStyles = `
      px-4 py-2.5
      bg-bg-tertiary
      border rounded-xl
      text-text-primary
      placeholder-text-tertiary
      transition-[border-color,box-shadow] duration-200 ease-[var(--ease-out)]
      focus:outline-none focus:ring-2 focus:ring-accent-mint/30 focus:border-transparent
      disabled:opacity-50 disabled:cursor-not-allowed
    `;

    const borderStyles = error
      ? 'border-danger focus:ring-danger'
      : 'border-border-subtle hover:border-border-strong';

    const widthStyles = fullWidth ? 'w-full' : '';

    const iconContainerStyles = `
      absolute top-1/2 -translate-y-1/2
      text-text-primary/50
      transition-colors duration-200
    `;

    const leftIconStyles = `left-3 ${Icon ? '' : 'hidden'}`;
    const rightIconStyles = `right-3 ${Icon ? '' : 'hidden'}`;

    const paddingLeft = iconPosition === 'left' && Icon ? 'pl-10' : '';
    const paddingRight = iconPosition === 'right' && Icon ? 'pr-10' : '';

    return (
      <div className={`relative ${widthStyles} ${className}`}>
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-text-primary/70 mb-1.5"
          >
            {label}
          </label>
        )}

        <div className="relative">
          {Icon && iconPosition === 'left' && (
            <div className={iconContainerStyles + ' ' + leftIconStyles}>
              <Icon className="w-5 h-5" strokeWidth={1.5} aria-hidden="true" />
            </div>
          )}

          <input
            id={inputId}
            ref={ref}
            className={`
              ${baseStyles}
              ${borderStyles}
              ${paddingLeft}
              ${paddingRight}
              ${fieldClassName}
            `}
            disabled={disabled}
            aria-invalid={error ? 'true' : 'false'}
            aria-describedby={error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined}
            {...props}
          />

          {Icon && iconPosition === 'right' && (
            <div className={iconContainerStyles + ' ' + rightIconStyles}>
              <Icon className="w-5 h-5" strokeWidth={1.5} aria-hidden="true" />
            </div>
          )}
        </div>

        {(helperText || error) && (
          <p
            id={error ? `${inputId}-error` : `${inputId}-helper`}
            className={`mt-1.5 text-sm ${error ? 'text-danger' : 'text-text-primary/50'}`}
          >
            {error || helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: string;
  error?: string;
  helperText?: string;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  (
    {
      label,
      error,
      helperText,
      className = '',
      id,
      disabled,
      ...props
    },
    ref
  ) => {
    const checkboxId = id || label.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className={`relative flex items-start gap-3 ${className}`}>
        <div className="relative flex items-center justify-center mt-0.5">
          <input
            ref={ref}
            type="checkbox"
            id={checkboxId}
            className={`
              appearance-none
              w-5 h-5
              rounded-[4px]
              border-2
              transition-[background-color,border-color,box-shadow] duration-200 ease-[var(--ease-out)]
              focus:outline-none focus:ring-2 focus:ring-accent-mint/30 focus:ring-offset-2 focus:ring-offset-bg-primary
              disabled:opacity-50 disabled:cursor-not-allowed
              cursor-pointer
              ${error
                ? 'border-danger bg-bg-tertiary'
                : 'border-border-strong bg-bg-tertiary hover:border-accent-mint'
              }
            `}
            disabled={disabled}
            aria-invalid={error ? 'true' : 'false'}
            aria-describedby={error ? `${checkboxId}-error` : helperText ? `${checkboxId}-helper` : undefined}
            {...props}
          />
          <span
            className={`
              absolute inset-0 flex items-center justify-center
              text-text-on-mint
              transition-opacity duration-200 ease-[var(--ease-out)]
              pointer-events-none
              ${props.checked ? 'opacity-100' : 'opacity-0'}
            `}
          >
            <svg width="12" height="10" viewBox="0 0 12 10" fill="none" aria-hidden="true">
              <path d="M1 5L4.5 8.5L11 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <label
            htmlFor={checkboxId}
            className="block text-sm font-medium text-text-primary/70 cursor-pointer"
          >
            {label}
          </label>
          {(helperText || error) && (
            <p
              id={error ? `${checkboxId}-error` : `${checkboxId}-helper`}
              className={`mt-1 text-sm ${error ? 'text-danger' : 'text-text-primary/50'}`}
            >
              {error || helperText}
            </p>
          )}
        </div>
      </div>
    );
  }
);

Checkbox.displayName = 'Checkbox';

export interface RadioProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: string;
  error?: string;
  helperText?: string;
}

export const Radio = forwardRef<HTMLInputElement, RadioProps>(
  (
    {
      label,
      error,
      helperText,
      className = '',
      id,
      disabled,
      ...props
    },
    ref
  ) => {
    const radioId = id || label.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className={`relative flex items-start gap-3 ${className}`}>
        <div className="relative flex items-center justify-center mt-0.5">
          <input
            ref={ref}
            type="radio"
            id={radioId}
            className={`
              appearance-none
              w-5 h-5
              rounded-full
              border-2
              transition-[background-color,border-color,box-shadow] duration-200 ease-[var(--ease-out)]
              focus:outline-none focus:ring-2 focus:ring-accent-mint/30 focus:ring-offset-2 focus:ring-offset-bg-primary
              disabled:opacity-50 disabled:cursor-not-allowed
              cursor-pointer
              ${error
                ? 'border-danger bg-bg-tertiary'
                : 'border-border-strong bg-bg-tertiary hover:border-accent-mint'
              }
            `}
            disabled={disabled}
            aria-invalid={error ? 'true' : 'false'}
            aria-describedby={error ? `${radioId}-error` : helperText ? `${radioId}-helper` : undefined}
            {...props}
          />
          <span
            className={`
              absolute inset-1/2 -translate-x-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full
              bg-accent-mint
              transition-[transform,opacity] duration-200 ease-[var(--ease-out)]
              pointer-events-none
              ${props.checked ? 'opacity-100 scale-100' : 'opacity-0 scale-50'}
            `}
            aria-hidden="true"
          />
        </div>
        <div className="flex-1 min-w-0">
          <label
            htmlFor={radioId}
            className="block text-sm font-medium text-text-primary/70 cursor-pointer"
          >
            {label}
          </label>
          {(helperText || error) && (
            <p
              id={error ? `${radioId}-error` : `${radioId}-helper`}
              className={`mt-1 text-sm ${error ? 'text-danger' : 'text-text-primary/50'}`}
            >
              {error || helperText}
            </p>
          )}
        </div>
      </div>
    );
  }
);

Radio.displayName = 'Radio';