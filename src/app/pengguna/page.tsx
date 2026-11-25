'use client';

import React, { useState, useEffect } from 'react';
import {
  Plus,
  Search,
  KeyRound,
  CheckCircle2,
  ShieldAlert,
  RotateCcw,
  Copy,
  Check,
  Trash2,
} from 'lucide-react';
import AppLayout from '@/components/layout/AppLayout';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { AppDataStore } from '@/lib/store';
import { UserProfile, Kecamatan, Lembaga, normalizeRole } from '@/lib/types';
import { formatDateIndo } from '@/lib/utils';

const DEFAULT_PASSWORD = '123456';

interface ManagedUser extends UserProfile {
  password?: string;
  password_status?: 'default' | 'changed';
}

const INITIAL_MANAGED_USERS: ManagedUser[] = [
  {
    id: 'usr-admin',
    nama: 'Admin Dinas PAUDNI',
    email: 'admin.dinas@boyolali.go.id',
    role: 'admin_dinas',
    password: DEFAULT_PASSWORD,
    password_status: 'default',
    created_at: '2026-11-01T08:00:00Z',
  },
  {
    id: 'usr-kec-boyolali',
    nama: 'Petugas Korwil Kec. Boyolali',
    email: 'kec.boyolali@boyolali.go.id',
    role: 'admin_kecamatan',
    kecamatan_id: 'kec-boyolali',
    kecamatan_nama: 'Boyolali',
    password: DEFAULT_PASSWORD,
    password_status: 'default',
    created_at: '2026-11-02T09:00:00Z',
  },
  {
    id: 'usr-kec-mojosongo',
    nama: 'Petugas Korwil Kec. Mojosongo',
    email: 'kec.mojosongo@boyolali.go.id',
    role: 'admin_kecamatan',
    kecamatan_id: 'kec-mojosongo',
    kecamatan_nama: 'Mojosongo',
    password: DEFAULT_PASSWORD,
    password_status: 'default',
    created_at: '2026-11-02T09:30:00Z',
  },
  {
    id: 'usr-lem-1',
    nama: 'Operator TK Negeri Pembina',
    email: 'tk.pembina@boyolali.go.id',
    role: 'operator_sekolah',
    kecamatan_id: 'kec-boyolali',
    kecamatan_nama: 'Boyolali',
    lembaga_id: 'lem-1',
    lembaga_nama: 'TK Negeri Pembina Boyolali',
    password: DEFAULT_PASSWORD,
    password_status: 'default',
    created_at: '2026-11-03T10:00:00Z',
  },
  {
    id: 'usr-lem-2',
    nama: 'Operator KB Permata Hati',
    email: 'kb.permata@boyolali.go.id',
    role: 'operator_sekolah',
    kecamatan_id: 'kec-mojosongo',
    kecamatan_nama: 'Mojosongo',
    lembaga_id: 'lem-2',
    lembaga_nama: 'KB Permata Hati Mojosongo',
    password: DEFAULT_PASSWORD,
    password_status: 'default',
    created_at: '2026-11-03T11:00:00Z',
  },
];

type CreatableRole = 'admin_kecamatan' | 'operator_sekolah';

