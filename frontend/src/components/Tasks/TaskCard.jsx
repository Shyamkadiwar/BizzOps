import React from 'react';
import { Card, CardContent, Typography, Box, Chip, LinearProgress, Avatar, AvatarGroup } from '@mui/material';
import { CalendarToday, Comment, AttachFile } from '@mui/icons-material';

const TaskCard = ({ task, onClick, isDragging }) => {
    const formatDate = (dateString) => {
        if (!dateString) return 'No date';
        return new Date(dateString).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    };

    const getPriorityColor = (priority) => {
        switch (priority) {
            case 'Low': return { bg: '#f3f4f6', text: '#6b7280' };
            case 'Medium': return { bg: '#dbeafe', text: '#2563eb' };
            case 'High': return { bg: '#fed7aa', text: '#ea580c' };
            case 'Urgent': return { bg: '#fecaca', text: '#dc2626' };
            default: return { bg: '#f3f4f6', text: '#6b7280' };
        }
    };

    const completedSubtasks = task.subtasks?.filter(st => st.completed).length || 0;
    const totalSubtasks = task.subtasks?.length || 0;
    const progress = totalSubtasks > 0 ? (completedSubtasks / totalSubtasks) * 100 : 0;

    const priorityColor = getPriorityColor(task.priority);

    return (
        <Card
            onClick={onClick}
            sx={{
                mb: 2,
                cursor: 'pointer',
                backgroundColor: isDragging ? '#f3f4f6' : 'white',
                boxShadow: isDragging ? 4 : 1,
                transition: 'all 0.2s',
                '&:hover': {
                    boxShadow: 3,
                    transform: 'translateY(-2px)'
                }
            }}
        >
            <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
                    <CalendarToday sx={{ fontSize: 14, color: '#9ca3af' }} />
                    <Typography variant="caption" sx={{ color: '#9ca3af' }}>
                        {formatDate(task.dueDate)}
                    </Typography>
                </Box>

                <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5, fontSize: '0.95rem' }}>
                    {task.name}
                </Typography>

                {task.description && (
                    <Typography
                        variant="body2"
                        sx={{
                            color: '#6b7280',
                            mb: 1.5,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical'
                        }}
                    >
                        {task.description}
                    </Typography>
                )}

                <Chip
                    label={task.priority}
                    size="small"
                    sx={{
                        backgroundColor: priorityColor.bg,
                        color: priorityColor.text,
                        fontWeight: 600,
                        fontSize: '0.7rem',
                        mb: 1.5
                    }}
                />

                {totalSubtasks > 0 && (
                    <Box sx={{ mb: 1.5 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                            <Typography variant="caption" sx={{ color: '#6b7280' }}>
                                Subtasks
                            </Typography>
                            <Typography variant="caption" sx={{ color: '#6b7280', fontWeight: 600 }}>
                                {completedSubtasks}/{totalSubtasks}
                            </Typography>
                        </Box>
                        <LinearProgress
                            variant="determinate"
                            value={progress}
                            sx={{
                                height: 6,
                                borderRadius: 3,
                                backgroundColor: '#e5e7eb',
                                '& .MuiLinearProgress-bar': {
                                    backgroundColor: '#8b5cf6'
                                }
                            }}
                        />
                    </Box>
                )}

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box sx={{ display: 'flex', gap: 1.5 }}>
                        {task.comments > 0 && (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <Comment sx={{ fontSize: 16, color: '#9ca3af' }} />
                                <Typography variant="caption" sx={{ color: '#6b7280' }}>
                                    {task.comments}
                                </Typography>
                            </Box>
                        )}
                        {task.attachments > 0 && (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <AttachFile sx={{ fontSize: 16, color: '#9ca3af' }} />
                                <Typography variant="caption" sx={{ color: '#6b7280' }}>
                                    {task.attachments}
                                </Typography>
                            </Box>
                        )}
                    </Box>

                    {task.assignedTo && (
                        <Avatar
                            sx={{ width: 28, height: 28, fontSize: '0.75rem', backgroundColor: '#3b82f6' }}
                        >
                            {task.assignedTo.name?.charAt(0).toUpperCase()}
                        </Avatar>
                    )}
                </Box>
            </CardContent>
        </Card>
    );
};

export default TaskCard;
