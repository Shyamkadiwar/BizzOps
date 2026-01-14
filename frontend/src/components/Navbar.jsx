import React from 'react';
import { AppBar, Toolbar, IconButton, Typography, Box } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import MenuOpenIcon from '@mui/icons-material/MenuOpen';
import NotificationsIcon from '@mui/icons-material/Notifications';
import logo from '../assets/logo.png';
import Account from './Account';

function Navbar({ onMenuClick, onDesktopMenuClick, desktopOpen }) {
    return (
        <AppBar
            position="fixed"
            sx={{
                zIndex: (theme) => theme.zIndex.drawer + 1,
                backgroundColor: '#ffffffff',
                boxShadow: '0 2px 8px rgba(138, 137, 137, 0.3)',
            }}
        >
            <Toolbar sx={{ justifyContent: 'space-between', width: '100%' }}>
                {/* Left section: Mobile menu + Logo */}
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    {/* Mobile hamburger menu */}
                    <IconButton
                        color="inherit"
                        aria-label="open drawer"
                        edge="start"
                        onClick={onMenuClick}
                        sx={{
                            mr: 2,
                            color: '#000000ff',
                            display: { xs: 'block', sm: 'none' }
                        }}
                    >
                        <MenuIcon />
                    </IconButton>

                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <img
                            src={logo}
                            alt="BizzOps Logo"
                            style={{ height: '40px', marginRight: '16px' }}
                        />
                    </Box>
                </Box>

                {/* Desktop toggle button - positioned where sidebar ends - only show when sidebar is open */}
                {desktopOpen && (
                    <Box sx={{
                        position: 'absolute',
                        left: '240px',
                        transition: 'left 0.3s',
                        display: { xs: 'none', sm: 'block' }
                    }}>
                        <IconButton
                            color="inherit"
                            aria-label="toggle drawer"
                            onClick={onDesktopMenuClick}
                            sx={{
                                color: '#000000ff',
                                '&:hover': { backgroundColor: 'rgba(59, 130, 246, 0.08)' }
                            }}
                        >
                            <MenuOpenIcon />
                        </IconButton>
                    </Box>
                )}

                {/* Right section: Notifications + Account */}
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                    <IconButton
                        color="inherit"
                        sx={{ color: '#000000ff' }}
                    >
                        <NotificationsIcon />
                    </IconButton>
                    <Account />
                </Box>
            </Toolbar>
        </AppBar>
    );
}

export default Navbar;
