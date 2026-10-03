// Emails (server/email.js), written in the language of the person who asked
// for them. {title} is the poll's title; {url} a web address; {names} a list
// of the names people typed, joined with email.nameSeparator.
export default {
  // The one email sent when someone types their address
  'email.subjectConfirm': '确认接收关于“{title}”的邮件',
  'email.subjectLink': '你的“{title}”链接',
  'email.linkOrganizer': '这是你在“{title}”中的专属链接。它可以用来编辑、关闭或删除投票，请自己保管好：',
  'email.linkGuest': '这是你在“{title}”中的专属编辑链接。它可以用来修改或删除你的回复，请自己保管好：',
  'email.confirmOrganizer': '如果想在有人回复或修改回复时收到邮件，请在下方确认。你最多每 30 分钟收到一封邮件。',
  'email.confirmGuest': '如果想在发起人选定时间或修改投票时收到邮件，请在下方确认。你最多每 30 分钟收到一封邮件。',
  'email.confirmGuestPublic': '如果想在发起人选定时间、修改投票或有人回复时收到邮件，请在下方确认。你最多每 30 分钟收到一封邮件。',
  'email.confirmButton': '确认接收邮件更新',
  'email.welcomeFooter': '你收到这封邮件，是因为有人在 Overlap 中输入了这个地址。如果不是你本人，请忽略：之后不会再发送任何邮件。',

  // Update emails
  'email.subjectUpdates': '“{title}”有更新',
  'email.news': '“{title}”的最新动态：',
  'email.finalPicked': '发起人选定了时间：{time}。',
  'email.closed': '发起人关闭了投票。',
  'email.reopened': '投票已重新开放。',
  'email.edited': '发起人修改了投票。请确认你的回复是否仍然合适。',
  'email.newResponses': { other: '新回复：{names}。' },
  'email.changedAnswers': { other: '修改了回复：{names}。' },
  'email.removed': { other: '有 {count} 条回复被移除。' },
  'email.respondedSoFar': { other: '目前已有 {count} 人回复。' },
  'email.nameSeparator': '、',
  'email.openPoll': '打开投票',
  'email.openOrganizerView': '打开发起人视图',
  'email.guestFooter': '链接会打开投票。在你回复时使用的设备上，你的回复已经在那里了。',
  'email.organizerFooter': '链接会在你创建投票时使用的浏览器中打开发起人视图。在其他地方，请使用你的专属链接或发起人密码。',
  'email.stop': '停止接收这些邮件：{url}',

  // A time in an email: {day} is a date or weekday, {start} and {end} times, {zone} a time zone such as "America/New York"
  'email.timeRange': '{day}，{start}–{end}（{zone}时间）',
  'email.timeRangeWeekly': '每{day}，{start}–{end}（{zone}时间）',
  // The plain-text version of the email's button
  'email.buttonText': '{label}：{url}',
};
