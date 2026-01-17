import React, { useState } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    MenuItem,
    Box,
    ToggleButtonGroup,
    ToggleButton
} from '@mui/material';
import { Task as TaskIcon, Event as EventIcon } from '@mui/icons-material';

const QuickAddEventModal = ({ open, onClose, selectedDate, onEventAdded }) => {
    const [eventType, setEventType] = useState('task');
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        priority: 'Medium',
        status: 'Not Started',
        dueDate: '',
        startTime: '',
        endTime: '',
        type: 'Meeting'
    });
    const [loading, setLoading] = useState(false);

    React.useEffect(() => {
        if (open && selectedDate) {
            const dateStr = selectedDate.toISOString().split('T')[0];
            const timeStr = selectedDate.toTimeString().slice(0, 5);
            setFormData(prev => ({
                ...prev,
                dueDate: dateStr,
                startTime: `${dateStr}T${timeStr}`,
                endTime: `${dateStr}T${timeStr}`
            }));
        }
    }, [open, selectedDate]);

    const handleSubmit = async () => {
        if (!formData.title) {
            alert('Title is required');
            return;
        }

        setLoading(true);
        try {
            const axios = (await import('axios')).default;
            const url = eventType === 'task'
                ? `${import.meta.env.VITE_BACKEND_URL}/api/v1/tasks/create`
                : `${import.meta.env.VITE_BACKEND_URL}/api/v1/appointments/create`;

            const data = eventType === 'task'
                ? {
                    name: formData.title,
                    description: formData.description,
                    priority: formData.priority,
                    status: formData.status,
                    dueDate: formData.dueDate
                }
                : {
                    title: formData.title,
                    description: formData.description,
                    startTime: formData.startTime,
                    endTime: formData.endTime,
                    type: formData.type
                };

            await axios.post(url, data, { withCredentials: true });
            onEventAdded();
            handleClose();
        } catch (error) {
            console.error('Error creating event:', error);
            alert('Failed to create event');
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setFormData({
            title: '',
            description: '',
            priority: 'Medium',
            status: 'Not Started',
            dueDate: '',
            startTime: '',
            endTime: '',
            type: 'Meeting'
        });
        setEventType('task');
        onClose();
    };

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
            <DialogTitle>Quick Add Event</DialogTitle>
            <DialogContent>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
                    <ToggleButtonGroup
                        value={eventType}
                        exclusive
                        onChange={(e, newType) => newType && setEventType(newType)}
                        fullWidth
                    >
                        <ToggleButton value="task">
                            <TaskIcon sx={{ mr: 1 }} />
                            Task
                        </ToggleButton>
                        <ToggleButton value="appointment">
                            <EventIcon sx={{ mr: 1 }} />
                            Appointment
                        </ToggleButton>
                    </ToggleButtonGroup>

                    <TextField
                        label="Title"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        required
                        fullWidth
                    />

                    <TextField
                        label="Description"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        multiline
                        rows={2}
                        fullWidth
                    />

                    {eventType === 'task' ? (
                        <>
                            <Box sx={{ display: 'flex', gap: 2 }}>
                                <TextField
                                    select
                                    label="Priority"
                                    value={formData.priority}
                                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                                    fullWidth
                                >
                                    <MenuItem value="Low">Low</MenuItem>
                                    <MenuItem value="Medium">Medium</MenuItem>
                                    <MenuItem value="High">High</MenuItem>
                                    <MenuItem value="Urgent">Urgent</MenuItem>
                                </TextField>

                                <TextField
                                    select
                                    label="Status"
                                    value={formData.status}
                                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                    fullWidth
                                >
                                    <MenuItem value="Not Started">Not Started</MenuItem>
                                    <MenuItem value="In Progress">In Progress</MenuItem>
                                    <MenuItem value="Waiting">Waiting</MenuItem>
                                    <MenuItem value="Done">Done</MenuItem>
                                </TextField>
                            </Box>

                            <TextField
                                label="Due Date"
                                type="date"
                                value={formData.dueDate}
                                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                                InputLabelProps={{ shrink: true }}
                                required
                                fullWidth
                            />
                        </>
                    ) : (
                        <>
                            <TextField
                                select
                                label="Type"
                                value={formData.type}
                                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                fullWidth
                            >
                                <MenuItem value="Meeting">Meeting</MenuItem>
                                <MenuItem value="Call">Call</MenuItem>
                                <MenuItem value="Site Visit">Site Visit</MenuItem>
                                <MenuItem value="Other">Other</MenuItem>
                            </TextField>

                            <TextField
                                label="Start Time"
                                type="datetime-local"
                                value={formData.startTime}
                                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                                InputLabelProps={{ shrink: true }}
                                required
                                fullWidth
                            />

                            <TextField
                                label="End Time"
                                type="datetime-local"
                                value={formData.endTime}
                                onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                                InputLabelProps={{ shrink: true }}
                                required
                                fullWidth
                            />
                        </>
                    )}
                </Box>
            </DialogContent>
            <DialogActions>
                <Button onClick={handleClose}>Cancel</Button>
                <Button onClick={handleSubmit} variant="contained" disabled={loading}>
                    {loading ? 'Creating...' : 'Create'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default QuickAddEventModal;
