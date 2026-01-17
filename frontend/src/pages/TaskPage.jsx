import React, { useState, useEffect } from "react";
import Layout from "../components/Layout";
import { Box, Typography, Button, Paper, Grid, CircularProgress } from "@mui/material";
import { Add } from "@mui/icons-material";
import TaskKanban from "../components/Tasks/TaskKanban";
import AddTaskModal from "../components/Tasks/AddTaskModal";
import EditTaskModal from "../components/Tasks/EditTaskModal";
import axios from "axios";

function TaskPage() {
    const [tasks, setTasks] = useState({ tasks: [], groupedTasks: {} });
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [addModalOpen, setAddModalOpen] = useState(false);
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [initialStatus, setInitialStatus] = useState('Not Started');
    const [selectedTask, setSelectedTask] = useState(null);

    useEffect(() => {
        fetchTasks();
        fetchStats();
    }, []);

    const fetchTasks = async () => {
        try {
            const response = await axios.get(
                `${import.meta.env.VITE_BACKEND_URL}/api/v1/tasks/get-tasks`,
                { withCredentials: true }
            );
            setTasks(response.data.data);
        } catch (error) {
            console.error('Error fetching tasks:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchStats = async () => {
        try {
            const response = await axios.get(
                `${import.meta.env.VITE_BACKEND_URL}/api/v1/tasks/stats`,
                { withCredentials: true }
            );
            setStats(response.data.data);
        } catch (error) {
            console.error('Error fetching stats:', error);
        }
    };

    const handleDragEnd = async (result) => {
        if (!result.destination) return;

        const { draggableId, destination } = result;
        const newStatus = destination.droppableId;

        try {
            await axios.put(
                `${import.meta.env.VITE_BACKEND_URL}/api/v1/tasks/${draggableId}/status`,
                { status: newStatus },
                { withCredentials: true }
            );
            fetchTasks();
            fetchStats();
        } catch (error) {
            console.error('Error updating task status:', error);
            alert('Failed to update task status');
        }
    };

    const handleTaskClick = (task) => {
        setSelectedTask(task);
        setEditModalOpen(true);
    };

    const handleAddTask = (status) => {
        setInitialStatus(status);
        setAddModalOpen(true);
    };

    const handleTaskAdded = () => {
        fetchTasks();
        fetchStats();
    };

    const handleDeleteTask = async (taskId) => {
        if (!window.confirm('Are you sure you want to delete this task?')) return;

        try {
            await axios.delete(
                `${import.meta.env.VITE_BACKEND_URL}/api/v1/tasks/${taskId}`,
                { withCredentials: true }
            );
            setEditModalOpen(false);
            fetchTasks();
            fetchStats();
        } catch (error) {
            console.error('Error deleting task:', error);
            alert('Failed to delete task');
        }
    };

    return (
        <Layout>
            <Box sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <Typography variant="h4" sx={{ fontWeight: 700 }}>
                        My Tasks
                    </Typography>
                    <Button
                        variant="contained"
                        startIcon={<Add />}
                        onClick={() => handleAddTask('Not Started')}
                        sx={{
                            backgroundColor: '#8b5cf6',
                            '&:hover': { backgroundColor: '#7c3aed' }
                        }}
                    >
                        Add Task
                    </Button>
                </Box>

                {stats && (
                    <Grid container spacing={2} sx={{ mb: 3 }}>
                        <Grid item xs={12} sm={6} md={3}>
                            <Paper sx={{ p: 2, backgroundColor: '#f0f9ff' }}>
                                <Typography variant="body2" sx={{ color: '#6b7280' }}>Total Tasks</Typography>
                                <Typography variant="h4" sx={{ fontWeight: 700, color: '#3b82f6' }}>
                                    {stats.total}
                                </Typography>
                            </Paper>
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <Paper sx={{ p: 2, backgroundColor: '#fef3c7' }}>
                                <Typography variant="body2" sx={{ color: '#6b7280' }}>In Progress</Typography>
                                <Typography variant="h4" sx={{ fontWeight: 700, color: '#f59e0b' }}>
                                    {stats.byStatus['In Progress']}
                                </Typography>
                            </Paper>
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <Paper sx={{ p: 2, backgroundColor: '#f0fdf4' }}>
                                <Typography variant="body2" sx={{ color: '#6b7280' }}>Completed</Typography>
                                <Typography variant="h4" sx={{ fontWeight: 700, color: '#10b981' }}>
                                    {stats.byStatus.Done}
                                </Typography>
                            </Paper>
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <Paper sx={{ p: 2, backgroundColor: '#fee2e2' }}>
                                <Typography variant="body2" sx={{ color: '#6b7280' }}>Overdue</Typography>
                                <Typography variant="h4" sx={{ fontWeight: 700, color: '#ef4444' }}>
                                    {stats.overdue}
                                </Typography>
                            </Paper>
                        </Grid>
                    </Grid>
                )}

                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                        <CircularProgress />
                    </Box>
                ) : (
                    <TaskKanban
                        tasks={tasks}
                        onDragEnd={handleDragEnd}
                        onTaskClick={handleTaskClick}
                        onAddTask={handleAddTask}
                    />
                )}

                <AddTaskModal
                    open={addModalOpen}
                    onClose={() => setAddModalOpen(false)}
                    onTaskAdded={handleTaskAdded}
                    initialStatus={initialStatus}
                />

                <EditTaskModal
                    open={editModalOpen}
                    onClose={() => setEditModalOpen(false)}
                    task={selectedTask}
                    onTaskUpdated={handleTaskAdded}
                />
            </Box>
        </Layout>
    );
}

export default TaskPage;
