import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useApp } from './AppContext';
import { useSales } from './SalesContext';
import { useEquipment } from './EquipmentContext';
import { supabase } from '../lib/supabase';

const OrderContext = createContext();

const mapOrder = (o) => ({
    id: o.id,
    branchId: o.branch_id,
    customerName: o.customer_name,
    customerPhone: o.customer_phone,
    machineId: o.machine_id,
    items: o.items || [],
    totalAmount: o.total_amount,
    advancePayment: o.advance_payment,
    balanceDue: o.balance_due,
    paymentMethod: o.payment_method,
    status: o.status,
    statusHistory: o.status_history || [],
    createdAt: o.created_at
});

const orderToRow = (o) => ({
    id: o.id,
    branch_id: o.branchId,
    customer_name: o.customerName,
    customer_phone: o.customerPhone,
    machine_id: o.machineId || null,
    items: o.items || [],
    total_amount: o.totalAmount || 0,
    advance_payment: o.advancePayment || 0,
    balance_due: o.balanceDue || 0,
    payment_method: o.paymentMethod,
    status: o.status,
    status_history: o.statusHistory || [],
    created_at: o.createdAt
});

export function OrderProvider({ children }) {
    const { logActivity } = useApp();
    const { addSale } = useSales();
    const { machines } = useEquipment();

    const [orders, setOrders] = useState([]);
    const [customerOverrides, setCustomerOverrides] = useState({});

    useEffect(() => {
        const fetchOrderData = async () => {
            const [ordersRes, overridesRes] = await Promise.all([
                supabase.from('orders').select('*').order('created_at', { ascending: false }),
                supabase.from('customer_overrides').select('*')
            ]);

            if (ordersRes.error) console.error('Error fetching orders:', ordersRes.error);
            else setOrders(ordersRes.data.map(mapOrder));

            if (overridesRes.error) {
                console.error('Error fetching customer overrides:', overridesRes.error);
            } else {
                const map = {};
                (overridesRes.data || []).forEach(row => {
                    map[row.phone] = { ...row.data, registrationBranchId: row.registration_branch_id };
                });
                setCustomerOverrides(map);
            }
        };
        fetchOrderData();
    }, []);

    const updateCustomerOverride = useCallback(async (phone, data, user = 'Admin') => {
        const standardPhone = phone.replace(/\D/g, '');
        const merged = { ...(customerOverrides[standardPhone] || {}), ...data };
        setCustomerOverrides(prev => ({ ...prev, [standardPhone]: merged }));

        const { registrationBranchId, ...rest } = merged;
        const { error } = await supabase.from('customer_overrides').upsert([{
            phone: standardPhone,
            registration_branch_id: registrationBranchId || null,
            data: rest
        }]);
        if (error) console.error('Error saving customer override remotely:', error);

        logActivity('CLIENTE_ACTUALIZADO', `Actualización datos cliente ${standardPhone}`, user);
    }, [logActivity, customerOverrides]);

    const createOrder = useCallback(async (orderData, user = 'Host') => {
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

        const { error } = await supabase.from('orders').insert([orderToRow(newOrder)]);
        if (error) console.error('Error saving order remotely:', error);

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

    const updateOrderStatus = useCallback(async (orderId, newStatus, user = 'Host') => {
        let updatedOrder = null;
        setOrders(prev => prev.map(o => {
            if (o.id === orderId) {
                updatedOrder = {
                    ...o,
                    status: newStatus,
                    statusHistory: [
                        ...o.statusHistory,
                        { status: newStatus, timestamp: new Date().toISOString(), user }
                    ]
                };
                return updatedOrder;
            }
            return o;
        }));

        if (updatedOrder) {
            const { error } = await supabase.from('orders')
                .update({ status: updatedOrder.status, status_history: updatedOrder.statusHistory })
                .eq('id', orderId);
            if (error) console.error('Error updating order status remotely:', error);
        }

        logActivity('ORDEN_ACTUALIZADA', `Orden ${orderId} a ${newStatus}`, user);
    }, [logActivity]);

    const addOrderPayment = useCallback(async (orderId, amount, method, user = 'Host') => {
        const order = orders.find(o => o.id === orderId);
        if (!order) return;

        addSale({
            type: 'service_payment',
            description: `Pago Saldo Orden ${order.id}`,
            amount: amount,
            orderId: orderId,
            method: method
        }, order.branchId);

        const newBalance = Math.max(0, order.balanceDue - amount);
        const newAdvance = order.advancePayment + amount;

        setOrders(prev => prev.map(o => o.id === orderId ? { ...o, balanceDue: newBalance, advancePayment: newAdvance } : o));

        const { error } = await supabase.from('orders')
            .update({ balance_due: newBalance, advance_payment: newAdvance })
            .eq('id', orderId);
        if (error) console.error('Error updating order payment remotely:', error);

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
