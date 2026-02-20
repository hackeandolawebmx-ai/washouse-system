import { useState, useMemo } from 'react';
import Button from './ui/Button';
import { Plus, Minus, Banknote, CreditCard, ArrowLeftRight, ShoppingBag } from 'lucide-react';
import { SERVICES_CATALOG, PRODUCTS_CATALOG, PAYMENT_METHODS } from '../data/catalog';
import { formatCurrency } from '../utils/formatCurrency';

export default function NewOrderForm({ onSubmit, onCancel }) {
    const [customer, setCustomer] = useState({ name: '', phone: '' });
    const [items, setItems] = useState({});
    const [paymentMethod, setPaymentMethod] = useState('cash');
    const [activeTab, setActiveTab] = useState('services'); // services | products

    const handleQtyChange = (itemId, newValue) => {
        setItems(prev => {
            if (newValue === '' || newValue === 0) {
                const { [itemId]: _, ...rest } = prev;
                return rest;
            }
            return { ...prev, [itemId]: newValue };
        });
    };

    const calculateItemTotal = (item, value) => {
        if (!value) return 0;
        // Handle Services
        if (item.type === 'weight') {
            const weight = parseFloat(value);
            if (isNaN(weight)) return 0;
            if (weight <= item.baseKg) return item.price;
            const extraKg = weight - item.baseKg;
            return item.price + (Math.ceil(extraKg) * item.extraPrice);
        }
        // Handle Units (Services or Products)
        return item.price * value;
    };

    const total = useMemo(() => {
        return Object.entries(items).reduce((acc, [id, value]) => {
            // Search in both catalogs
            const service = SERVICES_CATALOG.find(s => s.id === id);
            const product = PRODUCTS_CATALOG.find(p => p.id === id);
            const item = service || product;

            if (!item) return acc;
            return acc + calculateItemTotal(item, value);
        }, 0);
    }, [items]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!customer.name) return;
        onSubmit({ customer, items, total, paymentMethod });
    };

    const paymentIcons = {
        'cash': <Banknote size={20} />,
        'card': <CreditCard size={20} />,
        'transfer': <ArrowLeftRight size={20} />
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">

            {/* Customer Info */}
            <div className="space-y-4">
                <h4 className="font-medium text-washouse-navy">Datos del Cliente</h4>
                <div className="grid grid-cols-1 gap-4">
                    <input
                        type="text"
                        placeholder="Nombre del Cliente *"
                        required
                        className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-washouse-blue focus:border-transparent outline-none transition-all"
                        value={customer.name}
                        onChange={e => setCustomer({ ...customer, name: e.target.value })}
                    />
                    <input
                        type="tel"
                        placeholder="Teléfono (Opcional)"
                        className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-washouse-blue focus:border-transparent outline-none transition-all"
                        value={customer.phone}
                        onChange={e => setCustomer({ ...customer, phone: e.target.value })}
                    />
                </div>
            </div>

            {/* Selection Tabs */}
            <div>
                <div className="flex border-b border-gray-200 mb-4">
                    <button
                        type="button"
                        className={`pb-2 px-4 font-medium transition-colors ${activeTab === 'services' ? 'text-washouse-blue border-b-2 border-washouse-blue' : 'text-gray-500 hover:text-gray-700'}`}
                        onClick={() => setActiveTab('services')}
                    >
                        Servicios
                    </button>
                    <button
                        type="button"
                        className={`pb-2 px-4 font-medium transition-colors ${activeTab === 'products' ? 'text-washouse-blue border-b-2 border-washouse-blue' : 'text-gray-500 hover:text-gray-700'}`}
                        onClick={() => setActiveTab('products')}
                    >
                        Productos de Venta
                    </button>
                </div>

                <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                    {activeTab === 'services' ? (
                        SERVICES_CATALOG.map(service => {
                            const value = items[service.id] || 0;
                            const isActive = value > 0;

                            return (
                                <div key={service.id} className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${isActive ? 'border-washouse-blue bg-blue-50' : 'border-gray-100 hover:bg-gray-50'}`}>
                                    <div className="flex items-center">
                                        <span className="text-2xl mr-3">{service.icon}</span>
                                        <div>
                                            <p className="font-medium text-washouse-navy">{service.name}</p>
                                            <p className="text-sm text-gray-500">
                                                {service.type === 'unit'
                                                    ? `${formatCurrency(service.price)}`
                                                    : `${formatCurrency(service.price)} base + ${formatCurrency(service.extraPrice)}/kg extra`
                                                }
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center space-x-3">
                                        {service.type === 'unit' ? (
                                            <div className="flex items-center space-x-3 bg-white rounded-lg shadow-sm border border-gray-100 p-1">
                                                <button
                                                    type="button"
                                                    className="p-1 rounded-md hover:bg-gray-100 text-gray-500 disabled:opacity-30"
                                                    onClick={() => handleQtyChange(service.id, (value || 0) - 1)}
                                                    disabled={value === 0}
                                                >
                                                    <Minus size={16} />
                                                </button>
                                                <span className="w-4 text-center font-bold text-washouse-navy">{value}</span>
                                                <button
                                                    type="button"
                                                    className="p-1 rounded-md hover:bg-gray-100 text-washouse-blue"
                                                    onClick={() => handleQtyChange(service.id, (value || 0) + 1)}
                                                >
                                                    <Plus size={16} />
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="flex items-center bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
                                                <input
                                                    type="number"
                                                    min="0"
                                                    step="0.1"
                                                    placeholder="0"
                                                    className="w-16 p-2 text-center font-bold text-washouse-navy outline-none"
                                                    value={value === 0 ? '' : value}
                                                    onChange={(e) => handleQtyChange(service.id, e.target.value)}
                                                />
                                                <span className="pr-3 text-sm text-gray-500 font-medium bg-white">kg</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        PRODUCTS_CATALOG.map(product => {
                            const value = items[product.id] || 0;
                            const isActive = value > 0;
                            return (
                                <div key={product.id} className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${isActive ? 'border-washouse-blue bg-blue-50' : 'border-gray-100 hover:bg-gray-50'}`}>
                                    <div className="flex items-center">
                                        <span className="text-2xl mr-3">{product.icon}</span>
                                        <div>
                                            <p className="font-medium text-washouse-navy">{product.name}</p>
                                            <p className="text-sm text-gray-500">{formatCurrency(product.price)} - Stock: {product.stock}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center space-x-3 bg-white rounded-lg shadow-sm border border-gray-100 p-1">
                                        <button
                                            type="button"
                                            className="p-1 rounded-md hover:bg-gray-100 text-gray-500 disabled:opacity-30"
                                            onClick={() => handleQtyChange(product.id, (value || 0) - 1)}
                                            disabled={value === 0}
                                        >
                                            <Minus size={16} />
                                        </button>
                                        <span className="w-4 text-center font-bold text-washouse-navy">{value}</span>
                                        <button
                                            type="button"
                                            className="p-1 rounded-md hover:bg-gray-100 text-washouse-blue"
                                            onClick={() => handleQtyChange(product.id, (value || 0) + 1)}
                                        >
                                            <Plus size={16} />
                                        </button>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            {/* Payment Method */}
            <div className="space-y-4">
                <h4 className="font-medium text-washouse-navy">Método de Pago</h4>
                <div className="grid grid-cols-3 gap-3">
                    {PAYMENT_METHODS.map(method => (
                        <button
                            key={method.id}
                            type="button"
                            onClick={() => setPaymentMethod(method.id)}
                            className={`flex flex-col items-center justify-center p-3 rounded-lg border transition-all ${paymentMethod === method.id
                                ? 'border-washouse-600 bg-blue-50 text-washouse-600 ring-1 ring-washouse-600'
                                : 'border-gray-200 hover:bg-gray-50 text-gray-600'
                                }`}
                        >
                            <div className="mb-2">
                                {paymentIcons[method.id] || <Banknote size={20} />}
                            </div>
                            <span className="text-sm font-medium">{method.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Total & Actions */}
            <div className="pt-4 border-t border-gray-100">
                <div className="flex justify-between items-end mb-6">
                    <span className="text-gray-500">Total Estimado</span>
                    <span className="text-3xl font-bold text-washouse-blue">{formatCurrency(total)}</span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <Button type="button" variant="secondary" onClick={onCancel}>
                        Cancelar
                    </Button>
                    <Button type="submit" disabled={total === 0 || !customer.name}>
                        Crear Orden
                    </Button>
                </div>
            </div>
        </form>
    );
}
