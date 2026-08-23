import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useApp } from './AppContext';
import { supabase } from '../lib/supabase';
import { PRODUCTS_CATALOG } from '../data/catalog';

const InventoryContext = createContext();

const mapProduct = (p) => ({ ...p.metadata, id: p.id, branchId: p.branch_id, name: p.name, category: p.category, stock: p.stock, price: p.price });

const toRow = (p) => {
    const { id, branchId, name, category, stock, price, ...metadata } = p;
    return { id, branch_id: branchId, name, category, stock, price, metadata };
};

export function InventoryProvider({ children }) {
    const { logActivity, branches } = useApp();

    const [inventory, setInventory] = useState([]);

    useEffect(() => {
        const syncInventory = async () => {
            const { data, error } = await supabase.from('inventory').select('*');
            if (error) {
                console.error('Error fetching inventory:', error);
                return;
            }
            if (data && data.length > 0) {
                setInventory(data.map(mapProduct));
            } else {
                // Seed a fresh project with the default catalog for the main branch
                const seed = PRODUCTS_CATALOG.map(p => ({ ...p, branchId: 'main' }));
                const { error: insertError } = await supabase.from('inventory').upsert(seed.map(toRow));
                if (insertError) console.error('Inventory seed error:', insertError);
                setInventory(seed);
            }
        };
        syncInventory();
    }, []);

    const updateInventoryStock = useCallback(async (productId, change, branchId = 'main') => {
        const current = inventory.find(p => p.id === productId && p.branchId === branchId);
        if (!current) return;

        const newStock = Math.max(0, current.stock + change);
        setInventory(prev => prev.map(p => (p.id === productId && p.branchId === branchId) ? { ...p, stock: newStock } : p));

        const { error } = await supabase.from('inventory').update({ stock: newStock }).eq('id', productId);
        if (error) console.error('Error updating stock remotely:', error);
    }, [inventory]);

    const addProduct = useCallback(async (product, user = 'Admin', branchId = 'main') => {
        const newProduct = { ...product, id: Date.now().toString(), branchId };
        setInventory(prev => [...prev, newProduct]);

        const { error } = await supabase.from('inventory').insert([toRow(newProduct)]);
        if (error) console.error('Error saving product remotely:', error);

        logActivity('PRODUCTO_AGREGADO', `Producto: ${product.name} (${branchId})`, user, branchId);
        return newProduct;
    }, [logActivity]);

    const updateProduct = useCallback(async (id, updates, user = 'Admin') => {
        const current = inventory.find(p => p.id === id);
        if (!current) return;

        const updatedProduct = { ...current, ...updates };
        setInventory(prev => prev.map(p => p.id === id ? updatedProduct : p));
        logActivity('PRODUCTO_ACTUALIZADO', `Actualizado: ${current.name}`, user);

        const { error } = await supabase.from('inventory').update(toRow(updatedProduct)).eq('id', id);
        if (error) console.error('Error updating product remotely:', error);
    }, [inventory, logActivity]);

    const deleteProduct = useCallback(async (id, user = 'Admin') => {
        const product = inventory.find(p => p.id === id);
        setInventory(prev => prev.filter(p => p.id !== id));

        const { error } = await supabase.from('inventory').delete().eq('id', id);
        if (error) console.error('Error deleting product remotely:', error);

        if (product) {
            logActivity('PRODUCTO_ELIMINADO', `Eliminado: ${product.name}`, user);
        }
    }, [logActivity, inventory]);

    const importInventory = useCallback(async (newProducts, user = 'Admin') => {
        let addedCount = 0;
        let updatedCount = 0;
        const currentMap = new Map(inventory.map(p => [p.id, p]));

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

        const nextInventory = Array.from(currentMap.values());
        setInventory(nextInventory);

        const { error } = await supabase.from('inventory').upsert(nextInventory.map(toRow));
        if (error) console.error('Error importing inventory remotely:', error);

        logActivity('IMPORTACION_MASIVA', `Agregados: ${addedCount}, Actualizados: ${updatedCount}`, user);
        return { added: addedCount, updated: updatedCount };
    }, [logActivity, inventory]);

    const loadStandardInventoryInAllBranches = useCallback(async (user = 'Admin') => {
        if (branches.length === 0) return;

        const currentInventory = [...inventory];
        const newItems = [];

        branches.forEach(branch => {
            const currentBranchProducts = new Set(
                currentInventory.filter(p => p.branchId === branch.id)
                    .map(p => p.name.toLowerCase().trim())
            );

            PRODUCTS_CATALOG.forEach(catalogItem => {
                if (!currentBranchProducts.has(catalogItem.name.toLowerCase().trim())) {
                    newItems.push({
                        ...catalogItem,
                        id: `${catalogItem.id}_${branch.id}_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
                        branchId: branch.id
                    });
                }
            });
        });

        if (newItems.length > 0) {
            setInventory([...currentInventory, ...newItems]);

            const { error } = await supabase.from('inventory').upsert(newItems.map(toRow));
            if (error) console.error('Error seeding standard inventory remotely:', error);

            logActivity('INVENTARIO_MASIVO', `Se inicializaron ${newItems.length} productos en todas las sucursales.`, user);
            alert(`Se agregaron ${newItems.length} productos en total a todas las sucursales.`);
        } else {
            alert('Todas las sucursales ya tienen el catálogo completo.');
        }
    }, [logActivity, inventory, branches]);

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
