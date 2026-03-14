import React, { useState, useEffect } from "react";
import Layout from "../components/Layout";
import {
    Box,
    Typography,
    Button,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    IconButton,
    Chip,
    CircularProgress,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    MenuItem
} from "@mui/material";
import { Add, Edit, Delete, VideoCall, Phone, Place } from "@mui/icons-material";
import EditAppointmentModal from "../components/Appointments/EditAppointmentModal";
import axios from "axios";

function AppointmentPage() {
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [selectedAppointment, setSelectedAppointment] = useState(null);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        startTime: '',
        endTime: '',
        location: '',
        type: 'Meeting'
    });

    useEffect(() => {
        fetchAppointments();
    }, []);

    const fetchAppointments = async () => {
        try {
            const response = await axios.get(
                `${import.meta.env.VITE_BACKEND_URL}/api/v1/appointments/get-appointments`,
                { withCredentials: true }
            );
            setAppointments(response.data.data.appointments || []);
        } catch (error) {
            console.error('Error fetching appointments:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async () => {
        try {
            await axios.post(
                `${import.meta.env.VITE_BACKEND_URL}/api/v1/appointments/create`,
                formData,
                { withCredentials: true }
            );
            setModalOpen(false);
            fetchAppointments();
            setFormData({
                title: '',
                description: '',
                startTime: '',
                endTime: '',
                location: '',
                type: 'Meeting'
            });
        } catch (error) {
            console.error('Error creating appointment:', error);
            alert('Failed to create appointment');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this appointment?')) return;

        try {
            await axios.delete(
                `${import.meta.env.VITE_BACKEND_URL}/api/v1/appointments/${id}`,
                { withCredentials: true }
            );
            fetchAppointments();
        } catch (error) {
            console.error('Error deleting appointment:', error);
        }
    };

    const getTypeIcon = (type) => {
        switch (type) {
            case 'Call': return <Phone fontSize="small" />;
            case 'Site Visit': return <Place fontSize="small" />;
            default: return <VideoCall fontSize="small" />;
        }
    };

    const formatDateTime = (dateString) => {
        return new Date(dateString).toLocaleString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <Layout>
            <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-gray-100 p-6">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Appointments</h1>
                        <p className="text-sm text-gray-600">Schedule and manage appointments</p>
                    </div>
                    <Button
                        variant="contained"
                        startIcon={<Add />}
                        onClick={() => setModalOpen(true)}
                        sx={{ backgroundColor: '#10b981', '&:hover': { backgroundColor: '#059669' } }}
                    >
                        Add Appointment
                    </Button>
                </div>

                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                        <CircularProgress />
                    </Box>
                ) : (
                    <div className="bg-white/70 backdrop-blur-md border border-white/30 rounded-2xl p-6 shadow-lg">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">Appointment Records</h3>
                        <TableContainer>
                            <Table>
                                <TableHead>
                                    <TableRow sx={{ backgroundColor: 'rgba(249,250,251,0.7)' }}>
                                        <TableCell sx={{ fontWeight: 600 }}>Title</TableCell>
                                        <TableCell sx={{ fontWeight: 600 }}>Type</TableCell>
                                        <TableCell sx={{ fontWeight: 600 }}>Start Time</TableCell>
                                        <TableCell sx={{ fontWeight: 600 }}>End Time</TableCell>
                                        <TableCell sx={{ fontWeight: 600 }}>Location</TableCell>
                                        <TableCell sx={{ fontWeight: 600 }}>Actions</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {appointments.length > 0 ? (
                                        appointments.map((appointment) => (
                                            <TableRow key={appointment._id} sx={{ '&:hover': { backgroundColor: 'rgba(249,250,251,0.5)' } }}>
                                                <TableCell>{appointment.title}</TableCell>
                                                <TableCell>
                                                    <Chip
                                                        icon={getTypeIcon(appointment.type)}
                                                        label={appointment.type}
                                                        size="small"
                                                        sx={{ backgroundColor: '#e0f2fe', color: '#0284c7' }}
                                                    />
                                                </TableCell>
                                                <TableCell>{formatDateTime(appointment.startTime)}</TableCell>
                                                <TableCell>{formatDateTime(appointment.endTime)}</TableCell>
                                                <TableCell>{appointment.location || '-'}</TableCell>
                                                <TableCell>
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => {
                                                            setSelectedAppointment(appointment);
                                                            setEditModalOpen(true);
                                                        }}
                                                    >
                                                        <Edit fontSize="small" />
                                                    </IconButton>
                                                    <IconButton size="small" color="error" onClick={() => handleDelete(appointment._id)}>
                                                        <Delete fontSize="small" />
                                                    </IconButton>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={6} align="center">
                                                No appointments found
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </div>
                )}

                <Dialog open={modalOpen} onClose={() => setModalOpen(false)} maxWidth="sm" fullWidth>
                    <DialogTitle>Add Appointment</DialogTitle>
                    <DialogContent>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
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
                            <TextField
                                label="Location"
                                value={formData.location}
                                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                fullWidth
                            />
                        </Box>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setModalOpen(false)}>Cancel</Button>
                        <Button onClick={handleSubmit} variant="contained">Create</Button>
                    </DialogActions>
                </Dialog>

                <EditAppointmentModal
                    open={editModalOpen}
                    onClose={() => setEditModalOpen(false)}
                    appointment={selectedAppointment}
                    onAppointmentUpdated={() => {
                        fetchAppointments();
                    }}
                />
            </div>
        </Layout>
    );
}

export default AppointmentPage;
