'use client';

import React, { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import {
  Container, Box, Typography, Card, CardContent, TextField, MenuItem, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TableFooter, Paper, IconButton, Chip, Dialog, DialogTitle, DialogContent, DialogActions
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddCircleIcon from '@mui/icons-material/AddCircle';

export default function ListPage({ params }) {
  const unwrappedParams = use(params);
  const selectedListId = unwrappedParams.id;
  const router = useRouter();
  
  const [listName, setListName] = useState('Loading Passbook...');
  const [transactions, setTransactions] = useState([]);
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState('in');
  const [isLoaded, setIsLoaded] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  useEffect(() => {
    if (!selectedListId) return;
    
    const fetchListDetails = async () => {
      try {
        const res = await fetch('/api/lists');
        if (res.ok) {
          const data = await res.json();
          const currentList = data.find(l => l.id === selectedListId);
          if (currentList) setListName(currentList.name);
        }
      } catch (e) {
        console.warn('API Warning:', e.message);
      }
    };

    const fetchTransactions = async () => {
      try {
        const res = await fetch(`/api/transactions?listId=${selectedListId}`);
        if (res.ok) {
          const data = await res.json();
          setTransactions(Array.isArray(data) ? data : []);
        }
      } catch (e) {
        console.warn('API Warning:', e.message);
        setTransactions([]);
      } finally {
        setIsLoaded(true);
      }
    };

    fetchListDetails();
    fetchTransactions();
  }, [selectedListId]);

  const handleAddTransaction = async (e) => {
    e.preventDefault();
    if (!description || !amount || isNaN(amount) || !selectedListId) return;
    try {
      const newTxData = {
        listId: selectedListId,
        date: new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString(),
        description,
        amount: parseFloat(amount),
        type
      };
      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTxData)
      });
      if (res.ok) {
        const newTx = await res.json();
        setTransactions([...transactions, newTx]);
        setDescription('');
        setAmount('');
      } else {
        alert('Could not add transaction.');
      }
    } catch (e) {
      alert('Could not add transaction.');
    }
  };

  const handleDelete = async (id) => {
    try {
      const res = await fetch(`/api/transactions/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setTransactions(transactions.filter(t => t.id !== id));
      } else {
        alert('Could not delete transaction.');
      }
    } catch (e) {
      alert('Could not delete transaction.');
    }
  };

  const handleDeleteList = () => {
    setDeleteConfirmOpen(true);
  };

  const confirmDeletion = async () => {
    try {
      const res = await fetch(`/api/lists/${selectedListId}`, { method: 'DELETE' });
      if (res.ok) {
        router.push('/');
      } else {
        alert('Could not delete passbook.');
      }
    } catch (e) {
      alert('Could not delete passbook.');
    } finally {
      setDeleteConfirmOpen(false);
    }
  };

  const totalIncome = transactions.filter(t => t.type === 'in').reduce((acc, t) => acc + t.amount, 0);
  const totalExpense = transactions.filter(t => t.type === 'out').reduce((acc, t) => acc + t.amount, 0);
  const balance = totalIncome - totalExpense;

  const transactionsToDisplay = [];
  let currentRunning = 0;
  for (let i = 0; i < transactions.length; i++) {
    const t = transactions[i];
    currentRunning += (t.type === 'in' ? t.amount : -t.amount);
    transactionsToDisplay.push({ ...t, runningBalance: currentRunning });
  }

  if (!isLoaded) return <Box sx={{ minHeight: '60vh' }} />;

  return (
    <Container maxWidth="xl" sx={{ pb: 6, px: { xs: 2, md: 4 } }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" fontWeight="bold">
          {listName}
        </Typography>
        <Button variant="outlined" color="error" startIcon={<DeleteIcon />} onClick={handleDeleteList}>
          Delete Passbook
        </Button>
      </Box>

      {/* Add Transaction Form */}
      <Card elevation={2} sx={{ mb: 4, borderRadius: 3 }}>
        <CardContent sx={{ p: { xs: 2, md: 2.5 }, '&:last-child': { pb: { xs: 2, md: 2.5 } } }}>
          <Typography variant="h6" fontWeight="bold" gutterBottom sx={{ mb: 2 }}>
            New Transaction
          </Typography>
          <Box component="form" onSubmit={handleAddTransaction} sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2, alignItems: { xs: 'stretch', md: 'center' } }}>
            <TextField label="Description" variant="outlined" size="small" fullWidth value={description} onChange={(e) => setDescription(e.target.value)} required />
            <TextField label="Amount ($)" variant="outlined" type="number" size="small" fullWidth slotProps={{ htmlInput: { min: "0", step: "0.01" } }} value={amount} onChange={(e) => setAmount(e.target.value)} required />
            <TextField select label="Type" value={type} onChange={(e) => setType(e.target.value)} variant="outlined" size="small" sx={{ minWidth: 130, width: { xs: '100%', md: 'auto' } }}>
              <MenuItem value="in">Income (In)</MenuItem>
              <MenuItem value="out">Expense (Out)</MenuItem>
            </TextField>
            <Button type="submit" variant="contained" startIcon={<AddCircleIcon />} sx={{ px: 3, minWidth: { xs: '100%', md: 'auto' }, borderRadius: 2, fontWeight: 'bold', boxShadow: 2, height: '40px' }}>
              Add
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Passbook Table */}
      <Typography variant="h6" fontWeight="bold" gutterBottom sx={{ mb: 2 }}>
        Recent Transactions
      </Typography>
      <TableContainer component={Paper} elevation={2} sx={{ borderRadius: 3, overflowX: 'auto' }}>
        <Table size="small" sx={{ minWidth: 650 }} aria-label="passbook table">
          <TableHead sx={{ bgcolor: 'action.hover' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold' }}>Date & Time</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Description</TableCell>
              <TableCell align="center" sx={{ fontWeight: 'bold' }}>Type</TableCell>
              <TableCell align="right" sx={{ fontWeight: 'bold' }}>Amount</TableCell>
              <TableCell align="right" sx={{ fontWeight: 'bold' }}>Available Balance</TableCell>
              <TableCell align="right" sx={{ fontWeight: 'bold' }}>Action</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {transactionsToDisplay.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 5, color: 'text.secondary' }}>No transactions yet. Start by adding one above!</TableCell>
              </TableRow>
            ) : (
              transactionsToDisplay.map((row) => (
                <TableRow key={row.id} sx={{ '&:last-child td, &:last-child th': { border: 0 }, transition: 'background 0.2s', '&:hover': { bgcolor: 'action.selected' } }}>
                  <TableCell component="th" scope="row" sx={{ color: 'text.secondary' }}>{row.date}</TableCell>
                  <TableCell sx={{ fontWeight: 500 }}>{row.description}</TableCell>
                  <TableCell align="center">
                    <Chip label={row.type === 'in' ? 'IN' : 'OUT'} color={row.type === 'in' ? 'success' : 'error'} size="small" variant="outlined" sx={{ fontWeight: 'bold', width: 60 }} />
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold', color: row.type === 'in' ? 'success.main' : 'error.main' }}>
                    {row.type === 'in' ? '+' : '-'}${row.amount.toFixed(2)}
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold', color: row.runningBalance >= 0 ? 'success.main' : 'error.main' }}>
                    ${row.runningBalance.toFixed(2)}
                  </TableCell>
                  <TableCell align="right">
                    <IconButton aria-label="delete" color="error" onClick={() => handleDelete(row.id)}><DeleteIcon /></IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
          <TableFooter>
            <TableRow>
              <TableCell colSpan={4} align="right" sx={{ fontWeight: 'bold', fontSize: '1.1rem' }}>Total Amount:</TableCell>
              <TableCell align="right" sx={{ fontWeight: 'bold', fontSize: '1.1rem', color: balance >= 0 ? 'success.main' : 'error.main' }}>${balance.toFixed(2)}</TableCell>
              <TableCell />
            </TableRow>
          </TableFooter>
        </Table>
      </TableContainer>

      {/* Confirmation Dialog for Soft Delete */}
      <Dialog 
        open={deleteConfirmOpen} 
        onClose={() => setDeleteConfirmOpen(false)} 
        maxWidth="xs" 
        fullWidth
        sx={{ '& .MuiDialog-paper': { borderRadius: 4, p: 1 } }}
      >
        <DialogTitle component="div" sx={{ textAlign: 'center', pt: 4, pb: 1 }}>
          <Box sx={{ display: 'inline-flex', borderRadius: '50%', bgcolor: 'error.main', p: 2, mb: 2, boxShadow: '0 4px 12px rgba(211, 47, 47, 0.3)' }}>
            <DeleteIcon sx={{ fontSize: 40, color: 'white' }} />
          </Box>
          <Typography variant="h5" component="div" fontWeight="bold">
            Delete Passbook?
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ textAlign: 'center', pb: 3 }}>
          <Typography color="text.secondary" sx={{ fontSize: '1.05rem', lineHeight: 1.5 }}>
            Are you sure you want to delete this passbook?
            <br/><br/>
            It will be moved to the Recycle Bin where it can be restored later if needed.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, justifyContent: 'center', gap: 2 }}>
          <Button 
            onClick={() => setDeleteConfirmOpen(false)} 
            variant="outlined" 
            color="inherit" 
            fullWidth
            sx={{ borderRadius: 2, py: 1.2, textTransform: 'none', fontWeight: 'bold', borderWidth: 2, '&:hover': { borderWidth: 2 } }}
          >
            Cancel
          </Button>
          <Button 
            onClick={confirmDeletion} 
            variant="contained" 
            color="error" 
            fullWidth
            sx={{ borderRadius: 2, py: 1.2, textTransform: 'none', fontWeight: 'bold', boxShadow: 3 }}
          >
            Move to Bin
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
