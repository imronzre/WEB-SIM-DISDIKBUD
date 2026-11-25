import * as XLSX from 'xlsx';
import { ParsedExcelRow, Siswa } from './types';

export const TEMPLATE_COLUMNS = [
  'NISN',
  'Nama',
  'Tanggal Lahir (DD-MM-YYYY)',
  'Alamat',
  'Nama Ayah',
  'Nama Ibu',
];

/**
 * Buat file template Excel (.xlsx) standar yang bisa diunduh oleh lembaga
 */
export function generateStudentTemplate(): Uint8Array {
  const wb = XLSX.utils.book_new();

  // Data baris template + contoh pengisian
  const templateData = [
    [
      'NISN',
      'Nama',
      'Tanggal Lahir (DD-MM-YYYY)',
      'Alamat',
      'Nama Ayah',
      'Nama Ibu',
    ],
    [
      '3180012345',
      'Ahmad Fauzi',
      '15-05-2019',
      'Dusun Kemiri RT 01/02',
      'Bambang Sugianto',
      'Siti Aminah',
    ],
    [
      '', // NISN kosong diperbolehkan untuk PAUD/Posyandu
      'Nurfadilah Putri',
      '20-11-2020',
      'Dusun Mulyorejo RT 03/01',
      'Agus Wahyudi',
      'Tri Handayani',
    ],
    [
      '3200056789',
      'Rizky Pratama',
      '08-02-2019',
      'Jl. Pandanaran No. 10',
      'Hendra Setiawan',
      'Dewi Lestari',
    ],
  ];

  const ws = XLSX.utils.aoa_to_sheet(templateData);

  // Lebar kolom
  ws['!cols'] = [
    { wch: 16 }, // NISN
    { wch: 28 }, // Nama
    { wch: 26 }, // Tanggal Lahir
    { wch: 32 }, // Alamat
    { wch: 24 }, // Nama Ayah
    { wch: 24 }, // Nama Ibu
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'Template Siswa');

  // Petunjuk pengisian sheet
  const instructionData = [
    ['PETUNJUK PENGISIAN DATA SISWA PAUDNI BOYOLALI'],
    ['1. Kolom NISN: Boleh dikosongkan jika anak belum memiliki NISN (khususnya PAUD/Posyandu).'],
    ['   Jika diisi, harus berupa 10 digit angka.'],
    ['2. Kolom Nama: WAJIB diisi nama lengkap anak.'],
    ['3. Kolom Tanggal Lahir: WAJIB diisi format DD-MM-YYYY (Contoh: 15-05-2019) dan tidak boleh di masa depan.'],
    ['4. Kolom Alamat: WAJIB diisi alamat tempat tinggal anak / orang tua.'],
    ['5. Kolom Nama Ayah: WAJIB diisi.'],
    ['6. Kolom Nama Ibu: WAJIB diisi.'],
    ['7. Jenjang sekolah tidak perlu dicantumkan, karena otomatis mengikuti lembaga pengunggah.'],
  ];
  const wsPetunjuk = XLSX.utils.aoa_to_sheet(instructionData);
  wsPetunjuk['!cols'] = [{ wch: 80 }];
  XLSX.utils.book_append_sheet(wb, wsPetunjuk, 'Petunjuk Pengisian');

  return XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
}

/**
 * Parse tanggal dari berbagai format (string DD-MM-YYYY, YYYY-MM-DD, atau nomor serial Excel)
 */
