export type Role =
  | 'admin_dinas'
  | 'admin_kecamatan'
  | 'operator_sekolah'
  | 'admin'
  | 'kecamatan'
  | 'lembaga';

export type Jenjang = 'TK' | 'PAUD' | 'Posyandu';

export type StatusLembaga = 'Negeri' | 'Swasta';

export function normalizeRole(role: string): 'admin_dinas' | 'admin_kecamatan' | 'operator_sekolah' {
  if (role === 'admin' || role === 'admin_dinas') return 'admin_dinas';
  if (role === 'kecamatan' || role === 'admin_kecamatan') return 'admin_kecamatan';
  return 'operator_sekolah';
}

export interface Kecamatan {
  id: string;
  nama: string;
  created_at?: string;
  total_lembaga?: number;
  total_siswa?: number;
}

export interface Lembaga {
  id: string;
  nama: string;
  npsn?: string | null;
  jenjang: Jenjang;
  kecamatan_id: string;
  kecamatan_nama?: string;
  desa: string;
  alamat: string;
  status: StatusLembaga;
  kontak?: string | null;
  aktif: boolean;
  created_at?: string;
  updated_at?: string;
  total_siswa?: number;
  last_upload?: string | null;
}

export interface UserProfile {
  id: string;
  email: string;
  nama: string;
  role: Role;
  kecamatan_id?: string | null;
  kecamatan_nama?: string | null;
  lembaga_id?: string | null;
  lembaga_nama?: string | null;
  created_at?: string;
}

export interface Siswa {
  id: string;
  nisn?: string | null;
  nama: string;
  tanggal_lahir: string; // YYYY-MM-DD
  alamat: string;
  nama_ayah: string;
  nama_ibu: string;
  lembaga_id: string;
  lembaga_nama?: string;
  jenjang?: Jenjang;
  kecamatan_id?: string;
  kecamatan_nama?: string;
  created_at?: string;
  updated_at?: string;
}

export interface UploadLog {
  id: string;
  lembaga_id: string;
  lembaga_nama?: string;
  user_id?: string | null;
  user_nama?: string | null;
  nama_file: string;
  mode: 'perbarui' | 'ganti_semua';
  baris_berhasil: number;
  baris_gagal: number;
  created_at: string;
}

export interface ActivityLog {
  id: string;
  user_id?: string | null;
  user_nama: string;
  user_role: Role;
  aksi: string;
  detail?: string;
  created_at: string;
}

export interface ParsedExcelRow {
  rowNumber: number;
  nisn: string;
  nama: string;
  tanggal_lahir: string;
  alamat: string;
  nama_ayah: string;
  nama_ibu: string;
  isValid: boolean;
  errors: string[];
  warnings: string[];
}
