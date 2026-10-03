// Emails (server/email.js), in the language of the person who asked for them.
export default {
  // The one email sent when someone types their address
  'email.subjectConfirm': 'Confirme os e-mails sobre “{title}”',
  'email.subjectLink': 'Seu link para “{title}”',
  'email.linkOrganizer': 'Aqui está seu link privado para “{title}”. Com ele, você pode editar, encerrar ou excluir a enquete, então guarde-o só para você:',
  'email.linkGuest': 'Aqui está seu link privado de edição para “{title}”. Com ele, você pode alterar ou excluir sua resposta, então guarde-o só para você:',
  'email.confirmOrganizer': 'Para receber um e-mail quando as pessoas responderem ou alterarem suas respostas, confirme abaixo. Você vai receber no máximo um e-mail a cada 30 minutos.',
  'email.confirmGuest': 'Para receber um e-mail quando o organizador escolher um horário ou alterar a enquete, confirme abaixo. Você vai receber no máximo um e-mail a cada 30 minutos.',
  'email.confirmGuestPublic': 'Para receber um e-mail quando o organizador escolher um horário ou alterar a enquete, ou quando as pessoas responderem, confirme abaixo. Você vai receber no máximo um e-mail a cada 30 minutos.',
  'email.confirmButton': 'Confirmar atualizações por e-mail',
  'email.welcomeFooter': 'Você está recebendo esta mensagem porque alguém digitou este endereço no Overlap. Se não foi você, ignore: nada mais será enviado.',

  // Update emails
  'email.subjectUpdates': 'Novidades em “{title}”',
  'email.news': 'Novidades sobre “{title}”:',
  'email.finalPicked': 'O organizador escolheu um horário: {time}.',
  'email.closed': 'O organizador encerrou a enquete.',
  'email.reopened': 'A enquete foi reaberta.',
  'email.edited': 'O organizador alterou a enquete. Confira se sua resposta ainda está certa.',
  'email.newResponses': { one: 'Nova resposta: {names}.', many: 'Novas respostas: {names}.', other: 'Novas respostas: {names}.' },
  'email.changedAnswers': { one: 'Alterou a resposta: {names}.', many: 'Alteraram a resposta: {names}.', other: 'Alteraram a resposta: {names}.' },
  'email.removed': { one: 'Uma resposta foi removida.', many: '{count} respostas foram removidas.', other: '{count} respostas foram removidas.' },
  'email.respondedSoFar': { one: '{count} pessoa respondeu até agora.', many: '{count} pessoas responderam até agora.', other: '{count} pessoas responderam até agora.' },
  'email.nameSeparator': ', ',
  'email.openPoll': 'Abrir a enquete',
  'email.openOrganizerView': 'Abrir a visão do organizador',
  'email.guestFooter': 'O link abre a enquete. No dispositivo em que você respondeu, sua resposta já estará lá.',
  'email.organizerFooter': 'O link abre a visão do organizador no navegador em que você criou a enquete. Em outros lugares, use seu link privado ou a senha do organizador.',
  'email.stop': 'Parar de receber estes e-mails: {url}',

  // A time in an email
  'email.timeRange': '{day}, {start} – {end} (horário de {zone})',
  'email.timeRangeWeekly': 'Todas as semanas, {day}, {start} – {end} (horário de {zone})',
  // The plain-text version of the email's button
  'email.buttonText': '{label}: {url}',
};
