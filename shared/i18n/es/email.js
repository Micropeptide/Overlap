// Emails (server/email.js), written in the language of the person who asked for them.
export default {
  // The one email sent when someone types their address
  'email.subjectConfirm': 'Confirma los correos sobre “{title}”',
  'email.subjectLink': 'Tu enlace para “{title}”',
  'email.linkOrganizer': 'Este es tu enlace privado para “{title}”. Te permite editar, cerrar o eliminar la encuesta, así que guárdalo para ti:',
  'email.linkGuest': 'Este es tu enlace privado de edición para “{title}”. Te permite cambiar o eliminar tu respuesta, así que guárdalo para ti:',
  'email.confirmOrganizer': 'Para recibir un correo cuando la gente responda o cambie sus respuestas, confirma abajo. Recibirás como máximo un correo cada 30 minutos.',
  'email.confirmGuest': 'Para recibir un correo cuando el organizador elija un horario o cambie la encuesta, confirma abajo. Recibirás como máximo un correo cada 30 minutos.',
  'email.confirmGuestPublic': 'Para recibir un correo cuando el organizador elija un horario o cambie la encuesta, o cuando la gente responda, confirma abajo. Recibirás como máximo un correo cada 30 minutos.',
  'email.confirmButton': 'Confirmar avisos por correo',
  'email.welcomeFooter': 'Recibes este mensaje porque alguien escribió esta dirección en Overlap. Si no fuiste tú, ignóralo: no se enviará nada más.',

  // Update emails
  'email.subjectUpdates': 'Novedades de “{title}”',
  'email.news': 'Novedades de “{title}”:',
  'email.finalPicked': 'El organizador eligió un horario: {time}.',
  'email.closed': 'El organizador cerró la encuesta.',
  'email.reopened': 'La encuesta vuelve a estar abierta.',
  'email.edited': 'El organizador cambió la encuesta. Comprueba que tu respuesta siga encajando.',
  'email.newResponses': {
    one: 'Nueva respuesta: {names}.',
    many: 'Nuevas respuestas: {names}.',
    other: 'Nuevas respuestas: {names}.',
  },
  'email.changedAnswers': {
    one: 'Cambió su respuesta: {names}.',
    many: 'Cambiaron su respuesta: {names}.',
    other: 'Cambiaron su respuesta: {names}.',
  },
  'email.removed': {
    one: 'Se quitó una respuesta.',
    many: 'Se quitaron {count} respuestas.',
    other: 'Se quitaron {count} respuestas.',
  },
  'email.respondedSoFar': {
    one: 'Hasta ahora ha respondido {count} persona.',
    many: 'Hasta ahora han respondido {count} personas.',
    other: 'Hasta ahora han respondido {count} personas.',
  },
  'email.nameSeparator': ', ',
  'email.openPoll': 'Abrir la encuesta',
  'email.openOrganizerView': 'Abrir la vista de organizador',
  'email.guestFooter': 'El enlace abre la encuesta. En el dispositivo desde el que respondiste, tu respuesta ya está ahí.',
  'email.organizerFooter': 'El enlace abre la vista de organizador en el navegador donde creaste la encuesta. En otros sitios, usa tu enlace privado o tu contraseña de organizador.',
  'email.stop': 'Dejar de recibir estos correos: {url}',

  // A time in an email
  'email.timeRange': '{day}, {start} – {end} (hora de {zone})',
  'email.timeRangeWeekly': 'Cada {day}, {start} – {end} (hora de {zone})',
  // The plain-text version of the email's button
  'email.buttonText': '{label}: {url}',
};
