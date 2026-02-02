import { useState } from 'react';
import { X, DollarSign, Tag, FileText } from 'lucide-react';

export default function ExpenseModal({ isOpen, onClose, onSave }) {
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState('insumos');

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!amount || !description) return;

        onSave({
            amount: parseFloat(amount),
            description,
            category
        });

        // Reset
        setAmount('');
        setDescription('');
        setCategory('insumos');
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white w-full max-w-sm rounded-2xl shadow-xl overflow-hidden">
                <div className="bg-red-50 px-6 py-4 border-b border-red-100 flex justify-between items-center">
                    <h2 className="text-lg font-bold text-red-800">Registrar Gasto</h2>
                    <button onClick={onClose} className="p-2 hover:bg-red-100 rounded-full transition-colors text-red-500">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                            <DollarSign size={14} /> Monto
                        </label>
                        <input
                            type="number"
                            min="0"
                            step="0.01"
                            required
                            value={amount}
                            onChange={e => setAmount(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none text-lg font-bold"
                            placeholder="0.00"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                            <FileText size={14} /> Descripción
                        </label>
                        <input
                            type="text"
                            required
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none"
                            placeholder="Ej. Jabón liquido, Comida staff..."
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                            <Tag size={14} /> Categoría
                        </label>
                        <select
                            value={category}
                            onChange={e => setCategory(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none bg-white"
                        >
                            <option value="insumos">Insumos / Limpieza</option>
                            <option value="alimentos">Alimentos / Bebidas</option>
                            <option value="mantenimiento">Mantenimiento</option>
                            <option value="servicios">Pago Servicios (Luz/Agua)</option>
                            <option value="otros">Otros</option>
                        </select>
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-red-600 text-white py-3 rounded-lg font-bold hover:bg-red-700 transition-colors shadow-lg shadow-red-200"
                    >
                        Guardar Gasto
                    </button>
                </form>
            </div>
        </div>
    );
}
