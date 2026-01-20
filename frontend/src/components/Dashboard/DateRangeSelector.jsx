import React, { useState } from 'react';
import { Calendar, ChevronDown } from 'lucide-react';

const DateRangeSelector = ({ value = 'month', onChange }) => {
    const [isOpen, setIsOpen] = useState(false);

    const presets = [
        { label: 'Today', value: 'today' },
        { label: 'This Week', value: 'week' },
        { label: 'This Month', value: 'month' },
        { label: 'This Quarter', value: 'quarter' },
        { label: 'This Year', value: 'year' },
        { label: 'All Time', value: 'alltime' }
    ];

    const selectedLabel = presets.find(p => p.value === value)?.label || 'This Month';

    const handleSelect = (preset) => {
        onChange(preset.value);
        setIsOpen(false);
    };

    return (
        <div className="relative">
            <button
                className="flex items-center gap-2 px-4 py-2 bg-white/70 backdrop-blur-md border border-white/30 rounded-xl shadow-md hover:shadow-lg transition-all duration-200 text-sm font-medium text-gray-700"
                onClick={() => setIsOpen(!isOpen)}
            >
                <Calendar size={16} />
                <span>{selectedLabel}</span>
                <ChevronDown
                    size={16}
                    className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                />
            </button>

            {isOpen && (
                <>
                    <div
                        className="fixed inset-0 z-10"
                        onClick={() => setIsOpen(false)}
                    />
                    <div className="absolute right-0 mt-2 w-48 bg-white/95 backdrop-blur-md border border-white/30 rounded-xl shadow-xl z-20 overflow-hidden">
                        {presets.map((preset) => (
                            <button
                                key={preset.value}
                                className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${value === preset.value
                                        ? 'bg-blue-50 text-blue-700 font-medium'
                                        : 'text-gray-700 hover:bg-gray-50'
                                    }`}
                                onClick={() => handleSelect(preset)}
                            >
                                {preset.label}
                            </button>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
};

export default DateRangeSelector;
