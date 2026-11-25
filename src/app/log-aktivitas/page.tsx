'use client';

import React, { useState, useEffect } from 'react';
import { History, Search, ShieldAlert, Clock, User, Filter } from 'lucide-react';
import AppLayout from '@/components/layout/AppLayout';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { AppDataStore } from '@/lib/store';
import { ActivityLog, UserProfile } from '@/lib/types';
import { formatDateTimeIndo } from '@/lib/utils';

export default function LogAktivitasPage() {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAksi, setSelectedAksi] = useState('all');

  useEffect(() => {
    const user = AppDataStore.getCurrentUser();
    setCurrentUser(user);
    setLogs(AppDataStore.getActivityLogs());
  }, []);

  if (!currentUser) return null;

  // PRD Rule: Admin only can view activity logs
  if (currentUser.role !== 'admin') {
    return (
      <AppLayout title="Akses Dibatasi">
        <div className="p-8 text-center bg-white rounded-xl border border-slate-200">
          <ShieldAlert className="w-12 h-12 mx-auto text-amber-500 mb-3" />
          <h3 className="text-base font-bold text-slate-800">
            Akses Dibatasi Khusus Admin Dinas
          </h3>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
            Hanya Administrator Dinas Pendidikan dan Kebudayaan yang berhak memantau log aktivitas sistem.
          </p>
        </div>
      </AppLayout>
    );
  }

  const filteredLogs = logs.filter((l) => {
    if (selectedAksi !== 'all' && l.aksi !== selectedAksi) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      return (
        l.user_nama.toLowerCase().includes(q) ||
        (l.detail && l.detail.toLowerCase().includes(q)) ||
        l.aksi.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const getAksiBadge = (aksi: string) => {
    switch (aksi) {
      case 'LOGIN':
        return <Badge variant="info">LOGIN</Badge>;
      case 'UNGGAH_DATA':
        return <Badge variant="success">UNGGAH DATA</Badge>;
      case 'TAMBAH_SISWA':
      case 'TAMBAH_LEMBAGA':
      case 'BUAT_AKUN':
        return <Badge variant="purple">{aksi}</Badge>;
      case 'UBAH_SISWA':
      case 'UBAH_LEMBAGA':
      case 'RESET_PASSWORD':
        return <Badge variant="warning">{aksi}</Badge>;
      case 'HAPUS_SISWA':
        return <Badge variant="danger">HAPUS SISWA</Badge>;
      default:
        return <Badge variant="default">{aksi}</Badge>;
    }
  };

  return (
    <AppLayout
      title="Log Aktivitas & Audit Trail"
      subtitle="Catatan riwayat seluruh aktivitas masuk, perubahan data, dan pengunggahan berkas"
      breadcrumbs={[{ label: 'Log Aktivitas' }]}
    >
      {/* Filter Card */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Pencarian Pengguna / Keterangan
              </label>
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Ketik nama atau kata kunci..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg outline-none focus:ring-1 focus:ring-blue-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Filter Tipe Aktivitas
              </label>
              <select
                value={selectedAksi}
                onChange={(e) => setSelectedAksi(e.target.value)}
                className="w-full text-xs border border-slate-300 rounded-lg px-3 py-1.5 bg-white text-slate-700 outline-none focus:ring-1 focus:ring-blue-600"
              >
                <option value="all">Semua Jenis Aktivitas</option>
                <option value="LOGIN">Masuk (LOGIN)</option>
                <option value="UNGGAH_DATA">Pengunggahan Excel (UNGGAH_DATA)</option>
                <option value="TAMBAH_SISWA">Tambah Siswa</option>
                <option value="UBAH_SISWA">Ubah Siswa</option>
                <option value="HAPUS_SISWA">Hapus Siswa</option>
                <option value="BUAT_AKUN">Buat Akun</option>
                <option value="RESET_PASSWORD">Reset Kata Sandi</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Logs Table */}
      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                <th className="py-3 px-4 w-44">Waktu Kejadian</th>
                <th className="py-3 px-4 w-52">Nama Pengguna & Peran</th>
                <th className="py-3 px-4 w-36">Jenis Aksi</th>
                <th className="py-3 px-4">Rincian / Detail Aktivitas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-slate-400">
                    Tidak ada catatan aktivitas yang cocok.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50">
                    <td className="py-2.5 px-4 text-slate-600 flex items-center gap-1.5 font-mono">
                      <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{formatDateTimeIndo(log.created_at)}</span>
                    </td>
                    <td className="py-2.5 px-4">
                      <p className="font-semibold text-slate-900">{log.user_nama}</p>
                      <span className="text-[10px] text-slate-400 uppercase font-mono">
                        {log.user_role}
                      </span>
                    </td>
                    <td className="py-2.5 px-4">{getAksiBadge(log.aksi)}</td>
                    <td className="py-2.5 px-4 text-slate-700">{log.detail}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </AppLayout>
  );
}
