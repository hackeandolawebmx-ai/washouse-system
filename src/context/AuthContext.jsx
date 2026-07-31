import React, { createContext, useContext, useState, useEffect } from 'react';
import { useStorage } from './StorageContext';
import { formatCurrency } from '../utils/formatCurrency';
import { supabase } from '../lib/supabase';

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

    const { addShift, logActivity, deviceBranchId, staff, isBranchActive } = useStorage();
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
            }, currentShift.branchId);

            logActivity('TURNO_CERRADO', `Ventas: ${formatCurrency(summary.totalSales)}`, user?.name, currentShift.branchId);
        }
        localStorage.removeItem(SHIFT_STORAGE_KEY);
        localStorage.removeItem(USER_STORAGE_KEY);
        sessionStorage.removeItem('washouse_admin');
        setCurrentShift(null);
        setUser(null);
        setAdminUser(false);
    };

    const [adminUser, setAdminUser] = useState(() => {
        return sessionStorage.getItem('washouse_admin') ? true : false;
    });

    const loginAdmin = async (pin) => {
        // PIN is verified server-side via RPC; the plaintext PIN never gets
        // compared against staff data held in the browser.
        const { data, error } = await supabase.rpc('verify_pin', { p_pin: pin, p_branch_id: null });
        if (error) {
            console.error('Error verifying admin PIN:', error);
            return false;
        }
        const adminFound = data?.find(s => s.role === 'admin');
        if (adminFound) {
            setAdminUser(true);
            sessionStorage.setItem('washouse_admin', 'true');
            logActivity('ADMIN_LOGIN', `Acceso Administrador: ${adminFound.name}`, adminFound.name);
            return true;
        }
        return false;
    };


    const loginHost = async (pin) => {
        // Check if branch is active/paid before even hitting the network.
        if (!isBranchActive(deviceBranchId)) {
            return { success: false, error: 'Esta sucursal se encuentra temporalmente suspendida por falta de pago. Contacte al administrador.' };
        }

        const { data, error } = await supabase.rpc('verify_pin', { p_pin: pin, p_branch_id: deviceBranchId });
        if (error) {
            console.error('Error verifying host PIN:', error);
            return { success: false, error: 'Error de conexión al verificar el PIN.' };
        }

        const staffFound = data?.[0];
        if (staffFound) {
            return { success: true, userData: { id: staffFound.id, name: staffFound.name, role: staffFound.role, branchId: staffFound.branch_id } };
        }
        return { success: false, error: 'PIN incorrecto.' };
    };

    const logout = () => {
        // Only allow logout if shift is closed or by admin override
        setUser(null);
        setAdminUser(false);
        sessionStorage.removeItem('washouse_admin');
    };

    const value = React.useMemo(() => ({
        user,
        currentShift,
        startShift,
        endShift,
        loginAdmin,
        loginHost,
        logout,
        isAuthenticated: !!user,
        isAdmin: !!adminUser,
        isShiftOpen: !!currentShift,
        staff // Expose staff for management UI
    }), [user, currentShift, adminUser, staff, loginHost]);

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}
