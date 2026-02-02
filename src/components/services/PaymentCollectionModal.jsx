import { useState } from 'react';
import { DollarSign, CreditCard, Banknote, X } from 'lucide-react';
import { useStorage } from '../../context/StorageContext';
import { formatCurrency } from '../../utils/formatCurrency';

export default function PaymentCollectionModal({ order, isOpen, onClose, onPaymentComplete }) {
    const { addOrderPayment } = useStorage();
    const [amount, setAmount] = useState(order?.balanceDue || 0);
    const [method, setMethod] = useState('cash');

    if (!isOpen || !order) return null;

    const handlePayment = () => {
        const payAmount = parseFloat(amount);
        if (payAmount <= 0) return alert('Monto inválido');
        if (payAmount > order.balanceDue) return alert('El monto excede el saldo pendiente');

        addOrderPayment(order.id, payAmount, method);

        if (onPaymentComplete) {
            onPaymentComplete(payAmount); // Callback to parent
        }
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white w-full max-w-md rounded-2xl shadow-xl animate-in zoom-in-95 duration-200 overflow-hidden">
                <div className="bg-gray-50 px-6 py-4 border-b flex justify-between items-center">
                    <h3 className="text-lg font-bold text-washouse-navy flex items-center gap-2">
                        <DollarSign className="text-green-600" /> Cobrar Saldo Pendiente
                    </h3>
                    <button onClick={onClose}><X className="text-gray-400 hover:text-gray-600" /></button>
                </div>

                <div className="p-6 space-y-6">
                    <div className="bg-blue-50 p-4 rounded-xl text-center">
                        <div className="text-sm text-blue-600 font-medium uppercase tracking-wide">Saldo a Pagar</div>
                        <div className="text-4xl font-bold text-blue-800 mt-1">{formatCurrency(order.balanceDue)}</div>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Monto a Cobrar</label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-bold">$</span>
                                <input
                                    type="number"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    className="w-full pl-8 p-3 border rounded-lg text-xl font-bold focus:ring-2 ring-washouse-blue"
                                    max={order.balanceDue}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Método de Pago</label>
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    onClick={() => setMethod('cash')}
                                    className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition-all ${method === 'cash' ? 'bg-green-50 border-green-500 text-green-700 ring-1 ring-green-500' : 'hover:bg-gray-50'}`}
                                >
                                    <Banknote size={24} />
                                    <span className="font-bold">Efectivo</span>
                                </button>
                                <button
                                    onClick={() => setMethod('card')}
                                    className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition-all ${method === 'card' ? 'bg-blue-50 border-blue-500 text-blue-700 ring-1 ring-blue-500' : 'hover:bg-gray-50'}`}
                                >
                                    <CreditCard size={24} />
                                    <span className="font-bold">Tarjeta</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-6 border-t bg-gray-50 flex gap-3">
                    <button onClick={onClose} className="flex-1 py-3 rounded-xl border border-gray-300 font-bold text-gray-600 hover:bg-white transition-colors">Cancelar</button>
                    <button onClick={handlePayment} className="flex-1 py-3 rounded-xl bg-green-600 text-white font-bold hover:bg-green-700 shadow-lg transition-all">
                        Cobrar y Entregar
                    </button>
                </div>
            </div>
        </div>
    );
}
