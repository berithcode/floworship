import { useAuth } from '../context/AuthContext';

export type Role = 'admin' | 'operator' | 'musician';

export function useRole() {
  const { user } = useAuth();

  const role: Role = user?.ministries?.[0]?.role as Role || 'musician';
  const isAdmin = role === 'admin';
  const isOperator = role === 'operator';
  const isMusician = role === 'musician';
  const canManage = isAdmin || isOperator;

  return { role, isAdmin, isOperator, isMusician, canManage };
}
