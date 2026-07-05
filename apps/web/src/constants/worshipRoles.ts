export const WORSHIP_ROLES = [
  { key: 'ministro_de_louvor', label: 'Ministro de Louvor' },
  { key: 'guitarra', label: 'Guitarra' },
  { key: 'baixo', label: 'Baixo' },
  { key: 'bateria', label: 'Bateria' },
  { key: 'teclado', label: 'Teclado' },
  { key: 'violao', label: 'Violão' },
  { key: 'vocalista', label: 'Vocalista' },
  { key: 'apoio_voz', label: 'Apoio de Voz' },
] as const;

export type WorshipRoleKey = (typeof WORSHIP_ROLES)[number]['key'];

export function getWorshipRoleLabel(key: string): string {
  const role = WORSHIP_ROLES.find((r) => r.key === key);
  return role?.label ?? key;
}
