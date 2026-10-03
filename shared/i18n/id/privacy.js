// The privacy page. Every statement describes what the code actually does:
// translations must keep the exact meaning, adding or dropping nothing.
export default {
  'privacy.tabTitle': 'Privasi',
  'privacy.title': 'Privasi',
  'privacy.ledeRetention': 'Overlap hanya mengumpulkan apa yang diperlukan untuk menemukan waktu, menyimpannya untuk waktu terbatas, dan memungkinkan Anda menghapusnya kapan pun Anda mau.',
  'privacy.ledeKept': 'Overlap hanya mengumpulkan apa yang diperlukan untuk menemukan waktu, dan memungkinkan Anda menghapusnya kapan pun Anda mau.',

  'privacy.storesHeading': 'Apa yang disimpan Overlap',
  'privacy.storesPoll': 'Untuk setiap polling: namanya, dan jika ditambahkan oleh penyelenggara, catatan, tempat atau tautan panggilan, dan tanggal penutupan. Juga tanggal (atau hari dalam seminggu) dan jam yang ditawarkan, zona waktu, durasi rapat, siapa yang bisa melihat tanggapan, serta apakah polling dibuka, ditutup, atau sudah memiliki waktu final.',
  'privacy.storesResponse': 'Untuk setiap tanggapan: nama tampilan yang diketik tamu, waktu yang mereka tandai (lebih disukai, tersedia, atau jika perlu), dan catatan opsional mereka.',
  'privacy.storesTimestamps': 'Kapan setiap polling dan tanggapan dibuat dan terakhir diubah.',
  'privacy.storesLinkHash': 'Sidik jari acak (hash SHA-256) dari setiap tautan pribadi, agar server bisa memeriksa tautan tanpa menyimpan salinannya.',
  'privacy.storesPasswordHash': 'Jika penyelenggara atau tamu menambahkan kata sandi opsional: hash SHA-256 dari kunci yang dibuat dari kata sandi itu di browser mereka. Tidak pernah kata sandinya sendiri.',
  'privacy.storesAttempts': 'Berapa banyak kata sandi salah yang dicoba untuk setiap polling dalam satu jam terakhir (satu angka per polling, tanpa detail koneksi atau perangkat), untuk mencegah tebak-tebakan.',
  'privacy.storesEmail': 'Hanya jika Anda meminta pembaruan email: alamat email Anda, apakah Anda sudah mengonfirmasinya, dan kapan terakhir kali Anda dikirimi email. Selama ada seseorang yang mengikuti sebuah polling lewat email, Overlap juga menyimpan daftar singkat tentang apa yang berubah dan kapan (misalnya “sebuah tanggapan ditambahkan”, beserta id tanggapan tersebut), agar email berikutnya bisa menyebutkan apa yang baru. Daftar itu dihapus setelah 30 hari.',

  'privacy.notCollectedHeading': 'Apa yang tidak dikumpulkan Overlap',
  'privacy.noAccountsWithEmails': 'Tidak ada akun atau nomor telepon, dan tidak ada alamat email kecuali Anda meminta email.',
  'privacy.noAccounts': 'Tidak ada akun, alamat email, atau nomor telepon.',
  'privacy.passwordsLocal': 'Kata sandi opsional tidak pernah keluar dari browser Anda. Browser mengubah kata sandi menjadi kunci (PBKDF2-SHA-256, 210.000 putaran, dengan salt dari polling), hanya mengirim kunci itu, dan server hanya menyimpan hash dari kunci tersebut.',
  'privacy.noCalendar': 'Tidak ada akses ke kalender.',
  'privacy.noTracking': 'Tidak ada cookie, analitik, iklan, piksel pelacak, atau skrip pihak ketiga. Font disajikan dari situs ini.',
  'privacy.noIpLogs': 'Overlap tidak menulis alamat IP ke database atau log-nya. Untuk memperlambat penyalahgunaan, Overlap menghitung permintaan per koneksi di memori selama sekitar satu jam, lalu melupakannya.',
  'privacy.hostingCloudflare': 'Salinan Overlap ini di-hosting oleh dua perusahaan: GitHub Pages menyajikan halaman-halamannya, dan Cloudflare menjalankan bagian yang menyimpan polling (di database D1 miliknya). Keduanya melihat alamat IP Anda saat Anda terhubung dan mungkin menyimpan log jaringan mereka sendiri. Overlap mematikan pencatatan permintaan opsional milik Cloudflare.',
  'privacy.hostingOther': 'Perusahaan yang meng-hosting salinan Overlap mungkin menyimpan log jaringannya sendiri.',
  'privacy.resend': 'Email dikirim oleh Resend (resend.com), yang menerima alamat dan isi email untuk mengirimkannya, serta menyimpan catatan pengirimannya sendiri sesuai kebijakan privasinya. Overlap tidak mengirim apa pun ke Resend kecuali Anda meminta email.',
  'privacy.calendarLinks': 'Jika polling memiliki waktu final, Anda bisa membukanya di Google Kalender atau Outlook.com. Mengklik salah satu tautan itu akan mengirimkan nama acara, waktu, tempat, catatan, dan tautan tamu polling ke perusahaan tersebut, dan siapa pun yang punya tautan tamu bisa melihat polling (dan, kecuali hasilnya disembunyikan, nama dan waktu semua orang). Tidak ada yang dikirim kecuali Anda mengklik.',

  'privacy.whoHeading': 'Siapa yang bisa melihat apa',
  'privacy.guestLink': 'Tautan tamu menampilkan polling kepada siapa pun yang memilikinya. Secara default, tamu juga bisa melihat nama dan waktu satu sama lain. Penyelenggara bisa mengubahnya ke “Hanya saya”, dan server kemudian berhenti mengirimkan tanggapan orang lain kepada tamu.',
  'privacy.privateLink': 'Tautan pribadi memungkinkan siapa pun yang memilikinya untuk mengedit, menutup, atau menghapus polling dan menghapus tanggapan. Penyelenggara bisa menggantinya kapan saja, sehingga tautan lama berhenti berfungsi.',
  'privacy.guestEditLink': 'Setiap tamu mendapatkan tautan edit pribadi yang hanya memungkinkan mereka mengubah atau menghapus tanggapan mereka sendiri. Mengetikkan nama orang lain tidak memberikan akses ke tanggapan orang itu.',
  'privacy.passwordAccess': 'Tamu yang menambahkan kata sandi juga bisa membuka tanggapannya di perangkat lain dengan nama dan kata sandi tersebut. Penyelenggara yang mengatur kata sandi bisa membuka tampilan penyelenggara dari tautan tamu dengan kata sandi itu. Kedua jenis kata sandi bisa diubah atau dihapus nanti.',
  'privacy.hiddenResults': 'Jika hasil diatur ke “Hanya saya”, tamu tetap bisa melihat berapa banyak orang yang sudah menanggapi, tetapi tidak bisa melihat siapa. Dalam hal ini nama tidak harus unik, jadi mencoba sebuah nama juga tidak mengungkapkan apa pun.',
  'privacy.emailPrivate': 'Alamat email Anda tidak pernah ditampilkan kepada penyelenggara, kepada tamu, atau di halaman mana pun. Hanya orang yang menambahkannya yang bisa melihat atau mengubahnya, dari halaman tempat alamat itu ditambahkan. Email pembaruan tidak berisi tautan pribadi; hanya email yang Anda minta untuk mengirim tautan Anda yang berisi tautan pribadi.',
  'privacy.browserStorage': 'Browser Anda menyimpan beberapa hal di penyimpanannya sendiri, hanya di perangkat Anda: tautan pribadi yang Anda gunakan (atau kunci turunan kata sandi yang Anda pakai untuk masuk), nama terakhir yang Anda ketik, zona waktu pilihan Anda dan pengaturan formulir, serta tanggapan yang belum Anda kirim (tanda, nama, dan catatannya, agar tidak hilang saat halaman dimuat ulang). “Duplikat polling” menyimpan sementara pengaturan, judul, catatan, dan tempat polling di penyimpanan sesi tab. Menghapus data browser Anda akan menghapus semua ini; server Overlap tidak pernah melihatnya.',

  'privacy.retentionHeading': 'Berapa lama data disimpan',
  // The paragraph is whole sentences; these two only set their order and spacing.
  'privacy.retentionParagraph': '{policy} {anytime} {afterDelete}',
  'privacy.retentionParagraphEmails': '{policy} {anytime} {emails} {afterDelete}',
  'privacy.retentionAuto': {
    other: 'Polling dan semua tanggapannya dihapus otomatis {count} hari setelah tanggal terakhir di polling. Polling mingguan tidak punya tanggal terakhir, jadi polling itu dihapus {count} hari setelah perubahan terakhirnya: suntingan, atau tanggapan yang ditambahkan atau diperbarui.',
  },
  'privacy.retentionKept': 'Overlap tidak menghapus polling dengan sendirinya: polling dan tanggapannya disimpan sampai penyelenggara menghapus polling tersebut.',
  'privacy.deleteAnytime': 'Penyelenggara bisa menghapus polling kapan saja, dan tamu bisa menghapus tanggapan mereka sendiri kapan saja, bahkan setelah polling ditutup.',
  'privacy.emailDeletion': 'Alamat email dihapus saat Anda menghentikan email (dari halaman polling atau tautan di email mana pun), saat Anda menghapus tanggapan Anda, atau saat polling dihapus. Alamat yang hanya dipakai untuk mengirimkan tautan Anda tidak disimpan sama sekali.',
  'privacy.deletedCloudflare': {
    other: 'Data yang dihapus langsung dihilangkan dari database aktif. Database Cloudflare menyimpan riwayat pemulihan otomatis selama {count} hari, jadi selama itu polling yang dihapus masih bisa dipulihkan oleh siapa pun yang menjalankan salinan Overlap ini; setelah itu, data tersebut hilang.',
  },
  'privacy.deletedOther': 'Data yang dihapus langsung ditimpa di file database (penghapusan aman SQLite, ditambah pengosongan write-ahead log-nya). Jika siapa pun yang menjalankan salinan Overlap ini menyimpan cadangan, salinan data bisa tetap ada di cadangan tersebut sampai cadangan itu kedaluwarsa.',

  'privacy.securityHeading': 'Keamanan, terus terang',
  'privacy.securityLinks': 'Tautan berisi kunci acak panjang yang praktis mustahil ditebak. Kunci pribadi berada setelah tanda “#” di tautan, yang tidak dikirim browser ke server atau ke situs lain, dan server hanya pernah menerimanya di header permintaan. Halaman-halaman menggunakan kebijakan keamanan konten yang ketat dan tidak mengirim referrer.',
  'privacy.securityPasswords': 'Kata sandi hanya sekuat yang Anda buat. Setelah 30 kata sandi salah dalam satu jam, polling berhenti menerima kata sandi (benar atau salah) sampai satu jam itu berakhir, sementara tautan tetap berfungsi. Seseorang yang mendapatkan salinan database tetap bisa mencoba menebak kata sandi yang lemah secara offline, jadi gunakan kata sandi yang tidak Anda pakai di tempat lain.',
  // {transit} is privacy.httpsCloudflare or privacy.httpsOther, a whole sentence.
  'privacy.securityEncryption': 'Overlap tidak mengenkripsi isi polling di database-nya, dan tanggapan tidak anonim: siapa pun yang Anda beri tautan tamu bisa melihat nama dan waktu. {transit} Jangan gunakan Overlap untuk hal yang sensitif.',
  'privacy.httpsCloudflare': 'Salinan ini hanya bisa diakses lewat HTTPS, jadi koneksi dienkripsi selama transit.',
  'privacy.httpsOther': 'Koneksi hanya dienkripsi jika salinan Overlap ini disajikan lewat HTTPS.',

  'privacy.sourceHeading': 'Kode sumber',
  // {link} is the repository address, github.com/Micropeptide/Overlap.
  'privacy.source': 'Overlap adalah aplikasi open source yang kecil dan independen (Lisensi MIT) buatan Micropeptide: {link}. Aplikasi ini terinspirasi oleh penjadwal open source Timeful, tetapi tidak berbagi kode dengannya.',
};
