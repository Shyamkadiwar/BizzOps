import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { LineChart, Line, ResponsiveContainer } from 'recharts';

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

    // Format sparkline data for recharts
    const chartData = sparklineData.map((val, idx) => ({ value: val, index: idx }));

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
        <div className="bg-white/70 backdrop-blur-md border border-white/30 rounded-2xl p-6 shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
            <div className="flex items-center gap-2 mb-4">
                {icon && <span className="text-gray-600">{icon}</span>}
                <h3 className="text-sm font-medium text-gray-600">{title}</h3>
            </div>

            <div className="space-y-3">
                <div className="flex items-end justify-between">
                    <h2 className="text-3xl font-bold text-gray-900">{value}</h2>

                    {(trend || trendValue !== undefined) && (
                        <div className={`flex items-center gap-1 px-2 py-1 rounded-lg text-sm font-medium ${isPositiveTrend
                                ? 'bg-green-100 text-green-700'
                                : 'bg-red-100 text-red-700'
                            }`}>
                            {isPositiveTrend ? (
                                <TrendingUp size={16} />
                            ) : (
                                <TrendingDown size={16} />
                            )}
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
                                    stroke={isPositiveTrend ? "#10B981" : "#EF4444"}
                                    strokeWidth={2}
                                    dot={false}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                )}
            </div>

            {subtitle && <p className="text-xs text-gray-500 mt-3">{subtitle}</p>}
        </div>
    );
};

export default KPICard;
