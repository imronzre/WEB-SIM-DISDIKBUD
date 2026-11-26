'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Users,
  Search,
  Plus,
  Pencil,
  Trash2,
  Download,
} from 'lucide-react';
import AppLayout from '@/components/layout/AppLayout';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { JenjangBadge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
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

const VALID_JENJANG = ['TK', 'KB', 'SPS', 'TPA'];

function SiswaContent() {
  const searchParams = useSearchParams();
  const preselectedLembaga = searchParams?.get('lembaga_id') || 'all';
  const preselectedKecamatan = searchParams?.get('kecamatan_id') || 'all';
  const rawJenjang = (searchParams?.get('jenjang') || '').toUpperCase();
  const preselectedJenjang = VALID_JENJANG.includes(rawJenjang)
    ? rawJenjang
    : 'all';

  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [siswaList, setSiswaList] = useState<Siswa[]>([]);
  const [lembagaList, setLembagaList] = useState<Lembaga[]>([]);
  const [kecamatanList, setKecamatanList] = useState<Kecamatan[]>([]);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedKecamatan, setSelectedKecamatan] = useState(preselectedKecamatan);
  const [selectedLembaga, setSelectedLembaga] = useState(preselectedLembaga);
  const [selectedJenjang, setSelectedJenjang] = useState(preselectedJenjang);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSiswa, setEditingSiswa] = useState<Siswa | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Form Fields
  const [formNisn, setFormNisn] = useState('');
  const [formNama, setFormNama] = useState('');
  const [formTanggalLahir, setFormTanggalLahir] = useState('');
  const [formAlamat, setFormAlamat] = useState('');
  const [formNamaAyah, setFormNamaAyah] = useState('');
  const [formNamaIbu, setFormNamaIbu] = useState('');
  const [formLembagaId, setFormLembagaId] = useState('');
  const [formError, setFormError] = useState('');

  const loadData = () => {
    const user = AppDataStore.getCurrentUser();
    setCurrentUser(user);
    const role = normalizeRole(user.role);

    const allLembaga = AppDataStore.getLembagaList();
    let l = allLembaga;

    if (role === 'admin_kecamatan' && user.kecamatan_id) {
      l = l.filter((item) => item.kecamatan_id === user.kecamatan_id);
      setSelectedKecamatan(user.kecamatan_id);
    } else if (role === 'operator_sekolah' && user.lembaga_id) {
      l = l.filter((item) => item.id === user.lembaga_id);
      setSelectedLembaga(user.lembaga_id);
    } else if (preselectedLembaga !== 'all') {
      const targetLembaga = allLembaga.find((item) => item.id === preselectedLembaga);
      if (targetLembaga) {
        setSelectedKecamatan(targetLembaga.kecamatan_id);
        setSelectedLembaga(targetLembaga.id);
      }
    }

    setLembagaList(l);
    setKecamatanList(AppDataStore.getKecamatan());
    setSiswaList(AppDataStore.getSiswaList());
  };

  useEffect(() => {
    loadData();
  }, [preselectedLembaga, preselectedKecamatan, preselectedJenjang]);

  if (!currentUser) return null;

  const role = normalizeRole(currentUser.role);

  // Filter Logic
  const filteredSiswa = siswaList.filter((s) => {
    // Role guard: kecamatan only sees own kecamatan
    if (role === 'admin_kecamatan' && currentUser.kecamatan_id) {
      if (s.kecamatan_id !== currentUser.kecamatan_id) return false;
    }
    // Role guard: lembaga only sees own lembaga
    if (role === 'operator_sekolah' && currentUser.lembaga_id) {
      if (s.lembaga_id !== currentUser.lembaga_id) return false;
    }

    // UI filters
    if (selectedKecamatan !== 'all' && s.kecamatan_id !== selectedKecamatan) return false;
    if (selectedLembaga !== 'all' && s.lembaga_id !== selectedLembaga) return false;
    if (
      selectedJenjang !== 'all' &&
      String(s.jenjang || '').toUpperCase() !== selectedJenjang
    ) {
      return false;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchNama = s.nama.toLowerCase().includes(q);
      const matchNisn = s.nisn ? s.nisn.includes(q) : false;
      const matchAlamat = s.alamat.toLowerCase().includes(q);
      const matchOrtu =
        s.nama_ayah.toLowerCase().includes(q) || s.nama_ibu.toLowerCase().includes(q);
      return matchNama || matchNisn || matchAlamat || matchOrtu;
    }
    return true;
  });

  // Pagination calculation
  const totalPages = Math.ceil(filteredSiswa.length / itemsPerPage) || 1;
  const paginatedSiswa = filteredSiswa.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Open Modal Tambah
  const handleOpenAdd = () => {
    setEditingSiswa(null);
    setFormNisn('');
    setFormNama('');
    setFormTanggalLahir('');
    setFormAlamat('');
    setFormNamaAyah('');
    setFormNamaIbu('');
    setFormLembagaId(
      role === 'operator_sekolah' && currentUser.lembaga_id
        ? currentUser.lembaga_id
        : lembagaList[0]?.id || ''
    );
    setFormError('');
    setIsModalOpen(true);
  };

  // Open Modal Edit
  const handleOpenEdit = (s: Siswa) => {
    setEditingSiswa(s);
    setFormNisn(s.nisn || '');
    setFormNama(s.nama);
    setFormTanggalLahir(s.tanggal_lahir);
    setFormAlamat(s.alamat);
    setFormNamaAyah(s.nama_ayah);
    setFormNamaIbu(s.nama_ibu);
    setFormLembagaId(s.lembaga_id);
    setFormError('');
    setIsModalOpen(true);
  };

  // Save Siswa
  const handleSaveSiswa = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!formNama.trim()) {
      setFormError('Nama peserta didik wajib diisi.');
      return;
    }
    if (!formTanggalLahir) {
      setFormError('Tanggal lahir wajib diisi.');
      return;
    }
    if (!formAlamat.trim()) {
      setFormError('Alamat tempat tinggal wajib diisi.');
      return;
    }
    if (!formNamaAyah.trim() || !formNamaIbu.trim()) {
      setFormError('Nama Ayah dan Nama Ibu wajib diisi.');
      return;
    }
    if (formNisn.trim() && formNisn.trim().length !== 10) {
      setFormError('Jika diisi, NISN harus berupa 10 digit angka.');
      return;
    }

    try {
      AppDataStore.saveSiswa(
        {
          id: editingSiswa ? editingSiswa.id : undefined,
          nisn: formNisn.trim() || null,
          nama: formNama.trim(),
          tanggal_lahir: formTanggalLahir,
          alamat: formAlamat.trim(),
          nama_ayah: formNamaAyah.trim(),
          nama_ibu: formNamaIbu.trim(),
          lembaga_id: formLembagaId,
        },
        currentUser
      );

      setIsModalOpen(false);
      loadData();
    } catch (err: any) {
      setFormError(err.message || 'Gagal menyimpan data siswa.');
    }
  };

  // Delete Siswa
  const handleDeleteSiswa = (id: string) => {
    if (AppDataStore.deleteSiswa(id, currentUser)) {
      setDeleteConfirmId(null);
      loadData();
    }
  };

  // Export to Excel
  const handleExportExcel = () => {
    const bytes = exportSiswaToExcel(filteredSiswa);
    const blob = new Blob([bytes as unknown as BlobPart], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Data_Siswa_PAUDNI_Boyolali_${new Date().toISOString().slice(0, 10)}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const canModify = role === 'admin_dinas' || role === 'operator_sekolah';

  return (
    <AppLayout
      title="Manajemen Peserta Didik"
      subtitle="Kelola, cari, dan telusuri data siswa jenjang TK, KB, SPS, dan TPA"
      breadcrumbs={[{ label: 'Data Siswa' }]}
    >
      {/* Action Bar & Quick Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <span className="text-xs font-semibold text-slate-500">
            Ditemukan <strong className="text-blue-700">{filteredSiswa.length}</strong> peserta didik
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportExcel}
            leftIcon={<Download className="w-4 h-4" />}
          >
            Ekspor Excel
          </Button>

          {canModify && (
            <Button
              variant="primary"
              size="sm"
              onClick={handleOpenAdd}
              leftIcon={<Plus className="w-4 h-4" />}
            >
              Tambah Siswa Manual
            </Button>
          )}
        </div>
      </div>

      {/* Filter Card */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Search */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Pencarian (Nama / NISN / Alamat)
              </label>
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Ketik kata kunci..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-600 outline-none"
                />
              </div>
            </div>

            {/* Filter Kecamatan (Admin Only) */}
            {role === 'admin_dinas' && (
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Kecamatan
                </label>
                <select
                  value={selectedKecamatan}
                  onChange={(e) => {
                    setSelectedKecamatan(e.target.value);
                    setSelectedLembaga('all');
                    setCurrentPage(1);
                  }}
                  className="w-full text-xs border border-slate-300 rounded-lg px-3 py-1.5 bg-white text-slate-700 focus:ring-1 focus:ring-blue-600 outline-none"
                >
                  <option value="all">Semua Kecamatan</option>
                  {kecamatanList.map((k) => (
                    <option key={k.id} value={k.id}>
                      Kec. {k.nama}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Filter Lembaga (Admin & Kecamatan) */}
            {role !== 'operator_sekolah' && (
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Lembaga
                </label>
                <select
                  value={selectedLembaga}
                  onChange={(e) => {
                    setSelectedLembaga(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full text-xs border border-slate-300 rounded-lg px-3 py-1.5 bg-white text-slate-700 focus:ring-1 focus:ring-blue-600 outline-none truncate"
                >
                  <option value="all">Semua Lembaga</option>
                  {lembagaList
                    .filter(
                      (l) =>
                        selectedKecamatan === 'all' || l.kecamatan_id === selectedKecamatan
                    )
                    .map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.nama} ({l.jenjang})
                      </option>
                    ))}
                </select>
              </div>
            )}

            {/* Filter Jenjang */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Jenjang
              </label>
              <select
                value={selectedJenjang}
                onChange={(e) => {
                  setSelectedJenjang(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full text-xs border border-slate-300 rounded-lg px-3 py-1.5 bg-white text-slate-700 focus:ring-1 focus:ring-blue-600 outline-none"
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

      {/* Student Data Table */}
      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                <th className="py-3 px-4 w-12 text-center">No</th>
                <th className="py-3 px-4">Nama Lengkap &amp; NISN</th>
                <th className="py-3 px-4">Tanggal Lahir &amp; Usia</th>
                <th className="py-3 px-4">Alamat Tempat Tinggal</th>
                <th className="py-3 px-4">Orang Tua (Ayah / Ibu)</th>
                <th className="py-3 px-4">Lembaga &amp; Jenjang</th>
                {canModify && <th className="py-3 px-4 text-center w-24">Aksi</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedSiswa.length === 0 ? (
                <tr>
                  <td
                    colSpan={canModify ? 7 : 6}
                    className="py-12 text-center text-slate-400"
                  >
                    <Users className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    <p className="font-semibold text-slate-600">Tidak ada data peserta didik</p>
                    <p className="text-[11px] mt-0.5">
                      Coba sesuaikan kata kunci pencarian atau filter yang dipilih.
                    </p>
                  </td>
                </tr>
              ) : (
                paginatedSiswa.map((s, idx) => {
                  const age = calculateAge(s.tanggal_lahir);
                  return (
                    <tr key={s.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-4 text-center text-slate-400 font-medium">
                        {(currentPage - 1) * itemsPerPage + idx + 1}
                      </td>
                      <td className="py-3 px-4">
                        <p className="font-bold text-slate-900">{s.nama}</p>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          NISN:{' '}
                          {s.nisn ? (
                            <span className="font-mono text-blue-700 font-medium">
                              {s.nisn}
                            </span>
                          ) : (
                            <span className="italic text-slate-400">Belum memiliki NISN</span>
                          )}
                        </p>
                      </td>
                      <td className="py-3 px-4">
                        <p className="text-slate-800 font-medium">
                          {formatDateIndo(s.tanggal_lahir)}
                        </p>
                        {age !== null && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-semibold">
                            {age} Tahun
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-700 max-w-xs truncate">
                        {s.alamat}
                      </td>
                      <td className="py-3 px-4">
                        <p className="text-slate-800 font-medium">Ayah: {s.nama_ayah}</p>
                        <p className="text-slate-500 text-[11px]">Ibu: {s.nama_ibu}</p>
                      </td>
                      <td className="py-3 px-4">
                        <p className="font-semibold text-slate-900 truncate max-w-[180px]">
                          {s.lembaga_nama}
                        </p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <JenjangBadge jenjang={s.jenjang || 'TK'} />
                          <span className="text-[10px] text-slate-400">
                            Kec. {s.kecamatan_nama}
                          </span>
                        </div>
                      </td>
                      {canModify && (
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => handleOpenEdit(s)}
                              className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                              title="Edit Data"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setDeleteConfirmId(s.id)}
                              className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition"
                              title="Hapus Data"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </CardContent>

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
            <span>
              Halaman <strong>{currentPage}</strong> dari <strong>{totalPages}</strong>
            </span>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              >
                Sebelumnya
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              >
                Selanjutnya
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Modal Form Tambah / Edit Siswa */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingSiswa ? 'Ubah Data Peserta Didik' : 'Tambah Peserta Didik Manual'}
        description="Pastikan data identitas anak sesuai dengan Kartu Keluarga / Akta Kelahiran."
      >
        <form onSubmit={handleSaveSiswa} className="space-y-4 text-xs">
          {formError && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs">
              {formError}
            </div>
          )}

          {/* Pilih Lembaga (Jika Admin) */}
          {role === 'admin_dinas' ? (
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Lembaga Naungan *
              </label>
              <select
                value={formLembagaId}
                onChange={(e) => setFormLembagaId(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 bg-white text-slate-800 outline-none focus:ring-1 focus:ring-blue-600"
              >
                {lembagaList.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.nama} ({l.jenjang} - Kec. {l.kecamatan_nama})
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="p-2.5 bg-blue-50 rounded-lg text-blue-900 border border-blue-100">
              <span className="font-bold">Lembaga: </span>
              {currentUser.lembaga_nama}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Nama Lengkap Peserta Didik *
              </label>
              <input
                type="text"
                required
                value={formNama}
                onChange={(e) => setFormNama(e.target.value)}
                placeholder="Contoh: Nurfadilah Putri"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-blue-600"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                NISN (10 Digit - Boleh Kosong)
              </label>
              <input
                type="text"
                maxLength={10}
                value={formNisn}
                onChange={(e) => setFormNisn(e.target.value.replace(/[^0-9]/g, ''))}
                placeholder="Kosongkan jika belum memiliki NISN"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-blue-600 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Tanggal Lahir *
            </label>
            <input
              type="date"
              required
              max={new Date().toISOString().slice(0, 10)}
              value={formTanggalLahir}
              onChange={(e) => setFormTanggalLahir(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-blue-600"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Alamat Tempat Tinggal *
            </label>
            <textarea
              required
              rows={2}
              value={formAlamat}
              onChange={(e) => setFormAlamat(e.target.value)}
              placeholder="Contoh: Dusun Kemiri RT 02/03, Mojosongo"
              className="w-full border border-slate-300 rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-blue-600"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Nama Ayah Kandung *
              </label>
              <input
                type="text"
                required
                value={formNamaAyah}
                onChange={(e) => setFormNamaAyah(e.target.value)}
                placeholder="Nama Ayah"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-blue-600"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Nama Ibu Kandung *
              </label>
              <input
                type="text"
                required
                value={formNamaIbu}
                onChange={(e) => setFormNamaIbu(e.target.value)}
                placeholder="Nama Ibu"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-blue-600"
              />
            </div>
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
              Simpan Data Siswa
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal Konfirmasi Hapus */}
      <Modal
        isOpen={Boolean(deleteConfirmId)}
        onClose={() => setDeleteConfirmId(null)}
        title="Konfirmasi Hapus Data Siswa"
      >
        <div className="space-y-4 text-xs">
          <p className="text-slate-600">
            Apakah Anda yakin ingin menghapus data peserta didik ini dari sistem? Tindakan ini tidak dapat dibatalkan.
          </p>
          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDeleteConfirmId(null)}
            >
              Batal
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={() => deleteConfirmId && handleDeleteSiswa(deleteConfirmId)}
            >
              Ya, Hapus Data
            </Button>
          </div>
        </div>
      </Modal>
    </AppLayout>
  );
}

export default function SiswaPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[400px] text-xs text-slate-500">
          Memuat data peserta didik...
        </div>
      }
    >
      <SiswaContent />
    </Suspense>
  );
}