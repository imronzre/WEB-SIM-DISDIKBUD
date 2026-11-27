'use client';

import {
  Kecamatan,
  Lembaga,
  Siswa,
  UploadLog,
  ActivityLog,
  UserProfile,
  ParsedExcelRow,
  normalizeRole,
} from './types';
import { isSupabaseConfigured, createClient } from './supabase/client';

// 22 Kecamatan Resmi di Kabupaten Boyolali
export const INITIAL_KECAMATAN: Kecamatan[] = [
  { id: 'kec-ampel', nama: 'Ampel' },
  { id: 'kec-andong', nama: 'Andong' },
  { id: 'kec-banyudono', nama: 'Banyudono' },
  { id: 'kec-boyolali', nama: 'Boyolali' },
  { id: 'kec-cepogo', nama: 'Cepogo' },
  { id: 'kec-gladagsari', nama: 'Gladagsari' },
  { id: 'kec-juwangi', nama: 'Juwangi' },
  { id: 'kec-karanggede', nama: 'Karanggede' },
  { id: 'kec-kemusu', nama: 'Kemusu' },
  { id: 'kec-klego', nama: 'Klego' },
  { id: 'kec-mojosongo', nama: 'Mojosongo' },
  { id: 'kec-musuk', nama: 'Musuk' },
  { id: 'kec-ngemplak', nama: 'Ngemplak' },
  { id: 'kec-nogosari', nama: 'Nogosari' },
  { id: 'kec-sambi', nama: 'Sambi' },
  { id: 'kec-sawit', nama: 'Sawit' },
  { id: 'kec-selo', nama: 'Selo' },
  { id: 'kec-simo', nama: 'Simo' },
  { id: 'kec-tamansari', nama: 'Tamansari' },
  { id: 'kec-teras', nama: 'Teras' },
  { id: 'kec-wonosamodro', nama: 'Wonosamodro' },
  { id: 'kec-wonosegoro', nama: 'Wonosegoro' },
];

export const INITIAL_LEMBAGA: Lembaga[] = [
  {
    id: 'lem-1',
    nama: 'TK Negeri Pembina Boyolali',
    npsn: '20338901',
    jenjang: 'TK',
    kecamatan_id: 'kec-boyolali',
    kecamatan_nama: 'Boyolali',
    desa: 'Siswodipuran',
    alamat: 'Jl. Pandanaran No. 45',
    status: 'Negeri',
    kontak: '0276-321456',
    aktif: true,
    total_siswa: 4,
    last_upload: '2026-11-20T08:30:00Z',
  },
  {
    id: 'lem-2',
    nama: 'KB Permata Hati Mojosongo',
    npsn: '69921002',
    jenjang: 'KB',
    kecamatan_id: 'kec-mojosongo',
    kecamatan_nama: 'Mojosongo',
    desa: 'Kemiri',
    alamat: 'Dusun Kemiri RT 02/03',
    status: 'Swasta',
    kontak: '081234567890',
    aktif: true,
    total_siswa: 2,
    last_upload: '2026-11-21T09:15:00Z',
  },
  {
    id: 'lem-3',
    nama: 'SPS Melati I Banyudono',
    npsn: null,
    jenjang: 'SPS',
    kecamatan_id: 'kec-banyudono',
    kecamatan_nama: 'Banyudono',
    desa: 'Dukuh',
    alamat: 'Balai Desa Dukuh RT 01/01',
    status: 'Swasta',
    kontak: '085712348899',
    aktif: true,
    total_siswa: 1,
    last_upload: null,
  },
  {
    id: 'lem-4',
    nama: 'TPA Ceria Ngemplak',
    npsn: '20339012',
    jenjang: 'TPA',
    kecamatan_id: 'kec-ngemplak',
    kecamatan_nama: 'Ngemplak',
    desa: 'Gagaksipat',
    alamat: 'Jl. Bandara Adi Soemarmo No. 12',
    status: 'Swasta',
    kontak: '0271-789012',
    aktif: true,
    total_siswa: 0,
    last_upload: '2026-11-19T10:00:00Z',
  },
];

