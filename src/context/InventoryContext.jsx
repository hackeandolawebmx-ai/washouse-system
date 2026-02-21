import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useApp } from './AppContext';
import { PRODUCTS_CATALOG } from '../data/catalog';
import initialDB from '../data/initialState.json';

const InventoryContext = createContext();

export function InventoryProvider({ children }) {
    const { CURRENT_SYSTEM_VERSION, logActivity } = useApp();

    const getFromStorage = (key, defaultValue) => {
        const savedVersion = localStorage.getItem('washouse_system_version');
        if (savedVersion !== CURRENT_SYSTEM_VERSION) return defaultValue;
        const saved = localStorage.getItem(key);
        return saved ? JSON.parse(saved) : defaultValue;
    };

    const [inventory, setInventory] = useState(() => {
        const data = getFromStorage('washouse_inventory', null);
        if (data && data.length > 0) return data.map(p => ({ ...p, branchId: p.branchId || 'main' }));
        return PRODUCTS_CATALOG.map(p => ({ ...p, branchId: 'main' }));
    });

    useEffect(() => {
        localStorage.setItem('washouse_inventory', JSON.stringify(inventory));
    }, [inventory]);

    const updateInventoryStock = useCallback((productId, change, branchId = 'main') => {
        setInventory(prev => prev.map(p => {
            if (p.id === productId && p.branchId === branchId) {
                return { ...p, stock: Math.max(0, p.stock + change) };
            }
            return p;
        }));
    }, []);

    const addProduct = useCallback((product, user = 'Admin', branchId = 'main') => {
        const newProduct = { ...product, id: Date.now().toString(), branchId };
        setInventory(prev => [...prev, newProduct]);
        logActivity('PRODUCTO_AGREGADO', `Producto: ${product.name} (${branchId})`, user, branchId);
        return newProduct;
    }, [logActivity]);

    const updateProduct = useCallback((id, updates, user = 'Admin') => {
        setInventory(prev => prev.map(p => {
            if (p.id === id) {
                logActivity('PRODUCTO_ACTUALIZADO', `Actualizado: ${p.name}`, user);
                return { ...p, ...updates };
            }
            return p;
        }));
    }, [logActivity]);

    const deleteProduct = useCallback((id, user = 'Admin') => {
        setInventory(prev => {
            const product = prev.find(p => p.id === id);
            if (product) {
                logActivity('PRODUCTO_ELIMINADO', `Eliminado: ${product.name}`, user);
            }
            return prev.filter(p => p.id !== id);
        });
    }, [logActivity]);

    const importInventory = useCallback((newProducts, user = 'Admin') => {
        let addedCount = 0;
        let updatedCount = 0;

        setInventory(prev => {
            const currentMap = new Map(prev.map(p => [p.id, p]));

            newProducts.forEach(p => {
                if (p.id && currentMap.has(p.id)) {
                    currentMap.set(p.id, { ...currentMap.get(p.id), ...p });
                    updatedCount++;
                } else {
                    const newId = p.id || Date.now().toString() + Math.random().toString(36).substr(2, 5);
                    currentMap.set(newId, { ...p, id: newId });
                    addedCount++;
                }
            });

            return Array.from(currentMap.values());
        });

        logActivity('IMPORTACION_MASIVA', `Agregados: ${addedCount}, Actualizados: ${updatedCount}`, user);
        return { added: addedCount, updated: updatedCount };
    }, [logActivity]);

    const loadStandardInventoryInAllBranches = useCallback((user = 'Admin') => {
        const branches = JSON.parse(localStorage.getItem('washouse_branches') || '[]');
        if (branches.length === 0) return;

        let totalAdded = 0;
        setInventory(prev => {
            let currentInventory = [...prev];

            branches.forEach(branch => {
                const currentBranchProducts = new Set(
                    currentInventory.filter(p => p.branchId === branch.id)
                        .map(p => p.name.toLowerCase().trim())
                );

                PRODUCTS_CATALOG.forEach(catalogItem => {
                    if (!currentBranchProducts.has(catalogItem.name.toLowerCase().trim())) {
                        currentInventory.push({
                            ...catalogItem,
                            id: `${catalogItem.id}_${branch.id}_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
                            branchId: branch.id
                        });
                        totalAdded++;
                    }
                });
            });

            return currentInventory;
        });

        if (totalAdded > 0) {
            logActivity('INVENTARIO_MASIVO', `Se inicializaron ${totalAdded} productos en todas las sucursales.`, user);
            alert(`Se agregaron ${totalAdded} productos en total a todas las sucursales.`);
        } else {
            alert('Todas las sucursales ya tienen el catálogo completo.');
        }
    }, [logActivity]);

    const value = {
        inventory,
        setInventory,
        updateInventoryStock,
        addProduct,
        updateProduct,
        deleteProduct,
        importInventory,
        loadStandardInventoryInAllBranches
    };

    return (
        <InventoryContext.Provider value={value}>
            {children}
        </InventoryContext.Provider>
    );
}

export const useInventory = () => {
    const context = useContext(InventoryContext);
    if (!context) throw new Error('useInventory must be used within an InventoryProvider');
    return context;
};
