import React, { useState } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Box,
    Typography,
    Chip,
    IconButton,
    Divider
} from '@mui/material';
import { Close, Edit, Delete, CalendarToday, Person, TrendingUp, CheckCircle } from '@mui/icons-material';

const EventDetailsModal = ({ open, onClose, event, onEdit, onDelete }) => {
    if (!event) return null;

    const isTask = event.type === 'task';
    const isAppointment = event.type === 'appointment';
    const isDeal = event.type === 'deal';

    const formatDateTime = (dateString) => {
        return new Date(dateString).toLocaleString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    };

    const getPriorityColor = (priority) => {
        switch (priority) {
            case 'Low': return { bg: '#f3f4f6', text: '#6b7280' };
            case 'Medium': return { bg: '#dbeafe', text: '#2563eb' };
            case 'High': return { bg: '#fed7aa', text: '#ea580c' };
            case 'Urgent': return { bg: '#fecaca', text: '#dc2626' };
            default: return { bg: '#f3f4f6', text: '#6b7280' };
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'Not Started': return '#6b7280';
            case 'In Progress': return '#3b82f6';
            case 'Waiting': return '#f59e0b';
            case 'Done': return '#10b981';
            default: return '#6b7280';
        }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        {isTask ? 'Task Details' : isDeal ? 'Deal Details' : 'Appointment Details'}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                        <IconButton onClick={() => onEdit(event)} size="small">
                            <Edit />
                        </IconButton>
                        <IconButton onClick={() => onDelete(event.id)} size="small" color="error">
                            <Delete />
                        </IconButton>
                        <IconButton onClick={onClose} size="small">
                            <Close />
                        </IconButton>
                    </Box>
                </Box>
            </DialogTitle>
            <DialogContent>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Typography variant="h5" sx={{ fontWeight: 700 }}>
                        {event.title}
                    </Typography>

                    {isTask && (
                        <>
                            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                <Chip
                                    label={event.priority}
                                    size="small"
                                    sx={{
                                        backgroundColor: getPriorityColor(event.priority).bg,
                                        color: getPriorityColor(event.priority).text,
                                        fontWeight: 600
                                    }}
                                />
                                <Chip
                                    label={event.status}
                                    size="small"
                                    sx={{
                                        backgroundColor: getStatusColor(event.status),
                                        color: 'white',
                                        fontWeight: 600
                                    }}
                                />
                            </Box>

                            <Box>
                                <Typography variant="caption" sx={{ color: '#6b7280', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                    <CalendarToday sx={{ fontSize: 14 }} />
                                    Due Date
                                </Typography>
                                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                    {formatDateTime(event.start)}
                                </Typography>
                            </Box>

                            {event.assignedTo && (
                                <Box>
                                    <Typography variant="caption" sx={{ color: '#6b7280', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                        <Person sx={{ fontSize: 14 }} />
                                        Assigned To
                                    </Typography>
                                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                        {event.assignedTo.name}
                                    </Typography>
                                </Box>
                            )}
                        </>
                    )}

                    {isAppointment && (
                        <>
                            <Chip
                                label={event.appointmentType}
                                size="small"
                                sx={{
                                    backgroundColor: '#e0f2fe',
                                    color: '#0284c7',
                                    fontWeight: 600,
                                    width: 'fit-content'
                                }}
                            />

                            <Box>
                                <Typography variant="caption" sx={{ color: '#6b7280' }}>
                                    Start Time
                                </Typography>
                                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                    {formatDateTime(event.start)}
                                </Typography>
                            </Box>

                            <Box>
                                <Typography variant="caption" sx={{ color: '#6b7280' }}>
                                    End Time
                                </Typography>
                                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                    {formatDateTime(event.end)}
                                </Typography>
                            </Box>

                            {event.location && (
                                <Box>
                                    <Typography variant="caption" sx={{ color: '#6b7280' }}>
                                        Location
                                    </Typography>
                                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                        {event.location}
                                    </Typography>
                                </Box>
                            )}

                            {event.attendees && event.attendees.length > 0 && (
                                <Box>
                                    <Typography variant="caption" sx={{ color: '#6b7280', mb: 1 }}>
                                        Attendees
                                    </Typography>
                                    <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                                        {event.attendees.map((attendee, index) => (
                                            <Chip key={index} label={attendee} size="small" />
                                        ))}
                                    </Box>
                                </Box>
                            )}
                        </>
                    )}

                    {isDeal && (
                        <>
                            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                <Chip
                                    label={event.dealStatus}
                                    size="small"
                                    sx={{
                                        backgroundColor:
                                            event.dealStatus === 'New' ? '#9333ea' :
                                                event.dealStatus === 'Prospect' ? '#06b6d4' :
                                                    event.dealStatus === 'Proposal' ? '#3b82f6' :
                                                        event.dealStatus === 'Won' ? '#10b981' :
                                                            '#ef4444',
                                        color: 'white',
                                        fontWeight: 600
                                    }}
                                />
                                {event.probability && (
                                    <Chip
                                        label={`${event.probability}%`}
                                        size="small"
                                        sx={{
                                            backgroundColor: '#e0f2fe',
                                            color: '#0284c7',
                                            fontWeight: 600
                                        }}
                                    />
                                )}
                            </Box>

                            <Box>
                                <Typography variant="caption" sx={{ color: '#6b7280' }}>
                                    Deal Value
                                </Typography>
                                <Typography variant="h6" sx={{ fontWeight: 700, color: '#10b981' }}>
                                    ₹{(event.value || 0).toLocaleString()}
                                </Typography>
                            </Box>

                            <Box>
                                <Typography variant="caption" sx={{ color: '#6b7280', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                    <CalendarToday sx={{ fontSize: 14 }} />
                                    Expected Close Date
                                </Typography>
                                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                    {formatDate(event.start)}
                                </Typography>
                            </Box>

                            {event.customer && (
                                <Box>
                                    <Typography variant="caption" sx={{ color: '#6b7280', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                        <Person sx={{ fontSize: 14 }} />
                                        Customer
                                    </Typography>
                                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                        {event.customer.name}
                                    </Typography>
                                </Box>
                            )}
                        </>
                    )}

                    {event.description && (
                        <>
                            <Divider />
                            <Box>
                                <Typography variant="caption" sx={{ color: '#6b7280' }}>
                                    Description
                                </Typography>
                                <Typography variant="body1">
                                    {event.description}
                                </Typography>
                            </Box>
                        </>
                    )}
                </Box>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Close</Button>
            </DialogActions>
        </Dialog>
    );
};

export default EventDetailsModal;
