// Errors the server reports, by their `code` (server/validate.js, server/api.js,
// server/ratelimit.js). The English matches the server's own `error` text.
// {field} is an API field name such as "available"; it is left as it is.
export default {
  // Poll fields
  'errors.not_text': '{field} phải là văn bản.',
  'errors.title_required': 'Hãy thêm tiêu đề.',
  'errors.name_required': 'Hãy thêm tên.',
  'errors.title_too_long': { other: 'Tiêu đề phải ngắn hơn {count} ký tự.' },
  'errors.description_too_long': { other: 'Phần mô tả phải ngắn hơn {count} ký tự.' },
  'errors.location_too_long': { other: 'Địa điểm phải ngắn hơn {count} ký tự.' },
  'errors.note_too_long': { other: 'Ghi chú phải ngắn hơn {count} ký tự.' },
  'errors.name_too_long': { other: 'Tên phải ngắn hơn {count} ký tự.' },
  'errors.not_whole_number': '{field} phải là số nguyên.',
  'errors.poll_not_object': 'Hãy gửi cuộc thăm dò dưới dạng đối tượng JSON.',
  'errors.closes_on_invalid': 'Hãy chọn ngày đóng hợp lệ trong vòng ba năm tới.',
  'errors.closes_on_passed': 'Ngày đóng đó đã qua. Hãy chọn hôm nay hoặc muộn hơn.',
  'errors.timezone_invalid': 'Hãy chọn múi giờ hợp lệ, ví dụ Europe/London.',
  'errors.kind_invalid': 'Hãy chọn ngày cụ thể hoặc các thứ trong tuần.',
  'errors.weekly_sent_dates': 'Đây là cuộc thăm dò hằng tuần. Hãy gửi "weekdays" thay vì "dates".',
  'errors.weekdays_required': 'Hãy chọn ít nhất một thứ trong tuần.',
  'errors.weekdays_invalid': 'Các thứ trong tuần phải là số từ 0 (Chủ Nhật) đến 6 (Thứ Bảy).',
  'errors.dates_sent_weekdays': 'Cuộc thăm dò này dùng ngày cụ thể. Hãy gửi "dates" thay vì "weekdays".',
  'errors.dates_required': 'Hãy chọn ít nhất một ngày.',
  'errors.too_many_dates': { other: 'Hãy chọn tối đa {count} ngày.' },
  'errors.date_invalid': '“{date}” không phải là ngày hợp lệ.',
  'errors.dates_out_of_range': 'Hãy chọn các ngày trong vòng ba năm tới.',
  'errors.dates_all_passed': 'Tất cả các ngày đó đã qua. Hãy chọn ít nhất một ngày sắp tới.',
  'errors.slot_minutes_invalid': 'Bước thời gian phải là 15, 30 hoặc 60 phút.',
  'errors.end_before_start': 'Giờ kết thúc phải sau giờ bắt đầu.',
  'errors.duration_invalid': 'Thời lượng cuộc họp phải từ 15 phút đến 12 giờ.',
  'errors.allow_edits_invalid': 'Hãy cho biết khách có được đổi câu trả lời hay không (true hoặc false).',
  'errors.visibility_invalid': 'Hãy chọn ai được xem các phản hồi.',
  'errors.times_misaligned': { other: 'Giờ bắt đầu và kết thúc phải khớp với bước {count} phút.' },
  'errors.range_too_short': 'Khoảng thời gian ngắn hơn một bước thời gian.',
  'errors.duration_too_long': 'Cuộc họp dài hơn khoảng thời gian. Hãy nới rộng khoảng giờ hoặc rút ngắn cuộc họp.',
  'errors.too_many_slots': 'Có quá nhiều khung giờ để chọn. Hãy chọn ít ngày hơn hoặc khoảng giờ ngắn hơn.',
  'errors.no_slots': 'Không khung giờ nào trong số đó tồn tại ở múi giờ này.',

  // Responses
  'errors.response_not_object': 'Hãy gửi phản hồi dưới dạng đối tượng JSON.',
  'errors.name_invisible': 'Hãy thêm một cái tên mọi người nhìn thấy được.',
  'errors.not_time_list': '{field} phải là danh sách các khung giờ.',

  // Final time
  'errors.final_required': 'Hãy chọn giờ bắt đầu và giờ kết thúc.',
  'errors.final_end_before_start': 'Thời gian chốt phải kết thúc sau khi bắt đầu.',
  'errors.final_too_long': 'Thời gian chốt chỉ được dài tối đa 24 giờ.',
  'errors.final_bad_length': 'Độ dài của thời gian chốt phải là bội số của 5 phút.',
  'errors.final_not_a_time': 'Thời gian chốt phải bắt đầu tại một trong các khung giờ của cuộc thăm dò.',

  // Requests
  'errors.too_many_requests': 'Có quá nhiều yêu cầu từ kết nối này. Hãy đợi vài phút rồi thử lại.',
  'errors.json_required': 'Hãy gửi JSON với Content-Type: application/json.',
  'errors.body_too_large': 'Yêu cầu đó quá lớn.',
  'errors.invalid_json': 'Nội dung yêu cầu không phải JSON hợp lệ.',
  'errors.method_not_allowed': 'Phương thức đó không được phép ở đây.',
  'errors.not_found': 'Không tìm thấy.',
  'errors.server_error': 'Đã có lỗi ở phía chúng tôi. Vui lòng thử lại.',

  // Polls and access
  'errors.poll_not_found': 'Cuộc thăm dò này không tồn tại. Có thể nó đã bị xóa hoặc hết hạn.',
  'errors.admin_link_or_password_wrong': 'Liên kết riêng hoặc mật khẩu đó không đúng. Có thể liên kết đã được thay, hoặc mật khẩu đã đổi.',
  'errors.admin_link_invalid': 'Liên kết riêng này không hợp lệ. Có thể nó đã được thay.',
  'errors.changes_not_object': 'Hãy gửi các thay đổi dưới dạng đối tượng JSON.',
  'errors.reopen_with_final': 'Mở lại cuộc thăm dò sẽ xóa thời gian chốt, nên chỉ gửi một trong hai.',
  'errors.status_invalid': 'Trạng thái phải là "open" hoặc "closed".',
  'errors.no_final_time': 'Cuộc thăm dò này chưa có thời gian chốt.',

  // Answering
  'errors.poll_closed': 'Cuộc thăm dò này đã đóng nên không nhận phản hồi mới.',
  'errors.poll_closed_no_changes': 'Cuộc thăm dò này đã đóng nên không thể đổi phản hồi nữa.',
  'errors.edits_not_allowed': 'Người tổ chức không cho phép đổi câu trả lời sau khi đã gửi. Bạn vẫn có thể xóa phản hồi của mình.',
  'errors.too_many_responses': { other: 'Cuộc thăm dò này đã có {count} phản hồi.' },
  'errors.name_taken': 'Đã có người phản hồi với tên “{name}”. Nếu đó là bạn, hãy mở liên kết chỉnh sửa riêng của bạn. Nếu không, hãy thêm chữ cái đầu của họ hoặc tên đệm.',
  'errors.name_taken_other': 'Đã có người khác phản hồi với tên “{name}”. Hãy thử thêm chữ cái đầu của họ hoặc tên đệm.',
  'errors.response_not_found': 'Phản hồi đó không còn tồn tại.',
  'errors.my_response_not_found': 'Chúng tôi không tìm thấy phản hồi của bạn. Có thể nó đã bị xóa.',
  'errors.not_your_response': 'Chỉ người đã gửi phản hồi này mới có thể thay đổi nó.',

  // Passwords
  'errors.password_unreadable': 'Không đọc được mật khẩu đó. Hãy tải lại trang và thử lại.',
  'errors.too_many_wrong_passwords': 'Đã nhập sai mật khẩu quá nhiều lần cho cuộc thăm dò này. Hãy đợi một giờ rồi thử lại, hoặc dùng liên kết riêng.',
  'errors.password_no_longer_works': 'Mật khẩu đó không còn dùng được cho phản hồi này. Có thể nó đã được đổi.',
  'errors.sign_in_incomplete': 'Hãy nhập tên bạn đã dùng để trả lời và mật khẩu.',
  'errors.sign_in_failed': 'Tên và mật khẩu đó không khớp với phản hồi nào có mật khẩu. Hãy kiểm tra chính tả, hoặc dùng liên kết chỉnh sửa riêng.',

  // Email
  'errors.email_not_set_up': 'Bản Overlap này chưa thiết lập email.',
  'errors.email_invalid': 'Địa chỉ email này có vẻ không hợp lệ.',
  'errors.link_not_current': 'Liên kết riêng đó không còn là liên kết hiện hành. Hãy tải lại trang và thử lại.',
  'errors.email_nothing_chosen': 'Hãy chọn nội dung cần gửi email: liên kết của bạn, thông báo cập nhật, hoặc cả hai.',
  'errors.email_daily_limit': 'Hôm nay Overlap đã gửi đủ số email đến địa chỉ đó (hoặc cho cuộc thăm dò này). Hãy thử lại vào ngày mai.',
  'errors.email_send_failed': 'Hiện chưa gửi được email. Hãy thử lại sau một phút.',
  'errors.confirm_link_expired': 'Liên kết xác nhận này đã hết hạn hoặc đã được thay. Hãy yêu cầu nhận email lại từ cuộc thăm dò.',
};
