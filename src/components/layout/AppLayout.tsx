'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  School,
  MapPin,
  UploadCloud,
  FileText,
  UserCog,
  History,
  LogOut,
  Menu,
  X,
  ChevronRight,
  ShieldAlert,
  Building2,
  Database,
  UserCheck,
} from 'lucide-react';
import { AppDataStore } from '@/lib/store';
import { UserProfile, normalizeRole } from '@/lib/types';
import { createClient } from '@/lib/supabase/client';

interface AppLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  breadcrumbs?: { label: string; href?: string }[];
}

export default function AppLayout({
  children,
  title,
  subtitle,
  breadcrumbs,
}: AppLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    async function loadSession() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        // Jika tidak ada sesi auth di Supabase, redirect ke login
        router.replace('/login');
        return;
      }

      // Ambil profile dari database Supabase
      const { data: profile } = await supabase
        .from('profiles')
        .select(`
          *,
          kecamatan:kecamatan_id (nama),
          lembaga:lembaga_id (nama)
        `)
        .eq('id', user.id)
        .single();

      if (profile) {
        const uProfile: UserProfile = {
          id: profile.id,
          email: profile.email || user.email || '',
          nama: profile.nama,
          role: profile.role,
          kecamatan_id: profile.kecamatan_id,
          kecamatan_nama: profile.kecamatan?.nama || null,
          lembaga_id: profile.lembaga_id,
          lembaga_nama: profile.lembaga?.nama || null,
        };
        setCurrentUser(uProfile);
        AppDataStore.setCurrentUser(uProfile);
      } else {
        const fallback = AppDataStore.getCurrentUser();
        setCurrentUser(fallback);
      }
    }

    loadSession();
  }, [router]);

  const handleLogout = async () => {
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
    } catch (e) {
      console.warn('Sign out error:', e);
    }
    if (typeof window !== 'undefined') {
      localStorage.removeItem('boyolali_current_user');
      window.location.href = '/login';
    }
  };

  if (!currentUser) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-blue-700 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs text-slate-500 font-medium">Memuat sesi pengguna...</p>
        </div>
      </div>
    );
  }

  const role = normalizeRole(currentUser.role);

  // Pembatasan Akses Menu Sesuai Role
  const navItems = [
    {
      label: 'Dashboard',
      href: '/dashboard',
      icon: LayoutDashboard,
      roles: ['admin_dinas', 'admin_kecamatan', 'operator_sekolah'],
    },
    {
      label: 'Data Siswa',
      href: '/siswa',
      icon: Users,
      roles: ['admin_dinas', 'admin_kecamatan', 'operator_sekolah'],
    },
    {
      label: 'Daftar Lembaga',
      href: '/lembaga',
      icon: School,
      roles: ['admin_dinas', 'admin_kecamatan', 'operator_sekolah'],
    },
    {
      label: 'Kecamatan',
      href: '/kecamatan',
      icon: MapPin,
      roles: ['admin_dinas'], // Hanya Admin Dinas
    },
    {
      label: 'Unggah Excel Siswa',
      href: '/unggah',
      icon: UploadCloud,
      roles: ['admin_dinas', 'operator_sekolah'], // Admin Dinas & Operator Sekolah (Kecamatan tidak bisa)
    },
    {
      label: 'Laporan & Cetak',
      href: '/laporan',
      icon: FileText,
      roles: ['admin_dinas', 'admin_kecamatan', 'operator_sekolah'],
    },
    {
      label: 'Manajemen Akun',
      href: '/pengguna',
      icon: UserCog,
      roles: ['admin_dinas'], // Hanya Admin Dinas
    },
    {
      label: 'Log Aktivitas',
      href: '/log-aktivitas',
      icon: History,
      roles: ['admin_dinas'], // Hanya Admin Dinas
    },
  ];

  const allowedNav = navItems.filter((item) => item.roles.includes(role));

  // Pengecekan akses rute halaman saat ini
  const currentNavRule = navItems.find((item) => pathname === item.href || pathname.startsWith(`${item.href}/`));
  const isUnauthorizedPage = currentNavRule && !currentNavRule.roles.includes(role);

  const roleDisplayInfo = {
    admin_dinas: {
      badge: 'Admin Dinas',
      badgeBg: 'bg-rose-100 text-rose-800 border-rose-200',
      desc: 'Bidang PAUDNI Disdikbud',
    },
    admin_kecamatan: {
      badge: 'Admin Kecamatan',
      badgeBg: 'bg-amber-100 text-amber-800 border-amber-200',
      desc: currentUser.kecamatan_nama ? `Korwil Kec. ${currentUser.kecamatan_nama}` : 'Korwil Kecamatan',
    },
    operator_sekolah: {
      badge: 'Operator Sekolah',
      badgeBg: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      desc: currentUser.lembaga_nama || 'Operator Lembaga PAUD/TK',
    },
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      {/* Top Banner Status */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-slate-900 text-white text-xs px-4 py-2 flex items-center justify-between shadow no-print">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-blue-300 flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5" />
            DISDIKBUD KAB. BOYOLALI
          </span>
          <span className="text-slate-500">|</span>
          <span className="text-slate-300 hidden sm:inline">Bidang PAUDNI</span>
          <span className="text-slate-500 hidden sm:inline">•</span>
          <span className="text-slate-300">
            Peran: <strong className="text-white capitalize">{roleDisplayInfo[role].badge}</strong>
          </span>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-emerald-400 text-[11px]">
            <Database className="w-3 h-3" />
            <span>Supabase Auth Aktif</span>
          </div>
          <button
            onClick={handleLogout}
            className="text-[11px] px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition flex items-center gap-1"
          >
            <LogOut className="w-3 h-3" />
            Keluar
          </button>
        </div>
      </div>

      {/* Mobile Topbar */}
      <div className="md:hidden fixed top-8 left-0 right-0 z-40 bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between no-print">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-700 text-white flex items-center justify-center font-bold text-sm">
            BYL
          </div>
          <span className="font-bold text-slate-800 text-sm">SIM-PAUDNI</span>
        </div>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Sidebar Navigation */}
      <aside
        className={`fixed md:sticky top-8 md:top-8 h-[calc(100vh-2rem)] w-64 bg-white border-r border-slate-200/90 z-40 flex flex-col transition-transform duration-200 no-print ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Brand */}
        <div className="p-5 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-700 to-indigo-600 text-white flex items-center justify-center font-bold shadow-sm shadow-blue-500/20">
              <School className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-slate-900 text-sm leading-tight">
                SIM-PAUDNI
              </h1>
              <p className="text-[11px] text-slate-500">Kabupaten Boyolali</p>
            </div>
          </div>
        </div>

        {/* User Card */}
        <div className="p-4 mx-3 my-3 bg-slate-50 rounded-xl border border-slate-100">
          <div className="flex items-center justify-between">
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${roleDisplayInfo[role].badgeBg}`}
            >
              {roleDisplayInfo[role].badge}
            </span>
          </div>
          <p className="font-semibold text-xs text-slate-900 mt-2 truncate">
            {currentUser.nama}
          </p>
          <p className="text-[11px] text-slate-500 truncate">
            {currentUser.email}
          </p>
          <p className="text-[10px] text-blue-700 font-medium mt-1 truncate">
            {roleDisplayInfo[role].desc}
          </p>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
          {allowedNav.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition ${
                  isActive
                    ? 'bg-blue-700 text-white shadow-sm shadow-blue-600/30'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Logout Footer */}
        <div className="p-4 border-t border-slate-100">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-slate-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition"
          >
            <LogOut className="w-4 h-4" />
            <span>Keluar Sistem</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 pt-20 md:pt-10">
        <div className="p-4 md:p-8 max-w-7xl w-full mx-auto">
          {/* Breadcrumbs */}
          {breadcrumbs && breadcrumbs.length > 0 && !isUnauthorizedPage && (
            <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-4 no-print">
              <Link href="/dashboard" className="hover:text-blue-700">
                Beranda
              </Link>
              {breadcrumbs.map((bc, idx) => (
                <React.Fragment key={idx}>
                  <ChevronRight className="w-3 h-3 text-slate-400" />
                  {bc.href ? (
                    <Link href={bc.href} className="hover:text-blue-700">
                      {bc.label}
                    </Link>
                  ) : (
                    <span className="text-slate-800 font-semibold">{bc.label}</span>
                  )}
                </React.Fragment>
              ))}
            </div>
          )}

          {/* Block Unauthorized Page Access */}
          {isUnauthorizedPage ? (
            <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 shadow-sm max-w-lg mx-auto mt-8">
              <ShieldAlert className="w-16 h-16 mx-auto text-amber-500 mb-4" />
              <h3 className="text-lg font-bold text-slate-900">
                Akses Menu Dibatasi
              </h3>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                Akun Anda memiliki peran <strong className="text-slate-800">{roleDisplayInfo[role].badge}</strong> dan tidak memiliki izin untuk mengakses halaman ini.
              </p>
              <div className="mt-6">
                <Link href="/dashboard">
                  <button className="px-4 py-2 bg-blue-700 text-white rounded-lg text-xs font-semibold hover:bg-blue-800 transition">
                    Kembali ke Dashboard
                  </button>
                </Link>
              </div>
            </div>
          ) : (
            <>
              {/* Page Header */}
              {(title || subtitle) && (
                <div className="mb-6 no-print">
                  {title && <h2 className="text-2xl font-bold text-slate-900">{title}</h2>}
                  {subtitle && <p className="text-sm text-slate-500 mt-1">{subtitle}</p>}
                </div>
              )}

              {/* Child Content */}
              {children}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
