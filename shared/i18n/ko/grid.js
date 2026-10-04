export default {
  // States of a time. "word" forms sit inside a sentence; "label" forms stand on their own.
  'grid.wordPref': '선호',
  'grid.wordYes': '가능',
  'grid.wordMaybe': '필요 시 가능',
  'grid.wordNo': '불가',
  'grid.wordUnanswered': '이 시간을 아직 못 봄',
  'grid.labelPref': '선호',
  'grid.labelYes': '가능',
  'grid.labelMaybe': '필요 시 가능',
  'grid.labelNo': '불가',
  'grid.labelUnanswered': '응답 안 함',

  'grid.label': '가능 시간',
  'grid.timeHeading': '시간',
  'grid.later': '이후',
  'grid.repeatTime': '{time}(반복)',
  'grid.dayHeadLabel': '{day}: 하루 전체 표시 또는 비우기',
  'grid.rowHeadLabel': '{time}: 모든 날에 표시 또는 비우기',
  'grid.noTimes': '이 투표에는 고를 수 있는 시간이 없어요.',

  // Spoken labels of grid cells.
  'grid.cellEdit': '{day}, {time}, {state}',
  'grid.cellEditOthers': {
    other: '{day}, {time}, {state}, 다른 {total}명 중 {count}명 가능',
  },
  'grid.slotEdit': '{time}, {state}',
  'grid.slotEditOthers': {
    other: '{time}, {state}, 다른 {total}명 중 {count}명 가능',
  },
  'grid.cellPerson': '{day}, {time}, {name}: {state}',
  'grid.thisPerson': '이 사람',
  'grid.cellGroup': {
    other: '{day}, {time}, {total}명 중 {count}명 가능',
  },
  'grid.cellGroupMaybe': {
    other: '{day}, {time}, {total}명 중 {count}명 가능, {maybe}명 필요 시 가능',
  },
  'grid.cellGroupPref': {
    other: '{day}, {time}, {total}명 중 {count}명 가능, {pref}명 선호',
  },
  'grid.cellGroupMaybePref': {
    other: '{day}, {time}, {total}명 중 {count}명 가능, {maybe}명 필요 시 가능, {pref}명 선호',
  },

  // Screen reader announcements after marking.
  'grid.markedDay': '{day} 표시함: {state}',
  'grid.clearedDay': '{day} 비움',
  'grid.markedEveryDay': '모든 날의 {time} 표시함: {state}',
  'grid.clearedEveryDay': '모든 날의 {time} 비움',
  'grid.markedWholeDay': '하루 전체 표시함: {state}',
  'grid.clearedWholeDay': '하루 전체 비움',
  'grid.markedTimes': { other: '시간 {count}개 표시함: {state}' },
  'grid.clearedTimes': { other: '시간 {count}개 비움' },
  'grid.timeMarked': '{time} 표시함: {state}',
  'grid.timeCleared': '{time} 비움',
  'grid.markedRange': '{start}~{end} 표시함: {state}',
  'grid.clearedRange': '{start}~{end} 비움',
  'grid.undone': '실행 취소함',
  'grid.redone': '다시 실행함',

  // Phones: one day at a time.
  'grid.chooseDay': '날짜 선택',
  'grid.chipMarked': { other: '{day}, 시간 {count}개 표시함' },
  'grid.chipAvailable': '{day}, 최대 {count}/{total}명 가능',
  'grid.previousDay': '이전: {day}',
  'grid.nextDay': '다음: {day}',
  'grid.selectRange': '범위 선택',
  'grid.wholeDay': '하루 전체',
  'grid.clearDay': '이날 비우기',
  'grid.clear': '비우기',
  'grid.copyToEveryDay': '모든 날에 복사',
  'grid.copiedToEveryDay': '이날을 모든 날에 복사했어요',
  'grid.clearedThisDay': '이날을 비웠어요',
  'grid.othersFree': { other: '다른 {count}명 가능' },
  'grid.rangeOn': '범위 선택 켜짐: 범위가 시작되는 곳과 끝나는 곳을 차례로 탭하세요',
  'grid.rangeOff': '범위 선택 꺼짐: 탭할 때마다 시간을 하나씩 표시해요',
  'grid.rangeTip': '팁: “범위 선택”을 쓰면 두 번만 탭해서 긴 시간을 표시할 수 있어요.',
  'grid.rangeStartHint': '범위가 시작되는 곳과 끝나는 곳을 차례로 탭하세요.',
  'grid.rangeEndClear': '{time}부터: 끝나는 곳을 탭하면 비워져요.',
  'grid.rangeEndMark': '{time}부터: 끝나는 곳을 탭하면 “{mark}” 상태로 표시돼요.',
  'grid.rangeStarted': '{time}부터. 이제 끝나는 곳을 탭하세요.',
  'grid.cancelRange': '취소',
  'grid.rangeCancelled': '범위 선택 취소됨',

  // Who can make one time.
  'grid.preferredNote': '(선호)',
  'grid.noResponses': '아직 응답이 없어요',
  'grid.canMakeIt': { other: '{total}명 중 {count}명 가능' },
  'grid.canMakeItPrefer': {
    other: '{total}명 중 {avail}명 가능, {count}명이 이 시간 선호',
  },
  'grid.whoYes': '가능({count})',
  'grid.whoMaybe': '필요 시 가능({count})',
  'grid.whoNo': '불가({count})',
  'grid.whoUnanswered': '이 시간을 아직 못 봄({count})',
  'grid.chooseFinal': '여기서 시작하는 확정 시간 선택',
  'grid.moreChips': '+{count}',
};
