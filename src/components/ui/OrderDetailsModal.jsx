import { X, Phone, Clock, DollarSign, Package } from 'lucide-react';
import StatusBadge from './StatusBadge';
import { printServiceTicket } from '../../utils/printServiceTicket';
import { useStorage } from '../../context/StorageContext';
import { formatCurrency } from '../../utils/formatCurrency';

export default function OrderDetailsModal({ order, isOpen, onClose }) {
    if (!isOpen || !order) return null;

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl animate-in zoom-in-95 duration-200">
                <div className="p-6 border-b flex justify-between items-start">
                    <div>
                        <h2 className="text-xl font-bold text-washouse-navy">Orden {order.id}</h2>
                        <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                            <Clock size={14} /> {new Date(order.createdAt).toLocaleString()}
                        </div>
                    </div>
                    <button onClick={onClose}><X className="text-gray-400 hover:text-gray-600" /></button>
                </div>

                <div className="p-6 space-y-6">
                    {/* Customer Info */}
                    <div className="flex items-center gap-4 bg-gray-50 p-4 rounded-xl">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
                            <Phone size={20} />
                        </div>
                        <div>
                            <div className="font-bold">{order.customerName}</div>
                            <div className="text-sm text-gray-500">{order.customerPhone}</div>
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
                                    <span>{item.quantity} x {item.name}</span>
                                    <span className="font-medium">{formatCurrency(item.price * item.quantity)}</span>
                                </div>
                            ))}
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
                </div>

                <div className="p-6 border-t bg-gray-50 rounded-b-2xl flex justify-end gap-3">
                    <button className="text-gray-600 font-medium hover:underline text-sm">Ver Historial</button>
                    <button onClick={onClose} className="bg-white border hover:bg-gray-50 px-4 py-2 rounded-lg font-medium text-sm">Cerrar</button>
                    <a
                        href={`https://wa.me/52${order.customerPhone.replace(/\D/g, '')}?text=${encodeURIComponent(
                            order.status === 'DELIVERED'
                                ? `Hola ${order.customerName}, gracias por confiar en *${useStorage().branches.find(b => b.id === order.branchId)?.name || 'Washouse'}*! Esperamos verte pronto.`
                                : `Hola ${order.customerName}, tu orden *${order.id}* está ${order.status === 'COMPLETED' ? 'LISTA para entrega' : 'en proceso'} en *${useStorage().branches.find(b => b.id === order.branchId)?.name || 'Washouse'}*. Total: ${formatCurrency(order.totalAmount)}. Saldo: ${formatCurrency(order.balanceDue)}.`
                        )}`}
                        target="_blank"
                        rel="noreferrer"
                        className="bg-green-100 text-green-700 border border-green-200 px-4 py-2 rounded-lg font-bold hover:bg-green-200 text-sm flex items-center gap-2"
                    >
                        WhatsApp
                    </a>
                    <button onClick={() => printServiceTicket(order)} className="bg-washouse-blue text-white px-4 py-2 rounded-lg font-bold shadow-sm hover:bg-blue-700 text-sm">Imprimir Ticket</button>
                </div>
            </div>
        </div>
    );
}
