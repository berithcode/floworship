import type { SessionState, OverrideAction, TransitionEvent } from '../types';
import { getCurrentBlock } from '../types';
import type { EventHandler } from './programado';

export function triggerOverride(
  session: SessionState,
  blockId: string,
  userId: string
): { session: SessionState; error?: string } {
  if (session.state === 'override' || session.state === 'retomada') {
    const action: OverrideAction = {
      blockId,
      triggeredByUserId: userId,
      triggeredAt: new Date().toISOString(),
    };
    return {
      session: {
        ...session,
        overrideStack: [...session.overrideStack, action],
      },
    };
  }

  const overrideAction: OverrideAction = {
    blockId,
    triggeredByUserId: userId,
    triggeredAt: new Date().toISOString(),
  };

  return {
    session: {
      ...session,
      state: 'override',
      currentBlockId: blockId,
      pausedPointer: session.programadoPointer,
      overrideStack: [overrideAction],
      sequence: session.sequence + 1,
      timestamp: new Date().toISOString(),
    },
  };
}

export function advanceOverride(
  session: SessionState,
  onEvent: EventHandler
): { session: SessionState; transitionToRetomada: boolean } {
  if (session.state !== 'override') {
    return { session, transitionToRetomada: false };
  }

  const currentBlock = getCurrentBlock(session);
  if (currentBlock) {
    const event: TransitionEvent = {
      blockId: currentBlock.id,
      sessionId: session.sessionId,
      triggeredAt: new Date().toISOString(),
      wasOverride: true,
      sequence: session.sequence + 1,
    };
    onEvent(event);
  }

  const remainingStack = session.overrideStack.slice(1);

  if (remainingStack.length > 0) {
    const nextOverride = remainingStack[0];
    return {
      session: {
        ...session,
        currentBlockId: nextOverride.blockId,
        overrideStack: remainingStack,
        sequence: session.sequence + 1,
        timestamp: new Date().toISOString(),
      },
      transitionToRetomada: false,
    };
  }

  return {
    session: {
      ...session,
      state: 'retomada',
      overrideStack: [],
      sequence: session.sequence + 1,
      timestamp: new Date().toISOString(),
    },
    transitionToRetomada: true,
  };
}