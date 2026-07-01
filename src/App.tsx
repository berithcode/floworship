import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { LoginPage } from './pages/auth/LoginPage';
import { MinistrySelector } from './pages/dashboard/MinistrySelector';
import { Dashboard } from './pages/dashboard/Dashboard';

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
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;