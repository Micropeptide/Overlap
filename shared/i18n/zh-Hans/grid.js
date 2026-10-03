export default {
  // States of a time. "word" forms sit inside a sentence ("Marked 9:00 AM as available");
  // "label" forms stand on their own (buttons, legends).
  'grid.wordPref': '首选',
  'grid.wordYes': '有空',
  'grid.wordMaybe': '勉强可以',
  'grid.wordNo': '没空',
  'grid.wordUnanswered': '还没看到这个时间',
  'grid.labelPref': '首选',
  'grid.labelYes': '有空',
  'grid.labelMaybe': '勉强可以',
  'grid.labelNo': '没空',
  'grid.labelUnanswered': '未回复',

  'grid.label': '空闲时间',
  'grid.timeHeading': '时间',
  'grid.later': '之后',
  'grid.repeatTime': '{time}（重复）',
  'grid.dayHeadLabel': '{day}：标记或清除整天',
  'grid.rowHeadLabel': '{time}：在每一天标记或清除',
  'grid.noTimes': '此投票没有可选的时间。',

  // Spoken labels of grid cells. {day} and {time} name the cell, {state} is a "word" form above.
  'grid.cellEdit': '{day}，{time}，{state}',
  'grid.cellEditOthers': {
    other: '{day}，{time}，{state}，其他 {total} 人中有 {count} 人有空',
  },
  'grid.slotEdit': '{time}，{state}',
  'grid.slotEditOthers': {
    other: '{time}，{state}，其他 {total} 人中有 {count} 人有空',
  },
  'grid.cellPerson': '{day}，{time}，{name}：{state}',
  'grid.thisPerson': '此人',
  'grid.cellGroup': {
    other: '{day}，{time}，{total} 人中有 {count} 人有空',
  },
  'grid.cellGroupMaybe': {
    other: '{day}，{time}，{total} 人中有 {count} 人有空，{maybe} 人勉强可以',
  },
  'grid.cellGroupPref': {
    other: '{day}，{time}，{total} 人中有 {count} 人有空，{pref} 人首选',
  },
  'grid.cellGroupMaybePref': {
    other: '{day}，{time}，{total} 人中有 {count} 人有空，{maybe} 人勉强可以，{pref} 人首选',
  },

  // Screen reader announcements after marking. {state} is a "word" form above.
  'grid.markedDay': '已将{day}标记为{state}',
  'grid.clearedDay': '已清除{day}',
  'grid.markedEveryDay': '已将每一天的{time}标记为{state}',
  'grid.clearedEveryDay': '已清除每一天的{time}',
  'grid.markedWholeDay': '已将整天标记为{state}',
  'grid.clearedWholeDay': '已清除整天',
  'grid.markedTimes': { other: '已将 {count} 个时间标记为{state}' },
  'grid.clearedTimes': { other: '已清除 {count} 个时间' },
  'grid.timeMarked': '{time}已标记为{state}',
  'grid.timeCleared': '{time}已清除',
  'grid.markedRange': '已将{start}至{end}标记为{state}',
  'grid.clearedRange': '已清除{start}至{end}',
  'grid.undone': '已撤销',
  'grid.redone': '已重做',

  // Phones: one day at a time.
  'grid.chooseDay': '选择日期',
  'grid.chipMarked': { other: '{day}，已标记 {count} 个时间' },
  'grid.chipAvailable': '{day}，最多 {count}/{total} 人有空',
  'grid.previousDay': '上一天：{day}',
  'grid.nextDay': '下一天：{day}',
  'grid.selectRange': '选择范围',
  'grid.wholeDay': '整天',
  'grid.clearDay': '清除当天',
  'grid.clear': '清除',
  'grid.copyToEveryDay': '复制到每一天',
  'grid.copiedToEveryDay': '已将这一天复制到每一天',
  'grid.clearedThisDay': '已清除这一天',
  'grid.othersFree': { other: '其他人中 {count} 人有空' },
  'grid.rangeOn': '范围模式已开启：先点起点，再点终点',
  'grid.rangeOff': '范围模式已关闭：每点一下标记一个时间',
  'grid.rangeTip': '提示：用“选择范围”，点两下就能标记一长段时间。',
  'grid.rangeStartHint': '先点范围的起点，再点终点。',
  'grid.rangeEndClear': '从{time}开始：点终点即可清除。',
  'grid.rangeEndMark': '从{time}开始：点终点即可标记为“{mark}”。',
  'grid.rangeStarted': '从{time}开始。现在点终点。',
  'grid.cancelRange': '取消',
  'grid.rangeCancelled': '已取消范围选择',

  // Who can make one time.
  'grid.preferredNote': '（首选）',
  'grid.noResponses': '还没有回复',
  'grid.canMakeIt': { other: '{total} 人中有 {count} 人能参加' },
  'grid.canMakeItPrefer': {
    other: '{total} 人中有 {avail} 人能参加，{count} 人首选此时间',
  },
  'grid.whoYes': '有空（{count}）',
  'grid.whoMaybe': '勉强可以（{count}）',
  'grid.whoNo': '没空（{count}）',
  'grid.whoUnanswered': '还没看到这个时间（{count}）',
  'grid.chooseFinal': '选定从这里开始的最终时间',
};
