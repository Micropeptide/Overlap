// Errors the server reports, by their `code`. {field} is an API field name such
// as "available"; it is left as it is.
export default {
  // Poll fields
  'errors.not_text': '{field} harus berupa teks.',
  'errors.title_required': 'Tambahkan judul.',
  'errors.name_required': 'Tambahkan nama.',
  'errors.title_too_long': { other: 'Judul harus kurang dari {count} karakter.' },
  'errors.description_too_long': { other: 'Deskripsi harus kurang dari {count} karakter.' },
  'errors.location_too_long': { other: 'Lokasi harus kurang dari {count} karakter.' },
  'errors.note_too_long': { other: 'Catatan harus kurang dari {count} karakter.' },
  'errors.name_too_long': { other: 'Nama harus kurang dari {count} karakter.' },
  'errors.not_whole_number': '{field} harus berupa bilangan bulat.',
  'errors.poll_not_object': 'Kirim polling sebagai objek JSON.',
  'errors.closes_on_invalid': 'Pilih tanggal penutupan yang valid dalam tiga tahun ke depan.',
  'errors.closes_on_passed': 'Tanggal penutupan itu sudah lewat. Pilih hari ini atau setelahnya.',
  'errors.timezone_invalid': 'Pilih zona waktu yang valid, misalnya Asia/Jakarta.',
  'errors.kind_invalid': 'Pilih tanggal tertentu atau hari dalam seminggu.',
  'errors.weekly_sent_dates': 'Ini polling mingguan. Kirim "weekdays", bukan "dates".',
  'errors.weekdays_required': 'Pilih minimal satu hari dalam seminggu.',
  'errors.weekdays_invalid': 'Hari dalam seminggu harus berupa angka dari 0 (Minggu) sampai 6 (Sabtu).',
  'errors.dates_sent_weekdays': 'Polling ini menggunakan tanggal tertentu. Kirim "dates", bukan "weekdays".',
  'errors.dates_required': 'Pilih minimal satu tanggal.',
  'errors.too_many_dates': { other: 'Pilih maksimal {count} tanggal.' },
  'errors.date_invalid': '“{date}” bukan tanggal yang valid.',
  'errors.dates_out_of_range': 'Pilih tanggal dalam tiga tahun ke depan.',
  'errors.dates_all_passed': 'Semua tanggal itu sudah lewat. Pilih minimal satu tanggal yang akan datang.',
  'errors.slot_minutes_invalid': 'Interval waktu harus 15, 30, atau 60 menit.',
  'errors.end_before_start': 'Waktu selesai harus setelah waktu mulai.',
  'errors.duration_invalid': 'Durasi rapat harus antara 15 menit dan 12 jam.',
  'errors.allow_edits_invalid': 'Tentukan apakah tamu bisa mengubah jawaban mereka (true atau false).',
  'errors.visibility_invalid': 'Pilih siapa yang bisa melihat tanggapan.',
  'errors.times_misaligned': { other: 'Waktu mulai dan selesai harus sesuai dengan interval {count} menit.' },
  'errors.range_too_short': 'Rentang waktu lebih pendek dari satu interval waktu.',
  'errors.duration_too_long': 'Rapat lebih panjang dari rentang waktu. Perlebar rentang waktunya atau persingkat rapatnya.',
  'errors.too_many_slots': 'Terlalu banyak waktu untuk dipilih. Pilih lebih sedikit tanggal atau rentang yang lebih pendek.',
  'errors.no_slots': 'Tidak ada satu pun dari waktu itu yang ada di zona waktu tersebut.',

  // Responses
  'errors.response_not_object': 'Kirim tanggapan sebagai objek JSON.',
  'errors.name_invisible': 'Tambahkan nama yang bisa dilihat orang.',
  'errors.not_time_list': '{field} harus berupa daftar waktu.',

  // Final time
  'errors.final_required': 'Pilih waktu mulai dan selesai.',
  'errors.final_end_before_start': 'Waktu final harus berakhir setelah dimulai.',
  'errors.final_too_long': 'Waktu final paling lama 24 jam.',
  'errors.final_bad_length': 'Durasi waktu final harus kelipatan 5 menit.',
  'errors.final_not_a_time': 'Waktu final harus dimulai pada salah satu waktu di polling.',

  // Requests
  'errors.too_many_requests': 'Terlalu banyak permintaan dari koneksi ini. Tunggu beberapa menit dan coba lagi.',
  'errors.json_required': 'Kirim JSON dengan Content-Type: application/json.',
  'errors.body_too_large': 'Permintaan itu terlalu besar.',
  'errors.invalid_json': 'Isi permintaan bukan JSON yang valid.',
  'errors.method_not_allowed': 'Metode itu tidak diizinkan di sini.',
  'errors.not_found': 'Tidak ditemukan.',
  'errors.server_error': 'Terjadi kesalahan di pihak kami. Silakan coba lagi.',

  // Polls and access
  'errors.poll_not_found': 'Polling ini tidak ada. Mungkin sudah dihapus atau kedaluwarsa.',
  'errors.admin_link_or_password_wrong': 'Tautan pribadi atau kata sandi itu salah. Tautannya mungkin sudah diganti, atau kata sandinya sudah diubah.',
  'errors.admin_link_invalid': 'Tautan pribadi ini tidak valid. Mungkin sudah diganti.',
  'errors.changes_not_object': 'Kirim perubahan sebagai objek JSON.',
  'errors.reopen_with_final': 'Membuka kembali polling akan menghapus waktu finalnya, jadi kirim salah satu saja.',
  'errors.status_invalid': 'Status harus "open" atau "closed".',
  'errors.no_final_time': 'Polling ini belum punya waktu final.',

  // Answering
  'errors.poll_closed': 'Polling ini sudah ditutup, jadi tidak menerima tanggapan baru.',
  'errors.poll_closed_no_changes': 'Polling ini sudah ditutup, jadi tanggapan tidak bisa diubah lagi.',
  'errors.edits_not_allowed': 'Penyelenggara tidak mengizinkan jawaban diubah setelah dikirim. Anda tetap bisa menghapus jawaban Anda.',
  'errors.too_many_responses': { other: 'Polling ini sudah memiliki {count} tanggapan.' },
  'errors.name_taken': 'Seseorang sudah menanggapi sebagai “{name}”. Jika itu Anda, buka tautan edit pribadi Anda. Jika bukan, tambahkan inisial nama belakang.',
  'errors.name_taken_other': 'Orang lain sudah menanggapi sebagai “{name}”. Coba tambahkan inisial nama belakang.',
  'errors.response_not_found': 'Tanggapan itu sudah tidak ada.',
  'errors.my_response_not_found': 'Kami tidak dapat menemukan tanggapan Anda. Mungkin sudah dihapus.',
  'errors.not_your_response': 'Hanya orang yang mengirim tanggapan ini yang bisa mengubahnya.',

  // Passwords
  'errors.password_unreadable': 'Kata sandi itu tidak dapat dibaca. Muat ulang halaman dan coba lagi.',
  'errors.too_many_wrong_passwords': 'Terlalu banyak kata sandi salah untuk polling ini. Tunggu satu jam dan coba lagi, atau gunakan tautan pribadi Anda.',
  'errors.password_no_longer_works': 'Kata sandi itu tidak lagi berfungsi untuk tanggapan ini. Mungkin sudah diubah.',
  'errors.sign_in_incomplete': 'Masukkan nama yang Anda pakai saat menjawab dan kata sandi Anda.',
  'errors.sign_in_failed': 'Nama dan kata sandi itu tidak cocok dengan tanggapan yang memakai kata sandi. Periksa ejaannya, atau gunakan tautan edit pribadi Anda.',

  // Email
  'errors.email_not_set_up': 'Email belum diatur di salinan Overlap ini.',
  'errors.email_invalid': 'Itu sepertinya bukan alamat email.',
  'errors.link_not_current': 'Tautan pribadi itu bukan yang terbaru. Muat ulang halaman dan coba lagi.',
  'errors.email_nothing_chosen': 'Pilih apa yang ingin dikirim lewat email: tautan Anda, pembaruan, atau keduanya.',
  'errors.email_daily_limit': 'Overlap sudah mengirim cukup banyak email ke alamat itu (atau untuk polling ini) hari ini. Coba lagi besok.',
  'errors.email_send_failed': 'Email tidak dapat dikirim saat ini. Coba lagi dalam satu menit.',
  'errors.confirm_link_expired': 'Tautan konfirmasi ini sudah kedaluwarsa atau sudah diganti. Minta email lagi dari polling.',
};
