import React from 'react';
import { Clock, User, DollarSign, AlertCircle } from 'lucide-react';
import { formatCurrency } from '../../utils/formatCurrency';

export default function ShiftHistoryTable({ shifts }) {
    if (!shifts || shifts.length === 0) {
        return (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center text-gray-500">
                <Clock className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>No hay registro de turnos cerrados aún.</p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100">
                <h3 className="text-lg font-bold text-washouse-navy">Historial de Turnos</h3>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-gray-600">
                    <thead className="bg-gray-50 text-xs uppercase font-semibold text-gray-500">
                        <tr>
                            <th className="px-6 py-4">Fecha / Hora</th>
                            <th className="px-6 py-4">Encargado</th>
                            <th className="px-6 py-4 text-right">Fondo Inicial</th>
                            <th className="px-6 py-4 text-right">Ventas Totales</th>
                            <th className="px-6 py-4 text-right">Total Esperado</th>
                            <th className="px-6 py-4 text-center">Estado</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {shifts.map((shift) => (
                            <tr key={shift.id} className="hover:bg-gray-50 transition-colors">
                                <td className="px-6 py-4 font-medium text-gray-900">
                                    <div className="flex items-center gap-2">
                                        <Clock className="w-4 h-4 text-gray-400" />
                                        {new Date(shift.endedAt).toLocaleString()}
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-2">
                                        <User className="w-4 h-4 text-gray-400" />
                                        {shift.closedBy || 'Desconocido'}
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-right font-medium">
                                    {formatCurrency(shift.initialCash)}
                                </td>
                                <td className="px-6 py-4 text-right font-medium text-green-600">
                                    +{formatCurrency(shift.totalSales)}
                                </td>
                                <td className="px-6 py-4 text-right font-bold text-washouse-navy">
                                    {formatCurrency(shift.expectedDrawer)}
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                        Cerrado
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
