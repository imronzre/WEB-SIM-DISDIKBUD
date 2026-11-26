'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import * as XLSX from 'xlsx';
import {
  Users,
  School,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  FileText,
  ArrowRight,
  RotateCcw,
  Search,
  Building2,
  Download,
} from 'lucide-react';
import AppLayout from '@/components/layout/AppLayout';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge, JenjangBadge } from '@/components/ui/Badge';
import { AppDataStore } from '@/lib/store';
import {
  Lembaga,
  UserProfile,
  Kecamatan,
  normalizeRole,
} from '@/lib/types';

type JenjangType = 'KB' | 'TK' | 'SPS' | 'TPA';
type JenjangFilter = 'all' | JenjangType;

interface KecamatanRecapRow {
  kecamatanId: string;
  kecamatanNama: string;
  jumlahLembaga: number;
  siswaKB: number;
  siswaTK: number;
  siswaSPS: number;
  siswaTPA: number;
  totalSiswa: number;
}

export default function DashboardPage() {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState({
    totalLembaga: 0,
    totalSiswa: 0,
    siswaTK: 0,
    siswaKB: 0,
    siswaSPS: 0,
    siswaTPA: 0,
    lembagaSudahUnggah: 0,
    lembagaBelumUnggah: 0,
    persenSudahUnggah: 0,
  });
  const [lembagaList, setLembagaList] = useState<Lembaga[]>([]);
  const [kecamatanList, setKecamatanList] = useState<Kecamatan[]>([]);

  const [focusedKec, setFocusedKec] = useState<string>('all');
  const [selectedJenjang, setSelectedJenjang] = useState<JenjangFilter>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const lembagaSectionRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const user = AppDataStore.getCurrentUser();
    setCurrentUser(user);
    const role = normalizeRole(user.role);

    const s = AppDataStore.getStats(user);
    setStats(s);

    const allKec = AppDataStore.getKecamatan();
    const allLembaga = AppDataStore.getLembagaList();

    setKecamatanList(allKec);

    if (role === 'operator_sekolah') {
      // Rekapan seluruh kecamatan tetap bisa dilihat, tapi rincian lembaga/edit hanya sekolahnya sendiri
      setLembagaList(
        user.lembaga_id
          ? allLembaga.filter((item) => String(item.id) === String(user.lembaga_id))
          : []
      );
      setFocusedKec('all');
    } else if (role === 'admin_kecamatan' && user.kecamatan_id) {
      setLembagaList(
        allLembaga.filter(
          (item) => String(item.kecamatan_id) === String(user.kecamatan_id)
        )
      );
      setFocusedKec(String(user.kecamatan_id));
    } else {
      setLembagaList(allLembaga);
      setFocusedKec('all');
    }
  }, []);

  const role = currentUser ? normalizeRole(currentUser.role) : 'admin_dinas';
  const canDrillRecap = role === 'admin_dinas';

  // Untuk rekap kecamatan: operator melihat rekapan seluruh kecamatan, admin dinas bisa fokus 1 kecamatan saat diklik
  const recapSourceLembaga = useMemo(() => {
    return lembagaList.filter((item) => {
      if (
        canDrillRecap &&
        focusedKec !== 'all' &&
        String(item.kecamatan_id) !== focusedKec
      ) {
        return false;
      }
      if (
        selectedJenjang !== 'all' &&
        String(item.jenjang).toUpperCase() !== selectedJenjang
      ) {
        return false;
      }
      return true;
    });
  }, [lembagaList, canDrillRecap, focusedKec, selectedJenjang]);

  // Untuk rincian lembaga: operator hanya melihat sekolahnya sendiri; admin dinas mengikuti filter fokus kecamatan & jenjang
  const filteredLembaga = useMemo(() => {
    return lembagaList.filter((item) => {
      if (
        canDrillRecap &&
        focusedKec !== 'all' &&
        String(item.kecamatan_id) !== focusedKec
      ) {
        return false;
      }
      if (
        selectedJenjang !== 'all' &&
        String(item.jenjang).toUpperCase() !== selectedJenjang
      ) {
        return false;
      }
      return true;
    });
  }, [lembagaList, canDrillRecap, focusedKec, selectedJenjang]);

  const kecamatanRecapRows: KecamatanRecapRow[] = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    const targetKecamatan = kecamatanList.filter((k) => {
      if (
        canDrillRecap &&
        focusedKec !== 'all' &&
        String(k.id) !== focusedKec
      ) {
        return false;
      }
      if (q && !k.nama.toLowerCase().includes(q)) return false;
      return true;
    });

    return targetKecamatan.map((kec) => {
      const lembagaInKec = recapSourceLembaga.filter(
        (l) => String(l.kecamatan_id) === String(kec.id)
      );

      let siswaKB = 0;
      let siswaTK = 0;
      let siswaSPS = 0;
      let siswaTPA = 0;

      for (const lem of lembagaInKec) {
        const count = Number(lem.total_siswa ?? 0);
        const j = String(lem.jenjang).toUpperCase() as JenjangType;
        if (j === 'KB') siswaKB += count;
        else if (j === 'TK') siswaTK += count;
        else if (j === 'SPS') siswaSPS += count;
        else if (j === 'TPA') siswaTPA += count;
      }

      const totalSiswa = siswaKB + siswaTK + siswaSPS + siswaTPA;

      return {
        kecamatanId: String(kec.id),
        kecamatanNama: kec.nama,
        jumlahLembaga: lembagaInKec.length,
        siswaKB,
        siswaTK,
        siswaSPS,
        siswaTPA,
        totalSiswa,
      };
    });
  }, [kecamatanList, recapSourceLembaga, canDrillRecap, focusedKec, searchQuery]);

  const recapTotals = useMemo(() => {
    return kecamatanRecapRows.reduce(
      (acc, row) => ({
        jumlahLembaga: acc.jumlahLembaga + row.jumlahLembaga,
        siswaKB: acc.siswaKB + row.siswaKB,
        siswaTK: acc.siswaTK + row.siswaTK,
        siswaSPS: acc.siswaSPS + row.siswaSPS,
        siswaTPA: acc.siswaTPA + row.siswaTPA,
        totalSiswa: acc.totalSiswa + row.totalSiswa,
      }),
      {
        jumlahLembaga: 0,
        siswaKB: 0,
        siswaTK: 0,
        siswaSPS: 0,
        siswaTPA: 0,
        totalSiswa: 0,
      }
    );
  }, [kecamatanRecapRows]);

  if (!currentUser) return null;

  const handleResetFilters = () => {
    if (canDrillRecap) {
      setFocusedKec('all');
    }
    setSelectedJenjang('all');
    setSearchQuery('');
  };

  const handleFocusKecamatanLembaga = (kecamatanId: string) => {
    if (!canDrillRecap) return;
    setFocusedKec(kecamatanId);
    lembagaSectionRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  };

  const handleExportRekapKecamatanExcel = () => {
    const rows = kecamatanRecapRows.map((r, idx) => ({
      No: idx + 1,
      Kecamatan: r.kecamatanNama,
      'Jumlah Lembaga': r.jumlahLembaga,
      'Siswa KB': r.siswaKB,
      'Siswa TK': r.siswaTK,
      'Siswa SPS': r.siswaSPS,
      'Siswa TPA': r.siswaTPA,
      'Total Siswa': r.totalSiswa,
    }));

    rows.push({
      No:
        recapTotals.jumlahLembaga > 0 || recapTotals.totalSiswa > 0
          ? rows.length + 1
          : 0,
      Kecamatan: 'Total Keseluruhan',
      'Jumlah Lembaga': recapTotals.jumlahLembaga,
      'Siswa KB': recapTotals.siswaKB,
      'Siswa TK': recapTotals.siswaTK,
      'Siswa SPS': recapTotals.siswaSPS,
      'Siswa TPA': recapTotals.siswaTPA,
      'Total Siswa': recapTotals.totalSiswa,
    });

    const worksheet = XLSX.utils.json_to_sheet(rows);
    worksheet['!cols'] = [
      { wch: 6 },
      { wch: 24 },
      { wch: 16 },
      { wch: 12 },
      { wch: 12 },
      { wch: 12 },
      { wch: 12 },
      { wch: 14 },
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Rekap Kecamatan');

    const jenjangTag = selectedJenjang === 'all' ? 'Semua' : selectedJenjang;
    const tanggal = new Date().toISOString().slice(0, 10);
    XLSX.writeFile(
      workbook,
      `Rekap_Kecamatan_PAUDNI_${jenjangTag}_${tanggal}.xlsx`
    );
  };

  const handleExportLembagaExcel = () => {
    const rows = filteredLembaga.map((lem, idx) => ({
      No: idx + 1,
      'Nama Lembaga': lem.nama,
      NPSN: lem.npsn || '-',
      Jenjang: lem.jenjang,
      Kecamatan: lem.kecamatan_nama || '-',
      Desa: lem.desa || '-',
      'Jumlah Siswa': Number(lem.total_siswa ?? 0),
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows);
    worksheet['!cols'] = [
      { wch: 6 },
      { wch: 30 },
      { wch: 14 },
      { wch: 10 },
      { wch: 18 },
      { wch: 18 },
      { wch: 14 },
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Rincian Lembaga');

    const jenjangTag = selectedJenjang === 'all' ? 'Semua' : selectedJenjang;
    const tanggal = new Date().toISOString().slice(0, 10);
    XLSX.writeFile(
      workbook,
      `Rincian_Lembaga_PAUDNI_${jenjangTag}_${tanggal}.xlsx`
    );
  };

  const hasActiveFilter =
    (canDrillRecap && focusedKec !== 'all') ||
    selectedJenjang !== 'all' ||
    searchQuery.trim().length > 0;

  return (
    <AppLayout
      title="Dashboard Rekapitulasi Data"
      subtitle={
        role === 'admin_dinas'
          ? 'Ringkasan data peserta didik dan rekapitulasi 22 kecamatan se-Kabupaten Boyolali'
          : role === 'admin_kecamatan'
            ? `Ringkasan data wilayah Korwil Kecamatan ${currentUser.kecamatan_nama}`
            : `Rekapitulasi kecamatan & pengelolaan data ${currentUser.lembaga_nama || 'sekolah Anda'}`
      }
    >
      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card className="border-blue-100 bg-gradient-to-br from-white to-blue-50/40">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Total Peserta Didik
              </p>
              <h3 className="text-3xl font-extrabold text-blue-900 mt-1">
                {stats.totalSiswa.toLocaleString('id-ID')}
              </h3>
              <p className="text-[11px] text-blue-700 font-medium mt-1">
                KB: {stats.siswaKB} • TK: {stats.siswaTK} • SPS: {stats.siswaSPS} • TPA: {stats.siswaTPA}
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
              <Users className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-indigo-100 bg-gradient-to-br from-white to-indigo-50/40">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Total Lembaga
              </p>
              <h3 className="text-3xl font-extrabold text-indigo-900 mt-1">
                {stats.totalLembaga}
              </h3>
              <p className="text-[11px] text-indigo-600 mt-1">
                KB, TK, SPS, dan TPA
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-500/20">
              <School className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-emerald-100 bg-gradient-to-br from-white to-emerald-50/40">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Sudah Mengunggah
              </p>
              <h3 className="text-3xl font-extrabold text-emerald-800 mt-1">
                {stats.lembagaSudahUnggah}
              </h3>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="text-xs font-bold text-emerald-700">
                  {stats.persenSudahUnggah}%
                </span>
                <span className="text-[11px] text-slate-500">Kepatuhan data</span>
              </div>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-500/20">
              <CheckCircle2 className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-amber-100 bg-gradient-to-br from-white to-amber-50/40">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Belum Unggah Data
              </p>
              <h3 className="text-3xl font-extrabold text-amber-900 mt-1">
                {stats.lembagaBelumUnggah}
              </h3>
              <p className="text-[11px] text-amber-700 mt-1">
                Memerlukan tindak lanjut
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-md shadow-amber-500/20">
              <AlertCircle className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Action CTA: Khusus Operator Sekolah */}
      {role === 'operator_sekolah' && (
        <div className="mb-6 bg-gradient-to-r from-blue-700 to-indigo-800 rounded-2xl p-6 text-white shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/20 text-blue-100 text-xs font-semibold mb-2">
              <UploadCloud className="w-3.5 h-3.5" />
              Fitur Inti Pengumpulan Data
            </div>
            <h3 className="text-lg font-bold">
              Unggah Rekap Data Peserta Didik Melalui Excel
            </h3>
            <p className="text-xs text-blue-100/90 max-w-xl mt-1">
              Cukup unduh template, isi data siswa (NISN, Nama, Tanggal Lahir, Alamat, Orang Tua), dan unggah secara massal. Sistem akan memvalidasi otomatis dalam hitungan detik.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/unggah">
              <Button
                variant="secondary"
                size="md"
                className="bg-white text-blue-900 hover:bg-blue-50 font-semibold"
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Unggah File Sekarang
              </Button>
            </Link>
          </div>
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Kolom Kiri (2 Cols) */}
        <div className="lg:col-span-2 min-w-0 space-y-6">
          {/* Kotak Tunggal: Judul + Filter Minimalis + Tabel Rekap */}
          <Card className="overflow-hidden">
            <div className="p-5 border-b border-slate-100 space-y-3.5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-base font-bold text-slate-900 leading-snug">
                    Rekapitulasi per Kecamatan
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                    {canDrillRecap
                      ? 'Klik jumlah lembaga untuk daftar sekolah, atau klik jumlah siswa per jenjang untuk rincian siswa'
                      : 'Rekapitulasi data per kecamatan (tampilan pantauan, rincian dan pengelolaan data hanya untuk sekolah Anda)'}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {hasActiveFilter && (
                    <button
                      type="button"
                      onClick={handleResetFilters}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition whitespace-nowrap"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      Reset
                    </button>
                  )}
                  <Badge variant="info" className="whitespace-nowrap">
                    {kecamatanRecapRows.length} Kecamatan
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Cari nama kecamatan..."
                    aria-label="Cari kecamatan"
                    className="w-full text-xs border border-slate-200 rounded-lg pl-8 pr-3 py-2 bg-slate-50/70 focus:bg-white text-slate-700 focus:ring-1 focus:ring-blue-600 focus:border-blue-600 outline-none transition"
                  />
                </div>

                <div>
                  <select
                    value={selectedJenjang}
                    onChange={(e) =>
                      setSelectedJenjang(e.target.value as JenjangFilter)
                    }
                    aria-label="Jenjang Pendidikan"
                    className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 bg-slate-50/70 focus:bg-white text-slate-700 focus:ring-1 focus:ring-blue-600 focus:border-blue-600 outline-none transition"
                  >
                    <option value="all">Semua Jenjang</option>
                    <option value="KB">KB (Kelompok Bermain)</option>
                    <option value="TK">TK (Taman Kanak-Kanak)</option>
                    <option value="SPS">SPS (Satuan PAUD Sejenis)</option>
                    <option value="TPA">TPA (Taman Penitipan Anak)</option>
                  </select>
                </div>
              </div>
            </div>

            <CardContent className="p-0 overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold">
                    <th
                      rowSpan={2}
                      className="py-2.5 px-3 border-r border-slate-200 text-center w-11"
                    >
                      No
                    </th>
                    <th
                      rowSpan={2}
                      className="py-2.5 px-4 border-r border-slate-200"
                    >
                      Kecamatan
                    </th>
                    <th
                      rowSpan={2}
                      className="py-2.5 px-3 border-r border-slate-200 text-center"
                    >
                      Jumlah Lembaga
                    </th>
                    <th
                      colSpan={4}
                      className="py-2 px-3 border-b border-r border-slate-200 text-center bg-blue-50/60 text-blue-900"
                    >
                      Jumlah Siswa
                    </th>
                    <th
                      rowSpan={2}
                      className="py-2.5 px-3 text-center bg-slate-50"
                    >
                      Total Siswa
                    </th>
                  </tr>
                  <tr className="bg-blue-50/30 border-b border-slate-200 text-slate-700 font-semibold">
                    <th className="py-2 px-3 border-r border-slate-200 text-center">
                      KB
                    </th>
                    <th className="py-2 px-3 border-r border-slate-200 text-center">
                      TK
                    </th>
                    <th className="py-2 px-3 border-r border-slate-200 text-center">
                      SPS
                    </th>
                    <th className="py-2 px-3 border-r border-slate-200 text-center">
                      TPA
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {kecamatanRecapRows.length === 0 ? (
                    <tr>
                      <td
                        colSpan={8}
                        className="py-8 text-center text-slate-400"
                      >
                        Tidak ada kecamatan yang cocok dengan pencarian.
                      </td>
                    </tr>
                  ) : (
                    kecamatanRecapRows.map((row, idx) => (
                      <tr
                        key={row.kecamatanId}
                        className="hover:bg-slate-50/90 transition"
                      >
                        <td className="py-2.5 px-3 border-r border-slate-100 text-center text-slate-500">
                          {idx + 1}
                        </td>
                        <td className="py-2.5 px-4 border-r border-slate-100 font-semibold text-slate-800">
                          {row.kecamatanNama}
                        </td>

                        <td className="py-2.5 px-3 border-r border-slate-100 text-center">
                          {row.jumlahLembaga > 0 ? (
                            canDrillRecap ? (
                              <button
                                type="button"
                                onClick={() =>
                                  handleFocusKecamatanLembaga(row.kecamatanId)
                                }
                                title={`Lihat ${row.jumlahLembaga} lembaga di Kec. ${row.kecamatanNama}`}
                                className="inline-flex items-center justify-center min-w-[2rem] px-2 py-0.5 rounded-md font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 hover:underline transition"
                              >
                                {row.jumlahLembaga}
                              </button>
                            ) : (
                              <span className="font-semibold text-slate-700">
                                {row.jumlahLembaga}
                              </span>
                            )
                          ) : (
                            <span className="text-slate-400">0</span>
                          )}
                        </td>

                        <td className="py-2.5 px-3 border-r border-slate-100 text-center">
                          {row.siswaKB > 0 ? (
                            canDrillRecap ? (
                              <Link
                                href={`/siswa?kecamatan_id=${row.kecamatanId}&jenjang=KB`}
                                title={`Lihat data siswa KB di Kec. ${row.kecamatanNama}`}
                                className="font-semibold text-purple-700 hover:underline"
                              >
                                {row.siswaKB.toLocaleString('id-ID')}
                              </Link>
                            ) : (
                              <span className="font-semibold text-purple-700">
                                {row.siswaKB.toLocaleString('id-ID')}
                              </span>
                            )
                          ) : (
                            <span className="text-slate-400">0</span>
                          )}
                        </td>

                        <td className="py-2.5 px-3 border-r border-slate-100 text-center">
                          {row.siswaTK > 0 ? (
                            canDrillRecap ? (
                              <Link
                                href={`/siswa?kecamatan_id=${row.kecamatanId}&jenjang=TK`}
                                title={`Lihat data siswa TK di Kec. ${row.kecamatanNama}`}
                                className="font-semibold text-blue-700 hover:underline"
                              >
                                {row.siswaTK.toLocaleString('id-ID')}
                              </Link>
                            ) : (
                              <span className="font-semibold text-blue-700">
                                {row.siswaTK.toLocaleString('id-ID')}
                              </span>
                            )
                          ) : (
                            <span className="text-slate-400">0</span>
                          )}
                        </td>

                        <td className="py-2.5 px-3 border-r border-slate-100 text-center">
                          {row.siswaSPS > 0 ? (
                            canDrillRecap ? (
                              <Link
                                href={`/siswa?kecamatan_id=${row.kecamatanId}&jenjang=SPS`}
                                title={`Lihat data siswa SPS di Kec. ${row.kecamatanNama}`}
                                className="font-semibold text-amber-700 hover:underline"
                              >
                                {row.siswaSPS.toLocaleString('id-ID')}
                              </Link>
                            ) : (
                              <span className="font-semibold text-amber-700">
                                {row.siswaSPS.toLocaleString('id-ID')}
                              </span>
                            )
                          ) : (
                            <span className="text-slate-400">0</span>
                          )}
                        </td>

                        <td className="py-2.5 px-3 border-r border-slate-100 text-center">
                          {row.siswaTPA > 0 ? (
                            canDrillRecap ? (
                              <Link
                                href={`/siswa?kecamatan_id=${row.kecamatanId}&jenjang=TPA`}
                                title={`Lihat data siswa TPA di Kec. ${row.kecamatanNama}`}
                                className="font-semibold text-emerald-700 hover:underline"
                              >
                                {row.siswaTPA.toLocaleString('id-ID')}
                              </Link>
                            ) : (
                              <span className="font-semibold text-emerald-700">
                                {row.siswaTPA.toLocaleString('id-ID')}
                              </span>
                            )
                          ) : (
                            <span className="text-slate-400">0</span>
                          )}
                        </td>

                        <td className="py-2.5 px-3 text-center font-bold text-slate-900 bg-slate-50/50">
                          {row.totalSiswa > 0 ? (
                            canDrillRecap ? (
                              <Link
                                href={`/siswa?kecamatan_id=${row.kecamatanId}`}
                                className="hover:text-blue-700 hover:underline"
                              >
                                {row.totalSiswa.toLocaleString('id-ID')}
                              </Link>
                            ) : (
                              <span>{row.totalSiswa.toLocaleString('id-ID')}</span>
                            )
                          ) : (
                            <span className="text-slate-400 font-normal">0</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-900 text-white font-bold">
                    <td
                      colSpan={2}
                      className="py-3 px-4 border-r border-slate-700"
                    >
                      Total Keseluruhan
                    </td>
                    <td className="py-3 px-3 border-r border-slate-700 text-center">
                      {recapTotals.jumlahLembaga.toLocaleString('id-ID')}
                    </td>
                    <td className="py-3 px-3 border-r border-slate-700 text-center">
                      {recapTotals.siswaKB.toLocaleString('id-ID')}
                    </td>
                    <td className="py-3 px-3 border-r border-slate-700 text-center">
                      {recapTotals.siswaTK.toLocaleString('id-ID')}
                    </td>
                    <td className="py-3 px-3 border-r border-slate-700 text-center">
                      {recapTotals.siswaSPS.toLocaleString('id-ID')}
                    </td>
                    <td className="py-3 px-3 border-r border-slate-700 text-center">
                      {recapTotals.siswaTPA.toLocaleString('id-ID')}
                    </td>
                    <td className="py-3 px-3 text-center bg-blue-900">
                      {recapTotals.totalSiswa.toLocaleString('id-ID')}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </CardContent>
          </Card>

          {/* Rincian Lembaga / Sekolah */}
          <div ref={lembagaSectionRef}>
            <Card className="overflow-hidden">
              <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-start gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center shrink-0 mt-0.5">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">
                      {role === 'operator_sekolah'
                        ? 'Lembaga / Sekolah Anda'
                        : 'Rincian Lembaga / Sekolah'}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {role === 'operator_sekolah'
                        ? 'Kelola dan lihat data peserta didik milik sekolah Anda sendiri'
                        : 'Klik jumlah siswa atau tombol "Lihat Siswa" untuk membuka data lengkap peserta didik per lembaga'}
                    </p>
                  </div>
                </div>
                <Badge variant="default" className="shrink-0">
                  {filteredLembaga.length} Lembaga
                </Badge>
              </div>

              <CardContent className="p-0 overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                      <th className="py-3 px-4">Nama Lembaga</th>
                      <th className="py-3 px-4">Jenjang</th>
                      <th className="py-3 px-4">Kecamatan</th>
                      <th className="py-3 px-4 text-center">Jml Siswa</th>
                      <th className="py-3 px-4 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredLembaga.length === 0 ? (
                      <tr>
                        <td
                          colSpan={5}
                          className="text-center py-8 text-slate-400"
                        >
                          Tidak ada data lembaga yang cocok dengan filter yang dipilih.
                        </td>
                      </tr>
                    ) : (
                      filteredLembaga.map((lem) => (
                        <tr
                          key={lem.id}
                          className="hover:bg-slate-50/80 transition"
                        >
                          <td className="py-3 px-4">
                            <Link
                              href={`/siswa?lembaga_id=${lem.id}`}
                              className="font-semibold text-slate-900 hover:text-blue-700 hover:underline"
                            >
                              {lem.nama}
                            </Link>
                            <p className="text-[11px] text-slate-500">
                              NPSN: {lem.npsn || '-'} • Desa {lem.desa}
                            </p>
                          </td>
                          <td className="py-3 px-4">
                            <JenjangBadge jenjang={lem.jenjang} />
                          </td>
                          <td className="py-3 px-4 text-slate-600">
                            {lem.kecamatan_nama}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <Link
                              href={`/siswa?lembaga_id=${lem.id}`}
                              title={`Buka data siswa ${lem.nama}`}
                              className="inline-flex items-center justify-center min-w-[2rem] px-2 py-0.5 rounded-md font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 hover:underline transition"
                            >
                              {lem.total_siswa ?? 0}
                            </Link>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <Link
                              href={`/siswa?lembaga_id=${lem.id}`}
                              className="text-blue-700 hover:text-blue-900 font-semibold text-xs hover:underline"
                            >
                              {role === 'operator_sekolah'
                                ? 'Kelola Siswa →'
                                : 'Lihat Siswa →'}
                            </Link>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Kolom Kanan (1 Col): Distribusi Jenjang & Cetak Rekapitulasi */}
        <div className="min-w-0 space-y-4">
          <Card>
            <div className="p-5 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">
                Distribusi Jenjang
              </h3>
            </div>
            <CardContent className="p-5 space-y-4">
              <div>
                <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                  <span>KB (Kelompok Bermain)</span>
                  <span>{stats.siswaKB} Siswa</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2.5">
                  <div
                    className="bg-purple-600 h-2.5 rounded-full"
                    style={{
                      width: `${stats.totalSiswa > 0
                          ? (stats.siswaKB / stats.totalSiswa) * 100
                          : 0
                        }%`,
                    }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                  <span>TK (Taman Kanak-Kanak)</span>
                  <span>{stats.siswaTK} Siswa</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2.5">
                  <div
                    className="bg-blue-600 h-2.5 rounded-full"
                    style={{
                      width: `${stats.totalSiswa > 0
                          ? (stats.siswaTK / stats.totalSiswa) * 100
                          : 0
                        }%`,
                    }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                  <span>SPS (Satuan PAUD Sejenis)</span>
                  <span>{stats.siswaSPS} Siswa</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2.5">
                  <div
                    className="bg-amber-500 h-2.5 rounded-full"
                    style={{
                      width: `${stats.totalSiswa > 0
                          ? (stats.siswaSPS / stats.totalSiswa) * 100
                          : 0
                        }%`,
                    }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                  <span>TPA (Taman Penitipan Anak)</span>
                  <span>{stats.siswaTPA} Siswa</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2.5">
                  <div
                    className="bg-emerald-600 h-2.5 rounded-full"
                    style={{
                      width: `${stats.totalSiswa > 0
                          ? (stats.siswaTPA / stats.totalSiswa) * 100
                          : 0
                        }%`,
                    }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900 text-white border-slate-800">
            <CardContent className="p-5">
              <h4 className="font-bold text-sm text-white mb-1">
                Cetak &amp; Ekspor Rekapitulasi
              </h4>
              <p className="text-xs text-slate-400 mb-4">
                Unduh file Excel terstruktur sesuai filter aktif atau buka halaman laporan lengkap.
              </p>
              <div className="flex flex-col gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleExportRekapKecamatanExcel}
                  className="w-full justify-between bg-slate-800 text-white border-slate-700 hover:bg-slate-700"
                  leftIcon={<Download className="w-3.5 h-3.5 text-emerald-400" />}
                  rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                >
                  Cetak Excel Rekap Kecamatan
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleExportLembagaExcel}
                  className="w-full justify-between bg-slate-800 text-white border-slate-700 hover:bg-slate-700"
                  leftIcon={<Download className="w-3.5 h-3.5 text-blue-400" />}
                  rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                >
                  Cetak Excel Rincian Lembaga
                </Button>
                <Link href="/laporan">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-between bg-slate-800 text-white border-slate-700 hover:bg-slate-700"
                    leftIcon={<FileText className="w-3.5 h-3.5 text-slate-300" />}
                    rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                  >
                    Halaman Laporan Lengkap
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}