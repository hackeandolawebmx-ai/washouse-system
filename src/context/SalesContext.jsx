import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useApp } from './AppContext';
import initialDB from '../data/initialState.json';

const SalesContext = createContext();

export function SalesProvider({ children }) {
    const { CURRENT_SYSTEM_VERSION } = useApp();

    const getFromStorage = (key, defaultValue) => {
        const savedVersion = localStorage.getItem('washouse_system_version');
        if (savedVersion !== CURRENT_SYSTEM_VERSION) return defaultValue;
        const saved = localStorage.getItem(key);
        return saved ? JSON.parse(saved) : defaultValue;
    };

    const [sales, setSales] = useState(() => {
        return getFromStorage('washouse_sales', initialDB.sales || []);
    });

    const [shifts, setShifts] = useState(() => {
        return getFromStorage('washouse_shifts', initialDB.shifts || []);
    });

    useEffect(() => {
        localStorage.setItem('washouse_sales', JSON.stringify(sales));
    }, [sales]);

    useEffect(() => {
        localStorage.setItem('washouse_shifts', JSON.stringify(shifts));
    }, [shifts]);

    const addSale = useCallback((saleData, branchId = 'main') => {
        const newSale = {
            id: Date.now(),
            date: new Date().toISOString(),
            branchId,
            ...saleData
        };
        setSales(prev => [newSale, ...prev]);
        return newSale;
    }, []);

    const addShift = useCallback((shiftData, branchId) => {
        setShifts(prev => [{ ...shiftData, branchId: branchId || 'main' }, ...prev]);
    }, []);

    const value = {
        sales,
        setSales,
        shifts,
        setShifts,
        addSale,
        addShift
    };

    return (
        <SalesContext.Provider value={value}>
            {children}
        </SalesContext.Provider>
    );
}

export const useSales = () => {
    const context = useContext(SalesContext);
    if (!context) throw new Error('useSales must be used within a SalesProvider');
    return context;
};
