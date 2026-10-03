// Emails (server/email.js). {title} is the poll's title; {url} a web address;
// {names} a list of the names people typed, joined with email.nameSeparator.
export default {
  // The one email sent when someone types their address
  'email.subjectConfirm': '「{title}」のメール通知の確認',
  'email.subjectLink': '「{title}」のリンク',
  'email.linkOrganizer': '「{title}」の専用リンクをお送りします。このリンクで日程調整の編集、締め切り、削除ができるので、他の人には教えないでください：',
  'email.linkGuest': '「{title}」の専用の編集リンクをお送りします。このリンクで回答の変更や削除ができるので、他の人には教えないでください：',
  'email.confirmOrganizer': '回答が届いたときや回答が変更されたときにメールを受け取るには、下のボタンで確認してください。メールは最大で30分に1通です。',
  'email.confirmGuest': '主催者が日時を確定したときや日程調整を変更したときにメールを受け取るには、下のボタンで確認してください。メールは最大で30分に1通です。',
  'email.confirmGuestPublic': '主催者が日時を確定したときや日程調整を変更したとき、または回答が届いたときにメールを受け取るには、下のボタンで確認してください。メールは最大で30分に1通です。',
  'email.confirmButton': 'メール通知を確認する',
  'email.welcomeFooter': '誰かがOverlapでこのメールアドレスを入力したため、このメールをお送りしています。お心当たりがない場合は無視してください。これ以上メールが送られることはありません。',

  // Update emails
  'email.subjectUpdates': '「{title}」の更新情報',
  'email.news': '「{title}」のお知らせ：',
  'email.finalPicked': '主催者が日時を確定しました：{time}。',
  'email.closed': '主催者が日程調整を締め切りました。',
  'email.reopened': '日程調整の受付が再開されました。',
  'email.edited': '主催者が日程調整を変更しました。あなたの回答が今も合っているか確認してください。',
  'email.newResponses': { other: '新しい回答：{names}。' },
  'email.changedAnswers': { other: '回答を変更した人：{names}。' },
  'email.removed': { other: '回答が{count}件削除されました。' },
  'email.respondedSoFar': { other: 'これまでに{count}人が回答しています。' },
  'email.nameSeparator': '、',
  'email.openPoll': '日程調整を開く',
  'email.openOrganizerView': '主催者画面を開く',
  'email.guestFooter': 'リンクから日程調整が開きます。回答に使った端末では、あなたの回答がすでに表示されます。',
  'email.organizerFooter': 'リンクを開くと、日程調整を作成したブラウザでは主催者画面が表示されます。それ以外では、専用リンクか主催者パスワードを使ってください。',
  'email.stop': 'このメールの配信を停止：{url}',

  // A time in an email: {day} is a date or weekday, {start} and {end} times, {zone} a time zone
  'email.timeRange': '{day} {start}〜{end}（{zone}時間）',
  'email.timeRangeWeekly': '毎週{day} {start}〜{end}（{zone}時間）',
  // The plain-text version of the email's button
  'email.buttonText': '{label}：{url}',
};
