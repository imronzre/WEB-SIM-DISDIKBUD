-- ==============================================================================
-- DATA AWAL (SEED): 22 KECAMATAN DAN CONTOH LEMBAGA KABUPATEN BOYOLALI
-- ==============================================================================

-- 1. Masukkan Daftar Kecamatan di Kabupaten Boyolali
INSERT INTO public.kecamatan (nama) VALUES
('Ampel'),
('Andong'),
('Banyudono'),
('Boyolali'),
('Cepogo'),
('Gladagsari'),
('Juwangi'),
('Karanggede'),
('Kemusu'),
('Klego'),
('Mojosongo'),
('Musuk'),
('Ngemplak'),
('Nogosari'),
('Sambi'),
('Sawit'),
('Selo'),
('Simo'),
('Tamansari'),
('Teras'),
('Wonosamodro'),
('Wonosegoro')
ON CONFLICT (nama) DO NOTHING;

-- 2. Contoh Lembaga Awal untuk Uji Coba
DO $$
DECLARE
    kec_boyolali UUID;
    kec_mojosongo UUID;
    kec_banyudono UUID;
    kec_ngemplak UUID;
BEGIN
    SELECT id INTO kec_boyolali FROM public.kecamatan WHERE nama = 'Boyolali' LIMIT 1;
    SELECT id INTO kec_mojosongo FROM public.kecamatan WHERE nama = 'Mojosongo' LIMIT 1;
    SELECT id INTO kec_banyudono FROM public.kecamatan WHERE nama = 'Banyudono' LIMIT 1;
    SELECT id INTO kec_ngemplak FROM public.kecamatan WHERE nama = 'Ngemplak' LIMIT 1;

    -- TK Negeri Pembina Boyolali
    INSERT INTO public.lembaga (nama, npsn, jenjang, kecamatan_id, desa, alamat, status, kontak, aktif)
    VALUES ('TK Negeri Pembina Boyolali', '20338901', 'TK', kec_boyolali, 'Siswodipuran', 'Jl. Pandanaran No. 45', 'Negeri', '0276-321456', true)
    ON CONFLICT DO NOTHING;

    -- PAUD Kasih Ibu Mojosongo
    INSERT INTO public.lembaga (nama, npsn, jenjang, kecamatan_id, desa, alamat, status, kontak, aktif)
    VALUES ('PAUD Permata Hati', '69921002', 'PAUD', kec_mojosongo, 'Kemiri', 'Dusun Kemiri RT 02/03', 'Swasta', '081234567890', true)
    ON CONFLICT DO NOTHING;

    -- Posyandu Melati 1 Banyudono
    INSERT INTO public.lembaga (nama, npsn, jenjang, kecamatan_id, desa, alamat, status, kontak, aktif)
    VALUES ('Posyandu Melati I Banyudono', NULL, 'Posyandu', kec_banyudono, 'Dukuh', 'Balai Desa Dukuh RT 01/01', 'Swasta', '085712348899', true)
    ON CONFLICT DO NOTHING;

    -- TK Aisyiyah Bustanul Athfal Ngemplak
    INSERT INTO public.lembaga (nama, npsn, jenjang, kecamatan_id, desa, alamat, status, kontak, aktif)
    VALUES ('TK Aisyiyah BA Ngemplak', '20339012', 'TK', kec_ngemplak, 'Gagaksipat', 'Jl. Bandara Adi Soemarmo No. 12', 'Swasta', '0271-789012', true)
    ON CONFLICT DO NOTHING;
END $$;
