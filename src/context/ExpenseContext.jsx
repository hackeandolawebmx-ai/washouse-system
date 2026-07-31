import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useApp } from './AppContext';
import { supabase } from '../lib/supabase';

const ExpenseContext = createContext();

const mapExpense = (e) => ({
    id: e.id,
    branchId: e.branch_id,
    amount: e.amount,
    description: e.description,
    category: e.category,
    user: e.user_name,
    timestamp: e.timestamp
});

export function ExpenseProvider({ children }) {
    const { logActivity } = useApp();

    const [expenses, setExpenses] = useState([]);

    useEffect(() => {
        const fetchExpenses = async () => {
            const { data, error } = await supabase
                .from('expenses')
                .select('*')
                .order('timestamp', { ascending: false });
            if (error) {
                console.error('Error fetching expenses:', error);
                return;
            }
            setExpenses((data || []).map(mapExpense));
        };
        fetchExpenses();
    }, []);

    const addExpense = useCallback(async (expenseData, user = 'Host') => {
        const newExpense = {
            id: `EXP-${Date.now()}`,
            timestamp: new Date().toISOString(),
            ...expenseData
        };

        // Optimistic UI update
        setExpenses(prev => [newExpense, ...prev]);

        const { error } = await supabase.from('expenses').insert([{
            id: newExpense.id,
            branch_id: newExpense.branchId,
            amount: newExpense.amount,
            description: newExpense.description,
            category: newExpense.category,
            user_name: user,
            timestamp: newExpense.timestamp
        }]);

        if (error) {
            console.error('Error saving expense remotely:', error);
        }

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
