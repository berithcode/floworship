import type { SessionState, TransitionEvent } from '@floworship/types';
import type { EventHandler } from './programado';

export function startRetomada(
  session: SessionState,
  onEvent: EventHandler
): { session: SessionState } {
  if (session.state !== 'retomada') {
    return { session };
  }

  const pausedPointer = session.pausedPointer ?? session.programadoPointer;
  const pausedBlock = session.blocks[pausedPointer];

  if (pausedBlock) {
    const event: TransitionEvent = {
      blockId: pausedBlock.id,
      sessionId: session.sessionId,
      triggeredAt: new Date().toISOString(),
      wasOverride: false,
      sequence: session.sequence + 1,
    };
    onEvent(event);
  }

  return {
    session: {
      ...session,
      state: 'programado',
      programadoPointer: pausedPointer,
      currentBlockId: pausedBlock?.id || null,
      pausedPointer: undefined,
      sequence: session.sequence + 1,
      timestamp: new Date().toISOString(),
    },
  };
}