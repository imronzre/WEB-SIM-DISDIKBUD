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
    const user = AppDataStore.getCurrentUser();
    setCurrentUser(user);
    const role = normalizeRole(user.role);

    let l = AppDataStore.getLembagaList();
    if (role === 'admin_kecamatan' && user.kecamatan_id) {
      l = l.filter((item) => item.kecamatan_id === user.kecamatan_id);
      setFilterKecamatan(user.kecamatan_id);
    } else if (role === 'operator_sekolah' && user.lembaga_id) {
      l = l.filter((item) => item.id === user.lembaga_id);
      setFilterLembaga(user.lembaga_id);
    }
    setLembagaList(l);

    setKecamatanList(AppDataStore.getKecamatan());
    setSiswaList(AppDataStore.getSiswaList());
  }, []);

  if (!currentUser) return null;

  const role = normalizeRole(currentUser.role);

  // Filtered Siswa
  const filteredSiswa = siswaList.filter((s) => {
    if (role === 'admin_kecamatan' && currentUser.kecamatan_id) {
      if (s.kecamatan_id !== currentUser.kecamatan_id) return false;
    }
    if (role === 'operator_sekolah' && currentUser.lembaga_id) {
      if (s.lembaga_id !== currentUser.lembaga_id) return false;
    }

    if (filterKecamatan !== 'all' && s.kecamatan_id !== filterKecamatan) return false;
    if (filterLembaga !== 'all' && s.lembaga_id !== filterLembaga) return false;
    if (filterJenjang !== 'all' && s.jenjang !== filterJenjang) return false;
    return true;
  });

  const selectedKecObj = kecamatanList.find((k) => k.id === filterKecamatan);
  const selectedLemObj = lembagaList.find((l) => l.id === filterLembaga);

  // Trigger Native Print Dialog
  const handlePrint = () => {
    window.print();
  };

  // Export to Excel
  const handleExportExcel = () => {
    const bytes = exportSiswaToExcel(filteredSiswa, {
      kecamatan: selectedKecObj?.nama,
      lembaga: selectedLemObj?.nama,
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
      subtitle="Cetak dan ekspor dokumen laporan data peserta didik sesuai format standar dinas"
      breadcrumbs={[{ label: 'Laporan' }]}
    >
      {/* Filter and Actions Bar (No-Print) */}
      <div className="no-print space-y-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Kecamatan Filter */}
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

              {/* Lembaga Filter */}
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
                          filterKecamatan === 'all' || l.kecamatan_id === filterKecamatan
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
                {selectedKecObj ? `Kec. ${selectedKecObj.nama}` : 'Semua Kecamatan'}
              </strong>
            </div>

            <div>
              <span className="text-[10px] text-slate-400 block uppercase font-bold">
                Lembaga
              </span>
              <strong className="text-slate-900">
                {selectedLemObj ? selectedLemObj.nama : 'Semua Lembaga'}
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