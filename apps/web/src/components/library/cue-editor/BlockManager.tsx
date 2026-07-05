import { memo, useCallback, useState } from 'react';
import { Plus, Pencil, Trash2, GripVertical } from 'lucide-react';

interface Block {
  id: string;
  label: string;
  startTime: number;
  endTime: number;
  duration: number;
  chordproContent?: string | null;
  order: number;
}

interface BlockManagerProps {
  blocks: Block[];
  currentTime?: number;
  selectedId?: string | null;
  onAdd: (block: Omit<Block, 'id'>) => void;
  onUpdate: (id: string, data: Partial<Block>) => void;
  onDelete: (id: string) => void;
  onSelect: (id: string | null) => void;
}

function hasOverlap(blocks: Block[], newBlock: { startTime: number; endTime: number; excludeId?: string }): boolean {
  return blocks.some(b =>
    b.id !== newBlock.excludeId &&
    newBlock.startTime < b.endTime &&
    newBlock.endTime > b.startTime
  );
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toFixed(1).padStart(4, '0')}`;
}

function BlockItem({ block, currentTime, isSelected, onSelect, onEdit, onDelete }: {
  block: Block;
  currentTime?: number;
  isSelected?: boolean;
  onSelect: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const isActive = currentTime !== undefined &&
    currentTime >= block.startTime &&
    currentTime <= block.endTime;

  return (
    <div
      onClick={onSelect}
      className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors cursor-pointer ${
        isSelected
          ? 'bg-brand-blue/20 border border-brand-blue/30'
          : isActive
            ? 'bg-brand-purple/20 border border-brand-purple/30'
            : 'bg-white/5 hover:bg-white/10 border border-transparent'
      }`}
    >
      <GripVertical className="w-4 h-4 text-text-primary/50 shrink-0 cursor-grab" strokeWidth={1.5} />
      <div className="flex-1 min-w-0">
        <p className="text-text-primary text-sm font-medium truncate">{block.label}</p>
        <p className="text-text-primary/50 text-xs">
          {formatTime(block.startTime)} - {formatTime(block.endTime)}
        </p>
      </div>
      <span className="text-text-primary/50 text-xs">{block.duration.toFixed(1)}s</span>
      {block.chordproContent && block.chordproContent.trim() ? (
        <span className="text-accent-mint text-xs">✓</span>
      ) : (
        <span className="text-text-primary/30 text-xs">—</span>
      )}
      <button
        onClick={(e) => { e.stopPropagation(); onEdit(); }}
        className="w-7 h-7 rounded-md flex items-center justify-center hover:bg-white/10 transition-colors"
        aria-label="Editar bloco"
      >
        <Pencil className="w-3.5 h-3.5 text-text-primary/70" strokeWidth={1.5} />
      </button>
      <button
        onClick={(e) => { e.stopPropagation(); onDelete(); }}
        className="w-7 h-7 rounded-md flex items-center justify-center hover:bg-error/20 transition-colors"
        aria-label="Remover bloco"
      >
        <Trash2 className="w-3.5 h-3.5 text-error" strokeWidth={1.5} />
      </button>
    </div>
  );
}

