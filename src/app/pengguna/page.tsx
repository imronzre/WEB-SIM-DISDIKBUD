'use client';

import React, { useState, useEffect } from 'react';
import {
  UserCog,
  Plus,
  Search,
  KeyRound,
  Shield,
  School,
  MapPin,
  CheckCircle2,
  XCircle,
  ShieldAlert,
} from 'lucide-react';
import AppLayout from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { AppDataStore } from '@/lib/store';
import { UserProfile, Role, Kecamatan, Lembaga } from '@/lib/types';
import { formatDateIndo } from '@/lib/utils';

export default function PenggunaPage() {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [usersList, setUsersList] = useState<UserProfile[]>([]);
  const [kecamatanList, setKecamatanList] = useState<Kecamatan[]>([]);
  const [lembagaList, setLembagaList] = useState<Lembaga[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');

  // Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [resetModalUser, setResetModalUser] = useState<UserProfile | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [alertSuccess, setAlertSuccess] = useState('');

  // Form State
  const [formNama, setFormNama] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formRole, setFormRole] = useState<Role>('lembaga');
  const [formKecamatanId, setFormKecamatanId] = useState('');
  const [formLembagaId, setFormLembagaId] = useState('');
  const [formError, setFormError] = useState('');

  const loadData = () => {
    const user = AppDataStore.getCurrentUser();
    setCurrentUser(user);

    const kec = AppDataStore.getKecamatan();
    setKecamatanList(kec);
    if (kec.length > 0 && !formKecamatanId) setFormKecamatanId(kec[0].id);

    const lem = AppDataStore.getLembagaList();
    setLembagaList(lem);
    if (lem.length > 0 && !formLembagaId) setFormLembagaId(lem[0].id);

    // Initial users list
    setUsersList([
      {
        id: 'usr-admin',
        nama: 'Admin Dinas PAUDNI',
        email: 'admin@boyolali.go.id',
        role: 'admin',
        created_at: '2026-11-01T08:00:00Z',
      },
      {
        id: 'usr-kec-boyolali',
        nama: 'Petugas Korwil Kec. Boyolali',
        email: 'kec.boyolali@boyolali.go.id',
        role: 'kecamatan',
        kecamatan_id: 'kec-boyolali',
        kecamatan_nama: 'Boyolali',
        created_at: '2026-11-02T09:00:00Z',
      },
      {
        id: 'usr-kec-mojosongo',
        nama: 'Petugas Korwil Kec. Mojosongo',
        email: 'kec.mojosongo@boyolali.go.id',
        role: 'kecamatan',
        kecamatan_id: 'kec-mojosongo',
        kecamatan_nama: 'Mojosongo',
        created_at: '2026-11-02T09:30:00Z',
      },
      {
        id: 'usr-lem-1',
        nama: 'Operator TK Negeri Pembina',
        email: 'tk.pembina@boyolali.go.id',
        role: 'lembaga',
        kecamatan_id: 'kec-boyolali',
        kecamatan_nama: 'Boyolali',
        lembaga_id: 'lem-1',
        lembaga_nama: 'TK Negeri Pembina Boyolali',
        created_at: '2026-11-03T10:00:00Z',
      },
      {
        id: 'usr-lem-2',
        nama: 'Operator PAUD Permata Hati',
        email: 'paud.permata@boyolali.go.id',
        role: 'lembaga',
        kecamatan_id: 'kec-mojosongo',
        kecamatan_nama: 'Mojosongo',
        lembaga_id: 'lem-2',
        lembaga_nama: 'PAUD Permata Hati Mojosongo',
        created_at: '2026-11-03T11:00:00Z',
      },
      {
        id: 'usr-lem-3',
        nama: 'Kader Posyandu Melati 1',
        email: 'posyandu.melati@boyolali.go.id',
        role: 'lembaga',
        kecamatan_id: 'kec-banyudono',
        kecamatan_nama: 'Banyudono',
        lembaga_id: 'lem-3',
        lembaga_nama: 'Posyandu Melati I Banyudono',
        created_at: '2026-11-04T08:30:00Z',
      },
    ]);
  };

  useEffect(() => {
    loadData();
  }, []);

  if (!currentUser) return null;

  // PRD Security: Admin only
  if (currentUser.role !== 'admin') {
    return (
      <AppLayout title="Akses Dibatasi">
        <div className="p-8 text-center bg-white rounded-xl border border-slate-200">
          <ShieldAlert className="w-12 h-12 mx-auto text-amber-500 mb-3" />
          <h3 className="text-base font-bold text-slate-800">
            Akses Dibatasi Khusus Admin Dinas
          </h3>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
            Hanya Administrator Dinas Pendidikan dan Kebudayaan yang berhak mengelola akun pengguna sistem.
          </p>
        </div>
      </AppLayout>
    );
  }

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!formNama.trim() || !formEmail.trim() || !formPassword.trim()) {
      setFormError('Nama, email, dan kata sandi wajib diisi.');
      return;
    }

    const kecObj = kecamatanList.find((k) => k.id === formKecamatanId);
    const lemObj = lembagaList.find((l) => l.id === formLembagaId);

    const newUser: UserProfile = {
      id: `usr-${Date.now()}`,
      nama: formNama.trim(),
      email: formEmail.trim().toLowerCase(),
      role: formRole,
      kecamatan_id: formRole === 'kecamatan' ? formKecamatanId : lemObj?.kecamatan_id || null,
      kecamatan_nama: formRole === 'kecamatan' ? kecObj?.nama : lemObj?.kecamatan_nama || null,
      lembaga_id: formRole === 'lembaga' ? formLembagaId : null,
      lembaga_nama: formRole === 'lembaga' ? lemObj?.nama : null,
      created_at: new Date().toISOString(),
    };

    setUsersList((prev) => [newUser, ...prev]);
    AppDataStore.addActivityLog(
      'BUAT_AKUN',
      `Membuat akun pengguna baru: ${newUser.nama} (${newUser.email}) - Role: ${newUser.role}`,
      currentUser
    );

    setIsAddModalOpen(false);
    setAlertSuccess(`Akun untuk ${newUser.nama} berhasil dibuat.`);
    setTimeout(() => setAlertSuccess(''), 4000);
  };

  const handleResetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetModalUser || !newPassword) return;

    AppDataStore.addActivityLog(
      'RESET_PASSWORD',
      `Mereset kata sandi akun ${resetModalUser.nama} (${resetModalUser.email})`,
      currentUser
    );

    setResetModalUser(null);
    setNewPassword('');
    setAlertSuccess(`Kata sandi untuk ${resetModalUser.nama} berhasil direset.`);
    setTimeout(() => setAlertSuccess(''), 4000);
  };

  const filteredUsers = usersList.filter((u) => {
    if (roleFilter !== 'all' && u.role !== roleFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      return (
        u.nama.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (u.lembaga_nama && u.lembaga_nama.toLowerCase().includes(q)) ||
        (u.kecamatan_nama && u.kecamatan_nama.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <AppLayout
      title="Manajemen Akun Pengguna"
      subtitle="Kelola akun Administrator Dinas, Korwil Kecamatan, dan Operator Lembaga PAUDNI"
      breadcrumbs={[{ label: 'Manajemen Akun' }]}
    >
      {alertSuccess && (
        <div className="mb-4 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{alertSuccess}</span>
        </div>
      )}

      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <span className="text-xs font-semibold text-slate-500">
            Total <strong className="text-blue-700">{filteredUsers.length}</strong> akun terdaftar
          </span>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={() => setIsAddModalOpen(true)}
          leftIcon={<Plus className="w-4 h-4" />}
        >
          Buat Akun Baru
        </Button>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Pencarian Pengguna / Email
              </label>
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Ketik nama atau email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg outline-none focus:ring-1 focus:ring-blue-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Filter Peran (Role)
              </label>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="w-full text-xs border border-slate-300 rounded-lg px-3 py-1.5 bg-white text-slate-700 outline-none focus:ring-1 focus:ring-blue-600"
              >
                <option value="all">Semua Peran</option>
                <option value="admin">Admin Dinas</option>
                <option value="kecamatan">Kecamatan (Korwil)</option>
                <option value="lembaga">Lembaga (TK/PAUD/Posyandu)</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                <th className="py-3 px-4">Nama Lengkap & Email</th>
                <th className="py-3 px-4">Peran (Role)</th>
                <th className="py-3 px-4">Afiliasi Wilayah / Lembaga</th>
                <th className="py-3 px-4">Dibuat Pada</th>
                <th className="py-3 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUsers.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50">
                  <td className="py-3 px-4">
                    <p className="font-bold text-slate-900">{u.nama}</p>
                    <p className="text-[11px] text-slate-500 font-mono">{u.email}</p>
                  </td>
                  <td className="py-3 px-4">
                    {u.role === 'admin' && (
                      <Badge variant="danger">Admin Dinas</Badge>
                    )}
                    {u.role === 'kecamatan' && (
                      <Badge variant="warning">Kecamatan</Badge>
                    )}
                    {u.role === 'lembaga' && (
                      <Badge variant="success">Lembaga</Badge>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    {u.lembaga_nama && (
                      <p className="font-medium text-slate-800">{u.lembaga_nama}</p>
                    )}
                    {u.kecamatan_nama && (
                      <p className="text-[11px] text-slate-500">
                        Kec. {u.kecamatan_nama}
                      </p>
                    )}
                    {!u.lembaga_nama && !u.kecamatan_nama && (
                      <span className="text-slate-400">Pusat / Dinas</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-slate-500">
                    {formatDateIndo(u.created_at)}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-[11px] py-1"
                      onClick={() => setResetModalUser(u)}
                      leftIcon={<KeyRound className="w-3.5 h-3.5" />}
                    >
                      Reset Password
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Modal Buat Akun */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Buat Akun Pengguna Baru"
        description="Admin dinas membuat akun secara terpusat untuk kecamatan atau lembaga."
      >
        <form onSubmit={handleCreateUser} className="space-y-4 text-xs">
          {formError && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700">
              {formError}
            </div>
          )}

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Nama Lengkap Petugas *
            </label>
            <input
              type="text"
              required
              value={formNama}
              onChange={(e) => setFormNama(e.target.value)}
              placeholder="Contoh: Petugas Korwil Sambi"
              className="w-full border border-slate-300 rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-blue-600"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Alamat Email *
            </label>
            <input
              type="email"
              required
              value={formEmail}
              onChange={(e) => setFormEmail(e.target.value)}
              placeholder="contoh: korwil.sambi@boyolali.go.id"
              className="w-full border border-slate-300 rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-blue-600 font-mono"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Kata Sandi Awal *
            </label>
            <input
              type="password"
              required
              minLength={6}
              value={formPassword}
              onChange={(e) => setFormPassword(e.target.value)}
              placeholder="Minimal 6 karakter"
              className="w-full border border-slate-300 rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-blue-600"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Peran Akun (Role) *
            </label>
            <select
              value={formRole}
              onChange={(e) => setFormRole(e.target.value as Role)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 bg-white outline-none focus:ring-1 focus:ring-blue-600"
            >
              <option value="lembaga">Lembaga (TK / PAUD / Posyandu)</option>
              <option value="kecamatan">Kecamatan (Hanya Baca & Cetak)</option>
              <option value="admin">Admin Dinas (Akses Penuh)</option>
            </select>
          </div>

          {formRole === 'kecamatan' && (
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Kecamatan Naungan *
              </label>
              <select
                value={formKecamatanId}
                onChange={(e) => setFormKecamatanId(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 bg-white outline-none focus:ring-1 focus:ring-blue-600"
              >
                {kecamatanList.map((k) => (
                  <option key={k.id} value={k.id}>
                    Kec. {k.nama}
                  </option>
                ))}
              </select>
            </div>
          )}

          {formRole === 'lembaga' && (
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Lembaga Terikat *
              </label>
              <select
                value={formLembagaId}
                onChange={(e) => setFormLembagaId(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 bg-white outline-none focus:ring-1 focus:ring-blue-600 truncate"
              >
                {lembagaList.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.nama} ({l.jenjang} - Kec. {l.kecamatan_nama})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsAddModalOpen(false)}
            >
              Batal
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Buat Akun
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal Reset Password */}
      <Modal
        isOpen={Boolean(resetModalUser)}
        onClose={() => setResetModalUser(null)}
        title="Reset Kata Sandi Akun"
        description={`Mengganti kata sandi untuk akun ${resetModalUser?.nama} (${resetModalUser?.email})`}
      >
        <form onSubmit={handleResetPassword} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Kata Sandi Baru *
            </label>
            <input
              type="password"
              required
              minLength={6}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Masukkan kata sandi baru (minimal 6 karakter)"
              className="w-full border border-slate-300 rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-blue-600"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setResetModalUser(null)}
            >
              Batal
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Simpan Kata Sandi Baru
            </Button>
          </div>
        </form>
      </Modal>
    </AppLayout>
  );
}
