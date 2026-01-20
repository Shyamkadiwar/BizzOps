import React, { useEffect, useState } from 'react';

const HealthScoreGauge = ({ score = 0, status = 'Good', color = '#3B82F6' }) => {
    const [animatedScore, setAnimatedScore] = useState(0);

    useEffect(() => {
        // Animate score on mount
        const timer = setTimeout(() => {
            setAnimatedScore(score);
        }, 100);

        return () => clearTimeout(timer);
    }, [score]);

    // Calculate rotation for the needle (0-180 degrees)
    const rotation = (animatedScore / 100) * 180;

    // Calculate arc path
    const radius = 80;
    const centerX = 100;
    const centerY = 100;

    const createArc = (start, end, color) => {
        const startRad = (start * Math.PI) / 180;
        const endRad = (end * Math.PI) / 180;

        const x1 = centerX + radius * Math.cos(startRad);
        const y1 = centerY + radius * Math.sin(startRad);
        const x2 = centerX + radius * Math.cos(endRad);
        const y2 = centerY + radius * Math.sin(endRad);

        const largeArc = end - start > 180 ? 1 : 0;

        return (
            <path
                d={`M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}`}
                fill="none"
                stroke={color}
                strokeWidth="12"
                strokeLinecap="round"
            />
        );
    };

    return (
        <div className="bg-white/70 backdrop-blur-md border border-white/30 rounded-2xl p-6 shadow-lg flex flex-col items-center">
            <svg width="200" height="120" viewBox="0 0 200 120" className="mb-2">
                {/* Background arc */}
                {createArc(180, 360, '#E5E7EB')}

                {/* Colored arc based on score */}
                {createArc(180, 180 + (animatedScore / 100) * 180, color)}

                {/* Needle */}
                <line
                    x1={centerX}
                    y1={centerY}
                    x2={centerX + (radius - 20) * Math.cos((180 + rotation) * Math.PI / 180)}
                    y2={centerY + (radius - 20) * Math.sin((180 + rotation) * Math.PI / 180)}
                    stroke="#374151"
                    strokeWidth="3"
                    strokeLinecap="round"
                    style={{
                        transformOrigin: `${centerX}px ${centerY}px`,
                        transition: 'all 1s cubic-bezier(0.4, 0, 0.2, 1)'
                    }}
                />

                {/* Center dot */}
                <circle cx={centerX} cy={centerY} r="6" fill="#374151" />
            </svg>

            <div className="text-center">
                <h2 className="text-4xl font-bold mb-1" style={{ color }}>{Math.round(animatedScore)}</h2>
                <p className="text-sm font-medium text-gray-600">{status}</p>
            </div>
        </div>
    );
};

export default HealthScoreGauge;
