import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useParams } from 'react-router-dom';
import { AuthProvider } from './context/AuthProvider';
import { useAuth } from './context/AuthContext';
import { AppShell } from './components/layout/AppShell';

const LoginPage = lazy(() => import('./pages/auth/LoginPage').then(m => ({ default: m.LoginPage })));
const InviteAcceptPage = lazy(() => import('./pages/auth/InviteAcceptPage').then(m => ({ default: m.InviteAcceptPage })));
const MinistrySelector = lazy(() => import('./pages/dashboard/MinistrySelector').then(m => ({ default: m.MinistrySelector })));
const DashboardNew = lazy(() => import('./pages/dashboard/DashboardNew').then(m => ({ default: m.DashboardNew })));
const SongList = lazy(() => import('./pages/library/SongList').then(m => ({ default: m.SongList })));
const SongDetail = lazy(() => import('./pages/library/SongDetail').then(m => ({ default: m.SongDetail })));
const NewSong = lazy(() => import('./pages/library/NewSong').then(m => ({ default: m.NewSong })));
const ModoOperador = lazy(() => import('./pages/performance/ModoOperador').then(m => ({ default: m.ModoOperador })));
const ModoLetra = lazy(() => import('./pages/performance/ModoLetra').then(m => ({ default: m.ModoLetra })));
const ModoCifra = lazy(() => import('./pages/performance/ModoCifra').then(m => ({ default: m.ModoCifra })));
const ModoTV = lazy(() => import('./pages/performance/ModoTV').then(m => ({ default: m.ModoTV })));
const SessionEnd = lazy(() => import('./pages/performance/SessionEnd').then(m => ({ default: m.SessionEnd })));
const StudyMode = lazy(() => import('./pages/study/StudyMode').then(m => ({ default: m.StudyMode })));
const ScheduleDashboard = lazy(() => import('./pages/admin/ScheduleDashboard').then(m => ({ default: m.ScheduleDashboard })));
const MobileHome = lazy(() => import('./pages/mobile/MobileHome').then(m => ({ default: m.MobileHome })));
const ProfilePage = lazy(() => import('./pages/profile/ProfilePage').then(m => ({ default: m.ProfilePage })));
const SettingsPage = lazy(() => import('./pages/settings/SettingsPage').then(m => ({ default: m.SettingsPage })));
const ChatPage = lazy(() => import('./pages/chat/ChatPage').then(m => ({ default: m.ChatPage })));
const SessionLanding = lazy(() => import('./pages/session/SessionLanding').then(m => ({ default: m.SessionLanding })));
const ServiceToday = lazy(() => import('./pages/session/MySessionToday').then(m => ({ default: m.ServiceToday })));
const MySchedule = lazy(() => import('./pages/schedule/MySchedule').then(m => ({ default: m.MySchedule })));
const TeamPage = lazy(() => import('./pages/team/TeamPage').then(m => ({ default: m.TeamPage })));
const AdminReports = lazy(() => import('./pages/reports/AdminReports').then(m => ({ default: m.AdminReports })));

function RouteFallback() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-bg-dark" role="status">
      <div className="spinner-gradient" />
      <span className="sr-only">Carregando...</span>
    </div>
  );
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-bg-dark" role="status">
        <div className="spinner-gradient" />
        <span className="sr-only">Autenticando...</span>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!user.ministries?.length) {
    return <Navigate to="/select-ministry" replace />;
  }

  return <>{children}</>;
}

/**
 * Combina a checagem de autenticação/ministério com o AppShell (sidebar +
 * fundo). Usada como elemento de uma rota de layout — as rotas filhas
 * (ver AppRoutes abaixo) renderizam dentro do <Outlet/> do AppShell.
 */
function ProtectedShell() {
  return (
    <ProtectedRoute>
      <AppShell />
    </ProtectedRoute>
  );
}

function ModoOperadorRoute() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const { user } = useAuth();
  return <ModoOperador sessionId={sessionId || ''} ministryId={user?.ministries?.[0]?.ministryId || ''} />;
}

function ModoLetraRoute() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const { user } = useAuth();
  return <ModoLetra sessionId={sessionId || ''} ministryId={user?.ministries?.[0]?.ministryId || ''} />;
}

function ModoCifraRoute() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const { user } = useAuth();
  return <ModoCifra sessionId={sessionId || ''} ministryId={user?.ministries?.[0]?.ministryId || ''} />;
}

function ModoTVRoute() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const { user } = useAuth();
  return <ModoTV sessionId={sessionId || ''} ministryId={user?.ministries?.[0]?.ministryId || ''} />;
}

function AppRoutes() {
  return (
    <Suspense fallback={<RouteFallback />}>
      <Routes>
        {/* Sem shell: login e seleção de ministério (usuário ainda não tem
            contexto de ministério pra mostrar sidebar) */}
        <Route
          path="/login"
          element={<LoginPage onLoginSuccess={() => window.location.href = '/dashboard'} />}
        />
        <Route path="/invite/:token" element={<InviteAcceptPage />} />
        <Route
          path="/select-ministry"
          element={
            <ProtectedRoute>
              <MinistrySelector onSelect={() => window.location.href = '/dashboard'} />
            </ProtectedRoute>
          }
        />

        {/* Sem shell: Mobile tem navegação própria (bottom nav, seção 6.2) */}
        <Route
          path="/mobile"
          element={
            <ProtectedRoute>
              <MobileHome />
            </ProtectedRoute>
          }
        />

        {/* Sem shell: sessão ao vivo é takeover de tela cheia por design —
            não deve ter sidebar/nav durante a execução (seção 6.2) */}
        <Route
          path="/session/:sessionId/operador"
          element={
            <ProtectedRoute>
              <ModoOperadorRoute />
            </ProtectedRoute>
          }
        />
        <Route
          path="/session/:sessionId/letra"
          element={
            <ProtectedRoute>
              <ModoLetraRoute />
            </ProtectedRoute>
          }
        />
        <Route
          path="/session/:sessionId/cifra"
          element={
            <ProtectedRoute>
              <ModoCifraRoute />
            </ProtectedRoute>
          }
        />
        <Route
          path="/session/:sessionId/tv"
          element={
            <ProtectedRoute>
              <ModoTVRoute />
            </ProtectedRoute>
          }
        />
        <Route path="/session/end" element={<SessionEnd />} />

        {/* Com shell (sidebar + fundo padrão) — todas as páginas "internas" */}
        <Route element={<ProtectedShell />}>
          <Route path="/dashboard" element={<DashboardNew />} />
          <Route path="/library" element={<SongList />} />
          <Route path="/library/new" element={<NewSong />} />
          <Route path="/library/:id" element={<SongDetail />} />
          <Route path="/library/:songId/study" element={<StudyMode />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/chat" element={<ChatPage />} />
          <Route path="/session" element={<SessionLanding />} />
          <Route path="/service/today" element={<ServiceToday />} />
          <Route path="/schedules" element={<ScheduleDashboard />} />
          <Route path="/my-schedule" element={<MySchedule />} />
          <Route path="/team" element={<TeamPage />} />
          <Route path="/reports" element={<AdminReports />} />
          <Route path="/profile" element={<ProfilePage />} />
        </Route>

        <Route path="/" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Suspense>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;