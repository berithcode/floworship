import type { SessionState, OverrideAction } from '@floworship/types';

export function queueOverride(
  session: SessionState,
  blockId: string,
  userId: string
): SessionState {
  if (session.state !== 'override' && session.state !== 'retomada') {
    return session;
  }

  const action: OverrideAction = {
    blockId,
    triggeredByUserId: userId,
    triggeredAt: new Date().toISOString(),
  };

  return {
    ...session,
    overrideStack: [...session.overrideStack, action],
  };
}

export function getNextQueuedOverride(session: SessionState): OverrideAction | undefined {
  return session.overrideStack[0];
}

export function clearOverrideStack(session: SessionState): SessionState {
  return {
    ...session,
    overrideStack: [],
  };
}