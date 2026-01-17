import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    Box,
    Typography,
    IconButton,
    Tabs,
    Tab,
    Paper,
    Chip,
    List,
    ListItem,
    ListItemText,
    Divider,
    Button
} from '@mui/material';
import { Close, Edit, Delete, Person, CalendarToday, TrendingUp } from '@mui/icons-material';
import axios from 'axios';

const DealDetailsModal = ({ open, onClose, deal, onEdit, onDelete }) => {
    const [tabValue, setTabValue] = useState(0);

    if (!deal) return null;

    const formatDate = (dateString) => {
        if (!dateString) return 'Not set';
        return new Date(dateString).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'New': return '#9333ea';
            case 'Prospect': return '#06b6d4';
            case 'Proposal': return '#3b82f6';
            case 'Won': return '#10b981';
            case 'Lost': return '#ef4444';
            default: return '#6b7280';
        }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
            <DialogTitle>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="h5" sx={{ fontWeight: 700 }}>
                        Deal Details
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                        <IconButton onClick={() => onEdit(deal)} size="small">
                            <Edit />
                        </IconButton>
                        <IconButton onClick={() => onDelete(deal._id)} size="small" color="error">
                            <Delete />
                        </IconButton>
                        <IconButton onClick={onClose} size="small">
                            <Close />
                        </IconButton>
                    </Box>
                </Box>
            </DialogTitle>
            <DialogContent>
                <Box sx={{ display: 'flex', gap: 3 }}>
                    {/* Left Sidebar */}
                    <Paper sx={{ width: 280, p: 2, backgroundColor: '#f9fafb' }}>
                        <Typography variant="h4" sx={{ fontWeight: 700, color: '#10b981', mb: 1 }}>
                            ₹{(deal.value || 0).toLocaleString()}
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#6b7280', mb: 2 }}>
                            #{deal._id?.slice(-8)}
                        </Typography>

                        <Divider sx={{ my: 2 }} />

                        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>
                            Deal Information
                        </Typography>

                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                            <Box>
                                <Typography variant="caption" sx={{ color: '#6b7280' }}>
                                    Status
                                </Typography>
                                <Chip
                                    label={deal.status}
                                    size="small"
                                    sx={{
                                        backgroundColor: getStatusColor(deal.status),
                                        color: 'white',
                                        fontWeight: 600,
                                        mt: 0.5
                                    }}
                                />
                            </Box>

                            <Box>
                                <Typography variant="caption" sx={{ color: '#6b7280' }}>
                                    Probability
                                </Typography>
                                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                    {deal.probability}%
                                </Typography>
                            </Box>

                            <Box>
                                <Typography variant="caption" sx={{ color: '#6b7280' }}>
                                    Expected Close Date
                                </Typography>
                                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                    {formatDate(deal.expectedCloseDate)}
                                </Typography>
                            </Box>

                            {deal.actualCloseDate && (
                                <Box>
                                    <Typography variant="caption" sx={{ color: '#6b7280' }}>
                                        Actual Close Date
                                    </Typography>
                                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                        {formatDate(deal.actualCloseDate)}
                                    </Typography>
                                </Box>
                            )}

                            {deal.customer && (
                                <Box>
                                    <Typography variant="caption" sx={{ color: '#6b7280' }}>
                                        Customer
                                    </Typography>
                                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                        {deal.customer.name}
                                    </Typography>
                                </Box>
                            )}
                        </Box>
                    </Paper>

                    {/* Main Content */}
                    <Box sx={{ flex: 1 }}>
                        <Typography variant="h5" sx={{ fontWeight: 700, mb: 2 }}>
                            {deal.title}
                        </Typography>

                        <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
                            <Tab label="Activities" />
                            <Tab label="Notes" />
                            <Tab label="Details" />
                        </Tabs>

                        <Box sx={{ mt: 2 }}>
                            {tabValue === 0 && (
                                <Box>
                                    <Typography variant="h6" sx={{ mb: 2 }}>Activity Timeline</Typography>
                                    <List>
                                        {deal.activities && deal.activities.length > 0 ? (
                                            deal.activities.map((activity, index) => (
                                                <React.Fragment key={index}>
                                                    <ListItem>
                                                        <ListItemText
                                                            primary={activity.description}
                                                            secondary={new Date(activity.timestamp).toLocaleString()}
                                                        />
                                                    </ListItem>
                                                    {index < deal.activities.length - 1 && <Divider />}
                                                </React.Fragment>
                                            ))
                                        ) : (
                                            <Typography variant="body2" sx={{ color: '#6b7280' }}>
                                                No activities yet
                                            </Typography>
                                        )}
                                    </List>
                                </Box>
                            )}

                            {tabValue === 1 && (
                                <Box>
                                    <Typography variant="h6" sx={{ mb: 2 }}>Notes</Typography>
                                    <Typography variant="body1">
                                        {deal.notes || 'No notes added'}
                                    </Typography>
                                </Box>
                            )}

                            {tabValue === 2 && (
                                <Box>
                                    <Typography variant="h6" sx={{ mb: 2 }}>Deal Details</Typography>
                                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                        <Box>
                                            <Typography variant="subtitle2" sx={{ color: '#6b7280' }}>
                                                Description
                                            </Typography>
                                            <Typography variant="body1">
                                                {deal.description || 'No description'}
                                            </Typography>
                                        </Box>

                                        {deal.involvedPersons && deal.involvedPersons.length > 0 && (
                                            <Box>
                                                <Typography variant="subtitle2" sx={{ color: '#6b7280', mb: 1 }}>
                                                    Involved Persons
                                                </Typography>
                                                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                                    {deal.involvedPersons.map((person, index) => (
                                                        <Chip key={index} label={person} size="small" />
                                                    ))}
                                                </Box>
                                            </Box>
                                        )}
                                    </Box>
                                </Box>
                            )}
                        </Box>
                    </Box>
                </Box>
            </DialogContent>
        </Dialog>
    );
};

export default DealDetailsModal;
