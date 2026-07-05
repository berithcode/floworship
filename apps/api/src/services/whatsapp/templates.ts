export const TEMPLATES = {
  /** Template para coleta de disponibilidade */
  DISPONIBILIDADE: (cycleName: string) => ({
    name: 'disponibilidade',
    params: { cycle: cycleName },
    buttons: [
      { type: 'reply', reply: { id: 'disponivel', title: 'Disponível' } },
      { type: 'reply', reply: { id: 'nao_disponivel', title: 'Indisponível' } },
    ],
  }),

  /** Repertório definido para domingo */
  REPERTORIO_DEFINIDO: (calendarTitle: string, songCount: number) => ({
    name: 'repertorio_definido',
    params: {
      sunday_date: calendarTitle,
      song_count: songCount.toString(),
    },
    buttons: [
      { type: 'reply', reply: { id: 'ver_repertorio', title: 'Ver Repertório' } },
    ],
  }),

  /** Substituição urgente */
  SUBSTITUICAO_URGENTE: (sundayDate: string, role: string, assignmentId: string) => ({
    name: 'substituicao_urgente',
    params: {
      sunday_date: sundayDate,
      role,
    },
    buttons: [
      { type: 'reply', reply: { id: `substituir_${assignmentId}`, title: 'Confirmo Substituição' } },
      { type: 'reply', reply: { id: `recuso_${assignmentId}`, title: 'Recuso' } },
    ],
  }),
};

/** Template mínimo para mensagens de texto livre */
export const TEXT_TEMPLATE = (message: string) => ({
  name: 'generic_text',
  components: [
    {
      type: 'body',
      parameters: [
        { type: 'text', text: message },
      ],
    },
  ],
});