export default function PenggunaPage() {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [usersList, setUsersList] = useState<ManagedUser[]>([]);
  const [kecamatanList, setKecamatanList] = useState<Kecamatan[]>([]);
  const [lembagaList, setLembagaList] = useState<Lembaga[]>([]);

  // Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [passwordFilter, setPasswordFilter] = useState<string>('all');

  // Modal & Notifikasi
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [resetTargetUser, setResetTargetUser] = useState<ManagedUser | null>(null);
  const [alertSuccess, setAlertSuccess] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Form Buat Akun
  const [formNama, setFormNama] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formRole, setFormRole] = useState<CreatableRole>('operator_sekolah');
  const [formKecamatanId, setFormKecamatanId] = useState('');
  const [formLembagaId, setFormLembagaId] = useState('');
  const [formError, setFormError] = useState('');

  const persistUsers = (nextUsers: ManagedUser[]) => {
    setUsersList(nextUsers);
    if (typeof window !== 'undefined') {
      localStorage.setItem('boyolali_users_list', JSON.stringify(nextUsers));
    }
  };

  const loadData = () => {
    const user = AppDataStore.getCurrentUser();
    setCurrentUser(user);

    const kec = AppDataStore.getKecamatan();
    setKecamatanList(kec);
    if (kec.length > 0 && !formKecamatanId) setFormKecamatanId(kec[0].id);

    const lem = AppDataStore.getLembagaList();
    setLembagaList(lem);
    if (lem.length > 0 && !formLembagaId) setFormLembagaId(lem[0].id);

    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('boyolali_users_list');
      if (saved) {
        try {
          setUsersList(JSON.parse(saved));
          return;
        } catch {
          // fallback ke data awal
        }
      }
      localStorage.setItem('boyolali_users_list', JSON.stringify(INITIAL_MANAGED_USERS));
    }
    setUsersList(INITIAL_MANAGED_USERS);
  };

  useEffect(() => {
    loadData();
  }, []);

  if (!currentUser) return null;

  const currentRole = normalizeRole(currentUser.role);

  if (currentRole !== 'admin_dinas') {
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

  const showToast = (msg: string) => {
    setAlertSuccess(msg);
    setTimeout(() => setAlertSuccess(''), 4000);
  };

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    const cleanNama = formNama.trim();
    const cleanEmail = formEmail.trim().toLowerCase();

    if (!cleanNama || !cleanEmail) {
      setFormError('Nama lengkap dan email wajib diisi.');
      return;
    }

    if (usersList.some((u) => u.email.toLowerCase() === cleanEmail)) {
      setFormError('Email tersebut sudah terdaftar.');
      return;
    }

    const kecObj = kecamatanList.find((k) => k.id === formKecamatanId);
    const lemObj = lembagaList.find((l) => l.id === formLembagaId);

    const newUser: ManagedUser = {
      id: `usr-${Date.now()}`,
      nama: cleanNama,
      email: cleanEmail,
      role: formRole,
      password: DEFAULT_PASSWORD,
      password_status: 'default',
      kecamatan_id:
        formRole === 'admin_kecamatan'
          ? formKecamatanId
          : lemObj?.kecamatan_id || null,
      kecamatan_nama:
        formRole === 'admin_kecamatan'
          ? kecObj?.nama || null
          : lemObj?.kecamatan_nama || null,
      lembaga_id: formRole === 'operator_sekolah' ? formLembagaId : null,
      lembaga_nama: formRole === 'operator_sekolah' ? lemObj?.nama || null : null,
      created_at: new Date().toISOString(),
    };

    const updated = [newUser, ...usersList];
    persistUsers(updated);

    AppDataStore.addActivityLog(
      'BUAT_AKUN',
      `Membuat akun ${newUser.nama} (${newUser.email}) peran ${newUser.role}`,
      currentUser
    );

    setFormNama('');
    setFormEmail('');
    setIsAddModalOpen(false);
    showToast(`Akun ${newUser.nama} berhasil dibuat.`);
  };

  const handleConfirmResetDefault = () => {
    if (!resetTargetUser) return;

    const updated = usersList.map((u) =>
      u.id === resetTargetUser.id
        ? {
          ...u,
          password: DEFAULT_PASSWORD,
          password_status: 'default' as const,
        }
        : u
    );

    persistUsers(updated);
    AppDataStore.addActivityLog(
      'RESET_PASSWORD_DEFAULT',
      `Mereset kata sandi ${resetTargetUser.nama} (${resetTargetUser.email}) ke default`,
      currentUser
    );

    const targetName = resetTargetUser.nama;
    setResetTargetUser(null);
    showToast(`Kata sandi ${targetName} telah direset.`);
  };

  const handleDeleteUser = (target: ManagedUser) => {
    if (normalizeRole(target.role) === 'admin_dinas') return;
    const updated = usersList.filter((u) => u.id !== target.id);
    persistUsers(updated);
    AppDataStore.addActivityLog(
      'HAPUS_AKUN',
      `Menghapus akun ${target.nama} (${target.email})`,
      currentUser
    );
    showToast(`Akun ${target.nama} dihapus.`);
  };

  const handleCopyCredentials = async (userItem: ManagedUser) => {
    const passText = userItem.password || DEFAULT_PASSWORD;
    const text = `Email: ${userItem.email}\nPassword: ${passText}`;
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(userItem.id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      showToast(`${userItem.email} | ${passText}`);
    }
  };

  const filteredUsers = usersList.filter((u) => {
    const uRole = normalizeRole(u.role);
    if (roleFilter !== 'all' && uRole !== roleFilter) return false;
    const status = u.password_status || 'default';
    if (passwordFilter !== 'all' && status !== passwordFilter) return false;

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
      title="Manajemen Akun"
      subtitle="Kelola akun kecamatan, sekolah, dan reset kata sandi"
      breadcrumbs={[{ label: 'Manajemen Akun' }]}
    >
      {alertSuccess && (
        <div className="mb-4 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{alertSuccess}</span>
        </div>
      )}

      {/* Top Bar */}
      <div className="flex items-center justify-between gap-4 mb-6">
        <span className="text-xs font-semibold text-slate-500">
          Menampilkan <strong className="text-blue-700">{filteredUsers.length}</strong> dari{' '}
          <strong>{usersList.length}</strong> akun
        </span>

        <Button
          variant="primary"
          size="sm"
          onClick={() => {
            setFormError('');
            setIsAddModalOpen(true);
          }}
          leftIcon={<Plus className="w-4 h-4" />}
        >
          Buat Akun Baru
        </Button>
      </div>

      {/* Filter */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Cari Akun
              </label>
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Nama, email, wilayah, lembaga..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg outline-none focus:ring-1 focus:ring-blue-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Peran
              </label>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="w-full text-xs border border-slate-300 rounded-lg px-3 py-1.5 bg-white text-slate-700 outline-none focus:ring-1 focus:ring-blue-600"
              >
                <option value="all">Semua Peran</option>
                <option value="admin_dinas">Admin Dinas</option>
                <option value="admin_kecamatan">Admin Kecamatan</option>
                <option value="operator_sekolah">Operator Sekolah</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Status Sandi
              </label>
              <select
                value={passwordFilter}
                onChange={(e) => setPasswordFilter(e.target.value)}
                className="w-full text-xs border border-slate-300 rounded-lg px-3 py-1.5 bg-white text-slate-700 outline-none focus:ring-1 focus:ring-blue-600"
              >
                <option value="all">Semua Status</option>
                <option value="default">Default ({DEFAULT_PASSWORD})</option>
                <option value="changed">Sudah Diganti</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabel Akun */}
      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                <th className="py-3 px-4">Nama &amp; Email</th>
                <th className="py-3 px-4">Peran</th>
                <th className="py-3 px-4">Wilayah / Lembaga</th>
                <th className="py-3 px-4">Sandi</th>
                <th className="py-3 px-4">Dibuat</th>
                <th className="py-3 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-slate-400">
                    Tidak ada data akun.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const uRole = normalizeRole(u.role);
                  const isDefaultPass = (u.password_status || 'default') === 'default';
                  return (
                    <tr key={u.id} className="hover:bg-slate-50">
                      <td className="py-3 px-4">
                        <p className="font-bold text-slate-900">{u.nama}</p>
                        <p className="text-[11px] text-slate-500 font-mono">{u.email}</p>
                      </td>
                      <td className="py-3 px-4">
                        {uRole === 'admin_dinas' && (
                          <Badge variant="danger">Admin Dinas</Badge>
                        )}
                        {uRole === 'admin_kecamatan' && (
                          <Badge variant="warning">Admin Kecamatan</Badge>
                        )}
                        {uRole === 'operator_sekolah' && (
                          <Badge variant="success">Operator Sekolah</Badge>
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
                          <span className="text-slate-400">Dinas</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {isDefaultPass ? (
                          <Badge variant="warning">{DEFAULT_PASSWORD}</Badge>
                        ) : (
                          <Badge variant="info">Sudah Diganti</Badge>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-500">
                        {formatDateIndo(u.created_at)}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-center gap-1.5">
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-[11px] py-1"
                            onClick={() => handleCopyCredentials(u)}
                            leftIcon={
                              copiedId === u.id ? (
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )
                            }
                          >
                            {copiedId === u.id ? 'Tersalin' : 'Salin'}
                          </Button>

                          <Button
                            variant="outline"
                            size="sm"
                            className="text-[11px] py-1"
                            onClick={() => setResetTargetUser(u)}
                            leftIcon={<KeyRound className="w-3.5 h-3.5" />}
                          >
                            Reset Sandi
                          </Button>

                          {uRole !== 'admin_dinas' && (
                            <button
                              type="button"
                              onClick={() => handleDeleteUser(u)}
                              className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition"
                              title="Hapus Akun"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Modal Buat Akun */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Buat Akun Baru"
      >
        <form onSubmit={handleCreateUser} className="space-y-4 text-xs">
          {formError && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700">
              {formError}
            </div>
          )}

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Nama Akun *
            </label>
            <input
              type="text"
              required
              value={formNama}
              onChange={(e) => setFormNama(e.target.value)}
              placeholder="Contoh: Operator SPS Melati"
              className="w-full border border-slate-300 rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-blue-600"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Email *
            </label>
            <input
              type="email"
              required
              value={formEmail}
              onChange={(e) => setFormEmail(e.target.value)}
              placeholder="contoh: sps.melati@boyolali.go.id"
              className="w-full border border-slate-300 rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-blue-600 font-mono"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Peran *
            </label>
            <select
              value={formRole}
              onChange={(e) => setFormRole(e.target.value as CreatableRole)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 bg-white outline-none focus:ring-1 focus:ring-blue-600"
            >
              <option value="operator_sekolah">Operator Sekolah</option>
              <option value="admin_kecamatan">Admin Kecamatan</option>
            </select>
          </div>

          {formRole === 'admin_kecamatan' && (
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Kecamatan *
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

          {formRole === 'operator_sekolah' && (
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
              Simpan Akun
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal Reset Sandi */}
      <Modal
        isOpen={Boolean(resetTargetUser)}
        onClose={() => setResetTargetUser(null)}
        title="Reset Kata Sandi"
      >
        <div className="space-y-4 text-xs">
          <p className="text-slate-600">
            Reset kata sandi akun <strong className="text-slate-900">{resetTargetUser?.nama}</strong> ke sandi awal?
          </p>
          <div className="pt-2 flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setResetTargetUser(null)}
            >
              Batal
            </Button>
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={handleConfirmResetDefault}
              leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
            >
              Reset Sandi
            </Button>
          </div>
        </div>
      </Modal>
    </AppLayout>
  );
}