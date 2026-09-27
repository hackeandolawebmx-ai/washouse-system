import { createContext, useContext, useCallback } from 'react';
import { AppProvider, useApp } from './AppContext';
import { EquipmentProvider, useEquipment } from './EquipmentContext';
import { SalesProvider, useSales } from './SalesContext';
import { OrderProvider, useOrders } from './OrderContext';
import { InventoryProvider, useInventory } from './InventoryContext';
import { ExpenseProvider, useExpenses } from './ExpenseContext';
import { PRODUCTS_CATALOG } from '../data/catalog';

import { USUARIO_MOSTRADOR } from '../utils/labels';
const StorageContext = createContext();

// Default machine template for new branches
const DEFAULT_BRANCH_MACHINES = [
    { name: 'Lavadora 01', type: 'lavadora', status: 'available', timeLeft: 0 },
    { name: 'Lavadora 02', type: 'lavadora', status: 'available', timeLeft: 0 },
    { name: 'Lavadora 03', type: 'lavadora', status: 'available', timeLeft: 0 },
    { name: 'Secadora 01', type: 'secadora', status: 'available', timeLeft: 0 },
    { name: 'Secadora 02', type: 'secadora', status: 'available', timeLeft: 0 },
    { name: 'Secadora 03', type: 'secadora', status: 'available', timeLeft: 0 },
];

