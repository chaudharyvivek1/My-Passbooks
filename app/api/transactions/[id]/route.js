import { NextResponse } from 'next/server';
import pool from '@/app/lib/db';

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    
    await pool.query('DELETE FROM transactions WHERE id = ?', [id]);
    
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Failed to delete transaction' }, { status: 500 });
  }
}
