'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { School, Lock, Mail, ArrowRight, ShieldCheck, UserCheck } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { AppDataStore } from '@/lib/store';
import { createClient } from '@/lib/supabase/client';
import { UserProfile } from '@/lib/types';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('admin.dinas@boyolali.go.id');
  const [password, setPassword] = useState('AdminDinas123!');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // 3 Akun Uji Coba Resmi Sesuai Permintaan
  const testAccounts = [
    {
      label: 'Admin Dinas',
      role: 'admin_dinas',
      email: 'admin.dinas@boyolali.go.id',
      password: 'AdminDinas123!',
      color: 'bg-rose-50 text-rose-800 border-rose-200 hover:bg-rose-100',
    },
    {
      label: 'Admin Kecamatan',
      role: 'admin_kecamatan',
      email: 'korwil.boyolali@boyolali.go.id',
      password: 'Kecamatan123!',
      color: 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100',
    },
    {
      label: 'Operator Sekolah',
      role: 'operator_sekolah',
      email: 'tk.pembina@boyolali.go.id',
      password: 'Operator123!',
      color: 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100',
    },
  ];

  const handleSelectAccount = (acc: typeof testAccounts[0]) => {
    setEmail(acc.email);
    setPassword(acc.password);
    setErrorMsg('');
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      const supabase = createClient();
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password: password,
      });

      if (authError) {
        throw new Error(authError.message === 'Invalid login credentials' 
          ? 'Email atau kata sandi salah. Silakan periksa kembali.' 
          : authError.message);
      }

      if (!authData.user) {
        throw new Error('Sesi tidak valid.');
      }

      // Ambil data profil dan role resmi dari tabel profiles
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select(`
          *,
          kecamatan:kecamatan_id (nama),
          lembaga:lembaga_id (nama)
        `)
        .eq('id', authData.user.id)
        .single();

      if (profileError || !profile) {
        // Fallback jika profil belum terlink sempurna
        const fallbackProfile: UserProfile = {
          id: authData.user.id,
          email: authData.user.email || email,
          nama: authData.user.user_metadata?.nama || 'Petugas',
          role: authData.user.user_metadata?.role || 'admin_dinas',
        };
        AppDataStore.setCurrentUser(fallbackProfile);
      } else {
        const fullProfile: UserProfile = {
          id: profile.id,
          email: profile.email || email,
          nama: profile.nama,
          role: profile.role,
          kecamatan_id: profile.kecamatan_id,
          kecamatan_nama: profile.kecamatan?.nama || null,
          lembaga_id: profile.lembaga_id,
          lembaga_nama: profile.lembaga?.nama || null,
        };
        AppDataStore.setCurrentUser(fullProfile);
      }

      // Redirect ke dashboard
      window.location.href = '/dashboard';
    } catch (err: any) {
      setErrorMsg(err.message || 'Login gagal. Periksa koneksi atau kredensial Anda.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header Branding */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-500/30 mb-4 ring-8 ring-blue-500/10">
            <School className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            SIM-PAUDNI BOYOLALI
          </h1>
          <p className="text-xs text-blue-200/80 mt-1 uppercase tracking-widest font-semibold">
            Dinas Pendidikan dan Kebudayaan Kab. Boyolali
          </p>
          <p className="text-xs text-slate-400 mt-2">
            Sistem Informasi Data Lembaga & Peserta Didik PAUD, TK, dan Posyandu
          </p>
        </div>

        {/* Login Card */}
        <Card className="border-slate-800 bg-white/95 backdrop-blur shadow-2xl">
          <CardContent className="p-6">
            {errorMsg && (
              <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Alamat Email Akun
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="nama@boyolali.go.id"
                    className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Kata Sandi (Password)
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none transition"
                  />
                </div>
              </div>

              <Button
                type="submit"
                variant="primary"
                size="md"
                isLoading={loading}
                className="w-full mt-2"
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Masuk ke Sistem
              </Button>
            </form>

            {/* Quick Fill Test Accounts */}
            <div className="mt-6 pt-5 border-t border-slate-100">
              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider text-center mb-3">
                Pilih Akun Uji Coba Langsung (Supabase Auth)
              </p>
              <div className="grid grid-cols-3 gap-2">
                {testAccounts.map((acc) => (
                  <button
                    key={acc.role}
                    type="button"
                    onClick={() => handleSelectAccount(acc)}
                    className={`p-2.5 text-center rounded-xl border transition flex flex-col items-center justify-center ${acc.color}`}
                  >
                    <UserCheck className="w-3.5 h-3.5 mb-1" />
                    <p className="text-xs font-bold leading-tight">{acc.label}</p>
                    <p className="text-[10px] opacity-75 mt-0.5 font-mono">1-Klik Isi</p>
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Security Notice */}
        <div className="mt-6 flex items-center justify-center gap-2 text-xs text-slate-400">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Autentikasi Terverifikasi Resmi dengan Supabase Auth</span>
        </div>
      </div>
    </div>
  );
}
