'use client';

import React, { useState, useEffect } from 'react';
import {
  Printer,
  Download,
} from 'lucide-react';
import AppLayout from '@/components/layout/AppLayout';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { AppDataStore } from '@/lib/store';
import {
  Siswa,
  Lembaga,
  Kecamatan,
  UserProfile,
  normalizeRole,
} from '@/lib/types';
import { formatDateIndo, calculateAge } from '@/lib/utils';
import { exportSiswaToExcel } from '@/lib/excel';

function resolveOperatorSchool(
  user: UserProfile,
  allLembaga: Lembaga[]
): Lembaga | undefined {
  if (user.lembaga_id) {
    const byId = allLembaga.find(
      (item) => String(item.id) === String(user.lembaga_id)
    );
    if (byId) return byId;
  }

  const userSchoolName = (user.lembaga_nama ?? '').trim().toLowerCase();
  if (userSchoolName) {
    const byName = allLembaga.find(
      (item) => (item.nama ?? '').trim().toLowerCase() === userSchoolName
    );
    if (byName) return byName;
  }

  const email = (user.email ?? '').trim().toLowerCase();
  const namaAkun = (user.nama ?? '').trim().toLowerCase();

  if (
    email.includes('ampel') ||
    namaAkun.includes('ampel') ||
    namaAkun.includes('tk negeri pembina')
  ) {
    const existingAmpel = allLembaga.find(
      (item) =>
        String(item.id) === 'lem-ampel' ||
        (item.nama ?? '').trim().toLowerCase() === 'tk negeri pembina ampel'
    );
    if (existingAmpel) return existingAmpel;

    return AppDataStore.addLembaga({
      id: user.lembaga_id || 'lem-ampel',
      nama: user.lembaga_nama || 'TK Negeri Pembina Ampel',
      kecamatan_id: user.kecamatan_id || 'kec-ampel',
      kecamatan_nama: user.kecamatan_nama || 'Ampel',
      jenjang: 'TK',
    });
  }

  if (user.lembaga_nama) {
    return AppDataStore.addLembaga({
      id: user.lembaga_id || undefined,
      nama: user.lembaga_nama,
      kecamatan_id: user.kecamatan_id,
      kecamatan_nama: user.kecamatan_nama,
    });
  }

  return undefined;
}

