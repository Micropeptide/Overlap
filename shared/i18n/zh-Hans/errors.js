// Errors the server reports, by their `code` (server/validate.js, server/api.js,
// server/ratelimit.js). The English matches the server's own `error` text.
// {field} is an API field name such as "available"; it is left as it is.
export default {
  // Poll fields
  'errors.not_text': '{field} 必须是文本。',
  'errors.title_required': '请填写标题。',
  'errors.name_required': '请填写名字。',
  'errors.title_too_long': { other: '标题请少于 {count} 个字符。' },
  'errors.description_too_long': { other: '描述请少于 {count} 个字符。' },
  'errors.location_too_long': { other: '地点请少于 {count} 个字符。' },
  'errors.note_too_long': { other: '备注请少于 {count} 个字符。' },
  'errors.name_too_long': { other: '名字请少于 {count} 个字符。' },
  'errors.not_whole_number': '{field} 必须是整数。',
  'errors.poll_not_object': '请以 JSON 对象的形式发送投票。',
  'errors.closes_on_invalid': '请选择未来三年内的有效截止日期。',
  'errors.closes_on_passed': '这个截止日期已经过了。请选择今天或之后的日期。',
  'errors.timezone_invalid': '请选择有效的时区，例如 Europe/London。',
  'errors.kind_invalid': '请选择具体日期或星期几。',
  'errors.weekly_sent_dates': '这是一个每周投票。请发送“weekdays”，而不是“dates”。',
  'errors.weekdays_required': '请至少选择一周中的一天。',
  'errors.weekdays_invalid': '星期几必须是 0（星期日）到 6（星期六）之间的数字。',
  'errors.dates_sent_weekdays': '此投票使用具体日期。请发送“dates”，而不是“weekdays”。',
  'errors.dates_required': '请至少选择一个日期。',
  'errors.too_many_dates': { other: '最多只能选 {count} 个日期。' },
  'errors.date_invalid': '“{date}”不是有效的日期。',
  'errors.dates_out_of_range': '请选择未来三年内的日期。',
  'errors.dates_all_passed': '这些日期都已经过去了。请至少选择一个未来的日期。',
  'errors.slot_minutes_invalid': '时间间隔必须是 15、30 或 60 分钟。',
  'errors.end_before_start': '结束时间必须晚于开始时间。',
  'errors.duration_invalid': '会议时长必须在 15 分钟到 12 小时之间。',
  'errors.allow_edits_invalid': '请说明参与者能否修改回复（true 或 false）。',
  'errors.visibility_invalid': '请选择谁能看到回复。',
  'errors.times_misaligned': { other: '开始和结束时间必须与 {count} 分钟的间隔对齐。' },
  'errors.range_too_short': '时间范围比一个时间间隔还短。',
  'errors.duration_too_long': '会议时长超过了时间范围。请扩大时间范围或缩短会议。',
  'errors.too_many_slots': '可选的时间太多了。请减少日期或缩小时间范围。',
  'errors.no_slots': '这些时间在该时区中都不存在。',

  // Responses
  'errors.response_not_object': '请以 JSON 对象的形式发送回复。',
  'errors.name_invisible': '请填写一个能看得见的名字。',
  'errors.not_time_list': '{field} 必须是时间列表。',

  // Final time
  'errors.final_required': '请选择开始和结束时间。',
  'errors.final_end_before_start': '最终时间的结束必须晚于开始。',
  'errors.final_too_long': '最终时间最长为 24 小时。',
  'errors.final_bad_length': '最终时间的时长必须是 5 分钟的整数倍。',
  'errors.final_not_a_time': '最终时间必须从此投票的某个时间开始。',

  // Requests
  'errors.too_many_requests': '此连接的请求过多。请等几分钟再试。',
  'errors.json_required': '请发送 JSON，并设置 Content-Type: application/json。',
  'errors.body_too_large': '请求太大了。',
  'errors.invalid_json': '请求正文不是有效的 JSON。',
  'errors.method_not_allowed': '此处不允许使用该方法。',
  'errors.not_found': '未找到。',
  'errors.server_error': '我们这边出了点问题。请重试。',

  // Polls and access
  'errors.poll_not_found': '此投票不存在。它可能已被删除或已过期。',
  'errors.admin_link_or_password_wrong': '专属链接或密码不正确。链接可能已被更换，或者密码已更改。',
  'errors.admin_link_invalid': '此专属链接无效。它可能已被更换。',
  'errors.changes_not_object': '请以 JSON 对象的形式发送更改。',
  'errors.reopen_with_final': '重新开放投票会清除最终时间，所以两者只能发送其一。',
  'errors.status_invalid': '状态必须是“open”或“closed”。',
  'errors.no_final_time': '此投票还没有最终时间。',

  // Answering
  'errors.poll_closed': '此投票已关闭，不再接受新回复。',
  'errors.poll_closed_no_changes': '此投票已关闭，回复无法再修改。',
  'errors.edits_not_allowed': '发起人不允许提交后修改回复。你仍可以删除自己的回复。',
  'errors.too_many_responses': { other: '此投票已有 {count} 条回复。' },
  'errors.name_taken': '已经有人以“{name}”的名字回复了。如果那是你，请打开你的专属编辑链接；如果不是，请在名字后加上姓氏首字母。',
  'errors.name_taken_other': '已经有其他人以“{name}”的名字回复了。试试在名字后加上姓氏首字母。',
  'errors.response_not_found': '该回复已不存在。',
  'errors.my_response_not_found': '找不到你的回复。它可能已被删除。',
  'errors.not_your_response': '只有提交这条回复的人才能修改它。',

  // Passwords
  'errors.password_unreadable': '无法读取该密码。请刷新页面后重试。',
  'errors.too_many_wrong_passwords': '此投票的密码错误次数过多。请一小时后再试，或使用你的专属链接。',
  'errors.password_no_longer_works': '该密码对这条回复已不再有效。它可能已被更改。',
  'errors.sign_in_incomplete': '请输入你回复时用的名字和你的密码。',
  'errors.sign_in_failed': '这个名字和密码与任何设有密码的回复都不匹配。请检查拼写，或使用你的专属编辑链接。',

  // Email
  'errors.email_not_set_up': '此 Overlap 站点尚未设置邮件功能。',
  'errors.email_invalid': '这看起来不像是邮箱地址。',
  'errors.link_not_current': '该专属链接不是最新的。请刷新页面后重试。',
  'errors.email_nothing_chosen': '请选择要通过邮件接收的内容：你的链接、更新通知，或两者都要。',
  'errors.email_daily_limit': 'Overlap 今天已向该地址（或为此投票）发送了足够多的邮件。请明天再试。',
  'errors.email_send_failed': '邮件暂时无法发送。请过一分钟再试。',
  'errors.confirm_link_expired': '此确认链接已过期或已被替换。请在投票页面重新申请邮件。',
};
