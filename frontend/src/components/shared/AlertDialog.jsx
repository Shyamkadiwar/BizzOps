import React from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Typography,
    Box
} from '@mui/material';
import { CheckCircle, Warning, Error, Info } from '@mui/icons-material';

const AlertDialog = ({ open, onClose, title, message, severity = 'info' }) => {
    const getIcon = () => {
        switch (severity) {
            case 'success': return <CheckCircle sx={{ color: '#10b981', fontSize: 28 }} />;
            case 'warning': return <Warning sx={{ color: '#f59e0b', fontSize: 28 }} />;
            case 'error': return <Error sx={{ color: '#ef4444', fontSize: 28 }} />;
            default: return <Info sx={{ color: '#3b82f6', fontSize: 28 }} />;
        }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
            <DialogTitle>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {getIcon()}
                    {title || 'Alert'}
                </Box>
            </DialogTitle>
            <DialogContent>
                <Typography>{message}</Typography>
            </DialogContent>
            <DialogActions>
                <button onClick={onClose}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md hover:shadow-lg transition-all duration-200 text-sm font-medium text-white">
                    OK
                </button>
            </DialogActions>
        </Dialog>
    );
};

export default AlertDialog;
