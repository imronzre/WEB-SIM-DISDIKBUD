import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const kecamatanId = searchParams.get('kecamatan_id');
    const lembagaId = searchParams.get('lembaga_id');
    const jenjang = searchParams.get('jenjang');
    const q = searchParams.get('q');

    const supabase = await createServerSupabaseClient();
    let query = supabase
      .from('siswa')
      .select(`
        *,
        lembaga:lembaga_id (
          nama,
          jenjang,
          kecamatan_id,
          kecamatan:kecamatan_id (nama)
        )
      `)
      .order('created_at', { ascending: false });

    if (lembagaId && lembagaId !== 'all') {
      query = query.eq('lembaga_id', lembagaId);
    }
    if (q) {
      query = query.or(`nama.ilike.%${q}%,nisn.ilike.%${q}%,alamat.ilike.%${q}%`);
    }

    const { data, error } = await query;
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    let formatted = (data || []).map((s: any) => ({
      ...s,
      lembaga_nama: s.lembaga?.nama || '',
      jenjang: s.lembaga?.jenjang || 'TK',
      kecamatan_id: s.lembaga?.kecamatan_id || '',
      kecamatan_nama: s.lembaga?.kecamatan?.nama || '',
    }));

    if (kecamatanId && kecamatanId !== 'all') {
      formatted = formatted.filter((s: any) => s.kecamatan_id === kecamatanId);
    }
    if (jenjang && jenjang !== 'all') {
      formatted = formatted.filter((s: any) => s.jenjang === jenjang);
    }

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
        .from('siswa')
        .update({
          nisn: body.nisn || null,
          nama: body.nama,
          tanggal_lahir: body.tanggal_lahir,
          alamat: body.alamat,
          nama_ayah: body.nama_ayah,
          nama_ibu: body.nama_ibu,
          lembaga_id: body.lembaga_id,
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
        .from('siswa')
        .insert({
          nisn: body.nisn || null,
          nama: body.nama,
          tanggal_lahir: body.tanggal_lahir,
          alamat: body.alamat,
          nama_ayah: body.nama_ayah,
          nama_ibu: body.nama_ibu,
          lembaga_id: body.lembaga_id,
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

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID siswa diperlukan' }, { status: 400 });

    const supabase = await createServerSupabaseClient();
    const { error } = await supabase.from('siswa').delete().eq('id', id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
