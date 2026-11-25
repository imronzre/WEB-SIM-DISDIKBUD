'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, Mail, ShieldCheck, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { AppDataStore, DEMO_PROFILES } from '@/lib/store';
import { isSupabaseConfigured, createClient } from '@/lib/supabase/client';
import { normalizeRole } from '@/lib/types';

type LoginRole = 'admin_dinas' | 'admin_kecamatan' | 'operator_sekolah';

export default function LoginPage() {
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState<LoginRole>('admin_dinas');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleManualLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !password.trim()) {
      setErrorMsg('Alamat email dan kata sandi wajib diisi secara manual.');
      return;
    }

    setLoading(true);
    try {
      if (isSupabaseConfigured()) {
        const supabase = createClient();
        const { data, error } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password,
        });

        if (error || !data.user) {
          setErrorMsg('Email atau kata sandi tidak valid.');
          setLoading(false);
          return;
        }

        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .single();

        const resolvedRole = normalizeRole(
          profile?.role || data.user.user_metadata?.role || 'operator_sekolah'
        );

        if (resolvedRole !== selectedRole) {
          await supabase.auth.signOut();
          setErrorMsg('Peran yang dipilih tidak sesuai dengan hak akses akun ini.');
          setLoading(false);
          return;
        }

        AppDataStore.setCurrentUser({
          id: data.user.id,
          email: data.user.email || cleanEmail,
          nama: profile?.nama || data.user.user_metadata?.nama || cleanEmail,
          role: resolvedRole,
          kecamatan_id: profile?.kecamatan_id ?? null,
          kecamatan_nama: profile?.kecamatan_nama ?? null,
          lembaga_id: profile?.lembaga_id ?? null,
          lembaga_nama: profile?.lembaga_nama ?? null,
        });

        router.push('/dashboard');
        return;
      }

      // Fallback lokal jika Supabase belum dikonfigurasi: cocokkan email & role manual
      const matchedProfile = Object.values(DEMO_PROFILES).find(
        (p) =>
          p.email.toLowerCase() === cleanEmail &&
          normalizeRole(p.role) === selectedRole
      );

      if (!matchedProfile) {
        setErrorMsg('Akun tidak ditemukan atau peran tidak sesuai dengan email yang dimasukkan.');
        setLoading(false);
        return;
      }

      AppDataStore.setCurrentUser({
        ...matchedProfile,
        role: selectedRole,
      });
      router.push('/dashboard');
    } catch {
      setErrorMsg('Terjadi kesalahan saat memproses login.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex flex-col items-center justify-center p-4">
      <div className="text-center text-white mb-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-blue-200 text-xs font-semibold mb-2">
          <ShieldCheck className="w-4 h-4" />
          SIM-PAUDNI BOYOLALI
        </div>
        <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight">
          DINAS PENDIDIKAN DAN KEBUDAYAAN KAB. BOYOLALI
        </h1>
        <p className="text-xs text-blue-200/80 mt-1">
          Sistem Informasi Data Lembaga &amp; Peserta Didik TK, KB, SPS, dan TPA
        </p>
      </div>

      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-6 sm:p-7">
        <form onSubmit={handleManualLogin} className="space-y-4 text-xs">
          {errorMsg && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Pilih Peran Pengguna (Role) *
            </label>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value as LoginRole)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 bg-white text-slate-800 font-medium focus:ring-1 focus:ring-blue-600 outline-none"
            >
              <option value="admin_dinas">Admin Dinas</option>
              <option value="admin_kecamatan">Admin Kecamatan</option>
              <option value="operator_sekolah">Operator Sekolah</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Alamat Email Akun *
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="email"
                autoComplete="off"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Masukkan email sesuai peran"
                className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-slate-800 focus:ring-1 focus:ring-blue-600 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Kata Sandi (Password) *
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Masukkan kata sandi"
                className="w-full pl-9 pr-9 py-2 border border-slate-300 rounded-lg text-slate-800 focus:ring-1 focus:ring-blue-600 outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Lihat kata sandi'}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 focus:outline-none"
                tabIndex={-1}
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          <Button
            type="submit"
            variant="primary"
            size="md"
            disabled={loading}
            className="w-full justify-center mt-2"
          >
            {loading ? 'Memverifikasi Akun...' : 'Masuk ke Sistem →'}
          </Button>
        </form>
      </div>
    </div>
  );
}