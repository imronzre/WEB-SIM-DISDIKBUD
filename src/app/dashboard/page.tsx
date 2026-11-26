'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import {
  Users,
  School,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  FileText,
  ArrowRight,
  Filter,
  RotateCcw,
  Search,
  Building2,
} from 'lucide-react';
import AppLayout from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge, JenjangBadge } from '@/components/ui/Badge';
import { AppDataStore } from '@/lib/store';
import {
  Lembaga,
  UserProfile,
  Kecamatan,
  normalizeRole,
} from '@/lib/types';
import { formatDateIndo } from '@/lib/utils';

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

  // Filter utama (Kecamatan, Jenjang, Pencarian)
  const [selectedKec, setSelectedKec] = useState<string>('all');
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
    let l = AppDataStore.getLembagaList();

    if (role === 'admin_kecamatan' && user.kecamatan_id) {
      l = l.filter((item) => item.kecamatan_id === user.kecamatan_id);
      setKecamatanList(allKec.filter((k) => k.id === user.kecamatan_id));
      setSelectedKec(user.kecamatan_id);
    } else if (role === 'operator_sekolah' && user.lembaga_id) {
      l = l.filter((item) => item.id === user.lembaga_id);
      const ownLembaga = l[0];
      if (ownLembaga) {
        setKecamatanList(
          allKec.filter((k) => k.id === ownLembaga.kecamatan_id)
        );
        setSelectedKec(ownLembaga.kecamatan_id);
      } else {
        setKecamatanList(allKec);
      }
    } else {
      setKecamatanList(allKec);
    }

    setLembagaList(l);
  }, []);

  const role = currentUser ? normalizeRole(currentUser.role) : 'admin_dinas';

  // Lembaga yang lolos filter kecamatan & jenjang
  const filteredLembaga = useMemo(() => {
    return lembagaList.filter((item) => {
      if (selectedKec !== 'all' && item.kecamatan_id !== selectedKec) {
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
  }, [lembagaList, selectedKec, selectedJenjang]);

  // Rekapitulasi per 22 Kecamatan (mengikuti filter kecamatan, jenjang, dan pencarian nama kecamatan)
  const kecamatanRecapRows: KecamatanRecapRow[] = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    const targetKecamatan = kecamatanList.filter((k) => {
      if (selectedKec !== 'all' && k.id !== selectedKec) return false;
      if (q && !k.nama.toLowerCase().includes(q)) return false;
      return true;
    });

    return targetKecamatan.map((kec) => {
      const lembagaInKec = filteredLembaga.filter(
        (l) => l.kecamatan_id === kec.id
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
        kecamatanId: kec.id,
        kecamatanNama: kec.nama,
        jumlahLembaga: lembagaInKec.length,
        siswaKB,
        siswaTK,
        siswaSPS,
        siswaTPA,
        totalSiswa,
      };
    });
  }, [kecamatanList, filteredLembaga, selectedKec, searchQuery]);

  // Baris Total Keseluruhan
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
    if (role === 'admin_dinas') {
      setSelectedKec('all');
    }
    setSelectedJenjang('all');
    setSearchQuery('');
  };

  const handleFocusKecamatanLembaga = (kecamatanId: string) => {
    setSelectedKec(kecamatanId);
    lembagaSectionRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  };

  const hasActiveFilter =
    (role === 'admin_dinas' && selectedKec !== 'all') ||
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
            : `Ringkasan data peserta didik ${currentUser.lembaga_nama}`
      }
    >
      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Total Siswa */}
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

        {/* Total Lembaga */}
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

        {/* Lembaga Sudah Unggah */}
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

        {/* Lembaga Belum Unggah */}
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

      {/* Quick Action CTA for Lembaga & Dinas */}
      {role !== 'admin_kecamatan' && (
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

      {/* Main Grid: Satu Kotak Filter + Rekap 22 Kecamatan & Breakdown Jenjang */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Kolom Kiri (2 Cols): Kotak Tunggal Filter + Tabel Rekap Kecamatan, lalu Rincian Lembaga */}
        <div className="lg:col-span-2 space-y-6">
          {/* Kotak Tunggal: Header + Filter + Tabel Rekapitulasi Per Kecamatan */}
          <Card>
            <CardHeader className="border-b border-slate-100 pb-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Rekapitulasi Data Lembaga &amp; Siswa per Kecamatan
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Klik angka jumlah lembaga untuk melihat daftar sekolah, atau klik jumlah siswa per jenjang untuk rincian peserta didik
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {hasActiveFilter && (
                    <button
                      type="button"
                      onClick={handleResetFilters}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-blue-700 hover:text-blue-900"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      Reset
                    </button>
                  )}
                  <Badge variant="info">
                    {kecamatanRecapRows.length} Kecamatan
                  </Badge>
                </div>
              </div>

              {/* Baris Filter di Dalam Kotak yang Sama */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-100">
                <div>
                  <label className="flex items-center gap-1 text-[11px] font-semibold text-slate-600 mb-1">
                    <Filter className="w-3 h-3 text-blue-600" />
                    Kecamatan
                  </label>
                  <select
                    value={selectedKec}
                    disabled={role !== 'admin_dinas'}
                    onChange={(e) => setSelectedKec(e.target.value)}
                    className="w-full text-xs border border-slate-300 rounded-lg px-3 py-1.5 bg-white text-slate-700 focus:ring-1 focus:ring-blue-600 outline-none disabled:bg-slate-100 disabled:text-slate-500"
                  >
                    {role === 'admin_dinas' && (
                      <option value="all">
                        Semua Kecamatan ({kecamatanList.length})
                      </option>
                    )}
                    {kecamatanList.map((k) => (
                      <option key={k.id} value={k.id}>
                        Kec. {k.nama}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Jenjang Pendidikan
                  </label>
                  <select
                    value={selectedJenjang}
                    onChange={(e) =>
                      setSelectedJenjang(e.target.value as JenjangFilter)
                    }
                    className="w-full text-xs border border-slate-300 rounded-lg px-3 py-1.5 bg-white text-slate-700 focus:ring-1 focus:ring-blue-600 outline-none"
                  >
                    <option value="all">Semua Jenjang (KB, TK, SPS, TPA)</option>
                    <option value="KB">KB (Kelompok Bermain)</option>
                    <option value="TK">TK (Taman Kanak-Kanak)</option>
                    <option value="SPS">SPS (Satuan PAUD Sejenis)</option>
                    <option value="TPA">TPA (Taman Penitipan Anak)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Cari Kecamatan
                  </label>
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Ketik nama kecamatan..."
                      className="w-full text-xs border border-slate-300 rounded-lg pl-8 pr-3 py-1.5 bg-white text-slate-700 focus:ring-1 focus:ring-blue-600 outline-none"
                    />
                  </div>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-0 overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 font-bold">
                    <th
                      rowSpan={2}
                      className="py-2.5 px-3 border-r border-slate-200 text-center w-10"
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
                      className="py-2 px-3 border-b border-r border-slate-200 text-center bg-blue-50/70 text-blue-900"
                    >
                      Jumlah Siswa
                    </th>
                    <th
                      rowSpan={2}
                      className="py-2.5 px-3 text-center bg-slate-100"
                    >
                      Total Siswa
                    </th>
                  </tr>
                  <tr className="bg-blue-50/40 border-b border-slate-200 text-slate-700 font-semibold">
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
                        Tidak ada kecamatan yang cocok dengan filter.
                      </td>
                    </tr>
                  ) : (
                    kecamatanRecapRows.map((row, idx) => (
                      <tr
                        key={row.kecamatanId}
                        className="hover:bg-blue-50/30 transition"
                      >
                        <td className="py-2.5 px-3 border-r border-slate-100 text-center text-slate-500">
                          {idx + 1}
                        </td>
                        <td className="py-2.5 px-4 border-r border-slate-100 font-semibold text-slate-800">
                          {row.kecamatanNama}
                        </td>

                        {/* Jumlah Lembaga (klik untuk melihat daftar lembaga di kecamatan tersebut) */}
                        <td className="py-2.5 px-3 border-r border-slate-100 text-center">
                          {row.jumlahLembaga > 0 ? (
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
                            <span className="text-slate-400">0</span>
                          )}
                        </td>

                        {/* Jumlah Siswa KB */}
                        <td className="py-2.5 px-3 border-r border-slate-100 text-center">
                          {row.siswaKB > 0 ? (
                            <Link
                              href={`/siswa?kecamatan_id=${row.kecamatanId}&jenjang=KB`}
                              title={`Lihat data siswa KB di Kec. ${row.kecamatanNama}`}
                              className="font-semibold text-purple-700 hover:underline"
                            >
                              {row.siswaKB.toLocaleString('id-ID')}
                            </Link>
                          ) : (
                            <span className="text-slate-400">0</span>
                          )}
                        </td>

                        {/* Jumlah Siswa TK */}
                        <td className="py-2.5 px-3 border-r border-slate-100 text-center">
                          {row.siswaTK > 0 ? (
                            <Link
                              href={`/siswa?kecamatan_id=${row.kecamatanId}&jenjang=TK`}
                              title={`Lihat data siswa TK di Kec. ${row.kecamatanNama}`}
                              className="font-semibold text-blue-700 hover:underline"
                            >
                              {row.siswaTK.toLocaleString('id-ID')}
                            </Link>
                          ) : (
                            <span className="text-slate-400">0</span>
                          )}
                        </td>

                        {/* Jumlah Siswa SPS */}
                        <td className="py-2.5 px-3 border-r border-slate-100 text-center">
                          {row.siswaSPS > 0 ? (
                            <Link
                              href={`/siswa?kecamatan_id=${row.kecamatanId}&jenjang=SPS`}
                              title={`Lihat data siswa SPS di Kec. ${row.kecamatanNama}`}
                              className="font-semibold text-amber-700 hover:underline"
                            >
                              {row.siswaSPS.toLocaleString('id-ID')}
                            </Link>
                          ) : (
                            <span className="text-slate-400">0</span>
                          )}
                        </td>

                        {/* Jumlah Siswa TPA */}
                        <td className="py-2.5 px-3 border-r border-slate-100 text-center">
                          {row.siswaTPA > 0 ? (
                            <Link
                              href={`/siswa?kecamatan_id=${row.kecamatanId}&jenjang=TPA`}
                              title={`Lihat data siswa TPA di Kec. ${row.kecamatanNama}`}
                              className="font-semibold text-emerald-700 hover:underline"
                            >
                              {row.siswaTPA.toLocaleString('id-ID')}
                            </Link>
                          ) : (
                            <span className="text-slate-400">0</span>
                          )}
                        </td>

                        {/* Total Siswa Kecamatan */}
                        <td className="py-2.5 px-3 text-center font-bold text-slate-900 bg-slate-50/60">
                          {row.totalSiswa > 0 ? (
                            <Link
                              href={`/siswa?kecamatan_id=${row.kecamatanId}`}
                              className="hover:text-blue-700 hover:underline"
                            >
                              {row.totalSiswa.toLocaleString('id-ID')}
                            </Link>
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

          {/* Rincian Lembaga / Sekolah (Klik untuk melihat data lengkap siswa di lembaga) */}
          <div ref={lembagaSectionRef}>
            <Card>
              <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-start gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center shrink-0 mt-0.5">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">
                      Rincian Lembaga / Sekolah
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Klik jumlah siswa atau tombol &ldquo;Lihat Siswa&rdquo; untuk membuka data lengkap peserta didik per lembaga
                    </p>
                  </div>
                </div>
                <Badge variant="default">
                  {filteredLembaga.length} Lembaga
                </Badge>
              </CardHeader>

              <CardContent className="p-0 overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                      <th className="py-3 px-4">Nama Lembaga</th>
                      <th className="py-3 px-4">Jenjang</th>
                      <th className="py-3 px-4">Kecamatan</th>
                      <th className="py-3 px-4 text-center">Jml Siswa</th>
                      <th className="py-3 px-4">Status Update</th>
                      <th className="py-3 px-4 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredLembaga.length === 0 ? (
                      <tr>
                        <td
                          colSpan={6}
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
                          <td className="py-3 px-4">
                            {lem.last_upload ? (
                              <div>
                                <Badge variant="success">Sudah Unggah</Badge>
                                <p className="text-[10px] text-slate-400 mt-0.5">
                                  {formatDateIndo(lem.last_upload)}
                                </p>
                              </div>
                            ) : (
                              <Badge variant="warning">Belum Ada Data</Badge>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <Link
                              href={`/siswa?lembaga_id=${lem.id}`}
                              className="text-blue-700 hover:text-blue-900 font-semibold text-xs hover:underline"
                            >
                              Lihat Siswa →
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

        {/* Kolom Kanan (1 Col): Distribusi Jenjang & Navigasi Cepat */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <h3 className="text-base font-bold text-slate-900">
                Distribusi Jenjang
              </h3>
            </CardHeader>
            <CardContent className="space-y-4">
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
                Tampilan Berjenjang (Hierarki)
              </h4>
              <p className="text-xs text-slate-400 mb-4">
                Telusuri data dari tingkat Kecamatan, pilih Lembaga, hingga rincian setiap peserta didik.
              </p>
              <div className="flex flex-col gap-2">
                <Link href="/lembaga">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-between bg-slate-800 text-white border-slate-700 hover:bg-slate-700"
                    rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                  >
                    Buka Direktori Lembaga
                  </Button>
                </Link>
                <Link href="/laporan">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-between bg-slate-800 text-white border-slate-700 hover:bg-slate-700"
                    rightIcon={<FileText className="w-3.5 h-3.5" />}
                  >
                    Cetak Laporan Rekapitulasi
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