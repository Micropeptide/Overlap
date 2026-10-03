// The privacy page. Every statement describes what the code actually does:
// translations must keep the exact meaning, adding or dropping nothing.
export default {
  'privacy.tabTitle': 'プライバシー',
  'privacy.title': 'プライバシー',
  'privacy.ledeRetention': 'Overlapは、時間を見つけるのに必要な情報だけを収集し、限られた期間だけ保持します。あなたはいつでも好きなときに削除できます。',
  'privacy.ledeKept': 'Overlapは、時間を見つけるのに必要な情報だけを収集します。あなたはいつでも好きなときに削除できます。',

  'privacy.storesHeading': 'Overlapが保存するもの',
  'privacy.storesPoll': '日程調整ごとに：名前と、主催者が追加した場合はメモ、場所または通話リンク、締め切り日。また、候補の日付（または曜日）と時間帯、タイムゾーン、所要時間、回答を見られる人、そして受付中・締め切り・日時確定のどの状態か。',
  'privacy.storesResponse': '回答ごとに：参加者が入力した表示名、入力した時間帯（希望、参加可能、必要なら可）、任意のメモ。',
  'privacy.storesTimestamps': '各日程調整と回答が作成された日時と、最後に変更された日時。',
  'privacy.storesLinkHash': '各専用リンクのスクランブル済みの指紋（SHA-256ハッシュ）。これにより、サーバーはリンクのコピーを保持せずにリンクを照合できます。',
  'privacy.storesPasswordHash': '主催者または参加者が任意のパスワードを追加した場合：ブラウザ内でそのパスワードから作られた鍵のSHA-256ハッシュ。パスワードそのものは保存しません。',
  'privacy.storesAttempts': '推測を防ぐため、各日程調整で直近1時間に試された間違ったパスワードの回数（日程調整ごとの数値のみで、接続や端末の情報は含みません）。',
  'privacy.storesEmail': 'メールでの更新情報を申し込んだ場合のみ：あなたのメールアドレス、確認済みかどうか、最後にメールを送った日時。日程調整をメールでフォローしている人がいる間は、次のメールで新しい内容を伝えられるよう、何がいつ変わったかの短いリスト（例：「回答が追加された」と、その回答のID）も保持します。このリストは30日後に消去されます。',

  'privacy.notCollectedHeading': 'Overlapが収集しないもの',
  'privacy.noAccountsWithEmails': 'アカウントや電話番号は収集しません。メールアドレスも、メールを申し込まない限り収集しません。',
  'privacy.noAccounts': 'アカウント、メールアドレス、電話番号は収集しません。',
  'privacy.passwordsLocal': '任意のパスワードがブラウザの外に出ることはありません。ブラウザがパスワードを鍵に変換し（PBKDF2-SHA-256、210,000回、日程調整ごとのソルト付き）、その鍵だけを送信します。サーバーが保持するのは鍵のハッシュだけです。',
  'privacy.noCalendar': 'カレンダーにはアクセスしません。',
  'privacy.noTracking': 'Cookie、アクセス解析、広告、トラッキングピクセル、サードパーティのスクリプトは使いません。フォントはこのサイトから配信しています。',
  'privacy.noIpLogs': 'OverlapはIPアドレスをデータベースやログに書き込みません。不正利用を抑えるため、接続ごとのリクエスト数をメモリ上で約1時間数え、その後は破棄します。',
  'privacy.hostingCloudflare': 'このOverlapは2つの会社によってホストされています。ページはGitHub Pagesが配信し、日程調整を保存する部分はCloudflareが（D1データベースで）運用しています。どちらの会社も接続時にあなたのIPアドレスを把握し、独自のネットワークログを保持する場合があります。OverlapはCloudflareの任意のリクエストログ機能をオフにしています。',
  'privacy.hostingOther': 'このOverlapをホストしている会社が、独自のネットワークログを保持する場合があります。',
  'privacy.resend': 'メールはResend（resend.com）が送信します。Resendは配信のためにメールアドレスとメールの内容を受け取り、同社のプライバシーポリシーに基づいて独自の配信記録を保持します。メールを申し込まない限り、OverlapがResendに何かを送ることはありません。',
  'privacy.calendarLinks': '日程調整に確定日時がある場合、GoogleカレンダーやOutlook.comで開くことができます。いずれかのリンクをクリックすると、予定の名前、日時、場所、メモ、日程調整の参加者用リンクがその会社に送信されます。参加者用リンクを持つ人は誰でも日程調整を見られます（結果が非公開でなければ、全員の名前と時間帯も見られます）。クリックしない限り、何も送信されません。',

  'privacy.whoHeading': '誰が何を見られるか',
  'privacy.guestLink': '参加者用リンクを持っている人は誰でも日程調整を見られます。初期設定では、参加者同士で名前と時間帯も見られます。主催者はこれを「自分のみ」に切り替えることができ、その場合サーバーは他の人の回答を参加者に送らなくなります。',
  'privacy.privateLink': '専用リンクを持っている人は、日程調整の編集、締め切り、削除、回答の削除ができます。主催者はいつでも専用リンクを置き換えられ、置き換えると古いリンクは使えなくなります。',
  'privacy.guestEditLink': '参加者にはそれぞれ専用の編集リンクが発行され、自分の回答だけを変更・削除できます。他の人の名前を入力しても、その人の回答にはアクセスできません。',
  'privacy.passwordAccess': 'パスワードを追加した参加者は、名前とそのパスワードで別の端末から自分の回答を開くこともできます。パスワードを設定した主催者は、それを使って参加者用リンクから主催者画面を開けます。どちらのパスワードも、あとから変更や削除ができます。',
  'privacy.hiddenResults': '結果が「自分のみ」に設定されている場合、参加者には回答した人数は表示されますが、誰が回答したかは表示されません。その場合は名前が重複しても構わないため、名前を試しても何もわかりません。',
  'privacy.emailPrivate': 'あなたのメールアドレスは、主催者にも参加者にも、どのページにも表示されません。確認や変更ができるのは、追加した本人が、追加したページからだけです。更新情報のメールには専用リンクは含まれません。含まれるのは、リンクを申し込んだメールだけです。',
  'privacy.browserStorage': 'ブラウザは、いくつかの情報をあなたの端末上の独自のストレージにのみ保存します。使用した専用リンク（またはログインに使ったパスワード由来の鍵）、最後に入力した名前、優先するタイムゾーンとフォームの設定、まだ送信していない回答（再読み込みしても失われないよう、その入力、名前、メモ）です。「日程調整を複製」は、日程調整の設定、タイトル、メモ、場所をタブのセッションストレージに一時的に保存します。ブラウザのデータを消去すると、これらはすべて削除されます。Overlapのサーバーがこれらを見ることはありません。',

  'privacy.retentionHeading': 'データの保存期間',
  // The paragraph is whole sentences; these two only set their order and spacing.
  'privacy.retentionParagraph': '{policy}{anytime}{afterDelete}',
  'privacy.retentionParagraphEmails': '{policy}{anytime}{emails}{afterDelete}',
  'privacy.retentionAuto': {
    other: '日程調整とそのすべての回答は、日程調整の最終日から{count}日後に自動で削除されます。毎週の日程調整には最終日がないため、最後の変更（編集、または回答の追加や更新）から{count}日後に削除されます。',
  },
  'privacy.retentionKept': 'Overlapが自動で日程調整を削除することはありません。日程調整とその回答は、主催者が日程調整を削除するまで残ります。',
  'privacy.deleteAnytime': '主催者はいつでも日程調整を削除でき、参加者は日程調整が締め切られた後も含め、いつでも自分の回答を削除できます。',
  'privacy.emailDeletion': 'メールアドレスは、メールを停止したとき（日程調整のページから、またはいずれかのメール内のリンクから）、回答を削除したとき、または日程調整が削除されたときに削除されます。リンクを送るためだけに使われたアドレスは、一切保存されません。',
  'privacy.deletedCloudflare': {
    other: '削除されたデータは、稼働中のデータベースからただちに削除されます。Cloudflareのデータベースは自動の復元履歴を{count}日間保持するため、その期間内であれば、このOverlapの運営者が削除された日程調整を復元できる可能性があります。その期間を過ぎると完全に消えます。',
  },
  'privacy.deletedOther': '削除されたデータは、データベースファイル内でただちに上書きされます（SQLiteのセキュアデリートと、先行書き込みログのフラッシュによる）。このOverlapの運営者がバックアップを保持している場合、そのバックアップの期限が切れるまでコピーが残ることがあります。',

  'privacy.securityHeading': 'セキュリティについて正直に',
  'privacy.securityLinks': 'リンクには、推測が現実的に不可能な長いランダムな鍵が含まれています。専用の鍵はリンクの「#」以降に置かれます。ブラウザはこの部分をサーバーにも他のサイトにも送らず、サーバーはリクエストヘッダーでのみ鍵を受け取ります。ページには厳格なコンテンツセキュリティポリシーが適用され、リファラーは送信されません。',
  'privacy.securityPasswords': 'パスワードの強さは、あなたの設定次第です。1時間に30回パスワードを間違えると、その日程調整は1時間が経過するまでパスワードを（正しいものも間違ったものも）受け付けなくなりますが、リンクは引き続き使えます。データベースのコピーを入手した人が、弱いパスワードをオフラインで推測しようとする可能性はあるため、他では使っていないパスワードを使ってください。',
  // {transit} is privacy.httpsCloudflare or privacy.httpsOther, a whole sentence.
  'privacy.securityEncryption': 'Overlapはデータベース内の日程調整の内容を暗号化しておらず、回答も匿名ではありません。参加者用リンクを渡した相手は誰でも、名前と時間帯を見られる場合があります。{transit}機密性の高い用途にはOverlapを使わないでください。',
  'privacy.httpsCloudflare': 'このOverlapにはHTTPSでのみアクセスできるため、通信は転送中に暗号化されます。',
  'privacy.httpsOther': '通信が暗号化されるのは、このOverlapがHTTPSで配信されている場合のみです。',

  'privacy.sourceHeading': 'ソースコード',
  // {link} is the repository address, github.com/Micropeptide/Overlap.
  'privacy.source': 'Overlapは、Micropeptideによる小規模で独立したオープンソースのアプリ（MIT License）です：{link}。オープンソースのスケジューラーTimefulに着想を得ていますが、コードは共有していません。',
};
