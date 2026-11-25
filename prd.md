PRD: Sistem Informasi Data Lembaga dan Peserta Didik PAUDNI

Dinas Pendidikan dan Kebudayaan Kabupaten Boyolali, Bidang PAUDNI

1. Ringkasan

Aplikasi web untuk mengumpulkan, mengelola, dan melaporkan data lembaga dan peserta didik jenjang TK, PAUD, dan Posyandu se-Kabupaten Boyolali. Lembaga mengunggah data siswa secara massal (Excel/CSV), lalu data otomatis ter-update. Admin dinas dan kecamatan memantau serta mencetak laporan.

2. Tujuan dan Metrik

Tujuan:

Admin dinas memiliki data siswa yang lengkap dan terpusat.
Lembaga cukup mengunggah file, tanpa input satu per satu.
Kecamatan bisa memantau dan mencetak data wilayahnya.
Laporan rekap tersedia kapan saja tanpa rekap manual.

Metrik keberhasilan: persentase lembaga yang sudah mengunggah data, waktu pembuatan laporan (hitungan detik), dan jumlah error validasi saat unggah.

3. Ruang Lingkup

Termasuk (MVP): login 3 role, master data kecamatan dan lembaga, unggah data siswa, tampilan berjenjang (kecamatan → lembaga → siswa), dashboard rekap, ekspor dan cetak, log aktivitas.
Belum termasuk: absensi, data guru/tenaga pendidik, data tumbuh kembang Posyandu (timbangan, imunisasi), integrasi Dapodik, aplikasi mobile.

4. Role dan Hak Akses
Admin Dinas (akses penuh)
Mengelola akun pengguna: membuat, mereset password, dan menonaktifkan.
Mengelola master data kecamatan dan lembaga.
Melihat data lembaga dan siswa dari semua kecamatan.
Mengunggah data siswa untuk lembaga mana pun.
Menambah, mengedit, dan menghapus data siswa secara manual.
Mengedit profil lembaga.
Mencetak dan mengekspor laporan.
Melihat log aktivitas.

Kecamatan (hanya baca dan cetak)
Melihat data lembaga dan siswa hanya di kecamatannya sendiri.
Mencetak dan mengekspor laporan wilayahnya.
Tidak bisa mengunggah, mengubah, atau menghapus data apa pun.
Tidak bisa mengelola akun, master data, maupun melihat log aktivitas.

Lembaga (TK / PAUD / Posyandu)
Melihat data siswa hanya di lembaganya sendiri.
Mengunggah data siswa untuk lembaganya.
Menambah, mengedit, dan menghapus data siswa lembaganya secara manual.
Mengedit profil lembaga (terbatas).
Mencetak dan mengekspor laporan lembaganya.
Tidak bisa mengakses data lembaga lain, mengelola akun, mengubah master data, atau melihat log aktivitas.

Aturan akun:

