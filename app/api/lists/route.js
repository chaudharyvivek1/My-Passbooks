import { NextResponse } from 'next/server';
import pool from '@/app/lib/db';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const deleted = searchParams.get('deleted') === 'true';

    let query = 'SELECT * FROM lists WHERE isDeleted = FALSE OR isDeleted IS NULL';
    if (deleted) {
      query = 'SELECT * FROM lists WHERE isDeleted = TRUE';
    }

    const [lists] = await pool.query(query);
    
    // Map id to string for frontend compatibility if needed
    const formattedLists = lists.map(list => ({
      ...list,
      id: list.id.toString()
    }));
    
    return NextResponse.json(formattedLists);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Failed to fetch lists' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { name } = body;
    
    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }
    
    const [result] = await pool.query('INSERT INTO lists (name) VALUES (?)', [name]);
    
    return NextResponse.json({ id: result.insertId.toString(), name }, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Failed to create list' }, { status: 500 });
  }
}
