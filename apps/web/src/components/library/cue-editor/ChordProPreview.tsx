import { memo, useMemo } from 'react';
import { parseChordPro, renderCifraLines, renderLetraLines, transpose } from '../../../services/chordpro/parser';

interface ChordProPreviewProps {
  chordproContent?: string | null;
  transposeValue?: number;
  onTransposeChange?: (semitones: number) => void;
  mode?: 'cifra' | 'letra';
  onModeChange?: (mode: 'cifra' | 'letra') => void;
  defaultKey?: string;
}

const KEYS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

export const ChordProPreview = memo(function ChordProPreview({
  chordproContent,
  transposeValue = 0,
  onTransposeChange,
  mode = 'cifra',
  onModeChange,
  defaultKey,
}: ChordProPreviewProps) {
  const parsed = useMemo(() => {
    if (!chordproContent) return null;
    return transpose(parseChordPro(chordproContent), transposeValue);
  }, [chordproContent, transposeValue]);

  const renderedLines = useMemo(() => {
    if (!parsed) return [];
    return mode === 'cifra' ? renderCifraLines(parsed) : renderLetraLines(parsed);
  }, [parsed, mode]);

  if (!chordproContent) {
    return (
      <div className="flex items-center justify-center h-32 text-text-primary/50 text-sm bg-white/5 rounded-xl">
        Nenhum conteúdo para este bloco
      </div>
    );
  }

  const originalKey = defaultKey || 'C';
  const originalIdx = KEYS.indexOf(originalKey);
  const currentKey = originalIdx >= 0
    ? KEYS[(originalIdx + transposeValue + 12) % 12]
    : originalKey;

  return (
    <div className="space-y-3">
      {/* Toolbar: transposição + modo */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs text-text-primary/50">
            Tom: <strong className="text-accent-mint">{currentKey}</strong>
          </span>
          {transposeValue !== 0 && defaultKey && (
            <span className="text-xs text-text-primary/50">
              (original: {defaultKey})
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => onTransposeChange?.(-1)}
            className="px-2 h-7 rounded-md flex items-center justify-center bg-white/5 hover:bg-white/10 transition-colors text-text-primary/70 text-xs"
          >
            -½ tom
          </button>
          <span className="px-2 text-xs text-text-primary/50 min-w-[3rem] text-center">
            {transposeValue > 0 ? `+${transposeValue}` : transposeValue}
          </span>
          <button
            onClick={() => onTransposeChange?.(1)}
            className="px-2 h-7 rounded-md flex items-center justify-center bg-white/5 hover:bg-white/10 transition-colors text-text-primary/70 text-xs"
          >
            +½ tom
          </button>
        </div>
      </div>

      {/* Rendered content */}
      <div
        className="font-mono text-sm leading-relaxed whitespace-pre-wrap bg-white/5 rounded-xl p-4 overflow-x-auto text-text-primary min-h-[120px]"
        style={{ fontFamily: 'JetBrains Mono, monospace' }}
      >
        {renderedLines.length === 0 ? (
          <span className="text-text-primary/30">Digite cifra no editor para ver o preview</span>
        ) : (
          renderedLines.map((line, i) => (
            <span key={i}>
              {line.isChord ? (
                <span className="text-accent-mint font-bold">{line.text}</span>
              ) : (
                <span>{line.text}</span>
              )}
              {i < renderedLines.length - 1 && '\n'}
            </span>
          ))
        )}
      </div>
    </div>
  );
});
