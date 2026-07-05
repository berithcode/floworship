import { Outlet } from 'react-router-dom';
import { Background } from '../ui/Background';
import { DashboardLayout } from './DashboardLayout';
import { Sidebar } from './Sidebar';
import { MusicianLayout } from './MusicianLayout';
import { useRole } from '../../hooks/useRole';

/**
 * Shell inteligente que escolhe o layout adequado conforme o role:
 *
 * - Admin/Operator → AppShell web clássico (sidebar fixa + background sólido)
 * - Musician → MusicianLayout mobile-first (bottom nav + header)
 */
export function AppShell() {
  const { isMusician } = useRole();

  if (isMusician) {
    return <MusicianLayout />;
  }

  return (
    <Background className="min-h-screen">
      <DashboardLayout sidebar={<Sidebar />} main={<Outlet />} />
    </Background>
  );
}