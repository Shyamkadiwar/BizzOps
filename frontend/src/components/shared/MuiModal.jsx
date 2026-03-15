import React from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    IconButton,
    Box
} from '@mui/material';
import { X } from 'lucide-react';

const MuiModal = ({
    open,
    onClose,
    title,
    children,
    actions,
    maxWidth = 'lg',
    fullWidth = true
}) => {
    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth={maxWidth}
            fullWidth={fullWidth}
            PaperProps={{
                sx: {
                    borderRadius: '1rem',
                    background: 'rgba(255, 255, 255, 0.85)',
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.12), 0 8px 24px rgba(0, 0, 0, 0.08)',
                    overflow: 'hidden',
                    minHeight: '300px',
                }
            }}
            slotProps={{
                backdrop: {
                    sx: {
                        backgroundColor: 'rgba(15, 23, 42, 0.4)',
                        backdropFilter: 'blur(4px)',
                    }
                }
            }}
        >
            <DialogTitle
                sx={{
                    m: 0,
                    px: 3,
                    py: 2.5,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.06), rgba(99, 102, 241, 0.06))',
                    borderBottom: '1px solid rgba(0, 0, 0, 0.06)',
                }}
            >
                <Box component="span" sx={{ fontWeight: 700, fontSize: '1.1rem', color: '#1e293b' }}>
                    {title}
                </Box>
                <IconButton
                    aria-label="close"
                    onClick={onClose}
                    sx={{
                        color: '#94a3b8',
                        '&:hover': {
                            color: '#475569',
                            backgroundColor: 'rgba(0, 0, 0, 0.04)',
                        },
                        transition: 'all 0.2s',
                    }}
                >
                    <X size={18} />
                </IconButton>
            </DialogTitle>
            <DialogContent
                sx={{
                    px: 3,
                    py: 3,
                    '&.MuiDialogContent-root': {
                        paddingTop: '24px !important',
                    },
                }}
            >
                {children}
            </DialogContent>
            {actions && (
                <DialogActions sx={{
                    px: 3,
                    py: 2,
                    borderTop: '1px solid rgba(0, 0, 0, 0.06)',
                    background: 'rgba(248, 250, 252, 0.5)',
                }}>
                    {actions}
                </DialogActions>
            )}
        </Dialog>
    );
};

export default MuiModal;
