import { useMemo } from 'react';
import { useStorage } from '../context/StorageContext';

export function useMetrics() {
    const { sales, expenses, machines, selectedBranch } = useStorage();

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

        // 2. Core Totals
        const totalIncome = filteredSales.reduce((acc, s) => acc + (s.total || 0), 0);
        const totalExpenses = filteredExpenses.reduce((acc, e) => acc + (e.amount || 0), 0);

        // Mock Utility Estimates (based on ReportsPage logic)
        const utilityEstimates = {
            water: selectedBranch === 'all' ? 4500 : 1500,
            electricity: selectedBranch === 'all' ? 6000 : 2000,
            gas: selectedBranch === 'all' ? 9000 : 3000
        };

        const totalUtilityCosts = utilityEstimates.water + utilityEstimates.electricity + utilityEstimates.gas;
        const netProfit = totalIncome - (totalExpenses + totalUtilityCosts);

        // 3. Productivity (Turns)
        const washerCycles = filteredSales.filter(s => s.machineType === 'lavadora').length;
        const washerCount = filteredMachines.filter(m => m.type === 'lavadora').length || 1;

        // Average turns per day (assuming last 30 days for simplicity if no specific range)
        const avgTurnsPerDay = washerCycles / (washerCount * 30);

        return {
            totalIncome,
            totalExpenses,
            totalUtilityCosts,
            netProfit,
            orderCount: filteredSales.length,
            avgTicketsValue: totalIncome / (filteredSales.length || 1),
            avgTurnsPerDay: parseFloat(avgTurnsPerDay.toFixed(2)),
            filteredSales,
            filteredExpenses,
            filteredMachines,
            utilityEstimates
        };
    }, [sales, expenses, machines, selectedBranch]);

    return metrics;
}