export const INITIAL_SISWA: Siswa[] = [
  {
    id: 'sis-1',
    nisn: '3180012345',
    nama: 'Ahmad Fauzi',
    tanggal_lahir: '2019-05-15',
    alamat: 'Dusun Kemiri RT 01/02',
    nama_ayah: 'Bambang Sugianto',
    nama_ibu: 'Siti Aminah',
    lembaga_id: 'lem-1',
    lembaga_nama: 'TK Negeri Pembina Boyolali',
    jenjang: 'TK',
    kecamatan_id: 'kec-boyolali',
    kecamatan_nama: 'Boyolali',
    created_at: '2026-11-20T08:30:00Z',
    updated_at: '2026-11-20T08:30:00Z',
  },
  {
    id: 'sis-2',
    nisn: '3180054321',
    nama: 'Siti Rahmawati',
    tanggal_lahir: '2019-08-20',
    alamat: 'Jl. Pandanaran No. 12, RT 02/01',
    nama_ayah: 'Mulyono',
    nama_ibu: 'Sri Wahyuni',
    lembaga_id: 'lem-1',
    lembaga_nama: 'TK Negeri Pembina Boyolali',
    jenjang: 'TK',
    kecamatan_id: 'kec-boyolali',
    kecamatan_nama: 'Boyolali',
    created_at: '2026-11-20T08:30:00Z',
    updated_at: '2026-11-20T08:30:00Z',
  },
  {
    id: 'sis-3',
    nisn: null,
    nama: 'Rizky Pratama',
    tanggal_lahir: '2019-12-05',
    alamat: 'Dusun Karanggeneng RT 04/02',
    nama_ayah: 'Hendra Setiawan',
    nama_ibu: 'Dewi Lestari',
    lembaga_id: 'lem-1',
    lembaga_nama: 'TK Negeri Pembina Boyolali',
    jenjang: 'TK',
    kecamatan_id: 'kec-boyolali',
    kecamatan_nama: 'Boyolali',
    created_at: '2026-11-20T08:30:00Z',
    updated_at: '2026-11-20T08:30:00Z',
  },
  {
    id: 'sis-4',
    nisn: '3190033445',
    nama: 'Bagas Aditya',
    tanggal_lahir: '2020-03-10',
    alamat: 'Jl. Merbabu No. 8',
    nama_ayah: 'Eko Purnomo',
    nama_ibu: 'Wulan Dari',
    lembaga_id: 'lem-1',
    lembaga_nama: 'TK Negeri Pembina Boyolali',
    jenjang: 'TK',
    kecamatan_id: 'kec-boyolali',
    kecamatan_nama: 'Boyolali',
    created_at: '2026-11-20T08:30:00Z',
    updated_at: '2026-11-20T08:30:00Z',
  },
  {
    id: 'sis-5',
    nisn: null,
    nama: 'Nurfadilah Putri',
    tanggal_lahir: '2020-11-20',
    alamat: 'Dusun Mulyorejo RT 03/01',
    nama_ayah: 'Agus Wahyudi',
    nama_ibu: 'Tri Handayani',
    lembaga_id: 'lem-2',
    lembaga_nama: 'KB Permata Hati Mojosongo',
    jenjang: 'KB',
    kecamatan_id: 'kec-mojosongo',
    kecamatan_nama: 'Mojosongo',
    created_at: '2026-11-21T09:15:00Z',
    updated_at: '2026-11-21T09:15:00Z',
  },
  {
    id: 'sis-6',
    nisn: null,
    nama: 'Alif Fajar Ramadhan',
    tanggal_lahir: '2021-04-14',
    alamat: 'Dusun Kemiri RT 01/01',
    nama_ayah: 'Dwi Prasetyo',
    nama_ibu: 'Kartika Sari',
    lembaga_id: 'lem-2',
    lembaga_nama: 'KB Permata Hati Mojosongo',
    jenjang: 'KB',
    kecamatan_id: 'kec-mojosongo',
    kecamatan_nama: 'Mojosongo',
    created_at: '2026-11-21T09:15:00Z',
    updated_at: '2026-11-21T09:15:00Z',
  },
  {
    id: 'sis-7',
    nisn: null,
    nama: 'Muhammad Bilal',
    tanggal_lahir: '2022-06-25',
    alamat: 'Dusun Dukuh RT 01/01',
    nama_ayah: 'Suryanto',
    nama_ibu: 'Marwah',
    lembaga_id: 'lem-3',
    lembaga_nama: 'SPS Melati I Banyudono',
    jenjang: 'SPS',
    kecamatan_id: 'kec-banyudono',
    kecamatan_nama: 'Banyudono',
    created_at: '2026-11-18T11:00:00Z',
    updated_at: '2026-11-18T11:00:00Z',
  },
];

