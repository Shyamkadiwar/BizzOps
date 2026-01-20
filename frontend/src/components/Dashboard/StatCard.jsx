import React from 'react';

const StatCard = ({ title, value, icon, color = "#3B82F6", loading = false }) => {
    if (loading) {
        return (
            <div className="bg-white/70 backdrop-blur-md border border-white/30 rounded-xl p-4 shadow-md animate-pulse">
                <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-6 bg-gray-200 rounded w-3/4"></div>
            </div>
        );
    }

    return (
        <div className="bg-white/70 backdrop-blur-md border border-white/30 rounded-xl p-4 shadow-md hover:shadow-lg transition-all duration-200">
            <div className="flex items-center gap-3">
                <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: `${color}20`, color }}
                >
                    {icon}
                </div>
                <div className="flex-1">
                    <p className="text-xs text-gray-600 mb-1">{title}</p>
                    <h3 className="text-xl font-bold text-gray-900">{value}</h3>
                </div>
            </div>
        </div>
    );
};

export default StatCard;
