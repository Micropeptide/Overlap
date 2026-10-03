// The privacy page. Every statement describes what the code actually does:
// translations must keep the exact meaning, adding or dropping nothing.
export default {
  'privacy.tabTitle': 'Privacidad',
  'privacy.title': 'Privacidad',
  'privacy.ledeRetention': 'Overlap recopila solo lo que necesita para encontrar un horario, lo conserva durante un tiempo limitado y te permite eliminarlo cuando quieras.',
  'privacy.ledeKept': 'Overlap recopila solo lo que necesita para encontrar un horario y te permite eliminarlo cuando quieras.',

  'privacy.storesHeading': 'Qué guarda Overlap',
  'privacy.storesPoll': 'De cada encuesta: su nombre y, si el organizador los añade, una nota, un lugar o enlace de llamada y una fecha de cierre. También las fechas (o los días de la semana) y los horarios ofrecidos, la zona horaria, la duración de la reunión, quién puede ver las respuestas y si está abierta, cerrada o tiene un horario definitivo.',
  'privacy.storesResponse': 'De cada respuesta: el nombre visible que escribió el invitado, los horarios que marcó (preferido, disponible o si es necesario) y su nota opcional.',
  'privacy.storesTimestamps': 'Cuándo se creó y se modificó por última vez cada encuesta y cada respuesta.',
  'privacy.storesLinkHash': 'Una huella codificada (un hash SHA-256) de cada enlace privado, para que el servidor pueda comprobar un enlace sin guardar una copia de él.',
  'privacy.storesPasswordHash': 'Si un organizador o un invitado añade una contraseña opcional: un hash SHA-256 de una clave generada a partir de ella en su navegador. Nunca la contraseña en sí.',
  'privacy.storesAttempts': 'Cuántas contraseñas incorrectas se probaron en cada encuesta durante la última hora (un número por encuesta, sin datos de conexión ni de dispositivo), para impedir que se adivinen.',
  'privacy.storesEmail': 'Solo si pides avisos por correo: tu dirección de correo electrónico, si la confirmaste y cuándo se te envió el último correo. Mientras alguien siga una encuesta por correo, Overlap también guarda una lista breve de qué cambió y cuándo (por ejemplo, “se añadió una respuesta”, con el id de la respuesta), para que el siguiente correo pueda decir qué hay de nuevo. Esa lista se borra a los 30 días.',

  'privacy.notCollectedHeading': 'Qué no recopila Overlap',
  'privacy.noAccountsWithEmails': 'Ni cuentas ni números de teléfono, y ninguna dirección de correo electrónico a menos que pidas correos.',
  'privacy.noAccounts': 'Ni cuentas, ni direcciones de correo electrónico, ni números de teléfono.',
  'privacy.passwordsLocal': 'Las contraseñas opcionales nunca salen de tu navegador. El navegador convierte la contraseña en una clave (PBKDF2-SHA-256, 210.000 rondas, con la encuesta como sal), envía solo esa clave, y el servidor guarda solo un hash de la clave.',
  'privacy.noCalendar': 'Sin acceso a tu calendario.',
  'privacy.noTracking': 'Sin cookies, analíticas, anuncios, píxeles de seguimiento ni scripts de terceros. Las fuentes se sirven desde este sitio.',
  'privacy.noIpLogs': 'Overlap no escribe direcciones IP en su base de datos ni en sus registros. Para frenar los abusos, cuenta las solicitudes de cada conexión en memoria durante aproximadamente una hora y después las olvida.',
  'privacy.hostingCloudflare': 'Esta copia de Overlap está alojada por dos empresas: GitHub Pages sirve las páginas y Cloudflare ejecuta la parte que guarda las encuestas (en su base de datos D1). Ambas ven tu dirección IP cuando te conectas y pueden conservar sus propios registros de red. Overlap desactiva el registro opcional de solicitudes de Cloudflare.',
  'privacy.hostingOther': 'La empresa que aloja una copia de Overlap puede conservar sus propios registros de red.',
  'privacy.resend': 'Los correos los envía Resend (resend.com), que recibe la dirección y el contenido del correo para entregarlo y conserva sus propios registros de entrega según su política de privacidad. Overlap no envía nada a Resend a menos que pidas un correo.',
  'privacy.calendarLinks': 'Si una encuesta tiene un horario definitivo, puedes abrirlo en Google Calendar u Outlook.com. Al hacer clic en uno de esos enlaces, esa empresa recibe el nombre, el horario, el lugar y la nota del evento, y el enlace para invitados de la encuesta; y cualquiera con el enlace para invitados puede ver la encuesta (y, a menos que los resultados estén ocultos, los nombres y horarios de todos). No se envía nada a menos que hagas clic.',

  'privacy.whoHeading': 'Quién puede ver qué',
  'privacy.guestLink': 'El enlace para invitados muestra la encuesta a cualquiera que lo tenga. De forma predeterminada, los invitados también pueden ver los nombres y horarios de los demás. El organizador puede cambiarlo a “Solo yo”, y entonces el servidor deja de enviar a los invitados las respuestas de otras personas.',
  'privacy.privateLink': 'El enlace privado permite a quien lo tenga editar, cerrar o eliminar la encuesta y quitar respuestas. El organizador puede reemplazarlo en cualquier momento, y así el anterior deja de funcionar.',
  'privacy.guestEditLink': 'Cada invitado recibe un enlace privado de edición que le permite cambiar o eliminar solo su propia respuesta. Escribir el nombre de otra persona no da acceso a su respuesta.',
  'privacy.passwordAccess': 'Un invitado que añade una contraseña también puede abrir su respuesta en otro dispositivo con su nombre y esa contraseña. Un organizador que define una contraseña puede abrir con ella la vista de organizador desde el enlace para invitados. Cualquiera de las dos contraseñas se puede cambiar o quitar más adelante.',
  'privacy.hiddenResults': 'Cuando los resultados están configurados como “Solo yo”, los invitados siguen viendo cuántas personas han respondido, pero no quiénes. En ese caso los nombres no tienen que ser únicos, así que probar un nombre tampoco revela nada.',
  'privacy.emailPrivate': 'Tu dirección de correo electrónico nunca se muestra al organizador, a los invitados ni en ninguna página. Solo quien la añadió puede verla o cambiarla, desde la página en la que la añadió. Los correos de avisos no contienen enlaces privados; solo los contiene el correo que pidas para recibir tu enlace.',
  'privacy.browserStorage': 'Tu navegador guarda algunas cosas en su propio almacenamiento, solo en tu dispositivo: los enlaces privados que usas (o las claves derivadas de contraseñas con las que iniciaste sesión), el último nombre que escribiste, tu zona horaria preferida y la configuración de formularios, y una respuesta que aún no has enviado (sus marcas, nombre y nota, para que no se pierdan al recargar). “Duplicar encuesta” guarda brevemente la configuración, el título, la nota y el lugar de la encuesta en el almacenamiento de sesión de la pestaña. Al borrar los datos de tu navegador se elimina todo esto; el servidor de Overlap nunca lo ve.',

  'privacy.retentionHeading': 'Cuánto tiempo se conservan los datos',
  // The paragraph is whole sentences; these two only set their order and spacing.
  'privacy.retentionParagraph': '{policy} {anytime} {afterDelete}',
  'privacy.retentionParagraphEmails': '{policy} {anytime} {emails} {afterDelete}',
  'privacy.retentionAuto': {
    one: 'Una encuesta y todas sus respuestas se eliminan automáticamente {count} día después de la última fecha de la encuesta. Una encuesta semanal no tiene última fecha, así que se elimina {count} día después de su último cambio: una edición, o una respuesta añadida o actualizada.',
    many: 'Una encuesta y todas sus respuestas se eliminan automáticamente {count} días después de la última fecha de la encuesta. Una encuesta semanal no tiene última fecha, así que se elimina {count} días después de su último cambio: una edición, o una respuesta añadida o actualizada.',
    other: 'Una encuesta y todas sus respuestas se eliminan automáticamente {count} días después de la última fecha de la encuesta. Una encuesta semanal no tiene última fecha, así que se elimina {count} días después de su último cambio: una edición, o una respuesta añadida o actualizada.',
  },
  'privacy.retentionKept': 'Overlap no elimina encuestas por su cuenta: una encuesta y sus respuestas se conservan hasta que el organizador elimina la encuesta.',
  'privacy.deleteAnytime': 'Los organizadores pueden eliminar una encuesta en cualquier momento, y los invitados pueden eliminar su propia respuesta en cualquier momento, incluso después de que la encuesta se cierre.',
  'privacy.emailDeletion': 'Una dirección de correo electrónico se elimina cuando dejas de recibir correos (desde la página de la encuesta o con el enlace de cualquier correo), cuando eliminas tu respuesta o cuando se elimina la encuesta. Una dirección usada solo para enviarte tu enlace no se guarda en absoluto.',
  'privacy.deletedCloudflare': {
    one: 'Los datos eliminados se quitan de inmediato de la base de datos activa. La base de datos de Cloudflare guarda un historial de restauración automático durante {count} día, así que durante ese tiempo quien gestione esta copia de Overlap aún podría recuperar una encuesta eliminada; después, desaparece.',
    many: 'Los datos eliminados se quitan de inmediato de la base de datos activa. La base de datos de Cloudflare guarda un historial de restauración automático durante {count} días, así que durante ese tiempo quien gestione esta copia de Overlap aún podría recuperar una encuesta eliminada; después, desaparece.',
    other: 'Los datos eliminados se quitan de inmediato de la base de datos activa. La base de datos de Cloudflare guarda un historial de restauración automático durante {count} días, así que durante ese tiempo quien gestione esta copia de Overlap aún podría recuperar una encuesta eliminada; después, desaparece.',
  },
  'privacy.deletedOther': 'Los datos eliminados se sobrescriben de inmediato en el archivo de la base de datos (con el borrado seguro de SQLite y vaciando su registro de escritura anticipada). Si quien gestiona esta copia de Overlap hace copias de seguridad, puede quedar una copia en ellas hasta que esas copias de seguridad caduquen.',

  'privacy.securityHeading': 'Seguridad, sin rodeos',
  'privacy.securityLinks': 'Los enlaces contienen claves aleatorias largas que, en la práctica, no se pueden adivinar. Las claves privadas van después del “#” del enlace, que los navegadores no envían al servidor ni a otros sitios, y el servidor solo las recibe en un encabezado de la solicitud. Las páginas usan una política de seguridad de contenido estricta y no envían la página de origen (referrer).',
  'privacy.securityPasswords': 'Una contraseña es tan segura como tú la hagas. Tras 30 contraseñas incorrectas en una hora, la encuesta deja de aceptar contraseñas (correctas o incorrectas) hasta que pasa la hora, mientras que los enlaces siguen funcionando. Alguien que obtuviera una copia de la base de datos aún podría intentar adivinar sin conexión una contraseña débil, así que usa una que no uses en ningún otro sitio.',
  // {transit} is privacy.httpsCloudflare or privacy.httpsOther, a whole sentence.
  'privacy.securityEncryption': 'Overlap no cifra el contenido de las encuestas en su base de datos, y las respuestas no son anónimas: cualquiera a quien des el enlace para invitados puede ver nombres y horarios. {transit} No uses Overlap para nada confidencial.',
  'privacy.httpsCloudflare': 'Solo se puede acceder a esta copia mediante HTTPS, así que las conexiones van cifradas en tránsito.',
  'privacy.httpsOther': 'Las conexiones solo van cifradas si esta copia de Overlap se sirve mediante HTTPS.',

  'privacy.sourceHeading': 'Código fuente',
  // {link} is the repository address, github.com/Micropeptide/Overlap.
  'privacy.source': 'Overlap es una aplicación pequeña, independiente y de código abierto (licencia MIT) creada por Micropeptide: {link}. Se inspiró en la herramienta de planificación de código abierto Timeful, pero no comparte código con ella.',
};
