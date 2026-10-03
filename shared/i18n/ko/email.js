export default {
  // The one email sent when someone types their address
  'email.subjectConfirm': '“{title}” 관련 이메일 수신 확인',
  'email.subjectLink': '“{title}”의 내 링크',
  'email.linkOrganizer': '“{title}”의 비공개 링크예요. 이 링크로 투표를 수정, 마감, 삭제할 수 있으니 다른 사람과 공유하지 마세요:',
  'email.linkGuest': '“{title}”의 비공개 수정 링크예요. 이 링크로 내 응답을 수정하거나 삭제할 수 있으니 다른 사람과 공유하지 마세요:',
  'email.confirmOrganizer': '사람들이 응답하거나 응답을 수정할 때 이메일을 받으려면 아래에서 확인해 주세요. 이메일은 30분에 최대 한 번 보내요.',
  'email.confirmGuest': '주최자가 시간을 정하거나 투표를 수정할 때 이메일을 받으려면 아래에서 확인해 주세요. 이메일은 30분에 최대 한 번 보내요.',
  'email.confirmGuestPublic': '주최자가 시간을 정하거나 투표를 수정할 때, 또는 사람들이 응답할 때 이메일을 받으려면 아래에서 확인해 주세요. 이메일은 30분에 최대 한 번 보내요.',
  'email.confirmButton': '이메일 업데이트 확인',
  'email.welcomeFooter': '누군가 Overlap에 이 주소를 입력해서 이 이메일을 받았어요. 본인이 아니라면 무시하세요. 더 이상 이메일이 발송되지 않아요.',

  // Update emails
  'email.subjectUpdates': '“{title}” 업데이트',
  'email.news': '“{title}” 소식:',
  'email.finalPicked': '주최자가 시간을 정했어요: {time}.',
  'email.closed': '주최자가 투표를 마감했어요.',
  'email.reopened': '투표가 다시 열렸어요.',
  'email.edited': '주최자가 투표를 수정했어요. 내 응답이 여전히 맞는지 확인하세요.',
  'email.newResponses': { other: '새 응답: {names}.' },
  'email.changedAnswers': { other: '응답 수정: {names}.' },
  'email.removed': { other: '응답 {count}개가 삭제됐어요.' },
  'email.respondedSoFar': { other: '지금까지 {count}명이 응답했어요.' },
  'email.nameSeparator': ', ',
  'email.openPoll': '투표 열기',
  'email.openOrganizerView': '주최자 화면 열기',
  'email.guestFooter': '링크를 누르면 투표가 열려요. 응답했던 기기에서는 내 응답이 이미 표시돼 있어요.',
  'email.organizerFooter': '링크를 누르면 투표를 만든 브라우저에서 주최자 화면이 열려요. 다른 곳에서는 비공개 링크나 주최자 비밀번호를 사용하세요.',
  'email.stop': '이메일 수신 중지: {url}',

  // A time in an email
  'email.timeRange': '{day}, {start} – {end} ({zone} 기준)',
  'email.timeRangeWeekly': '매주 {day}, {start} – {end} ({zone} 기준)',
  // The plain-text version of the email's button
  'email.buttonText': '{label}: {url}',
};
