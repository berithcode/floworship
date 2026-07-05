import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

type Theme = 'dark' | 'light';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const darkTokens = {
  '--color-bg-primary': '#000000',
  '--color-bg-secondary': '#0a0a0a',
  '--color-bg-tertiary': '#121212',
  '--color-bg-card-white': '#FFFFFF',
  '--color-bg-card-gray-light': '#E0E0E0',
  '--color-bg-card-gray-dark': '#171717',
  '--color-bg-card-mint': '#21F1A8',
  '--color-text-primary': '#FFFFFF',
  '--color-text-secondary': '#E0E0E0',
  '--color-text-tertiary': '#A3A3A3',
  '--color-text-on-mint': '#000000',
  '--color-border-subtle': '#262626',
  '--color-border-strong': '#333333',
  '--color-accent-mint': '#21F1A8',
  '--color-accent-mint-dim': 'rgba(33, 241, 168, 0.15)',
  '--color-success': '#3DDC97',
  '--color-warning': '#FFB648',
  '--color-danger': '#FF5C5C',
  '--color-info': '#4A9EFF',
};

const lightTokens = {
  '--color-bg-primary': '#F5F5F0',
  '--color-bg-secondary': '#FFFFFF',
  '--color-bg-tertiary': '#E8E8E3',
  '--color-bg-card-white': '#FFFFFF',
  '--color-bg-card-gray-light': '#F0F0EB',
  '--color-bg-card-gray-dark': '#FFFFFF',
  '--color-bg-card-mint': '#B8E844',
  '--color-text-primary': '#0A0A0A',
  '--color-text-secondary': '#262626',
  '--color-text-tertiary': '#525252',
  '--color-text-on-mint': '#0A0A0A',
  '--color-border-subtle': '#E0E0D8',
  '--color-border-strong': '#C8C8C0',
  '--color-accent-mint': '#B8E844',
  '--color-accent-mint-dim': 'rgba(184, 232, 68, 0.15)',
  '--color-success': '#4CAF50',
  '--color-warning': '#FFC107',
  '--color-danger': '#F44336',
  '--color-info': '#2196F3',
};

function applyTokens(tokens: Record<string, string>, theme: Theme) {
  const root = document.documentElement;
  Object.entries(tokens).forEach(([key, value]) => {
    root.style.setProperty(key, value);
  });
  document.body.style.backgroundColor = tokens['--color-bg-primary'];
  root.style.backgroundColor = tokens['--color-bg-primary'];
  root.setAttribute('data-theme', theme);
  document.body.setAttribute('data-theme', theme);

  // Update favicon based on theme
  const favicon = document.getElementById('favicon') as HTMLLinkElement;
  if (favicon) {
    favicon.href = theme === 'dark' ? '/logo-dark.svg' : '/logo-light.svg';
  }
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('theme') as Theme) || 'dark';
    }
    return 'dark';
  });
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // Apply the saved theme on init (not always dark)
    const savedTheme = (localStorage.getItem('theme') as Theme) || 'dark';
    const tokens = savedTheme === 'dark' ? darkTokens : lightTokens;
    applyTokens(tokens, savedTheme);
    setIsInitialized(true);
  }, []);

  useEffect(() => {
    if (!isInitialized) return;

    const tokens = theme === 'dark' ? darkTokens : lightTokens;
    applyTokens(tokens, theme);
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