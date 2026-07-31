import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { SERVICES_CATALOG } from '../data/catalog';

const SalesContext = createContext();

const mapSale = (s) => ({
    id: s.id,
    branchId: s.branch_id,
    shiftId: s.shift_id,
    type: s.type,
    description: s.description,
    amount: s.amount,
    orderId: s.order_id,
    method: s.method,
    machineId: s.machine_id,
    machineType: s.machine_type,
    date: s.date
});

const mapShift = (s) => ({
    id: s.id,
    branchId: s.branch_id,
    startTime: s.start_time,
    endedAt: s.ended_at,
    initialCash: s.initial_cash,
    totalSales: s.total_sales,
    status: s.status,
    closedBy: s.closed_by
});

export function SalesProvider({ children }) {
    const [sales, setSales] = useState([]);
    const [shifts, setShifts] = useState([]);

    const [services, setServices] = useState(SERVICES_CATALOG);

    useEffect(() => {
        const fetchSalesData = async () => {
            const [salesRes, shiftsRes, servicesRes] = await Promise.all([
                supabase.from('sales').select('*').order('date', { ascending: false }),
                supabase.from('shifts').select('*').order('start_time', { ascending: false }),
                supabase.from('services').select('*')
            ]);

            if (salesRes.error) console.error('Error fetching sales:', salesRes.error);
            else setSales(salesRes.data.map(mapSale));

            if (shiftsRes.error) console.error('Error fetching shifts:', shiftsRes.error);
            else setShifts(shiftsRes.data.map(mapShift));

            if (servicesRes.error) {
                console.error('Error fetching services:', servicesRes.error);
            } else {
                const custom = (servicesRes.data || [])
                    .filter(s => !SERVICES_CATALOG.some(c => c.id === s.id))
                    .map(s => ({ id: s.id, name: s.name, category: s.category, price: s.price, ...s.metadata }));
                setServices([...SERVICES_CATALOG, ...custom]);
            }
        };
        fetchSalesData();
    }, []);

    const addSale = useCallback(async (saleData, branchId = 'main') => {
        const newSale = {
            id: `SALE-${Date.now()}`,
            date: new Date().toISOString(),
            branchId,
            ...saleData
        };
        setSales(prev => [newSale, ...prev]);

        const { error } = await supabase.from('sales').insert([{
            id: newSale.id,
            branch_id: newSale.branchId,
            shift_id: newSale.shiftId || null,
            type: newSale.type,
            description: newSale.description,
            amount: newSale.amount,
            order_id: newSale.orderId || null,
            method: newSale.method,
            machine_id: newSale.machineId || null,
            machine_type: newSale.machineType || null,
            date: newSale.date
        }]);
        if (error) console.error('Error saving sale remotely:', error);

        return newSale;
    }, []);

    const addShift = useCallback(async (shiftData, branchId) => {
        const newShift = { ...shiftData, branchId: branchId || 'main' };
        setShifts(prev => [newShift, ...prev]);

        const { error } = await supabase.from('shifts').upsert([{
            id: String(newShift.id),
            branch_id: newShift.branchId,
            start_time: newShift.startTime,
            ended_at: newShift.endedAt || null,
            initial_cash: newShift.initialCash,
            total_sales: newShift.totalSales ?? newShift.totalSales?.total ?? 0,
            status: newShift.status || 'closed',
            closed_by: newShift.closedBy || null
        }]);
        if (error) console.error('Error saving shift remotely:', error);
    }, []);

    const addService = useCallback(async (service) => {
        const newService = { ...service, id: `svc_${Date.now()}` };
        setServices(prev => [...prev, newService]);

        const { id, name, category, price, ...metadata } = newService;
        const { error } = await supabase.from('services').insert([{ id, name, category, price, metadata }]);
        if (error) console.error('Error saving service remotely:', error);

        return newService;
    }, []);

    const updateService = useCallback(async (id, updates) => {
        let updated = null;
        setServices(prev => prev.map(s => {
            if (s.id === id) {
                updated = { ...s, ...updates };
                return updated;
            }
            return s;
        }));
        if (updated) {
            const { id: sid, name, category, price, ...metadata } = updated;
            const { error } = await supabase.from('services').update({ name, category, price, metadata }).eq('id', sid);
            if (error) console.error('Error updating service remotely:', error);
        }
    }, []);

    const deleteService = useCallback(async (id) => {
        setServices(prev => prev.filter(s => s.id !== id));
        const { error } = await supabase.from('services').delete().eq('id', id);
        if (error) console.error('Error deleting service remotely:', error);
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
