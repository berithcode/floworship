import { useState, useEffect } from 'react';
import { SundayCard } from '../../components/schedule/SundayCard';
import './ScheduleDashboard.css';

interface Cycle {
  id: string;
  status: string;
  month: number;
  year: number;
}

interface Assignment {
  id: string;
  role: string;
  musicianId: string | null;
  status: string;
}

interface Sunday {
  id: string;
  date: string;
  assignments: Assignment[];
}

export function ScheduleDashboard() {
  const [cycle, setCycle] = useState<Cycle | null>(null);
  const [sundays, setSundays] = useState<Sunday[]>([]);

  useEffect(() => {
    loadCycle();
  }, []);

  const loadCycle = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/schedules/cycles/current`, {
        credentials: 'include',
      });
      if (res.ok) {
        const data = await res.json();
        setCycle(data.cycle);
        setSundays(data.sundays);
      }
    } catch {
      // ignore
    }
  };

  return (
    <div className="schedule-dashboard">
      <header className="schedule-dashboard__header">
        <h1 className="schedule-dashboard__title">Escalas do Mes</h1>
        {cycle && (
          <span className={`schedule-dashboard__status schedule-dashboard__status--${cycle.status}`}>
            {cycle.status.replace(/_/g, ' ')}
          </span>
        )}
      </header>

      <div className="schedule-dashboard__sundays">
        {sundays.map((sunday) => (
          <SundayCard key={sunday.id} sunday={sunday} />
        ))}
      </div>
    </div>
  );
}