import { describe, it, expect, vi } from 'vitest';
import { createSessionState } from '../types';
import { startProgramado, advanceProgramado } from '../states/programado';
import { triggerOverride, advanceOverride } from '../states/override';
import { startRetomada } from '../states/retomada';
import { cancelOverride } from '../states/cancel-override';

function makeBlocks(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    id: `block-${i}`,
    label: `Block ${i}`,
    startTime: new Date().toISOString(),
    endTime: new Date().toISOString(),
    duration: 30,
    order: i,
  }));
}

const noop = vi.fn();

describe('State Machine Integration', () => {
  it('start → auto-advance through 3 blocks → session ends', () => {
    let session = createSessionState('s1', makeBlocks(3));
    session = startProgramado(session);

    expect(session.state).toBe('programado');
    expect(session.currentBlockId).toBe('block-0');

    const r1 = advanceProgramado(session, noop);
    session = r1.session;
    expect(session.currentBlockId).toBe('block-1');
    expect(r1.ended).toBe(false);

    const r2 = advanceProgramado(session, noop);
    session = r2.session;
    expect(session.currentBlockId).toBe('block-2');
    expect(r2.ended).toBe(false);

    const r3 = advanceProgramado(session, noop);
    session = r3.session;
    expect(r3.ended).toBe(true);
    expect(session.state).toBe('idle');
  });

  it('override → retomada returns to paused pointer', () => {
    let session = createSessionState('s2', makeBlocks(3));
    session = startProgramado(session);

    const r1 = advanceProgramado(session, noop);
    session = r1.session;
    expect(session.currentBlockId).toBe('block-1');

    const o = triggerOverride(session, 'block-override', 'user-1');
    session = o.session;
    expect(session.state).toBe('override');
    expect(session.currentBlockId).toBe('block-override');
    expect(session.pausedPointer).toBe(1);

    const or = advanceOverride(session, noop);
    session = or.session;
    expect(session.state).toBe('retomada');

    const ret = startRetomada(session, noop);
    session = ret.session;
    expect(session.state).toBe('programado');
    expect(session.programadoPointer).toBe(1);
    expect(session.currentBlockId).toBe('block-1');
  });

  it('override → cancel → returns to Programado', () => {
    let session = createSessionState('s3', makeBlocks(3));
    session = startProgramado(session);

    const o = triggerOverride(session, 'block-x', 'user-1');
    session = o.session;
    expect(session.state).toBe('override');

    const c = cancelOverride(session, noop);
    session = c.session;
    expect(session.state).toBe('programado');
    expect(session.overrideStack).toEqual([]);
  });

  it('2 sequential overrides → both execute → return to Programado', () => {
    let session = createSessionState('s4', makeBlocks(3));
    session = startProgramado(session);

    const o1 = triggerOverride(session, 'block-override-1', 'user-1');
    session = o1.session;
    expect(session.state).toBe('override');

    const queued = triggerOverride(session, 'block-override-2', 'user-1');
    session = queued.session;
    expect(session.overrideStack.length).toBe(2);

    const or1 = advanceOverride(session, noop);
    session = or1.session;
    expect(session.currentBlockId).toBe('block-override-2');

    const or2 = advanceOverride(session, noop);
    session = or2.session;
    expect(session.state).toBe('retomada');

    const ret = startRetomada(session, noop);
    session = ret.session;
    expect(session.state).toBe('programado');
    expect(session.programadoPointer).toBe(0);
  });
});