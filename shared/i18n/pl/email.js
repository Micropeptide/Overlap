// Emails, written in the language of the person who asked for them.
export default {
  // The one email sent when someone types their address
  'email.subjectConfirm': 'Potwierdź e-maile o „{title}”',
  'email.subjectLink': 'Twój link do „{title}”',
  'email.linkOrganizer': 'Oto twój prywatny link do „{title}”. Pozwala edytować, zamknąć lub usunąć ankietę, więc zachowaj go dla siebie:',
  'email.linkGuest': 'Oto twój prywatny link do edycji dla „{title}”. Pozwala zmienić lub usunąć twoją odpowiedź, więc zachowaj go dla siebie:',
  'email.confirmOrganizer': 'Aby dostawać e-mail, gdy ktoś odpowie lub zmieni odpowiedź, potwierdź poniżej. Dostaniesz najwyżej jeden e-mail na 30 minut.',
  'email.confirmGuest': 'Aby dostawać e-mail, gdy organizator wybierze termin lub zmieni ankietę, potwierdź poniżej. Dostaniesz najwyżej jeden e-mail na 30 minut.',
  'email.confirmGuestPublic': 'Aby dostawać e-mail, gdy organizator wybierze termin lub zmieni ankietę albo gdy ktoś odpowie, potwierdź poniżej. Dostaniesz najwyżej jeden e-mail na 30 minut.',
  'email.confirmButton': 'Potwierdź powiadomienia e-mail',
  'email.welcomeFooter': 'Dostajesz tę wiadomość, bo ktoś wpisał ten adres w Overlap. Jeśli to nie ty, zignoruj ją: nic więcej nie zostanie wysłane.',

  // Update emails
  'email.subjectUpdates': 'Zmiany w „{title}”',
  'email.news': 'Nowości w „{title}”:',
  'email.finalPicked': 'Organizator wybrał termin: {time}.',
  'email.closed': 'Organizator zamknął ankietę.',
  'email.reopened': 'Ankieta jest znów otwarta.',
  'email.edited': 'Organizator zmienił ankietę. Sprawdź, czy twoja odpowiedź nadal pasuje.',
  'email.newResponses': {
    one: 'Nowa odpowiedź: {names}.',
    few: 'Nowe odpowiedzi: {names}.',
    many: 'Nowe odpowiedzi: {names}.',
    other: 'Nowe odpowiedzi: {names}.',
  },
  'email.changedAnswers': {
    one: 'Zmiana odpowiedzi: {names}.',
    few: 'Zmiany odpowiedzi: {names}.',
    many: 'Zmiany odpowiedzi: {names}.',
    other: 'Zmiany odpowiedzi: {names}.',
  },
  'email.removed': {
    one: 'Usunięto jedną odpowiedź.',
    few: 'Usunięto {count} odpowiedzi.',
    many: 'Usunięto {count} odpowiedzi.',
    other: 'Usunięto {count} odpowiedzi.',
  },
  'email.respondedSoFar': {
    one: 'Na razie odpowiedziała {count} osoba.',
    few: 'Na razie odpowiedziały {count} osoby.',
    many: 'Na razie odpowiedziało {count} osób.',
    other: 'Na razie odpowiedziało {count} osoby.',
  },
  'email.nameSeparator': ', ',
  'email.openPoll': 'Otwórz ankietę',
  'email.openOrganizerView': 'Otwórz widok organizatora',
  'email.guestFooter': 'Link otwiera ankietę. Na urządzeniu, z którego wysłano odpowiedź, twoja odpowiedź już tam jest.',
  'email.organizerFooter': 'Link otwiera widok organizatora w przeglądarce, w której utworzono ankietę. Gdzie indziej użyj prywatnego linku lub hasła organizatora.',
  'email.stop': 'Wyłącz te e-maile: {url}',

  // A time in an email
  'email.timeRange': '{day}, {start} – {end} (czas: {zone})',
  'email.timeRangeWeekly': 'Co tydzień: {day}, {start} – {end} (czas: {zone})',
  // The plain-text version of the email's button
  'email.buttonText': '{label}: {url}',
};
