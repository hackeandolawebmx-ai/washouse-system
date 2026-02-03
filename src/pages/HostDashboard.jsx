import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import MachineCard from '../components/ui/MachineCard';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import NewOrderForm from '../components/NewOrderForm';
import OrderDetailsModal from '../components/ui/OrderDetailsModal';
import InventoryModal from '../components/ui/InventoryModal';
import ExpenseModal from '../components/ui/ExpenseModal'; // Added
import ViewToggle from '../components/ui/ViewToggle';
import { SERVICES_CATALOG, PRODUCTS_CATALOG } from '../data/catalog';
import { Package, Wallet, Power } from 'lucide-react'; // Added Wallet, Power
import { useStorage } from '../context/StorageContext';
import { printTicket } from '../utils/printTicket';

export default function HostDashboard() {
    const { machines, updateMachine, addSale, updateInventoryStock, branches, deviceBranchId, addExpense } = useStorage();

    // Use device branch or fallback to main (though it should be set)
    const currentBranch = deviceBranchId || 'main';
    const currentBranchName = branches.find(b => b.id === currentBranch)?.name || 'Sucursal Desconocida';

    const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    const [isInventoryModalOpen, setIsInventoryModalOpen] = useState(false);
    const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false); // Added
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

        // Transform items object to Array for storage/display consistency
        const itemsArray = Object.entries(orderData.items).map(([id, qty]) => {
            // Find in catalogs to get name/price
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
            items: itemsArray, // Searchable/Reportable
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
            const time = hasWash ? 45 : 30; // Simplified timing logic

            updateMachine(selectedMachineId, {
                status: 'running',
                timeLeft: time,
                clientName: orderData.customer.name,
                total: orderData.total,
                paymentMethod: orderData.paymentMethod,
                items: itemsArray, // Save as Array
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

    const selectedMachine = machines.find(m => m.id === selectedMachineId);

    // Helper to normalize items (Legacy Object -> Array)
    const getNormalizedItems = (items) => {
        if (!items) return [];
        if (Array.isArray(items)) return items;

        // Convert Object { id: qty } to Array [ { id, quantity, ... } ]
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

    // Map Machine State to Order Structure for Modal
    const machineOrder = selectedMachine ? {
        id: `M-${selectedMachine.id}`,
        createdAt: selectedMachine.startDate, // Map startDate to createdAt
        customerName: selectedMachine.clientName || 'Cliente Anónimo',
        customerPhone: '', // Not stored in machine currently
        status: selectedMachine.status === 'running' ? 'WASHING' : 'COMPLETED', // Map status
        items: getNormalizedItems(selectedMachine.items), // Normalize items
        totalAmount: selectedMachine.total,
        advancePayment: selectedMachine.total, // Machines are usually paid upfront
        balanceDue: 0,
        branchId: selectedMachine.branchId
    } : null;

    const handleSaveExpense = (data) => {
        const { user } = useAuth();

        addExpense({
            ...data,
            branchId: currentBranch,
            shiftId: JSON.parse(localStorage.getItem('washouse_active_shift'))?.id
        }, user?.name || 'Host');
        alert('Gasto registrado exitosamente');
    };

    return (
        <div className="max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-washouse-navy">Panel de Control</h2>
                    <div className="flex items-center gap-2 text-gray-500">
                        <span>Sucursal:</span>
                        <span className="font-medium text-washouse-blue bg-blue-50 px-2 py-0.5 rounded">
                            {currentBranchName}
                        </span>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <ViewToggle view={viewMode} onViewChange={setViewMode} />
                    <div className="h-8 w-px bg-gray-200 mx-1"></div>

                    <Button variant="secondary" onClick={() => setIsInventoryModalOpen(true)}>
                        <Package className="w-5 h-5 mr-2" />
                        Inventario
                    </Button>
                    <Button onClick={openCleanOrderModal}>
                        Nueva Orden
                    </Button>
                </div>
            </div>

            <div className={`grid gap-4 ${viewMode === 'grid'
                ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3'
                : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
                }`}>
                {branchMachines.map((machine) => (
                    <MachineCard
                        key={machine.id}
                        {...machine}
                        variant={viewMode}
                        onAction={handleMachineAction}
                    />
                ))}
            </div>

            {/* New Order Modal */}
            <Modal
                isOpen={isOrderModalOpen}
                onClose={() => setIsOrderModalOpen(false)}
                title={selectedMachineId ? `Iniciar Máquina #${selectedMachineId}` : "Crear Nueva Orden"}
            >
                <NewOrderForm
                    onSubmit={handleCreateOrder}
                    onCancel={() => setIsOrderModalOpen(false)}
                />
            </Modal>

            {/* Order Details Modal */}
            <Modal
                isOpen={isDetailsModalOpen}
                onClose={() => setIsDetailsModalOpen(false)}
                title={`Detalles: ${selectedMachine?.name}`}
            >
                <OrderDetailsModal
                    order={machineOrder} // Pass mapped object
                    onFinish={() => handleFinishCycle(selectedMachineId)} // Pass ID
                    onClose={() => setIsDetailsModalOpen(false)}
                />

                {/* Quick Finish Button for Machines */}
                {selectedMachine?.status === 'running' && (
                    <div className="p-4 border-t flex justify-center">
                        <Button
                            variant="danger"
                            onClick={() => handleFinishCycle(selectedMachine.id)}
                        >
                            <Power className="w-4 h-4 mr-2" /> Forzar Terminado
                        </Button>
                    </div>
                )}
            </Modal>

            {/* Inventory Modal */}
            <Modal
                isOpen={isInventoryModalOpen}
                onClose={() => setIsInventoryModalOpen(false)}
                title="Inventario de Productos"
            >
                <InventoryModal onClose={() => setIsInventoryModalOpen(false)} />
            </Modal>
        </div>
    );
}