export const BlockManager = memo(function BlockManager({
  blocks,
  currentTime,
  selectedId,
  onAdd,
  onUpdate,
  onDelete,
  onSelect
}: BlockManagerProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newLabel, setNewLabel] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [editLabel, setEditLabel] = useState('');
  const [editStart, setEditStart] = useState(0);
  const [editEnd, setEditEnd] = useState(0);

  const handleAdd = useCallback(() => {
    if (!newLabel.trim()) return;
    const lastBlock = blocks[blocks.length - 1];
    const startTime = lastBlock ? lastBlock.endTime : 0;
    const endTime = startTime + 30;

    if (hasOverlap(blocks, { startTime, endTime })) {
      return;
    }

    onAdd({
      label: newLabel.trim(),
      startTime,
      endTime,
      duration: endTime - startTime,
      chordproContent: '',
      order: blocks.length
    });
    setNewLabel('');
    setShowAdd(false);
  }, [newLabel, blocks, onAdd]);

  const handleEdit = useCallback((block: Block) => {
    setEditingId(block.id);
    setEditLabel(block.label);
    setEditStart(block.startTime);
    setEditEnd(block.endTime);
  }, []);

  const handleSaveEdit = useCallback((id: string) => {
    if (!editLabel.trim()) return;
    if (hasOverlap(blocks, { startTime: editStart, endTime: editEnd, excludeId: id })) {
      return;
    }
    onUpdate(id, {
      label: editLabel.trim(),
      startTime: editStart,
      endTime: editEnd,
      duration: editEnd - editStart
    });
    setEditingId(null);
  }, [editLabel, editStart, editEnd, blocks, onUpdate]);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h4 className="text-text-primary/70 text-sm font-medium">
          Blocos ({blocks.length})
        </h4>
        {!showAdd && (
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-1 text-xs text-brand-blue hover:text-blue-400 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" strokeWidth={1.5} />
            Novo bloco
          </button>
        )}
      </div>

      {showAdd && (
        <div className="flex flex-col gap-2 p-3 bg-white/5 rounded-lg">
          <input
            type="text"
            value={newLabel}
            onChange={e => setNewLabel(e.target.value)}
            placeholder="Nome do bloco (ex: Intro)"
            className="w-full bg-transparent border border-white/10 rounded-md px-2 py-1.5 text-sm text-text-primary placeholder-text-tertiary focus:outline-none focus:border-brand-blue"
            autoFocus
            onKeyDown={e => { if (e.key === 'Enter') handleAdd(); if (e.key === 'Escape') setShowAdd(false); }}
          />
          <div className="flex gap-2">
            <button
              onClick={handleAdd}
              className="px-4 py-1.5 bg-brand-blue text-white text-xs rounded-md hover:bg-blue-600 transition-colors"
            >
              Add
            </button>
            <button
              onClick={() => setShowAdd(false)}
              className="px-4 py-1.5 text-text-primary/70 text-xs hover:text-text-primary transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {blocks.length === 0 ? (
        <p className="text-text-primary/50 text-xs text-center py-4">
          Nenhum bloco criado. Clique em "Novo bloco" para adicionar.
        </p>
      ) : (
        <div className="space-y-1 max-h-[300px] overflow-y-auto">
          {blocks.map(block =>
            editingId === block.id ? (
              <div key={block.id} className="space-y-2 p-3 bg-white/5 rounded-lg">
                <input
                  type="text"
                  value={editLabel}
                  onChange={e => setEditLabel(e.target.value)}
                  className="w-full bg-transparent border border-white/10 rounded-md px-2 py-1.5 text-sm text-text-primary focus:outline-none focus:border-brand-blue"
                  autoFocus
                />
                <div className="flex gap-2">
                  <div className="flex-1">
                    <label className="text-xs text-text-primary/50">Início (s)</label>
                    <input
                      type="number"
                      value={editStart}
                      onChange={e => setEditStart(Number(e.target.value))}
                      step={0.1}
                      className="w-full bg-transparent border border-white/10 rounded-md px-2 py-1.5 text-sm text-text-primary focus:outline-none focus:border-brand-blue"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="text-xs text-text-primary/50">Fim (s)</label>
                    <input
                      type="number"
                      value={editEnd}
                      onChange={e => setEditEnd(Number(e.target.value))}
                      step={0.1}
                      className="w-full bg-transparent border border-white/10 rounded-md px-2 py-1.5 text-sm text-text-primary focus:outline-none focus:border-brand-blue"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleSaveEdit(block.id)}
                    className="px-4 py-1.5 bg-brand-blue text-white text-xs rounded-md hover:bg-blue-600 transition-colors"
                  >
                    Salvar
                  </button>
                  <button
                    onClick={() => setEditingId(null)}
                    className="px-4 py-1.5 text-text-primary/70 text-xs hover:text-text-primary transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
                {hasOverlap(blocks, { startTime: editStart, endTime: editEnd, excludeId: block.id }) && (
                  <p className="text-error text-xs">Blocos sobrepostos — ajuste os tempos</p>
                )}
              </div>
            ) : (
              <BlockItem
                key={block.id}
                block={block}
                currentTime={currentTime}
                isSelected={selectedId === block.id}
                onSelect={() => onSelect(selectedId === block.id ? null : block.id)}
                onEdit={() => handleEdit(block)}
                onDelete={() => onDelete(block.id)}
              />
            )
          )}
        </div>
      )}
    </div>
  );
});
