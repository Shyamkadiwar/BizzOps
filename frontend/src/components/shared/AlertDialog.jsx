import React from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogContentText,
    DialogActions,
    Button,
    Alert,
    AlertTitle
} from '@mui/material';

function AlertDialog({ open, onClose, title, message, severity = "info", autoClose = false, autoCloseDuration = 3000 }) {
    React.useEffect(() => {
        if (open && autoClose) {
            const timer = setTimeout(() => {
                onClose();
            }, autoCloseDuration);
            return () => clearTimeout(timer);
        }
    }, [open, autoClose, autoCloseDuration, onClose]);

    return (
        <Dialog
            open={open}
            onClose={onClose}
            aria-labelledby="alert-dialog-title"
            maxWidth="sm"
            fullWidth
        >
            <DialogContent sx={{ pt: 3 }}>
                <Alert severity={severity}>
                    {title && <AlertTitle>{title}</AlertTitle>}
                    {message}
                </Alert>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} color="primary" variant="contained" autoFocus>
                    OK
                </Button>
            </DialogActions>
        </Dialog>
    );
}

export default AlertDialog;
