'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  UploadCloud,
  FileSpreadsheet,
  Download,
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  History,
  FileCheck,
  ShieldAlert,
} from 'lucide-react';
import AppLayout from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { AppDataStore } from '@/lib/store';
import {
  generateStudentTemplate,
  parseAndValidateExcel,
  generateErrorReport,
} from '@/lib/excel';
import {
  ParsedExcelRow,
  UploadLog,
  UserProfile,
  Lembaga,
  normalizeRole,
} from '@/lib/types';
import { formatDateTimeIndo } from '@/lib/utils';

export default function UnggahSiswaPage() {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [lembagaList, setLembagaList] = useState<Lembaga[]>([]);
  const [targetLembagaId, setTargetLembagaId] = useState<string>('');
  const [uploadLogs, setUploadLogs] = useState<UploadLog[]>([]);

  // Upload & File State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [parsedRows, setParsedRows] = useState<ParsedExcelRow[]>([]);
  const [uploadMode, setUploadMode] = useState<'perbarui' | 'ganti_semua'>('perbarui');

  // Confirmation Modals
  const [showReplaceModal, setShowReplaceModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [saveResult, setSaveResult] = useState<{
    successCount: number;
    updatedCount: number;
    insertedCount: number;
  } | null>(null);

  const loadData = () => {
    const user = AppDataStore.getCurrentUser();
    setCurrentUser(user);
    const role = normalizeRole(user.role);

    const allLembaga = AppDataStore.getLembagaList();

    if (role === 'operator_sekolah') {
      let ownLembaga = user.lembaga_id
        ? allLembaga.filter((item) => String(item.id) === String(user.lembaga_id))
        : [];

      // Fallback cocokkan berdasarkan nama lembaga jika lembaga_id belum terisi
      if (ownLembaga.length === 0 && user.lembaga_nama) {
        ownLembaga = allLembaga.filter(
          (item) =>
            item.nama.trim().toLowerCase() === user.lembaga_nama!.trim().toLowerCase()
        );
      }

      const resolvedId = ownLembaga[0]?.id
        ? String(ownLembaga[0].id)
        : user.lembaga_id
          ? String(user.lembaga_id)
          : '';

      setLembagaList(ownLembaga);
      setTargetLembagaId(resolvedId);

      const logs = AppDataStore.getUploadLogs(resolvedId || undefined);
      setUploadLogs(
        resolvedId
          ? logs.filter((log) => String(log.lembaga_id) === resolvedId)
          : []
      );
    } else if (role === 'admin_kecamatan') {
      const kecId = user.kecamatan_id ? String(user.kecamatan_id) : '';
      const kecLembaga = kecId
        ? allLembaga.filter((item) => String(item.kecamatan_id) === kecId)
        : [];
      setLembagaList(kecLembaga);
      setTargetLembagaId(kecLembaga[0]?.id ? String(kecLembaga[0].id) : '');
      setUploadLogs([]);
    } else {
      // Admin Dinas
      setLembagaList(allLembaga);
      if (allLembaga.length > 0) {
        setTargetLembagaId((prev) => prev || String(allLembaga[0].id));
      }
      setUploadLogs(AppDataStore.getUploadLogs());
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (!currentUser) return null;

  const role = normalizeRole(currentUser.role);

  // PRD Role Check: Admin Kecamatan tidak diizinkan unggah data
  if (role === 'admin_kecamatan') {
    return (
      <AppLayout title="Akses Dibatasi">
        <div className="p-8 text-center bg-white rounded-xl border border-slate-200">
          <ShieldAlert className="w-12 h-12 mx-auto text-amber-500 mb-3" />
          <h3 className="text-base font-bold text-slate-800">
            Kecamatan Hanya Memiliki Hak Baca dan Cetak
          </h3>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
            Akun admin kecamatan tidak diizinkan untuk mengunggah, mengubah, atau menghapus data siswa.
          </p>
        </div>
      </AppLayout>
    );
  }

  // 1. Unduh Template Excel Standar
  const handleDownloadTemplate = () => {
    const bytes = generateStudentTemplate();
    const blob = new Blob([bytes as unknown as BlobPart], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Template_Data_Siswa_PAUDNI_Boyolali.xlsx';
    a.click();
    URL.revokeObjectURL(url);
  };

  // 2. Baca File Excel
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setIsProcessing(true);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const buffer = event.target?.result as ArrayBuffer;
        const result = parseAndValidateExcel(buffer);
        setParsedRows(result.rows);
      } catch (err: any) {
        alert(`Gagal membaca file Excel: ${err.message}`);
      } finally {
        setIsProcessing(false);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  // 3. Unduh Laporan Error
  const handleDownloadErrors = () => {
    const failedRows = parsedRows.filter((r) => !r.isValid);
    if (failedRows.length === 0) return;

    const bytes = generateErrorReport(failedRows);
    const blob = new Blob([bytes as unknown as BlobPart], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Laporan_Error_Unggah_${new Date().toISOString().slice(0, 10)}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // 4. Simpan ke Database
  const handleCommitUpload = () => {
    const effectiveLembagaId =
      role === 'operator_sekolah'
        ? String(lembagaList[0]?.id || currentUser.lembaga_id || targetLembagaId)
        : targetLembagaId;

    if (!effectiveLembagaId) {
      alert('Lembaga tujuan belum terhubung dengan akun ini. Hubungi Admin Dinas.');
      return;
    }

    if (uploadMode === 'ganti_semua' && !showReplaceModal) {
      setShowReplaceModal(true);
      return;
    }

    const validRows = parsedRows.filter((r) => r.isValid);
    const invalidCount = parsedRows.filter((r) => !r.isValid).length;

    if (validRows.length === 0) {
      alert('Tidak ada baris data valid yang dapat disimpan.');
      return;
    }

    try {
      const res = AppDataStore.bulkUpsertSiswa(
        validRows,
        invalidCount,
        effectiveLembagaId,
        uploadMode,
        fileName,
        currentUser
      );

      setSaveResult(res);
      setShowSuccessModal(true);
      setShowReplaceModal(false);
      setParsedRows([]);
      setFileName('');
      if (fileInputRef.current) fileInputRef.current.value = '';
      loadData();
    } catch (err: any) {
      alert(`Gagal menyimpan data: ${err.message}`);
    }
  };

  const validCount = parsedRows.filter((r) => r.isValid).length;
  const invalidCount = parsedRows.filter((r) => !r.isValid).length;
  const targetLembaga = lembagaList.find(
    (l) => String(l.id) === String(targetLembagaId)
  );

  return (
    <AppLayout
      title="Unggah Data Siswa Massal"
      subtitle={
        role === 'operator_sekolah'
          ? `Unggah dan perbarui data peserta didik ${targetLembaga?.nama || currentUser.lembaga_nama || 'lembaga Anda'}`
          : 'Kumpulkan dan perbarui data peserta didik lembaga menggunakan file Excel atau CSV'
      }
      breadcrumbs={[{ label: 'Unggah Siswa' }]}
    >
      {/* Step Banner & Template Download Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Alur Pengunggahan Data Standar PAUDNI</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-xs text-slate-600">
              <div className="flex items-start gap-3 p-3 rounded-lg bg-blue-50/60 border border-blue-100">
                <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-[11px] shrink-0">
                  1
                </span>
                <div>
                  <strong className="text-blue-900 block font-semibold">
                    Unduh Template Standar
                  </strong>
                  Unduh template Excel resmi berisikan format kolom wajib: NISN, Nama, Tanggal Lahir (DD-MM-YYYY), Alamat, Nama Ayah, Nama Ibu.
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-lg bg-indigo-50/60 border border-indigo-100">
                <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-[11px] shrink-0">
                  2
                </span>
                <div>
                  <strong className="text-indigo-900 block font-semibold">
                    Isi Data Siswa
                  </strong>
                  NISN boleh dikosongkan jika peserta didik PAUD/Posyandu belum memilikinya. Tanggal lahir harus format DD-MM-YYYY (contoh: 15-05-2019).
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-lg bg-emerald-50/60 border border-emerald-100">
                <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-[11px] shrink-0">
                  3
                </span>
                <div>
                  <strong className="text-emerald-900 block font-semibold">
                    Validasi Otomatis &amp; Pratinjau
                  </strong>
                  Sistem mengecek duplikasi dan error format sebelum disimpan. Anda dapat menyimpan hanya baris valid dan mengunduh laporan perbaikan error.
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card className="border-blue-200 bg-gradient-to-br from-white to-blue-50/60 h-full flex flex-col justify-between">
            <CardContent className="p-6">
              <div className="w-12 h-12 rounded-xl bg-blue-700 text-white flex items-center justify-center shadow-md shadow-blue-500/20 mb-4">
                <FileSpreadsheet className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-900 text-base">
                Template Resmi PAUDNI
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Format file Excel (.xlsx) dengan kolom standar dan petunjuk pengisian lengkap.
              </p>

              <div className="mt-6">
                <Button
                  variant="primary"
                  size="md"
                  className="w-full shadow-md"
                  onClick={handleDownloadTemplate}
                  leftIcon={<Download className="w-4 h-4" />}
                >
                  Unduh Template Excel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Upload Zone Card */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Pilih Lembaga &amp; Unggah File</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Target Lembaga */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Lembaga Tujuan Pengunggahan *
              </label>
              {role === 'admin_dinas' ? (
                <select
                  value={targetLembagaId}
                  onChange={(e) => setTargetLembagaId(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-lg px-3 py-2 bg-white text-slate-800 focus:ring-1 focus:ring-blue-600 outline-none"
                >
                  {lembagaList.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.nama} ({l.jenjang} - Kec. {l.kecamatan_nama})
                    </option>
                  ))}
                </select>
              ) : (
                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800">
                  {targetLembaga?.nama || currentUser.lembaga_nama || 'Lembaga Anda'}
                  {targetLembaga?.jenjang ? ` (${targetLembaga.jenjang})` : ''}
                  {targetLembaga?.kecamatan_nama || currentUser.kecamatan_nama
                    ? ` • Kec. ${targetLembaga?.kecamatan_nama || currentUser.kecamatan_nama}`
                    : ''}
                </div>
              )}
            </div>

            {/* Mode Unggah */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Mode Pembaruan Data
              </label>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <label
                  className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition ${uploadMode === 'perbarui'
                      ? 'border-blue-600 bg-blue-50/50 text-blue-900 font-semibold'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                >
                  <input
                    type="radio"
                    name="mode"
                    value="perbarui"
                    checked={uploadMode === 'perbarui'}
                    onChange={() => setUploadMode('perbarui')}
                    className="text-blue-600"
                  />
                  <span>Perbarui Saja (Upsert)</span>
                </label>

                <label
                  className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition ${uploadMode === 'ganti_semua'
                      ? 'border-rose-600 bg-rose-50/50 text-rose-900 font-semibold'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                >
                  <input
                    type="radio"
                    name="mode"
                    value="ganti_semua"
                    checked={uploadMode === 'ganti_semua'}
                    onChange={() => setUploadMode('ganti_semua')}
                    className="text-rose-600"
                  />
                  <span>Ganti Semua Data</span>
                </label>
              </div>
            </div>
          </div>

          {/* Drag & Drop File Picker */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-slate-300 hover:border-blue-600 rounded-2xl p-8 text-center cursor-pointer transition bg-slate-50/50 hover:bg-blue-50/30"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileChange}
              className="hidden"
            />
            <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center mx-auto mb-3">
              <UploadCloud className="w-6 h-6" />
            </div>
            <p className="text-sm font-bold text-slate-800">
              {isProcessing
                ? 'Memproses file...'
                : fileName
                  ? fileName
                  : 'Klik atau tarik file Excel / CSV ke sini'}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Mendukung format .xlsx, .xls, atau .csv (Maksimal 5.000 baris per file)
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Validation Summary & Preview Table */}
      {parsedRows.length > 0 && (
        <div className="space-y-4 mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="border-slate-200 bg-slate-50/50">
              <CardContent className="p-4 flex items-center gap-3">
                <FileCheck className="w-8 h-8 text-slate-600" />
                <div>
                  <p className="text-[11px] text-slate-500 font-semibold uppercase">
                    Total Baris File
                  </p>
                  <h4 className="text-xl font-extrabold text-slate-900">
                    {parsedRows.length} Baris
                  </h4>
                </div>
              </CardContent>
            </Card>

            <Card className="border-emerald-200 bg-emerald-50/30">
              <CardContent className="p-4 flex items-center gap-3">
                <CheckCircle2 className="w-8 h-8 text-emerald-600" />
                <div>
                  <p className="text-[11px] text-emerald-700 font-semibold uppercase">
                    Baris Valid (Siap Disimpan)
                  </p>
                  <h4 className="text-xl font-extrabold text-emerald-800">
                    {validCount} Baris
                  </h4>
                </div>
              </CardContent>
            </Card>

            <Card className="border-rose-200 bg-rose-50/30">
              <CardContent className="p-4 flex items-center gap-3">
                <AlertCircle className="w-8 h-8 text-rose-600" />
                <div>
                  <p className="text-[11px] text-rose-700 font-semibold uppercase">
                    Baris Error / Tidak Valid
                  </p>
                  <h4 className="text-xl font-extrabold text-rose-800">
                    {invalidCount} Baris
                  </h4>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-white rounded-xl border border-slate-200">
            <div className="text-xs text-slate-600">
              {invalidCount > 0 ? (
                <span className="text-rose-700 font-semibold flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                  Ditemukan {invalidCount} baris bermasalah. Anda bisa mengunduh laporan error untuk diperbaiki.
                </span>
              ) : (
                <span className="text-emerald-700 font-semibold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Seluruh {validCount} baris data dinyatakan valid dan siap disimpan.
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {invalidCount > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownloadErrors}
                  leftIcon={<Download className="w-4 h-4" />}
                >
                  Unduh Laporan Error
                </Button>
              )}

              <Button
                variant="primary"
                size="sm"
                disabled={validCount === 0}
                onClick={handleCommitUpload}
                leftIcon={<FileCheck className="w-4 h-4" />}
              >
                Simpan {validCount} Data Valid
              </Button>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Pratinjau Hasil Validasi Data</CardTitle>
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto max-h-96">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="sticky top-0 bg-slate-100 z-10">
                  <tr className="border-b border-slate-200 text-slate-600 font-semibold">
                    <th className="py-2.5 px-3 w-16 text-center">Baris</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">NISN</th>
                    <th className="py-2.5 px-3">Nama Siswa</th>
                    <th className="py-2.5 px-3">Tgl Lahir</th>
                    <th className="py-2.5 px-3">Alamat</th>
                    <th className="py-2.5 px-3">Ayah &amp; Ibu</th>
                    <th className="py-2.5 px-3">Keterangan Error</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {parsedRows.map((row) => (
                    <tr
                      key={row.rowNumber}
                      className={row.isValid ? 'hover:bg-slate-50' : 'bg-red-50/40 hover:bg-red-50'}
                    >
                      <td className="py-2 px-3 text-center font-mono text-slate-500">
                        {row.rowNumber}
                      </td>
                      <td className="py-2 px-3">
                        {row.isValid ? (
                          <Badge variant="success">Valid</Badge>
                        ) : (
                          <Badge variant="danger">Error</Badge>
                        )}
                      </td>
                      <td className="py-2 px-3 font-mono">
                        {row.nisn || <span className="text-slate-400 italic">-</span>}
                      </td>
                      <td className="py-2 px-3 font-semibold text-slate-900">
                        {row.nama || <span className="text-red-600 italic">Kosong</span>}
                      </td>
                      <td className="py-2 px-3">
                        {row.tanggal_lahir || <span className="text-red-600 italic">Tidak Valid</span>}
                      </td>
                      <td className="py-2 px-3 truncate max-w-xs">{row.alamat}</td>
                      <td className="py-2 px-3">
                        {row.nama_ayah} / {row.nama_ibu}
                      </td>
                      <td className="py-2 px-3 text-rose-700 font-medium">
                        {row.errors.join('; ')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Riwayat Pengunggahan */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="w-4 h-4 text-slate-500" />
            Riwayat Pengunggahan Terakhir
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                <th className="py-3 px-4">Waktu Unggah</th>
                <th className="py-3 px-4">Lembaga</th>
                <th className="py-3 px-4">Nama File</th>
                <th className="py-3 px-4">Pengunggah</th>
                <th className="py-3 px-4 text-center">Berhasil</th>
                <th className="py-3 px-4 text-center">Gagal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {uploadLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    Belum ada riwayat pengunggahan.
                  </td>
                </tr>
              ) : (
                uploadLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50">
                    <td className="py-2.5 px-4 text-slate-600">
                      {formatDateTimeIndo(log.created_at)}
                    </td>
                    <td className="py-2.5 px-4 font-semibold text-slate-900">
                      {log.lembaga_nama}
                    </td>
                    <td className="py-2.5 px-4 font-mono text-slate-700">{log.nama_file}</td>
                    <td className="py-2.5 px-4 text-slate-600">{log.user_nama}</td>
                    <td className="py-2.5 px-4 text-center font-bold text-emerald-700">
                      {log.baris_berhasil}
                    </td>
                    <td className="py-2.5 px-4 text-center font-bold text-rose-600">
                      {log.baris_gagal}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Modal Peringatan Ganti Semua Data */}
      <Modal
        isOpen={showReplaceModal}
        onClose={() => setShowReplaceModal(false)}
        title="Konfirmasi Ganti Semua Data Lembaga"
      >
        <div className="space-y-4 text-xs">
          <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 flex items-start gap-2.5">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <strong className="block font-bold">PERINGATAN TINGKAT TINGGI</strong>
              Mode <em>Ganti Semua Data</em> akan menghapus seluruh data siswa yang saat ini tercatat di lembaga{' '}
              <strong>{targetLembaga?.nama || currentUser.lembaga_nama}</strong> dan menggantikannya sepenuhnya dengan file baru.
            </div>
          </div>
          <p className="text-slate-600">
            Apakah Anda yakin ingin melanjutkan proses penggantian seluruh data?
          </p>
          <div className="pt-2 flex items-center justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowReplaceModal(false)}
            >
              Batalkan
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={handleCommitUpload}
            >
              Saya Yakin, Ganti Semua Data
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal Hasil Sukses */}
      <Modal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        title="Pengunggahan Data Berhasil"
      >
        <div className="space-y-4 text-center py-2 text-xs">
          <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h4 className="text-base font-bold text-slate-900">
            Data Peserta Didik Berhasil Diperbarui
          </h4>
          <p className="text-slate-600 max-w-sm mx-auto">
            Sebanyak <strong>{saveResult?.successCount}</strong> data siswa berhasil diproses ({saveResult?.insertedCount} siswa baru, {saveResult?.updatedCount} data diperbarui).
          </p>
          <div className="pt-2">
            <Button
              variant="primary"
              size="sm"
              onClick={() => setShowSuccessModal(false)}
            >
              Tutup &amp; Selesai
            </Button>
          </div>
        </div>
      </Modal>
    </AppLayout>
  );
}