export function parseDateString(raw: any): { isoDate: string; displayDate: string; error?: string } {
  if (!raw) return { isoDate: '', displayDate: '', error: 'Tanggal lahir wajib diisi' };

  let d: Date | null = null;

  if (typeof raw === 'number') {
    // Excel serial number
    const parsed = XLSX.SSF.parse_date_code(raw);
    if (parsed) {
      d = new Date(Date.UTC(parsed.y, parsed.m - 1, parsed.d));
    }
  } else if (typeof raw === 'string') {
    const trimmed = raw.trim();
    // Format DD-MM-YYYY atau DD/MM/YYYY
    const dmyMatch = trimmed.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
    if (dmyMatch) {
      const day = parseInt(dmyMatch[1], 10);
      const month = parseInt(dmyMatch[2], 10) - 1;
      const year = parseInt(dmyMatch[3], 10);
      d = new Date(Date.UTC(year, month, day));
    } else {
      // Format YYYY-MM-DD
      const ymdMatch = trimmed.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/);
      if (ymdMatch) {
        const year = parseInt(ymdMatch[1], 10);
        const month = parseInt(ymdMatch[2], 10) - 1;
        const day = parseInt(ymdMatch[3], 10);
        d = new Date(Date.UTC(year, month, day));
      } else {
        const fallback = new Date(trimmed);
        if (!isNaN(fallback.getTime())) {
          d = fallback;
        }
      }
    }
  } else if (raw instanceof Date) {
    d = raw;
  }

  if (!d || isNaN(d.getTime())) {
    return {
      isoDate: '',
      displayDate: String(raw),
      error: `Format tanggal tidak valid (${raw}). Gunakan DD-MM-YYYY (contoh: 15-05-2019)`,
    };
  }

  const now = new Date();
  if (d.getTime() > now.getTime()) {
    return {
      isoDate: '',
      displayDate: String(raw),
      error: 'Tanggal lahir tidak boleh di masa depan',
    };
  }

  const year = d.getUTCFullYear();
  const month = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  const isoDate = `${year}-${month}-${day}`;
  const displayDate = `${day}-${month}-${year}`;

  return { isoDate, displayDate };
}

/**
 * Validasi dan Parsing Array Buffer File Excel
 */
export function parseAndValidateExcel(buffer: ArrayBuffer): {
  rows: ParsedExcelRow[];
  totalRows: number;
  validRowsCount: number;
  invalidRowsCount: number;
} {
  const wb = XLSX.read(buffer, { type: 'array' });
  const firstSheetName = wb.SheetNames[0];
  const ws = wb.Sheets[firstSheetName];

  // Convert to JSON array of objects
  const rawRows: Record<string, any>[] = XLSX.utils.sheet_to_json(ws, { defval: '' });

  const parsedRows: ParsedExcelRow[] = [];
  const seenKeys = new Map<string, number>();

  rawRows.forEach((row, idx) => {
    const rowNumber = idx + 2; // baris di Excel (header = 1)
    const errors: string[] = [];
    const warnings: string[] = [];

    // Mencari kunci kolom fleksibel (case-insensitive)
    const findVal = (keywords: string[]): string => {
      for (const k of Object.keys(row)) {
        const cleanK = k.toLowerCase().trim();
        for (const kw of keywords) {
          if (cleanK.includes(kw)) {
            return String(row[k] ?? '').trim();
          }
        }
      }
      return '';
    };

    const nisnRaw = findVal(['nisn']);
    const nama = findVal(['nama peserta', 'nama siswa', 'nama']);
    const tglRaw = findVal(['tanggal lahir', 'tgl lahir', 'tanggal', 'tgl']);
    const alamat = findVal(['alamat']);
    const namaAyah = findVal(['ayah', 'nama ayah']);
    const namaIbu = findVal(['ibu', 'nama ibu']);

    // Validasi NISN jika diisi
    let cleanNisn = nisnRaw.replace(/[^0-9]/g, '');
    if (nisnRaw && cleanNisn.length !== 10) {
      errors.push(`NISN harus 10 digit angka (ditemukan: "${nisnRaw}")`);
    }

    // Validasi Nama Wajib
    if (!nama) {
      errors.push('Nama peserta didik wajib diisi');
    }

    // Validasi Tanggal Lahir
    const dateParsed = parseDateString(tglRaw);
    if (dateParsed.error) {
      errors.push(dateParsed.error);
    }

    // Validasi Alamat Wajib
    if (!alamat) {
      errors.push('Alamat wajib diisi');
    }

    // Validasi Nama Ayah Wajib
    if (!namaAyah) {
      errors.push('Nama Ayah wajib diisi');
    }

    // Validasi Nama Ibu Wajib
    if (!namaIbu) {
      errors.push('Nama Ibu wajib diisi');
    }

    // Deteksi duplikat dalam file
    const uniqueKey = cleanNisn
      ? `NISN:${cleanNisn}`
      : `NAME_DOB:${nama.toLowerCase()}_${dateParsed.isoDate}`;

    if (nama && dateParsed.isoDate) {
      if (seenKeys.has(uniqueKey)) {
        errors.push(`Duplikat di baris ${seenKeys.get(uniqueKey)} dalam file yang sama`);
      } else {
        seenKeys.set(uniqueKey, rowNumber);
      }
    }

    parsedRows.push({
      rowNumber,
      nisn: cleanNisn,
      nama,
      tanggal_lahir: dateParsed.isoDate,
      alamat,
      nama_ayah: namaAyah,
      nama_ibu: namaIbu,
      isValid: errors.length === 0,
      errors,
      warnings,
    });
  });

  const validRowsCount = parsedRows.filter((r) => r.isValid).length;
  const invalidRowsCount = parsedRows.filter((r) => !r.isValid).length;

  return {
    rows: parsedRows,
    totalRows: parsedRows.length,
    validRowsCount,
    invalidRowsCount,
  };
}

