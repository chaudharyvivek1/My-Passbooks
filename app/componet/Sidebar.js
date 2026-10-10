import React, { useState } from 'react';
import { Box, List, ListItem, ListItemButton, ListItemText, Typography, Divider, Paper, IconButton, TextField, Button } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import SaveIcon from '@mui/icons-material/Save';
import ListIcon from '@mui/icons-material/List';
import DashboardIcon from '@mui/icons-material/Dashboard';
import { ListItemIcon } from '@mui/material';

export default function Sidebar({ lists, selectedListId, onListChange, onAddList, onRenameList, onDeleteList }) {
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const [isHovered, setIsHovered] = useState(false);

  const handleEditClick = (list, e) => {
    e.stopPropagation();
    setEditingId(list.id);
    setEditName(list.name || '');
  };

  const handleSaveEdit = (id, e) => {
    e.stopPropagation();
    if (editName.trim()) {
      onRenameList(id, editName.trim());
    }
    setEditingId(null);
  };

  return (
    <Paper 
      elevation={isHovered ? 6 : 2} 
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      sx={{ 
        height: '100%', 
        borderRadius: 3, 
        overflow: 'hidden',
        width: { xs: 280, md: isHovered ? 280 : 80 },
        transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        whiteSpace: 'nowrap',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      <Box sx={{ p: 2, bgcolor: 'primary.main', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center', minHeight: 64 }}>
        <Typography variant="h6" fontWeight="bold" sx={{ opacity: { xs: 1, md: isHovered ? 1 : 0 }, transition: 'opacity 0.2s', width: { xs: 'auto', md: isHovered ? 'auto' : 0 }, overflow: 'hidden' }}>
          Lists
        </Typography>
        <IconButton size="small" onClick={onAddList} sx={{ color: 'white' }}>
          <AddIcon />
        </IconButton>
      </Box>
      <Divider />
      <List sx={{ pt: 0 }}>
        <ListItem disablePadding>
          <ListItemButton 
            selected={!selectedListId}
            onClick={() => onListChange('')}
            sx={{
              '&.Mui-selected': { bgcolor: 'primary.light', color: 'primary.contrastText', '&:hover': { bgcolor: 'primary.light' } },
              px: { xs: 2, md: isHovered ? 2 : 2.5 }
            }}
          >
            <ListItemIcon sx={{ minWidth: { xs: 40, md: isHovered ? 40 : 50 } }}>
              <DashboardIcon sx={{ color: !selectedListId ? 'inherit' : 'action.active' }} />
            </ListItemIcon>
            <ListItemText disableTypography primary={<Typography fontWeight={!selectedListId ? 'bold' : 'normal'} noWrap>Dashboard</Typography>} />
          </ListItemButton>
        </ListItem>
        <Divider sx={{ mb: 1 }} />
        {lists.map((list) => (
          <ListItem 
            key={list.id} 
            disablePadding
            secondaryAction={
              <Box sx={{ display: { xs: 'block', md: isHovered ? 'block' : 'none' } }}>
                {editingId === list.id ? (
                  <IconButton edge="end" onClick={(e) => handleSaveEdit(list.id, e)}>
                    <SaveIcon />
                  </IconButton>
                ) : (
                  <Box>
                    <IconButton edge="end" onClick={(e) => handleEditClick(list, e)} sx={{ mr: 0.5 }}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton edge="end" onClick={(e) => { e.stopPropagation(); onDeleteList(list.id); }}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Box>
                )}
              </Box>
            }
          >
            <ListItemButton 
              selected={selectedListId === list.id}
              onClick={() => onListChange(list.id)}
              sx={{
                '&.Mui-selected': {
                  bgcolor: 'primary.light',
                  color: 'primary.contrastText',
                  '&:hover': {
                    bgcolor: 'primary.light',
                  }
                },
                pr: editingId === list.id ? 6 : (isHovered ? 10 : 2),
                px: { xs: 2, md: isHovered ? 2 : 2.5 }
              }}
            >
              <ListItemIcon sx={{ minWidth: { xs: 40, md: isHovered ? 40 : 50 } }}>
                <ListIcon sx={{ color: selectedListId === list.id ? 'inherit' : 'action.active' }} />
              </ListItemIcon>
              {editingId === list.id ? (
                <TextField
                  value={editName || ''}
                  onChange={(e) => setEditName(e.target.value)}
                  size="small"
                  autoFocus
                  onClick={(e) => e.stopPropagation()}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveEdit(list.id, e);
                  }}
                  sx={{ bgcolor: 'background.paper', borderRadius: 1 }}
                />
              ) : (
                <ListItemText 
                  disableTypography
                  primary={
                    <Typography 
                      fontWeight={selectedListId === list.id ? 'bold' : 'normal'} 
                      noWrap
                    >
                      {list.name}
                    </Typography>
                  }
                />
              )}
            </ListItemButton>
          </ListItem>
        ))}
      </List>
      <Box sx={{ p: 2, mt: 'auto', display: { xs: 'block', md: isHovered ? 'block' : 'none' } }}>
        <Button 
          variant="outlined" 
          fullWidth 
          startIcon={<AddIcon />}
          onClick={onAddList}
        >
          New List
        </Button>
      </Box>
    </Paper>
  );
}
