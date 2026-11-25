import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  try {
    const { validRows, invalidCount, lembagaId, mode, fileName, user } = await req.json();

    if (!lembagaId) {
      return NextResponse.json({ error: 'Lembaga ID diperlukan' }, { status: 400 });
    }

    const supabase = await createServerSupabaseClient();

    // 1. Jika mode = 'ganti_semua', hapus data lama
    if (mode === 'ganti_semua') {
      await supabase.from('siswa').delete().eq('lembaga_id', lembagaId);
    }

    // 2. Ambil siswa yang sudah ada untuk matching
    const { data: existingSiswa } = await supabase
      .from('siswa')
      .select('id, nisn, nama, tanggal_lahir')
      .eq('lembaga_id', lembagaId);

    const existing = existingSiswa || [];
    let inserted = 0;
    let updated = 0;

    for (const row of validRows) {
      let matchId: string | null = null;

      if (row.nisn) {
        const found = existing.find((s) => s.nisn === row.nisn);
        if (found) matchId = found.id;
      } else {
        const found = existing.find(
          (s) =>
            s.nama.toLowerCase().trim() === row.nama.toLowerCase().trim() &&
            s.tanggal_lahir === row.tanggal_lahir
        );
        if (found) matchId = found.id;
      }

      if (matchId && mode !== 'ganti_semua') {
        // Update
        await supabase
          .from('siswa')
          .update({
            nisn: row.nisn || null,
            nama: row.nama,
            tanggal_lahir: row.tanggal_lahir,
            alamat: row.alamat,
            nama_ayah: row.nama_ayah,
            nama_ibu: row.nama_ibu,
            updated_at: new Date().toISOString(),
          })
          .eq('id', matchId);
        updated++;
      } else {
        // Insert
        await supabase.from('siswa').insert({
          nisn: row.nisn || null,
          nama: row.nama,
          tanggal_lahir: row.tanggal_lahir,
          alamat: row.alamat,
          nama_ayah: row.nama_ayah,
          nama_ibu: row.nama_ibu,
          lembaga_id: lembagaId,
        });
        inserted++;
      }
    }

    // 3. Catat upload_log
    await supabase.from('upload_log').insert({
      lembaga_id: lembagaId,
      user_id: user?.id || null,
      user_nama: user?.nama || 'Petugas',
      nama_file: fileName,
      mode: mode || 'perbarui',
      baris_berhasil: validRows.length,
      baris_gagal: invalidCount || 0,
    });

    // 4. Catat activity_log
    await supabase.from('activity_log').insert({
      user_id: user?.id || null,
      user_nama: user?.nama || 'Petugas',
      user_role: user?.role || 'lembaga',
      aksi: 'UNGGAH_DATA',
      detail: `Unggah berkas ${fileName}: ${validRows.length} berhasil, ${invalidCount || 0} gagal [Mode: ${mode}]`,
    });

    return NextResponse.json({
      success: true,
      successCount: validRows.length,
      insertedCount: inserted,
      updatedCount: updated,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
