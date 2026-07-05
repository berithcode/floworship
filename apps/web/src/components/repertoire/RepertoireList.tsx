
import { useState, useEffect, useCallback, memo } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Music, Plus, Trash2, X, Loader2 } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

interface RepertoireItem {
  id: string;
  songId: string;
  order: number;
  keyOverride: string | null;
  song: {
    id: string;
    title: string;
    artist: string | null;
    defaultKey: string | null;
  };
}

interface RepertoireListProps {
  scheduleId: string;
  canEdit?: boolean;
}

function SortableItem({ item, onRemove }: { item: RepertoireItem; onRemove: (id: string) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 px-4 py-3 bg-white/5 rounded-xl hover:bg-white/10 transition-colors"
    >
      <button
        {...attributes}
        {...listeners}
        className="w-8 h-8 flex items-center justify-center cursor-grab active:cursor-grabbing"
        aria-label="Arrastar"
      >
        <GripVertical className="w-4 h-4 text-text-primary/50" strokeWidth={1.5} />
      </button>
      <div className="w-6 h-6 rounded-full bg-brand-purple/20 flex items-center justify-center shrink-0">
        <Music className="w-3 h-3 text-brand-purple" strokeWidth={1.5} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-text-primary truncate">{item.song.title}</p>
        <p className="text-xs text-text-primary/50 truncate">
          {item.song.artist || 'Sem artista'}
          {item.keyOverride && ` • Tom: ${item.keyOverride}`}
          {!item.keyOverride && item.song.defaultKey && ` • Tom: ${item.song.defaultKey}`}
        </p>
      </div>
      <button
        onClick={() => onRemove(item.id)}
        className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-error/20 transition-colors"
        aria-label="Remover"
      >
        <Trash2 className="w-3.5 h-3.5 text-error" strokeWidth={1.5} />
      </button>
    </div>
  );
}

export const RepertoireList = memo(function RepertoireList({ scheduleId, canEdit = true }: RepertoireListProps) {
  const [items, setItems] = useState<RepertoireItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [showAddPanel, setShowAddPanel] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  useEffect(() => { fetchRepertoire(); }, [scheduleId]);

  const fetchRepertoire = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/schedules/${scheduleId}/repertoire`, {
        credentials: 'include',
      });
      if (res.ok) {
        setItems(await res.json());
      }
    } catch {
      setError('Erro ao carregar repertório');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(`${API_URL}/songs?search=${encodeURIComponent(searchQuery)}`, {
          credentials: 'include',
        });
        if (res.ok) {
          const songs = await res.json();
          setSearchResults(
            songs
              .filter((s: any) => s.status === 'pronta')
              .map((s: any) => ({ id: s.id, title: s.title, artist: s.artist, defaultKey: s.defaultKey }))
          );
        }
      } catch {
        // ignore
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, scheduleId]);

  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = items.findIndex(i => i.id === active.id);
    const newIndex = items.findIndex(i => i.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = arrayMove(items, oldIndex, newIndex).map((item, i) => ({
      ...item,
      order: i,
    }));
    setItems(reordered);

    setSaving(true);
    try {
      await fetch(`${API_URL}/schedules/${scheduleId}/repertoire/reorder`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          items: reordered.map((item, i) => ({ itemId: item.id, order: i })),
        }),
      });
    } catch {
      fetchRepertoire();
    } finally {
      setSaving(false);
    }
  }, [items, scheduleId]);

  const handleAdd = useCallback(async (songId: string) => {
    try {
      const res = await fetch(`${API_URL}/schedules/${scheduleId}/repertoire`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ songId, order: items.length }),
      });
      if (res.ok) {
        const newItem = await res.json();
        setItems(prev => [...prev, newItem]);
      }
    } catch {
      // ignore
    }
  }, [scheduleId, items.length]);

  const handleRemove = useCallback(async (itemId: string) => {
    try {
      await fetch(`${API_URL}/schedules/${scheduleId}/repertoire/${itemId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      setItems(prev => prev.filter(i => i.id !== itemId));
    } catch {
      // ignore
    }
  }, [scheduleId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <Loader2 className="w-6 h-6 text-brand-purple animate-spin" strokeWidth={1.5} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-32 text-error text-sm">{error}</div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-text-primary/70 text-sm font-medium">
          Repertório ({items.length})
        </h3>
        {canEdit && (
          <button
            onClick={() => setShowAddPanel(!showAddPanel)}
            className="flex items-center gap-1 text-xs text-brand-blue hover:text-blue-400 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" strokeWidth={1.5} />
            Adicionar música
          </button>
        )}
      </div>

      {showAddPanel && (
        <div className="p-3 bg-white/5 rounded-xl space-y-2">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Buscar música por nome..."
              className="flex-1 bg-transparent border border-white/10 rounded-lg px-3 py-2 text-sm text-text-primary placeholder-text-tertiary focus:outline-none focus:border-brand-blue"
              autoFocus
            />
            <button
              onClick={() => { setShowAddPanel(false); setSearchQuery(''); }}
              className="w-8 h-8 flex items-center justify-center text-text-primary/70 hover:text-text-primary"
            >
              <X className="w-4 h-4" strokeWidth={1.5} />
            </button>
          </div>
          {searching ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="w-5 h-5 text-brand-purple animate-spin" strokeWidth={1.5} />
            </div>
          ) : searchResults.length > 0 ? (
            <div className="max-h-[200px] overflow-y-auto space-y-1">
              {searchResults.map(song => (
                <button
                  key={song.id}
                  onClick={() => { handleAdd(song.id); setSearchQuery(''); setSearchResults([]); }}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/10 transition-colors text-left"
                >
                  <Music className="w-4 h-4 text-text-primary/50 shrink-0" strokeWidth={1.5} />
                  <div className="min-w-0">
                    <p className="text-sm text-text-primary truncate">{song.title}</p>
                    {song.artist && (
                      <p className="text-xs text-text-primary/50 truncate">{song.artist}</p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          ) : searchQuery.trim() ? (
            <p className="text-text-primary/50 text-sm text-center py-4">Nenhuma música encontrada</p>
          ) : (
            <p className="text-text-primary/50 text-xs text-center py-4">Digite para buscar músicas com status "pronta"</p>
          )}
        </div>
      )}

      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-32 gap-2">
          <Music className="w-8 h-8 text-text-primary/50" strokeWidth={1.5} />
          <p className="text-text-primary/50 text-sm">Nenhuma música no repertório</p>
          {canEdit && (
            <button
              onClick={() => setShowAddPanel(true)}
              className="text-xs text-brand-blue hover:text-blue-400 transition-colors"
            >
              Adicionar primeira música
            </button>
          )}
        </div>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={items.map(i => i.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-1">
              {items.map(item => (
                <SortableItem key={item.id} item={item} onRemove={handleRemove} />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {saving && (
        <p className="text-text-primary/50 text-xs text-center">Salvando ordem...</p>
      )}
    </div>
  );
});
