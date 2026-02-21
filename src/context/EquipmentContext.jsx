import { useApp } from './AppContext';
import { supabase } from '../lib/supabase';

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

    const [machines, setMachines] = useState([]);

    // Initial Fetch, Migration & Real-time Subscription
    useEffect(() => {
        const syncMachines = async () => {
            try {
                const { data: remoteMachines, error } = await supabase
                    .from('machines')
                    .select('*');

                if (error) throw error;

                if (remoteMachines.length > 0) {
                    setMachines(remoteMachines);
                } else {
                    // Migrate from localStorage if remote is empty
                    const localMachines = getFromStorage('washouse_machines', INITIAL_MACHINES);
                    if (localMachines.length > 0) {
                        const { error: insertError } = await supabase
                            .from('machines')
                            .insert(localMachines.map(m => ({
                                id: m.id,
                                branch_id: m.branchId || 'main',
                                name: m.name,
                                type: m.type,
                                status: m.status,
                                time_left: m.timeLeft
                            })));
                        if (!insertError) setMachines(localMachines);
                    }
                }
            } catch (err) {
                console.error('Error syncing machines:', err);
                setMachines(getFromStorage('washouse_machines', INITIAL_MACHINES));
            }
        };

        syncMachines();

        // Real-time subscription
        const channel = supabase
            .channel('machines_realtime')
            .on('postgres_changes', { event: '*', table: 'machines', schema: 'public' }, (payload) => {
                if (payload.eventType === 'INSERT') {
                    setMachines(prev => [...prev, payload.new]);
                } else if (payload.eventType === 'UPDATE') {
                    setMachines(prev => prev.map(m => m.id === payload.new.id ? payload.new : m));
                } else if (payload.eventType === 'DELETE') {
                    setMachines(prev => prev.filter(m => m.id !== payload.old.id));
                }
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const updateMachine = useCallback(async (machineId, updates) => {
        const { error } = await supabase
            .from('machines')
            .update({
                status: updates.status,
                time_left: updates.timeLeft,
                // Add other fields if necessary
            })
            .eq('id', machineId);

        if (!error) {
            setMachines(prev => prev.map(m =>
                m.id === machineId ? { ...m, ...updates } : m
            ));
        }
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
