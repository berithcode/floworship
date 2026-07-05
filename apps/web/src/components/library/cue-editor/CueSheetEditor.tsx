
import { useState, useCallback, useRef, memo } from 'react';
import { Save, Loader2, PenTool, Eye } from 'lucide-react';
import { BlockManager } from './BlockManager';
import { ChordProPreview } from './ChordProPreview';
import { apiFetch } from '../../../services/api';
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

interface CueBlock {
  id: string;
  label: string;
  startTime: number;
  endTime: number;
  duration: number;
  chordproContent: string | null;
  order: number;
}

interface InitialCueSheet {
  blocks?: CueBlock[];
}

interface CueSheetEditorProps {
  songId: string;
  initialCueSheet?: InitialCueSheet | null;
  onSaved?: () => void;
}

export const CueSheetEditor = memo(function CueSheetEditor({
  songId,
  initialCueSheet,
  onSaved
}: CueSheetEditorProps) {
  const [blocks, setBlocks] = useState<CueBlock[]>(
    initialCueSheet?.blocks?.map(b => ({ ...b })) ?? []
  );
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [transposeValue, setTransposeValue] = useState(0);
  const [editorTab, setEditorTab] = useState<'edit' | 'preview'>('edit');
  const [previewMode, setPreviewMode] = useState<'cifra' | 'letra'>('cifra');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const blockIdCounter = useRef(Date.now());

  const selectedBlock = selectedId ? blocks.find(b => b.id === selectedId) ?? null : null;

  const handleAddBlock = useCallback((block: { label: string; startTime: number; endTime: number; duration: number; chordproContent?: string | null; order: number }) => {
    const newBlock: CueBlock = { ...block, chordproContent: block.chordproContent ?? '', id: `new-${blockIdCounter.current++}` };
    setBlocks(prev => [...prev, newBlock].sort((a, b) => a.startTime - b.startTime));
  }, []);

  const handleUpdateBlock = useCallback((id: string, data: Partial<CueBlock>) => {
    setBlocks(prev => prev.map(b => b.id === id ? { ...b, ...data } : b));
  }, []);

  const handleDeleteBlock = useCallback((id: string) => {
    setBlocks(prev => prev.filter(b => b.id !== id));
    if (selectedId === id) setSelectedId(null);
  }, [selectedId]);

  const handleSave = useCallback(async () => {
    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const res = await apiFetch(`${API_URL}/songs/${songId}/cue-sheet`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          blocks: blocks.map((b, i) => ({
            label: b.label,
            startTime: b.startTime,
            endTime: b.endTime,
            duration: b.duration,
            chordproContent: b.chordproContent,
            order: i,
          })),
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Erro ao salvar' }));
        throw new Error(err.error || 'Erro ao salvar');
      }

      const result = await res.json();
      setSuccess(true);
      setBlocks(result.blocks?.map((b: any) => ({ ...b })) ?? []);
      onSaved?.();
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar');
    } finally {
      setSaving(false);
    }
  }, [songId, blocks, onSaved]);

  const handleTransposeChange = useCallback((delta: number) => {
    setTransposeValue(prev => prev + delta);
  }, []);

  return (
    <div className="flex flex-col gap-4">
      {/* Main content: Blocks list (left) + ChordPro editor (right) */}
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Left column: Block list */}
        <div className="lg:w-96 shrink-0">
          <BlockManager
            blocks={blocks}
            selectedId={selectedId}
            onAdd={handleAddBlock}
            onUpdate={handleUpdateBlock}
            onDelete={handleDeleteBlock}
            onSelect={setSelectedId}
          />

          {/* Save area */}
          <div className="flex items-center gap-3 mt-4">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-6 py-2 bg-brand-blue text-white text-sm font-medium rounded-xl hover:bg-blue-600 transition-colors disabled:opacity-50"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" strokeWidth={1.5} />
              ) : (
                <Save className="w-4 h-4" strokeWidth={1.5} />
              )}
              {saving ? 'Salvando...' : 'Salvar'}
            </button>

            {success && (
              <span className="text-green-400 text-sm">Salvo com sucesso!</span>
            )}

            {error && (
              <span className="text-error text-sm">{error}</span>
            )}

            <span className="text-text-primary/50 text-xs ml-auto">
              {blocks.length} bloco{blocks.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>

        {/* Right column: ChordPro editor */}
        <div className="flex-1 min-w-0">
          {selectedBlock ? (
            <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
              {/* Tab bar */}
              <div className="flex items-center border-b border-white/10">
                <button
                  onClick={() => setEditorTab('edit')}
                  className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium transition-colors ${
                    editorTab === 'edit'
                      ? 'text-accent-mint border-b-2 border-accent-mint'
                      : 'text-text-primary/50 hover:text-text-primary'
                  }`}
                >
                  <PenTool className="w-3.5 h-3.5" strokeWidth={1.5} />
                  Editar
                </button>
                <button
                  onClick={() => setEditorTab('preview')}
                  className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium transition-colors ${
                    editorTab === 'preview'
                      ? 'text-accent-mint border-b-2 border-accent-mint'
                      : 'text-text-primary/50 hover:text-text-primary'
                  }`}
                >
                  <Eye className="w-3.5 h-3.5" strokeWidth={1.5} />
                  Preview
                </button>
              </div>

              {/* Tab content */}
              <div className="p-4">
                {editorTab === 'edit' ? (
                  <textarea
                    value={selectedBlock.chordproContent ?? ''}
                    onChange={e => handleUpdateBlock(selectedBlock.id, { chordproContent: e.target.value })}
                    placeholder={`Cole a cifra aqui no formato Cifra Club:\n\n        C\nEu não vou deixar\n        C4\nEu não vou trocar\n\nOu use colchetes: [C]Eu não vou [Am]deixar`}
                    className="w-full h-80 bg-transparent border border-white/10 rounded-xl p-4 text-sm font-mono text-text-primary placeholder-text-tertiary focus:outline-none focus:border-brand-blue resize-y"
                    style={{ fontFamily: 'JetBrains Mono, monospace' }}
                    spellCheck={false}
                  />
                ) : (
                  <ChordProPreview
                    chordproContent={selectedBlock.chordproContent}
                    transposeValue={transposeValue}
                    onTransposeChange={handleTransposeChange}
                    mode={previewMode}
                    onModeChange={setPreviewMode}
                  />
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-64 text-text-primary/50 text-sm bg-white/5 rounded-xl border border-white/5">
              {blocks.length > 0
                ? 'Selecione um bloco na lista ao lado para editar'
                : 'Crie um bloco primeiro para adicionar cifra e letra'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
});
