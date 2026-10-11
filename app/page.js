'use client';

import React, { useState, useEffect } from 'react';
import { 
  Container, Grid, Card, CardContent, Typography, CardActionArea, Box, 
  Dialog, DialogTitle, DialogContent, TextField, DialogActions, Button, 
  IconButton, Fab, Paper, CircularProgress, Backdrop, Checkbox, Chip, Snackbar, Alert 
} from '@mui/material';
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
  
  // Create new passbook state
  const [openNew, setOpenNew] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  
  // Recycle bin state
  const [openBin, setOpenBin] = useState(false);
  const [selectedBinIds, setSelectedBinIds] = useState([]);
  const [isBinProcessing, setIsBinProcessing] = useState(false);

  // Deletion confirmation state
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [listToDelete, setListToDelete] = useState(null); // specific id or 'bulk'

  // Toast feedback state
  const [toast, setToast] = useState({ open: false, message: '', severity: 'info' });
  
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
        // Keep only selected IDs that still exist in fetched deleted lists
        setSelectedBinIds(prev => prev.filter(id => data.some(item => item.id === id)));
      }
    } catch (e) {
      console.warn(e);
    }
  };

  useEffect(() => {
    fetchLists();
    fetchDeletedLists();
  }, []);

  const handleCreateList = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!newListName.trim() || isCreating) return;

    setIsCreating(true);
    try {
      const res = await fetch('/api/lists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newListName.trim() })
      });
      if (res.ok) {
        setOpenNew(false);
        setNewListName('');
        setToast({ open: true, message: 'Passbook created successfully!', severity: 'success' });
        await fetchLists();
      } else {
        setToast({ open: true, message: 'Could not create passbook.', severity: 'error' });
      }
    } catch (e) {
      setToast({ open: true, message: 'Could not create passbook.', severity: 'error' });
    } finally {
      setIsCreating(false);
    }
  };

  const handleSoftDelete = async (e, id) => {
    e.stopPropagation(); // prevent card click
    try {
      const res = await fetch(`/api/lists/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setToast({ open: true, message: 'Moved passbook to recycle bin.', severity: 'info' });
        fetchLists();
        fetchDeletedLists();
      }
    } catch (e) {
      setToast({ open: true, message: 'Could not delete passbook.', severity: 'error' });
    }
  };

  const handleToggleSelect = (id) => {
    if (isBinProcessing) return;
    setSelectedBinIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (isBinProcessing) return;
    if (selectedBinIds.length === deletedLists.length) {
      setSelectedBinIds([]);
    } else {
      setSelectedBinIds(deletedLists.map(l => l.id));
    }
  };

  const handleRestore = async (id) => {
    if (isBinProcessing) return;
    setIsBinProcessing(true);
    try {
      const res = await fetch(`/api/lists/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ restore: true })
      });
      if (res.ok) {
        setToast({ open: true, message: 'Passbook restored successfully.', severity: 'success' });
        setSelectedBinIds(prev => prev.filter(item => item !== id));
        await Promise.all([fetchLists(), fetchDeletedLists()]);
      } else {
        setToast({ open: true, message: 'Could not restore passbook.', severity: 'error' });
      }
    } catch (e) {
      setToast({ open: true, message: 'Could not restore passbook.', severity: 'error' });
    } finally {
      setIsBinProcessing(false);
    }
  };

  const handleBulkRestore = async () => {
    if (selectedBinIds.length === 0 || isBinProcessing) return;
    setIsBinProcessing(true);
    try {
      const res = await fetch('/api/lists', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedBinIds, restore: true })
      });
      if (res.ok) {
        const count = selectedBinIds.length;
        setSelectedBinIds([]);
        setToast({ open: true, message: `Restored ${count} passbook(s) successfully.`, severity: 'success' });
        await Promise.all([fetchLists(), fetchDeletedLists()]);
      } else {
        setToast({ open: true, message: 'Could not restore selected passbooks.', severity: 'error' });
      }
    } catch (e) {
      setToast({ open: true, message: 'Could not restore selected passbooks.', severity: 'error' });
    } finally {
      setIsBinProcessing(false);
    }
  };

  const handlePermanentDelete = (id) => {
    setListToDelete(id);
    setDeleteConfirmOpen(true);
  };

  const handleBulkDelete = () => {
    if (selectedBinIds.length === 0) return;
    setListToDelete('bulk');
    setDeleteConfirmOpen(true);
  };

  const confirmDeletion = async () => {
    if (!listToDelete || isBinProcessing) return;
    setIsBinProcessing(true);
    try {
      if (listToDelete === 'bulk') {
        const count = selectedBinIds.length;
        const res = await fetch('/api/lists', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ids: selectedBinIds, hard: true })
        });
        if (res.ok) {
          setToast({ open: true, message: `Permanently deleted ${count} passbook(s).`, severity: 'success' });
          setSelectedBinIds([]);
          await fetchDeletedLists();
        } else {
          setToast({ open: true, message: 'Could not delete passbooks.', severity: 'error' });
        }
      } else {
        const res = await fetch(`/api/lists/${listToDelete}?hard=true`, { method: 'DELETE' });
        if (res.ok) {
          setToast({ open: true, message: 'Passbook permanently deleted.', severity: 'success' });
          setSelectedBinIds(prev => prev.filter(id => id !== listToDelete));
          await fetchDeletedLists();
        } else {
          setToast({ open: true, message: 'Could not delete passbook permanently.', severity: 'error' });
        }
      }
    } catch (e) {
      setToast({ open: true, message: 'Could not delete passbook permanently.', severity: 'error' });
    } finally {
      setIsBinProcessing(false);
      setDeleteConfirmOpen(false);
      setListToDelete(null);
    }
  };

  if (!isLoaded) {
    return (
      <Box sx={{ minHeight: '65vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
        <CircularProgress size={48} thickness={4} />
        <Typography variant="body1" color="text.secondary" fontWeight="medium">
          Loading passbooks...
        </Typography>
      </Box>
    );
  }

  const isAllSelected = deletedLists.length > 0 && selectedBinIds.length === deletedLists.length;
  const isIndeterminate = selectedBinIds.length > 0 && selectedBinIds.length < deletedLists.length;

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
      <Dialog 
        open={openNew} 
        onClose={() => { if (!isCreating) setOpenNew(false); }} 
        maxWidth="xs" 
        fullWidth
        component="form"
        onSubmit={handleCreateList}
        sx={{ '& .MuiDialog-paper': { borderRadius: 4, overflow: 'hidden' } }}
      >
        <DialogTitle component="div" sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1.5, pb: 1, pt: 2.5 }}>
          <Box sx={{ display: 'flex', p: 0.8, borderRadius: 2, bgcolor: 'primary.main', color: 'white' }}>
            <AddIcon />
          </Box>
          <Typography variant="h6" fontWeight="bold" component="div">New Passbook</Typography>
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <TextField
            autoFocus
            margin="dense"
            label="Passbook Name"
            type="text"
            fullWidth
            variant="outlined"
            value={newListName}
            onChange={(e) => setNewListName(e.target.value)}
            disabled={isCreating}
            placeholder="e.g. Household, Business, Savings"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleCreateList();
              }
            }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2.5, pt: 1, gap: 1 }}>
          <Button 
            onClick={() => setOpenNew(false)} 
            color="inherit" 
            disabled={isCreating}
            sx={{ textTransform: 'none', borderRadius: 2 }}
          >
            Cancel
          </Button>
          <Button 
            type="submit"
            onClick={handleCreateList} 
            variant="contained" 
            disabled={!newListName.trim() || isCreating}
            sx={{ textTransform: 'none', borderRadius: 2, minWidth: 100, fontWeight: 'bold' }}
          >
            {isCreating ? (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CircularProgress size={18} color="inherit" />
                <span>Creating...</span>
              </Box>
            ) : (
              'Create'
            )}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Full Loading Screen Backdrop when creating a new card */}
      <Backdrop
        open={isCreating}
        sx={{
          zIndex: (theme) => theme.zIndex.modal + 10,
          color: '#fff',
          flexDirection: 'column',
          gap: 2.5,
          bgcolor: 'rgba(15, 23, 42, 0.75)',
          backdropFilter: 'blur(6px)',
        }}
      >
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            p: 4,
            borderRadius: 4,
            bgcolor: 'background.paper',
            color: 'text.primary',
            boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
            maxWidth: 360,
            textAlign: 'center',
            border: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Box sx={{ position: 'relative', display: 'inline-flex', mb: 2 }}>
            <CircularProgress size={60} thickness={4} color="primary" />
            <Box
              sx={{
                top: 0,
                left: 0,
                bottom: 0,
                right: 0,
                position: 'absolute',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <AccountBalanceWalletIcon color="primary" sx={{ fontSize: 30 }} />
            </Box>
          </Box>
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            Creating Passbook...
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Please wait while your new passbook is being prepared.
          </Typography>
        </Box>
      </Backdrop>

      {/* Dialog for Recycle Bin with Multi-Select and Bulk Delete/Restore */}
      <Dialog 
        open={openBin} 
        onClose={() => { if (!isBinProcessing) setOpenBin(false); }} 
        maxWidth="sm" 
        fullWidth
        sx={{ '& .MuiDialog-paper': { borderRadius: 4, overflow: 'hidden' } }}
      >
        <DialogTitle component="div" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 2, pt: 3, px: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box sx={{ display: 'flex', p: 1, borderRadius: 2, bgcolor: 'secondary.main', color: 'white', boxShadow: 2 }}>
              <DeleteIcon />
            </Box>
            <Box>
              <Typography variant="h6" fontWeight="bold" component="div">Recycle Bin</Typography>
              <Typography variant="caption" color="text.secondary">
                {deletedLists.length} item{deletedLists.length === 1 ? '' : 's'} in bin
              </Typography>
            </Box>
          </Box>
          <Chip 
            size="small" 
            label={`${deletedLists.length} Deleted`} 
            color={deletedLists.length > 0 ? "warning" : "default"} 
            variant="outlined" 
            sx={{ fontWeight: 'bold' }}
          />
        </DialogTitle>

        {/* Multi-Selection Control Bar when items exist */}
        {deletedLists.length > 0 && (
          <Box 
            sx={{ 
              px: 3, 
              py: 1.5, 
              bgcolor: 'background.default', 
              borderTop: '1px solid', 
              borderBottom: '1px solid', 
              borderColor: 'divider',
              display: 'flex', 
              flexWrap: 'wrap',
              alignItems: 'center', 
              justifyContent: 'space-between', 
              gap: 1.5 
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Checkbox 
                checked={isAllSelected}
                indeterminate={isIndeterminate}
                onChange={handleSelectAll}
                disabled={isBinProcessing}
                size="small"
                inputProps={{ 'aria-label': 'Select all items' }}
              />
              <Typography variant="body2" fontWeight="bold">
                {selectedBinIds.length > 0 
                  ? `${selectedBinIds.length} of ${deletedLists.length} selected` 
                  : 'Select All'}
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {selectedBinIds.length > 0 && (
                <>
                  <Button
                    variant="outlined"
                    color="primary"
                    size="small"
                    startIcon={<RestoreIcon />}
                    onClick={handleBulkRestore}
                    disabled={isBinProcessing}
                    sx={{ textTransform: 'none', borderRadius: 2, fontWeight: 'bold' }}
                  >
                    Restore ({selectedBinIds.length})
                  </Button>
                  <Button
                    variant="contained"
                    color="error"
                    size="small"
                    startIcon={<DeleteForeverIcon />}
                    onClick={handleBulkDelete}
                    disabled={isBinProcessing}
                    sx={{ textTransform: 'none', borderRadius: 2, fontWeight: 'bold', boxShadow: 2 }}
                  >
                    Delete ({selectedBinIds.length})
                  </Button>
                </>
              )}
            </Box>
          </Box>
        )}

        <DialogContent dividers sx={{ p: 3, bgcolor: 'action.hover', position: 'relative' }}>
          {isBinProcessing && (
            <Box 
              sx={{ 
                position: 'absolute', 
                inset: 0, 
                bgcolor: 'rgba(255,255,255,0.7)', 
                zIndex: 10, 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                justifyContent: 'center', 
                gap: 1.5 
              }}
            >
              <CircularProgress size={36} />
              <Typography variant="body2" fontWeight="bold" color="text.secondary">
                Processing...
              </Typography>
            </Box>
          )}

          {deletedLists.length === 0 ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 6, color: 'text.secondary' }}>
              <DeleteIcon sx={{ fontSize: 64, mb: 2, opacity: 0.3 }} />
              <Typography variant="body1" fontWeight="medium">Your recycle bin is completely empty.</Typography>
            </Box>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {deletedLists.map((list) => {
                const isSelected = selectedBinIds.includes(list.id);
                return (
                  <Paper 
                    key={list.id} 
                    elevation={isSelected ? 3 : 1} 
                    sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'space-between', 
                      p: 2, 
                      borderRadius: 3,
                      border: '1.5px solid',
                      borderColor: isSelected ? 'primary.main' : 'transparent',
                      bgcolor: isSelected ? 'action.selected' : 'background.paper',
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        borderColor: isSelected ? 'primary.main' : 'divider',
                        boxShadow: 2
                      }
                    }}
                  >
                    <Box 
                      sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexGrow: 1, cursor: 'pointer' }}
                      onClick={() => handleToggleSelect(list.id)}
                    >
                      <Checkbox 
                        checked={isSelected}
                        onChange={() => handleToggleSelect(list.id)}
                        disabled={isBinProcessing}
                        size="medium"
                        onClick={(e) => e.stopPropagation()}
                      />
                      <Box>
                        <Typography fontWeight="bold" variant="subtitle1">{list.name}</Typography>
                        <Typography variant="body2" color="text.secondary">Ready to be restored or deleted</Typography>
                      </Box>
                    </Box>

                    <Box sx={{ display: 'flex', gap: 1, ml: 2 }}>
                      <Button 
                        variant="outlined" 
                        color="primary" 
                        size="small" 
                        startIcon={<RestoreIcon />} 
                        onClick={() => handleRestore(list.id)}
                        disabled={isBinProcessing}
                        sx={{ textTransform: 'none', borderRadius: 2, fontWeight: 'bold' }}
                      >
                        Restore
                      </Button>
                      <IconButton 
                        color="error" 
                        onClick={() => handlePermanentDelete(list.id)} 
                        disabled={isBinProcessing}
                        title="Delete Permanently"
                        sx={{ bgcolor: 'error.main', color: 'white', '&:hover': { bgcolor: 'error.dark' }, '&.Mui-disabled': { bgcolor: 'action.disabledBackground' } }}
                      >
                        <DeleteForeverIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </Paper>
                );
              })}
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, px: 3, justifyContent: 'space-between' }}>
          <Typography variant="caption" color="text.secondary">
            {selectedBinIds.length > 0 ? `${selectedBinIds.length} passbook(s) selected` : ''}
          </Typography>
          <Button 
            onClick={() => setOpenBin(false)} 
            variant="text" 
            color="inherit" 
            disabled={isBinProcessing}
            sx={{ textTransform: 'none', borderRadius: 2, fontWeight: 'bold' }}
          >
            Close Window
          </Button>
        </DialogActions>
      </Dialog>

      {/* Confirmation Dialog for Permanent Delete (Single or Multi/Bulk) */}
      <Dialog 
        open={deleteConfirmOpen} 
        onClose={() => { if (!isBinProcessing) setDeleteConfirmOpen(false); }} 
        maxWidth="xs" 
        fullWidth
        sx={{ '& .MuiDialog-paper': { borderRadius: 4, p: 1 } }}
      >
        <DialogTitle component="div" sx={{ textAlign: 'center', pt: 4, pb: 1 }}>
          <Box sx={{ display: 'inline-flex', borderRadius: '50%', bgcolor: 'error.main', p: 2, mb: 2, boxShadow: '0 4px 12px rgba(211, 47, 47, 0.3)' }}>
            <DeleteForeverIcon sx={{ fontSize: 40, color: 'white' }} />
          </Box>
          <Typography variant="h5" component="div" fontWeight="bold">
            {listToDelete === 'bulk' 
              ? `Delete ${selectedBinIds.length} Passbooks?` 
              : 'Delete Permanently?'}
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ textAlign: 'center', pb: 3 }}>
          <Typography color="text.secondary" sx={{ fontSize: '1.05rem', lineHeight: 1.5 }}>
            {listToDelete === 'bulk' ? (
              <>
                You are about to permanently delete <strong>{selectedBinIds.length} selected passbooks</strong>. All transactions inside them will be wiped from the database.
              </>
            ) : (
              <>
                You are about to permanently delete this passbook. All transactions inside it will be wiped from the database.
              </>
            )}
            <br/><br/>
            <strong style={{ color: 'var(--mui-palette-error-main, #d32f2f)' }}>This action cannot be undone.</strong>
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, justifyContent: 'center', gap: 2 }}>
          <Button 
            onClick={() => setDeleteConfirmOpen(false)} 
            variant="outlined" 
            color="inherit" 
            disabled={isBinProcessing}
            fullWidth
            sx={{ borderRadius: 2, py: 1.2, textTransform: 'none', fontWeight: 'bold', borderWidth: 2, '&:hover': { borderWidth: 2 } }}
          >
            Cancel
          </Button>
          <Button 
            onClick={confirmDeletion} 
            variant="contained" 
            color="error" 
            disabled={isBinProcessing}
            fullWidth
            sx={{ borderRadius: 2, py: 1.2, textTransform: 'none', fontWeight: 'bold', boxShadow: 3 }}
          >
            {isBinProcessing ? (
              <CircularProgress size={24} color="inherit" />
            ) : listToDelete === 'bulk' ? (
              `Yes, Delete ${selectedBinIds.length} Items`
            ) : (
              'Yes, Delete It'
            )}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Toast Feedback Notification */}
      <Snackbar
        open={toast.open}
        autoHideDuration={4000}
        onClose={() => setToast(prev => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setToast(prev => ({ ...prev, open: false }))} 
          severity={toast.severity} 
          variant="filled"
          sx={{ width: '100%', borderRadius: 3, fontWeight: 'medium' }}
        >
          {toast.message}
        </Alert>
      </Snackbar>
    </Container>
  );
}
