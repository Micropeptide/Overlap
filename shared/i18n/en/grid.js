export default {
  // States of a time. "word" forms sit inside a sentence ("Marked 9:00 AM as available");
  // "label" forms stand on their own (buttons, legends).
  'grid.wordPref': 'preferred',
  'grid.wordYes': 'available',
  'grid.wordMaybe': 'if needed',
  'grid.wordNo': 'not available',
  'grid.wordUnanswered': 'has not seen this time',
  'grid.labelPref': 'Preferred',
  'grid.labelYes': 'Available',
  'grid.labelMaybe': 'If needed',
  'grid.labelNo': 'Not available',
  'grid.labelUnanswered': 'Not answered',

  'grid.label': 'Availability',
  'grid.timeHeading': 'Time',
  'grid.later': 'later',
  'grid.repeatTime': '{time} (repeat)',
  'grid.dayHeadLabel': '{day}: mark or clear the whole day',
  'grid.rowHeadLabel': '{time}: mark or clear on every day',
  'grid.noTimes': 'This poll has no times to choose from.',

  // Spoken labels of grid cells. {day} and {time} name the cell, {state} is a "word" form above.
  'grid.cellEdit': '{day}, {time}, {state}',
  'grid.cellEditOthers': {
    one: '{day}, {time}, {state}, {count} of {total} others free',
    other: '{day}, {time}, {state}, {count} of {total} others free',
  },
  'grid.slotEdit': '{time}, {state}',
  'grid.slotEditOthers': {
    one: '{time}, {state}, {count} of {total} others free',
    other: '{time}, {state}, {count} of {total} others free',
  },
  'grid.cellPerson': '{day}, {time}, {name}: {state}',
  'grid.thisPerson': 'This person',
  'grid.cellGroup': {
    one: '{day}, {time}, {count} of {total} available',
    other: '{day}, {time}, {count} of {total} available',
  },
  'grid.cellGroupMaybe': {
    one: '{day}, {time}, {count} of {total} available, {maybe} if needed',
    other: '{day}, {time}, {count} of {total} available, {maybe} if needed',
  },
  'grid.cellGroupPref': {
    one: '{day}, {time}, {count} of {total} available, {pref} prefer this',
    other: '{day}, {time}, {count} of {total} available, {pref} prefer this',
  },
  'grid.cellGroupMaybePref': {
    one: '{day}, {time}, {count} of {total} available, {maybe} if needed, {pref} prefer this',
    other: '{day}, {time}, {count} of {total} available, {maybe} if needed, {pref} prefer this',
  },

  // Screen reader announcements after marking. {state} is a "word" form above.
  'grid.markedDay': 'Marked {day} as {state}',
  'grid.clearedDay': 'Cleared {day}',
  'grid.markedEveryDay': 'Marked {time} on every day as {state}',
  'grid.clearedEveryDay': 'Cleared {time} on every day',
  'grid.markedWholeDay': 'Marked the whole day as {state}',
  'grid.clearedWholeDay': 'Cleared the whole day',
  'grid.markedTimes': { one: 'Marked {count} time as {state}', other: 'Marked {count} times as {state}' },
  'grid.clearedTimes': { one: 'Cleared {count} time', other: 'Cleared {count} times' },
  'grid.timeMarked': '{time} marked {state}',
  'grid.timeCleared': '{time} cleared',
  'grid.markedRange': 'Marked {start} to {end} as {state}',
  'grid.clearedRange': 'Cleared {start} to {end}',
  'grid.undone': 'Undone',
  'grid.redone': 'Redone',

  // Phones: one day at a time.
  'grid.chooseDay': 'Choose a day',
  'grid.chipMarked': { one: '{day}, {count} time marked', other: '{day}, {count} times marked' },
  'grid.chipAvailable': '{day}, up to {count}/{total} available',
  'grid.previousDay': 'Previous: {day}',
  'grid.nextDay': 'Next: {day}',
  'grid.selectRange': 'Select a range',
  'grid.wholeDay': 'Whole day',
  'grid.clearDay': 'Clear day',
  'grid.clear': 'Clear',
  'grid.copyToEveryDay': 'Copy to every day',
  'grid.copiedToEveryDay': 'Copied this day to every day',
  'grid.clearedThisDay': 'Cleared this day',
  'grid.othersFree': { one: '{count} other free', other: '{count} others free' },
  'grid.rangeOn': 'Range on: tap where the range starts, then where it ends',
  'grid.rangeOff': 'Range off: each tap marks one time',
  'grid.rangeTip': 'Tip: “Select a range” marks a long stretch with just two taps.',
  'grid.rangeStartHint': 'Tap where the range starts, then where it ends.',
  'grid.rangeEndClear': 'From {time}: tap the end to clear.',
  'grid.rangeEndMark': 'From {time}: tap the end to mark “{mark}”.',
  'grid.rangeStarted': 'From {time}. Now tap where it ends.',
  'grid.cancelRange': 'Cancel',
  'grid.rangeCancelled': 'Range cancelled',

  // Who can make one time.
  'grid.preferredNote': '(preferred)',
  'grid.noResponses': 'No responses yet',
  'grid.canMakeIt': { one: '{count} of {total} can make it', other: '{count} of {total} can make it' },
  'grid.canMakeItPrefer': {
    one: '{avail} of {total} can make it, {count} prefers this time',
    other: '{avail} of {total} can make it, {count} prefer this time',
  },
  'grid.whoYes': 'Available ({count})',
  'grid.whoMaybe': 'If needed ({count})',
  'grid.whoNo': 'Not available ({count})',
  'grid.whoUnanswered': 'Haven’t seen this time ({count})',
  'grid.chooseFinal': 'Choose a final time starting here',
  // Phone results: after the colored initials of the first few people free at a time.
  'grid.moreChips': '+{count}',
};
