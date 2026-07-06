import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ProfileHeader } from '../../components/profile/ProfileHeader';
import { InstrumentSelector } from '../../components/profile/InstrumentSelector';
import { AvailabilityCycle } from '../../components/profile/AvailabilityCycle';
import { ParticipationHistory } from '../../components/profile/ParticipationHistory';
import { apiFetch } from '../../services/api';
import type { Instrument } from '../../components/profile/InstrumentSelector';
import { Card } from '../../components/ui/Card';

const API_URL = import.meta.env.VITE_API_URL || '/api';

export function ProfilePage() {
  const { user, refresh } = useAuth();
  const [loading, setLoading] = useState(true);
  const [instrument, setInstrument] = useState<Instrument | null>(null);
  const [myAssignments, setMyAssignments] = useState<any[]>([]);

  useEffect(() => {
    if (user) {
      loadProfile();
    }
  }, [user]);

  const loadProfile = async () => {
    setLoading(true);
    try {
      const res = await apiFetch(`${API_URL}/profile/me`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setInstrument(data.instrument);
        setMyAssignments(data.myAssignments || []);
      }
    } catch {
      setInstrument(null);
      setMyAssignments([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveInstrument = async (newInstrument: Instrument) => {
    try {
      await apiFetch(`${API_URL}/profile/me`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
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
        <div className="w-8 h-8 rounded-full border-2 border-accent-mint border-t-transparent animate-spin" />
      </div>
    );
  }

  const ministryName = user?.ministries?.[0]?.ministryId;

  return (
    <div className="space-y-6 p-4 md:p-6 max-w-4xl mx-auto">
      <ProfileHeader
        name={user?.name || 'Usuário'}
        email={user?.email || ''}
        role={user?.ministries?.[0]?.role || 'musician'}
        ministryName={ministryName}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card variant="gray-dark" padding="lg">
          <InstrumentSelector
            currentInstrument={instrument}
            onSave={handleSaveInstrument}
          />
        </Card>

        <Card variant="gray-dark" padding="lg">
          <AvailabilityCycle />
        </Card>
      </div>

      <Card variant="gray-dark" padding="lg">
        <ParticipationHistory assignments={myAssignments} />
      </Card>
    </div>
  );
}