Semua akun dibuat oleh admin; tidak ada pendaftaran mandiri.
Akun kecamatan: satu akun per kecamatan (19 akun), hanya baca dan cetak.
Akun lembaga: satu akun per lembaga, terikat ke lembaga tersebut.
5. Alur Pengguna Utama
Admin: login → dashboard rekap → pilih kecamatan → pilih lembaga → lihat daftar siswa → ekspor/cetak.
Kecamatan: login → langsung melihat daftar lembaga di kecamatannya → klik lembaga → lihat jumlah dan data siswa → cetak.
Lembaga: login → unduh template → isi data → unggah → pratinjau dan validasi → konfirmasi → data ter-update.
6. Kebutuhan Fungsional
6.1 Autentikasi
Login email/username + password (Supabase Auth).
Tiap akun terikat ke satu role. Akun kecamatan terikat ke satu kecamatan, akun lembaga ke satu lembaga.
Ganti password; admin dapat mereset password akun.
6.2 Master Data
Kecamatan: 19 kecamatan di Kabupaten Boyolali.
Lembaga: nama, NPSN (jika ada), jenjang (TK / PAUD / Posyandu), kecamatan, desa, alamat, status (negeri/swasta), kontak.
Admin dapat menambah, mengedit, dan menonaktifkan lembaga.
6.3 Unggah Data Siswa (fitur inti)
Template Excel/CSV standar yang bisa diunduh.
Kolom template: NISN, Nama, Tanggal Lahir, Alamat, Nama Ayah, Nama Ibu.
Jenjang tidak ada di file; otomatis mengikuti jenjang lembaga.
Kolom wajib: Nama, Tanggal Lahir, Alamat, Nama Ayah, Nama Ibu. NISN boleh kosong karena banyak anak PAUD dan balita Posyandu belum memilikinya.
Alur: unggah → pratinjau → validasi → laporan error per baris → konfirmasi → simpan.
Aturan pembaruan otomatis:
NISN terisi: NISN menjadi kunci. Jika sudah ada maka diperbarui, jika belum maka ditambahkan.
NISN kosong: pencocokan memakai nama + tanggal lahir + lembaga.
Validasi:
NISN 10 digit jika diisi.
Format tanggal lahir konsisten (DD-MM-YYYY) dan tidak boleh di masa depan.
Kolom wajib tidak kosong.
Duplikat dalam satu file.
Peringatan jika NISN sudah terdaftar di lembaga lain.
Baris valid tetap bisa disimpan walau ada baris error (pengguna memilih), dengan file laporan error yang bisa diunduh.
Riwayat unggahan: tanggal, pengunggah, nama file, jumlah baris berhasil dan gagal.
Mode unggah: "perbarui saja" atau "ganti semua data lembaga" (dengan konfirmasi ganda).
6.4 Data Siswa
Field: NISN (opsional), nama, tanggal lahir, alamat, nama ayah, nama ibu, lembaga (otomatis).
Pencarian (nama/NISN), filter (lembaga, jenjang), dan paginasi.
Tambah, edit, dan hapus manual sesuai hak akses.
6.5 Dashboard dan Laporan
Admin: total lembaga, total siswa, rekap per jenjang dan per kecamatan, status unggah lembaga (sudah/belum, tanggal update terakhir).
Kecamatan: rekap lembaga dan siswa di wilayahnya.
Laporan: per kecamatan, per lembaga, dan per jenjang.
Format laporan: tanpa kop dinas, hanya data.
Kolom: NISN, Nama, Tanggal Lahir, Alamat, Nama Ayah, Nama Ibu, Lembaga, Jenjang, Kecamatan.
Bagian atas memuat judul laporan, filter yang dipakai, dan tanggal cetak.
Ekspor: Excel dan tampilan cetak/PDF yang sederhana.
6.6 Log Aktivitas (admin)

Mencatat login, unggah, ubah, hapus data, serta pembuatan dan reset akun, lengkap dengan siapa dan kapan.

7. Model Data (Supabase / PostgreSQL)
Tabel	Kolom utama
kecamatan	id, nama
lembaga	id, nama, npsn, jenjang (TK/PAUD/Posyandu), kecamatan_id, desa, alamat, status, kontak, aktif
profiles	id (→ auth.users), nama, role (admin/kecamatan/lembaga), kecamatan_id, lembaga_id
siswa	id, nisn (nullable, unik jika terisi), nama, tanggal_lahir, alamat, nama_ayah, nama_ibu, lembaga_id, created_at, updated_at
upload_log	id, lembaga_id, user_id, nama_file, baris_berhasil, baris_gagal, created_at
activity_log	id, user_id, aksi, detail, created_at

Row Level Security (RLS) wajib aktif:

Admin: akses penuh ke semua tabel.
Kecamatan: hanya baca data lembaga dan siswa dengan kecamatan_id miliknya.
Lembaga: baca dan tulis hanya data dengan lembaga_id miliknya.
Jangan hanya mengandalkan pembatasan di tampilan; aturan harus ada di database.
8. Kebutuhan Non-Fungsional
Keamanan dan privasi: ini data anak, jadi pakai RLS, HTTPS, password ter-hash (bawaan Supabase), dan akses minimal sesuai peran. Perhatikan UU Pelindungan Data Pribadi.
Performa: daftar siswa memakai paginasi; unggah ribuan baris diproses di sisi server.
Responsif: nyaman dibuka di HP, karena petugas lembaga sering memakai ponsel.
Ketersediaan: deploy di Vercel, database di Supabase, dengan backup berkala.
Kemudahan: antarmuka sederhana berbahasa Indonesia untuk pengguna non-teknis.
9. Rekomendasi Teknis
Frontend dan backend: Next.js (App Router) + Tailwind + shadcn/ui.
Database dan auth: Supabase (Postgres + Auth + RLS).
Parsing Excel: SheetJS (xlsx); PDF/cetak: react-pdf atau CSS print.
Deploy: Vercel, dengan kunci Supabase di environment variable (kunci service_role hanya dipakai di server, jangan sampai terbuka di sisi klien).
Lingkungan pengembangan: Antigravity IDE.
10. Rencana Rilis
Fase 1: setup proyek, auth, role, master data.
Fase 2: unggah data siswa, validasi, dan riwayat.
Fase 3: tampilan berjenjang (kecamatan → lembaga → siswa) dan RLS.
Fase 4: dashboard, ekspor, dan cetak.
Fase 5: uji coba dengan beberapa lembaga, perbaikan, lalu rilis.