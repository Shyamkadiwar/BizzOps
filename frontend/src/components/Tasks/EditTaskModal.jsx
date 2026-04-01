import React, { useState, useEffect } from 'react';
import {
    TextField,
    MenuItem,
    Box,
    Typography,
    IconButton,
    Chip,
    Checkbox,
    FormControlLabel
} from '@mui/material';
import { Add, Close } from '@mui/icons-material';
import axios from 'axios';
import MuiModal from '../shared/MuiModal.jsx';

const EditTaskModal = ({ open, onClose, task, onTaskUpdated }) => {
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        priority: 'Medium',
        status: 'Not Started',
        dueDate: '',
        assignedTo: null,
        subtasks: [],
        tags: []
    });
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [newSubtask, setNewSubtask] = useState('');

    useEffect(() => {
        if (open && task) {
            setFormData({
                name: task.name || '',
                description: task.description || '',
                priority: task.priority || 'Medium',
                status: task.status || 'Not Started',
                dueDate: task.dueDate ? task.dueDate.split('T')[0] : '',
                assignedTo: task.assignedTo || null,
                subtasks: task.subtasks || [],
                tags: task.tags || []
            });
            fetchUsers();
        }
    }, [open, task]);

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

    const handleToggleSubtask = (index) => {
        setFormData(prev => ({
            ...prev,
            subtasks: prev.subtasks.map((st, i) =>
                i === index ? { ...st, completed: !st.completed } : st
            )
        }));
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
            const response = await axios.put(
                `${import.meta.env.VITE_BACKEND_URL}/api/v1/tasks/${task._id}`,
                {
                    ...formData,
                    assignedTo: formData.assignedTo?._id
                },
                { withCredentials: true }
            );

            onTaskUpdated(response.data.data);
            onClose();
        } catch (error) {
            console.error('Error updating task:', error);
            alert('Failed to update task');
        } finally {
            setLoading(false);
        }
    };

    if (!task) return null;

    return (
        <MuiModal open={open} onClose={onClose} title="Edit Task"
            actions={
                <>
                    <button onClick={onClose}
                        className="px-6 py-2.5 bg-white border border-gray-300 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 text-sm font-medium text-gray-700">
                        Cancel
                    </button>
                    <button onClick={handleSubmit} disabled={loading}
                        className="px-6 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl shadow-md hover:shadow-lg hover:from-blue-600 hover:to-indigo-600 transition-all duration-200 text-sm font-medium text-white disabled:opacity-50">
                        {loading ? 'Updating...' : 'Update Task'}
                    </button>
                </>
            }
        >
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 2 }}>
                    <TextField label="Task Name" value={formData.name} onChange={(e) => handleChange('name', e.target.value)} required fullWidth />
                    <TextField select label="Priority" value={formData.priority} onChange={(e) => handleChange('priority', e.target.value)} fullWidth>
                        <MenuItem value="Low">Low</MenuItem>
                        <MenuItem value="Medium">Medium</MenuItem>
                        <MenuItem value="High">High</MenuItem>
                        <MenuItem value="Urgent">Urgent</MenuItem>
                    </TextField>
                    <TextField select label="Status" value={formData.status} onChange={(e) => handleChange('status', e.target.value)} fullWidth>
                        <MenuItem value="Not Started">Not Started</MenuItem>
                        <MenuItem value="In Progress">In Progress</MenuItem>
                        <MenuItem value="Waiting">Waiting</MenuItem>
                        <MenuItem value="Done">Done</MenuItem>
                    </TextField>
                </Box>

                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 2 }}>
                    <TextField label="Due Date" type="date" value={formData.dueDate} onChange={(e) => handleChange('dueDate', e.target.value)} InputLabelProps={{ shrink: true }} required fullWidth />
                    <TextField select label="Assigned To" value={formData.assignedTo?._id || ''} onChange={(e) => { const user = users.find(u => u._id === e.target.value); handleChange('assignedTo', user); }} fullWidth>
                        <MenuItem value="">None</MenuItem>
                        {users.map((user) => (<MenuItem key={user._id} value={user._id}>{user.name}</MenuItem>))}
                    </TextField>
                </Box>

                <TextField label="Description" value={formData.description} onChange={(e) => handleChange('description', e.target.value)} multiline rows={3} fullWidth />

                <Box>
                    <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1 }}>Subtasks</Typography>
                    <Box sx={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 1, mb: 1 }}>
                        <TextField size="small" placeholder="Add subtask" value={newSubtask} onChange={(e) => setNewSubtask(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleAddSubtask()} fullWidth />
                        <IconButton onClick={handleAddSubtask} color="primary"><Add /></IconButton>
                    </Box>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                        {formData.subtasks.map((subtask, index) => (
                            <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <FormControlLabel control={<Checkbox checked={subtask.completed} onChange={() => handleToggleSubtask(index)} />} label={subtask.title} sx={{ flex: 1 }} />
                                <IconButton size="small" onClick={() => handleRemoveSubtask(index)}><Close fontSize="small" /></IconButton>
                            </Box>
                        ))}
                    </Box>
                </Box>
            </Box>
        </MuiModal>
    );
};

export default EditTaskModal;
