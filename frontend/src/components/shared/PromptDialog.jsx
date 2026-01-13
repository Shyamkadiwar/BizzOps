import React, { useState } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogContentText,
    DialogActions,
    Button,
    TextField
} from '@mui/material';

function PromptDialog({ open, onClose, onConfirm, title, message, label, type = "text", defaultValue = "" }) {
    const [value, setValue] = useState(defaultValue);
    const [error, setError] = useState("");

    const handleConfirm = () => {
        // Validation
        if (!value || value.trim() === "") {
            setError("This field is required");
            return;
        }

        if (type === "number") {
            const numValue = parseFloat(value);
            if (isNaN(numValue) || numValue <= 0) {
                setError("Please enter a valid positive number");
                return;
            }
        }

        onConfirm(value);
        setValue(defaultValue);
        setError("");
        onClose();
    };

    const handleClose = () => {
        setValue(defaultValue);
        setError("");
        onClose();
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            handleConfirm();
        }
    };

    return (
        <Dialog
            open={open}
            onClose={handleClose}
            aria-labelledby="prompt-dialog-title"
            maxWidth="sm"
            fullWidth
        >
            <DialogTitle id="prompt-dialog-title">
                {title}
            </DialogTitle>
            <DialogContent>
                {message && (
                    <DialogContentText sx={{ mb: 2 }}>
                        {message}
                    </DialogContentText>
                )}
                <TextField
                    autoFocus
                    margin="dense"
                    label={label}
                    type={type}
                    fullWidth
                    variant="outlined"
                    value={value}
                    onChange={(e) => {
                        setValue(e.target.value);
                        setError("");
                    }}
                    onKeyPress={handleKeyPress}
                    error={!!error}
                    helperText={error}
                    inputProps={type === "number" ? { min: 0, step: 1 } : {}}
                />
            </DialogContent>
            <DialogActions>
                <Button onClick={handleClose} color="inherit">
                    Cancel
                </Button>
                <Button onClick={handleConfirm} color="primary" variant="contained">
                    Confirm
                </Button>
            </DialogActions>
        </Dialog>
    );
}

export default PromptDialog;
