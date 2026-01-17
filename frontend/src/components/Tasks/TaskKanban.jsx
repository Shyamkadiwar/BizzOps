import React from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { Box, Typography, Paper, Chip, IconButton } from '@mui/material';
import { Add } from '@mui/icons-material';
import TaskCard from './TaskCard';

const TaskKanban = ({ tasks, onDragEnd, onTaskClick, onAddTask }) => {
    const columns = ['Not Started', 'In Progress', 'Waiting', 'Done'];

    const getColumnColor = (status) => {
        switch (status) {
            case 'Not Started': return '#6b7280';
            case 'In Progress': return '#3b82f6';
            case 'Waiting': return '#f59e0b';
            case 'Done': return '#10b981';
            default: return '#6b7280';
        }
    };

    const getColumnTasks = (status) => {
        if (!tasks.groupedTasks || !tasks.groupedTasks[status]) return [];
        return tasks.groupedTasks[status];
    };

    return (
        <DragDropContext onDragEnd={onDragEnd}>
            <Box sx={{ display: 'flex', gap: 2, overflowX: 'auto', pb: 2 }}>
                {columns.map((column) => (
                    <Paper
                        key={column}
                        sx={{
                            minWidth: 320,
                            flex: 1,
                            backgroundColor: '#f9fafb',
                            p: 2,
                            borderRadius: 2
                        }}
                    >
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                                    {column}
                                </Typography>
                                <Chip
                                    label={getColumnTasks(column).length}
                                    size="small"
                                    sx={{
                                        backgroundColor: getColumnColor(column),
                                        color: 'white',
                                        fontWeight: 600,
                                        minWidth: 28
                                    }}
                                />
                            </Box>
                            <IconButton size="small" onClick={() => onAddTask(column)}>
                                <Add fontSize="small" />
                            </IconButton>
                        </Box>

                        <Droppable droppableId={column}>
                            {(provided, snapshot) => (
                                <Box
                                    ref={provided.innerRef}
                                    {...provided.droppableProps}
                                    sx={{
                                        minHeight: 500,
                                        backgroundColor: snapshot.isDraggingOver ? '#e5e7eb' : 'transparent',
                                        borderRadius: 1,
                                        transition: 'background-color 0.2s'
                                    }}
                                >
                                    {getColumnTasks(column).map((task, index) => (
                                        <Draggable
                                            key={task._id}
                                            draggableId={task._id}
                                            index={index}
                                        >
                                            {(provided, snapshot) => (
                                                <div
                                                    ref={provided.innerRef}
                                                    {...provided.draggableProps}
                                                    {...provided.dragHandleProps}
                                                >
                                                    <TaskCard
                                                        task={task}
                                                        onClick={() => onTaskClick(task)}
                                                        isDragging={snapshot.isDragging}
                                                    />
                                                </div>
                                            )}
                                        </Draggable>
                                    ))}
                                    {provided.placeholder}
                                </Box>
                            )}
                        </Droppable>
                    </Paper>
                ))}
            </Box>
        </DragDropContext>
    );
};

export default TaskKanban;
