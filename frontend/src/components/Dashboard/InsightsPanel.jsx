import React, { useState, useEffect } from 'react';
import { Lightbulb, TrendingUp, AlertTriangle, RefreshCw, Loader2, Sparkles } from 'lucide-react';
import axios from 'axios';

const InsightsPanel = ({ businessSnapshot, loading: parentLoading = false }) => {
    const [insights, setInsights] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [hasFetched, setHasFetched] = useState(false);

    const token = localStorage.getItem('accessToken');

    const fetchInsights = async () => {
        if (!businessSnapshot) return;
        setIsLoading(true);
        setError('');
        try {
            const res = await axios.post(
                `${import.meta.env.VITE_BACKEND_URL}/api/v1/ai/dashboard-insights`,
                { businessData: businessSnapshot },
                { headers: { Authorization: `Bearer ${token}` }, withCredentials: true }
            );
            setInsights(res.data?.data?.insights || []);
            setHasFetched(true);
        } catch (err) {
            console.error('[InsightsPanel] Error:', err);
            setError('Could not generate insights right now.');
        } finally {
            setIsLoading(false);
        }
    };

    // Auto-fetch once parent data is ready
    useEffect(() => {
        if (businessSnapshot && !hasFetched && !parentLoading) {
            fetchInsights();
        }
    }, [businessSnapshot, parentLoading]);

    const getTypeColor = (type) => {
        switch (type) {
            case 'success': return { bg: 'bg-green-50', text: 'text-green-600', icon: <TrendingUp size={18} /> };
            case 'warning': return { bg: 'bg-amber-50', text: 'text-amber-600', icon: <AlertTriangle size={18} /> };
            case 'error':   return { bg: 'bg-red-50',   text: 'text-red-600',   icon: <AlertTriangle size={18} /> };
            default:        return { bg: 'bg-blue-50',  text: 'text-blue-600',  icon: <Lightbulb size={18} /> };
        }
    };

    const getPriorityColor = (priority) => {
        switch (priority) {
            case 'high':   return 'bg-red-100 text-red-700';
            case 'medium': return 'bg-amber-100 text-amber-700';
            default:       return 'bg-blue-100 text-blue-700';
        }
    };

    if (parentLoading) {
        return (
            <div className="bg-white/70 backdrop-blur-md  rounded-2xl p-6 shadow-lg animate-pulse">
                <div className="h-5 bg-gray-200 rounded w-1/3 mb-4"></div>
                <div className="space-y-3">
                    <div className="h-16 bg-gray-200 rounded"></div>
                    <div className="h-16 bg-gray-200 rounded"></div>
                    <div className="h-16 bg-gray-200 rounded"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white/70 backdrop-blur-md  rounded-2xl p-6 shadow-lg">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                    <Sparkles size={18} className="text-indigo-500" />
                    AI-Powered Insights
                </h3>
                <button
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    onClick={fetchInsights}
                    disabled={isLoading}
                    title="Refresh insights"
                >
                    <RefreshCw size={15} className={`text-gray-600 ${isLoading ? 'animate-spin' : ''}`} />
                </button>
            </div>

            {isLoading && (
                <div className="flex flex-col items-center justify-center py-8 gap-3">
                    <Loader2 size={24} className="animate-spin text-indigo-500" />
                    <p className="text-sm text-gray-500">Analyzing your business data...</p>
                </div>
            )}

            {error && !isLoading && (
                <div className="text-sm text-red-500 text-center py-4">{error}</div>
            )}

            {!isLoading && !error && insights.length > 0 && (
                <div className="space-y-3">
                    {insights.map((insight, index) => {
                        const typeColors = getTypeColor(insight.type);
                        return (
                            <div key={index} className="flex gap-3 p-3 rounded-xl bg-gray-50/50 hover:bg-gray-100/50 transition-colors">
                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${typeColors.bg} ${typeColors.text}`}>
                                    {typeColors.icon}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between gap-2 mb-1">
                                        <h4 className="text-sm font-semibold text-gray-900">{insight.title}</h4>
                                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${getPriorityColor(insight.priority)}`}>
                                            {insight.priority}
                                        </span>
                                    </div>
                                    <p className="text-xs text-gray-600 leading-relaxed">{insight.description}</p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {!isLoading && !error && insights.length === 0 && hasFetched && (
                <p className="text-sm text-gray-400 text-center py-6">No insights available yet. Add more business data to get started.</p>
            )}
        </div>
    );
};

export default InsightsPanel;
