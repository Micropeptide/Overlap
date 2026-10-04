export default {
  // States of a time. "word" forms sit inside a sentence ("Marked 9:00 AM as available");
  // "label" forms stand on their own (buttons, legends).
  'grid.wordPref': 'ưu tiên',
  'grid.wordYes': 'rảnh',
  'grid.wordMaybe': 'nếu cần',
  'grid.wordNo': 'không rảnh',
  'grid.wordUnanswered': 'chưa xem khung giờ này',
  'grid.labelPref': 'Ưu tiên',
  'grid.labelYes': 'Rảnh',
  'grid.labelMaybe': 'Nếu cần',
  'grid.labelNo': 'Không rảnh',
  'grid.labelUnanswered': 'Chưa trả lời',

  'grid.label': 'Lịch rảnh',
  'grid.timeHeading': 'Giờ',
  'grid.later': 'sau',
  'grid.repeatTime': '{time} (lặp lại)',
  'grid.dayHeadLabel': '{day}: đánh dấu hoặc bỏ đánh dấu cả ngày',
  'grid.rowHeadLabel': '{time}: đánh dấu hoặc bỏ đánh dấu trên mọi ngày',
  'grid.noTimes': 'Cuộc thăm dò này không có khung giờ nào để chọn.',

  // Spoken labels of grid cells. {day} and {time} name the cell, {state} is a "word" form above.
  'grid.cellEdit': '{day}, {time}, {state}',
  'grid.cellEditOthers': {
    other: '{day}, {time}, {state}, {count} trên {total} người khác rảnh',
  },
  'grid.slotEdit': '{time}, {state}',
  'grid.slotEditOthers': {
    other: '{time}, {state}, {count} trên {total} người khác rảnh',
  },
  'grid.cellPerson': '{day}, {time}, {name}: {state}',
  'grid.thisPerson': 'Người này',
  'grid.cellGroup': {
    other: '{day}, {time}, {count} trên {total} người rảnh',
  },
  'grid.cellGroupMaybe': {
    other: '{day}, {time}, {count} trên {total} người rảnh, {maybe} nếu cần',
  },
  'grid.cellGroupPref': {
    other: '{day}, {time}, {count} trên {total} người rảnh, {pref} ưu tiên giờ này',
  },
  'grid.cellGroupMaybePref': {
    other: '{day}, {time}, {count} trên {total} người rảnh, {maybe} nếu cần, {pref} ưu tiên giờ này',
  },

  // Screen reader announcements after marking. {state} is a "word" form above.
  'grid.markedDay': 'Đã đánh dấu {day} là {state}',
  'grid.clearedDay': 'Đã bỏ đánh dấu {day}',
  'grid.markedEveryDay': 'Đã đánh dấu {time} trên mọi ngày là {state}',
  'grid.clearedEveryDay': 'Đã bỏ đánh dấu {time} trên mọi ngày',
  'grid.markedWholeDay': 'Đã đánh dấu cả ngày là {state}',
  'grid.clearedWholeDay': 'Đã bỏ đánh dấu cả ngày',
  'grid.markedTimes': { other: 'Đã đánh dấu {count} khung giờ là {state}' },
  'grid.clearedTimes': { other: 'Đã bỏ đánh dấu {count} khung giờ' },
  'grid.timeMarked': 'Đã đánh dấu {time} là {state}',
  'grid.timeCleared': 'Đã bỏ đánh dấu {time}',
  'grid.markedRange': 'Đã đánh dấu từ {start} đến {end} là {state}',
  'grid.clearedRange': 'Đã bỏ đánh dấu từ {start} đến {end}',
  'grid.undone': 'Đã hoàn tác',
  'grid.redone': 'Đã làm lại',

  // Phones: one day at a time.
  'grid.chooseDay': 'Chọn một ngày',
  'grid.chipMarked': { other: '{day}, đã đánh dấu {count} khung giờ' },
  'grid.chipAvailable': '{day}, tối đa {count}/{total} người rảnh',
  'grid.previousDay': 'Trước: {day}',
  'grid.nextDay': 'Sau: {day}',
  'grid.selectRange': 'Chọn một khoảng',
  'grid.wholeDay': 'Cả ngày',
  'grid.clearDay': 'Xóa ngày',
  'grid.clear': 'Xóa',
  'grid.copyToEveryDay': 'Chép sang mọi ngày',
  'grid.copiedToEveryDay': 'Đã chép ngày này sang mọi ngày',
  'grid.clearedThisDay': 'Đã xóa ngày này',
  'grid.othersFree': { other: '{count} người khác rảnh' },
  'grid.rangeOn': 'Đang chọn khoảng: chạm vào điểm bắt đầu, rồi điểm kết thúc',
  'grid.rangeOff': 'Đã tắt chọn khoảng: mỗi lần chạm đánh dấu một khung giờ',
  'grid.rangeTip': 'Mẹo: “Chọn một khoảng” giúp đánh dấu một quãng dài chỉ với hai lần chạm.',
  'grid.rangeStartHint': 'Chạm vào điểm bắt đầu, rồi điểm kết thúc.',
  'grid.rangeEndClear': 'Từ {time}: chạm vào điểm kết thúc để xóa.',
  'grid.rangeEndMark': 'Từ {time}: chạm vào điểm kết thúc để đánh dấu “{mark}”.',
  'grid.rangeStarted': 'Từ {time}. Giờ hãy chạm vào điểm kết thúc.',
  'grid.cancelRange': 'Hủy',
  'grid.rangeCancelled': 'Đã hủy chọn khoảng',

  // Who can make one time.
  'grid.preferredNote': '(ưu tiên)',
  'grid.noResponses': 'Chưa có phản hồi nào',
  'grid.canMakeIt': { other: '{count} trên {total} người tham gia được' },
  'grid.canMakeItPrefer': {
    other: '{avail} trên {total} người tham gia được, {count} người ưu tiên giờ này',
  },
  'grid.whoYes': 'Rảnh ({count})',
  'grid.whoMaybe': 'Nếu cần ({count})',
  'grid.whoNo': 'Không rảnh ({count})',
  'grid.whoUnanswered': 'Chưa xem khung giờ này ({count})',
  'grid.chooseFinal': 'Chốt thời gian bắt đầu từ đây',
  'grid.moreChips': '+{count}',
};
