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
            <div className="bg-white/80 backdrop-blur-xl w-full max-w-md rounded-[32px] shadow-2xl animate-in zoom-in-95 duration-500 overflow-hidden border border-white/20">
                <div className="bg-gray-50/50 px-8 py-6 border-b flex justify-between items-center backdrop-blur-md">
                    <h3 className="text-xl font-black text-washouse-navy flex items-center gap-3 italic tracking-tighter">
                        <div className="p-2 bg-green-50 rounded-xl text-green-500 shadow-inner">
                            <DollarSign size={20} />
                        </div>
                        Cobro de Saldo
                    </h3>
                    <button onClick={onClose} className="p-2.5 hover:bg-gray-100 rounded-full transition-all border shadow-sm bg-white"><X size={20} className="text-gray-400" /></button>
                </div>

                <div className="p-8 space-y-8">
                    <div className="bg-washouse-blue/5 p-6 rounded-3xl text-center border border-washouse-blue/20 shadow-inner relative overflow-hidden">
                        <div className="absolute -right-4 -bottom-4 opacity-5 pointer-events-none">
                            <DollarSign size={80} className="text-washouse-blue" />
                        </div>
                        <div className="text-[10px] text-washouse-blue/60 font-black uppercase tracking-[0.2em] mb-2">Liquidación Pendiente</div>
                        <div className="text-5xl font-black text-washouse-blue tracking-tighter">{formatCurrency(order.balanceDue)}</div>
                    </div>

                    <div className="space-y-6">
                        <div>
                            <label className="block text-[10px] font-black text-gray-400 mb-3 uppercase tracking-widest px-1">Importe a Recibir</label>
                            <div className="relative group">
                                <span className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300 text-3xl font-black italic group-focus-within:text-washouse-blue transition-colors">$</span>
                                <input
                                    type="number"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    className="w-full pl-12 p-6 bg-gray-50 border border-gray-100 rounded-3xl text-4xl font-black focus:ring-8 ring-washouse-blue/5 outline-none transition-all focus:border-washouse-blue/30 focus:bg-white tracking-tighter"
                                    max={order.balanceDue}
                                    autoFocus
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-[10px] font-black text-gray-400 mb-3 uppercase tracking-widest px-1">Método Sugerido</label>
                            <div className="grid grid-cols-2 gap-4">
                                <button
                                    onClick={() => setMethod('cash')}
                                    className={`p-5 rounded-2xl border-2 flex flex-col items-center gap-3 transition-all duration-300 ${method === 'cash' ? 'bg-green-50 border-green-500 text-green-700 ring-8 ring-green-500/10' : 'border-gray-100 hover:border-gray-300 text-gray-400 bg-white'}`}
                                >
                                    <Banknote size={28} />
                                    <span className="text-[10px] font-black uppercase tracking-widest">Efectivo</span>
                                </button>
                                <button
                                    onClick={() => setMethod('card')}
                                    className={`p-5 rounded-2xl border-2 flex flex-col items-center gap-3 transition-all duration-300 ${method === 'card' ? 'bg-blue-50 border-blue-500 text-blue-700 ring-8 ring-blue-500/10' : 'border-gray-100 hover:border-gray-300 text-gray-400 bg-white'}`}
                                >
                                    <CreditCard size={28} />
                                    <span className="text-[10px] font-black uppercase tracking-widest">Tarjeta</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-8 border-t bg-gray-50/50 flex gap-4 backdrop-blur-sm">
                    <button onClick={onClose} className="flex-1 py-4 rounded-xl border border-gray-200 font-black text-[10px] uppercase tracking-widest text-gray-400 hover:bg-white transition-all">Descartar</button>
                    <button
                        onClick={handlePayment}
                        className="flex-[1.5] py-4 rounded-xl bg-green-500 text-white font-black text-xs uppercase tracking-[0.2em] hover:bg-green-600 shadow-xl shadow-green-500/20 active:scale-95 transition-all"
                    >
                        Completar Entrega
                    </button>
                </div>
            </div>
        </div>
    );
}
