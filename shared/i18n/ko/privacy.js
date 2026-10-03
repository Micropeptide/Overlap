// The privacy page. Translations keep the exact meaning, adding or dropping nothing.
export default {
  'privacy.tabTitle': '개인정보',
  'privacy.title': '개인정보',
  'privacy.ledeRetention': 'Overlap은 시간을 찾는 데 필요한 정보만 수집하고, 정해진 기간 동안만 보관하며, 원할 때 언제든 삭제할 수 있게 해요.',
  'privacy.ledeKept': 'Overlap은 시간을 찾는 데 필요한 정보만 수집하고, 원할 때 언제든 삭제할 수 있게 해요.',

  'privacy.storesHeading': 'Overlap이 저장하는 정보',
  'privacy.storesPoll': '투표마다: 투표 이름, 그리고 주최자가 추가한 경우 메모, 장소나 통화 링크, 마감일. 또한 제시된 날짜(또는 요일)와 시간, 시간대, 모임 길이, 응답을 볼 수 있는 사람, 투표가 진행 중인지, 마감됐는지, 확정 시간이 있는지 여부.',
  'privacy.storesResponse': '응답마다: 참여자가 입력한 표시 이름, 표시한 시간(선호, 가능 또는 필요 시 가능), 선택 사항인 메모.',
  'privacy.storesTimestamps': '각 투표와 응답이 만들어진 시각과 마지막으로 변경된 시각.',
  'privacy.storesLinkHash': '각 비공개 링크의 변환된 지문(SHA-256 해시). 서버가 링크 사본을 보관하지 않고도 링크를 확인할 수 있게 해요.',
  'privacy.storesPasswordHash': '주최자나 참여자가 선택 사항인 비밀번호를 추가한 경우: 그 사람의 브라우저에서 비밀번호로 만든 키의 SHA-256 해시. 비밀번호 자체는 저장하지 않아요.',
  'privacy.storesAttempts': '지난 1시간 동안 각 투표에 틀린 비밀번호가 몇 번 입력됐는지(투표별 숫자 하나이며, 연결이나 기기 정보는 포함하지 않음). 비밀번호 추측을 막기 위한 거예요.',
  'privacy.storesEmail': '이메일 업데이트를 요청한 경우에만: 이메일 주소, 주소 확인 여부, 마지막으로 이메일을 보낸 시각. 투표를 이메일로 받아 보는 사람이 있는 동안에는, 다음 이메일에서 새 소식을 알릴 수 있도록 무엇이 언제 바뀌었는지에 대한 짧은 목록도 보관해요(예: 응답의 id와 함께 “응답이 추가됨”). 이 목록은 30일 후에 지워져요.',

  'privacy.notCollectedHeading': 'Overlap이 수집하지 않는 정보',
  'privacy.noAccountsWithEmails': '계정이나 전화번호는 수집하지 않으며, 이메일을 요청하지 않는 한 이메일 주소도 수집하지 않아요.',
  'privacy.noAccounts': '계정, 이메일 주소, 전화번호를 수집하지 않아요.',
  'privacy.passwordsLocal': '선택 사항인 비밀번호는 브라우저 밖으로 나가지 않아요. 브라우저가 비밀번호를 키로 변환하고(PBKDF2-SHA-256, 210,000회 반복, 투표를 솔트로 사용) 그 키만 전송하며, 서버는 그 키의 해시만 보관해요.',
  'privacy.noCalendar': '캘린더에 접근하지 않아요.',
  'privacy.noTracking': '쿠키, 분석 도구, 광고, 추적 픽셀, 제3자 스크립트가 없어요. 글꼴도 이 사이트에서 제공해요.',
  'privacy.noIpLogs': 'Overlap은 IP 주소를 데이터베이스나 로그에 기록하지 않아요. 악용을 늦추기 위해 연결별 요청 수를 메모리에서 약 1시간 동안 센 뒤 잊어요.',
  'privacy.hostingCloudflare': '이 Overlap 사이트는 두 회사가 호스팅해요. GitHub Pages가 페이지를 제공하고, Cloudflare가 투표를 저장하는 부분을 실행해요(Cloudflare의 D1 데이터베이스). 두 회사 모두 사용자가 접속할 때 IP 주소를 보게 되며, 자체 네트워크 로그를 보관할 수 있어요. Overlap은 Cloudflare의 선택적 요청 로깅을 꺼 두었어요.',
  'privacy.hostingOther': 'Overlap 사이트를 호스팅하는 회사는 자체 네트워크 로그를 보관할 수 있어요.',
  'privacy.resend': '이메일은 Resend(resend.com)가 발송해요. Resend는 이메일을 전달하기 위해 주소와 이메일 내용을 받고, 자체 개인정보 처리방침에 따라 전송 기록을 보관해요. 이메일을 요청하지 않는 한 Overlap은 Resend에 아무것도 보내지 않아요.',
  'privacy.calendarLinks': '투표에 확정 시간이 있으면 Google 캘린더나 Outlook.com에서 열 수 있어요. 이 링크 중 하나를 클릭하면 일정 이름, 시간, 장소, 메모, 투표의 참여 링크가 해당 회사로 전송되며, 참여 링크가 있는 사람은 누구나 투표를 볼 수 있어요(결과가 숨겨져 있지 않다면 모든 사람의 이름과 시간도요). 클릭하지 않으면 아무것도 전송되지 않아요.',

  'privacy.whoHeading': '누가 무엇을 볼 수 있나요',
  'privacy.guestLink': '참여 링크가 있는 사람은 누구나 투표를 볼 수 있어요. 기본적으로 참여자끼리 서로의 이름과 시간도 볼 수 있어요. 주최자는 이 설정을 “나만”으로 바꿀 수 있으며, 그러면 서버가 참여자에게 다른 사람의 응답을 보내지 않아요.',
  'privacy.privateLink': '비공개 링크가 있는 사람은 누구나 투표를 수정, 마감, 삭제하고 응답을 삭제할 수 있어요. 주최자는 언제든 이 링크를 교체할 수 있으며, 그러면 이전 링크는 작동하지 않아요.',
  'privacy.guestEditLink': '참여자마다 자기 응답만 수정하거나 삭제할 수 있는 비공개 수정 링크를 받아요. 다른 사람의 이름을 입력해도 그 사람의 응답에 접근할 수 없어요.',
  'privacy.passwordAccess': '비밀번호를 추가한 참여자는 이름과 그 비밀번호로 다른 기기에서도 자기 응답을 열 수 있어요. 비밀번호를 설정한 주최자는 그 비밀번호로 참여 링크에서 주최자 화면을 열 수 있어요. 두 비밀번호 모두 나중에 바꾸거나 삭제할 수 있어요.',
  'privacy.hiddenResults': '결과가 “나만”으로 설정되면, 참여자는 몇 명이 응답했는지는 볼 수 있지만 누가 응답했는지는 볼 수 없어요. 이 경우 이름이 고유하지 않아도 되므로, 이름을 입력해 봐도 아무것도 드러나지 않아요.',
  'privacy.emailPrivate': '이메일 주소는 주최자, 참여자, 어떤 페이지에도 표시되지 않아요. 주소를 추가한 사람만 추가한 페이지에서 주소를 보거나 바꿀 수 있어요. 업데이트 이메일에는 비공개 링크가 들어 있지 않아요. 링크를 요청한 이메일에만 들어 있어요.',
  'privacy.browserStorage': '브라우저는 일부 정보를 자체 저장소, 즉 내 기기에만 보관해요: 사용한 비공개 링크(또는 로그인할 때 쓴 비밀번호 기반 키), 마지막으로 입력한 이름, 선호하는 시간대와 양식 설정, 아직 제출하지 않은 응답(새로고침해도 사라지지 않도록 표시, 이름, 메모). “투표 복제”는 투표의 설정, 제목, 메모, 장소를 탭의 세션 저장소에 잠시 보관해요. 브라우저 데이터를 지우면 이 모든 정보가 삭제돼요. Overlap 서버는 이 정보를 볼 수 없어요.',

  'privacy.retentionHeading': '데이터 보관 기간',
  // The paragraph is whole sentences; these two only set their order and spacing.
  'privacy.retentionParagraph': '{policy} {anytime} {afterDelete}',
  'privacy.retentionParagraphEmails': '{policy} {anytime} {emails} {afterDelete}',
  'privacy.retentionAuto': {
    other: '투표와 모든 응답은 투표의 마지막 날짜로부터 {count}일 후 자동으로 삭제돼요. 매주 반복 투표는 마지막 날짜가 없으므로, 마지막 변경(수정, 또는 응답 추가나 업데이트)으로부터 {count}일 후 삭제돼요.',
  },
  'privacy.retentionKept': 'Overlap은 투표를 자동으로 삭제하지 않아요. 투표와 응답은 주최자가 투표를 삭제할 때까지 보관돼요.',
  'privacy.deleteAnytime': '주최자는 언제든 투표를 삭제할 수 있고, 참여자는 투표가 마감된 뒤에도 언제든 자기 응답을 삭제할 수 있어요.',
  'privacy.emailDeletion': '이메일 주소는 이메일을 중지할 때(투표 페이지나 이메일 속 링크에서), 내 응답을 삭제할 때, 또는 투표가 삭제될 때 삭제돼요. 링크를 보내는 데만 사용된 주소는 아예 저장되지 않아요.',
  'privacy.deletedCloudflare': {
    other: '삭제된 데이터는 운영 중인 데이터베이스에서 즉시 제거돼요. Cloudflare의 데이터베이스는 {count}일 동안 자동 복원 기록을 보관하므로, 그 기간에는 이 Overlap 사이트를 운영하는 사람이 삭제된 투표를 복구할 수도 있어요. 그 이후에는 완전히 사라져요.',
  },
  'privacy.deletedOther': '삭제된 데이터는 데이터베이스 파일에서 즉시 덮어써져요(SQLite의 보안 삭제와 미리 쓰기 로그 비우기). 이 Overlap 사이트를 운영하는 사람이 백업을 보관한다면, 해당 백업이 만료될 때까지 사본이 남아 있을 수 있어요.',

  'privacy.securityHeading': '보안에 대해 솔직하게',
  'privacy.securityLinks': '링크에는 추측하기 사실상 불가능한 긴 무작위 키가 들어 있어요. 비공개 키는 링크의 “#” 뒤에 들어가며, 브라우저는 이 부분을 서버나 다른 사이트로 보내지 않아요. 서버는 이 키를 요청 헤더로만 받아요. 페이지는 엄격한 콘텐츠 보안 정책을 사용하며 리퍼러를 보내지 않아요.',
  'privacy.securityPasswords': '비밀번호는 만드는 사람이 정한 만큼만 강력해요. 1시간 안에 틀린 비밀번호가 30번 입력되면, 그 1시간이 지날 때까지 투표는 비밀번호를 받지 않아요(맞든 틀리든). 링크는 계속 작동해요. 데이터베이스 사본을 얻은 사람은 여전히 오프라인에서 약한 비밀번호를 추측해 볼 수 있으니, 다른 곳에서 쓰지 않는 비밀번호를 사용하세요.',
  'privacy.securityEncryption': 'Overlap은 데이터베이스의 투표 내용을 암호화하지 않으며, 응답은 익명이 아니에요. 참여 링크를 받은 사람은 누구나 이름과 시간을 볼 수도 있어요. {transit} 민감한 용도로는 Overlap을 사용하지 마세요.',
  'privacy.httpsCloudflare': '이 사이트는 HTTPS로만 접속할 수 있으므로, 연결은 전송 중에 암호화돼요.',
  'privacy.httpsOther': '이 Overlap 사이트가 HTTPS로 제공될 때만 연결이 암호화돼요.',

  'privacy.sourceHeading': '소스',
  'privacy.source': 'Overlap은 Micropeptide가 만든 작은 독립 오픈 소스 앱(MIT License)이에요: {link}. 오픈 소스 일정 조율 도구 Timeful에서 영감을 받았지만, 코드를 공유하지는 않아요.',
};
