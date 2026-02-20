import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { useStorage } from '../../context/StorageContext';
import { useAuth } from '../../context/AuthContext';
import { SERVICES_CATALOG } from '../../data/catalog';
import { X, Search, ShoppingBag, Truck, DollarSign, User, Phone, Check, Weight, Usb } from 'lucide-react';
import { formatCurrency } from '../../utils/formatCurrency';
import { useScale } from '../../hooks/useScale';

export default function NewOrderWizard({ isOpen, onClose, machineId }) {
    const { createOrder, deviceBranchId, branches, updateMachine, machines, inventory } = useStorage();
    const { user } = useAuth();
    const [step, setStep] = useState(1);
    const [selectedMachineId, setSelectedMachineId] = useState(machineId);
    const [createdOrder, setCreatedOrder] = useState(null);
    const containerRef = useRef(null);

    // Reset state when opening
    useEffect(() => {
        if (isOpen) {
            setStep(1);
            setCustomer({ name: '', phone: '' });
            setItems([]);
            setPayment({ advance: 0, method: 'cash' });
            setCreatedOrder(null);
            setSelectedMachineId(machineId);
        }
    }, [isOpen, machineId]);

    // Update payment when moving to payment step and auto-focus container
    useEffect(() => {
        if (step === 4) {
            setPayment(prev => ({ ...prev, advance: totals.total }));
        }
        // Ensure container has focus for keyboard navigation
        if (containerRef.current) {
            containerRef.current.focus();
        }
    }, [step]);

    // Scale Logic
    const { isSupported, isConnected, weight: scaleWeight, connect: connectScale, error: scaleError, simulateConnection } = useScale();

    // Form State
    const [customer, setCustomer] = useState({ name: '', phone: '' });
    const [items, setItems] = useState([]);
    const [payment, setPayment] = useState({ advance: 0, method: 'cash' });

    // Filter State
    const [selectedCategory, setSelectedCategory] = useState('all');

    const services = useMemo(() => SERVICES_CATALOG, []);
    const supplies = useMemo(() => {
        const branchIds = [deviceBranchId, 'main', ''].filter(Boolean);
        return (inventory || [])
            .filter(p => branchIds.includes(p.branchId))
            .map(p => ({
                ...p,
                category: 'products',
                type: 'unit'
            }));
    }, [inventory, deviceBranchId]);

    const filteredServices = useMemo(() => {
        if (selectedCategory === 'all') return services;
        return services.filter(item => item.category === selectedCategory);
    }, [selectedCategory, services]);

    // Logic Helpers
    const addToOrder = (service) => {
        setItems(prev => {
            const existing = prev.find(i => i.serviceId === service.id);

            // Capture current scale weight if connected and service is weight-based
            const initialQty = (service.type === 'weight' && isConnected && scaleWeight > 0)
                ? scaleWeight
                : (service.type === 'weight' ? service.baseKg : 1);

            if (existing) {
                if (service.type === 'unit') {
                    return prev.map(i => i.serviceId === service.id ? { ...i, quantity: i.quantity + 1 } : i);
                }
                // For weight services, if it already exists, maybe update weight? 
                // Or just keep first reading. Usually we'd want to update or add as separate item, 
                // but here we'll update to latest scale reading if connected.
                if (service.type === 'weight' && isConnected && scaleWeight > 0) {
                    return prev.map(i => i.serviceId === service.id ? { ...i, quantity: scaleWeight } : i);
                }
                return prev;
            }
            return [...prev, {
                serviceId: service.id,
                quantity: initialQty,
                basePrice: service.price,
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
            if (item.quantity <= item.baseKg) return item.basePrice;
            const extraKg = item.quantity - item.baseKg;
            return item.basePrice + (Math.ceil(extraKg) * item.extraPrice);
        }
        return item.basePrice * item.quantity;
    };

    const removeItem = (index) => {
        setItems(prev => prev.filter((_, i) => i !== index));
    };

    const totals = useMemo(() => {
        const subtotal = items.reduce((acc, item) => acc + calculateItemTotal(item), 0);
        return { subtotal, total: subtotal };
    }, [items]);

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            // Prevent default behavior (like form submission)
            e.preventDefault();

            if (step < 4) {
                if (step === 1 && (!customer.name || !customer.phone)) return alert('Llena los datos del cliente');
                if (step === 2 && items.length === 0) return alert('Selecciona al menos un servicio');
                setStep(prev => prev + 1);
            } else if (step === 4) {
                handleCreateOrder();
            }
        }
    };

    // Steps Rendering
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
                        className="w-full p-3 border rounded-xl text-lg focus:ring-2 ring-washouse-blue outline-none"
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
                        className="w-full p-3 border rounded-xl text-lg focus:ring-2 ring-washouse-blue outline-none"
                        placeholder="Ej. 811 123 4567"
                    />
                </div>
            </div>
        </div>
    );

    const renderSummaryRight = (emptyMsg = "Resumen de Orden") => (
        <div className="bg-gray-50 rounded-xl p-4 flex flex-col h-full overflow-hidden border border-gray-100">
            <h4 className="font-bold text-gray-600 mb-4 flex justify-between">
                <span>{emptyMsg}</span>
                {isConnected && <span className="text-xs font-normal text-green-600 flex items-center gap-1"><Weight size={12} /> Lectura Activa</span>}
            </h4>
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                {items.length === 0 && (
                    <div className="text-center text-gray-400 py-10">Agrega servicios o insumos del menú</div>
                )}
                {items.map((item, idx) => (
                    <div key={idx} className="bg-white p-2 rounded-lg shadow-sm flex items-center justify-between gap-2 animate-fadeIn border border-gray-100">
                        <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm truncate">{item.name}</div>
                            <div className="text-xs text-gray-500">
                                {item.type === 'unit' ? `${item.quantity} pzas` : `${item.quantity} kg`}
                            </div>
                        </div>
                        <div className="flex items-center gap-1">
                            <div className="flex items-center bg-gray-50 rounded-lg p-0.5">
                                <button onClick={() => updateQuantity(idx, item.quantity - 1)} className="w-6 h-6 flex items-center justify-center font-bold hover:bg-white rounded text-gray-600">-</button>
                                <span className="w-6 text-center font-bold text-sm text-gray-800">{item.quantity}</span>
                                <button onClick={() => updateQuantity(idx, item.quantity + 1)} className="w-6 h-6 flex items-center justify-center font-bold hover:bg-white rounded text-gray-600">+</button>
                            </div>
                            <div className="font-bold text-washouse-blue w-16 text-right text-sm">
                                {formatCurrency(calculateItemTotal(item))}
                            </div>
                        </div>
                        <button onClick={() => removeItem(idx)} className="text-red-400 hover:text-red-500 transition-colors"><X size={16} /></button>
                    </div>
                ))}
            </div>
        </div>
    );

    const renderServicesStep = () => (
        <div className="space-y-6 flex-1 min-h-0 flex flex-col">
            <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold flex items-center gap-2"><ShoppingBag /> Seleccionar Servicios</h3>
                <div className="flex items-center gap-2">
                    {isConnected && (
                        <span className="bg-green-100 text-green-700 font-mono text-lg font-bold px-3 py-1 rounded-md border border-green-200">
                            {scaleWeight.toFixed(2)} kg
                        </span>
                    )}
                    {isSupported && (
                        <button onClick={connectScale} disabled={isConnected} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium ${isConnected ? 'bg-blue-50 text-blue-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                            <Usb size={16} /> {isConnected ? 'Báscula Conectada' : 'Conectar Báscula'}
                        </button>
                    )}
                    {!isConnected && <button onClick={simulateConnection} className="text-xs text-blue-500 underline hover:text-blue-700">Demo</button>}
                </div>
            </div>

            <div className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-2 gap-6 overflow-hidden">
                <div className="flex flex-col h-full overflow-hidden">
                    <div className="md:col-span-2 bg-blue-50/50 p-2 rounded-xl mb-3 border border-blue-100 flex items-center justify-between">
                        <span className="text-xs text-gray-600 font-medium flex items-center gap-2"><Truck size={14} /> Máquina:</span>
                        <select
                            value={selectedMachineId || ''}
                            onChange={(e) => setSelectedMachineId(e.target.value)}
                            disabled={!!machineId}
                            className="bg-white border rounded px-2 py-1 text-xs font-bold outline-none ring-blue-500 focus:ring-2 border-none"
                        >
                            <option value="">-- Mostrador --</option>
                            {machines.filter(m => m.branchId === (deviceBranchId || 'main') && (m.status === 'available' || m.id === machineId)).map(m => (
                                <option key={m.id} value={m.id}>{m.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="flex gap-2 mb-2 overflow-x-auto pb-1 custom-scrollbar">
                        {[
                            { id: 'all', label: 'Todos', icon: '📋' },
                            { id: 'wash', label: 'Lavado', icon: '🧼' },
                            { id: 'self_service', label: 'Autoservicio', icon: '💨' },
                            { id: 'special', label: 'Especiales', icon: '✨' },
                            { id: 'iron', label: 'Planchado', icon: '♨️' },
                            { id: 'fixing', label: 'Compostura', icon: '🪡' }
                        ].map(cat => (
                            <button
                                key={cat.id}
                                onClick={() => setSelectedCategory(cat.id)}
                                className={`px-3 py-1.5 rounded-lg text-sm font-bold whitespace-nowrap transition-colors flex items-center gap-1 ${selectedCategory === cat.id ? 'bg-washouse-blue text-white shadow-md' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}
                            >
                                <span>{cat.icon}</span> {cat.label}
                            </button>
                        ))}
                    </div>

                    <div className="flex-1 overflow-y-auto grid grid-cols-2 gap-2 content-start pr-1 custom-scrollbar">
                        {filteredServices.map(item => (
                            <button
                                key={item.id}
                                onClick={() => addToOrder(item)}
                                className="w-full flex flex-col items-center justify-center p-2 border rounded-xl hover:bg-blue-50 hover:border-blue-200 transition-all text-center bg-white shadow-sm h-24"
                            >
                                <span className="text-2xl mb-1">{item.icon}</span>
                                <div className="leading-tight">
                                    <div className="font-bold text-gray-800 text-xs line-clamp-2">{item.name}</div>
                                    <div className="font-bold text-washouse-blue text-xs mt-1">{formatCurrency(item.price)}</div>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
                {renderSummaryRight()}
            </div>
        </div>
    );

    const renderSuppliesStep = () => (
        <div className="space-y-6 flex-1 min-h-0 flex flex-col">
            <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold flex items-center gap-2"><ShoppingBag /> Agregar Insumos (Opcional)</h3>
            </div>
            <div className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-2 gap-6 overflow-hidden">
                <div className="flex flex-col h-full overflow-hidden">
                    <div className="flex gap-2 mb-3">
                        <span className="px-3 py-1.5 rounded-lg text-sm font-bold bg-washouse-blue text-white shadow-md flex items-center gap-1">
                            <span>🧴</span> Menú de Insumos
                        </span>
                    </div>
                    <div className="flex-1 overflow-y-auto grid grid-cols-2 gap-2 content-start pr-1 custom-scrollbar">
                        {supplies.map(item => (
                            <button
                                key={item.id}
                                onClick={() => addToOrder(item)}
                                className="w-full flex flex-col items-center justify-center p-2 border rounded-xl hover:bg-blue-50 hover:border-blue-200 transition-all text-center bg-white shadow-sm h-24"
                            >
                                <span className="text-2xl mb-1">{item.icon}</span>
                                <div className="leading-tight">
                                    <div className="font-bold text-gray-800 text-xs line-clamp-2">{item.name}</div>
                                    <div className="font-bold text-washouse-blue text-xs mt-1">{formatCurrency(item.price)}</div>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
                {renderSummaryRight()}
            </div>
        </div>
    );

    const renderPaymentStep = () => (
        <div className="space-y-6">
            <h3 className="text-xl font-bold flex items-center gap-2"><DollarSign /> Confirmar y Pagar</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                    <div className="bg-gray-50 p-6 rounded-xl space-y-4 border border-gray-100 shadow-sm transition-all hover:bg-gray-100/50">
                        <h4 className="font-black text-gray-400 text-xs uppercase tracking-widest">Resumen de Totales</h4>
                        <div className="flex justify-between text-gray-600">
                            <span className="font-medium">Subtotal</span>
                            <span className="font-bold">{formatCurrency(totals.subtotal)}</span>
                        </div>
                        <div className="flex justify-between font-black text-3xl pt-4 border-t-2 border-white">
                            <span className="text-washouse-navy italic">TOTAL</span>
                            <span className="text-washouse-blue">{formatCurrency(totals.total)}</span>
                        </div>
                        <div className="flex justify-between text-sm font-black text-green-600 bg-green-50 p-3 rounded-xl border border-green-100">
                            <span className="uppercase tracking-tight">PAGO REQUERIDO (100%)</span>
                            <span>{formatCurrency(totals.total)}</span>
                        </div>
                    </div>
                </div>

                <div className="space-y-6 border-l pl-8">
                    <div>
                        <label className="block text-sm font-black text-gray-500 mb-2 uppercase tracking-wide">Monto Recibido</label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-3xl font-black italic">$</span>
                            <input
                                type="number"
                                value={payment.advance}
                                onChange={e => setPayment({ ...payment, advance: e.target.value })}
                                className="w-full pl-10 p-5 bg-white border-2 border-gray-100 rounded-3xl text-4xl font-black focus:ring-8 ring-washouse-blue/10 outline-none transition-all focus:border-washouse-blue placeholder-gray-200"
                                placeholder="0.00"
                            />
                        </div>
                        <div className="flex gap-2 mt-3">
                            <button
                                onClick={() => setPayment({ ...payment, advance: totals.total })}
                                className="flex-1 py-3 px-2 text-xs bg-washouse-blue text-white font-black rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-lg shadow-blue-500/20 uppercase tracking-wider"
                            >
                                Autocargar Total
                            </button>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-black text-gray-500 mb-2 uppercase tracking-wide">Método de Pago</label>
                        <div className="flex gap-3">
                            <button onClick={() => setPayment({ ...payment, method: 'cash' })} className={`flex-1 p-4 rounded-2xl border-2 font-black transition-all ${payment.method === 'cash' ? 'bg-green-50 border-green-500 text-green-700 ring-8 ring-green-100' : 'border-gray-100 hover:border-gray-300 text-gray-400'}`}>💵 Efectivo</button>
                            <button onClick={() => setPayment({ ...payment, method: 'card' })} className={`flex-1 p-4 rounded-2xl border-2 font-black transition-all ${payment.method === 'card' ? 'bg-blue-50 border-blue-500 text-blue-700 ring-8 ring-blue-100' : 'border-gray-100 hover:border-gray-300 text-gray-400'}`}>💳 Tarjeta</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    const handleCreateOrder = () => {
        if (!customer.name || !customer.phone) return alert('Datos de cliente incompletos');
        if (items.length === 0) return alert('Orden vacía');

        const advance = parseFloat(payment.advance);
        if (isNaN(advance) || advance < totals.total) {
            return alert(`Pago total requerido: ${formatCurrency(totals.total)}`);
        }

        const newOrder = createOrder({
            customerName: customer.name,
            customerPhone: customer.phone,
            items,
            serviceLevel: 'standard',
            totalAmount: totals.total,
            advancePayment: advance,
            balanceDue: Math.max(0, totals.total - advance),
            paymentMethod: payment.method,
            branchId: deviceBranchId,
            machineId: selectedMachineId
        }, user?.name || 'Host');

        if (selectedMachineId) {
            updateMachine(selectedMachineId, {
                status: 'running',
                timeLeft: 45,
                clientName: customer.name,
                total: totals.total,
                items: items,
                startDate: new Date().toISOString()
            });
        }
        setCreatedOrder(newOrder);
        setStep(5);
    };

    const renderSuccessStep = () => {
        if (!createdOrder) return null;
        const branchName = branches.find(b => b.id === deviceBranchId)?.name || 'Washouse';
        const waLink = `https://wa.me/52${createdOrder.customerPhone.replace(/\D/g, '')}?text=${encodeURIComponent(`Hola ${createdOrder.customerName}, tu orden *${createdOrder.id}* ha sido recibida en *${branchName}*. Pago Total: ${formatCurrency(createdOrder.totalAmount)}. ¡Gracias por tu preferencia!`)}`;

        return (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-6 animate-in zoom-in-95">
                <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center text-green-600 animate-bounce shadow-xl shadow-green-500/10">
                    <Check size={48} strokeWidth={3} />
                </div>
                <div>
                    <h3 className="text-3xl font-black text-gray-800 italic uppercase tracking-tighter">¡Operación Exitosa!</h3>
                    <p className="text-gray-400 font-mono mt-2 text-sm bg-gray-50 px-3 py-1 rounded-full border">Folio de Orden: <span className="text-gray-800 font-bold">{createdOrder.id}</span></p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-md">
                    <button onClick={() => import('../../utils/printServiceTicket').then(m => m.printServiceTicket(createdOrder))} className="flex flex-col items-center p-6 bg-white border-2 border-gray-100 rounded-[32px] hover:border-blue-500 hover:bg-blue-50 transition-all font-black text-gray-700 shadow-sm hover:shadow-xl"><ShoppingBag size={32} className="mb-2 text-blue-500" /> Imprimir Ticket</button>
                    <a href={waLink} target="_blank" rel="noreferrer" className="flex flex-col items-center p-6 bg-white border-2 border-gray-100 rounded-[32px] hover:border-green-500 hover:bg-green-50 transition-all font-black text-gray-700 shadow-sm hover:shadow-xl"><Phone size={32} className="mb-2 text-green-500" /> WhatsApp</a>
                </div>
                <button onClick={onClose} className="text-gray-400 hover:text-gray-800 underline text-sm font-medium">Volver al Tablero de Control</button>
            </div>
        );
    };

    if (!isOpen) return null;

    return (
        <div
            ref={containerRef}
            className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-2 backdrop-blur-xl outline-none"
            onKeyDown={handleKeyDown}
            tabIndex={-1}
        >
            <div className="bg-white w-full max-w-6xl h-[90vh] rounded-[48px] shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-500 border border-white/20">
                <div className="bg-gray-50/30 px-10 py-6 border-b flex justify-between items-center backdrop-blur-sm">
                    <h2 className="text-2xl font-black text-washouse-navy italic tracking-tighter leading-none">WASHOUSE SYSTEM <span className="text-blue-510 not-italic font-black text-xs ml-3 text-white bg-blue-500 px-3 py-1 rounded-full tracking-widest uppercase">Smart POS</span></h2>
                    <button onClick={onClose} className="p-3 hover:bg-red-50 hover:text-red-500 rounded-full transition-all bg-white border"><X size={24} /></button>
                </div>

                <div className="flex w-full h-2 bg-gray-100/50">
                    <div className="h-full bg-blue-500 transition-all duration-700 ease-out shadow-[0_0_20px_rgba(59,130,246,0.8)] rounded-r-full" style={{ width: `${(step / 5) * 100}%` }}></div>
                </div>

                <div className={`flex-1 p-10 ${(step === 2 || step === 3) ? 'overflow-hidden flex flex-col' : 'overflow-y-auto custom-scrollbar'}`}>
                    {step === 1 && renderCustomerStep()}
                    {step === 2 && renderServicesStep()}
                    {step === 3 && renderSuppliesStep()}
                    {step === 4 && renderPaymentStep()}
                    {step === 5 && renderSuccessStep()}
                </div>

                {step < 5 && (
                    <div className="p-10 border-t bg-gray-50/50 flex justify-between items-center backdrop-blur-sm">
                        <div>
                            {step > 1 ? (
                                <button onClick={() => setStep(step - 1)} className="px-10 py-5 rounded-3xl font-black text-gray-400 hover:bg-white hover:text-gray-800 transition-all border-2 border-transparent hover:border-gray-100 uppercase text-xs tracking-widest">Atrás</button>
                            ) : (
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
                                    <span className="text-[10px] text-gray-400 font-black uppercase tracking-widest italic">Paso {step} de 5</span>
                                </div>
                            )}
                        </div>
                        <div className="flex items-center gap-4">
                            {step < 4 ? (
                                <button
                                    onClick={() => {
                                        if (step === 1 && (!customer.name || !customer.phone)) return alert('Llena los datos del cliente');
                                        if (step === 2 && items.length === 0) return alert('Selecciona al menos un servicio');
                                        setStep(step + 1);
                                    }}
                                    className="bg-washouse-blue text-white px-12 py-5 rounded-3xl font-black shadow-2xl shadow-blue-500/40 hover:scale-105 active:scale-95 transition-all flex items-center gap-4 uppercase tracking-[0.2em] text-xs"
                                >
                                    Siguiente <Check size={20} />
                                </button>
                            ) : (
                                <button onClick={handleCreateOrder} className="bg-green-600 text-white px-12 py-5 rounded-3xl font-black shadow-2xl shadow-green-500/40 hover:scale-105 active:scale-95 transition-all flex items-center gap-4 uppercase tracking-[0.2em] text-xs">Registrar Orden <Check size={20} /></button>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
