import { createContext, useContext, useState, useEffect } from 'react';
import { PRODUCTS_CATALOG } from '../data/catalog';

const StorageContext = createContext();

const INITIAL_BRANCHES = [
    { id: 'main', name: 'Sucursal Principal', address: 'Calle Principal 123' }
];

const INITIAL_MACHINES = [
    { id: 1, name: 'Lavadora 01', type: 'lavadora', status: 'available', timeLeft: 0, branchId: 'main' },
    { id: 2, name: 'Lavadora 02', type: 'lavadora', status: 'available', timeLeft: 0, branchId: 'main' },
    { id: 3, name: 'Lavadora 03', type: 'lavadora', status: 'available', timeLeft: 0, branchId: 'main' },
    { id: 4, name: 'Secadora 01', type: 'secadora', status: 'available', timeLeft: 0, branchId: 'main' },
    { id: 5, name: 'Secadora 02', type: 'secadora', status: 'maintenance', timeLeft: 0, branchId: 'main' },
    { id: 6, name: 'Secadora 03', type: 'secadora', status: 'available', timeLeft: 0, branchId: 'main' },
];

export function StorageProvider({ children }) {
    // Load from LocalStorage or use defaults
    const [deviceBranchId, setDeviceBranchId] = useState(() => {
        return localStorage.getItem('washouse_device_branch') || 'main'; // Default to main for smooth transition
    });

    const [branches, setBranches] = useState(() => {
        try {
            const saved = localStorage.getItem('washouse_branches');
            return saved ? JSON.parse(saved) : INITIAL_BRANCHES;
        } catch (e) {
            console.error('Error parsing branches', e);
            return INITIAL_BRANCHES;
        }
    });

    const [machines, setMachines] = useState(() => {
        try {
            const saved = localStorage.getItem('washouse_machines');
            // Migration: Add branchId if missing
            if (saved) {
                const parsed = JSON.parse(saved);
                return parsed.map(m => ({ ...m, branchId: m.branchId || 'main' }));
            }
            return INITIAL_MACHINES;
        } catch (e) {
            console.error('Error parsing machines from storage', e);
            return INITIAL_MACHINES;
        }
    });

    const [sales, setSales] = useState(() => {
        try {
            const saved = localStorage.getItem('washouse_sales');
            return saved ? JSON.parse(saved) : [];
        } catch (e) {
            console.error('Error parsing sales from storage', e);
            return [];
        }
    });

    const [shifts, setShifts] = useState(() => {
        try {
            const saved = localStorage.getItem('washouse_shifts');
            return saved ? JSON.parse(saved) : [];
        } catch (e) {
            console.error('Error parsing shifts from storage', e);
            return [];
        }
    });

    const [activityLogs, setActivityLogs] = useState(() => {
        try {
            const saved = localStorage.getItem('washouse_logs');
            return saved ? JSON.parse(saved) : [];
        } catch (e) {
            console.error('Error parsing logs from storage', e);
            return [];
        }
    });

    const [inventory, setInventory] = useState(() => {
        try {
            const saved = localStorage.getItem('washouse_inventory');
            if (saved) {
                const parsed = JSON.parse(saved);
                return parsed.map(p => ({ ...p, branchId: p.branchId || 'main' }));
            }
        } catch (e) {
            console.error('Error parsing inventory from storage', e);
        }

        // Init from catalog for Main branch
        return PRODUCTS_CATALOG.map(p => ({ ...p, branchId: 'main' }));
    });

    // Save to LocalStorage whenever state changes
    useEffect(() => {
        localStorage.setItem('washouse_branches', JSON.stringify(branches));
    }, [branches]);

    useEffect(() => {
        localStorage.setItem('washouse_machines', JSON.stringify(machines));
    }, [machines]);

    useEffect(() => {
        localStorage.setItem('washouse_sales', JSON.stringify(sales));
    }, [sales]);

    useEffect(() => {
        localStorage.setItem('washouse_shifts', JSON.stringify(shifts));
    }, [shifts]);

    useEffect(() => {
        localStorage.setItem('washouse_logs', JSON.stringify(activityLogs));
    }, [activityLogs]);

    useEffect(() => {
        localStorage.setItem('washouse_inventory', JSON.stringify(inventory));
    }, [inventory]);

    const [orders, setOrders] = useState(() => {
        try {
            const saved = localStorage.getItem('washouse_orders');
            return saved ? JSON.parse(saved) : [];
        } catch (e) {
            console.error('Error parsing orders from storage', e);
            return [];
        }
    });

    useEffect(() => {
        localStorage.setItem('washouse_orders', JSON.stringify(orders));
    }, [orders]);

    const [expenses, setExpenses] = useState(() => {
        try {
            const saved = localStorage.getItem('washouse_expenses');
            return saved ? JSON.parse(saved) : [];
        } catch (e) {
            console.error('Error parsing expenses from storage', e);
            return [];
        }
    });

    useEffect(() => {
        localStorage.setItem('washouse_expenses', JSON.stringify(expenses));
    }, [expenses]);

    const [customerOverrides, setCustomerOverrides] = useState(() => {
        try {
            const saved = localStorage.getItem('washouse_customer_overrides');
            return saved ? JSON.parse(saved) : {}; // Object keyed by standardized phone
        } catch (e) {
            console.error('Error parsing customer overrides', e);
            return {};
        }
    });

    useEffect(() => {
        localStorage.setItem('washouse_customer_overrides', JSON.stringify(customerOverrides));
    }, [customerOverrides]);

    // Actions
    const updateMachine = (machineId, updates) => {
        setMachines(prev => prev.map(m =>
            m.id === machineId ? { ...m, ...updates } : m
        ));
    };

    const addSale = (saleData, branchId = 'main') => {
        const newSale = {
            id: Date.now(),
            date: new Date().toISOString(),
            branchId,
            ...saleData
        };
        setSales(prev => [newSale, ...prev]);
        return newSale;
    };

    const addShift = (shiftData, branchId) => {
        setShifts(prev => [{ ...shiftData, branchId: branchId || 'main' }, ...prev]);
    };

    const updateInventoryStock = (productId, change, branchId = 'main') => {
        setInventory(prev => prev.map(p => {
            // Only update if ID matches AND branch matches
            if (p.id === productId && p.branchId === branchId) {
                return { ...p, stock: Math.max(0, p.stock + change) };
            }
            return p;
        }));
    };

    // Logging
    const logActivity = (action, details, user = 'Sistema', branchId = 'main') => {
        const newLog = {
            id: Date.now(),
            timestamp: new Date().toISOString(),
            action,
            details,
            user,
            branchId
        };
        setActivityLogs(prev => [newLog, ...prev]);
    };

    // Inventory CRUD
    const addProduct = (product, user = 'Admin', branchId = 'main') => {
        const newProduct = { ...product, id: Date.now().toString(), branchId };
        setInventory(prev => [...prev, newProduct]);
        logActivity('PRODUCTO_AGREGADO', `Producto: ${product.name} (${branchId})`, user, branchId);
        return newProduct;
    };

    const updateProduct = (id, updates, user = 'Admin') => {
        setInventory(prev => prev.map(p => {
            if (p.id === id) {
                logActivity('PRODUCTO_ACTUALIZADO', `Actualizado: ${p.name}`, user);
                return { ...p, ...updates };
            }
            return p;
        }));
    };

    const deleteProduct = (id, user = 'Admin') => {
        const product = inventory.find(p => p.id === id);
        if (product) {
            logActivity('PRODUCTO_ELIMINADO', `Eliminado: ${product.name}`, user);
        }
        setInventory(prev => prev.filter(p => p.id !== id));
    };

    const importInventory = (newProducts, user = 'Admin') => {
        let addedCount = 0;
        let updatedCount = 0;

        setInventory(prev => {
            const currentMap = new Map(prev.map(p => [p.id, p]));

            newProducts.forEach(p => {
                if (p.id && currentMap.has(p.id)) {
                    // Update existing
                    currentMap.set(p.id, { ...currentMap.get(p.id), ...p });
                    updatedCount++;
                } else {
                    // Add new (ensure ID)
                    const newId = p.id || Date.now().toString() + Math.random().toString(36).substr(2, 5);
                    currentMap.set(newId, { ...p, id: newId });
                    addedCount++;
                }
            });

            return Array.from(currentMap.values());
        });

        logActivity('IMPORTACION_MASIVA', `Agregados: ${addedCount}, Actualizados: ${updatedCount}`, user);
        return { added: addedCount, updated: updatedCount };
    };

    // Inject placeholder branches if they don't exist
    useEffect(() => {
        const PLACEHOLDERS = [
            { name: 'Sucursal Centro', address: 'Av. Juárez 100, Centro, Monterrey' },
            { name: 'Sucursal San Jeronimo', address: 'Anillo Periférico 200, San Jerónimo, Monterrey' },
            { name: 'Sucursal Cumbres', address: 'Paseo de los Leones 300, Cumbres, Monterrey' }
        ];

        PLACEHOLDERS.forEach(pb => {
            const id = pb.name.toLowerCase().replace(/\s+/g, '_');
            // Check if branch already exists (by ID)
            if (!branches.some(b => b.id === id)) {
                addBranch(pb);
            }
        });
    }, []); // Run once on mount

    const addBranch = (branchData) => {
        const newBranch = { ...branchData, id: branchData.name.toLowerCase().replace(/\s+/g, '_') };
        setBranches(prev => [...prev, newBranch]);

        // Initialize default machines for this branch
        const newMachines = INITIAL_MACHINES.map((m, index) => ({
            ...m,
            // Use a more robust unique ID generation: Timestamp + BranchIndex + MachineIndex + Random
            id: Date.now() + index + Math.floor(Math.random() * 1000),
            branchId: newBranch.id
        }));
        setMachines(prev => [...prev, ...newMachines]);

        // Initialize default inventory for this branch
        const newInventory = PRODUCTS_CATALOG.map(p => ({
            ...p,
            // Unique ID for inventory item: ProductID_BranchID
            id: `${p.id}_${newBranch.id}`,
            branchId: newBranch.id
        }));
        setInventory(prev => [...prev, ...newInventory]);

        return newBranch;
    };

    const updateBranch = (id, updates) => {
        setBranches(prev => prev.map(b =>
            b.id === id ? { ...b, ...updates } : b
        ));
    };

    const deleteBranch = (branchId) => {
        if (branchId === 'main') {
            alert('No se puede eliminar la sucursal principal');
            return;
        }

        // Cascade delete
        setBranches(prev => prev.filter(b => b.id !== branchId));
        setMachines(prev => prev.filter(m => m.branchId !== branchId));
        setInventory(prev => prev.filter(p => p.branchId !== branchId));
        setShifts(prev => prev.filter(s => s.branchId !== branchId));
        setSales(prev => prev.filter(s => s.branchId !== branchId));

        // If current device is linked to this branch, reset to main
        if (deviceBranchId === branchId) {
            setDeviceBranch('main');
        }
    };

    const setDeviceBranch = (branchId) => {
        setDeviceBranchId(branchId);
        localStorage.setItem('washouse_device_branch', branchId);
    };

    // Order Management
    const createOrder = (orderData, user = 'Host') => {
        const newOrder = {
            ...orderData,
            id: `ORD-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 100)}`,
            status: 'RECEIVED',
            createdAt: new Date().toISOString(),
            statusHistory: [{
                status: 'RECEIVED',
                timestamp: new Date().toISOString(),
                user
            }]
        };

        setOrders(prev => [newOrder, ...prev]);
        logActivity('ORDEN_CREADA', `Orden ${newOrder.id} recibida`, user, orderData.branchId);

        // If there is an advance payment, record it as a sale linked to the order
        if (orderData.advancePayment > 0) {
            addSale({
                type: 'service_advance',
                description: `Anticipo Orden ${newOrder.id}`,
                amount: orderData.advancePayment,
                orderId: newOrder.id,
                method: orderData.paymentMethod
            }, orderData.branchId);
        }

        return newOrder;
    };

    const updateOrderStatus = (orderId, newStatus, user = 'Host') => {
        setOrders(prev => prev.map(o => {
            if (o.id === orderId) {
                const updated = {
                    ...o,
                    status: newStatus,
                    statusHistory: [
                        ...o.statusHistory,
                        { status: newStatus, timestamp: new Date().toISOString(), user }
                    ]
                };

                // If Delivered, check for balance payment
                if (newStatus === 'DELIVERED' && o.balanceDue > 0) {
                    // This should be handled by addOrderPayment before status change or implicitly if we allow debt
                    // ideally we prevent status change in UI if balance > 0
                }

                return updated;
            }
            return o;
        }));
        logActivity('ORDEN_ACTUALIZADA', `Orden ${orderId} a ${newStatus}`, user);
    };

    const addOrderPayment = (orderId, amount, method, user = 'Host') => {
        const order = orders.find(o => o.id === orderId);
        if (!order) return;

        // 1. Create Sale Record
        addSale({
            type: 'service_payment',
            description: `Pago Saldo Orden ${order.id}`,
            amount: amount,
            orderId: orderId,
            method: method
        }, order.branchId);

        // 2. Update Order Balance
        setOrders(prev => prev.map(o => {
            if (o.id === orderId) {
                const newBalance = o.balanceDue - amount;
                const newAdvance = o.advancePayment + amount;
                return {
                    ...o,
                    balanceDue: newBalance < 0 ? 0 : newBalance, // Prevent negative
                    advancePayment: newAdvance
                };
            }
            return o;
        }));
        logActivity('PAGO_ORDEN', `Pago de ${amount} para Orden ${orderId} (${method})`, user, order.branchId);
    };

    const updateCustomerOverride = (phone, data, user = 'Admin') => {
        const standardPhone = phone.replace(/\D/g, '');
        setCustomerOverrides(prev => ({
            ...prev,
            [standardPhone]: { ...(prev[standardPhone] || {}), ...data }
        }));
        logActivity('CLIENTE_ACTUALIZADO', `Actualización datos cliente ${standardPhone}`, user);
    };

    const addExpense = (expenseData, user = 'Host') => {
        const newExpense = {
            id: `EXP-${Date.now()}`,
            timestamp: new Date().toISOString(),
            ...expenseData
        };
        setExpenses(prev => [newExpense, ...prev]);
        logActivity('GASTO_REGISTRADO', `Gasto: $${expenseData.amount} - ${expenseData.description}`, user, expenseData.branchId);
        return newExpense;
    };

    const loadStandardInventory = (branchId, user = 'Admin') => {
        if (!branchId || branchId === 'all') {
            alert('Selecciona una sucursal específica para cargar el inventario estándar.');
            return;
        }

        let addedCount = 0;
        setInventory(prev => {
            const currentBranchProducts = new Set(
                prev.filter(p => p.branchId === branchId)
                    .map(p => p.name.toLowerCase().trim())
            );

            const newProducts = [];
            PRODUCTS_CATALOG.forEach(catalogItem => {
                // If product name doesn't exist in this branch, add it
                if (!currentBranchProducts.has(catalogItem.name.toLowerCase().trim())) {
                    newProducts.push({
                        ...catalogItem,
                        id: `${catalogItem.id}_${branchId}_${Date.now()}`, // Ensure unique ID
                        branchId: branchId
                    });
                    addedCount++;
                }
            });

            return [...prev, ...newProducts];
        });

        if (addedCount > 0) {
            logActivity('INVENTARIO_ESTANDAR', `Se cargaron ${addedCount} productos estándar.`, user, branchId);
            alert(`Se agregaron ${addedCount} productos del catálogo estándar.`);
        } else {
            alert('El inventario ya cuenta con todos los productos estándar.');
        }
    };

    return (
        <StorageContext.Provider value={{
            machines,
            sales,
            shifts,
            inventory,
            activityLogs,
            branches,
            deviceBranchId,
            addSale,
            addShift,
            addBranch,
            updateBranch,
            deleteBranch,
            orders,
            createOrder,
            updateOrderStatus,
            addOrderPayment,
            customerOverrides,
            updateCustomerOverride,
            expenses,
            addExpense,
            loadStandardInventory,
            addProduct,
            updateProduct,
            deleteProduct,
            importInventory,
            updateMachine,
            updateInventoryStock,
            logActivity,
            setBranches,
            setDeviceBranch
        }}>
            {children}
        </StorageContext.Provider>
    );
}

export const useStorage = () => useContext(StorageContext);
