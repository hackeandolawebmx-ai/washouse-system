import { useMemo } from 'react';
import { useStorage } from '../context/StorageContext';

export function useMetrics() {
    const { sales, expenses, machines, orders, branches, selectedBranch } = useStorage();

    const metrics = useMemo(() => {
        // 1. Basic Filtering
        const filteredSales = sales.filter(s =>
            selectedBranch === 'all' || s.branchId === selectedBranch
        );

        const filteredExpenses = expenses.filter(e =>
            selectedBranch === 'all' || e.branchId === selectedBranch
        );

        const filteredMachines = machines.filter(m =>
            selectedBranch === 'all' || m.branchId === selectedBranch
        );

        // 2. Core Totals & Variable Costs
        const totalIncome = filteredSales.reduce((acc, s) => acc + (s.total || 0), 0);
        const totalExpenses = filteredExpenses.reduce((acc, e) => acc + (e.amount || 0), 0);

        // Calculate Variable Costs based on Branch-Specific Settings
        const totalVariableCosts = filteredSales.reduce((acc, sale) => {
            const branch = branches.find(b => b.id === sale.branchId);
            const water = branch?.waterCostPerCycle || 0;
            const energy = branch?.electricityCostPerCycle || 0;
            const gas = branch?.gasCostPerCycle || 0;
            return acc + (water + energy + gas);
        }, 0);

        // Utility estimates are now derived from real per-cycle data if possible
        // but kept as a summary for the UI if needed
        const utilityEstimates = {
            water: filteredSales.reduce((acc, s) => acc + (branches.find(b => b.id === s.branchId)?.waterCostPerCycle || 0), 0),
            electricity: filteredSales.reduce((acc, s) => acc + (branches.find(b => b.id === s.branchId)?.electricityCostPerCycle || 0), 0),
            gas: filteredSales.reduce((acc, s) => acc + (branches.find(b => b.id === s.branchId)?.gasCostPerCycle || 0), 0)
        };

        const netProfit = totalIncome - (totalExpenses + totalVariableCosts);

        // 3. Productivity & Utilization (diseño.md KPIs)
        const totalCycles = filteredSales.length;
        const totalMachinesCount = filteredMachines.length || 1;

        // 4. Missing KPIs from diseño.md

        // Turnaround Time (Tiempo de Respuesta)
        const completedOrders = orders.filter(o =>
            (selectedBranch === 'all' || o.branchId === selectedBranch) &&
            (o.status === 'COMPLETED' || o.status === 'DELIVERED')
        );

        const turnaroundTimes = completedOrders.map(o => {
            const received = o.statusHistory?.find(h => h.status === 'RECEIVED')?.timestamp;
            const completed = o.statusHistory?.find(h => h.status === 'COMPLETED' || h.status === 'DELIVERED')?.timestamp;
            if (received && completed) {
                const start = new Date(received);
                const end = new Date(completed);
                if (!isNaN(start) && !isNaN(end)) {
                    return (end - start) / (1000 * 60 * 60); // In hours
                }
            }
            return null;
        }).filter(t => t !== null);

        const avgTurnaroundTime = turnaroundTimes.length > 0
            ? turnaroundTimes.reduce((acc, t) => acc + t, 0) / turnaroundTimes.length
            : 0;

        // Retention Rate (Tasa de Retención)
        const customerVisits = {};
        filteredSales.forEach(s => {
            if (s.orderId) {
                const order = orders.find(o => o.id === s.orderId);
                if (order && order.customerPhone) {
                    customerVisits[order.customerPhone] = (customerVisits[order.customerPhone] || 0) + 1;
                }
            }
        });

        const uniqueCustomers = Object.keys(customerVisits).length;
        const recurringCustomers = Object.values(customerVisits).filter(count => count > 1).length;
        const retentionRate = uniqueCustomers > 0 ? (recurringCustomers / uniqueCustomers) * 100 : 0;

        // Operating Margin per Load (Margen Operativo)
        // Real profitability (Income - Variable Costs)
        const operatingMargin = totalIncome > 0 ? ((totalIncome - totalVariableCosts) / totalIncome) * 100 : 0;

        // Calculate days in period based on sales data if available, fallback to 30
        let days = 30;
        if (filteredSales.length > 1) {
            const dates = filteredSales
                .map(s => new Date(s.date))
                .filter(d => !isNaN(d))
                .sort((a, b) => a - b);

            if (dates.length > 1) {
                const diffTime = Math.abs(dates[dates.length - 1] - dates[0]);
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                days = diffDays > 0 ? diffDays : 1;
            }
        }

        // RPMD: Revenue Per Machine Day
        const rpmd = totalIncome / (totalMachinesCount * days);

        // Utilization Rate (%): Monitor of operational efficiency
        const capacityPerDay = 8;
        const utilizationRate = (totalCycles / (totalMachinesCount * days * capacityPerDay)) * 100;

        // Alerts based on Diseño.md rules
        const alerts = [];
        if (utilizationRate < 20) alerts.push({ type: 'marketing', message: 'Baja demanda: Alerta marketing (< 20%)' });
        if (utilizationRate > 80) alerts.push({ type: 'expansion', message: 'Saturación: Alerta expansión (> 80%)' });

        return {
            totalIncome,
            totalExpenses,
            totalUtilityCosts: totalVariableCosts,
            netProfit,
            orderCount: filteredSales.length,
            avgTicketsValue: totalIncome / (filteredSales.length || 1),
            avgTurnsPerDay: parseFloat((totalCycles / (totalMachinesCount * days)).toFixed(2)),
            rpmd: parseFloat(rpmd.toFixed(2)),
            utilizationRate: parseFloat(utilizationRate.toFixed(1)),
            avgTurnaroundTime: parseFloat(avgTurnaroundTime.toFixed(1)),
            retentionRate: parseFloat(retentionRate.toFixed(1)),
            operatingMargin: parseFloat(operatingMargin.toFixed(1)),
            alerts,
            filteredSales,
            filteredExpenses,
            filteredMachines,
            utilityEstimates
        };
    }, [sales, expenses, machines, orders, branches, selectedBranch]);

    return metrics;
}
