import { X, Calendar, Package, Clock, CheckCircle, Truck } from 'lucide-react';
import { formatCurrency } from '../../utils/formatCurrency';

export default function ClientHistoryModal({ client, isOpen, onClose }) {
    if (!isOpen || !client) return null;

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white w-full max-w-2xl rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                    <div>
                        <div className="flex items-center gap-3">
                            <h2 className="text-xl font-bold text-gray-800">{client.name}</h2>
                            {(client.weight || client.height) && (
                                <div className="flex gap-2">
                                    {client.weight && <span className="text-[10px] font-black bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full uppercase tracking-widest">{client.weight} KG</span>}
                                    {client.height && <span className="text-[10px] font-black bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full uppercase tracking-widest">{client.height} CM</span>}
                                </div>
                            )}
                        </div>
                        <div className="text-sm text-gray-500 font-mono">Historial de Servicios</div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-500">
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto flex-1 space-y-4">
                    <div className="grid grid-cols-3 gap-4 mb-6">
                        <div className="bg-blue-50 p-3 rounded-lg text-center border border-blue-100">
                            <div className="text-xs text-blue-600 font-bold uppercase">Total Gastado</div>
                            <div className="text-xl font-bold text-blue-800">{formatCurrency(client.totalSpent)}</div>
                        </div>
                        <div className="bg-purple-50 p-3 rounded-lg text-center border border-purple-100">
                            <div className="text-xs text-purple-600 font-bold uppercase">Visitas</div>
                            <div className="text-xl font-bold text-purple-800">{client.visitCount}</div>
                        </div>
                        <div className="bg-red-50 p-3 rounded-lg text-center border border-red-100">
                            <div className="text-xs text-red-600 font-bold uppercase">Deuda Actual</div>
                            <div className={`text-xl font-bold ${client.debt > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                {formatCurrency(client.debt)}
                            </div>
                        </div>
                    </div>

                    <h3 className="font-bold text-gray-700 flex items-center gap-2">
                        <Calendar size={18} /> Órdenes Pasadas ({client.orders.length})
                    </h3>

                    <div className="space-y-3">
                        {client.orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).map(order => (
                            <div key={order.id} className="border border-gray-100 rounded-xl p-4 hover:bg-gray-50 transition-colors flex flex-col md:flex-row gap-4 items-start md:items-center">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="font-mono text-xs font-bold bg-gray-100 px-2 py-0.5 rounded text-gray-600">{order.id}</span>
                                        <span className="text-xs text-gray-400">{new Date(order.createdAt).toLocaleDateString()} {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                    </div>
                                    <div className="text-sm text-gray-600">
                                        {order.items.map(i => `${i.quantity} ${i.name}`).join(', ')}
                                    </div>
                                </div>

                                <div className="flex items-center gap-4 text-sm">
                                    <div className="text-right">
                                        <div className="font-bold">{formatCurrency(order.totalAmount)}</div>
                                        {order.balanceDue > 0 ? (
                                            <div className="text-red-500 font-bold text-xs">Debía: {formatCurrency(order.balanceDue)}</div>
                                        ) : (
                                            <div className="text-green-600 text-xs font-bold">Pagado</div>
                                        )}
                                    </div>

                                    <div className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 w-28 justify-center
                                        ${order.status === 'DELIVERED' ? 'bg-gray-100 text-gray-600' :
                                            order.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                                                'bg-blue-100 text-blue-700'}`}>
                                        {order.status === 'DELIVERED' && <Truck size={12} />}
                                        {order.status === 'COMPLETED' && <CheckCircle size={12} />}
                                        {order.status === 'RECEIVED' && <Clock size={12} />}
                                        {order.status}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
