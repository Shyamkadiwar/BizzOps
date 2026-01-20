import React, { useState } from 'react';
import { Download, ChevronDown, FileText, Table } from 'lucide-react';

const ExportButton = ({ onExportPDF, onExportExcel }) => {
    const [isOpen, setIsOpen] = useState(false);

    const handleExport = (type) => {
        if (type === 'pdf' && onExportPDF) {
            onExportPDF();
        } else if (type === 'excel' && onExportExcel) {
            onExportExcel();
        }
        setIsOpen(false);
    };

    return (
        <div className="relative">
            <button
                className="flex items-center gap-2 px-4 py-2 bg-white/70 backdrop-blur-md border border-white/30 rounded-xl shadow-md hover:shadow-lg transition-all duration-200 text-sm font-medium text-gray-700"
                onClick={() => setIsOpen(!isOpen)}
            >
                <Download size={16} />
                <span>Export</span>
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
                        <button
                            className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2"
                            onClick={() => handleExport('pdf')}
                        >
                            <FileText size={16} />
                            Export as PDF
                        </button>
                        <button
                            className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2"
                            onClick={() => handleExport('excel')}
                        >
                            <Table size={16} />
                            Export as Excel
                        </button>
                    </div>
                </>
            )}
        </div>
    );
};

export default ExportButton;
