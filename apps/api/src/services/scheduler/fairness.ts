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
  // Primeiro, filtrar apenas músicos que podem fazer esta role
  const eligible = musicians.filter(m => m.worshipRoles.includes(role));
  
  // Se nenhum elegível, retorna vazio
  if (eligible.length === 0) return [];
  
  // Se apenas um, retorna ele
  if (eligible.length === 1) return eligible;
  
  // Agrupar por timesServedThisMonth
  const byTimesServed = new Map<number, MusicianCandidate[]>();
  eligible.forEach(m => {
    const arr = byTimesServed.get(m.timesServedThisMonth) || [];
    arr.push(m);
    byTimesServed.set(m.timesServedThisMonth, arr);
  });
  
  // Pegar o menor valor de timesServedThisMonth (prioridade para quem menos serviu)
  const minTimes = Math.min(...Array.from(byTimesServed.keys()));
  const candidatesWithMinTimes = byTimesServed.get(minTimes)!;
  
  // Randomizar entre os que têm o mesmo timesServedThisMonth
  const shuffled = candidatesWithMinTimes.sort(() => Math.random() - 0.5);
  
  // Ordenar os restantes por timesServedThisMonth crescente
  const others = eligible
    .filter(m => m.timesServedThisMonth > minTimes)
    .sort((a, b) => a.timesServedThisMonth - b.timesServedThisMonth);
  
  return [...shuffled, ...others];
}