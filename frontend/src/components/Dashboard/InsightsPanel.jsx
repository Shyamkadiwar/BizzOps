import React from 'react';
import { Lightbulb, TrendingUp, AlertTriangle, RefreshCw } from 'lucide-react';

const InsightsPanel = ({ insights = [], onRefresh, loading = false }) => {
    const defaultInsights = [
        {
            type: 'success',
            priority: 'high',
            title: 'Strong Sales Performance',
            description: 'Sales are up 15% compared to last month. Keep up the momentum!',
            icon: <TrendingUp size={20} />
        },
        {
            type: 'warning',
            priority: 'medium',
            title: 'Low Stock Alert',
            description: '5 products are running low on stock. Consider reordering soon.',
            icon: <AlertTriangle size={20} />
        },
        {
            type: 'info',
            priority: 'low',
            title: 'Customer Engagement',
            description: 'Customer retention rate is at 85%. Focus on maintaining relationships.',
            icon: <Lightbulb size={20} />
        }
    ];

    const displayInsights = insights.length > 0 ? insights : defaultInsights;

    const getPriorityColor = (priority) => {
        switch (priority) {
            case 'high':
                return 'bg-red-100 text-red-700';
            case 'medium':
                return 'bg-amber-100 text-amber-700';
            case 'low':
                return 'bg-blue-100 text-blue-700';
            default:
                return 'bg-gray-100 text-gray-700';
        }
    };

    const getTypeColor = (type) => {
        switch (type) {
            case 'success':
                return { bg: 'bg-green-50', text: 'text-green-600' };
            case 'warning':
                return { bg: 'bg-amber-50', text: 'text-amber-600' };
            case 'error':
                return { bg: 'bg-red-50', text: 'text-red-600' };
            default:
                return { bg: 'bg-blue-50', text: 'text-blue-600' };
        }
    };

    if (loading) {
        return (
            <div className="bg-white/70 backdrop-blur-md border border-white/30 rounded-2xl p-6 shadow-lg animate-pulse">
                <div className="h-5 bg-gray-200 rounded w-1/3 mb-4"></div>
                <div className="space-y-3">
                    <div className="h-16 bg-gray-200 rounded"></div>
                    <div className="h-16 bg-gray-200 rounded"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white/70 backdrop-blur-md border border-white/30 rounded-2xl p-6 shadow-lg">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                    <Lightbulb size={20} className="text-amber-500" />
                    AI-Powered Insights
                </h3>
                {onRefresh && (
                    <button
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        onClick={onRefresh}
                    >
                        <RefreshCw size={16} className="text-gray-600" />
                    </button>
                )}
            </div>

            <div className="space-y-3">
                {displayInsights.map((insight, index) => {
                    const typeColors = getTypeColor(insight.type);
                    return (
                        <div key={index} className="flex gap-3 p-3 rounded-xl bg-gray-50/50 hover:bg-gray-100/50 transition-colors">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${typeColors.bg} ${typeColors.text}`}>
                                {insight.icon}
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
        </div>
    );
};

export default InsightsPanel;
