'use client';

import React, { useState, useEffect } from 'react';
import { Container, Grid, Card, CardContent, Typography, CardActionArea, Box, Dialog, DialogTitle, DialogContent, TextField, DialogActions, Button, IconButton, Fab, Paper } from '@mui/material';
import { useRouter } from 'next/navigation';
import AddIcon from '@mui/icons-material/Add';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import DeleteIcon from '@mui/icons-material/Delete';
import RestoreIcon from '@mui/icons-material/Restore';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';

export default function Dashboard() {
  const [lists, setLists] = useState([]);
  const [deletedLists, setDeletedLists] = useState([]);
  const [isLoaded, setIsLoaded] = useState(false);
  
  const [openNew, setOpenNew] = useState(false);
  const [newListName, setNewListName] = useState('');
  
  const [openBin, setOpenBin] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [listToDelete, setListToDelete] = useState(null);
  
  const router = useRouter();

  const fetchLists = async () => {
    try {
      const res = await fetch('/api/lists');
      if (res.ok) {
        const data = await res.json();
        setLists(data);
      }
    } catch (e) {
      console.warn(e);
    } finally {
      setIsLoaded(true);
    }
  };

  const fetchDeletedLists = async () => {
    try {
      const res = await fetch('/api/lists?deleted=true');
      if (res.ok) {
        const data = await res.json();
        setDeletedLists(data);
      }
    } catch (e) {
      console.warn(e);
    }
  };

  useEffect(() => {
    fetchLists();
    fetchDeletedLists();
  }, []);

  const handleCreateList = async () => {
    if (!newListName.trim()) return;
    try {
      const res = await fetch('/api/lists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newListName.trim() })
      });
      if (res.ok) {
        setOpenNew(false);
        setNewListName('');
        fetchLists();
      }
    } catch (e) {
      alert('Could not create list');
    }
  };

  const handleSoftDelete = async (e, id) => {
    e.stopPropagation(); // prevent card click
    try {
      const res = await fetch(`/api/lists/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchLists();
        fetchDeletedLists();
      }
    } catch (e) {
      alert('Could not delete passbook.');
    }
  };

  const handleRestore = async (id) => {
    try {
      const res = await fetch(`/api/lists/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ restore: true })
      });
      if (res.ok) {
        fetchLists();
        fetchDeletedLists();
      }
    } catch (e) {
      alert('Could not restore passbook.');
    }
  };

  const handlePermanentDelete = (id) => {
    setListToDelete(id);
    setDeleteConfirmOpen(true);
  };

  const confirmDeletion = async () => {
    if (!listToDelete) return;
    try {
      const res = await fetch(`/api/lists/${listToDelete}?hard=true`, { method: 'DELETE' });
      if (res.ok) {
        fetchDeletedLists();
      }
    } catch (e) {
      alert('Could not delete passbook permanently.');
    } finally {
      setDeleteConfirmOpen(false);
      setListToDelete(null);
    }
  };

  if (!isLoaded) return <Box sx={{ minHeight: '60vh' }} />;

  return (
    <Container maxWidth="xl" sx={{ pb: 6, px: { xs: 2, md: 4 }, position: 'relative', minHeight: '80vh' }}>
      <Typography variant="h5" fontWeight="bold" gutterBottom sx={{ mb: 4 }}>
        My Passbooks
      </Typography>
      
      <Grid container spacing={3}>
        {lists.map((list) => (
          <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={list.id}>
            <Card elevation={2} sx={{ borderRadius: 3, height: '100%', position: 'relative', transition: 'transform 0.2s', '&:hover': { transform: 'translateY(-4px)', boxShadow: 6 } }}>
              <IconButton 
                size="small" 
                color="error" 
                onClick={(e) => handleSoftDelete(e, list.id)}
                sx={{ position: 'absolute', top: 8, right: 8, zIndex: 10, bgcolor: 'background.paper', '&:hover': { bgcolor: 'error.light', color: 'white' } }}
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
              <CardActionArea onClick={() => router.push(`/list/${list.id}`)} sx={{ height: '100%', p: 3 }}>
                <CardContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', p: 0 }}>
                  <AccountBalanceWalletIcon sx={{ fontSize: 60, color: 'primary.main', mb: 2, opacity: 0.9 }} />
                  <Typography variant="h6" fontWeight="bold">
                    {list.name}
                  </Typography>
                </CardContent>
              </CardActionArea>
            </Card>
          </Grid>
        ))}
        
        {/* Create New List Card */}
        <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
          <Card elevation={0} sx={{ borderRadius: 3, height: '100%', border: '2px dashed', borderColor: 'divider', bgcolor: 'transparent', transition: 'background 0.2s', '&:hover': { bgcolor: 'action.hover' } }}>
            <CardActionArea onClick={() => setOpenNew(true)} sx={{ height: '100%', p: 3 }}>
              <CardContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', color: 'text.secondary', p: 0 }}>
                <AddIcon sx={{ fontSize: 60, mb: 2, opacity: 0.7 }} />
                <Typography variant="h6" fontWeight="bold">
                  Create New Passbook
                </Typography>
              </CardContent>
            </CardActionArea>
          </Card>
        </Grid>
      </Grid>

      {/* Recycle Bin FAB */}
      <Fab 
        color="secondary" 
        aria-label="recycle-bin" 
        sx={{ position: 'fixed', bottom: 32, right: 32 }}
        onClick={() => { fetchDeletedLists(); setOpenBin(true); }}
      >
        <DeleteIcon />
      </Fab>

      {/* Dialog for new list */}
      <Dialog open={openNew} onClose={() => setOpenNew(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 'bold' }}>New Passbook</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Passbook Name"
            type="text"
            fullWidth
            variant="outlined"
            value={newListName}
            onChange={(e) => setNewListName(e.target.value)}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 0 }}>
          <Button onClick={() => setOpenNew(false)} color="inherit">Cancel</Button>
          <Button onClick={handleCreateList} variant="contained" disabled={!newListName.trim()}>Create</Button>
        </DialogActions>
      </Dialog>

      {/* Dialog for Recycle Bin */}
      <Dialog 
        open={openBin} 
        onClose={() => setOpenBin(false)} 
        maxWidth="sm" 
        fullWidth
        sx={{ '& .MuiDialog-paper': { borderRadius: 4 } }}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1.5, pb: 2, pt: 3, px: 3 }}>
          <Box sx={{ display: 'flex', p: 1, borderRadius: 2, bgcolor: 'secondary.main', color: 'white', boxShadow: 2 }}>
            <DeleteIcon />
          </Box>
          <Typography variant="h6" fontWeight="bold" component="div">Recycle Bin</Typography>
        </DialogTitle>
        <DialogContent dividers sx={{ p: 3, bgcolor: 'action.hover' }}>
          {deletedLists.length === 0 ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 6, color: 'text.secondary' }}>
              <DeleteIcon sx={{ fontSize: 64, mb: 2, opacity: 0.3 }} />
              <Typography variant="body1" fontWeight="medium">Your recycle bin is completely empty.</Typography>
            </Box>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {deletedLists.map((list) => (
                <Paper key={list.id} elevation={1} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 2, borderRadius: 3 }}>
                  <Box>
                    <Typography fontWeight="bold" variant="subtitle1">{list.name}</Typography>
                    <Typography variant="body2" color="text.secondary">Ready to be restored or deleted</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button 
                      variant="outlined" 
                      color="primary" 
                      size="small" 
                      startIcon={<RestoreIcon />} 
                      onClick={() => handleRestore(list.id)}
                      sx={{ textTransform: 'none', borderRadius: 2, fontWeight: 'bold' }}
                    >
                      Restore
                    </Button>
                    <IconButton 
                      color="error" 
                      onClick={() => handlePermanentDelete(list.id)} 
                      title="Delete Permanently"
                      sx={{ bgcolor: 'error.main', color: 'white', '&:hover': { bgcolor: 'error.dark' } }}
                    >
                      <DeleteForeverIcon fontSize="small" />
                    </IconButton>
                  </Box>
                </Paper>
              ))}
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, px: 3 }}>
          <Button 
            onClick={() => setOpenBin(false)} 
            variant="text" 
            color="inherit" 
            sx={{ textTransform: 'none', borderRadius: 2, fontWeight: 'bold' }}
          >
            Close Window
          </Button>
        </DialogActions>
      </Dialog>

      {/* Confirmation Dialog for Permanent Delete */}
      <Dialog 
        open={deleteConfirmOpen} 
        onClose={() => setDeleteConfirmOpen(false)} 
        maxWidth="xs" 
        fullWidth
        sx={{ '& .MuiDialog-paper': { borderRadius: 4, p: 1 } }}
      >
        <DialogTitle component="div" sx={{ textAlign: 'center', pt: 4, pb: 1 }}>
          <Box sx={{ display: 'inline-flex', borderRadius: '50%', bgcolor: 'error.main', p: 2, mb: 2, boxShadow: '0 4px 12px rgba(211, 47, 47, 0.3)' }}>
            <DeleteForeverIcon sx={{ fontSize: 40, color: 'white' }} />
          </Box>
          <Typography variant="h5" component="div" fontWeight="bold">
            Delete Permanently?
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ textAlign: 'center', pb: 3 }}>
          <Typography color="text.secondary" sx={{ fontSize: '1.05rem', lineHeight: 1.5 }}>
            You are about to permanently delete this passbook. All transactions inside it will be wiped from the database. 
            <br/><br/>
            <strong style={{ color: 'var(--mui-palette-error-main)' }}>This action cannot be undone.</strong>
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
            Yes, Delete It
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
