import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getAdminClient() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !serviceKey) return null;
    return createClient(url, serviceKey, {
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

        const { data: created, error: createErr } =
            await supabaseAdmin.auth.admin.createUser({
                email,
                password: password || '123456',
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
            kecamatan_id: kecamatan_id || null,
            lembaga_id: lembaga_id || null,
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

        const { id, password } = await req.json();
        const { error } = await supabaseAdmin.auth.admin.updateUserById(id, {
            password: password || '123456',
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