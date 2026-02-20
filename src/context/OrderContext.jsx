import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useApp } from './AppContext';
import { useSales } from './SalesContext';
import { useEquipment } from './EquipmentContext';
import initialDB from '../data/initialState.json';

const OrderContext = createContext();

export function OrderProvider({ children }) {
    const { CURRENT_SYSTEM_VERSION, logActivity } = useApp();
    const { addSale } = useSales();
    const { machines } = useEquipment();

    const getFromStorage = (key, defaultValue) => {
        const savedVersion = localStorage.getItem('washouse_system_version');
        if (savedVersion !== CURRENT_SYSTEM_VERSION) return defaultValue;
        const saved = localStorage.getItem(key);
        return saved ? JSON.parse(saved) : defaultValue;
    };

    const [orders, setOrders] = useState(() => {
        return getFromStorage('washouse_orders', initialDB.orders || []);
    });

    const [customerOverrides, setCustomerOverrides] = useState(() => {
        return getFromStorage('washouse_customer_overrides', {});
    });

    useEffect(() => {
        localStorage.setItem('washouse_orders', JSON.stringify(orders));
    }, [orders]);

    useEffect(() => {
        localStorage.setItem('washouse_customer_overrides', JSON.stringify(customerOverrides));
    }, [customerOverrides]);

    const updateCustomerOverride = useCallback((phone, data, user = 'Admin') => {
        const standardPhone = phone.replace(/\D/g, '');
        setCustomerOverrides(prev => ({
            ...prev,
            [standardPhone]: { ...(prev[standardPhone] || {}), ...data }
        }));
        logActivity('CLIENTE_ACTUALIZADO', `Actualización datos cliente ${standardPhone}`, user);
    }, [logActivity]);

    const createOrder = useCallback((orderData, user = 'Host') => {
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

        const phone = orderData.customerPhone.replace(/\D/g, '');
        if (phone && !customerOverrides?.[phone]?.registrationBranchId) {
            updateCustomerOverride(phone, { registrationBranchId: orderData.branchId });
        }

        if (orderData.advancePayment > 0) {
            const machine = machines.find(m => m.id === orderData.machineId);
            addSale({
                type: 'service_advance',
                description: `Anticipo Orden ${newOrder.id}`,
                amount: orderData.advancePayment,
                orderId: newOrder.id,
                method: orderData.paymentMethod,
                machineId: orderData.machineId,
                machineType: machine?.type || 'N/A'
            }, orderData.branchId);
        }

        return newOrder;
    }, [customerOverrides, updateCustomerOverride, machines, addSale, logActivity]);

    const updateOrderStatus = useCallback((orderId, newStatus, user = 'Host') => {
        setOrders(prev => prev.map(o => {
            if (o.id === orderId) {
                return {
                    ...o,
                    status: newStatus,
                    statusHistory: [
                        ...o.statusHistory,
                        { status: newStatus, timestamp: new Date().toISOString(), user }
                    ]
                };
            }
            return o;
        }));
        logActivity('ORDEN_ACTUALIZADA', `Orden ${orderId} a ${newStatus}`, user);
    }, [logActivity]);

    const addOrderPayment = useCallback((orderId, amount, method, user = 'Host') => {
        const order = orders.find(o => o.id === orderId);
        if (!order) return;

        addSale({
            type: 'service_payment',
            description: `Pago Saldo Orden ${order.id}`,
            amount: amount,
            orderId: orderId,
            method: method
        }, order.branchId);

        setOrders(prev => prev.map(o => {
            if (o.id === orderId) {
                const newBalance = o.balanceDue - amount;
                const newAdvance = o.advancePayment + amount;
                return {
                    ...o,
                    balanceDue: newBalance < 0 ? 0 : newBalance,
                    advancePayment: newAdvance
                };
            }
            return o;
        }));
        logActivity('PAGO_ORDEN', `Pago de ${amount} para Orden ${orderId} (${method})`, user, order.branchId);
    }, [orders, addSale, logActivity]);

    const value = {
        orders,
        setOrders,
        createOrder,
        updateOrderStatus,
        addOrderPayment,
        customerOverrides,
        updateCustomerOverride
    };

    return (
        <OrderContext.Provider value={value}>
            {children}
        </OrderContext.Provider>
    );
}

export const useOrders = () => {
    const context = useContext(OrderContext);
    if (!context) throw new Error('useOrders must be used within an OrderProvider');
    return context;
};
