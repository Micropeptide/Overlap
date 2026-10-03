// The privacy page. Every statement describes what the code actually does:
// translations must keep the exact meaning, adding or dropping nothing.
export default {
  'privacy.tabTitle': 'Quyền riêng tư',
  'privacy.title': 'Quyền riêng tư',
  'privacy.ledeRetention': 'Overlap chỉ thu thập những gì cần để tìm thời gian, giữ dữ liệu trong một thời gian có hạn, và cho phép bạn xóa bất cứ khi nào bạn muốn.',
  'privacy.ledeKept': 'Overlap chỉ thu thập những gì cần để tìm thời gian, và cho phép bạn xóa bất cứ khi nào bạn muốn.',

  'privacy.storesHeading': 'Overlap lưu trữ những gì',
  'privacy.storesPoll': 'Với mỗi cuộc thăm dò: tên của nó, và nếu người tổ chức thêm vào, một ghi chú, địa điểm hoặc liên kết cuộc gọi, và ngày đóng. Ngoài ra còn có các ngày (hoặc các thứ trong tuần) và khung giờ được đưa ra, múi giờ, thời lượng cuộc họp, ai được xem các phản hồi, và cuộc thăm dò đang mở, đã đóng hay đã có thời gian chốt.',
  'privacy.storesResponse': 'Với mỗi phản hồi: tên hiển thị khách đã nhập, các khung giờ họ đánh dấu (ưu tiên, rảnh hoặc nếu cần), và ghi chú không bắt buộc của họ.',
  'privacy.storesTimestamps': 'Thời điểm mỗi cuộc thăm dò và phản hồi được tạo và được thay đổi lần cuối.',
  'privacy.storesLinkHash': 'Một dấu vân tay đã được xáo trộn (mã băm SHA-256) của mỗi liên kết riêng, để máy chủ có thể kiểm tra liên kết mà không cần giữ bản sao của nó.',
  'privacy.storesPasswordHash': 'Nếu người tổ chức hoặc khách thêm mật khẩu không bắt buộc: một mã băm SHA-256 của khóa được tạo từ mật khẩu đó trong trình duyệt của họ. Không bao giờ lưu chính mật khẩu.',
  'privacy.storesAttempts': 'Số lần nhập sai mật khẩu cho mỗi cuộc thăm dò trong giờ vừa qua (một con số cho mỗi cuộc thăm dò, không kèm thông tin kết nối hay thiết bị), để ngăn việc dò mật khẩu.',
  'privacy.storesEmail': 'Chỉ khi bạn yêu cầu nhận cập nhật qua email: địa chỉ email của bạn, bạn đã xác nhận nó hay chưa, và lần cuối bạn được gửi email. Khi có người theo dõi một cuộc thăm dò qua email, Overlap cũng giữ một danh sách ngắn những gì đã thay đổi và thời điểm thay đổi (ví dụ “một phản hồi đã được thêm”, kèm id của phản hồi đó), để email tiếp theo có thể cho biết có gì mới. Danh sách đó được xóa sau 30 ngày.',

  'privacy.notCollectedHeading': 'Overlap không thu thập những gì',
  'privacy.noAccountsWithEmails': 'Không có tài khoản hay số điện thoại, và không có địa chỉ email trừ khi bạn yêu cầu nhận email.',
  'privacy.noAccounts': 'Không có tài khoản, địa chỉ email hay số điện thoại.',
  'privacy.passwordsLocal': 'Mật khẩu không bắt buộc không bao giờ rời khỏi trình duyệt của bạn. Trình duyệt biến mật khẩu thành một khóa (PBKDF2-SHA-256, 210.000 vòng, dùng cuộc thăm dò làm muối), chỉ gửi khóa đó, và máy chủ chỉ giữ mã băm của khóa.',
  'privacy.noCalendar': 'Không truy cập lịch.',
  'privacy.noTracking': 'Không cookie, công cụ phân tích, quảng cáo, pixel theo dõi hay mã của bên thứ ba. Phông chữ được phục vụ từ chính trang này.',
  'privacy.noIpLogs': 'Overlap không ghi địa chỉ IP vào cơ sở dữ liệu hay nhật ký của mình. Để hạn chế lạm dụng, Overlap đếm số yêu cầu theo từng kết nối trong bộ nhớ khoảng một giờ rồi quên đi.',
  'privacy.hostingCloudflare': 'Bản Overlap này được hai công ty lưu trữ: GitHub Pages phục vụ các trang, và Cloudflare chạy phần lưu trữ cuộc thăm dò (trong cơ sở dữ liệu D1 của họ). Cả hai đều thấy địa chỉ IP của bạn khi bạn kết nối và có thể giữ nhật ký mạng riêng. Overlap tắt tính năng ghi nhật ký yêu cầu không bắt buộc của Cloudflare.',
  'privacy.hostingOther': 'Công ty lưu trữ một bản Overlap có thể giữ nhật ký mạng riêng của họ.',
  'privacy.resend': 'Email được gửi qua Resend (resend.com). Resend nhận địa chỉ và nội dung email để chuyển phát, và giữ hồ sơ chuyển phát riêng theo chính sách quyền riêng tư của họ. Overlap không gửi gì cho Resend trừ khi bạn yêu cầu một email.',
  'privacy.calendarLinks': 'Nếu cuộc thăm dò đã có thời gian chốt, bạn có thể mở nó trong Google Calendar hoặc Outlook.com. Nhấp vào một trong các liên kết đó sẽ gửi cho công ty đó tên, thời gian, địa điểm, ghi chú của sự kiện và liên kết cho khách của cuộc thăm dò, và bất kỳ ai có liên kết cho khách đều xem được cuộc thăm dò (và, trừ khi kết quả bị ẩn, tên và khung giờ của mọi người). Không có gì được gửi trừ khi bạn nhấp.',

  'privacy.whoHeading': 'Ai xem được gì',
  'privacy.guestLink': 'Liên kết cho khách hiển thị cuộc thăm dò cho bất kỳ ai có nó. Theo mặc định, khách cũng thấy tên và khung giờ của nhau. Người tổ chức có thể chuyển sang “Chỉ mình tôi”, và khi đó máy chủ ngừng gửi phản hồi của người khác cho khách.',
  'privacy.privateLink': 'Liên kết riêng cho phép bất kỳ ai có nó sửa, đóng hoặc xóa cuộc thăm dò và gỡ phản hồi. Người tổ chức có thể thay liên kết này bất cứ lúc nào, khiến liên kết cũ ngừng hoạt động.',
  'privacy.guestEditLink': 'Mỗi khách nhận một liên kết chỉnh sửa riêng chỉ cho phép sửa hoặc xóa phản hồi của chính họ. Nhập tên của người khác không cho phép truy cập phản hồi của người đó.',
  'privacy.passwordAccess': 'Khách thêm mật khẩu cũng có thể mở phản hồi của mình trên thiết bị khác bằng tên và mật khẩu đó. Người tổ chức đặt mật khẩu có thể dùng nó để mở trang người tổ chức từ liên kết cho khách. Cả hai loại mật khẩu đều có thể đổi hoặc gỡ sau này.',
  'privacy.hiddenResults': 'Khi kết quả được đặt là “Chỉ mình tôi”, khách vẫn thấy có bao nhiêu người đã phản hồi, nhưng không thấy là ai. Khi đó tên không cần phải là duy nhất, nên việc thử một cái tên cũng không tiết lộ điều gì.',
  'privacy.emailPrivate': 'Địa chỉ email của bạn không bao giờ được hiển thị cho người tổ chức, cho khách, hay trên bất kỳ trang nào. Chỉ người đã thêm nó mới xem hoặc đổi được, từ trang mà họ đã thêm nó. Email cập nhật không chứa liên kết riêng; chỉ email mà bạn yêu cầu gửi liên kết mới chứa liên kết đó.',
  'privacy.browserStorage': 'Trình duyệt của bạn giữ một số thứ trong bộ nhớ riêng của nó, chỉ trên thiết bị của bạn: các liên kết riêng bạn dùng (hoặc các khóa tạo từ mật khẩu mà bạn đã dùng để đăng nhập), tên bạn nhập gần nhất, múi giờ ưa dùng và các cài đặt biểu mẫu, và một phản hồi bạn chưa gửi (các đánh dấu, tên và ghi chú, để tải lại trang không làm mất chúng). “Nhân bản cuộc thăm dò” tạm giữ cài đặt, tiêu đề, ghi chú và địa điểm của cuộc thăm dò trong bộ nhớ phiên của thẻ. Xóa dữ liệu trình duyệt sẽ xóa tất cả những thứ này; máy chủ của Overlap không bao giờ thấy chúng.',

  'privacy.retentionHeading': 'Dữ liệu được giữ trong bao lâu',
  // The paragraph is whole sentences; these two only set their order and spacing.
  'privacy.retentionParagraph': '{policy} {anytime} {afterDelete}',
  'privacy.retentionParagraphEmails': '{policy} {anytime} {emails} {afterDelete}',
  'privacy.retentionAuto': {
    other: 'Một cuộc thăm dò và mọi phản hồi của nó tự động bị xóa {count} ngày sau ngày cuối cùng trong cuộc thăm dò. Cuộc thăm dò hằng tuần không có ngày cuối cùng, nên nó bị xóa {count} ngày sau lần thay đổi cuối cùng: một lần chỉnh sửa, hoặc một phản hồi được thêm hay cập nhật.',
  },
  'privacy.retentionKept': 'Overlap không tự xóa cuộc thăm dò: cuộc thăm dò và các phản hồi được giữ cho đến khi người tổ chức xóa cuộc thăm dò.',
  'privacy.deleteAnytime': 'Người tổ chức có thể xóa cuộc thăm dò bất cứ lúc nào, và khách có thể xóa phản hồi của chính mình bất cứ lúc nào, kể cả sau khi cuộc thăm dò đã đóng.',
  'privacy.emailDeletion': 'Địa chỉ email bị xóa khi bạn ngừng nhận email (từ trang cuộc thăm dò hoặc từ liên kết trong bất kỳ email nào), khi bạn xóa phản hồi của mình, hoặc khi cuộc thăm dò bị xóa. Địa chỉ chỉ dùng để gửi liên kết cho bạn hoàn toàn không được lưu.',
  'privacy.deletedCloudflare': {
    other: 'Dữ liệu bị xóa được gỡ khỏi cơ sở dữ liệu đang hoạt động ngay lập tức. Cơ sở dữ liệu của Cloudflare tự động giữ lịch sử khôi phục trong {count} ngày, nên trong khoảng thời gian đó, người vận hành bản Overlap này vẫn có thể khôi phục một cuộc thăm dò đã xóa; sau đó dữ liệu mất hẳn.',
  },
  'privacy.deletedOther': 'Dữ liệu bị xóa được ghi đè trong tệp cơ sở dữ liệu ngay lập tức (tính năng xóa an toàn của SQLite, cùng với việc xả nhật ký ghi trước của nó). Nếu người vận hành bản Overlap này giữ bản sao lưu, một bản sao có thể còn lại trong đó cho đến khi các bản sao lưu ấy hết hạn.',

  'privacy.securityHeading': 'Bảo mật, nói thật',
  'privacy.securityLinks': 'Liên kết chứa các khóa ngẫu nhiên dài, gần như không thể đoán được. Khóa riêng nằm sau dấu “#” trong liên kết, phần mà trình duyệt không gửi đến máy chủ hay các trang khác, và máy chủ chỉ nhận chúng trong tiêu đề yêu cầu. Các trang dùng chính sách bảo mật nội dung nghiêm ngặt và không gửi thông tin trang giới thiệu (referrer).',
  'privacy.securityPasswords': 'Mật khẩu chỉ mạnh khi bạn đặt nó mạnh. Sau 30 lần nhập sai mật khẩu trong một giờ, cuộc thăm dò ngừng chấp nhận mật khẩu (đúng hay sai) cho đến hết giờ đó, trong khi các liên kết vẫn hoạt động. Ai có được bản sao cơ sở dữ liệu vẫn có thể thử đoán mật khẩu yếu khi ngoại tuyến, vì vậy hãy dùng mật khẩu bạn không dùng ở bất kỳ đâu khác.',
  // {transit} is privacy.httpsCloudflare or privacy.httpsOther, a whole sentence.
  'privacy.securityEncryption': 'Overlap không mã hóa nội dung cuộc thăm dò trong cơ sở dữ liệu, và phản hồi không ẩn danh: bất kỳ ai bạn đưa liên kết cho khách đều có thể thấy tên và khung giờ. {transit} Đừng dùng Overlap cho bất cứ điều gì nhạy cảm.',
  'privacy.httpsCloudflare': 'Bản này chỉ truy cập được qua HTTPS, nên các kết nối được mã hóa khi truyền.',
  'privacy.httpsOther': 'Kết nối chỉ được mã hóa khi bản Overlap này được phục vụ qua HTTPS.',

  'privacy.sourceHeading': 'Mã nguồn',
  // {link} is the repository address, github.com/Micropeptide/Overlap.
  'privacy.source': 'Overlap là một ứng dụng nhỏ, độc lập, mã nguồn mở (Giấy phép MIT) do Micropeptide làm: {link}. Ứng dụng lấy cảm hứng từ công cụ lên lịch mã nguồn mở Timeful, nhưng không dùng chung mã nào với nó.',
};
