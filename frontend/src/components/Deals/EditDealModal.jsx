import React, { useState, useEffect } from 'react';
import {
    TextField,
    MenuItem,
    Box,
    Slider,
    Typography,
    Chip,
    Autocomplete
} from '@mui/material';
import axios from 'axios';
import MuiModal from '../shared/MuiModal.jsx';

const EditDealModal = ({ open, onClose, deal, onDealUpdated }) => {
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        status: 'New',
        customer: null,
        value: 0,
        probability: 50,
        expectedCloseDate: '',
        actualCloseDate: '',
        involvedPersons: [],
        notes: ''
    });
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (open && deal) {
            setFormData({
                title: deal.title || '',
                description: deal.description || '',
                status: deal.status || 'New',
                customer: deal.customer || null,
                value: deal.value || 0,
                probability: deal.probability || 50,
                expectedCloseDate: deal.expectedCloseDate ? deal.expectedCloseDate.split('T')[0] : '',
                actualCloseDate: deal.actualCloseDate ? deal.actualCloseDate.split('T')[0] : '',
                involvedPersons: deal.involvedPersons || [],
                notes: deal.notes || ''
            });
            fetchCustomers();
        }
    }, [open, deal]);

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
        if (!formData.title) {
            alert('Title is required');
            return;
        }

        setLoading(true);
        try {
            const response = await axios.put(
                `${import.meta.env.VITE_BACKEND_URL}/api/v1/deals/${deal._id}`,
                {
                    ...formData,
                    customer: formData.customer?._id
                },
                { withCredentials: true }
            );

            onDealUpdated(response.data.data);
            onClose();
        } catch (error) {
            console.error('Error updating deal:', error);
            alert('Failed to update deal');
        } finally {
            setLoading(false);
        }
    };

    if (!deal) return null;

    return (
        <MuiModal open={open} onClose={onClose} title="Edit Deal"
            actions={
                <>
                    <button onClick={onClose}
                        className="px-6 py-2.5 bg-white border border-gray-300 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 text-sm font-medium text-gray-700">
                        Cancel
                    </button>
                    <button onClick={handleSubmit} disabled={loading}
                        className="px-6 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl shadow-md hover:shadow-lg hover:from-blue-600 hover:to-indigo-600 transition-all duration-200 text-sm font-medium text-white disabled:opacity-50">
                        {loading ? 'Updating...' : 'Update Deal'}
                    </button>
                </>
            }
        >
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 2 }}>
                    <TextField label="Title" value={formData.title} onChange={(e) => handleChange('title', e.target.value)} required fullWidth />
                    <TextField select label="Status" value={formData.status} onChange={(e) => handleChange('status', e.target.value)} fullWidth>
                        <MenuItem value="New">New</MenuItem>
                        <MenuItem value="Prospect">Prospect</MenuItem>
                        <MenuItem value="Proposal">Proposal</MenuItem>
                        <MenuItem value="Won">Won</MenuItem>
                        <MenuItem value="Lost">Lost</MenuItem>
                    </TextField>
                    <Autocomplete options={customers} getOptionLabel={(option) => option.name || ''} value={formData.customer} onChange={(e, newValue) => handleChange('customer', newValue)} renderInput={(params) => <TextField {...params} label="Customer" />} fullWidth />
                </Box>

                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 2 }}>
                    <TextField label="Value (₹)" type="number" value={formData.value} onChange={(e) => handleChange('value', parseFloat(e.target.value) || 0)} fullWidth />
                    <TextField label="Expected Close Date" type="date" value={formData.expectedCloseDate} onChange={(e) => handleChange('expectedCloseDate', e.target.value)} InputLabelProps={{ shrink: true }} fullWidth />
                    {(formData.status === 'Won' || formData.status === 'Lost') ? (
                        <TextField label="Actual Close Date" type="date" value={formData.actualCloseDate} onChange={(e) => handleChange('actualCloseDate', e.target.value)} InputLabelProps={{ shrink: true }} fullWidth />
                    ) : (
                        <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                            <Typography variant="body2" sx={{ mb: 0.5 }}>Probability: {formData.probability}%</Typography>
                            <Slider value={formData.probability} onChange={(e, newValue) => handleChange('probability', newValue)} min={0} max={100} step={5} valueLabelDisplay="auto" size="small" />
                        </Box>
                    )}
                </Box>

                <TextField label="Description" value={formData.description} onChange={(e) => handleChange('description', e.target.value)} multiline rows={3} fullWidth />

                <Autocomplete multiple freeSolo options={[]} value={formData.involvedPersons} onChange={(e, newValue) => handleChange('involvedPersons', newValue)}
                    renderTags={(value, getTagProps) => value.map((option, index) => (<Chip label={option} {...getTagProps({ index })} />))}
                    renderInput={(params) => (<TextField {...params} label="Involved Persons" placeholder="Type and press Enter" />)} fullWidth />

                <TextField label="Notes" value={formData.notes} onChange={(e) => handleChange('notes', e.target.value)} multiline rows={2} fullWidth />
            </Box>
        </MuiModal>
    );
};

export default EditDealModal;