/**
 * Buat Excel Laporan Error dari baris yang gagal
 */
export function generateErrorReport(failedRows: ParsedExcelRow[]): Uint8Array {
  const wb = XLSX.utils.book_new();

  const reportData = [
    [
      'Baris Excel',
      'NISN',
      'Nama',
      'Tanggal Lahir',
      'Alamat',
      'Nama Ayah',
      'Nama Ibu',
      'Pesan Error / Alasan Gagal',
    ],
    ...failedRows.map((r) => [
      r.rowNumber,
      r.nisn,
      r.nama,
      r.tanggal_lahir,
      r.alamat,
      r.nama_ayah,
      r.nama_ibu,
      r.errors.join('; '),
    ]),
  ];

  const ws = XLSX.utils.aoa_to_sheet(reportData);
  ws['!cols'] = [
    { wch: 12 },
    { wch: 16 },
    { wch: 26 },
    { wch: 16 },
    { wch: 30 },
    { wch: 22 },
    { wch: 22 },
    { wch: 50 },
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'Laporan Error');
  return XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
}

/**
 * Ekspor Data Siswa ke File Excel (.xlsx)
 */
export function exportSiswaToExcel(
  siswaList: Siswa[],
  filterInfo?: { kecamatan?: string; lembaga?: string; jenjang?: string }
): Uint8Array {
  const wb = XLSX.utils.book_new();

  const header = [
    'No',
    'NISN',
    'Nama Peserta Didik',
    'Tanggal Lahir',
    'Alamat',
    'Nama Ayah',
    'Nama Ibu',
    'Jenjang',
    'Lembaga',
    'Kecamatan',
  ];

  const dataRows = siswaList.map((s, idx) => [
    idx + 1,
    s.nisn || '-',
    s.nama,
    s.tanggal_lahir,
    s.alamat,
    s.nama_ayah,
    s.nama_ibu,
    s.jenjang || '-',
    s.lembaga_nama || '-',
    s.kecamatan_nama || '-',
  ]);

  const wsData = [header, ...dataRows];
  const ws = XLSX.utils.aoa_to_sheet(wsData);

  ws['!cols'] = [
    { wch: 6 },
    { wch: 16 },
    { wch: 28 },
    { wch: 16 },
    { wch: 36 },
    { wch: 24 },
    { wch: 24 },
    { wch: 12 },
    { wch: 30 },
    { wch: 20 },
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'Data Siswa');
  return XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
}
