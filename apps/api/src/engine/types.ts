export type EngineState = 'idle' | 'programado' | 'override' | 'retomada';

export interface Block {
  id: string;
  label: string;
  startTime: string;
  endTime: string;
  duration: number;
  order: number;
  chordproContent?: string;
}

export interface OverrideAction {
  blockId: string;
  triggeredByUserId: string;
  triggeredAt: string;
}

export interface TransitionEvent {
  blockId: string;
  sessionId: string;
  triggeredAt: string;
  wasOverride: boolean;
  sequence: number;
  triggeredByUserId?: string;
}

export interface SessionState {
  sessionId: string;
  currentBlockId: string | null;
  blocks: Block[];
  programadoPointer: number;
  overrideStack: OverrideAction[];
  sequence: number;
  timestamp: string;
  state: EngineState;
  pausedPointer?: number;
  startedAt?: string;
}

export function createSessionState(sessionId: string, blocks: Block[]): SessionState {
  const sorted = [...blocks].sort((a, b) => a.order - b.order);
  return {
    sessionId,
    currentBlockId: sorted[0]?.id || null,
    blocks: sorted,
    programadoPointer: 0,
    overrideStack: [],
    sequence: 0,
    timestamp: new Date().toISOString(),
    state: 'idle',
  };
}

export function getCurrentBlock(session: SessionState): Block | undefined {
  return session.blocks.find((b) => b.id === session.currentBlockId);
}

export function getNextProgramadoBlock(session: SessionState): Block | undefined {
  return session.blocks[session.programadoPointer + 1];
}

export function isLastBlock(session: SessionState): boolean {
  return session.programadoPointer >= session.blocks.length - 1;
}