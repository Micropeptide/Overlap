// Emails (server/email.js), written in the language of the person who asked
// for them. {title} is the poll's title; {url} a web address; {names} a list
// of the names people typed, joined with email.nameSeparator.
export default {
  // The one email sent when someone types their address
  'email.subjectConfirm': 'Xác nhận nhận email về “{title}”',
  'email.subjectLink': 'Liên kết của bạn cho “{title}”',
  'email.linkOrganizer': 'Đây là liên kết riêng của bạn cho “{title}”. Liên kết này cho phép sửa, đóng hoặc xóa cuộc thăm dò, vì vậy hãy giữ cho riêng mình:',
  'email.linkGuest': 'Đây là liên kết chỉnh sửa riêng của bạn cho “{title}”. Liên kết này cho phép sửa hoặc xóa phản hồi của bạn, vì vậy hãy giữ cho riêng mình:',
  'email.confirmOrganizer': 'Để nhận email khi mọi người phản hồi hoặc đổi câu trả lời, hãy xác nhận bên dưới. Bạn sẽ nhận tối đa một email mỗi 30 phút.',
  'email.confirmGuest': 'Để nhận email khi người tổ chức chọn thời gian hoặc thay đổi cuộc thăm dò, hãy xác nhận bên dưới. Bạn sẽ nhận tối đa một email mỗi 30 phút.',
  'email.confirmGuestPublic': 'Để nhận email khi người tổ chức chọn thời gian hoặc thay đổi cuộc thăm dò, hoặc khi mọi người phản hồi, hãy xác nhận bên dưới. Bạn sẽ nhận tối đa một email mỗi 30 phút.',
  'email.confirmButton': 'Xác nhận nhận cập nhật qua email',
  'email.welcomeFooter': 'Bạn nhận được email này vì có người đã nhập địa chỉ này vào Overlap. Nếu đó không phải bạn, hãy bỏ qua: sẽ không có email nào được gửi thêm.',

  // Update emails
  'email.subjectUpdates': 'Cập nhật về “{title}”',
  'email.news': 'Tin mới về “{title}”:',
  'email.finalPicked': 'Người tổ chức đã chọn thời gian: {time}.',
  'email.closed': 'Người tổ chức đã đóng cuộc thăm dò.',
  'email.reopened': 'Cuộc thăm dò đã mở lại.',
  'email.edited': 'Người tổ chức đã thay đổi cuộc thăm dò. Hãy kiểm tra xem câu trả lời của bạn còn phù hợp không.',
  'email.newResponses': { other: 'Phản hồi mới: {names}.' },
  'email.changedAnswers': { other: 'Đã đổi câu trả lời: {names}.' },
  'email.removed': { other: 'Đã gỡ {count} phản hồi.' },
  'email.respondedSoFar': { other: 'Đến nay đã có {count} người phản hồi.' },
  'email.nameSeparator': ', ',
  'email.openPoll': 'Mở cuộc thăm dò',
  'email.openOrganizerView': 'Mở trang người tổ chức',
  'email.guestFooter': 'Liên kết sẽ mở cuộc thăm dò. Trên thiết bị bạn đã dùng để trả lời, phản hồi của bạn đã có sẵn ở đó.',
  'email.organizerFooter': 'Liên kết sẽ mở trang người tổ chức trong trình duyệt bạn đã dùng để tạo cuộc thăm dò. Ở nơi khác, hãy dùng liên kết riêng hoặc mật khẩu người tổ chức.',
  'email.stop': 'Ngừng nhận các email này: {url}',

  // A time in an email: {day} is a date or weekday, {start} and {end} times, {zone} a time zone such as "America/New York"
  'email.timeRange': '{day}, {start} – {end} (giờ {zone})',
  'email.timeRangeWeekly': 'Mỗi {day}, {start} – {end} (giờ {zone})',
  // The plain-text version of the email's button
  'email.buttonText': '{label}: {url}',
};