export const DEMO_PROFILES: Record<string, UserProfile> = {
  admin: {
    id: 'usr-admin',
    email: 'admin@boyolali.go.id',
    nama: 'Admin Dinas PAUDNI',
    role: 'admin_dinas',
    kecamatan_id: null,
    kecamatan_nama: null,
    lembaga_id: null,
    lembaga_nama: null,
  },
  kecamatan: {
    id: 'usr-kec-boyolali',
    email: 'kec.boyolali@boyolali.go.id',
    nama: 'Petugas Korwil Kec. Boyolali',
    role: 'admin_kecamatan',
    kecamatan_id: 'kec-boyolali',
    kecamatan_nama: 'Boyolali',
    lembaga_id: null,
    lembaga_nama: null,
  },
  lembaga: {
    id: 'usr-lem-1',
    email: 'tk.pembina@boyolali.go.id',
    nama: 'Operator TK Negeri Pembina',
    role: 'operator_sekolah',
    kecamatan_id: 'kec-boyolali',
    kecamatan_nama: 'Boyolali',
    lembaga_id: 'lem-1',
    lembaga_nama: 'TK Negeri Pembina Boyolali',
  },
};

function loadFromStorage<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const item = localStorage.getItem(`boyolali_${key}`);
    return item ? JSON.parse(item) : fallback;
  } catch {
    return fallback;
  }
}

function saveToStorage<T>(key: string, data: T): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(`boyolali_${key}`, JSON.stringify(data));
  } catch (e) {
    console.error('Storage error', e);
  }
}

function inferJenjangFromName(nama: string): 'TK' | 'KB' | 'SPS' | 'TPA' {
  const upper = nama.toUpperCase();
  if (upper.includes('KB ') || upper.startsWith('KB') || upper.includes('KELOMPOK BERMAIN')) {
    return 'KB';
  }
  if (upper.includes('SPS') || upper.includes('POSYANDU')) {
    return 'SPS';
  }
  if (upper.includes('TPA') || upper.includes('PENITIPAN')) {
    return 'TPA';
  }
  return 'TK';
}

export class AppDataStore {
  static getCurrentUser(): UserProfile {
    return loadFromStorage<UserProfile>('current_user', DEMO_PROFILES.admin);
  }

  static setCurrentUser(user: UserProfile): void {
    saveToStorage('current_user', user);
    this.addActivityLog('LOGIN', `User ${user.nama} (${user.role}) masuk ke aplikasi`, user);
  }

  static getKecamatan(): Kecamatan[] {
    return loadFromStorage<Kecamatan[]>('kecamatan', INITIAL_KECAMATAN);
  }

