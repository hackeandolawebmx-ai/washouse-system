import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useApp } from './AppContext';
import initialDB from '../data/initialState.json';

const EquipmentContext = createContext();

const INITIAL_MACHINES = initialDB.machines || [];

export function EquipmentProvider({ children }) {
    const { CURRENT_SYSTEM_VERSION } = useApp();

    const getFromStorage = (key, defaultValue) => {
        const savedVersion = localStorage.getItem('washouse_system_version');
        if (savedVersion !== CURRENT_SYSTEM_VERSION) return defaultValue;
        const saved = localStorage.getItem(key);
        return saved ? JSON.parse(saved) : defaultValue;
    };

    const [machines, setMachines] = useState(() => {
        const data = getFromStorage('washouse_machines', INITIAL_MACHINES);
        return data.map(m => ({ ...m, branchId: m.branchId || 'main' }));
    });

    useEffect(() => {
        localStorage.setItem('washouse_machines', JSON.stringify(machines));
    }, [machines]);

    const updateMachine = useCallback((machineId, updates) => {
        setMachines(prev => prev.map(m =>
            m.id === machineId ? { ...m, ...updates } : m
        ));
    }, []);

    // Live Timer Update Logic
    useEffect(() => {
        const interval = setInterval(() => {
            setMachines(prevMachines => {
                let hasChanges = false;
                const nextMachines = prevMachines.map(m => {
                    if (m.status === 'running' && m.timeLeft > 0) {
                        hasChanges = true;
                        const newTime = m.timeLeft - 1;
                        if (newTime <= 0) {
                            return { ...m, timeLeft: 0, status: 'finished' };
                        }
                        return { ...m, timeLeft: newTime };
                    }
                    return m;
                });
                return hasChanges ? nextMachines : prevMachines;
            });
        }, 60000);

        return () => clearInterval(interval);
    }, []);

    const value = {
        machines,
        setMachines,
        updateMachine
    };

    return (
        <EquipmentContext.Provider value={value}>
            {children}
        </EquipmentContext.Provider>
    );
}

export const useEquipment = () => {
    const context = useContext(EquipmentContext);
    if (!context) throw new Error('useEquipment must be used within an EquipmentProvider');
    return context;
};
