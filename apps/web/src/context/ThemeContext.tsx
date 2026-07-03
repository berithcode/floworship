import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

type Theme = 'dark' | 'light';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('dark');
  const [isInitialized, setIsInitialized] = useState(false);
  
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--bg-primary', '#000000');
    root.style.setProperty('--bg-secondary', '#000000');
    root.style.setProperty('--bg-tertiary', '#0a0a0a');
    root.style.setProperty('--text-primary', '#ffffff');
    root.style.setProperty('--text-secondary', '#a3a3a3');
    root.style.setProperty('--text-tertiary', '#737373');
    root.style.setProperty('--border', '#262626');
    root.style.setProperty('--brand-blue', '#3b82f6');
    root.style.setProperty('--brand-purple', '#a855f7');
    root.style.setProperty('--brand-orange', '#fb923c');
    root.style.setProperty('--brand-red', '#f43f5e');
    
    document.body.style.backgroundColor = '#000000';
    document.documentElement.setAttribute('data-theme', 'dark');
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem('theme') as Theme | null;
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    const initialTheme = stored || (prefersDark ? 'dark' : 'light');
    setThemeState(initialTheme);
    setIsInitialized(true);
  }, []);

  useEffect(() => {
    if (!isInitialized) return;
    
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme, isInitialized]);

  const toggleTheme = () => {
    setThemeState(prev => prev === 'dark' ? 'light' : 'dark');
  };

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  
  return context;
}