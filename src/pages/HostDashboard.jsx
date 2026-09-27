import { useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import MachineCard from '../components/ui/MachineCard';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import NewOrderWizard from '../components/services/NewOrderWizard'; // Replaced NewOrderForm
import OrderDetailsModal from '../components/ui/OrderDetailsModal';
import InventoryModal from '../components/ui/InventoryModal';
import ExpenseModal from '../components/ui/ExpenseModal';
import { PRODUCTS_CATALOG, SERVICES_CATALOG } from '../data/catalog';
import { Package, Wallet, Power, Plus, Droplets, Wind } from 'lucide-react';
import { useStorage } from '../context/StorageContext';

import { USUARIO_MOSTRADOR } from '../utils/labels';
// Filtros de estado. Además de filtrar, muestran cuántas máquinas hay en cada
// estado: el resumen que el mostrador necesita de un vistazo.
const STATUS_FILTERS = [
    { id: 'all', label: 'Todas' },
    { id: 'running', label: 'En uso', dot: 'bg-washouse-blue' },
    { id: 'finished', label: 'Terminado', dot: 'bg-orange-500' },
    { id: 'available', label: 'Disponible', dot: 'bg-emerald-500' },
    { id: 'maintenance', label: 'Mantenimiento', dot: 'bg-slate-400' }
];

// Un carril por tipo, en el orden del proceso: se lava y luego se seca.
const LANES = [
    { type: 'lavadora', title: 'Lavadoras', icon: Droplets },
    { type: 'secadora', title: 'Secadoras', icon: Wind }
];

const machineNumber = (m) => parseInt(m.name?.match(/\d+/)?.[0] || '0', 10);

// Estado de un equipo libre. Incluye los campos de la cola de secado para que
// un equipo liberado no arrastre un secado pendiente ni el aviso de "pasar
// ropa a…" del ciclo anterior.
const CLEARED_MACHINE = {
    status: 'available',
    timeLeft: 0,
    clientName: null,
    total: 0,
    items: null,
    startDate: null,
    orderId: null,
    pendingDry: null,
    movedToDryer: null,
    fromWasherName: null
};

export default function HostDashboard() {
    const { machines, updateMachine, deviceBranchId, addExpense } = useStorage();

    // Use device branch or fallback to main
    const currentBranch = deviceBranchId || 'main';

    const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    const [isInventoryModalOpen, setIsInventoryModalOpen] = useState(false);
    const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
    const [selectedMachineId, setSelectedMachineId] = useState(null);
    const [statusFilter, setStatusFilter] = useState('all');

    // Orden FIJO por número dentro de cada carril. Antes se reordenaban por
    // estado (en uso primero, libres al final): en pantalla táctil eso mueve
    // las tarjetas bajo el dedo cada vez que cambia un estado y provoca tocar
    // la máquina equivocada. El color ya dice cuál necesita atención, y la
    // posición coincide con el piso físico.
    const branchMachines = useMemo(
        () => machines
            .filter(m => m.branchId === currentBranch)
            .slice()
            .sort((a, b) => machineNumber(a) - machineNumber(b)),
        [machines, currentBranch]
    );

    const counts = useMemo(() => {
        const c = { all: branchMachines.length };
        branchMachines.forEach(m => { c[m.status] = (c[m.status] || 0) + 1; });
        return c;
    }, [branchMachines]);

    const { isShiftOpen, user } = useAuth();

    const handleMachineAction = (id) => {
        if (!isShiftOpen) {
            alert('Debes iniciar turno para operar las máquinas');
            return;
        }

        const machine = machines.find(m => m.id === id);
        if (!machine) return;

        if (machine.status === 'available') {
            setSelectedMachineId(id);
            setIsOrderModalOpen(true);
        } else if (machine.status === 'running') {
            setSelectedMachineId(id);
            setIsDetailsModalOpen(true);
        } else if (machine.status === 'finished') {
            // Una lavadora terminada con pendingDry todavía espera secadora
            // libre: si se libera ahora, el secado ya no arrancará solo.
            if (machine.pendingDry && !confirm(
                `La carga de ${machine.pendingDry.clientName || 'esta lavadora'} todavía espera una secadora libre. ` +
                'Si liberas la lavadora, el secado ya no arrancará solo. ¿Liberar de todos modos?'
            )) {
                return;
            }
            updateMachine(id, CLEARED_MACHINE);
        }
    };


    const handleFinishCycle = (id) => {
        updateMachine(id, { status: 'finished', timeLeft: 0 });
        setIsDetailsModalOpen(false);
        setSelectedMachineId(null);
    };

    const openCleanOrderModal = () => {
        if (!isShiftOpen) {
            alert('Debes iniciar turno para crear órdenes');
            return;
        }
        setSelectedMachineId(null);
        setIsOrderModalOpen(true);
    };

    const openExpenseModal = () => {
        if (!isShiftOpen) {
            alert('Debes iniciar turno para registrar gastos');
            return;
        }
        setIsExpenseModalOpen(true);
    };

    const handleSaveExpense = (expenseData) => {
        addExpense({ ...expenseData, branchId: currentBranch }, user?.name || USUARIO_MOSTRADOR);
    };

    const handleToggleMaintenance = (id) => {
        const machine = machines.find(m => m.id === id);
        if (!machine) return;

        // If running, warn user
        if (machine.status === 'running') {
            if (!confirm('⚠️ La máquina está en uso. ¿Seguro que deseas ponerla en mantenimiento? Esto no detendrá el temporizador.')) {
                return;
            }
        }

        const newStatus = machine.status === 'maintenance' ? 'available' : 'maintenance';

        // If coming back from maintenance, ensure it's clean
        const updates = newStatus === 'available' ? CLEARED_MACHINE : { status: 'maintenance' };

        updateMachine(id, updates);
    };

    const selectedMachine = machines.find(m => m.id === selectedMachineId);

    const getNormalizedItems = (items) => {
        if (!items) return [];
        if (Array.isArray(items)) {
            return items.map(item => ({
                ...item,
                price: item.price || item.basePrice || 0
            }));
        }
        return Object.entries(items).map(([id, qty]) => {
            const service = SERVICES_CATALOG.find(s => s.id === id);
            const product = PRODUCTS_CATALOG.find(p => p.id === id);
            const item = service || product;
            return {
                id,
                name: item ? item.name : id,
                price: item ? item.price : 0,
                quantity: qty,
                type: item ? item.type : 'unit'
            };
        });
    };

    const machineOrder = selectedMachine ? {
        id: selectedMachine.orderId || `M-${selectedMachine.id}`,
        createdAt: selectedMachine.startDate,
        customerName: selectedMachine.clientName || 'Cliente Anónimo',
        customerPhone: '',
        status: selectedMachine.status === 'running' ? 'WASHING' : 'COMPLETED',
        items: getNormalizedItems(selectedMachine.items),
        totalAmount: selectedMachine.total,
        advancePayment: selectedMachine.total,
        balanceDue: 0,
        branchId: selectedMachine.branchId
    } : null;

    const toolbarButton = 'h-10 px-4 rounded-xl text-sm font-bold flex items-center gap-2 transition-colors whitespace-nowrap';
    const secondaryButton = `${toolbarButton} border border-gray-200 bg-white text-slate-700 hover:border-washouse-blue/40 hover:text-washouse-blue`;

    return (
        <div className="pb-8">
            <h1 className="sr-only">Lavado asistido</h1>

            {/* Barra fija: resumen/filtro por estado y acciones del turno */}
            <div
                className="sticky z-30 -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8 py-3 bg-[#F8FAFC]/90 backdrop-blur-md border-b border-gray-100/80"
                style={{ top: 'var(--host-header-h, 0px)' }}
            >
                <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
                    <div role="group" aria-label="Filtrar máquinas por estado" className="flex gap-1.5 overflow-x-auto -mx-1 px-1 py-0.5">
                        {STATUS_FILTERS.map(f => {
                            const n = counts[f.id] || 0;
                            const active = statusFilter === f.id;
                            // "Terminado" con máquinas esperando se destaca aunque no
                            // esté seleccionado: es lo único que pide una acción.
                            const alerta = f.id === 'finished' && n > 0 && !active;
                            return (
                                <button
                                    key={f.id}
                                    onClick={() => setStatusFilter(f.id)}
                                    aria-pressed={active}
                                    className={`h-10 pl-3 pr-2 rounded-xl flex items-center gap-2 text-sm font-bold whitespace-nowrap transition-colors border
                                        ${active
                                            ? 'bg-white border-washouse-blue/30 text-washouse-blue shadow-sm'
                                            : alerta
                                                ? 'bg-orange-50 border-orange-200 text-orange-700'
                                                : 'bg-white/60 border-gray-200/70 text-gray-500 hover:text-gray-800 hover:bg-white'}`}
                                >
                                    {f.dot && <span className={`w-2 h-2 rounded-full ${f.dot}`} />}
                                    {f.label}
                                    <span className={`min-w-6 h-6 px-1.5 rounded-lg text-xs font-black flex items-center justify-center tabular-nums
                                        ${active ? 'bg-blue-50' : alerta ? 'bg-orange-100' : 'bg-gray-100'}`}>
                                        {n}
                                    </span>
                                </button>
                            );
                        })}
                    </div>

                    <div className="flex gap-2 ml-auto">
                        <button onClick={() => setIsInventoryModalOpen(true)} className={secondaryButton}>
                            <Package size={16} /> Inventario
                        </button>
                        <button onClick={openExpenseModal} className={secondaryButton}>
                            <Wallet size={16} /> Gasto
                        </button>
                        <button onClick={openCleanOrderModal} className={`${toolbarButton} bg-washouse-blue text-white hover:bg-washouse-primary-hover shadow-[0_6px_16px_rgba(0,144,215,0.25)]`}>
                            <Plus size={16} strokeWidth={3} /> Nueva Orden
                        </button>
                    </div>
                </div>
            </div>

            {branchMachines.length === 0 ? (
                <div className="mt-8 rounded-2xl border border-dashed border-gray-200 bg-white p-12 text-center">
                    <p className="font-black text-washouse-navy">No hay equipos para esta sucursal</p>
                    <p className="text-sm text-gray-500 mt-2 max-w-md mx-auto">
                        Si el encabezado dice "Sin vincular", este dispositivo apunta a otra sucursal:
                        se corrige en Admin → Configuración → Este Dispositivo.
                    </p>
                </div>
            ) : (
                // Carriles lado a lado desde 1024 px (Lavadoras → Secadoras, como
                // el piso y como fluye la ropa); apilados en tablet vertical y celular.
                <div className="grid lg:grid-cols-2 gap-x-8 gap-y-8 mt-5">
                    {LANES.map(({ type, title, icon }) => {
                        const Icon = icon;
                        const all = branchMachines.filter(m => m.type === type);
                        const shown = all.filter(m => statusFilter === 'all' || m.status === statusFilter);
                        const libres = all.filter(m => m.status === 'available').length;
                        if (all.length === 0) return null;
                        return (
                            <section key={type} aria-labelledby={`lane-${type}`} className="min-w-0">
                                <div className="flex items-center gap-3 mb-3">
                                    <h2 id={`lane-${type}`} className="flex items-center gap-2 text-sm font-black uppercase tracking-[0.2em] text-washouse-navy">
                                        <Icon size={16} className="text-washouse-blue" /> {title}
                                    </h2>
                                    <span className="text-xs font-bold text-gray-400 tabular-nums">
                                        {libres} de {all.length} libres
                                    </span>
                                </div>
                                {shown.length === 0 ? (
                                    <p className="rounded-2xl border border-dashed border-gray-200 px-4 py-6 text-sm text-gray-400 text-center">
                                        Ninguna con este filtro
                                    </p>
                                ) : (
                                    <div className="grid gap-3 sm:gap-4 grid-cols-[repeat(auto-fill,minmax(10rem,1fr))] sm:grid-cols-[repeat(auto-fill,minmax(13.5rem,1fr))] 2xl:grid-cols-[repeat(auto-fill,minmax(16rem,1fr))]">
                                        {shown.map(machine => (
                                            <MachineCard
                                                key={machine.id}
                                                {...machine}
                                                onAction={handleMachineAction}
                                                onToggleMaintenance={handleToggleMaintenance}
                                            />
                                        ))}
                                    </div>
                                )}
                            </section>
                        );
                    })}
                </div>
            )}

            {/* Modals */}
            <NewOrderWizard
                isOpen={isOrderModalOpen}
                onClose={() => setIsOrderModalOpen(false)}
                machineId={selectedMachineId}
            />

            <OrderDetailsModal
                isOpen={isDetailsModalOpen}
                onClose={() => setIsDetailsModalOpen(false)}
                order={machineOrder}
                extraActions={
                    selectedMachine?.status === 'running' ? (
                        <Button
                            variant="danger"
                            onClick={() => handleFinishCycle(selectedMachine.id)}
                            className="w-full h-full shadow-lg shadow-red-500/20"
                        >
                            <Power className="w-4 h-4 mr-2 inline-block shrink-0" /> Forzar Terminado
                        </Button>
                    ) : null
                }
            />

            <Modal
                isOpen={isInventoryModalOpen}
                onClose={() => setIsInventoryModalOpen(false)}
                title="Inventario de Productos"
            >
                <InventoryModal onClose={() => setIsInventoryModalOpen(false)} />
            </Modal>

            <ExpenseModal
                isOpen={isExpenseModalOpen}
                onClose={() => setIsExpenseModalOpen(false)}
                onSave={handleSaveExpense}
            />
        </div>
    );
}
