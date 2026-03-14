import React, { useState, useEffect } from "react";
import Layout from "../components/Layout";
import { Box, Typography, Button, Paper, CircularProgress } from "@mui/material";
import { Calendar as BigCalendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { Add } from "@mui/icons-material";
import EventDetailsModal from "../components/Calendar/EventDetailsModal";
import QuickAddEventModal from "../components/Calendar/QuickAddEventModal";
import EditTaskModal from "../components/Tasks/EditTaskModal";
import EditAppointmentModal from "../components/Appointments/EditAppointmentModal";
import EditDealModal from "../components/Deals/EditDealModal";
import axios from "axios";

const localizer = momentLocalizer(moment);

function CalendarPage() {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [detailsModalOpen, setDetailsModalOpen] = useState(false);
    const [quickAddModalOpen, setQuickAddModalOpen] = useState(false);
    const [editTaskModalOpen, setEditTaskModalOpen] = useState(false);
    const [editAppointmentModalOpen, setEditAppointmentModalOpen] = useState(false);
    const [editDealModalOpen, setEditDealModalOpen] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [selectedDate, setSelectedDate] = useState(null);
    const [selectedTask, setSelectedTask] = useState(null);
    const [selectedAppointment, setSelectedAppointment] = useState(null);
    const [selectedDeal, setSelectedDeal] = useState(null);

    useEffect(() => {
        fetchEvents();
    }, []);

    const fetchEvents = async () => {
        try {
            const response = await axios.get(
                `${import.meta.env.VITE_BACKEND_URL}/api/v1/calendar/events`,
                { withCredentials: true }
            );

            const formattedEvents = response.data.data.events.map(event => ({
                ...event,
                start: new Date(event.start),
                end: new Date(event.end),
                title: event.title
            }));

            setEvents(formattedEvents);
        } catch (error) {
            console.error('Error fetching events:', error);
        } finally {
            setLoading(false);
        }
    };

    const eventStyleGetter = (event) => {
        let backgroundColor = '#3b82f6';

        if (event.type === 'task') {
            backgroundColor = '#8b5cf6';
        } else if (event.type === 'appointment') {
            backgroundColor = '#10b981';
        } else if (event.type === 'deal') {
            backgroundColor = '#f59e0b';
        }

        return {
            style: {
                backgroundColor,
                borderRadius: '5px',
                opacity: 0.8,
                color: 'white',
                border: '0px',
                display: 'block'
            }
        };
    };

    const handleSelectEvent = (event) => {
        setSelectedEvent(event);
        setDetailsModalOpen(true);
    };

    const handleSelectSlot = (slotInfo) => {
        setSelectedDate(slotInfo.start);
        setQuickAddModalOpen(true);
    };

    const handleEditEvent = async (event) => {
        if (event.type === 'task') {
            try {
                const response = await axios.get(
                    `${import.meta.env.VITE_BACKEND_URL}/api/v1/tasks/${event.id}`,
                    { withCredentials: true }
                );
                setSelectedTask(response.data.data);
                setDetailsModalOpen(false);
                setEditTaskModalOpen(true);
            } catch (error) {
                console.error('Error fetching task:', error);
            }
        } else if (event.type === 'appointment') {
            try {
                const response = await axios.get(
                    `${import.meta.env.VITE_BACKEND_URL}/api/v1/appointments/${event.id}`,
                    { withCredentials: true }
                );
                setSelectedAppointment(response.data.data);
                setDetailsModalOpen(false);
                setEditAppointmentModalOpen(true);
            } catch (error) {
                console.error('Error fetching appointment:', error);
            }
        } else if (event.type === 'deal') {
            try {
                const response = await axios.get(
                    `${import.meta.env.VITE_BACKEND_URL}/api/v1/deals/${event.id}`,
                    { withCredentials: true }
                );
                setSelectedDeal(response.data.data);
                setDetailsModalOpen(false);
                setEditDealModalOpen(true);
            } catch (error) {
                console.error('Error fetching deal:', error);
            }
        }
    };

    const handleDeleteEvent = async (eventId) => {
        if (!window.confirm('Delete this event?')) return;

        try {
            const event = events.find(e => e.id === eventId);
            let url;

            if (event.type === 'task') {
                url = `${import.meta.env.VITE_BACKEND_URL}/api/v1/tasks/${eventId}`;
            } else if (event.type === 'appointment') {
                url = `${import.meta.env.VITE_BACKEND_URL}/api/v1/appointments/${eventId}`;
            } else if (event.type === 'deal') {
                url = `${import.meta.env.VITE_BACKEND_URL}/api/v1/deals/${eventId}`;
            }

            await axios.delete(url, { withCredentials: true });
            setDetailsModalOpen(false);
            fetchEvents();
        } catch (error) {
            console.error('Error deleting event:', error);
            alert('Failed to delete event');
        }
    };

    return (
        <Layout>
            <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-gray-100 p-6">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Calendar</h1>
                        <p className="text-sm text-gray-600">View all events in one place</p>
                    </div>
                    <Button
                        variant="contained"
                        startIcon={<Add />}
                        onClick={() => {
                            setSelectedDate(new Date());
                            setQuickAddModalOpen(true);
                        }}
                        sx={{ backgroundColor: '#8b5cf6', '&:hover': { backgroundColor: '#7c3aed' } }}
                    >
                        Add Event
                    </Button>
                </div>

                {/* Legend */}
                <div className="bg-white/70 backdrop-blur-md border border-white/30 rounded-xl p-3 shadow-md mb-4 flex gap-4">
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded" style={{ backgroundColor: '#8b5cf6' }} />
                        <span className="text-sm text-gray-700">Tasks</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded" style={{ backgroundColor: '#10b981' }} />
                        <span className="text-sm text-gray-700">Appointments</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded" style={{ backgroundColor: '#f59e0b' }} />
                        <span className="text-sm text-gray-700">Deals</span>
                    </div>
                </div>

                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                        <CircularProgress />
                    </Box>
                ) : (
                    <div className="bg-white/70 backdrop-blur-md border border-white/30 rounded-2xl p-6 shadow-lg" style={{ height: 600 }}>
                        <BigCalendar
                            localizer={localizer}
                            events={events}
                            startAccessor="start"
                            endAccessor="end"
                            style={{ height: '100%' }}
                            eventPropGetter={eventStyleGetter}
                            views={['month', 'week', 'day', 'agenda']}
                            defaultView="month"
                            onSelectEvent={handleSelectEvent}
                            onSelectSlot={handleSelectSlot}
                            selectable
                        />
                    </div>
                )}

                {/* Modals */}
                <EventDetailsModal
                    open={detailsModalOpen}
                    onClose={() => setDetailsModalOpen(false)}
                    event={selectedEvent}
                    onEdit={handleEditEvent}
                    onDelete={handleDeleteEvent}
                />

                <QuickAddEventModal
                    open={quickAddModalOpen}
                    onClose={() => setQuickAddModalOpen(false)}
                    selectedDate={selectedDate}
                    onEventAdded={() => {
                        fetchEvents();
                    }}
                />

                <EditTaskModal
                    open={editTaskModalOpen}
                    onClose={() => setEditTaskModalOpen(false)}
                    task={selectedTask}
                    onTaskUpdated={() => {
                        fetchEvents();
                    }}
                />

                <EditAppointmentModal
                    open={editAppointmentModalOpen}
                    onClose={() => setEditAppointmentModalOpen(false)}
                    appointment={selectedAppointment}
                    onAppointmentUpdated={() => {
                        fetchEvents();
                    }}
                />

                <EditDealModal
                    open={editDealModalOpen}
                    onClose={() => setEditDealModalOpen(false)}
                    deal={selectedDeal}
                    onDealUpdated={() => {
                        fetchEvents();
                    }}
                />
            </div>
        </Layout>
    );
}

export default CalendarPage;
