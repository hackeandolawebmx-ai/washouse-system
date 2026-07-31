import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { useStorage } from '../../context/StorageContext';
import { useAuth } from '../../context/AuthContext';
import { SERVICES_CATALOG, PRODUCTS_CATALOG } from '../../data/catalog';
import { X, Search, ShoppingBag, Truck, DollarSign, User, Phone, Check, Weight, Usb, ArrowRight, ArrowLeft } from 'lucide-react';
import { formatCurrency } from '../../utils/formatCurrency';
import { useScale } from '../../hooks/useScale';
import { motion, AnimatePresence } from 'framer-motion';

export default function NewOrderWizard({ isOpen, onClose, machineId }) {
    const { executeOrder, deviceBranchId, branches, machines, inventory, services } = useStorage();
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

    // Filter & Search State
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');

    const supplies = useMemo(() => {
        const branchIds = [deviceBranchId, 'main', ''].filter(Boolean);
        const baseSupplies = (inventory || [])
            .filter(p => branchIds.includes(p.branchId))
            .map(p => ({
                ...p,
                category: 'products',
                type: 'unit'
            }));

        if (!searchQuery) return baseSupplies;
        return baseSupplies.filter(s =>
            s.name.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [inventory, deviceBranchId, searchQuery]);

    const filteredServices = useMemo(() => {
        let result = services;
        if (selectedCategory !== 'all') {
            result = result.filter(item => item.category === selectedCategory);
        }
        if (searchQuery) {
            result = result.filter(item =>
                item.name.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }
        return result;
    }, [selectedCategory, services, searchQuery]);

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
            let newItems = [...prev, {
                serviceId: service.id,
                quantity: initialQty,
                basePrice: service.price,
                name: service.name,
                type: service.type,
                baseKg: service.baseKg,
                extraPrice: service.extraPrice
            }];

            // Include free supplies for Lavado y Secado
            if (service.id === 'wash_dry') {
                const addIncludedSupply = (supplyId) => {
                    const supply = PRODUCTS_CATALOG.find(s => s.id === supplyId);
                    if (supply && !newItems.find(i => i.serviceId === supplyId)) {
                        newItems.push({
                            serviceId: supply.id,
                            quantity: 1,
                            basePrice: 0,
                            name: `${supply.name} (Inc.)`,
                            type: 'unit'
                        });
                    }
                };
                addIncludedSupply('detergent_liquid');
                addIncludedSupply('softener');
            }

            return newItems;
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
            const weight = item.quantity;

            // Rule: 6kg is a new charge ($50). Apply this logic for standard washer/dryer loads.
            if (item.serviceId === 'self_wash' || item.serviceId === 'wash_std') {
                const numLoads = Math.ceil(weight / 5.999) || 1;
                const avgWeightPerLoad = weight / numLoads;

                let total = numLoads * item.basePrice;
                if (avgWeightPerLoad > (item.baseKg || 5)) {
                    total += numLoads * (item.extraPrice || 10);
                }
                return total;
            }

            // Generic weight pricing for other items
            if (weight <= (item.baseKg || 5)) return item.basePrice;
            const extraKg = weight - (item.baseKg || 5);
            return item.basePrice + (Math.ceil(extraKg) * (item.extraPrice || 10));
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
        <div className="space-y-10 max-w-4xl mx-auto py-10">
            <div className="text-center space-y-3">
                <div className="w-20 h-20 bg-blue-50 rounded-3xl flex items-center justify-center mx-auto mb-6 text-washouse-blue shadow-inner">
                    <User size={40} />
                </div>
                <h3 className="text-4xl font-black text-washouse-navy uppercase tracking-tighter">Datos del Cliente</h3>
                <p className="text-gray-400 font-medium text-lg">Ingresa la información para personalizar el servicio</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                    <label className="block text-xs font-black text-gray-400 uppercase tracking-[0.3em] ml-2">Nombre Completo</label>
                    <div className="relative group">
                        <User className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-washouse-blue transition-colors" size={24} />
                        <input
                            type="text"
                            value={customer.name}
                            onChange={e => setCustomer({ ...customer, name: e.target.value })}
                            className="w-full pl-16 pr-8 py-6 bg-gray-50 border-2 border-transparent rounded-[32px] text-2xl font-bold focus:ring-12 ring-washouse-blue/5 outline-none transition-all focus:bg-white focus:border-washouse-blue placeholder-gray-200 shadow-sm"
                            placeholder="Ej. Juan Pérez"
                            autoFocus
                        />
                    </div>
                </div>
                <div className="space-y-3">
                    <label className="block text-xs font-black text-gray-400 uppercase tracking-[0.3em] ml-2">Teléfono (WhatsApp)</label>
                    <div className="relative group">
                        <Phone className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-washouse-blue transition-colors" size={24} />
                        <input
                            type="tel"
                            value={customer.phone}
                            onChange={e => setCustomer({ ...customer, phone: e.target.value })}
                            className="w-full pl-16 pr-8 py-6 bg-gray-50 border-2 border-transparent rounded-[32px] text-2xl font-bold focus:ring-12 ring-washouse-blue/5 outline-none transition-all focus:bg-white focus:border-washouse-blue placeholder-gray-200 shadow-sm"
                            placeholder="Ej. 811 123 4567"
                        />
                    </div>
                </div>
            </div>

            <div className="bg-blue-50/30 p-8 rounded-[40px] border border-blue-100/50 flex items-center justify-between gap-6">
                <div className="flex-1 space-y-1">
                    <h4 className="font-bold text-washouse-navy">¡Bienvenido de nuevo!</h4>
                    <p className="text-sm text-gray-500">Usamos el teléfono para enviarte el ticket digital por WhatsApp automáticamente.</p>
                </div>
                <div className="flex -space-x-4">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="w-12 h-12 rounded-full border-4 border-white bg-gray-200 overflow-hidden shadow-sm">
                            <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${i + 10}`} alt="avatar" />
                        </div>
                    ))}
                    <div className="w-12 h-12 rounded-full border-4 border-white bg-washouse-blue text-white flex items-center justify-center text-xs font-bold shadow-sm">+99</div>
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
        <div className="space-y-4 flex-1 min-h-0 flex flex-col h-full">
            <div className="flex justify-between items-end gap-4">
                <div className="flex-1">
                    <h3 className="text-lg font-bold flex items-center gap-2 mb-2"><ShoppingBag className="text-washouse-blue" size={20} /> Seleccionar Servicios</h3>
                    <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-washouse-blue transition-colors" size={18} />
                        <input
                            type="text"
                            placeholder="Buscar servicio... (ej. Lavado, Planchado)"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl focus:ring-4 ring-washouse-blue/10 outline-none transition-all focus:bg-white focus:border-washouse-blue text-base"
                        />
                    </div>
                </div>
                <div className="flex flex-col items-end gap-3 pb-1">
                    <div className="flex items-center gap-2">
                        {isConnected && (
                            <motion.span
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                className="bg-green-100 text-green-700 font-mono text-xl font-black px-4 py-2 rounded-xl border border-green-200 shadow-sm"
                            >
                                {scaleWeight.toFixed(2)} kg
                            </motion.span>
                        )}
                        {isSupported && (
                            <button onClick={connectScale} disabled={isConnected} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${isConnected ? 'bg-blue-50 text-blue-600 border border-blue-100' : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border border-transparent active:scale-95'}`}>
                                <Usb size={18} /> {isConnected ? 'Báscula Lista' : 'Conectar Báscula'}
                            </button>
                        )}
                        {!isConnected && <button onClick={simulateConnection} className="text-[10px] font-black uppercase tracking-widest text-blue-500 hover:text-blue-700 bg-blue-50 px-2 py-1 rounded">Demo</button>}
                    </div>
                </div>
            </div>

            <div className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 overflow-hidden">
                <div className="lg:col-span-2 flex flex-col h-full overflow-hidden">
                    <div className="flex items-center justify-between mb-3 gap-3">
                        <div className="flex gap-2 overflow-x-auto pb-1 custom-scrollbar flex-1">
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
                                    className={`px-3 py-1.5 rounded-lg text-xs font-black whitespace-nowrap transition-all flex items-center gap-1.5 ${selectedCategory === cat.id ? 'bg-washouse-blue text-white shadow-lg shadow-blue-500/30 scale-105' : 'bg-white text-gray-500 border border-gray-100 hover:bg-gray-50 hover:border-gray-200'}`}
                                >
                                    <span>{cat.icon}</span> {cat.label}
                                </button>
                            ))}
                        </div>
                        <div className="bg-blue-50/50 p-1.5 rounded-xl border border-blue-100 flex items-center gap-2 min-w-[180px]">
                            <Truck size={14} className="text-washouse-blue ml-2" />
                            <select
                                value={selectedMachineId || ''}
                                onChange={(e) => setSelectedMachineId(e.target.value)}
                                disabled={!!machineId}
                                className="bg-transparent text-xs font-black outline-none w-full cursor-pointer py-1"
                            >
                                <option value="">Mostrador</option>
                                {machines.filter(m => m.branchId === (deviceBranchId || 'main') && (m.status === 'available' || m.id === machineId)).map(m => (
                                    <option key={m.id} value={m.id}>{m.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto grid grid-cols-2 sm:grid-cols-3 gap-2 pb-2 content-start pr-1 custom-scrollbar">
                        <AnimatePresence>
                            {filteredServices.map(item => (
                                <motion.button
                                    layout
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    key={item.id}
                                    onClick={() => addToOrder(item)}
                                    className="group relative flex items-center p-3 border border-gray-100 rounded-2xl hover:border-washouse-blue hover:bg-blue-50/30 transition-all text-left bg-white shadow-sm hover:shadow-md hover:-translate-x-0.5 h-auto gap-3"
                                >
                                    <span className="text-2xl group-hover:scale-110 transition-transform bg-gray-50/50 p-2 rounded-xl border border-gray-100/50">{item.icon}</span>
                                    <div className="leading-tight flex-1 min-w-0 pr-4">
                                        <div className="font-bold text-gray-800 text-xs truncate mb-0.5">{item.name}</div>
                                        <div className="font-black text-washouse-blue text-[13px]">{formatCurrency(item.price)}</div>
                                    </div>
                                    <div className="absolute right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <div className="bg-washouse-blue text-white p-1 rounded-full"><ArrowRight size={10} /></div>
                                    </div>
                                </motion.button>
                            ))}
                        </AnimatePresence>
                        {filteredServices.length === 0 && (
                            <div className="col-span-full py-20 text-center space-y-3">
                                <div className="text-4xl">🔍</div>
                                <div className="text-gray-400 font-medium">No se encontraron servicios que coincidan con "{searchQuery}"</div>
                                <button onClick={() => { setSearchQuery(''); setSelectedCategory('all'); }} className="text-washouse-blue font-bold text-sm underline">Ver todos los servicios</button>
                            </div>
                        )}
                    </div>
                </div>
                <div className="hidden md:block h-full overflow-hidden">
                    {renderSummaryRight()}
                </div>
            </div>
        </div>
    );

    const renderSuppliesStep = () => (
        <div className="space-y-6 flex-1 min-h-0 flex flex-col h-full">
            <div className="flex justify-between items-end gap-6">
                <div className="flex-1">
                    <h3 className="text-xl font-bold flex items-center gap-2 mb-4"><ShoppingBag className="text-washouse-blue" /> Agregar Insumos</h3>
                    <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-washouse-blue transition-colors" size={20} />
                        <input
                            type="text"
                            placeholder="Buscar insumo... (ej. Detergente, Suavizante)"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-4 ring-washouse-blue/10 outline-none transition-all focus:bg-white focus:border-washouse-blue text-lg"
                        />
                    </div>
                </div>
            </div>

            <div className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 overflow-hidden">
                <div className="lg:col-span-2 flex flex-col h-full overflow-hidden">
                    <div className="flex gap-2 mb-4">
                        <span className="px-4 py-2 rounded-xl text-xs font-black bg-washouse-blue text-white shadow-lg shadow-blue-500/30 flex items-center gap-2">
                            <span>🧴</span> Menú de Insumos
                        </span>
                    </div>
                    <div className="flex-1 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 content-start pr-1 custom-scrollbar">
                        <AnimatePresence>
                            {supplies.map(item => (
                                <motion.button
                                    layout
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    key={item.id}
                                    onClick={() => addToOrder(item)}
                                    className="group relative flex items-center p-3 border border-gray-100 rounded-2xl hover:border-washouse-blue hover:bg-blue-50/30 transition-all text-left bg-white shadow-sm hover:shadow-md hover:-translate-x-0.5 h-auto gap-3"
                                >
                                    <span className="text-2xl group-hover:scale-110 transition-transform bg-gray-50/50 p-2 rounded-xl border border-gray-100/50">{item.icon}</span>
                                    <div className="leading-tight flex-1 min-w-0 pr-4">
                                        <div className="font-bold text-gray-800 text-xs truncate mb-0.5">{item.name}</div>
                                        <div className="font-black text-washouse-blue text-[13px]">{formatCurrency(item.price)}</div>
                                    </div>
                                    <div className="absolute right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <div className="bg-washouse-blue text-white p-1 rounded-full"><ArrowRight size={10} /></div>
                                    </div>
                                </motion.button>
                            ))}
                        </AnimatePresence>
                        {supplies.length === 0 && (
                            <div className="col-span-full py-20 text-center space-y-3">
                                <div className="text-4xl">📦</div>
                                <div className="text-gray-400 font-medium">No se encontraron insumos que coincidan con "{searchQuery}"</div>
                                <button onClick={() => setSearchQuery('')} className="text-washouse-blue font-bold text-sm underline">Ver todos los productos</button>
                            </div>
                        )}
                    </div>
                </div>
                <div className="hidden md:block h-full overflow-hidden">
                    {renderSummaryRight()}
                </div>
            </div>
        </div>
    );

    const renderPaymentStep = () => (
        <div className="space-y-6 max-w-4xl mx-auto py-2 h-full flex flex-col justify-center">
            <div className="text-center space-y-1">
                <h3 className="text-2xl font-black flex items-center justify-center gap-2 uppercase tracking-tighter"><DollarSign size={28} className="text-washouse-blue" /> Pago y Confirmación</h3>
                <p className="text-gray-400 font-medium text-sm">Revisa los detalles finales antes de procesar la orden</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="space-y-4"
                >
                    <div className="bg-gray-50/50 p-6 rounded-[32px] space-y-4 border border-gray-100 shadow-sm relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-washouse-blue/5 rounded-full -mr-12 -mt-12 transition-transform group-hover:scale-110" />
                        <h4 className="font-black text-gray-400 text-[10px] uppercase tracking-[0.3em] mb-1">Resumen Total</h4>
                        <div className="space-y-2 relative z-10">
                            <div className="flex justify-between text-gray-500 text-sm font-medium">
                                <span>Subtotal</span>
                                <span>{formatCurrency(totals.subtotal)}</span>
                            </div>
                            <div className="flex justify-between text-gray-500 text-sm font-medium">
                                <span>Impuestos</span>
                                <span className="text-[9px] bg-gray-200 px-2 py-0.5 rounded text-gray-600">INCLUIDO</span>
                            </div>
                            <div className="h-px bg-gray-200/50 my-4" />
                            <div className="flex justify-between items-end">
                                <span className="font-black text-washouse-navy text-lg leading-none">TOTAL A PAGAR</span>
                                <span className="text-4xl font-black text-washouse-blue tracking-tighter leading-none">{formatCurrency(totals.total)}</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 p-4 bg-blue-50/50 rounded-2xl border border-blue-100/50">
                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-washouse-blue shadow-sm shrink-0">
                            <Check size={20} />
                        </div>
                        <div>
                            <div className="text-[10px] font-black text-washouse-blue uppercase tracking-widest">Pago Requerido</div>
                            <div className="text-sm font-bold text-washouse-navy">
                                {selectedMachineId ? 'Se requiere el 100% para habilitar el equipo' : 'Se requiere al menos 50% de anticipo'}
                            </div>
                        </div>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="space-y-6 pl-4 md:border-l-2 md:border-dashed md:border-gray-100"
                >
                    <div className="space-y-2">
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">Monto Recibido</label>
                        <div className="relative group">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 text-3xl font-black transition-colors group-focus-within:text-washouse-blue">$</span>
                            <input
                                type="number"
                                value={payment.advance}
                                onChange={e => setPayment({ ...payment, advance: e.target.value })}
                                className="w-full pl-10 px-4 py-4 bg-gray-50 border-2 border-transparent rounded-[24px] text-4xl font-black focus:ring-8 ring-washouse-blue/5 outline-none transition-all focus:bg-white focus:border-washouse-blue placeholder-gray-200"
                                placeholder="0.00"
                                autoFocus
                            />
                        </div>
                        <div className="flex gap-2 mt-3">
                            {!selectedMachineId && (
                                <button
                                    onClick={() => setPayment({ ...payment, advance: totals.total / 2 })}
                                    className="flex-1 py-3 bg-blue-50 text-blue-500 font-black rounded-xl hover:bg-blue-100 transition-all uppercase text-[9px] tracking-widest border border-blue-100"
                                >
                                    Anticipo 50%
                                </button>
                            )}
                            <button
                                onClick={() => setPayment({ ...payment, advance: totals.total })}
                                className="flex-1 py-3 bg-washouse-blue/10 text-washouse-blue font-black rounded-xl hover:bg-washouse-blue hover:text-white transition-all uppercase text-[9px] tracking-widest"
                            >
                                Total 100%
                            </button>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">Método de Pago</label>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setPayment({ ...payment, method: 'cash' })}
                                className={`flex-1 p-4 rounded-2xl border-2 flex flex-col items-center gap-1.5 transition-all ${payment.method === 'cash' ? 'bg-green-50 border-green-500 text-green-700 ring-4 ring-green-100 shadow-md' : 'bg-white border-gray-100 hover:border-gray-300 text-gray-400'}`}
                            >
                                <span className="text-xl">💵</span>
                                <span className="font-black text-[10px] uppercase tracking-widest">Efectivo</span>
                            </button>
                            <button
                                onClick={() => setPayment({ ...payment, method: 'card' })}
                                className={`flex-1 p-4 rounded-2xl border-2 flex flex-col items-center gap-1.5 transition-all ${payment.method === 'card' ? 'bg-blue-50 border-blue-500 text-blue-700 ring-4 ring-blue-100 shadow-md' : 'bg-white border-gray-100 hover:border-gray-300 text-gray-400'}`}
                            >
                                <span className="text-xl">💳</span>
                                <span className="font-black text-[10px] uppercase tracking-widest">Tarjeta</span>
                            </button>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );

    const handleCreateOrder = async () => {
        if (!customer.name || !customer.phone) return alert('Datos de cliente incompletos');
        if (items.length === 0) return alert('Orden vacía');

        const advance = parseFloat(payment.advance);
        const minAdvance = selectedMachineId ? totals.total : (totals.total * 0.5);

        if (isNaN(advance) || advance < minAdvance) {
            return alert(`El pago mínimo requerido es de ${formatCurrency(minAdvance)}`);
        }

        const newOrder = await executeOrder({
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

        setCreatedOrder(newOrder);
        setStep(5);
    };

    const renderSuccessStep = () => {
        if (!createdOrder) return null;
        const branchName = branches.find(b => b.id === deviceBranchId)?.name || 'Washouse';
        const waLink = `https://wa.me/52${createdOrder.customerPhone.replace(/\D/g, '')}?text=${encodeURIComponent(`Hola ${createdOrder.customerName}, tu orden *${createdOrder.id}* ha sido recibida en *${branchName}*. Pago Total: ${formatCurrency(createdOrder.totalAmount)}. ¡Gracias por tu preferencia!`)}`;

        return (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-8 py-10">
                <motion.div
                    initial={{ scale: 0, rotate: -45 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: 'spring', damping: 10, stiffness: 100 }}
                    className="w-32 h-32 bg-linear-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center text-white shadow-2xl shadow-green-500/30"
                >
                    <Check size={64} strokeWidth={4} />
                </motion.div>

                <div className="space-y-4">
                    <motion.h3
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        delay={0.2}
                        className="text-5xl font-black text-washouse-navy uppercase tracking-tighter"
                    >
                        ¡ORDEN REGISTRADA!
                    </motion.h3>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        delay={0.4}
                        className="inline-flex items-center gap-3 bg-gray-50 px-6 py-2 rounded-full border border-gray-100"
                    >
                        <span className="text-gray-400 font-black text-xs uppercase tracking-widest">Folio de Orden</span>
                        <span className="text-washouse-blue font-black text-xl">{createdOrder.id}</span>
                    </motion.div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-2xl px-6">
                    <motion.button
                        whileHover={{ y: -5 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => import('../../utils/printServiceTicket').then(m => m.printServiceTicket(createdOrder))}
                        className="flex items-center gap-6 p-8 bg-white border-2 border-gray-50 rounded-[40px] hover:border-washouse-blue hover:bg-blue-50/30 transition-all font-black text-gray-700 shadow-xl shadow-gray-200/50"
                    >
                        <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center text-washouse-blue">
                            <ShoppingBag size={32} />
                        </div>
                        <div className="text-left">
                            <div className="text-xs text-gray-400 uppercase tracking-widest">Ticket Físico</div>
                            <div className="text-lg">Imprimir Recibo</div>
                        </div>
                    </motion.button>

                    <motion.a
                        whileHover={{ y: -5 }}
                        whileTap={{ scale: 0.95 }}
                        href={waLink}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-6 p-8 bg-white border-2 border-gray-50 rounded-[40px] hover:border-green-500 hover:bg-green-50/30 transition-all font-black text-gray-700 shadow-xl shadow-gray-200/50"
                    >
                        <div className="w-14 h-14 bg-green-100 rounded-2xl flex items-center justify-center text-green-600">
                            <Phone size={32} />
                        </div>
                        <div className="text-left">
                            <div className="text-xs text-gray-400 uppercase tracking-widest">Confirmación</div>
                            <div className="text-lg">Enviar WhatsApp</div>
                        </div>
                    </motion.a>
                </div>

                <button onClick={onClose} className="text-gray-400 hover:text-washouse-blue underline text-sm font-black uppercase tracking-widest transition-colors">Volver al Tablero</button>
            </div>
        );
    };

    if (!isOpen) return null;

    const stepVariants = {
        hidden: { opacity: 0, x: 20 },
        visible: { opacity: 1, x: 0 },
        exit: { opacity: 0, x: -20 }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    ref={containerRef}
                    className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4 backdrop-blur-md outline-none"
                    onKeyDown={handleKeyDown}
                    tabIndex={-1}
                >
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 20 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        className="bg-white/90 w-full max-w-[98vw] h-[96vh] rounded-[48px] shadow-2xl flex flex-col overflow-hidden border border-white/40 glass-card"
                    >
                        <div className="px-10 py-6 border-b flex justify-between items-center bg-white/50 backdrop-blur-sm">
                            <div className="flex flex-col">
                                <h2 className="text-2xl font-black text-washouse-navy tracking-tighter leading-none flex items-center gap-3">
                                    WASHOUSE <span className="text-washouse-blue">SYSTEM</span>
                                    <span className="text-[10px] bg-washouse-blue text-white px-3 py-1 rounded-full tracking-[0.2em] font-black uppercase">Smart POS v2</span>
                                </h2>
                            </div>
                            <button onClick={onClose} className="p-3 hover:bg-red-50 hover:text-red-500 rounded-full transition-all bg-white shadow-sm border border-gray-100 group">
                                <X size={24} className="group-hover:rotate-90 transition-transform duration-300" />
                            </button>
                        </div>

                        <div className="flex w-full h-1.5 bg-gray-100/50 relative overflow-hidden">
                            <motion.div
                                className="h-full bg-linear-to-r from-washouse-blue to-washouse-aqua shadow-[0_0_15px_rgba(0,144,215,0.5)] rounded-r-full"
                                initial={{ width: 0 }}
                                animate={{ width: `${(step / 5) * 100}%` }}
                                transition={{ type: 'spring', damping: 20, stiffness: 100 }}
                            />
                        </div>

                        <div className={`flex-1 p-10 ${(step === 2 || step === 3) ? 'overflow-hidden flex flex-col' : 'overflow-y-auto custom-scrollbar'}`}>
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={step}
                                    variants={stepVariants}
                                    initial="hidden"
                                    animate="visible"
                                    exit="exit"
                                    transition={{ duration: 0.3 }}
                                    className="h-full"
                                >
                                    {step === 1 && renderCustomerStep()}
                                    {step === 2 && renderServicesStep()}
                                    {step === 3 && renderSuppliesStep()}
                                    {step === 4 && renderPaymentStep()}
                                    {step === 5 && renderSuccessStep()}
                                </motion.div>
                            </AnimatePresence>
                        </div>

                        {step < 5 && (
                            <div className="px-8 py-5 border-t bg-white/50 flex justify-between items-center backdrop-blur-sm">
                                <div>
                                    {step > 1 ? (
                                        <button
                                            onClick={() => setStep(step - 1)}
                                            className="px-8 py-3.5 rounded-2xl font-black text-gray-400 hover:bg-white hover:text-gray-800 transition-all border-2 border-transparent hover:border-gray-100 uppercase text-xs tracking-widest flex items-center gap-2 group"
                                        >
                                            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> Atrás
                                        </button>
                                    ) : (
                                        <div className="flex items-center gap-3">
                                            <div className="flex gap-1.5">
                                                {[1, 2, 3, 4, 5].map(s => (
                                                    <div key={s} className={`w-2 h-2 rounded-full transition-all duration-300 ${s <= step ? 'bg-washouse-blue w-6' : 'bg-gray-200'}`} />
                                                ))}
                                            </div>
                                            <span className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Paso {step} de 5</span>
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
                                            className="bg-washouse-blue text-white px-10 py-3.5 rounded-2xl font-black shadow-xl shadow-blue-500/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-4 uppercase tracking-[0.2em] text-xs relative overflow-hidden group"
                                        >
                                            <span className="relative z-10 flex items-center gap-3">
                                                Siguiente <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                                            </span>
                                            <div className="absolute inset-0 bg-linear-to-r from-white/0 via-white/20 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                                        </button>
                                    ) : (
                                        <button
                                            onClick={handleCreateOrder}
                                            className="bg-green-600 text-white px-10 py-3.5 rounded-2xl font-black shadow-xl shadow-green-500/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-4 uppercase tracking-[0.2em] text-xs group"
                                        >
                                            Registrar Orden <Check size={20} className="group-hover:scale-125 transition-transform" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
