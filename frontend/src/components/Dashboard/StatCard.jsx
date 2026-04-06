import React, { useState } from 'react';
import { Sparkles, Loader2, ChevronUp } from 'lucide-react';
import axios from 'axios';

const StatCard = ({ title, value, icon, color = "#3B82F6", loading = false }) => {
    const [insightOpen, setInsightOpen] = useState(false);
    const [insightText, setInsightText] = useState('');
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    const token = localStorage.getItem('accessToken');

    const handleAnalyze = async () => {
        if (insightOpen && insightText) {
            setInsightOpen(false);
            return;
        }
        
        setInsightOpen(true);
        if (insightText) return; 

        setIsAnalyzing(true);
        try {
            const response = await axios.post(
                `${import.meta.env.VITE_BACKEND_URL}/api/v1/ai/kpi-insight`,
                { 
                    metricName: title, 
                    historicalData: { currentVal: value } 
                },
                { 
                    headers: { 'Authorization': `Bearer ${token}` },
                    withCredentials: true 
                }
            );
            setInsightText(response.data.data.insight);
        } catch (error) {
            console.error('Error generating insight:', error);
            setInsightText('Failed to generate insight right now.');
        } finally {
            setIsAnalyzing(false);
        }
    };

    if (loading) {
        return (
            <div className="bg-white/70 backdrop-blur-md  rounded-xl p-4 shadow-md animate-pulse">
                <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-6 bg-gray-200 rounded w-3/4"></div>
            </div>
        );
    }

    return (
        <div className="bg-white/70 backdrop-blur-md  rounded-xl p-4 shadow-md hover:shadow-lg transition-all duration-200 group relative">
            <div className="flex items-center gap-3 relative z-10">
                <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                    style={{ backgroundColor: `${color}20`, color }}
                >
                    {icon}
                </div>
                <div className="flex-1 pr-6">
                    <p className="text-xs text-gray-600 mb-1">{title}</p>
                    <h3 className="text-xl font-bold text-gray-900">{value}</h3>
                </div>
                
                <button 
                  onClick={handleAnalyze}
                  className="absolute right-0 top-1.5 p-1.5 rounded-full bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-200 shadow-sm transition-all opacity-0 group-hover:opacity-100 hover:scale-110"
                  title="Generate Insight"
                >
                    <Sparkles size={14} />
                </button>
            </div>

            {/* Insight Expandable Panel */}
            <div className={`transition-all duration-300 ease-in-out border border-indigo-100 rounded-lg overflow-hidden ${insightOpen ? 'opacity-100 max-h-48 mt-3' : 'opacity-0 max-h-0 mt-0 border-transparent'}`}>
              <div className="bg-gradient-to-r from-blue-50/80 to-indigo-50/80 p-2.5 h-full">
                <div className="flex items-center justify-between mb-1 opacity-70">
                   <div className="flex items-center gap-1 text-[10px] font-semibold text-indigo-700 uppercase tracking-wider">
                     <Sparkles size={10} /> AI Insight
                   </div>
                   <button onClick={() => setInsightOpen(false)} className="text-gray-400 hover:text-gray-600"><ChevronUp size={12}/></button>
                </div>
                
                {isAnalyzing ? (
                   <div className="flex items-center gap-2 text-xs text-gray-500 py-2">
                     <Loader2 size={12} className="animate-spin text-indigo-500" />
                     Analyzing...
                   </div>
                ) : (
                   <p className="text-[12px] leading-relaxed text-indigo-900 font-medium">
                     {insightText}
                   </p>
                )}
              </div>
            </div>
        </div>
    );
};

export default StatCard;
