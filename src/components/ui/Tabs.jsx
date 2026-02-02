import React, { useState } from 'react';

export default function Tabs({ items, defaultTab, className = '' }) {
    const [activeTab, setActiveTab] = useState(defaultTab || 0);

    return (
        <div className={`flex flex-col ${className}`}>
            <div className="flex border-b border-gray-200 mb-6">
                {items.map((item, index) => (
                    <button
                        key={index}
                        onClick={() => setActiveTab(index)}
                        className={`
              px-6 py-3 text-sm font-medium transition-colors border-b-2 
              ${activeTab === index
                                ? 'border-washouse-blue text-washouse-blue'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
            `}
                    >
                        {item.label}
                    </button>
                ))}
            </div>
            <div className="flex-1">
                {items[activeTab].content}
            </div>
        </div>
    );
}
