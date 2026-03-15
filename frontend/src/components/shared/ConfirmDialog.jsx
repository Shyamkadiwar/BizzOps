import React from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Typography
} from '@mui/material';

const ConfirmDialog = ({ open, onClose, onConfirm, title, message }) => {
    return (
        <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
            <DialogTitle sx={{ fontWeight: 600 }}>{title || 'Confirm'}</DialogTitle>
            <DialogContent>
                <Typography>{message || 'Are you sure?'}</Typography>
            </DialogContent>
            <DialogActions>
                <button onClick={onClose}
                    className="px-4 py-2 bg-white/70 backdrop-blur-md border border-white/30 rounded-xl shadow-md hover:shadow-lg transition-all duration-200 text-sm font-medium text-gray-700">
                    Cancel
                </button>
                <button onClick={onConfirm}
                    className="px-4 py-2 bg-gradient-to-r from-red-500/80 to-rose-500/80 backdrop-blur-md border border-white/30 rounded-xl shadow-md hover:shadow-lg hover:from-red-600/90 hover:to-rose-600/90 transition-all duration-200 text-sm font-medium text-white">
                    Confirm
                </button>
            </DialogActions>
        </Dialog>
    );
};

export default ConfirmDialog;
