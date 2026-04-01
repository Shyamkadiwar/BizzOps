import React from 'react';
import { Dialog, IconButton, Box, Typography } from '@mui/material';
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
            maxWidth={false}
            fullWidth={false}
            PaperProps={{
                sx: {
                    width: '82vw',
                    height: '85vh',
                    maxWidth: '82vw',
                    maxHeight: '85vh',
                    borderRadius: '1.25rem',
                    background: '#ffffff',
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 25px 50px rgba(0, 0, 0, 0.12), 0 12px 24px rgba(0, 0, 0, 0.06)',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    animation: 'modalSlideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                    '@keyframes modalSlideIn': {
                        '0%': {
                            opacity: 0,
                            transform: 'scale(0.95) translateY(12px)',
                        },
                        '100%': {
                            opacity: 1,
                            transform: 'scale(1) translateY(0)',
                        },
                    },
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
            {/* Header */}
            <Box
                sx={{
                    px: 4,
                    py: 2.5,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: 'linear-gradient(135deg, #f8fafc, #f1f5f9)',
                    borderBottom: '1px solid #e2e8f0',
                }}
            >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Box sx={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #3B82F6, #6366f1)',
                        boxShadow: '0 0 6px rgba(99, 102, 241, 0.4)',
                    }} />
                    <Typography
                        sx={{
                            fontWeight: 700,
                            fontSize: '1.15rem',
                            color: '#1e293b',
                            letterSpacing: '-0.01em',
                        }}
                    >
                        {title}
                    </Typography>
                </Box>
                <IconButton
                    aria-label="close"
                    onClick={onClose}
                    sx={{
                        width: 34,
                        height: 34,
                        borderRadius: '10px',
                        color: '#94a3b8',
                        background: '#fff',
                        border: '1px solid #e2e8f0',
                        '&:hover': {
                            color: '#ef4444',
                            background: '#fef2f2',
                            borderColor: '#fecaca',
                        },
                        transition: 'all 0.2s ease',
                    }}
                >
                    <X size={16} />
                </IconButton>
            </Box>

            {/* Content */}
            <Box
                sx={{
                    flex: 1,
                    overflow: 'auto',
                    px: 4,
                    py: 3,
                    // Custom scrollbar
                    '&::-webkit-scrollbar': {
                        width: '6px',
                    },
                    '&::-webkit-scrollbar-track': {
                        background: '#f8fafc',
                    },
                    '&::-webkit-scrollbar-thumb': {
                        background: '#cbd5e1',
                        borderRadius: '3px',
                        '&:hover': {
                            background: '#94a3b8',
                        },
                    },
                    // Wider, cleaner input fields
                    '& .MuiTextField-root': {
                        '& .MuiOutlinedInput-root': {
                            borderRadius: '10px',
                            background: '#fff',
                            fontSize: '0.95rem',
                            minHeight: '48px',
                            '& fieldset': {
                                borderColor: '#e2e8f0',
                            },
                            '&:hover fieldset': {
                                borderColor: '#94a3b8',
                            },
                            '&.Mui-focused fieldset': {
                                borderColor: '#6366f1',
                                borderWidth: '1.5px',
                            },
                            '& input': {
                                padding: '12px 14px',
                            },
                        },
                        '& .MuiInputLabel-root': {
                            color: '#64748b',
                            fontWeight: 500,
                        },
                        '& .MuiInputLabel-root.Mui-focused': {
                            color: '#6366f1',
                        },
                    },
                    // Wider autocomplete
                    '& .MuiAutocomplete-root': {
                        '& .MuiOutlinedInput-root': {
                            borderRadius: '10px',
                            background: '#fff',
                            fontSize: '0.95rem',
                            minHeight: '48px',
                            '& fieldset': {
                                borderColor: '#e2e8f0',
                            },
                            '&:hover fieldset': {
                                borderColor: '#94a3b8',
                            },
                            '&.Mui-focused fieldset': {
                                borderColor: '#6366f1',
                                borderWidth: '1.5px',
                            },
                        },
                        '& .MuiAutocomplete-input': {
                            fontSize: '0.95rem',
                            padding: '8px 4px !important',
                        },
                    },
                    // Full width grid items
                    '& .MuiGrid-container': {
                        '& .MuiGrid-item': {
                            '& .MuiTextField-root, & .MuiAutocomplete-root': {
                                width: '100%',
                            },
                        },
                    },
                }}
            >
                {children}
            </Box>

            {/* Footer Actions */}
            {actions && (
                <Box
                    sx={{
                        px: 4,
                        py: 2,
                        display: 'flex',
                        justifyContent: 'flex-end',
                        gap: 1.5,
                        borderTop: '1px solid #e2e8f0',
                        background: '#f8fafc',
                    }}
                >
                    {actions}
                </Box>
            )}
        </Dialog>
    );
};

export default MuiModal;
