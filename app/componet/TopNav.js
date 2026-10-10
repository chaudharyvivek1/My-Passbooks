'use client';
import { AppBar, Toolbar, Typography, IconButton } from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import { useColorScheme } from '@mui/material/styles';
import { useRouter, usePathname } from 'next/navigation';
import React from 'react';

export default function TopNav() {
  const { mode, setMode } = useColorScheme();
  const router = useRouter();
  const pathname = usePathname();

  // Prevents hydration mismatch
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);
  if (!mounted || !mode) return null;

  return (
    <AppBar position="static" sx={{ bgcolor: 'primary.main', mb: 4 }}>
      <Toolbar>
        {pathname !== '/' && (
          <IconButton color="inherit" onClick={() => router.push('/')} sx={{ mr: 2 }}>
            <HomeIcon />
          </IconButton>
        )}
        <Typography variant="h6" noWrap component="div" sx={{ fontWeight: 'bold', flexGrow: 1 }}>
          Budget Passbook
        </Typography>
        <IconButton color="inherit" onClick={() => setMode(mode === 'light' ? 'dark' : 'light')}>
          {mode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
        </IconButton>
      </Toolbar>
    </AppBar>
  );
}
