import { calculateFairnessScore, type MusicianCandidate } from './fairness';

export interface Assignment {
  scheduleId: string;
  role: string;
  ministryMemberId: string | null;
  status: 'confirmado' | 'vago';
}

export function generateSchedule(
  sundays: { date: Date; scheduleId: string }[],
  roles: string[],
  candidates: MusicianCandidate[],
  existingAssignments: Map<string, Set<string>>
): Assignment[] {
  const assignments: Assignment[] = [];
  const assignedCount = new Map<string, number>();

  for (const sunday of sundays) {
    const assignedToday = existingAssignments.get(sunday.scheduleId) || new Set();

    for (const role of roles) {
      const eligible = candidates.filter((c) =>
        c.worshipRoles.includes(role) &&
        !assignedToday.has(c.id)
      );

      const sorted = calculateFairnessScore(eligible, role);
      const chosen = sorted[0];

      if (chosen) {
        assignments.push({
          scheduleId: sunday.scheduleId,
          role,
          ministryMemberId: chosen.id,
          status: 'confirmado',
        });
        assignedToday.add(chosen.id);
        assignedCount.set(chosen.id, (assignedCount.get(chosen.id) || 0) + 1);
      } else {
        assignments.push({
          scheduleId: sunday.scheduleId,
          role,
          ministryMemberId: null,
          status: 'vago',
        });
      }
    }
  }

  return assignments;
}