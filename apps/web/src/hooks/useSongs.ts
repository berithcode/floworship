import { useState, useEffect } from 'react';
import { apiFetch } from '../services/api';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4001/api';

export interface Song {
  id: string;
  title: string;
  artist: string | null;
  defaultKey: string | null;
  tags: string;
  status: string;
  notes: string | null;
  ministryId: string;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  cueSheet?: {
    id: string;
    totalDurationSeconds: number | null;
    blocks?: { id: string; label: string }[];
  } | null;
}

export function useSongs() {
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSongs = async () => {
    try {
      setLoading(true);
      const res = await apiFetch(`${API_URL}/songs`);
      if (!res.ok) throw new Error('Failed to fetch songs');
      const data = await res.json();
      setSongs(data);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSongs();
  }, []);

  const createSong = async (data: { title: string; artist?: string; defaultKey?: string; tags?: string[]; notes?: string }) => {
    const res = await apiFetch(`${API_URL}/songs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to create song');
    const song = await res.json();
    setSongs((prev) => [...prev, song]);
    return song;
  };

  const updateSong = async (id: string, data: Partial<Song>) => {
    const res = await apiFetch(`${API_URL}/songs/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update song');
    const updated = await res.json();
    setSongs((prev) => prev.map((s) => (s.id === id ? updated : s)));
    return updated;
  };

  const deleteSong = async (id: string) => {
    const res = await apiFetch(`${API_URL}/songs/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete song');
    setSongs((prev) => prev.filter((s) => s.id !== id));
  };

  const permanentDeleteSong = async (id: string) => {
    const res = await apiFetch(`${API_URL}/songs/${id}/permanent`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to permanently delete song');
    setSongs((prev) => prev.filter((s) => s.id !== id));
  };

  return { songs, loading, error, createSong, updateSong, deleteSong, permanentDeleteSong, refetch: fetchSongs };
}
