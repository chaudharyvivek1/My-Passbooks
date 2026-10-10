import { NextResponse } from 'next/server';
import pool from '@/app/lib/db';

export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, restore } = body;

    if (restore) {
      await pool.query('UPDATE lists SET isDeleted = FALSE WHERE id = ?', [id]);
      return NextResponse.json({ success: true });
    }

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    await pool.query('UPDATE lists SET name = ? WHERE id = ?', [name, id]);
    
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Failed to update list' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const hard = searchParams.get('hard') === 'true';

    if (hard) {
      // Hard delete the list
      await pool.query('DELETE FROM lists WHERE id = ?', [id]);
      // Cascade delete transactions for this list
      await pool.query('DELETE FROM transactions WHERE listId = ?', [id]);
    } else {
      // Soft delete the list
      await pool.query('UPDATE lists SET isDeleted = TRUE WHERE id = ?', [id]);
    }
    
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Failed to delete list' }, { status: 500 });
  }
}
