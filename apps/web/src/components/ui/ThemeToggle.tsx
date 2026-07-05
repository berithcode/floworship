import { useTheme } from '../../context/ThemeContext';
import { memo } from 'react';
import { Moon, Sun } from 'lucide-react';
import { Button } from '../ui/Button';

export const ThemeToggle = memo(function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <Button
      variant="subtle"
      size="sm"
      icon={theme === 'dark' ? Sun : Moon}
      onClick={toggleTheme}
      aria-label={theme === 'dark' ? 'Mudar para tema claro' : 'Mudar para tema escuro'}
      title={theme === 'dark' ? 'Mudar para tema claro' : 'Mudar para tema escuro'}
    >
      {theme === 'dark' ? 'Light' : 'Dark'}
    </Button>
  );
});