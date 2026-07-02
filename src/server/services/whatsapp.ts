export interface WhatsAppTemplate {
  templateName: string;
  to: string;
  variables: Record<string, string>;
}

export async function sendWhatsAppTemplate(template: WhatsAppTemplate): Promise<boolean> {
  console.log('[WhatsApp Stub] Sending template:', template.templateName, 'to:', template.to);
  return true;
}

export async function sendRepertorioDefinido(
  musicianPhone: string,
  date: string,
  songs: string[],
  studyLink: string
): Promise<boolean> {
  return sendWhatsAppTemplate({
    templateName: 'repertorio_definido',
    to: musicianPhone,
    variables: {
      date,
      songs: songs.join(', '),
      study_link: studyLink,
    },
  });
}

export async function sendSubstituicaoUrgente(
  musicianPhone: string,
  sundayDate: string,
  role: string,
  deadline: string
): Promise<boolean> {
  return sendWhatsAppTemplate({
    templateName: 'substituicao_urgente',
    to: musicianPhone,
    variables: {
      sunday_date: sundayDate,
      role,
      deadline,
    },
  });
}