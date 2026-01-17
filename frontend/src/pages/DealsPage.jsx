import React, { useState, useEffect } from "react";
import Layout from "../components/Layout";
import { Box, Typography, Button, Paper, Grid, CircularProgress } from "@mui/material";
import { Add } from "@mui/icons-material";
import DealsPipeline from "../components/Deals/DealsPipeline";
import AddDealModal from "../components/Deals/AddDealModal";
import DealDetailsModal from "../components/Deals/DealDetailsModal";
import EditDealModal from "../components/Deals/EditDealModal";
import axios from "axios";

function DealsPage() {
    const [deals, setDeals] = useState({ deals: [], groupedDeals: {}, statusTotals: {} });
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [addModalOpen, setAddModalOpen] = useState(false);
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [detailsModalOpen, setDetailsModalOpen] = useState(false);
    const [selectedDeal, setSelectedDeal] = useState(null);

    useEffect(() => {
        fetchDeals();
        fetchStats();
    }, []);

    const fetchDeals = async () => {
        try {
            const response = await axios.get(
                `${import.meta.env.VITE_BACKEND_URL}/api/v1/deals/get-deals`,
                { withCredentials: true }
            );
            setDeals(response.data.data);
        } catch (error) {
            console.error('Error fetching deals:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchStats = async () => {
        try {
            const response = await axios.get(
                `${import.meta.env.VITE_BACKEND_URL}/api/v1/deals/stats`,
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
                `${import.meta.env.VITE_BACKEND_URL}/api/v1/deals/${draggableId}/status`,
                { status: newStatus },
                { withCredentials: true }
            );
            fetchDeals();
            fetchStats();
        } catch (error) {
            console.error('Error updating deal status:', error);
            alert('Failed to update deal status');
        }
    };

    const handleDealClick = (deal) => {
        setSelectedDeal(deal);
        setDetailsModalOpen(true);
    };

    const handleDealAdded = () => {
        fetchDeals();
        fetchStats();
    };

    const handleDeleteDeal = async (dealId) => {
        if (!window.confirm('Are you sure you want to delete this deal?')) return;

        try {
            await axios.delete(
                `${import.meta.env.VITE_BACKEND_URL}/api/v1/deals/${dealId}`,
                { withCredentials: true }
            );
            setDetailsModalOpen(false);
            fetchDeals();
            fetchStats();
        } catch (error) {
            console.error('Error deleting deal:', error);
            alert('Failed to delete deal');
        }
    };

    return (
        <Layout>
            <Box sx={{ p: 3 }}>
                {/* Header */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <Typography variant="h4" sx={{ fontWeight: 700 }}>
                        Deals Pipeline
                    </Typography>
                    <Button
                        variant="contained"
                        startIcon={<Add />}
                        onClick={() => setAddModalOpen(true)}
                        sx={{
                            backgroundColor: '#3b82f6',
                            '&:hover': { backgroundColor: '#2563eb' }
                        }}
                    >
                        Create New Deal
                    </Button>
                </Box>

                {/* Statistics */}
                {stats && (
                    <Grid container spacing={2} sx={{ mb: 3 }}>
                        <Grid item xs={12} sm={6} md={3}>
                            <Paper sx={{ p: 2, backgroundColor: '#f0f9ff' }}>
                                <Typography variant="body2" sx={{ color: '#6b7280' }}>Total Deals</Typography>
                                <Typography variant="h4" sx={{ fontWeight: 700, color: '#3b82f6' }}>
                                    {stats.total}
                                </Typography>
                            </Paper>
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <Paper sx={{ p: 2, backgroundColor: '#f0fdf4' }}>
                                <Typography variant="body2" sx={{ color: '#6b7280' }}>Won Deals</Typography>
                                <Typography variant="h4" sx={{ fontWeight: 700, color: '#10b981' }}>
                                    {stats.byStatus.Won}
                                </Typography>
                            </Paper>
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <Paper sx={{ p: 2, backgroundColor: '#fef3c7' }}>
                                <Typography variant="body2" sx={{ color: '#6b7280' }}>In Progress</Typography>
                                <Typography variant="h4" sx={{ fontWeight: 700, color: '#f59e0b' }}>
                                    {stats.byStatus.Prospect + stats.byStatus.Proposal}
                                </Typography>
                            </Paper>
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <Paper sx={{ p: 2, backgroundColor: '#f0fdf4' }}>
                                <Typography variant="body2" sx={{ color: '#6b7280' }}>Total Value</Typography>
                                <Typography variant="h4" sx={{ fontWeight: 700, color: '#10b981' }}>
                                    ₹{stats.wonValue.toLocaleString()}
                                </Typography>
                            </Paper>
                        </Grid>
                    </Grid>
                )}

                {/* Pipeline */}
                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                        <CircularProgress />
                    </Box>
                ) : (
                    <DealsPipeline
                        deals={deals}
                        onDragEnd={handleDragEnd}
                        onDealClick={handleDealClick}
                    />
                )}

                {/* Modals */}
                <AddDealModal
                    open={addModalOpen}
                    onClose={() => setAddModalOpen(false)}
                    onDealAdded={handleDealAdded}
                />

                <EditDealModal
                    open={editModalOpen}
                    onClose={() => setEditModalOpen(false)}
                    deal={selectedDeal}
                    onDealUpdated={handleDealAdded}
                />

                <DealDetailsModal
                    open={detailsModalOpen}
                    onClose={() => setDetailsModalOpen(false)}
                    deal={selectedDeal}
                    onEdit={(deal) => {
                        setSelectedDeal(deal);
                        setDetailsModalOpen(false);
                        setEditModalOpen(true);
                    }}
                    onDelete={handleDeleteDeal}
                />
            </Box>
        </Layout>
    );
}

export default DealsPage;