  static getLembagaList(filter?: {
    kecamatan_id?: string;
    jenjang?: string;
    q?: string;
  }): Lembaga[] {
    const all = loadFromStorage<Lembaga[]>('lembaga', INITIAL_LEMBAGA);
    const siswaList = this.getSiswaList();

    const enriched = all.map((lem) => {
      const count = siswaList.filter(
        (s) => String(s.lembaga_id) === String(lem.id)
      ).length;
      return { ...lem, total_siswa: count };
    });

    return enriched.filter((l) => {
      if (filter?.kecamatan_id && String(l.kecamatan_id) !== String(filter.kecamatan_id)) {
        return false;
      }
      if (filter?.jenjang && l.jenjang !== filter.jenjang) return false;
      if (filter?.q) {
        const query = filter.q.toLowerCase();
        return (
          l.nama.toLowerCase().includes(query) ||
          (l.npsn && l.npsn.includes(query)) ||
          l.desa.toLowerCase().includes(query)
        );
      }
      return true;
    });
  }

  static getLembagaById(id: string): Lembaga | undefined {
    return this.getLembagaList().find((l) => String(l.id) === String(id));
  }

  static addLembaga(data: {
    id?: string;
    nama: string;
    kecamatan_id?: string | null;
    kecamatan_nama?: string | null;
    jenjang?: 'TK' | 'KB' | 'SPS' | 'TPA';
    desa?: string;
    alamat?: string;
  }): Lembaga {
    const rawList = loadFromStorage<Lembaga[]>('lembaga', INITIAL_LEMBAGA);
    const kecList = this.getKecamatan();

    const matchedById = data.id
      ? rawList.find((l) => String(l.id) === String(data.id))
      : undefined;
    if (matchedById) return matchedById;

    const matchedByName = rawList.find(
      (l) => l.nama.trim().toLowerCase() === data.nama.trim().toLowerCase()
    );
    if (matchedByName) return matchedByName;

    const kecObj = kecList.find(
      (k) =>
        (data.kecamatan_id && String(k.id) === String(data.kecamatan_id)) ||
        (data.kecamatan_nama &&
          k.nama.toLowerCase() === data.kecamatan_nama.trim().toLowerCase())
    );

    const newLembaga: Lembaga = {
      id: data.id || `lem-${Date.now()}`,
      nama: data.nama.trim(),
      npsn: null,
      jenjang: data.jenjang || inferJenjangFromName(data.nama),
      kecamatan_id: kecObj?.id || data.kecamatan_id || 'kec-boyolali',
      kecamatan_nama: kecObj?.nama || data.kecamatan_nama || 'Boyolali',
      desa: data.desa || '-',
      alamat: data.alamat || '-',
      status: 'Swasta',
      kontak: null,
      aktif: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      total_siswa: 0,
      last_upload: null,
    };

    rawList.unshift(newLembaga);
    saveToStorage('lembaga', rawList);
    return newLembaga;
  }

