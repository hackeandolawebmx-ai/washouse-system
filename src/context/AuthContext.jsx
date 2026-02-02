import React, { createContext, useContext, useState, useEffect } from 'react';
import { useStorage } from './StorageContext';
import { formatCurrency } from '../utils/formatCurrency';

const AuthContext = createContext();

export function useAuth() {
    return useContext(AuthContext);
}

const SHIFT_STORAGE_KEY = 'washouse_shift';
const USER_STORAGE_KEY = 'washouse_user';

export function AuthProvider({ children }) {
    const [user, setUser] = useState(() => {
        const saved = localStorage.getItem(USER_STORAGE_KEY);
        return saved ? JSON.parse(saved) : null;
    });

    const [currentShift, setCurrentShift] = useState(() => {
        const saved = localStorage.getItem(SHIFT_STORAGE_KEY);
        return saved ? JSON.parse(saved) : null;
    });

    // Persist changes
    useEffect(() => {
        if (user) {
            localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
        } else {
            localStorage.removeItem(USER_STORAGE_KEY);
        }
    }, [user]);

    useEffect(() => {
        if (currentShift) {
            localStorage.setItem(SHIFT_STORAGE_KEY, JSON.stringify(currentShift));
        } else {
            localStorage.removeItem(SHIFT_STORAGE_KEY);
        }
    }, [currentShift]);

    const { addShift, logActivity, deviceBranchId } = useStorage();
    useEffect(() => {
        // console.log('AuthProvider mounted');
    }, []);

    const startShift = (userData, initialCash) => {
        const branchId = deviceBranchId || 'main';
        const shiftData = {
            id: Date.now(),
            branchId,
            startTime: new Date().toISOString(),
            sales: 0,
            initialCash: parseFloat(initialCash),
            status: 'open'
        };
        setUser(userData);
        setCurrentShift(shiftData);
        logActivity('TURNO_INICIADO', `Fondo: ${formatCurrency(initialCash)} (${branchId})`, userData.name, branchId);
    };

    const endShift = (summary) => {
        if (summary) {
            addShift({
                ...summary,
                endedAt: new Date().toISOString(),
                closedBy: user?.name,
                id: currentShift.id
            }, currentShift.branchId); // Ensure we pass the shift's branch ID

            logActivity('TURNO_CERRADO', `Ventas: ${formatCurrency(summary.totalSales)}`, user?.name, currentShift.branchId);
        }
        setCurrentShift(null);
        setUser(null);
    };

    const [adminUser, setAdminUser] = useState(() => {
        return sessionStorage.getItem('washouse_admin') ? true : false;
    });

    const loginAdmin = (password) => {
        // Simple generic PIN for MVP
        if (password === '1234') {
            setAdminUser(true);
            sessionStorage.setItem('washouse_admin', 'true');
            return true;
        }
        return false;
    };

    const logout = () => {
        // Only allow logout if shift is closed or by admin override
        setUser(null);
        setAdminUser(false);
        sessionStorage.removeItem('washouse_admin');
    };

    const value = {
        user,
        currentShift,
        startShift,
        endShift,
        loginAdmin,
        isAuthenticated: !!user,
        isAdmin: !!adminUser,
        isShiftOpen: !!currentShift
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}
