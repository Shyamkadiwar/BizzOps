import React, { useState, useEffect } from "react";
import Layout from "../components/Layout";
import { CircularProgress } from "@mui/material";
import { Plus, ListTodo, Clock, CheckCircle, AlertTriangle } from "lucide-react";
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
        }
    };

    const statCards = stats ? [
        { icon: <ListTodo size={20} />, label: 'Total Tasks', value: stats.total, color: '#3B82F6' },
        { icon: <Clock size={20} />, label: 'In Progress', value: stats.byStatus['In Progress'], color: '#F59E0B' },
        { icon: <CheckCircle size={20} />, label: 'Completed', value: stats.byStatus.Done, color: '#10B981' },
        { icon: <AlertTriangle size={20} />, label: 'Overdue', value: stats.overdue, color: '#EF4444' },
    ] : [];

    return (
        <Layout>
            <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-gray-100 p-6">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">My Tasks</h1>
                        <p className="text-sm text-gray-600">Manage and track your tasks</p>
                    </div>
                    <button
                        onClick={() => handleAddTask('Not Started')}
                        className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-xl font-medium transition-colors"
                    >
                        <Plus size={18} /> Add Task
                    </button>
                </div>

                {stats && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                        {statCards.map((card, idx) => (
                            <div key={idx} className="bg-white/70 backdrop-blur-md border border-white/30 rounded-xl p-4 shadow-md hover:shadow-lg transition-all duration-200">
                                <div className="flex items-center gap-3">
                                    <div
                                        className="w-10 h-10 rounded-lg flex items-center justify-center"
                                        style={{ backgroundColor: `${card.color}20`, color: card.color }}
                                    >
                                        {card.icon}
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-xs text-gray-600 mb-1">{card.label}</p>
                                        <h3 className="text-xl font-bold text-gray-900">{card.value}</h3>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {loading ? (
                    <div className="flex justify-center py-16">
                        <CircularProgress />
                    </div>
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
            </div>
        </Layout>
    );
}

export default TaskPage;
