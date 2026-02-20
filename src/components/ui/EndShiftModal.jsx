import React, { useMemo, useState } from 'react';
import { X, DollarSign, Calculator, Printer, LogOut, CreditCard, Receipt, AlertCircle, ArrowRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { printShiftTicket } from '../../utils/printShiftTicket';
import { useStorage } from '../../context/StorageContext';
import Button from './Button';
import { formatCurrency } from '../../utils/formatCurrency';
import { motion, AnimatePresence } from 'framer-motion';

export default function EndShiftModal({ isOpen, onClose }) {
    const { currentShift, endShift, user } = useAuth();
    const { sales, expenses } = useStorage();
    const [declaredCash, setDeclaredCash] = useState('');
    const [error, setError] = useState(null);
    const [isConfirming, setIsConfirming] = useState(false);

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
            setError('Por favor ingresa el dinero real en caja');
            return;
        }

        if (!isConfirming) {
            setIsConfirming(true);
            setError(null);
            return;
        }

        endShift({
            ...shiftSummary,
            finalCash,
            difference
        });
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-100 flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden flex flex-col max-h-[90vh]"
            >
                <div className="bg-washouse-navy p-6 text-white flex justify-between items-center shrink-0">
                    <div>
                        <h2 className="text-xl font-bold flex items-center gap-2">
                            Corte de Turno
                        </h2>
                        <p className="text-blue-200 text-sm mt-1">
                            {new Date().toLocaleDateString()} | {user?.name}
                        </p>
                    </div>
                    <div className="bg-white/10 p-2 rounded-full">
                        <LogOut className="w-5 h-5 text-blue-100" />
                    </div>
                </div>

                <div className="p-6 overflow-y-auto custom-scrollbar">
                    {/* Tarjetas Resumen */}
                    <div className="grid grid-cols-2 gap-4 mb-6">
                        <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 flex flex-col justify-center items-center text-center">
                            <span className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">Ventas Totales</span>
                            <div className="text-2xl font-bold text-washouse-navy">
                                {formatCurrency(shiftSummary.totalSales)}
                            </div>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 flex flex-col justify-center items-center text-center">
                            <span className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">En Caja (Teórico)</span>
                            <div className="text-2xl font-bold text-washouse-blue">
                                {formatCurrency(shiftSummary.expectedDrawer)}
                            </div>
                        </div>
                    </div>

                    {/* Desglose Estilo Recibo */}
                    <div className="bg-gray-50 rounded-xl p-4 border border-gray-200/60 mb-6 space-y-3 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-blue-300 via-purple-300 to-pink-300 opacity-30"></div>

                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Detalle de Movimientos</h3>

                        <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-600 flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-gray-400"></span>
                                Fondo Inicial
                            </span>
                            <span className="font-medium text-gray-900">{formatCurrency(shiftSummary.initialCash)}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-600 flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-green-400"></span>
                                Ventas Efectivo
                            </span>
                            <span className="font-medium text-green-700">+ {formatCurrency(shiftSummary.cashSales)}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-600 flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-red-400"></span>
                                Gastos
                            </span>
                            <span className="font-medium text-red-700">- {formatCurrency(shiftSummary.totalExpenses)}</span>
                        </div>

                        <div className="border-t border-dashed border-gray-300 my-2"></div>

                        <div className="flex justify-between items-center text-sm opacity-75">
                            <span className="text-gray-500 flex items-center gap-2">
                                <CreditCard size={12} /> Tarjeta
                            </span>
                            <span className="font-medium text-gray-700">{formatCurrency(shiftSummary.cardSales)}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm opacity-75">
                            <span className="text-gray-500 flex items-center gap-2">
                                <Receipt size={12} /> Transferencia
                            </span>
                            <span className="font-medium text-gray-700">{formatCurrency(shiftSummary.transferSales)}</span>
                        </div>
                    </div>

                    {/* Input Principal */}
                    <div className="space-y-4">
                        <label className="block text-sm font-bold text-gray-700">
                            Declarar Efectivo en Caja
                        </label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <DollarSign className="h-6 w-6 text-gray-400" />
                            </div>
                            <input
                                type="number"
                                step="any"
                                value={declaredCash}
                                onChange={(e) => {
                                    setDeclaredCash(e.target.value);
                                    if (error) setError(null);
                                    if (isConfirming) setIsConfirming(false);
                                }}
                                className="block w-full pl-12 pr-4 py-4 text-2xl font-bold text-gray-900 placeholder-gray-300 border border-gray-300 rounded-xl focus:ring-2 focus:ring-washouse-blue focus:border-washouse-blue transition-all bg-white"
                                placeholder="0.00"
                                autoFocus
                            />
                        </div>

                        {error && (
                            <div className="text-red-500 text-sm font-medium flex items-center gap-2 px-1">
                                <AlertCircle size={14} /> {error}
                            </div>
                        )}

                        {declaredCash && !error && (
                            <div className={`flex items-center justify-between p-3 rounded-lg border ${difference === 0 ? 'bg-green-50 border-green-200 text-green-800' : 'bg-yellow-50 border-yellow-200 text-yellow-800'}`}>
                                <div className="flex items-center gap-2">
                                    <AlertCircle size={16} />
                                    <span className="text-sm font-medium">Diferencia:</span>
                                </div>
                                <span className="font-bold font-mono text-lg">
                                    {difference > 0 ? '+' : ''}{formatCurrency(difference)}
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                <div className="p-6 bg-gray-50 border-t border-gray-100 flex justify-end gap-3 shrink-0">
                    <Button variant="ghost" onClick={onClose}>
                        {isConfirming ? 'Atrás' : 'Cancelar'}
                    </Button>
                    <Button variant="secondary" onClick={() => printShiftTicket({ ...shiftSummary, finalCash, difference })}>
                        <Printer className="w-4 h-4 mr-2" />
                        Imprimir
                    </Button>
                    <Button
                        onClick={handleConfirmEndShift}
                        variant={isConfirming ? "primary" : "danger"}
                        className="shadow-lg shadow-red-500/20 active:scale-95"
                    >
                        {isConfirming ? 'Sí, Cerrar Turno' : 'Cerrar Turno'}
                        <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                </div>
            </motion.div>
        </div>
    );
}
