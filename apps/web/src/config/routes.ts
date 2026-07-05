export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  SELECT_MINISTRY: '/select-ministry',
  DASHBOARD: '/dashboard',
  LIBRARY: '/library',
  LIBRARY_NEW: '/library/new',
  LIBRARY_DETAIL: '/library/:songId',
  LIBRARY_STUDY: '/library/:songId/study',
  SESSION_OPERADOR: '/session/:sessionId/operador',
  SESSION_LETRA: '/session/:sessionId/letra',
  SESSION_CIFRA: '/session/:sessionId/cifra',
  SESSION_TV: '/session/:sessionId/tv',
  SESSION_END: '/session/end',
  SCHEDULES: '/schedules',
  SCHEDULES_ADMIN: '/schedules/admin',
  CHAT: '/chat',
  SETTINGS: '/settings',
  PROFILE: '/profile',
} as const;

export type RoutePath = typeof ROUTES[keyof typeof ROUTES];

export const NAV_GROUPS = [
  {
    label: 'Visao Geral',
    items: [
      { label: 'Dashboard', path: ROUTES.DASHBOARD, icon: 'home' },
    ],
  },
  {
    label: 'Repertorio',
    items: [
      { label: 'Musicas', path: ROUTES.LIBRARY, icon: 'music' },
    ],
  },
  {
    label: 'Escalas',
    items: [
      { label: 'Escalas do Mes', path: ROUTES.SCHEDULES, icon: 'calendar' },
    ],
  },
  {
    label: 'Ao Vivo',
    items: [
      { label: 'Sessao', path: '/session', icon: 'play' },
    ],
  },
  {
    label: 'Comunicacao',
    items: [
      { label: 'Chat', path: ROUTES.CHAT, icon: 'chat' },
    ],
  },
  {
    label: 'Configuracoes',
    items: [
      { label: 'Configuracoes', path: ROUTES.SETTINGS, icon: 'settings' },
      { label: 'Perfil', path: ROUTES.PROFILE, icon: 'user' },
    ],
  },
];