  static saveLembaga(data: Partial<Lembaga>, user: UserProfile): Lembaga {
    const list = loadFromStorage<Lembaga[]>('lembaga', INITIAL_LEMBAGA);
    const kecList = this.getKecamatan();
    const kec = kecList.find((k) => String(k.id) === String(data.kecamatan_id));

    if (isSupabaseConfigured()) {
      try {
        const supabase = createClient();
        if (data.id && !data.id.startsWith('lem-')) {
          supabase
            .from('lembaga')
            .update({
              nama: data.nama,
              npsn: data.npsn,
              jenjang: data.jenjang,
              kecamatan_id: data.kecamatan_id,
              desa: data.desa,
              alamat: data.alamat,
              status: data.status,
              kontak: data.kontak,
              aktif: data.aktif,
            })
            .eq('id', data.id);
        } else {
          supabase.from('lembaga').insert({
            nama: data.nama,
            npsn: data.npsn,
            jenjang: data.jenjang,
            kecamatan_id: data.kecamatan_id,
            desa: data.desa,
            alamat: data.alamat,
            status: data.status || 'Swasta',
            kontak: data.kontak,
            aktif: true,
          });
        }
      } catch (e) {
        console.warn('Supabase sync warning:', e);
      }
    }

    if (data.id) {
      const index = list.findIndex((l) => String(l.id) === String(data.id));
      if (index !== -1) {
        list[index] = {
          ...list[index],
          ...data,
          kecamatan_nama: kec ? kec.nama : list[index].kecamatan_nama,
          updated_at: new Date().toISOString(),
        };
        saveToStorage('lembaga', list);
        this.addActivityLog(
          'UBAH_LEMBAGA',
          `Memperbarui data lembaga: ${list[index].nama}`,
          user
        );
        return list[index];
      }
    }

    const newLembaga: Lembaga = {
      id: `lem-${Date.now()}`,
      nama: data.nama || 'Lembaga Baru',
      npsn: data.npsn || null,
      jenjang: data.jenjang || 'TK',
      kecamatan_id: data.kecamatan_id || 'kec-boyolali',
      kecamatan_nama: kec?.nama || 'Boyolali',
      desa: data.desa || '',
      alamat: data.alamat || '',
      status: data.status || 'Swasta',
      kontak: data.kontak || null,
      aktif: data.aktif !== undefined ? data.aktif : true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      total_siswa: 0,
      last_upload: null,
    };
    list.unshift(newLembaga);
    saveToStorage('lembaga', list);
    this.addActivityLog(
      'TAMBAH_LEMBAGA',
      `Menambahkan lembaga baru: ${newLembaga.nama}`,
      user
    );
    return newLembaga;
  }

  static getSiswaList(filter?: {
    kecamatan_id?: string;
    lembaga_id?: string;
    jenjang?: string;
    q?: string;
  }): Siswa[] {
    let list = loadFromStorage<Siswa[]>('siswa', INITIAL_SISWA);

    if (filter?.kecamatan_id) {
      list = list.filter((s) => String(s.kecamatan_id) === String(filter.kecamatan_id));
    }
    if (filter?.lembaga_id) {
      list = list.filter((s) => String(s.lembaga_id) === String(filter.lembaga_id));
    }
    if (filter?.jenjang) {
      list = list.filter((s) => s.jenjang === filter.jenjang);
    }
    if (filter?.q) {
      const q = filter.q.toLowerCase().trim();
      list = list.filter(
        (s) =>
          s.nama.toLowerCase().includes(q) ||
          (s.nisn && s.nisn.includes(q)) ||
          s.alamat.toLowerCase().includes(q) ||
          s.nama_ayah.toLowerCase().includes(q) ||
          s.nama_ibu.toLowerCase().includes(q)
      );
    }

    return list;
  }

