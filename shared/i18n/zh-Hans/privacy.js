// The privacy page. Every statement describes what the code actually does:
// translations must keep the exact meaning, adding or dropping nothing.
export default {
  'privacy.tabTitle': '隐私',
  'privacy.title': '隐私',
  'privacy.ledeRetention': 'Overlap 只收集找时间所需的信息，只保留有限的时间，并且你随时可以删除。',
  'privacy.ledeKept': 'Overlap 只收集找时间所需的信息，并且你随时可以删除。',

  'privacy.storesHeading': 'Overlap 存储哪些信息',
  'privacy.storesPoll': '每个投票：名称；如果发起人添加了，还有备注、地点或通话链接，以及截止日期。此外还有提供的日期（或星期几）和时间、时区、会议时长、谁能看到回复，以及投票是开放、已关闭还是已有最终时间。',
  'privacy.storesResponse': '每条回复：参与者输入的显示名称、其标记的时间（首选、有空或勉强可以），以及可选的备注。',
  'privacy.storesTimestamps': '每个投票和每条回复的创建时间和最后修改时间。',
  'privacy.storesLinkHash': '每个专属链接经过混淆的指纹（SHA-256 哈希值），这样服务器无需保留链接副本也能验证链接。',
  'privacy.storesPasswordHash': '如果发起人或参与者添加了可选密码：在其浏览器中由密码生成的密钥的 SHA-256 哈希值。绝不存储密码本身。',
  'privacy.storesAttempts': '过去一小时内每个投票被尝试的错误密码次数（每个投票一个数字，不含任何连接或设备信息），用于阻止猜测密码。',
  'privacy.storesEmail': '仅当你申请邮件更新时：你的邮箱地址、你是否已确认，以及上次给你发邮件的时间。当某个投票有人通过邮件关注时，Overlap 还会保留一份简短的列表，记录发生了什么变化以及何时发生（例如“新增了一条回复”，以及该回复的 ID），以便下一封邮件说明有哪些新内容。该列表会在 30 天后清除。',

  'privacy.notCollectedHeading': 'Overlap 不收集哪些信息',
  'privacy.noAccountsWithEmails': '没有账号，不收集手机号码；除非你申请邮件，否则也不收集邮箱地址。',
  'privacy.noAccounts': '没有账号，也不收集邮箱地址或手机号码。',
  'privacy.passwordsLocal': '可选密码永远不会离开你的浏览器。浏览器会把密码转换成一个密钥（PBKDF2-SHA-256，210,000 轮，以投票作为盐值），只发送这个密钥，服务器只保存该密钥的哈希值。',
  'privacy.noCalendar': '不访问日历。',
  'privacy.noTracking': '没有 Cookie、分析统计、广告、跟踪像素或第三方脚本。字体由本站提供。',
  'privacy.noIpLogs': 'Overlap 不会把 IP 地址写入数据库或日志。为了减缓滥用，它会在内存中按连接统计请求数，大约一小时后便会忘掉。',
  'privacy.hostingCloudflare': '此 Overlap 站点由两家公司托管：GitHub Pages 提供页面，Cloudflare 运行存储投票的部分（使用其 D1 数据库）。你连接时，两家公司都能看到你的 IP 地址，并可能保留各自的网络日志。Overlap 关闭了 Cloudflare 的可选请求日志功能。',
  'privacy.hostingOther': '托管 Overlap 站点的公司可能会保留自己的网络日志。',
  'privacy.resend': '邮件由 Resend（resend.com）发送。为了投递邮件，Resend 会收到邮箱地址和邮件内容，并依据其隐私政策保留自己的投递记录。除非你申请邮件，否则 Overlap 不会向 Resend 发送任何内容。',
  'privacy.calendarLinks': '如果投票已有最终时间，你可以在 Google 日历或 Outlook.com 中打开它。点击其中一个链接，会把活动的名称、时间、地点、备注以及投票的邀请链接发送给该公司，而任何持有邀请链接的人都能看到该投票（除非结果被隐藏，否则还能看到所有人的名字和时间）。除非你点击，否则不会发送任何内容。',

  'privacy.whoHeading': '谁能看到什么',
  'privacy.guestLink': '任何持有邀请链接的人都能看到投票。默认情况下，参与者还能看到彼此的名字和时间。发起人可以将其改为“仅我自己”，之后服务器就不再向参与者发送其他人的回复。',
  'privacy.privateLink': '专属链接让持有者可以编辑、关闭或删除投票，以及移除回复。发起人可以随时更换它，旧链接随即失效。',
  'privacy.guestEditLink': '每位参与者都会获得一个专属编辑链接，只能用它修改或删除自己的回复。输入别人的名字并不能访问对方的回复。',
  'privacy.passwordAccess': '添加了密码的参与者，还可以在其他设备上用名字和该密码打开自己的回复。设置了密码的发起人，可以凭该密码从邀请链接打开发起人视图。两种密码之后都可以更改或移除。',
  'privacy.hiddenResults': '当结果设为“仅我自己”时，参与者仍能看到有多少人回复，但看不到是谁。这种情况下名字不必唯一，所以尝试输入某个名字也不会透露任何信息。',
  'privacy.emailPrivate': '你的邮箱地址绝不会显示给发起人或参与者，也不会出现在任何页面上。只有添加它的人能在添加它的页面上查看或更改。更新邮件不包含专属链接；只有你申请发送链接的那封邮件才包含。',
  'privacy.browserStorage': '你的浏览器会在自己的存储中保存一些内容，仅限于你的设备：你使用的专属链接（或你登录时使用的、由密码派生的密钥）、你上次输入的名字、你偏好的时区和表单设置，以及你还没提交的回复（其中的标记、名字和备注，这样刷新页面也不会丢失）。“复制投票”会在标签页的会话存储中短暂保存投票的设置、标题、备注和地点。清除浏览器数据会删除所有这些内容；Overlap 的服务器永远看不到它们。',

  'privacy.retentionHeading': '数据保留多久',
  // The paragraph is whole sentences; these two only set their order and spacing.
  'privacy.retentionParagraph': '{policy}{anytime}{afterDelete}',
  'privacy.retentionParagraphEmails': '{policy}{anytime}{emails}{afterDelete}',
  'privacy.retentionAuto': {
    other: '投票及其所有回复会在投票中最后一个日期过后 {count} 天自动删除。每周投票没有最后日期，因此会在最后一次更改（编辑，或新增、更新回复）后 {count} 天删除。',
  },
  'privacy.retentionKept': 'Overlap 不会自行删除投票：投票及其回复会一直保留，直到发起人删除该投票。',
  'privacy.deleteAnytime': '发起人可以随时删除投票，参与者也可以随时删除自己的回复，即使投票已关闭。',
  'privacy.emailDeletion': '在以下情况下，邮箱地址会被删除：你停止邮件（在投票页面或通过任何一封邮件中的链接）、你删除自己的回复，或投票被删除。仅用于向你发送链接的地址根本不会被存储。',
  'privacy.deletedCloudflare': {
    other: '被删除的数据会立即从线上数据库中移除。Cloudflare 的数据库会自动保留 {count} 天的恢复历史，因此在这段时间内，运营此 Overlap 站点的人仍可能恢复已删除的投票；之后数据就彻底消失了。',
  },
  'privacy.deletedOther': '被删除的数据会立即在数据库文件中被覆盖（使用 SQLite 的安全删除，并清空其预写日志）。如果运营此 Overlap 站点的人保留了备份，在这些备份过期之前，其中可能仍留有副本。',

  'privacy.securityHeading': '坦诚谈安全',
  'privacy.securityLinks': '链接中包含很长的随机密钥，实际上无法猜中。私密密钥位于链接中的“#”之后，浏览器不会把这部分发送给服务器或其他网站，服务器只会在请求头中收到它们。页面使用严格的内容安全策略，并且不发送来源信息（referrer）。',
  'privacy.securityPasswords': '密码的强度取决于你自己。如果一小时内输错 30 次密码，该投票会停止接受密码（无论对错），直到这一小时结束，但链接仍然可用。获得数据库副本的人仍可能离线猜测弱密码，所以请使用一个你在其他地方没用过的密码。',
  // {transit} is privacy.httpsCloudflare or privacy.httpsOther, a whole sentence.
  'privacy.securityEncryption': 'Overlap 不会加密数据库中的投票内容，回复也不是匿名的：你把邀请链接给到的任何人都可能看到名字和时间。{transit}请不要用 Overlap 处理任何敏感事务。',
  'privacy.httpsCloudflare': '此站点只能通过 HTTPS 访问，因此连接在传输过程中是加密的。',
  'privacy.httpsOther': '只有当此 Overlap 站点通过 HTTPS 提供服务时，连接才会加密。',

  'privacy.sourceHeading': '源代码',
  // {link} is the repository address, github.com/Micropeptide/Overlap.
  'privacy.source': 'Overlap 是由 Micropeptide 开发的一款小型独立开源应用（MIT 许可证）：{link}。它受到开源日程工具 Timeful 的启发，但没有共用任何代码。',
};
