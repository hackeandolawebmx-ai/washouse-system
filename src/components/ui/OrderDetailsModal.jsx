import { X, Phone, Clock, DollarSign, Package } from 'lucide-react';
import StatusBadge from './StatusBadge';
import { printServiceTicket } from '../../utils/printServiceTicket';
import { useStorage } from '../../context/StorageContext';
import { formatCurrency } from '../../utils/formatCurrency';

export default function OrderDetailsModal({ order }) {
    if (!order) return <div className="p-4 text-center text-gray-500">No hay información de orden disponible</div>;

    return (
        <div className="space-y-6">
            {/* Header info provided by parent Modal, we just show Order ID context if needed or metadata */}
            <div className="flex items-center gap-2 text-sm text-gray-500">
                <Clock size={14} /> {new Date(order.createdAt).toLocaleString()}
                <span className="mx-2">•</span>
                <span className="font-mono">ID: {order.id}</span>
            </div>

            {/* Customer Info */}
            <div className="flex items-center gap-4 bg-gray-50 p-4 rounded-xl">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
                    <Phone size={20} />
                </div>
                <div>
                    <div className="font-bold">{order.customerName}</div>
                    <div className="text-sm text-gray-500">{order.customerPhone || 'Sin teléfono'}</div>
                </div>
                <div className="ml-auto">
                    <StatusBadge status={order.status} />
                </div>
            </div>

            {/* Items */}
            <div>
                <h3 className="font-bold text-gray-700 mb-3 flex items-center gap-2"><Package size={18} /> Detalle de Servicios</h3>
                <div className="space-y-2">
                    {(Array.isArray(order.items) ? order.items : []).map((item, i) => (
                        <div key={i} className="flex justify-between text-sm border-b pb-2 last:border-0">
                            <span>{item.quantity} {item.type === 'weight' ? 'kg' : 'pz'} x {item.name}</span>
                            <span className="font-medium">{formatCurrency(item.price * item.quantity)}</span>
                        </div>
                    ))}
                    {(!order.items || order.items.length === 0) && (
                        <div className="text-sm text-gray-400 italic">No hay items registrados</div>
                    )}
                </div>
            </div>

            {/* Financials */}
            <div className="bg-gray-50 p-4 rounded-xl space-y-2">
                <div className="flex justify-between text-gray-600">
                    <span>Total Orden</span>
                    <span className="font-bold">{formatCurrency(order.totalAmount)}</span>
                </div>
                <div className="flex justify-between text-green-600">
                    <span>Anticipo Pagado</span>
                    <span>-{formatCurrency(order.advancePayment)}</span>
                </div>
                <div className="flex justify-between text-red-600 text-lg font-bold pt-2 border-t border-gray-200">
                    <span>Saldo Pendiente</span>
                    <span>{formatCurrency(order.balanceDue)}</span>
                </div>
            </div>

            {/* Actions Footer */}
            <div className="flex gap-3 pt-2 overflow-x-auto pb-2">
                <a
                    href={`https://wa.me/52${(order.customerPhone || '').replace(/\D/g, '')}?text=${encodeURIComponent(
                        order.status === 'DELIVERED'
                            ? `Hola ${order.customerName}, gracias por su preferencia!`
                            : `Hola ${order.customerName}, tu orden *${order.id}* está ${order.status}`
                    )}`}
                    target="_blank"
                    rel="noreferrer"
                    className={`flex-1 bg-green-100 text-green-700 border border-green-200 px-4 py-2 rounded-lg font-bold hover:bg-green-200 text-sm flex items-center justify-center gap-2 ${!order.customerPhone ? 'opacity-50 pointer-events-none' : ''}`}
                >
                    WhatsApp
                </a>
                <button onClick={() => printServiceTicket(order)} className="flex-1 bg-washouse-blue text-white px-4 py-2 rounded-lg font-bold shadow-sm hover:bg-blue-700 text-sm">
                    Reimprimir Ticket
                </button>
            </div>
        </div>
    );
}
