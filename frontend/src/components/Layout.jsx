import React, { useState } from 'react';
import { Box, Toolbar } from '@mui/material';
import Navbar from './Navbar';
import Sidebar from './Sidebar';

function Layout({ children }) {
    const [mobileOpen, setMobileOpen] = useState(false);
    const [desktopOpen, setDesktopOpen] = useState(true);

    const handleDrawerToggle = () => {
        setMobileOpen(!mobileOpen);
    };

    const handleDesktopDrawerToggle = () => {
        setDesktopOpen(!desktopOpen);
    };

    return (
        <Box sx={{ display: 'flex' }}>
            <Navbar onMenuClick={handleDrawerToggle} onDesktopMenuClick={handleDesktopDrawerToggle} desktopOpen={desktopOpen} />
            <Sidebar
                mobileOpen={mobileOpen}
                onDrawerToggle={handleDrawerToggle}
                desktopOpen={desktopOpen}
                onDesktopToggle={handleDesktopDrawerToggle}
            />
            <Box
                component="main"
                sx={{
                    flexGrow: 1,
                    p: 3,
                    width: { xs: '100%', sm: desktopOpen ? `calc(100% - 280px)` : `calc(100% - 80px)` },
                    backgroundColor: '#0f0f0f',
                    minHeight: '100vh',
                    transition: (theme) => theme.transitions.create(['width', 'margin'], {
                        easing: theme.transitions.easing.sharp,
                        duration: theme.transitions.duration.enteringScreen,
                    }),
                }}
            >
                <Toolbar />
                {children}
            </Box>
        </Box>
    );
}

export default Layout;