export default function LaporanPage() {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [siswaList, setSiswaList] = useState<Siswa[]>([]);
  const [lembagaList, setLembagaList] = useState<Lembaga[]>([]);
  const [kecamatanList, setKecamatanList] = useState<Kecamatan[]>([]);

  // Filters
  const [filterKecamatan, setFilterKecamatan] = useState('all');
  const [filterLembaga, setFilterLembaga] = useState('all');
  const [filterJenjang, setFilterJenjang] = useState('all');

  useEffect(() => {
    let user = AppDataStore.getCurrentUser();
    const role = normalizeRole(user.role);

    const allLembaga = AppDataStore.getLembagaList();
    const allKecamatan = AppDataStore.getKecamatan();
    const allSiswa = AppDataStore.getSiswaList();

    if (role === 'operator_sekolah') {
      const resolvedSchool = resolveOperatorSchool(user, allLembaga);
      const ownLembagaId = resolvedSchool
        ? String(resolvedSchool.id)
        : user.lembaga_id
          ? String(user.lembaga_id)
          : '';
      const ownSchoolName = (
        resolvedSchool?.nama ??
        user.lembaga_nama ??
        ''
      )
        .trim()
        .toLowerCase();

      if (
        resolvedSchool &&
        (String(user.lembaga_id || '') !== String(resolvedSchool.id) ||
          !user.kecamatan_id)
      ) {
        user = {
          ...user,
          lembaga_id: String(resolvedSchool.id),
          lembaga_nama: resolvedSchool.nama,
          kecamatan_id: resolvedSchool.kecamatan_id,
          kecamatan_nama: resolvedSchool.kecamatan_nama,
        };
        if (typeof window !== 'undefined') {
          localStorage.setItem('boyolali_current_user', JSON.stringify(user));
        }
      }

      setCurrentUser(user);

      const ownLembaga = resolvedSchool
        ? [resolvedSchool]
        : ownLembagaId
          ? allLembaga.filter((item) => String(item.id) === ownLembagaId)
          : [];
      const ownKecId = resolvedSchool?.kecamatan_id
        ? String(resolvedSchool.kecamatan_id)
        : user.kecamatan_id
          ? String(user.kecamatan_id)
          : '';

      setLembagaList(ownLembaga);
      setKecamatanList(
        ownKecId
          ? allKecamatan.filter((k) => String(k.id) === ownKecId)
          : []
      );
      setSiswaList(
        allSiswa.filter(
          (s) =>
            (ownLembagaId && String(s.lembaga_id) === ownLembagaId) ||
            (ownSchoolName &&
              (s.lembaga_nama ?? '').trim().toLowerCase() === ownSchoolName)
        )
      );
      setFilterKecamatan(ownKecId || 'none');
      setFilterLembaga(ownLembagaId || 'none');
    } else if (role === 'admin_kecamatan') {
      setCurrentUser(user);
      const ownKecId = user.kecamatan_id ? String(user.kecamatan_id) : '';
      const ownKecName = (user.kecamatan_nama ?? '').trim().toLowerCase();
      const kecLembaga = allLembaga.filter(
        (item) =>
          (ownKecId && String(item.kecamatan_id) === ownKecId) ||
          (ownKecName &&
            (item.kecamatan_nama ?? '').trim().toLowerCase() === ownKecName)
      );
      const allowedLembagaIds = new Set(kecLembaga.map((item) => String(item.id)));

      setLembagaList(kecLembaga);
      setKecamatanList(
        allKecamatan.filter(
          (k) =>
            (ownKecId && String(k.id) === ownKecId) ||
            (ownKecName && (k.nama ?? '').trim().toLowerCase() === ownKecName)
        )
      );
      setSiswaList(
        allSiswa.filter(
          (s) =>
            (ownKecId && String(s.kecamatan_id) === ownKecId) ||
            (ownKecName &&
              (s.kecamatan_nama ?? '').trim().toLowerCase() === ownKecName) ||
            allowedLembagaIds.has(String(s.lembaga_id))
        )
      );
      setFilterKecamatan(ownKecId || 'none');
      setFilterLembaga('all');
    } else {
      // Admin Dinas
      setCurrentUser(user);
      setLembagaList(allLembaga);
      setKecamatanList(allKecamatan);
      setSiswaList(allSiswa);
      setFilterKecamatan('all');
      setFilterLembaga('all');
    }
  }, []);

  if (!currentUser) return null;

  const role = normalizeRole(currentUser.role);
  const ownSchool = role === 'operator_sekolah' ? lembagaList[0] : undefined;
  const effectiveOperatorLembagaId =
    ownSchool?.id || currentUser.lembaga_id || '';
  const effectiveOperatorSchoolName = (
    ownSchool?.nama ??
    currentUser.lembaga_nama ??
    ''
  )
    .trim()
    .toLowerCase();

  // Filtered Siswa (dengan pengaman mutlak per role)
  const filteredSiswa = siswaList.filter((s) => {
    if (role === 'operator_sekolah') {
      const matchId =
        effectiveOperatorLembagaId &&
        String(s.lembaga_id) === String(effectiveOperatorLembagaId);
      const matchName =
        effectiveOperatorSchoolName &&
        (s.lembaga_nama ?? '').trim().toLowerCase() ===
        effectiveOperatorSchoolName;
      if (!matchId && !matchName) return false;
    }

    if (role === 'admin_kecamatan') {
      const ownKecId = currentUser.kecamatan_id
        ? String(currentUser.kecamatan_id)
        : '';
      const ownKecName = (currentUser.kecamatan_nama ?? '')
        .trim()
        .toLowerCase();
      const matchKec =
        (ownKecId && String(s.kecamatan_id) === ownKecId) ||
        (ownKecName &&
          (s.kecamatan_nama ?? '').trim().toLowerCase() === ownKecName);
      if (!matchKec) return false;
    }

    if (
      role === 'admin_dinas' &&
      filterKecamatan !== 'all' &&
      String(s.kecamatan_id) !== String(filterKecamatan)
    ) {
      return false;
    }

    if (
      role !== 'operator_sekolah' &&
      filterLembaga !== 'all' &&
      String(s.lembaga_id) !== String(filterLembaga)
    ) {
      return false;
    }

    if (
      filterJenjang !== 'all' &&
      String(s.jenjang || '').toUpperCase() !== filterJenjang
    ) {
      return false;
    }

    return true;
  });

  const selectedKecObj = kecamatanList.find(
    (k) => String(k.id) === String(filterKecamatan)
  );
  const selectedLemObj =
    role === 'operator_sekolah'
      ? ownSchool
      : lembagaList.find((l) => String(l.id) === String(filterLembaga));

  const namaKecamatanHeader = selectedKecObj
    ? `Kec. ${selectedKecObj.nama}`
    : role === 'admin_kecamatan' && currentUser.kecamatan_nama
      ? `Kec. ${currentUser.kecamatan_nama}`
      : role === 'operator_sekolah' &&
        (ownSchool?.kecamatan_nama || currentUser.kecamatan_nama)
        ? `Kec. ${ownSchool?.kecamatan_nama || currentUser.kecamatan_nama}`
        : 'Semua Kecamatan';

  const namaLembagaHeader = selectedLemObj
    ? selectedLemObj.nama
    : role === 'operator_sekolah'
      ? currentUser.lembaga_nama || 'Lembaga Anda'
      : 'Semua Lembaga';

  // Trigger Native Print Dialog
  const handlePrint = () => {
    window.print();
  };

  // Export to Excel
  const handleExportExcel = () => {
    const kecName =
      selectedKecObj?.nama ??
      (role === 'operator_sekolah'
        ? ownSchool?.kecamatan_nama || currentUser.kecamatan_nama
        : currentUser.kecamatan_nama) ??
      undefined;

    const lemName =
      selectedLemObj?.nama ??
      (role === 'operator_sekolah' ? currentUser.lembaga_nama : null) ??
      undefined;

    const bytes = exportSiswaToExcel(filteredSiswa, {
      kecamatan: kecName,
      lembaga: lemName,
      jenjang: filterJenjang !== 'all' ? filterJenjang : undefined,
    });
    const blob = new Blob([bytes as unknown as BlobPart], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Laporan_Data_Siswa_PAUDNI_Boyolali_${new Date().toISOString().slice(0, 10)}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const currentDateFormatted = new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'full',
  }).format(new Date());

  return (
    <AppLayout
      title="Rekapitulasi & Cetak Laporan"
      subtitle={
        role === 'operator_sekolah'
          ? `Cetak dan ekspor laporan peserta didik ${namaLembagaHeader}`
          : role === 'admin_kecamatan'
            ? `Cetak dan ekspor laporan peserta didik wilayah ${namaKecamatanHeader}`
            : 'Cetak dan ekspor dokumen laporan data peserta didik sesuai format standar dinas'
      }
      breadcrumbs={[{ label: 'Laporan' }]}
    >
      {/* Filter and Actions Bar (No-Print) */}
      <div className="no-print space-y-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Kecamatan Filter (Admin Dinas Only) */}
              {role === 'admin_dinas' && (
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Wilayah Kecamatan
                  </label>
                  <select
                    value={filterKecamatan}
                    onChange={(e) => {
                      setFilterKecamatan(e.target.value);
                      setFilterLembaga('all');
                    }}
                    className="w-full text-xs border border-slate-300 rounded-lg px-3 py-1.5 bg-white text-slate-700 outline-none focus:ring-1 focus:ring-blue-600"
                  >
                    <option value="all">Semua Kecamatan ({kecamatanList.length})</option>
                    {kecamatanList.map((k) => (
                      <option key={k.id} value={k.id}>
                        Kec. {k.nama}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Lembaga Filter (Admin Dinas & Admin Kecamatan) */}
              {role !== 'operator_sekolah' && (
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Lembaga Pendidikan
                  </label>
                  <select
                    value={filterLembaga}
                    onChange={(e) => setFilterLembaga(e.target.value)}
                    className="w-full text-xs border border-slate-300 rounded-lg px-3 py-1.5 bg-white text-slate-700 outline-none focus:ring-1 focus:ring-blue-600 truncate"
                  >
                    <option value="all">Semua Lembaga</option>
                    {lembagaList
                      .filter(
                        (l) =>
                          filterKecamatan === 'all' ||
                          String(l.kecamatan_id) === String(filterKecamatan)
                      )
                      .map((l) => (
                        <option key={l.id} value={l.id}>
                          {l.nama} ({l.jenjang})
                        </option>
                      ))}
                  </select>
                </div>
              )}

              {/* Jenjang Filter */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Jenjang
                </label>
                <select
                  value={filterJenjang}
                  onChange={(e) => setFilterJenjang(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-lg px-3 py-1.5 bg-white text-slate-700 outline-none focus:ring-1 focus:ring-blue-600"
                >
                  <option value="all">Semua Jenjang</option>
                  <option value="TK">TK (Taman Kanak-Kanak)</option>
                  <option value="KB">KB (Kelompok Bermain)</option>
                  <option value="SPS">SPS (Satuan PAUD Sejenis)</option>
                  <option value="TPA">TPA (Taman Penitipan Anak)</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Buttons for Action */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-500 font-medium">
            Siap mencetak <strong className="text-slate-800">{filteredSiswa.length}</strong> baris data
          </span>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportExcel}
              leftIcon={<Download className="w-4 h-4" />}
            >
              Unduh Excel (.xlsx)
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handlePrint}
              leftIcon={<Printer className="w-4 h-4" />}
            >
              Cetak / Simpan PDF
            </Button>
          </div>
        </div>
      </div>

      {/* Printable Report View (PRD 6.5: Tanpa kop dinas, hanya data, bagian atas memuat judul, filter, tanggal cetak) */}
      <div className="bg-white p-6 sm:p-8 rounded-xl border border-slate-200 shadow-sm print-container print:p-0 print:border-none print:shadow-none">
        {/* Header Laporan Sesuai PRD */}
        <div className="border-b-2 border-slate-900 pb-4 mb-6">
          <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight uppercase text-center sm:text-left">
            LAPORAN REKAPITULASI DATA PESERTA DIDIK
          </h2>
          <p className="text-xs font-semibold text-slate-600 uppercase text-center sm:text-left mt-0.5">
            Sistem Informasi PAUDNI - Dinas Pendidikan dan Kebudayaan Kabupaten Boyolali
          </p>

          <div className="mt-4 pt-3 border-t border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs text-slate-700">
            <div>
              <span className="text-[10px] text-slate-400 block uppercase font-bold">
                Kecamatan
              </span>
              <strong className="text-slate-900">
                {namaKecamatanHeader}
              </strong>
            </div>

            <div>
              <span className="text-[10px] text-slate-400 block uppercase font-bold">
                Lembaga
              </span>
              <strong className="text-slate-900">
                {namaLembagaHeader}
              </strong>
            </div>

            <div>
              <span className="text-[10px] text-slate-400 block uppercase font-bold">
                Jenjang
              </span>
              <strong className="text-slate-900">
                {filterJenjang !== 'all' ? filterJenjang : 'Semua Jenjang'}
              </strong>
            </div>

            <div>
              <span className="text-[10px] text-slate-400 block uppercase font-bold">
                Tanggal Cetak
              </span>
              <strong className="text-slate-900">{currentDateFormatted}</strong>
            </div>
          </div>
        </div>

        {/* Tabel Data Tabular */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100 text-slate-800 font-bold border-y border-slate-300">
                <th className="py-2.5 px-2 text-center w-10">No</th>
                <th className="py-2.5 px-3">NISN</th>
                <th className="py-2.5 px-3">Nama Lengkap</th>
                <th className="py-2.5 px-3">Tanggal Lahir</th>
                <th className="py-2.5 px-3 text-center">Usia</th>
                <th className="py-2.5 px-3">Alamat</th>
                <th className="py-2.5 px-3">Nama Ayah</th>
                <th className="py-2.5 px-3">Nama Ibu</th>
                <th className="py-2.5 px-3">Lembaga</th>
                <th className="py-2.5 px-3">Jenjang</th>
                <th className="py-2.5 px-3">Kecamatan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredSiswa.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-8 text-center text-slate-400">
                    Tidak ada data peserta didik yang cocok dengan kriteria laporan.
                  </td>
                </tr>
              ) : (
                filteredSiswa.map((s, idx) => {
                  const age = calculateAge(s.tanggal_lahir);
                  return (
                    <tr key={s.id} className="hover:bg-slate-50">
                      <td className="py-2 px-2 text-center text-slate-500">{idx + 1}</td>
                      <td className="py-2 px-3 font-mono">
                        {s.nisn || '-'}
                      </td>
                      <td className="py-2 px-3 font-bold text-slate-900">{s.nama}</td>
                      <td className="py-2 px-3">{formatDateIndo(s.tanggal_lahir)}</td>
                      <td className="py-2 px-3 text-center">
                        {age !== null ? `${age} th` : '-'}
                      </td>
                      <td className="py-2 px-3">{s.alamat}</td>
                      <td className="py-2 px-3">{s.nama_ayah}</td>
                      <td className="py-2 px-3">{s.nama_ibu}</td>
                      <td className="py-2 px-3 font-medium">{s.lembaga_nama}</td>
                      <td className="py-2 px-3">{s.jenjang}</td>
                      <td className="py-2 px-3">{s.kecamatan_nama}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Summary Ringkasan Cetak */}
        <div className="mt-8 pt-4 border-t border-slate-300 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500">
          <div>
            Dicetak oleh: <strong>{currentUser.nama}</strong> ({currentUser.role})
          </div>
          <div className="mt-1 sm:mt-0">
            Total Record: <strong>{filteredSiswa.length} Peserta Didik</strong>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}