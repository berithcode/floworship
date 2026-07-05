export const colors = {
  bgPrimary: '#121214',
  bgCard: '#1E1E22',
  bgCardElevated: '#26262C',
  accentPrimary: '#6C5CE7',
  accentSecondary: '#4A9EFF',
  textPrimary: '#FFFFFF',
  textSecondary: '#9A9AA2',
  success: '#3DDC97',
  warning: '#FFB648',
  danger: '#FF5C5C',
} as const;

export const spacing = {
  1: 8,
  2: 16,
  3: 24,
  4: 32,
} as const;

export const radii = {
  card: 20,
  pill: 999,
} as const;

export type Colors = typeof colors;
export type Spacing = typeof spacing;
export type Radii = typeof radii;