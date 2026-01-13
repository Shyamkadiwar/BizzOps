import React, { useState } from 'react';
import { Drawer, List, ListItem, ListItemIcon, ListItemText, Fab, Box, Typography, Divider, IconButton } from '@mui/material';
import { Add as AddIcon, Upload as UploadIcon, Download as DownloadIcon, Close as CloseIcon, Menu as MenuIcon } from '@mui/icons-material';

export default function ActionDrawer({ onAdd, onImport, onExport, title = "Actions" }) {
    const [open, setOpen] = useState(false);

    const toggleDrawer = () => {
        setOpen(!open);
    };

    return (
        <>
            {/* Floating Action Button */}
            <Fab
                color="primary"
                aria-label="actions"
                onClick={toggleDrawer}
                sx={{
                    position: 'fixed',
                    bottom: 24,
                    right: 24,
                    zIndex: 1000
                }}
            >
                <MenuIcon />
            </Fab>

            {/* Right Side Drawer */}
            <Drawer
                anchor="right"
                open={open}
                onClose={toggleDrawer}
                sx={{
                    '& .MuiDrawer-paper': {
                        width: 300,
                        boxSizing: 'border-box',
                    },
                }}
            >
                <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="h6">{title}</Typography>
                    <IconButton onClick={toggleDrawer}>
                        <CloseIcon />
                    </IconButton>
                </Box>
                <Divider />
                <List>
                    {onAdd && (
                        <ListItem
                            button
                            onClick={() => {
                                onAdd();
                                toggleDrawer();
                            }}
                            sx={{
                                '&:hover': {
                                    backgroundColor: 'primary.light',
                                    '& .MuiListItemIcon-root': {
                                        color: 'primary.main',
                                    },
                                },
                            }}
                        >
                            <ListItemIcon>
                                <AddIcon color="primary" />
                            </ListItemIcon>
                            <ListItemText
                                primary="Add New"
                                secondary="Create new entry"
                            />
                        </ListItem>
                    )}

                    {onImport && (
                        <ListItem
                            button
                            onClick={() => {
                                onImport();
                                toggleDrawer();
                            }}
                            sx={{
                                '&:hover': {
                                    backgroundColor: 'success.light',
                                    '& .MuiListItemIcon-root': {
                                        color: 'success.main',
                                    },
                                },
                            }}
                        >
                            <ListItemIcon>
                                <UploadIcon color="success" />
                            </ListItemIcon>
                            <ListItemText
                                primary="Import Excel"
                                secondary="Upload Excel file"
                            />
                        </ListItem>
                    )}

                    {onExport && (
                        <ListItem
                            button
                            onClick={() => {
                                onExport();
                                toggleDrawer();
                            }}
                            sx={{
                                '&:hover': {
                                    backgroundColor: 'warning.light',
                                    '& .MuiListItemIcon-root': {
                                        color: 'warning.main',
                                    },
                                },
                            }}
                        >
                            <ListItemIcon>
                                <DownloadIcon color="warning" />
                            </ListItemIcon>
                            <ListItemText
                                primary="Export Excel"
                                secondary="Download as Excel"
                            />
                        </ListItem>
                    )}
                </List>
            </Drawer>
        </>
    );
}