  static saveSiswa(data: Partial<Siswa>, user: UserProfile): Siswa {
    const list = loadFromStorage<Siswa[]>('siswa', INITIAL_SISWA);
    let lem = data.lembaga_id ? this.getLembagaById(String(data.lembaga_id)) : undefined;

    if (!lem && normalizeRole(user.role) === 'operator_sekolah' && user.lembaga_nama) {
      lem = this.addLembaga({
        id: data.lembaga_id || user.lembaga_id || undefined,
        nama: user.lembaga_nama,
        kecamatan_id: user.kecamatan_id,
        kecamatan_nama: user.kecamatan_nama,
      });
    }

    if (isSupabaseConfigured() && data.lembaga_id) {
      try {
        const supabase = createClient();
        if (data.id && !data.id.startsWith('sis-')) {
          supabase
            .from('siswa')
            .update({
              nisn: data.nisn,
              nama: data.nama,
              tanggal_lahir: data.tanggal_lahir,
              alamat: data.alamat,
              nama_ayah: data.nama_ayah,
              nama_ibu: data.nama_ibu,
              lembaga_id: data.lembaga_id,
            })
            .eq('id', data.id);
        } else {
          supabase.from('siswa').insert({
            nisn: data.nisn,
            nama: data.nama,
            tanggal_lahir: data.tanggal_lahir,
            alamat: data.alamat,
            nama_ayah: data.nama_ayah,
            nama_ibu: data.nama_ibu,
            lembaga_id: data.lembaga_id,
          });
        }
      } catch (e) {
        console.warn('Supabase sync warning:', e);
      }
    }

    if (data.id) {
      const idx = list.findIndex((s) => String(s.id) === String(data.id));
      if (idx !== -1) {
        list[idx] = {
          ...list[idx],
          ...data,
          updated_at: new Date().toISOString(),
        };
        saveToStorage('siswa', list);
        this.addActivityLog(
          'UBAH_SISWA',
          `Memperbarui data peserta didik: ${list[idx].nama}`,
          user
        );
        return list[idx];
      }
    }

    const newSiswa: Siswa = {
      id: `sis-${Date.now()}`,
      nisn: data.nisn || null,
      nama: data.nama || '',
      tanggal_lahir: data.tanggal_lahir || '',
      alamat: data.alamat || '',
      nama_ayah: data.nama_ayah || '',
      nama_ibu: data.nama_ibu || '',
      lembaga_id: lem?.id || data.lembaga_id || '',
      lembaga_nama: lem?.nama || data.lembaga_nama || '',
      jenjang: lem?.jenjang || data.jenjang || 'TK',
      kecamatan_id: lem?.kecamatan_id || user.kecamatan_id || data.kecamatan_id || '',
      kecamatan_nama: lem?.kecamatan_nama || user.kecamatan_nama || data.kecamatan_nama || '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    list.unshift(newSiswa);
    saveToStorage('siswa', list);
    this.addActivityLog(
      'TAMBAH_SISWA',
      `Menambahkan manual peserta didik: ${newSiswa.nama}`,
      user
    );
    return newSiswa;
  }

  static deleteSiswa(id: string, user: UserProfile): boolean {
    const list = loadFromStorage<Siswa[]>('siswa', INITIAL_SISWA);
    const item = list.find((s) => String(s.id) === String(id));
    if (!item) return false;

    if (isSupabaseConfigured() && !id.startsWith('sis-')) {
      try {
        const supabase = createClient();
        supabase.from('siswa').delete().eq('id', id);
      } catch (e) {
        console.warn('Supabase delete sync warning:', e);
      }
    }

    const remaining = list.filter((s) => String(s.id) !== String(id));
    saveToStorage('siswa', remaining);
    this.addActivityLog(
      'HAPUS_SISWA',
      `Menghapus peserta didik: ${item.nama} (${item.lembaga_nama})`,
      user
    );
    return true;
  }

  static bulkUpsertSiswa(
    validRows: ParsedExcelRow[],
    invalidCount: number,
    lembagaId: string,
    mode: 'perbarui' | 'ganti_semua',
    fileName: string,
    user: UserProfile
  ): { successCount: number; updatedCount: number; insertedCount: number } {
    let list = loadFromStorage<Siswa[]>('siswa', INITIAL_SISWA);
    let lem = this.getLembagaById(lembagaId);

    // Jika akun operator sekolah baru dan lembaganya belum tercatat di store, buat otomatis sesuai kecamatan akun
    if (!lem && user.lembaga_nama) {
      lem = this.addLembaga({
        id: lembagaId || user.lembaga_id || undefined,
        nama: user.lembaga_nama,
        kecamatan_id: user.kecamatan_id,
        kecamatan_nama: user.kecamatan_nama,
      });
    }

    if (!lem) throw new Error('Lembaga tidak ditemukan');

    const effectiveLembagaId = String(lem.id);
    const effectiveKecamatanId = String(lem.kecamatan_id || user.kecamatan_id || '');
    const effectiveKecamatanNama = lem.kecamatan_nama || user.kecamatan_nama || '';

    let insertedCount = 0;
    let updatedCount = 0;

    if (mode === 'ganti_semua') {
      list = list.filter((s) => String(s.lembaga_id) !== effectiveLembagaId);
    }

    validRows.forEach((row) => {
      let existingIdx = -1;
      if (row.nisn) {
        existingIdx = list.findIndex(
          (s) => String(s.lembaga_id) === effectiveLembagaId && s.nisn === row.nisn
        );
      } else {
        existingIdx = list.findIndex(
          (s) =>
            String(s.lembaga_id) === effectiveLembagaId &&
            s.nama.toLowerCase().trim() === row.nama.toLowerCase().trim() &&
            s.tanggal_lahir === row.tanggal_lahir
        );
      }

      if (existingIdx !== -1 && mode !== 'ganti_semua') {
        list[existingIdx] = {
          ...list[existingIdx],
          nisn: row.nisn || null,
          nama: row.nama,
          tanggal_lahir: row.tanggal_lahir,
          alamat: row.alamat,
          nama_ayah: row.nama_ayah,
          nama_ibu: row.nama_ibu,
          lembaga_id: effectiveLembagaId,
          lembaga_nama: lem!.nama,
          jenjang: lem!.jenjang,
          kecamatan_id: effectiveKecamatanId,
          kecamatan_nama: effectiveKecamatanNama,
          updated_at: new Date().toISOString(),
        };
        updatedCount++;
      } else {
        list.push({
          id: `sis-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
          nisn: row.nisn || null,
          nama: row.nama,
          tanggal_lahir: row.tanggal_lahir,
          alamat: row.alamat,
          nama_ayah: row.nama_ayah,
          nama_ibu: row.nama_ibu,
          lembaga_id: effectiveLembagaId,
          lembaga_nama: lem!.nama,
          jenjang: lem!.jenjang,
          kecamatan_id: effectiveKecamatanId,
          kecamatan_nama: effectiveKecamatanNama,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
        insertedCount++;
      }
    });

    saveToStorage('siswa', list);

    const lemList = loadFromStorage<Lembaga[]>('lembaga', INITIAL_LEMBAGA);
    const targetLemIdx = lemList.findIndex((l) => String(l.id) === effectiveLembagaId);
    if (targetLemIdx !== -1) {
      lemList[targetLemIdx].last_upload = new Date().toISOString();
      saveToStorage('lembaga', lemList);
    }

    const uploadLogs = loadFromStorage<UploadLog[]>('upload_logs', []);
    const newUploadLog: UploadLog = {
      id: `up-${Date.now()}`,
      lembaga_id: effectiveLembagaId,
      lembaga_nama: lem.nama,
      user_id: user.id,
      user_nama: user.nama,
      nama_file: fileName,
      mode,
      baris_berhasil: validRows.length,
      baris_gagal: invalidCount,
      created_at: new Date().toISOString(),
    };
    uploadLogs.unshift(newUploadLog);
    saveToStorage('upload_logs', uploadLogs);

    this.addActivityLog(
      'UNGGAH_DATA',
      `Unggah file ${fileName} (${validRows.length} berhasil, ${invalidCount} gagal) untuk ${lem.nama} (${effectiveKecamatanNama}) [Mode: ${mode}]`,
      user
    );

    if (typeof window !== 'undefined') {
      fetch('/api/siswa/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          validRows,
          invalidCount,
          lembagaId: effectiveLembagaId,
          kecamatanId: effectiveKecamatanId,
          kecamatanNama: effectiveKecamatanNama,
          mode,
          fileName,
          user,
        }),
      }).catch((e) => console.warn('Background bulk API sync:', e));
    }

    return {
      successCount: validRows.length,
      insertedCount,
      updatedCount,
    };
  }

  static getUploadLogs(lembagaId?: string): UploadLog[] {
    const list = loadFromStorage<UploadLog[]>('upload_logs', []);
    if (lembagaId) {
      return list.filter((u) => String(u.lembaga_id) === String(lembagaId));
    }
    return list;
  }

  static getActivityLogs(): ActivityLog[] {
    return loadFromStorage<ActivityLog[]>('activity_logs', []);
  }

  static addActivityLog(aksi: string, detail: string, user: UserProfile): void {
    const list = loadFromStorage<ActivityLog[]>('activity_logs', []);
    const newLog: ActivityLog = {
      id: `act-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      user_id: user.id,
      user_nama: user.nama,
      user_role: user.role,
      aksi,
      detail,
      created_at: new Date().toISOString(),
    };
    list.unshift(newLog);
    saveToStorage('activity_logs', list.slice(0, 100));

    if (isSupabaseConfigured()) {
      try {
        const supabase = createClient();
        supabase.from('activity_log').insert({
          user_id: user.id && !user.id.startsWith('usr-') ? user.id : null,
          user_nama: user.nama,
          user_role: user.role,
          aksi,
          detail,
        });
      } catch (e) {
        console.warn('Activity log sync:', e);
      }
    }
  }

  static getStats(user: UserProfile) {
    const role = normalizeRole(user.role);
    let lembagaList = this.getLembagaList();
    let siswaList = this.getSiswaList();

    if (role === 'admin_kecamatan') {
      const kecId = user.kecamatan_id ? String(user.kecamatan_id) : '';
      const kecName = (user.kecamatan_nama ?? '').trim().toLowerCase();
      lembagaList = lembagaList.filter(
        (l) =>
          (kecId && String(l.kecamatan_id) === kecId) ||
          (kecName && (l.kecamatan_nama ?? '').trim().toLowerCase() === kecName)
      );
      const allowedIds = new Set(lembagaList.map((l) => String(l.id)));
      siswaList = siswaList.filter(
        (s) =>
          (kecId && String(s.kecamatan_id) === kecId) ||
          (kecName && (s.kecamatan_nama ?? '').trim().toLowerCase() === kecName) ||
          allowedIds.has(String(s.lembaga_id))
      );
    } else if (role === 'operator_sekolah') {
      const lemId = user.lembaga_id ? String(user.lembaga_id) : '';
      const email = (user.email ?? '').trim().toLowerCase();
      const lemName = (
        user.lembaga_nama ??
        (email.includes('ampel') ? 'TK Negeri Pembina Ampel' : '')
      )
        .trim()
        .toLowerCase();

      lembagaList = lembagaList.filter(
        (l) =>
          (lemId && String(l.id) === lemId) ||
          (lemName && (l.nama ?? '').trim().toLowerCase() === lemName)
      );
      const allowedIds = new Set(lembagaList.map((l) => String(l.id)));
      siswaList = siswaList.filter(
        (s) =>
          (lemId && String(s.lembaga_id) === lemId) ||
          (lemName && (s.lembaga_nama ?? '').trim().toLowerCase() === lemName) ||
          allowedIds.has(String(s.lembaga_id))
      );
    }

    const totalLembaga = lembagaList.length;
    const totalSiswa = siswaList.length;
    const siswaTK = siswaList.filter((s) => s.jenjang === 'TK').length;
    const siswaKB = siswaList.filter((s) => s.jenjang === 'KB').length;
    const siswaSPS = siswaList.filter((s) => s.jenjang === 'SPS').length;
    const siswaTPA = siswaList.filter((s) => s.jenjang === 'TPA').length;

    const lembagaSudahUnggah = lembagaList.filter((l) => Boolean(l.last_upload)).length;
    const lembagaBelumUnggah = totalLembaga - lembagaSudahUnggah;

    return {
      totalLembaga,
      totalSiswa,
      siswaTK,
      siswaKB,
      siswaSPS,
      siswaTPA,
      lembagaSudahUnggah,
      lembagaBelumUnggah,
      persenSudahUnggah:
        totalLembaga > 0
          ? Math.round((lembagaSudahUnggah / totalLembaga) * 100)
          : 0,
    };
  }
}