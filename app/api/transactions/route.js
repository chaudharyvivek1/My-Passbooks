import { NextResponse } from 'next/server';
import pool from '@/app/lib/db';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const listId = searchParams.get('listId');

    let transactions;
    if (!listId) {
      [transactions] = await pool.query('SELECT * FROM transactions ORDER BY id DESC LIMIT 100');
    } else {
      [transactions] = await pool.query('SELECT * FROM transactions WHERE listId = ?', [listId]);
    }
    
    // Map id to string to match frontend expectations
    const formattedTransactions = transactions.map(tx => ({
      ...tx,
      id: tx.id.toString(),
      amount: parseFloat(tx.amount) // MySQL returns DECIMAL as string in mysql2 by default unless configured
    }));
    
    return NextResponse.json(formattedTransactions);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Failed to fetch transactions' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { listId, date, description, amount, type } = body;
    
    if (!listId || !description || amount === undefined || !type) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const parsedAmount = parseFloat(amount);
    const [result] = await pool.query(
      'INSERT INTO transactions (listId, date, description, amount, type) VALUES (?, ?, ?, ?, ?)',
      [listId, date, description, parsedAmount, type]
    );
    
    return NextResponse.json({
      id: result.insertId.toString(),
      listId,
      date,
      description,
      amount: parsedAmount,
      type
    }, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Failed to create transaction' }, { status: 500 });
  }
}
