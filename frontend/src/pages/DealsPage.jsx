import React, { useState, useEffect } from "react";
import Layout from "../components/Layout";
import { CircularProgress } from "@mui/material";
import { Plus, Handshake, Trophy, Clock, DollarSign } from "lucide-react";
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
        }
    };

    const statCards = stats ? [
        { icon: <Handshake size={20} />, label: 'Total Deals', value: stats.total, color: '#3B82F6' },
        { icon: <Trophy size={20} />, label: 'Won Deals', value: stats.byStatus.Won, color: '#10B981' },
        { icon: <Clock size={20} />, label: 'In Progress', value: stats.byStatus.Prospect + stats.byStatus.Proposal, color: '#F59E0B' },
        { icon: <DollarSign size={20} />, label: 'Total Value', value: `₹${stats.wonValue.toLocaleString()}`, color: '#10B981' },
    ] : [];

    return (
        <Layout>
            <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-gray-100 p-6">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Deals Pipeline</h1>
                        <p className="text-sm text-gray-600">Track and manage your deals</p>
                    </div>
                    <button
                        onClick={() => setAddModalOpen(true)}
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl font-medium transition-colors"
                    >
                        <Plus size={18} /> Create New Deal
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
                    <DealsPipeline
                        deals={deals}
                        onDragEnd={handleDragEnd}
                        onDealClick={handleDealClick}
                    />
                )}

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
            </div>
        </Layout>
    );
}

export default DealsPage;
