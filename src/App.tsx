import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { LoginPage } from './pages/auth/LoginPage';
import { MinistrySelector } from './pages/dashboard/MinistrySelector';
import { Dashboard } from './pages/dashboard/Dashboard';
import { SongList } from './pages/library/SongList';
import { SongDetail } from './pages/library/SongDetail';
import { NewSong } from './pages/library/NewSong';
import { ModoOperador } from './pages/performance/ModoOperador';
import { ModoLetra } from './pages/performance/ModoLetra';
import { ModoCifra } from './pages/performance/ModoCifra';
import { ModoTV } from './pages/performance/ModoTV';
import { SessionEnd } from './pages/performance/SessionEnd';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [hasMinistry, setHasMinistry] = useState<boolean | null>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/auth/me`, {
        credentials: 'include',
      });

      if (res.ok) {
        const data = await res.json();
        setHasMinistry(data.ministries?.length > 0);
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
      }
    } catch {
      setIsAuthenticated(false);
    }
  };

  if (isAuthenticated === null) {
    return <div className="loading-screen">Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!hasMinistry) {
    return <Navigate to="/select-ministry" replace />;
  }

  return <>{children}</>;
}

function AuthenticatedLayout() {
  const [userName, setUserName] = useState('');

  useEffect(() => {
    fetchUser();
  }, []);

  const fetchUser = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/auth/me`, {
        credentials: 'include',
      });
      if (res.ok) {
        const data = await res.json();
        setUserName(data.name || '');
      }
    } catch {
      // ignore
    }
  };

  return <Dashboard userName={userName} />;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={
            <LoginPage onLoginSuccess={() => window.location.href = '/dashboard'} />
          }
        />
        <Route
          path="/select-ministry"
          element={
            <ProtectedRoute>
              <MinistrySelector onSelect={() => window.location.href = '/dashboard'} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <AuthenticatedLayout />
            </ProtectedRoute>
          }
        />
        <Route
          path="/library"
          element={
            <ProtectedRoute>
              <SongList />
            </ProtectedRoute>
          }
        />
        <Route
          path="/library/new"
          element={
            <ProtectedRoute>
              <NewSong />
            </ProtectedRoute>
          }
        />
        <Route
          path="/library/:id"
          element={
            <ProtectedRoute>
              <SongDetail />
            </ProtectedRoute>
          }
        />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route
          path="/session/:sessionId/operador"
          element={
            <ProtectedRoute>
              <ModoOperador sessionId={window.location.pathname.split('/')[2]} ministryId="current" />
            </ProtectedRoute>
          }
        />
        <Route
          path="/session/:sessionId/letra"
          element={
            <ProtectedRoute>
              <ModoLetra sessionId={window.location.pathname.split('/')[2]} ministryId="current" />
            </ProtectedRoute>
          }
        />
        <Route
          path="/session/:sessionId/cifra"
          element={
            <ProtectedRoute>
              <ModoCifra sessionId={window.location.pathname.split('/')[2]} ministryId="current" />
            </ProtectedRoute>
          }
        />
        <Route
          path="/session/:sessionId/tv"
          element={
            <ProtectedRoute>
              <ModoTV sessionId={window.location.pathname.split('/')[2]} ministryId="current" />
            </ProtectedRoute>
          }
        />
        <Route path="/session/end" element={<SessionEnd />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;