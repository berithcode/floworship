import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ProfileHeader } from '../../components/profile/ProfileHeader';
import { InstrumentSelector } from '../../components/profile/InstrumentSelector';
import { AvailabilityCycle } from '../../components/profile/AvailabilityCycle';
import { ParticipationHistory } from '../../components/profile/ParticipationHistory';
import { PresenceChart } from '../../components/profile/PresenceChart';
import { DistributionChart } from '../../components/profile/DistributionChart';
import { apiFetch } from '../../services/api';
import type { Instrument } from '../../components/profile/InstrumentSelector';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export function ProfilePage() {
  const { user, refresh } = useAuth();
  const [loading, setLoading] = useState(true);
  const [instrument, setInstrument] = useState<Instrument | null>(null);
  const [presence, setPresence] = useState({ confirmed: 0, total: 0 });
  const [distribution, setDistribution] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);

  useEffect(() => {
    if (user) {
      loadProfile();
    }
  }, [user]);

  const loadProfile = async () => {
    setLoading(true);
    try {
      const res = await apiFetch(`${API_URL}/profile/me`);
      if (res.ok) {
        const data = await res.json();
        setInstrument(data.instrument);
        setPresence(data.presence || { confirmed: 0, total: 0 });
        setDistribution(data.distribution || []);
        setAssignments(data.assignments || []);
      }
    } catch {
      setPresence({ confirmed: 0, total: 0 });
      setDistribution([]);
      setAssignments([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveInstrument = async (newInstrument: Instrument) => {
    try {
      await apiFetch(`${API_URL}/profile/me`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ instrument: newInstrument }),
      });
      setInstrument(newInstrument);
      refresh();
    } catch (err) {
      console.error('Failed to save instrument', err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 rounded-full border-2 border-brand-purple border-t-transparent animate-spin" />
      </div>
    );
  }

  const ministryName = user?.ministries?.[0]?.ministryId;

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="max-w-4xl mx-auto">
        <ProfileHeader
          name={user?.name || 'Usuário'}
          email={user?.email || ''}
          role={user?.ministries?.[0]?.role || 'musician'}
          ministryName={ministryName}
        />
      </div>

      <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-6">
          <div className="p-6 bg-white/5 rounded-2xl border border-white/10">
            <InstrumentSelector
              currentInstrument={instrument}
              onSave={handleSaveInstrument}
            />
          </div>

          <div className="p-6 bg-white/5 rounded-2xl border border-white/10">
            <AvailabilityCycle />
          </div>
        </div>

        <div className="space-y-6">
          <PresenceChart
            confirmed={presence.confirmed}
            total={presence.total}
          />

          <DistributionChart distribution={distribution} />
        </div>
      </div>

      <div className="max-w-4xl mx-auto">
        <div className="p-6 bg-white/5 rounded-2xl border border-white/10">
          <ParticipationHistory assignments={assignments} />
        </div>
      </div>
    </div>
  );
}