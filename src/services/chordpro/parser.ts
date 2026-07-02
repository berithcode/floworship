import { ChordsOverWordsParser } from 'chordsheetjs';

export interface ChordSong {
  lines: { type: string; content: string; chords: string[] }[];
  title?: string;
  artist?: string;
}

export function parseChordPro(input: string): ChordSong {
  try {
    const parser = new ChordsOverWordsParser();
    const song = parser.parse(input);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const lines = (song.lines as any[]).map((line: any) => {
      const chords: string[] = [];
      const content = line.items
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ? line.items.map((item: any) => {
            chords.push(item.chords || '');
            return (item.chords || '') + (item.lyrics || '');
          }).join('')
        : '';
      return { type: 'line', content, chords };
    });
    return {
      lines,
      title: song.title ? String(song.title) : undefined,
      artist: song.artist ? String(song.artist) : undefined,
    };
  } catch {
    return {
      lines: input.split('\n').map((l) => ({ type: 'line', content: l, chords: [] })),
    };
  }
}

export function renderCifra(song: ChordSong): string {
  return song.lines
    .map((line) => {
      if (line.chords.some((c) => c)) {
        return line.chords.join(' ') + '\n' + line.content;
      }
      return line.content;
    })
    .join('\n');
}

export function renderLetra(song: ChordSong): string {
  return song.lines.map((line) => line.content).join('\n');
}

const CHORD_NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

function transposeChord(chord: string, semitones: number): string {
  const match = chord.match(/^([A-G][#b]?)(.*)/);
  if (!match) return chord;
  let idx = CHORD_NOTES.indexOf(match[1]);
  if (idx === -1) idx = CHORD_NOTES.indexOf(match[1].replace('b', '#'));
  if (idx === -1) return chord;
  const newIdx = (idx + semitones + 12) % 12;
  return CHORD_NOTES[newIdx] + match[2];
}

export function transpose(song: ChordSong, semitones: number): ChordSong {
  return {
    ...song,
    lines: song.lines.map((line) => ({
      ...line,
      chords: line.chords.map((c) => (c ? transposeChord(c, semitones) : c)),
    })),
  };
}