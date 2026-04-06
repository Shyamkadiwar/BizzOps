import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Typography
} from '@mui/material';

const PromptDialog = ({ open, onClose, onConfirm, title, message, label, type = 'text', defaultValue = '' }) => {
    const [value, setValue] = useState(defaultValue);

    useEffect(() => {
        if (open) {
            setValue(defaultValue);
        }
    }, [open, defaultValue]);

    const handleConfirm = () => {
        onConfirm(value);
        setValue('');
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
            <DialogTitle sx={{ fontWeight: 600 }}>{title || 'Input Required'}</DialogTitle>
            <DialogContent>
                {message && <Typography sx={{ mb: 2 }}>{message}</Typography>}
                <TextField
                    autoFocus
                    label={label || 'Value'}
                    type={type}
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    fullWidth
                    variant="outlined"
                    sx={{ mt: 1 }}
                />
            </DialogContent>
            <DialogActions>
                <button onClick={onClose}
                    className="px-4 py-2 bg-white/70 backdrop-blur-md border border-white/30 rounded-xl shadow-md hover:shadow-lg transition-all duration-200 text-sm font-medium text-gray-700">
                    Cancel
                </button>
                <button onClick={handleConfirm}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md hover:shadow-lg transition-all duration-200 text-sm font-medium text-white">
                    Confirm
                </button>
            </DialogActions>
        </Dialog>
    );
};

export default PromptDialog;
