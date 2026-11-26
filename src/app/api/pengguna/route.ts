import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const UUID_REGEX =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function toValidUuid(val: unknown): string | null {
    if (typeof val === 'string' && UUID_REGEX.test(val.trim())) {
        return val.trim();
    }
    return null;
}

function getAdminClient() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !serviceKey) return null;
    return createClient(url, serviceKey, {
        auth: { autoRefreshToken: false, persistSession: false },
    });
}

function getAnonClient() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !anonKey) return null;
    return createClient(url, anonKey, {
        auth: { autoRefreshToken: false, persistSession: false },
    });
}

export async function POST(req: NextRequest) {
    try {
        const supabaseAdmin = getAdminClient();
        if (!supabaseAdmin) {
            return NextResponse.json(
                { error: 'SUPABASE_SERVICE_ROLE_KEY belum diatur di environment.' },
                { status: 500 }
            );
        }

        const body = await req.json();
        const { nama, email, password, role, kecamatan_id, lembaga_id } = body;
        const resolvedPassword =
            typeof password === 'string' && password.trim().length > 0
                ? password.trim()
                : '123456';

        if (resolvedPassword.length < 6) {
            return NextResponse.json(
                { error: 'Kata sandi minimal 6 karakter.' },
                { status: 400 }
            );
        }

        const { data: created, error: createErr } =
            await supabaseAdmin.auth.admin.createUser({
                email,
                password: resolvedPassword,
                email_confirm: true,
                user_metadata: { nama, role },
            });

        if (createErr || !created.user) {
            return NextResponse.json(
                { error: createErr?.message || 'Gagal membuat user Auth.' },
                { status: 400 }
            );
        }

        const { error: profileErr } = await supabaseAdmin.from('profiles').upsert({
            id: created.user.id,
            email,
            nama,
            role,
            kecamatan_id: toValidUuid(kecamatan_id),
            lembaga_id: toValidUuid(lembaga_id),
        });

        if (profileErr) {
            return NextResponse.json({ error: profileErr.message }, { status: 400 });
        }

        return NextResponse.json({ id: created.user.id });
    } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : 'Terjadi kesalahan server.';
        return NextResponse.json({ error: msg }, { status: 500 });
    }
}

export async function PATCH(req: NextRequest) {
    try {
        const supabaseAdmin = getAdminClient();
        if (!supabaseAdmin) {
            return NextResponse.json(
                { error: 'SUPABASE_SERVICE_ROLE_KEY belum diatur.' },
                { status: 500 }
            );
        }

        const { id, password, email, currentPassword } = await req.json();

        if (!id) {
            return NextResponse.json({ error: 'ID pengguna wajib disertakan.' }, { status: 400 });
        }

        const nextPassword =
            typeof password === 'string' && password.trim().length > 0
                ? password.trim()
                : '123456';

        if (nextPassword.length < 6) {
            return NextResponse.json(
                { error: 'Kata sandi baru minimal 6 karakter.' },
                { status: 400 }
            );
        }

        // Jika ganti sandi mandiri menyertakan email & currentPassword, verifikasi dulu sandi lama
        if (email && currentPassword) {
            const anonClient = getAnonClient();
            if (anonClient) {
                const { error: verifyErr } = await anonClient.auth.signInWithPassword({
                    email: String(email).trim().toLowerCase(),
                    password: String(currentPassword),
                });
                if (verifyErr) {
                    return NextResponse.json(
                        { error: 'Kata sandi saat ini tidak sesuai.' },
                        { status: 400 }
                    );
                }
            }
        }

        const { error } = await supabaseAdmin.auth.admin.updateUserById(id, {
            password: nextPassword,
        });

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 400 });
        }

        return NextResponse.json({ ok: true });
    } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : 'Terjadi kesalahan server.';
        return NextResponse.json({ error: msg }, { status: 500 });
    }
}