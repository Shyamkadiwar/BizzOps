import React from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { Box, Typography, Paper, Chip } from '@mui/material';
import DealCard from './DealCard';

const DealsPipeline = ({ deals, onDragEnd, onDealClick }) => {
    const columns = ['New', 'Prospect', 'Proposal', 'Won'];

    const getColumnTotal = (status) => {
        if (!deals.groupedDeals || !deals.groupedDeals[status]) return 0;
        return deals.groupedDeals[status].reduce((sum, deal) => sum + (deal.value || 0), 0);
    };

    const getColumnDeals = (status) => {
        if (!deals.groupedDeals || !deals.groupedDeals[status]) return [];
        return deals.groupedDeals[status];
    };

    return (
        <DragDropContext onDragEnd={onDragEnd}>
            <Box sx={{ display: 'flex', gap: 2, overflowX: 'auto', pb: 2 }}>
                {columns.map((column) => (
                    <Paper
                        key={column}
                        className="flex-1 min-w-[300px] bg-white/60 backdrop-blur-md border border-white/50 rounded-2xl p-4 shadow-sm"
                    >
                        <Box sx={{ mb: 2 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                <Chip
                                    label={column}
                                    size="small"
                                    sx={{
                                        backgroundColor:
                                            column === 'New' ? '#9333ea' :
                                                column === 'Prospect' ? '#06b6d4' :
                                                    column === 'Proposal' ? '#3b82f6' :
                                                        '#10b981',
                                        color: 'white',
                                        fontWeight: 600
                                    }}
                                />
                                <Chip
                                    label={getColumnDeals(column).length}
                                    size="small"
                                    sx={{ backgroundColor: 'white' }}
                                />
                            </Box>
                            <Typography variant="h6" sx={{ fontWeight: 700, color: '#1f2937' }}>
                                ₹{getColumnTotal(column).toLocaleString()}
                            </Typography>
                        </Box>

                        <Droppable droppableId={column}>
                            {(provided, snapshot) => (
                                <Box
                                    ref={provided.innerRef}
                                    {...provided.droppableProps}
                                    className={`min-h-[400px] rounded-xl transition-colors duration-200 ${snapshot.isDraggingOver ? 'bg-indigo-50/50' : 'bg-transparent'}`}
                                >
                                    {getColumnDeals(column).map((deal, index) => (
                                        <Draggable
                                            key={deal._id}
                                            draggableId={deal._id}
                                            index={index}
                                        >
                                            {(provided, snapshot) => (
                                                <div
                                                    ref={provided.innerRef}
                                                    {...provided.draggableProps}
                                                    {...provided.dragHandleProps}
                                                >
                                                    <DealCard
                                                        deal={deal}
                                                        onClick={() => onDealClick(deal)}
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

export default DealsPipeline;
