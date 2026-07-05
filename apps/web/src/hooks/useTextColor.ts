import { useTheme } from '../context/ThemeContext';

/**
 * Hook para cores de texto que se adaptam ao theme automaticamente.
 * 
 * @usage
 * const { primary, secondary, tertiary } = useTextColor();
 * 
 * <h1 className={primary}>Título</h1>
 * <p className={secondary}>Descrição</p>
 * <span className={tertiary}>Metadata</span>
 */
export function useTextColor() {
  const { theme } = useTheme();
  const isLight = theme === 'light';

  return {
    primary: isLight ? 'text-[#0A0A0A]' : 'text-text-primary',
    secondary: isLight ? 'text-[#0A0A0A]/70' : 'text-text-secondary',
    tertiary: isLight ? 'text-[#0A0A0A]/50' : 'text-text-tertiary',
    onMint: isLight ? 'text-[#0A0A0A]' : 'text-text-on-mint',
  };
}