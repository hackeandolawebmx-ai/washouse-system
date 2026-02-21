import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import initialDB from '../data/initialState.json';
import { isLicenseValid, BRANCH_LICENSES } from '../data/licenses';

const AppContext = createContext();

const INITIAL_BRANCHES = initialDB.branches || [
    {
        id: 'main',
        name: 'Sucursal Principal',
        address: 'Calle Principal 123',
        waterCostPerCycle: 15,
        electricityCostPerCycle: 20,
        gasCostPerCycle: 30
    }
];

const CURRENT_SYSTEM_VERSION = '2026_02_18_STAFF_v2';

export function AppProvider({ children }) {
    // Helper to check version before reading storage
    const getFromStorage = (key, defaultValue) => {
        const savedVersion = localStorage.getItem('washouse_system_version');
        if (savedVersion !== CURRENT_SYSTEM_VERSION) return defaultValue;
        const saved = localStorage.getItem(key);
        return saved ? JSON.parse(saved) : defaultValue;
    };

    const [deviceBranchId, setDeviceBranchId] = useState(() => {
        return localStorage.getItem('washouse_device_branch') || 'main';
    });

    const [selectedBranch, setSelectedBranch] = useState(() => {
        return localStorage.getItem('washouse_admin_branch_filter') || 'all';
    });

    const [branches, setBranches] = useState(() => {
        return getFromStorage('washouse_branches', INITIAL_BRANCHES);
    });

    const [staff, setStaff] = useState(() => {
        const defaultStaff = [
            { id: 'admin_master', name: 'Admin Principal', role: 'admin', pin: '1234', branchId: 'all' },
            { id: 'carlos_host', name: 'Carlos', role: 'host', pin: '0000', branchId: 'all' }
        ];
        return getFromStorage('washouse_staff', defaultStaff);
    });

    const [activityLogs, setActivityLogs] = useState(() => {
        return getFromStorage('washouse_logs', initialDB.activityLogs || []);
    });

    // Sync state to LocalStorage
    useEffect(() => {
        localStorage.setItem('washouse_admin_branch_filter', selectedBranch);
    }, [selectedBranch]);

    useEffect(() => {
        localStorage.setItem('washouse_branches', JSON.stringify(branches));
    }, [branches]);

    useEffect(() => {
        localStorage.setItem('washouse_staff', JSON.stringify(staff));
    }, [staff]);

    useEffect(() => {
        localStorage.setItem('washouse_logs', JSON.stringify(activityLogs));
    }, [activityLogs]);

    const logActivity = useCallback((action, details, user = 'Sistema', branchId = 'main') => {
        const newLog = {
            id: Date.now(),
            timestamp: new Date().toISOString(),
            action,
            details,
            user,
            branchId
        };
        setActivityLogs(prev => [newLog, ...prev]);
    }, []);

    const setDeviceBranch = useCallback((branchId) => {
        setDeviceBranchId(branchId);
        localStorage.setItem('washouse_device_branch', branchId);
    }, []);

    const value = {
        deviceBranchId,
        setDeviceBranch,
        selectedBranch,
        setSelectedBranch,
        branches,
        setBranches,
        staff,
        setStaff,
        activityLogs,
        logActivity,
        CURRENT_SYSTEM_VERSION,
        addBranch: (branchData) => {
            const newBranch = {
                ...branchData,
                id: branchData.name.toLowerCase().replace(/\s+/g, '_')
            };
            setBranches(prev => [...prev, newBranch]);
            return newBranch;
        },
        isBranchActive: (branchId) => {
            return isLicenseValid(branchId);
        },
        BRANCH_LICENSES,
        updateBranch: (id, updates) => {
            setBranches(prev => prev.map(b => b.id === id ? { ...b, ...updates } : b));
        },
        deleteBranch: (branchId) => {
            if (branchId === 'main') {
                alert('No se puede eliminar la sucursal principal');
                return;
            }
            setBranches(prev => prev.filter(b => b.id !== branchId));
        },
        addStaffMember: (data) => {
            const newMember = { ...data, id: Date.now().toString() };
            setStaff(prev => [...prev, newMember]);
            logActivity('PERSONAL_AGREGADO', `Empleado: ${data.name} (${data.role})`);
            return newMember;
        },
        updateStaffMember: (id, updates) => {
            setStaff(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
            logActivity('PERSONAL_ACTUALIZADO', `ID: ${id}`);
        },
        deleteStaffMember: (id) => {
            const member = staff.find(s => s.id === id);
            if (member?.role === 'admin' && staff.filter(s => s.role === 'admin').length <= 1) {
                alert('No se puede eliminar al último administrador');
                return;
            }
            setStaff(prev => prev.filter(s => s.id !== id));
            logActivity('PERSONAL_ELIMINADO', `Empleado: ${member?.name}`);
        },
        deleteStaffMembers: (ids) => {
            const membersToDelete = staff.filter(s => ids.includes(s.id));
            const adminCount = staff.filter(s => s.role === 'admin').length;
            const adminsToDeleteCount = membersToDelete.filter(s => s.role === 'admin').length;

            if (adminCount - adminsToDeleteCount <= 0) {
                alert('No se puede eliminar a todos los administradores. Debe quedar al menos uno.');
                return;
            }

            setStaff(prev => prev.filter(s => !ids.includes(s.id)));
            logActivity('PERSONAL_ELIMINADO_MASIVO', `${ids.length} empleados eliminados: ${membersToDelete.map(m => m.name).join(', ')}`);
        }
    };

    return (
        <AppContext.Provider value={value}>
            {children}
        </AppContext.Provider>
    );
}

export const useApp = () => {
    const context = useContext(AppContext);
    if (!context) throw new Error('useApp must be used within an AppProvider');
    return context;
};
