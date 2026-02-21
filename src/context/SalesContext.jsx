import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useApp } from './AppContext';
import { SERVICES_CATALOG } from '../data/catalog';
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

    const [services, setServices] = useState(() => {
        const saved = getFromStorage('washouse_services', null);
        if (saved && saved.length > 0) return saved;
        return SERVICES_CATALOG;
    });

    useEffect(() => {
        localStorage.setItem('washouse_sales', JSON.stringify(sales));
    }, [sales]);

    useEffect(() => {
        localStorage.setItem('washouse_shifts', JSON.stringify(shifts));
    }, [shifts]);

    useEffect(() => {
        localStorage.setItem('washouse_services', JSON.stringify(services));
    }, [services]);

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

    const addService = useCallback((service) => {
        const newService = { ...service, id: `svc_${Date.now()}` };
        setServices(prev => [...prev, newService]);
        return newService;
    }, []);

    const updateService = useCallback((id, updates) => {
        setServices(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
    }, []);

    const deleteService = useCallback((id) => {
        setServices(prev => prev.filter(s => s.id !== id));
    }, []);

    const value = {
        sales,
        setSales,
        shifts,
        setShifts,
        services,
        setServices,
        addSale,
        addShift,
        addService,
        updateService,
        deleteService
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
