import React, { useState } from 'react';
import { TrendingUp, TrendingDown, Sparkles, Loader2, ChevronUp } from 'lucide-react';
import { LineChart, Line, ResponsiveContainer } from 'recharts';
import axios from 'axios';

const KPICard = ({
    title,
    value,
    subtitle,
    trend,
    trendValue,
    sparklineData = [],
    icon,
    loading = false
}) => {
    const isPositiveTrend = trend === 'up' || trendValue >= 0;
    const chartData = sparklineData.map((val, idx) => ({ value: val, index: idx }));

    const [insightOpen, setInsightOpen] = useState(false);
    const [insightText, setInsightText] = useState('');
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    const token = localStorage.getItem('accessToken');

    const handleAnalyze = async () => {
        // Toggle off if already showing
        if (insightOpen && insightText) {
            setInsightOpen(false);
            return;
        }

        setInsightOpen(true);
        if (insightText) return; // Already fetched — just re-open

        setIsAnalyzing(true);
        try {
            const response = await axios.post(
                `${import.meta.env.VITE_BACKEND_URL}/api/v1/ai/kpi-insight`,
                {
                    metricName: title,
                    historicalData: { currentVal: value, sparklineData }
                },
                {
                    headers: { 'Authorization': `Bearer ${token}` },
                    withCredentials: true
                }
            );
            setInsightText(response.data.data.insight);
        } catch (error) {
            console.error('Error generating insight:', error);
            setInsightText('Failed to generate insight right now. Please try again later.');
        } finally {
            setIsAnalyzing(false);
        }
    };

    if (loading) {
        return (
            <div className="bg-white/70 backdrop-blur-md border border-white/30 rounded-2xl p-6 shadow-lg animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
                <div className="h-8 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/3"></div>
            </div>
        );
    }

    return (
        <div className="bg-white/70 backdrop-blur-md border border-white/30 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 relative overflow-hidden">
            <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-2">
                    {icon && <span className="text-gray-600">{icon}</span>}
                    <h3 className="text-sm font-medium text-gray-600">{title}</h3>
                </div>

                {/* AI Analyze Button — always visible */}
                <button
                    onClick={handleAnalyze}
                    className="flex items-center justify-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full bg-gradient-to-r from-indigo-50 to-blue-50 text-blue-700 hover:from-blue-100 hover:to-indigo-100 border border-blue-200 shadow-sm transition-all hover:scale-105 active:scale-95"
                    title="Generate AI Insight"
                >
                    <Sparkles size={12} className="text-blue-500" />
                    <span>{insightOpen && insightText ? 'Hide' : 'Analyze'}</span>
                </button>
            </div>

            <div className="space-y-3 relative z-10">
                <div className="flex items-end justify-between">
                    <h2 className="text-3xl font-bold text-gray-900">{value}</h2>

                    {(trend || trendValue !== undefined) && (
                        <div className={`flex items-center gap-1 px-2 py-1 rounded-lg text-sm font-medium ${
                            isPositiveTrend ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                        }`}>
                            {isPositiveTrend ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                            <span>{Math.abs(trendValue || 0).toFixed(1)}%</span>
                        </div>
                    )}
                </div>

                {sparklineData.length > 0 && (
                    <div className="h-10 -mx-2">
                        <ResponsiveContainer width="100%" height={40}>
                            <LineChart data={chartData}>
                                <Line
                                    type="monotone"
                                    dataKey="value"
                                    stroke={isPositiveTrend ? '#10B981' : '#EF4444'}
                                    strokeWidth={2}
                                    dot={false}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                )}
            </div>

            {subtitle && <p className="text-xs text-gray-500 mt-3">{subtitle}</p>}

            {/* Insight Expandable Panel */}
            <div className={`mt-4 rounded-xl transition-all duration-300 ease-in-out border border-indigo-100 overflow-hidden ${
                insightOpen ? 'opacity-100 max-h-48 mt-4' : 'opacity-0 max-h-0 mt-0 border-transparent'
            }`}>
                <div className="bg-gradient-to-r from-blue-50/80 to-indigo-50/80 p-3 pt-2 h-full">
                    <div className="flex items-center justify-between mb-1 opacity-70">
                        <div className="flex items-center gap-1 text-xs font-semibold text-indigo-700 uppercase tracking-wider">
                            <Sparkles size={10} /> AI Insight
                        </div>
                        <button
                            onClick={() => setInsightOpen(false)}
                            className="text-gray-400 hover:text-gray-600"
                        >
                            <ChevronUp size={14} />
                        </button>
                    </div>

                    {isAnalyzing ? (
                        <div className="flex items-center gap-2 text-sm text-gray-500 py-3">
                            <Loader2 size={14} className="animate-spin text-indigo-500" />
                            Analyzing trend...
                        </div>
                    ) : (
                        <p className="text-[13px] leading-relaxed text-indigo-900 font-medium whitespace-pre-line">
                            {insightText.replace(/[#*]/g, '').trim()}
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default KPICard;
