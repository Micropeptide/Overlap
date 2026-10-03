// Emails, written in the language of the person who asked for them.
export default {
  // The one email sent when someone types their address
  'email.subjectConfirm': 'Konfirmasi email tentang “{title}”',
  'email.subjectLink': 'Tautan Anda untuk “{title}”',
  'email.linkOrganizer': 'Berikut tautan pribadi Anda untuk “{title}”. Dengan tautan ini Anda bisa mengedit, menutup, atau menghapus polling, jadi simpan untuk Anda sendiri:',
  'email.linkGuest': 'Berikut tautan edit pribadi Anda untuk “{title}”. Dengan tautan ini Anda bisa mengubah atau menghapus tanggapan Anda, jadi simpan untuk Anda sendiri:',
  'email.confirmOrganizer': 'Untuk menerima email saat orang-orang menanggapi atau mengubah jawaban mereka, konfirmasi di bawah. Anda akan menerima paling banyak satu email setiap 30 menit.',
  'email.confirmGuest': 'Untuk menerima email saat penyelenggara memilih waktu atau mengubah polling, konfirmasi di bawah. Anda akan menerima paling banyak satu email setiap 30 menit.',
  'email.confirmGuestPublic': 'Untuk menerima email saat penyelenggara memilih waktu atau mengubah polling, atau saat orang-orang menanggapi, konfirmasi di bawah. Anda akan menerima paling banyak satu email setiap 30 menit.',
  'email.confirmButton': 'Konfirmasi pembaruan email',
  'email.welcomeFooter': 'Anda menerima email ini karena seseorang mengetikkan alamat ini di Overlap. Jika itu bukan Anda, abaikan saja: tidak akan ada email lagi yang dikirim.',

  // Update emails
  'email.subjectUpdates': 'Pembaruan untuk “{title}”',
  'email.news': 'Kabar terbaru tentang “{title}”:',
  'email.finalPicked': 'Penyelenggara memilih waktu: {time}.',
  'email.closed': 'Penyelenggara menutup polling.',
  'email.reopened': 'Polling dibuka kembali.',
  'email.edited': 'Penyelenggara mengubah polling. Periksa apakah jawaban Anda masih sesuai.',
  'email.newResponses': { other: 'Tanggapan baru: {names}.' },
  'email.changedAnswers': { other: 'Mengubah jawaban: {names}.' },
  'email.removed': { other: '{count} tanggapan dihapus.' },
  'email.respondedSoFar': { other: 'Sejauh ini {count} orang sudah menanggapi.' },
  'email.nameSeparator': ', ',
  'email.openPoll': 'Buka polling',
  'email.openOrganizerView': 'Buka tampilan penyelenggara',
  'email.guestFooter': 'Tautan ini membuka polling. Di perangkat yang Anda pakai untuk menjawab, tanggapan Anda sudah ada di sana.',
  'email.organizerFooter': 'Tautan ini membuka tampilan penyelenggara di browser tempat Anda membuat polling. Di tempat lain, gunakan tautan pribadi atau kata sandi penyelenggara Anda.',
  'email.stop': 'Berhenti menerima email ini: {url}',

  // A time in an email
  'email.timeRange': '{day}, {start}–{end} (waktu {zone})',
  'email.timeRangeWeekly': 'Setiap {day}, {start}–{end} (waktu {zone})',
  // The plain-text version of the email's button
  'email.buttonText': '{label}: {url}',
};
