import React from 'react';
import { LayoutGrid, List } from 'lucide-react';

export default function ViewToggle({ view, onViewChange }) {
    return (
        <div className="flex bg-gray-100 p-1 rounded-lg">
            <button
                onClick={() => onViewChange('grid')}
                className={`p-2 rounded-md transition-all ${view === 'grid'
                        ? 'bg-white text-washouse-blue shadow-sm'
                        : 'text-gray-400 hover:text-gray-600'
                    }`}
                title="Vista Cuadrícula"
            >
                <LayoutGrid size={18} />
            </button>
            <button
                onClick={() => onViewChange('compact')}
                className={`p-2 rounded-md transition-all ${view === 'compact'
                        ? 'bg-white text-washouse-blue shadow-sm'
                        : 'text-gray-400 hover:text-gray-600'
                    }`}
                title="Vista Compacta"
            >
                <List size={18} />
            </button>
        </div>
    );
}
