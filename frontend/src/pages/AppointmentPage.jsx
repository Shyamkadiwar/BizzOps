import React, { useState, useEffect, useMemo } from "react";
import Layout from "../components/Layout";
import { Box, Typography, IconButton, Chip, TextField, MenuItem } from "@mui/material";
import { Edit, Delete, VideoCall, Phone, Place } from "@mui/icons-material";
import { Plus, Search, X, Calendar as CalendarIcon, Clock, CheckCircle } from 'lucide-react';
import EditAppointmentModal from "../components/Appointments/EditAppointmentModal";
import MuiModal from "../components/shared/MuiModal.jsx";
import ProfessionalDataGrid from "../components/shared/ProfessionalDataGrid.jsx";
import axios from "axios";

function AppointmentPage() {
    const [allAppointments, setAllAppointments] = useState([]);
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

    // Filters
    const [search, setSearch] = useState('');
    const [typeFilter, setTypeFilter] = useState('all'); // 'all', 'Meeting', 'Call', 'Site Visit', 'Other'
    const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'upcoming', 'past'

    useEffect(() => {
        fetchAppointments();
    }, []);

    const fetchAppointments = async () => {
        setLoading(true);
        try {
            const response = await axios.get(
                `${import.meta.env.VITE_BACKEND_URL}/api/v1/appointments/get-appointments`,
                { withCredentials: true }
            );
            const data = response.data.data.appointments || [];
            const mappedData = data.map(app => ({ ...app, id: app._id }));
            
            // Sort by start time descending (newest first)
            mappedData.sort((a,b) => new Date(b.startTime) - new Date(a.startTime));
            
            setAllAppointments(mappedData);
            setAppointments(mappedData);
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
            setFormData({ title: '', description: '', startTime: '', endTime: '', location: '', type: 'Meeting' });
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

    // Apply Client-side filtering
    useEffect(() => {
        let filtered = [...allAppointments];
        const now = new Date();

        if (search.trim()) {
            const q = search.toLowerCase();
            filtered = filtered.filter(a => 
                a.title.toLowerCase().includes(q) || 
                (a.location && a.location.toLowerCase().includes(q)) ||
                (a.description && a.description.toLowerCase().includes(q))
            );
        }

        if (typeFilter !== 'all') {
            filtered = filtered.filter(a => a.type === typeFilter);
        }

        if (statusFilter === 'upcoming') {
            filtered = filtered.filter(a => new Date(a.startTime) > now);
        } else if (statusFilter === 'past') {
            filtered = filtered.filter(a => new Date(a.startTime) <= now);
        }

        setAppointments(filtered);
    }, [search, typeFilter, statusFilter, allAppointments]);

    const stats = useMemo(() => {
        const now = new Date();
        const upcoming = appointments.filter(a => new Date(a.startTime) > now).length;
        const meetings = appointments.filter(a => a.type === 'Meeting').length;
        const calls = appointments.filter(a => a.type === 'Call').length;

        return {
            total: allAppointments.length,
            filtered: appointments.length,
            upcoming,
            meetings,
            calls
        };
    }, [appointments, allAppointments]);

    const getTypeIcon = (type) => {
        switch (type) {
            case 'Call': return <Phone fontSize="small" />;
            case 'Site Visit': return <Place fontSize="small" />;
            default: return <VideoCall fontSize="small" />;
        }
    };

    const formatDateTime = (dateString) => {
        return new Date(dateString).toLocaleString('en-IN', {
            day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
        });
    };

    const columns = [
        { field: 'title', headerName: 'Title', width: 220, filterable: true },
        { 
            field: 'type', 
            headerName: 'Type', 
            width: 140,
            renderCell: (params) => (
                <Chip icon={getTypeIcon(params.value)} label={params.value} size="small" sx={{ backgroundColor: '#e0f2fe', color: '#0284c7' }} />
            )
        },
        { 
            field: 'startTime', 
            headerName: 'Start Time', 
            width: 180,
            valueFormatter: (value) => value ? formatDateTime(value) : 'N/A'
        },
        { 
            field: 'endTime', 
            headerName: 'End Time', 
            width: 180,
            valueFormatter: (value) => value ? formatDateTime(value) : 'N/A'
        },
        { field: 'location', headerName: 'Location', width: 160 },
        {
            field: 'actions', headerName: 'Actions', width: 120, sortable: false, filterable: false,
            renderCell: (params) => (
                <Box>
                    <IconButton size="small" onClick={() => { setSelectedAppointment(params.row); setEditModalOpen(true); }}>
                        <Edit fontSize="small" />
                    </IconButton>
                    <IconButton size="small" color="error" onClick={() => handleDelete(params.row._id)}>
                        <Delete fontSize="small" />
                    </IconButton>
                </Box>
            )
        }
    ];

    const clearFilters = () => { setSearch(''); setTypeFilter('all'); setStatusFilter('all'); };
    const hasActiveFilter = search || typeFilter !== 'all' || statusFilter !== 'all';

    return (
        <Layout>
            <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-gray-100 p-6">
                
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Appointments</h1>
                        <p className="text-sm text-gray-600">Schedule and manage your appointments and calls</p>
                    </div>
                    <button onClick={() => setModalOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500/80 to-indigo-500/80 backdrop-blur-md border border-white/30 rounded-xl shadow-md hover:shadow-lg hover:from-blue-600/90 hover:to-indigo-600/90 transition-all duration-200 text-sm font-medium text-white">
                        <Plus size={16} /> Add Appointment
                    </button>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
                    <div className="bg-white/70 backdrop-blur-md border border-white/40 rounded-2xl shadow-sm p-4">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Appointments</span>
                            <CalendarIcon size={16} className="text-indigo-500" />
                        </div>
                        <p className="text-2xl font-bold text-gray-900">{stats.filtered}</p>
                        <p className="text-xs text-gray-400 mt-0.5">out of {stats.total} total</p>
                    </div>
                    <div className="bg-white/70 backdrop-blur-md border border-white/40 rounded-2xl shadow-sm p-4">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Upcoming</span>
                            <Clock size={16} className="text-green-500" />
                        </div>
                        <p className="text-2xl font-bold text-gray-900">{stats.upcoming}</p>
                        <p className="text-xs text-gray-400 mt-0.5">scheduled for future</p>
                    </div>
                    <div className="bg-white/70 backdrop-blur-md border border-white/40 rounded-2xl shadow-sm p-4">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Meetings</span>
                            <VideoCall fontSize="small" className="text-blue-500" />
                        </div>
                        <p className="text-2xl font-bold text-gray-900">{stats.meetings}</p>
                        <p className="text-xs text-gray-400 mt-0.5">video or physical</p>
                    </div>
                    <div className="bg-white/70 backdrop-blur-md border border-white/40 rounded-2xl shadow-sm p-4">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Calls</span>
                            <Phone fontSize="small" className="text-orange-500" />
                        </div>
                        <p className="text-2xl font-bold text-gray-900">{stats.calls}</p>
                        <p className="text-xs text-gray-400 mt-0.5">audio conference</p>
                    </div>
                </div>

                {/* Filter Bar */}
                <div className="bg-white/70 backdrop-blur-md border border-white/40 rounded-2xl shadow-sm p-4 mb-4 flex flex-wrap gap-3 items-center">
                    <div className="relative flex-1 min-w-52">
                        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search title, description, location..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="w-full pl-9 pr-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all text-gray-700"
                        />
                        {search && (
                            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2">
                                <X size={14} className="text-gray-400 hover:text-gray-600" />
                            </button>
                        )}
                    </div>

                    <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1">
                        {[{ key: 'all', label: 'All' }, { key: 'upcoming', label: 'Upcoming' }, { key: 'past', label: 'Past' }].map(opt => (
                            <button key={opt.key} onClick={() => setStatusFilter(opt.key)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${statusFilter === opt.key ? 'bg-white text-indigo-700 shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}>
                                {opt.label}
                            </button>
                        ))}
                    </div>

                    <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
                        className="px-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all text-gray-700 font-medium">
                        <option value="all">All Types</option>
                        <option value="Meeting">Meeting</option>
                        <option value="Call">Call</option>
                        <option value="Site Visit">Site Visit</option>
                        <option value="Other">Other</option>
                    </select>

                    {hasActiveFilter && (
                        <button onClick={clearFilters}
                            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 rounded-xl transition-colors">
                            <X size={13} /> Clear
                        </button>
                    )}
                </div>

                {/* Data Grid */}
                <div className="bg-white/70 backdrop-blur-md border border-white/40 rounded-2xl shadow-md overflow-hidden">
                    <Box sx={{ height: 560, width: '100%' }}>
                        <ProfessionalDataGrid
                            rows={appointments}
                            columns={columns}
                            loading={loading}
                            initialState={{ pagination: { paginationModel: { pageSize: 25, page: 0 } } }}
                            pageSizeOptions={[10, 25, 50, 100]}
                            disableRowSelectionOnClick
                        />
                    </Box>
                </div>

                {/* Add Modal */}
                <MuiModal open={modalOpen} onClose={() => setModalOpen(false)} title="Add Appointment"
                    actions={
                        <>
                            <button onClick={() => setModalOpen(false)}
                                className="px-6 py-2.5 bg-white border border-gray-300 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 text-sm font-medium text-gray-700">
                                Cancel
                            </button>
                            <button onClick={handleSubmit}
                                className="px-6 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl shadow-md hover:shadow-lg hover:from-blue-600 hover:to-indigo-600 transition-all duration-200 text-sm font-medium text-white">
                                Create Appointment
                            </button>
                        </>
                    }
                >
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 2 }}>
                            <TextField label="Title" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} required fullWidth />
                            <TextField select label="Type" value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value })} fullWidth>
                                <MenuItem value="Meeting">Meeting</MenuItem>
                                <MenuItem value="Call">Call</MenuItem>
                                <MenuItem value="Site Visit">Site Visit</MenuItem>
                                <MenuItem value="Other">Other</MenuItem>
                            </TextField>
                            <TextField label="Location" value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })} fullWidth />
                        </Box>
                        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                            <TextField label="Start Time" type="datetime-local" value={formData.startTime} onChange={(e) => setFormData({ ...formData, startTime: e.target.value })} InputLabelProps={{ shrink: true }} required fullWidth />
                            <TextField label="End Time" type="datetime-local" value={formData.endTime} onChange={(e) => setFormData({ ...formData, endTime: e.target.value })} InputLabelProps={{ shrink: true }} required fullWidth />
                        </Box>
                        <TextField label="Description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} multiline rows={2} fullWidth />
                    </Box>
                </MuiModal>

                {/* Edit Modal */}
                <EditAppointmentModal
                    open={editModalOpen}
                    onClose={() => setEditModalOpen(false)}
                    appointment={selectedAppointment}
                    onAppointmentUpdated={fetchAppointments}
                />
            </div>
        </Layout>
    );
}

export default AppointmentPage;
