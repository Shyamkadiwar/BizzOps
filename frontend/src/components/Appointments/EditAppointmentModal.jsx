import React, { useState, useEffect } from 'react';
import {
    TextField,
    MenuItem,
    Box,
    Autocomplete
} from '@mui/material';
import axios from 'axios';
import MuiModal from '../shared/MuiModal.jsx';

const EditAppointmentModal = ({ open, onClose, appointment, onAppointmentUpdated }) => {
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        startTime: '',
        endTime: '',
        location: '',
        attendees: [],
        customer: null,
        type: 'Meeting',
        reminder: 15
    });
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (open && appointment) {
            const formatDateTime = (dateString) => {
                if (!dateString) return '';
                const date = new Date(dateString);
                return date.toISOString().slice(0, 16);
            };

            setFormData({
                title: appointment.title || '',
                description: appointment.description || '',
                startTime: formatDateTime(appointment.startTime),
                endTime: formatDateTime(appointment.endTime),
                location: appointment.location || '',
                attendees: appointment.attendees || [],
                customer: appointment.customer || null,
                type: appointment.type || 'Meeting',
                reminder: appointment.reminder || 15
            });
            fetchCustomers();
        }
    }, [open, appointment]);

    const fetchCustomers = async () => {
        try {
            const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/v1/customer/get-customer`, {
                withCredentials: true
            });
            setCustomers(response.data.data.customers || []);
        } catch (error) {
            console.error('Error fetching customers:', error);
        }
    };

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async () => {
        if (!formData.title || !formData.startTime || !formData.endTime) {
            alert('Title, start time, and end time are required');
            return;
        }

        if (new Date(formData.endTime) <= new Date(formData.startTime)) {
            alert('End time must be after start time');
            return;
        }

        setLoading(true);
        try {
            const response = await axios.put(
                `${import.meta.env.VITE_BACKEND_URL}/api/v1/appointments/${appointment._id}`,
                {
                    ...formData,
                    customer: formData.customer?._id
                },
                { withCredentials: true }
            );

            onAppointmentUpdated(response.data.data);
            onClose();
        } catch (error) {
            console.error('Error updating appointment:', error);
            alert('Failed to update appointment');
        } finally {
            setLoading(false);
        }
    };

    if (!appointment) return null;

    return (
        <MuiModal open={open} onClose={onClose} title="Edit Appointment"
            actions={
                <>
                    <button onClick={onClose}
                        className="px-6 py-2.5 bg-white border border-gray-300 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 text-sm font-medium text-gray-700">
                        Cancel
                    </button>
                    <button onClick={handleSubmit} disabled={loading}
                        className="px-6 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl shadow-md hover:shadow-lg hover:from-blue-600 hover:to-indigo-600 transition-all duration-200 text-sm font-medium text-white disabled:opacity-50">
                        {loading ? 'Updating...' : 'Update Appointment'}
                    </button>
                </>
            }
        >
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                {/* Row 1: Title | Type | Customer */}
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 2 }}>
                    <TextField label="Title" value={formData.title} onChange={(e) => handleChange('title', e.target.value)} required fullWidth />
                    <TextField select label="Type" value={formData.type} onChange={(e) => handleChange('type', e.target.value)} fullWidth>
                        <MenuItem value="Meeting">Meeting</MenuItem>
                        <MenuItem value="Call">Call</MenuItem>
                        <MenuItem value="Site Visit">Site Visit</MenuItem>
                        <MenuItem value="Other">Other</MenuItem>
                    </TextField>
                    <Autocomplete options={customers} getOptionLabel={(option) => option.name || ''} value={formData.customer} onChange={(e, newValue) => handleChange('customer', newValue)} renderInput={(params) => <TextField {...params} label="Customer" />} fullWidth />
                </Box>

                {/* Row 2: Start Time | End Time | Location */}
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 2 }}>
                    <TextField label="Start Time" type="datetime-local" value={formData.startTime} onChange={(e) => handleChange('startTime', e.target.value)} InputLabelProps={{ shrink: true }} required fullWidth />
                    <TextField label="End Time" type="datetime-local" value={formData.endTime} onChange={(e) => handleChange('endTime', e.target.value)} InputLabelProps={{ shrink: true }} required fullWidth />
                    <TextField label="Location" value={formData.location} onChange={(e) => handleChange('location', e.target.value)} fullWidth />
                </Box>

                {/* Row 3: Attendees | Reminder */}
                <Box sx={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 2 }}>
                    <Autocomplete multiple freeSolo options={[]} value={formData.attendees} onChange={(e, newValue) => handleChange('attendees', newValue)} renderInput={(params) => (<TextField {...params} label="Attendees" placeholder="Type and press Enter" />)} fullWidth />
                    <TextField label="Reminder (minutes before)" type="number" value={formData.reminder} onChange={(e) => handleChange('reminder', parseInt(e.target.value) || 15)} fullWidth />
                </Box>

                {/* Row 4: Description */}
                <TextField label="Description" value={formData.description} onChange={(e) => handleChange('description', e.target.value)} multiline rows={2} fullWidth />
            </Box>
        </MuiModal>
    );
};

export default EditAppointmentModal;
