import { createContext, useContext, useCallback } from 'react';
import { AppProvider, useApp } from './AppContext';
import { EquipmentProvider, useEquipment } from './EquipmentContext';
import { SalesProvider, useSales } from './SalesContext';
import { OrderProvider, useOrders } from './OrderContext';
import { InventoryProvider, useInventory } from './InventoryContext';
import { ExpenseProvider, useExpenses } from './ExpenseContext';
import { PRODUCTS_CATALOG } from '../data/catalog';

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

        // Initialize default inventory
        const newInventoryItems = PRODUCTS_CATALOG.map(p => ({
            ...p,
            id: `${p.id}_${newBranch.id}`,
            branchId: newBranch.id
        }));
        inventory.setInventory(prev => [...prev, ...newInventoryItems]);

        return newBranch;
    }, [app, equipment, inventory]);

    const executeOrder = useCallback((orderData, userLabel = 'Host') => {
        // 1. Create the order
        const newOrder = orders.createOrder(orderData, userLabel);

        // 2. Deduct stock for supplies
        if (orderData.items && Array.isArray(orderData.items)) {
            orderData.items.forEach(item => {
                // We identify items to deduct by their serviceId and check if they are products
                // In NewOrderWizard, supplies are added with category 'products'
                // We can also check if the serviceId exists in the catalog but for now 
                // we'll rely on the metadata passed from the wizard if available, 
                // or just check if it matches a product ID.
                const isProduct = PRODUCTS_CATALOG.some(p => p.id === item.serviceId);
                if (isProduct) {
                    inventory.updateInventoryStock(item.serviceId, -item.quantity, orderData.branchId || 'main');
                }
            });
        }

        // 3. Update machine status if applicable
        if (orderData.machineId) {
            // Determine time based on items (heuristic from HostDashboard)
            const hasWash = orderData.items.some(i => i.serviceId?.includes('wash') || i.serviceId?.includes('duvet'));
            const time = hasWash ? 45 : 30;

            equipment.updateMachine(orderData.machineId, {
                status: 'running',
                timeLeft: time,
                clientName: orderData.customerName,
                total: orderData.totalAmount,
                items: orderData.items,
                startDate: new Date().toISOString()
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
