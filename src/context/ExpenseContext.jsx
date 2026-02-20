import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useApp } from './AppContext';
import initialDB from '../data/initialState.json';

const ExpenseContext = createContext();

export function ExpenseProvider({ children }) {
    const { CURRENT_SYSTEM_VERSION, logActivity } = useApp();

    const getFromStorage = (key, defaultValue) => {
        const savedVersion = localStorage.getItem('washouse_system_version');
        if (savedVersion !== CURRENT_SYSTEM_VERSION) return defaultValue;
        const saved = localStorage.getItem(key);
        return saved ? JSON.parse(saved) : defaultValue;
    };

    const [expenses, setExpenses] = useState(() => {
        return getFromStorage('washouse_expenses', initialDB.expenses || []);
    });

    useEffect(() => {
        localStorage.setItem('washouse_expenses', JSON.stringify(expenses));
    }, [expenses]);

    const addExpense = useCallback((expenseData, user = 'Host') => {
        const newExpense = {
            id: `EXP-${Date.now()}`,
            timestamp: new Date().toISOString(),
            ...expenseData
        };
        setExpenses(prev => [newExpense, ...prev]);
        logActivity('GASTO_REGISTRADO', `Gasto: $${expenseData.amount} - ${expenseData.description}`, user, expenseData.branchId);
        return newExpense;
    }, [logActivity]);

    const value = {
        expenses,
        setExpenses,
        addExpense
    };

    return (
        <ExpenseContext.Provider value={value}>
            {children}
        </ExpenseContext.Provider>
    );
}

export const useExpenses = () => {
    const context = useContext(ExpenseContext);
    if (!context) throw new Error('useExpenses must be used within an ExpenseProvider');
    return context;
};
