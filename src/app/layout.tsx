import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'SIM-PAUDNI | Dinas Pendidikan dan Kebudayaan Kab. Boyolali',
  description:
    'Sistem Informasi Pengelolaan Data Lembaga dan Peserta Didik PAUD, TK, dan Posyandu se-Kabupaten Boyolali',
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body className="min-h-screen bg-slate-50 text-slate-900 font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
