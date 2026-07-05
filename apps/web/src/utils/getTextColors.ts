import { useTheme } from '../context/ThemeContext';

/**
 * Hook para cores de texto que se adaptam ao theme automaticamente.
 * 
 * @usage
 * const { primary, secondary, tertiary } = getTextColors(theme);
 * 
 * <h1 className={primary}>Título</h1>
 * <p className={secondary}>Descrição</p>
 * <span className={tertiary}>Metadata</span>
 */
export function getTextColors(_theme?: 'dark' | 'light') {
  // Use CSS variables directly - they are updated by ThemeContext dynamically
  return {
    primary: 'text-text-primary',
    secondary: 'text-text-secondary',
    tertiary: 'text-text-tertiary',
    onMint: 'text-text-on-mint',
  };
}

/**
 * Hook React para usar cores de texto adaptativas
 */
export function useTextColor() {
  const { theme } = useTheme();
  return getTextColors(theme);
}