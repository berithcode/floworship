export interface MusicianCandidate {
  id: string;
  userId: string;
  timesServedThisMonth: number;
  lastServedAt: Record<string, Date>;
  worshipRoles: string[];
}

export function calculateFairnessScore(
  musicians: MusicianCandidate[],
  role: string
): MusicianCandidate[] {
  return [...musicians].sort((a, b) => {
    if (a.timesServedThisMonth !== b.timesServedThisMonth) {
      return a.timesServedThisMonth - b.timesServedThisMonth;
    }

    const aLast = a.lastServedAt[role];
    const bLast = b.lastServedAt[role];

    if (!aLast && !bLast) return 0;
    if (!aLast) return -1;
    if (!bLast) return 1;

    return aLast.getTime() - bLast.getTime();
  });
}