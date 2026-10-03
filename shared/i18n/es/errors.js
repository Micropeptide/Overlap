// Errors the server reports, by their `code`. {field} is an API field name such as "available"; it is left as it is.
export default {
  // Poll fields
  'errors.not_text': '{field} debe ser texto.',
  'errors.title_required': 'Añade un título.',
  'errors.name_required': 'Añade un nombre.',
  'errors.title_too_long': {
    one: 'El título debe tener menos de {count} carácter.',
    many: 'El título debe tener menos de {count} caracteres.',
    other: 'El título debe tener menos de {count} caracteres.',
  },
  'errors.description_too_long': {
    one: 'La descripción debe tener menos de {count} carácter.',
    many: 'La descripción debe tener menos de {count} caracteres.',
    other: 'La descripción debe tener menos de {count} caracteres.',
  },
  'errors.location_too_long': {
    one: 'El lugar debe tener menos de {count} carácter.',
    many: 'El lugar debe tener menos de {count} caracteres.',
    other: 'El lugar debe tener menos de {count} caracteres.',
  },
  'errors.note_too_long': {
    one: 'La nota debe tener menos de {count} carácter.',
    many: 'La nota debe tener menos de {count} caracteres.',
    other: 'La nota debe tener menos de {count} caracteres.',
  },
  'errors.name_too_long': {
    one: 'El nombre debe tener menos de {count} carácter.',
    many: 'El nombre debe tener menos de {count} caracteres.',
    other: 'El nombre debe tener menos de {count} caracteres.',
  },
  'errors.not_whole_number': '{field} debe ser un número entero.',
  'errors.poll_not_object': 'Envía la encuesta como un objeto JSON.',
  'errors.closes_on_invalid': 'Elige una fecha de cierre válida dentro de los próximos tres años.',
  'errors.closes_on_passed': 'Esa fecha de cierre ya pasó. Elige hoy o una fecha posterior.',
  'errors.timezone_invalid': 'Elige una zona horaria válida, como Europe/Madrid.',
  'errors.kind_invalid': 'Elige fechas concretas o días de la semana.',
  'errors.weekly_sent_dates': 'Es una encuesta semanal. Envía "weekdays" en lugar de "dates".',
  'errors.weekdays_required': 'Elige al menos un día de la semana.',
  'errors.weekdays_invalid': 'Los días de la semana deben ser números del 0 (domingo) al 6 (sábado).',
  'errors.dates_sent_weekdays': 'Esta encuesta usa fechas concretas. Envía "dates" en lugar de "weekdays".',
  'errors.dates_required': 'Elige al menos una fecha.',
  'errors.too_many_dates': {
    one: 'Elige {count} fecha como máximo.',
    many: 'Elige {count} fechas como máximo.',
    other: 'Elige {count} fechas como máximo.',
  },
  'errors.date_invalid': '“{date}” no es una fecha válida.',
  'errors.dates_out_of_range': 'Elige fechas dentro de los próximos tres años.',
  'errors.dates_all_passed': 'Todas esas fechas ya pasaron. Elige al menos una fecha futura.',
  'errors.slot_minutes_invalid': 'Los bloques de tiempo deben ser de 15, 30 o 60 minutos.',
  'errors.end_before_start': 'La hora de fin debe ser posterior a la de inicio.',
  'errors.duration_invalid': 'La duración de la reunión debe estar entre 15 minutos y 12 horas.',
  'errors.allow_edits_invalid': 'Indica si los invitados pueden cambiar sus respuestas (true o false).',
  'errors.visibility_invalid': 'Elige quién puede ver las respuestas.',
  'errors.times_misaligned': {
    one: 'Las horas de inicio y fin deben coincidir con bloques de {count} minuto.',
    many: 'Las horas de inicio y fin deben coincidir con bloques de {count} minutos.',
    other: 'Las horas de inicio y fin deben coincidir con bloques de {count} minutos.',
  },
  'errors.range_too_short': 'La franja horaria es más corta que un bloque de tiempo.',
  'errors.duration_too_long': 'La reunión dura más que la franja horaria. Amplía los horarios o acorta la reunión.',
  'errors.too_many_slots': 'Son demasiados horarios para elegir. Elige menos fechas o una franja más corta.',
  'errors.no_slots': 'Ninguno de esos horarios existe en esa zona horaria.',

  // Responses
  'errors.response_not_object': 'Envía la respuesta como un objeto JSON.',
  'errors.name_invisible': 'Añade un nombre que se pueda ver.',
  'errors.not_time_list': '{field} debe ser una lista de horarios.',

  // Final time
  'errors.final_required': 'Elige una hora de inicio y una de fin.',
  'errors.final_end_before_start': 'El horario definitivo debe terminar después de empezar.',
  'errors.final_too_long': 'El horario definitivo puede durar 24 horas como máximo.',
  'errors.final_bad_length': 'La duración del horario definitivo debe ser un múltiplo de 5 minutos.',
  'errors.final_not_a_time': 'El horario definitivo debe empezar en uno de los horarios de la encuesta.',

  // Requests
  'errors.too_many_requests': 'Demasiadas solicitudes desde esta conexión. Espera unos minutos y vuelve a intentarlo.',
  'errors.json_required': 'Envía JSON con Content-Type: application/json.',
  'errors.body_too_large': 'Esa solicitud es demasiado grande.',
  'errors.invalid_json': 'El cuerpo de la solicitud no es un JSON válido.',
  'errors.method_not_allowed': 'Ese método no está permitido aquí.',
  'errors.not_found': 'No encontrado.',
  'errors.server_error': 'Algo salió mal por nuestra parte. Vuelve a intentarlo.',

  // Polls and access
  'errors.poll_not_found': 'Esta encuesta no existe. Puede que se haya eliminado o que haya caducado.',
  'errors.admin_link_or_password_wrong': 'Ese enlace privado o esa contraseña no son correctos. Puede que el enlace se haya reemplazado o que la contraseña haya cambiado.',
  'errors.admin_link_invalid': 'Este enlace privado no es válido. Puede que se haya reemplazado.',
  'errors.changes_not_object': 'Envía los cambios como un objeto JSON.',
  'errors.reopen_with_final': 'Reabrir una encuesta borra su horario definitivo, así que envía una cosa o la otra.',
  'errors.status_invalid': 'El estado debe ser "open" o "closed".',
  'errors.no_final_time': 'Esta encuesta aún no tiene un horario definitivo.',

  // Answering
  'errors.poll_closed': 'Esta encuesta está cerrada, así que no acepta respuestas nuevas.',
  'errors.poll_closed_no_changes': 'Esta encuesta está cerrada, así que las respuestas ya no se pueden cambiar.',
  'errors.edits_not_allowed': 'El organizador no permite cambiar las respuestas después de enviarlas. Aún puedes eliminar la tuya.',
  'errors.too_many_responses': {
    one: 'Esta encuesta ya tiene {count} respuesta.',
    many: 'Esta encuesta ya tiene {count} respuestas.',
    other: 'Esta encuesta ya tiene {count} respuestas.',
  },
  'errors.name_taken': 'Alguien ya respondió como “{name}”. Si fuiste tú, abre tu enlace privado de edición. Si no, añade la inicial de tu apellido.',
  'errors.name_taken_other': 'Otra persona ya respondió como “{name}”. Prueba a añadir la inicial de tu apellido.',
  'errors.response_not_found': 'Esa respuesta ya no existe.',
  'errors.my_response_not_found': 'No encontramos tu respuesta. Puede que se haya eliminado.',
  'errors.not_your_response': 'Solo quien envió esta respuesta puede cambiarla.',

  // Passwords
  'errors.password_unreadable': 'No se pudo leer esa contraseña. Recarga la página y vuelve a intentarlo.',
  'errors.too_many_wrong_passwords': 'Demasiadas contraseñas incorrectas para esta encuesta. Espera una hora y vuelve a intentarlo, o usa tu enlace privado.',
  'errors.password_no_longer_works': 'Esa contraseña ya no funciona para esta respuesta. Puede que se haya cambiado.',
  'errors.sign_in_incomplete': 'Escribe el nombre con el que respondiste y tu contraseña.',
  'errors.sign_in_failed': 'Ese nombre y esa contraseña no coinciden con ninguna respuesta con contraseña. Revisa cómo los escribiste o usa tu enlace privado de edición.',

  // Email
  'errors.email_not_set_up': 'El correo electrónico no está configurado en esta copia de Overlap.',
  'errors.email_invalid': 'Eso no parece una dirección de correo electrónico.',
  'errors.link_not_current': 'Ese enlace privado no está actualizado. Recarga la página y vuelve a intentarlo.',
  'errors.email_nothing_chosen': 'Elige qué quieres recibir por correo: tu enlace, los avisos o ambos.',
  'errors.email_daily_limit': 'Overlap ya ha enviado suficientes correos a esa dirección (o para esta encuesta) hoy. Vuelve a intentarlo mañana.',
  'errors.email_send_failed': 'No se pudo enviar el correo en este momento. Vuelve a intentarlo en un minuto.',
  'errors.confirm_link_expired': 'Este enlace de confirmación caducó o ya se reemplazó. Vuelve a pedir los correos desde la encuesta.',
};
