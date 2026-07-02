export function isStandalone(): boolean {
  if (typeof window === 'undefined') return false;

  if ('standalone' in navigator && (navigator as Record<string, unknown>).standalone === true) {
    return true;
  }

  if (window.matchMedia('(display-mode: standalone)').matches) {
    return true;
  }

  return false;
}