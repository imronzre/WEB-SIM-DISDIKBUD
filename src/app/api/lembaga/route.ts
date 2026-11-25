import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const kecamatanId = searchParams.get('kecamatan_id');
    const jenjang = searchParams.get('jenjang');
    const q = searchParams.get('q');

    const supabase = await createServerSupabaseClient();
    let query = supabase
      .from('lembaga')
      .select(`
        *,
        kecamatan:kecamatan_id (nama)
      `)
      .order('nama', { ascending: true });

    if (kecamatanId && kecamatanId !== 'all') {
      query = query.eq('kecamatan_id', kecamatanId);
    }
    if (jenjang && jenjang !== 'all') {
      query = query.eq('jenjang', jenjang);
    }
    if (q) {
      query = query.ilike('nama', `%${q}%`);
    }

    const { data, error } = await query;
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const formatted = (data || []).map((l: any) => ({
      ...l,
      kecamatan_nama: l.kecamatan?.nama || '',
    }));

    return NextResponse.json({ data: formatted });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const supabase = await createServerSupabaseClient();

    if (body.id) {
      // Update
      const { data, error } = await supabase
        .from('lembaga')
        .update({
          nama: body.nama,
          npsn: body.npsn || null,
          jenjang: body.jenjang,
          kecamatan_id: body.kecamatan_id,
          desa: body.desa,
          alamat: body.alamat,
          status: body.status,
          kontak: body.kontak || null,
          aktif: body.aktif !== undefined ? body.aktif : true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', body.id)
        .select()
        .single();

      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ data });
    } else {
      // Insert
      const { data, error } = await supabase
        .from('lembaga')
        .insert({
          nama: body.nama,
          npsn: body.npsn || null,
          jenjang: body.jenjang,
          kecamatan_id: body.kecamatan_id,
          desa: body.desa,
          alamat: body.alamat,
          status: body.status || 'Swasta',
          kontak: body.kontak || null,
          aktif: true,
        })
        .select()
        .single();

      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ data });
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
