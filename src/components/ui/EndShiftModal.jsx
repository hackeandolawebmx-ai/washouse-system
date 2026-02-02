import React, { useMemo, useState } from 'react';
import { X, DollarSign, Calculator, Printer } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { printShiftTicket } from '../../utils/printShiftTicket';
import { useStorage } from '../../context/StorageContext';
import Button from './Button';
import { LogOut, CreditCard, Receipt } from 'lucide-react';
import { formatCurrency } from '../../utils/formatCurrency';

export default function EndShiftModal({ isOpen, onClose }) {
    const { currentShift, endShift, user } = useAuth();
    const { sales, expenses } = useStorage();
    const [declaredCash, setDeclaredCash] = useState('');

    const shiftSummary = useMemo(() => {
        if (!currentShift) return null;

        const shiftStart = new Date(currentShift.startTime);

        // Filter sales belonging to this shift
        const shiftSales = sales.filter(sale => new Date(sale.date) >= shiftStart);

        const summary = {
            totalSales: 0,
            cashSales: 0,
            cardSales: 0,
            transferSales: 0,
            saleCount: shiftSales.length,
            initialCash: currentShift.initialCash,
        };

        shiftSales.forEach(sale => {
            const amount = parseFloat(sale.total);
            summary.totalSales += amount;

            if (sale.paymentMethod === 'cash') summary.cashSales += amount;
            else if (sale.paymentMethod === 'card') summary.cardSales += amount;
            else summary.transferSales += amount;
        });

        // Calculate Expenses for this shift
        const shiftExpenses = expenses ? expenses.filter(e => new Date(e.timestamp) >= shiftStart && (!currentShift.endTime || new Date(e.timestamp) <= new Date(currentShift.endTime))) : [];

        // Sum total, but also split by method if needed
        summary.totalExpenses = shiftExpenses.reduce((acc, e) => acc + e.amount, 0);

        summary.expectedDrawer = summary.initialCash + summary.cashSales - summary.totalExpenses;

        return summary;
    }, [currentShift, sales, expenses]);

    if (!isOpen || !shiftSummary) return null;

    const finalCash = parseFloat(declaredCash) || 0;
    const difference = finalCash - shiftSummary.expectedDrawer;

    const handleConfirmEndShift = () => {
        if (!declaredCash) {
            alert('Por favor ingresa el dinero real en caja');
            return;
        }

        if (confirm('¿Estás seguro de que deseas cerrar el turno y salir?')) {
            endShift({
                ...shiftSummary,
                finalCash,
                difference
            });
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 bg-washouse-navy/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden animate-fadeIn">
                <div className="bg-washouse-navy p-6 text-white flex justify-between items-center">
                    <div>
                        <h2 className="text-xl font-bold">Corte de Caja</h2>
                        <p className="text-blue-200 text-sm">Resumen del turno de {user?.name}</p>
                    </div>
                    <div className="bg-white/10 p-2 rounded-lg">
                        <LogOut className="w-6 h-6" />
                    </div>
                </div>

                <div className="p-6 space-y-6">
                    {/* Resumen Principal */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                            <span className="text-sm text-blue-600 font-bold uppercase tracking-wider">Fondo Inicial</span>
                            <div className="text-2xl font-bold text-washouse-navy mt-1">
                                {formatCurrency(shiftSummary.initialCash)}
                            </div>
                        </div>
                        <div className="bg-green-50 p-4 rounded-xl border border-green-100">
                            <span className="text-sm text-green-600 font-bold uppercase tracking-wider">Ventas Totales</span>
                            <div className="text-2xl font-bold text-green-700 mt-1">
                                {formatCurrency(shiftSummary.totalSales)}
                            </div>
                        </div>
                    </div>

                    {/* Desglose */}
                    <div className="border-t border-gray-100 pt-4 space-y-3">
                        <h3 className="font-bold text-washouse-navy mb-2">Desglose por Método de Pago</h3>

                        <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center text-gray-700">
                                <DollarSign className="w-5 h-5 mr-3 text-green-600" />
                                <span>Efectivo (Ventas)</span>
                            </div>
                            <span className="font-bold text-gray-900">+ {formatCurrency(shiftSummary.cashSales)}</span>
                        </div>

                        <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                            <div className="flex items-center text-red-700">
                                <DollarSign className="w-5 h-5 mr-3 text-red-600" />
                                <span>Gastos (Salidas)</span>
                            </div>
                            <span className="font-bold text-red-900">- {formatCurrency(shiftSummary.totalExpenses)}</span>
                        </div>

                        <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center text-gray-700">
                                <CreditCard className="w-5 h-5 mr-3 text-blue-600" />
                                <span>Tarjeta</span>
                            </div>
                            <span className="font-bold text-gray-900">{formatCurrency(shiftSummary.cardSales)}</span>
                        </div>

                        <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center text-gray-700">
                                <Receipt className="w-5 h-5 mr-3 text-purple-600" />
                                <span>Transferencia</span>
                            </div>
                            <span className="font-bold text-gray-900">{formatCurrency(shiftSummary.transferSales)}</span>
                        </div>
                    </div>

                    {/* Input de Dinero Real y Calculo */}
                    <div className="space-y-4">
                        <div className="p-4 bg-gray-50 rounded-lg space-y-4">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Total Esperado en Caja:</span>
                                <span className="font-bold text-lg">{formatCurrency(shiftSummary.expectedDrawer)}</span>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Dinero Real en Caja</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-2.5 text-gray-500">$</span>
                                    <input
                                        type="number"
                                        step="0.1"
                                        value={declaredCash}
                                        onChange={(e) => setDeclaredCash(e.target.value)}
                                        className="w-full pl-7 pr-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-washouse-blue focus:border-transparent"
                                        placeholder="0.00"
                                    />
                                </div>
                            </div>

                            <div className={`flex justify-between text-sm font-bold pt-2 border-t border-gray-200 ${difference < 0 ? 'text-red-500' : 'text-green-500'
                                }`}>
                                <span>Diferencia:</span>
                                <span>{difference > 0 ? '+' : ''}{formatCurrency(difference)}</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 mt-6">
                        <Button variant="secondary" onClick={onClose}>
                            Cancelar
                        </Button>
                        <Button variant="secondary" onClick={() => printShiftTicket({ ...shiftSummary, finalCash, difference })}>
                            <Printer className="w-4 h-4 mr-2" />
                            Imprimir Corte
                        </Button>
                        <Button onClick={handleConfirmEndShift} variant="primary">
                            Confirmar Cierre
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
