-- ==============================================================================
-- SKEMA DATABASE SUPABASE: SISTEM INFORMASI PAUDNI KABUPATEN BOYOLALI
-- Dinas Pendidikan dan Kebudayaan Kabupaten Boyolali
-- Proyek: SIM_Disdikbud (RLS Dinonaktifkan sementara, validasi via API Routes)
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. TABEL KECAMATAN
CREATE TABLE IF NOT EXISTS public.kecamatan (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nama VARCHAR(100) NOT NULL UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. TABEL LEMBAGA
CREATE TABLE IF NOT EXISTS public.lembaga (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nama VARCHAR(255) NOT NULL,
    npsn VARCHAR(50),
    jenjang VARCHAR(20) NOT NULL CHECK (jenjang IN ('TK', 'PAUD', 'Posyandu')),
    kecamatan_id UUID NOT NULL REFERENCES public.kecamatan(id) ON DELETE RESTRICT,
    desa VARCHAR(100) NOT NULL DEFAULT '-',
    alamat TEXT NOT NULL DEFAULT '-',
    status VARCHAR(20) NOT NULL DEFAULT 'Swasta' CHECK (status IN ('Negeri', 'Swasta')),
    kontak VARCHAR(100),
    aktif BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. TABEL PROFILES
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE,
    nama VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'kecamatan', 'lembaga')),
    kecamatan_id UUID REFERENCES public.kecamatan(id) ON DELETE SET NULL,
    lembaga_id UUID REFERENCES public.lembaga(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. TABEL SISWA
CREATE TABLE IF NOT EXISTS public.siswa (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nisn VARCHAR(20),
    nama VARCHAR(255) NOT NULL,
    tanggal_lahir DATE NOT NULL,
    alamat TEXT NOT NULL,
    nama_ayah VARCHAR(255) NOT NULL,
    nama_ibu VARCHAR(255) NOT NULL,
    lembaga_id UUID NOT NULL REFERENCES public.lembaga(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexing untuk pencarian cepat
CREATE INDEX IF NOT EXISTS idx_siswa_lembaga ON public.siswa(lembaga_id);
CREATE INDEX IF NOT EXISTS idx_siswa_nisn ON public.siswa(nisn);
CREATE INDEX IF NOT EXISTS idx_siswa_nama ON public.siswa(nama);
CREATE INDEX IF NOT EXISTS idx_lembaga_kecamatan ON public.lembaga(kecamatan_id);

-- 6. TABEL UPLOAD_LOG
CREATE TABLE IF NOT EXISTS public.upload_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lembaga_id UUID NOT NULL REFERENCES public.lembaga(id) ON DELETE CASCADE,
    user_id UUID,
    user_nama VARCHAR(255),
    nama_file VARCHAR(255) NOT NULL,
    mode VARCHAR(50) NOT NULL DEFAULT 'perbarui', -- 'perbarui' atau 'ganti_semua'
    baris_berhasil INTEGER NOT NULL DEFAULT 0,
    baris_gagal INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. TABEL ACTIVITY_LOG
CREATE TABLE IF NOT EXISTS public.activity_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID,
    user_nama VARCHAR(255),
    user_role VARCHAR(50),
    aksi VARCHAR(100) NOT NULL,
    detail TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- NONAKTIFKAN RLS (Sesuai Permintaan User: Proteksi dan Akses via API Routes)
-- ==============================================================================
ALTER TABLE public.kecamatan DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.lembaga DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.siswa DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.upload_log DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_log DISABLE ROW LEVEL SECURITY;
