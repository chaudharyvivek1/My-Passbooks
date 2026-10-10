'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Container, Box, Typography, Grid, IconButton, AppBar, Toolbar, Drawer } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import { useColorScheme } from '@mui/material/styles';
import Sidebar from './Sidebar';

function ThemeToggle() {
  const { mode, setMode } = useColorScheme();
  if (!mode) return null;
  return (
    <IconButton color="inherit" onClick={() => setMode(mode === 'light' ? 'dark' : 'light')}>
      {mode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
    </IconButton>
  );
}

export default function AppLayout({ children }) {
  const [lists, setLists] = useState([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  const match = pathname.match(/^\/list\/(.+)$/);
  const selectedListId = match ? match[1] : '';

  useEffect(() => {
    const fetchLists = async () => {
      try {
        const res = await fetch('/api/lists');
        if (!res.ok) {
          setIsLoaded(true);
          return;
        }
        const data = await res.json();
        if (data && Array.isArray(data) && data.length > 0) {
          setLists(data);
        } else {
          const createRes = await fetch('/api/lists', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: 'Main Passbook' })
          });
          if (createRes.ok) {
            const newList = await createRes.json();
            setLists([newList]);
          }
        }
      } catch (e) {
        console.warn(e.message);
      } finally {
        setIsLoaded(true);
      }
    };
    fetchLists();
  }, [pathname, router]);

  const handleAddList = async () => {
    try {
      const res = await fetch('/api/lists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'New Transaction List' })
      });
      if (res.ok) {
        const newList = await res.json();
        setLists([...lists, newList]);
        router.push('/list/' + newList.id);
      } else {
        alert('Could not add list.');
      }
    } catch (e) {
      alert('Could not add list.');
    }
  };

  const handleRenameList = async (id, newName) => {
    try {
      const res = await fetch(`/api/lists/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName })
      });
      if (res.ok) {
        setLists(lists.map(list => list.id === id ? { ...list, name: newName } : list));
      } else {
        alert('Could not rename list.');
      }
    } catch (e) {
      alert('Could not rename list.');
    }
  };

  const handleDeleteList = async (id) => {
    try {
      const res = await fetch(`/api/lists/${id}`, { method: 'DELETE' });
      if (res.ok) {
        const updatedLists = lists.filter(list => list.id !== id);
        setLists(updatedLists);
        if (selectedListId === id) {
          if (updatedLists.length > 0) {
            router.push('/list/' + updatedLists[0].id);
          } else {
            router.push('/');
          }
        }
      } else {
        alert('Could not delete list.');
      }
    } catch (e) {
      alert('Could not delete list.');
    }
  };

  if (!isLoaded) return <Box sx={{ minHeight: '100vh' }} />;

  const handleListSelect = (id) => {
    router.push('/list/' + id);
    setMobileOpen(false);
  };

  const sidebarContent = (
    <Sidebar 
      lists={lists} 
      selectedListId={selectedListId}
      onListChange={handleListSelect}
      onAddList={handleAddList}
      onRenameList={handleRenameList}
      onDeleteList={handleDeleteList}
    />
  );

  return (
    <>
      <AppBar position="static" sx={{ bgcolor: 'primary.main', mb: 3 }}>
        <Toolbar>
          <IconButton
            color="inherit"
            edge="start"
            onClick={() => setMobileOpen(!mobileOpen)}
            sx={{ mr: 2, display: { md: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ fontWeight: 'bold', flexGrow: 1 }}>
            Budget Passbook
          </Typography>
          <ThemeToggle />
        </Toolbar>
      </AppBar>

      <Container maxWidth="xl" sx={{ pb: { xs: 3, md: 6 }, px: { xs: 2, md: 4 } }}>
        <Grid container spacing={3}>
          <Drawer
            variant="temporary"
            open={mobileOpen}
            onClose={() => setMobileOpen(false)}
            ModalProps={{ keepMounted: true }}
            sx={{
              display: { xs: 'block', md: 'none' },
              '& .MuiDrawer-paper': { boxSizing: 'border-box', width: 280, bgcolor: 'transparent', boxShadow: 'none', p: 2 },
            }}
          >
            {sidebarContent}
          </Drawer>

          <Grid size="auto" sx={{ display: { xs: 'none', md: 'block' } }}>
            <Box sx={{ width: 80, height: '100%', position: 'relative' }}>
              <Box sx={{ position: 'absolute', top: 0, left: 0, bottom: 0, zIndex: 1200 }}>
                {sidebarContent}
              </Box>
            </Box>
          </Grid>
          
          <Grid size="grow">
            {children}
          </Grid>
        </Grid>
      </Container>
    </>
  );
}
