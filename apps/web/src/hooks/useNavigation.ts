import { useLocation } from 'react-router-dom';
import { NAV_GROUPS } from '../config/routes';

export function useNavigation() {
  const location = useLocation();

  const activeItem = NAV_GROUPS.flatMap((g) => g.items).find((item) =>
    location.pathname.startsWith(item.path)
  );

  const activeGroup = NAV_GROUPS.find((g) =>
    g.items.some((item) => location.pathname.startsWith(item.path))
  );

  return {
    activeItem,
    activeGroup,
    currentPath: location.pathname,
  };
}