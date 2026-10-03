export default {
  // States of a time. "word" forms sit inside a sentence; "label" forms stand on their own.
  'grid.wordPref': 'สะดวกที่สุด',
  'grid.wordYes': 'ว่าง',
  'grid.wordMaybe': 'ได้ถ้าจำเป็น',
  'grid.wordNo': 'ไม่ว่าง',
  'grid.wordUnanswered': 'ยังไม่เห็นช่วงเวลานี้',
  'grid.labelPref': 'สะดวกที่สุด',
  'grid.labelYes': 'ว่าง',
  'grid.labelMaybe': 'ได้ถ้าจำเป็น',
  'grid.labelNo': 'ไม่ว่าง',
  'grid.labelUnanswered': 'ยังไม่ตอบ',

  'grid.label': 'เวลาว่าง',
  'grid.timeHeading': 'เวลา',
  'grid.later': 'ภายหลัง',
  'grid.repeatTime': '{time} (ซ้ำ)',
  'grid.dayHeadLabel': '{day}: ทำเครื่องหมายหรือล้างทั้งวัน',
  'grid.rowHeadLabel': '{time}: ทำเครื่องหมายหรือล้างในทุกวัน',
  'grid.noTimes': 'โพลนี้ไม่มีช่วงเวลาให้เลือก',

  // Spoken labels of grid cells.
  'grid.cellEdit': '{day} {time} {state}',
  'grid.cellEditOthers': {
    other: '{day} {time} {state} คนอื่นว่าง {count} จาก {total} คน',
  },
  'grid.slotEdit': '{time} {state}',
  'grid.slotEditOthers': {
    other: '{time} {state} คนอื่นว่าง {count} จาก {total} คน',
  },
  'grid.cellPerson': '{day} {time} {name}: {state}',
  'grid.thisPerson': 'คนนี้',
  'grid.cellGroup': {
    other: '{day} {time} ว่าง {count} จาก {total} คน',
  },
  'grid.cellGroupMaybe': {
    other: '{day} {time} ว่าง {count} จาก {total} คน ได้ถ้าจำเป็น {maybe} คน',
  },
  'grid.cellGroupPref': {
    other: '{day} {time} ว่าง {count} จาก {total} คน สะดวกที่สุด {pref} คน',
  },
  'grid.cellGroupMaybePref': {
    other: '{day} {time} ว่าง {count} จาก {total} คน ได้ถ้าจำเป็น {maybe} คน สะดวกที่สุด {pref} คน',
  },

  // Screen reader announcements after marking.
  'grid.markedDay': 'ทำเครื่องหมาย {day} เป็น “{state}” แล้ว',
  'grid.clearedDay': 'ล้าง {day} แล้ว',
  'grid.markedEveryDay': 'ทำเครื่องหมาย {time} ทุกวันเป็น “{state}” แล้ว',
  'grid.clearedEveryDay': 'ล้าง {time} ทุกวันแล้ว',
  'grid.markedWholeDay': 'ทำเครื่องหมายทั้งวันเป็น “{state}” แล้ว',
  'grid.clearedWholeDay': 'ล้างทั้งวันแล้ว',
  'grid.markedTimes': { other: 'ทำเครื่องหมาย {count} ช่วงเวลาเป็น “{state}” แล้ว' },
  'grid.clearedTimes': { other: 'ล้าง {count} ช่วงเวลาแล้ว' },
  'grid.timeMarked': '{time} ทำเครื่องหมายเป็น “{state}”',
  'grid.timeCleared': '{time} ล้างแล้ว',
  'grid.markedRange': 'ทำเครื่องหมาย {start} ถึง {end} เป็น “{state}” แล้ว',
  'grid.clearedRange': 'ล้าง {start} ถึง {end} แล้ว',
  'grid.undone': 'เลิกทำแล้ว',
  'grid.redone': 'ทำซ้ำแล้ว',

  // Phones: one day at a time.
  'grid.chooseDay': 'เลือกวัน',
  'grid.chipMarked': { other: '{day} ทำเครื่องหมายแล้ว {count} ช่วงเวลา' },
  'grid.chipAvailable': '{day} ว่างสูงสุด {count}/{total} คน',
  'grid.previousDay': 'ก่อนหน้า: {day}',
  'grid.nextDay': 'ถัดไป: {day}',
  'grid.selectRange': 'เลือกเป็นช่วง',
  'grid.wholeDay': 'ทั้งวัน',
  'grid.clearDay': 'ล้างทั้งวัน',
  'grid.clear': 'ล้าง',
  'grid.copyToEveryDay': 'คัดลอกไปทุกวัน',
  'grid.copiedToEveryDay': 'คัดลอกไปทุกวันแล้ว',
  'grid.clearedThisDay': 'ล้างทั้งวันแล้ว',
  'grid.othersFree': { other: 'คนอื่นว่าง {count} คน' },
  'grid.rangeOn': 'โหมดช่วงเปิดอยู่: แตะจุดเริ่มต้นของช่วง แล้วแตะจุดสิ้นสุด',
  'grid.rangeOff': 'โหมดช่วงปิดอยู่: แตะหนึ่งครั้งทำเครื่องหมายหนึ่งช่วงเวลา',
  'grid.rangeTip': 'เคล็ดลับ: “เลือกเป็นช่วง” ทำเครื่องหมายช่วงยาวๆ ได้ด้วยการแตะแค่สองครั้ง',
  'grid.rangeStartHint': 'แตะจุดเริ่มต้นของช่วง แล้วแตะจุดสิ้นสุด',
  'grid.rangeEndClear': 'เริ่มจาก {time}: แตะจุดสิ้นสุดเพื่อล้าง',
  'grid.rangeEndMark': 'เริ่มจาก {time}: แตะจุดสิ้นสุดเพื่อทำเครื่องหมาย “{mark}”',
  'grid.rangeStarted': 'เริ่มจาก {time} ต่อไปแตะจุดสิ้นสุด',
  'grid.cancelRange': 'ยกเลิก',
  'grid.rangeCancelled': 'ยกเลิกการเลือกช่วงแล้ว',

  // Who can make one time.
  'grid.preferredNote': '(สะดวกที่สุด)',
  'grid.noResponses': 'ยังไม่มีคำตอบ',
  'grid.canMakeIt': { other: 'มาได้ {count} จาก {total} คน' },
  'grid.canMakeItPrefer': {
    other: 'มาได้ {avail} จาก {total} คน สะดวกที่สุด {count} คน',
  },
  'grid.whoYes': 'ว่าง ({count})',
  'grid.whoMaybe': 'ได้ถ้าจำเป็น ({count})',
  'grid.whoNo': 'ไม่ว่าง ({count})',
  'grid.whoUnanswered': 'ยังไม่เห็นช่วงเวลานี้ ({count})',
  'grid.chooseFinal': 'เลือกเวลาสรุปที่เริ่มตรงนี้',
};
