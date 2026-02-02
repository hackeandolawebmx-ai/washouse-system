import { useState, useMemo } from 'react';
import { useStorage } from '../../context/StorageContext';
import { useAuth } from '../../context/AuthContext';
import { SERVICES_CATALOG, SERVICE_LEVELS } from '../../data/catalog';
import { X, Search, ShoppingBag, Truck, Calendar, DollarSign, User, Phone, Check } from 'lucide-react';
import { formatCurrency } from '../../utils/formatCurrency';

export default function NewOrderWizard({ isOpen, onClose }) {
    const { createOrder, deviceBranchId, branches } = useStorage();
    const { user } = useAuth(); // Get authenticated user
    const [step, setStep] = useState(1);

    // Form State
    const [customer, setCustomer] = useState({ name: '', phone: '' });
    const [items, setItems] = useState([]);
    const [serviceLevel, setServiceLevel] = useState('standard');
    const [payment, setPayment] = useState({ advance: 0, method: 'cash' });

    // Step 1: Customer Search / Input
    const renderCustomerStep = () => (
        <div className="space-y-6">
            <h3 className="text-xl font-bold flex items-center gap-2"><User /> Datos del Cliente</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nombre Completo</label>
                    <input
                        type="text"
                        value={customer.name}
                        onChange={e => setCustomer({ ...customer, name: e.target.value })}
                        className="w-full p-3 border rounded-lg text-lg focus:ring-2 ring-washouse-blue"
                        placeholder="Ej. Juan Pérez"
                        autoFocus
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono (WhatsApp)</label>
                    <input
                        type="tel"
                        value={customer.phone}
                        onChange={e => setCustomer({ ...customer, phone: e.target.value })}
                        className="w-full p-3 border rounded-lg text-lg focus:ring-2 ring-washouse-blue"
                        placeholder="Ej. 811 123 4567"
                    />
                </div>
            </div>
            {/* Future: Quick Search List matches */}
        </div>
    );

    // Step 2: Add Services
    const addToOrder = (service) => {
        setItems(prev => {
            const existing = prev.find(i => i.serviceId === service.id);
            // Default 1 unit or Base Kg for weight services
            const initialQty = service.type === 'weight' ? service.baseKg : 1;

            if (existing) {
                if (service.type === 'unit') {
                    return prev.map(i => i.serviceId === service.id ? { ...i, quantity: i.quantity + 1 } : i);
                }
                return prev;
            }
            return [...prev, {
                serviceId: service.id,
                quantity: initialQty,
                basePrice: service.price, // Store catalog price info
                name: service.name,
                type: service.type,
                baseKg: service.baseKg,
                extraPrice: service.extraPrice
            }];
        });
    };

    const updateQuantity = (index, value) => {
        setItems(prev => {
            const newItems = [...prev];
            const item = newItems[index];
            const val = parseFloat(value);
            if (isNaN(val) || val < 0) return prev;

            item.quantity = val;
            return newItems;
        });
    };

    const calculateItemTotal = (item) => {
        if (item.type === 'weight') {
            // Logic: Base Price covers up to baseKg. Extra weight is charged at extraPrice
            if (item.quantity <= item.baseKg) {
                return item.basePrice;
            } else {
                const extraKg = item.quantity - item.baseKg;
                return item.basePrice + (extraKg * item.extraPrice);
            }
        }
        return item.basePrice * item.quantity;
    };

    const removeItem = (index) => {
        setItems(prev => prev.filter((_, i) => i !== index));
    };

    const renderServicesStep = () => (
        <div className="space-y-6 h-full flex flex-col">
            <h3 className="text-xl font-bold flex items-center gap-2"><ShoppingBag /> Agregar Servicios</h3>

            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6 overflow-hidden">
                {/* Catalog */}
                <div className="overflow-y-auto pr-2 space-y-2">
                    {SERVICES_CATALOG.map(service => (
                        <button
                            key={service.id}
                            onClick={() => addToOrder(service)}
                            className="w-full flex items-center justify-between p-4 border rounded-xl hover:bg-blue-50 hover:border-blue-200 transition-all text-left group"
                        >
                            <div className="flex items-center gap-3">
                                <span className="text-2xl">{service.icon}</span>
                                <div>
                                    <div className="font-bold text-gray-800">{service.name}</div>
                                    <div className="text-xs text-gray-500 uppercase">
                                        {service.type === 'weight' ? `Base ${service.baseKg}kg + ${formatCurrency(service.extraPrice)}/kg extra` : 'Por Pieza'}
                                    </div>
                                </div>
                            </div>
                            <div className="font-bold text-washouse-blue">{formatCurrency(service.price)}</div>
                        </button>
                    ))}
                </div>

                {/* Current Order List */}
                <div className="bg-gray-50 rounded-xl p-4 flex flex-col h-full overflow-hidden">
                    <h4 className="font-bold text-gray-600 mb-4">Resumen de Orden</h4>
                    {items.length === 0 && (
                        <div className="text-center text-gray-400 py-10">Agrega servicios del menú</div>
                    )}
                    {items.map((item, idx) => (
                        <div key={idx} className="bg-white p-3 rounded-lg shadow-sm flex items-center justify-between gap-3">
                            <div className="flex-1">
                                <div className="font-medium">{item.name}</div>
                                <div className="text-sm text-gray-500">
                                    {item.type === 'weight'
                                        ? item.quantity <= item.baseKg
                                            ? `Base ${formatCurrency(item.basePrice)}`
                                            : `Base ${formatCurrency(item.basePrice)} + ${(item.quantity - item.baseKg).toFixed(2)}kg extra`
                                        : `${formatCurrency(item.basePrice)} x ${item.quantity}`
                                    }
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <div className="flex items-center bg-gray-100 rounded-lg p-1">
                                    {item.type === 'unit' ? (
                                        <>
                                            <button onClick={() => updateQuantity(idx, item.quantity - 1)} className="w-8 h-8 flex items-center justify-center font-bold hover:bg-white rounded">-</button>
                                            <span className="w-8 text-center font-bold">{item.quantity}</span>
                                            <button onClick={() => updateQuantity(idx, item.quantity + 1)} className="w-8 h-8 flex items-center justify-center font-bold hover:bg-white rounded">+</button>
                                        </>
                                    ) : (
                                        <div className="relative">
                                            <input
                                                type="number"
                                                step="0.1"
                                                min="0"
                                                value={item.quantity}
                                                onChange={(e) => updateQuantity(idx, e.target.value)}
                                                className="w-20 text-center font-bold bg-transparent outline-none border-b-2 border-gray-300 focus:border-washouse-blue"
                                            />
                                            <span className="text-xs text-gray-500 absolute right-0 -bottom-3">kg</span>
                                        </div>
                                    )}
                                </div>
                                <div className="font-bold text-washouse-blue w-20 text-right">
                                    {formatCurrency(calculateItemTotal(item))}
                                </div>
                            </div>

                            <button onClick={() => removeItem(idx)} className="text-red-400 hover:text-red-500"><X size={18} /></button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );

    // Step 3: Confirmation & Payment
    const totals = useMemo(() => {
        const subtotal = items.reduce((acc, item) => acc + calculateItemTotal(item), 0);
        const level = SERVICE_LEVELS.find(l => l.id === serviceLevel);
        const total = subtotal * (level ? level.multiplier : 1);
        const minAdvance = total * 0.5; // 50% required
        return { subtotal, total, minAdvance };
    }, [items, serviceLevel]);

    const [createdOrder, setCreatedOrder] = useState(null);

    const handleCreateOrder = () => {
        if (!customer.name || !customer.phone) return alert('Datos de cliente incompletos');
        if (items.length === 0) return alert('Orden vacía');
        if (payment.advance < totals.minAdvance) return alert(`El anticipo mínimo es ${formatCurrency(totals.minAdvance)}`);

        const newOrder = createOrder({
            customerName: customer.name,
            customerPhone: customer.phone,
            items,
            serviceLevel,
            totalAmount: totals.total,
            advancePayment: parseFloat(payment.advance),
            balanceDue: totals.total - parseFloat(payment.advance),
            paymentMethod: payment.method,
            branchId: deviceBranchId
        }, user?.name || 'Host'); // Pass actual user name
        setCreatedOrder(newOrder);
        setStep(4); // Success Step
    };

    const renderSuccessStep = () => {
        if (!createdOrder) return null;

        const branchName = branches.find(b => b.id === deviceBranchId)?.name || 'Washouse';

        const waLink = `https://wa.me/52${createdOrder.customerPhone.replace(/\D/g, '')}?text=${encodeURIComponent(`Hola ${createdOrder.customerName}, tu orden *${createdOrder.id}* ha sido recibida en *${branchName}*. Total: ${formatCurrency(createdOrder.totalAmount)}. Anticipo: ${formatCurrency(createdOrder.advancePayment)}. Te avisaremos cuando esté lista!`)}`;

        return (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-6 animate-in zoom-in-95">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center text-green-600 mb-2">
                    <Check size={40} strokeWidth={3} />
                </div>
                <div>
                    <h3 className="text-2xl font-bold text-gray-800">¡Orden Creada con Éxito!</h3>
                    <p className="text-gray-500 mt-1">ID de Orden: <span className="font-mono font-bold text-gray-700">{createdOrder.id}</span></p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-md">
                    <button
                        onClick={() => import('../../utils/printServiceTicket').then(m => m.printServiceTicket(createdOrder))}
                        className="flex flex-col items-center justify-center gap-2 p-6 bg-white border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all group"
                    >
                        <ShoppingBag size={32} className="text-gray-400 group-hover:text-blue-500" />
                        <span className="font-bold text-gray-700 group-hover:text-blue-700">Imprimir Ticket</span>
                    </button>

                    <a
                        href={waLink}
                        target="_blank"
                        rel="noreferrer"
                        className="flex flex-col items-center justify-center gap-2 p-6 bg-white border-2 border-gray-200 rounded-xl hover:border-green-500 hover:bg-green-50 transition-all group"
                    >
                        <User size={32} className="text-gray-400 group-hover:text-green-500" />
                        <span className="font-bold text-gray-700 group-hover:text-green-700">Notificar WhatsApp</span>
                    </a>
                </div>

                <button onClick={onClose} className="text-gray-500 hover:text-gray-800 underline mt-4">
                    Cerrar y volver al tablero
                </button>
            </div>
        );
    };

    const renderPaymentStep = () => (
        <div className="space-y-6">
            <h3 className="text-xl font-bold flex items-center gap-2"><DollarSign /> Confirmar y Pagar</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Nivel de Servicio</label>
                        <div className="grid grid-cols-2 gap-3">
                            {SERVICE_LEVELS.map(level => (
                                <button
                                    key={level.id}
                                    onClick={() => setServiceLevel(level.id)}
                                    className={`p-3 rounded-lg border-2 text-left transition-all ${serviceLevel === level.id ? 'border-washouse-blue bg-blue-50 ring-1 ring-blue-500' : 'border-gray-200 hover:border-gray-300'}`}
                                >
                                    <div className="font-bold">{level.name}</div>
                                    <div className="text-xs text-gray-500">
                                        {level.id === 'express' ? '+30% Cargo' : 'Tarifa Normal'}
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-xl space-y-2">
                        <div className="flex justify-between text-gray-600">
                            <span>Subtotal</span>
                            <span>{formatCurrency(totals.subtotal)}</span>
                        </div>
                        {serviceLevel === 'express' && (
                            <div className="flex justify-between text-orange-600 text-sm">
                                <span>Cargo Express (+30%)</span>
                                <span>+{formatCurrency(totals.total - totals.subtotal)}</span>
                            </div>
                        )}
                        <div className="flex justify-between font-bold text-xl pt-2 border-t">
                            <span>Total</span>
                            <span>{formatCurrency(totals.total)}</span>
                        </div>
                        <div className="flex justify-between text-blue-600 text-sm font-medium">
                            <span>Anticipo Mínimo (50%)</span>
                            <span>{formatCurrency(totals.minAdvance)}</span>
                        </div>
                    </div>
                </div>

                <div className="space-y-4 border-l pl-8">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Anticipo Recibido</label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                            <input
                                type="number"
                                value={payment.advance}
                                onChange={e => setPayment({ ...payment, advance: e.target.value })}
                                className="w-full pl-8 p-3 border rounded-lg text-2xl font-bold focus:ring-2 ring-washouse-blue"
                                placeholder="0.00"
                                max={totals.total}
                            />
                        </div>
                        <div className="flex gap-2 mt-2">
                            <button onClick={() => setPayment({ ...payment, advance: totals.total })} className="text-xs bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded">100%</button>
                            <button onClick={() => setPayment({ ...payment, advance: totals.minAdvance })} className="text-xs bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded">50%</button>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Método de Pago</label>
                        <div className="flex gap-3">
                            <button onClick={() => setPayment({ ...payment, method: 'cash' })} className={`flex-1 p-2 rounded border ${payment.method === 'cash' ? 'bg-green-50 border-green-500 text-green-700' : ''}`}>Efectivo</button>
                            <button onClick={() => setPayment({ ...payment, method: 'card' })} className={`flex-1 p-2 rounded border ${payment.method === 'card' ? 'bg-blue-50 border-blue-500 text-blue-700' : ''}`}>Tarjeta</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white w-full max-w-4xl h-[80vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="bg-gray-50 px-6 py-4 border-b flex justify-between items-center">
                    <h2 className="text-xl font-bold text-washouse-navy">Nueva Orden de Servicio</h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                        <X size={24} className="text-gray-500" />
                    </button>
                </div>

                {/* Progress Bar */}
                <div className="flex w-full h-1 bg-gray-100">
                    <div className={`h-full bg-washouse-blue transition-all duration-300 ${step === 1 ? 'w-1/3' : step === 2 ? 'w-2/3' : 'w-full'}`}></div>
                </div>

                {/* Content */}
                <div className="flex-1 p-6 overflow-y-auto">
                    {step === 1 && renderCustomerStep()}
                    {step === 2 && renderServicesStep()}
                    {step === 3 && renderPaymentStep()}
                    {step === 4 && renderSuccessStep()}
                </div>

                {/* Footer Buttons */}
                {step < 4 && (
                    <div className="p-6 border-t bg-white flex justify-between">
                        {step > 1 ? (
                            <button
                                onClick={() => setStep(step - 1)}
                                className="px-6 py-3 rounded-xl font-bold text-gray-600 hover:bg-gray-100 transition-colors"
                            >
                                Atrás
                            </button>
                        ) : <div></div>}

                        {step < 3 ? (
                            <button
                                onClick={() => {
                                    if (step === 1 && (!customer.name || !customer.phone)) return alert('Llena los datos');
                                    setStep(step + 1);
                                }}
                                className="bg-washouse-blue text-white px-8 py-3 rounded-xl font-bold shadow-lg hover:bg-blue-700 transition-all flex items-center gap-2"
                            >
                                Siguiente <Check size={20} />
                            </button>
                        ) : (
                            <button
                                onClick={handleCreateOrder}
                                className="bg-green-600 text-white px-8 py-3 rounded-xl font-bold shadow-lg hover:bg-green-700 transition-all flex items-center gap-2"
                            >
                                <Check size={20} /> Crear Orden
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
