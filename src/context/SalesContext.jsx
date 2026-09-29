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

// metadata primero: los campos propios de la fila (id, name, category, price)
// siempre ganan sobre lo que traiga el jsonb.
const mapService = (s) => ({
    ...s.metadata,
    id: s.id,
    name: s.name,
    category: s.category,
    price: s.price
});

// Postgres no garantiza el orden de las filas (un update manda el servicio
// al final), así que se ordena como SERVICES_CATALOG: Lavado y secado,
// Lavadora y Secadora primero y cada categoría junta. Los servicios dados de
// alta desde Configuración (sin lugar en el catálogo) van al final.
const catalogIndex = (id) => {
    const i = SERVICES_CATALOG.findIndex(s => s.id === id);
    return i === -1 ? Infinity : i;
};
const sortLikeCatalog = (list) =>
    [...list].sort((a, b) => catalogIndex(a.id) - catalogIndex(b.id));

const mapShift = (s) => ({
    id: s.id,
    branchId: s.branch_id,
    startTime: s.start_time,
    endedAt: s.ended_at,
    initialCash: s.initial_cash,
    totalSales: s.total_sales,
    status: s.status,
    closedBy: s.closed_by,
    cashSales: s.cash_sales,
    cardSales: s.card_sales,
    transferSales: s.transfer_sales,
    totalExpenses: s.total_expenses,
    expectedDrawer: s.expected_cash,
    finalCash: s.counted_cash,
    difference: s.difference
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

            // La tabla 'services' es la fuente de verdad de los precios: es lo
            // que permite que un cambio hecho en Configuración persista y que la
            // web pública muestre lo mismo que cobra el mostrador. SERVICES_CATALOG
            // queda solo como respaldo para que la app siga usable si Supabase no
            // responde o la tabla aún no se ha sembrado.
            if (servicesRes.error) {
                console.error('Error fetching services:', servicesRes.error);
            } else if (servicesRes.data?.length) {
                setServices(sortLikeCatalog(servicesRes.data.map(mapService)));
            } else {
                console.warn('Tabla services vacía; usando el catálogo local como respaldo.');
                setServices(SERVICES_CATALOG);
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
            total_sales: newShift.totalSales ?? 0,
            status: newShift.status || 'closed',
            closed_by: newShift.closedBy || null,
            cash_sales: newShift.cashSales ?? 0,
            card_sales: newShift.cardSales ?? 0,
            transfer_sales: newShift.transferSales ?? 0,
            total_expenses: newShift.totalExpenses ?? 0,
            expected_cash: newShift.expectedDrawer ?? null,
            counted_cash: newShift.finalCash ?? null,
            difference: newShift.difference ?? null
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
        const current = services.find(s => s.id === id);
        if (!current) return;

        const updated = { ...current, ...updates };
        setServices(prev => prev.map(s => s.id === id ? updated : s));

        // upsert, no update: un servicio base puede no tener fila todavía si la
        // migración de siembra no se ha corrido, y un update silencioso sobre
        // cero renglones haría que el cambio de precio se perdiera al recargar.
        const { id: sid, name, category, price, ...metadata } = updated;
        const { error } = await supabase
            .from('services')
            .upsert({ id: sid, name, category, price, metadata });
        if (error) console.error('Error updating service remotely:', error);
    }, [services]);

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
