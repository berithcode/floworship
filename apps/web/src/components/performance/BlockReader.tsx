
import { useMemo, useState } from 'react';
import { Lock } from 'lucide-react';
import { parseChordPro, renderCifra, renderLetra, transpose } from '../../services/chordpro/parser';

export interface ReaderBlock {
  id: string;
  label: string;
  chordproContent?: string | null;
}

interface BlockReaderProps {
  blocks: ReaderBlock[];
  index: number;
  mode: 'cifra' | 'letra';
  onModeChange: (mode: 'cifra' | 'letra') => void;
  locked?: boolean;
  onAdvance?: () => void;
  onBack?: () => void;
  onSelectBlock?: (index: number) => void;
  defaultKey?: string;
}

export function BlockReader({
  blocks,
  index,
  mode,
  onModeChange,
  locked = false,
  onAdvance,
  onSelectBlock,
  defaultKey,
}: BlockReaderProps) {
  const [transposeValue, setTransposeValue] = useState(0);

  const block = blocks[index];

  const rendered = useMemo(() => {
    if (!block?.chordproContent) return '';
    const parsed = transpose(parseChordPro(block.chordproContent), transposeValue);
    return mode === 'cifra' ? renderCifra(parsed) : renderLetra(parsed);
  }, [block?.chordproContent, mode, transposeValue]);

  const KEYS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const originalIdx = KEYS.indexOf(defaultKey || 'C');
  const currentKey = originalIdx >= 0 ? KEYS[(originalIdx + transposeValue + 12) % 12] : (defaultKey || '—');

  if (!block) {
    return (
      <div className="flex items-center justify-center h-64 text-text-primary/50 text-sm">
        Nenhum bloco disponível.
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full max-w-md mx-auto gap-1.5 flex-1 min-h-0">
      {/* Controles (Modo e Transposição) — compacto no topo */}
      <div className="flex items-center justify-between px-1 shrink-0">
        <div className="flex items-center gap-1">
          <button
            onClick={() => onModeChange('cifra')}
            className={`text-xs px-3 py-1 rounded-md transition-colors ${mode === 'cifra' ? 'bg-brand-purple/20 text-brand-purple' : 'text-white/50 bg-white/5'}`}
          >
            Cifra
          </button>
          <button
            onClick={() => onModeChange('letra')}
            className={`text-xs px-3 py-1 rounded-md transition-colors ${mode === 'letra' ? 'bg-brand-purple/20 text-brand-purple' : 'text-white/50 bg-white/5'}`}
          >
            Letra
          </button>
        </div>

        {mode === 'cifra' && (
          <div className="flex items-center gap-1">
            <button
              onClick={() => setTransposeValue((v) => v - 1)}
              className="w-7 h-7 rounded-md bg-white/5 hover:bg-white/10 text-sm text-white/70"
            >
              -
            </button>
            <span className="text-xs text-white/50 px-2 font-mono min-w-[2rem] text-center">
              {currentKey}
            </span>
            <button
              onClick={() => setTransposeValue((v) => v + 1)}
              className="w-7 h-7 rounded-md bg-white/5 hover:bg-white/10 text-sm text-white/70"
            >
              +
            </button>
          </div>
        )}
      </div>

      {/* Card Grande Branco com Cifra — flex-1 para ocupar espaço disponível */}
      <div className="bg-white rounded-2xl flex-1 min-h-0 p-4 relative overflow-hidden flex flex-col shadow-xl">
        {locked && (
          <div className="absolute top-4 right-4 text-text-primary/30 flex items-center gap-1 text-xs font-medium">
            <Lock className="w-4 h-4" /> sync
          </div>
        )}
        <div className="flex-1 text-gray-900 overflow-y-auto w-full">
          {rendered ? (
            <pre
              className="whitespace-pre-wrap text-[14px] leading-relaxed chordpro-block w-full"
              style={{ fontFamily: 'JetBrains Mono, monospace' }}
            >
              {rendered}
            </pre>
          ) : (
            <span className="text-gray-400 text-sm">Bloco sem cifra cadastrada.</span>
          )}
        </div>
      </div>

      {/* Grid 2 Colunas de Botões — compactos, altura fixa */}
      <div className="grid grid-cols-2 gap-1.5 shrink-0">
        {blocks.map((b, i) => {
          const isActive = i === index;
          return (
            <button
              key={b.id}
              onClick={() => {
                if (!locked && onSelectBlock) {
                  onSelectBlock(i);
                } else if (!locked && onAdvance) {
                  onSelectBlock ? onSelectBlock(i) : undefined;
                }
              }}
              disabled={locked}
              className={`h-11 flex items-center justify-center rounded-xl text-xs font-bold transition-all shadow-sm disabled:cursor-not-allowed ${
                isActive 
                  ? 'scale-[1.02] border-2 border-brand-purple/40 shadow-md'
                  : 'hover:scale-[1.01]'
              }`}
              style={{
                backgroundColor: isActive ? '#f3f4f6' : '#d1d5db', 
                color: '#111827',
              }}
            >
              {b.label}
            </button>
          );
        })}
      </div>

      <style>{`
        .chordpro-block .chord {
          color: #FF8C00 !important;
          font-weight: 800;
        }
      `}</style>
    </div>
  );
}
