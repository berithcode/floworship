import { useState } from 'react';
import './SongForm.css';

export interface SongFormData {
  title: string;
  artist: string;
  defaultKey: string;
  tags: string;
  notes: string;
  status: string;
}

interface SongFormProps {
  initialData?: Partial<SongFormData>;
  onSubmit: (data: SongFormData) => Promise<void>;
  submitLabel?: string;
}

const KEYS = ['C', 'C#', 'Db', 'D', 'D#', 'Eb', 'E', 'F', 'F#', 'Gb', 'G', 'G#', 'Ab', 'A', 'A#', 'Bb', 'B'];

export function SongForm({ initialData, onSubmit, submitLabel = 'Save' }: SongFormProps) {
  const [form, setForm] = useState<SongFormData>({
    title: initialData?.title || '',
    artist: initialData?.artist || '',
    defaultKey: initialData?.defaultKey || '',
    tags: initialData?.tags || '',
    notes: initialData?.notes || '',
    status: initialData?.status || 'rascunho',
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.title.trim()) errs.title = 'Title is required';
    if (!form.defaultKey) errs.defaultKey = 'Key is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      await onSubmit({
        ...form,
        tags: form.tags ? JSON.stringify(form.tags.split(',').map((t) => t.trim())) : '[]',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="song-form">
      <div className="form-group">
        <label className="form-label">Title *</label>
        <input
          type="text"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          className={`form-input ${errors.title ? 'form-input-error' : ''}`}
          placeholder="Song title"
        />
        {errors.title && <span className="form-error">{errors.title}</span>}
      </div>

      <div className="form-group">
        <label className="form-label">Artist</label>
        <input
          type="text"
          value={form.artist}
          onChange={(e) => setForm({ ...form, artist: e.target.value })}
          className="form-input"
          placeholder="Artist name"
        />
      </div>

      <div className="form-group">
        <label className="form-label">Key *</label>
        <select
          value={form.defaultKey}
          onChange={(e) => setForm({ ...form, defaultKey: e.target.value })}
          className={`form-input ${errors.defaultKey ? 'form-input-error' : ''}`}
        >
          <option value="">Select key</option>
          {KEYS.map((k) => (
            <option key={k} value={k}>{k}</option>
          ))}
        </select>
        {errors.defaultKey && <span className="form-error">{errors.defaultKey}</span>}
      </div>

      <div className="form-group">
        <label className="form-label">Status</label>
        <select
          value={form.status}
          onChange={(e) => setForm({ ...form, status: e.target.value })}
          className="form-input"
        >
          <option value="rascunho">Draft</option>
          <option value="pronta">Ready</option>
          <option value="arquivada">Archived</option>
        </select>
      </div>

      <div className="form-group">
        <label className="form-label">Tags</label>
        <input
          type="text"
          value={form.tags}
          onChange={(e) => setForm({ ...form, tags: e.target.value })}
          className="form-input"
          placeholder="worship, contemporary, slow"
        />
      </div>

      <div className="form-group">
        <label className="form-label">Notes</label>
        <textarea
          value={form.notes}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
          className="form-input form-textarea"
          placeholder="Additional notes..."
          rows={3}
        />
      </div>

      <button type="submit" className="song-form-submit" disabled={loading}>
        {loading ? 'Saving...' : submitLabel}
      </button>
    </form>
  );
}