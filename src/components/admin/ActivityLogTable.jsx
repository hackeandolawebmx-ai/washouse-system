import React, { useMemo } from 'react';
import { ClipboardList, User, Clock, AlertCircle } from 'lucide-react';

export default function ActivityLogTable({ logs }) {
    if (!logs || logs.length === 0) {
        return (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center text-gray-500">
                <ClipboardList className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>No hay actividad registrada aún.</p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100">
                <h3 className="text-lg font-bold text-washouse-navy">Registro de Actividad</h3>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-gray-600">
                    <thead className="bg-gray-50 text-xs uppercase font-semibold text-gray-500">
                        <tr>
                            <th className="px-6 py-4">Fecha / Hora</th>
                            <th className="px-6 py-4">Usuario</th>
                            <th className="px-6 py-4">Sucursal</th>
                            <th className="px-6 py-4">Acción</th>
                            <th className="px-6 py-4">Detalles</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {logs.map((log) => (
                            <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                                <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap" style={{ width: '180px' }}>
                                    <div className="flex items-center gap-2">
                                        <Clock className="w-4 h-4 text-gray-400" />
                                        {new Date(log.timestamp).toLocaleString()}
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap" style={{ width: '150px' }}>
                                    <div className="flex items-center gap-2">
                                        <User className="w-4 h-4 text-gray-400" />
                                        <span className="font-medium bg-gray-100 px-2 py-0.5 rounded text-gray-700">
                                            {log.user || 'Sistema'}
                                        </span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-xs font-bold text-gray-400 uppercase tracking-widest" style={{ width: '120px' }}>
                                    {log.branchId || 'N/A'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap" style={{ width: '200px' }}>
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${log.action.includes('ELIMINADO') ? 'bg-red-100 text-red-800' :
                                        log.action.includes('TURNO') ? 'bg-purple-100 text-purple-800' :
                                            'bg-blue-100 text-blue-800'
                                        }`}>
                                        {log.action.replace('_', ' ')}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-gray-500">
                                    {log.details}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
