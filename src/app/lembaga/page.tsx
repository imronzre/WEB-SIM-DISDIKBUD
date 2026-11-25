'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  School,
  Search,
  Filter,
  Plus,
  Pencil,
  CheckCircle2,
  AlertCircle,
  Users,
  MapPin,
  Phone,
  Eye,
} from 'lucide-react';
import AppLayout from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge, JenjangBadge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { AppDataStore } from '@/lib/store';
import { Lembaga, Kecamatan, UserProfile, Jenjang, StatusLembaga } from '@/lib/types';
import { formatDateIndo } from '@/lib/utils';

export default function LembagaPage() {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [lembagaList, setLembagaList] = useState<Lembaga[]>([]);
  const [kecamatanList, setKecamatanList] = useState<Kecamatan[]>([]);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedKec, setSelectedKec] = useState('all');
  const [selectedJenjang, setSelectedJenjang] = useState('all');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLembaga, setEditingLembaga] = useState<Lembaga | null>(null);

  // Form Fields
  const [formNama, setFormNama] = useState('');
  const [formNpsn, setFormNpsn] = useState('');
  const [formJenjang, setFormJenjang] = useState<Jenjang>('TK');
  const [formKecamatanId, setFormKecamatanId] = useState('');
  const [formDesa, setFormDesa] = useState('');
  const [formAlamat, setFormAlamat] = useState('');
  const [formStatus, setFormStatus] = useState<StatusLembaga>('Swasta');
  const [formKontak, setFormKontak] = useState('');
  const [formAktif, setFormAktif] = useState(true);
  const [formError, setFormError] = useState('');

  const loadData = () => {
    const user = AppDataStore.getCurrentUser();
    setCurrentUser(user);

    let l = AppDataStore.getLembagaList();
    if (user.role === 'kecamatan' && user.kecamatan_id) {
      l = l.filter((item) => item.kecamatan_id === user.kecamatan_id);
      setSelectedKec(user.kecamatan_id);
    } else if (user.role === 'lembaga' && user.lembaga_id) {
      l = l.filter((item) => item.id === user.lembaga_id);
    }
    setLembagaList(l);

    const k = AppDataStore.getKecamatan();
    setKecamatanList(k);
    if (!formKecamatanId && k.length > 0) {
      setFormKecamatanId(k[0].id);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (!currentUser) return null;

  // Filtered List
  const filteredList = lembagaList.filter((l) => {
    if (selectedKec !== 'all' && l.kecamatan_id !== selectedKec) return false;
    if (selectedJenjang !== 'all' && l.jenjang !== selectedJenjang) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      return (
        l.nama.toLowerCase().includes(q) ||
        (l.npsn && l.npsn.includes(q)) ||
        l.desa.toLowerCase().includes(q) ||
        l.alamat.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleOpenAdd = () => {
    setEditingLembaga(null);
    setFormNama('');
    setFormNpsn('');
    setFormJenjang('TK');
    setFormKecamatanId(kecamatanList[0]?.id || '');
    setFormDesa('');
    setFormAlamat('');
    setFormStatus('Swasta');
    setFormKontak('');
    setFormAktif(true);
    setFormError('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (lem: Lembaga) => {
    setEditingLembaga(lem);
    setFormNama(lem.nama);
    setFormNpsn(lem.npsn || '');
    setFormJenjang(lem.jenjang);
    setFormKecamatanId(lem.kecamatan_id);
    setFormDesa(lem.desa);
    setFormAlamat(lem.alamat);
    setFormStatus(lem.status);
    setFormKontak(lem.kontak || '');
    setFormAktif(lem.aktif);
    setFormError('');
    setIsModalOpen(true);
  };

  const handleSaveLembaga = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!formNama.trim()) {
      setFormError('Nama lembaga wajib diisi.');
      return;
    }
    if (!formDesa.trim() || !formAlamat.trim()) {
      setFormError('Desa dan alamat lengkap wajib diisi.');
      return;
    }

    try {
      AppDataStore.saveLembaga(
        {
          id: editingLembaga ? editingLembaga.id : undefined,
          nama: formNama.trim(),
          npsn: formNpsn.trim() || null,
          jenjang: formJenjang,
          kecamatan_id: formKecamatanId,
          desa: formDesa.trim(),
          alamat: formAlamat.trim(),
          status: formStatus,
          kontak: formKontak.trim() || null,
          aktif: formAktif,
        },
        currentUser
      );

      setIsModalOpen(false);
      loadData();
    } catch (err: any) {
      setFormError(err.message || 'Gagal menyimpan profil lembaga.');
    }
  };

  const canAdd = currentUser.role === 'admin';
  const canEdit =
    currentUser.role === 'admin' ||
    (currentUser.role === 'lembaga' && currentUser.lembaga_id);

  return (
    <AppLayout
      title="Daftar Lembaga Pendidikan"
      subtitle="Data lembaga TK, PAUD, dan Posyandu se-Kabupaten Boyolali"
      breadcrumbs={[{ label: 'Lembaga' }]}
    >
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <span className="text-xs font-semibold text-slate-500">
            Total <strong className="text-blue-700">{filteredList.length}</strong> lembaga terdaftar
          </span>
        </div>

        {canAdd && (
          <Button
            variant="primary"
            size="sm"
            onClick={handleOpenAdd}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Tambah Lembaga Baru
          </Button>
        )}
      </div>

      {/* Filter Card */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Search */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Pencarian Lembaga / NPSN / Desa
              </label>
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Ketik nama atau desa..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-600 outline-none"
                />
              </div>
            </div>

            {/* Filter Kecamatan */}
            {currentUser.role === 'admin' && (
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Kecamatan
                </label>
                <select
                  value={selectedKec}
                  onChange={(e) => setSelectedKec(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-lg px-3 py-1.5 bg-white text-slate-700 focus:ring-1 focus:ring-blue-600 outline-none"
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

            {/* Filter Jenjang */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Jenjang Pendidikan
              </label>
              <select
                value={selectedJenjang}
                onChange={(e) => setSelectedJenjang(e.target.value)}
                className="w-full text-xs border border-slate-300 rounded-lg px-3 py-1.5 bg-white text-slate-700 focus:ring-1 focus:ring-blue-600 outline-none"
              >
                <option value="all">Semua Jenjang</option>
                <option value="TK">Taman Kanak-Kanak (TK)</option>
                <option value="PAUD">PAUD / Kelompok Bermain</option>
                <option value="Posyandu">Posyandu</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Grid Lembaga Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredList.length === 0 ? (
          <div className="col-span-full py-12 text-center text-slate-400 bg-white rounded-xl border border-slate-200">
            <School className="w-8 h-8 mx-auto mb-2 text-slate-300" />
            <p className="font-semibold text-slate-600">Tidak ada data lembaga yang cocok</p>
          </div>
        ) : (
          filteredList.map((lem) => (
            <Card
              key={lem.id}
              className="hover:shadow-md transition-shadow flex flex-col justify-between"
            >
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <JenjangBadge jenjang={lem.jenjang} />
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      lem.status === 'Negeri'
                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                        : 'bg-slate-100 text-slate-700 border border-slate-200'
                    }`}
                  >
                    {lem.status}
                  </span>
                </div>

                <h3 className="font-bold text-slate-900 text-sm leading-snug line-clamp-2">
                  {lem.nama}
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  NPSN: <span className="font-mono text-slate-700">{lem.npsn || 'Belum ada'}</span>
                </p>

                <div className="mt-3 pt-3 border-t border-slate-100 space-y-1 text-xs text-slate-600">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">
                      Desa {lem.desa}, Kec. {lem.kecamatan_nama}
                    </span>
                  </div>
                  {lem.kontak && (
                    <div className="flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{lem.kontak}</span>
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-slate-400">Total Siswa:</span>
                    <strong className="ml-1.5 text-blue-700 font-bold">
                      {lem.total_siswa ?? 0}
                    </strong>
                  </div>
                  <div>
                    {lem.last_upload ? (
                      <span className="text-[10px] text-emerald-600 font-medium">
                        ✓ Terupdate {formatDateIndo(lem.last_upload)}
                      </span>
                    ) : (
                      <span className="text-[10px] text-amber-600 font-medium">
                        Belum ada file
                      </span>
                    )}
                  </div>
                </div>
              </CardContent>

              {/* Action Footer */}
              <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                <Link href={`/siswa?lembaga_id=${lem.id}`}>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs py-1"
                    leftIcon={<Eye className="w-3.5 h-3.5" />}
                  >
                    Daftar Siswa
                  </Button>
                </Link>

                {canEdit && (currentUser.role === 'admin' || currentUser.lembaga_id === lem.id) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs py-1 text-slate-600 hover:text-blue-700"
                    onClick={() => handleOpenEdit(lem)}
                    leftIcon={<Pencil className="w-3.5 h-3.5" />}
                  >
                    Ubah Profil
                  </Button>
                )}
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Modal Form Tambah / Edit Lembaga */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingLembaga ? 'Ubah Profil Lembaga' : 'Tambah Lembaga Pendidikan Baru'}
        description="Lembaga terdaftar di bawah naungan Bidang PAUDNI Disdikbud Boyolali."
      >
        <form onSubmit={handleSaveLembaga} className="space-y-4 text-xs">
          {formError && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs">
              {formError}
            </div>
          )}

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Nama Lembaga *
            </label>
            <input
              type="text"
              required
              value={formNama}
              onChange={(e) => setFormNama(e.target.value)}
              placeholder="Contoh: TK Negeri Pembina Boyolali"
              className="w-full border border-slate-300 rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-blue-600"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                NPSN (Jika Ada)
              </label>
              <input
                type="text"
                value={formNpsn}
                onChange={(e) => setFormNpsn(e.target.value)}
                placeholder="Nomor Pokok Sekolah"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-blue-600 font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Jenjang *
              </label>
              <select
                disabled={currentUser.role === 'lembaga'}
                value={formJenjang}
                onChange={(e) => setFormJenjang(e.target.value as Jenjang)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 bg-white outline-none focus:ring-1 focus:ring-blue-600"
              >
                <option value="TK">Taman Kanak-Kanak (TK)</option>
                <option value="PAUD">PAUD / Kelompok Bermain</option>
                <option value="Posyandu">Posyandu</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Status Lembaga *
              </label>
              <select
                disabled={currentUser.role === 'lembaga'}
                value={formStatus}
                onChange={(e) => setFormStatus(e.target.value as StatusLembaga)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 bg-white outline-none focus:ring-1 focus:ring-blue-600"
              >
                <option value="Swasta">Swasta</option>
                <option value="Negeri">Negeri</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Kecamatan *
              </label>
              <select
                disabled={currentUser.role === 'lembaga'}
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

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Desa / Kelurahan *
              </label>
              <input
                type="text"
                required
                value={formDesa}
                onChange={(e) => setFormDesa(e.target.value)}
                placeholder="Contoh: Siswodipuran"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-blue-600"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Alamat Lengkap *
            </label>
            <textarea
              required
              rows={2}
              value={formAlamat}
              onChange={(e) => setFormAlamat(e.target.value)}
              placeholder="Jalan, RT/RW, Dusun"
              className="w-full border border-slate-300 rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-blue-600"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Kontak / Nomor Telepon
            </label>
            <input
              type="text"
              value={formKontak}
              onChange={(e) => setFormKontak(e.target.value)}
              placeholder="Contoh: 081234567890 / 0276-321456"
              className="w-full border border-slate-300 rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-blue-600"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsModalOpen(false)}
            >
              Batal
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Simpan Profil Lembaga
            </Button>
          </div>
        </form>
      </Modal>
    </AppLayout>
  );
}
