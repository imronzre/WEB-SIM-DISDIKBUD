import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';

function clearSupabaseAuthCookies(request: NextRequest, response: NextResponse) {
  request.cookies.getAll().forEach(({ name }) => {
    if (name.startsWith('sb-')) {
      request.cookies.delete(name);
      response.cookies.delete(name);
    }
  });
}

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );
        response = NextResponse.next({
          request: {
            headers: request.headers,
          },
        });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      },
    },
  });

  let user = null;

  try {
    const {
      data,
      error,
    } = await supabase.auth.getUser();

    if (error) {
      const isRefreshTokenError =
        error.code === 'refresh_token_not_found' ||
        error.message?.toLowerCase().includes('refresh token');

      if (isRefreshTokenError) {
        clearSupabaseAuthCookies(request, response);
      }
    } else {
      user = data.user;
    }
  } catch {
    clearSupabaseAuthCookies(request, response);
  }

  const pathname = request.nextUrl.pathname;

  // Daftar rute yang wajib dilindungi dengan autentikasi
  const protectedRoutes = [
    '/dashboard',
    '/siswa',
    '/lembaga',
    '/kecamatan',
    '/laporan',
    '/unggah',
    '/pengguna',
    '/log-aktivitas',
  ];

  const isProtected = protectedRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );
  const isRoot = pathname === '/';
  const isLogin = pathname === '/login';

  // 1. Jika pengguna membuka halaman utama (/) atau rute terlindungi tanpa sesi login aktif -> REDIRECT KE /login
  if (!user && (isProtected || isRoot)) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = '/login';
    const redirectResponse = NextResponse.redirect(redirectUrl);
    clearSupabaseAuthCookies(request, redirectResponse);
    return redirectResponse;
  }

  // 2. Jika pengguna sudah login dan mencoba mengakses /login atau / -> REDIRECT KE /dashboard
  if (user && (isLogin || isRoot)) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = '/dashboard';
    return NextResponse.redirect(redirectUrl);
  }

  return response;
}

export const config = {
  matcher: [
    '/',
    '/login',
    '/dashboard/:path*',
    '/siswa/:path*',
    '/lembaga/:path*',
    '/kecamatan/:path*',
    '/laporan/:path*',
    '/unggah/:path*',
    '/pengguna/:path*',
    '/log-aktivitas/:path*',
  ],
};