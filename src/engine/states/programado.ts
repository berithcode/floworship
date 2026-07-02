import type { SessionState, TransitionEvent } from '../types';
import { isLastBlock, getCurrentBlock } from '../types';

export type EventHandler = (event: TransitionEvent) => void;

export function startProgramado(session: SessionState): SessionState {
  return {
    ...session,
    state: 'programado',
    programadoPointer: 0,
    currentBlockId: session.blocks[0]?.id || null,
    timestamp: new Date().toISOString(),
  };
}

export function advanceProgramado(
  session: SessionState,
  onEvent: EventHandler
): { session: SessionState; ended: boolean } {
  if (session.state !== 'programado') {
    return { session, ended: false };
  }

  const currentBlock = getCurrentBlock(session);
  if (!currentBlock) {
    return { session: { ...session, state: 'idle' }, ended: true };
  }

  const event: TransitionEvent = {
    blockId: currentBlock.id,
    sessionId: session.sessionId,
    triggeredAt: new Date().toISOString(),
    wasOverride: false,
    sequence: session.sequence + 1,
  };
  onEvent(event);

  if (isLastBlock(session)) {
    return {
      session: {
        ...session,
        state: 'idle',
        sequence: session.sequence + 1,
        timestamp: new Date().toISOString(),
      },
      ended: true,
    };
  }

  const nextPointer = session.programadoPointer + 1;
  const nextBlock = session.blocks[nextPointer];

  return {
    session: {
      ...session,
      programadoPointer: nextPointer,
      currentBlockId: nextBlock.id,
      sequence: session.sequence + 1,
      timestamp: new Date().toISOString(),
    },
    ended: false,
  };
}

export function getBlockDuration(session: SessionState): number {
  const block = getCurrentBlock(session);
  return block?.duration || 0;
}