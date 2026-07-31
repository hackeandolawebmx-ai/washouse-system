import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import initialDB from '../data/initialState.json';
import { isLicenseValid, BRANCH_LICENSES } from '../data/licenses';
import { supabase } from '../lib/supabase';

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

const CURRENT_SYSTEM_VERSION = '2.0.0';

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

    // Initial Fetch & Migration
    useEffect(() => {
        const checkSchemaVersion = async () => {
            try {
                const { data, error } = await supabase
                    .from('system_config')
                    .select('value')
                    .eq('key', 'schema_version');

                if (error) throw error;

                if (data && data.length > 0) {
                    const remoteVersion = data[0].value.version;
                    if (remoteVersion !== CURRENT_SYSTEM_VERSION) {
                        console.warn(`Schema version mismatch! Local: ${CURRENT_SYSTEM_VERSION}, Remote: ${remoteVersion}`);
                    }
                } else {
                    console.warn('Schema version not found in remote config.');
                }
            } catch (err) {
                console.error('Error checking schema version:', err);
            }
        };

        const syncBranches = async () => {
            try {
                const { data: remoteBranches, error } = await supabase
                    .from('branches')
                    .select('*');

                if (error) throw error;

                if (remoteBranches && remoteBranches.length > 0) {
                    setBranches(remoteBranches.map(b => ({
                        id: b.id,
                        name: b.name,
                        address: b.address,
                        waterCostPerCycle: b.water_cost_per_cycle,
                        electricityCostPerCycle: b.electricity_cost_per_cycle,
                        gasCostPerCycle: b.gas_cost_per_cycle
                    })));
                } else if (branches.length > 0) {
                    // Migrate from local if remote is empty
                    const { error: insertError } = await supabase
                        .from('branches')
                        .upsert(branches.map(b => ({
                            id: b.id,
                            name: b.name,
                            address: b.address,
                            water_cost_per_cycle: b.waterCostPerCycle || 15,
                            electricity_cost_per_cycle: b.electricityCostPerCycle || 20,
                            gas_cost_per_cycle: b.gasCostPerCycle || 30
                        })));
                    if (insertError) console.error('Migration error:', insertError);
                }
            } catch (err) {
                console.error('Error syncing branches:', err);
            }
        };

        checkSchemaVersion();
        syncBranches();
    }, []);

    // Staff now lives exclusively in Supabase (staff table), accessed only via
    // RPC functions (list_staff / upsert_staff / delete_staff). PINs are hashed
    // server-side and never sent to or stored in the client.
    const [staff, setStaff] = useState([]);

    const refreshStaff = useCallback(async () => {
        const { data, error } = await supabase.rpc('list_staff');
        if (error) {
            console.error('Error fetching staff:', error);
            return;
        }
        setStaff((data || []).map(s => ({ id: s.id, name: s.name, role: s.role, branchId: s.branch_id })));
    }, []);

    useEffect(() => {
        refreshStaff();
    }, [refreshStaff]);

    const [activityLogs, setActivityLogs] = useState([]);

    useEffect(() => {
        const fetchLogs = async () => {
            const { data, error } = await supabase
                .from('activity_logs')
                .select('*')
                .order('timestamp', { ascending: false })
                .limit(500);
            if (error) {
                console.error('Error fetching activity logs:', error);
                return;
            }
            setActivityLogs((data || []).map(l => ({
                id: l.id, action: l.action, details: l.details, user: l.user_name, branchId: l.branch_id, timestamp: l.timestamp
            })));
        };
        fetchLogs();
    }, []);

    // Sync state to LocalStorage
    useEffect(() => {
        localStorage.setItem('washouse_system_version', CURRENT_SYSTEM_VERSION);
    }, []);

    useEffect(() => {
        localStorage.setItem('washouse_admin_branch_filter', selectedBranch);
    }, [selectedBranch]);

    useEffect(() => {
        localStorage.setItem('washouse_branches', JSON.stringify(branches));
    }, [branches]);

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

        supabase.from('activity_logs').insert([{
            action, details, user_name: user, branch_id: branchId, timestamp: newLog.timestamp
        }]).then(({ error }) => {
            if (error) console.error('Error saving activity log remotely:', error);
        });
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
        addBranch: async (branchData) => {
            const newBranch = {
                ...branchData,
                id: branchData.name.toLowerCase().replace(/\s+/g, '_')
            };

            const { error } = await supabase.from('branches').insert([{
                id: newBranch.id,
                name: newBranch.name,
                address: newBranch.address,
                water_cost_per_cycle: newBranch.waterCostPerCycle || 15,
                electricity_cost_per_cycle: newBranch.electricityCostPerCycle || 20,
                gas_cost_per_cycle: newBranch.gasCostPerCycle || 30
            }]);

            if (!error) {
                setBranches(prev => [...prev, newBranch]);
                return newBranch;
            }
        },
        isBranchActive: (branchId) => {
            return isLicenseValid(branchId);
        },
        BRANCH_LICENSES,
        updateBranch: async (id, updates) => {
            const { error } = await supabase
                .from('branches')
                .update({
                    name: updates.name,
                    address: updates.address,
                    water_cost_per_cycle: updates.waterCostPerCycle,
                    electricity_cost_per_cycle: updates.electricityCostPerCycle,
                    gas_cost_per_cycle: updates.gasCostPerCycle
                })
                .eq('id', id);

            if (!error) {
                setBranches(prev => prev.map(b => b.id === id ? { ...b, ...updates } : b));
            }
        },
        deleteBranch: async (branchId) => {
            if (branchId === 'main') {
                alert('No se puede eliminar la sucursal principal');
                return;
            }

            const { error } = await supabase.from('branches').delete().eq('id', branchId);
            if (!error) {
                setBranches(prev => prev.filter(b => b.id !== branchId));
            }
        },
        refreshStaff,
        addStaffMember: async (data) => {
            if (!data.pin) {
                alert('El PIN es obligatorio para crear un colaborador.');
                return;
            }
            const { data: result, error } = await supabase.rpc('upsert_staff', {
                p_id: null,
                p_name: data.name,
                p_role: data.role,
                p_pin: data.pin,
                p_branch_id: data.branchId || 'all'
            });
            if (error) {
                console.error('Error creating staff member:', error);
                alert('No se pudo crear el colaborador.');
                return;
            }
            await refreshStaff();
            logActivity('PERSONAL_AGREGADO', `Empleado: ${data.name} (${data.role})`);
            return result?.[0];
        },
        updateStaffMember: async (id, updates) => {
            const { error } = await supabase.rpc('upsert_staff', {
                p_id: id,
                p_name: updates.name,
                p_role: updates.role,
                p_pin: updates.pin || null, // empty/omitted pin keeps the existing one
                p_branch_id: updates.branchId || 'all'
            });
            if (error) {
                console.error('Error updating staff member:', error);
                alert('No se pudo actualizar el colaborador.');
                return;
            }
            await refreshStaff();
            logActivity('PERSONAL_ACTUALIZADO', `ID: ${id}`);
        },
        deleteStaffMember: async (id) => {
            const member = staff.find(s => s.id === id);
            if (member?.role === 'admin' && staff.filter(s => s.role === 'admin').length <= 1) {
                alert('No se puede eliminar al último administrador');
                return;
            }
            const { error } = await supabase.rpc('delete_staff', { p_id: id });
            if (error) {
                console.error('Error deleting staff member:', error);
                alert('No se pudo eliminar el colaborador.');
                return;
            }
            await refreshStaff();
            logActivity('PERSONAL_ELIMINADO', `Empleado: ${member?.name}`);
        },
        deleteStaffMembers: async (ids) => {
            const membersToDelete = staff.filter(s => ids.includes(s.id));
            const adminCount = staff.filter(s => s.role === 'admin').length;
            const adminsToDeleteCount = membersToDelete.filter(s => s.role === 'admin').length;

            if (adminCount - adminsToDeleteCount <= 0) {
                alert('No se puede eliminar a todos los administradores. Debe quedar al menos uno.');
                return;
            }

            for (const id of ids) {
                const { error } = await supabase.rpc('delete_staff', { p_id: id });
                if (error) console.error(`Error deleting staff member ${id}:`, error);
            }
            await refreshStaff();
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
