// Emails (server/email.js), written in the language of the person who asked
// for them. {title} is the poll's title; {url} a web address; {names} a list
// of the names people typed, joined with email.nameSeparator.
export default {
  // The one email sent when someone types their address
  'email.subjectConfirm': 'Confirm emails about “{title}”',
  'email.subjectLink': 'Your link for “{title}”',
  'email.linkOrganizer': 'Here is your private link for “{title}”. It lets you edit, close or delete the poll, so keep it to yourself:',
  'email.linkGuest': 'Here is your private edit link for “{title}”. It lets you change or delete your response, so keep it to yourself:',
  'email.confirmOrganizer': 'To get an email when people respond or change their answers, confirm below. You’ll get at most one email every 30 minutes.',
  'email.confirmGuest': 'To get an email when the organizer picks a time or changes the poll, confirm below. You’ll get at most one email every 30 minutes.',
  'email.confirmGuestPublic': 'To get an email when the organizer picks a time or changes the poll, or when people respond, confirm below. You’ll get at most one email every 30 minutes.',
  'email.confirmButton': 'Confirm email updates',
  'email.welcomeFooter': 'You’re getting this because someone typed this address into Overlap. If it wasn’t you, ignore it: nothing more will be sent.',

  // Update emails
  'email.subjectUpdates': 'Updates to “{title}”',
  'email.news': 'News about “{title}”:',
  'email.finalPicked': 'The organizer picked a time: {time}.',
  'email.closed': 'The organizer closed the poll.',
  'email.reopened': 'The poll is open again.',
  'email.edited': 'The organizer changed the poll. Check that your answer still fits.',
  'email.newResponses': { one: 'New response: {names}.', other: 'New responses: {names}.' },
  'email.changedAnswers': { one: 'Changed their answer: {names}.', other: 'Changed their answer: {names}.' },
  'email.removed': { one: 'One response was removed.', other: '{count} responses were removed.' },
  'email.respondedSoFar': { one: '{count} person has responded so far.', other: '{count} people have responded so far.' },
  'email.nameSeparator': ', ',
  'email.openPoll': 'Open the poll',
  'email.openOrganizerView': 'Open the organizer view',
  'email.guestFooter': 'The link opens the poll. On the device you answered from, your response is already there.',
  'email.organizerFooter': 'The link opens the organizer view in the browser where you created the poll. Elsewhere, use your private link or organizer password.',
  'email.stop': 'Stop these emails: {url}',

  // A time in an email: {day} is a date or weekday, {start} and {end} times, {zone} a time zone such as "America/New York"
  'email.timeRange': '{day}, {start} – {end} ({zone} time)',
  'email.timeRangeWeekly': 'Every {day}, {start} – {end} ({zone} time)',
  // The plain-text version of the email's button
  'email.buttonText': '{label}: {url}',
};