function CombinedStorageProvider({ children }) {
    const app = useApp();
    const equipment = useEquipment();
    const sales = useSales();
    const orders = useOrders();
    const inventory = useInventory();
    const expenses = useExpenses();

    // Cross-domain actions that require multiple contexts
    const addBranch = useCallback((branchData) => {
        const newBranch = app.addBranch(branchData);

        // Initialize default machines
        const newMachines = DEFAULT_BRANCH_MACHINES.map((m, index) => ({
            ...m,
            id: Date.now() + index + Math.floor(Math.random() * 1000),
            branchId: newBranch.id
        }));
        equipment.setMachines(prev => [...prev, ...newMachines]);

        // Initialize default inventory. id carries a suffix because
        // inventory.id is a global primary key; catalogId is what lets
        // executeOrder and updateInventoryStock resolve this row back to
        // the catalog item an order actually references.
        const newInventoryItems = PRODUCTS_CATALOG.map(p => ({
            ...p,
            id: `${p.id}_${newBranch.id}`,
            catalogId: p.id,
            branchId: newBranch.id
        }));
        inventory.setInventory(prev => [...prev, ...newInventoryItems]);

        return newBranch;
    }, [app, equipment, inventory]);

    const executeOrder = useCallback(async (orderData, userLabel = USUARIO_MOSTRADOR) => {
        // 1. Create the order
        const newOrder = await orders.createOrder(orderData, userLabel);

        // 2. Deduct stock for supplies
        //
        // item.serviceId is NOT always a catalog id: the "Agregar Insumos" step
        // adds supplies straight from the branch's inventory rows, so serviceId
        // there is that row's real id (e.g. 'bag__vista_hermosa' for a branch
        // whose ids carry a suffix, since inventory.id is a global primary key).
        // Only the auto-included free supplies (detergent/softener on wash_dry)
        // carry the catalog's plain id, because those are pulled straight from
        // PRODUCTS_CATALOG rather than from an inventory row.
        //
        // Checking against PRODUCTS_CATALOG alone only matched that second case
        // and, coincidentally, 'main' (whose rows happen to use plain catalog
        // ids as their id). Any other branch's suffixed ids never matched, so
        // stock silently never moved. Matching against the branch's actual
        // inventory (by real id OR catalogId) works for both cases, and for
        // custom, non-catalog products too.
        if (orderData.items && Array.isArray(orderData.items)) {
            const branchId = orderData.branchId || 'main';
            orderData.items.forEach(item => {
                const stockItem = inventory.inventory.find(p =>
                    p.branchId === branchId && (p.id === item.serviceId || p.catalogId === item.serviceId));
                if (stockItem) {
                    inventory.updateInventoryStock(item.serviceId, -item.quantity, branchId);
                }
            });
        }

        // 3. Update machine status if applicable
        if (orderData.machineId) {
            // Determine time based on items (heuristic from HostDashboard)
            const hasWash = orderData.items.some(i => i.serviceId?.includes('wash') || i.serviceId?.includes('duvet'));
            const time = hasWash ? 45 : 30;

            const targetMachine = equipment.machines?.find(m => m.id === orderData.machineId);
            const hasDry = orderData.items.some(i => i.serviceId?.includes('dry'));

            // Lavado y secado es secuencial: la secadora NO arranca aquí, arranca
            // cuando esta lavadora termina (ver assignPendingDries en
            // utils/dryerQueue.js, que corre desde EquipmentContext). Aquí solo se
            // deja apuntado qué secar y en qué secadora conviene hacerlo.
            let pendingDry = null;
            if (targetMachine && targetMachine.type === 'lavadora' && hasDry) {
                // Las sucursales no comparten un desfase fijo lavadora→secadora
                // (Mitras/Guadalupe son W1-6/D7-12, Semillero W1-10/D11-20), así que
                // se empareja por posición: la N-ésima lavadora con la N-ésima
                // secadora. Es solo preferencia: si al terminar el lavado esa
                // secadora está ocupada, la cola toma cualquier otra libre.
                const sortByNumber = (a, b) => {
                    const na = parseInt(a.name.match(/\d+/)?.[0] || '0', 10);
                    const nb = parseInt(b.name.match(/\d+/)?.[0] || '0', 10);
                    return na - nb;
                };
                const branchWashers = (equipment.machines || [])
                    .filter(m => m.branchId === targetMachine.branchId && m.type === 'lavadora')
                    .sort(sortByNumber);
                const branchDryers = (equipment.machines || [])
                    .filter(m => m.branchId === targetMachine.branchId && m.type === 'secadora')
                    .sort(sortByNumber);
                const washerIndex = branchWashers.findIndex(m => m.id === targetMachine.id);

                pendingDry = {
                    preferredDryerId: branchDryers[washerIndex]?.id || null,
                    clientName: orderData.customerName,
                    items: orderData.items.filter(i => i.serviceId?.includes('dry')),
                    orderId: newOrder.id,
                    queuedAt: new Date().toISOString()
                };
            }

            equipment.updateMachine(orderData.machineId, {
                status: 'running',
                timeLeft: time,
                clientName: orderData.customerName,
                total: orderData.totalAmount,
                items: orderData.items,
                startDate: new Date().toISOString(),
                orderId: newOrder.id,
                pendingDry,
                movedToDryer: null
            });
        }

        return newOrder;
    }, [orders, inventory, equipment, app]);

    const deleteBranch = useCallback((branchId) => {
        if (branchId === 'main') {
            alert('No se puede eliminar la sucursal principal');
            return;
        }

        app.deleteBranch(branchId);

        // Cascade cleanup
        equipment.setMachines(prev => prev.filter(m => m.branchId !== branchId));
        inventory.setInventory(prev => prev.filter(p => p.branchId !== branchId));
        sales.setShifts(prev => prev.filter(s => s.branchId !== branchId));
        sales.setSales(prev => prev.filter(s => s.branchId !== branchId));
        orders.setOrders(prev => prev.filter(o => o.branchId !== branchId));

        if (app.deviceBranchId === branchId) {
            app.setDeviceBranch('main');
        }
    }, [app, equipment, inventory, sales, orders]);

    const value = {
        ...app,
        ...equipment,
        ...sales,
        ...orders,
        ...inventory,
        ...expenses,
        addBranch,
        executeOrder,
        deleteBranch,
        syncData: () => {
            // Placeholder for legacy syncData calls
            // Each individual context now handles its own sync or we can trigger a hard reload
            console.warn('Individual contexts handle their own sync now.');
        }
    };

    return (
        <StorageContext.Provider value={value}>
            {children}
        </StorageContext.Provider>
    );
}

export function StorageProvider({ children }) {
    return (
        <AppProvider>
            <EquipmentProvider>
                <SalesProvider>
                    <OrderProvider>
                        <InventoryProvider>
                            <ExpenseProvider>
                                <CombinedStorageProvider>
                                    {children}
                                </CombinedStorageProvider>
                            </ExpenseProvider>
                        </InventoryProvider>
                    </OrderProvider>
                </SalesProvider>
            </EquipmentProvider>
        </AppProvider>
    );
}

export const useStorage = () => {
    const context = useContext(StorageContext);
    if (!context) throw new Error('useStorage must be used within a StorageProvider');
    return context;
};
