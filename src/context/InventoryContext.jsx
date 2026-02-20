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

    const loadStandardInventory = useCallback((branchId, user = 'Admin') => {
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
                if (!currentBranchProducts.has(catalogItem.name.toLowerCase().trim())) {
                    newProducts.push({
                        ...catalogItem,
                        id: `${catalogItem.id}_${branchId}_${Date.now()}`,
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
    }, [logActivity]);

    const value = {
        inventory,
        setInventory,
        updateInventoryStock,
        addProduct,
        updateProduct,
        deleteProduct,
        importInventory,
        loadStandardInventory
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
