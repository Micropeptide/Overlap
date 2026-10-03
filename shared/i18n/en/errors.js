// Errors the server reports, by their `code` (server/validate.js, server/api.js,
// server/ratelimit.js). The English matches the server's own `error` text.
// {field} is an API field name such as "available"; it is left as it is.
export default {
  // Poll fields
  'errors.not_text': '{field} must be text.',
  'errors.title_required': 'Add a title.',
  'errors.name_required': 'Add a name.',
  'errors.title_too_long': { one: 'Keep the title under {count} character.', other: 'Keep the title under {count} characters.' },
  'errors.description_too_long': { one: 'Keep the description under {count} character.', other: 'Keep the description under {count} characters.' },
  'errors.location_too_long': { one: 'Keep the location under {count} character.', other: 'Keep the location under {count} characters.' },
  'errors.note_too_long': { one: 'Keep the note under {count} character.', other: 'Keep the note under {count} characters.' },
  'errors.name_too_long': { one: 'Keep the name under {count} character.', other: 'Keep the name under {count} characters.' },
  'errors.not_whole_number': '{field} must be a whole number.',
  'errors.poll_not_object': 'Send the poll as a JSON object.',
  'errors.closes_on_invalid': 'Choose a valid closing date within the next three years.',
  'errors.closes_on_passed': 'That closing date has already passed. Pick today or later.',
  'errors.timezone_invalid': 'Choose a valid time zone, such as Europe/London.',
  'errors.kind_invalid': 'Choose specific dates or days of the week.',
  'errors.weekly_sent_dates': 'This is a weekly poll. Send "weekdays" instead of "dates".',
  'errors.weekdays_required': 'Pick at least one day of the week.',
  'errors.weekdays_invalid': 'Days of the week must be numbers from 0 (Sunday) to 6 (Saturday).',
  'errors.dates_sent_weekdays': 'This poll uses specific dates. Send "dates" instead of "weekdays".',
  'errors.dates_required': 'Pick at least one date.',
  'errors.too_many_dates': { one: 'Pick {count} date or fewer.', other: 'Pick {count} dates or fewer.' },
  'errors.date_invalid': '"{date}" is not a valid date.',
  'errors.dates_out_of_range': 'Pick dates within the next three years.',
  'errors.dates_all_passed': 'All of those dates have passed. Pick at least one upcoming date.',
  'errors.slot_minutes_invalid': 'Time steps must be 15, 30 or 60 minutes.',
  'errors.end_before_start': 'The end time must be after the start time.',
  'errors.duration_invalid': 'Meeting length must be between 15 minutes and 12 hours.',
  'errors.allow_edits_invalid': 'Say whether guests can change their answers (true or false).',
  'errors.visibility_invalid': 'Choose who can see responses.',
  'errors.times_misaligned': { one: 'Start and end times must line up with {count}-minute steps.', other: 'Start and end times must line up with {count}-minute steps.' },
  'errors.range_too_short': 'The time range is shorter than one time step.',
  'errors.duration_too_long': 'The meeting is longer than the time range. Widen the times or shorten the meeting.',
  'errors.too_many_slots': 'That is too many times to choose from. Pick fewer dates or a shorter range.',
  'errors.no_slots': 'None of those times exist in that time zone.',

  // Responses
  'errors.response_not_object': 'Send the response as a JSON object.',
  'errors.name_invisible': 'Add a name people can see.',
  'errors.not_time_list': '{field} must be a list of times.',

  // Final time
  'errors.final_required': 'Choose a start and end time.',
  'errors.final_end_before_start': 'The final time must end after it starts.',
  'errors.final_too_long': 'The final time can be at most 24 hours long.',
  'errors.final_bad_length': 'The final time’s length must be a whole number of 5-minute steps.',
  'errors.final_not_a_time': 'The final time must start at one of the poll’s times.',

  // Requests
  'errors.too_many_requests': 'Too many requests from this connection. Wait a few minutes and try again.',
  'errors.json_required': 'Send JSON with Content-Type: application/json.',
  'errors.body_too_large': 'That request is too large.',
  'errors.invalid_json': 'The request body is not valid JSON.',
  'errors.method_not_allowed': 'That method is not allowed here.',
  'errors.not_found': 'Not found.',
  'errors.server_error': 'Something went wrong on our side. Please try again.',

  // Polls and access
  'errors.poll_not_found': 'This poll does not exist. It may have been deleted or expired.',
  'errors.admin_link_or_password_wrong': 'That private link or password is not right. The link may have been replaced, or the password changed.',
  'errors.admin_link_invalid': 'This private link is not valid. It may have been replaced.',
  'errors.changes_not_object': 'Send the changes as a JSON object.',
  'errors.reopen_with_final': 'Reopening a poll clears its final time, so send one or the other.',
  'errors.status_invalid': 'Status must be "open" or "closed".',
  'errors.no_final_time': 'This poll does not have a final time yet.',

  // Answering
  'errors.poll_closed': 'This poll is closed, so it is not taking new responses.',
  'errors.poll_closed_no_changes': 'This poll is closed, so responses can no longer be changed.',
  'errors.edits_not_allowed': 'The organizer doesn’t allow changing answers after they’re sent. You can still delete yours.',
  'errors.too_many_responses': { one: 'This poll already has {count} response.', other: 'This poll already has {count} responses.' },
  'errors.name_taken': 'Someone already responded as “{name}”. If that was you, open your private edit link. Otherwise, add a last initial.',
  'errors.name_taken_other': 'Someone else already responded as “{name}”. Try adding a last initial.',
  'errors.response_not_found': 'That response no longer exists.',
  'errors.my_response_not_found': 'We could not find your response. It may have been deleted.',
  'errors.not_your_response': 'Only the person who sent this response can change it.',

  // Passwords
  'errors.password_unreadable': 'That password could not be read. Reload the page and try again.',
  'errors.too_many_wrong_passwords': 'Too many wrong passwords for this poll. Wait an hour and try again, or use your private link.',
  'errors.password_no_longer_works': 'That password no longer works for this response. It may have been changed.',
  'errors.sign_in_incomplete': 'Enter the name you answered with and your password.',
  'errors.sign_in_failed': 'That name and password don’t match a response with a password. Check the spelling, or use your private edit link.',

  // Email
  'errors.email_not_set_up': 'Email isn’t set up on this copy of Overlap.',
  'errors.email_invalid': 'That doesn’t look like an email address.',
  'errors.link_not_current': 'That private link isn’t current. Reload the page and try again.',
  'errors.email_nothing_chosen': 'Choose what to email: your link, updates, or both.',
  'errors.email_daily_limit': 'Overlap has sent enough emails to that address (or for this poll) today. Try again tomorrow.',
  'errors.email_send_failed': 'The email couldn’t be sent just now. Try again in a minute.',
  'errors.confirm_link_expired': 'This confirmation link has expired or was already replaced. Ask for emails again from the poll.',
};
