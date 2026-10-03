// Errors the server reports, by their `code`. {field} is an API field name
// such as "available"; it is left as it is.
export default {
  // Poll fields
  'errors.not_text': '{field}はテキストで指定してください。',
  'errors.title_required': 'タイトルを入力してください。',
  'errors.name_required': '名前を入力してください。',
  'errors.title_too_long': { other: 'タイトルは{count}文字以内にしてください。' },
  'errors.description_too_long': { other: '説明は{count}文字以内にしてください。' },
  'errors.location_too_long': { other: '場所は{count}文字以内にしてください。' },
  'errors.note_too_long': { other: 'メモは{count}文字以内にしてください。' },
  'errors.name_too_long': { other: '名前は{count}文字以内にしてください。' },
  'errors.not_whole_number': '{field}は整数で指定してください。',
  'errors.poll_not_object': '日程調整はJSONオブジェクトとして送信してください。',
  'errors.closes_on_invalid': '今後3年以内の有効な締め切り日を選んでください。',
  'errors.closes_on_passed': 'その締め切り日はすでに過ぎています。今日以降の日付を選んでください。',
  'errors.timezone_invalid': 'Europe/Londonのような有効なタイムゾーンを選んでください。',
  'errors.kind_invalid': '特定の日付か、毎週の曜日かを選んでください。',
  'errors.weekly_sent_dates': 'これは毎週の日程調整です。"dates"ではなく"weekdays"を送信してください。',
  'errors.weekdays_required': '曜日を1つ以上選んでください。',
  'errors.weekdays_invalid': '曜日は0（日曜日）から6（土曜日）までの数値で指定してください。',
  'errors.dates_sent_weekdays': 'この日程調整は特定の日付を使います。"weekdays"ではなく"dates"を送信してください。',
  'errors.dates_required': '日付を1つ以上選んでください。',
  'errors.too_many_dates': { other: '日付は{count}日以内で選んでください。' },
  'errors.date_invalid': '「{date}」は有効な日付ではありません。',
  'errors.dates_out_of_range': '今後3年以内の日付を選んでください。',
  'errors.dates_all_passed': 'それらの日付はすべて過ぎています。これからの日付を1つ以上選んでください。',
  'errors.slot_minutes_invalid': '時間の刻みは15分、30分、60分のいずれかにしてください。',
  'errors.end_before_start': '終了時刻は開始時刻より後にしてください。',
  'errors.duration_invalid': '所要時間は15分から12時間の間にしてください。',
  'errors.allow_edits_invalid': '参加者が回答を変更できるかどうかを指定してください（trueまたはfalse）。',
  'errors.visibility_invalid': '回答を見られる人を選んでください。',
  'errors.times_misaligned': { other: '開始時刻と終了時刻は{count}分刻みに合わせてください。' },
  'errors.range_too_short': '時間帯が時間の刻み1つ分より短くなっています。',
  'errors.duration_too_long': '所要時間が時間帯より長くなっています。時間帯を広げるか、所要時間を短くしてください。',
  'errors.too_many_slots': '選べる時間帯が多すぎます。日付を減らすか、時間帯を短くしてください。',
  'errors.no_slots': 'そのタイムゾーンには、指定した時間帯が1つも存在しません。',

  // Responses
  'errors.response_not_object': '回答はJSONオブジェクトとして送信してください。',
  'errors.name_invisible': '表示される文字で名前を入力してください。',
  'errors.not_time_list': '{field}は時間帯のリストで指定してください。',

  // Final time
  'errors.final_required': '開始時刻と終了時刻を選んでください。',
  'errors.final_end_before_start': '確定日時の終了は開始より後にしてください。',
  'errors.final_too_long': '確定日時の長さは最大24時間です。',
  'errors.final_bad_length': '確定日時の長さは5分単位にしてください。',
  'errors.final_not_a_time': '確定日時は、日程調整のいずれかの時間帯から始めてください。',

  // Requests
  'errors.too_many_requests': 'この接続からのリクエストが多すぎます。数分待ってから、もう一度お試しください。',
  'errors.json_required': 'Content-Type: application/jsonでJSONを送信してください。',
  'errors.body_too_large': 'リクエストが大きすぎます。',
  'errors.invalid_json': 'リクエストの本文が有効なJSONではありません。',
  'errors.method_not_allowed': 'このメソッドはここでは使えません。',
  'errors.not_found': '見つかりません。',
  'errors.server_error': 'サーバー側で問題が発生しました。もう一度お試しください。',

  // Polls and access
  'errors.poll_not_found': 'この日程調整は存在しません。削除されたか、期限切れになった可能性があります。',
  'errors.admin_link_or_password_wrong': '専用リンクまたはパスワードが正しくありません。リンクが置き換えられたか、パスワードが変更された可能性があります。',
  'errors.admin_link_invalid': 'この専用リンクは無効です。置き換えられた可能性があります。',
  'errors.changes_not_object': '変更内容はJSONオブジェクトとして送信してください。',
  'errors.reopen_with_final': '日程調整の受付を再開すると確定日時は解除されるため、どちらか一方だけを送信してください。',
  'errors.status_invalid': 'ステータスは"open"か"closed"にしてください。',
  'errors.no_final_time': 'この日程調整にはまだ確定日時がありません。',

  // Answering
  'errors.poll_closed': 'この日程調整は締め切られたため、新しい回答は受け付けていません。',
  'errors.poll_closed_no_changes': 'この日程調整は締め切られたため、回答はもう変更できません。',
  'errors.edits_not_allowed': '主催者は送信後の回答の変更を許可していません。自分の回答を削除することはできます。',
  'errors.too_many_responses': { other: 'この日程調整にはすでに{count}件の回答があります。' },
  'errors.name_taken': '「{name}」という名前ですでに回答があります。ご自身の回答なら、専用の編集リンクを開いてください。そうでなければ、名字の頭文字などを加えてください。',
  'errors.name_taken_other': '別の人が「{name}」という名前ですでに回答しています。名字の頭文字などを加えてみてください。',
  'errors.response_not_found': 'その回答はもう存在しません。',
  'errors.my_response_not_found': 'あなたの回答が見つかりませんでした。削除された可能性があります。',
  'errors.not_your_response': 'この回答を変更できるのは、回答した本人だけです。',

  // Passwords
  'errors.password_unreadable': 'パスワードを読み取れませんでした。ページを再読み込みして、もう一度お試しください。',
  'errors.too_many_wrong_passwords': 'この日程調整で間違ったパスワードが何度も入力されました。1時間待ってからもう一度お試しいただくか、専用リンクを使ってください。',
  'errors.password_no_longer_works': 'そのパスワードはこの回答ではもう使えません。変更された可能性があります。',
  'errors.sign_in_incomplete': '回答したときの名前とパスワードを入力してください。',
  'errors.sign_in_failed': 'その名前とパスワードに一致する、パスワード付きの回答はありません。つづりを確認するか、専用の編集リンクを使ってください。',

  // Email
  'errors.email_not_set_up': 'このOverlapではメール機能が設定されていません。',
  'errors.email_invalid': 'メールアドレスの形式が正しくないようです。',
  'errors.link_not_current': 'その専用リンクは最新ではありません。ページを再読み込みして、もう一度お試しください。',
  'errors.email_nothing_chosen': 'メールで受け取る内容を選んでください（リンク、更新情報、または両方）。',
  'errors.email_daily_limit': '本日、Overlapはそのアドレス（またはこの日程調整）に送れるメールの上限に達しました。明日もう一度お試しください。',
  'errors.email_send_failed': '現在メールを送信できませんでした。1分ほどしてから、もう一度お試しください。',
  'errors.confirm_link_expired': 'この確認リンクは期限切れか、すでに新しいものに置き換えられています。日程調整のページからもう一度メールを申し込んでください。',
};
