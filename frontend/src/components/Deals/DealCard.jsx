import React from 'react';
import { Card, CardContent, Typography, Box, Chip } from '@mui/material';
import { CalendarToday, Person } from '@mui/icons-material';

const DealCard = ({ deal, onClick, isDragging }) => {
    const formatDate = (dateString) => {
        if (!dateString) return 'No date';
        return new Date(dateString).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    };

    return (
        <Card
            onClick={onClick}
            sx={{
                mb: 2,
                cursor: 'pointer',
                backgroundColor: isDragging ? '#f3f4f6' : 'white',
                boxShadow: isDragging ? 4 : 1,
                transition: 'all 0.2s',
                '&:hover': {
                    boxShadow: 3,
                    transform: 'translateY(-2px)'
                }
            }}
        >
            <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 1, fontSize: '1rem' }}>
                    {deal.title}
                </Typography>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <Typography variant="h6" sx={{ color: '#10b981', fontWeight: 700 }}>
                        ₹{(deal.value || 0).toLocaleString()}
                    </Typography>
                    {deal.probability && (
                        <Chip
                            label={`${deal.probability}%`}
                            size="small"
                            sx={{
                                backgroundColor: '#e0f2fe',
                                color: '#0284c7',
                                fontWeight: 600
                            }}
                        />
                    )}
                </Box>

                {deal.customer && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                        <Person sx={{ fontSize: 16, color: '#6b7280' }} />
                        <Typography variant="body2" sx={{ color: '#6b7280' }}>
                            {deal.customer.name}
                        </Typography>
                    </Box>
                )}

                {deal.expectedCloseDate && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <CalendarToday sx={{ fontSize: 16, color: '#6b7280' }} />
                        <Typography variant="body2" sx={{ color: '#6b7280' }}>
                            {formatDate(deal.expectedCloseDate)}
                        </Typography>
                    </Box>
                )}

                {deal.description && (
                    <Typography
                        variant="body2"
                        sx={{
                            mt: 1,
                            color: '#9ca3af',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical'
                        }}
                    >
                        {deal.description}
                    </Typography>
                )}
            </CardContent>
        </Card>
    );
};

export default DealCard;
