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
    Slider,
    Typography,
    Chip,
    Autocomplete
} from '@mui/material';
import axios from 'axios';

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
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle>Edit Deal</DialogTitle>
            <DialogContent>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
                    <TextField
                        label="Title"
                        value={formData.title}
                        onChange={(e) => handleChange('title', e.target.value)}
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

                    <TextField
                        select
                        label="Status"
                        value={formData.status}
                        onChange={(e) => handleChange('status', e.target.value)}
                        fullWidth
                    >
                        <MenuItem value="New">New</MenuItem>
                        <MenuItem value="Prospect">Prospect</MenuItem>
                        <MenuItem value="Proposal">Proposal</MenuItem>
                        <MenuItem value="Won">Won</MenuItem>
                        <MenuItem value="Lost">Lost</MenuItem>
                    </TextField>

                    <Autocomplete
                        options={customers}
                        getOptionLabel={(option) => option.name || ''}
                        value={formData.customer}
                        onChange={(e, newValue) => handleChange('customer', newValue)}
                        renderInput={(params) => <TextField {...params} label="Customer" />}
                        fullWidth
                    />

                    <TextField
                        label="Value (₹)"
                        type="number"
                        value={formData.value}
                        onChange={(e) => handleChange('value', parseFloat(e.target.value) || 0)}
                        fullWidth
                    />

                    <Box>
                        <Typography gutterBottom>Probability: {formData.probability}%</Typography>
                        <Slider
                            value={formData.probability}
                            onChange={(e, newValue) => handleChange('probability', newValue)}
                            min={0}
                            max={100}
                            step={5}
                            marks
                            valueLabelDisplay="auto"
                        />
                    </Box>

                    <TextField
                        label="Expected Close Date"
                        type="date"
                        value={formData.expectedCloseDate}
                        onChange={(e) => handleChange('expectedCloseDate', e.target.value)}
                        InputLabelProps={{ shrink: true }}
                        fullWidth
                    />

                    {(formData.status === 'Won' || formData.status === 'Lost') && (
                        <TextField
                            label="Actual Close Date"
                            type="date"
                            value={formData.actualCloseDate}
                            onChange={(e) => handleChange('actualCloseDate', e.target.value)}
                            InputLabelProps={{ shrink: true }}
                            fullWidth
                        />
                    )}

                    <Autocomplete
                        multiple
                        freeSolo
                        options={[]}
                        value={formData.involvedPersons}
                        onChange={(e, newValue) => handleChange('involvedPersons', newValue)}
                        renderTags={(value, getTagProps) =>
                            value.map((option, index) => (
                                <Chip label={option} {...getTagProps({ index })} />
                            ))
                        }
                        renderInput={(params) => (
                            <TextField {...params} label="Involved Persons" placeholder="Type and press Enter" />
                        )}
                        fullWidth
                    />

                    <TextField
                        label="Notes"
                        value={formData.notes}
                        onChange={(e) => handleChange('notes', e.target.value)}
                        multiline
                        rows={2}
                        fullWidth
                    />
                </Box>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cancel</Button>
                <Button onClick={handleSubmit} variant="contained" disabled={loading}>
                    {loading ? 'Updating...' : 'Update Deal'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default EditDealModal;
