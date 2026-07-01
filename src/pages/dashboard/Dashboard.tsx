import type { FC } from 'react';
import './Dashboard.css';

interface DashboardProps {
  userName?: string;
}

export const Dashboard: FC<DashboardProps> = ({ userName }) => {
  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1 className="dashboard-greeting">
          {userName ? `Hello, ${userName}` : 'Welcome'}
        </h1>
        <p className="dashboard-subtitle">Floworship</p>
      </header>

      <main className="dashboard-content">
        <div className="dashboard-section">
          <h2 className="dashboard-section-title">Quick Actions</h2>
          <div className="dashboard-quick-actions">
            <button className="dashboard-action-card">
              <span className="dashboard-action-icon">🎵</span>
              <span className="dashboard-action-label">Songs</span>
            </button>
            <button className="dashboard-action-card">
              <span className="dashboard-action-icon">📋</span>
              <span className="dashboard-action-label">Setlists</span>
            </button>
            <button className="dashboard-action-card">
              <span className="dashboard-action-icon">📅</span>
              <span className="dashboard-action-label">Schedule</span>
            </button>
            <button className="dashboard-action-card">
              <span className="dashboard-action-icon">🎸</span>
              <span className="dashboard-action-label">Rehearsals</span>
            </button>
          </div>
        </div>

        <div className="dashboard-section">
          <h2 className="dashboard-section-title">Audio Tools</h2>
          <div className="dashboard-quick-actions">
            <button className="dashboard-action-card">
              <span className="dashboard-action-icon">🎛️</span>
              <span className="dashboard-action-label">Tuner</span>
            </button>
            <button className="dashboard-action-card">
              <span className="dashboard-action-icon">⏱️</span>
              <span className="dashboard-action-label">Metronome</span>
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}