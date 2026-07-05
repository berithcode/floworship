import { ChordsOverWordsParser, ChordProParser } from 'chordsheetjs';

export interface ChordEvent {
  chord: string;
  position: number;
}

export interface ChordSong {
  lines: { type: string; content: string; chords: string[]; positions: number[] }[];
  title?: string;
  artist?: string;
}

export interface RenderedLine {
  text: string;
  isChord: boolean;
}

/**
 * Parse chord input (chords-over-words or ChordPro [bracket] format)
 */
export function parseChordPro(input: string): ChordSong {
  if (!input || !input.trim()) {
    return { lines: [] };
  }

  const hasBrackets = /\[[A-G][#b]?(?:m|maj|min|dim|aug|sus|add|m\d)?(?:\/[A-G][#b]?)?\]/.test(input);

  if (hasBrackets) {
    return parseBracketFormat(input);
  }

  try {
    const parser = new ChordsOverWordsParser();
    const song = parser.parse(input);
    return parseChordsOverWords(song);
  } catch {
    return {
      lines: input.split('\n').map((l) => ({
        type: 'line',
        content: l,
        chords: [],
        positions: [],
      })),
    };
  }
}

function parseBracketFormat(input: string): ChordSong {
  const lines = input.split('\n').map((line) => {
    const chords: string[] = [];
    const positions: number[] = [];
    let content = '';
    let lastIndex = 0;

    const regex = /\[([A-G][#b]?(?:m|maj|min|dim|aug|sus|add|m\d)?(?:\/[A-G][#b]?)?)\]/g;
    let match;

    while ((match = regex.exec(line)) !== null) {
      content += line.slice(lastIndex, match.index);
      lastIndex = match.index + match[0].length;
      chords.push(match[1]);
      positions.push(content.length);
    }

    content += line.slice(lastIndex);
    return { type: 'line', content, chords, positions };
  });

  return { lines };
}

function parseChordsOverWords(song: any): ChordSong {
  const lines = (song.lines as any[]).map((line: any) => {
    if (!line.items || line.items.length === 0) {
      return { type: 'line', content: '', chords: [], positions: [] };
    }

    let content = '';
    const chords: string[] = [];
    const positions: number[] = [];

    for (const item of line.items) {
      const rawChords = item.chords || '';
      const itemLyrics = item.lyrics || '';
      const chordName = rawChords.trim().split(/\s+/)[0] || '';

      if (chordName) {
        chords.push(chordName);
        positions.push(content.length);
      }

      content += itemLyrics;
    }

    return { type: 'line', content, chords, positions };
  });

  return {
    lines,
    title: song.title ? String(song.title) : undefined,
    artist: song.artist ? String(song.artist) : undefined,
  };
}

function buildChordLine(line: { content: string; chords: string[]; positions: number[] }): string {
  if (line.chords.length === 0 || line.chords.every((c) => !c)) {
    return '';
  }

  let maxWidth = 0;
  for (let i = 0; i < line.chords.length; i++) {
    const pos = line.positions[i] || 0;
    maxWidth = Math.max(maxWidth, pos + line.chords[i].length);
  }

  const chordChars = new Array(Math.max(maxWidth, line.content.length)).fill(' ');
  for (let i = 0; i < line.chords.length; i++) {
    const pos = line.positions[i] || 0;
    const chord = line.chords[i];
    for (let j = 0; j < chord.length; j++) {
      if (pos + j < chordChars.length) {
        chordChars[pos + j] = chord[j];
      }
    }
  }

  return chordChars.join('').trimEnd();
}

/**
 * Render as cifra (chords positioned above lyrics) — plain string
 */
export function renderCifra(song: ChordSong): string {
  return song.lines
    .map((line) => {
      if (line.chords.length === 0 || line.chords.every((c) => !c)) {
        return line.content;
      }
      const chordLine = buildChordLine(line);
      return chordLine + '\n' + line.content;
    })
    .join('\n');
}

/**
 * Render as structured lines with chord/lyric distinction
 */
export function renderCifraLines(song: ChordSong): RenderedLine[] {
  return song.lines.flatMap((line) => {
    if (line.chords.length === 0 || line.chords.every((c) => !c)) {
      return [{ text: line.content, isChord: false }];
    }
    const chordLine = buildChordLine(line);
    return [
      { text: chordLine, isChord: true },
      { text: line.content, isChord: false },
    ];
  });
}

/**
 * Render as letra (lyrics only, no chords)
 */
export function renderLetra(song: ChordSong): string {
  return song.lines.map((line) => line.content).join('\n');
}

export function renderLetraLines(song: ChordSong): RenderedLine[] {
  return song.lines.map((line) => ({ text: line.content, isChord: false }));
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
