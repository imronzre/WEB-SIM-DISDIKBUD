'use client';

import React, { useState, useEffect } from 'react';
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
} from 'lucide-react';
import AppLayout from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge, JenjangBadge } from '@/components/ui/Badge';
import { AppDataStore } from '@/lib/store';
import { Lembaga, UserProfile, Kecamatan, normalizeRole } from '@/lib/types';
import { formatDateIndo } from '@/lib/utils';

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
  const [selectedKec, setSelectedKec] = useState<string>('all');

  useEffect(() => {
    const user = AppDataStore.getCurrentUser();
    setCurrentUser(user);
    const role = normalizeRole(user.role);

    const s = AppDataStore.getStats(user);
    setStats(s);

    let l = AppDataStore.getLembagaList();
    if (role === 'admin_kecamatan' && user.kecamatan_id) {
      l = l.filter((item) => item.kecamatan_id === user.kecamatan_id);
    } else if (role === 'operator_sekolah' && user.lembaga_id) {
      l = l.filter((item) => item.id === user.lembaga_id);
    }
    setLembagaList(l);

    setKecamatanList(AppDataStore.getKecamatan());
  }, []);

  if (!currentUser) return null;

  const role = normalizeRole(currentUser.role);

  const filteredLembaga = lembagaList.filter((item) => {
    if (selectedKec !== 'all' && item.kecamatan_id !== selectedKec) return false;
    return true;
  });

  return (
    <AppLayout
      title="Dashboard Rekapitulasi Data"
      subtitle={
        role === 'admin_dinas'
          ? 'Ringkasan data peserta didik dan kepatuhan unggah lembaga se-Kabupaten Boyolali'
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
                TK: {stats.siswaTK} • KB: {stats.siswaKB} • SPS: {stats.siswaSPS} • TPA: {stats.siswaTPA}
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
                TK, KB, SPS, dan TPA
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

      {/* Main Grid: Rekap Status Lembaga & Breakdown Jenjang */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Table Kepatuhan Unggah Lembaga (2 Cols) */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <CardTitle>Status Kepatuhan Unggah Lembaga</CardTitle>
                <p className="text-xs text-slate-500 mt-0.5">
                  Menampilkan status kelengkapan data per lembaga
                </p>
              </div>

              {role === 'admin_dinas' && (
                <div className="flex items-center gap-2">
                  <Filter className="w-3.5 h-3.5 text-slate-400" />
                  <select
                    value={selectedKec}
                    onChange={(e) => setSelectedKec(e.target.value)}
                    className="text-xs border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white text-slate-700 focus:ring-1 focus:ring-blue-600 outline-none"
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
                      <td colSpan={6} className="text-center py-8 text-slate-400">
                        Tidak ada data lembaga yang cocok dengan filter.
                      </td>
                    </tr>
                  ) : (
                    filteredLembaga.map((lem) => (
                      <tr key={lem.id} className="hover:bg-slate-50/80 transition">
                        <td className="py-3 px-4">
                          <p className="font-semibold text-slate-900">{lem.nama}</p>
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
                        <td className="py-3 px-4 text-center font-bold text-slate-800">
                          {lem.total_siswa ?? 0}
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
                          <Link href={`/siswa?lembaga_id=${lem.id}`}>
                            <button className="text-blue-700 hover:text-blue-900 font-semibold text-xs hover:underline">
                              Lihat Siswa →
                            </button>
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

        {/* Breakdown Card & Quick Links (1 Col) */}
        <div className="space-y-4">
          {/* Card Proporsi Jenjang */}
          <Card>
            <CardHeader>
              <CardTitle>Distribusi Jenjang</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                  <span>TK (Taman Kanak-Kanak)</span>
                  <span>{stats.siswaTK} Siswa</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2.5">
                  <div
                    className="bg-blue-600 h-2.5 rounded-full"
                    style={{
                      width: `${stats.totalSiswa > 0 ? (stats.siswaTK / stats.totalSiswa) * 100 : 0
                        }%`,
                    }}
                  ></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                  <span>KB (Kelompok Bermain)</span>
                  <span>{stats.siswaKB} Siswa</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2.5">
                  <div
                    className="bg-purple-600 h-2.5 rounded-full"
                    style={{
                      width: `${stats.totalSiswa > 0 ? (stats.siswaKB / stats.totalSiswa) * 100 : 0
                        }%`,
                    }}
                  ></div>
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
                      width: `${stats.totalSiswa > 0 ? (stats.siswaSPS / stats.totalSiswa) * 100 : 0
                        }%`,
                    }}
                  ></div>
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
                      width: `${stats.totalSiswa > 0 ? (stats.siswaTPA / stats.totalSiswa) * 100 : 0
                        }%`,
                    }}
                  ></div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Navigasi Berjenjang Shortcut */}
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