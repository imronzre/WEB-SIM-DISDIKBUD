# SIM-PAUDNI KABUPATEN BOYOLALI

**Sistem Informasi Pengelolaan Data Lembaga dan Peserta Didik PAUD, TK, dan Posyandu**  
*Dinas Pendidikan dan Kebudayaan Kabupaten Boyolali - Bidang PAUDNI*

Aplikasi berbasis web modern untuk mengumpulkan, mengelola, memvalidasi, dan melaporkan data peserta didik serta lembaga PAUD, TK, dan Posyandu se-Kabupaten Boyolali secara massal dan terintegrasi.

---

## 🚀 Fitur Utama Sesuai PRD

1. **Autentikasi Multi-Peran (Supabase Auth & RLS)**:
   - **Admin Dinas**: Akses penuh, kelola master data 22 kecamatan Boyolali & lembaga, kelola akun pengguna, reset password, audit log, dan unggah data untuk lembaga mana pun.
   - **Kecamatan (Korwil)**: Hak akses khusus baca dan cetak rekapitulasi data wilayahnya (tidak dapat mengubah/menghapus data).
   - **Lembaga (TK/PAUD/Posyandu)**: Kelola data siswa mandiri, unggah massal Excel, unduh template, dan cetak laporan sekolah.
2. **Unggah Data Siswa Massal (Excel / CSV)**:
   - Unduh template standar berisikan kolom: `NISN`, `Nama`, `Tanggal Lahir (DD-MM-YYYY)`, `Alamat`, `Nama Ayah`, `Nama Ibu`.
   - Validasi otomatis: NISN 10 digit (boleh kosong untuk PAUD/Posyandu), cek duplikasi dalam file, format tanggal, dan field wajib.
   - Pratinjau interaktif, opsi **Simpan Hanya Baris Valid**, dan tombol **Unduh Laporan Error (.xlsx)**.
   - Pilihan mode: **Perbarui Saja (Upsert)** atau **Ganti Semua Data Lembaga** (dengan proteksi konfirmasi).
3. **Data Peserta Didik & Master Data Berjenjang**:
   - Navigasi berjenjang: *Kecamatan → Lembaga → Siswa*.
   - Filter lengkap: Jenjang (TK/PAUD/Posyandu), Kecamatan, Lembaga, serta pencarian instan nama/NISN.
4. **Laporan & Ekspor Standar Dinas**:
   - Format laporan data tabular bersih tanpa kop dinas.
   - Ekspor Excel (.xlsx) dan Cetak Langsung / Simpan PDF dengan CSS cetak yang rapi.
5. **Log Aktivitas & Audit Trail**:
   - Pencatatan seluruh riwayat login, tambah, ubah, hapus data siswa/lembaga, dan reset password.

---

## 🛠️ Tech Stack

- **Framework**: Next.js 14/15 (App Router, React 18, TypeScript)
- **Styling**: Tailwind CSS & Lucide React
- **Database & Auth**: Supabase PostgreSQL dengan Row Level Security (RLS)
- **Excel Engine**: SheetJS (`xlsx`)
- **Deployment**: Vercel-ready

---

## 📦 Panduan Menjalankan Proyek

### 1. Menyiapkan Database Supabase
1. Buat proyek baru di [Supabase Dashboard](https://supabase.com).
2. Buka menu **SQL Editor**, salin dan jalankan seluruh isi berkas:
   - `supabase/schema.sql` (Tabel, relasi, fungsi pembantu, dan kebijakan RLS)
   - `supabase/seed.sql` (Data awal 22 kecamatan Kabupaten Boyolali dan lembaga contoh)
3. Salin URL dan API Keys dari **Project Settings -> API**.

### 2. Konfigurasi Environment Variables
Buat berkas `.env.local` di root proyek dan isi nilai berikut:
```env
NEXT_PUBLIC_SUPABASE_URL=https://<your-project-id>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6...
```
*(Catatan: Aplikasi memiliki mode demo lokal bawaan, sehingga tetap dapat dijalankan dan diuji coba meskipun kunci Supabase belum diisi).*

### 3. Menjalankan Aplikasi
```bash
npm install
npm run dev
```
Buka browser di `http://localhost:3000`.

---

## 🌐 Panduan Deploy ke Vercel

1. Dorong repositori ini ke GitHub / GitLab.
2. Masuk ke [Vercel](https://vercel.com) dan pilih **Add New Project**.
3. Hubungkan repositori `web_disdikbud_data_siswa`.
4. Di bagian **Environment Variables**, tambahkan:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
5. Klik **Deploy**. Selesai!
