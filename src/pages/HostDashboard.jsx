import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import MachineCard from '../components/ui/MachineCard';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import NewOrderWizard from '../components/services/NewOrderWizard'; // Replaced NewOrderForm
import OrderDetailsModal from '../components/ui/OrderDetailsModal';
import InventoryModal from '../components/ui/InventoryModal';
import ExpenseModal from '../components/ui/ExpenseModal';
import ViewToggle from '../components/ui/ViewToggle';
import { SERVICES_CATALOG, PRODUCTS_CATALOG } from '../data/catalog';
import { Package, Wallet, Power, Store } from 'lucide-react';
import { useStorage } from '../context/StorageContext';
import { printTicket } from '../utils/printTicket';
import { motion } from 'framer-motion';

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1
        }
    }
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
};

export default function HostDashboard() {
    const { machines, updateMachine, addSale, updateInventoryStock, branches, deviceBranchId, addExpense } = useStorage();

    // Use device branch or fallback to main
    const currentBranch = deviceBranchId || 'main';
    const currentBranchName = branches.find(b => b.id === currentBranch)?.name || 'Sucursal Desconocida';

    const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    const [isInventoryModalOpen, setIsInventoryModalOpen] = useState(false);
    const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
    const [selectedMachineId, setSelectedMachineId] = useState(null);
    const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'compact'

    // Filter machines by branch
    const branchMachines = machines.filter(m => m.branchId === currentBranch);

    const { isShiftOpen } = useAuth(); // Consume shift status

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
            updateMachine(id, {
                status: 'available',
                timeLeft: 0,
                clientName: null,
                total: 0,
                items: null,
                startDate: null
            });
        }
    };

    const handleCreateOrder = (orderData) => {
        setIsOrderModalOpen(false);

        const itemsArray = Object.entries(orderData.items).map(([id, qty]) => {
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

        // Register Sale
        const newSale = addSale({
            ...orderData,
            items: itemsArray,
            machineId: selectedMachineId || 'counter',
            status: 'completed'
        }, currentBranch);

        // Deduct stock
        Object.entries(orderData.items).forEach(([itemId, qty]) => {
            updateInventoryStock(itemId, -qty, currentBranch);
        });

        // Print Ticket
        printTicket({ ...newSale, items: itemsArray });

        if (selectedMachineId) {
            const hasWash = orderData.items['wash_basic'] || orderData.items['duvet_s'] || orderData.items['duvet_l'];
            const time = hasWash ? 45 : 30;

            updateMachine(selectedMachineId, {
                status: 'running',
                timeLeft: time,
                clientName: orderData.customer.name,
                total: orderData.total,
                paymentMethod: orderData.paymentMethod,
                items: itemsArray,
                startDate: new Date().toISOString()
            });

            setSelectedMachineId(null);
        } else {
            alert(`✅ Orden Generada (Venta de Mostrador)\nCliente: ${orderData.customer.name}\nTotal: $${orderData.total}`);
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
        const updates = newStatus === 'available' ? {
            status: 'available',
            timeLeft: 0,
            clientName: null,
            total: 0,
            items: null,
            startDate: null
        } : { status: 'maintenance' };

        updateMachine(id, updates);
    };

    const selectedMachine = machines.find(m => m.id === selectedMachineId);

    const getNormalizedItems = (items) => {
        if (!items) return [];
        if (Array.isArray(items)) return items;
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
        id: `M-${selectedMachine.id}`,
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

    return (
        <motion.div
            className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
        >
            <div className="sticky top-[89px] z-30 -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8 py-4 mb-8 transition-all duration-300">
                <div className="glass-card p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 shadow-blue-500/5 border-white/60">
                    <motion.div variants={itemVariants} className="flex flex-col gap-1">
                        <h1 className="text-3xl font-black text-washouse-navy tracking-tight font-outfit">Panel de Control</h1>
                        <div className="flex items-center gap-3">
                            <div className="px-2 py-1 bg-blue-50 rounded-lg flex items-center gap-2 border border-blue-100/50">
                                <Store className="w-3.5 h-3.5 text-washouse-blue" />
                                <span className="text-[10px] font-bold text-white uppercase tracking-[0.3em] font-mono">Admin Control</span>
                                <span className="text-[10px] font-black uppercase tracking-widest text-washouse-blue">
                                    {currentBranchName}
                                </span>
                            </div>
                            <div className="w-1.5 h-1.5 rounded-full bg-gray-300" />
                            <span className="text-[10px] text-gray-400 font-black uppercase tracking-widest opacity-80">Vista General de Equipos</span>
                        </div>
                    </motion.div>

                    <motion.div variants={itemVariants} className="flex flex-wrap items-center gap-4 w-full md:w-auto">
                        <ViewToggle view={viewMode} onViewChange={setViewMode} />
                        <div className="hidden md:block h-10 w-px bg-gray-200/50 mx-1"></div>

                        <Button
                            variant="secondary"
                            onClick={() => setIsInventoryModalOpen(true)}
                            className="flex-1 md:flex-none justify-center rounded-xl bg-white/50 backdrop-blur-sm border-gray-100 hover:shadow-lg transition-all"
                        >
                            <Package className="w-4 h-4 mr-2" />
                            Inventario
                        </Button>
                        <Button
                            onClick={openCleanOrderModal}
                            className="flex-1 md:flex-none justify-center rounded-xl shadow-[0_8px_20px_rgba(0,144,215,0.2)] hover:shadow-[0_12px_25px_rgba(0,144,215,0.3)] transform transition-all active:scale-95"
                        >
                            Nueva Orden
                        </Button>
                    </motion.div>
                </div>
            </div>

            <motion.div
                className={`grid gap-8 ${viewMode === 'grid'
                    ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3'
                    : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
                    }`}
                variants={containerVariants}
            >
                {branchMachines.map((machine) => (
                    <motion.div key={machine.id} variants={itemVariants} layout className="h-full">
                        <MachineCard
                            {...machine}
                            variant={viewMode}
                            onAction={handleMachineAction}
                            onToggleMaintenance={handleToggleMaintenance}
                        />
                    </motion.div>
                ))}
            </motion.div>

            {/* Modals */}
            <NewOrderWizard
                isOpen={isOrderModalOpen}
                onClose={() => setIsOrderModalOpen(false)}
                machineId={selectedMachineId}
            />

            <Modal
                isOpen={isDetailsModalOpen}
                onClose={() => setIsDetailsModalOpen(false)}
                title={`Detalles: ${selectedMachine?.name}`}
            >
                <OrderDetailsModal
                    order={machineOrder}
                    onFinish={() => handleFinishCycle(selectedMachineId)}
                    onClose={() => setIsDetailsModalOpen(false)}
                />

                {selectedMachine?.status === 'running' && (
                    <div className="p-4 border-t flex justify-center bg-gray-50">
                        <Button
                            variant="danger"
                            onClick={() => handleFinishCycle(selectedMachine.id)}
                            className="w-full sm:w-auto"
                        >
                            <Power className="w-4 h-4 mr-2" /> Forzar Terminado
                        </Button>
                    </div>
                )}
            </Modal>

            <Modal
                isOpen={isInventoryModalOpen}
                onClose={() => setIsInventoryModalOpen(false)}
                title="Inventario de Productos"
            >
                <InventoryModal onClose={() => setIsInventoryModalOpen(false)} />
            </Modal>

        </motion.div>
    );
}
