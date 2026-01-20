import React from 'react';

const ChartCard = ({ title, children, className = '' }) => {
    return (
        <div className={`bg-white/70 backdrop-blur-md border border-white/30 rounded-2xl p-6 shadow-lg ${className}`}>
            {title && <h3 className="text-lg font-semibold text-gray-800 mb-4">{title}</h3>}
            <div className="w-full">
                {children}
            </div>
        </div>
    );
};

export default ChartCard;
