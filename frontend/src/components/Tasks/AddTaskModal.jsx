import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    MenuItem,
    Box,
    Typography,
    IconButton,
    Chip
} from '@mui/material';
import { Add, Close } from '@mui/icons-material';
import axios from 'axios';

const AddTaskModal = ({ open, onClose, onTaskAdded, initialStatus }) => {
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        priority: 'Medium',
        status: initialStatus || 'Not Started',
        dueDate: '',
        assignedTo: null,
        subtasks: [],
        tags: []
    });
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [newSubtask, setNewSubtask] = useState('');

    useEffect(() => {
        if (open) {
            fetchUsers();
            if (initialStatus) {
                setFormData(prev => ({ ...prev, status: initialStatus }));
            }
        }
    }, [open, initialStatus]);

    const fetchUsers = async () => {
        try {
            const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/v1/staff/get-staff`, {
                withCredentials: true
            });
            setUsers(response.data.data.staff || []);
        } catch (error) {
            console.error('Error fetching users:', error);
        }
    };

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleAddSubtask = () => {
        if (newSubtask.trim()) {
            setFormData(prev => ({
                ...prev,
                subtasks: [...prev.subtasks, { title: newSubtask, completed: false }]
            }));
            setNewSubtask('');
        }
    };

    const handleRemoveSubtask = (index) => {
        setFormData(prev => ({
            ...prev,
            subtasks: prev.subtasks.filter((_, i) => i !== index)
        }));
    };

    const handleSubmit = async () => {
        if (!formData.name || !formData.dueDate) {
            alert('Name and due date are required');
            return;
        }

        setLoading(true);
        try {
            const response = await axios.post(
                `${import.meta.env.VITE_BACKEND_URL}/api/v1/tasks/create`,
                {
                    ...formData,
                    assignedTo: formData.assignedTo?._id
                },
                { withCredentials: true }
            );

            onTaskAdded(response.data.data);
            handleClose();
        } catch (error) {
            console.error('Error creating task:', error);
            alert('Failed to create task');
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setFormData({
            name: '',
            description: '',
            priority: 'Medium',
            status: 'Not Started',
            dueDate: '',
            assignedTo: null,
            subtasks: [],
            tags: []
        });
        setNewSubtask('');
        onClose();
    };

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
            <DialogTitle>Add New Task</DialogTitle>
            <DialogContent>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
                    <TextField
                        label="Task Name"
                        value={formData.name}
                        onChange={(e) => handleChange('name', e.target.value)}
                        required
                        fullWidth
                    />

                    <TextField
                        label="Description"
                        value={formData.description}
                        onChange={(e) => handleChange('description', e.target.value)}
                        multiline
                        rows={3}
                        fullWidth
                    />

                    <Box sx={{ display: 'flex', gap: 2 }}>
                        <TextField
                            select
                            label="Priority"
                            value={formData.priority}
                            onChange={(e) => handleChange('priority', e.target.value)}
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
                            onChange={(e) => handleChange('status', e.target.value)}
                            fullWidth
                        >
                            <MenuItem value="Not Started">Not Started</MenuItem>
                            <MenuItem value="In Progress">In Progress</MenuItem>
                            <MenuItem value="Waiting">Waiting</MenuItem>
                            <MenuItem value="Done">Done</MenuItem>
                        </TextField>
                    </Box>

                    <Box sx={{ display: 'flex', gap: 2 }}>
                        <TextField
                            label="Due Date"
                            type="date"
                            value={formData.dueDate}
                            onChange={(e) => handleChange('dueDate', e.target.value)}
                            InputLabelProps={{ shrink: true }}
                            required
                            fullWidth
                        />

                        <TextField
                            select
                            label="Assigned To"
                            value={formData.assignedTo?._id || ''}
                            onChange={(e) => {
                                const user = users.find(u => u._id === e.target.value);
                                handleChange('assignedTo', user);
                            }}
                            fullWidth
                        >
                            <MenuItem value="">None</MenuItem>
                            {users.map((user) => (
                                <MenuItem key={user._id} value={user._id}>
                                    {user.name}
                                </MenuItem>
                            ))}
                        </TextField>
                    </Box>

                    <Box>
                        <Typography variant="subtitle2" sx={{ mb: 1 }}>Subtasks</Typography>
                        <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                            <TextField
                                size="small"
                                placeholder="Add subtask"
                                value={newSubtask}
                                onChange={(e) => setNewSubtask(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleAddSubtask()}
                                fullWidth
                            />
                            <IconButton onClick={handleAddSubtask} color="primary">
                                <Add />
                            </IconButton>
                        </Box>
                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                            {formData.subtasks.map((subtask, index) => (
                                <Chip
                                    key={index}
                                    label={subtask.title}
                                    onDelete={() => handleRemoveSubtask(index)}
                                    size="small"
                                />
                            ))}
                        </Box>
                    </Box>
                </Box>
            </DialogContent>
            <DialogActions>
                <Button onClick={handleClose}>Cancel</Button>
                <Button onClick={handleSubmit} variant="contained" disabled={loading}>
                    {loading ? 'Creating...' : 'Create Task'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default AddTaskModal;
