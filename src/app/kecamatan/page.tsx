'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { MapPin, School, Users, Search, ArrowRight, ShieldAlert } from 'lucide-react';
import AppLayout from '@/components/layout/AppLayout';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { AppDataStore } from '@/lib/store';
import { Kecamatan, UserProfile, Lembaga, Siswa } from '@/lib/types';

export default function KecamatanPage() {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [kecamatanList, setKecamatanList] = useState<
    (Kecamatan & { total_lembaga: number; total_siswa: number })[]
  >([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const user = AppDataStore.getCurrentUser();
    setCurrentUser(user);

    const kList = AppDataStore.getKecamatan();
    const lList = AppDataStore.getLembagaList();
    const sList = AppDataStore.getSiswaList();

    const enriched = kList.map((k) => {
      const lemCount = lList.filter((l) => l.kecamatan_id === k.id).length;
      const sisCount = sList.filter((s) => s.kecamatan_id === k.id).length;
      return {
        ...k,
        total_lembaga: lemCount,
        total_siswa: sisCount,
      };
    });

    setKecamatanList(enriched);
  }, []);

  if (!currentUser) return null;

  // PRD Role Check: Admin only can manage master data kecamatan
  if (currentUser.role !== 'admin') {
    return (
      <AppLayout title="Akses Dibatasi">
        <div className="p-8 text-center bg-white rounded-xl border border-slate-200">
          <ShieldAlert className="w-12 h-12 mx-auto text-amber-500 mb-3" />
          <h3 className="text-base font-bold text-slate-800">
            Halaman Khusus Administrator Dinas
          </h3>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
            Halaman master data kecamatan hanya dapat diakses oleh Administrator Dinas Pendidikan dan Kebudayaan.
          </p>
        </div>
      </AppLayout>
    );
  }

  const filtered = kecamatanList.filter((k) =>
    k.nama.toLowerCase().includes(searchQuery.toLowerCase().trim())
  );

  return (
    <AppLayout
      title="Master Data Kecamatan Boyolali"
      subtitle="Daftar wilayah administrasi 22 kecamatan di Kabupaten Boyolali"
      breadcrumbs={[{ label: 'Kecamatan' }]}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <span className="text-xs font-semibold text-slate-500">
            Total <strong className="text-blue-700">{kecamatanList.length}</strong> Kecamatan
          </span>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Cari kecamatan..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-600 outline-none"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filtered.map((kec, idx) => (
          <Card key={kec.id} className="hover:border-blue-300 transition-colors">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-bold text-slate-400">
                  #{String(idx + 1).padStart(2, '0')}
                </span>
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
                  <MapPin className="w-4 h-4" />
                </div>
              </div>

              <h3 className="font-bold text-slate-900 text-base">
                Kec. {kec.nama}
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">Kabupaten Boyolali</p>

              <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px]">Lembaga</span>
                  <span className="font-bold text-slate-800 flex items-center gap-1 mt-0.5">
                    <School className="w-3 h-3 text-slate-400" />
                    {kec.total_lembaga}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Siswa</span>
                  <span className="font-bold text-blue-700 flex items-center gap-1 mt-0.5">
                    <Users className="w-3 h-3 text-blue-400" />
                    {kec.total_siswa}
                  </span>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100">
                <Link href={`/lembaga?kecamatan_id=${kec.id}`}>
                  <button className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold text-blue-700 hover:bg-blue-50 transition">
                    <span>Lihat Lembaga</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </AppLayout>
  );
}
